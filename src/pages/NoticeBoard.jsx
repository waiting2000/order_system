import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

function apiCall(path, opts = {}) {
  const token = localStorage.getItem('token')
  return fetch(path, {
    headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
    ...opts,
  }).then(r => r.json())
}

export default function NoticeBoard({ onBack }) {
  const { user } = useAuth()
  const me = user?.nickname || user?.username || '我'
  const [tab, setTab] = useState('public') // 'public' | 'todo'
  const [notices, setNotices] = useState([])
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [n, t] = await Promise.all([
        apiCall('/api/notices'),
        apiCall('/api/notices/todos'),
      ])
      setNotices(Array.isArray(n) ? n : [])
      setTodos(Array.isArray(t) ? t : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || submitting) return
    setSubmitting(true)
    try {
      const item = await apiCall('/api/notices', {
        method: 'POST',
        body: JSON.stringify({ content: input.trim(), type: tab }),
      })
      if (tab === 'public') setNotices(prev => [item, ...prev])
      else setTodos(prev => [item, ...prev])
      setInput('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(id) {
    const updated = await apiCall(`/api/notices/${id}/toggle`, { method: 'PATCH' })
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function handleDelete(id, type) {
    await apiCall(`/api/notices/${id}`, { method: 'DELETE' })
    if (type === 'public') setNotices(prev => prev.filter(n => n.id !== id))
    else setTodos(prev => prev.filter(t => t.id !== id))
  }

  const list = tab === 'public' ? notices : todos

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 shrink-0"
        style={{ background: 'rgba(249,246,240,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-2">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ color: 'var(--text-tertiary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>备忘</h1>
        </div>
      </header>

      {/* 切换 tab */}
      <div className="max-w-2xl mx-auto w-full px-5 pt-4">
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {[{ key: 'public', label: '家庭公告' }, { key: 'todo', label: '个人待办' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150"
              style={{
                background: tab === t.key ? 'var(--bg)' : 'transparent',
                color: tab === t.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: tab === t.key ? 'var(--shadow-sm)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 输入区 */}
      <div className="max-w-2xl mx-auto w-full px-5 pt-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={tab === 'public' ? '发布家庭公告...' : '添加待办事项...'}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button type="submit" disabled={submitting || !input.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: '#fff', opacity: submitting || !input.trim() ? 0.5 : 1 }}>
            发布
          </button>
        </form>
      </div>

      {/* 列表 */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-4 pb-8">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s`, opacity: 0.6 }} />
              ))}
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center pt-16" style={{ color: 'var(--text-tertiary)' }}>
            <p className="text-3xl mb-3">{tab === 'public' ? '📢' : '✅'}</p>
            <p className="text-sm">{tab === 'public' ? '还没有家庭公告' : '没有待办事项'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map(item => (
              <div key={item.id}
                className="flex items-start gap-3 px-4 py-3 rounded-xl transition-all"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {tab === 'todo' && (
                  <button onClick={() => handleToggle(item.id)}
                    className="mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center border-2 transition-all"
                    style={{ borderColor: item.done ? 'var(--success)' : 'var(--border)', background: item.done ? 'var(--success)' : 'transparent' }}>
                    {item.done && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 6 4.5 10 11 2" />
                      </svg>
                    )}
                  </button>
                )}
                {tab === 'public' && (
                  <span className="text-xl shrink-0 mt-0.5">📢</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed"
                    style={{ color: item.done ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.content}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {item.author} · {item.created_at?.slice(5, 16)}
                  </p>
                </div>
                {item.author === me && (
                  <button onClick={() => handleDelete(item.id, item.type)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
