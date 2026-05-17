# VAT Atlas Reader — Spec B: 工具栏合并 + 单侧多 Tab 侧栏

**日期:** 2026-05-16
**作者:** 设计协作(用户 + Claude)
**状态:** 待用户确认 → 生成实施计划
**前置条件:** Spec A 已合入 main(`b0cf8f2`)
**后续 spec:** C(导航与查找:目录搜索、可拖进度条、键盘可达性)

---

## 1. 目标与范围

### 1.1 目标

把当前的"双顶条 + 双浮层抽屉"重构为"**单深色顶条 + 单侧多 Tab 侧栏(可收为细栏)**",并把"创建评论"的体验从多步切换简化为一次性 + 按钮流程。同时为移动端建立底部 Sheet 的响应式方案。

### 1.2 范围内

- 合并 `ReaderTopBar` + Toolbar → 单条深色 chrome
- 新建 `ReaderRail`:右侧多 Tab 侧栏,默认宽 32%,可收为 36px 细栏
- 3 个 tab:评论(迁移自 `CommentPanel`)、笔记(迁移自 `NotesDrawer`)、目录(基础版,Spec C 增强)
- `+ 按钮` 一次性评论创建流程(替代繁琐切换)
- 工具栏保留:`评论模式` toggle(批量创建)、`Debug` toggle
- 工具栏移除:笔记 / 评论 toggle(改用 tab)、导出 / 导入 icon(改入 tab overflow menu)
- 移动端(< 768px)断点:底部 Sheet 替代右侧栏
- 状态持久化:`railOpen` / `railTab` / `railWidth`(localStorage 每本书一份)

### 1.3 范围外(明确推迟到 C 或之后)

- 目录 tab 的搜索、章节折叠、当前页高亮 → **Spec C**
- 可拖动进度条 / 章节锚点 → **Spec C**
- 键盘快捷键面板与完整 a11y 巡检 → **Spec C**
- 移动端工具栏的 hamburger 折叠 → **Spec D**
- 主题切换 / 深色阅读模式 → 不在路线图

---

## 2. 整体布局

### 2.1 桌面(≥ 768px)

```
┌────────────────────────────────────────────────────────────┐
│ [logo] VAT Atlas · 跨境三角贸易  [评论模式][Debug] 第 7/52 │ 44px chrome(深色 slate-900)
├────────────────────────────────────────────────────────────┤
│                                            │              │
│            主区(图片 + Pin)              │   侧栏        │
│            flex: 1                         │   32%(默认) │
│            自适应缩放                      │   带 tab     │
│                                            │              │
├────────────────────────────────────────────┴──────────────┤
│ ← 上一页  ███░░░░  14 / 52  下一页 →                       │ 36px bottom bar
└────────────────────────────────────────────────────────────┘
```

收起(点 tab header 的 ×)→ 侧栏变 36px 细栏,主区扩展:

```
                                              │ □ 3 │   ← 36px slim rail
                                              │ □   │      永远可见
                                              │ □   │      图标 + 角标
```

### 2.2 移动端(< 768px)

主区占满,顶条压缩,底部 Sheet 从下方弹起。

```
┌────────────────────┐
│ V · 7/52      ⋯   │  压缩顶条
├─────────────────┬──┤
│                 │□3│
│   主区(图)    │□ │  细栏 28px
│                 │□ │
├─────────────────┴──┤
│ ← ████░░ → │       │  底部 bar
└────────────────────┘

点细栏图标 → 弹起 Sheet:

┌────────────────────┐
│ V · 7/52      ⋯   │
├────────────────────┤
│   主区(图)       │
│   只剩顶部 30vh    │
├────────────────────┤
│      ─── (拖柄)    │
│ 评论 3│ 笔记│ 目录 │  Sheet(70vh)
│ ────────           │
│ thread 1...        │  可拖到 90vh
│ thread 2...        │  下拉关闭
└────────────────────┘
```

---

## 3. 顶条(合并版)

### 3.1 结构

```
左 ────────────────────────────── 右
[logo] [brand] · [meta] | [评论模式] [Debug] ......... [章节] · [page/total]
14px   600     11px      controls                       monospace
            slate-900 文字 (e2e8f0 + opacity)
                  深色背景:#0F172A (chrome token)
```

