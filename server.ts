import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  
  // Handle GitHub callback
  if (url.pathname.startsWith('/api/github/callback')) {
    const handler = require('./src/pages/api/github/callback');
    handler(req, res);
  } else {
    // Serve static files
    const filePath = join(__dirname, 'dist', url.pathname === '/' ? 'index.html' : url.pathname);
    try {
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }
});

const PORT = process.env.PORT || 5173;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
