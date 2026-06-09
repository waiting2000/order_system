import { useAuth } from '../context/AuthContext'

const APPS = [
  {
    key: 'menu',
    name: '点单',
    desc: '菜谱管理、每日点单、周计划',
    emoji: '🍽️',
    color: '#FDF3EA',
    border: '#F0C99A',
    accent: '#D4743C',
  },
  {
    key: 'notice',
    name: '备忘',
    desc: '家庭公告、个人待办事项',
    emoji: '📋',
    color: '#EBF5FF',
    border: '#AACFEE',
    accent: '#3A82C4',
  },
  {
    key: 'profile',
    name: '我的',
    desc: '个人信息、饮食偏好、版本更新日志',
    emoji: '👤',
    color: '#EDF5ED',
    border: '#A8D5A8',
    accent: '#739D73',
  },
]

export default function HomePage({ onOpenApp }) {
  const { user, logout } = useAuth()
  const nickname = user?.nickname || user?.username || '家人'
  const hour = new Date().getHours()
  const greeting = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* 顶部栏 */}
      <header
        className="sticky top-0 z-30 shrink-0"
        style={{
          background: 'rgba(249, 246, 240, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <h1
            className="text-lg font-bold tracking-tight select-none"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            家年华
          </h1>
          <button
            onClick={logout}
            className="text-xs transition-colors px-2 py-1 rounded-lg"
            style={{ color: 'var(--text-tertiary)' }}
          >
            退出
          </button>
        </div>
      </header>

      {/* 主区域 */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-8 pb-12">
        {/* 问候语 */}
        <div className="mb-8">
          <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {greeting}，{nickname}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>

        {/* 应用卡片 */}
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
          应用
        </p>
        <div className="grid grid-cols-2 gap-4">
          {APPS.map(app => (
            <button
              key={app.key}
              onClick={() => onOpenApp(app.key)}
              className="text-left rounded-2xl p-5 transition-all duration-150 active:scale-95 tap-highlight"
              style={{
                background: app.color,
                border: `1px solid ${app.border}`,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span className="text-3xl block mb-3">{app.emoji}</span>
              <p className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {app.name}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: app.accent }}>
                {app.desc}
              </p>
            </button>
          ))}
        </div>

        {/* 底部说明 */}
        <p className="text-center text-xs mt-10" style={{ color: 'var(--text-tertiary)' }}>
          家年华 · 家庭综合应用
        </p>
      </main>
    </div>
  )
}
