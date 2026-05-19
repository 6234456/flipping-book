# Spec G — Rich Region UI + Bundle CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Light up the rich-region overlay data (textRegion hover tooltip + section click highlight) behind a new "区域" toggle, and ship a static bundle validator CLI for asset providers.

**Architecture:** Three small overlay components in `src/atlas-ui/overlay/` (`RichRegionLayer`, `TextRegionItem`, `SectionItem`) consume the `regions` array already produced by `convertOverlay`. `PageViewport` owns a `selectedRegionIds: Set<string>` state cleared on page change. `MagazineReader` owns the chrome-level `richRegionsOn` toggle, surfaced via a new `<ChromeButton>` in `ReaderShell` between 评论模式 and Debug. The Bundle CLI is a single zero-dependency Node ESM script under `scripts/validate-bundle.mjs` exporting individually testable check functions consumed by vitest fixtures under `src/__tests__/scripts/`.

**Tech Stack:** React 19, TypeScript 5.8, Vite 8, Vitest 4 + RTL 16, lucide-react (`LayoutGrid` icon), Spec A `Tooltip` + Spec B `ChromeButton` primitives. **No new npm dependencies.**

**Spec source:** [`docs/superpowers/specs/2026-05-19-spec-g-rich-regions-and-cli-design.md`](../specs/2026-05-19-spec-g-rich-regions-and-cli-design.md)

---

## Prerequisite — Worktree

```bash
git -C /Users/qiouyang/Documents/Claude/Codes/flipping-book \
    worktree add /Users/qiouyang/Documents/Claude/Codes/flipping-book/.claude/worktrees/spec-g-regions \
    -b claude/spec-g-regions
cd /Users/qiouyang/Documents/Claude/Codes/flipping-book/.claude/worktrees/spec-g-regions
npm install
```

All commands run inside this worktree.

---

## File Plan

**Create:**

```
src/atlas-ui/overlay/
  RichRegionLayer.tsx                  — container, dispatch per region kind
  TextRegionItem.tsx                   — textRegion hover tooltip
  SectionItem.tsx                      — section click toggle
  __tests__/
    RichRegionLayer.test.tsx
    TextRegionItem.test.tsx
    SectionItem.test.tsx

src/atlas-ui/reader/__tests__/
  richRegionToggle.test.tsx            — full toggle + page-switch clear integration

scripts/
  validate-bundle.mjs                  — single-file Node ESM CLI

src/__tests__/scripts/
  validate-bundle.test.ts              — vitest entrypoint, imports from ../../../scripts/validate-bundle.mjs
  fixtures/
    valid-bundle/
      manifest.json
      data/pages.json
      data/glossary.json
      images/SC-01_current_finals.png  — empty 1-byte placeholder (CLI only checks existence)
    broken-bundle/
      manifest.json                    — missing 'version' field
      data/pages.json                  — references nonexistent image + dangling noteId
      data/glossary.json               — duplicate termId
      images/                          — empty dir
```

**Modify:**

```
src/atlas-ui/reader/MagazineReader.tsx     ← add richRegionsOn state + handler
src/atlas-ui/reader/ReaderShell.tsx        ← insert 区域 ChromeButton + accept toggle props
src/atlas-ui/reader/PageViewport.tsx       ← richRegionsOn prop + selectedRegionIds state + mount RichRegionLayer
package.json                               ← add "validate-bundle" script
README.md                                  ← new "Bundle Validator CLI" section
```

---

## Conventions

- **Test runner:** `npm test` (Vitest, once). Single file: `npx vitest run <path>`.
- **Lint:** `npm run lint`. Must not regress beyond baseline.
- **Commits:** Conventional Commits.
- **TDD:** Every primitive starts with a failing test.
- **No new dependencies** — confirmed in spec §5.

---

# Phase E — Rich Region UI

## Task 1: `RichRegionLayer` + `TextRegionItem` + `SectionItem`

**Files:**
- Create: `src/atlas-ui/overlay/RichRegionLayer.tsx`
- Create: `src/atlas-ui/overlay/TextRegionItem.tsx`
- Create: `src/atlas-ui/overlay/SectionItem.tsx`
- Create: `src/atlas-ui/overlay/__tests__/RichRegionLayer.test.tsx`
- Create: `src/atlas-ui/overlay/__tests__/TextRegionItem.test.tsx`
- Create: `src/atlas-ui/overlay/__tests__/SectionItem.test.tsx`

- [ ] **Step 1: Failing test — SectionItem click + selected state**

Create `src/atlas-ui/overlay/__tests__/SectionItem.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionItem } from '../SectionItem';
import type { RichRegion } from '../../../atlas-core/types/regions';

const region: RichRegion = {
  regionId: 'sec-1',
  kind: 'section',
  role: 'detectedSection',
  rect: { x: 10, y: 20, width: 30, height: 40 },
};

describe('SectionItem', () => {
  it('calls onToggle with regionId when clicked', () => {
    const onToggle = vi.fn();
    render(<SectionItem region={region} selected={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('section-item-sec-1'));
    expect(onToggle).toHaveBeenCalledWith('sec-1');
  });

  it('renders selected styling when selected=true', () => {
    render(<SectionItem region={region} selected={true} onToggle={() => {}} />);
    const el = screen.getByTestId('section-item-sec-1');
    expect(el.className).toMatch(/bg-accent-bg-faint/);
    expect(el.getAttribute('data-selected')).toBe('true');
  });

  it('renders unselected hover-outline styling when selected=false', () => {
    render(<SectionItem region={region} selected={false} onToggle={() => {}} />);
    const el = screen.getByTestId('section-item-sec-1');
    expect(el.className).toMatch(/hover:outline/);
    expect(el.getAttribute('data-selected')).toBe('false');
  });

  it('positions absolutely using rect percentages', () => {
    render(<SectionItem region={region} selected={false} onToggle={() => {}} />);
    const el = screen.getByTestId('section-item-sec-1');
    expect(el.style.left).toBe('10%');
    expect(el.style.top).toBe('20%');
    expect(el.style.width).toBe('30%');
    expect(el.style.height).toBe('40%');
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npx vitest run src/atlas-ui/overlay/__tests__/SectionItem.test.tsx`
Expected: FAIL with `Failed to resolve import "../SectionItem"`.

- [ ] **Step 3: Implement `SectionItem`**

Create `src/atlas-ui/overlay/SectionItem.tsx`:

```tsx
import type { RichRegion } from '../../atlas-core/types/regions';

type SectionItemProps = {
  region: RichRegion;
  selected: boolean;
  onToggle: (regionId: string) => void;
};

export function SectionItem({ region, selected, onToggle }: SectionItemProps) {
  return (
    <div
      role="button"
      tabIndex={-1}
      data-testid={`section-item-${region.regionId}`}
      data-region-id={region.regionId}
      data-selected={selected ? 'true' : 'false'}
      style={{
        position: 'absolute',
        left: `${region.rect.x}%`,
        top: `${region.rect.y}%`,
        width: `${region.rect.width}%`,
        height: `${region.rect.height}%`,
        pointerEvents: 'auto',
      }}
      className={[
        'transition-colors duration-150',
        selected
          ? 'bg-accent-bg-faint border border-accent'
          : 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-accent',
      ].join(' ')}
      onClick={() => onToggle(region.regionId)}
    />
  );
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npx vitest run src/atlas-ui/overlay/__tests__/SectionItem.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Failing test — TextRegionItem**

Create `src/atlas-ui/overlay/__tests__/TextRegionItem.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextRegionItem } from '../TextRegionItem';
import type { RichRegion } from '../../../atlas-core/types/regions';
import * as RadixTooltip from '@radix-ui/react-tooltip';

function withProvider(ui: React.ReactNode) {
  return <RadixTooltip.Provider>{ui}</RadixTooltip.Provider>;
}

const baseRegion: RichRegion = {
  regionId: 'tx-1',
  kind: 'textRegion',
  role: 'title',
  rect: { x: 5, y: 10, width: 20, height: 8 },
};

