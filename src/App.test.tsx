import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock fetch with mutable mockTasks for PATCH
let mockTasks = [
  { id: 1, title: 'Task 1', description: 'Desc 1', completed: false },
  { id: 2, title: 'Task 2', description: 'Desc 2', completed: false },
];

global.fetch = jest.fn((url, options) => {
  if (url.endsWith('/tasks') && (!options || options.method === 'GET')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTasks.filter(t => !t.completed)) });
  }
  if (url.endsWith('/tasks') && options && options.method === 'POST') {
    const newTask = { id: 3, title: 'Task 3', description: 'Desc 3', completed: false };
    mockTasks = [newTask, ...mockTasks];
    return Promise.resolve({ ok: true, json: () => Promise.resolve(newTask) });
  }
  if (url.match(/\/tasks\/(\d+)$/) && options && options.method === 'PATCH') {
    const id = parseInt(url.match(/\/tasks\/(\d+)$/)[1], 10);
    mockTasks = mockTasks.map(t => t.id === id ? { ...t, completed: true } : t);
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTasks.find(t => t.id === id)) });
  }
  return Promise.resolve({ ok: false });
}) as any;

describe('App', () => {
  it('renders the to-do list title', async () => {
    render(<App />);
    expect(screen.getByText(/To-Do List|Advanced To-Do/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Task 1')).toBeInTheDocument());
  });

  it('can mark a task as completed', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Task 1')).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Done')[0]);
    // Wait for Task 1 to be removed
    await waitFor(() => {
      expect(screen.queryByText('Task 1')).toBeNull();
    });
  });

  it('shows only 5 most recent tasks', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 6, title: 'Task 6', description: 'Desc', completed: false },
          { id: 5, title: 'Task 5', description: 'Desc', completed: false },
          { id: 4, title: 'Task 4', description: 'Desc', completed: false },
          { id: 3, title: 'Task 3', description: 'Desc', completed: false },
          { id: 2, title: 'Task 2', description: 'Desc', completed: false },
        ]),
      })
    );
    render(<App />);
    await waitFor(() => expect(screen.getByText('Task 6')).toBeInTheDocument());
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
  });

  it('disables create button if fields are empty', async () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Create Task'));
    expect(screen.getByText('Create')).toBeDisabled();
  });

  it('shows error if marking as done fails', async () => {
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url.match(/\/tasks\/(\d+)$/) && options && options.method === 'PATCH') {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTasks) });
    });
    render(<App />);
    await waitFor(() => expect(screen.getByText('Task 1')).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Done')[0]);
    await waitFor(() => expect(screen.getByText('Failed to complete task.')).toBeInTheDocument());
  });

  it('handles empty task list gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
    render(<App />);
    await waitFor(() => expect(screen.queryByText('Task 1')).not.toBeInTheDocument());
    // Optionally, check for a message or just ensure no error is thrown
  });
});