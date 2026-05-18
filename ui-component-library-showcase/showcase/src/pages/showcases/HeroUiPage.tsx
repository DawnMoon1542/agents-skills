import type { ShowcasePageProps } from './types'

export function HeroUiPage({ library }: ShowcasePageProps) {
  return (
    <article className="heroui-showcase-container" aria-label={`${library.name} showcase`}>
      <section className="heroui-showcase-header">
        <span className="heroui-showcase-eyebrow">{library.category}</span>
        <h1 className="heroui-showcase-title">{library.name}</h1>
        <p className="heroui-showcase-summary">{library.summary}</p>
        <div className="heroui-showcase-signals">
          {library.styleSignals.map((signal) => (
            <span key={signal} className="heroui-showcase-signal-tag">{signal}</span>
          ))}
        </div>
      </section>

      <section className="heroui-showcase-grid">
        <div className="heroui-showcase-card heroui-showcase-brief">
          <h3 className="heroui-showcase-card-title">页面定位</h3>
          <p className="heroui-showcase-brief-text">{library.pageBrief}</p>
        </div>

        <div className="heroui-showcase-card">
          <h3 className="heroui-showcase-card-title">适用场景</h3>
          <ul className="heroui-showcase-list">
            {library.bestFor.map((item) => (
              <li key={item} className="heroui-showcase-list-item best">{item}</li>
            ))}
          </ul>
        </div>

        <div className="heroui-showcase-card">
          <h3 className="heroui-showcase-card-title">不适合时</h3>
          <ul className="heroui-showcase-list">
            {library.avoidWhen.map((item) => (
              <li key={item} className="heroui-showcase-list-item avoid">{item}</li>
            ))}
          </ul>
        </div>

        <div className="heroui-showcase-card">
          <h3 className="heroui-showcase-card-title">技术基座</h3>
          <div className="heroui-showcase-tech">
            {library.technicalBase.map((tech) => (
              <span key={tech} className="heroui-showcase-tech-tag">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="heroui-showcase-footer">
        <h3 className="heroui-showcase-footer-title">资源链接</h3>
        <nav className="heroui-showcase-links" aria-label="external resources">
          {library.sourceLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="heroui-showcase-link"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </footer>
    </article>
  )
}
