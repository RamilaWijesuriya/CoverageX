import os
# Ensure tests run against local SQLite database
os.environ['TEST_DATABASE_URL'] = 'sqlite:///./test.db'
import pytest
from fastapi.testclient import TestClient
from main import app, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use SQLite for local testing
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///./test.db")
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False} if TEST_DATABASE_URL.startswith("sqlite") else {})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def test_client():
    # Setup: create tables
    Base.metadata.create_all(bind=engine)
    client = TestClient(app)
    yield client
    # Teardown: drop tables
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(autouse=True)
def clear_db():
    # Clear tasks before each test
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())

def test_create_and_get_task(test_client):
    response = test_client.post("/tasks", json={"title": "Test task", "description": "Test desc"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test task"
    assert data["description"] == "Test desc"
    assert not data["completed"]

    response = test_client.get("/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert any(task["title"] == "Test task" for task in tasks)

def test_complete_task(test_client):
    response = test_client.post("/tasks", json={"title": "Complete me", "description": "desc"})
    task_id = response.json()["id"]
    response = test_client.patch(f"/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["completed"]
    response = test_client.get("/tasks")
    tasks = response.json()
    assert all(task["id"] != task_id for task in tasks)

def test_get_only_5_recent(test_client):
    # Clear all
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    for i in range(6):
        test_client.post("/tasks", json={"title": f"Task {i}", "description": "desc"})
    response = test_client.get("/tasks")
    tasks = response.json()
    assert len(tasks) == 5
    assert tasks[0]["title"] == "Task 5"
    assert tasks[-1]["title"] == "Task 1"

def test_404_on_complete_missing(test_client):
    response = test_client.patch("/tasks/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"

def test_create_task_missing_title(test_client):
    response = test_client.post("/tasks", json={"description": "desc only"})
    assert response.status_code == 422

def test_create_task_missing_description(test_client):
    response = test_client.post("/tasks", json={"title": "title only"})
    assert response.status_code == 422

def test_create_task_empty_fields(test_client):
    response = test_client.post("/tasks", json={"title": "", "description": ""})
    assert response.status_code == 422

def test_create_duplicate_tasks(test_client):
    test_client.post("/tasks", json={"title": "Dup", "description": "desc"})
    response = test_client.post("/tasks", json={"title": "Dup", "description": "desc"})
    assert response.status_code == 200  # Duplicates allowed by current logic

def test_long_title_and_description(test_client):
    long_title = "t" * 256
    long_desc = "d" * 1024
    response = test_client.post("/tasks", json={"title": long_title, "description": long_desc})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == long_title
    assert data["description"] == long_desc

def test_complete_already_completed_task(test_client):
    response = test_client.post("/tasks", json={"title": "done", "description": "desc"})
    task_id = response.json()["id"]
    test_client.patch(f"/tasks/{task_id}")
    response = test_client.patch(f"/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["completed"]

def test_get_tasks_empty(test_client):
    response = test_client.get("/tasks")
    assert response.status_code == 200
    assert response.json() == []

def test_create_and_complete_multiple_tasks(test_client):
    ids = []
    for i in range(3):
        response = test_client.post("/tasks", json={"title": f"T{i}", "description": "D"})
        ids.append(response.json()["id"])
    for task_id in ids:
        test_client.patch(f"/tasks/{task_id}")
    response = test_client.get("/tasks")
    assert response.status_code == 200
    assert response.json() == []

def test_patch_invalid_id_type(test_client):
    response = test_client.patch("/tasks/notanumber")
    assert response.status_code == 422

# Integration tests

def test_integration_create_and_fetch(test_client):
    response = test_client.post("/tasks", json={"title": "Integration", "description": "Test"})
    assert response.status_code == 200
    task_id = response.json()["id"]
    response = test_client.get("/tasks")
    assert any(task["id"] == task_id for task in response.json())

def test_integration_complete_and_fetch(test_client):
    response = test_client.post("/tasks", json={"title": "Integration2", "description": "Test2"})
    task_id = response.json()["id"]
    test_client.patch(f"/tasks/{task_id}")
    response = test_client.get("/tasks")
def test_integration_concurrent_creates(test_client):
    from concurrent.futures import ThreadPoolExecutor
    def create():
        return test_client.post("/tasks", json={"title": "Conc", "description": "D"})
    with ThreadPoolExecutor() as executor:
        results = list(executor.map(lambda _: create(), range(5)))
    assert all(r.status_code == 200 for r in results)

def test_integration_db_persistence(test_client):
    # Simulate DB restart by dropping and recreating tables
    Base.metadata.create_all(bind=engine)
    response = test_client.post("/tasks", json={"title": "Persist", "description": "DB"})
    assert response.status_code == 200
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    response = test_client.get("/tasks")
    assert response.json() == []

def test_integration_error_propagation(test_client):
    # Try to complete a task with invalid id
    response = test_client.patch("/tasks/invalid")
    assert response.status_code == 422