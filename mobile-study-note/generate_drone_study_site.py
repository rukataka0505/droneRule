from __future__ import annotations

import html
import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent
PDF_PATH = Path(r"C:\Users\rukat\Downloads\ドローン教則.pdf")


TOC_TITLES = [
    "1. はじめに",
    "2. 無人航空機操縦者の心得",
    "2.1 操縦者の役割と責任",
    "2.2 安全な飛行の確保",
    "2.3 事故が起きた時の対応",
    "3. 無人航空機に関する規則",
    "3.1 航空法全般",
    "3.2 航空法以外の法令等",
    "4. 無人航空機のシステム",
    "4.1 無人航空機の機体の特徴（機体種類別）",
    "4.2 無人航空機の機体の特徴（飛行方法別）",
    "4.3 飛行原理と飛行性能",
    "4.4 機体の構成",
    "4.5 機体以外の要素技術",
    "4.6 機体の整備・点検・保管・交換・廃棄",
    "5. 無人航空機の操縦者及び運航体制",
    "5.1 操縦者の行動規範及び遵守事項",
    "5.2 操縦者に求められる操縦知識",
    "5.3 操縦者のパフォーマンス",
    "5.4 安全な運航のための意思決定体制（CRM 等の理解）",
    "6. 運航上のリスク管理",
    "6.1 運航リスクの評価及び最適な運航の計画の立案の基礎",
    "6.2 気象の基礎知識及び気象情報を基にしたリスク評価及び運航の計画の立案",
    "6.3 機体の種類に応じた運航リスクの評価及び最適な運航の計画の立案",
    "6.4 飛行の方法に応じた運航リスクの評価及び最適な運航の計画の立案",
]

TITLE_SET = set(TOC_TITLES)


def normalize_line(line: str) -> str:
    line = line.replace("\u3000", " ")
    line = re.sub(r"[ \t]+", " ", line.strip())
    line = remove_japanese_word_spaces(line)
    line = line.replace(" )", ")").replace("( ", "(")
    line = line.replace("（ ", "（").replace(" ）", "）")
    return line


def remove_japanese_word_spaces(text: str) -> str:
    return re.sub(r"(?<=[一-龯ぁ-んァ-ヶ]) (?=[一-龯ぁ-んァ-ヶ])", "", text)


def slug_for(title: str) -> str:
    number = title.split(" ", 1)[0].replace(".", "-").strip("-")
    return f"section-{number}"


def section_level(title: str) -> int:
    number = title.split(" ", 1)[0]
    return 1 + number.count(".")


def read_sections() -> list[dict]:
    reader = PdfReader(str(PDF_PATH))
    sections: list[dict] = []
    current: dict | None = None

    for page_index, page in enumerate(reader.pages, start=1):
        if page_index <= 6:
            continue
        text = page.extract_text() or ""
        for raw in text.splitlines():
            line = normalize_line(raw)
            if not line or line == "（空白頁）":
                continue
            if re.fullmatch(r"[ivx\d]+", line, flags=re.IGNORECASE):
                continue
            if line in TITLE_SET:
                current = {
                    "id": slug_for(line),
                    "title": line,
                    "level": section_level(line),
                    "page_start": page_index,
                    "lines": [],
                }
                sections.append(current)
                continue
            if current:
                current["lines"].append({"text": line, "page": page_index})

    return sections


def is_list_item(text: str) -> bool:
    return bool(
        re.match(
            r"^(?:[①②③④⑤⑥⑦⑧⑨⑩]|[⚫●・]|[ア-ン]\.|[a-z]\)|[a-z]\.|[（(]\d+[）)]|\d+[）)]|[（(][ア-ン][）)]|[（(][a-z][）)])",
            text,
        )
    )


def is_compact_subheading(text: str, next_text: str | None) -> bool:
    if len(text) > 34:
        return False
    if text.endswith(("。", "、", "）", ")", "；", ":", "：")):
        return False
    if re.search(r"[。！？]", text):
        return False
    if is_list_item(text):
        return False
    return bool(next_text and (is_list_item(next_text) or len(next_text) > 38))


