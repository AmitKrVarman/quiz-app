// ...existing code...

  // normalizer: support both { choices, answer } and { options, correct: "A" }, and 'correct_answer' variants
  function normalizeQuestionsData(data) {
    return data.map((q, idx) => {
      const id = q.id ?? (idx + 1);
      const text = q.question ?? q.prompt ?? '';
      // choices array could be in "choices" or "options"
      const choices = Array.isArray(q.choices) ? q.choices.slice() :
                      Array.isArray(q.options) ? q.options.slice() : [];

      // determine numeric answer index
      let answerIndex = null;
      // accept several possible answer fields (legacy and variants)
      const answerField = q.answer ?? q.correct ?? q.correct_answer ?? q.correctAnswer;
      if (typeof answerField === 'number') {
        answerIndex = answerField;
      } else if (typeof answerField === 'string') {
        const s = answerField.trim();
        const up = s.toUpperCase();
        // support single-letter labels like "A","B", or numeric strings
        if (/^[A-Z]$/.test(up)) {
          answerIndex = up.charCodeAt(0) - 'A'.charCodeAt(0);
        } else {
          const n = parseInt(s, 10);
          if (!Number.isNaN(n)) answerIndex = n;
        }
      }

      // fallback: if answerIndex still null, set to -1 (unknown)
      if (answerIndex == null) answerIndex = -1;

      return {
        id,
        question: text,
        choices,
        answer: answerIndex
      };
    });
  }

  // fetch questions.json, normalize, shuffle choices/questions as before
  fetch('questions.json')
    .then(r => {
      if (!r.ok) throw new Error('Failed to load questions.json');
      return r.json();
    })
    .then(rawData => {
      // support both an array response and an object with a 'questions' array
      const list = Array.isArray(rawData) ? rawData : (rawData.questions || []);
      const normalized = normalizeQuestionsData(list);

      // shuffle questions
      let prepared = shuffleQuestions(normalized);

      // shuffle choices while preserving correct index (if valid)
      prepared = prepared.map(q => {
        const pair = q.choices.map((c, idx) => ({c, idx}));
        shuffleArray(pair);
        const newChoices = pair.map(p => p.c);
        const newAnswer = q.answer >= 0 ? pair.findIndex(p => p.idx === q.answer) : -1;
        return {...q, choices: newChoices, answer: newAnswer};
      });

      questions = prepared;
      loader && loader.remove();
      loadBest();
      renderQuestion(0);
      nextBtn.disabled = questions.length <= 1;
      submitBtn.disabled = true;
      startTimer();
    })
    .catch(err => {
      root.innerHTML = `<div class="card">Error loading quiz: ${err.message}</div>`;
    });

// ...existing code...