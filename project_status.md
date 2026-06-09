# 家年华 · 项目现状文档

> 最后更新：2026-06-09 | 版本：v1.0

---

## 一、项目概况

### 1.1 基本信息

| 项 | 说明 |
|---|---|
| 项目名称 | **家年华**（原「家庭点菜系统」） |
| npm 包名 | `family-menu` |
| 业务定位 | 家庭综合应用平台，覆盖点菜、投票、计划、备忘等家庭日常场景 |
| 开发状态 | **核心功能已可用，持续迭代中** |
| 数据库路径 | `data/family-menu.db` |

### 1.2 整体架构

```
┌─────────────────────────────────────────┐
│              浏览器客户端                  │
│  React 18 + Vite 5 + Tailwind CSS        │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐   │
│  │  点单 App │ │ 备忘 App │ │ (扩展...) │   │
│  └────┬────┘ └────┬────┘ └──────────┘   │
│       │           │                      │
│  ┌────┴───────────┴──────────────────┐   │
│  │       Context 层（状态管理）        │   │
│  │  Auth / Menu / Plan / Vote / WS   │   │
│  └────────────────┬──────────────────┘   │
│                   │ HTTP + WebSocket     │
└───────────────────┼─────────────────────┘
                    │
┌───────────────────┼─────────────────────┐
│              Express 服务端               │
│  ┌───────────────┴───────────────────┐   │
│  │          路由层 (routes/)          │   │
│  │  auth / api / shares / plans /    │   │
│  │  votes / preferences / notices    │   │
│  └───────────────┬───────────────────┘   │
│  ┌───────────────┴───────────────────┐   │
│  │       中间件 (middleware/)         │   │
│  │  JWT 认证 (authMiddleware)         │   │
│  └───────────────┬───────────────────┘   │
│  ┌───────────────┴───────────────────┐   │
│  │     SQLite (better-sqlite3)       │   │
│  │     WAL 模式 + 外键约束            │   │
│  └───────────────────────────────────┘   │
│                                           │
│  WebSocket (ws) — 实时广播 /ws            │
└───────────────────────────────────────────┘
```

**架构模式：**「应用中心 Hub」模式。首页展示应用卡片，点击进入各子应用。不使用 react-router，用 `currentApp` state 切换。

### 1.3 技术栈明细

| 层级 | 技术 | 版本 |
|---|---|---|
| 前端框架 | React | 18.3.1 |
| 构建工具 | Vite | 5.3.1 |
| CSS 框架 | Tailwind CSS | 3.4.4 |
| 后端框架 | Express | 4.21.0 |
| 数据库 | SQLite (better-sqlite3) | 11.0.0 |
| 实时通信 | ws (WebSocket) | 8.21.0 |
| 认证 | JWT (jsonwebtoken) | 9.0.3 |
| 密码加密 | bcryptjs | 3.0.3 |
| 路由库 | react-router-dom | 7.17.0（仅引入，未实际使用路由功能）|

**服务端口：**
- 后端 API：`3001`
- Vite 开发服务器：`5173`（开发环境代理 `/api` → `3001`）
- WebSocket：`/ws`（共享 HTTP 3001 端口）

---

## 二、功能模块清单

### 2.1 子应用一览

| key | 名称 | 状态 | 说明 |
|---|---|---|---|
| `menu` | 点单 | ✅ 已完成 | 核心应用，含 7 个 tab（菜单/今日/计划/投票/记录/采购/菜谱） |
| `notice` | 备忘 | ✅ 已完成 | 家庭公告 + 个人待办事项 |

### 2.2 点单子应用 Tab 详解

| Tab | 状态 | 功能描述 |
|---|---|---|
| **菜单** (`browse`) | ✅ | 浏览、搜索、按分类筛选所有菜谱；支持食材过敏/忌口标记；点菜/取消点菜 |
| **今日** (`today`) | ✅ | 查看今日已点菜品（按人聚合）；实时同步（WebSocket）；支持清空 |
| **计划** (`plan`) | ✅ | 周计划编排，每天独立设置菜品；支持前后周浏览；支持清除某天计划 |
| **投票** (`vote`) | ✅ | 创建投票（标题、票数上限、截止时间）；提名候选人（从菜谱选/自定义）；投票/撤销/关闭；中选菜可一键加入今日菜单 |
| **记录** (`history`) | ✅ | 按日期查看历史点菜记录（最近 90 天） |
| **采购** (`shop`) | ✅ | 根据今日已点菜品自动汇总食材清单（去重+按频次排序） |
| **菜谱** (`manage`) | ✅ | 菜谱 CRUD（增删改查）；支持 Base64 图片上传；菜谱导出/导入 JSON |

