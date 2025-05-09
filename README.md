# To-Do Task App (Full-Stack Assessment)

A containerized to-do list app with a React/TypeScript SPA frontend, FastAPI backend, and PostgreSQL database.

## Technologies Used

- Frontend: React, TypeScript, Framer Motion
- Backend: FastAPI, SQLAlchemy, Alembic
- Testing: Jest (frontend unit), pytest (backend unit/integration), Playwright (E2E)
- Database: PostgreSQL (Docker), SQLite (test)
- Containerization: Docker, Docker Compose

## Prerequisites

- Docker & Docker Compose
- (Optional) Node.js & npm for local frontend
- (Optional) Python 3.11+ & virtualenv for local backend

## Running with Docker

1. Clone the repo:
   ```powershell
   git clone <repo-url>
   cd Assignment
   ```
2. Build and start all services:
   ```powershell
   docker-compose up --build
   ```
3. Open in browser:
   - Frontend (Docker): http://localhost:9001
   - API docs (Swagger UI): http://localhost:9000/docs

## Local Development

### Frontend

```powershell
cd Assignment
npm install
npm start
```
- UI available at http://localhost:3000
- API base URL: http://localhost:9000/tasks

### Backend

```powershell
cd Assignment\backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # PowerShell
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 9000
```
- API available at http://localhost:9000/tasks
- Swagger UI: http://localhost:9000/docs

## Testing

### Frontend
```powershell
npm test
```

### Backend
```powershell
pytest
```

### End-to-End (Playwright)
Ensure backend and frontend (docker or local) are running, then:
```powershell
npm run test:e2e
```

## API Endpoints

- GET `/tasks`  
  List up to 5 most recent uncompleted tasks.
- POST `/tasks`  
  Create task JSON: `{ "title": string, "description": string }`.
- PATCH `/tasks/{id}`  
  Mark task complete (404 if not found).

## Project Structure

```
/Assignment
├─ backend/            FastAPI app, models, migrations, tests
├─ src/                React app source
│  └─ components/      Button, Modal, TaskCard
├─ tests/              Playwright E2E scripts
├─ docker-compose.yml  Orchestrates DB, API, UI
├─ Dockerfile          Frontend Dockerfile
├─ backend/Dockerfile  Backend Dockerfile
└─ README.md
```

## License

MIT