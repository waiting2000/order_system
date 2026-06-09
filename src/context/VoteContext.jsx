import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useWS } from './WSContext';

const VoteContext = createContext(null);

export function VoteProvider({ children }) {
  const { token, user } = useAuth();
  const toast = useToast();
  const ws = useWS();

  const [votes, setVotes] = useState([]); // List of all votes
  const [loading, setLoading] = useState(false);

  const nickname = user?.nickname || '';

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  // Fetch all votes
  const fetchVotes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/votes', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setVotes(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (token) fetchVotes();
  }, [token, fetchVotes]);

  // WebSocket listeners
  useEffect(() => {
    if (!token) return;

    const unsubs = [
      ws.on('vote_created', ({ vote }) => {
        setVotes(prev => [vote, ...prev.filter(v => v.id !== vote.id)]);
      }),
      ws.on('vote_updated', ({ vote }) => {
        setVotes(prev => prev.map(v => v.id === vote.id ? vote : v));
      }),
      ws.on('vote_closed', ({ voteId, winner }) => {
        setVotes(prev => prev.map(v => v.id === voteId ? { ...v, status: 'closed', winnerRecipeId: winner?.id || null } : v));
      }),
    ];

    return () => unsubs.forEach(u => u());
  }, [token, ws]);

  // Get active votes
  const activeVotes = useMemo(() => {
    return votes.filter(v => v.status === 'active');
  }, [votes]);

  // Get closed votes
  const closedVotes = useMemo(() => {
    return votes.filter(v => v.status === 'closed');
  }, [votes]);

  // Get detailed vote
  const getVoteDetail = useCallback(async (voteId) => {
    try {
      const res = await fetch(`/api/votes/${voteId}`, { headers: authHeaders });
      if (!res.ok) throw new Error('加载失败');
      return await res.json();
    } catch {
      toast.error('加载投票详情失败');
      return null;
    }
  }, [authHeaders, toast]);

  // Create vote
  const createVote = useCallback(async (data) => {
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '创建失败');
      }
      const vote = await res.json();
      setVotes(prev => [vote, ...prev]);
      toast.success('投票已发起');
      return vote;
    } catch (err) {
      toast.error(err.message || '发起投票失败');
      throw err;
    }
  }, [authHeaders, toast]);

  // Add candidate
  const addCandidate = useCallback(async (voteId, data) => {
    try {
      const res = await fetch(`/api/votes/${voteId}/candidates`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '添加失败');
      }
      const updated = await res.json();
      setVotes(prev => prev.map(v => v.id === voteId ? updated : v));
      toast.success('已添加候选项');
      return updated;
    } catch (err) {
      toast.error(err.message || '添加候选失败');
      throw err;
    }
  }, [authHeaders, toast]);

  // Vote
  const castVote = useCallback(async (voteId, candidateIds) => {
    try {
      const res = await fetch(`/api/votes/${voteId}/vote`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ candidateIds }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '投票失败');
      }
      const updated = await res.json();
      setVotes(prev => prev.map(v => v.id === voteId ? updated : v));
      toast.success('投票成功');
      return updated;
    } catch (err) {
      toast.error(err.message || '投票失败');
      throw err;
    }
  }, [authHeaders, toast]);

  // Undo vote
  const undoVote = useCallback(async (voteId) => {
    try {
      const res = await fetch(`/api/votes/${voteId}/vote`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('操作失败');
      const updated = await res.json();
      setVotes(prev => prev.map(v => v.id === voteId ? updated : v));
      toast.info('已撤销投票');
      return updated;
    } catch {
      toast.error('撤销投票失败');
    }
  }, [authHeaders, toast]);

  // Close vote
  const closeVote = useCallback(async (voteId) => {
    try {
      const res = await fetch(`/api/votes/${voteId}/close`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('操作失败');
      const data = await res.json();
      setVotes(prev => prev.map(v => v.id === voteId ? { ...v, status: 'closed', winnerRecipeId: data.winnerRecipeId } : v));
      toast.success('投票已关闭');
    } catch {
      toast.error('关闭投票失败');
    }
  }, [authHeaders, toast]);

  // Apply winner to menu
  const applyWinner = useCallback(async (voteId) => {
    try {
      const res = await fetch(`/api/votes/${voteId}/apply-winner`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '操作失败');
      }
      toast.success('已加入今日菜单');
    } catch (err) {
      toast.error(err.message || '添加失败');
    }
  }, [authHeaders, toast]);

  const value = {
    votes,
    activeVotes,
    closedVotes,
    loading,
    nickname,
    fetchVotes,
    getVoteDetail,
    createVote,
    addCandidate,
    castVote,
    undoVote,
    closeVote,
    applyWinner,
  };

  return (
    <VoteContext.Provider value={value}>
      {children}
    </VoteContext.Provider>
  );
}

export function useVote() {
  const ctx = useContext(VoteContext);
  if (!ctx) throw new Error('useVote must be used within VoteProvider');
  return ctx;
}
