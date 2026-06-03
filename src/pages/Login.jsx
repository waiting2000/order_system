import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('请填写所有必填项')
      return
    }
    if (mode === 'register' && !nickname.trim()) {
      setError('请输入你的家庭昵称')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'register') {
        await register(username.trim(), password, nickname.trim(), remember)
      } else {
        await login(username.trim(), password, remember)
      }
    } catch (err) {
      setError(err.message || '操作失败，请重试')
      setSubmitting(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: 'var(--bg)' }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--accent-light)' }}
        >
          <span className="text-4xl">🍳</span>
        </div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          家庭点菜系统
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {mode === 'login' ? '欢迎回来' : '创建你的家庭账号'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm text-center"
            style={{
              background: 'var(--danger-light)',
              color: 'var(--danger)',
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            className="block text-[13px] font-semibold mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            用户名
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="用于登录的用户名"
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
            style={{
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1.5px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          />
        </div>

        <div>
          <label
            className="block text-[13px] font-semibold mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'register' ? '至少 4 个字符' : '输入密码'}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
            style={{
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1.5px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          />
        </div>

        {mode === 'register' && (
          <div>
            <label
              className="block text-[13px] font-semibold mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              家庭昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="比如：妈妈、爸爸、大宝"
              maxLength={10}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1.5px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </div>
        )}

        {/* Remember me */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--accent)]"
            style={{ accentColor: 'var(--accent)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            记住登录状态
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {submitting
            ? '请稍候...'
            : mode === 'login'
              ? '登录'
              : '注册并登录'}
        </button>

        <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={switchMode}
            className="ml-1 font-medium transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            {mode === 'login' ? '注册' : '登录'}
          </button>
        </p>
      </form>
    </div>
  )
}
