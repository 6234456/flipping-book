# VAT Atlas Reader — Spec E: Reader 交互与导航

**日期:** 2026-05-17
**状态:** 待用户审核 → 进 writing-plans
**前置:** Spec A-D 全部合入 main(`8e287e2`)
**后续:** Spec F(查找与发现 = J TOC 增强 + K 全局搜索),Spec G(Rich Region UI + Bundle CLI)

---

## 1. 目标与范围

把现有 reader 的若干小痛点清掉,让翻页有手感、进度条可用、`npm run build` 干净通过。

### 1.1 范围内(3 项)

- **U** — 修复 `tsc -b` 两个预存错误,让 `npm run build` 不再报错
- **N** — 翻页动画:从硬切换为 180ms fade + 8px 方向滑入,尊重 `prefers-reduced-motion`
- **I** — 进度条可交互:悬停显示页号 + 标题 tooltip,点击跳页

### 1.2 范围外(明示推迟)

- **M** — Drill-down 导航 → 推迟到 v0.6.1 之后的素材升级或启用 OCR 时再起 spec
- 进度条拖拽 scrub / 章节刻度 → 22 页短书场景下不需要,未来若书变长再说
- a11y / 完整键盘 scrub / 焦点环优化 → 本期不做(用户明示)
- 视觉缩略图预览 → 不做(tooltip 文字够)

---

## 2. (U) TypeScript 清扫

### 2.1 当前错误

```
tsconfig.app.json(25,5): error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.
vite.config.ts(14,3):    error TS2769: 'test' does not exist in type 'UserConfigExport'.
```

两个都是 Spec A 之前就有的预存问题,Spec A-D 没碰过。

### 2.2 修复方案

**(a) `tsconfig.app.json`** — 删 `baseUrl: "."`:

```diff
   "compilerOptions": {
-    "baseUrl": ".",
     "paths": { "@/*": ["./src/*"] }
   }
```

TypeScript 6.0+ 允许 `paths` 不依赖 `baseUrl`(`paths` key 默认从 tsconfig.json 所在目录解析)。所有现有 `@/...` 导入继续工作。

**(b) `vite.config.ts`** — 移除 `test:` 字段:

```diff
- /// <reference types="vitest" />
  import { defineConfig } from 'vite'
  // ...
  export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
-   test: {
-     globals: true,
-     environment: 'jsdom',
-     setupFiles: './src/test-setup.ts',
-     css: true,
-   },
  })
```

**(c) 新建 `vitest.config.ts`** — 持有测试配置:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
  },
})
```

Vitest 自动检测 `vitest.config.ts` 优先于 `vite.config.ts`。`npm test` 行为不变。

### 2.3 验证

- `npm run build` → 0 TS 错误,build 成功
- `npm test` → 仍然 324 passed
- `npm run lint` → 持平 40 baseline

---

## 3. (N) 翻页动画

### 3.1 当前

翻页是硬切。`MOTION.pageFade = { duration: 0.18, ease: 'easeOut' }` 在 Spec A 已定义,从未使用。

### 3.2 设计

包一层 `<AnimatePresence mode="wait">` + `<motion.div>` 在 `PageRenderer` 外:

```tsx
// src/atlas-ui/reader/PageViewport.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { MOTION } from '../primitives';

// inside PageContent component, replace <PageRenderer ... /> with:
<AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={page.pageId}
    initial={{ opacity: 0, x: direction * 8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -direction * 8 }}
    transition={MOTION.pageFade}
  >
    <PageRenderer page={page} imageAsset={imageAsset} locale="zh-CN" registry={registry} zoom={zoom} />
  </motion.div>
</AnimatePresence>
```

`mode="wait"`:exit 完成才 enter,防止两个页面瞬间重叠。`initial={false}`:首次 mount 不做入场动画(避免页面"飞进"的视觉噪音)。

### 3.3 方向感知

`MagazineReader` 持一个 `lastDirectionRef`:

```ts
const lastDirectionRef = useRef<1 | -1 | 0>(0);  // 1 = next, -1 = prev, 0 = jump/init

