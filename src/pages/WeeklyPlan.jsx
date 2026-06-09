import { useState, useMemo } from 'react';
import { usePlan } from '../context/PlanContext';
import { useMenu } from '../context/MenuContext';
import { usePreferences } from '../context/PreferenceContext';
import RecipePicker from '../components/RecipePicker';
import AllergyBadge from '../components/AllergyBadge';

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const CATEGORY_EMOJI = {
  '荤菜': '🥩', '素菜': '🥬', '汤类': '🥣',
  '主食': '🍚', '凉菜': '🥒', '海鲜': '🦐', '小吃': '🥟', '其他': '🍳',
};

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getDateForDay(weekStart, dayOfWeek) {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + dayOfWeek);
  return d.toISOString().split('T')[0];
}

export default function WeeklyPlan() {
  const { currentPlans, currentWeekStart, loading, setDayPlan, clearDayPlan, goToPrevWeek, goToNextWeek, goToCurrentWeek } = usePlan();
  const { recipes } = useMenu();
  const { preferences, getAllergens } = usePreferences();

  const [pickerDay, setPickerDay] = useState(null); // which day to pick for
  const [longPressTimer, setLongPressTimer] = useState(null);

  const today = getToday();
  const todayDayOfWeek = (() => {
    const d = new Date();
    const jsDay = d.getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  })();
  const isCurrentWeek = currentWeekStart === (() => {
    const d = new Date(today + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  })();

  // Build week date range display
  const weekEndDate = (() => {
    const d = new Date(currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  })();

  const month = (() => {
    const d = new Date(currentWeekStart + 'T00:00:00');
    return d.getMonth() + 1;
  })();

  // Build days array
  const days = useMemo(() => {
    return DAY_LABELS.map((label, i) => {
      const dateStr = getDateForDay(currentWeekStart, i);
      const plan = currentPlans.find(p => p.day_of_week === i);
      const isToday = dateStr === today;
      const isPast = dateStr < today;
      return { label, dayOfWeek: i, date: dateStr, dayNum: dateStr.split('-')[2], plan, isToday, isPast };
    });
  }, [currentWeekStart, currentPlans, today]);

  const handleDayClick = (day) => {
    if (pickerDay?.dayOfWeek === day.dayOfWeek) {
      setPickerDay(null);
      return;
    }
    setPickerDay(day);
  };

  const handleSelectRecipe = (recipe) => {
    if (pickerDay) {
      setDayPlan(currentWeekStart, pickerDay.dayOfWeek, recipe.id);
    }
    setPickerDay(null);
  };

  const handleClearPlan = (e, day) => {
    e.stopPropagation();
    clearDayPlan(currentWeekStart, day.dayOfWeek);
  };

  // Long press to delete
  const handleTouchStart = (e, day) => {
    if (!day.plan) return;
    const timer = setTimeout(() => {
      if (window.confirm(`确定要清除「${day.plan.name}」的计划吗？`)) {
        clearDayPlan(currentWeekStart, day.dayOfWeek);
      }
    }, 600);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Week Navigator */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevWeek}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {month}月 · 菜单计划
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {currentWeekStart} ~ {weekEndDate}
            {!isCurrentWeek && (
              <button onClick={goToCurrentWeek} className="ml-2 font-medium" style={{ color: 'var(--accent)' }}>
                回到本周
              </button>
            )}
          </p>
        </div>

        <button
          onClick={goToNextWeek}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s`, opacity: 0.5 }} />
            ))}
          </div>
        </div>
      )}

      {/* Days List */}
      {!loading && (
        <div className="space-y-2">
          {days.map(day => {
            const allergens = day.plan?.ingredients ? getAllergens(day.plan.ingredients) : [];

            return (
              <div
                key={day.dayOfWeek}
                onClick={() => handleDayClick(day)}
                onTouchStart={e => handleTouchStart(e, day)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={e => handleTouchStart(e, day)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                className={`flex items-stretch rounded-2xl overflow-hidden transition-all cursor-pointer active:scale-[0.99] ${
                  pickerDay?.dayOfWeek === day.dayOfWeek ? 'ring-2' : ''
                }`}
                style={{
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-sm)',
                  ...(pickerDay?.dayOfWeek === day.dayOfWeek ? { ringColor: 'var(--accent)' } : {}),
                }}
              >
                {/* Day label */}
                <div
                  className="shrink-0 w-14 flex flex-col items-center justify-center py-4"
                  style={{
                    background: day.isToday ? 'var(--accent)' : 'var(--surface-hover)',
                    color: day.isToday ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  <span className="text-xs font-semibold">{day.label}</span>
                  <span className="text-[11px] mt-0.5 opacity-70">{day.dayNum}</span>
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-between px-4 py-3 min-w-0">
                  {day.plan ? (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {CATEGORY_EMOJI[day.plan.category] || '🍽️'} {day.plan.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          {day.plan.category} · {day.plan.cookTime}分钟
                        </span>
                      </div>
                      {allergens.length > 0 && (
                        <div className="mt-1">
                          <AllergyBadge recipeIngredients={day.plan.ingredients} userAllergies={preferences.allergies} compact />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center">
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        点击选择菜谱
                      </span>
                      {day.isToday && (
                        <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                          今天
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1">
                    {day.plan ? (
                      <>
                        <button
                          onClick={() => handleDayClick(day)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="更换菜谱"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={e => handleClearPlan(e, day)}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="清除计划"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe Picker Modal */}
      {pickerDay && (
        <RecipePicker
          recipes={recipes}
          onSelect={handleSelectRecipe}
          onClose={() => setPickerDay(null)}
        />
      )}
    </div>
  );
}
