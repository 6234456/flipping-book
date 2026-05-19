# Spec E — Reader Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up two pre-existing TS errors so `npm run build` passes, add a 180ms fade + 8px direction-aware slide between pages, and make the bottom progress bar a hover-tooltip + click-to-jump UI.

**Architecture:** Three independent changes. (U) splits the long-conflated `vite.config.ts` into separate `vite.config.ts` + `vitest.config.ts` and removes the deprecated `baseUrl` from `tsconfig.app.json`. (N) wraps `<PageRenderer>` in `<AnimatePresence mode="wait">` + `<motion.div>` keyed by `pageId`, computing direction via observation of `readerState.currentPageIndex`. (I) replaces the static progress-bar `<div>` in `ReaderBottomBar` with an inline `<ProgressBar>` component that captures mouse position to drive a tooltip + click-to-jump.

**Tech Stack:** React 19, TypeScript 5.8, Vite 8, Vitest 4, framer-motion 12. **No new dependencies.**

**Spec source:** [`docs/superpowers/specs/2026-05-17-spec-e-reader-interactions-design.md`](../specs/2026-05-17-spec-e-reader-interactions-design.md)

---

## Prerequisite — Worktree

Branch off latest `main` (currently `8e287e2`):

```bash
git -C /Users/qiouyang/Documents/Claude/Codes/flipping-book \
    worktree add /Users/qiouyang/Documents/Claude/Codes/flipping-book/.claude/worktrees/spec-e-reader \
    -b claude/spec-e-reader
cd /Users/qiouyang/Documents/Claude/Codes/flipping-book/.claude/worktrees/spec-e-reader
npm install
```

All subsequent commands run inside this worktree.

---

## File Plan

**Modify:**

```
tsconfig.app.json                                  ← Task 1: delete `baseUrl`
vite.config.ts                                     ← Task 2: delete `test:` and `<reference>`
src/atlas-ui/reader/PageViewport.tsx               ← Task 3: AnimatePresence + motion + direction
src/atlas-ui/reader/ReaderBottomBar.tsx            ← Task 4: inline ProgressBar
src/atlas-ui/reader/ReaderShell.tsx                ← Task 4: thread readingOrder/getPage/onNavigateToPage
src/atlas-ui/reader/__tests__/ReaderBottomBar.test.tsx  ← Task 5: 3 new tests + fix existing
```

**Create:**

```
vitest.config.ts                                   ← Task 2: holds vitest config moved from vite.config
```

**Delete:** none.

---

## Conventions

- **Test runner:** `npm test` (Vitest, once). Single file: `npx vitest run <path>`.
- **Build:** `npm run build` runs `tsc -b && vite build`. After Task 2 this should succeed cleanly.
- **Lint:** `npm run lint`. Must not regress beyond baseline 40.
- **Dev server:** `npm run dev`.
- **Commits:** Conventional Commits.
- **TDD:** Tests first for Task 5 (behavior). Tasks 1/2/3/4 verified via run/build output (config / animation / wiring is hard to TDD).

---

# Task 1: Remove deprecated `baseUrl` from tsconfig.app.json

**Files:**
- Modify: `tsconfig.app.json`

- [ ] **Step 1: Verify current state**

Run:
```bash
npm run build 2>&1 | grep "TS5101" | head -1
```
Expected: error message `tsconfig.app.json(25,5): error TS5101: Option 'baseUrl' is deprecated...`

- [ ] **Step 2: Edit `tsconfig.app.json`**

Remove the `"baseUrl": ".",` line. Replace lines 24-28 from:

```json
    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
```

To:

```json
    /* Path aliases */
    "paths": {
      "@/*": ["./src/*"]
    }
```

- [ ] **Step 3: Verify TS no longer complains about TS5101**

Run:
```bash
npm run build 2>&1 | grep "TS5101" | head -1
```
Expected: empty (no TS5101 error left).

- [ ] **Step 4: Verify build still has the vite.config.ts error (Task 2 will fix that)**

Run:
```bash
npm run build 2>&1 | grep "vite.config" | head -1
```
Expected: still shows `vite.config.ts(14,3): error TS2769...` — we'll fix in Task 2.

- [ ] **Step 5: Verify tests + lint still green**

Run:
```bash
npm test 2>&1 | tail -3
```
Expected: 324 tests passed.

