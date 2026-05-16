# VAT Atlas Reader — Spec A: 视觉系统 + P0 Bug 修复

**日期:** 2026-05-16
**作者:** 设计协作(用户 + Claude)
**状态:** 待用户确认 → 生成实施计划
**预期实施载体:** 单个分支 + 单个 PR(可拆 commit)
**后续 spec:** B(工具栏与抽屉重构)· C(导航与查找)

---

## 1. 目标与范围

### 1.1 目标

把当前阅读器从"功能跑通的工程草稿"提升到"视觉一致、可用性合格的产品形态"。

具体定义为:

1. **建立设计 token 与可复用 primitive**(颜色 / 字体 / 间距 / 按钮 / Pin / Tooltip / Callout / Toast)。
2. **统一替换 emoji 为图标库 SVG**,所有界面元素采用统一图标语言。
3. **修复 5 个已知 P0 bug**(高亮颜色 / Tooltip 截断 / TOC 链接 404 / alert() / setTimeout 初值)。
4. **接入 framer-motion**,完成抽屉、翻页、Pin 出现、按钮 hover 四类微动画。

### 1.2 范围内

- 设计 token(Tailwind v4 `@theme` 声明)
- 新增 `src/atlas-ui/primitives/` 目录:Button、IconButton、Pin、Tooltip、Callout、Toast、Drawer(共享头部)
- 改造 `ReaderShell`、`ReaderTopBar`、`ReaderBottomBar`、`Toolbar`(从 ReaderShell 拆出)
- 改造 `NotesDrawer`、`CommentPanel` 的 header + 空态
- 改造 `CommentPin`、`ContentBlockRenderer`(Callout 部分)
- 改造 `Tooltip`、`Term`
- 修复 `TOCPageTemplate` 的路由
- 替换 `MagazineReader` 中的 `alert()` 为 Toast
- 新增依赖:`lucide-react`、`@radix-ui/react-tooltip`、字体引入

### 1.3 范围外(明确推迟)

- 深色模式 / 主题切换 → 永久或后续 spec
- 移动端响应式打磨(顶栏折叠、抽屉适配、触控热区) → Spec D 或后续
- 常驻 TOC 侧栏、全局搜索、可点击进度条 → Spec C
- 工具栏布局重构(合并 TopBar + Toolbar、抽屉策略) → Spec B
- 任何新功能(分享、收藏、阅读历史等)

---

## 2. 视觉语言总览

### 2.1 基调

- **结构色温:** 深色 chrome(顶栏)+ 浅色阅读区
- **配色范围:** 仅 slate(中性 9 级)与 blue(强调 8 级),不引入任何其他色相
- **字体策略:** Source Serif Pro 标题 / Inter UI 与正文 / Noto Serif SC 中文标题 / JetBrains Mono 数字与法条编号
- **图标语言:** lucide-react,统一 stroke-width 2,统一 16/20/24 三个尺寸
- **强调色克制:** 每页面 ≤ 3 处使用 `accent` (blue-700),其他用 slate 表达层级
- **动画哲学:** 短促(120–200ms) · 弹簧仅用于抽屉 · 全局尊重 `prefers-reduced-motion`

### 2.2 状态如何不用色相区分

为符合"只用 blue + neutral"的约束,所有原本依靠色相区分的状态都改为:

| 维度 | 旧 | 新 |
|---|---|---|
| Pin open | 黄色 | 实心 blue-700 |
| Pin resolved | 绿色 | 空心白底 + blue-300 描边 + blue-700 勾 |
| Pin highlight | 复杂 | 实心 blue-900 + 4px halo |
| Callout info | 蓝 | slate-50 + slate-200 边 |
| Callout warning | 黄 | blue-50 + blue-200 边 |
| Callout risk | 红 | slate-900 反色背景 + blue-400 侧边(强冲击通过明暗) |
| Callout legal | 紫 | slate-50 + slate-900 侧边 |
| Callout evidence | 绿 | white + blue-700 侧边 |
| Delete button | 红 | slate-200 边 / 灰文字 → 二次确认时 slate-900 实心 |
| Progress bar | 灰 | blue-700 |

---

## 3. 设计 Token

### 3.1 颜色(语义命名,映射到 Tailwind v4 `@theme`)

