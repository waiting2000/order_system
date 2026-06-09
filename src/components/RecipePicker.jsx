import { useState, useEffect, useMemo } from 'react';
import { CATEGORIES } from '../context/MenuContext';

const CATEGORY_EMOJI = {
  '荤菜': '🥩', '素菜': '🥬', '汤类': '🥣',
  '主食': '🍚', '凉菜': '🥒', '海鲜': '🦐', '小吃': '🥟', '其他': '🍳',
};

export default function RecipePicker({ recipes, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  const filtered = useMemo(() => {
    let result = activeCategory === '全部'
      ? recipes
      : recipes.filter(r => r.category === activeCategory);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [recipes, activeCategory, search]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = '' };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSelect = (recipe) => {
    onSelect(recipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(45, 42, 37, 0.35)', backdropFilter: 'blur(4px)' }} />
      <div
        className="relative bg-white w-full sm:max-w-md max-h-[80vh] flex flex-col sm:rounded-3xl rounded-t-3xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 -4px 32px rgba(45,42,37,0.12)' }}
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>选择菜谱</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ color: 'var(--text-tertiary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-5 py-3">
          <div className="relative">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索菜名..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
              autoFocus
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="shrink-0 px-5 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {['全部', ...CATEGORIES].map(cat => {
            const active = activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[12px] font-medium transition-all"
                style={active ? { background: 'var(--accent)', color: '#fff' } :
                  { background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <span className="text-3xl mb-3">🔍</span>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {search ? '没有找到匹配的菜谱' : '该分类下暂无菜谱'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(recipe => (
                <div key={recipe.id}
                  onClick={() => handleSelect(recipe)}
                  className="rounded-xl overflow-hidden cursor-pointer transition-all active:scale-[0.97]"
                  style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="relative w-full pt-[66%] overflow-hidden"
                    style={{ background: 'var(--surface-hover)' }}>
                    {recipe.image ? (
                      <img src={recipe.image} alt={recipe.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none' }} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">
                        {CATEGORY_EMOJI[recipe.category] || '🍽️'}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {recipe.name}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {recipe.cookTime}分钟 · {recipe.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
      `}</style>
    </div>
  );
}
