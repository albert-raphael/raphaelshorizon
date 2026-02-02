console.log('Starting simple test server...');

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(8000, '127.0.0.1', () => {
  console.log('Server is listening on port 8000');
});

console.log('Server setup complete');