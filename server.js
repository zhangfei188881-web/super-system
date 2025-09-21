const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const clients = new Set();
const messages = [];
const MAX_MESSAGES = 200;

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}

function sendEvent(res, eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  res.write(payload);
}

function broadcast(eventName, data) {
  for (const client of clients) {
    sendEvent(client, eventName, data);
  }
}

function addMessage(message) {
  messages.push(message);
  while (messages.length > MAX_MESSAGES) {
    messages.shift();
  }
  broadcast('message', message);
}

function sanitize(input, { maxLength = 200 } = {}) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().slice(0, maxLength);
}

function serveStatic(req, res) {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  if (!pathname || pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'GET' && parsedUrl.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    sendEvent(res, 'history', messages);
    res.write(': connected\n\n');

    clients.add(res);
    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/message') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.connection.destroy();
      }
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const user = sanitize(parsed.user, { maxLength: 32 }) || '匿名用户';
        const text = sanitize(parsed.text, { maxLength: 500 });

        if (!text) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: '消息内容不能为空' }));
          return;
        }

        const message = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          user,
          text,
          timestamp: new Date().toISOString()
        };

        addMessage(message);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '无法解析请求' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', clients: clients.size, messages: messages.length }));
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Super System chat server is running at http://localhost:${PORT}`);
});
