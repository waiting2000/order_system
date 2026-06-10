# 家年华 ·【我的】页面专项样式设计

> 版本：v1.0 | 日期：2026-06-10 | 设计：小w

---

## 一、设计目标与视觉风格

### 1.1 定位

「我的」页面是家年华应用的个人中心，承载**用户信息展示、偏好管理、行为记录回溯、版本更新日志、账号操作**等核心功能。样式设计遵循**微信小程序 / 日常工具类应用**的视觉习惯：卡片式布局、大圆角、轻阴影、高对比度文字层级、触控友好的点击区域。

### 1.2 视觉关键词

- **温润克制**：延续项目主色调 `#F9F6F0` 的暖奶油底色，大面积留白，信息密度适中
- **卡片叙事**：每块信息独立成卡，卡片间用间距呼吸，替代分割线
- **小程序感**：圆角充足（16–20px）、轻微毛玻璃 Header、触控缩放反馈、列表项右箭头引导
- **专色标识**：「我的」模块使用独立绿色系（`#739D73`）作为模块主色，与 HomePage 应用卡片配色保持一致

### 1.3 整体布局结构（自上而下）

```
┌─────────────────────────────────┐
│  ← 返回         我的           │  ← 毛玻璃 Header（h-14）
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │  [头像]  辰哥            │  │  ← 用户信息卡（头像 + 昵称 + 账号）
│  │          @username       │  │
│  │  ─────────────────────── │  │
│  │  用户名         zhichen  │  │
│  │  昵称           辰哥     │  │  ← 信息条目列表（标签-值）
│  │  注册时间   2026-06-01   │  │
│  │  积分余额        120 🪙  │  │
│  │  ─────────────────────── │  │
│  │  饮食偏好                │  │
│  │  [素食] [过敏：花生]     │  │  ← 偏好标签
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  兑换记录         查看全部 >│  │  ← 兑换记录卡（可折叠）
│  │  [家务券  -50积分  06-09] │  │
│  │  [免做菜券 -80积分  06-05] │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌─ 更新日志 ──────────────┐  │
│  │  ○ v1.2.0  2026-06-10  │  │
│  │  │  新增商城模块        │  │  ← 时间线 + 可折叠日志
│  │  ● v1.1.0  2026-06-05  │  │
│  │  │  新增备忘功能        │  │
│  │  ○ v1.0.0  2026-06-01  │  │
│  └─────────────────────────┘  │
│                                 │
│  [        退出登录        ]   │  ← 危险操作按钮
└─────────────────────────────────┘
```

---

## 二、目标元素范围

### 2.1 元素清单

| 编号 | 元素名称 | CSS 选择器 / 组件标识 | 说明 |
|------|----------|----------------------|------|
| E1 | 页面容器 | `.profile-page` | 全屏容器，底色 var(--bg) |
| E2 | Header 顶栏 | `.profile-header` | 毛玻璃效果，sticky 定位 |
| E3 | 返回按钮 | `.profile-back-btn` | 圆形图标按钮 |
| E4 | 页面标题 | `.profile-title` | 居中或左侧标题 |
| E5 | 用户信息卡 | `.profile-user-card` | 白色卡片，含头像+信息+偏好 |
| E6 | 用户头像 | `.profile-avatar` | 圆形头像占位，首字缩写 |
| E7 | 昵称/账号区 | `.profile-name-group` | 昵称+@username |
| E8 | 信息条目行 | `.profile-info-row` | label-value 水平排列 |
| E9 | 偏好标签 | `.profile-tag` | 小圆角标签 |
| E10 | 兑换记录卡 | `.profile-redemption-card` | 可折叠记录列表 |
| E11 | 兑换记录行 | `.profile-redemption-row` | 单条兑换记录 |
| E12 | 更新日志区 | `.profile-changelog` | 时间线+可折叠条目 |
| E13 | 时间线节点 | `.profile-timeline-dot` | 圆点节点 |
| E14 | 版本条目按钮 | `.profile-version-item` | 可折叠的卡片按钮 |
| E15 | 版本号标签 | `.profile-version-badge` | 胶囊形版本标签 |
| E16 | 展开图标 | `.profile-expand-icon` | Chevron 旋转图标 |
| E17 | 变更列表 | `.profile-change-list` | 展开后的变更内容 |
| E18 | 退出按钮 | `.profile-logout-btn` | 全宽危险色按钮 |

