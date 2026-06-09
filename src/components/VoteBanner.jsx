import { useState, useEffect, useCallback } from 'react';
import { useVote } from '../context/VoteContext';

export default function VoteBanner() {
  const { activeVotes, getVoteDetail, castVote, undoVote, loading } = useVote();

  const [detailVote, setDetailVote] = useState(null);
  const [voting, setVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Get the first active vote's detail
  const activeVote = activeVotes[0];

  useEffect(() => {
    if (activeVote?.id) {
      getVoteDetail(activeVote.id).then(setDetailVote);
    } else {
      setDetailVote(null);
    }
  }, [activeVote?.id, getVoteDetail]);

  // Countdown timer
  const updateCountdown = useCallback(() => {
    if (!detailVote?.closes_at) {
      setTimeLeft('');
      return;
    }
    const now = new Date();
    const end = new Date(detailVote.closes_at);
    const diff = end - now;

    if (diff <= 0) {
      setTimeLeft('已截止');
      return;
    }

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      setTimeLeft(`剩余 ${days} 天`);
    } else if (hours > 0) {
      setTimeLeft(`剩余 ${hours} 小时 ${minutes} 分`);
    } else {
      setTimeLeft(`剩余 ${minutes} 分钟`);
    }
  }, [detailVote]);

  useEffect(() => {
    updateCountdown();
    const timer = setInterval(updateCountdown, 30000);
    return () => clearInterval(timer);
  }, [updateCountdown]);

  const handleVote = async (candidateIds) => {
    if (!detailVote) return;
    setVoting(true);
    try {
      if (candidateIds.length > 0) {
        await castVote(detailVote.id, candidateIds);
      } else {
        await undoVote(detailVote.id);
      }
      // Refresh detail
      const fresh = await getVoteDetail(detailVote.id);
      setDetailVote(fresh);
    } finally {
      setVoting(false);
    }
  };

  if (!detailVote || loading) return null;

  const hasVoted = detailVote.myVotes && detailVote.myVotes.length > 0;
  const maxVotes = detailVote.max_votes_per_user || 3;
  const totalVotes = detailVote.totalVotes || 0;
  const candidates = detailVote.candidates || [];
  const topName = candidates[0]?.recipe_name || candidates[0]?.custom_name || '暂无';

  return (
    <div
      className="rounded-2xl p-4 mb-4 transition-all"
      style={{
        background: 'linear-gradient(135deg, #FFF8E1, #FFF3E0)',
        border: '1px solid #FFE0B2',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🗳️</span>
            <h3 className="text-sm font-bold" style={{ color: '#E65100' }}>{detailVote.title}</h3>
          </div>
          <p className="text-xs mt-1 flex items-center gap-2" style={{ color: '#BF360C' }}>
            <span>{candidates.length} 个候选项 · {totalVotes} 票已投</span>
            {timeLeft && <span>· {timeLeft}</span>}
          </p>
        </div>
        {hasVoted && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ background: '#4CAF50', color: '#fff' }}>
            已投票
          </span>
        )}
      </div>

      {/* Candidates */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {candidates.slice(0, 6).map(c => {
          const name = c.recipe_name || c.custom_name || '';
          const isVotedByMe = detailVote.myVotes?.includes(c.id);
          const pct = totalVotes > 0 ? Math.round((c.vote_count / totalVotes) * 100) : 0;

          return (
            <button
              key={c.id}
              onClick={() => {
                if (voting) return;
                if (isVotedByMe) {
                  // Toggle off
                  const newVotes = detailVote.myVotes.filter(id => id !== c.id);
                  handleVote(newVotes);
                } else {
                  if (detailVote.myVotes?.length >= maxVotes) return;
                  const newVotes = [...(detailVote.myVotes || []), c.id];
                  handleVote(newVotes);
                }
              }}
              disabled={voting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
              style={isVotedByMe ? {
                background: '#4CAF50',
                color: '#fff',
                boxShadow: '0 1px 4px rgba(76,175,80,0.3)',
              } : (detailVote.myVotes?.length >= maxVotes ? {
                background: 'var(--bg)',
                color: 'var(--text-tertiary)',
              } : {
                background: '#fff',
                color: '#E65100',
                border: '1px solid #FFE0B2',
              })}
            >
              {name}
              <span className={isVotedByMe ? 'opacity-70' : ''}
                style={{ fontSize: '10px', color: isVotedByMe ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)' }}>
                {c.vote_count}
              </span>
            </button>
          );
        })}
        {candidates.length > 6 && (
          <span className="px-2 py-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            ...共{candidates.length}个
          </span>
        )}
      </div>

      {/* Vote counter */}
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {hasVoted ? `你已投 ${detailVote.myVotes?.length}/${maxVotes} 票` : `每人最多 ${maxVotes} 票`}
        </span>
        {hasVoted && (
          <button
            onClick={() => handleVote([])}
            className="text-[11px] font-medium"
            style={{ color: '#E65100' }}
          >
            重新投票
          </button>
        )}
      </div>
    </div>
  );
}
