const http = require('http');
const port = process.env.PORT || 5002;
const server = http.createServer((req, res) => {
  if (req.url === '/api/health') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, source: 'test-backend' }));
    return;
  }
  res.end('ok');
});
server.listen(port, () => {
  console.log(`Test backend listening on ${port}`);
});
process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
