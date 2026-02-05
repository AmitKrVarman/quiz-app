// Admin UI script: list quizzes, upload files, set active quiz
// Basic JSON validation is included to ensure uploaded quizzes match expected schema.
function validateQuizJson(obj) {
  // Accept either an array of questions or an object with a 'questions' array
  const errors = [];
  const questions = Array.isArray(obj) ? obj : (Array.isArray(obj && obj.questions) ? obj.questions : null);
  if (!questions) return { valid: false, error: 'Expected an array or an object with a top-level "questions" array.' };
  if (questions.length === 0) return { valid: false, error: 'Questions array is empty.' };
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q) { errors.push(`Question at index ${i} is empty`); continue; }
    if (typeof q.question !== 'string' || q.question.trim() === '') errors.push(`Question ${i+1} missing 'question' text`);
    const opts = Array.isArray(q.options) ? q.options : (Array.isArray(q.choices) ? q.choices : null);
    if (!opts || opts.length < 2) errors.push(`Question ${i+1} must have an 'options' or 'choices' array with at least 2 entries`);
    // correct answer: string like 'A' or numeric index or 'correct_answer'
    const correct = q.correct ?? q.correct_answer ?? q.correctAnswer ?? q.answer ?? null;
    if (correct === null || typeof correct === 'undefined' || (typeof correct === 'string' && correct.toString().trim() === '')) {
      errors.push(`Question ${i+1} missing a 'correct'/'correct_answer'/'answer' field`);
    }
  }
  if (errors.length) return { valid: false, error: errors.join('; ') };
  return { valid: true };
}
async function listQuizzes() {
  const container = document.getElementById('quizzes');
  container.textContent = 'Loading…';
  try {
    const res = await fetch('/admin/quizzes');
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    const quizzes = data.quizzes || [];
    if (quizzes.length === 0) {
      container.innerHTML = '<div class="small">No quizzes found. Upload one below.</div>';
      return;
    }
    container.innerHTML = '';
    quizzes.forEach(q => {
      const div = document.createElement('div');
      div.className = 'quiz-item';
      div.innerHTML = `<div>${q}</div>`;
      const actions = document.createElement('div');

      const setBtn = document.createElement('button');
      setBtn.className = 'btn btn-primary';
      setBtn.textContent = 'Set Active';
      setBtn.addEventListener('click', async () => {
        setBtn.disabled = true;
        try {
          const r = await fetch('/admin/set-active', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ filename: q }) });
          if (!r.ok) throw new Error('failed');
          alert('Active quiz updated');
        } catch (e) { alert('Error setting active quiz'); }
        setBtn.disabled = false;
      });
      actions.appendChild(setBtn);

      const editBtn = document.createElement('button');
      editBtn.className = 'btn';
      editBtn.style.marginLeft = '8px';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => editQuiz(q));
      actions.appendChild(editBtn);

      const renameBtn = document.createElement('button');
      renameBtn.className = 'btn';
      renameBtn.style.marginLeft = '8px';
      renameBtn.textContent = 'Rename';
      renameBtn.addEventListener('click', () => renameQuiz(q));
      actions.appendChild(renameBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger';
      delBtn.style.marginLeft = '8px';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => deleteQuiz(q));
      actions.appendChild(delBtn);

      div.appendChild(actions);
      container.appendChild(div);
    });
  } catch (e) {
    container.textContent = 'Error loading quizzes';
  }
}

document.getElementById('uploadBtn').addEventListener('click', async () => {
  const fi = document.getElementById('fileInput');
  if (!fi.files || fi.files.length === 0) return alert('Select a JSON file');
  const file = fi.files[0];
  const text = await file.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { return alert('Invalid JSON'); }
  const valid = validateQuizJson(json);
  if (!valid.valid) return alert('Validation error: ' + valid.error);
  const filename = file.name;
  await uploadJson(filename, json);
  fi.value = '';
  listQuizzes();
});

document.getElementById('pasteUploadBtn').addEventListener('click', async () => {
  const txt = document.getElementById('jsonArea').value.trim();
  const filename = document.getElementById('textFilename').value.trim() || 'uploaded.json';
  if (!txt) return alert('Paste JSON first');
  let json;
  try { json = JSON.parse(txt); } catch (e) { return alert('Invalid JSON'); }
  const valid = validateQuizJson(json);
  if (!valid.valid) return alert('Validation error: ' + valid.error);
  await uploadJson(filename, json);
  listQuizzes();
});

async function uploadJson(filename, json) {
  try {
    const res = await fetch('/admin/upload', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ filename, content: json })
    });
    if (!res.ok) throw new Error('upload failed');
    const d = await res.json();
    alert('Uploaded ' + d.filename);
  } catch (e) {
    alert('Upload error');
  }
}

listQuizzes();

async function deleteQuiz(filename) {
  if (!confirm('Delete ' + filename + '? This cannot be undone.')) return;
  try {
    const r = await fetch('/admin/delete', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ filename }) });
    if (!r.ok) throw new Error('delete failed');
    alert('Deleted');
    listQuizzes();
  } catch (e) { alert('Delete error'); }
}

async function renameQuiz(oldName) {
  const newName = prompt('New filename (include .json or omit):', oldName);
  if (!newName) return;
  try {
    const r = await fetch('/admin/rename', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ oldName, newName }) });
    if (!r.ok) throw new Error('rename failed');
    const d = await r.json();
    alert('Renamed to ' + d.filename);
    listQuizzes();
  } catch (e) { alert('Rename error'); }
}

async function editQuiz(filename) {
  try {
    const res = await fetch('/admin/quizzes/' + encodeURIComponent(filename));
    if (!res.ok) throw new Error('failed to fetch');
    const json = await res.json();
    // show editor
    document.getElementById('editorSection').style.display = 'block';
    document.getElementById('editFilename').textContent = filename;
    const editorContent = document.getElementById('editorContent');
    editorContent.innerHTML = '';
    const questions = Array.isArray(json) ? json : (Array.isArray(json.questions) ? json.questions : []);
    questions.forEach((q, idx) => {
      const row = document.createElement('div');
      row.style.padding = '8px';
      row.style.borderBottom = '1px solid #eee';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.id = 'mand_' + idx;
      chk.checked = !!q.mandatory;
      const label = document.createElement('label');
      label.htmlFor = chk.id;
      label.style.marginLeft = '8px';
      label.textContent = `${idx+1}. ${String(q.question || q.prompt || '').slice(0,200)}`;
      row.appendChild(chk);
      row.appendChild(label);
      editorContent.appendChild(row);
    });

    document.getElementById('saveChangesBtn').onclick = async () => {
      const updated = Array.isArray(json) ? [] : { ...json };
      const qs = Array.isArray(json) ? json : (json.questions || []);
      qs.forEach((q, idx) => {
        q.mandatory = !!document.getElementById('mand_' + idx).checked;
      });
      if (Array.isArray(json)) {
        await uploadJson(filename, qs);
      } else {
        updated.questions = qs;
        await uploadJson(filename, updated);
      }
      alert('Saved');
      document.getElementById('editorSection').style.display = 'none';
      listQuizzes();
    };

    document.getElementById('cancelEditBtn').onclick = () => {
      document.getElementById('editorSection').style.display = 'none';
    };
  } catch (e) { alert('Error loading file'); }
}
