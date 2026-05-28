const body = document.body;
const themeToggle = document.querySelector('#themeToggle');
const bankButtons = [...document.querySelectorAll('[data-bank]')];
const categoryFilter = document.querySelector('#categoryFilter');
const bankSummary = document.querySelector('#bankSummary');
const startButton = document.querySelector('#startButton');
const resetButton = document.querySelector('#resetButton');
const questionCounter = document.querySelector('#questionCounter');
const scoreCounter = document.querySelector('#scoreCounter');
const answerMeter = document.querySelector('#answerMeter');
const questionCategory = document.querySelector('#questionCategory');
const questionSource = document.querySelector('#questionSource');
const questionText = document.querySelector('#questionText');
const choicesEl = document.querySelector('#choices');
const feedback = document.querySelector('#feedback');
const prevButton = document.querySelector('#prevButton');
const nextButton = document.querySelector('#nextButton');
const questionList = document.querySelector('#questionList');
const listSummary = document.querySelector('#listSummary');
const customImport = document.querySelector('#customImport');
const customQuestionsInput = document.querySelector('#customQuestionsInput');
const saveCustomButton = document.querySelector('#saveCustomButton');
const clearCustomButton = document.querySelector('#clearCustomButton');
const customImportStatus = document.querySelector('#customImportStatus');
const customQuestionsKey = 'drone-quiz-custom-questions-v1';

const banks = {
  official: {
    label: '公式サンプル50問',
    url: 'quiz_questions.json',
    storage: 'drone-quiz-official-v2'
  },
  sample: {
    label: '高難度10問×10セット',
    url: 'sample_questions_100.json',
    storage: 'drone-quiz-hard-v1'
  },
  custom: {
    label: '持ち込み問題',
    storage: 'drone-quiz-custom-v1',
    local: true
  }
};

let activeBank = 'official';
let allQuestions = [];
let questions = [];
let state = { index: 0, answers: {}, category: 'all' };

if (localStorage.getItem('drone-study-theme') === 'dark') body.classList.add('dark');

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark');
  localStorage.setItem('drone-study-theme', body.classList.contains('dark') ? 'dark' : 'light');
});

function storageKey() {
  return banks[activeBank].storage;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) || '{}');
    state = {
      index: Number.isInteger(saved.index) ? saved.index : 0,
      answers: saved.answers && typeof saved.answers === 'object' ? saved.answers : {},
      category: saved.category || 'all'
    };
  } catch {
    state = { index: 0, answers: {}, category: 'all' };
  }
}

function saveState() {
  localStorage.setItem(storageKey(), JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function shuffleChoices(question) {
  if (!question.answerMap) {
    question.answerMap = question.choices.map((_, index) => index);
  }
  return question;
}

function filteredQuestions() {
  if (state.category === 'all') return allQuestions;
  return allQuestions.filter((q) => q.category === state.category);
}

function score() {
  const answeredIds = new Set(Object.keys(state.answers));
  const answered = questions.filter((q) => answeredIds.has(q.id)).length;
  const correct = questions.filter((q) => state.answers[q.id] === q.answer).length;
  return { answered, correct, total: questions.length };
}

function populateCategories() {
  const categories = [...new Set(allQuestions.map((q) => q.category))];
  categoryFilter.innerHTML = '';
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = activeBank === 'sample' || activeBank === 'custom' ? 'すべてのセット' : 'すべて';
  categoryFilter.appendChild(all);
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
  if (!categories.includes(state.category)) state.category = 'all';
  categoryFilter.value = state.category;
}

function setQuestions() {
  questions = filteredQuestions().map(shuffleChoices);
  state.index = Math.min(Math.max(state.index, 0), Math.max(questions.length - 1, 0));
}

function renderList() {
  questionList.innerHTML = '';
  const { answered, correct, total } = score();
  listSummary.textContent = `${answered}/${total}問回答、正解${correct}問`;

  questions.forEach((q, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = [
      index === state.index ? 'current' : '',
      state.answers[q.id] !== undefined ? 'answered' : ''
    ].filter(Boolean).join(' ');
    button.textContent = `${index + 1}. ${q.category} / ${q.question}`;
    button.addEventListener('click', () => {
      state.index = index;
      saveState();
      render();
    });
    questionList.appendChild(button);
  });
}

function render() {
  if (!questions.length) {
    bankSummary.textContent = `${banks[activeBank].label}: 0問`;
    questionCounter.textContent = '問 - / -';
    scoreCounter.textContent = '0問回答';
    answerMeter.style.width = '0%';
    questionCategory.textContent = '分野';
    questionSource.textContent = banks[activeBank].label;
    questionText.textContent = activeBank === 'custom'
      ? '持ち込み問題を貼り付けて保存してください。'
      : 'この分野には問題がありません。';
    choicesEl.innerHTML = '';
    feedback.hidden = true;
    renderList();
    return;
  }

  const q = questions[state.index];
  const selected = state.answers[q.id];
  const { answered, correct, total } = score();

  bankSummary.textContent = `${banks[activeBank].label}: ${total}問${state.category === 'all' ? '' : ` / ${state.category}`}`;
  questionCounter.textContent = `問 ${state.index + 1} / ${total}`;
  scoreCounter.textContent = `${answered}問回答 / 正解${correct}問`;
  answerMeter.style.width = `${total ? (answered / total) * 100 : 0}%`;
  questionCategory.textContent = q.category;
  questionSource.textContent = q.source || banks[activeBank].label;
  questionText.textContent = q.question;
  choicesEl.innerHTML = '';
  feedback.hidden = selected === undefined;
  feedback.innerHTML = selected === undefined
    ? ''
    : `<strong>${selected === q.answer ? '正解' : '不正解'}</strong><br>${escapeHtml(q.explanation || '')}<br><small>${escapeHtml(q.reference || q.section || '')}</small>`;

  q.choices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button';
    if (selected !== undefined) {
      if (index === q.answer) button.classList.add('correct');
      if (index === selected && selected !== q.answer) button.classList.add('wrong');
      if (index === selected) button.classList.add('selected');
    }
    button.textContent = `${String.fromCharCode(97 + index)}. ${choice}`;
    button.addEventListener('click', () => {
      state.answers[q.id] = index;
      saveState();
      render();
    });
    choicesEl.appendChild(button);
  });

  prevButton.disabled = state.index === 0;
  nextButton.textContent = state.index === questions.length - 1 ? '先頭へ' : '次へ';
  renderList();
}