Run:
```bash
npm run lint 2>&1 | grep "✖" | tail -1
```
Expected: `✖ 40 problems` (baseline preserved).

- [ ] **Step 6: Verify `@/...` imports still resolve**

The codebase doesn't use `@/...` imports (verified via grep `from '@/'` returns 0 hits). The `paths` mapping remains intact for future use. Run:
```bash
grep -rn "from '@/" src --include="*.ts" --include="*.tsx" | head -3
```
Expected: empty (no consumers, mapping is forward-looking).

- [ ] **Step 7: Commit**

```bash
git add tsconfig.app.json
git commit -m "fix(tsconfig): remove deprecated baseUrl, rely on paths alone"
```

---

# Task 2: Split vitest config out of vite.config.ts

**Files:**
- Modify: `vite.config.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

Create the new file at the repo root:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
  },
})
```

- [ ] **Step 2: Replace `vite.config.ts`**

Overwrite the file with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Note: the `/// <reference types="vitest" />` line at the top is removed.
The `test:` block is removed.
`tailwindcss()` plugin stays because it's a Vite (not Vitest) plugin.

- [ ] **Step 3: Verify build is now clean**

Run:
```bash
npm run build 2>&1 | tail -15
```
Expected: no TS errors. Vite build succeeds. Only the existing `chunk-size > 500 kB` warning may appear (it's not a build error).

- [ ] **Step 4: Verify tests still pass with the new vitest config**

Run:
```bash
npm test 2>&1 | tail -5
```
Expected: 324 tests passed across 55 files (Vitest auto-detects `vitest.config.ts`).

- [ ] **Step 5: Verify dev server still works**

Run (background):
```bash
npm run dev > /tmp/dev.log 2>&1 &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
pkill -f "vite$" 2>/dev/null
```
Expected: `200` (server responds normally).

- [ ] **Step 6: Lint baseline preserved**

Run:
```bash
npm run lint 2>&1 | grep "✖" | tail -1
```
Expected: `✖ 40 problems`.

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts vitest.config.ts
git commit -m "fix(build): split vitest config to vitest.config.ts so tsc -b passes"
```

---

# Task 3: Page transition animation

**Files:**
- Modify: `src/atlas-ui/reader/PageViewport.tsx`

This task wraps the `PageRenderer` call inside `PageContent` with `<AnimatePresence mode="wait">` + `<motion.div>` keyed by `page.pageId`. Direction is computed in the outer `PageViewport` from observed `currentPageIndex` changes and passed in.

- [ ] **Step 1: Read current PageViewport**

Run:
```bash
wc -l src/atlas-ui/reader/PageViewport.tsx
```
Expected: 225 lines (the file as-is at HEAD).

- [ ] **Step 2: Replace `PageViewport.tsx` with the animated version**

Overwrite the file with:

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize, Maximize2, ZoomIn, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import { useSpreadMode } from '../../atlas-core/reader/useSpreadMode';
import { PageRenderer } from '../renderers/PageRenderer';
import { SpreadPageRenderer } from '../renderers/SpreadPageRenderer';
import { HotspotLayer } from '../overlay/HotspotLayer';
import { DebugOverlay } from '../overlay/DebugOverlay';
import { CommentPinLayer } from '../comments/CommentPinLayer';
import { CommentCaptureLayer } from '../comments/CommentCaptureLayer';
import { Button, EmptyState, MOTION } from '../primitives';
import type { HotspotTarget } from '../../atlas-core/types/overlay';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import { resolveTargetRoute } from '../../atlas-core/registry/resolveTarget';
import type { PageManifest } from '../../atlas-core/types/page';
import type { ZoomLevel } from '../renderers/ImageOverlayTemplate';

const ZOOM_LABEL: Record<ZoomLevel, string> = {
  'fit-page': '适应页面',
  'fit-width': '适应宽度',
  'actual-size': '实际大小',
};

const ZOOM_ICON: Record<ZoomLevel, LucideIcon> = {
  'fit-page': Maximize,
  'fit-width': Maximize2,
  'actual-size': ZoomIn,
};

type Direction = 1 | -1 | 0;

function PageContent({
  page,
  registry,
  interactionMode,
  onNavigate,
  zoom,
  onCycleZoom,
  commentThreads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onCreateAnchor,
  direction,
}: {
  page: PageManifest;
  registry: BookRegistry;
  interactionMode: ReaderState['interactionMode'];
  onNavigate: (target: HotspotTarget) => void;
  zoom: ZoomLevel;
  onCycleZoom: () => void;
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
  direction: Direction;
}) {
  const spreadMode = useSpreadMode(page, registry.manifest.reader);

  const imageAsset = page.image ? registry.getImage(page.image.assetId) : undefined;
  const effectiveImageAssetId = page.image?.assetId ?? '';
  const effectiveImageVersion = page.image?.version ?? '';

  const isFitPage = zoom === 'fit-page';
  const ZoomIconComp = ZOOM_ICON[zoom];

  const overlayConfig = page.overlay ? registry.getOverlay(page.overlay.overlayId) : undefined;

  function renderPins() {
    return (
      <CommentPinLayer
        threads={commentThreads}
        highlightedThreadId={highlightedThreadId}
        onHoverThread={onHoverThread}
        onClickThread={(id) => onSelectThread(id === selectedThreadId ? null : id)}
      />
    );
  }

  const slide = direction * 8;

  if (page.spreadImages && spreadMode.mode === 'spread') {
    return (
      <main className="flex-1 flex flex-col items-center overflow-auto bg-surface">
        <div className="sticky top-0 z-50 flex items-center gap-1 px-2 py-1 bg-page/90 backdrop-blur shrink-0 self-start border-b border-border">
          <Button variant="ghost" size="sm" leadingIcon={ZoomIconComp} onClick={onCycleZoom}>
            {ZOOM_LABEL[zoom]}
          </Button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page.pageId}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide }}
            transition={MOTION.pageFade}
            className="relative"
          >
            <SpreadPageRenderer
              page={page}
              spreadImages={page.spreadImages}
              registry={registry}
              locale="zh-CN"
              spreadMode={spreadMode.mode}
              interactionMode={interactionMode}
              onNavigate={onNavigate}
            />
            {interactionMode === 'comment' && renderPins()}
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center overflow-auto bg-surface">
      <div className="sticky top-0 z-50 flex items-center gap-2 px-2 py-1 bg-page/90 backdrop-blur shrink-0 self-start border-b border-border">
        <Button variant="ghost" size="sm" leadingIcon={ZoomIconComp} onClick={onCycleZoom}>
          {ZOOM_LABEL[zoom]}
        </Button>
        {imageAsset ? (
          <span className="text-text-muted text-xs tabular-nums">
            {imageAsset.width}×{imageAsset.height}
          </span>
        ) : null}
      </div>

      <div className={`relative ${isFitPage ? 'flex-1 flex items-center justify-center overflow-hidden' : ''}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page.pageId}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide }}
            transition={MOTION.pageFade}
            className="relative"
          >
            <PageRenderer
              page={page}
              imageAsset={imageAsset}
              locale="zh-CN"
              registry={registry}
              zoom={zoom}
            />

            {overlayConfig && interactionMode === 'read' && (
              <HotspotLayer overlay={overlayConfig} imageAsset={imageAsset} onNavigate={onNavigate} />
            )}

            {interactionMode === 'comment' && renderPins()}

            <CommentCaptureLayer
              pageId={page.pageId}
              imageAssetId={effectiveImageAssetId}
              imageVersion={effectiveImageVersion}
              active={interactionMode === 'comment'}
              onCreateAnchor={onCreateAnchor}
            />

            {overlayConfig && interactionMode === 'debugOverlay' && (
              <DebugOverlay overlay={overlayConfig} imageAsset={imageAsset} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

type PageViewportProps = {
  registry: BookRegistry;
  readerState: ReaderState;
  zoom: ZoomLevel;
  onCycleZoom: () => void;
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
};

export function PageViewport({
  registry,
  readerState,
  zoom,
  onCycleZoom,
  commentThreads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onCreateAnchor,
}: PageViewportProps) {
  const { currentPage, interactionMode, currentPageIndex } = readerState;
  const navigate = useNavigate();
  const bookSlug = registry.manifest.slug;

  // Observe page-index changes to derive transition direction.
  const prevIndexRef = useRef(currentPageIndex);
  const direction = useMemo<Direction>(() => {
    const prev = prevIndexRef.current;
    const cur = currentPageIndex;
    if (cur === prev) return 0;
    // ±1 step → forward/back. Anything else (jump / TOC click / progress click) → pure fade.
    return Math.abs(cur - prev) === 1 ? (cur > prev ? 1 : -1) : 0;
  }, [currentPageIndex]);

  useEffect(() => {
    prevIndexRef.current = currentPageIndex;
  }, [currentPageIndex]);

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <EmptyState
          icon={BookOpen}
          title="页面未找到"
          description="可能链接已失效。返回首页继续阅读。"
          action={
            <Link
              to={`/book/${bookSlug}`}
              className="text-accent hover:text-accent-hover text-sm font-medium"
            >
              返回首页 →
            </Link>
          }
        />
      </div>
    );
  }

  function handleNavigate(target: HotspotTarget) {
    const route = resolveTargetRoute(target, registry.manifest.slug);
    if (route && target.kind !== 'external') {
      navigate(route);
    } else if (route && target.kind === 'external') {
      window.open(route, target.openInNewTab ? '_blank' : '_self');
    }
  }

  return (
    <PageContent
      page={currentPage}
      registry={registry}
      interactionMode={interactionMode}
      onNavigate={handleNavigate}
      zoom={zoom}
      onCycleZoom={onCycleZoom}
      commentThreads={commentThreads}
      selectedThreadId={selectedThreadId}
      highlightedThreadId={highlightedThreadId}
      onSelectThread={onSelectThread}
      onHoverThread={onHoverThread}
      onCreateAnchor={onCreateAnchor}
      direction={direction}
    />
  );
}
```

Key changes from the previous version:
1. Adds `useEffect`, `useMemo`, `useRef` imports.
2. Adds `AnimatePresence, motion` from `framer-motion`.
3. Adds `MOTION` from `../primitives`.
4. New `Direction` type.
5. New `direction` prop on `PageContent` propagated from `PageViewport`.
6. Wraps both spread and single-page renderers in `<AnimatePresence mode="wait" initial={false}>` + `<motion.div key={page.pageId}>`.
7. Top `PageViewport` computes `direction` via `useMemo` from observed `currentPageIndex` change vs the value in `prevIndexRef`; `useEffect` updates the ref after commit so the next change sees the new previous.

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```