def annotate_inline(text: str) -> str:
    escaped = html.escape(text)
    escaped = escaped.replace("〔一等〕", '<span class="tag tag-advanced">一等</span>')
    escaped = escaped.replace("［一等］", '<span class="tag tag-advanced">一等</span>')
    escaped = re.sub(
        r"(カテゴリー[ⅠⅡⅢIV]+|レベル\s?3\.5|DIPS|CRM|GNSS|フェールセーフ|リスク評価)",
        r'<span class="term">\1</span>',
        escaped,
    )
    return escaped


def render_blocks(lines: list[dict]) -> str:
    out: list[str] = []
    paragraph: list[str] = []
    list_items: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            text = remove_japanese_word_spaces(" ".join(paragraph))
            out.append(f"<p>{annotate_inline(text)}</p>")
            paragraph = []

    def close_list() -> None:
        nonlocal list_items
        if list_items:
            for value in list_items:
                out.append(f"<li>{annotate_inline(remove_japanese_word_spaces(value))}</li>")
            out.append("</ul>")
            list_items = []

    texts = [item["text"] for item in lines]
    for idx, item in enumerate(lines):
        text = item["text"]
        next_text = texts[idx + 1] if idx + 1 < len(texts) else None

        if is_compact_subheading(text, next_text):
            flush_paragraph()
            close_list()
            out.append(f'<h3 class="subhead">{annotate_inline(text)}</h3>')
            continue

        if is_list_item(text):
            flush_paragraph()
            if not list_items:
                out.append("<ul>")
            list_items.append(text)
            continue

        if list_items:
            list_items[-1] = f"{list_items[-1]} {text}"
            if text.endswith(("。", "こと。", "ない。", "いる。", "た。")):
                close_list()
            continue

        paragraph.append(text)
        if text.endswith(("。", "である。", "こと。", "する。", "ない。", "いる。", "た。")) or len(" ".join(paragraph)) > 160:
            flush_paragraph()

    flush_paragraph()
    close_list()
    return "\n".join(out)


