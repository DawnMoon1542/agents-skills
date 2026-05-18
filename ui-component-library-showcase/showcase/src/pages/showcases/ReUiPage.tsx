import type { ShowcasePageProps } from './types'

export function ReUiPage({ library }: ShowcasePageProps) {
  return (
    <div className="reui-showcase-container">
      <header className="reui-showcase-header">
        <div className="reui-showcase-header-content">
          <div className="reui-showcase-brand">
            <span className="reui-showcase-logo-placeholder" aria-hidden="true" />
            <h1>{library.name}</h1>
            <span className="reui-showcase-badge">{library.category}</span>
          </div>
          <p className="reui-showcase-summary">{library.summary}</p>
        </div>
      </header>

      <div className="reui-showcase-layout">
        <aside className="reui-showcase-sidebar">
          <nav className="reui-showcase-nav">
            <div className="reui-showcase-nav-group">
              <span className="reui-showcase-nav-title">Components</span>
              <ul>
                <li className="reui-active">Data Grid</li>
                <li>Filters</li>
                <li>Kanban</li>
                <li>File Upload</li>
                <li>Sortable</li>
              </ul>
            </div>
            <div className="reui-showcase-nav-group">
              <span className="reui-showcase-nav-title">Technical Base</span>
              <ul className="reui-showcase-tags">
                {library.technicalBase.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </div>
          </nav>
        </aside>

        <main className="reui-showcase-main">
          <div className="reui-showcase-toolbar">
            <div className="reui-showcase-filter-bar">
              <div className="reui-showcase-search">Search components...</div>
              <button className="reui-showcase-filter-btn" type="button">Filter</button>
              <button className="reui-showcase-filter-btn" type="button">Sort</button>
            </div>
            <div className="reui-showcase-actions">
              <button className="reui-showcase-btn-primary" type="button">New View</button>
            </div>
          </div>

          <div className="reui-showcase-content-grid">
            <div className="reui-showcase-panel reui-showcase-grid-panel">
              <div className="reui-showcase-panel-header">
                <h3>Data Grid Overview</h3>
                <span className="reui-showcase-meta">Enterprise Density</span>
              </div>
              <div className="reui-showcase-table-mock">
                <div className="reui-showcase-th">
                  <span>Name</span>
                  <span>Status</span>
                  <span>Role</span>
                  <span>Last Active</span>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="reui-showcase-tr">
                    <div className="reui-showcase-td-name">
                      <div className="reui-showcase-avatar" aria-hidden="true" />
                      <div className="reui-showcase-user-info">
                        <span className="reui-showcase-user-name">User {i}</span>
                        <span className="reui-showcase-user-email">user{i}@example.com</span>
                      </div>
                    </div>
                    <div><span className="reui-showcase-status">Active</span></div>
                    <div>Developer</div>
                    <div>2h ago</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="reui-showcase-panel reui-showcase-kanban-panel">
              <div className="reui-showcase-panel-header">
                <h3>Kanban Preview</h3>
              </div>
              <div className="reui-showcase-kanban-board">
                <div className="reui-showcase-kanban-col">
                  <div className="reui-showcase-kanban-col-header">
                    To Do <span className="reui-showcase-count">2</span>
                  </div>
                  <div className="reui-showcase-kanban-card">Implement Filters</div>
                  <div className="reui-showcase-kanban-card">Sortable List</div>
                </div>
                <div className="reui-showcase-kanban-col">
                  <div className="reui-showcase-kanban-col-header">
                    In Progress <span className="reui-showcase-count">1</span>
                  </div>
                  <div className="reui-showcase-kanban-card">Data Grid Selection</div>
                </div>
              </div>
            </div>

            <div className="reui-showcase-panel">
              <div className="reui-showcase-panel-header">
                <h3>Suitability</h3>
              </div>
              <div className="reui-showcase-pros-cons">
                <div className="reui-showcase-pros">
                  <h4>Best For</h4>
                  <ul>
                    {library.bestFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="reui-showcase-cons">
                  <h4>Avoid When</h4>
                  <ul>
                    {library.avoidWhen.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="reui-showcase-panel">
              <div className="reui-showcase-panel-header">
                <h3>Style Signals & Links</h3>
              </div>
              <div className="reui-showcase-signals-list">
                {library.styleSignals.map((signal) => (
                  <div key={signal} className="reui-showcase-signal-item">
                    {signal}
                  </div>
                ))}
              </div>

              <div className="reui-showcase-links-area">
                {library.sourceLinks.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="reui-showcase-link">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
