import { useState, useEffect } from 'react'
import { MenuProvider, useMenu } from './context/MenuContext'
import MenuBrowser from './pages/MenuBrowser'
import TodayMenu from './pages/TodayMenu'
import RecipeManager from './pages/RecipeManager'
import ShoppingList from './pages/ShoppingList'

const TABS = [
  { key: 'browse', label: '菜单', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )},
  { key: 'today', label: '今日', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <polyline points="12 7 12 12 16 14"/>
    </svg>
  )},
  { key: 'shop', label: '采购', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )},
  { key: 'manage', label: '菜谱', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  )},
]

function AppContent() {
  const [activeTab, setActiveTab] = useState('browse')
  const { todayRecipes, loading, nickname, updateNickname } = useMenu()
  const [showNickname, setShowNickname] = useState(false)

  const todayCount = todayRecipes.length

  // 首次打开 → 弹昵称设置
  useEffect(() => {
    if (!loading && !nickname) {
      setShowNickname(true)
    }
  }, [loading, nickname])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full animate-bounce"
                style={{
                  background: 'var(--accent)',
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            正在连接数据库...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* 顶部 */}
      <header
        className="sticky top-0 z-30 shrink-0"
        style={{
          background: 'rgba(249, 246, 240, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <h1
            className="text-lg font-bold tracking-tight select-none"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            今天吃什么
          </h1>
          <div className="flex items-center gap-2">
            {todayCount > 0 && activeTab !== 'today' && (
              <button
                onClick={() => setActiveTab('today')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                已选 {todayCount} 道
              </button>
            )}
            <button
              onClick={() => setShowNickname(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {nickname || '设置昵称'}
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 pt-4 pb-24">
        {activeTab === 'browse' && <MenuBrowser onGoToday={() => setActiveTab('today')} />}
        {activeTab === 'today' && <TodayMenu />}
        {activeTab === 'shop' && <ShoppingList onGoMenu={() => setActiveTab('browse')} />}
        {activeTab === 'manage' && <RecipeManager />}
      </main>

      {/* 底部导航 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-light)',
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-around h-16 px-2 pb-safe">
          {TABS.map(tab => {
            const active = activeTab === tab.key
            const hasBadge = tab.key === 'today' && todayCount > 0
            const hasShopBadge = tab.key === 'shop' && todayCount > 0
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex flex-col items-center justify-center gap-0.5 w-full h-full select-none"
              >
                <span
                  className="transition-colors duration-150"
                  style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}
                >
                  {tab.icon}
                </span>
                <span
                  className="text-[11px] font-medium transition-colors duration-150"
                  style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}
                >
                  {tab.label}
                </span>
                {hasBadge && (
                  <span
                    className="absolute top-1 right-1/4 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                    style={{ background: 'var(--accent)' }}
                  >
                    {todayCount}
                  </span>
                )}
                {hasShopBadge && !hasBadge && todayCount > 0 && (
                  <span
                    className="absolute top-1 right-1/4 w-[6px] h-[6px] rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* 昵称设置弹窗 */}
      {showNickname && (
        <NicknameModal
          current={nickname}
          onSave={(name) => {
            updateNickname(name)
            setShowNickname(false)
          }}
          onClose={() => setShowNickname(false)}
        />
      )}
    </div>
  )
}

// ---- 昵称设置弹窗 ----
function NicknameModal({ current, onSave, onClose }) {
  const [name, setName] = useState(current || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(45, 42, 37, 0.4)', backdropFilter: 'blur(4px)' }} />
      <div
        className="relative w-full max-w-xs p-6 rounded-3xl animate-slide-up"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full"
          style={{ background: 'var(--accent-light)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h3 className="text-base font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
          {current ? '修改昵称' : '欢迎加入家庭厨房'}
        </h3>
        <p className="text-xs text-center mb-4" style={{ color: 'var(--text-tertiary)' }}>
          设置你的昵称，方便家人知道你点了什么菜
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="比如：妈妈、爸爸、大宝..."
            maxLength={10}
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm outline-none text-center"
            style={{
              background: 'var(--bg)',
              color: 'var(--text-primary)',
              border: '1.5px solid var(--border)',
            }}
          />
          <div className="flex gap-3 mt-4">
            {current && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
              >
                取消
              </button>
            )}
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              确定
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <MenuProvider>
      <AppContent />
    </MenuProvider>
  )
}
