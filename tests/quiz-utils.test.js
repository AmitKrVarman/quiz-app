const { normalizeQuestionsData, letterToIndex, indexToLetter, shuffleArray, shuffleQuestions } = require('../public/js/quiz-utils');

describe('quiz-utils', () => {
  test('letterToIndex - letters and numbers', () => {
    expect(letterToIndex('A')).toBe(0);
    expect(letterToIndex('b')).toBe(1);
    expect(letterToIndex(' C ')).toBe(2);
    expect(letterToIndex('2')).toBe(2);
    expect(letterToIndex('')).toBe(-1);
    expect(letterToIndex(null)).toBe(-1);
  });

  test('indexToLetter', () => {
    expect(indexToLetter(0)).toBe('A');
    expect(indexToLetter(2)).toBe('C');
    expect(indexToLetter(-1)).toBe('');
  });

  test('normalizeQuestionsData handles variants', () => {
    const raw = [
      { id: 10, question: 'Q1', options: ['opt1','opt2'], correct_answer: 'B' },
      { question: 'Q2', choices: ['x','y','z'], correct: 'A' },
      { question: 'Q3', options: ['a','b'], answer: 1 }
    ];
    const norm = normalizeQuestionsData(raw);
    expect(norm[0].id).toBe(10);
    expect(norm[0].question).toBe('Q1');
    expect(norm[0].choices.length).toBe(2);
    expect(norm[0].answer).toBe(1); // B -> index 1

    expect(norm[1].id).toBe(2);
    expect(norm[1].answer).toBe(0);

    expect(norm[2].answer).toBe(1);
  });

  test('shuffleArray returns permutation', () => {
    const arr = [1,2,3,4,5];
    // deterministic if we stub Math.random
    const original = arr.slice();
    const res = shuffleArray(arr.slice());
    expect(res.length).toBe(original.length);
    expect(res.sort()).toEqual(original.sort());
  });

  test('shuffleQuestions keeps items', () => {
    const items = [{id:1},{id:2},{id:3}];
    const result = shuffleQuestions(items);
    expect(result.length).toBe(3);
    expect(result.map(x => x.id).sort()).toEqual([1,2,3]);
  });
});