Expected: 324 tests passed (animation is wrap-only; existing tests still find their selectors).

If a reader integration test (e.g., `railIntegration.test.tsx`) fails because it queries something now wrapped, the most likely cause is an extra `<div>` in the DOM tree. The fix is to query by role or text rather than by structural selector. Fix in this commit if any.

- [ ] **Step 4: Smoke (visual confirmation)**

```bash
npm run dev > /tmp/dev.log 2>&1 &
sleep 4
echo "Open http://localhost:5173/ in browser, press ArrowRight several times; page should fade with slight slide. Then Ctrl+C."
sleep 2
pkill -f "vite$" 2>/dev/null
```

If you cannot interactively test, accept the visual change unverified — the unit test suite stays green and the framer-motion API is well-trodden.

- [ ] **Step 5: Lint check**

```bash
npm run lint 2>&1 | grep "✖" | tail -1
```
Expected: `✖ 40 problems`.

- [ ] **Step 6: Commit**

```bash
git add src/atlas-ui/reader/PageViewport.tsx
git commit -m "feat(reader): add fade+slide page transition with direction awareness"
```

---

# Task 4: Interactive ProgressBar in ReaderBottomBar

**Files:**
- Modify: `src/atlas-ui/reader/ReaderBottomBar.tsx`
- Modify: `src/atlas-ui/reader/ReaderShell.tsx`

