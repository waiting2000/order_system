export default function AllergyBadge({ recipeIngredients, userAllergies, compact }) {
  if (!recipeIngredients?.length || !userAllergies?.length) return null;

  const matched = recipeIngredients.filter(ing =>
    userAllergies.some(a => a === ing || ing.includes(a) || a.includes(ing))
  );

  if (matched.length === 0) return null;

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
        style={{ background: '#FFF3E0', color: '#E65100', border: '1px solid #FFE0B2' }}
        title={`含过敏食材：${matched.join('、')}`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        {matched.join('、')}
      </span>
    );
  }

  return (
    <div
      className="inline-flex items-start gap-2 px-3 py-2 rounded-xl"
      style={{ background: '#FFF3E0', border: '1px solid #FFE0B2' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div>
        <p className="text-xs font-semibold" style={{ color: '#E65100' }}>过敏提醒</p>
        <p className="text-xs mt-0.5" style={{ color: '#BF360C' }}>
          含你过敏的食材：{matched.join('、')}
        </p>
      </div>
    </div>
  );
}