// wrap goNext / goPrevious / goToPage:
const goNext = useCallback(() => {
  lastDirectionRef.current = 1;
  readerState.goNext();
}, [readerState]);
// similarly goPrevious → -1, goToPage → 0
```

把 `direction` 从 `MagazineReader` 传到 `PageViewport` → 内部 `PageContent`。

跳页(目录 / TOC tab / 进度条点击)用 `direction = 0` → 纯 fade 无滑入。
↑↓ ←→ 翻页用 `direction = ±1` → fade + 滑入。

### 3.4 reduced-motion

framer-motion 自动读 `prefers-reduced-motion`,降级为 `duration: 0` instant cut。无需额外代码。

### 3.5 注意事项

- 不对 ImageOverlayTemplate / SpreadPageRenderer 内部加动画(那是另一层职责)
- TOC、Glossary 这些非 imageOverlay 页面也走同一套路径,无需特殊分支
- 当前页 zoom / hotspot / comment pin 状态在 page key 切换时自然 unmount/remount,符合预期

---

## 4. (I) 进度条可交互

### 4.1 当前

`ReaderBottomBar.tsx` 的进度条是 4px 高(Tailwind `h-1`)纯装饰,无 hover、无 click:

```tsx
<div className="h-1 bg-border">
  <div className="h-full bg-accent ..." style={{ width: `${progress}%` }} />
</div>
```

### 4.2 目标行为(选定 B 方案)

- **悬停** 进度条任意 x 位置 → 显示 tooltip,内容 = `"第 N 页 · <page title>"`
- **点击** → 跳到对应页(通过 `onNavigateToPage(pageId)`)
- 鼠标光标在进度条上为 `cursor: pointer`
- 无可见 handle / 无拖拽 scrub
- 无键盘 scrub(全局 ←/→ 已够)

### 4.3 实现要点

新组件 `<ProgressBar>` 暂内联在 `ReaderBottomBar.tsx`,不抽 primitive(单一消费点)。条高保持 4px,hover 时变 6px(`h-1` → `h-1.5`)增加视觉 affordance。整个条上下各加 8px 透明 padding,扩大 hit area 让贴近底栏其他元素时也好点准。

```tsx
type ProgressBarProps = {
  currentIndex: number;             // 0-based
  totalPages: number;
  readingOrder: PageId[];
  getPage: (pageId: PageId) => PageManifest | undefined;
  onNavigateToPage: (pageId: PageId) => void;
};

function ProgressBar(props) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  function pageFromX(x: number): { index: number; pageId: string } | null {
    if (!barRef.current) return null;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    const index = Math.min(totalPages - 1, Math.floor(ratio * totalPages));
    const pageId = readingOrder[index];
    return pageId ? { index, pageId } : null;
  }

  const hover = hoverX != null ? pageFromX(hoverX) : null;
  const hoverPage = hover ? getPage(hover.pageId) : undefined;

  return (
    <div
      ref={barRef}
      onMouseMove={(e) => setHoverX(e.clientX)}
      onMouseLeave={() => setHoverX(null)}
      onClick={(e) => { const h = pageFromX(e.clientX); if (h) onNavigateToPage(h.pageId); }}
      className="relative h-1 bg-border cursor-pointer hover:h-1.5 transition-all duration-100"
    >
      <div className="h-full bg-accent transition-all duration-300"
           style={{ width: `${(currentIndex / Math.max(1, totalPages - 1)) * 100}%` }} />
      {hover && hoverPage && (
        <div className="absolute bottom-3 -translate-x-1/2 bg-chrome text-page text-xs px-2 py-1 rounded shadow-[var(--shadow-2)] whitespace-nowrap pointer-events-none"
             style={{ left: `${(hover.index / Math.max(1, totalPages - 1)) * 100}%` }}>
          <span className="font-mono text-text-muted text-[10px] mr-1.5">{hover.index + 1}</span>
          {hoverPage.title?.['zh-CN'] ?? hover.pageId}
        </div>
      )}
    </div>
  );
}
```

**鼠标 hover 高 2px 反馈:** Tailwind `hover:h-1.5` 让进度条 hover 时变粗,提供 affordance。

### 4.4 ReaderBottomBar 改动

```tsx
// before:
<div className="h-1 bg-border">
  <div className="h-full bg-accent ..." style={{ width: ... }} />
</div>

// after:
<ProgressBar
  currentIndex={currentIndex}
  totalPages={totalPages}
  readingOrder={registry.manifest.readingOrder}
  getPage={(id) => registry.getPage(id)}
  onNavigateToPage={onNavigateToPage}
/>
```

`ReaderBottomBar` 需要新加两个 prop:`readingOrder` / `getPage` / `onNavigateToPage`。这些来自 `ReaderShell` 已持有的 `registry` 与 `MagazineReader` 已有的 `handleNavigateToPage`。

---

## 5. 文件改动总览

```
src/
  atlas-core/reader/
    useReaderState.ts             (无改动)
  atlas-ui/reader/
    MagazineReader.tsx            ← lastDirectionRef + 包 goNext/goPrev/goToPage
    PageViewport.tsx              ← <AnimatePresence> + <motion.div>
    ReaderBottomBar.tsx           ← 内嵌 <ProgressBar>;接 readingOrder / getPage / onNavigateToPage prop
    ReaderShell.tsx               ← 透传上述 3 个 prop 到 ReaderBottomBar
    __tests__/
      ReaderBottomBar.test.tsx    ← 补 3 个 ProgressBar 测试

