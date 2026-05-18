import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ShowcasePageProps } from './types'

export function UiTripledPage({ library }: ShowcasePageProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div 
      className={`tripled-showcase-container ${mounted ? 'mounted' : ''}`} 
      style={{ '--accent': library.accent } as CSSProperties}
      aria-label={`${library.name} 风格页面`}
    >
      <section className="tripled-showcase-hero">
        <div className="tripled-showcase-badge">{library.category}</div>
        <h1 className="tripled-showcase-title">{library.name}</h1>
        <p className="tripled-showcase-summary">{library.summary}</p>
        <p className="tripled-showcase-brief">{library.pageBrief}</p>
        <div className="tripled-showcase-cta-group">
          <button className="tripled-showcase-btn-primary">Explore Components</button>
          <button className="tripled-showcase-btn-secondary">View Documentation</button>
        </div>
      </section>

      <section className="tripled-showcase-bento" aria-label={`${library.name} 选型信息`}>
        <div className="tripled-showcase-bento-card tripled-showcase-bento-wide">
          <h2 className="tripled-showcase-section-title">Design Philosophy</h2>
          <div className="tripled-showcase-signals" aria-label={`${library.name} 风格特征`}>
            {library.styleSignals.map((signal, idx) => (
              <div 
                key={signal} 
                className="tripled-showcase-signal-item" 
                style={{ '--stagger': idx } as CSSProperties}
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
        <div className="tripled-showcase-bento-card technical-base">
          <h2 className="tripled-showcase-section-title">技术基础</h2>
          <ul className="tripled-showcase-tech-list">
            {library.technicalBase.map((tech) => (
              <li key={tech} className="tripled-showcase-tech-item">{tech}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="tripled-showcase-pricing">
        <div className="tripled-showcase-pricing-tier pricing-pro best-for">
          <div className="tripled-showcase-tier-header">
            <h2>适合</h2>
            <span className="tripled-showcase-tier-badge">Recommended</span>
          </div>
          <ul className="tripled-showcase-feature-list">
            {library.bestFor.map((item) => (
              <li key={item} className="tripled-showcase-feature-item">
                <span className="tripled-showcase-check">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="tripled-showcase-pricing-tier pricing-free avoid-when">
          <div className="tripled-showcase-tier-header">
            <h2>不适合</h2>
          </div>
          <ul className="tripled-showcase-feature-list">
            {library.avoidWhen.map((item) => (
              <li key={item} className="tripled-showcase-feature-item">
                <span className="tripled-showcase-cross">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="tripled-showcase-bottom-cta source-panel" aria-label={`${library.name} 来源`}>
        <h2 className="tripled-showcase-cta-title">调研来源</h2>
        <div className="tripled-showcase-links">
          {library.sourceLinks.map((link) => (
            <a 
              key={link.url} 
              href={link.url} 
              target="_blank" 
              rel="noreferrer" 
              className="tripled-showcase-link-card"
            >
              <span className="tripled-showcase-link-label">{link.label}</span>
              <span className="tripled-showcase-link-arrow">→</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