### 2.3 备忘子应用功能

| 功能 | 状态 | 描述 |
|---|---|---|
| 家庭公告 | ✅ | 全员可见的公告板，发布/删除 |
| 个人待办 | ✅ | 仅自己可见的待办事项，勾选完成/取消完成/删除 |
| 权限控制 | ✅ | 仅作者可删除自己的公告/待办；仅所有者可切换待办状态 |

### 2.4 通用功能

| 功能 | 状态 | 描述 |
|---|---|---|
| 用户注册/登录 | ✅ | 用户名 + 密码 + 昵称，Bcrypt 加密 |
| JWT 认证 | ✅ | Bearer Token，30 天过期，remember-me 支持 |
| 饮食偏好 | ✅ | 过敏原标记、忌口食材、饮食类型；登录后全局生效 |
| 实时同步 | ✅ | WebSocket 广播：菜谱增删改、点菜/取消、清空、计划变更、投票变更 |
| 菜谱分享 | ✅ | 生成分享链接（无需登录查看），Token 唯一 |
| Toast 通知 | ✅ | 全局轻提示组件（success/error/info） |
| 自动重连 | ✅ | WebSocket 断线指数退避重连（1s→30s max） |

### 2.5 待开发功能

| 功能 | 优先级 | 说明 |
|---|---|---|
| 更多子应用 | 中 | 如家庭相册、记账、日程等 |
| 用户头像 | 低 | 当前仅显示昵称 |
| 分享过期机制 | 中 | 当前分享链接永久有效，无清理 |
| 数据备份/恢复 | 中 | SQLite 文件手动管理，无自动备份 |
| 分页/无限滚动 | 低 | 当前菜谱全量加载 |
| 暗色模式 | 低 | 当前仅支持浅色主题 |
| 移动端 PWA | 低 | 当前为响应式设计但非 PWA |

---

## 三、目录结构