总高 **44px**(原 76px 双条 → 节省 32px)。

### 3.2 控件态(在深色背景上)

| 状态 | 背景 | 文字 |
|---|---|---|
| 默认 | `rgba(255,255,255,.08)` | `text-divider` (slate-300) |
| hover | `rgba(255,255,255,.14)` | `text-page` (white) |
| pressed(on) | `bg-accent` (blue-700) | `text-page` |
| pressed hover | `bg-accent-hover` (blue-800) | `text-page` |

新增 primitive:**`ChromeButton`** —— 与现有 `Button` 不同,这是为深色顶条特化的按钮组件(变体仅 `default` / `pressed`,无 ghost/danger 等)。

### 3.3 元素布局(从左到右)

1. **Logo**(`BookOpen` icon, 14×14, accent-2 蓝)
2. **Brand**("VAT Atlas",600 weight)
3. **Meta**("· 跨境三角贸易的链条 · Kapitel 3",opacity .55)
4. **Sep**(1px 垂直分隔,`rgba(white,.15)`)
5. **Controls**:`评论模式` ChromeButton,`Debug` ChromeButton(可选)
6. **Spacer**(flex: 1)
7. **Page meta**("第 7 / 52 页",font-mono,opacity .65)

> 注:`导出 / 导入` 不在顶条 —— 移入侧栏评论 tab 的 overflow menu(见 §4.2.3)。

---

## 4. 侧栏 `ReaderRail`

### 4.1 三种形态

| 形态 | 宽度 | 触发 |
|---|---|---|
| **展开(expanded)** | `var(--rail-width)`, 默认 32vw, 最小 280px, 最大 480px | 默认状态;细栏图标点击;tab header × 关闭可切到 slim |
| **细栏(slim)** | 36px | 点 expanded header 的 × |
| **隐藏(mobile sheet)** | 0(主区上方弹 Sheet) | 屏宽 < 768px 自动切换 |

### 4.2 展开形态结构

```
┌─────────────────────────────────────┐
│ [💬 评论 3] [📄 笔记] [📑 目录]  ⋯ × │ 40px tab header
├─────────────────────────────────────┤
│                                 [+] │ 当前 tab 的 toolbar(仅评论 tab)
├─────────────────────────────────────┤
│                                     │
│      当前 tab 的内容滚动区           │
│                                     │
└─────────────────────────────────────┘
```

#### 4.2.1 Tab 头部(`RailHeader`)

- 高 40px,底部 1px border
- 每个 tab:`<svg icon><label><Chip count?>`,padding 10/12px
- Active tab:`text-accent`(蓝),下方 2px `border-bottom-color: var(--color-accent)`
- 右上角 **`tab-actions`**:
  - `+` 按钮(仅评论 tab)— primary accent 实心 24×24
  - `overflow menu`(`MoreHorizontal` icon,三点)— 下拉显示导入 / 导出 / 清空等
  - `×` 关闭按钮(切到 slim)

#### 4.2.2 Tab 内容区(`RailBody`)

- `flex: 1`,`overflow-y: auto`,padding 10/12px
- 每个 tab 维护独立滚动位置(切回时保持)

#### 4.2.3 Overflow menu(评论 tab 专属)

Radix `DropdownMenu` 风格,选项:
- `导出评论 (.json)`
- `从 .json 导入`
- `(分隔)`
- `清空已解决(请二次确认)`

笔记 tab 没有 overflow menu。目录 tab 没有 overflow menu(在 Spec C 引入搜索后再加)。

### 4.3 细栏(`SlimRail`)

36px 垂直栏,从上到下:

| 图标 | 角标 | 行为 |
|---|---|---|
| `MessageSquare` | 未解决评论数(blue-700 圆形,白字) | 点 → 展开到评论 tab |
| `FileText` | 当前页笔记数(`text-text-2` 灰文,无背景) | 点 → 展开到笔记 tab |
| `List` | 无 | 点 → 展开到目录 tab |
| (spacer) | | |

激活态(当前 tab + 收起状态):图标背景 `bg-accent-bg`(blue-100),图标色 `text-accent`。

### 4.4 移动端 Sheet(`MobileRailSheet`)