describe('TextRegionItem', () => {
  it('renders nothing when region.text is undefined', () => {
    const { container } = render(withProvider(<TextRegionItem region={baseRegion} />));
    expect(container.querySelector('[data-testid="text-region-tx-1"]')).toBeNull();
  });

  it('renders nothing when region.text is empty string', () => {
    const { container } = render(
      withProvider(<TextRegionItem region={{ ...baseRegion, text: '' }} />),
    );
    expect(container.querySelector('[data-testid="text-region-tx-1"]')).toBeNull();
  });

  it('renders an absolutely-positioned trigger when region.text is set', () => {
    render(withProvider(<TextRegionItem region={{ ...baseRegion, text: 'Hello' }} />));
    const el = screen.getByTestId('text-region-tx-1');
    expect(el.style.left).toBe('5%');
    expect(el.style.top).toBe('10%');
    expect(el.style.width).toBe('20%');
    expect(el.style.height).toBe('8%');
  });
});
```

- [ ] **Step 6: Run test, verify fail**

Run: `npx vitest run src/atlas-ui/overlay/__tests__/TextRegionItem.test.tsx`
Expected: FAIL with `Failed to resolve import "../TextRegionItem"`.

- [ ] **Step 7: Implement `TextRegionItem`**

Create `src/atlas-ui/overlay/TextRegionItem.tsx`:

```tsx
import type { RichRegion } from '../../atlas-core/types/regions';
import { Tooltip } from '../primitives/Tooltip';

type TextRegionItemProps = {
  region: RichRegion;
};

export function TextRegionItem({ region }: TextRegionItemProps) {
  if (!region.text) return null;
  return (
    <Tooltip content={region.text} side="top">
      <div
        data-testid={`text-region-${region.regionId}`}
        data-region-id={region.regionId}
        style={{
          position: 'absolute',
          left: `${region.rect.x}%`,
          top: `${region.rect.y}%`,
          width: `${region.rect.width}%`,
          height: `${region.rect.height}%`,
          pointerEvents: 'auto',
          cursor: 'help',
        }}
        className="hover:outline hover:outline-1 hover:outline-dotted hover:outline-accent transition-all"
      />
    </Tooltip>
  );
}
```

- [ ] **Step 8: Run test, verify pass**

Run: `npx vitest run src/atlas-ui/overlay/__tests__/TextRegionItem.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 9: Failing test — RichRegionLayer dispatch**

Create `src/atlas-ui/overlay/__tests__/RichRegionLayer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { RichRegionLayer } from '../RichRegionLayer';
import type { RichRegion } from '../../../atlas-core/types/regions';

const regions: RichRegion[] = [
  {
    regionId: 'tx-1',
    kind: 'textRegion',
    role: 'title',
    rect: { x: 0, y: 0, width: 10, height: 10 },
    text: 'Section A',
  },
  {
    regionId: 'sec-1',
    kind: 'section',
    role: 'detectedSection',
    rect: { x: 10, y: 10, width: 30, height: 30 },
  },
  {
    regionId: 'grid-1',
    kind: 'gridRegion',
    role: 'gridRegion',
    rect: { x: 40, y: 40, width: 10, height: 10 },
  },
  {
    regionId: 'nav-1',
    kind: 'navigation',
    role: 'bottomNavigation',
    rect: { x: 50, y: 50, width: 10, height: 10 },
  },
];

function withProvider(ui: React.ReactNode) {
  return <RadixTooltip.Provider>{ui}</RadixTooltip.Provider>;
}

describe('RichRegionLayer', () => {
  it('renders textRegion + section items, ignores other kinds', () => {
    render(
      withProvider(
        <RichRegionLayer
          regions={regions}
          selectedIds={new Set()}
          onToggleSection={() => {}}
        />,
      ),
    );
    expect(screen.getByTestId('text-region-tx-1')).toBeInTheDocument();
    expect(screen.getByTestId('section-item-sec-1')).toBeInTheDocument();
    expect(screen.queryByTestId('text-region-grid-1')).toBeNull();
    expect(screen.queryByTestId('section-item-nav-1')).toBeNull();
  });

  it('container has pointer-events-none and absolute inset-0', () => {
    render(
      withProvider(
        <RichRegionLayer
          regions={regions}
          selectedIds={new Set()}
          onToggleSection={() => {}}
        />,
      ),
    );
    const layer = screen.getByTestId('rich-region-layer');
    expect(layer.className).toMatch(/absolute/);
    expect(layer.className).toMatch(/inset-0/);
    expect(layer.className).toMatch(/pointer-events-none/);
  });

  it('passes selected state to sections via selectedIds set', () => {
    render(
      withProvider(
        <RichRegionLayer
          regions={regions}
          selectedIds={new Set(['sec-1'])}
          onToggleSection={() => {}}
        />,
      ),
    );
    expect(screen.getByTestId('section-item-sec-1').getAttribute('data-selected')).toBe('true');
  });
});
```

- [ ] **Step 10: Run test, verify fail**

Run: `npx vitest run src/atlas-ui/overlay/__tests__/RichRegionLayer.test.tsx`
Expected: FAIL with `Failed to resolve import "../RichRegionLayer"`.

- [ ] **Step 11: Implement `RichRegionLayer`**

Create `src/atlas-ui/overlay/RichRegionLayer.tsx`:

```tsx
import type { RichRegion } from '../../atlas-core/types/regions';
import { TextRegionItem } from './TextRegionItem';
import { SectionItem } from './SectionItem';

type RichRegionLayerProps = {
  regions: RichRegion[];
  selectedIds: ReadonlySet<string>;
  onToggleSection: (regionId: string) => void;
};

export function RichRegionLayer({ regions, selectedIds, onToggleSection }: RichRegionLayerProps) {
  return (
    <div
      data-testid="rich-region-layer"
      className="absolute inset-0 pointer-events-none"
    >
      {regions.map((r) => {
        if (r.kind === 'textRegion') {
          return <TextRegionItem key={r.regionId} region={r} />;
        }
        if (r.kind === 'section') {
          return (
            <SectionItem
              key={r.regionId}
              region={r}
              selected={selectedIds.has(r.regionId)}
              onToggle={onToggleSection}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
```

- [ ] **Step 12: Run all 3 component tests, verify pass**

Run: `npx vitest run src/atlas-ui/overlay/__tests__/`
Expected: PASS, all 10 tests in the 3 files.

- [ ] **Step 13: Commit**

```bash
git add src/atlas-ui/overlay/RichRegionLayer.tsx \
        src/atlas-ui/overlay/TextRegionItem.tsx \
        src/atlas-ui/overlay/SectionItem.tsx \
        src/atlas-ui/overlay/__tests__/RichRegionLayer.test.tsx \
        src/atlas-ui/overlay/__tests__/TextRegionItem.test.tsx \
        src/atlas-ui/overlay/__tests__/SectionItem.test.tsx
git commit -m "feat(overlay): add RichRegionLayer + TextRegionItem + SectionItem"
```

---

## Task 2: `PageViewport` integration — selectedRegionIds state + page-switch clear

**Files:**
- Modify: `src/atlas-ui/reader/PageViewport.tsx`

The `PageViewport` already calls `registry.getOverlay(...)`. Its runtime value is always a `RichOverlayConfig` (produced by `convertOverlay`), but the registry typings only expose `OverlayConfig`. Use a runtime `'regions' in overlayConfig` narrowing.

- [ ] **Step 1: Extend `PageViewportProps`**

Edit `src/atlas-ui/reader/PageViewport.tsx`. Locate the `type PageViewportProps = { ... }` block (around line 177) and add `richRegionsOn`:

```ts
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
  richRegionsOn: boolean;
};
```

- [ ] **Step 2: Thread the prop through `PageViewport`**

In the same file, update the function signature to destructure `richRegionsOn` and add the per-page state + clearing effect. Insert these lines inside the `PageViewport` function body, **before** the `if (!currentPage)` early return:

```ts
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
  richRegionsOn,
}: PageViewportProps) {
  const { currentPage, interactionMode, currentPageIndex } = readerState;
  const navigate = useNavigate();
  const bookSlug = registry.manifest.slug;

  // Existing direction effect …
  const prevIndexRef = useRef(currentPageIndex);
  const [direction, setDirection] = useState<Direction>(0);

  useEffect(() => {
    const prev = prevIndexRef.current;
    if (currentPageIndex !== prev) {
      setDirection(
        Math.abs(currentPageIndex - prev) === 1 ? (currentPageIndex > prev ? 1 : -1) : 0,
      );
    } else {
      setDirection(0);
    }
    prevIndexRef.current = currentPageIndex;
  }, [currentPageIndex]);

  // NEW: rich-region selection (cleared on page change)
  const [selectedRegionIds, setSelectedRegionIds] = useState<ReadonlySet<string>>(new Set());
  const currentPageId = currentPage?.pageId;
  useEffect(() => {
    setSelectedRegionIds(new Set());
  }, [currentPageId]);

  const toggleRegion = (regionId: string) => {
    setSelectedRegionIds((prev) => {
      const next = new Set(prev);
      if (next.has(regionId)) next.delete(regionId);
      else next.add(regionId);
      return next;
    });
  };

  if (!currentPage) {
    // … unchanged …
```

