import type { ShowcasePageProps } from './types'

export function ShadcnUiPage({ library }: ShowcasePageProps) {
  return (
    <article className="shadcn-showcase-container" aria-label={`${library.name} showcase`}>
      <section className="shadcn-showcase-hero">
        <h1 className="shadcn-showcase-title">{library.name}</h1>
        <p className="shadcn-showcase-subtitle">{library.summary}</p>
        <div className="shadcn-showcase-cli-mock">
          <span className="shadcn-showcase-cli-prompt">$</span>
          <span>npx shadcn@latest add button</span>
        </div>
      </section>

      <section className="shadcn-showcase-grid">
        <div className="shadcn-showcase-card">
          <h3>定位与场景</h3>
          <p>{library.category}</p>
          <ul className="shadcn-showcase-primitive-list">
            {library.bestFor.map((item) => (
              <li key={item} className="shadcn-showcase-primitive-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="shadcn-showcase-card">
          <h3>技术堆栈</h3>
          <p>基于无头组件与实用类原子 CSS 构建，通过 CLI 工具注入源码。</p>
          <ul className="shadcn-showcase-primitive-list">
            {library.technicalBase.map((item) => (
              <li key={item} className="shadcn-showcase-primitive-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="shadcn-showcase-token-panel">
        <h3>设计变量 (Zinc)</h3>
        <div className="shadcn-showcase-token-grid">
          <div className="shadcn-showcase-token">
            <div className="shadcn-showcase-token-swatch" style={{ background: '#ffffff' }} />
            <span className="shadcn-showcase-token-label">--background</span>
          </div>
          <div className="shadcn-showcase-token">
            <div className="shadcn-showcase-token-swatch" style={{ background: '#f4f4f5' }} />
            <span className="shadcn-showcase-token-label">--muted</span>
          </div>
          <div className="shadcn-showcase-token">
            <div className="shadcn-showcase-token-swatch" style={{ background: '#e4e4e7' }} />
            <span className="shadcn-showcase-token-label">--border</span>
          </div>
          <div className="shadcn-showcase-token">
            <div className="shadcn-showcase-token-swatch" style={{ background: '#09090b' }} />
            <span className="shadcn-showcase-token-label">--foreground</span>
          </div>
        </div>
      </section>

      <footer className="shadcn-showcase-footer">
        {library.sourceLinks.map((link, index) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className={index === 0 ? 'shadcn-showcase-link shadcn-showcase-link-primary' : 'shadcn-showcase-link shadcn-showcase-link-secondary'}
          >
            {link.label}
          </a>
        ))}
      </footer>
    </article>
  )
}
