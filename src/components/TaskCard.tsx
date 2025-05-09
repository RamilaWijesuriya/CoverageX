import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';

export interface TaskCardProps { id: number; title: string; description: string; onDone: (id: number) => void; }
export const TaskCard: React.FC<TaskCardProps> = ({ id, title, description, onDone }) => (
  <motion.li
    layout
    className="task-card"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
  >
    <div className="content">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    <Button variant="primary" className="text-sm px-3 py-1" onClick={() => onDone(id)}>
      Done
    </Button>
  </motion.li>
);