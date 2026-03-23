import './style.css'
import { marked } from 'marked'

async function init() {
  const app = document.querySelector<HTMLDivElement>('#app')!
  
  // Loading state
  app.innerHTML = `
    <div class="loader-container">
      <div class="loader"></div>
      <p>読み込み中...</p>
    </div>
  `

  try {
    const response = await fetch('/manual.md')
    if (!response.ok) {
      throw new Error(`Failed to fetch markdown: ${response.status} ${response.statusText}`)
    }
    const markdown = await response.text()
    
    // Parse markdown to HTML
    const htmlContent = await marked.parse(markdown)

    app.innerHTML = `
      <header class="glass-header">
        <div class="header-content">
          <h1>ドローン２等資格 教則</h1>
        </div>
      </header>
      <main class="manual-container">
        <article class="markdown-body">
          ${htmlContent}
        </article>
      </main>
      <footer>
        <p>&copy; ${new Date().getFullYear()} ドローン２等資格 教則</p>
      </footer>
    `
  } catch (error) {
    app.innerHTML = `
      <div class="error-container">
        <h2>エラーが発生しました</h2>
        <p>${error}</p>
      </div>
    `
  }
}

init()