```
点单系统/
├── index.html              # Vite 入口 HTML（SPA 挂载点）
├── package.json            # 依赖与脚本
├── vite.config.js          # Vite 构建配置（含 API 代理）
├── tailwind.config.js      # Tailwind 主题扩展（warm 色系）
├── postcss.config.js       # PostCSS 配置（Tailwind + Autoprefixer）
├── README.md               # 项目说明
│
├── data/                   # 数据目录
│   └── family-menu.db      # SQLite 数据库文件 + WAL 日志
│
├── dist/                   # Vite 构建产物（生产部署用）
│   ├── index.html
│   ├── assets/
│   │   ├── index-xxx.js
│   │   └── index-xxx.css
│
├── public/                 # 静态资源目录（当前为空）
│
├── server/                 # 后端代码
│   ├── index.js            # 服务入口（Express + WS 初始化）
│   ├── db.js               # 数据库初始化、建表、种子数据
│   ├── ws.js               # WebSocket 连接管理与广播
│   ├── middleware/
│   │   └── auth.js         # JWT 生成与验证中间件
│   └── routes/
│       ├── api.js          # 菜谱 CRUD + 今日菜单 + 历史记录
│       ├── auth.js         # 注册、登录、获取当前用户
│       ├── shares.js       # 菜谱分享（公开查看 + 认证管理）
│       ├── plans.js        # 周计划编排
│       ├── votes.js        # 投票完整流程
│       ├── preferences.js  # 用户饮食偏好
│       └── notices.js      # 家庭公告 + 个人待办
│
├── src/                    # 前端代码
│   ├── main.jsx            # React 挂载入口
│   ├── App.jsx             # 顶层应用：Auth 守卫 + Hub 状态机
│   ├── index.css           # 全局样式（CSS 变量 + Tailwind + 滚动条）
│   ├── context/            # React Context 状态管理
│   │   ├── AuthContext.jsx       # 认证状态（登录/注册/登出/Token管理）
│   │   ├── ToastContext.jsx      # 全局 Toast 通知
│   │   ├── WSContext.jsx         # WebSocket 连接管理（重连/事件分发）
│   │   ├── MenuContext.jsx       # 菜谱+今日菜单+采购清单（核心业务状态）
│   │   ├── PreferenceContext.jsx # 用户饮食偏好（过敏/忌口）
│   │   ├── PlanContext.jsx       # 周计划管理
│   │   └── VoteContext.jsx       # 投票管理
│   ├── pages/              # 页面组件
│   │   ├── HomePage.jsx          # Hub 首页（应用卡片）
│   │   ├── Login.jsx             # 登录/注册页
│   │   ├── MenuBrowser.jsx       # 菜单浏览（搜索+分类筛选+点菜）
│   │   ├── TodayMenu.jsx         # 今日菜单
│   │   ├── WeeklyPlan.jsx        # 周计划
│   │   ├── VotePage.jsx          # 投票页
│   │   ├── History.jsx           # 历史记录
│   │   ├── ShoppingList.jsx      # 采购清单
│   │   ├── RecipeManager.jsx     # 菜谱管理（CRUD+导入导出）
│   │   ├── NoticeBoard.jsx       # 备忘（公告+待办）
│   │   └── ShareRecipe.jsx       # 菜谱分享查看页（免登录）
│   └── components/         # 通用组件
│       ├── PreferenceDialog.jsx  # 饮食偏好设置弹窗
│       ├── RecipePicker.jsx      # 菜谱选择器（弹窗搜索）
│       ├── RecipeDetail.jsx      # 菜谱详情弹窗
│       ├── AllergyBadge.jsx      # 过敏/忌口标记
│       └── VoteBanner.jsx        # 投票横幅提示
│
└── node_modules/           # 依赖包
```

### 各目录作用说明

| 目录 | 作用 |
|---|---|
| `server/` | 后端全部逻辑：Express 服务、路由、数据库初始化、中间件、WebSocket |
| `server/routes/` | 按业务模块拆分路由文件，每个文件负责一组 API |
| `server/middleware/` | JWT 认证中间件 |
| `src/` | 前端全部代码 |
| `src/context/` | 全局状态管理（React Context），每个 Context 对应一组业务逻辑 |
| `src/pages/` | 页面级组件，每个文件对应一个独立页面或 Tab |
| `src/components/` | 可复用 UI 组件（弹窗、选择器、标记等） |
| `data/` | SQLite 数据库文件存放目录 |
| `dist/` | Vite 构建输出，生产部署时 Express 从此目录提供静态文件 |

---

## 四、数据库表结构

### 4.1 表清单与关联关系

```
users ──1:1── user_preferences
  │
  │ (via nickname)
  ├── daily_orders ──N:1── recipes
  │
  ├── weekly_plans ──N:1── recipes
  │
  ├── votes ──1:N── vote_candidates ──1:N── vote_records
  │              │                         │
  │              └── N:1── recipes         └── (via nickname)
  │
  ├── notices ── (via author nickname)
  │
  └── shares ──N:1── recipes
```

### 4.2 recipes（菜谱表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | INTEGER | PK | 自增主键 |
| name | TEXT | ✓ | 菜名 |
| category | TEXT | ✓ | 分类：荤菜/素菜/汤类/主食/凉菜/海鲜/小吃/其他 |
| image | TEXT | | 图片 URL 或 Base64 |
| description | TEXT | | 菜品描述 |
| ingredients | TEXT | | JSON 数组字符串，如 `["排骨","生抽"]` |
| cookTime | INTEGER | | 烹饪时间（分钟），默认 30 |
| difficulty | TEXT | | 难度：简单/中等/困难 |
| created_at | TEXT | | 创建时间 |
| updated_at | TEXT | | 更新时间 |

### 4.3 daily_orders（每日点单表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | INTEGER | PK | 自增主键 |
| recipe_id | INTEGER | ✓ | 菜谱 ID，外键 → recipes.id，级联删除 |
| nickname | TEXT | | 点菜人昵称 |
| created_at | TEXT | | 点单时间 |