def render_html(sections: list[dict]) -> str:
    page_title = "二等学科試験のためのスマホ学習ノート"
    browser_title = "無人航空機 教則スマホ学習ノート"
    page_description = (
        "無人航空機の飛行の安全に関する教則を、スマホで空き時間に読み進めやすいWeb記事形式に整えた学習ページです。"
        "本文学習とクイズ演習を切り替えながら学べます。"
    )
    page_url = "https://unskillful-latina-subduingly.ngrok-free.dev/index.html"
    nav = "\n".join(
        f'<a class="toc-link toc-level-{s["level"]}" href="#{s["id"]}" data-target="{s["id"]}">{html.escape(s["title"])}</a>'
        for s in sections
    )
    articles = []
    for section in sections:
        title = html.escape(section["title"])
        level = section["level"]
        tag = "h2" if level == 1 else "h2"
        articles.append(
            f"""
            <article class="study-section" id="{section['id']}" data-title="{title}" data-page="{section['page_start']}">
              <div class="section-kicker">PDF p.{section['page_start']}</div>
              <{tag}>{title}</{tag}>
              {render_blocks(section["lines"])}
            </article>
            """
        )

    section_json = html.escape(json.dumps([{"id": s["id"], "title": s["title"]} for s in sections], ensure_ascii=False))

    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(browser_title)}</title>
  <meta name="description" content="{html.escape(page_description)}">
  <meta name="theme-color" content="#0c7a66">
  <link rel="canonical" href="{html.escape(page_url)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Drone Study">
  <meta property="og:title" content="{html.escape(page_title)}">
  <meta property="og:description" content="{html.escape(page_description)}">
  <meta property="og:url" content="{html.escape(page_url)}">
  <meta property="og:locale" content="ja_JP">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{html.escape(page_title)}">
  <meta name="twitter:description" content="{html.escape(page_description)}">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="progress" aria-hidden="true"><span id="progressBar"></span></div>
  <header class="hero">
    <nav class="topbar" aria-label="ページ操作">
      <a class="brand" href="#top">Drone Study</a>
      <button class="icon-button" id="themeToggle" type="button" aria-label="表示テーマを切り替え">◐</button>
    </nav>
    <div class="hero-inner" id="top">
      <p class="source">令和7年2月1日 第4版 / 無人航空機の飛行の安全に関する教則</p>
      <h1>二等学科試験<br>スマホ学習ノート</h1>
      <div class="mode-switch" aria-label="学習モード切り替え">
        <a class="mode-card active" href="#toc">
          <span>本文で学ぶ</span>
          <strong>教則ノート</strong>
        </a>
        <a class="mode-card" href="quiz.html">
          <span>クイズで確認</span>
          <strong>872問網羅</strong>
        </a>
      </div>
      <p class="lead">PDF教則をスマホで読みやすいWeb記事形式に整えました。本文で理解して、別ページのクイズで確認できます。</p>
      <div class="stats" aria-label="教材の概要">
        <span><strong>{len(sections)}</strong> セクション</span>
        <span><strong>88</strong> PDFページ</span>
        <span><strong>872</strong> 問クイズ</span>
        <span><strong>一等表記</strong> も保持</span>
      </div>
    </div>
  </header>

  <main>
    <section class="toc-section" id="toc" aria-label="目次">
      <div class="toc-heading">
        <span>目次</span>
        <p>読みたい章を選んで本文へ移動できます。</p>
      </div>
      <div class="toc-links" aria-label="目次">
        {nav}
      </div>
      <p class="hint">「一等」タグは教則原文の区分表示です。二等対策中でも本文確認用に残しています。</p>
    </section>

    <section class="article-list" id="articleList" data-sections="{section_json}">
      {''.join(articles)}
    </section>
  </main>

  <button class="floating-top" id="topButton" type="button" aria-label="ページ上部へ戻る">↑</button>
  <script src="app.js"></script>
</body>
</html>
"""


CSS = r"""
:root {
  color-scheme: light;
  --bg: #f7faf9;
  --paper: #ffffff;
  --paper-strong: #eef6f2;
  --text: #16201d;
  --muted: #63716c;
  --line: #d9e5df;
  --accent: #0c7a66;
  --accent-strong: #075f50;
  --accent-soft: #dff4ee;
  --warn: #a95000;
  --shadow: 0 18px 50px rgba(20, 48, 40, 0.12);
  --radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", "Yu Gothic", Meiryo, sans-serif;
}

body.dark {
  color-scheme: dark;
  --bg: #101413;
  --paper: #18201d;
  --paper-strong: #1f2d28;
  --text: #edf7f3;
  --muted: #a8bbb4;
  --line: #33443e;
  --accent: #58d4b8;
  --accent-strong: #89ecd5;
  --accent-soft: #173b34;
  --warn: #ffbf70;
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.3);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  line-height: 1.85;
  letter-spacing: 0;
}

.progress {
  position: fixed;
  inset: 0 0 auto 0;
  height: 4px;
  z-index: 30;
  background: transparent;
}
.progress span {
  display: block;
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--accent), #2d9cdb);
}

.hero {
  min-height: 72svh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 15% 10%, rgba(12, 122, 102, 0.16), transparent 32%),
    linear-gradient(150deg, var(--paper), var(--paper-strong));
  border-bottom: 1px solid var(--line);
}

.topbar {
  min-height: 60px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  color: var(--text);
  text-decoration: none;
  font-weight: 800;
  font-size: 15px;
}
.icon-button,
.floating-top {
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--text);
  width: 42px;
  height: 42px;
  border-radius: var(--radius);
  font-size: 18px;
  cursor: pointer;
}