- 框架:屏底覆盖,默认高 70vh,可拖到 90vh
- 头部:小拖柄(`grab handle` 28×3 圆角条)+ tab strip
- Body:与桌面 expanded 内容一致
- 关闭:下拉到 30vh 以下松手关闭,或点 tab strip 右侧 × 关闭
- 实现:`framer-motion` `drag="y"` 配合 `dragConstraints` 与 spring `MOTION.drawerSpring`

---

## 5. 评论 + 按钮工作流

### 5.1 数据 vs 状态

不引入新的数据模型 —— 沿用 `CommentThread` / `CommentStore`。改的只是 **interaction state**。

新增一个临时态 `pendingAnchor: AnnotationAnchor | null` 在 `MagazineReader` 的 state 里。

### 5.2 流程

```
点 + 按钮(或按 N)
   │
   ↓
setInteractionMode('comment') + 显示 banner "点击图片任意位置添加评论"
   │
   ↓
用户在图片任意点击 → CommentCaptureLayer 触发 onCreateAnchor
   │
   ↓
创建 thread(空 messages)+ setSelectedThreadId + 滚动到底部 + 焦点跳到 composer
   │
   ↓
用户输入文本 → Enter / 点发送
   │     │
   │     ↓
   │   thread.messages 添加,Pin 立即固化为深蓝实心
   │
   ↓ ESC / 取消按钮
取消草稿 → 删除空 thread + setInteractionMode('read') + 退出
   │
   ↓ 成功发送
setInteractionMode('read') 自动退出 + banner 消失
```

### 5.3 与"评论模式"toggle 的区别

| 特性 | + 按钮(一次性) | 评论模式 toggle(持续) |
|---|---|---|
| 入口 | 评论 tab header | 顶条 controls |
| 持续性 | 创建一条后自动退出 | 用户必须主动关闭 |
| 适合场景 | 偶发评论 | 批量审阅,连续标 5-10 处 |
| Banner | 显示 + 创建后消失 | 显示 + 用户关闭模式后消失 |
| 快捷键 | `N` 触发 | (无,工具栏切换) |

### 5.4 Banner

在主区顶部出现 32px 横幅(只在 commentMode 时):

```
┌────────────────────────────────────────────────────────┐
│ 🖊 点击图片任意位置添加评论 · ESC 取消             [×] │ bg-accent-bg-faint
└────────────────────────────────────────────────────────┘
```

新增 primitive:**`InfoBanner`**(类似 Callout 但水平条形态)。

---

## 6. 状态管理

### 6.1 新状态(在 `MagazineReader` 内 lift)

```ts
type RailState = {
  open: boolean;
  tab: 'comments' | 'notes' | 'toc';
  width: number; // px;default = window.innerWidth * 0.32, clamped to [280, 480]
};

type RailPersistence = {
  open: boolean;
  tab: RailTab;
  width: number; // last user-resized (Spec D adds drag)
};
```

### 6.2 持久化

- localStorage key:`atlas-rail-${bookId}`
- 写入时机:`open` / `tab` / `width` 变化时
- 读取时机:`MagazineReader` 初次挂载

### 6.3 不持久化

- `interactionMode`(评论模式 / debug)— 每次新会话默认 `read`
- `selectedThreadId` / `highlightedThreadId` — 会话内有效
- `pendingAnchor` — 临时

### 6.4 钩子设计

```ts
// 新建 useRailState.ts(放 atlas-core/reader/)
function useRailState(bookId: string): {
  open: boolean;
  tab: RailTab;
  width: number;
  setOpen(open: boolean): void;
  setTab(tab: RailTab): void;
  toggleTab(tab: RailTab): void; // 同 tab → 关闭;不同 tab → 切换并打开
  collapse(): void;
  expand(toTab?: RailTab): void;
};
```

---

## 7. 文件结构

### 7.1 新增