```css
/* 在 src/styles/globals.css 内,Tailwind v4 @theme 块 */
@theme {
  /* Neutral */
  --color-chrome:        #0F172A; /* slate-900 — top bar, modal backdrop */
  --color-chrome-2:      #1E293B; /* slate-800 — chrome hover, risk callout bg */
  --color-text:          #0F172A; /* primary text on light bg */
  --color-text-2:        #475569; /* slate-600 — secondary text */
  --color-text-muted:    #94A3B8; /* slate-400 — meta, captions */
  --color-divider:       #CBD5E1; /* slate-300 */
  --color-border:        #E2E8F0; /* slate-200 — card / panel border */
  --color-surface:       #F1F5F9; /* slate-100 — page outer bg */
  --color-surface-2:     #F8FAFC; /* slate-50 — subtle fill, hover */
  --color-page:          #FFFFFF; /* reading area */

  /* Accent (blue) */
  --color-accent:        #1D4ED8; /* blue-700 — primary action */
  --color-accent-hover:  #1E40AF; /* blue-800 — hover */
  --color-accent-strong: #1E3A8A; /* blue-900 — pin-highlight, deep emphasis */
  --color-accent-2:      #60A5FA; /* blue-400 — risk callout side bar, pin glow */
  --color-accent-soft:   #93C5FD; /* blue-300 — resolved pin border */
  --color-accent-bg:     #DBEAFE; /* blue-100 — selected bg, accent-tinted area */
  --color-accent-bg-2:   #BFDBFE; /* blue-200 — accent border */
  --color-accent-bg-faint: #EFF6FF; /* blue-50 — warning callout bg */
}
```

Tailwind v4 `@theme` 暴露这些为 utility(`bg-accent`、`text-text-2` 等)。

### 3.2 字号阶梯

| Token | size / line | weight | 用途 |
|---|---|---|---|
| `text-title-page` | 28 / 32 | 700 | 页面主标题(serif) |
| `text-title-section` | 20 / 26 | 600 | 章节标题(serif) |
| `text-title-sub` | 16 / 22 | 600 | 小节标题(sans) |
| `text-body` | 14 / 22 | 400 | 正文 |
| `text-ui` | 13 / 16 | 500 | 按钮、菜单项 |
| `text-meta` | 11 / 14 | 400 | 元信息、计数 |
| `text-code` | 12 / 16 | 500 | 法条号、税率(mono · tabular-nums) |

### 3.3 字体加载

- 通过 `<link>` 在 `index.html` 引入 Google Fonts:Inter (400/500/600)、Source Serif Pro (600/700)、JetBrains Mono (500)。
- 中文回落:Noto Serif SC(标题)与 Noto Sans SC(正文)走系统字体或 CDN(暂不强制,如 Inter 已含部分中文则保留 fallback)。
- 字体声明集中在 `src/styles/globals.css`,使用 `font-family` 变量。

### 3.4 间距 / 圆角 / 阴影

| Token | px | 用途 |
|---|---|---|
| `space-1` | 4 | 微间隔(icon ↔ text) |
| `space-2` | 8 | chip / 紧凑列表项 |
| `space-3` | 12 | 按钮内边距 |
| `space-4` | 16 | 卡片内边距 |
| `space-6` | 24 | 区块之间 |
| `space-8` | 32 | 大区块之间 |
| `space-12` | 48 | 页边距 |

圆角:`radius-sm` 4 / `radius-md` 8 / `radius-lg` 12 / `radius-pill` 999

阴影:
- `shadow-1`: `0 1px 2px rgba(15,23,42,.04)` — 卡片
- `shadow-2`: `0 4px 12px rgba(15,23,42,.08)` — 抽屉、tooltip
- `shadow-3`: `0 10px 24px rgba(15,23,42,.20)` — modal、toast

### 3.5 动画 token(framer-motion 共享 presets)

```ts
// src/atlas-ui/primitives/motion.ts
export const MOTION = {
  drawerSpring: { type: 'spring', stiffness: 320, damping: 30 },
  drawerExit:   { duration: 0.18, ease: 'easeIn' },
  pageFade:     { duration: 0.18, ease: 'easeOut' },
  pinPop:       { type: 'spring', stiffness: 500, damping: 22 },
  hover:        { duration: 0.12, ease: 'easeOut' },
};

// 在 src/styles/globals.css 添加 prefers-reduced-motion 全局覆盖:
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important; }
}
```