function normalizeAnswer(answer) {
  if (Number.isInteger(answer)) return answer;
  if (typeof answer === 'string') {
    const trimmed = answer.trim().toLowerCase();
    if (['a', 'ア', '1'].includes(trimmed)) return 0;
    if (['b', 'イ', '2'].includes(trimmed)) return 1;
    if (['c', 'ウ', '3'].includes(trimmed)) return 2;
    const asNumber = Number(trimmed);
    if (Number.isInteger(asNumber)) return asNumber;
  }
  return -1;
}

function normalizeCustomQuestions(rows) {
  if (!Array.isArray(rows)) throw new Error('JSONは配列で貼り付けてください。');
  return rows.map((row, index) => {
    const choices = Array.isArray(row.choices) ? row.choices.map(String) : [];
    const answer = normalizeAnswer(row.answer);
    if (!row.question || choices.length !== 3 || ![0, 1, 2].includes(answer)) {
      throw new Error(`${index + 1}問目の形式を確認してください。`);
    }
    return {
      id: row.id ? String(row.id) : `custom-${index + 1}`,
      bank: '持ち込み問題',
      source: row.source ? String(row.source) : '持ち込み問題',
      category: row.category ? String(row.category) : '持ち込みセット',
      section: row.section ? String(row.section) : '',
      question: String(row.question),
      choices,
      answer,
      explanation: row.explanation ? String(row.explanation) : '',
      reference: row.reference ? String(row.reference) : row.section ? String(row.section) : ''
    };
  });
}

function loadCustomQuestions() {
  const raw = localStorage.getItem(customQuestionsKey) || '[]';
  customQuestionsInput.value = raw === '[]' ? '' : raw;
  return normalizeCustomQuestions(JSON.parse(raw));
}

async function loadBank(bank) {
  activeBank = bank;
  bankButtons.forEach((button) => button.classList.toggle('active', button.dataset.bank === bank));
  customImport.hidden = bank !== 'custom';
  loadState();
  if (banks[bank].local) {
    allQuestions = loadCustomQuestions();
  } else {
    const response = await fetch(banks[bank].url);
    allQuestions = await response.json();
  }
  populateCategories();
  setQuestions();
  saveState();
  render();
}

bankButtons.forEach((button) => {
  button.addEventListener('click', () => loadBank(button.dataset.bank));
});

categoryFilter.addEventListener('change', () => {
  state.category = categoryFilter.value;
  state.index = 0;
  setQuestions();
  saveState();
  render();
});

startButton.addEventListener('click', () => render());
resetButton.addEventListener('click', () => {
  state = { index: 0, answers: {}, category: categoryFilter.value || 'all' };
  saveState();
  render();
});
saveCustomButton.addEventListener('click', () => {
  try {
    const normalized = normalizeCustomQuestions(JSON.parse(customQuestionsInput.value || '[]'));
    localStorage.setItem(customQuestionsKey, JSON.stringify(normalized, null, 2));
    customImportStatus.textContent = `${normalized.length}問を保存しました。`;
    loadBank('custom');
  } catch (error) {
    customImportStatus.textContent = error.message || '読み込みに失敗しました。';
  }
});
clearCustomButton.addEventListener('click', () => {
  localStorage.removeItem(customQuestionsKey);
  customQuestionsInput.value = '';
  customImportStatus.textContent = '持ち込み問題を消去しました。';
  if (activeBank === 'custom') loadBank('custom');
});
prevButton.addEventListener('click', () => {
  state.index = Math.max(0, state.index - 1);
  saveState();
  render();
});
nextButton.addEventListener('click', () => {
  state.index = state.index === questions.length - 1 ? 0 : state.index + 1;
  saveState();
  render();
});

loadBank(activeBank).catch(() => {
  bankSummary.textContent = '問題データを読み込めませんでした。ローカルサーバー経由で開いてください。';
});
