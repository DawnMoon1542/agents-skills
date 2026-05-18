import type { CSSProperties } from 'react'
import type { LibraryProfile } from '../../data/libraries'

type LibraryLayoutProps = {
  library: LibraryProfile
}

export function LibraryLayout({ library }: LibraryLayoutProps) {
  return (
    <article className={`library-page tone-${library.visualTone}`} style={{ '--accent': library.accent } as CSSProperties}>
      <section className="hero-panel">
        <div className="eyebrow">{library.category}</div>
        <h1>{library.name}</h1>
        <p className="summary">{library.summary}</p>
        <div className="signal-row" aria-label={`${library.name} 风格特征`}>
          {library.styleSignals.map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      </section>

      <section className="detail-grid" aria-label={`${library.name} 选型信息`}>
        <div className="detail-panel best-for">
          <h2>适合</h2>
          <ul>
            {library.bestFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="detail-panel avoid-when">
          <h2>不适合</h2>
          <ul>
            {library.avoidWhen.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="detail-panel technical-base">
          <h2>技术基础</h2>
          <div className="tech-list">
            {library.technicalBase.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="detail-panel page-brief">
          <h2>页面风格提示</h2>
          <p>{library.pageBrief}</p>
        </div>
      </section>

      <section className="source-panel" aria-label={`${library.name} 来源`}>
        <h2>调研来源</h2>
        <div className="source-links">
          {library.sourceLinks.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </article>
  )
}
