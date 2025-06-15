import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks/`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (response.ok) {
        setNewTask({ title: '', description: '' });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Task Manager</h1>

      <form onSubmit={createTask} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            style={{ width: '100%', padding: '8px', marginBottom: '5px' }}
          />
          <textarea
            placeholder="Task description (optional)"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            style={{ width: '100%', padding: '8px', height: '60px' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </form>

      <div>
        <h2>Tasks ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <p>No tasks yet. Create your first task!</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} style={{
              border: '1px solid #ccc',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px'
            }}>
              <h3>{task.title}</h3>
              {task.description && <p>{task.description}</p>}
              <small>Created: {new Date(task.created_at).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