framer-motion 内部读取 `useReducedMotion()`,在受影响处直接禁用 spring,只走 100ms fade。

---

## 4. Primitives(新建 `src/atlas-ui/primitives/`)

每个 primitive 单文件 + 同目录 `__tests__` 单测。

### 4.1 `Icon.tsx`

```tsx
import { type LucideIcon } from 'lucide-react';

type IconProps = {
  icon: LucideIcon;
  size?: 14 | 16 | 18 | 20 | 24;
  className?: string;
  'aria-hidden'?: boolean;
};
```

- 包裹 lucide-react 的 icon,固定 stroke-width 2,固定尺寸枚举。
- 默认 `aria-hidden="true"`(配合外部 `aria-label`)。

### 4.2 `Button.tsx`

```tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger-default' | 'danger-confirm';
  size?: 'sm' | 'md';
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  children?: ReactNode;
  iconOnly?: boolean;
  'aria-label'?: string;
  ...HTMLButtonAttributes
};
```

- `md` = h-8 (32px),`sm` = h-7 (28px)
- 焦点环 `focus-visible:ring-2 ring-blue-400/40`,始终可见,符合 a11y。
- `iconOnly` 模式必须提供 `aria-label`,且尺寸退化为正方形(h × h)。
- 动画:`whileHover={{ scale: 1.01 }}` + background transition 120ms(尊重 reduced-motion)。

### 4.3 `Toggle.tsx`

```tsx
type ToggleProps = {
  pressed: boolean;
  onPressedChange: (v: boolean) => void;
  leadingIcon: LucideIcon;
  children: ReactNode;
  size?: 'sm' | 'md';
  'aria-label'?: string;
};
```

- `pressed=true` → primary 样式;`pressed=false` → secondary。
- 内部使用 `aria-pressed`。

### 4.4 `Pin.tsx`

```tsx
type PinProps = {
  status: 'open' | 'resolved';
  highlighted: boolean;
  count: number;
  onClick: () => void;
  onHover?: (entering: boolean) => void;
  label?: string; // for tooltip
};
```

- 18×18 视觉 + 32×32 透明点击热区(absolute inset overlay)。
- 状态映射:
  - `status=open` → bg-accent border-accent-strong
  - `status=resolved` → bg-page border-accent-soft,内部 `<Check size=10>`
  - `highlighted=true` → bg-accent-strong + halo `ring-4 ring-accent-strong/25`(独立 token,**不再用 split('-')**)
- count 通过 badge 显示(右上角 12×12,bg-chrome text-page font-medium tabular)。
- 出现动画:`<motion.button initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={MOTION.pinPop}>` 配合 `<AnimatePresence>` 在父层做 stagger。

### 4.5 `Tooltip.tsx`(改造,基于 `@radix-ui/react-tooltip`)

包装 Radix Tooltip:

- **解决多行截断**:不再 `whitespace-nowrap`,允许多行 + max-w-[240px]。
- **解决自动翻转**:Radix 自带 `Tooltip.Content side="top" collisionPadding={8}` 与 `sideOffset`,顶部不够会自动翻下。
- **解决移动端**:在触屏设备(`@media (pointer: coarse)`)上启用 `delayDuration={0}` + 监听 `onPointerDownOutside` 关闭;`Term` 组件附加 `onClick` 切换 open 状态。
- **解决 ESC 关闭**:Radix 默认支持。
- **解决 setTimeout 初值缺失**:移除自实现的 hover 计时,由 Radix 内部处理。
- **API:**
  ```tsx
  type TooltipProps = {
    content: ReactNode;
    children: ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
  };
  ```
- 弃用旧的 `src/atlas-ui/glossary/Tooltip.tsx`,迁移所有用法到新 primitive。

### 4.6 `Callout.tsx`

```tsx
type CalloutProps = {
  variant: 'info' | 'warning' | 'risk' | 'legal' | 'evidence';
  title?: ReactNode;
  children: ReactNode;
};
```

样式参考 §2.2 状态表与 design-system-v2-monochrome 预览,使用 token。
图标默认按 variant 映射:Info / AlertTriangle / ShieldAlert / BookOpen / Check。
替换 `ContentBlockRenderer` 中 inline 的 callout 实现。

### 4.7 `Toast.tsx` + `useToast.ts`

最小可用 toast,无需依赖第三方:

- `ToastProvider` 渲染在根部(fixed 右下角),内部 portal。
- `useToast()` 返回 `(message: string, options?: { duration?: number; variant?: 'default' | 'success' | 'error' }) => void`。
- 单条 toast 自动 3 秒消失;最多并存 3 条,溢出 FIFO。
- 动画:从右滑入 200ms `easeOut`,退场 fade 150ms。
- "success"/"error" 仅通过左侧 1px 边 + icon 区分(蓝 / 深 slate),不引入红绿。
- 替换 `MagazineReader.handleImportFile` 内的 `alert(...)`。

### 4.8 `DrawerHeader.tsx`

`NotesDrawer`、`CommentPanel`、未来 `Toc Drawer` 的共享头:

```tsx
type DrawerHeaderProps = {
  icon: LucideIcon;
  title: string;
  count?: number;
  onClose: () => void;
};
```

- 14px padding · slate-200 底边 · h2 · count 显示为 `<Chip>{count}</Chip>`。
- 关闭按钮 IconButton 模式,28px 正方形。

### 4.9 `Chip.tsx`

```tsx
type ChipProps = {
  variant?: 'neutral' | 'accent';
  children: ReactNode;
};
```

- `neutral` = surface-2 bg + text-2,`accent` = accent-bg + accent text。
- `text-meta` 字号,radius-pill。

### 4.10 `EmptyState.tsx`

```tsx
type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};
```

- 用于抽屉空态、TOC 空态、评论列表为空时。
- icon 用 stroke-1.5 light 效果(`opacity-50`),title slate-900,description text-2。

---

## 5. 改造范围(现有文件)

### 5.1 `src/styles/globals.css`

- 替换为 Tailwind v4 `@theme` 声明,定义 §3.1 / §3.4 全部 token。
- 替换字体引入(替换当前 `--color-bg` / `--color-text` 旧变量)。
- 删除 `prefers-color-scheme: dark` 块(暗色模式推迟)。
- 增加 `prefers-reduced-motion` 全局覆盖。
- 保留 `.term` class,改用 `text-decoration-color: var(--color-accent)`。

### 5.2 `src/atlas-ui/reader/ReaderShell.tsx`

- 顶栏背景 → `bg-chrome`、文字 → `text-page`。
- 主区背景 → `bg-surface`。
- 工具栏背景 → `bg-page`,底边 `border-border`。
- 所有 emoji 按钮替换为 `<IconButton>` / `<Toggle>` 组件,引入 `lucide-react`:
  - 📝 笔记 → `<FileText>`
  - 💬 评论 → `<MessageSquare>`
  - 🖊 / 🔍 评论模式 → `<MousePointerClick>` / `<Eye>`
  - 📤 → `<Upload>`
  - 📥 → `<Download>`
  - 🐛 → `<Bug>`
- 注释模式切换文案统一:固定标签 "评论模式",`pressed` 态表达"开/关"。
- 工具栏布局微调,逻辑分组:[阅读模式 | 评论 | 调试 | 导入导出]。

### 5.3 `src/atlas-ui/reader/ReaderTopBar.tsx`

- 增加 logo 图标 `<BookOpen>` 在左,品牌名 + page title 二级化。
- 中部页码 `font-variant-numeric: tabular`(避免数字跳动)。
- 删除 DEBUG 文字,挪到 Toolbar 的 Toggle 即可。

### 5.4 `src/atlas-ui/reader/ReaderBottomBar.tsx`

- 整体背景 `bg-page`,顶边 `border-border`(与 Toolbar 风格一致,不再用 chrome 黑底)。
- 进度条改为 `bg-border`,填充 `bg-accent`,保留 transition。
- 上一页 / 下一页按钮替换为 `<Button variant="secondary" leadingIcon={ChevronLeft}>` / `trailingIcon={ChevronRight}`。
- 进度条本期保持非交互(可点击拖动留给 Spec C)。

### 5.5 `src/atlas-ui/reader/PageViewport.tsx`

- 缩放按钮替换为 `<Button variant="ghost" leadingIcon={Maximize2 / Maximize / ZoomIn}>`(三态切换暂保留循环,Spec C 再做下拉)。
- sticky 工具区背景 `bg-page/90 backdrop-blur`,边缘改用 token。
- "页面未找到" 改为 `<EmptyState>` 风格,带"返回首页"链接。

### 5.6 `src/atlas-ui/comments/CommentPin.tsx`

