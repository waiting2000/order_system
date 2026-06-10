import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { WSProvider, useWS } from './context/WSContext'
import { MenuProvider, useMenu } from './context/MenuContext'
import { PreferenceProvider } from './context/PreferenceContext'
import { PlanProvider } from './context/PlanContext'
import { VoteProvider } from './context/VoteContext'
import MenuBrowser from './pages/MenuBrowser'
import TodayMenu from './pages/TodayMenu'
import WeeklyPlan from './pages/WeeklyPlan'
import VotePage from './pages/VotePage'
import History from './pages/History'
import ShoppingList from './pages/ShoppingList'
import RecipeManager from './pages/RecipeManager'
import Login from './pages/Login'
import PreferenceDialog from './components/PreferenceDialog'
import HomePage from './pages/HomePage'
import NoticeBoard from './pages/NoticeBoard'
import ProfilePage from './pages/ProfilePage'
import MallPage from './pages/MallPage'
import ShareRecipe from './pages/ShareRecipe'

// 检查是否为分享链接
const isShareRoute = () => /^\/share\/[a-f0-9]+/.test(window.location.pathname)

// ---- 点单子应用 Tab 定义 ----
const MENU_TABS = [
  {
    key: 'browse', label: '菜单', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  },
  {
    key: 'today', label: '今日', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" />
      </svg>
    )
  },
  {
    key: 'plan', label: '计划', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" />
        <path d="M8 7V3" /><path d="M16 7V3" />
        <circle cx="8.5" cy="13" r="1" fill="currentColor" /><rect x="10" y="12" width="8" height="2" rx="1" fill="none" />
        <circle cx="8.5" cy="17" r="1" fill="currentColor" /><rect x="10" y="16" width="5" height="2" rx="1" fill="none" />
      </svg>
    )
  },
  {
    key: 'vote', label: '投票', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )
  },
  {
    key: 'history', label: '记录', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  },
  {
    key: 'shop', label: '采购', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    )
  },
  {
    key: 'manage', label: '菜谱', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    )
  },
]

// ---- 点单子应用（需要在 MenuProvider/WSProvider 内部使用 Hook）----
function MenuAppInner({ onBack }) {
  const [activeTab, setActiveTab] = useState('browse')
  const [showPreferenceDialog, setShowPreferenceDialog] = useState(false)
  const { todayRecipes, loading, nickname } = useMenu()
  const { user, logout } = useAuth()
  const { status: wsStatus } = useWS()
  const todayCount = todayRecipes.length

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce"
                style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s`, opacity: 0.6 }} />
            ))}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-30 shrink-0"
        style={{ background: 'rgba(249, 246, 240, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: 'var(--text-tertiary)' }} title="返回首页">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold tracking-tight select-none"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>今天吃什么</h1>
          </div>
          <div className="flex items-center gap-2">
            {todayCount > 0 && activeTab !== 'today' && (
              <button onClick={() => setActiveTab('today')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                已选 {todayCount} 道
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: { connected: '#4CAF50', connecting: '#FFB74D', disconnected: '#BDBDBD' }[wsStatus] || '#BDBDBD',
                    boxShadow: wsStatus === 'connected' ? '0 0 4px #4CAF5088' : 'none'
                  }} />
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                {nickname || user?.username || '用户'}
              </span>
              <button onClick={() => setShowPreferenceDialog(true)}
                className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              <button onClick={logout} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>退出</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 pt-4 pb-24">
        {activeTab === 'browse' && <MenuBrowser onGoToday={() => setActiveTab('today')} />}
        {activeTab === 'today' && <TodayMenu />}
        {activeTab === 'plan' && <WeeklyPlan />}
        {activeTab === 'vote' && <VotePage />}
        {activeTab === 'history' && <History />}
        {activeTab === 'shop' && <ShoppingList onGoMenu={() => setActiveTab('browse')} />}
        {activeTab === 'manage' && <RecipeManager />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-light)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-around h-16 px-2 pb-safe">
          {MENU_TABS.map(tab => {
            const active = activeTab === tab.key
            const hasBadge = tab.key === 'today' && todayCount > 0
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="relative flex flex-col items-center justify-center gap-0.5 w-full h-full select-none">
                <span className="transition-colors duration-150" style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                  {tab.icon}
                </span>
                <span className="text-[11px] font-medium transition-colors duration-150"
                  style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                  {tab.label}
                </span>
                {hasBadge && (
                  <span className="absolute top-1 right-1/4 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                    style={{ background: 'var(--accent)' }}>
                    {todayCount}
                  </span>
                )}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full" style={{ background: 'var(--accent)' }} />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {showPreferenceDialog && <PreferenceDialog onClose={() => setShowPreferenceDialog(false)} />}
    </div>
  )
}

// ---- Hub 主内容 ----
function AppContent() {
  const [currentApp, setCurrentApp] = useState(null) // null = Hub

  return (
    <>
      {currentApp === null && <HomePage onOpenApp={setCurrentApp} />}
      {currentApp === 'menu' && (
        <PreferenceProvider>
          <PlanProvider>
            <VoteProvider>
              <MenuProvider>
                <MenuAppInner onBack={() => setCurrentApp(null)} />
              </MenuProvider>
            </VoteProvider>
          </PlanProvider>
        </PreferenceProvider>
      )}
      {currentApp === 'notice' && (
        <NoticeBoard onBack={() => setCurrentApp(null)} />
      )}
      {currentApp === 'profile' && (
        <ProfilePage onBack={() => setCurrentApp(null)} />
      )}
      {currentApp === 'mall' && (
        <MallPage onBack={() => setCurrentApp(null)} />
      )}
    </>
  )
}

// ---- 认证门卫 ----
function AuthGate({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce"
              style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s`, opacity: 0.6 }} />
          ))}
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <Login />
  return <WSProvider>{children}</WSProvider>
}

// ---- 根入口 ----
export default function App() {
  if (isShareRoute()) return <ShareRecipe />
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGate>
          <AppContent />
        </AuthGate>
      </ToastProvider>
    </AuthProvider>
  )
}