---

## 三、具体样式参数

### 3.1 页面容器（E1）

| 属性 | 值 | 说明 |
|------|-----|------|
| `background` | `var(--bg)` → `#F9F6F0` | 暖奶油底色 |
| `min-height` | `100vh` | 全屏高度 |
| `display` | `flex` + `flex-col` | 纵向弹性布局 |
| `max-width` | `672px`（Tailwind `max-w-2xl`） | 内容最大宽度 |
| `margin` | `0 auto` | 水平居中 |

### 3.2 Header 顶栏（E2）

| 属性 | 值 | 说明 |
|------|-----|------|
| `position` | `sticky` + `top: 0` | 吸顶 |
| `z-index` | `30` | 高于内容区 |
| `height` | `56px`（Tailwind `h-14`） | 标准导航栏高度 |
| `background` | `rgba(249, 246, 240, 0.88)` | 毛玻璃底色 |
| `backdrop-filter` | `blur(20px)` | 模糊效果 |
| `-webkit-backdrop-filter` | `blur(20px)` | Safari 兼容 |
| `border-bottom` | `1px solid var(--border-light)` → `#F0ECE5` | 底部分割 |

### 3.3 返回按钮（E3）

| 属性 | 值 | 说明 |
|------|-----|------|
| `width × height` | `32px × 32px` | 触控友好（≥44px 建议区域通过 padding 弥补） |
| `border-radius` | `50%` | 圆形 |
| `color` | `var(--text-tertiary)` → `#B8B2A8` | 低调色 |
| `display` | `flex` + `items-center` + `justify-center` | 居中图标 |
| `cursor` | `pointer` | 可点击 |

### 3.4 页面标题（E4）

| 属性 | 值 | 说明 |
|------|-----|------|
| `font-size` | `18px`（Tailwind `text-lg`） | 标题字号 |
| `font-weight` | `700`（Tailwind `font-bold`） | 粗体 |
| `color` | `var(--text-primary)` → `#2D2A25` | 主文本色 |
| `letter-spacing` | `-0.01em` | 轻微收紧 |

### 3.5 用户信息卡（E5）

| 属性 | 值 | 说明 |
|------|-----|------|
| `background` | `var(--surface)` → `#FFFFFF` | 白色卡片 |
| `border` | `1px solid var(--border)` → `#EBE6DE` | 浅边框 |
| `border-radius` | `16px`（Tailwind `rounded-2xl`，等同 `var(--radius-md)`） | 大圆角 |
| `padding` | `20px`（Tailwind `p-5`） | 内边距 |
| `margin-bottom` | `24px`（Tailwind `space-y-6`） | 卡片间距 |

### 3.6 用户头像（E6）

| 属性 | 值 | 说明 |
|------|-----|------|
| `width × height` | `56px × 56px`（Tailwind `w-14 h-14`） | 头像尺寸 |
| `border-radius` | `50%` | 圆形 |
| `background` | `var(--accent-light)` → `#FDF3EA` | 使用全局暖色（或模块绿 `#EDF5ED`） |
| `color` | `var(--accent)` → `#D4743C`（或模块绿 `#739D73`） | 文字色 |
| `font-size` | `24px`（Tailwind `text-2xl`） | 缩写字号 |
| `display` | `flex` + `items-center` + `justify-center` | 居中 |

