import { useState, useEffect, useCallback } from 'react'
import { useMenu } from '../context/MenuContext'
import { useAuth } from '../context/AuthContext'
import { useVote } from '../context/VoteContext'
import { usePreferences } from '../context/PreferenceContext'
import RecipeDetail from '../components/RecipeDetail'
import VoteBanner from '../components/VoteBanner'
import AllergyBadge from '../components/AllergyBadge'

export default function TodayMenu() {
  const { todayRecipes, toggleTodayMenu, clearTodayMenu, nickname, isInTodayMenu } = useMenu()
  const { token } = useAuth()
  const { fetchVotes } = useVote()
  const { preferences, getAllergens } = usePreferences()
  const [detailRecipe, setDetailRecipe] = useState(null)
  const [todayPlan, setTodayPlan] = useState(null)

  // Fetch today's plan reminder
  const authHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token])

  useEffect(() => {
    if (!token) return
    fetch('/api/plans/today', authHeaders())
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.plan) {
          // Check if already in today's menu
          setTodayPlan(data.plan);
        } else {
          setTodayPlan(null);
        }
      })
      .catch(() => setTodayPlan(null));

    // Also refresh votes
    fetchVotes();
  }, [token, fetchVotes])

  // 统计：去除聚合后的重复计数
  const totalDishes = todayRecipes.reduce((sum, r) => sum + (r._nicknames?.length || 1), 0)
  const totalTime = todayRecipes.reduce((sum, r) => sum + (r.cookTime || 0), 0)

  if (todayRecipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'var(--surface-hover)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <polyline points="12 7 12 12 16 14"/>
          </svg>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500 }}>今天还没点菜</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          去「菜单」里选几道想吃的吧
        </p>
      </div>
    )
  }

  // 按点菜人分组统计（每人点了多少道菜）
  const personStats = {}
  todayRecipes.forEach(r => {
    (r._nicknames || []).forEach(name => {
      const n = name || '匿名'
      personStats[n] = (personStats[n] || 0) + 1
    })
  })

  return (
    <div className="space-y-6">
      {/* 今日计划提醒 */}
      {todayPlan && !todayRecipes.some(r => r.id === todayPlan.recipe_id) && (
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{
            background: 'var(--accent-light)',
            border: '1px solid rgba(212, 116, 60, 0.15)',
          }}
        >
          <span className="text-xl">📅</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              今天的计划是「{todayPlan.name}」
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              本周菜单计划中安排了这道菜，去「菜单」页找到它加入今日菜单吧
            </p>
            {todayPlan.ingredients?.length > 0 && (
              <AllergyBadge
                recipeIngredients={todayPlan.ingredients}
                userAllergies={preferences.allergies}
                compact
              />
            )}
          </div>
        </div>
      )}

      {/* 投票横幅 */}
      <VoteBanner />

      {/* 汇总卡片 */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'var(--accent-light)',
          border: '1px solid rgba(212, 116, 60, 0.12)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              今日菜单
            </p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {todayRecipes.length} 道 · {totalDishes} 人次
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>预计用时</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalTime}<span className="text-base font-normal" style={{ color: 'var(--text-secondary)' }}> 分钟</span>
            </p>
          </div>
        </div>

        {/* 点菜人汇总 */}
        {Object.keys(personStats).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {Object.entries(personStats).map(([name, count]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {name} · {count}道
              </span>
            ))}
          </div>
        )}

        <button
          onClick={clearTodayMenu}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{
            background: 'var(--surface)',
            color: 'var(--danger)',
            border: '1px solid var(--border)',
          }}
        >
          清空菜单
        </button>
      </div>

      {/* 菜品列表 */}
      <div className="space-y-2">
        {todayRecipes.map(recipe => (
          <div
            key={recipe.id}
            className="flex items-center gap-4 p-4 rounded-2xl transition-colors cursor-pointer active:scale-[0.99]"
            onClick={() => setDetailRecipe(recipe)}
            style={{
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* 图片 */}
            <div
              className="w-16 h-16 rounded-xl shrink-0 overflow-hidden"
              style={{ background: 'var(--surface-hover)' }}
            >
              {recipe.image ? (
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  🍽️
                </div>
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[15px] truncate" style={{ color: 'var(--text-primary)' }}>
                  {recipe.name}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                {recipe._nicknames?.map((n, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: n === nickname ? 'var(--accent)' : 'var(--accent-light)',
                      color: n === nickname ? '#fff' : 'var(--accent)',
                    }}
                  >
                    {n}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--success-light)',
                    color: 'var(--success)',
                  }}
                >
                  {recipe.category}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {recipe.cookTime}分钟
                </span>
              </div>
              {recipe.ingredients.length > 0 && (
                <>
                  <p className="text-xs mt-1.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                    {recipe.ingredients.slice(0, 5).join('、')}
                    {recipe.ingredients.length > 5 ? '...' : ''}
                  </p>
                  <AllergyBadge
                    recipeIngredients={recipe.ingredients}
                    userAllergies={preferences.allergies}
                    compact
                  />
                </>
              )}
            </div>

            {/* 移除按钮（仅操作自己的订单） */}
            {recipe._nicknames?.includes(nickname) ? (
              <button
                onClick={() => toggleTodayMenu(recipe.id)}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--danger-light)'
                  e.currentTarget.style.color = 'var(--danger)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            ) : (
              <div className="shrink-0 w-9 h-9" />
            )}
          </div>
        ))}
      </div>

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
