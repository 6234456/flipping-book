# VAT Atlas Reader — Spec F: 查找与发现

**日期:** 2026-05-19
**状态:** 待用户审核 → 进 writing-plans
**前置:** Spec A-D 合入 main(`8e287e2`),Spec E 可独立合入或不合(无依赖)
**后续:** Spec G(Rich Region UI + Bundle CLI)

---

## 1. 目标与范围

让用户能**快速找到**:既要能搜索全书(术语 / 法条 / 场景 / 笔记 / 内容 / 页面),也要在目录中能**结构化浏览**(章节折叠 / 当前位置感知)。

### 1.1 范围内(2 项)

- **K** — 全局搜索:顶栏入口按钮 + Cmd+K 全局模态,实时索引 6 类内容,分组显示结果,点击跳转
- **J** — TOC tab 增强:按 sectionCode 第一段折叠,智能默认(仅展开当前组),sticky 当前章节带

### 1.2 范围外(明示推迟)

- 搜索 OCR(textRegion 的文本不进搜索 — 用户已明确推迟)
- 搜索历史 / 最近搜索 / 建议词 — Spec H 或之后
- 搜索结果按访问频率排序 — 没有访问数据,YAGNI
- 模糊匹配(fuzzy) — 仅子串匹配,数据量小不需 Fuse.js 等
- TOC 章节缩略图预览 — YAGNI
- a11y / 完整键盘 scrub / 焦点环优化 — 同 Spec E,用户明示不做

---

## 2. (K) 全局搜索

### 2.1 入口

**顶栏深色条**位置:
```
[logo] VAT Atlas · 章节标题  [🔍 搜索...  ⌘K]  [评论模式][Debug]  第 N/22 页
```

- 占宽 ~180px,在 brand+meta 与 controls 之间
- 占位文本 "搜索…",右侧 `⌘K` 小灰色快捷键提示
- 鼠标 click 或键盘按 `Cmd+K` / `Ctrl+K` 触发模态
- 小屏(< 768px)退化为只显示放大镜图标(移到右边)

### 2.2 模态(SearchModal)

- 基础设施:Radix `Dialog`(已含 portal / overlay / focus trap / Esc 关闭)
- 居中,宽 560px,top 22vh(留出视觉透气感)
- 进入即输入框 autofocus
- 实时搜索:keystroke debounce 0ms(数据量小,无需 debounce)
- 输入空时显示提示文本 "输入关键词搜索 22 页 + 40 术语 ..."

### 2.3 结果分组与显示

6 个分组(每类至多 5 条,空类隐藏):

| Tag | 来源 | 命中字段 | Click 行为 |
|---|---|---|---|
| `页面` | `registry.manifest.pages` | `title.zh-CN` / `subtitle.zh-CN` | `onNavigateToPage(pageId)` |
| `术语` | `registry.glossary` | `zh` / `original` / `abbreviation` / `shortDefinition` | `/book/<slug>/glossary#<termId>` |
| `法条` | `registry.legalRefs` | `ref` / `title.zh-CN` / `summary.zh-CN` | fallback `/book/<slug>/glossary` |
| `场景` | `registry.scenarios` | `title.zh-CN` / `subtitle.zh-CN` / `oneSentence.zh-CN` | fallback `/book/<slug>/glossary` |
| `笔记` | `registry.notes` | `title.zh-CN` / 富文本拍平后的纯文本 | 跳到对应 `pageId` + 在 url query 加 `?openTab=notes` |
| `内容` | `registry.contents` | 拍平后的富文本 | 跳到对应 `pageId` |

**注:** "fallback" 路由意味着当前 v0.6.1 数据空时这些类型不会有匹配,跳转策略未来 Spec 富化数据时再细化。

每条结果显示:
```
[页面] 14 · 第 09 章 · 跨境三角贸易
       ^^^ tag             ^^^^^ <mark>匹配高亮</mark>
```

### 2.4 索引算法