**业务规则：** 同一人同一天不能重复点同一道菜。

### 4.4 users（用户表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | INTEGER | PK | 自增主键 |
| username | TEXT | ✓ | 用户名，UNIQUE |
| password_hash | TEXT | ✓ | Bcrypt 加密的密码哈希 |
| nickname | TEXT | ✓ | 显示昵称 |
| created_at | TEXT | | 注册时间 |

### 4.5 shares（分享表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | INTEGER | PK | 自增主键 |
| recipe_id | INTEGER | ✓ | 菜谱 ID，外键 → recipes.id，级联删除 |
| token | TEXT | ✓ | 分享令牌（24 位 hex），UNIQUE |
| created_at | TEXT | | 创建时间 |

**业务规则：** 同一菜谱已有有效分享则复用 Token。

### 4.6 weekly_plans（周计划表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | INTEGER | PK | 自增主键 |
| week_start | TEXT | ✓ | 周一日期（YYYY-MM-DD） |
| day_of_week | INTEGER | ✓ | 星期几（0=周一，6=周日） |
| recipe_id | INTEGER | ✓ | 菜谱 ID，外键 → recipes.id，级联删除 |
| created_by | TEXT | | 创建者昵称 |
| created_at | TEXT | | 创建时间 |

**唯一约束：** `UNIQUE(week_start, day_of_week)` — 每周每天只能设置一个计划。

### 4.7 votes（投票表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | INTEGER | PK | 自增主键 |
| title | TEXT | ✓ | 投票标题 |
| max_votes_per_user | INTEGER | | 每人最多投票数，默认 3 |
| closes_at | TEXT | | 截止时间（ISO 格式），null 表示无截止 |
| status | TEXT | | 状态：active / closed |
| created_by | TEXT | ✓ | 发起人昵称 |
| winner_recipe_id | INTEGER | | 中选菜谱 ID（关闭时计算），外键 → recipes.id |
| winner_added_to_menu | INTEGER | | 是否已加入今日菜单（0/1） |
| created_at | TEXT | | 创建时间 |

### 4.8 vote_candidates（投票候选项表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | INTEGER | PK | 自增主键 |
| vote_id | INTEGER | ✓ | 投票 ID，外键 → votes.id，级联删除 |
| recipe_id | INTEGER | | 菜谱 ID（可为空，自定义候选），外键 → recipes.id |
| custom_name | TEXT | | 自定义菜名（非菜谱候选时使用） |
| added_by | TEXT | ✓ | 提名人昵称 |
| created_at | TEXT | | 创建时间 |

### 4.9 vote_records（投票记录表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | INTEGER | PK | 自增主键 |
| vote_id | INTEGER | ✓ | 投票 ID，外键 → votes.id，级联删除 |
| candidate_id | INTEGER | ✓ | 候选项 ID，外键 → vote_candidates.id，级联删除 |
| nickname | TEXT | ✓ | 投票人昵称 |
| created_at | TEXT | | 投票时间 |

**唯一约束：** `UNIQUE(vote_id, candidate_id, nickname)` — 同一人不可重复投同一候选项。

### 4.10 user_preferences（用户饮食偏好表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | INTEGER | PK | 自增主键 |
| user_id | INTEGER | ✓ | 用户 ID，外键 → users.id，级联删除，UNIQUE |
| allergies | TEXT | | 过敏原 JSON 数组，如 `["花生","虾"]` |
| dislikes | TEXT | | 忌口食材 JSON 数组 |
| dietary_type | TEXT | | 饮食类型（如"素食"） |
| created_at | TEXT | | 创建时间 |
| updated_at | TEXT | | 更新时间 |

### 4.11 notices（备忘表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | INTEGER | PK | 自增主键 |
| content | TEXT | ✓ | 内容文本 |
| author | TEXT | ✓ | 发布人昵称 |
| type | TEXT | | public（公告）/ todo（待办） |
| done | INTEGER | | 待办完成状态（0/1） |
| created_at | TEXT | | 创建时间 |
| updated_at | TEXT | | 更新时间 |