完整重写(去掉旧 `split('-')` bug):

```tsx
// 旧 (有 bug)
style={isHighlighted ? { backgroundColor: colorClass.split(' ')[0].replace('bg-', '') } : {}}

// 新
// 渲染 <Pin status={thread.status === 'open' ? 'open' : 'resolved'}
//        highlighted={isHighlighted} count={thread.messages.length} ... />
```

label tooltip 改用 Radix Tooltip(走 `Tooltip` primitive)。
`status='archived'` 的线程在 `CommentPinLayer` 层就已 filter,Pin 组件不需要支持。

### 5.7 `src/atlas-ui/comments/CommentPanel.tsx`

- 用 `<DrawerHeader icon={MessageSquare} title="评论" count={threads.length} onClose={...}/>`。
- 列表项状态指示点用 `<Pin>` mini 模式(暴露 size prop 12 / 18)或共享 `<StatusDot>`。
- emoji ✏️ 🗑 ✓ ↻ 替换为 `<Edit2>` `<Trash2>` `<Check>` `<RotateCcw>`。
- 抽屉滑入用 framer-motion `<AnimatePresence>` + `MOTION.drawerSpring`。

### 5.8 `src/atlas-ui/notes/NotesDrawer.tsx`

- 同上 DrawerHeader + animation。
- emoji 📝 替换为 `<FileText>`。
- 空态 `<EmptyState icon={FileText} title="这一页还没有笔记" description="切换章节,或查看其他页面。" />`。

### 5.9 `src/atlas-ui/renderers/ContentBlockRenderer.tsx`

- 替换 inline callout 实现为 `<Callout variant={block.variant} title={...}>`。
- ☐ checklist 替换为 `<Square>` 图标。
- 📝 notesPlaceholder 替换为 `<FileText>`。

### 5.10 `src/atlas-ui/glossary/Tooltip.tsx`

弃用,删除文件。所有引用迁移到 `primitives/Tooltip.tsx`。

### 5.11 `src/atlas-ui/glossary/Term.tsx`

- 内部用新 Tooltip primitive。
- 维持 dotted underline,但颜色变量化(`text-decoration-color: var(--color-accent)`)。
- touch device 时 click 切换 open(走 Radix 的 controlled state)。

### 5.12 `src/atlas-ui/glossary/GlossaryPageTemplate.tsx`

- 标题字体 serif。
- 类别小节用 `border-border` 替换 `border-stone-700`。
- "相关术语" 用 `<Chip>`。

### 5.13 `src/atlas-ui/renderers/TOCPageTemplate.tsx` **(P0 路由修复)**

- 当前 `to={"/page/" + p.pageId}` → 改为 `to={"/book/" + bookSlug + "/page/" + p.pageId}`。
- 接收 `bookSlug` prop(由 `PageRenderer` 传入 `registry.manifest.slug`)。
- 列表样式化:行 hover 用 surface-2,当前页用 accent-bg。

### 5.14 `src/atlas-ui/reader/MagazineReader.tsx` **(P0 alert 替换)**

```ts
// 旧
reader.onload = () => {
  const result = commentStore.importJSON(reader.result as string);
  refreshThreads();
  alert(`导入完成: ${result.imported} 条新评论, ${result.skipped} 条重复跳过`);
};

// 新
const toast = useToast();
reader.onload = () => {
  const result = commentStore.importJSON(reader.result as string);
  refreshThreads();
  toast(`导入 ${result.imported} 条新评论 · 跳过 ${result.skipped} 条重复`, { variant: 'success' });
};
```

### 5.15 `src/atlas-ui/overlay/HotspotLayer.tsx`

- focus ring `focus:ring-blue-400/40` → 用 token,行为不变。
- hover bg 从 `bg-white/10` → `bg-accent/10`。

### 5.16 `src/atlas-ui/overlay/DebugOverlay.tsx`

- 范围外,但顺便统一字体为 mono token。

---

## 6. P0 Bug 修复清单(集中追溯)