```
src/atlas-ui/primitives/
  ChromeButton.tsx          — 深色顶条按钮变体
  InfoBanner.tsx            — 水平横幅 callout
src/atlas-ui/rail/
  ReaderRail.tsx            — 顶层容器:决定 expanded / slim / mobile
  RailHeader.tsx            — tab 切换 + actions
  SlimRail.tsx              — 36px 折叠态
  MobileRailSheet.tsx       — 底部 Sheet
  tabs/
    CommentsTab.tsx         — 迁移自 comments/CommentPanel 内容
    NotesTab.tsx            — 迁移自 notes/NotesDrawer 内容
    TocTab.tsx              — 基础版列表(Spec C 增强)
  __tests__/
    ReaderRail.test.tsx
    SlimRail.test.tsx
    MobileRailSheet.test.tsx
    CommentsTab.test.tsx
    NotesTab.test.tsx
    TocTab.test.tsx
src/atlas-core/reader/
  useRailState.ts           — rail 状态 + localStorage 持久化
  __tests__/
    useRailState.test.ts
```

### 7.2 改造

```
src/atlas-ui/reader/
  ReaderShell.tsx           — 合并 TopBar+Toolbar → 单个深色条;移除抽屉,挂载 ReaderRail
  ReaderTopBar.tsx          — 删除文件(并入 ReaderShell)
  MagazineReader.tsx        — 引入 useRailState、pendingAnchor、+按钮 handler
src/atlas-ui/comments/
  CommentPanel.tsx          — 删除(内容拆分到 CommentsTab + 共享子组件)
  MessageItem.tsx           — 新建,从 CommentPanel 抽出
  ThreadList.tsx            — 新建,从 CommentPanel 抽出
src/atlas-ui/notes/
  NotesDrawer.tsx           — 删除(内容并入 NotesTab)
```

### 7.3 删除

```
src/atlas-ui/comments/CommentPanel.tsx        (内容拆分)
src/atlas-ui/notes/NotesDrawer.tsx            (内容并入 tab)
src/atlas-ui/reader/ReaderTopBar.tsx          (合并入 ReaderShell)
```

### 7.4 共享 / 不变

- `CommentComposer.tsx`(评论输入框,保留)
- `CommentPin.tsx`(图上 Pin,保留)
- `CommentPinLayer.tsx` / `CommentCaptureLayer.tsx`(保留)
- `ReaderBottomBar.tsx`(保留,Spec C 才动)
- `PageViewport.tsx`(微调:接收 banner 高度做 padding-top 偏移)

---

## 8. 组件 API

### 8.1 `ChromeButton`

```tsx
type ChromeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed?: boolean;
  leadingIcon?: LucideIcon;
  children?: ReactNode;
  size?: 'sm' | 'md'; // sm = h-6 (24px), md = h-7 (28px); default md
};
```

注:与 Spec A 的 `Button` 不同 —— 顶条按钮整体偏小一档(顶条本身 44px,按钮 28/24px 留出 padding)。样式见 §3.2 表格。所有焦点环 `ring-accent-2/50`(在深色上更醒目)。

### 8.2 `InfoBanner`

```tsx
type InfoBannerProps = {
  icon?: LucideIcon;
  message: ReactNode;
  onDismiss?: () => void;
  variant?: 'info' | 'accent'; // info = slate-50 bg, accent = blue-50 bg
};
```

固定 32px 高,横向铺满,可选关闭按钮。

### 8.3 `ReaderRail`

```tsx
type ReaderRailProps = {
  // state(由 MagazineReader 控制)
  open: boolean;
  tab: 'comments' | 'notes' | 'toc';
  onTabChange: (t: RailTab) => void;
  onCollapse: () => void;
  onExpand: () => void;

  // tab 数据
  threads: CommentThread[];
  noteIds: NoteId[];
  registry: BookRegistry;
  // ... 转发给各 tab

  // pendingAnchor + + button
  onStartNewComment: () => void; // 触发 + 按钮流程

  // 现有的评论相关 handler 全部转发到 CommentsTab
};
```

注:这个 props 列表会比较长(把 MagazineReader 的所有评论 handler 转过来)。可以考虑用 `CommentsTabProps` 与 `NotesTabProps` 类型分组,在 ReaderRail 内合并展开。

### 8.4 `SlimRail`

```tsx
type SlimRailProps = {
  tabBadges: { comments: number; notes: number; toc: number };
  activeTab: RailTab | null; // null = 完全折叠,无激活
  onExpand: (toTab: RailTab) => void;
};
```

### 8.5 `MobileRailSheet`

```tsx
type MobileRailSheetProps = ReaderRailProps & {
  defaultHeight?: number; // vh, 默认 70
};
```