**注意：** notices 表在 `server/routes/notices.js` 中动态建表（`CREATE TABLE IF NOT EXISTS`），而非在 `db.js` 中统一管理。

---

## 五、已实现接口清单

### 5.1 认证接口（/api/auth/*）— 无需认证

| 方法 | 路径 | 入参 | 出参 | 说明 |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ username, password, nickname }` | `{ token, user }` | 注册，自动创建空的饮食偏好记录 |
| POST | `/api/auth/login` | `{ username, password }` | `{ token, user }` | 登录，返回 JWT |
| GET | `/api/auth/me` | Header: Bearer Token | `{ id, username, nickname }` | 获取当前用户信息（需认证） |

**校验规则：**
- 用户名：2-20 字符，不可重复
- 密码：至少 4 字符
- 昵称：不可为空
- 密码使用 Bcrypt (cost=10) 加密

### 5.2 菜谱接口（/api/recipes）— 需认证

| 方法 | 路径 | 入参 | 出参 | 说明 |
|---|---|---|---|---|
| GET | `/api/recipes` | `?category=&search=` | `Recipe[]` | 列表查询，支持分类筛选和关键字搜索 |
| GET | `/api/recipes/:id` | — | `Recipe` | 获取单个菜谱详情 |
| POST | `/api/recipes` | `{ name, category, image?, description?, ingredients[], cookTime?, difficulty? }` | `Recipe` | 新增菜谱，WS 广播 `recipe_added` |
| PUT | `/api/recipes/:id` | 同 POST（字段可选） | `Recipe` | 更新菜谱，WS 广播 `recipe_updated` |
| DELETE | `/api/recipes/:id` | — | `{ success: true }` | 删除菜谱，WS 广播 `recipe_deleted` |

**校验规则：** name 和 category 必填。ingredients 存储为 JSON 字符串。

### 5.3 今日菜单接口（/api/orders）— 需认证

| 方法 | 路径 | 入参 | 出参 | 说明 |
|---|---|---|---|---|
| GET | `/api/orders` | — | `Order[]` | 获取今日所有点单（含菜谱详情） |
| POST | `/api/orders` | `{ recipeId }` | `Order` | 点菜，同一人同天不可重复；WS 广播 `order_added` |
| DELETE | `/api/orders/:id` | — | `{ success: true }` | 按订单 ID 取消点菜；WS 广播 `order_removed` |
| DELETE | `/api/orders/recipe/:recipeId` | — | `{ success: true }` | 按菜谱 ID 取消点菜（无 WS 广播） |
| DELETE | `/api/orders` | — | `{ success: true }` | 清空今日所有点单；WS 广播 `orders_cleared` |

### 5.4 历史记录接口（/api/history）— 需认证

| 方法 | 路径 | 入参 | 出参 | 说明 |
|---|---|---|---|---|
| GET | `/api/history/dates` | — | `string[]` | 获取有记录的历史日期列表（最近 90 天） |
| GET | `/api/history/:date` | — | `Order[]` | 获取指定日期的点菜记录 |

**校验规则：** date 参数必须符合 YYYY-MM-DD 格式。

### 5.5 分享接口（/api/）— 混合认证

| 方法 | 路径 | 认证 | 入参 | 出参 | 说明 |
|---|---|---|---|---|---|
| POST | `/api/shares` | ✓ | `{ recipeId }` | `{ token }` | 创建/复用分享链接 |
| DELETE | `/api/shares/:id` | ✓ | — | `{ success: true }` | 删除分享 |
| GET | `/api/shared/:token` | ✗ | — | `Recipe` | 公开查看分享的菜谱（无需登录） |

### 5.6 饮食偏好接口（/api/users/preferences）— 需认证

| 方法 | 路径 | 入参 | 出参 | 说明 |
|---|---|---|---|---|
| GET | `/api/users/preferences` | — | `{ allergies[], dislikes[], dietaryType }` | 获取当前用户偏好（不存在则自动创建） |
| PUT | `/api/users/preferences` | `{ allergies[], dislikes[], dietaryType }` | 同上 | 保存/更新偏好 |

### 5.7 周计划接口（/api/plans）— 需认证

| 方法 | 路径 | 入参 | 出参 | 说明 |
|---|---|---|---|---|
| GET | `/api/plans` | `?weekStart=` | `{ weekStart, days[] }` | 获取指定周的计划 |
| GET | `/api/plans/today` | — | `{ plan, todayDate, dayOfWeek, dayLabel }` | 获取今天的计划（用于今日菜单联动） |
| PUT | `/api/plans/:weekStart/:dayOfWeek` | `{ recipeId }` | `{ weekStart, dayOfWeek, recipe }` | 设置/替换某天计划（Upsert），WS 广播 `plan_updated` |
| DELETE | `/api/plans/:weekStart/:dayOfWeek` | — | `{ success: true }` | 清除某天计划，WS 广播 `plan_updated` |

**校验规则：** dayOfWeek 必须为 0-6（0=周一）。

### 5.8 投票接口（/api/votes）— 需认证

| 方法 | 路径 | 入参 | 出参 | 说明 |
|---|---|---|---|---|
| GET | `/api/votes` | `?status=active/closed` | `Vote[]` | 获取投票列表（含候选数量） |
| GET | `/api/votes/:id` | — | `Vote` | 获取投票详情（含候选、票数、我的投票） |
| POST | `/api/votes` | `{ title, maxVotesPerUser?, closesAt?, candidates[] }` | `Vote` | 创建投票，WS 广播 `vote_created` |
| POST | `/api/votes/:id/candidates` | `{ recipeId?, customName? }` | `Vote` | 添加候选项，WS 广播 `vote_updated` |
| POST | `/api/votes/:id/vote` | `{ candidateIds[] }` | `Vote` | 投票（事务性替换旧票），WS 广播 `vote_updated` |
| DELETE | `/api/votes/:id/vote` | — | `Vote` | 撤销所有投票，WS 广播 `vote_updated` |
| POST | `/api/votes/:id/close` | — | `{ success, winnerRecipeId, winner }` | 关闭投票并计算胜者，WS 广播 `vote_closed` |
| POST | `/api/votes/:id/apply-winner` | `{ winnerCandidateId? }` | `{ success, recipe }` | 中选菜加入今日菜单，WS 广播 `order_added` + `vote_winner_applied` |

**业务规则：**
- 已关闭投票不能投票、不能添加候选
- 检查时间截止（closes_at）
- 投票数量不超过 maxVotesPerUser
- 同一候选不可重复提名
- winner_added_to_menu 防止重复加入今日菜单

### 5.9 备忘接口（/api/notices）— 需认证

| 方法 | 路径 | 入参 | 出参 | 说明 |
|---|---|---|---|---|
| GET | `/api/notices` | — | `Notice[]` | 获取家庭公告列表（type=public），最近 50 条 |
| GET | `/api/notices/todos` | — | `Notice[]` | 获取当前用户待办（仅自己的），按状态+时间排序 |
| POST | `/api/notices` | `{ content, type? }` | `Notice` | 新增公告或待办（type 默认 public） |
| PATCH | `/api/notices/:id/toggle` | — | `Notice` | 切换待办完成状态（仅所有者） |
| DELETE | `/api/notices/:id` | — | `{ ok: true }` | 删除（仅作者） |

### 5.10 WebSocket 事件清单

WebSocket 连接路径：`ws://host:port/ws?token=<jwt_token>`

