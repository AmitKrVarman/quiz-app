const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const quizzesDir = path.join(publicDir, 'quizzes');

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

    // Admin API endpoints (simple JSON API for listing/uploading quizzes)
    if (requestPath === '/admin/quizzes' && req.method === 'GET') {
      // list quiz files
      try {
        if (!fs.existsSync(quizzesDir)) fs.mkdirSync(quizzesDir, { recursive: true });
        const files = fs.readdirSync(quizzesDir).filter(f => f.toLowerCase().endsWith('.json'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ quizzes: files }));
      } catch (e) {
        res.statusCode = 500; return res.end('error');
      }
    }

    if (requestPath === '/admin/upload' && req.method === 'POST') {
      // accept JSON body: { filename: "name.json", content: <object|array> }
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          // basic server-side validation of quiz JSON
          function validateQuiz(obj) {
            const questions = Array.isArray(obj) ? obj : (Array.isArray(obj && obj.questions) ? obj.questions : null);
            if (!questions) return { valid: false, error: 'Expected questions array' };
            if (questions.length === 0) return { valid: false, error: 'Questions array is empty' };
            for (let i = 0; i < questions.length; i++) {
              const q = questions[i];
              if (!q || typeof q !== 'object') return { valid: false, error: `Question at index ${i} invalid` };
              if (typeof (q.question ?? q.prompt) !== 'string' || (q.question ?? q.prompt).trim() === '') return { valid: false, error: `Question ${i+1} missing text` };
              const opts = Array.isArray(q.options) ? q.options : (Array.isArray(q.choices) ? q.choices : null);
              if (!opts || opts.length < 2) return { valid: false, error: `Question ${i+1} needs at least 2 options` };
              const correct = q.correct ?? q.correct_answer ?? q.correctAnswer ?? q.answer ?? null;
              if (correct === null || typeof correct === 'undefined' || (typeof correct === 'string' && correct.toString().trim() === '')) return { valid: false, error: `Question ${i+1} missing correct answer` };
            }
            return { valid: true };
          }

          const validation = validateQuiz(payload.content);
          if (!validation.valid) { res.statusCode = 400; return res.end('validation error: ' + validation.error); }
          let filename = String(payload.filename || '').trim();
          // sanitize filename
          filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
          if (!filename.toLowerCase().endsWith('.json')) filename = filename + '.json';
          const dest = path.join(quizzesDir, filename);
          if (!dest.startsWith(quizzesDir)) { res.statusCode = 400; return res.end('invalid filename'); }
          fs.writeFileSync(dest, JSON.stringify(payload.content, null, 2), 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, filename }));
        } catch (e) {
          res.statusCode = 400; return res.end('bad request');
        }
      });
      return;
    }

    if (requestPath === '/admin/set-active' && req.method === 'POST') {
      // body { filename: 'name.json' } -> copy quizzes/name.json to public/questions.json
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const filename = String(payload.filename || '').replace(/[^a-zA-Z0-9._-]/g, '_');
          const src = path.join(quizzesDir, filename);
          const dest = path.join(publicDir, 'questions.json');
          if (!src.startsWith(quizzesDir) || !fs.existsSync(src)) { res.statusCode = 400; return res.end('file not found'); }
          fs.copyFileSync(src, dest);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.statusCode = 400; return res.end('bad request');
        }
      });
      return;
    }

    // GET specific quiz content: /admin/quizzes/<filename>
    if (requestPath.startsWith('/admin/quizzes/') && req.method === 'GET') {
      try {
        const filename = requestPath.replace('/admin/quizzes/', '');
        const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const src = path.join(quizzesDir, safe);
        if (!src.startsWith(quizzesDir) || !fs.existsSync(src)) { res.statusCode = 404; return res.end('Not found'); }
        const content = fs.readFileSync(src, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(content);
      } catch (e) {
        res.statusCode = 500; return res.end('error');
      }
    }

    // Delete a quiz: POST /admin/delete { filename }
    if (requestPath === '/admin/delete' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const filename = String(payload.filename || '').replace(/[^a-zA-Z0-9._-]/g, '_');
          const target = path.join(quizzesDir, filename);
          if (!target.startsWith(quizzesDir) || !fs.existsSync(target)) { res.statusCode = 400; return res.end('file not found'); }
          fs.unlinkSync(target);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.statusCode = 400; return res.end('bad request');
        }
      });
      return;
    }

    // Rename a quiz: POST /admin/rename { oldName, newName }
    if (requestPath === '/admin/rename' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const oldName = String(payload.oldName || '').replace(/[^a-zA-Z0-9._-]/g, '_');
          let newName = String(payload.newName || '').replace(/[^a-zA-Z0-9._-]/g, '_');
          if (!newName.toLowerCase().endsWith('.json')) newName += '.json';
          const src = path.join(quizzesDir, oldName);
          const dst = path.join(quizzesDir, newName);
          if (!src.startsWith(quizzesDir) || !dst.startsWith(quizzesDir) || !fs.existsSync(src)) { res.statusCode = 400; return res.end('file not found'); }
          fs.renameSync(src, dst);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, filename: newName }));
        } catch (e) {
          res.statusCode = 400; return res.end('bad request');
        }
      });
      return;
    }

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

// ensure quizzes directory exists and populate with existing questions.json if present
try {
  if (!fs.existsSync(quizzesDir)) fs.mkdirSync(quizzesDir, { recursive: true });
  const sourceQuestions = path.join(publicDir, 'questions.json');
  const destDefault = path.join(quizzesDir, 'default.json');
  if (fs.existsSync(sourceQuestions) && !fs.existsSync(destDefault)) {
    try { fs.copyFileSync(sourceQuestions, destDefault); } catch (e) { /* ignore */ }
  }
} catch (e) {
  // ignore startup errors here
}

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port} (serving ${publicDir})`);
});