内部用 `framer-motion` 实现拖拽与 spring。

---

## 9. 动画

| 元素 | 动效 | preset(扩展 `MOTION`)|
|---|---|---|
| 侧栏展开 / 收起(桌面) | 宽度 spring(主区同步收缩) | `MOTION.railWidth` = `{ type: 'spring', stiffness: 320, damping: 32 }` |
| Tab 切换 | 内容淡入 120ms | `MOTION.tabFade` = `{ duration: 0.12, ease: 'easeOut' }` |
| Sheet 弹起(移动) | spring 滑入 | 复用 `MOTION.drawerSpring` |
| Sheet 拖动 | 跟随手指 + 松手 spring 归位 | 内置 framer-motion `drag` |
| InfoBanner 出现 | 从顶部滑入 + fade | `MOTION.bannerSlide` = `{ duration: 0.18, ease: 'easeOut' }` |

所有动画尊重 `prefers-reduced-motion`(已在 globals.css 全局降级)。

---

## 10. 可访问性

- 顶条:`role="banner"`(或保留现有 `<header>`)
- 侧栏 expanded:`role="complementary"` + `aria-label="侧栏"`
- 细栏:`role="toolbar"` + `aria-orientation="vertical"` + 每个按钮 `aria-label="打开评论"` 等
- Tab strip:`role="tablist"`,每个 tab `role="tab"` + `aria-selected`,body `role="tabpanel"`
- Sheet:`role="dialog" aria-modal="false"` + ESC 关闭 + 拖动手柄 `aria-label="拖动调整高度"`
- + 按钮:`aria-label="新增评论(快捷键 N)"`
- Banner:`role="status"` 不打断阅读

