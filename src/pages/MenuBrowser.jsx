import { useState, useMemo } from 'react'
import { useMenu, CATEGORIES } from '../context/MenuContext'
import RecipeDetail from '../components/RecipeDetail'

const CATEGORY_EMOJI = {
  '荤菜': '🥩',
  '素菜': '🥬',
  '汤类': '🥣',
  '主食': '🍚',
  '凉菜': '🥒',
  '海鲜': '🦐',
  '小吃': '🥟',
  '其他': '🍳',
}

export default function MenuBrowser({ onGoToday }) {
  const { recipes, todayRecipes, toggleTodayMenu, isInTodayMenu } = useMenu()
  const [activeCategory, setActiveCategory] = useState('全部')
  const [search, setSearch] = useState('')
  const [detailRecipe, setDetailRecipe] = useState(null)

  const filtered = useMemo(() => {
    let result = activeCategory === '全部'
      ? recipes
      : recipes.filter(r => r.category === activeCategory)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      )
    }
    return result
  }, [recipes, activeCategory, search])

  const todayCount = todayRecipes.length

  return (
    <div className="space-y-5">
      {/* 今日点菜状态 */}
      {todayCount > 0 && (
        <button
          onClick={onGoToday}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors"
          style={{
            background: 'var(--accent-light)',
            border: '1px solid rgba(212, 116, 60, 0.12)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🕐</span>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                今日已选 {todayCount} 道菜
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                点击查看详情
              </p>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      {/* 搜索框 */}
      <div className="relative">
        <svg
          width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索菜名..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1.5px solid var(--border)',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* 分类标签 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {['全部', ...CATEGORIES].map(cat => {
          const count = cat === '全部' ? recipes.length : recipes.filter(r => r.category === cat).length
          if (count === 0 && cat !== '全部') return null
          const active = activeCategory === cat
          const emoji = cat === '全部' ? null : CATEGORY_EMOJI[cat]

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all select-none"
              style={active ? {
                background: 'var(--accent)',
                color: '#fff',
              } : {
                background: 'var(--surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {emoji && <span className="text-sm">{emoji}</span>}
              <span>{cat}</span>
              <span
                className="text-[11px] ml-0.5 opacity-70"
                style={{ color: active ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)' }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 菜品列表 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-hover)' }}
          >
            <span className="text-3xl">{search ? '🔍' : '🍳'}</span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {search ? `没有找到 "${search}" 相关的菜谱` : '该分类下还没有菜谱'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-2 text-xs"
              style={{ color: 'var(--accent)' }}
            >
              清除搜索
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(recipe => {
            const added = isInTodayMenu(recipe.id)
            return (
              <div
                key={recipe.id}
                className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98]"
                onClick={() => setDetailRecipe(recipe)}
                style={{
                  background: 'var(--surface)',
                  boxShadow: added ? '0 0 0 2px var(--accent), var(--shadow-md)' : 'var(--shadow-sm)',
                }}
              >
                {/* 图片 */}
                <div
                  className="relative w-full pt-[66%] overflow-hidden"
                  style={{ background: 'var(--surface-hover)' }}
                >
                  {recipe.image ? (
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-30">
                      {CATEGORY_EMOJI[recipe.category] || '🍽️'}
                    </div>
                  )}
                  {added && (
                    <div
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* 信息 */}
                <div className="p-3">
                  <h3
                    className="font-semibold text-sm truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {recipe.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 mb-2.5">
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {recipe.cookTime}分钟
                    </span>
                    {recipe.difficulty === '简单' && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }}/>
                    )}
                    {recipe.difficulty === '中等' && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#E8B44F' }}/>
                    )}
                    {recipe.difficulty === '困难' && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--danger)' }}/>
                    )}
                  </div>

                  {/* 点菜按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTodayMenu(recipe.id)
                    }}
                    className="w-full py-2 rounded-xl text-[13px] font-medium transition-all duration-200"
                    style={added ? {
                      background: 'var(--success-light)',
                      color: 'var(--success)',
                    } : {
                      background: 'var(--surface-hover)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {added ? '已加入' : '加入菜单'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 菜谱详情弹窗 */}
      {detailRecipe && (
        <RecipeDetail
          recipe={detailRecipe}
          onClose={() => setDetailRecipe(null)}
          onToggle={(id) => { toggleTodayMenu(id); setDetailRecipe(null) }}
          isInMenu={isInTodayMenu(detailRecipe.id)}
        />
      )}
    </div>
  )
}
