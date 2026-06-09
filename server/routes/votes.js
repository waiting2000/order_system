import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { broadcast } from '../ws.js';

const router = Router();
router.use(authMiddleware);

// Helper: build full vote object with candidates and vote counts
function getVoteById(voteId, currentNickname) {
  const vote = db.prepare('SELECT * FROM votes WHERE id = ?').get(voteId);
  if (!vote) return null;

  const candidates = db.prepare(`
    SELECT c.*, r.name as recipe_name, r.category, r.image, r.cookTime,
           COUNT(vr.id) as vote_count
    FROM vote_candidates c
    LEFT JOIN recipes r ON c.recipe_id = r.id
    LEFT JOIN vote_records vr ON c.id = vr.candidate_id
    WHERE c.vote_id = ?
    GROUP BY c.id
    ORDER BY vote_count DESC
  `).all(voteId);

  // Get current user's voted candidate IDs
  let myVotes = [];
  if (currentNickname) {
    const records = db.prepare(
      'SELECT candidate_id FROM vote_records WHERE vote_id = ? AND nickname = ?'
    ).all(voteId, currentNickname);
    myVotes = records.map(r => r.candidate_id);
  }

  return { ...vote, candidates, myVotes, totalVotes: candidates.reduce((sum, c) => sum + c.vote_count, 0) };
}

// Get all votes
router.get('/votes', (req, res) => {
  const { status } = req.query;

  let sql = 'SELECT * FROM votes';
  const params = [];

  if (status === 'active') {
    sql += ' WHERE status = ? ORDER BY created_at DESC';
    params.push('active');
  } else if (status === 'closed') {
    sql += ' WHERE status = ? ORDER BY created_at DESC LIMIT 50';
    params.push('closed');
  } else {
    sql += ' ORDER BY CASE WHEN status = ? THEN 0 ELSE 1 END, created_at DESC';
    params.push('active');
  }

  const votes = db.prepare(sql).all(...params);

  // Add candidate counts
  const enriched = votes.map(v => {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM vote_candidates WHERE vote_id = ?').get(v.id);
    return { ...v, candidateCount: count.cnt };
  });

  res.json(enriched);
});

// Get single vote detail
router.get('/votes/:id', (req, res) => {
  const vote = getVoteById(req.params.id, req.user.nickname);
  if (!vote) return res.status(404).json({ error: '投票不存在' });
  res.json(vote);
});

// Create a new vote
router.post('/votes', (req, res) => {
  const { title, maxVotesPerUser = 3, closesAt, candidates = [] } = req.body;

  if (!title) return res.status(400).json({ error: '请输入投票标题' });

  // Create vote
  const result = db.prepare(`
    INSERT INTO votes (title, max_votes_per_user, closes_at, created_by)
    VALUES (?, ?, ?, ?)
  `).run(title, maxVotesPerUser || 3, closesAt || null, req.user.nickname);

  const voteId = result.lastInsertRowid;

  // Create candidates
  const insertCandidate = db.prepare(`
    INSERT INTO vote_candidates (vote_id, recipe_id, custom_name, added_by)
    VALUES (?, ?, ?, ?)
  `);

  const createdCandidates = [];

  for (const c of candidates) {
    if (c.recipeId) {
      insertCandidate.run(voteId, c.recipeId, '', req.user.nickname);
    } else if (c.customName) {
      insertCandidate.run(voteId, null, c.customName, req.user.nickname);
    }
  }

  const vote = getVoteById(voteId, req.user.nickname);
  broadcast('vote_created', { vote });
  res.status(201).json(vote);
});

// Add candidate to existing vote
router.post('/votes/:id/candidates', (req, res) => {
  const { recipeId, customName } = req.body;

  const vote = db.prepare('SELECT * FROM votes WHERE id = ?').get(req.params.id);
  if (!vote) return res.status(404).json({ error: '投票不存在' });
  if (vote.status !== 'active') return res.status(400).json({ error: '投票已关闭' });

  // Validate at least one is provided
  if (!recipeId && !customName) {
    return res.status(400).json({ error: '请指定菜谱或提名菜名' });
  }

  // Validate recipe if provided
  if (recipeId) {
    const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) return res.status(404).json({ error: '菜谱不存在' });
  }

  // Check duplicate
  if (recipeId) {
    const dup = db.prepare('SELECT id FROM vote_candidates WHERE vote_id = ? AND recipe_id = ?').get(vote.id, recipeId);
    if (dup) return res.status(409).json({ error: '该菜谱已被提名' });
  }
  if (customName) {
    const dup = db.prepare('SELECT id FROM vote_candidates WHERE vote_id = ? AND custom_name = ?').get(vote.id, customName);
    if (dup) return res.status(409).json({ error: '该菜名已被提名' });
  }

  db.prepare(`
    INSERT INTO vote_candidates (vote_id, recipe_id, custom_name, added_by)
    VALUES (?, ?, ?, ?)
  `).run(vote.id, recipeId || null, customName || '', req.user.nickname);

  const updated = getVoteById(vote.id, req.user.nickname);
  broadcast('vote_updated', { vote: updated });
  res.status(201).json(updated);
});

