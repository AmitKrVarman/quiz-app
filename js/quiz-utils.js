(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.quizUtils = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function letterToIndex(letter) {
    if (!letter) return -1;
    const s = String(letter).trim().toUpperCase();
    if (/^[A-Z]$/.test(s)) return s.charCodeAt(0) - 'A'.charCodeAt(0);
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? -1 : n;
  }

  function indexToLetter(i) {
    if (typeof i !== 'number' || i < 0) return '';
    return String.fromCharCode(65 + i);
  }

  function normalizeQuestionsData(data) {
    return (data || []).map((q, idx) => {
      const id = q.id ?? (idx + 1);
      const text = q.question ?? q.prompt ?? '';
      const choices = Array.isArray(q.choices) ? q.choices.slice() : Array.isArray(q.options) ? q.options.slice() : [];
      const answerField = q.answer ?? q.correct ?? q.correct_answer ?? q.correctAnswer;
      let answerIndex = null;
      if (typeof answerField === 'number') answerIndex = answerField;
      else if (typeof answerField === 'string') {
        answerIndex = letterToIndex(answerField);
      }
      if (answerIndex == null) answerIndex = -1;
      return { id, question: text, choices, answer: answerIndex };
    });
  }

  // Fisher-Yates in-place shuffle
  function shuffleArray(arr) {
    const a = arr;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function shuffleQuestions(list) {
    // clone then shuffle
    const items = list.slice();
    return shuffleArray(items);
  }

  return {
    letterToIndex,
    indexToLetter,
    normalizeQuestionsData,
    shuffleArray,
    shuffleQuestions
  };
});
