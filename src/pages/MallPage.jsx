import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

// 商品分类选项
const CATEGORIES = [
  { key: '', label: '全部' },
  { key: '家务券', label: '家务券' },
  { key: '休闲券', label: '休闲券' },
  { key: '其他', label: '其他' },
]

export default function MallPage({ onBack }) {
  const { token } = useAuth()

  const [items, setItems] = useState([])
  const [records, setRecords] = useState([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [view, setView] = useState('shop') // shop | records
  const [selectedItem, setSelectedItem] = useState(null) // 详情弹窗
  const [redeeming, setRedeeming] = useState(false)

  // 构建认证请求头
  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token])

  /** 通用 API 调用封装 */
  const apiCall = useCallback((path, opts = {}) => {
    return fetch(path, { headers: authHeaders, ...opts }).then(r => r.json())
  }, [authHeaders])

  // 加载商品列表和积分
  const fetchItems = useCallback(async () => {
    const params = activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : ''
    const [itemsData, pointsData] = await Promise.all([
      apiCall(`/api/mall/items${params}`),
      apiCall('/api/mall/my-points'),
    ])
    if (Array.isArray(itemsData)) setItems(itemsData)
    if (pointsData?.points !== undefined) setPoints(pointsData.points)
  }, [apiCall, activeCategory])

  // 加载兑换记录
  const fetchRecords = useCallback(async () => {
    const data = await apiCall('/api/mall/records')
    if (Array.isArray(data)) setRecords(data)
  }, [apiCall])

  // 初始加载
  useEffect(() => {
    setLoading(true)
    Promise.all([fetchItems(), fetchRecords()]).finally(() => setLoading(false))
  }, [fetchItems, fetchRecords])

  // 分类切换时重新加载商品
  useEffect(() => {
    if (!loading) fetchItems()
  }, [activeCategory])

  // 兑换商品
  const handleRedeem = async (item) => {
    if (redeeming) return
    setRedeeming(true)
    try {
      const res = await apiCall('/api/mall/redeem', {
        method: 'POST',
        body: JSON.stringify({ itemId: item.id }),
      })
      if (res.error) {
        alert(res.error)
      } else {
        // 刷新积分和记录
        const [pointsData, recordsData, itemsData] = await Promise.all([
          apiCall('/api/mall/my-points'),
          apiCall('/api/mall/records'),
          apiCall(`/api/mall/items${activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : ''}`),
        ])
        if (pointsData?.points !== undefined) setPoints(pointsData.points)
        if (Array.isArray(recordsData)) setRecords(recordsData)
        if (Array.isArray(itemsData)) setItems(itemsData)
        setSelectedItem(null)
        alert('兑换成功！')
      }
    } catch (e) {
      alert('兑换失败，请重试')
    } finally {
      setRedeeming(false)
    }
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
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ color: 'var(--text-tertiary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>积分商城</h1>
          </div>
          {/* 积分展示 */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor" fontWeight="bold">$</text>
            </svg>
            {points}
          </div>
        </div>
      </header>

      {/* 视图切换 */}
      <div className="sticky top-14 z-20"
        style={{ background: 'rgba(249,246,240,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="max-w-2xl mx-auto px-5 h-11 flex items-center gap-1">
          <button
            onClick={() => setView('shop')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'shop' ? '' : ''
            }`}
            style={{
              background: view === 'shop' ? 'var(--accent)' : 'transparent',
              color: view === 'shop' ? '#fff' : 'var(--text-tertiary)',
            }}
          >
            商城
          </button>
          <button
            onClick={() => setView('records')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'records' ? '' : ''
            }`}
            style={{
              background: view === 'records' ? 'var(--accent)' : 'transparent',
              color: view === 'records' ? '#fff' : 'var(--text-tertiary)',
            }}
          >
            兑换记录
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-4 pb-8">
        {view === 'shop' && (
          <>
            {/* 分类筛选 */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0"
                  style={{
                    background: activeCategory === cat.key ? 'var(--accent)' : 'var(--surface)',
                    color: activeCategory === cat.key ? '#fff' : 'var(--text-secondary)',
                    border: activeCategory === cat.key ? '1px solid var(--accent)' : '1px solid var(--border)',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 商品列表 */}
            {items.length === 0 ? (
              <p className="text-sm text-center py-12" style={{ color: 'var(--text-tertiary)' }}>暂无商品</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {items.map(item => {
                  const canAfford = points >= item.points
                  const inStock = item.stock === -1 || item.stock > 0
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="text-left rounded-2xl p-4 transition-all duration-150 active:scale-95 tap-highlight"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {/* 商品图片 */}
                      <div className="w-full h-20 rounded-xl flex items-center justify-center text-4xl mb-3"
                        style={{ background: 'var(--bg)' }}>
                        {item.image || '🎁'}
                      </div>
                      {/* 商品名称 */}
                      <p className="text-sm font-bold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                      {/* 商品描述 */}
                      <p className="text-xs mb-2 truncate" style={{ color: 'var(--text-tertiary)' }}>{item.description}</p>
                      {/* 积分 & 库存 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold" style={{ color: canAfford ? 'var(--accent)' : 'var(--danger)' }}>
                          {item.points} 积分
                        </span>
                        <span className="text-xs" style={{ color: inStock ? 'var(--text-tertiary)' : 'var(--danger)' }}>
                          {item.stock === -1 ? '无限' : `库存 ${item.stock}`}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {view === 'records' && (
          <>
            {records.length === 0 ? (
              <p className="text-sm text-center py-12" style={{ color: 'var(--text-tertiary)' }}>暂无兑换记录</p>
            ) : (
              <div className="space-y-2">
                {records.map(record => (
                  <div key={record.id} className="rounded-xl p-4"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{record.itemName}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          {record.createdAt?.slice(0, 16)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                          -{record.pointsSpent} 积分
                        </span>
                        <p className="text-xs mt-0.5"
                          style={{ color: record.status === 'completed' ? '#4CAF50' : 'var(--text-tertiary)' }}>
                          {record.status === 'completed' ? '已完成' : record.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* 商品详情弹窗 */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedItem(null)}>
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/30" />
          {/* 弹窗内容 */}
          <div className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6"
            style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}>
            {/* 商品图片 */}
            <div className="w-full h-32 rounded-xl flex items-center justify-center text-5xl mb-4"
              style={{ background: 'var(--bg)' }}>
              {selectedItem.image || '🎁'}
            </div>
            {/* 商品名称 */}
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{selectedItem.name}</h2>
            {/* 商品描述 */}
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{selectedItem.description}</p>
            {/* 信息条 */}
            <div className="flex items-center gap-3 mb-5">
              <span className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                {selectedItem.points} 积分
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>
                {selectedItem.stock === -1 ? '无限库存' : `库存 ${selectedItem.stock}`}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>
                {selectedItem.category}
              </span>
            </div>
            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                取消
              </button>
              <button
                onClick={() => handleRedeem(selectedItem)}
                disabled={redeeming || points < selectedItem.points || (selectedItem.stock !== -1 && selectedItem.stock <= 0)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                }}
              >
                {redeeming ? '兑换中...' :
                 points < selectedItem.points ? '积分不足' :
                 (selectedItem.stock !== -1 && selectedItem.stock <= 0) ? '库存不足' :
                 '立即兑换'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