| 事件类型 | 方向 | Payload | 触发场景 |
|---|---|---|---|
| `connected` | S→C | `{ online: number }` | 客户端连接成功 |
| `recipe_added` | S→C | `Recipe` | 任意用户新增菜谱 |
| `recipe_updated` | S→C | `Recipe` | 任意用户更新菜谱 |
| `recipe_deleted` | S→C | `{ id: number }` | 任意用户删除菜谱 |
| `order_added` | S→C | `Order` | 任意用户点菜 |
| `order_removed` | S→C | `{ order_id: number }` | 任意用户取消点菜 |
| `orders_cleared` | S→C | `{}` | 清空今日菜单 |
| `plan_updated` | S→C | `{ weekStart, dayOfWeek, recipe? }` | 周计划变更 |
| `vote_created` | S→C | `{ vote: Vote }` | 创建新投票 |
| `vote_updated` | S→C | `{ vote: Vote }` | 投票/提名变更 |
| `vote_closed` | S→C | `{ voteId, winner? }` | 投票关闭 |
| `vote_winner_applied` | S→C | `{ voteId, recipe }` | 中选菜加入菜单 |

---

## 六、开发规范与约定

### 6.1 命名规则

| 类别 | 规范 | 示例 |
|---|---|---|
| React 组件文件 | PascalCase | `MenuBrowser.jsx`, `HomePage.jsx` |
| Context 文件 | PascalCase + Context 后缀 | `AuthContext.jsx`, `MenuContext.jsx` |
| 服务端路由文件 | 小写，按业务命名 | `api.js`, `votes.js`, `notices.js` |
| CSS 变量 | kebab-case，前缀 `--` | `--bg`, `--text-primary`, `--accent` |
| API 路径 | RESTful 风格 | `/api/recipes`, `/api/votes/:id` |
| 数据库表名 | snake_case | `daily_orders`, `weekly_plans`, `user_preferences` |
| 数据库字段名 | snake_case | `recipe_id`, `created_at`, `max_votes_per_user` |
| JSON 字段 | camelCase（前端接收后） | 服务端 Snake → 前端自动为 Camel |

