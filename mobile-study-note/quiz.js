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
  all.textContent = activeBank === 'sample' ? 'すべてのセット' : 'すべて';
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
    questionText.textContent = 'この分野には問題がありません。';
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

async function loadBank(bank) {
  activeBank = bank;
  bankButtons.forEach((button) => button.classList.toggle('active', button.dataset.bank === bank));
  loadState();
  const response = await fetch(banks[bank].url);
  allQuestions = await response.json();
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
