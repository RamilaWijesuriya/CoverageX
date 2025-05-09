import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './components/Button';
import { TaskCard } from './components/TaskCard';
import { Modal } from './components/Modal';

interface Task { id: number; title: string; description: string; completed?: boolean; }

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError('Failed to fetch tasks from backend.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async () => {
    const title = newTitle.trim();
    const description = newDescription.trim();
    if (title && description) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description }),
        });
        if (!res.ok) {
          if (res.status === 422) {
            setError('Title and description cannot be empty.');
          } else {
            setError('Failed to add task.');
          }
          setLoading(false);
          return;
        }
        const created: Task = await res.json();
        setTasks(prev => [created, ...prev]);
        setModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setLoading(false);
        return;
      } catch (err) {
        setError('Failed to add task.');
      }
      setLoading(false);
    }
  };

  const removeTask = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to complete task');
      await fetchTasks();
    } catch (err) {
      setError('Failed to complete task.');
    }
    setLoading(false);
  };

  return (
    <><div className="app">
      <div className="header">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >To-Do List</motion.h1>
      </div>
      {error && <div className="error-message">{error}</div>}
      <AnimatePresence>
        <motion.ul
          className="task-list"
          initial=""
          animate=""
          exit=""
          layout
        >
          {tasks.map(task => (
            <TaskCard key={task.id} {...task} onDone={removeTask} />
          ))}
        </motion.ul>
      </AnimatePresence>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <motion.div className="modal-header" initial={{ x: -100 }} animate={{ x: 0 }}>
          <h2>New Task</h2>
        </motion.div>
        <div className="modal-body">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Title"
            className="modal-input"
          />
          <textarea
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder="Description"
            className="modal-textarea"
          />
        </div>
        <div className="modal-footer">
          <Button
            variant="primary"
            onClick={addTask}
            disabled={!newTitle.trim() || !newDescription.trim() || loading}
          >
            Create
          </Button>
        </div>
      </Modal>
      {loading && <div className="loading-overlay">Loading...</div>}
    </div><Button variant="fab" onClick={() => setModalOpen(true)} aria-label="Create Task">
        +
      </Button></>
  );
}