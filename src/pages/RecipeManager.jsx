import { useState, useRef } from 'react'
import { useMenu, CATEGORIES, DIFFICULTIES, createRecipe } from '../context/MenuContext'

export default function RecipeManager() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, exportData, importData } = useMenu()
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('全部')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const filtered = recipes.filter(r => {
    if (filterCategory !== '全部' && r.category !== filterCategory) return false
    if (search && !r.name.includes(search) && !r.description.includes(search)) return false
    return true
  })

  const handleAdd = () => {
    setEditingRecipe(createRecipe())
    setShowForm(true)
  }

  const handleEdit = (recipe) => {
    setEditingRecipe({ ...recipe })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    deleteRecipe(id)
    setDeleteConfirm(null)
  }

  const handleSave = (data) => {
    if (editingRecipe.id && recipes.find(r => r.id === editingRecipe.id)) {
      updateRecipe(editingRecipe.id, data)
    } else {
      addRecipe(data)
    }
    setShowForm(false)
    setEditingRecipe(null)
  }

  const handleExport = () => {
    exportData()
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const result = importData(data)
        setImportResult(result)
        setTimeout(() => setImportResult(null), 4000)
      } catch (err) {
        setImportResult({ error: err.message || '导入失败，请检查文件格式' })
        setTimeout(() => setImportResult(null), 5000)
      }
    }
    reader.readAsText(file)
    // 清空 input 以便重复选择同一文件
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      {/* 导入导出 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导出
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          导入
        </button>
        {importResult && (
          <div
            className="flex-1 px-3 py-2.5 rounded-2xl text-sm font-medium animate-fade-in"
            style={importResult.error ? {
              background: 'var(--danger-light)',
              color: 'var(--danger)',
            } : {
              background: 'var(--success-light)',
              color: 'var(--success)',
            }}
          >
            {importResult.error || `导入了 ${importResult.added} 道新菜谱（跳过 ${importResult.skipped} 道重复）`}
          </div>
        )}
      </div>

      {/* 顶栏：搜索 + 筛选 + 添加 */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl"
          style={{
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="搜索菜谱"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <button
          onClick={handleAdd}
          className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-colors"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(212, 116, 60, 0.3)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {['全部', ...CATEGORIES].map(cat => {
          const count = cat === '全部' ? recipes.length : recipes.filter(r => r.category === cat).length
          if (count === 0 && cat !== '全部') return null
          const active = filterCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={active ? {
                background: 'var(--text-primary)',
                color: '#fff',
              } : {
                background: 'var(--surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* 菜谱列表 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-hover)' }}
          >
            <span className="text-3xl">📖</span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {search || filterCategory !== '全部' ? '没有找到匹配的菜谱' : '还没有菜谱，点 + 添加吧'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            共 {filtered.length} 道菜谱
          </p>
          {filtered.map(recipe => (
            <div
              key={recipe.id}
              className="flex items-center gap-4 p-4 rounded-2xl group"
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
                  <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {recipe.name}
                  </h3>
                  <span
                    className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                    }}
                  >
                    {recipe.category}
                  </span>
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {recipe.cookTime}分钟 · {recipe.difficulty}
                  {recipe.ingredients.length > 0 && ` · ${recipe.ingredients.slice(0, 3).join('、')}`}
                </p>
              </div>

              {/* 操作 */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(recipe)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteConfirm(recipe.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 弹窗 */}
      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingRecipe(null) }}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="删除菜谱"
          message={`确定要删除这道菜谱吗？此操作不可撤销。`}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

// ---- 表单 ----
function RecipeForm({ recipe, onSave, onClose }) {
  const imageFileRef = useRef(null)
  const [form, setForm] = useState({
    name: recipe.name || '',
    category: recipe.category || '荤菜',
    image: recipe.image || '',
    description: recipe.description || '',
    ingredientsText: (recipe.ingredients || []).join('、'),
    cookTime: recipe.cookTime || 30,
    difficulty: recipe.difficulty || '简单',
  })
  const [errors, setErrors] = useState({})
  const isEdit = recipe.id && recipe.name

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = '请输入菜名'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // 文件选择 → Canvas 压缩 → Base64
  const handleImageFile = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 限制原始文件 20MB
    if (file.size > 20 * 1024 * 1024) {
      setErrors({ image: '图片不能超过 20MB' })
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX_WIDTH = 800
        let { width, height } = img
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width)
          width = MAX_WIDTH
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.7)
        update('image', compressed)
      }
      img.onerror = () => setErrors({ image: '图片加载失败，请重试' })
      img.src = ev.target.result
    }
    reader.onerror = () => setErrors({ image: '图片读取失败，请重试' })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      name: form.name.trim(),
      category: form.category,
      image: form.image.trim(),
      description: form.description.trim(),
      ingredients: form.ingredientsText.split(/[、，,\s]+/).filter(Boolean),
      cookTime: Number(form.cookTime),
      difficulty: form.difficulty,
    })
  }

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(45, 42, 37, 0.4)', backdropFilter: 'blur(4px)' }}
      />
      <div
        className="relative bg-white w-full sm:max-w-md max-h-[85vh] flex flex-col sm:rounded-3xl rounded-t-3xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 -4px 32px rgba(45,42,37,0.12)' }}
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? '编辑菜谱' : '新菜谱'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              菜名
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="比如：红烧排骨"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                border: errors.name ? '1.5px solid var(--danger)' : '1.5px solid transparent',
              }}
              autoFocus
            />
            {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.name}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>分类</label>
              <select
                value={form.category}
                onChange={e => update('category', e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm outline-none appearance-none"
                style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1.5px solid transparent' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>难度</label>
              <select
                value={form.difficulty}
                onChange={e => update('difficulty', e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm outline-none appearance-none"
                style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1.5px solid transparent' }}
              >
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>时间</label>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
                <input
                  type="number"
                  value={form.cookTime}
                  onChange={e => update('cookTime', e.target.value)}
                  min="1" max="300"
                  className="w-full px-3 py-3 text-sm outline-none bg-transparent"
                  style={{ color: 'var(--text-primary)' }}
                />
                <span className="pr-3 text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>分钟</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              食材
            </label>
            <textarea
              value={form.ingredientsText}
              onChange={e => update('ingredientsText', e.target.value)}
              placeholder="用顿号或逗号分隔，比如：排骨、生抽、冰糖"
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                border: '1.5px solid transparent',
              }}
            />
            {form.ingredientsText && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.ingredientsText.split(/[、，,\s]+/).filter(Boolean).map((ing, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                    }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              描述 <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>(选填)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="简单介绍一下这道菜"
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                border: '1.5px solid transparent',
              }}
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              图片 <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>(选填)</span>
            </label>
            <div className="space-y-2">
              {/* 文件上传按钮 */}
              <input
                ref={imageFileRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageFileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text-secondary)',
                  border: '1.5px dashed var(--border-light)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                从手机/电脑选择照片
              </button>
              {/* URL 输入 */}
              <div className="flex items-center gap-2">
                <span className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>或输入链接</span>
                <input
                  type="text"
                  value={form.image && !form.image.startsWith('data:') ? form.image : ''}
                  onChange={e => update('image', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                    border: '1.5px solid transparent',
                  }}
                />
                {form.image && (
                  <button
                    type="button"
                    onClick={() => update('image', '')}
                    className="text-xs shrink-0 px-2 py-1 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    清除
                  </button>
                )}
              </div>
              {/* 预览 */}
              {form.image && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
                  <img src={form.image} alt="预览" className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 p-5 pt-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: 'var(--surface-hover)',
              color: 'var(--text-secondary)',
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            保存
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

// ---- 确认弹窗 ----
function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" onClick={onCancel}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(45, 42, 37, 0.4)' }}
      />
      <div
        className="relative w-full max-w-xs p-6 rounded-3xl"
        style={{
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: 'var(--surface-hover)',
              color: 'var(--text-secondary)',
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--danger)' }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}
