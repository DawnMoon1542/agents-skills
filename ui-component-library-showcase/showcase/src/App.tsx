import { useMemo, useState } from 'react'
import { libraries, type LibraryId } from './data/libraries'
import { LibraryPage } from './pages/LibraryPage'

export default function App() {
  const [selectedId, setSelectedId] = useState<LibraryId>('shadcn-ui')

  const selectedLibrary = useMemo(() => {
    return libraries.find((library) => library.id === selectedId) ?? libraries[0]
  }, [selectedId])

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="组件库导航">
        <div>
          <p className="sidebar-kicker">Library Field Guide</p>
          <h2>UI 组件库风格图谱</h2>
        </div>
        <nav className="library-nav">
          {libraries.map((library) => (
            <button
              key={library.id}
              type="button"
              className={library.id === selectedLibrary.id ? 'nav-item active' : 'nav-item'}
              onClick={() => setSelectedId(library.id)}
            >
              {library.name}
            </button>
          ))}
        </nav>
      </aside>

      <section className="content-shell">
        <header className="overview-panel">
          <p className="overview-kicker">pnpm + React framework</p>
          <h1>八个组件库的页面框架</h1>
          <p>
            统一数据源承载组件库定位、适用场景、技术基础和页面风格提示。后续实现阶段可在保持数据契约不变的前提下，为每个组件库增强独立视觉页面。
          </p>
        </header>
        <LibraryPage library={selectedLibrary} />
      </section>
    </main>
  )
}
