import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage({ onBack }) {
  const { user, token, logout } = useAuth()
  const me = user?.nickname || user?.username || '我'

  const [profile, setProfile] = useState(null)
  const [versionLogs, setVersionLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // 构建认证请求头
  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token])

  /** 通用 API 调用封装 */
  const apiCall = useCallback((path, opts = {}) => {
    return fetch(path, {
      headers: authHeaders,
      ...opts,
    }).then(r => r.json())
  }, [authHeaders])

  // 加载个人信息和版本日志
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [profileData, logsData] = await Promise.all([
        apiCall('/api/profile'),
        apiCall('/api/version-logs'),
      ])
      if (!profileData.error) setProfile(profileData)
      if (Array.isArray(logsData)) setVersionLogs(logsData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [apiCall])

  useEffect(() => { fetchData() }, [fetchData])

  // 格式化注册时间
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return dateStr.slice(0, 16) // "2026-06-01 12:00"
  }

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
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>我的</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-5 pb-8 space-y-6">
        {/* ---- 用户信息卡片 ---- */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* 头像 + 昵称 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              {me.slice(0, 2)}
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{profile?.nickname || me}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                @{profile?.username || user?.username}
              </p>
            </div>
          </div>

          {/* 信息条目 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>用户名</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{profile?.username || user?.username}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>昵称</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{profile?.nickname || me}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>注册时间</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(profile?.createdAt)}</span>
            </div>
          </div>

          {/* 饮食偏好摘要 */}
          {profile?.preferences && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>饮食偏好</p>
              <div className="flex flex-wrap gap-2">
                {profile.preferences.dietaryType ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                    {profile.preferences.dietaryType === 'vegetarian' ? '素食' :
                     profile.preferences.dietaryType === 'halal' ? '清真' :
                     profile.preferences.dietaryType}
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>未设置</span>
                )}
                {profile.preferences.allergies.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: '#FDF0F0', color: '#C75B5B' }}>
                    过敏：{profile.preferences.allergies.join('、')}
                  </span>
                )}
                {profile.preferences.dislikes.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: '#FFF8E1', color: '#BF360C' }}>
                    忌口：{profile.preferences.dislikes.join('、')}
                  </span>
                )}
                {!profile.preferences.dietaryType && profile.preferences.allergies.length === 0 && profile.preferences.dislikes.length === 0 && (
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>未设置特殊偏好</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---- 版本更新日志 ---- */}
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>更新日志</h2>
          {versionLogs.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>暂无更新记录</p>
          ) : (
            <div className="relative pl-6" style={{ borderLeft: '2px solid var(--border)' }}>
              {versionLogs.map((log, idx) => (
                <div key={log.id} className="relative pb-5 last:pb-0">
                  {/* 时间线圆点 */}
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full"
                    style={{
                      background: idx === 0 ? 'var(--accent)' : 'var(--border)',
                      border: idx === 0 ? '2px solid var(--accent-light)' : '2px solid var(--bg)',
                    }} />
                  {/* 版本信息 */}
                  <div className="rounded-xl p-4"
                    style={{
                      background: idx === 0 ? 'var(--accent-light)' : 'var(--surface)',
                      border: idx === 0 ? '1px solid rgba(212, 116, 60, 0.15)' : '1px solid var(--border)',
                    }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          background: idx === 0 ? 'var(--accent)' : 'var(--surface-hover)',
                          color: idx === 0 ? '#fff' : 'var(--text-secondary)',
                        }}>
                        {log.version}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{log.releaseDate}</span>
                    </div>
                    <ul className="space-y-1">
                      {log.changes.map((change, i) => (
                        <li key={i} className="text-sm flex items-start gap-1.5"
                          style={{ color: 'var(--text-secondary)' }}>
                          <span className="mt-[7px] w-1 h-1 rounded-full shrink-0"
                            style={{ background: 'var(--text-tertiary)' }} />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- 退出登录 ---- */}
        <div className="pt-2 pb-6">
          <button
            onClick={logout}
            className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            退出登录
          </button>
        </div>
      </main>
    </div>
  )
}
