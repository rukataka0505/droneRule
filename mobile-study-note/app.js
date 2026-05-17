
const body = document.body;
const searchInput = document.querySelector('#searchInput');
const clearSearch = document.querySelector('#clearSearch');
const sections = [...document.querySelectorAll('.study-section')];
const tocLinks = [...document.querySelectorAll('.toc-link')];
const progressBar = document.querySelector('#progressBar');
const topButton = document.querySelector('#topButton');
const collapseToggle = document.querySelector('#collapseToggle');
const resumeButton = document.querySelector('#resumeButton');
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
resumeButton.addEventListener('click', () => {
  const id = localStorage.getItem('drone-study-last-section');
  document.getElementById(id || 'section-2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

let collapsed = false;
collapseToggle.addEventListener('click', () => {
  collapsed = !collapsed;
  sections.forEach((section) => section.classList.toggle('collapsed', collapsed));
  collapseToggle.textContent = collapsed ? '本文を表示する' : '本文を折りたたむ';
});

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

updateProgress();
