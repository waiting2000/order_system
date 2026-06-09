import { useState, useEffect } from 'react';
import { usePreferences } from '../context/PreferenceContext';

const DIETARY_TYPES = ['无限制', '素食', '纯素食', '清真', '低碳水', '生酮', '其他'];

export default function PreferenceDialog({ onClose }) {
  const { preferences, savePreferences } = usePreferences();

  const [allergies, setAllergies] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [dietaryType, setDietaryType] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAllergies(preferences.allergies || []);
    setDislikes(preferences.dislikes || []);
    setDietaryType(preferences.dietaryType || '');
  }, [preferences]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = '' };
  }, []);

  // ESC close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (val && !allergies.includes(val)) {
      setAllergies(prev => [...prev, val]);
    }
    setAllergyInput('');
  };

  const removeAllergy = (item) => {
    setAllergies(prev => prev.filter(a => a !== item));
  };

  const addDislike = () => {
    const val = dislikeInput.trim();
    if (val && !dislikes.includes(val)) {
      setDislikes(prev => [...prev, val]);
    }
    setDislikeInput('');
  };

  const removeDislike = (item) => {
    setDislikes(prev => prev.filter(d => d !== item));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePreferences({ allergies, dislikes, dietaryType });
      onClose();
    } catch {
      // Toast already shown
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e, addFn) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFn();
    }
  };

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
            饮食偏好设置
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 饮食类型 */}
          <div>
            <label className="block text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              饮食类型
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TYPES.map(type => {
                const active = dietaryType === type || (type === '无限制' && !dietaryType);
                return (
                  <button
                    key={type}
                    onClick={() => setDietaryType(type === '无限制' ? '' : type)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={active ? {
                      background: 'var(--accent)',
                      color: '#fff',
                    } : {
                      background: 'var(--bg)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 过敏食材 */}
          <div>
            <label className="block text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              过敏食材 <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>(温和提醒，不做限制)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={allergyInput}
                onChange={e => setAllergyInput(e.target.value)}
                onKeyDown={e => handleKeyDown(e, addAllergy)}
                placeholder="输入食材名后回车添加"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  border: '1.5px solid transparent',
                }}
              />
              <button
                onClick={addAllergy}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                添加
              </button>
            </div>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: '#FFF3E0',
                      color: '#E65100',
                      border: '1px solid #FFE0B2',
                    }}
                  >
                    {item}
                    <button onClick={() => removeAllergy(item)} className="ml-0.5 hover:opacity-70">&times;</button>
                  </span>
                ))}
              </div>
            )}
            {allergies.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>未添加过敏食材</p>
            )}
          </div>

          {/* 不喜欢食材 */}
          <div>
            <label className="block text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              不喜欢的食材 <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>(温和提醒)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={dislikeInput}
                onChange={e => setDislikeInput(e.target.value)}
                onKeyDown={e => handleKeyDown(e, addDislike)}
                placeholder="输入食材名后回车添加"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  border: '1.5px solid transparent',
                }}
              />
              <button
                onClick={addDislike}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                添加
              </button>
            </div>
            {dislikes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dislikes.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--bg)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {item}
                    <button onClick={() => removeDislike(item)} className="ml-0.5 hover:opacity-70">&times;</button>
                  </span>
                ))}
              </div>
            )}
            {dislikes.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>未添加不喜欢食材</p>
            )}
          </div>

          {/* 说明文字 */}
          <div
            className="rounded-xl p-3"
            style={{ background: 'var(--accent-light)', border: '1px solid rgba(212, 116, 60, 0.1)' }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--accent)' }}>
              系统会温和提醒你哪些菜含有过敏或不喜欢的食材，但不会限制你点这些菜。家庭做饭请自行与家人沟通。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-5 pt-0 flex gap-3">
          <button
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
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? '保存中...' : '保存'}
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
      `}</style>
    </div>
  );
}