This replaces the static progress div with an inline `<ProgressBar>` that captures mouse position to drive a tooltip and a click handler. `ReaderShell` already holds `registry` and `onNavigateToPage` from earlier specs — just thread them through.

- [ ] **Step 1: Replace `ReaderBottomBar.tsx`**

Overwrite the file with:

```tsx
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageManifest } from '../../atlas-core/types/page';
import type { PageId } from '../../atlas-core/types/primitives';
import { Button } from '../primitives';

type ProgressBarProps = {
  currentIndex: number;
  totalPages: number;
  readingOrder: PageId[];
  getPage: (pageId: PageId) => PageManifest | undefined;
  onNavigateToPage: (pageId: PageId) => void;
};

function ProgressBar({
  currentIndex,
  totalPages,
  readingOrder,
  getPage,
  onNavigateToPage,
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  function indexAtClientX(clientX: number): number | null {
    const el = barRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.min(totalPages - 1, Math.floor(ratio * totalPages));
  }

  const progressPct =
    totalPages > 1 ? (currentIndex / (totalPages - 1)) * 100 : 100;
  const hoverPct =
    hoverIndex != null && totalPages > 1
      ? (hoverIndex / (totalPages - 1)) * 100
      : null;
  const hoverPageId = hoverIndex != null ? readingOrder[hoverIndex] : undefined;
  const hoverPage = hoverPageId ? getPage(hoverPageId) : undefined;

  return (
    <div
      className="relative py-2 cursor-pointer group"
      onMouseMove={(e) => {
        const idx = indexAtClientX(e.clientX);
        if (idx != null) setHoverIndex(idx);
      }}
      onMouseLeave={() => setHoverIndex(null)}
      onClick={(e) => {
        const idx = indexAtClientX(e.clientX);
        if (idx != null) {
          const pageId = readingOrder[idx];
          if (pageId) onNavigateToPage(pageId);
        }
      }}
      data-testid="progress-bar"
    >
      <div
        ref={barRef}
        className="h-1 bg-border rounded-full transition-[height] duration-100 group-hover:h-1.5"
      >
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      {hoverPct != null && hoverPage && (
        <div
          className="absolute -top-1 -translate-x-1/2 -translate-y-full bg-chrome text-page text-xs px-2 py-1 rounded shadow-[var(--shadow-2)] whitespace-nowrap pointer-events-none"
          style={{ left: `${hoverPct}%` }}
          data-testid="progress-tooltip"
        >
          <span className="font-mono text-text-muted text-[10px] mr-1.5">
            {hoverIndex! + 1}
          </span>
          {hoverPage.title?.['zh-CN'] ?? hoverPageId}
        </div>
      )}
    </div>
  );
}

type ReaderBottomBarProps = {
  currentIndex: number;
  totalPages: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  readingOrder: PageId[];
  getPage: (pageId: PageId) => PageManifest | undefined;
  onNavigateToPage: (pageId: PageId) => void;
};

export function ReaderBottomBar({
  currentIndex,
  totalPages,
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
  readingOrder,
  getPage,
  onNavigateToPage,
}: ReaderBottomBarProps) {
  return (
    <footer className="flex flex-col shrink-0 bg-page border-t border-border">
      <ProgressBar
        currentIndex={currentIndex}
        totalPages={totalPages}
        readingOrder={readingOrder}
        getPage={getPage}
        onNavigateToPage={onNavigateToPage}
      />
      <div className="flex items-center justify-between px-4 py-2">
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={ChevronLeft}
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          上一页
        </Button>
        <span className="text-xs text-text-2 tabular-nums">
          {currentIndex + 1} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          trailingIcon={ChevronRight}
          onClick={onNext}
          disabled={!canGoNext}
        >
          下一页
        </Button>
      </div>
    </footer>
  );
}
```