启动时(`MagazineReader` mount 后)从 `registry` 构造 in-memory 索引:

```ts
// src/atlas-core/search/buildIndex.ts
export type IndexedItem = {
  category: 'page' | 'glossary' | 'legal' | 'scenario' | 'note' | 'content';
  id: string;                  // pageId / termId / legalRefId / ...
  haystack: string;            // lowercased searchable text
  display: { primary: string; secondary?: string };
  // navigation hint
  pageId?: string;             // for notes/contents/scenarios that link to a page
};

export function buildIndex(registry: BookRegistry): IndexedItem[];
```

**ranking:**
- 命中字段优先级:`primary` 字段(title / zh / ref)> `secondary` 字段(subtitle / shortDefinition / summary)
- 精确前缀匹配 > 全词匹配 > 子串匹配
- 同类内按 ranking 排序,取前 5 条
- 跨类不重排(分组顺序固定:页面 → 术语 → 法条 → 场景 → 笔记 → 内容)

实现保持简单:不引入 Fuse.js / FlexSearch 等。一个 `IndexedItem[]` 数组 + 一遍 `Array.filter` + 自实现 ranking,数据量 ~100 条,~5ms 内完成。

### 2.5 富文本拍平

笔记 / 内容 / 场景中的 `RichTextNode[]` 是结构化的(段落 / 标题 / 表格 / callout)。用一个递归 helper 拍平为搜索用纯文本:

```ts
// src/atlas-core/search/flattenRichText.ts
export function flattenRichText(nodes: RichTextNode[]): string {
  return nodes.map(/* ... */).join(' ');
}
```

只取 `text` / `strong.children` / `em.children` 的文本,忽略 `term` / `legalRef` / `scenarioLink` / `pageLink` 的引用占位(它们的目标实体本身已被索引)。

### 2.6 键盘交互

- Cmd+K / Ctrl+K:打开模态(全局)
- Esc:关闭模态
- 输入框聚焦时 ↑↓:在结果列表中导航(高亮当前 active 项)
- Enter:跳转到 active 项
- 输入空时 ↑↓:无操作

### 2.7 新文件

```
src/atlas-core/search/
  buildIndex.ts                      — registry → IndexedItem[]
  flattenRichText.ts                 — RichTextNode[] → string
  searchIndex.ts                     — query → grouped results
  index.ts                           — barrel
  __tests__/
    buildIndex.test.ts
    flattenRichText.test.ts
    searchIndex.test.ts

src/atlas-ui/search/
  SearchModal.tsx                    — Radix Dialog + 输入 + 分组结果
  SearchTrigger.tsx                  — 顶栏按钮 + Cmd+K 监听
  SearchResultRow.tsx                — 单条结果(带 <mark>)
  __tests__/
    SearchModal.test.tsx
    SearchTrigger.test.tsx
```

### 2.8 改造

- `src/atlas-ui/reader/ReaderShell.tsx`:在 brand+meta 区右侧插入 `<SearchTrigger>`
- `src/atlas-core/reader/useKeyboardNavigation.ts`:扩展支持 onOpenSearch callback,Cmd+K 触发
- `src/atlas-ui/reader/MagazineReader.tsx`:挂载 `<SearchModal>`(顶层,与 `<MagazineReader>` 同级)+ 持有 `searchOpen: boolean` state
- `src/app/routes/GlossaryRoute.tsx`:支持 hash `#<termId>` → scrollIntoView + 临时 highlight(2s)

### 2.9 依赖

新增 `@radix-ui/react-dialog`(模态基础设施)。Radix 的 tooltip 已在 Spec A 装过,family 已熟,加 dialog 无新风险。

---

## 3. (J) TOC tab 增强

### 3.1 分组算法

按 `sectionCode.split('-')[0]`(第一段)分组,**保持 readingOrder 顺序**:

```ts
type TocGroup = {
  key: string;                     // 'TOC' / '01' / '09' / 'SC' / 'G' / 'APP'
  header: {
    kind: 'real' | 'virtual';
    page?: PageManifest;           // kind='real' 时存在
    label: string;                 // kind='virtual' 时显示的文字(如 "场景")
  };
  children: PageManifest[];        // 不含 header(若 header 是 real,则 header 本身不出现在 children)
};
```

**header 解析规则:**
- 组中**第一页的 sectionCode 完全等于组键** → 该页升级为 `kind: 'real'` header(可点击进入该页 + 可折叠)
- 否则 → 插入 `kind: 'virtual'` header(不可点击,只可折叠;`label` 取虚拟标签 — 见 §3.2 映射表)

### 3.2 虚拟 label 映射

```ts
const VIRTUAL_LABELS: Record<string, string> = {
  'TOC': 'TOC',           // 但 TOC 组只有 1 页,不会折叠
  'SC': '场景',
  'APP': '附录',
  'G': '术语',
  // 兜底:groupKey 本身作 label
};
```

### 3.3 折叠状态

**默认态(智能):**
- 仅展开当前页所在组,所有其他组折叠
- 当前页所在组 = `findGroup(currentPageId).key`

**用户手动调整:**
- click header 上的 `▸`/`▾` chevron 切换该组折叠
- 用户调整后,该组进入"用户态",**优先于智能默认**
- 持久化:`localStorage["atlas-toc-folds-<bookId>"] = { groupKey: 'expanded' | 'collapsed' }`
- 切换当前页时,智能默认重新计算,但**已存在用户态的组不被覆盖**

### 3.4 Sticky 当前章节带

TOC 滚动列表顶部固定一条:
```
📍 当前位置 · 第 09 章 · 交易性质判断
```

- 仅当用户滚动到"当前章节组的视觉位置之外"时显示
- 实现方式:IntersectionObserver 监听当前 group 的 header DOM,出视野时显示 sticky band
- 点击 sticky band → scrollIntoView 当前页

### 3.5 已有功能保留

- 当前页 accent 高亮 (`bg-accent-bg text-accent font-medium`)
- 切换页时自动 scrollIntoView (`block: 'nearest', behavior: 'smooth'`)
- EmptyState 处理 readingOrder 为空

### 3.6 改造

- `src/atlas-ui/rail/tabs/TocTab.tsx` — 整体重写,新增 `<TocGroup>` 子组件
- `src/atlas-core/reader/`:新增 `useTocFolds.ts` hook(localStorage 持久化,与 `useRailState` 同模式)
- `src/atlas-ui/rail/tabs/__tests__/TocTab.test.tsx` — 大幅更新测试

### 3.7 测试

新增/更新测试:
- `groupPages(readingOrder, getPage)` 工具函数:测试 6 种组形成 / virtual vs real header / 单页组扁平
- 默认态:当前页在 09 组 → 09 组展开,其他全折
- 用户态优先:`localStorage` 中 09 = 'collapsed' → 即使是当前组也不强行展开
- Sticky band 显示/隐藏(IntersectionObserver 模拟)

---

## 4. 文件结构总览

```
src/
  atlas-core/
    search/                                  ← 新建
      buildIndex.ts
      flattenRichText.ts
      searchIndex.ts
      index.ts
      __tests__/
    reader/
      useKeyboardNavigation.ts               ← 扩展 onOpenSearch
      useTocFolds.ts                         ← 新建
      __tests__/useTocFolds.test.ts          ← 新建
  atlas-ui/
    search/                                  ← 新建
      SearchModal.tsx
      SearchTrigger.tsx
      SearchResultRow.tsx
      __tests__/
    reader/
      ReaderShell.tsx                        ← 插入 SearchTrigger
      MagazineReader.tsx                     ← 挂载 SearchModal + searchOpen state
    rail/tabs/
      TocTab.tsx                             ← 重写(分组 / 折叠 / sticky)
      __tests__/TocTab.test.tsx              ← 更新
  app/routes/
    GlossaryRoute.tsx                        ← hash 锚点跳转 + highlight
```

