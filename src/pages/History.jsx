import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const DIFF_EMOJI = { '简单': '🟢', '中等': '🟡', '困难': '🔴' }

export default function History() {
  const { token } = useAuth()
  const toast = useToast()

  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDate, setExpandedDate] = useState(null)
  const [dateOrders, setDateOrders] = useState({})
  const [loadingDate, setLoadingDate] = useState(null)

  const authHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token])

  // 加载日期列表
  const loadDates = useCallback(async () => {
    try {
      const res = await fetch('/api/history/dates', authHeaders)
      if (res.ok) {
        const data = await res.json()
        setDates(data)
      }
    } catch {
      toast.error('加载历史记录失败')
    } finally {
      setLoading(false)
    }
  }, [authHeaders, toast])

  useEffect(() => {
    if (token) loadDates()
  }, [token, loadDates])

  // 展开/折叠
  const toggleDate = useCallback(async (date) => {
    if (expandedDate === date) {
      setExpandedDate(null)
      return
    }
    setExpandedDate(date)
    if (dateOrders[date]) return

    setLoadingDate(date)
    try {
      const res = await fetch(`/api/history/${date}`, authHeaders)
      if (res.ok) {
        const orders = await res.json()
        setDateOrders(prev => ({ ...prev, [date]: orders }))
      }
    } catch {
      toast.error('加载当日记录失败')
    } finally {
      setLoadingDate(null)
    }
  }, [expandedDate, dateOrders, authHeaders, toast])

  // 按菜品聚合（多人可能点同一道菜）
  const getGrouped = useCallback((orders) => {
    const groups = {}
    ;(orders || []).forEach(o => {
      const key = o.id
      if (!groups[key]) {
        groups[key] = { ...o, _nicknames: [] }
      }
      groups[key]._nicknames.push(o.nickname || '匿名')
    })
    return Object.values(groups)
  }, [])

  // 格式化日期
  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date(); today.setHours(0,0,0,0)
    const target = new Date(d); target.setHours(0,0,0,0)
    const diff = Math.round((today - target) / 86400000)
    const weekday = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]
    if (diff === 0) return `今天  ${dateStr}  ${weekday}`
    if (diff === 1) return `昨天  ${dateStr}  ${weekday}`
    if (diff === 2) return `前天  ${dateStr}  ${weekday}`
    return `${dateStr}  ${weekday}`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-tertiary)' }}>
        <div className="flex gap-1.5 mb-3">
          {[0,1,2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce"
              style={{ background: 'var(--accent)', animationDelay: `${i*0.15}s`, opacity: 0.6 }} />
          ))}
        </div>
        <span className="text-sm">加载中...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          历史记录
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          查看过往的点菜记录
        </p>
      </div>

      {dates.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>暂无历史记录</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            点过菜之后这里会显示历史
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dates.map(date => {
            const isExpanded = expandedDate === date
            const orders = dateOrders[date] || []
            const grouped = isExpanded ? getGrouped(orders) : []

            return (
              <div key={date}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: 'var(--surface)' }}
              >
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center justify-between px-5 py-4 transition-colors active:opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-lg transition-transform duration-200"
                      style={{ display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}
                    >▶</span>
                    <div className="text-left">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(date)}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {dateOrders[date] ? `${grouped.length} 道菜 · ${orders.length} 人次` : '点击查看详情'}
                      </div>
                    </div>
                  </div>
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
                  >
                    {loadingDate === date ? '⋯' : (dateOrders[date] ? grouped.length : '?')}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                    {loadingDate === date ? (
                      <div className="flex justify-center py-6">
                        <div className="flex gap-1">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                              style={{ background: 'var(--accent)', animationDelay: `${i*0.15}s`, opacity: 0.5 }} />
                          ))}
                        </div>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="py-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        当天没有点菜记录
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 pt-3">
                        {grouped.map(item => (
                          <div key={item.id}
                            className="flex items-center gap-3 p-3 rounded-2xl"
                            style={{ background: 'var(--surface-hover)' }}
                          >
                            <div
                              className="shrink-0 w-11 h-11 rounded-xl bg-cover bg-center"
                              style={{
                                backgroundImage: item.image ? `url(${item.image})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                background: item.image ? undefined : 'var(--bg)',
                              }}
                            >
                              {!item.image && (
                                <div className="w-full h-full flex items-center justify-center text-base">
                                  {DIFF_EMOJI[item.difficulty] || '🍽️'}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {item.name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.category}</span>
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                  {DIFF_EMOJI[item.difficulty] || ''} {item.difficulty}
                                </span>
                              </div>
                              {item._nicknames?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {item._nicknames.map((nn, i) => (
                                    <span key={i}
                                      className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                                      style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                    >
                                      {nn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {item.cookTime}分
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