Notes:
- The outer `<div>` wraps `py-2` (8px top + 8px bottom) plus the 4px bar = ~20px hit area but only the inner 4-6px shows.
- `data-testid` attributes drive the tests in Task 5.
- `transition-[height]` is Tailwind 4 arbitrary-property syntax; if Tailwind ignores it, the height still changes — just instantly. Acceptable degradation.

- [ ] **Step 2: Modify `ReaderShell.tsx` to pass the new props**

Find the JSX block that renders `<ReaderBottomBar ... />` near the bottom of `ReaderShell.tsx`. Replace it with this expanded version:

```tsx
{manifest.navigation?.showBottomBar && (
  <ReaderBottomBar
    currentIndex={readerState.currentPageIndex}
    totalPages={readerState.totalPages}
    canGoNext={readerState.canGoNext}
    canGoPrevious={readerState.canGoPrevious}
    onNext={readerState.goNext}
    onPrevious={readerState.goPrevious}
    readingOrder={registry.manifest.readingOrder}
    getPage={(id) => registry.getPage(id)}
    onNavigateToPage={onNavigateToPage}
  />
)}
```

The three new props are:
1. `readingOrder={registry.manifest.readingOrder}` — already available via the `registry` prop.
2. `getPage={(id) => registry.getPage(id)}` — same, simple closure.
3. `onNavigateToPage={onNavigateToPage}` — already a `ReaderShellProps` field used by TocTab; just re-use.

