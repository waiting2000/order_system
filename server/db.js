import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'family-menu.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '荤菜',
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    ingredients TEXT DEFAULT '[]',
    cookTime INTEGER DEFAULT 30,
    difficulty TEXT DEFAULT '简单',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS daily_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    nickname TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );
`);

// Migration: add nickname column (safe to ignore if exists)
try { db.exec(`ALTER TABLE daily_orders ADD COLUMN nickname TEXT DEFAULT ''`); } catch (e) { /* already exists */ }

// Users table for authentication
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

// Shares table for recipe sharing
db.exec(`
  CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );
`);

// Weekly meal plans
db.exec(`
  CREATE TABLE IF NOT EXISTS weekly_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    created_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE(week_start, day_of_week)
  );
`);

// Voting tables
db.exec(`
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    max_votes_per_user INTEGER DEFAULT 3,
    closes_at TEXT,
    status TEXT DEFAULT 'active',
    created_by TEXT NOT NULL,
    winner_recipe_id INTEGER,
    winner_added_to_menu INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (winner_recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS vote_candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vote_id INTEGER NOT NULL,
    recipe_id INTEGER,
    custom_name TEXT DEFAULT '',
    added_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vote_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vote_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    nickname TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES vote_candidates(id) ON DELETE CASCADE,
    UNIQUE(vote_id, candidate_id, nickname)
  );
`);

// User dietary preferences
db.exec(`
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    allergies TEXT DEFAULT '[]',
    dislikes TEXT DEFAULT '[]',
    dietary_type TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 版本更新日志表
db.exec(`
  CREATE TABLE IF NOT EXISTS version_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    release_date TEXT NOT NULL,
    changes TEXT NOT NULL DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

// Seed default recipes if table is empty
const count = db.prepare('SELECT COUNT(*) as cnt FROM recipes').get();
if (count.cnt === 0) {
  const insert = db.prepare(`
    INSERT INTO recipes (name, category, image, description, ingredients, cookTime, difficulty)
    VALUES (@name, @category, @image, @description, @ingredients, @cookTime, @difficulty)
  `);

  const defaults = [
    {
      name: '红烧排骨',
      category: '荤菜',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      description: '软烂入味，酱香浓郁的家常红烧排骨',
      ingredients: JSON.stringify(['排骨', '生抽', '老抽', '冰糖', '姜', '八角', '料酒']),
      cookTime: 60,
      difficulty: '中等'
    },
    {
      name: '番茄炒蛋',
      category: '素菜',
      image: 'https://images.unsplash.com/photo-1592417817096-c2fba3a8b9b7?w=400',
      description: '经典家常菜，酸甜可口，老少皆宜',
      ingredients: JSON.stringify(['番茄', '鸡蛋', '葱花', '盐', '糖']),
      cookTime: 15,
      difficulty: '简单'
    },
    {
      name: '酸辣汤',
      category: '汤类',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
      description: '开胃暖身，酸辣适中的家常汤品',
      ingredients: JSON.stringify(['豆腐', '木耳', '鸡蛋', '醋', '白胡椒粉', '香菜']),
      cookTime: 20,
      difficulty: '简单'
    },
    {
      name: '蛋炒饭',
      category: '主食',
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
      description: '粒粒分明的蛋炒饭，简单又好吃',
      ingredients: JSON.stringify(['米饭', '鸡蛋', '火腿', '青豆', '葱花', '盐']),
      cookTime: 10,
      difficulty: '简单'
    }
  ];

  const insertMany = db.transaction((recipes) => {
    for (const r of recipes) {
      insert.run(r);
    }
  });

  insertMany(defaults);
  console.log('  ✓ 已初始化 4 道默认菜谱');
}

// 种子版本更新日志（仅在表为空时插入）
const versionCount = db.prepare('SELECT COUNT(*) as cnt FROM version_logs').get();
if (versionCount.cnt === 0) {
  const insertVersion = db.prepare(`
    INSERT INTO version_logs (version, release_date, changes) VALUES (?, ?, ?)
  `);

  const versions = [
    {
      version: 'v1.0',
      releaseDate: '2026-06-01',
      changes: JSON.stringify([
        '系统上线：点单、备忘两大核心模块',
        '菜谱管理（CRUD + 导入导出）',
        '每日点单 + 周计划编排',
        '投票功能（提名 + 投票 + 中选入菜）',
        '饮食偏好（过敏原/忌口标记）',
        '家庭公告 + 个人待办',
        'WebSocket 实时同步',
        '用户注册/登录（JWT 认证）'
      ])
    },
    {
      version: 'v1.1',
      releaseDate: '2026-06-09',
      changes: JSON.stringify([
        '新增「我的」页面：展示个人信息与饮食偏好摘要',
        '版本更新日志时间线展示',
        '优化应用卡片布局'
      ])
    }
  ];

  const insertManyVersions = db.transaction((items) => {
    for (const v of items) {
      insertVersion.run(v.version, v.releaseDate, v.changes);
    }
  });

  insertManyVersions(versions);
  console.log('  ✓ 已初始化 2 条版本更新日志');
}

export default db;
