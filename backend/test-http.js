const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Server is running' }));
});

const PORT = 3000;
const HOST = '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log('Server address:', server.address());
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.on('listening', () => {
  console.log('Server is now listening');
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});