### 6.2 组件开发规范

- **页面组件** 接受 `{ onBack }` prop，用于返回 Hub 首页
- **Context 模式**：
  - 每个 Context 暴露 Provider + useHook 自定义 Hook
  - useHook 内部检查 Provider 存在性，缺失时 throw Error
- **子应用扩展**（新增子应用步骤）：
  1. 在 `src/pages/` 新建页面组件，接受 `{ onBack }` prop
  2. 在 `src/pages/HomePage.jsx` 的 `APPS` 数组添加卡片配置
  3. 在 `src/App.jsx` 的 `AppContent` 中添加 `{currentApp === 'xxx' && <XxxPage onBack={...} />}`
  4. 如需后端，在 `server/routes/` 新建路由文件，在 `server/index.js` 注册

### 6.3 CSS 变量体系（src/index.css）

```css
/* 背景 */
--bg: #F9F6F0            /* 页面底色 */
--surface: #FFFFFF       /* 卡片/弹窗底色 */
--surface-hover: #F5F0E8 /* 悬停态底色 */

/* 文字 */
--text-primary: #2D2A25   /* 主文字 */
--text-secondary: #8B857C /* 副文字 */
--text-tertiary: #B8B2A8  /* 辅助/占位文字 */

/* 强调色（橙色系） */
--accent: #D4743C          /* 主色 */
--accent-hover: #C0652F    /* 悬停 */
--accent-light: #FDF3EA    /* 浅底色 */
--accent-ring: rgba(...)   /* 聚焦环 */

/* 状态色 */
--success: #739D73
--success-light: #EDF5ED
--danger: #C75B5B
--danger-light: #FDF0F0

/* 边框与阴影 */
--border: #EBE6DE
--border-light: #F0ECE5
--shadow-sm / --shadow-md / --shadow-lg

/* 圆角 */
--radius-sm: 10px / --radius-md: 16px / --radius-lg: 20px / --radius-full: 9999px
```

### 6.4 Tailwind 自定义色系

在 `tailwind.config.js` 中扩展了 `warm` 色系（50-900），对应橙色主题，与 CSS 变量 `--accent` 系列一致。

### 6.5 公共常量（src/context/MenuContext.jsx）

```js
// 菜谱分类
export const CATEGORIES = ['荤菜', '素菜', '汤类', '主食', '凉菜', '海鲜', '小吃', '其他']

// 难度等级
export const DIFFICULTIES = ['简单', '中等', '困难']

// 空菜谱模板
export function createRecipe(data) { ... }
```

### 6.6 API 请求规范

- 认证 Header：`Authorization: Bearer <token>`
- Token 存储：登录时选择"记住我"存 localStorage，否则存 sessionStorage
- 后端统一 `authMiddleware` 将 `req.user` 注入 `{ id, username, nickname }`
- 响应格式：成功返回 JSON 数据，失败返回 `{ error: string }` + HTTP 状态码

### 6.7 数据库规范

