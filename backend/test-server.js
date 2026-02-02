const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Raphael\'s Horizon API' });
});

const PORT = 8000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

module.exports = { app };