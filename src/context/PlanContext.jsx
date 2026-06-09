import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useWS } from './WSContext';

const PlanContext = createContext(null);

// Helper: get Monday of any given date
function getMonday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Get current local date as YYYY-MM-DD
function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function PlanProvider({ children }) {
  const { token } = useAuth();
  const toast = useToast();
  const ws = useWS();

  const [plans, setPlans] = useState({}); // { [weekStart]: [{ dayOfWeek, recipe }] }
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(getToday()));
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  // Fetch plans for a given week
  const fetchPlans = useCallback(async (weekStart) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/plans?weekStart=${weekStart}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPlans(prev => ({ ...prev, [weekStart]: data.days }));
      }
    } catch {
      toast.error('加载计划失败');
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders, toast]);

  // Load plans on mount and when week changes
  useEffect(() => {
    if (token) fetchPlans(currentWeekStart);
  }, [token, currentWeekStart, fetchPlans]);

  // Listen for WebSocket plan_updated events
  useEffect(() => {
    if (!token) return;

    const unsub = ws.on('plan_updated', ({ weekStart, dayOfWeek, recipe }) => {
      setPlans(prev => {
        const current = prev[weekStart] || [];
        let updated;

        if (recipe) {
          // Add or update
          const existing = current.find(p => p.day_of_week === dayOfWeek);
          if (existing) {
            updated = current.map(p =>
              p.day_of_week === dayOfWeek ? { ...p, recipe_id: recipe.id, ...recipe } : p
            );
          } else {
            updated = [...current, { day_of_week: dayOfWeek, recipe_id: recipe.id, ...recipe }];
          }
        } else {
          // Remove
          updated = current.filter(p => p.day_of_week !== dayOfWeek);
        }

        return { ...prev, [weekStart]: updated.sort((a, b) => a.day_of_week - b.day_of_week) };
      });
    });

    return () => unsub();
  }, [token, ws]);

  // Set plan for a specific day
  const setDayPlan = useCallback(async (weekStart, dayOfWeek, recipeId) => {
    try {
      const res = await fetch(`/api/plans/${weekStart}/${dayOfWeek}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ recipeId }),
      });
      if (!res.ok) throw new Error('设置失败');
      await fetchPlans(weekStart);
    } catch {
      toast.error('设置计划失败');
    }
  }, [authHeaders, toast, fetchPlans]);

  // Clear plan for a specific day
  const clearDayPlan = useCallback(async (weekStart, dayOfWeek) => {
    try {
      await fetch(`/api/plans/${weekStart}/${dayOfWeek}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      await fetchPlans(weekStart);
    } catch {
      toast.error('清除计划失败');
    }
  }, [authHeaders, toast, fetchPlans]);

  // Navigate to previous week
  const goToPrevWeek = useCallback(() => {
    const d = new Date(currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d.toISOString().split('T')[0]);
  }, [currentWeekStart]);

  // Navigate to next week
  const goToNextWeek = useCallback(() => {
    const d = new Date(currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d.toISOString().split('T')[0]);
  }, [currentWeekStart]);

  // Go to current week
  const goToCurrentWeek = useCallback(() => {
    setCurrentWeekStart(getMonday(getToday()));
  }, []);

  // Get plans for current week
  const currentPlans = useMemo(() => {
    return plans[currentWeekStart] || [];
  }, [plans, currentWeekStart]);

  const value = {
    plans,
    currentPlans,
    currentWeekStart,
    loading,
    setDayPlan,
    clearDayPlan,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
