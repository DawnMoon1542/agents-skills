import type { ShowcasePageProps } from './types'

export function KokonutUiPage({ library }: ShowcasePageProps) {
  return (
    <div className="kokonut-showcase-container">
      <div className="kokonut-showcase-bg" />
      
      <div className="kokonut-showcase-header">
        <div className="kokonut-showcase-eyebrow">{library.category}</div>
        <h1 className="kokonut-showcase-title">{library.name}</h1>
        <p className="kokonut-showcase-summary">{library.summary}</p>
        
        <div className="kokonut-showcase-ai-input">
          <input type="text" placeholder="Describe the UI you want to generate..." readOnly />
          <button className="kokonut-showcase-ai-btn" aria-label="Generate">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <button className="kokonut-showcase-particle-btn">
        Interact with Motion
      </button>

      <div className="kokonut-showcase-grid">
        <div className="kokonut-showcase-card">
          <h3>适合场景</h3>
          <ul className="kokonut-showcase-list">
            {library.bestFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        
        <div className="kokonut-showcase-card">
          <h3>不适合</h3>
          <ul className="kokonut-showcase-list">
            {library.avoidWhen.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="kokonut-showcase-card kokonut-showcase-card-full">
          <h3>技术与风格</h3>
          <div className="kokonut-showcase-tech">
            {library.technicalBase.map((tech) => (
              <span key={tech} className="kokonut-showcase-tech-tag">{tech}</span>
            ))}
            {library.styleSignals.map((signal) => (
              <span key={signal} className="kokonut-showcase-tech-tag kokonut-showcase-signal-tag">{signal}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="kokonut-showcase-footer">
        {library.sourceLinks.map((link) => (
          <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="kokonut-showcase-link">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