> **配色方案建议**：头像底色、头像文字色、标签底色可切换为模块专属绿色（见 6.1），与 HomePage「我的」卡片 `color: '#EDF5ED', accent: '#739D73'` 保持一致。当前页面使用全局橙色，两种方案均可，建议团队统一决定。

### 3.7 昵称/账号区（E7）

| 属性 | 值 | 说明 |
|------|-----|------|
| 昵称 `font-size` | `18px`（Tailwind `text-lg`） | 主字号 |
| 昵称 `font-weight` | `700`（Tailwind `font-bold`） | 粗体 |
| 昵称 `color` | `var(--text-primary)` → `#2D2A25` | 主文本 |
| @账号 `font-size` | `12px`（Tailwind `text-xs`） | 辅助信息 |
| @账号 `color` | `var(--text-tertiary)` → `#B8B2A8` | 三级文本 |
| @账号 `margin-top` | `2px`（Tailwind `mt-0.5`） | 与昵称间距 |
| 整体 `gap` | `16px`（Tailwind `gap-4`） | 头像与文字间距 |

### 3.8 信息条目行（E8）

| 属性 | 值 | 说明 |
|------|-----|------|
| `display` | `flex` + `justify-between` + `items-center` | 两端对齐 |
| `padding-y` | `6px`（Tailwind `py-1.5`） | 纵向内边距 |
| 标签 `font-size` | `14px`（Tailwind `text-sm`） | 左侧标签 |
| 标签 `color` | `var(--text-tertiary)` → `#B8B2A8` | 三级灰 |
| 值 `font-size` | `14px`（Tailwind `text-sm`） | 右侧值 |
| 值 `font-weight` | `500`（Tailwind `font-medium`） | 中粗 |
| 值 `color` | `var(--text-primary)` → `#2D2A25` | 主文本 |
| 积分值 `color` | 全局橙 `var(--accent)` 或模块绿 `#739D73` | 强调色 |
| 积分值 `font-weight` | `700`（Tailwind `font-bold`） | 加粗 |
| 行间距 | `10px`（Tailwind `space-y-2.5`） | 条目间隔 |

### 3.9 偏好标签（E9）

| 属性 | 值 | 说明 |
|------|-----|------|
| `padding` | `4px 10px`（Tailwind `py-1 px-2.5`） | 标签内边距 |
| `border-radius` | `9999px`（Tailwind `rounded-full`） | 胶囊形 |
| `font-size` | `12px`（Tailwind `text-xs`） | 小字号 |
| `font-weight` | `500`（Tailwind `font-medium`） | 中粗 |
| 素食标签 `background` | `var(--accent-light)` → `#FDF3EA` | 暖色底 |
| 素食标签 `color` | `var(--accent)` → `#D4743C` | 暖色字 |
| 过敏标签 `background` | `#FDF0F0` | 红色底 |
| 过敏标签 `color` | `#C75B5B`（等同 `var(--danger)`） | 红色字 |
| 忌口标签 `background` | `#FFF8E1` | 黄色底 |
| 忌口标签 `color` | `#BF360C` | 深橙字 |
| 未设置文本 `color` | `var(--text-tertiary)` → `#B8B2A8` | 占位灰 |
| 标签间距 | `8px`（Tailwind `gap-2`） | flex-wrap |

### 3.10 兑换记录卡（E10）

| 属性 | 值 | 说明 |
|------|-----|------|
| `background` | `var(--surface)` → `#FFFFFF` | 白色卡片 |
| `border` | `1px solid var(--border)` | 边框 |
| `border-radius` | `16px`（`rounded-2xl`） | 大圆角 |
| `padding` | `20px`（Tailwind `p-5`） | 内边距 |
| 标题 `font-size` | `14px`（`text-sm`） | 标题字号 |
| 标题 `font-weight` | `700`（`font-bold`） | 粗体 |
| 空态文本 `color` | `var(--text-tertiary)` | 占位灰 |
| 空态 `text-align` | `center` | 居中 |

### 3.11 兑换记录行（E11）