键盘(本期最小集,完整面板留 Spec C):
- `Tab` 在控件间循环;`Shift+Tab` 反向
- `1` / `2` / `3` 在侧栏内切换评论 / 笔记 / 目录 tab(仅当侧栏 expanded 时生效)
- `\`(反斜杠)切换侧栏展开 / 收起
- `N` 新增评论(等同 + 按钮)
- `ESC` 在评论模式下取消草稿;在 Sheet 打开时关闭 Sheet

实现要点:全部走全局 `useKeyboardNavigation` 扩展(已存在),在 input/textarea 聚焦时禁用。

---

## 11. 测试策略

### 11.1 单元

- `ChromeButton`:渲染默认 / pressed / hover、leadingIcon 显示、焦点环
- `InfoBanner`:渲染 message、onDismiss 触发、variant 切换
- `useRailState`:初值正确、setTab 更新、localStorage 读写、toggleTab 行为
- `SlimRail`:三个图标渲染、角标数字、点击触发 onExpand 携带正确 tab
- `RailHeader`:三 tab 切换、+ 按钮触发 onStartNewComment、× 触发 onCollapse
- `MobileRailSheet`:拖动手柄拖到 30vh 触发关闭、tab 切换
- `CommentsTab` / `NotesTab` / `TocTab`:迁移后内容渲染正确(可复用现有断言)

### 11.2 集成

新增 `src/__tests__/railIntegration.test.tsx`:
- 渲染整个 Reader,初始侧栏展开 / 切换 tab / 收起到 slim / 重新展开
- 点 + 按钮 → 出现 banner + interactionMode = 'comment' → 模拟点击图片 → composer 出现 → 输入并提交 → banner 消失 + Pin 出现

新增 `src/__tests__/railPersistence.test.tsx`:
- 设置 railOpen=false / railTab='notes' → reload → 仍是 false / notes

新增 `src/__tests__/plusButtonFlow.test.tsx`:
- 完整覆盖 + 按钮工作流 + ESC 取消行为

### 11.3 移动端

新增 `src/__tests__/mobileSheet.test.tsx`:
- 模拟 viewport 720px → MobileRailSheet 渲染、Sheet drag、tab 切换
- 通过 `Object.defineProperty(window, 'innerWidth', { value: 600 })` 模拟

### 11.4 守住现有测试

- 现有评论 / 笔记测试断言中的 `CommentPanel` / `NotesDrawer` 引用需要迁移到 `CommentsTab` / `NotesTab`
- 现有 ReaderTopBar / ReaderShell 测试可能因合并失效,需要 grep 修复

---

## 12. 实施分期(交付给 writing-plans 细化)

建议 5 个 phase,每个 phase 一个或几个 commit:

1. **Phase 1 — 新 primitives 与 hook**:`ChromeButton`、`InfoBanner`、`useRailState`(含 localStorage 持久化),完整单测。
2. **Phase 2 — Tab 内容拆分**:从 `CommentPanel` 抽 `ThreadList` / `MessageItem`,创建 `CommentsTab.tsx`、`NotesTab.tsx`、`TocTab.tsx`,各自单测。
3. **Phase 3 — SlimRail / RailHeader / ReaderRail**:三种形态组装,集成动画。
4. **Phase 4 — Shell 重构 + 顶条合并**:重写 `ReaderShell`(删除 ReaderTopBar 文件,合并入)、改造 `MagazineReader` 接入 useRailState、删除 CommentPanel / NotesDrawer 旧文件。
5. **Phase 5 — + 按钮 + Banner + 移动端 Sheet**:实现 + 按钮完整流程、`InfoBanner` 接入、`MobileRailSheet` 与断点 hook。最终集成测试 + 手动 smoke。

---

## 13. 依赖变更

无新依赖。沿用 Spec A 已装的:
- `@radix-ui/react-tooltip`(继续用)
- `framer-motion`(扩展)
- `lucide-react`(新增图标:`MoreHorizontal`、`PanelRightClose`、`Plus`)

新增本地实现:Radix 不引入 `DropdownMenu`(只有一个 overflow menu 场景,我们用 `useState + 简单 absolute div` 实现即可)。如果二期还要更多 menu,再引入 `@radix-ui/react-dropdown-menu`。

---

## 14. 风险与回退

| 风险 | 应对 |
|---|---|
| ChromeButton 在深色背景下对比度不够 | 设计完成后 axe-core / Lighthouse 验证 AA 对比度 |
| 侧栏 32% 宽在小笔记本(13") 仍挤 | 默认改 30%,最大 480px 上限;Spec D 加用户拖拽 |
| 移动端 Sheet 与浏览器原生下拉刷新冲突 | `touch-action: pan-y` + framer-motion `dragMomentum: false` |
| + 按钮快捷键 `N` 与浏览器 / OS 冲突 | 当 input/textarea 不在焦点时才响应;若用户报告冲突,Spec C 引入快捷键面板时允许自定义 |
| 拆分 CommentPanel 破坏现有评论行为 | 严格 TDD,迁移测试 1:1 复制 |
| Tab 间滚动状态丢失 | 每个 tab 自维护 ref,切换时不卸载只 hide |

---

## 15. 验收清单

- [ ] 顶条总高度 = 44px(过去 76px)
- [ ] 侧栏可在 expanded / slim / mobile-sheet 三态间正确切换
- [ ] localStorage 持久化 railOpen / railTab / railWidth
- [ ] 评论 tab 内容 100% 等价于旧 CommentPanel(行为对等)
- [ ] 笔记 tab 内容 100% 等价于旧 NotesDrawer(行为对等)
- [ ] 目录 tab 基础列表可点跳转,带"当前页"高亮(用 accent-bg)
- [ ] + 按钮一次性流程跑通,创建后自动退出评论模式
- [ ] 评论模式 toggle 持续模式仍可用
- [ ] 移动端 (< 768px) 自动切到 Sheet,可拖、可关
- [ ] 所有现有测试 + 新增测试全绿
- [ ] `npm run lint` 不增加新 error
- [ ] 桌面 / 移动 两种宽度下手动翻 5 页无明显回归
- [ ] axe Lighthouse a11y 评分 ≥ Spec A 后的基线

---

## 16. 后续 Spec 预览(非本期)

- **Spec C — 导航与查找**:目录 tab 增强(搜索框、章节折叠、当前页高亮、滚动锚点、键盘上下导航),全局搜索(术语 + 内容),可拖动进度条,完整快捷键面板,深度键盘可达性。
- **Spec D — 移动端打磨**:顶条 hamburger 折叠,Pin 触控热区放大,触控手势(双指捏合 / 翻页),离线 cache。

——

**等待用户审核此 spec → 若批准则进入 writing-plans。**
