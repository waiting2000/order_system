import { useState, useEffect } from 'react'

const CATEGORY_EMOJI = {
  '荤菜': '🥩', '素菜': '🥬', '汤类': '🥣',
  '主食': '🍚', '凉菜': '🥒', '海鲜': '🦐', '小吃': '🥟', '其他': '🍳',
}

export default function ShareRecipe() {
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const match = window.location.pathname.match(/^\/share\/([a-f0-9]+)/)
    if (!match) {
      setError('无效的分享链接')
      setLoading(false)
      return
    }
    const token = match[1]
    fetch(`/api/shared/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('分享链接无效或已过期')
        return res.json()
      })
      .then(data => {
        setRecipe(data)
        document.title = `${data.name} - 家庭点菜分享`
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex gap-1.5 mb-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce"
              style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s`, opacity: 0.6 }} />
          ))}
        </div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>加载中...</p>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: 'var(--bg)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--surface-hover)' }}>
          <span className="text-3xl">🔗</span>
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{error || '菜谱不存在'}</p>
      </div>
    )
  }

  const ingredients = recipe.ingredients || []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* 顶部 */}
      <header className="sticky top-0 z-30 shrink-0"
        style={{ background: 'rgba(249, 246, 240, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>菜谱分享</h1>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            来自「今天吃什么」
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-5 pt-5 pb-10">
        {/* 图片 */}
        <div className="rounded-2xl overflow-hidden mb-5"
          style={{ background: 'var(--surface-hover)', aspectRatio: '16/10' }}>
          {recipe.image ? (
            <img src={recipe.image} alt={recipe.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex' }} />
          ) : null}
          <div className="w-full h-full items-center justify-center text-5xl"
            style={{ display: recipe.image ? 'none' : 'flex' }}>
            {CATEGORY_EMOJI[recipe.category] || '🍽️'}
          </div>
        </div>

        {/* 标题 */}
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{recipe.name}</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>
            {CATEGORY_EMOJI[recipe.category]} {recipe.category}
          </span>
        </div>

        {/* 元信息 */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>⏱ {recipe.cookTime} 分钟</span>
          <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>难度：{recipe.difficulty}</span>
        </div>

        {/* 食材 */}
        {ingredients.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-tertiary)' }}>食材</h3>
            <div className="flex flex-wrap gap-1.5">
              {ingredients.map((ing, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg text-sm"
                  style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)' }}>
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 备注 */}
        {recipe.description && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-tertiary)' }}>备注</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {recipe.description}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