If `ReaderShellProps` doesn't currently have `onNavigateToPage`, search for it:
```bash
grep -n "onNavigateToPage" src/atlas-ui/reader/ReaderShell.tsx
```
It should appear in the props type (added in Spec B). If not, add it to `ReaderShellProps`:
```ts
onNavigateToPage: (pageId: string) => void;
```

- [ ] **Step 3: Verify TypeScript happy**

```bash
npx vitest run src/atlas-ui/reader/__tests__/ReaderBottomBar.test.tsx 2>&1 | tail -15
```

The **existing** tests will likely break here — at minimum the line in `ReaderBottomBar.test.tsx`:
```ts
const bar = container.querySelector('.h-1 > div');
```
will still work (the inner accent fill is still `.h-1.bg-accent` inside `.h-1.bg-border`... wait, after the rewrite the outer is `.h-1.bg-border` containing `.h-full.bg-accent`).

Actually look: after rewrite, the bar's class is `h-1 bg-border ...` (the outer with `bg-border`), and the fill inside has `h-full bg-accent`. So `.h-1 > div` still selects the fill. The test should still pass.

But the existing test props don't include `readingOrder` / `getPage` / `onNavigateToPage`. TypeScript will complain. The tests must be updated.

Update each `<ReaderBottomBar ... />` call in the test file to add the three new props. Use this pattern:

```ts
const NOOP_NAV = vi.fn();
const NOOP_GETPAGE = () => undefined;
const EMPTY_ORDER: string[] = [];

// In each render call, append:
readingOrder={EMPTY_ORDER}
getPage={NOOP_GETPAGE}
onNavigateToPage={NOOP_NAV}
```

To minimize churn, factor a helper at the top of the test file:

```ts
function renderBottomBar(
  overrides: Partial<React.ComponentProps<typeof ReaderBottomBar>> = {},
) {
  return render(
    <ReaderBottomBar
      currentIndex={0}
      totalPages={5}
      canGoNext={true}
      canGoPrevious={true}
      onNext={vi.fn()}
      onPrevious={vi.fn()}
      readingOrder={['p-1', 'p-2', 'p-3', 'p-4', 'p-5']}
      getPage={(id) =>
        ({
          pageId: id,
          title: { 'zh-CN': `Page ${id}` },
        } as unknown as PageManifest)
      }
      onNavigateToPage={vi.fn()}
      {...overrides}
    />,
  );
}
```

Then change each existing test body to call `renderBottomBar({...})` with only the props that test cares about. Add `import type { PageManifest } from '../../../atlas-core/types/page';` at top.

- [ ] **Step 4: Update existing tests + run**

Replace the entire file `src/atlas-ui/reader/__tests__/ReaderBottomBar.test.tsx` with:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ReaderBottomBar } from '../ReaderBottomBar';
import type { PageManifest } from '../../../atlas-core/types/page';

function fakeGetPage(id: string): PageManifest | undefined {
  return { pageId: id, title: { 'zh-CN': `Page ${id}` } } as unknown as PageManifest;
}

function renderBottomBar(
  overrides: Partial<React.ComponentProps<typeof ReaderBottomBar>> = {},
) {
  return render(
    <ReaderBottomBar
      currentIndex={0}
      totalPages={5}
      canGoNext={true}
      canGoPrevious={true}
      onNext={vi.fn()}
      onPrevious={vi.fn()}
      readingOrder={['p-1', 'p-2', 'p-3', 'p-4', 'p-5']}
      getPage={fakeGetPage}
      onNavigateToPage={vi.fn()}
      {...overrides}
    />,
  );
}

