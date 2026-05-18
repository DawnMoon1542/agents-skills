import type { CSSProperties } from 'react'
import type { ShowcasePageProps } from './types'

export function MaterialUiPage({ library }: ShowcasePageProps) {
  return (
    <article className="mui-showcase-root" style={{ '--mui-primary': library.accent } as CSSProperties}>
      <header className="mui-showcase-appbar">
        <div className="mui-showcase-appbar-title">
          <div className="mui-showcase-menu-icon"><span></span></div>
          <h1>{library.name}</h1>
        </div>
        <div className="mui-showcase-appbar-actions">
          {library.technicalBase.map(tech => (
            <span key={tech} className="mui-showcase-chip">{tech}</span>
          ))}
        </div>
      </header>
      
      <main className="mui-showcase-content">
        <div className="mui-showcase-paper mui-showcase-hero">
          <h2>{library.category}</h2>
          <p>{library.summary}</p>
          <div className="mui-showcase-actions">
            {library.sourceLinks.map((link, index) => (
              <a 
                key={link.url} 
                href={link.url} 
                target="_blank" 
                rel="noreferrer" 
                className={`mui-showcase-button ${index === 0 ? 'mui-showcase-button-contained' : 'mui-showcase-button-outlined'}`}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mui-showcase-grid">
          <div className="mui-showcase-paper">
            <h3>适合场景</h3>
            <ul className="mui-showcase-list">
              {library.bestFor.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
          
          <div className="mui-showcase-paper">
            <h3>避免场景</h3>
            <ul className="mui-showcase-list">
              {library.avoidWhen.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>

        <div className="mui-showcase-paper mui-showcase-preview">
          <div className="mui-showcase-preview-header">
            <h3>企业级应用预览</h3>
            <p className="mui-showcase-caption">{library.pageBrief}</p>
          </div>
          
          <div className="mui-showcase-preview-layout">
            <div className="mui-showcase-form">
              <div className="mui-showcase-textfield">
                <label>表单标题</label>
                <div className="mui-showcase-input-box" tabIndex={0}>
                  <span>输入配置内容</span>
                </div>
              </div>
              <div className="mui-showcase-textfield">
                <label>选择类别</label>
                <div className="mui-showcase-input-box" tabIndex={0}>
                  <span>管理系统</span>
                  <span className="mui-showcase-arrow"></span>
                </div>
              </div>
              <div className="mui-showcase-form-actions">
                <button className="mui-showcase-button mui-showcase-button-text">取消</button>
                <button className="mui-showcase-button mui-showcase-button-contained">保存</button>
              </div>
            </div>
            
            <div className="mui-showcase-datatable">
              <div className="mui-showcase-table-header">
                <span>风格特征</span>
                <span>状态</span>
                <span></span>
              </div>
              {library.styleSignals.map((signal) => (
                <div key={signal} className="mui-showcase-table-row">
                  <span>{signal}</span>
                  <span className="mui-showcase-status">生效</span>
                  <span className="mui-showcase-action-icon"><span></span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </article>
  )
}