- WAL 模式 + 外键约束开启
- 时间默认使用 `datetime('now', 'localtime')`
- 数组字段（ingredients、allergies、dislikes）使用 JSON 字符串存储
- 菜谱分类和难度在前端以常量维护，后端不做枚举约束
- 种子数据：首次启动时自动插入 4 道默认菜谱

---

## 七、已知问题与待优化点

### 7.1 安全隐患

| 问题 | 风险等级 | 说明 |
|---|---|---|
| JWT_SECRET 随机生成 | ⚠️ 中 | 未设置环境变量时使用随机密钥，服务重启后所有 Token 失效 |
| 无速率限制 | ⚠️ 中 | API 无请求频率限制，可被恶意高频调用 |
| 菜谱图片 Base64 直存 | ⚠️ 低 | 50MB body 限制，大量图片会导致数据库膨胀 |

### 7.2 功能缺失

| 问题 | 说明 |
|---|---|
| 分享链接无过期机制 | Token 永久有效，无清理逻辑，shares 表只增不减 |
| 未实现分页 | 菜谱列表全量返回，数据量大时性能下降 |
| 采购清单无持久化 | 每次基于今日点单实时计算，不保存历史采购记录 |
| 投票不支持图片 | 自定义候选项仅文本 |

### 7.3 代码质量问题

| 问题 | 说明 |
|---|---|
| NoticeBoard 中 token 获取不一致 | 直接读 `localStorage.getItem('token')`，而非 useAuth() 的 token |
| notices 表建表位置不统一 | 在 routes/notices.js 中建表，而其他表在 db.js |
| 删除订单接口不一致 | `/orders/:id` 有 WS 广播，`/orders/recipe/:recipeId` 没有 |
| 前端无 TypeScript | 所有 .jsx 文件为纯 JavaScript，无类型检查 |
| 无单元测试 | 没有前端/后端的任何测试覆盖 |

### 7.4 待优化体验

| 问题 | 说明 |
|---|---|
| 长菜谱列表滚动体验 | 无虚拟列表，大量菜谱时性能可能下降 |
| 移动端适配 | 底部导航栏固定布局，某些旧设备可能有 Safe Area 问题 |
| 错误处理不统一 | 部分接口返回中文错误信息，错误格式不够统一 |
| 加载状态 | Context 层 loading 只区分全局加载/完成，不支持局部 loading 状态 |
| 离线支持 | 无 Service Worker，无 PWA，离线完全不可用 |

### 7.5 运维相关

| 问题 | 说明 |
|---|---|
| 无日志系统 | 仅 console.log，无结构化日志/日志文件 |
| 无数据库备份 | SQLite 单文件，无自动备份或导出机制 |
| 无健康检查接口 | 无法通过 API 判断服务健康状态 |
| 进程管理 | 无 PM2/systemd 等进程守护配置 |

---

## 八、附录

### 8.1 启动命令

```bash
# 开发模式（前后端分离）
npm run server    # 启动后端 :3001
npm run dev       # 启动 Vite :5173（开发代理到 :3001）

# 生产模式
npm run build     # 构建前端
npm start         # 构建 + 启动后端（静态文件 + API 一体）
```

### 8.2 默认种子数据

首次启动时，系统自动创建 4 道默认菜谱：

| 菜名 | 分类 | 难度 | 时间 |
|---|---|---|---|
| 红烧排骨 | 荤菜 | 中等 | 60 分钟 |
| 番茄炒蛋 | 素菜 | 简单 | 15 分钟 |
| 酸辣汤 | 汤类 | 简单 | 20 分钟 |
| 蛋炒饭 | 主食 | 简单 | 10 分钟 |

### 8.3 扩展规划建议

基于当前架构，建议按以下顺序扩展：

1. **数据安全**：配置 JWT_SECRET 环境变量、增加数据库定期备份
2. **体验完善**：分享过期清理、分页加载
3. **新子应用**：家庭相册、记账本、日程
4. **工程化**：TypeScript 迁移、单元测试、CI/CD
5. **运维保障**：日志系统、健康检查、进程守护

---

_本文档基于 2026-06-09 项目代码分析生成，随项目迭代持续更新。_
