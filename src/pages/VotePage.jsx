import { useState, useCallback } from 'react';
import { useVote } from '../context/VoteContext';
import { useMenu } from '../context/MenuContext';
import { useToast } from '../context/ToastContext';

const CATEGORY_EMOJI = {
  '荤菜': '🥩', '素菜': '🥬', '汤类': '🥣',
  '主食': '🍚', '凉菜': '🥒', '海鲜': '🦐', '小吃': '🥟', '其他': '🍳',
};

export default function VotePage() {
  const { activeVotes, closedVotes, loading, nickname, fetchVotes, getVoteDetail, createVote, addCandidate, castVote, undoVote, closeVote, applyWinner } = useVote();
  const { recipes } = useMenu();
  const toast = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [expandedVoteId, setExpandedVoteId] = useState(null);
  const [voteDetails, setVoteDetails] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(null);
  const [votingIds, setVotingIds] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  // Create form
  const [formTitle, setFormTitle] = useState('');
  const [formMaxVotes, setFormMaxVotes] = useState(3);
  const [formCloseHours, setFormCloseHours] = useState(24);
  const [formCandidates, setFormCandidates] = useState([]);
  const [formRecipeSearch, setFormRecipeSearch] = useState('');
  const [formCustomName, setFormCustomName] = useState('');

  // Add candidate inline
  const [addCandidateVoteId, setAddCandidateVoteId] = useState(null);
  const [addRecipeSearch, setAddRecipeSearch] = useState('');
  const [addCustomName, setAddCustomName] = useState('');

  // Expand / collapse vote detail
  const toggleExpand = useCallback(async (voteId) => {
    if (expandedVoteId === voteId) {
      setExpandedVoteId(null);
      return;
    }
    setExpandedVoteId(voteId);
    if (voteDetails[voteId]) return;

    setLoadingDetail(voteId);
    const detail = await getVoteDetail(voteId);
    if (detail) {
      setVoteDetails(prev => ({ ...prev, [voteId]: detail }));
    }
    setLoadingDetail(null);
  }, [expandedVoteId, voteDetails, getVoteDetail]);

  const formatTimeLeft = (closesAt) => {
    if (!closesAt) return '';
    const diff = new Date(closesAt) - new Date();
    if (diff <= 0) return '已截止';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `剩余 ${Math.floor(hours / 24)} 天`;
    if (hours > 0) return `剩余 ${hours} 小时 ${mins} 分钟`;
    return `剩余 ${mins} 分钟`;
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) { toast.error('请输入投票标题'); return; }
    if (formCandidates.length === 0) { toast.error('请至少添加一个候选项'); return; }
    const closesAt = new Date(Date.now() + formCloseHours * 3600000).toISOString();
    const vote = await createVote({ title: formTitle.trim(), maxVotesPerUser: formMaxVotes, closesAt, candidates: formCandidates });
    if (vote) {
      setShowCreate(false);
      setFormTitle('');
      setFormMaxVotes(3);
      setFormCloseHours(24);
      setFormCandidates([]);
      setFormRecipeSearch('');
      setFormCustomName('');
    }
  };

  const addFormRecipe = (recipe) => {
    if (formCandidates.some(c => c.recipeId === recipe.id)) { toast.info('该菜谱已添加'); return; }
    setFormCandidates(prev => [...prev, { recipeId: recipe.id, recipeName: recipe.name }]);
    setFormRecipeSearch('');
  };

  const addFormCustom = () => {
    const name = formCustomName.trim();
    if (!name) return;
    if (formCandidates.some(c => c.customName === name)) { toast.info('该菜名已添加'); return; }
    setFormCandidates(prev => [...prev, { customName: name }]);
    setFormCustomName('');
  };

  const removeFormCandidate = (idx) => {
    setFormCandidates(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddCandidate = async (voteId) => {
    if (addRecipeSearch) {
      const matched = recipes.find(r => String(r.id) === addRecipeSearch.trim() || r.name === addRecipeSearch.trim());
      if (matched) {
        await addCandidate(voteId, { recipeId: matched.id });
      } else {
        toast.error('未找到该菜谱，请输入菜谱ID或完整名称');
        return;
      }
    } else if (addCustomName.trim()) {
      await addCandidate(voteId, { customName: addCustomName.trim() });
    } else {
      return;
    }
    setAddRecipeSearch('');
    setAddCustomName('');
    setAddCandidateVoteId(null);
    const fresh = await getVoteDetail(voteId);
    if (fresh) setVoteDetails(prev => ({ ...prev, [voteId]: fresh }));
  };

  const handleVoteAction = async (voteId, candidateIds) => {
    setVotingIds(prev => ({ ...prev, [voteId]: true }));
    try {
      const updated = await castVote(voteId, candidateIds);
      if (updated) {
        setVoteDetails(prev => ({ ...prev, [voteId]: updated }));
      }
    } finally {
      setVotingIds(prev => ({ ...prev, [voteId]: false }));
    }
  };

  const toggleVote = (detail, candidateId) => {
    if (votingIds[detail.id]) return;
    const myVotes = detail.myVotes || [];
    const maxV = detail.max_votes_per_user || 3;
    if (myVotes.includes(candidateId)) {
      handleVoteAction(detail.id, myVotes.filter(id => id !== candidateId));
    } else {
      if (myVotes.length >= maxV) { toast.info(`每人最多 ${maxV} 票`); return; }
      handleVoteAction(detail.id, [...myVotes, candidateId]);
    }
  };

  const handleCloseVote = async (voteId) => {
    if (!window.confirm('确定关闭该投票？关闭后无法重新开启。')) return;
    await closeVote(voteId);
    setExpandedVoteId(null);
    setVoteDetails(prev => { const n = { ...prev }; delete n[voteId]; return n; });
    fetchVotes();
  };

  const handleApplyWinner = async (voteId, detail) => {
    if (detail.winner_added_to_menu) { toast.info('已加入今日菜单'); return; }
    await applyWinner(voteId);
    const fresh = await getVoteDetail(voteId);
    if (fresh) setVoteDetails(prev => ({ ...prev, [voteId]: fresh }));
  };

  const filteredRecipes = useCallback(() => {
    if (!formRecipeSearch.trim()) return [];
    const q = formRecipeSearch.trim().toLowerCase();
    return recipes.filter(r => r.name.toLowerCase().includes(q) || String(r.id).includes(q)).slice(0, 6);
  }, [formRecipeSearch, recipes]);

  const addFilteredRecipes = useCallback(() => {
    if (!addRecipeSearch.trim()) return [];
    const q = addRecipeSearch.trim().toLowerCase();
    return recipes.filter(r => r.name.toLowerCase().includes(q) || String(r.id).includes(q)).slice(0, 6);
  }, [addRecipeSearch, recipes]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s`, opacity: 0.5 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          🗳️ 家庭投票
        </h2>
        <button
          onClick={() => { setShowCreate(!showCreate); setShowHistory(false); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
          style={{ background: showCreate ? 'var(--surface-hover)' : 'var(--accent)', color: showCreate ? 'var(--text-primary)' : '#fff' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {showCreate ? '收起' : '发起投票'}
        </button>
      </div>

      {/* Create Vote Form */}
      {showCreate && (
        <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-md)' }}>
          <input
            type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
            placeholder="投票标题，如：今晚吃什么？" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>每人投票数</label>
              <select value={formMaxVotes} onChange={e => setFormMaxVotes(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}>
                {[1, 2, 3, 5].map(n => <option key={n} value={n}>{n} 票</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>截止时间</label>
              <select value={formCloseHours} onChange={e => setFormCloseHours(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}>
                <option value={1}>1 小时后</option>
                <option value={6}>6 小时后</option>
                <option value={12}>12 小时后</option>
                <option value={24}>24 小时后</option>
                <option value={48}>48 小时后</option>
                <option value={72}>3 天后</option>
              </select>
            </div>
          </div>

          {/* Add candidates */}
          <div>
            <label className="text-[11px] font-medium mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>候选项</label>

            {/* Existing candidates */}
            {formCandidates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {formCandidates.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                    {c.recipeName || c.customName}
                    <button onClick={() => removeFormCandidate(i)} className="ml-0.5 opacity-60 hover:opacity-100">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Recipe search */}
            <div className="relative mb-2">
              <input type="text" value={formRecipeSearch} onChange={e => setFormRecipeSearch(e.target.value)}
                placeholder="搜索已有菜谱..." className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }} />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              {formRecipeSearch && filteredRecipes().length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {filteredRecipes().map(r => (
                    <button key={r.id} onClick={() => addFormRecipe(r)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--surface-hover)]" style={{ color: 'var(--text-primary)' }}>
                      <span>{CATEGORY_EMOJI[r.category] || '🍽️'}</span>
                      <span>{r.name}</span>
                      <span className="text-[11px] ml-auto" style={{ color: 'var(--text-tertiary)' }}>{r.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom name */}
            <div className="flex gap-2">
              <input type="text" value={formCustomName} onChange={e => setFormCustomName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addFormCustom(); }}
                placeholder="或自由提名菜名..." className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }} />
              <button onClick={addFormCustom}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                添加
              </button>
            </div>
          </div>

          <button onClick={handleCreate}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            发起投票
          </button>
        </div>
      )}

      {/* Active Votes */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          进行中 ({activeVotes.length})
        </h3>
        {activeVotes.length === 0 ? (
          <div className="text-center py-10 rounded-2xl" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>暂无进行中的投票</p>
            <button onClick={() => setShowCreate(true)}
              className="mt-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
              发起第一个投票
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeVotes.map(vote => {
              const detail = voteDetails[vote.id];
              const isExpanded = expandedVoteId === vote.id;
              const isLoading = loadingDetail === vote.id;

              return (
                <div key={vote.id} className="rounded-2xl overflow-hidden transition-all"
                  style={{ background: 'var(--surface)', boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow-sm)' }}>

                  {/* Summary Row */}
                  <button onClick={() => toggleExpand(vote.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {vote.title}
                        </span>
                        {detail?.myVotes?.length > 0 && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: '#4CAF50', color: '#fff' }}>已投票</span>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {vote.candidateCount || 0} 个候选项 · {vote.created_by} 发起
                        {vote.closes_at ? ` · ${formatTimeLeft(vote.closes_at)}` : ''}
                      </p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                      {isLoading ? (
                        <div className="flex justify-center py-6">
                          <div className="flex gap-1">
                            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                              style={{ background: 'var(--accent)', animationDelay: `${i*0.15}s`, opacity: 0.5 }} />)}
                          </div>
                        </div>
                      ) : detail ? (
                        <div className="pt-3 space-y-3">
                          {/* Info */}
                          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <span>{detail.totalVotes || 0} 票已投</span>
                            <span>每人 {detail.max_votes_per_user || 3} 票</span>
                          </div>

                          {/* Candidates */}
                          {detail.candidates?.length > 0 && (
                            <div className="space-y-2">
                              {detail.candidates.map(c => {
                                const name = c.recipe_name || c.custom_name || '未知';
                                const isVotedByMe = detail.myVotes?.includes(c.id);
                                const maxV = detail.max_votes_per_user || 3;
                                const voteCount = c.vote_count || 0;
                                const total = detail.totalVotes || 0;
                                const pct = total > 0 ? Math.round((voteCount / total) * 100) : 0;
                                const isVoting = votingIds[detail.id] || false;

                                return (
                                  <div key={c.id} className="flex items-center gap-3">
                                    <button
                                      onClick={() => toggleVote(detail, c.id)}
                                      disabled={isVoting}
                                      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
                                      style={isVotedByMe ? {
                                        background: '#E8F5E9', color: '#2E7D32', border: '1.5px solid #4CAF50',
                                      } : ((detail.myVotes?.length || 0) >= maxV ? {
                                        background: 'var(--bg)', color: 'var(--text-tertiary)', border: '1.5px solid var(--border)',
                                      } : {
                                        background: 'var(--bg)', color: 'var(--text-primary)', border: '1.5px solid var(--border)',
                                      })}>
                                      <span className="text-base">{c.recipe_id ? (CATEGORY_EMOJI[c.category] || '🍽️') : '💡'}</span>
                                      <span className="flex-1 text-left truncate">{name}</span>
                                      <span className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                                        {isVotedByMe && (
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                        )}
                                        {voteCount}
                                      </span>
                                    </button>
                                    <div className="shrink-0 w-16">
                                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
                                        <div className="h-full rounded-full transition-all duration-300"
                                          style={{ width: `${pct}%`, background: isVotedByMe ? '#4CAF50' : 'var(--accent)' }} />
                                      </div>
                                      <div className="text-[10px] text-right mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{pct}%</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {/* Add Candidate */}
                            {addCandidateVoteId === detail.id ? (
                              <div className="w-full space-y-2">
                                <div className="relative">
                                  <input type="text" value={addRecipeSearch} onChange={e => setAddRecipeSearch(e.target.value)}
                                    placeholder="搜索菜谱ID或名称..." className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none"
                                    style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }} />
                                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                  {addRecipeSearch && addFilteredRecipes().length > 0 && (
                                    <div className="absolute z-10 left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                      {addFilteredRecipes().map(r => (
                                        <button key={r.id} onClick={() => { addCandidate(detail.id, { recipeId: r.id }); setAddRecipeSearch(''); setAddCandidateVoteId(null); }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left" style={{ color: 'var(--text-primary)' }}>
                                          <span>{CATEGORY_EMOJI[r.category] || '🍽️'}</span> {r.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <input type="text" value={addCustomName} onChange={e => setAddCustomName(e.target.value)}
                                    placeholder="或自由提名..." className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                                    style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }} />
                                  <button onClick={() => handleAddCandidate(detail.id)}
                                    className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--accent)', color: '#fff' }}>
                                    添加
                                  </button>
                                  <button onClick={() => { setAddCandidateVoteId(null); setAddRecipeSearch(''); setAddCustomName(''); }}
                                    className="px-3 py-2 rounded-lg text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setAddCandidateVoteId(detail.id)}
                                className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors"
                                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                                + 提名菜谱
                              </button>
                            )}

                            {/* Undo vote */}
                            {detail.myVotes?.length > 0 && (
                              <button onClick={() => handleVoteAction(detail.id, [])}
                                className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors"
                                style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>
                                撤销投票
                              </button>
                            )}

                            {/* Close vote */}
                            <button onClick={() => handleCloseVote(detail.id)}
                              className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors"
                              style={{ background: 'rgba(244,67,54,0.1)', color: '#F44336' }}>
                              关闭投票
                            </button>

                            {/* Apply winner */}
                            {!detail.winner_added_to_menu && (
                              <button onClick={() => handleApplyWinner(detail.id, detail)}
                                className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors"
                                style={{ background: 'var(--accent)', color: '#fff' }}>
                                加入今日菜单
                              </button>
                            )}
                            {detail.winner_added_to_menu && (
                              <span className="px-3 py-1.5 rounded-full text-[11px]"
                                style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                                ✓ 已加入菜单
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>加载失败</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Closed Votes History */}
      <div>
        <button onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm font-semibold transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          历史投票 ({closedVotes.length})
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2">
            {closedVotes.length === 0 ? (
              <div className="text-center py-6 rounded-2xl" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>暂无历史投票</p>
              </div>
            ) : (
              closedVotes.map(vote => (
                <div key={vote.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{vote.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {vote.candidateCount || 0} 个候选项 · {vote.created_by} 发起
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium"
                    style={{ background: 'var(--surface-hover)', color: 'var(--text-tertiary)' }}>
                    已结束
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
