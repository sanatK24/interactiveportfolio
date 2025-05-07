const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const PORT = process.env.PORT || 5173;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  
  // Serve static files
  const filePath = path.join(__dirname, 'dist', parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