| # | 文件 | 行 | Bug | 修复方式 |
|---|---|---|---|---|
| 1 | `CommentPin.tsx` | 40 | `colorClass.split(' ')[0].replace('bg-', '')` 不是合法 CSS 颜色 | 使用独立 `pin-highlight` token,通过 className 控制 |
| 2 | `Tooltip.tsx` | 33 | `whitespace-nowrap` 与 `max-w-xs` 冲突,长内容被截断 | 改用 Radix Tooltip,允许多行 |
| 3 | `Tooltip.tsx` | 30+ | 仅支持顶部弹出,无 flip 与移动端 | Radix 自带 `side` 与 `collisionPadding`;touch 设备 click 切换 |
| 4 | `Tooltip.tsx` | 10 | `useState<ReturnType<typeof setTimeout>>()` 缺初值 | 移除自实现 hover 计时,完全由 Radix 内部处理 |
| 5 | `TOCPageTemplate.tsx` | 30 | 链接 `/page/${id}` 无 bookSlug,导航 404 | 接收 bookSlug prop 拼出完整路由 |
| 6 | `MagazineReader.tsx` | 177 | `alert(...)` 是浏览器原生弹窗,体验差 | 使用 Toast primitive |

每个 bug 配套:
- **复现单元测试**(必须先红再绿),放在对应组件的 `__tests__`。
- **集成测试**:CommentPin 高亮 + Tooltip 翻转 + TOC 链接 + Toast 出现 至少一个端到端断言。

---

## 7. 文件结构

新增 / 改造后的目录:

```
src/
  styles/
    globals.css                 — token 集中定义(替换 .css 旧版)
  atlas-ui/
    primitives/                 — 新增目录
      Icon.tsx
      Button.tsx
      Toggle.tsx
      Pin.tsx
      Tooltip.tsx               — Radix 包装,替换旧 glossary/Tooltip
      Callout.tsx
      Chip.tsx
      DrawerHeader.tsx
      Toast.tsx                 — ToastProvider + 单条 Toast 组件
      EmptyState.tsx
      motion.ts                 — framer-motion 共享 presets
      index.ts
      __tests__/
        Button.test.tsx
        Pin.test.tsx
        Tooltip.test.tsx
        Callout.test.tsx
        Toast.test.tsx
        ...
    reader/  ...                — 改造(见 §5)
    comments/  ...              — 改造
    notes/  ...                 — 改造
    renderers/  ...             — 改造 ContentBlockRenderer
    glossary/
      Term.tsx                  — 改造
      (Tooltip.tsx)             — 删除
  app/
    App.tsx                     — 在根插入 <ToastProvider>
```

---

## 8. 依赖变更

`package.json` 新增 dependencies:

```jsonc
{
  "dependencies": {
    "lucide-react": "^0.500.0",        // 主流稳定版
    "@radix-ui/react-tooltip": "^1.2.0" // Tooltip primitive 基础
  }
}
```

不引入:
- shadcn/ui:粒度过大,我们只需 1 个 Radix 组件,自己 wrap 更轻。
- @radix-ui/react-toast:为保持 bundle 小,Toast 自实现(<60 行)。
- 其他图标库。

---

## 9. 测试策略

### 9.1 单元

每个 primitive 至少覆盖:
- 渲染默认 + 各 variant
- 关键交互(click、hover、keyboard 焦点)
- a11y(role、aria-pressed、aria-label)

特别关键的回归测试:
- `Pin.test.tsx`:`status=resolved` 不应触发 highlight 颜色路径
- `Pin.test.tsx`:`highlighted=true` 时 className 包含 `pin-highlight`(防 split('-') bug 回潮)
- `Tooltip.test.tsx`:超过 50 字符内容不被截断
- `Toast.test.tsx`:3 秒后自动消失;同时 4 条只显示 3 条
- `Button.test.tsx`:`focus-visible` ring 存在;`iconOnly` 必须有 aria-label(违反时抛出运行时警告或编译 error,二选一)

### 9.2 集成

新增 `src/__tests__/`:
- `tocPageNavigation.test.tsx`:点 TOC 链接 → 真正进入 `/book/de-eu-vat/page/<id>`(用 MemoryRouter)
- `commentPinHighlight.test.tsx`:在 CommentPanel 上 hover 列表项 → 对应 Pin DOM 拥有 `pin-highlight` class
- `importToast.test.tsx`:导入 JSON 后 toast 文案出现并 3 秒后消失

### 9.3 现有测试守住

- `pnpm test` 全绿(包括所有 atlas-core / atlas-ui 已有测试)。
- 颜色 / class 改名引起的快照失效需更新,但断言语义不应改变。

### 9.4 视觉回归(本期不引入)

