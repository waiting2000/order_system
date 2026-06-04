import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { useWS } from './WSContext'

const MenuContext = createContext(null)

const API_BASE = '/api'

// 预设分类
export const CATEGORIES = ['荤菜', '素菜', '汤类', '主食', '凉菜', '海鲜', '小吃', '其他']

// 预设难度
export const DIFFICULTIES = ['简单', '中等', '困难']

// 创建空菜谱模板（表单用，id 由服务端生成）
export function createRecipe(data = {}) {
  return {
    name: '',
    category: '荤菜',
    image: '',
    description: '',
    ingredients: [],
    cookTime: 30,
    difficulty: '简单',
    ...data,
  }
}

export function MenuProvider({ children }) {
  const { token, user } = useAuth()
  const toast = useToast()
  const ws = useWS()
  const nickname = user?.nickname || ''

  const [recipes, setRecipes] = useState([])
  const [todayOrders, setTodayOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Helper: build authenticated headers
  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token])

  // 初始加载
  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [recipesRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/recipes`, { headers: authHeaders }),
        fetch(`${API_BASE}/orders`, { headers: authHeaders }),
      ])
      if (recipesRes.ok) {
        const recipesData = await recipesRes.json()
        setRecipes(recipesData)
      }
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setTodayOrders(ordersData)
      }
    } catch (err) {
      toast.error('加载数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }, [token, authHeaders])

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token, fetchData])

  // ======= WebSocket 事件监听（来自其他客户端的变更） =======
  useEffect(() => {
    if (!token) return

    const unsubs = [
      // 菜谱新增
      ws.on('recipe_added', (recipe) => {
        setRecipes(prev => {
          if (prev.some(r => r.id === recipe.id)) return prev
          return [recipe, ...prev]
        })
      }),
      // 菜谱更新
      ws.on('recipe_updated', (updated) => {
        setRecipes(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
        setTodayOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
      }),
      // 菜谱删除
      ws.on('recipe_deleted', ({ id }) => {
        setRecipes(prev => prev.filter(r => r.id !== id))
        setTodayOrders(prev => prev.filter(o => o.id !== id))
      }),
      // 点菜
      ws.on('order_added', (order) => {
        setTodayOrders(prev => {
          if (prev.some(o => o.order_id === order.order_id)) return prev
          return [...prev, order]
        })
      }),
      // 取消点菜
      ws.on('order_removed', ({ order_id }) => {
        setTodayOrders(prev => prev.filter(o => o.order_id !== order_id))
      }),
      // 清空菜单
      ws.on('orders_cleared', () => {
        setTodayOrders([])
      }),
    ]

    return () => unsubs.forEach(unsub => unsub())
  }, [token, ws])

  // -------- 菜谱 CRUD --------
  const addRecipe = useCallback(async (data) => {
    try {
      const res = await fetch(`${API_BASE}/recipes`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          image: data.image || '',
          description: data.description || '',
          ingredients: data.ingredients || [],
          cookTime: Number(data.cookTime) || 30,
          difficulty: data.difficulty || '简单',
        }),
      })
      if (!res.ok) throw new Error('添加失败')
      const recipe = await res.json()
      setRecipes(prev => [recipe, ...prev])
      toast.success(`「${recipe.name}」已添加`)
      return recipe
    } catch (err) {
      toast.error('添加菜谱失败，请重试')
      throw err
    }
  }, [authHeaders, toast])

  const updateRecipe = useCallback(async (id, data) => {
    try {
      const res = await fetch(`${API_BASE}/recipes/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          image: data.image,
          description: data.description,
          ingredients: data.ingredients,
          cookTime: data.cookTime != null ? Number(data.cookTime) : undefined,
          difficulty: data.difficulty,
        }),
      })
      if (!res.ok) throw new Error('更新失败')
      const updated = await res.json()
      setRecipes(prev => prev.map(r => r.id === id ? updated : r))
      toast.success(`「${updated.name}」已更新`)
    } catch (err) {
      toast.error('更新菜谱失败，请重试')
      throw err
    }
  }, [authHeaders, toast])

  const deleteRecipe = useCallback(async (id) => {
    try {
      const recipe = recipes.find(r => r.id === id)
      const res = await fetch(`${API_BASE}/recipes/${id}`, { method: 'DELETE', headers: authHeaders })
      if (!res.ok) throw new Error('删除失败')
      setRecipes(prev => prev.filter(r => r.id !== id))
      setTodayOrders(prev => prev.filter(o => o.id !== id))
      if (recipe) toast.success(`「${recipe.name}」已删除`)
    } catch (err) {
      toast.error('删除菜谱失败，请重试')
      throw err
    }
  }, [authHeaders, recipes, toast])

  // -------- 今日菜单 --------
  const toggleTodayMenu = useCallback(async (recipeId) => {
    const myOrder = todayOrders.find(o => o.id === recipeId && o.nickname === nickname)
    if (myOrder) {
      try {
        await fetch(`${API_BASE}/orders/${myOrder.order_id}`, {
          method: 'DELETE',
          headers: authHeaders,
        })
        setTodayOrders(prev => prev.filter(o => o.order_id !== myOrder.order_id))
      } catch {
        toast.error('取消点菜失败')
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ recipeId }),
        })
        if (res.status === 409) {
          toast.info('你已经点过这道菜了')
          return
        }
        if (!res.ok) throw new Error('点菜失败')
        const newOrder = await res.json()
        setTodayOrders(prev => [...prev, newOrder])
      } catch (err) {
        if (err.message !== '点菜失败') return
        toast.error('点菜失败，请重试')
      }
    }
  }, [todayOrders, nickname, authHeaders, toast])

  const isInTodayMenu = useCallback((recipeId) => {
    return todayOrders.some(o => o.id === recipeId && o.nickname === nickname)
  }, [todayOrders, nickname])

  const clearTodayMenu = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/orders`, { method: 'DELETE', headers: authHeaders })
      setTodayOrders([])
      toast.success('今日菜单已清空')
    } catch {
      toast.error('清空菜单失败')
    }
  }, [authHeaders, toast])

  // 已点菜谱（按菜品聚合）
  const todayRecipes = useMemo(() => {
    const groups = {}
    todayOrders.forEach(o => {
      const key = o.id
      if (!groups[key]) {
        groups[key] = { ...o, _nicknames: [], _orderIds: [] }
      }
      groups[key]._nicknames.push(o.nickname || '匿名')
      groups[key]._orderIds.push(o.order_id)
    })
    return Object.values(groups).sort((a, b) => {
      const ta = new Date(a.order_time || 0).getTime()
      const tb = new Date(b.order_time || 0).getTime()
      return tb - ta
    })
  }, [todayOrders])

  // -------- 食材清单 --------
  const shoppingList = useMemo(() => {
    const map = {}
    todayRecipes.forEach(recipe => {
      (recipe.ingredients || []).forEach(ing => {
        const name = ing.trim()
        if (!name) return
        if (!map[name]) {
          map[name] = { name, count: 1, dishes: [recipe.name] }
        } else {
          map[name].count++
          if (!map[name].dishes.includes(recipe.name)) {
            map[name].dishes.push(recipe.name)
          }
        }
      })
    })
    return Object.values(map).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [todayRecipes])

  // -------- 导出 --------
  const exportData = useCallback(() => {
    const data = { version: 1, exportedAt: new Date().toISOString(), recipes }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `家庭菜单_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    return data
  }, [recipes])

  // -------- 导入 --------
  const importData = useCallback(async (jsonData) => {
    if (!jsonData || !jsonData.recipes) {
      throw new Error('文件格式不正确，缺少菜谱数据')
    }
    const existingNames = new Set(recipes.map(r => r.name))
    const toImport = jsonData.recipes.filter(r => !existingNames.has(r.name))
    const skipped = jsonData.recipes.length - toImport.length

    let added = 0
    for (const r of toImport) {
      try {
        const res = await fetch(`${API_BASE}/recipes`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            name: r.name,
            category: r.category || '荤菜',
            image: r.image || '',
            description: r.description || '',
            ingredients: r.ingredients || [],
            cookTime: Number(r.cookTime) || 30,
            difficulty: r.difficulty || '简单',
          }),
        })
        if (res.ok) {
          const newRecipe = await res.json()
          setRecipes(prev => [newRecipe, ...prev])
          added++
        }
      } catch { /* skip failed */ }
    }
    if (added > 0) {
      toast.success(`成功导入 ${added} 道菜谱${skipped > 0 ? `（跳过 ${skipped} 道重复）` : ''}`)
    } else if (skipped > 0) {
      toast.info('所有菜谱已存在，无需导入')
    }
    return { added, skipped, total: jsonData.recipes.length }
  }, [recipes, authHeaders, toast])

  const value = {
    recipes,
    todayOrders,
    todayRecipes,
    loading,
    nickname,
    shoppingList,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleTodayMenu,
    isInTodayMenu,
    clearTodayMenu,
    exportData,
    importData,
  }

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within MenuProvider')
  return ctx
}
