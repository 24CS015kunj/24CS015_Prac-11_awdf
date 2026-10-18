require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const Task = require('./models/Task')

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/taskdb'

app.use(cors())
app.use(express.json())

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB inside Docker network'))
  .catch((err) => console.error('MongoDB connection error:', err.message))

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Task Management Backend API is running inside Docker container',
    mongoConnected: mongoose.connection.readyState === 1
  })
})

app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 })
    res.status(200).json(tasks)
  } catch (err) {
    next(err)
  }
})

app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const newTask = await Task.create({
      title: title.trim(),
      description: description || '',
      completed: false
    })

    res.status(201).json(newTask)
  } catch (err) {
    next(err)
  }
})

app.put('/tasks/:id', async (req, res, next) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ error: 'Task not found' })
    res.status(200).json(updated)
  } catch (err) {
    next(err)
  }
})

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Task not found' })
    res.status(200).json({ message: 'Task deleted successfully' })
  } catch (err) {
    next(err)
  }
})

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`)
})