describe('ReaderBottomBar', () => {
  it('renders page indicator', () => {
    renderBottomBar({ currentIndex: 2, totalPages: 10 });
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('next button enabled and fires onNext', async () => {
    const onNext = vi.fn();
    renderBottomBar({ canGoNext: true, canGoPrevious: false, onNext });
    const btn = screen.getByRole('button', { name: '下一页' });
    expect(btn).not.toBeDisabled();
    await userEvent.click(btn);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('next button disabled when cannot go next', () => {
    renderBottomBar({ canGoNext: false });
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();
  });

  it('previous button disabled when cannot go previous', () => {
    renderBottomBar({ canGoPrevious: false });
    expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled();
  });

  it('calls onPrevious when clicked', async () => {
    const onPrevious = vi.fn();
    renderBottomBar({ onPrevious });
    await userEvent.click(screen.getByRole('button', { name: '上一页' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('shows full progress fill for single page', () => {
    const { container } = renderBottomBar({ totalPages: 1 });
    const fill = container.querySelector('[data-testid="progress-bar"] .bg-accent');
    expect(fill).toHaveStyle({ width: '100%' });
  });
});
```

Run:
```bash
npx vitest run src/atlas-ui/reader/__tests__/ReaderBottomBar.test.tsx 2>&1 | tail -10
```
Expected: 6 tests passed (existing 6, all updated to use `renderBottomBar` helper, plus the new query for the fill).

- [ ] **Step 5: Run the full suite**

```bash
npm test 2>&1 | tail -5
```
Expected: 324 tests passed (Task 5 will add 3 more, taking us to 327).

- [ ] **Step 6: Lint baseline preserved**

```bash
npm run lint 2>&1 | grep "✖" | tail -1
```
Expected: `✖ 40 problems`.

- [ ] **Step 7: Commit**

```bash
git add src/atlas-ui/reader/ReaderBottomBar.tsx src/atlas-ui/reader/ReaderShell.tsx src/atlas-ui/reader/__tests__/ReaderBottomBar.test.tsx
git commit -m "feat(reader): replace static progress bar with hover-tooltip + click-to-jump ProgressBar"
```

---

# Task 5: ProgressBar behavior tests

**Files:**
- Modify: `src/atlas-ui/reader/__tests__/ReaderBottomBar.test.tsx` (add 3 tests)

The interaction tests need to stub `getBoundingClientRect` because jsdom returns zeros.

- [ ] **Step 1: Append 3 new tests at the end of the `describe` block**

Inside `src/atlas-ui/reader/__tests__/ReaderBottomBar.test.tsx`, add the following 3 `it(...)` blocks just before the closing `});` of the `describe` (after the `'shows full progress fill for single page'` test):

```tsx
  // Helper: stub the bar's bounding rect so jsdom click math works.
  function stubBarRect(container: HTMLElement, width = 100) {
    const bar = container.querySelector('[data-testid="progress-bar"]') as HTMLDivElement | null;
    if (!bar) throw new Error('progress bar not found');
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, right: width, width, top: 0, bottom: 4, height: 4,
      toJSON: () => ({}),
    } as DOMRect);
    return bar;
  }

  it('clicking the progress bar at 40% navigates to the page at that ratio', async () => {
    const onNavigateToPage = vi.fn();
    const { container } = renderBottomBar({
      currentIndex: 0,
      totalPages: 5,
      readingOrder: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5'],
      onNavigateToPage,
    });
    const bar = stubBarRect(container, 100);
    // floor(0.4 * 5) = 2  → page id "p-3"
    bar.dispatchEvent(new MouseEvent('click', { clientX: 40, bubbles: true }));
    expect(onNavigateToPage).toHaveBeenCalledWith('p-3');
  });

  it('mousemove on the progress bar shows tooltip with page number and title', async () => {
    const { container } = renderBottomBar({
      currentIndex: 0,
      totalPages: 5,
      readingOrder: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5'],
    });
    const bar = stubBarRect(container, 100);
    bar.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, bubbles: true }));
    // floor(0.6 * 5) = 3 → page id "p-4", page number 4
    const tip = await screen.findByTestId('progress-tooltip');
    expect(tip).toBeInTheDocument();
    expect(tip).toHaveTextContent('4');
    expect(tip).toHaveTextContent('Page p-4');
  });

  it('mouseleave hides the tooltip', async () => {
    const { container } = renderBottomBar({
      currentIndex: 0,
      totalPages: 5,
      readingOrder: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5'],
    });
    const bar = stubBarRect(container, 100);
    bar.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, bubbles: true }));
    expect(await screen.findByTestId('progress-tooltip')).toBeInTheDocument();
    bar.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    // tooltip should disappear after state update
    expect(screen.queryByTestId('progress-tooltip')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the file**

```bash
npx vitest run src/atlas-ui/reader/__tests__/ReaderBottomBar.test.tsx 2>&1 | tail -10
```
Expected: 9 tests passed (6 from Task 4 + 3 new).

- [ ] **Step 3: Run full suite**

```bash
npm test 2>&1 | tail -5
```
Expected: 327 tests passed.

- [ ] **Step 4: Lint baseline preserved**

```bash
npm run lint 2>&1 | grep "✖" | tail -1
```
Expected: `✖ 40 problems`.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/reader/__tests__/ReaderBottomBar.test.tsx
git commit -m "test(reader): cover ProgressBar click jump, hover tooltip, leave hide"
```

---

# Acceptance Criteria

- [ ] All 5 tasks committed
- [ ] `tsconfig.app.json` no longer contains `baseUrl`
- [ ] `vitest.config.ts` exists at repo root and holds the test config
- [ ] `vite.config.ts` does **not** contain a `test:` field or `<reference types="vitest" />`
- [ ] `npm run build` runs `tsc -b && vite build` **with zero errors** (it may emit one chunk-size warning — that's not an error)
- [ ] Translating between pages with arrow keys shows a fade + small slide; jumps via TOC click or progress-bar click do a pure fade (no slide)
- [ ] Progress bar at the bottom of the reader: hovering shows a tooltip "{N} {title}" anchored to the cursor x position; clicking jumps to that page
- [ ] Progress bar visibly grows from 4px to 6px on hover
- [ ] `npm test` reports 327 passing
- [ ] `npm run lint` reports the same 40 baseline (39 errors + 1 warning)

---

# Self-Review Notes

**Spec → plan coverage:**

| Spec §  | Task                                                                 |
|---|---|
| §2.2 (a) tsconfig baseUrl removal | Task 1 |
| §2.2 (b)+(c) vitest.config split  | Task 2 |
| §3.2 PageContent wraps in AnimatePresence/motion | Task 3 |
| §3.3 direction tracking via observed index change | Task 3 (`useMemo` + `prevIndexRef` + `useEffect`) |
| §3.4 reduced-motion respect | Framer-motion handles this automatically (documented in spec §3.4 — no code) |
| §4.3 ProgressBar component (inline) | Task 4 (`function ProgressBar` inside `ReaderBottomBar.tsx`) |
| §4.4 ReaderBottomBar/Shell new props | Task 4 |
| §6.1 ProgressBar tests (3 new) | Task 5 |
| §6.2 守住 existing integration tests | Task 3 step 3, Task 4 step 5 |
| §7 phase split (5 commits) | Matches 1:1 |
| §9 verification clauses | Acceptance section above |

**Intentional carry-overs (Spec F/G):**

- TOC tab enhancement (J) — Spec F
- Global search (K) — Spec F
- Rich region UI (Spec E item) — Spec G
- Bundle CLI (R) — Spec G

**Type consistency:**

- `Direction = 1 | -1 | 0` — defined once at top of PageViewport.tsx, used in both `PageContent` prop and `useMemo` return type ✓
- `ProgressBarProps` — defined inline in `ReaderBottomBar.tsx`, mirrors the new public props of `ReaderBottomBar` ✓
- `ReaderBottomBarProps.readingOrder: PageId[]` — same type used in `ReaderShell` via `registry.manifest.readingOrder` (already typed as `PageId[]` in `BookManifest`) ✓
- `getPage: (pageId: PageId) => PageManifest | undefined` — matches `BookRegistry.getPage` signature ✓

**Known judgement calls during execution:**

- If Task 3 reveals an integration test failing because the new wrapper div changed a query selector, update the test in the same commit (use role/text queries, not structural selectors).
- If Task 4's `transition-[height]` arbitrary property doesn't trigger in Tailwind 4 (the height still changes, just instantly), accept the degradation; the spec only requires the bar to grow, not that the growth be animated.
- If the existing `'shows full progress bar for single page'` test fails because the new selector `.bg-accent` matches multiple elements, narrow it via `[data-testid="progress-bar"] .bg-accent` (already done in the replacement test).
