import { useEffect } from 'react'

const CATEGORY_EMOJI = {
  '荤菜': '🥩', '素菜': '🥬', '汤类': '🥣',
  '主食': '🍚', '凉菜': '🥒', '海鲜': '🦐', '小吃': '🥟', '其他': '🍳',
}

export default function RecipeDetail({ recipe, onClose, onToggle, isInMenu }) {
  // 阻止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // 点击背景关闭
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  // ESC 关闭
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const ingredients = recipe.ingredients || []

  return (
    <>
      <style>{`
        @keyframes rd-backdrop-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rd-sheet-up    { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .rd-backdrop  { animation: rd-backdrop-in 0.25s ease-out forwards; }
        .rd-sheet     { animation: rd-sheet-up   0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards; }
      `}</style>

      {/* 背景遮罩 */}
      <div
        className="rd-backdrop fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={handleBackdrop}
      >
        {/* 底部弹出卡片 */}
        <div
          className="rd-sheet w-full sm:max-w-lg sm:rounded-3xl overflow-hidden"
          style={{
            background: 'var(--bg)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 图片区域 */}
          <div
            className="relative w-full shrink-0"
            style={{
              background: 'var(--surface-hover)',
              aspectRatio: '16 / 10',
              maxHeight: '320px',
            }}
          >
            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-full object-cover"
                onError={e => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div
              className="w-full h-full items-center justify-center text-6xl"
              style={{ display: recipe.image ? 'none' : 'flex' }}
            >
              {CATEGORY_EMOJI[recipe.category] || '🍽️'}
            </div>

            {/* 顶部按钮 */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* 分类标签 */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(8px)' }}
              >
                {CATEGORY_EMOJI[recipe.category]} {recipe.category}
              </span>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-20">
            {/* 标题行 */}
            <div className="flex items-start justify-between mb-1">
              <h2
                className="text-xl font-bold"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
              >
                {recipe.name}
              </h2>
            </div>

            {/* 元信息 */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="inline-flex items-center gap-1 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>
                </svg>
                {recipe.cookTime} 分钟
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-tertiary)' }}/>
              <span
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                难度：{recipe.difficulty}
              </span>
            </div>

            {/* 食材清单 */}
            {ingredients.length > 0 && (
              <div className="mb-4">
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-2.5"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  食材
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-sm"
                      style={{
                        background: 'var(--surface-hover)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 备注 / 做法 */}
            {recipe.description && (
              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-2.5"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  备注
                </h3>
                <p
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {recipe.description}
                </p>
              </div>
            )}

            {/* 空状态 */}
            {ingredients.length === 0 && !recipe.description && (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  暂无更多信息
                </p>
              </div>
            )}
          </div>

          {/* 底部操作栏 */}
          <div
            className="shrink-0 px-5 py-4"
            style={{
              borderTop: '1px solid var(--border-light)',
              background: 'var(--bg)',
            }}
          >
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-colors"
                style={{
                  background: 'var(--surface-hover)',
                  color: 'var(--text-primary)',
                }}
              >
                关闭
              </button>
              <button
                onClick={() => onToggle?.(recipe.id)}
                className="flex-[1.5] py-3 rounded-2xl text-sm font-medium transition-all duration-200"
                style={isInMenu ? {
                  background: 'var(--success-light)',
                  color: 'var(--success)',
                } : {
                  background: 'var(--accent)',
                  color: '#fff',
                }}
              >
                {isInMenu ? '取消点菜' : '加入今日菜单'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
