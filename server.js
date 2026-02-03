const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  try {
    let requestPath = decodeURIComponent(req.url.split('?')[0]);
    if (requestPath === '/') requestPath = '/index.html';
    const filePath = path.join(publicDir, requestPath);

    // security: ensure path is inside publicDir
    if (!filePath.startsWith(publicDir)) {
      res.statusCode = 403;
      return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.statusCode = 404;
        return res.end('Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mime[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.statusCode = 500;
    res.end('Server Error');
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port} (serving ${publicDir})`);
});