| 属性 | 值 | 说明 |
|------|-----|------|
| `display` | `flex` + `items-center` + `justify-between` | 水平布局 |
| `padding` | `10px 12px`（`py-2.5 px-3`） | 行内边距 |
| `border-radius` | `12px`（`rounded-xl`） | 小圆角 |
| `background` | `var(--bg)` → `#F9F6F0` | 页面底色 |
| `border` | `1px solid var(--border)` | 浅边框 |
| 商品名 `font-size` | `14px`（`text-sm`） | |
| 商品名 `font-weight` | `500`（`font-medium`） | |
| 时间 `font-size` | `12px`（`text-xs`） | |
| 时间 `color` | `var(--text-tertiary)` | |
| 积分消耗 `color` | `var(--accent)` → `#D4743C` | |
| 积分消耗 `font-weight` | `700`（`font-bold`） | |
| 行间距 | `8px`（`space-y-2`） | |

### 3.12 更新日志区（E12）

| 属性 | 值 | 说明 |
|------|-----|------|
| `position` | `relative` | 相对定位（为时间线提供锚点） |
| `padding-left` | `24px`（`pl-6`） | 左侧留白给时间线 |
| `border-left` | `2px solid var(--border)` → `#EBE6DE` | 时间线竖线 |

### 3.13 时间线节点（E13）

| 属性 | 值 | 说明 |
|------|-----|------|
| `position` | `absolute` | |
| `left` | `-9px` | 对齐时间线 |
| `top` | `4px` | |
| `width × height` | `16px × 16px`（`w-4 h-4`） | |
| `border-radius` | `50%` | 圆形节点 |
| 最新节点 `background` | `var(--accent)` → `#D4743C` | 高亮 |
| 最新节点 `border` | `2px solid var(--accent-light)` → `#FDF3EA` | 发光效果 |
| 历史节点 `background` | `var(--border)` → `#EBE6DE` | 灰色 |
| 历史节点 `border` | `2px solid var(--bg)` → `#F9F6F0` | 融入底色 |

### 3.14 版本条目按钮（E14）

| 属性 | 值 | 说明 |
|------|-----|------|
| `width` | `100%` | 全宽可点击 |
| `text-align` | `left` | 左对齐 |
| `border-radius` | `12px`（`rounded-xl`） | |
| `padding` | `16px`（`p-4`） | |
| 最新版 `background` | `var(--accent-light)` → `#FDF3EA` | 暖色底 |
| 最新版 `border` | `1px solid rgba(212, 116, 60, 0.15)` | 半透明边框 |
| 历史版 `background` | `var(--surface)` → `#FFFFFF` | |
| 历史版 `border` | `1px solid var(--border)` | |
| `transition` | `background-color 150ms` | 背景色过渡 |
| 条目间距 | `20px`（`pb-5`，最后一项 `pb-0`） | |

### 3.15 版本号标签（E15）

| 属性 | 值 | 说明 |
|------|-----|------|
| `padding` | `2px 8px`（`py-0.5 px-2`） | |
| `border-radius` | `9999px`（`rounded-full`） | 胶囊形 |
| `font-size` | `12px`（`text-xs`） | |
| `font-weight` | `700`（`font-bold`） | |
| 最新版 `background` | `var(--accent)` → `#D4743C` | 实心强调 |
| 最新版 `color` | `#FFFFFF` | 白字 |
| 历史版 `background` | `var(--surface-hover)` → `#F5F0E8` | 浅灰底 |
| 历史版 `color` | `var(--text-secondary)` → `#8B857C` | 灰字 |

### 3.16 展开图标（E16）

| 属性 | 值 | 说明 |
|------|-----|------|
| `width × height` | `14px × 14px` | |
| `color` | `var(--text-tertiary)` → `#B8B2A8` | |
| `transform` | `rotate(0deg)` → 展开时 `rotate(180deg)` | 旋转动画 |
| `transition` | `transform 0.2s` | 200ms 缓动 |

