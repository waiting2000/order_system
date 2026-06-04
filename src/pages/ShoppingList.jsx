import { useState } from 'react'
import { useMenu } from '../context/MenuContext'
import { useToast } from '../context/ToastContext'

export default function ShoppingList({ onGoMenu }) {
  const { shoppingList, todayRecipes } = useMenu()
  const [checked, setChecked] = useState({})
  const toast = useToast()

  const handleCopy = async () => {
    const unchecked = shoppingList.filter(i => !checked[i.name])
    const done = shoppingList.filter(i => checked[i.name])
    const lines = ['🛒 今日采购清单', '']
    if (unchecked.length > 0) {
      lines.push('--- 待采购 ---')
      unchecked.forEach(item => {
        lines.push(item.count > 1 ? `□ ${item.name} ×${item.count}` : `□ ${item.name}`)
      })
    }
    if (done.length > 0) {
      lines.push('')
      lines.push('--- 已备齐 ---')
      done.forEach(item => {
        lines.push(`✓ ${item.name}`)
      })
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('已复制采购清单到剪贴板')
    } catch {
      toast.error('复制失败，请手动选择复制')
    }
  }

  const toggleCheck = (name) => {
    setChecked(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const checkedCount = Object.values(checked).filter(Boolean).length
  const allDone = shoppingList.length > 0 && checkedCount === shoppingList.length

  if (shoppingList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'var(--surface-hover)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500 }}>采购清单是空的</p>
        <p className="mt-1 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
          去「菜单」里点几道菜，<br/>系统会自动汇总需要买的食材
        </p>
        <button
          onClick={onGoMenu}
          className="mt-5 px-6 py-2.5 rounded-2xl text-sm font-medium transition-colors"
          style={{
            background: 'var(--accent)',
            color: '#fff',
          }}
        >
          去点菜
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 进度 */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: allDone ? 'var(--success-light)' : 'var(--accent-light)',
          border: allDone ? '1px solid rgba(115, 157, 115, 0.15)' : '1px solid rgba(212, 116, 60, 0.12)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium" style={{ color: allDone ? 'var(--success)' : 'var(--accent)' }}>
            {allDone ? '🎉 全部备齐！' : '🛒 采购清单'}
          </p>
          <p className="text-xs font-medium" style={{ color: allDone ? 'var(--success)' : 'var(--text-secondary)' }}>
            {checkedCount}/{shoppingList.length} 项
          </p>
        </div>
        {/* 进度条 */}
        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--surface-hover)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(checkedCount / shoppingList.length) * 100}%`,
              background: allDone ? 'var(--success)' : 'var(--accent)',
            }}
          />
        </div>
        {!allDone && (
          <button
            onClick={() => {
              const newChecked = {}
              shoppingList.forEach(i => { newChecked[i.name] = true })
              setChecked(newChecked)
            }}
            className="mt-2 text-xs font-medium transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            一键标记全部完成
          </button>
        )}
        {allDone && (
          <button
            onClick={() => setChecked({})}
            className="mt-2 text-xs font-medium transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            重置清单
          </button>
        )}
        <button
          onClick={handleCopy}
          className="mt-2 ml-3 text-xs font-medium transition-colors inline-flex items-center gap-1"
          style={{ color: 'var(--accent)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          一键复制
        </button>
      </div>

      {/* 来源提示 */}
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        基于今日 {todayRecipes.length} 道菜品自动汇总
      </p>

      {/* 食材列表 */}
      <div className="space-y-1.5">
        {shoppingList.map(item => {
          const done = checked[item.name]
          return (
            <button
              key={item.name}
              onClick={() => toggleCheck(item.name)}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 text-left"
              style={{
                background: done ? 'var(--bg)' : 'var(--surface)',
                boxShadow: done ? 'none' : 'var(--shadow-sm)',
                opacity: done ? 0.55 : 1,
              }}
            >
              {/* 复选框 */}
              <div
                className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all`}
                style={done ? {
                  background: 'var(--success)',
                  border: '2px solid var(--success)',
                } : {
                  border: '2px solid var(--border)',
                  background: 'var(--surface)',
                }}
              >
                {done && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>

              {/* 食材名 */}
              <span
                className={`text-[15px] font-medium flex-1 ${done ? 'line-through' : ''}`}
                style={{ color: done ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
              >
                {item.name}
              </span>

              {/* 来源 */}
              <div className="flex items-center gap-1.5">
                {item.count > 1 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                  >
                    ×{item.count}
                  </span>
                )}
                <span className="text-[11px] truncate max-w-[120px]"
                  style={{ color: 'var(--text-tertiary)' }}
                  title={item.dishes.join('、')}
                >
                  {item.dishes.slice(0, 2).join('、')}
                  {item.dishes.length > 2 ? ` +${item.dishes.length - 2}` : ''}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
