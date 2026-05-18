import type { ShowcasePageProps } from './types'
import { ExternalLink, Layers, LayoutTemplate, MousePointerClick, Zap } from 'lucide-react'

export function TailarkUiPage({ library }: ShowcasePageProps) {
  return (
    <article className="tailark-showcase-container">
      {/* 现代营销非对称 Hero 区 */}
      <section className="tailark-hero">
        <div className="tailark-hero-content">
          <div className="tailark-badge">Marketing & Landing Pages</div>
          <h1 className="tailark-title">
            Build modern <span className="tailark-highlight">marketing sites</span> with shadcn blocks.
          </h1>
          <p className="tailark-subtitle">
            {library.summary}
          </p>
          <div className="tailark-hero-actions">
            <a href={library.sourceLinks[0]?.url} className="tailark-button-primary" target="_blank" rel="noreferrer">
              Explore Blocks
              <ExternalLink size={16} />
            </a>
            <a href={library.sourceLinks[1]?.url} className="tailark-button-secondary" target="_blank" rel="noreferrer">
              GitHub Repository
            </a>
          </div>
        </div>
        <div className="tailark-hero-visual">
          {/* 抽象产品插画/框架 */}
          <div className="tailark-abstract-browser">
            <div className="tailark-browser-header">
              <span className="tailark-dot close"></span>
              <span className="tailark-dot min"></span>
              <span className="tailark-dot max"></span>
            </div>
            <div className="tailark-browser-body">
              <div className="tailark-wireframe-nav"></div>
              <div className="tailark-wireframe-hero">
                <div className="tailark-wireframe-title"></div>
                <div className="tailark-wireframe-text"></div>
                <div className="tailark-wireframe-text short"></div>
                <div className="tailark-wireframe-button"></div>
              </div>
              <div className="tailark-wireframe-features">
                <div className="tailark-wireframe-box"></div>
                <div className="tailark-wireframe-box"></div>
                <div className="tailark-wireframe-box"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 高留白转化/特性介绍区 */}
      <section className="tailark-features-section">
        <div className="tailark-section-header">
          <h2>Designed for conversion.</h2>
          <p>Everything you need to launch SaaS landing pages, portfolios, and product sites.</p>
        </div>

        {/* Bento Feature Grid */}
        <div className="tailark-bento-grid">
          <div className="tailark-bento-card large">
            <div className="tailark-bento-icon">
              <LayoutTemplate size={24} />
            </div>
            <h3>Marketing Narratives</h3>
            <p>Pre-designed blocks structured for storytelling. From hero sections to pricing tables, organized to guide user conversion.</p>
            <div className="tailark-bento-visual marketing-visual">
              <div className="tailark-stack-item">Hero Section</div>
              <div className="tailark-stack-item">Social Proof</div>
              <div className="tailark-stack-item">Feature Grid</div>
              <div className="tailark-stack-item">Pricing</div>
            </div>
          </div>

          <div className="tailark-bento-card">
            <div className="tailark-bento-icon">
              <Layers size={24} />
            </div>
            <h3>shadcn/ui Foundation</h3>
            <p>Built directly on top of shadcn/ui and Tailwind CSS. Clean code you can copy, paste, and own completely.</p>
          </div>

          <div className="tailark-bento-card">
            <div className="tailark-bento-icon">
              <Zap size={24} />
            </div>
            <h3>Bento Layouts</h3>
            <p>Modern, asymmetric grid structures perfect for highlighting product features with high visual impact.</p>
          </div>

          <div className="tailark-bento-card wide">
            <div className="tailark-bento-icon">
              <MousePointerClick size={24} />
            </div>
            <div className="tailark-bento-wide-content">
              <div>
                <h3>When to choose Tailark UI?</h3>
                <ul className="tailark-checklist">
                  {library.bestFor.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="tailark-bento-divider"></div>
              <div>
                <h3 className="tailark-avoid-title">When to look elsewhere?</h3>
                <ul className="tailark-crosslist">
                  {library.avoidWhen.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 技术栈与底部 */}
      <section className="tailark-tech-footer">
        <div className="tailark-tech-stack">
          <span className="tailark-tech-label">Built with</span>
          {library.technicalBase.map(tech => (
            <span key={tech} className="tailark-tech-pill">{tech}</span>
          ))}
        </div>
      </section>
    </article>
  )
}
