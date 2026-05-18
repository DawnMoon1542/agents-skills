import type { ShowcasePageProps } from './types'

const BLOCK_CATEGORIES = ['Hero', 'Pricing', 'Nav', 'Dashboard', 'Features', 'Footer'] as const
const MOCK_BLOCKS = [
  { name: 'hero-001', category: 'Hero', lines: [60, 40, 80, 30] },
  { name: 'pricing-003', category: 'Pricing', lines: [50, 70, 50, 70] },
  { name: 'nav-002', category: 'Nav', lines: [90, 20, 20, 20] },
  { name: 'dashboard-005', category: 'Dashboard', lines: [40, 60, 80, 40] },
  { name: 'features-004', category: 'Features', lines: [70, 30, 70, 30] },
  { name: 'footer-001', category: 'Footer', lines: [80, 50, 40, 60] },
] as const

export function ShadcnblocksPage({ library }: ShowcasePageProps) {
  return (
    <div className="shadcnblocks-showcase-container">
      <header className="shadcnblocks-showcase-header">
        <div className="shadcnblocks-showcase-header-top">
          <div>
            <span className="shadcnblocks-showcase-badge">{library.category}</span>
            <h1 className="shadcnblocks-showcase-title">{library.name}</h1>
            <p className="shadcnblocks-showcase-summary">{library.summary}</p>
          </div>
          <div className="shadcnblocks-showcase-install-box">
            <span className="shadcnblocks-showcase-install-label">Registry Install</span>
            <div className="shadcnblocks-showcase-code-snippet">
              <span className="shadcnblocks-showcase-code-prompt">$</span>
              <code>npx shadcn@latest add shadcnblocks/hero-001</code>
            </div>
          </div>
        </div>
        <div className="shadcnblocks-showcase-search-bar">
          <svg className="shadcnblocks-showcase-search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Search blocks and components...</span>
        </div>
      </header>

      <div className="shadcnblocks-showcase-body">
        <aside className="shadcnblocks-showcase-sidebar">
          <div className="shadcnblocks-showcase-sidebar-section">
            <span className="shadcnblocks-showcase-sidebar-title">Categories</span>
            <ul className="shadcnblocks-showcase-category-list">
              {BLOCK_CATEGORIES.map((cat) => (
                <li key={cat} className="shadcnblocks-showcase-category-item">
                  {cat}
                </li>
              ))}
            </ul>
          </div>

          <div className="shadcnblocks-showcase-sidebar-section">
            <span className="shadcnblocks-showcase-sidebar-title">Style Signals</span>
            <ul className="shadcnblocks-showcase-signal-list">
              {library.styleSignals.map((signal) => (
                <li key={signal} className="shadcnblocks-showcase-signal-item">
                  {signal}
                </li>
              ))}
            </ul>
          </div>

          <div className="shadcnblocks-showcase-sidebar-section">
            <span className="shadcnblocks-showcase-sidebar-title">Tech Stack</span>
            <ul className="shadcnblocks-showcase-tech-list">
              {library.technicalBase.map((tech) => (
                <li key={tech} className="shadcnblocks-showcase-tech-item">{tech}</li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="shadcnblocks-showcase-main">
          <div className="shadcnblocks-showcase-block-grid">
            {MOCK_BLOCKS.map((block) => (
              <div key={block.name} className="shadcnblocks-showcase-block-card">
                <div className="shadcnblocks-showcase-wireframe" aria-hidden="true">
                  {block.lines.map((width, i) => (
                    <div
                      key={i}
                      className="shadcnblocks-showcase-wireframe-line"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
                <div className="shadcnblocks-showcase-block-meta">
                  <span className="shadcnblocks-showcase-block-name">{block.name}</span>
                  <span className="shadcnblocks-showcase-block-category">{block.category}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="shadcnblocks-showcase-info-panels">
            <div className="shadcnblocks-showcase-panel">
              <h2 className="shadcnblocks-showcase-panel-title">Best For</h2>
              <ul className="shadcnblocks-showcase-pros-list">
                {library.bestFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="shadcnblocks-showcase-panel">
              <h2 className="shadcnblocks-showcase-panel-title">Avoid When</h2>
              <ul className="shadcnblocks-showcase-cons-list">
                {library.avoidWhen.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="shadcnblocks-showcase-brief-panel">
            <p>{library.pageBrief}</p>
          </div>

          <div className="shadcnblocks-showcase-registry-section">
            <h2 className="shadcnblocks-showcase-panel-title">Registry Install</h2>
            <div className="shadcnblocks-showcase-code-block">
              <div className="shadcnblocks-showcase-code-block-header">
                <span className="shadcnblocks-showcase-code-block-dot" aria-hidden="true" />
                <span className="shadcnblocks-showcase-code-block-dot" aria-hidden="true" />
                <span className="shadcnblocks-showcase-code-block-dot" aria-hidden="true" />
              </div>
              <pre className="shadcnblocks-showcase-code-block-body">
                <code>
                  <span className="shadcnblocks-showcase-code-comment"># Add any block via the shadcn registry</span>
                  {'\n'}
                  <span className="shadcnblocks-showcase-code-prompt">$</span> npx shadcn@latest add shadcnblocks/hero-001
                  {'\n'}
                  <span className="shadcnblocks-showcase-code-prompt">$</span> npx shadcn@latest add shadcnblocks/pricing-003
                  {'\n\n'}
                  <span className="shadcnblocks-showcase-code-comment"># Or copy the source directly from the directory</span>
                </code>
              </pre>
            </div>
          </div>

          <footer className="shadcnblocks-showcase-footer">
            <span className="shadcnblocks-showcase-footer-label">Resources</span>
            <div className="shadcnblocks-showcase-footer-links">
              {library.sourceLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shadcnblocks-showcase-footer-link"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