不引入 Storybook / Chromatic。primitive 在测试里覆盖结构与 a11y 即可。

---

## 10. 可访问性

- 所有 IconButton 必须有 `aria-label`(运行时检查,缺失时 dev 模式 console.warn)。
- 焦点环始终可见(`focus-visible:ring-2 ring-blue-400/40`)。
- Pin 触控热区 32×32(透明 inset 扩大)。
- Tooltip 走 Radix → 自动 ARIA。
- Toast 用 `role="status"` + `aria-live="polite"`。
- 抽屉打开时:`role="dialog" aria-modal="false"`;关闭后焦点回到触发按钮(Radix 不管这层,需要自实现)。
- 对比度:所有文本色与背景至少满足 WCAG AA(4.5:1)。

---

## 11. 实施分期(在 writing-plans 阶段细化为 checklist)

建议在 writing-plans 阶段拆为 6 个 phase,每个 phase 一个 commit:

1. **Phase 1 — Token 与依赖**:修改 `package.json`(新增 lucide-react / @radix-ui/react-tooltip)与 `src/styles/globals.css`(token + 字体);`vite.config.ts`、`tsconfig.app.json` 不变。
2. **Phase 2 — Primitives 基础**:Icon、Button、Toggle、Chip、EmptyState、motion.ts。
3. **Phase 3 — 复杂 Primitives**:Tooltip(Radix)、Toast、DrawerHeader、Pin、Callout。
4. **Phase 4 — Shell 替换**:ReaderShell、ReaderTopBar、ReaderBottomBar、PageViewport(emoji → icons,token 替换)。
5. **Phase 5 — 抽屉 + 评论 + 笔记 + Callout**:NotesDrawer、CommentPanel、CommentPin、ContentBlockRenderer、Term、Glossary。
6. **Phase 6 — P0 bug 集中验证**:TOC 路由修复、alert 替换、所有相关集成测试,跑全套 `pnpm test`。

每个 phase 结束:
- 单元测试全绿
- `pnpm lint` 无新增 warning
- 手动在 dev server 翻 3-5 个典型页面确认无回归

---

## 12. 风险与回退

| 风险 | 应对 |
|---|---|
| Tailwind v4 `@theme` 行为差异 | 提交 Phase 1 后立即 `pnpm dev` 翻页验证,token 不生效时回退到 CSS 变量直接用法 |
| Radix Tooltip 包体积上升 | 已评估,@radix-ui/react-tooltip ≈ 12kb gzipped,可接受 |
| framer-motion 与 React 19 兼容性 | 当前 framer-motion 12 已支持 React 19,如出问题用 motion `LazyMotion` |
| 大改 className 引起测试快照失效 | 测试断言尽量避免快照,改为查询 role/text/aria;少量快照可一次性更新 |
| 字体加载导致 FOIT | 引入 `font-display: swap`;关键 UI 文本不强依赖 serif |

---

## 13. 验收清单

Spec A 完成的判定:

- [ ] 所有 emoji 在 reader 界面消失(grep 检查 `tsx` 文件确认)
- [ ] CommentPin 高亮态在 hover 列表项时颜色正确生效(无 split('-') bug)
- [ ] 长术语 Tooltip 内容不被截断,且在顶部行翻到下方
- [ ] 在移动端模拟器(touch)tap 术语显示 Tooltip,再 tap 外部关闭
- [ ] TOC 页所有链接跳转成功(不再 404)
- [ ] 导入评论 JSON 后 toast 出现 3 秒消失,不再有原生 alert
- [ ] 所有 primitive 单测绿
- [ ] `pnpm lint` 与 `pnpm test` 全绿
- [ ] 用户翻阅 5 个典型页面(封面 / TOC / 内容页 / 跨页 / 术语表)肉眼检查无明显回归
- [ ] Lighthouse Accessibility 评分 ≥ 95(基线 vs 当前)

---

## 14. 后续 Spec 预览(非本期范围)

- **Spec B(工具栏与抽屉重构)**:合并 TopBar+Toolbar、抽屉策略(推挤 vs 浮层)、移动端折叠、新增 + 按钮场景。
- **Spec C(导航与查找)**:常驻 TOC 侧栏、全局搜索(术语 + 内容)、可拖动进度条、章节锚点、快捷键面板、键盘可达性。

——

**等待用户审核此 spec → 若批准则进入 writing-plans 阶段。**