.hero-inner {
  width: min(980px, 100%);
  padding: 42px 22px 34px;
  margin: auto;
}
.source {
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 14px;
}
h1 {
  font-size: clamp(34px, 9vw, 72px);
  line-height: 1.08;
  margin: 0;
  letter-spacing: 0;
}
.lead {
  max-width: 700px;
  color: var(--muted);
  font-size: 16px;
  margin: 20px 0 0;
}
.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
  max-width: 680px;
}
.mode-card {
  min-height: 82px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--paper);
  color: var(--text);
  text-decoration: none;
  padding: 16px;
  box-shadow: var(--shadow);
}
.mode-card.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
.mode-card span {
  font-size: 13px;
  font-weight: 800;
  opacity: .78;
}
.mode-card strong {
  font-size: clamp(20px, 5vw, 30px);
  line-height: 1.12;
}
.stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 24px;
}
.stats span {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 10px 12px;
  color: var(--muted);
  box-shadow: var(--shadow);
}
.stats strong { color: var(--text); }

main {
  width: min(980px, 100%);
  margin: 0 auto;
  padding: 18px 16px 72px;
}

.toc-section,
.study-section {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.toc-section {
  padding: 22px 18px;
  margin-bottom: 18px;
}
.toc-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}
.toc-heading span {
  font-weight: 800;
  font-size: clamp(22px, 6vw, 32px);
  line-height: 1.2;
}
.toc-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  text-align: right;
}
.hint {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.65;
  margin: 10px 0 0;
}

.toc-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 6px;
}
.toc-link {
  display: block;
  color: var(--text);
  text-decoration: none;
  border-radius: var(--radius);
  padding: 8px 10px;
  line-height: 1.35;
  font-size: 14px;
}
.toc-link:hover,
.toc-link.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.toc-level-2 { padding-left: 22px; color: var(--muted); }

.article-list {
  display: grid;
  gap: 18px;
}
.study-section {
  padding: 22px 18px;
  scroll-margin-top: 150px;
}
.section-kicker {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 6px;
}
h2 {
  font-size: clamp(24px, 7vw, 38px);
  line-height: 1.25;
  margin: 0 0 18px;
  letter-spacing: 0;
}
.subhead {
  font-size: 18px;
  line-height: 1.45;
  margin: 24px 0 8px;
  padding-left: 10px;
  border-left: 4px solid var(--accent);
}
p {
  margin: 0 0 15px;
  text-align: justify;
  overflow-wrap: anywhere;
}
ul {
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}
li {
  background: var(--bg);
  border-left: 4px solid var(--line);
  border-radius: var(--radius);
  padding: 10px 12px;
  overflow-wrap: anywhere;
}
.term {
  color: var(--accent-strong);
  font-weight: 800;
}
.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 1px 7px;
  margin: 0 3px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.4;
}
.tag-advanced {
  color: var(--warn);
  background: rgba(255, 184, 77, 0.18);
  border: 1px solid rgba(169, 80, 0, 0.35);
}
.floating-top {
  position: fixed;
  right: 16px;
  bottom: 16px;
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s ease;
}
.floating-top.visible {
  opacity: 1;
  pointer-events: auto;
}

@media (min-width: 860px) {
  main {
    width: min(940px, 100%);
  }
}

@media (max-width: 520px) {
  .hero {
    min-height: 72svh;
  }
  .topbar {
    padding-inline: 14px;
  }
  .hero-inner {
    padding: 28px 18px 30px;
  }
  .lead {
    font-size: 15px;
  }
  main {
    padding-inline: 10px;
  }
  .mode-switch {
    grid-template-columns: 1fr;
  }
  .toc-heading {
    display: block;
  }
  .toc-heading p {
    margin-top: 6px;
    text-align: left;
  }
  .study-section,
  .toc-section {
    border-radius: 8px;
  }
  .study-section {
    padding: 20px 14px;
  }
}
"""


JS = r"""
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
"""


def main() -> None:
    sections = read_sections()
    (ROOT / "index.html").write_text(render_html(sections), encoding="utf-8")
    (ROOT / "style.css").write_text(CSS, encoding="utf-8")
    (ROOT / "app.js").write_text(JS, encoding="utf-8")
    (ROOT / "extracted-sections.json").write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(sections)} sections")


if __name__ == "__main__":
    main()