### 3.17 变更列表项（E17）

| 属性 | 值 | 说明 |
|------|-----|------|
| `font-size` | `14px`（`text-sm`） | |
| `color` | `var(--text-secondary)` → `#8B857C` | |
| 圆点 `width × height` | `4px × 4px` | 小圆点前缀 |
| 圆点 `background` | `var(--text-tertiary)` | |
| 圆点 `border-radius` | `50%` | |
| 圆点 `margin-top` | `7px` | 垂直对齐 |
| 行间距 | `4px`（`space-y-1`） | |

### 3.18 退出登录按钮（E18）

| 属性 | 值 | 说明 |
|------|-----|------|
| `width` | `100%` | 全宽 |
| `padding-y` | `12px`（`py-3`） | 纵向内边距 |
| `border-radius` | `12px`（`rounded-xl`） | 圆角 |
| `font-size` | `14px`（`text-sm`） | |
| `font-weight` | `500`（`font-medium`） | |
| `background` | `var(--danger-light)` → `#FDF0F0` | 浅红底 |
| `color` | `var(--danger)` → `#C75B5B` | 红色字 |
| `transition` | `background-color 150ms` | 背景色过渡 |
| `margin-top` | `8px`（`pt-2`） | 上方间距 |
| `margin-bottom` | `24px`（`pb-6`） | 底部安全区 |

---

## 四、交互样式定义

### 4.1 通用交互规则

遵循移动端优先、触控友好的小程序交互模式：

| 交互类型 | 触发条件 | 表现 |
|----------|----------|------|
| **点击反馈** | `:active`（触控） | 背景色切换 + 轻微缩放（scale 0.97–0.98） |
| **悬停** | `:hover`（桌面端） | 背景色微变，仅桌面端生效 |
| **选中** | 展开/折叠、Tab 切换 | 动画过渡 + 状态色变化 |
| **加载中** | 数据获取 | 底部 Loading 或骨架屏 |
| **空态** | 无数据 | 居中灰色提示文本 |
| **禁用** | 不可操作 | opacity 降低 + cursor not-allowed |

### 4.2 各元素详细交互

#### 4.2.1 返回按钮（E3）

```
默认态：color: var(--text-tertiary), background: transparent
hover态（桌面）：color: var(--text-primary), background: var(--surface-hover)
active态（触控）：opacity: 0.6, scale: 0.92
transition: all 0.15s ease
```

#### 4.2.2 版本条目按钮（E14）

```
默认态：按 idx 区分背景（最新版 accent-light，历史版 surface）
hover态（桌面）：
  - 最新版：background 加深至 rgba(212, 116, 60, 0.12)
  - 历史版：background 切换至 var(--surface-hover)
active态（触控）：opacity 0.9, scale 0.985
transition: background-color 0.15s
```

#### 4.2.3 展开图标（E16）

```
折叠态：transform: rotate(0deg)
展开态：transform: rotate(180deg)
transition: transform 0.2s ease
点击区域：跟随父级 button，整行可点击
```

#### 4.2.4 退出登录按钮（E18）

```
默认态：浅红底 + 红字
hover态（桌面）：background 加深至 rgba(199, 91, 91, 0.12)
active态（触控）：opacity 0.85, scale 0.98
transition: background-color 0.15s, opacity 0.1s
```

#### 4.2.5 信息条目行（E8）

```
默认态：纯文本，无交互（仅展示）
无需 hover/active 反馈
```

#### 4.2.6 偏好标签（E9）

```
默认态：纯展示，无交互
无需 hover/active 反馈
```

#### 4.2.7 兑换记录行（E11）

```
默认态：纯展示，无交互
（未来可扩展点击跳转，届时需增加 hover/active 反馈）
```

### 4.3 动画参数汇总