---

## 5. 依赖变更

| 包 | 用途 | 备注 |
|---|---|---|
| `@radix-ui/react-dialog` | SearchModal 基础设施 | 新增,与现有 `@radix-ui/react-tooltip` 同家族 |

---

## 6. 实施分期(给 writing-plans)

**K(搜索)5 commit:**
1. `flattenRichText` + 测试
2. `buildIndex` + 测试
3. `searchIndex`(query → grouped results)+ 测试
4. `SearchModal` + `SearchResultRow` + `SearchTrigger` + Radix dialog 接入 + 测试
5. ReaderShell + MagazineReader + useKeyboardNavigation 集成 + GlossaryRoute hash 跳转

**J(TOC)4 commit:**
6. `groupPages` + `useTocFolds` hook + 测试
7. TocTab 重写(分组渲染 + chevron toggle)+ 测试
8. Sticky band(IntersectionObserver)+ 测试
9. 集成测试 + smoke

**共 9 commit(估计上下浮 ±2 个)**

---

## 7. 风险

| 风险 | 应对 |
|---|---|
| Cmd+K 与浏览器自带"地址栏聚焦"快捷键冲突 | Cmd+K 不冲突(浏览器一般用 Cmd+L)。监听 keydown 时 `e.preventDefault()` 即可 |
| 搜索结果点击跳转后模态没关 | onResultClick 内显式 setSearchOpen(false) |
| 模态打开时全局快捷键(\、N)仍触发 | useKeyboardNavigation 检查 `isEditable(target)` — 已有逻辑;此外 modal 内的 input 元素已是 INPUT/TEXTAREA |
| TOC 折叠后用户找不到 chevron | header 整行可点(实心 hover bg),chevron 仅作视觉指示 |
| Sticky band 与现有 `.scroll-mt-16` 冲突 | TOC tab 是独立滚动容器,无 .scroll-mt 影响 |
| IntersectionObserver 在 jsdom 不可用 | 测试中 mock observer,生产代码无 fallback 需要(所有支持的浏览器都已实现) |
| 富文本拍平复杂度 | RichTextNode 共 7 种,递归处理 ~20 行,可控 |
| 索引数据冗余度 | 一份 IndexedItem 数组大约 100 条 × 200 字节 = 20KB 内存,可忽略 |

---

## 8. 验收清单

- [ ] 顶栏 brand+meta 与 controls 之间有"🔍 搜索…  ⌘K"按钮
- [ ] 按 `Cmd+K`(或 macOS 外按 `Ctrl+K`)打开模态
- [ ] 输入"反向"立即看到分组结果(页面 + 术语 + ... 6 类至多 5 条)
- [ ] 匹配文字用 `<mark>` 高亮显示
- [ ] ↑↓ 在结果间导航,Enter 跳转,Esc 关闭
- [ ] 跳转到术语 → URL 为 `/book/de-eu-vat/glossary#<termId>`,术语自动 scrollIntoView 并短暂高亮
- [ ] TOC tab 默认仅当前组展开,其他组折叠
- [ ] TOC 单页组(TOC / 01 / G / APP)扁平显示,无 chevron
- [ ] 多页组(09 / SC):09 是 real header(可点击 + 可折),SC 是 virtual header(只可折)
- [ ] 滚动 TOC 离开当前组视野 → 顶部出现 sticky 带
- [ ] click sticky 带 → 滚回当前页
- [ ] 手动折叠某组后 localStorage 持久化,下次打开保持(覆盖智能默认)
- [ ] `npm test` 新增 ~10 个测试,无回退
- [ ] `npm run lint` 持平 baseline

---

## 9. 后续 Spec 预览

- **Spec G:** Rich Region UI(textRegion hover + section click)+ Bundle CLI 校验工具

——

**等待用户审核此 spec → 若 OK 进 writing-plans。**
