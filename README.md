# 家庭点菜系统

> 一个轻量级的家庭点菜应用，解决"今天吃什么"的日常难题。家庭成员可以浏览菜谱、点菜、生成购物清单，所有操作通过 WebSocket 实时同步。

## 功能概览

| 模块 | 功能 | 说明 |
|------|------|------|
| 菜单浏览 | 分类筛选 / 关键词搜索 / 随机推荐 | 按荤菜、素菜、汤类、主食分类，支持菜名和描述模糊搜索 |
| 今日点菜 | 一键点菜 / 取消点菜 / 清空菜单 | 多人可点同一道菜，同一人不可重复点同菜 |
| 菜谱管理 | 新增 / 编辑 / 删除菜谱 | 支持图片上传（Base64）、食材标签、烹饪时间、难度、备注 |
| 菜谱详情 | 底部滑出弹窗 | 大图预览、食材列表、快捷加入今日菜单 |
| 菜谱分享 | 生成分享链接 | 免登录查看，一键复制链接分享给家人 |
| 购物清单 | 自动聚合食材 | 根据今日菜单自动生成，支持导出文本 |
| 历史记录 | 按日期归档 | 懒加载 90 天历史，按菜品聚合展示 |
| 用户系统 | 注册 / 登录 | JWT 鉴权，支持多用户 |
| 实时同步 | WebSocket | 点菜/菜谱变更实时广播，顶部连接状态指示灯 |

## 技术栈

**前端**
- React 18 + Vite 5
- TailwindCSS 3.4
- WebSocket (原生 API)

**后端**
- Express 4
- better-sqlite3 (SQLite WAL 模式)
- ws 8 (WebSocket 服务端)
- jsonwebtoken + bcryptjs (JWT 鉴权)

## 项目结构

```
点单系统/
├── src/                        # 前端源码
│   ├── main.jsx                # 入口
│   ├── App.jsx                 # 根组件 + 路由
│   ├── index.css               # 全局样式
│   ├── context/                # React Context 状态管理
│   │   ├── AuthContext.jsx      #   用户认证
│   │   ├── MenuContext.jsx      #   菜谱 & 点菜数据
│   │   ├── ToastContext.jsx     #   消息提示
│   │   └── WSContext.jsx        #   WebSocket 连接
│   ├── components/
│   │   └── RecipeDetail.jsx     # 菜谱详情弹窗
│   └── pages/
│       ├── MenuBrowser.jsx      # 菜单浏览页
│       ├── TodayMenu.jsx        # 今日点菜页
│       ├── History.jsx          # 历史记录页
│       ├── ShoppingList.jsx     # 购物清单页
│       ├── RecipeManager.jsx    # 菜谱管理页
│       ├── Login.jsx            # 登录/注册页
│       └── ShareRecipe.jsx      # 分享菜谱页
├── server/                     # 后端源码
│   ├── index.js                # Express 入口 + HTTP Server
│   ├── db.js                   # SQLite 初始化 + 数据迁移 + 种子数据
│   ├── ws.js                   # WebSocket 服务端（广播/保活）
│   ├── middleware/
│   │   └── auth.js             #   JWT 鉴权中间件
│   └── routes/
│       ├── auth.js             #   认证接口（注册/登录/当前用户）
│       ├── api.js              #   业务接口（菜谱/点菜/历史）
│       └── shares.js           #   分享接口（创建/删除/公开查看）
├── data/                       # SQLite 数据库文件（运行时生成）
├── dist/                       # 构建产物
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与启动

```bash
# 克隆项目
git clone <repo-url>
cd 点单系统

# 安装依赖
npm install

# 开发模式（前端热更新 + 后端服务）
npm run dev       # 终端1：Vite 开发服务器 http://localhost:3000
npm run server    # 终端2：Express 后端 http://localhost:3001

# 生产构建 + 启动
npm run start     # 构建 + 启动后端，服务地址 http://localhost:3001
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 后端服务端口 |
| `JWT_SECRET` | 随机生成 | JWT 签名密钥，生产环境务必设置，否则重启后需重新登录 |

```bash
# 推荐：生产环境设置固定密钥
export JWT_SECRET="your-random-secret-string"
```

## API 接口

### 认证接口（无需 Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册用户 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户（需 Token） |

### 业务接口（需要 Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/recipes` | 获取菜谱列表（支持 `?category=` `?search=` 筛选） |
| GET | `/api/recipes/:id` | 获取单个菜谱 |
| POST | `/api/recipes` | 新增菜谱 |
| PUT | `/api/recipes/:id` | 更新菜谱 |
| DELETE | `/api/recipes/:id` | 删除菜谱 |
| GET | `/api/orders` | 获取今日菜单 |
| POST | `/api/orders` | 点菜 |
| DELETE | `/api/orders/:id` | 取消点菜 |
| DELETE | `/api/orders` | 清空今日菜单 |
| GET | `/api/history/dates` | 获取历史日期列表 |
| GET | `/api/history/:date` | 获取指定日期的点菜记录 |

### 分享接口

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/shares` | 需要 | 创建分享链接 |
| DELETE | `/api/shares/:id` | 需要 | 删除分享 |
| GET | `/api/shared/:token` | 不需要 | 通过分享 Token 查看菜谱 |

### WebSocket

连接地址：`ws://<host>:<port>/ws?token=<jwt_token>`

广播事件类型：

| 事件 | 触发时机 |
|------|----------|
| `recipe_added` | 新增菜谱 |
| `recipe_updated` | 更新菜谱 |
| `recipe_deleted` | 删除菜谱 |
| `order_added` | 有人点菜 |
| `order_removed` | 有人取消点菜 |
| `orders_cleared` | 清空今日菜单 |

## 数据库

使用 SQLite，WAL 模式，数据文件位于 `data/family-menu.db`，首次启动自动初始化。

| 表名 | 说明 |
|------|------|
| `recipes` | 菜谱表（名称、分类、图片、食材、烹饪时间、难度等） |
| `daily_orders` | 每日点菜记录（关联菜谱 ID、昵称、时间） |
| `users` | 用户表（用户名、密码哈希、昵称） |
| `shares` | 分享记录（关联菜谱 ID、Token） |

首次启动时会自动插入 4 道默认菜谱作为种子数据。

## 局域网部署

本项目设计为家庭局域网使用，启动后其他设备可通过内网 IP 访问：

```bash
# 启动生产服务
npm run start

# 查看本机局域网 IP
ifconfig | grep "inet " | grep -v 127.0.0.1
# 例：192.168.1.100

# 其他设备访问
# http://192.168.1.100:3001
```

后端默认监听 `0.0.0.0`，局域网内所有设备均可访问。

## 开发历程

| 日期 | 版本 | 主要变更 |
|------|------|----------|
| 06-03 | v1.0 | 项目初始化：菜谱 CRUD、点菜、购物清单 |
| 06-03 | v1.1 | 每日自动清空、多人同菜、搜索筛选 |
| 06-03 | v1.2 | 用户登录系统（JWT + bcryptjs） |
| 06-03 | v1.3 | 安全加固、性能优化、Bug 修复 |
| 06-03 | v1.4 | Toast 消息提示 |
| 06-04 | v1.5 | WebSocket 实时同步、菜谱详情弹窗、历史记录 |
| 06-04 | v1.6 | 随机推荐、采购导出、菜谱分享 |

## License

MIT
