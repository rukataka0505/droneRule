
const body = document.body;
const searchInput = document.querySelector('#searchInput');
const clearSearch = document.querySelector('#clearSearch');
const sections = [...document.querySelectorAll('.study-section')];
const tocLinks = [...document.querySelectorAll('.toc-link')];
const progressBar = document.querySelector('#progressBar');
const topButton = document.querySelector('#topButton');
const themeToggle = document.querySelector('#themeToggle');

const savedTheme = localStorage.getItem('drone-study-theme');
if (savedTheme === 'dark') body.classList.add('dark');

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark');
  localStorage.setItem('drone-study-theme', body.classList.contains('dark') ? 'dark' : 'light');
});

function updateProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const ratio = max <= 0 ? 0 : scrollY / max;
  progressBar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  topButton.classList.toggle('visible', scrollY > 600);
}

function rememberPosition() {
  const current = sections
    .filter((section) => section.getBoundingClientRect().top < innerHeight * 0.4)
    .at(-1);
  if (current) localStorage.setItem('drone-study-last-section', current.id);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    tocLinks.forEach((link) => link.classList.toggle('active', link.dataset.target === entry.target.id));
  });
}, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

sections.forEach((section) => observer.observe(section));

addEventListener('scroll', () => {
  updateProgress();
  rememberPosition();
}, { passive: true });

topButton.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

function clearMarks(element) {
  element.querySelectorAll('mark').forEach((mark) => mark.replaceWith(document.createTextNode(mark.textContent)));
  element.normalize();
}

function highlight(element, query) {
  if (!query) return;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim() || node.parentElement.closest('script, style, mark')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const value = node.nodeValue;
    const idx = value.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return;
    const range = document.createRange();
    range.setStart(node, idx);
    range.setEnd(node, idx + query.length);
    const mark = document.createElement('mark');
    range.surroundContents(mark);
  });
}

function runSearch() {
  const query = searchInput.value.trim();
  sections.forEach((section) => {
    clearMarks(section);
    const hit = !query || section.textContent.toLowerCase().includes(query.toLowerCase());
    section.classList.toggle('hidden', !hit);
    if (hit) highlight(section, query);
  });
}

searchInput.addEventListener('input', runSearch);
clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  runSearch();
  searchInput.focus();
});

const quizEls = {
  start: document.querySelector('#startQuiz'),
  resume: document.querySelector('#resumeQuiz'),
  reset: document.querySelector('#resetQuiz'),
  status: document.querySelector('#quizStatus'),
  card: document.querySelector('#quizCard'),
  count: document.querySelector('#quizCount'),
  source: document.querySelector('#quizSource'),
  question: document.querySelector('#quizQuestion'),
  choices: document.querySelector('#quizChoices'),
  feedback: document.querySelector('#quizFeedback'),
  prev: document.querySelector('#prevQuestion'),
  next: document.querySelector('#nextQuestion'),
  list: document.querySelector('#questionList'),
  listCount: document.querySelector('#questionListCount')
};

const quizStorageKey = 'drone-study-quiz-state-v1';
let quizQuestions = [];
let quizState = { index: 0, answers: {} };

function saveQuizState() {
  localStorage.setItem(quizStorageKey, JSON.stringify(quizState));
}

function loadQuizState() {
  try {
    const saved = JSON.parse(localStorage.getItem(quizStorageKey) || '{}');
    quizState = {
      index: Number.isInteger(saved.index) ? saved.index : 0,
      answers: saved.answers && typeof saved.answers === 'object' ? saved.answers : {}
    };
  } catch {
    quizState = { index: 0, answers: {} };
  }
}

function quizScore() {
  const answered = Object.keys(quizState.answers).length;
  const correct = quizQuestions.filter((q) => quizState.answers[q.id] === q.answer).length;
  return { answered, correct, total: quizQuestions.length };
}

function updateQuizStatus() {
  if (!quizQuestions.length) return;
  const { answered, correct, total } = quizScore();
  quizEls.status.textContent = `保存済み: ${answered}/${total}問回答、正解 ${correct}問。ページを閉じてもこの端末で再開できます。`;
}

function renderQuestionList() {
  quizEls.list.innerHTML = '';
  quizEls.listCount.textContent = `(${quizQuestions.length}問)`;
  quizQuestions.forEach((q, index) => {
    const button = document.createElement('button');
    const answered = quizState.answers[q.id] !== undefined;
    button.className = answered ? 'answered' : '';
    button.type = 'button';
    button.textContent = `${index + 1}. ${q.category} / ${q.question}`;
    button.addEventListener('click', () => {
      quizState.index = index;
      saveQuizState();
      renderQuiz();
      document.querySelector('#quiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    quizEls.list.appendChild(button);
  });
}

function renderQuiz() {
  if (!quizQuestions.length) return;
  quizState.index = Math.min(Math.max(quizState.index, 0), quizQuestions.length - 1);
  const q = quizQuestions[quizState.index];
  const selected = quizState.answers[q.id];

  quizEls.card.hidden = false;
  quizEls.count.textContent = `問 ${quizState.index + 1} / ${quizQuestions.length}`;
  quizEls.source.textContent = `${q.source} / ${q.section}`;
  quizEls.question.textContent = q.question;
  quizEls.choices.innerHTML = '';
  quizEls.feedback.hidden = selected === undefined;
  quizEls.feedback.innerHTML = selected === undefined
    ? ''
    : `<strong>${selected === q.answer ? '正解' : '不正解'}</strong><br>${q.explanation}<br><span class="term">${q.reference}</span>`;

  q.choices.forEach((choice, choiceIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button';
    if (selected !== undefined) {
      if (choiceIndex === q.answer) button.classList.add('correct');
      if (choiceIndex === selected && selected !== q.answer) button.classList.add('wrong');
      if (choiceIndex === selected) button.classList.add('selected');
    }
    button.textContent = `${String.fromCharCode(97 + choiceIndex)}. ${choice}`;
    button.addEventListener('click', () => {
      quizState.answers[q.id] = choiceIndex;
      saveQuizState();
      renderQuiz();
      renderQuestionList();
      updateQuizStatus();
    });
    quizEls.choices.appendChild(button);
  });

  quizEls.prev.disabled = quizState.index === 0;
  quizEls.next.textContent = quizState.index === quizQuestions.length - 1 ? '結果を見る' : '次へ';
  updateQuizStatus();
}

function startQuiz(reset = false) {
  if (reset) {
    quizState = { index: 0, answers: {} };
    saveQuizState();
  } else {
    loadQuizState();
  }
  renderQuiz();
  renderQuestionList();
}

quizEls.start.addEventListener('click', () => startQuiz(false));
quizEls.resume.addEventListener('click', () => startQuiz(false));
quizEls.reset.addEventListener('click', () => startQuiz(true));
quizEls.prev.addEventListener('click', () => {
  quizState.index -= 1;
  saveQuizState();
  renderQuiz();
});
quizEls.next.addEventListener('click', () => {
  if (quizState.index < quizQuestions.length - 1) {
    quizState.index += 1;
    saveQuizState();
    renderQuiz();
  } else {
    updateQuizStatus();
    quizEls.status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

fetch('quiz_questions.json')
  .then((response) => response.json())
  .then((questions) => {
    quizQuestions = questions.slice(0, 50);
    loadQuizState();
    renderQuestionList();
    updateQuizStatus();
    if (Object.keys(quizState.answers).length) renderQuiz();
  })
  .catch(() => {
    quizEls.status.textContent = '問題データを読み込めませんでした。ローカルサーバー経由で開いてください。';
  });

updateProgress();