// Vote on candidates
router.post('/votes/:id/vote', (req, res) => {
  const { candidateIds = [] } = req.body;

  const vote = db.prepare('SELECT * FROM votes WHERE id = ?').get(req.params.id);
  if (!vote) return res.status(404).json({ error: '投票不存在' });
  if (vote.status !== 'active') return res.status(400).json({ error: '投票已关闭' });

  // Check if closed by time
  if (vote.closes_at && new Date(vote.closes_at) < new Date()) {
    return res.status(400).json({ error: '投票已截止' });
  }

  if (candidateIds.length === 0) return res.status(400).json({ error: '请选择至少一个候选项' });
  if (candidateIds.length > vote.max_votes_per_user) {
    return res.status(400).json({ error: `最多只能投 ${vote.max_votes_per_user} 票` });
  }

  const nickname = req.user.nickname;

  // Transaction: remove existing votes for this user, insert new ones
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM vote_records WHERE vote_id = ? AND nickname = ?').run(vote.id, nickname);

    const insertRecord = db.prepare(
      'INSERT INTO vote_records (vote_id, candidate_id, nickname) VALUES (?, ?, ?)'
    );

    for (const candidateId of candidateIds) {
      // Verify candidate exists and belongs to this vote
      const candidate = db.prepare('SELECT id FROM vote_candidates WHERE id = ? AND vote_id = ?').get(candidateId, vote.id);
      if (candidate) {
        insertRecord.run(vote.id, candidateId, nickname);
      }
    }
  });

  transaction();

  const updated = getVoteById(vote.id, nickname);
  broadcast('vote_updated', { vote: updated });
  res.json(updated);
});

// Undo all votes
router.delete('/votes/:id/vote', (req, res) => {
  const vote = db.prepare('SELECT * FROM votes WHERE id = ?').get(req.params.id);
  if (!vote) return res.status(404).json({ error: '投票不存在' });
  if (vote.status !== 'active') return res.status(400).json({ error: '投票已关闭' });

  db.prepare('DELETE FROM vote_records WHERE vote_id = ? AND nickname = ?').run(vote.id, req.user.nickname);

  const updated = getVoteById(vote.id, req.user.nickname);
  broadcast('vote_updated', { vote: updated });
  res.json(updated);
});

// Close a vote
router.post('/votes/:id/close', (req, res) => {
  const vote = db.prepare('SELECT * FROM votes WHERE id = ?').get(req.params.id);
  if (!vote) return res.status(404).json({ error: '投票不存在' });
  if (vote.status !== 'active') return res.status(400).json({ error: '投票已关闭' });

  // Compute winner: candidate with most votes
  const topCandidate = db.prepare(`
    SELECT c.*, COUNT(vr.id) as vote_count, r.id as r_id
    FROM vote_candidates c
    LEFT JOIN vote_records vr ON c.id = vr.candidate_id
    LEFT JOIN recipes r ON c.recipe_id = r.id
    WHERE c.vote_id = ?
    GROUP BY c.id
    ORDER BY vote_count DESC
    LIMIT 1
  `).get(vote.id);

  let winnerRecipeId = null;
  if (topCandidate && topCandidate.vote_count > 0) {
    winnerRecipeId = topCandidate.recipe_id || null;
  }

  db.prepare(`
    UPDATE votes SET status = 'closed', winner_recipe_id = ?
    WHERE id = ?
  `).run(winnerRecipeId, vote.id);

  const winner = winnerRecipeId ? db.prepare('SELECT * FROM recipes WHERE id = ?').get(winnerRecipeId) : null;

  broadcast('vote_closed', { voteId: vote.id, winner: winner ? { ...winner, ingredients: JSON.parse(winner.ingredients || '[]') } : null });
  res.json({ success: true, winnerRecipeId, winner });
});

// Apply winner to today's menu
router.post('/votes/:id/apply-winner', (req, res) => {
  const vote = db.prepare('SELECT * FROM votes WHERE id = ?').get(req.params.id);
  if (!vote) return res.status(404).json({ error: '投票不存在' });
  if (vote.winner_added_to_menu) return res.status(409).json({ error: '已加入今日菜单' });

  let recipeId = req.body.winnerCandidateId ? null : vote.winner_recipe_id;

  // If manually specified candidate
  if (req.body.winnerCandidateId) {
    const candidate = db.prepare('SELECT * FROM vote_candidates WHERE id = ? AND vote_id = ?').get(req.body.winnerCandidateId, vote.id);
    if (!candidate) return res.status(404).json({ error: '候选项不存在' });
    recipeId = candidate.recipe_id;
  }

  if (!recipeId) return res.status(400).json({ error: '中选菜谱为空，无法添加' });

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) return res.status(404).json({ error: '菜谱不存在' });

  const nickname = req.user.nickname;

  // Add to daily orders
  const existing = db.prepare(
    "SELECT * FROM daily_orders WHERE recipe_id = ? AND nickname = ? AND date(created_at) = date('now', 'localtime')"
  ).get(recipeId, nickname);
  if (!existing) {
    db.prepare('INSERT INTO daily_orders (recipe_id, nickname) VALUES (?, ?)').run(recipeId, nickname);
  }

  // Mark as added
  db.prepare('UPDATE votes SET winner_added_to_menu = 1 WHERE id = ?').run(vote.id);

  // Get the new order
  const order = db.prepare(`
    SELECT d.id as order_id, r.*, d.created_at as order_time, d.nickname
    FROM daily_orders d
    JOIN recipes r ON d.recipe_id = r.id
    WHERE d.id = (SELECT last_insert_rowid())
  `).get();
  if (order) {
    order.ingredients = JSON.parse(order.ingredients || '[]');
    broadcast('order_added', order);
  }

  broadcast('vote_winner_applied', { voteId: vote.id, recipe: { ...recipe, ingredients: JSON.parse(recipe.ingredients || '[]') } });
  res.json({ success: true, recipe });
});

export default router;