| 动画 | 属性 | 时长 | 缓动 | 触发时机 |
|------|------|------|------|----------|
| 展开/折叠 | `transform` | 200ms | `ease` | 点击版本条目 |
| 背景色变化 | `background-color` | 150ms | — | hover/active |
| 按钮缩放 | `transform: scale` | 150ms | — | active |
| 页面进入 | — | — | — | 无（保持干净） |
| Loading 弹跳 | `animation: bounce` | — | 默认 | 数据加载中 |

---

## 五、样式编写规范

### 5.1 沿用项目现有规则

本项目使用 **Tailwind CSS** + **CSS 自定义属性（CSS Variables）** 的混合模式。所有新增样式必须遵循以下铁律：

#### 规则 1：优先使用 CSS 变量

禁止在任何组件中硬编码色值、阴影值、圆角值。必须使用项目中 `src/index.css` 定义的 CSS 变量。

```css
/* ✅ 正确 */
color: var(--text-primary);
background: var(--surface);
box-shadow: var(--shadow-sm);

/* ❌ 错误 */
color: #2D2A25;
background: #FFFFFF;
box-shadow: 0 1px 2px rgba(45,42,37,0.04);
```

#### 规则 2：组件内联样式优先 style={}

项目统一使用 React inline style（style 属性）书写组件特定样式，搭配 Tailwind 类名处理布局和间距。

```jsx
// ✅ 正确：布局用 Tailwind，色彩用 style
<div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

// ❌ 错误：不要在 CSS 文件中写组件样式，不要混用 className 传色值
<div className="bg-white border border-gray-200 rounded-2xl p-5">
```

#### 规则 3：色值层级

- **主文本** → `var(--text-primary)` = `#2D2A25`
- **辅助文本** → `var(--text-secondary)` = `#8B857C`
- **占位/弱化文本** → `var(--text-tertiary)` = `#B8B2A8`
- **强调色（全局）** → `var(--accent)` = `#D4743C`
- **成功色** → `var(--success)` = `#739D73`
- **危险色** → `var(--danger)` = `#C75B5B`
- **模块专属色** → 如需使用，统一定义为 CSS 变量引入（见 6.1），不可散落硬编码

#### 规则 4：Tailwind 类名规范

| 用途 | 推荐类名 |
|------|----------|
| 圆角 | `rounded-xl`(12px), `rounded-2xl`(16px), `rounded-full`(胶囊) |
| 内边距 | `p-4`(16px), `p-5`(20px), `py-1.5`(6px), `px-3`(12px) |
| 外边距/间距 | `space-y-6`(24px), `gap-4`(16px), `mt-2`(8px) |
| 字号 | `text-xs`(12px), `text-sm`(14px), `text-lg`(18px) |
| 字重 | `font-medium`(500), `font-bold`(700) |
| 弹性布局 | `flex`, `flex-col`, `items-center`, `justify-between` |
| 宽度 | `w-full`, `max-w-2xl`(672px) |

#### 规则 5：触控友好

- 所有可点击元素最小视觉尺寸 ≥ 32px（建议 44px 点击区域）
- 使用 `active:scale-95` 或自定义 active 反馈
- 使用项目已有的 `tap-highlight` 类（定义在 `index.css`）：
  ```css
  @media (hover: none) {
    .tap-highlight:active {
      background: var(--surface-hover);
      transition: background 0.05s;
    }
  }
  ```

#### 规则 6：毛玻璃 Header

所有子页面 Header 统一使用相同的毛玻璃样式，直接复用以下 style 对象：

```js
style={{
  background: 'rgba(249, 246, 240, 0.88)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderBottom: '1px solid var(--border-light)',
}}
```

#### 规则 7：避免过度设计

- 不用复杂的 CSS 动画（仅保留 transform/opacity transition）
- 不引入第三方动画库
- 不写 @keyframes（除非确有必要，且先与团队确认）
- 不上渐变背景、不用 box-shadow 做浮层（保持卡片扁平轻阴影）

### 5.2 新增模块专属色变量（建议）

