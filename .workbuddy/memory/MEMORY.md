# 家年华 - 项目长期记忆

## 应用定位
家庭综合应用平台，原名「家庭点菜系统」，2026-06-09 改造为「家年华」

## 架构模式
「应用中心 Hub」模式：首页展示应用卡片，点击进入各子应用，不用 react-router，用 currentApp state 切换。

## 当前子应用
| key | 名称 | 状态 | 说明 |
|-----|------|------|------|
| menu | 点单 | 已有 | 完整保留，有菜单/今日/计划/投票/记录/采购/菜谱 |
| notice | 备忘 | 已有 | 家庭公告 + 个人待办，后端 notices 表 |
| profile | 我的 | 新增 | 个人中心 + 版本更新日志 |
| mall | 商城 | 新增 | 积分商城：商品浏览、积分兑换、兑换记录 |

## 技术栈
- 前端：React 18 + Vite 5 + Tailwind CSS
- 后端：Express + SQLite (better-sqlite3)
- 实时：WebSocket (ws 库)
- 认证：JWT（30天过期）
- 端口：3001（后端）/ 5173（Vite dev）

## 数据库
路径：`data/family-menu.db`
主要表：recipes, daily_orders, users, shares, weekly_plans, votes, vote_candidates, vote_records, user_preferences, notices, mall_items, redemption_records, version_logs

## 关键文件
- `src/App.jsx`：顶层入口，Hub 状态机
- `src/pages/HomePage.jsx`：Hub 首页
- `src/pages/NoticeBoard.jsx`：备忘/公告模块
- `server/routes/notices.js`：备忘 API
- `src/index.css`：CSS 变量（--accent 橙色 #D4743C）

## 扩展约定
新增子应用：
1. 在 `src/pages/` 新建页面组件，接受 `{ onBack }` prop
2. 在 `src/pages/HomePage.jsx` 的 APPS 数组加卡片
3. 在 `src/App.jsx` 的 AppContent 加 `{currentApp === 'xxx' && ...}`
4. 若需后端，在 `server/routes/` 新建路由并在 `server/index.js` 注册
