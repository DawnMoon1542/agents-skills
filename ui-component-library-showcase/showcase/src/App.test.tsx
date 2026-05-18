import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { libraries } from './data/libraries'

describe('组件库展示框架', () => {
  it('渲染八个组件库导航入口', () => {
    render(<App />)

    for (const library of libraries) {
      expect(screen.getByRole('button', { name: library.name })).toBeInTheDocument()
    }
  })

  it('切换组件库后展示对应页面说明', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'HeroUI' }))

    expect(screen.getByRole('heading', { level: 1, name: 'HeroUI' })).toBeInTheDocument()
    expect(screen.getAllByText(/React Aria/).length).toBeGreaterThan(0)
  })

  it('元数据包含八个唯一标识和必要内容', () => {
    const ids = new Set(libraries.map((library) => library.id))

    expect(libraries).toHaveLength(8)
    expect(ids.size).toBe(8)

    for (const library of libraries) {
      expect(library.bestFor.length).toBeGreaterThan(0)
      expect(library.avoidWhen.length).toBeGreaterThan(0)
      expect(library.styleSignals.length).toBeGreaterThan(0)
      expect(library.sourceLinks.length).toBeGreaterThan(0)
    }
  })
})