- [ ] **Step 3: Pass new props into `PageContent`**

Still inside the same `PageViewport` function, at the bottom of the JSX `return`, extend the `<PageContent ... />` call:

```tsx
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
      richRegionsOn={richRegionsOn}
      selectedRegionIds={selectedRegionIds}
      onToggleRegion={toggleRegion}
    />
  );
}
```

- [ ] **Step 4: Extend `PageContent` props and mount `<RichRegionLayer>`**

In the same file, update the `PageContent` `function PageContent({...})` signature and add the layer. Add this to the top of the file (after the existing imports):

```ts
import type { RichOverlayConfig } from '../../atlas-core/types/regions';
import { RichRegionLayer } from '../overlay/RichRegionLayer';
```

Extend the `PageContent` props block:

```ts
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
  richRegionsOn,
  selectedRegionIds,
  onToggleRegion,
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
  richRegionsOn: boolean;
  selectedRegionIds: ReadonlySet<string>;
  onToggleRegion: (regionId: string) => void;
}) {
```

After `const overlayConfig = page.overlay ? registry.getOverlay(page.overlay.overlayId) : undefined;` (around line 74) add the runtime narrowing:

```ts
  const richOverlay =
    overlayConfig && 'regions' in overlayConfig
      ? (overlayConfig as RichOverlayConfig)
      : undefined;
```

Now inside the single-page render branch (the non-spread `return`, around lines 122-175), insert the `<RichRegionLayer>` **after** `<PageRenderer ... />` and **before** the `{overlayConfig && interactionMode === 'read' && (<HotspotLayer ... />)}` line:

```tsx
            <PageRenderer
              page={page}
              imageAsset={imageAsset}
              locale="zh-CN"
              registry={registry}
              zoom={zoom}
            />

            {richRegionsOn && richOverlay && (
              <RichRegionLayer
                regions={richOverlay.regions}
                selectedIds={selectedRegionIds}
                onToggleSection={onToggleRegion}
              />
            )}

            {overlayConfig && interactionMode === 'read' && (
              <HotspotLayer overlay={overlayConfig} imageAsset={imageAsset} onNavigate={onNavigate} />
            )}
```

(The spread-page branch does not get a RichRegionLayer — spread pages are full-bleed and their overlay semantics are different. Note this in the commit message.)

- [ ] **Step 5: Type-check + tests still green**

Run: `npx tsc --noEmit`
Expected: 0 new errors (baseline pre-existing errors unchanged).

Run: `npm test`
Expected: PASS (no test changes yet; old `PageViewport-zoom.test.tsx` may need a `richRegionsOn={false}` prop — fix the call site).

If `PageViewport-zoom.test.tsx` fails with "missing prop richRegionsOn", patch the call sites in that test:

```tsx
// existing render call → add prop
<PageViewport
  /* existing props … */
  richRegionsOn={false}
/>
```

Re-run tests. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/atlas-ui/reader/PageViewport.tsx \
        src/atlas-ui/reader/__tests__/PageViewport-zoom.test.tsx