tsconfig.app.json                 ← 删 baseUrl
vite.config.ts                    ← 删 test 字段
vitest.config.ts                  ← 新建,持测试配置
```

---

## 6. 测试策略

### 6.1 单元

`ReaderBottomBar.test.tsx` 新增 3 个测试:

```tsx
it('progress bar click triggers onNavigateToPage with the page at the click x', async () => {
  const onNav = vi.fn();
  // render with mock readingOrder/getPage/totalPages=10
  // simulate click on bar at 50% position
  expect(onNav).toHaveBeenCalledWith('page-5'); // 50% of 10 = index 5
});

it('hovering shows tooltip with page number and title', async () => {
  // render, mouseMove at 30% x position
  // expect screen.getByText('第 3 页 · 测试页面 3')(或近似)
});

it('cursor leave hides tooltip', async () => {
  // render, mouseEnter then mouseLeave
  // expect tooltip absent
});
```

### 6.2 集成

不新增。现有 `railIntegration` / `plusButtonFlow` 等集成测试中已渲染 `ReaderBottomBar`;只需修改如果它们因新 prop 报错(应当无,因为非必需 prop 会有默认)。

### 6.3 守住

- 整套 `npm test` 保持 324 + 3 = 327 passed
- `npm run lint` 不退化
- `npm run build` **变为零错误**(新成就)

---

## 7. 实施分期

**5 commit:**

1. **U-a:** 删 `tsconfig.app.json` 的 `baseUrl`,确认 `npm test` + `npm run build` 仅剩 vite.config 错
2. **U-b:** vite.config 删 `test`,新建 `vitest.config.ts`,确认 `npm run build` 0 错误
3. **N:** PageViewport 包 motion + MagazineReader 加 lastDirectionRef
4. **I-impl:** 进度条 `<ProgressBar>` 内联实现 + ReaderBottomBar 接 prop + ReaderShell 透传
5. **I-test:** 3 个 ProgressBar 测试

---

## 8. 风险

| 风险 | 应对 |
|---|---|
| 删 baseUrl 后 `@/` 导入失效 | 先在一个测试文件里验证 `@/atlas-core/...` 仍能解析;TS 6 已支持 |
| `vitest.config.ts` 配置 paths 重复 vite.config.ts | 必须重复一份(各自独立工具),~10 行的小冗余,可接受 |
| AnimatePresence 在 strict mode 下 double-render | framer-motion 12 已修;若旧版需要 `LayoutGroup`,这里不涉及 |
| 进度条 hover tooltip 在小屏 / 触屏体验差 | 触屏没有 hover,只能用 click;tooltip 自动不显示,功能不受损 |
| readingOrder/getPage 通过多层 prop 传递繁琐 | 可接受 — 替代方案是 context,过度工程化 |
| ReaderShell 集成测试 fixture 不传新 prop 报错 | 新 prop 给默认 noop 函数;集成测试可保持不变 |

---

## 9. 验收清单

- [ ] `tsconfig.app.json` 不含 `baseUrl`
- [ ] `vitest.config.ts` 存在,包含原 vite.config 的 test 段
- [ ] `vite.config.ts` 不含 `test:` 字段
- [ ] `npm run build`(完整 `tsc -b && vite build`)0 error
- [ ] 翻页时主图淡入 + 8px 滑入,带方向感
- [ ] 系统 reduced-motion 模式下,翻页为硬切(framer-motion 自动)
- [ ] 进度条 hover 显示 tooltip,内容 "第 N 页 · <title>"
- [ ] 进度条 click 跳到该页,URL 同步更新
- [ ] 进度条 hover 时高度从 1px 变 1.5px
- [ ] `npm test` 全绿,327 passed
- [ ] `npm run lint` 持平 40

---

## 10. 后续 Spec 预览

- **Spec F — 查找与发现:** J(TOC tab 章节折叠 / sticky 当前页 / 内联搜索)+ K(全局搜索 = 页标题 / glossary / notes / scenarios / 法条,不含 OCR)
- **Spec G — Rich Region UI + Bundle CLI:** E(textRegions hover / sections click 高亮)+ R(`atlas-validate` CLI)

——

**等待用户审核此 spec → 若 OK 进 writing-plans。**
