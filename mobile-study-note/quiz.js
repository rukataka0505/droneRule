const body = document.body;
const themeToggle = document.querySelector('#themeToggle');
const categoryOptions = document.querySelector('#categoryOptions');
const bankSummary = document.querySelector('#bankSummary');
const orderedButton = document.querySelector('#orderedButton');
const randomButton = document.querySelector('#randomButton');
const resetButton = document.querySelector('#resetButton');
const selectAllButton = document.querySelector('#selectAllButton');
const clearCategoriesButton = document.querySelector('#clearCategoriesButton');
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

const dataUrl = 'manual_quiz_questions.json';
const storageKey = 'drone-quiz-manual-v1';

let allQuestions = [];
let questionById = new Map();
let questions = [];
let state = {
  index: 0,
  answers: {},
  selectedCategories: [],
  sessionIds: [],
  mode: 'ordered'
};

if (localStorage.getItem('drone-study-theme') === 'dark') body.classList.add('dark');

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark');
  localStorage.setItem('drone-study-theme', body.classList.contains('dark') ? 'dark' : 'light');
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function categories() {
  return [...new Set(allQuestions.map((q) => q.category))];
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    state = {
      index: Number.isInteger(saved.index) ? saved.index : 0,
      answers: saved.answers && typeof saved.answers === 'object' ? saved.answers : {},
      selectedCategories: Array.isArray(saved.selectedCategories) ? saved.selectedCategories : [],
      sessionIds: Array.isArray(saved.sessionIds) ? saved.sessionIds : [],
      mode: saved.mode === 'random' ? 'random' : 'ordered'
    };
  } catch {
    state = { index: 0, answers: {}, selectedCategories: [], sessionIds: [], mode: 'ordered' };
  }
  if (!state.selectedCategories.length) state.selectedCategories = categories();
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function selectedSet() {
  return new Set(state.selectedCategories);
}

function selectedPool() {
  const selected = selectedSet();
  return allQuestions.filter((q) => selected.has(q.category));
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function renderCategories() {
  const selected = selectedSet();
  categoryOptions.innerHTML = '';
  const counts = allQuestions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});

  categories().forEach((category) => {
    const label = document.createElement('label');
    label.className = 'category-check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = category;
    input.checked = selected.has(category);
    input.addEventListener('change', () => {
      const next = selectedSet();
      if (input.checked) next.add(category);
      else next.delete(category);
      state.selectedCategories = [...next];
      saveState();
      renderControls();
    });
    const text = document.createElement('span');
    text.textContent = `${category} (${counts[category]}問)`;
    label.append(input, text);
    categoryOptions.appendChild(label);
  });
}

function applyOrderedMode() {
  const pool = selectedPool();
  state.mode = 'ordered';
  state.sessionIds = pool.map((q) => q.id);
  state.index = 0;
  state.answers = {};
  saveState();
  setQuestions();
  render();
}

function applyRandomMode() {
  const pool = selectedPool();
  state.mode = 'random';
  state.sessionIds = shuffle(pool).slice(0, 10).map((q) => q.id);
  state.index = 0;
  state.answers = {};
  saveState();
  setQuestions();
  render();
}

function setQuestions() {
  const ids = state.sessionIds.length ? state.sessionIds : selectedPool().map((q) => q.id);
  questions = ids.map((id) => questionById.get(id)).filter(Boolean);
  state.index = Math.min(Math.max(state.index, 0), Math.max(questions.length - 1, 0));
}

function score() {
  const answeredIds = new Set(Object.keys(state.answers));
  const answered = questions.filter((q) => answeredIds.has(q.id)).length;
  const correct = questions.filter((q) => state.answers[q.id] === q.answer).length;
  return { answered, correct, total: questions.length };
}

function renderControls() {
  const selectedCount = state.selectedCategories.length;
  const poolCount = selectedPool().length;
  randomButton.disabled = poolCount === 0;
  orderedButton.disabled = poolCount === 0;
  bankSummary.textContent = `教則網羅クイズ: 全${allQuestions.length}問 / 選択${selectedCount}分野・${poolCount}問`;
}

function renderList() {
  questionList.innerHTML = '';
  const { answered, correct, total } = score();
  listSummary.textContent = `${answered}/${total}問回答、正解${correct}問`;

  const fragment = document.createDocumentFragment();
  questions.forEach((q, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = [
      index === state.index ? 'current' : '',
      state.answers[q.id] !== undefined ? 'answered' : ''
    ].filter(Boolean).join(' ');
    button.textContent = `${index + 1}. ${q.category} / ${q.question.replace(/\s+/g, ' ')}`;
    button.addEventListener('click', () => {
      state.index = index;
      saveState();
      render();
    });
    fragment.appendChild(button);
  });
  questionList.appendChild(fragment);
}

function render() {
  renderControls();
  if (!questions.length) {
    questionCounter.textContent = '問 - / -';
    scoreCounter.textContent = '0問回答';
    answerMeter.style.width = '0%';
    questionCategory.textContent = '分野';
    questionSource.textContent = '教則網羅クイズ';
    questionText.textContent = '分野を1つ以上選択してください。';
    choicesEl.innerHTML = '';
    feedback.hidden = true;
    renderList();
    return;
  }

  const q = questions[state.index];
  const selected = state.answers[q.id];
  const { answered, correct, total } = score();

  questionCounter.textContent = `問 ${state.index + 1} / ${total}`;
  scoreCounter.textContent = `${state.mode === 'random' ? 'ランダム10問' : '教則順'} / ${answered}問回答 / 正解${correct}問`;
  answerMeter.style.width = `${total ? (answered / total) * 100 : 0}%`;
  questionCategory.textContent = q.category;
  questionSource.textContent = q.reference || q.source;
  questionText.textContent = q.question;
  choicesEl.innerHTML = '';
  feedback.hidden = selected === undefined;
  feedback.innerHTML = selected === undefined
    ? ''
    : `<strong>${selected === q.answer ? '正解' : '不正解'}</strong>
       <span class="quote-label">教則の該当箇所</span>
       <blockquote>${escapeHtml(q.quote || q.explanation || '')}</blockquote>
       <small>${escapeHtml(q.reference || q.section || '')}</small>`;

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

orderedButton.addEventListener('click', applyOrderedMode);
randomButton.addEventListener('click', applyRandomMode);
selectAllButton.addEventListener('click', () => {
  state.selectedCategories = categories();
  saveState();
  renderCategories();
  renderControls();
});
clearCategoriesButton.addEventListener('click', () => {
  state.selectedCategories = [];
  saveState();
  renderCategories();
  renderControls();
});
resetButton.addEventListener('click', () => {
  state.answers = {};
  state.index = 0;
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

fetch(dataUrl)
  .then((response) => response.json())
  .then((data) => {
    allQuestions = data.sort((a, b) => a.order - b.order);
    questionById = new Map(allQuestions.map((q) => [q.id, q]));
    loadState();
    if (!state.sessionIds.length) state.sessionIds = selectedPool().map((q) => q.id);
    setQuestions();
    renderCategories();
    saveState();
    render();
  })
  .catch(() => {
    bankSummary.textContent = '問題データを読み込めませんでした。ローカルサーバー経由で開いてください。';
  });