若采用模块绿方案，在 `src/index.css` 的 `:root` 中新增：

```css
--profile-accent: #739D73;
--profile-accent-light: #EDF5ED;
--profile-accent-ring: rgba(115, 157, 115, 0.15);
```

然后用 CSS 变量引用，避免组件内硬编码 `#739D73`。

---

## 六、配色方案对比

### 6.1 方案 A：全局橙色（当前方案）

「我的」页面沿用项目全局 accent 色（`#D4743C` 橙色），与点单、商城等其他模块视觉统一。

| 元素 | 色值 |
|------|------|
| 头像底色 | `#FDF3EA`（`var(--accent-light)`） |
| 头像文字 | `#D4743C`（`var(--accent)`） |
| 积分余额 | `#D4743C`（`var(--accent)`） |
| 兑换积分消耗 | `#D4743C`（`var(--accent)`） |
| 时间线最新节点 | `#D4743C`（`var(--accent)`） |
| 偏好标签 | `#FDF3EA` / `#D4743C` |

**优点**：统一、简洁，减少 CSS 变量数量。
**缺点**：与 HomePage「我的」卡片（绿色 `#739D73`）不一致，模块辨识度低。

### 6.2 方案 B：模块专属绿色（推荐）

「我的」页面使用独立绿色 accent，与 HomePage 应用卡片的 `"我的": { color: '#EDF5ED', accent: '#739D73' }` 对应。

| 元素 | 色值 |
|------|------|
| 头像底色 | `#EDF5ED`（`var(--profile-accent-light)`） |
| 头像文字 | `#739D73`（`var(--profile-accent)`） |
| 积分余额 | `#739D73`（`var(--profile-accent)`） |
| 兑换积分消耗 | `#739D73`（`var(--profile-accent)`） |
| 时间线最新节点 | `#739D73`（`var(--profile-accent)`） |
| 偏好标签 | `#EDF5ED` / `#739D73` |

**优点**：每个模块有独立视觉识别，进入「我的」页面能感知到视觉切换；与 HomePage 卡片配色呼应。
**缺点**：需新增 2–3 个 CSS 变量。

**推荐**：方案 B。这与项目「应用中心 Hub」的架构理念一致——每个子应用有独立的色彩标识。

---

## 七、响应式适配

| 断点 | 策略 |
|------|------|
| 手机竖屏（< 640px） | 默认布局，`px-5` 水平内边距 |
| 平板/桌面（≥ 640px） | `max-w-2xl`（672px）居中，`mx-auto` |
| 桌面端 | 启用 `:hover` 伪类，触控端仅 `:active` |
| 安全区 | iOS 底部安全区通过 `pb-6` / `pb-8` 处理 |

> 项目不设暗色模式，所有色值以亮色为准。

---

## 八、实施建议

### 8.1 实施优先级

| 优先级 | 范围 | 工作量 |
|--------|------|--------|
| P0 | 统一 CSS 变量引用、清理硬编码色值 | 0.5h |
| P1 | 引入模块绿配色方案（方案 B） | 0.5h |
| P2 | 细化 touch feedback（active 缩放、tap-highlight） | 0.5h |
| P3 | 兑换记录"查看全部"折叠/展开交互 | 1h |
| P4 | 骨架屏 Loading 替代现有弹跳动画 | 2h |

### 8.2 验收清单

- [ ] 所有色值均通过 CSS 变量引用，无硬编码
- [ ] 触控设备点击有 feedback（active 态）
- [ ] 桌面端 hover 有反馈
- [ ] 页面滚动时 Header 毛玻璃生效
- [ ] 版本日志展开/折叠动画流畅（200ms）
- [ ] 空态展示正常（无兑换记录、无更新日志）
- [ ] 与 HomePage「我的」卡片配色统一（若选方案 B）
- [ ] iPhone 底部安全区不遮挡退出按钮

---

*文档结束。如有疑问或需要调整，随时沟通。*
