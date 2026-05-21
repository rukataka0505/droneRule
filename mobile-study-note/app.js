
const body = document.body;
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

updateProgress();