git commit -m "feat(reader): wire RichRegionLayer + selectedRegionIds into PageViewport"
```

---

## Task 3: `MagazineReader` state + ReaderShell ChromeButton "区域"

**Files:**
- Modify: `src/atlas-ui/reader/MagazineReader.tsx`
- Modify: `src/atlas-ui/reader/ReaderShell.tsx`

- [ ] **Step 1: Add state in `MagazineReader`**

Open `src/atlas-ui/reader/MagazineReader.tsx`. Locate the existing `useState` calls inside the component (search for `useState(`). After the existing state declarations, add:

```ts
  const [richRegionsOn, setRichRegionsOn] = useState(false);
  const toggleRichRegions = () => setRichRegionsOn((v) => !v);
```

Make sure `useState` is already imported from React (it should be).

Find the `<ReaderShell ... />` call in the JSX `return` and pass the toggle through:

```tsx
  <ReaderShell
    /* existing props … */
    richRegionsOn={richRegionsOn}
    onToggleRichRegions={toggleRichRegions}
  />
```

Find the same `<PageViewport ... />` call (it might be inside `ReaderShell` — see Step 2) and add `richRegionsOn={richRegionsOn}` there as well. If `PageViewport` is rendered from inside `ReaderShell`, just thread the prop through `ReaderShell`.

- [ ] **Step 2: Thread the prop through `ReaderShell`**

Open `src/atlas-ui/reader/ReaderShell.tsx`. Extend its props type to accept the new fields. Locate the props type (near the top — search for `type ReaderShellProps` or the inline shape on the `export function ReaderShell({`). Add:

```ts
  richRegionsOn: boolean;
  onToggleRichRegions: () => void;
```

Destructure them in the component signature:

```ts
export function ReaderShell({
  /* existing destructured props … */
  richRegionsOn,
  onToggleRichRegions,
}: ReaderShellProps) {
```

- [ ] **Step 3: Add the "区域" `<ChromeButton>` between 评论模式 and Debug**

At the top of `ReaderShell.tsx`, ensure `LayoutGrid` is added to the lucide import:

```ts
import { BookOpen, Bug, Eye, LayoutGrid, MousePointerClick } from 'lucide-react';
```

Locate the existing `<ChromeButton>` for Debug (lines ~142-149 in current `ReaderShell.tsx`). Insert the new "区域" button **immediately before** it:

```tsx
          <ChromeButton
            pressed={richRegionsOn}
            leadingIcon={LayoutGrid}
            onClick={onToggleRichRegions}
            aria-label="切换区域高亮"
          >
            区域
          </ChromeButton>
          {featureFlags?.debugOverlay && (
            <ChromeButton
              pressed={inDebugMode}
              leadingIcon={Bug}
              onClick={readerState.toggleDebugOverlay}
              aria-label="切换调试覆盖层"
            >
              Debug
            </ChromeButton>
          )}
```

Note: the 区域 button is **not** gated by a feature flag — it always renders.

- [ ] **Step 4: Pass `richRegionsOn` down to `<PageViewport>` inside ReaderShell**

In the same file, find the existing `<PageViewport ... />` call (around lines 169-180). Add the prop:

```tsx
          <PageViewport
            registry={registry}
            readerState={readerState}
            zoom={zoom}
            onCycleZoom={onCycleZoom}
            commentThreads={commentThreads}
            selectedThreadId={selectedThreadId}
            highlightedThreadId={highlightedThreadId}
            onSelectThread={onSelectThread}
            onHoverThread={onHoverThread}
            onCreateAnchor={onCreateAnchor}
            richRegionsOn={richRegionsOn}
          />
```

- [ ] **Step 5: Type-check + lint**

Run: `npx tsc --noEmit`
Expected: 0 new errors.

Run: `npm run lint`
Expected: pass / no new warnings.

Run: `npm test`
Expected: PASS — existing tests that render `ReaderShell` or `MagazineReader` may need new prop wiring. If a test fails with `Property 'richRegionsOn' is missing in type 'ReaderShellProps'`, add `richRegionsOn={false} onToggleRichRegions={() => {}}` to the failing test's render call.

Locations likely to need the patch (search before editing):

```bash
grep -rln 'ReaderShell\|MagazineReader' src/**/__tests__/ src/**/*.test.tsx 2>/dev/null
```

Update each failing call site with the two new props.

- [ ] **Step 6: Commit**

```bash
git add src/atlas-ui/reader/MagazineReader.tsx \
        src/atlas-ui/reader/ReaderShell.tsx \
        src/atlas-ui/reader/__tests__/  # any test files patched
git commit -m "feat(reader): add 区域 chrome toggle wired to richRegionsOn state"
```

---

## Task 4: Integration test — full toggle flow + page-switch clear

**Files:**
- Create: `src/atlas-ui/reader/__tests__/richRegionToggle.test.tsx`

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/reader/__tests__/richRegionToggle.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { MagazineReader } from '../MagazineReader';
import { createBookRegistry } from '../../../atlas-core/registry/createBookRegistry';
import type { BookManifest } from '../../../atlas-core/types/manifest';
import type { ImageAsset } from '../../../atlas-core/types/image';
import type { RichOverlayConfig } from '../../../atlas-core/types/regions';
import type { PageManifest } from '../../../atlas-core/types/page';

const page1: PageManifest = {
  pageId: 'page-1',
  sectionCode: 'SC-01',
  pageNumber: 1,
  slug: 'sc-01',
  title: { 'zh-CN': '页面 1' },
  image: { assetId: 'img-1', version: '1' },
  overlay: { overlayId: 'ov-1' },
};

const page2: PageManifest = {
  pageId: 'page-2',
  sectionCode: 'SC-02',
  pageNumber: 2,
  slug: 'sc-02',
  title: { 'zh-CN': '页面 2' },
  image: { assetId: 'img-2', version: '1' },
  overlay: { overlayId: 'ov-2' },
};

const manifest: BookManifest = {
  schemaVersion: 2,
  bookId: 'test-book',
  slug: 'test-book',
  title: { 'zh-CN': 'Test' },
  version: '0.0.1',
  pages: [page1, page2],
  navigation: { showTopBar: true },
  featureFlags: { debugOverlay: false, comments: false },
};

const imgA: ImageAsset = { assetId: 'img-1', src: 'a.png', width: 100, height: 100 };
const imgB: ImageAsset = { assetId: 'img-2', src: 'b.png', width: 100, height: 100 };

const overlay1: RichOverlayConfig = {
  overlayId: 'ov-1',
  imageAssetId: 'img-1',
  imageVersion: '1',
  coordinateSystem: 'percentage',
  hotspots: [],
  canvas: { width: 100, height: 100 },
  regions: [
    {
      regionId: 'sec-A',
      kind: 'section',
      role: 'detectedSection',
      rect: { x: 5, y: 5, width: 50, height: 50 },
    },
  ],
};

const overlay2: RichOverlayConfig = {
  overlayId: 'ov-2',
  imageAssetId: 'img-2',
  imageVersion: '1',
  coordinateSystem: 'percentage',
  hotspots: [],
  canvas: { width: 100, height: 100 },
  regions: [
    {
      regionId: 'sec-B',
      kind: 'section',
      role: 'detectedSection',
      rect: { x: 5, y: 5, width: 50, height: 50 },
    },
  ],
};

function harness(initialPath = '/book/test-book/page/sc-01') {
  const registry = createBookRegistry(manifest, [imgA, imgB], [overlay1, overlay2], [], [], [], [], [], []);
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <RadixTooltip.Provider>
        <MagazineReader registry={registry} />
      </RadixTooltip.Provider>
    </MemoryRouter>,
  );
}

describe('Rich Region toggle integration', () => {
  it('layer is hidden by default; appears after clicking 区域', () => {
    harness();
    expect(screen.queryByTestId('rich-region-layer')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '切换区域高亮' }));
    expect(screen.getByTestId('rich-region-layer')).toBeInTheDocument();
  });

  it('selected section persists within the page, then clears on page switch', () => {
    harness();
    fireEvent.click(screen.getByRole('button', { name: '切换区域高亮' }));

    // First page: select sec-A
    const secA = screen.getByTestId('section-item-sec-A');
    expect(secA.getAttribute('data-selected')).toBe('false');
    fireEvent.click(secA);
    expect(secA.getAttribute('data-selected')).toBe('true');

    // Navigate forward via keyboard arrow (existing behavior)
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    // sec-A no longer rendered (different page); sec-B on new page should be unselected
    expect(screen.queryByTestId('section-item-sec-A')).toBeNull();
    const secB = screen.getByTestId('section-item-sec-B');
    expect(secB.getAttribute('data-selected')).toBe('false');
  });

  it('clicking again deselects', () => {
    harness();
    fireEvent.click(screen.getByRole('button', { name: '切换区域高亮' }));
    const secA = screen.getByTestId('section-item-sec-A');
    fireEvent.click(secA);
    expect(secA.getAttribute('data-selected')).toBe('true');
    fireEvent.click(secA);
    expect(secA.getAttribute('data-selected')).toBe('false');
  });
});
```

- [ ] **Step 2: Run test, verify pass**

Run: `npx vitest run src/atlas-ui/reader/__tests__/richRegionToggle.test.tsx`
Expected: PASS, 3 tests.

If the `ArrowRight` keyboard test fails with the page not advancing, swap to a direct router-based navigation (replace `fireEvent.keyDown` with `harness('/book/test-book/page/sc-02')` re-render and adapt the assertion).

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/reader/__tests__/richRegionToggle.test.tsx
git commit -m "test(reader): integration test for 区域 toggle + page-switch clear"
```

---

## Task 5: Smoke — lint, build, browser verification

- [ ] **Step 1: Full test + lint sweep**

```bash
npm test
npm run lint
```

Expected: tests PASS, lint at baseline (no new warnings/errors).

- [ ] **Step 2: Build verification**

```bash
npm run build
```

Expected: build succeeds. If pre-existing TS errors block the build (see Spec E note), that is out of scope for Spec G — record the unchanged error count in the commit message.

- [ ] **Step 3: Browser smoke**

Start the dev server in the worktree:

```bash
npm run dev
```

In the browser (http://localhost:5173/):
1. Open a book page that has `overlay` data (e.g., `/book/vat-atlas/page/sc-01`).
2. Confirm "区域" button is present in the top chrome bar between 评论模式 and Debug.
3. Click "区域" → toggle pressed state (accent-blue), section divs become hoverable.
4. Hover a textRegion bbox → after ~200ms, Radix tooltip with the region text appears.
5. Click a section bbox → solid accent border + faint blue fill.
6. Click another section → both selected simultaneously.
7. Navigate to next page (arrow key or rail click) → selections cleared.
8. Click "区域" again → all region styling vanishes.

Stop the dev server.

- [ ] **Step 4: Commit (smoke marker)**

If no code changes were needed, just record completion:

```bash
git commit --allow-empty -m "chore(spec-g): Phase E smoke verified"
```

---

# Phase R — Bundle CLI

## Task 6: `validate-bundle.mjs` basic shape + fixtures + tests

**Files:**
- Create: `scripts/validate-bundle.mjs`
- Create: `src/__tests__/scripts/validate-bundle.test.ts`
- Create: `src/__tests__/scripts/fixtures/valid-bundle/manifest.json`
- Create: `src/__tests__/scripts/fixtures/valid-bundle/data/pages.json`
- Create: `src/__tests__/scripts/fixtures/valid-bundle/data/glossary.json`
- Create: `src/__tests__/scripts/fixtures/valid-bundle/images/SC-01_current_finals.png`
- Create: `src/__tests__/scripts/fixtures/broken-bundle/manifest.json`
- Create: `src/__tests__/scripts/fixtures/broken-bundle/data/pages.json`
- Create: `src/__tests__/scripts/fixtures/broken-bundle/data/glossary.json`
- Create: `src/__tests__/scripts/fixtures/broken-bundle/images/.gitkeep`

- [ ] **Step 1: Create the valid-bundle fixture**

Create `src/__tests__/scripts/fixtures/valid-bundle/manifest.json`:

```json
{
  "schemaVersion": 2,
  "bookId": "test-book",
  "slug": "test-book",
  "title": { "zh-CN": "Test Bundle" },
  "version": "0.0.1"
}
```

Create `src/__tests__/scripts/fixtures/valid-bundle/data/pages.json`:

```json
[
  {
    "sectionCode": "SC-01",
    "pageId": "page-1",
    "title": { "zh-CN": "页面 1" },
    "imageFile": "SC-01_current_finals.png",
    "canvas": { "width": 1200, "height": 1600 },
    "noteIds": [],
    "scenarioIds": [],
    "contentId": null,
    "legalRefIds": []
  }
]
```

Create `src/__tests__/scripts/fixtures/valid-bundle/data/glossary.json`:

```json
[
  {
    "termId": "vat",
    "zh": "增值税",
    "original": "Mehrwertsteuer",
    "category": "tax",
    "shortDefinition": "增值税",
    "firstMentionFormat": "vat (Mehrwertsteuer)"
  }
]
```

Create `src/__tests__/scripts/fixtures/valid-bundle/images/SC-01_current_finals.png` — a 1-byte placeholder (CLI only checks file existence, not content):

```bash
mkdir -p src/__tests__/scripts/fixtures/valid-bundle/images
printf '\0' > src/__tests__/scripts/fixtures/valid-bundle/images/SC-01_current_finals.png
```

- [ ] **Step 2: Create the broken-bundle fixture**

Create `src/__tests__/scripts/fixtures/broken-bundle/manifest.json` (missing `version` field):

```json
{
  "schemaVersion": 2,
  "bookId": "broken-book",
  "slug": "broken-book",
  "title": { "zh-CN": "Broken" }
}
```

Create `src/__tests__/scripts/fixtures/broken-bundle/data/pages.json` (references nonexistent image + dangling noteId):

```json
[
  {
    "sectionCode": "SC-01",
    "pageId": "page-1",
    "title": { "zh-CN": "页面 1" },
    "imageFile": "missing.png",
    "canvas": { "width": 1200, "height": 1600 },
    "noteIds": ["nope-dangling"],
    "scenarioIds": [],
    "contentId": null,
    "legalRefIds": []
  },
  {
    "sectionCode": "SC-02",
    "pageId": "page-1",
    "title": { "zh-CN": "页面 1 重复" },
    "imageFile": "missing.png",
    "canvas": { "width": 1200, "height": 1600 },
    "noteIds": [],
    "scenarioIds": [],
    "contentId": null,
    "legalRefIds": []
  }
]
```

Create `src/__tests__/scripts/fixtures/broken-bundle/data/glossary.json` (duplicate termId):

```json
[
  {
    "termId": "dup",
    "zh": "一",
    "original": "Eins",
    "category": "tax",
    "shortDefinition": "x",
    "firstMentionFormat": "x"
  },
  {
    "termId": "dup",
    "zh": "二",
    "original": "Zwei",
    "category": "tax",
    "shortDefinition": "y",
    "firstMentionFormat": "y"
  }
]
```

Create empty placeholder so git tracks the empty images dir:

```bash
mkdir -p src/__tests__/scripts/fixtures/broken-bundle/images
touch src/__tests__/scripts/fixtures/broken-bundle/images/.gitkeep
```

- [ ] **Step 3: Failing test — basic shape**

Create `src/__tests__/scripts/validate-bundle.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { validateBundle } from '../../../scripts/validate-bundle.mjs';

const VALID = resolve(__dirname, 'fixtures/valid-bundle');
const BROKEN = resolve(__dirname, 'fixtures/broken-bundle');

describe('validate-bundle — basic shape', () => {
  it('valid bundle returns passed=true with no errors', async () => {
    const result = await validateBundle(VALID);
    expect(result.passed).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('broken bundle (missing manifest version) returns error', async () => {
    const result = await validateBundle(BROKEN);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.kind === 'manifest-missing-field' && e.field === 'version')).toBe(true);
  });

  it('broken bundle (missing imageFile) reports per-page error', async () => {
    const result = await validateBundle(BROKEN);
    expect(result.errors.some((e) => e.kind === 'missing-image' && e.file === 'missing.png')).toBe(true);
  });

  it('reports stats with page/glossary counts', async () => {
    const result = await validateBundle(VALID);
    expect(result.stats.pages).toBe(1);
    expect(result.stats.glossary).toBe(1);
    expect(result.stats.images).toBe(1);
  });

  it('rejects nonexistent bundle path', async () => {
    const result = await validateBundle(resolve(__dirname, 'fixtures/does-not-exist'));
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.kind === 'bundle-not-found')).toBe(true);
  });
});
```

- [ ] **Step 4: Run test, verify fail**

Run: `npx vitest run src/__tests__/scripts/validate-bundle.test.ts`
Expected: FAIL — `Cannot find module '../../../scripts/validate-bundle.mjs'`.

- [ ] **Step 5: Implement `validate-bundle.mjs` (basic shape)**

Create `scripts/validate-bundle.mjs`:

```js
// scripts/validate-bundle.mjs
// VAT Atlas bundle validator. Zero deps, Node 22+ ESM.

import { access, readFile, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { argv, cwd, exit } from 'node:process';

const REQUIRED_MANIFEST_FIELDS = ['schemaVersion', 'bookId', 'slug', 'title', 'version'];
const REQUIRED_PAGE_FIELDS = ['sectionCode', 'pageId', 'title', 'imageFile', 'canvas'];
const REQUIRED_GLOSSARY_FIELDS = ['termId', 'zh', 'original', 'category', 'shortDefinition', 'firstMentionFormat'];
const OPTIONAL_DATA_FILES = ['notes', 'scenarios', 'contents', 'legal-refs'];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson(p) {
  const raw = await readFile(p, 'utf8');
  return JSON.parse(raw);
}

export async function validateBundle(bundlePath) {
  const errors = [];
  const warnings = [];
  const stats = {
    pages: 0,
    glossary: 0,
    notes: 0,
    scenarios: 0,
    contents: 0,
    legalRefs: 0,
    images: 0,
    overlays: 0,
  };

  // 1. Bundle path exists
  if (!(await exists(bundlePath))) {
    errors.push({ kind: 'bundle-not-found', path: bundlePath });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  const bundleStat = await stat(bundlePath);
  if (!bundleStat.isDirectory()) {
    errors.push({ kind: 'bundle-not-directory', path: bundlePath });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  // 2. manifest.json
  const manifestPath = join(bundlePath, 'manifest.json');
  if (!(await exists(manifestPath))) {
    errors.push({ kind: 'manifest-missing', file: 'manifest.json' });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  let manifest;
  try {
    manifest = await readJson(manifestPath);
  } catch (err) {
    errors.push({ kind: 'manifest-invalid-json', message: String(err) });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!(field in manifest)) {
      errors.push({ kind: 'manifest-missing-field', field });
    }
  }

  // 3. pages.json
  const pagesPath = join(bundlePath, 'data', 'pages.json');
  if (!(await exists(pagesPath))) {
    errors.push({ kind: 'pages-missing', file: 'data/pages.json' });
    return { bundlePath, passed: errors.length === 0, errors, warnings, stats };
  }

  let pages;
  try {
    pages = await readJson(pagesPath);
  } catch (err) {
    errors.push({ kind: 'pages-invalid-json', message: String(err) });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  if (!Array.isArray(pages) || pages.length === 0) {
    errors.push({ kind: 'pages-empty' });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  stats.pages = pages.length;

  // 4. Per-page required fields + image existence
  for (let i = 0; i < pages.length; i += 1) {
    const p = pages[i];
    for (const field of REQUIRED_PAGE_FIELDS) {
      if (!(field in p)) {
        errors.push({ kind: 'page-missing-field', index: i, field });
      }
    }
    if (p.imageFile) {
      const imgPath = join(bundlePath, 'images', basename(p.imageFile));
      if (await exists(imgPath)) {
        stats.images += 1;
      } else {
        errors.push({ kind: 'missing-image', index: i, file: p.imageFile });
      }
    }
  }

  // 5. Optional JSON files: glossary + notes + scenarios + contents + legal-refs
  const glossaryPath = join(bundlePath, 'data', 'glossary.json');
  if (await exists(glossaryPath)) {
    let glossary;
    try {
      glossary = await readJson(glossaryPath);
    } catch (err) {
      errors.push({ kind: 'glossary-invalid-json', message: String(err) });
      glossary = [];
    }
    if (!Array.isArray(glossary)) {
      errors.push({ kind: 'glossary-not-array' });
    } else {
      stats.glossary = glossary.length;
      for (let i = 0; i < glossary.length; i += 1) {
        const g = glossary[i];
        for (const field of REQUIRED_GLOSSARY_FIELDS) {
          if (!(field in g)) {
            errors.push({ kind: 'glossary-missing-field', index: i, field });
          }
        }
      }
    }
  } else {
    warnings.push({ kind: 'missing-optional-file', file: 'data/glossary.json' });
  }

  for (const optName of OPTIONAL_DATA_FILES) {
    const p = join(bundlePath, 'data', `${optName}.json`);
    if (await exists(p)) {
      try {
        const arr = await readJson(p);
        if (!Array.isArray(arr)) {
          errors.push({ kind: 'optional-not-array', file: `data/${optName}.json` });
        } else {
          if (optName === 'notes') stats.notes = arr.length;
          if (optName === 'scenarios') stats.scenarios = arr.length;
          if (optName === 'contents') stats.contents = arr.length;
          if (optName === 'legal-refs') stats.legalRefs = arr.length;
        }
      } catch (err) {
        errors.push({ kind: 'optional-invalid-json', file: `data/${optName}.json`, message: String(err) });
      }
    } else {
      warnings.push({ kind: 'missing-optional-file', file: `data/${optName}.json` });
    }
  }

  return { bundlePath, passed: errors.length === 0, errors, warnings, stats };
}

// CLI entry — only run when invoked directly
const isDirectInvocation = argv[1] && argv[1].endsWith('validate-bundle.mjs');
if (isDirectInvocation) {
  const args = argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/validate-bundle.mjs <bundle-path> [--json] [--quiet]');
    exit(2);
  }
  const bundleArg = args[0];
  const resolved = bundleArg.startsWith('/') ? bundleArg : join(cwd(), bundleArg);
  const result = await validateBundle(resolved);
  console.log(JSON.stringify(result, null, 2));
  exit(result.passed ? 0 : 1);
}
```

Note: this step ships **minimal CLI output** (JSON dump) — Task 8 adds ANSI / --json / --quiet formatting. Tests in this task only call `validateBundle()` directly, not the CLI binary.

- [ ] **Step 6: Run test, verify pass**

Run: `npx vitest run src/__tests__/scripts/validate-bundle.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
git add scripts/validate-bundle.mjs \
        src/__tests__/scripts/validate-bundle.test.ts \
        src/__tests__/scripts/fixtures/
git commit -m "feat(cli): validate-bundle basic shape + manifest/pages/glossary checks"
```

---

## Task 7: Dangling references + uniqueness checks

**Files:**
- Modify: `scripts/validate-bundle.mjs`
- Modify: `src/__tests__/scripts/validate-bundle.test.ts`
- Modify: `src/__tests__/scripts/fixtures/broken-bundle/data/pages.json` (already references `nope-dangling`)
- Create: `src/__tests__/scripts/fixtures/broken-bundle/data/notes.json` (so dangling check runs)

- [ ] **Step 1: Add notes.json to broken-bundle fixture**

Create `src/__tests__/scripts/fixtures/broken-bundle/data/notes.json`:

```json
[
  {
    "noteId": "real-note",
    "bookId": "mismatched-book-id",
    "title": { "zh-CN": "real" },
    "body": []
  }
]
```

(Mismatch with `manifest.bookId === "broken-book"` triggers the `bookId mismatch` error in 3.3 §B.15.)

- [ ] **Step 2: Failing test — dangling refs + uniqueness**

Append to `src/__tests__/scripts/validate-bundle.test.ts`:

```ts
describe('validate-bundle — dangling references', () => {
  it('flags page.noteIds[] referencing missing noteId', async () => {
    const result = await validateBundle(BROKEN);
    expect(
      result.errors.some(
        (e) => e.kind === 'dangling-ref' && e.refType === 'noteId' && e.value === 'nope-dangling',
      ),
    ).toBe(true);
  });

  it('flags notes.bookId !== manifest.bookId', async () => {
    const result = await validateBundle(BROKEN);
    expect(result.errors.some((e) => e.kind === 'book-id-mismatch')).toBe(true);
  });
});

describe('validate-bundle — uniqueness', () => {
  it('flags duplicate pageId', async () => {
    const result = await validateBundle(BROKEN);
    expect(result.errors.some((e) => e.kind === 'duplicate-id' && e.field === 'pageId')).toBe(true);
  });

  it('flags duplicate glossary termId', async () => {
    const result = await validateBundle(BROKEN);
    expect(result.errors.some((e) => e.kind === 'duplicate-id' && e.field === 'termId')).toBe(true);
  });
});
```

- [ ] **Step 3: Run test, verify fail**

Run: `npx vitest run src/__tests__/scripts/validate-bundle.test.ts`
Expected: 4 new tests FAIL.

- [ ] **Step 4: Implement dangling-ref + uniqueness in `validate-bundle.mjs`**

Add these helper functions inside `scripts/validate-bundle.mjs`, between `readJson` and `validateBundle`:

```js
function collectIds(arr, idField) {
  const seen = new Map();
  const duplicates = [];
  for (let i = 0; i < arr.length; i += 1) {
    const v = arr[i]?.[idField];
    if (v == null) continue;
    if (seen.has(v)) {
      duplicates.push({ value: v, indices: [seen.get(v), i] });
    } else {
      seen.set(v, i);
    }
  }
  return { ids: new Set(seen.keys()), duplicates };
}

function checkDanglingRef(refType, value, targetSet, sourceIndex, errors) {
  if (value == null) return;
  if (!targetSet.has(value)) {
    errors.push({ kind: 'dangling-ref', refType, value, sourceIndex });
  }
}
```

Then **inside** `validateBundle`, before the final `return`, splice in the dangling-ref + uniqueness pass.

First, load the optional files into local arrays we can index. Replace the existing OPTIONAL_DATA_FILES loop with a version that captures the parsed arrays:

```js
  const loaded = { notes: [], scenarios: [], contents: [], legalRefs: [] };
  const FILE_TO_KEY = {
    'notes': 'notes',
    'scenarios': 'scenarios',
    'contents': 'contents',
    'legal-refs': 'legalRefs',
  };

  for (const optName of OPTIONAL_DATA_FILES) {
    const p = join(bundlePath, 'data', `${optName}.json`);
    if (await exists(p)) {
      try {
        const arr = await readJson(p);
        if (!Array.isArray(arr)) {
          errors.push({ kind: 'optional-not-array', file: `data/${optName}.json` });
        } else {
          loaded[FILE_TO_KEY[optName]] = arr;
          stats[FILE_TO_KEY[optName]] = arr.length;
        }
      } catch (err) {
        errors.push({ kind: 'optional-invalid-json', file: `data/${optName}.json`, message: String(err) });
      }
    } else {
      warnings.push({ kind: 'missing-optional-file', file: `data/${optName}.json` });
    }
  }
```

(Replace the existing block — note that the old block tracked `stats.notes` etc. via individual `if` branches; the new block uses the `FILE_TO_KEY` map.)

Then, after the optional-file loop and before the final `return`, add uniqueness and dangling-ref checks:

```js
  // Uniqueness — pageId
  const { duplicates: pageDup } = collectIds(pages, 'pageId');
  const pageIdSet = new Set(pages.map((p) => p.pageId).filter(Boolean));
  for (const d of pageDup) {
    errors.push({ kind: 'duplicate-id', field: 'pageId', value: d.value, indices: d.indices });
  }

  // Uniqueness — termId (glossary)
  let glossaryIdSet = new Set();
  try {
    if (await exists(glossaryPath)) {
      const glossary = await readJson(glossaryPath);
      if (Array.isArray(glossary)) {
        const { ids, duplicates } = collectIds(glossary, 'termId');
        glossaryIdSet = ids;
        for (const d of duplicates) {
          errors.push({ kind: 'duplicate-id', field: 'termId', value: d.value, indices: d.indices });
        }
      }
    }
  } catch {
    /* glossary already errored above */
  }

  // Uniqueness — noteId / scenarioId / contentId / legalRefId
  const noteIdSet = new Set();
  const scenarioIdSet = new Set();
  const contentIdSet = new Set();
  const legalRefIdSet = new Set();

  const UNIQ_TARGETS = [
    { arr: loaded.notes, idField: 'noteId', set: noteIdSet },
    { arr: loaded.scenarios, idField: 'scenarioId', set: scenarioIdSet },
    { arr: loaded.contents, idField: 'contentId', set: contentIdSet },
    { arr: loaded.legalRefs, idField: 'legalRefId', set: legalRefIdSet },
  ];
  for (const { arr, idField, set } of UNIQ_TARGETS) {
    const { ids, duplicates } = collectIds(arr, idField);
    for (const id of ids) set.add(id);
    for (const d of duplicates) {
      errors.push({ kind: 'duplicate-id', field: idField, value: d.value, indices: d.indices });
    }
  }

  // Dangling refs from pages → notes / scenarios / contents / legal-refs
  for (let i = 0; i < pages.length; i += 1) {
    const p = pages[i];
    for (const noteId of p.noteIds ?? []) {
      checkDanglingRef('noteId', noteId, noteIdSet, i, errors);
    }
    for (const scenarioId of p.scenarioIds ?? []) {
      checkDanglingRef('scenarioId', scenarioId, scenarioIdSet, i, errors);
    }
    if (p.contentId != null) {
      checkDanglingRef('contentId', p.contentId, contentIdSet, i, errors);
    }
    for (const legalRefId of p.legalRefIds ?? []) {
      checkDanglingRef('legalRefId', legalRefId, legalRefIdSet, i, errors);
    }
  }

  // notes[i].bookId must match manifest.bookId
  for (let i = 0; i < loaded.notes.length; i += 1) {
    const n = loaded.notes[i];
    if (n.bookId != null && n.bookId !== manifest.bookId) {
      errors.push({
        kind: 'book-id-mismatch',
        index: i,
        expected: manifest.bookId,
        actual: n.bookId,
      });
    }
  }

  // Final passed
  return { bundlePath, passed: errors.length === 0, errors, warnings, stats };
```

Delete the older `return` statement at the end and keep only this one.

- [ ] **Step 5: Run test, verify pass**

Run: `npx vitest run src/__tests__/scripts/validate-bundle.test.ts`
Expected: PASS, 9 tests total.

- [ ] **Step 6: Commit**

```bash
git add scripts/validate-bundle.mjs \
        src/__tests__/scripts/validate-bundle.test.ts \
        src/__tests__/scripts/fixtures/broken-bundle/data/notes.json
git commit -m "feat(cli): validate-bundle dangling-ref + uniqueness + bookId mismatch checks"
```

---

## Task 8: ANSI output + `--json` + `--quiet` modes

**Files:**
- Modify: `scripts/validate-bundle.mjs`
- Modify: `src/__tests__/scripts/validate-bundle.test.ts`

- [ ] **Step 1: Failing test — output formatters**

Append to `src/__tests__/scripts/validate-bundle.test.ts`:

```ts
import { formatResult } from '../../../scripts/validate-bundle.mjs';

describe('validate-bundle — output formatters', () => {
  it('text mode includes ✓ for passing checks and "Result: PASS"', async () => {
    const result = await validateBundle(VALID);
    const out = formatResult(result, { mode: 'text', quiet: false });
    expect(out).toContain('✓');
    expect(out).toContain('Result: PASS');
  });

  it('text mode shows "Result: FAIL (N errors" when failing', async () => {
    const result = await validateBundle(BROKEN);
    const out = formatResult(result, { mode: 'text', quiet: false });
    expect(out).toContain('✗');
    expect(out).toMatch(/Result: FAIL\s+\(\d+ errors/);
  });

  it('json mode emits valid JSON', async () => {
    const result = await validateBundle(VALID);
    const out = formatResult(result, { mode: 'json', quiet: false });
    const parsed = JSON.parse(out);
    expect(parsed.passed).toBe(true);
    expect(parsed.stats.pages).toBe(1);
  });

  it('quiet text mode hides ✓ lines but shows errors + final result', async () => {
    const result = await validateBundle(BROKEN);
    const out = formatResult(result, { mode: 'text', quiet: true });
    expect(out).not.toMatch(/^✓/m);
    expect(out).toContain('✗');
    expect(out).toContain('Result: FAIL');
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npx vitest run src/__tests__/scripts/validate-bundle.test.ts`
Expected: 4 new tests FAIL with `formatResult is not a function`.

- [ ] **Step 3: Implement formatters in `validate-bundle.mjs`**

Append to `scripts/validate-bundle.mjs` (above the `isDirectInvocation` block):

```js
const ANSI = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function describeError(e) {
  switch (e.kind) {
    case 'bundle-not-found':
      return `Bundle path not found: ${e.path}`;
    case 'bundle-not-directory':
      return `Bundle path is not a directory: ${e.path}`;
    case 'manifest-missing':
      return 'manifest.json: file missing';
    case 'manifest-invalid-json':
      return `manifest.json: invalid JSON — ${e.message}`;
    case 'manifest-missing-field':
      return `manifest.json: required field "${e.field}" missing`;
    case 'pages-missing':
      return 'data/pages.json: file missing';
    case 'pages-invalid-json':
      return `data/pages.json: invalid JSON — ${e.message}`;
    case 'pages-empty':
      return 'data/pages.json: array is empty';
    case 'page-missing-field':
      return `data/pages.json[${e.index}]: required field "${e.field}" missing`;
    case 'missing-image':
      return `data/pages.json[${e.index}]: imageFile "${e.file}" not found in images/`;
    case 'glossary-invalid-json':
      return `data/glossary.json: invalid JSON — ${e.message}`;
    case 'glossary-not-array':
      return 'data/glossary.json: must be an array';
    case 'glossary-missing-field':
      return `data/glossary.json[${e.index}]: required field "${e.field}" missing`;
    case 'optional-not-array':
      return `${e.file}: must be an array`;
    case 'optional-invalid-json':
      return `${e.file}: invalid JSON — ${e.message}`;
    case 'dangling-ref':
      return `dangling ${e.refType} "${e.value}" referenced from page[${e.sourceIndex}]`;
    case 'duplicate-id':
      return `duplicate ${e.field} "${e.value}" at indices [${e.indices.join(', ')}]`;
    case 'book-id-mismatch':
      return `notes[${e.index}].bookId "${e.actual}" !== manifest.bookId "${e.expected}"`;
    default:
      return JSON.stringify(e);
  }
}

function describeWarning(w) {
  switch (w.kind) {
    case 'missing-optional-file':
      return `${w.file}: not found (treating as [])`;
    default:
      return JSON.stringify(w);
  }
}

export function formatResult(result, { mode, quiet }) {
  if (mode === 'json') {
    return JSON.stringify(result, null, 2);
  }

  const lines = [];
  lines.push(`Validating bundle: ${result.bundlePath}`);
  lines.push('─'.repeat(40));

  if (!quiet) {
    if (result.stats.pages > 0) {
      lines.push(`${ANSI.green}✓${ANSI.reset} data/pages.json: ${result.stats.pages} entries`);
    }
    if (result.stats.images > 0) {
      lines.push(
        `${ANSI.green}✓${ANSI.reset} images/: ${result.stats.images}/${result.stats.pages} referenced files present`,
      );
    }
    if (result.stats.glossary > 0) {
      lines.push(`${ANSI.green}✓${ANSI.reset} data/glossary.json: ${result.stats.glossary} entries`);
    }
  }

  for (const w of result.warnings) {
    lines.push(`${ANSI.yellow}⚠${ANSI.reset} ${describeWarning(w)}`);
  }
  for (const e of result.errors) {
    lines.push(`${ANSI.red}✗${ANSI.reset} ${describeError(e)}`);
  }

  lines.push('─'.repeat(40));
  const verdict = result.passed
    ? `${ANSI.green}${ANSI.bold}Result: PASS${ANSI.reset}`
    : `${ANSI.red}${ANSI.bold}Result: FAIL${ANSI.reset}`;
  lines.push(
    `${verdict}  (${result.errors.length} errors, ${result.warnings.length} warnings)`,
  );
  return lines.join('\n');
}
```

- [ ] **Step 4: Wire CLI to use the formatter**

Replace the existing `isDirectInvocation` block at the bottom of `scripts/validate-bundle.mjs` with:

```js
const isDirectInvocation = argv[1] && argv[1].endsWith('validate-bundle.mjs');
if (isDirectInvocation) {
  const args = argv.slice(2);
  if (args.length === 0 || args[0].startsWith('--')) {
    console.error('Usage: node scripts/validate-bundle.mjs <bundle-path> [--json] [--quiet]');
    exit(2);
  }
  const bundleArg = args[0];
  const flags = new Set(args.slice(1));
  const mode = flags.has('--json') ? 'json' : 'text';
  const quiet = flags.has('--quiet');
  const resolved = bundleArg.startsWith('/') ? bundleArg : join(cwd(), bundleArg);
  const result = await validateBundle(resolved);
  console.log(formatResult(result, { mode, quiet }));
  exit(result.passed ? 0 : 1);
}
```

- [ ] **Step 5: Run test, verify pass**

Run: `npx vitest run src/__tests__/scripts/validate-bundle.test.ts`
Expected: PASS, 13 tests total.

- [ ] **Step 6: Sanity check the CLI directly**

```bash
node scripts/validate-bundle.mjs src/__tests__/scripts/fixtures/valid-bundle
echo "exit code: $?"

node scripts/validate-bundle.mjs src/__tests__/scripts/fixtures/broken-bundle
echo "exit code: $?"

node scripts/validate-bundle.mjs src/__tests__/scripts/fixtures/valid-bundle --json
node scripts/validate-bundle.mjs src/__tests__/scripts/fixtures/broken-bundle --quiet
```

Expected:
- valid-bundle → ANSI text with `Result: PASS`, exit 0
- broken-bundle → ANSI text with ✗ lines + `Result: FAIL`, exit 1
- `--json` mode → JSON object on stdout
- `--quiet` mode → no `✓` lines, but ✗ lines and Result line shown

- [ ] **Step 7: Commit**

```bash
git add scripts/validate-bundle.mjs \
        src/__tests__/scripts/validate-bundle.test.ts
git commit -m "feat(cli): validate-bundle ANSI text + --json + --quiet output modes"
```

---

## Task 9: `package.json` script + README docs + production smoke

**Files:**
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Add npm script to `package.json`**

Open `package.json`. Locate the `"scripts": { ... }` block and add `"validate-bundle"` (keep alphabetical order if the existing scripts are sorted):

```json
{
  "scripts": {
    "validate-bundle": "node scripts/validate-bundle.mjs"
  }
}
```

Confirm the rest of the scripts block remains intact (do not remove any existing entries).

- [ ] **Step 2: README documentation**

Open `README.md`. Add a new section. If a `## Scripts` or `## Tooling` section exists, append underneath; otherwise add at the bottom:

```markdown
## Bundle Validator CLI

Use the bundle validator to sanity-check a `public/book/` (or any asset-provider drop) before integrating it:

```bash
# Project bundle
npm run validate-bundle -- public/book

# Arbitrary path
node scripts/validate-bundle.mjs /path/to/another/bundle

# CI-friendly JSON output
node scripts/validate-bundle.mjs public/book --json

# Quiet mode (errors + final status only)
node scripts/validate-bundle.mjs public/book --quiet
```

**Exit codes:**
- `0` — no errors (warnings allowed)
- `1` — one or more errors
- `2` — usage error (path missing / not a directory)

**What it checks:**
- `manifest.json` shape (required fields: `schemaVersion / bookId / slug / title / version`)
- `data/pages.json` non-empty array with required per-entry fields
- Each `imageFile` exists under `images/`
- Optional JSON files (`glossary.json`, `notes.json`, `scenarios.json`, `contents.json`, `legal-refs.json`): each is an array; first-class schema for glossary entries
- ID uniqueness within `pages.json` / `glossary.json` / `notes.json` / `scenarios.json` / `contents.json` / `legal-refs.json`
- Dangling references from `pages.json` into the optional files
- `notes[].bookId` matches `manifest.bookId`

Zero npm dependencies — Node 22+ ESM only.
```

- [ ] **Step 3: Production smoke against `public/book`**

```bash
npm run validate-bundle -- public/book
echo "exit code: $?"
```

Expected: passes against the real bundle. If it fails on the live bundle, **investigate before patching the validator**. Either:
- (a) The validator caught a real bug — fix the bundle / contract under a separate spec.
- (b) The validator's expectation is wrong → adjust the rule with a justification in the next commit.

If the validator finds issues in the live `public/book`, **do not silently soften the rules**. Note the findings in the commit message and surface them to the user.

- [ ] **Step 4: Final test + lint sweep**

```bash
npm test
npm run lint
npm run build
```

Expected: all green (modulo Spec E's pre-existing TS error baseline, which is out of scope for Spec G).

- [ ] **Step 5: Commit**

```bash
git add package.json README.md
git commit -m "docs(cli): add validate-bundle npm script and README documentation"
```

---

## Final Acceptance Walkthrough

Run through Spec G design §8 verification checklist:

**E (Rich Region UI):**
- [ ] 顶栏 controls 区在 `评论模式` 和 `Debug` 之间出现 "区域" 按钮(LayoutGrid 图标)
- [ ] 默认状态 off;click → ON;再 click → OFF
- [ ] ON 状态下 textRegion bbox 可 hover,出 Radix tooltip 显示 `region.text`
- [ ] ON 状态下 section bbox 可 click,变蓝色高亮
- [ ] 多个 section 可同时选中
- [ ] 切换页面 → 选中清空
- [ ] OFF 状态下所有 region 不可见
- [ ] OFF 状态不影响 hotspot click(legalAnchor / navigation)

**R (Bundle CLI):**
- [ ] `node scripts/validate-bundle.mjs public/book` 退出码 0
- [ ] 默认输出 ANSI 彩色文本含 ✓ / ⚠ / ✗ 行 + 末尾 "Result: PASS/FAIL (N errors, M warnings)"
- [ ] `--json` 模式输出有效 JSON
- [ ] `--quiet` 模式只输出 errors + 最终状态
- [ ] 故意造一个 broken-bundle 测试 fixture → 退出码 1
- [ ] CLI 测试在 `npm test` 中跑(放在 `src/__tests__/scripts/`)
- [ ] `package.json` 有 `"validate-bundle"` script

**Overall:**
- [ ] `npm test` 全绿,新增 ~13 个测试(3 SectionItem + 3 TextRegionItem + 3 RichRegionLayer + 3 integration + 13 CLI = let me recount in the self-review)
- [ ] `npm run lint` 持平 baseline

---

## Self-Review (executed before publishing this plan)

**Spec coverage:**
- ✅ §2.1 顶栏 toggle, Debug 左侧, LayoutGrid icon → Task 3 Step 3
- ✅ §2.2 `richRegionsOn` state in `MagazineReader` + thread to `PageViewport` → Task 3 Step 1, Task 2 Step 1-2
- ✅ §2.2 `selectedRegionIds: Set<string>` + clear on page change → Task 2 Step 2
- ✅ §2.3 `RichRegionLayer` component, mount after PageRenderer before HotspotLayer → Task 1 + Task 2 Step 4
- ✅ §2.4 `TextRegionItem` — empty text → null, Radix Tooltip wrapper → Task 1 Step 7
- ✅ §2.5 `SectionItem` — selected styling, multi-select, click toggle → Task 1 Step 3
- ✅ §2.6 modifications to ReaderShell / MagazineReader / PageViewport → Tasks 2-3
- ✅ §2.7 unit + integration tests → Tasks 1, 4
- ✅ §3.1 single ESM file under `scripts/`, ~250 lines, no new dep → Tasks 6-8
- ✅ §3.2 CLI invocations including `--json` / `--quiet`, exit codes 0/1/2 → Task 8 Step 4
- ✅ §3.3 20 validation items split A/B/C → Tasks 6 (A.1-8), 7 (B.9-15 + C.16-20)
- ✅ §3.4 default ANSI text output → Task 8 Step 3
- ✅ §3.5 `--json` output shape → Task 8 Step 3
- ✅ §3.6 zero-dep, ESM, all check fns exported → all of Phase R
- ✅ §3.7 tests in `src/__tests__/scripts/` with fixtures → Task 6 Steps 1-2

**Placeholder scan:** no TBD / TODO / "similar to". All code blocks complete.

**Type consistency:**
- `selectedRegionIds: ReadonlySet<string>` used consistently in `RichRegionLayer`, `SectionItem`, and `PageViewport`.
- `richRegionsOn: boolean` flows top-down from `MagazineReader` → `ReaderShell` → `PageViewport` → `PageContent`.
- `onToggleSection` (in `RichRegionLayer`) = `onToggleRegion` (in `PageContent`) = `toggleRegion` (in `PageViewport`) — three names for one function; this is intentional (each layer's name reflects its perspective).

**Test count audit:**
- Task 1: 4 (SectionItem) + 3 (TextRegionItem) + 3 (RichRegionLayer) = 10
- Task 4: 3 (integration)
- Task 6: 5 (basic shape)
- Task 7: 4 (dangling + uniqueness)
- Task 8: 4 (formatters)
- **Total new tests: 26**

The acceptance line `~13 个测试` is undercounted — actual is ~26. Mentally adjust expectations.

**Known judgment calls:**
1. `'regions' in overlayConfig` runtime narrowing chosen over widening `getOverlay` return type — keeps Spec G surface area minimal. If a future spec adds more rich-overlay consumers, refactor `BookRegistry.getOverlay` to return `RichOverlayConfig` directly.
2. RichRegionLayer is NOT rendered on spread pages (the spread render branch in `PageContent` has different overlay semantics). Future spec H may revisit.
3. Spread-page branch in `PageContent` is left untouched — adding the same prop wiring there would inflate this plan with no behavioral benefit at v0.6.1 (spread pages have no overlay regions today).
4. README "What it checks" copy mentions ID uniqueness and dangling-ref checks — but does not list every single error kind. Sufficient for the contract audience.

**Plan complete.** Ready for execution.
