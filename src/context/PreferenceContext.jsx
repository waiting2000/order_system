import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const PreferenceContext = createContext(null);

export function PreferenceProvider({ children }) {
  const { token, user } = useAuth();
  const toast = useToast();

  const [preferences, setPreferences] = useState({
    allergies: [],
    dislikes: [],
    dietaryType: '',
  });
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  // Fetch preferences on login
  const fetchPreferences = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users/preferences', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch {
      // Silently fail - preferences are optional
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (token) fetchPreferences();
  }, [token, fetchPreferences]);

  // Save preferences
  const savePreferences = useCallback(async (data) => {
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('保存失败');
      const updated = await res.json();
      setPreferences(updated);
      toast.success('饮食偏好已保存');
      return updated;
    } catch {
      toast.error('保存偏好失败，请重试');
      throw new Error('保存失败');
    }
  }, [authHeaders, toast]);

  // Check if a recipe has allergens for current user
  const getAllergens = useCallback((ingredients) => {
    if (!ingredients || !preferences.allergies || preferences.allergies.length === 0) return [];
    const ings = Array.isArray(ingredients) ? ingredients : [];
    return ings.filter(ing => preferences.allergies.some(a => a === ing || ing.includes(a) || a.includes(ing)));
  }, [preferences.allergies]);

  const getDislikes = useCallback((ingredients) => {
    if (!ingredients || !preferences.dislikes || preferences.dislikes.length === 0) return [];
    const ings = Array.isArray(ingredients) ? ingredients : [];
    return ings.filter(ing => preferences.dislikes.some(d => d === ing || ing.includes(d) || d.includes(ing)));
  }, [preferences.dislikes]);

  const value = {
    preferences,
    loading,
    savePreferences,
    getAllergens,
    getDislikes,
  };

  return (
    <PreferenceContext.Provider value={value}>
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferenceContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferenceProvider');
  return ctx;
}
