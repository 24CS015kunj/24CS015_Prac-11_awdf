import React, { useState, useEffect } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from './api'

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  const loadTasks = async () => {
    try {
      setLoading(true)
      setApiError(null)
      const data = await getTasks()
      setTasks(data)
    } catch (err) {
      console.error(err)
      setApiError('Unable to connect to Backend API (port 5000). Ensure docker-compose is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setSubmitting(true)
      const created = await createTask({ title: title.trim(), description: description.trim() })
      setTasks((prev) => [created, ...prev])
      setTitle('')
      setDescription('')
    } catch (err) {
      alert(`Error creating task: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (task) => {
    try {
      const updated = await updateTask(task._id, { completed: !task.completed })
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)))
    } catch (err) {
      alert(`Error updating task: ${err.message}`)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t._id !== id))
    } catch (err) {
      alert(`Error deleting task: ${err.message}`)
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <div className="container">
      <header className="header">
        <div className="badge-row">
          <span className="badge badge-network">Docker Compose Stack</span>
          <span className="badge badge-service">Frontend : 5173</span>
          <span className="badge badge-service">Backend : 5000</span>
          <span className="badge badge-service">MongoDB : 27017</span>
        </div>
        <h1>Task Management App</h1>
        <p className="subtitle">
          CHARUSAT ITUE301 &bull; Practical 11: Multi-Container Orchestration with Docker &amp; Docker Compose
        </p>
      </header>

      {apiError && (
        <div className="alert-box">
          <span>&#9888; {apiError}</span>
          <button className="btn-retry" onClick={loadTasks}>Retry</button>
        </div>
      )}

      <main className="content">
        <div className="card">
          <div className="card-header">
            <h3>Add New Task</h3>
            <span className="info-tag">Saved to MongoDB via Backend</span>
          </div>
          <form onSubmit={handleSubmit} className="form">
            <div className="input-group">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                placeholder="Additional description or notes (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding Task...' : '+ Add Task'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header list-header">
            <div>
              <h3>Tasks List</h3>
              <p className="meta-text">
                {tasks.length} total &bull; {completedCount} completed &bull; {tasks.length - completedCount} active
              </p>
            </div>
            <div className="filter-group">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active
              </button>
              <button
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching tasks from MongoDB container...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No tasks found</p>
              <p className="empty-sub">
                {filter === 'all'
                  ? 'Add your first task above to verify end-to-end container communication.'
                  : `No ${filter} tasks right now.`}
              </p>
            </div>
          ) : (
            <div className="list">
              {filteredTasks.map((task) => (
                <div key={task._id} className={`item ${task.completed ? 'completed' : ''}`}>
                  <div className="item-left">
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={!!task.completed}
                      onChange={() => handleToggle(task)}
                      title="Mark complete / incomplete"
                    />
                    <div className="item-body">
                      <h4 className="item-title">{task.title}</h4>
                      {task.description && <p className="item-desc">{task.description}</p>}
                      <span className="item-time">
                        {new Date(task.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    className="del-btn"
                    onClick={() => handleDelete(task._id)}
                    title="Delete task from database"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App

