# Spec F — Search & TOC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Cmd+K` global search modal indexing 6 content types, and replace the flat TocTab with section-folded, sticky-aware TOC.

**Architecture:** Search infrastructure lives in `src/atlas-core/search/` — pure functions that take `BookRegistry` and produce `IndexedItem[]` + `query → grouped results`. UI in `src/atlas-ui/search/` wraps the infra with a Radix `Dialog`-based modal and a chrome-bar trigger. TOC rewrite in `src/atlas-ui/rail/tabs/TocTab.tsx` introduces a `groupPages()` utility (sectionCode-prefix grouping) and a `useTocFolds()` hook for per-group expand/collapse persistence. Sticky current-section banner uses IntersectionObserver.

**Tech Stack:** React 19, TypeScript 5.8, Vite 8, Vitest 4 + RTL 16, Radix UI (new: `@radix-ui/react-dialog`).

**Spec source:** [`docs/superpowers/specs/2026-05-19-spec-f-search-and-toc-design.md`](../specs/2026-05-19-spec-f-search-and-toc-design.md)

---

## Prerequisite — Worktree

```bash
git -C /Users/qiouyang/Documents/Claude/Codes/flipping-book \
    worktree add /Users/qiouyang/Documents/Claude/Codes/flipping-book/.claude/worktrees/spec-f-search \
    -b claude/spec-f-search
cd /Users/qiouyang/Documents/Claude/Codes/flipping-book/.claude/worktrees/spec-f-search
npm install
```

All commands run inside this worktree.

---

## File Plan

**Create:**

```
src/atlas-core/search/
  flattenRichText.ts
  buildIndex.ts
  searchIndex.ts
  index.ts
  __tests__/
    flattenRichText.test.ts
    buildIndex.test.ts
    searchIndex.test.ts

src/atlas-ui/search/
  SearchModal.tsx
  SearchTrigger.tsx
  SearchResultRow.tsx
  __tests__/
    SearchModal.test.tsx
    SearchTrigger.test.tsx

src/atlas-core/reader/
  useTocFolds.ts
  __tests__/useTocFolds.test.ts

src/atlas-ui/rail/tabs/
  tocGrouping.ts                                     ← extracted utility, testable in isolation
  __tests__/tocGrouping.test.ts
```

**Modify:**

```
package.json                                         ← add @radix-ui/react-dialog
src/atlas-core/reader/useKeyboardNavigation.ts       ← add onOpenSearch action
src/atlas-ui/reader/MagazineReader.tsx               ← searchOpen state + mount SearchModal
src/atlas-ui/reader/ReaderShell.tsx                  ← insert SearchTrigger between brand and controls
src/atlas-ui/rail/tabs/TocTab.tsx                    ← full rewrite
src/atlas-ui/rail/tabs/__tests__/TocTab.test.tsx     ← update for grouped rendering
src/app/routes/GlossaryRoute.tsx                     ← hash scroll + highlight
```

---

## Conventions

- **Test runner:** `npm test` (Vitest, once). Single file: `npx vitest run <path>`.
- **Lint:** `npm run lint`. Must not regress beyond baseline 40.
- **Commits:** Conventional Commits.
- **TDD:** Every primitive starts with a failing test.

---

# Phase K — Global Search

## Task 1: `flattenRichText`

**Files:**
- Create: `src/atlas-core/search/flattenRichText.ts`
- Create: `src/atlas-core/search/__tests__/flattenRichText.test.ts`

- [ ] **Step 1: Failing test**

Create `src/atlas-core/search/__tests__/flattenRichText.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { flattenRichText } from '../flattenRichText';
import type { RichTextNode } from '../../types/content';

describe('flattenRichText', () => {
  it('returns empty string for empty array', () => {
    expect(flattenRichText([])).toBe('');
  });

  it('extracts plain text nodes', () => {
    const nodes: RichTextNode[] = [
      { type: 'text', value: 'Hello' },
      { type: 'text', value: 'World' },
    ];
    expect(flattenRichText(nodes)).toBe('Hello World');
  });

  it('recurses into strong and em children', () => {
    const nodes: RichTextNode[] = [
      { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
      { type: 'em', children: [{ type: 'text', value: 'italic' }] },
    ];
    expect(flattenRichText(nodes)).toBe('bold italic');
  });

  it('ignores term/legalRef/scenarioLink/pageLink (their targets are indexed separately)', () => {
    const nodes: RichTextNode[] = [
      { type: 'text', value: 'See ' },
      { type: 'term', termId: 'werklieferung' },
      { type: 'text', value: ' and ' },
      { type: 'legalRef', legalRefId: '§ 25b UStG' },
      { type: 'text', value: '.' },
    ];
    expect(flattenRichText(nodes)).toBe('See  and  .');
  });

  it('handles nested strong inside em', () => {
    const nodes: RichTextNode[] = [
      { type: 'em', children: [{ type: 'strong', children: [{ type: 'text', value: 'deep' }] }] },
    ];
    expect(flattenRichText(nodes)).toBe('deep');
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-core/search/__tests__/flattenRichText.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement**

Create `src/atlas-core/search/flattenRichText.ts`:

```ts
import type { RichTextNode } from '../types/content';

/**
 * Recursively collect plain text from a RichTextNode tree.
 * Reference nodes (term / legalRef / scenarioLink / pageLink) emit empty
 * string — their target entities are indexed separately.
 */
export function flattenRichText(nodes: RichTextNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.value;
      if (n.type === 'strong' || n.type === 'em') return flattenRichText(n.children);
      return '';
    })
    .join(' ');
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-core/search/__tests__/flattenRichText.test.ts` → 5 passed.
`npm test` → 327 + 5 = 332 passing (Spec E baseline assumed; if Spec E not merged, adjust).

- [ ] **Step 5: Commit**

```bash
git add src/atlas-core/search/flattenRichText.ts src/atlas-core/search/__tests__/flattenRichText.test.ts
git commit -m "feat(search): add flattenRichText helper"
```

---

## Task 2: `buildIndex`

**Files:**
- Create: `src/atlas-core/search/buildIndex.ts`
- Create: `src/atlas-core/search/__tests__/buildIndex.test.ts`

- [ ] **Step 1: Failing test**

Create `src/atlas-core/search/__tests__/buildIndex.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildIndex } from '../buildIndex';
import { createBookRegistry } from '../../registry';
import type { BookManifest } from '../../types/manifest';

function makeRegistry(overrides: Partial<{
  glossary: unknown[];
  legalRefs: unknown[];
  scenarios: unknown[];
  notes: unknown[];
  contents: unknown[];
}> = {}) {
  const manifest = {
    schemaVersion: '1.0',
    bookId: 'b-1', slug: 'b', version: '0.1',
    title: { 'zh-CN': 'Test' },
    defaultLocale: 'zh-CN', supportedLocales: ['zh-CN'],
    visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
    reader: { defaultMode: 'auto', allowModeSwitch: false, transition: 'fade',
      enableKeyboardNavigation: true, enableSwipeNavigation: true, enableProgressBar: true,
      enableTableOfContents: true, defaultZoom: 'fit-page',
      spreadBehavior: { desktopDefault: 'single', mobileDefault: 'single', spreadPageAdvance: 'by-page',
        keyboard: { arrowLeft: 'previous', arrowRight: 'next' },
        clickZones: { enabled: false, leftEdgePercent: 0, rightEdgePercent: 0 } } },
    pages: [
      { pageId: 'p-1', slug: '/page/p-1', type: 'imageOverlay', sectionCode: '01',
        title: { 'zh-CN': 'Framework' }, subtitle: { 'zh-CN': 'Five steps' },
        layout: { mode: 'single', format: 'custom', size: { preset: 'custom', width: 1086, height: 1448 }, background: 'image' } },
    ],
    readingOrder: ['p-1'],
    registries: { imageAssets: '', overlays: '', glossary: '' },
  } as unknown as BookManifest;

  return createBookRegistry(
    manifest, [], [],
    (overrides.glossary ?? []) as never,
    (overrides.legalRefs ?? []) as never,
    (overrides.scenarios ?? []) as never,
    (overrides.notes ?? []) as never,
    (overrides.contents ?? []) as never,
    [],
  );
}

describe('buildIndex', () => {
  it('always produces one page entry per manifest page', () => {
    const items = buildIndex(makeRegistry());
    const pages = items.filter((i) => i.category === 'page');
    expect(pages).toHaveLength(1);
    expect(pages[0].id).toBe('p-1');
    expect(pages[0].display.primary).toBe('Framework');
    expect(pages[0].display.secondary).toBe('Five steps');
    expect(pages[0].haystack).toContain('framework');
    expect(pages[0].haystack).toContain('five steps');
  });

  it('includes glossary terms when present', () => {
    const items = buildIndex(makeRegistry({
      glossary: [{
        termId: 'werklieferung', zh: '加工供货', original: 'Werklieferung',
        abbreviation: 'WL', category: 'goods',
        shortDefinition: '承包人提供主材并交付', firstMentionFormat: '加工供货 (Werklieferung)',
      }],
    }));
    const terms = items.filter((i) => i.category === 'glossary');
    expect(terms).toHaveLength(1);
    expect(terms[0].id).toBe('werklieferung');
    expect(terms[0].display.primary).toContain('加工供货');
    expect(terms[0].haystack).toMatch(/werklieferung/);
    expect(terms[0].haystack).toMatch(/承包人/);
    expect(terms[0].haystack).toMatch(/wl/); // abbreviation
  });

  it('includes legalRefs / scenarios / notes / contents when present', () => {
    const items = buildIndex(makeRegistry({
      legalRefs: [{ legalRefId: '§ 25b', jurisdiction: 'DE', source: 'UStG', ref: '§ 25b',
        title: { 'zh-CN': '三角贸易' }, summary: { 'zh-CN': '简化制度' } }],
      scenarios: [{ scenarioId: 'sc-1', category: 'triangulation',
        title: { 'zh-CN': '三角贸易' }, oneSentence: { 'zh-CN': '中间商免征' } }],
      notes: [{ noteId: 'n-1', bookId: 'b-1', pageId: 'p-1', noteType: 'supplement', visibility: 'reader',
        title: { 'zh-CN': '五步原理' }, body: [{ type: 'text', value: '判例溯源' }] }],
      contents: [{ contentId: 'c-1', pageId: 'p-1', blocks: [
        { blockId: 'b1', type: 'paragraph', text: [{ type: 'text', value: '主体段落' }] },
      ] }],
    }));
    expect(items.filter((i) => i.category === 'legal')).toHaveLength(1);
    expect(items.filter((i) => i.category === 'scenario')).toHaveLength(1);
    expect(items.filter((i) => i.category === 'note')).toHaveLength(1);
    expect(items.filter((i) => i.category === 'content')).toHaveLength(1);
  });

  it('haystack is lowercased', () => {
    const items = buildIndex(makeRegistry());
    expect(items[0].haystack).toBe(items[0].haystack.toLowerCase());
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-core/search/__tests__/buildIndex.test.ts` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-core/search/buildIndex.ts`:

```ts
import type { BookRegistry } from '../registry';
import { flattenRichText } from './flattenRichText';

export type IndexCategory =
  | 'page' | 'glossary' | 'legal' | 'scenario' | 'note' | 'content';

export type IndexedItem = {
  category: IndexCategory;
  id: string;
  haystack: string;                     // lowercased searchable text
  display: { primary: string; secondary?: string };
  pageId?: string;                      // for notes/contents to support page navigation
};

function lc(s: string | undefined | null): string {
  return (s ?? '').toLowerCase();
}

export function buildIndex(registry: BookRegistry): IndexedItem[] {
  const items: IndexedItem[] = [];

  // Pages
  for (const p of registry.manifest.pages) {
    const title = p.title?.['zh-CN'] ?? p.pageId;
    const subtitle = p.subtitle?.['zh-CN'];
    items.push({
      category: 'page',
      id: p.pageId,
      haystack: lc(`${title} ${subtitle ?? ''}`),
      display: { primary: title, secondary: subtitle },
      pageId: p.pageId,
    });
  }

  // Glossary
  for (const t of registry.glossary.values()) {
    const primary = `${t.zh}(${t.original})`;
    items.push({
      category: 'glossary',
      id: t.termId,
      haystack: lc([t.zh, t.original, t.abbreviation, t.shortDefinition, t.longDefinition].filter(Boolean).join(' ')),
      display: { primary, secondary: t.shortDefinition },
    });
  }

  // Legal refs
  for (const l of registry.legalRefs.values()) {
    items.push({
      category: 'legal',
      id: l.legalRefId,
      haystack: lc([l.ref, l.title?.['zh-CN'], l.summary?.['zh-CN']].filter(Boolean).join(' ')),
      display: { primary: l.ref, secondary: l.summary?.['zh-CN'] ?? l.title?.['zh-CN'] },
    });
  }

  // Scenarios
  for (const s of registry.scenarios.values()) {
    const primary = s.title?.['zh-CN'] ?? s.scenarioId;
    items.push({
      category: 'scenario',
      id: s.scenarioId,
      haystack: lc([s.title?.['zh-CN'], s.subtitle?.['zh-CN'], s.oneSentence?.['zh-CN']].filter(Boolean).join(' ')),
      display: { primary, secondary: s.oneSentence?.['zh-CN'] },
    });
  }

  // Notes
  for (const n of registry.notes.values()) {
    const flat = flattenRichText(n.body);
    const primary = n.title?.['zh-CN'] ?? `[${n.noteType}] ${flat.slice(0, 24)}`;
    items.push({
      category: 'note',
      id: n.noteId,
      haystack: lc(`${n.title?.['zh-CN'] ?? ''} ${flat}`),
      display: { primary, secondary: flat.slice(0, 80) },
      pageId: n.pageId,
    });
  }

  // Contents
  for (const c of registry.contents.values()) {
    const flat = c.blocks
      .map((b) => {
        if (b.type === 'heading' || b.type === 'paragraph') return flattenRichText(b.text);
        if (b.type === 'callout') return flattenRichText(b.body);
        if (b.type === 'checklist') return b.items.map((i) => flattenRichText(i)).join(' ');
        return '';
      })
      .join(' ');
    items.push({
      category: 'content',
      id: c.contentId,
      haystack: lc(flat),
      display: { primary: c.contentId, secondary: flat.slice(0, 80) },
      pageId: c.pageId,
    });
  }

  return items;
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-core/search/__tests__/buildIndex.test.ts` → 4 passed. `npm test` → all green.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-core/search/buildIndex.ts src/atlas-core/search/__tests__/buildIndex.test.ts
git commit -m "feat(search): add buildIndex from BookRegistry across 6 sources"
```

---

## Task 3: `searchIndex` (query)

**Files:**
- Create: `src/atlas-core/search/searchIndex.ts`
- Create: `src/atlas-core/search/__tests__/searchIndex.test.ts`
- Create: `src/atlas-core/search/index.ts` (barrel)

- [ ] **Step 1: Failing test**

Create `src/atlas-core/search/__tests__/searchIndex.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { searchIndex } from '../searchIndex';
import type { IndexedItem } from '../buildIndex';

const ITEMS: IndexedItem[] = [
  { category: 'page', id: 'p-01', haystack: 'vat framework five steps', display: { primary: 'VAT Framework' }, pageId: 'p-01' },
  { category: 'page', id: 'p-15', haystack: 'reverse charge invoice', display: { primary: 'Reverse Charge' }, pageId: 'p-15' },
  { category: 'glossary', id: 'reverse-charge', haystack: 'reverse charge reverse charge', display: { primary: 'Reverse Charge (反向征税)' } },
  { category: 'glossary', id: 'werklieferung', haystack: 'werklieferung 加工供货', display: { primary: '加工供货 (Werklieferung)' } },
  { category: 'legal', id: '§ 13b', haystack: '§ 13b reverse charge ustg', display: { primary: '§ 13b UStG' } },
];

describe('searchIndex', () => {
  it('returns empty grouped result for empty query', () => {
    const r = searchIndex(ITEMS, '');
    expect(r).toEqual({ page: [], glossary: [], legal: [], scenario: [], note: [], content: [] });
  });

  it('returns empty grouped result for whitespace-only query', () => {
    const r = searchIndex(ITEMS, '   ');
    expect(r.page).toEqual([]);
  });

  it('matches case-insensitively', () => {
    const r = searchIndex(ITEMS, 'REVERSE');
    expect(r.page.length).toBeGreaterThan(0);
    expect(r.glossary.length).toBeGreaterThan(0);
  });

  it('returns matches grouped by category', () => {
    const r = searchIndex(ITEMS, 'reverse');
    expect(r.page.map((i) => i.id)).toContain('p-15');
    expect(r.glossary.map((i) => i.id)).toContain('reverse-charge');
    expect(r.legal.map((i) => i.id)).toContain('§ 13b');
  });

  it('limits each category to 5 results', () => {
    const many: IndexedItem[] = Array.from({ length: 8 }, (_, i) => ({
      category: 'page', id: `p-${i}`, haystack: 'reverse common', display: { primary: `Page ${i}` },
    }));
    const r = searchIndex(many, 'reverse');
    expect(r.page).toHaveLength(5);
  });

  it('Chinese substring works', () => {
    const r = searchIndex(ITEMS, '加工');
    expect(r.glossary.map((i) => i.id)).toContain('werklieferung');
  });

  it('non-matching query returns empty groups', () => {
    const r = searchIndex(ITEMS, 'zzzzz');
    expect(r.page).toEqual([]);
    expect(r.glossary).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-core/search/__tests__/searchIndex.test.ts` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-core/search/searchIndex.ts`:

```ts
import type { IndexedItem, IndexCategory } from './buildIndex';

export type GroupedResults = Record<IndexCategory, IndexedItem[]>;

const PER_CATEGORY_LIMIT = 5;

const CATEGORIES: readonly IndexCategory[] = [
  'page', 'glossary', 'legal', 'scenario', 'note', 'content',
];

function emptyResults(): GroupedResults {
  return { page: [], glossary: [], legal: [], scenario: [], note: [], content: [] };
}

export function searchIndex(items: IndexedItem[], query: string): GroupedResults {
  const q = query.trim().toLowerCase();
  if (!q) return emptyResults();

  const matched: IndexedItem[] = items.filter((it) => it.haystack.includes(q));

  // Cap each category at PER_CATEGORY_LIMIT, preserve insertion order
  const grouped = emptyResults();
  for (const cat of CATEGORIES) {
    grouped[cat] = matched.filter((it) => it.category === cat).slice(0, PER_CATEGORY_LIMIT);
  }
  return grouped;
}
```

Create `src/atlas-core/search/index.ts`:

```ts
export { flattenRichText } from './flattenRichText';
export { buildIndex } from './buildIndex';
export type { IndexedItem, IndexCategory } from './buildIndex';
export { searchIndex } from './searchIndex';
export type { GroupedResults } from './searchIndex';
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-core/search/__tests__/searchIndex.test.ts` → 7 passed. `npm test` → all green.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-core/search/searchIndex.ts src/atlas-core/search/index.ts src/atlas-core/search/__tests__/searchIndex.test.ts
git commit -m "feat(search): add searchIndex query with per-category cap"
```

---

## Task 4: Install Radix Dialog + Search UI components

**Files:**
- Modify: `package.json`
- Create: `src/atlas-ui/search/SearchResultRow.tsx`
- Create: `src/atlas-ui/search/SearchModal.tsx`
- Create: `src/atlas-ui/search/SearchTrigger.tsx`
- Create: `src/atlas-ui/search/__tests__/SearchModal.test.tsx`
- Create: `src/atlas-ui/search/__tests__/SearchTrigger.test.tsx`

- [ ] **Step 1: Install dependency**

```bash
npm install @radix-ui/react-dialog@^1.1.0
```

Expected: `package.json` updates; lockfile regenerated; no test break.

- [ ] **Step 2: Create `SearchResultRow.tsx`**

```tsx
import type { IndexedItem, IndexCategory } from '../../atlas-core/search';

const CATEGORY_LABEL: Record<IndexCategory, string> = {
  page: '页面', glossary: '术语', legal: '法条',
  scenario: '场景', note: '笔记', content: '内容',
};

export type SearchResultRowProps = {
  item: IndexedItem;
  query: string;
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
};

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent-bg text-accent-strong px-0 rounded">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function SearchResultRow({ item, query, active, onClick, onMouseEnter }: SearchResultRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={active}
      data-active={active ? 'true' : 'false'}
      className={[
        'w-full flex items-baseline gap-2 px-3 py-1.5 text-sm text-left rounded-md transition-colors',
        active ? 'bg-accent-bg-faint' : 'hover:bg-surface-2',
      ].join(' ')}
    >
      <span className="text-[10px] font-medium text-accent bg-accent-bg px-1.5 py-0.5 rounded-full shrink-0">
        {CATEGORY_LABEL[item.category]}
      </span>
      <span className="text-text truncate">{highlight(item.display.primary, query)}</span>
      {item.display.secondary && (
        <span className="text-text-muted text-xs truncate ml-auto">
          {highlight(item.display.secondary, query)}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Create `SearchModal.tsx`**

```tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search as SearchIcon, X } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import { buildIndex, searchIndex } from '../../atlas-core/search';
import type { IndexedItem, IndexCategory, GroupedResults } from '../../atlas-core/search';
import { Icon } from '../primitives';
import { SearchResultRow } from './SearchResultRow';

const CATEGORY_LABEL: Record<IndexCategory, string> = {
  page: '页面', glossary: '术语', legal: '法条',
  scenario: '场景', note: '笔记', content: '内容',
};

export type SearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registry: BookRegistry;
  onSelectResult: (item: IndexedItem) => void;
};

function flatten(grouped: GroupedResults): IndexedItem[] {
  return [...grouped.page, ...grouped.glossary, ...grouped.legal,
          ...grouped.scenario, ...grouped.note, ...grouped.content];
}

export function SearchModal({ open, onOpenChange, registry, onSelectResult }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const items = useMemo(() => buildIndex(registry), [registry]);
  const grouped = useMemo(() => searchIndex(items, query), [items, query]);
  const flat = useMemo(() => flatten(grouped), [grouped]);
  const totalIndexed = useMemo(() => {
    return {
      pages: registry.manifest.pages.length,
      terms: registry.glossary.size,
    };
  }, [registry]);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset query + active when modal closes
  useEffect(() => {
    if (!open) { setQuery(''); setActiveIdx(0); }
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (flat[activeIdx]) {
        onSelectResult(flat[activeIdx]);
        onOpenChange(false);
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-chrome/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[22vh] -translate-x-1/2 z-50 w-[560px] max-w-[90vw] bg-page rounded-lg shadow-2xl border border-border overflow-hidden"
        >
          <Dialog.Title className="sr-only">搜索</Dialog.Title>
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Icon icon={SearchIcon} size={16} className="text-text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`输入关键词搜索 ${totalIndexed.pages} 页 + ${totalIndexed.terms} 术语…`}
              className="flex-1 text-sm text-text bg-transparent outline-none placeholder:text-text-muted"
              data-testid="search-input"
            />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-text-muted hover:text-text"
              aria-label="关闭"
            >
              <Icon icon={X} size={14} />
            </button>
          </div>
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
            {flat.length === 0 ? (
              <div className="text-text-muted text-sm text-center py-6">
                {query ? '无匹配结果' : '输入即可开始'}
              </div>
            ) : (
              (Object.keys(grouped) as IndexCategory[]).map((cat) => {
                const list = grouped[cat];
                if (list.length === 0) return null;
                return (
                  <div key={cat} role="group" aria-label={CATEGORY_LABEL[cat]} className="px-1 py-1">
                    <div className="text-[10px] uppercase text-text-muted font-medium px-2 py-1 tracking-wider">
                      {CATEGORY_LABEL[cat]} ({list.length})
                    </div>
                    {list.map((item) => {
                      const flatIdx = flat.indexOf(item);
                      return (
                        <SearchResultRow
                          key={`${item.category}-${item.id}`}
                          item={item}
                          query={query}
                          active={flatIdx === activeIdx}
                          onClick={() => { onSelectResult(item); onOpenChange(false); }}
                          onMouseEnter={() => setActiveIdx(flatIdx)}
                        />
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 4: Create `SearchTrigger.tsx`**

```tsx
import { Search as SearchIcon } from 'lucide-react';
import { Icon } from '../primitives';

export type SearchTriggerProps = {
  onClick: () => void;
};

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="搜索(快捷键 ⌘K)"
      className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] text-divider text-xs rounded-md h-7 px-2.5 transition-colors min-w-[180px] max-md:min-w-0 max-md:w-7 max-md:justify-center"
    >
      <Icon icon={SearchIcon} size={14} className="shrink-0" />
      <span className="flex-1 text-left max-md:hidden">搜索…</span>
      <span className="text-[10px] font-mono bg-white/[0.08] rounded px-1 max-md:hidden">⌘K</span>
    </button>
  );
}
```

- [ ] **Step 5: Test SearchModal**

Create `src/atlas-ui/search/__tests__/SearchModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SearchModal } from '../SearchModal';
import { createBookRegistry } from '../../../atlas-core/registry';
import type { BookManifest } from '../../../atlas-core/types/manifest';

function makeRegistry() {
  const manifest = {
    schemaVersion: '1.0', bookId: 'b', slug: 'b', version: '0.1',
    title: { 'zh-CN': 'B' }, defaultLocale: 'zh-CN', supportedLocales: ['zh-CN'],
    visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
    reader: { defaultMode: 'auto', allowModeSwitch: false, transition: 'fade',
      enableKeyboardNavigation: true, enableSwipeNavigation: true, enableProgressBar: true,
      enableTableOfContents: true, defaultZoom: 'fit-page',
      spreadBehavior: { desktopDefault: 'single', mobileDefault: 'single', spreadPageAdvance: 'by-page',
        keyboard: { arrowLeft: 'previous', arrowRight: 'next' },
        clickZones: { enabled: false, leftEdgePercent: 0, rightEdgePercent: 0 } } },
    pages: [
      { pageId: 'p-01', slug: '/p/01', type: 'imageOverlay', sectionCode: '01',
        title: { 'zh-CN': 'VAT 判断' }, layout: { mode: 'single', format: 'custom', size: { preset: 'custom', width: 1086, height: 1448 }, background: 'image' } },
    ],
    readingOrder: ['p-01'],
    registries: { imageAssets: '', overlays: '', glossary: '' },
  } as unknown as BookManifest;
  return createBookRegistry(manifest, [], [], [{
    termId: 'reverse-charge', zh: '反向征税', original: 'Reverse Charge',
    category: 'vat-basic', shortDefinition: '接收方申报',
    firstMentionFormat: '反向征税 (Reverse Charge)',
  }] as never, [], [], [], [], []);
}

describe('SearchModal', () => {
  it('renders nothing when closed', () => {
    render(<SearchModal open={false} onOpenChange={vi.fn()} registry={makeRegistry()} onSelectResult={vi.fn()} />);
    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
  });

  it('renders input when open', () => {
    render(<SearchModal open={true} onOpenChange={vi.fn()} registry={makeRegistry()} onSelectResult={vi.fn()} />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('shows grouped results matching the query', async () => {
    render(<SearchModal open={true} onOpenChange={vi.fn()} registry={makeRegistry()} onSelectResult={vi.fn()} />);
    await userEvent.type(screen.getByTestId('search-input'), '反向');
    expect(screen.getByText('术语 (1)')).toBeInTheDocument();
  });

  it('clicking a result calls onSelectResult then closes', async () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(<SearchModal open={true} onOpenChange={onOpenChange} registry={makeRegistry()} onSelectResult={onSelect} />);
    await userEvent.type(screen.getByTestId('search-input'), '反向');
    const result = await screen.findByRole('option');
    await userEvent.click(result);
    expect(onSelect).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('Enter selects active row', async () => {
    const onSelect = vi.fn();
    render(<SearchModal open={true} onOpenChange={vi.fn()} registry={makeRegistry()} onSelectResult={onSelect} />);
    const input = screen.getByTestId('search-input');
    await userEvent.type(input, '反向');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Test SearchTrigger**

Create `src/atlas-ui/search/__tests__/SearchTrigger.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SearchTrigger } from '../SearchTrigger';

describe('SearchTrigger', () => {
  it('renders with ⌘K label and search aria-label', () => {
    render(<SearchTrigger onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /搜索/ })).toBeInTheDocument();
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('click invokes onClick', async () => {
    const onClick = vi.fn();
    render(<SearchTrigger onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 7: Tests pass**

`npm test` → all green, +7 SearchModal tests + 2 SearchTrigger tests.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/atlas-ui/search
git commit -m "feat(search): add SearchModal, SearchResultRow, SearchTrigger with Radix Dialog"
```

---

## Task 5: Integrate search into MagazineReader + ReaderShell + keyboard + Glossary hash

**Files:**
- Modify: `src/atlas-core/reader/useKeyboardNavigation.ts`
- Modify: `src/atlas-ui/reader/MagazineReader.tsx`
- Modify: `src/atlas-ui/reader/ReaderShell.tsx`
- Modify: `src/app/routes/GlossaryRoute.tsx`

- [ ] **Step 1: Extend `useKeyboardNavigation` with `onOpenSearch`**

Edit `src/atlas-core/reader/useKeyboardNavigation.ts`. Add `onOpenSearch?: () => void` to `KeyboardActions` type. Add the handler:

```ts
export type KeyboardActions = {
  onToggleRail?: () => void;
  onNewComment?: () => void;
  onSwitchTab?: (tab: RailTab) => void;
  onOpenSearch?: () => void;        // new
};

// inside handleKeyDown, before existing key checks:
if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
  e.preventDefault();
  actions.onOpenSearch?.();
  return;
}
```

Place the check **before** `isEditable(target)` early-return so Cmd+K works even when an input is focused — common search UX.

Wait — that may conflict with browser's Cmd+K. But the spec says it shouldn't (browsers use Cmd+L for address bar). Use preventDefault to be safe.

- [ ] **Step 2: Modify `MagazineReader.tsx`**

Add a new state and handler:

```tsx
// Near other useState declarations:
const [searchOpen, setSearchOpen] = useState(false);

// Update useKeyboardNavigation:
useKeyboardNavigation(readerState, registry.manifest.reader.enableKeyboardNavigation, {
  onToggleRail: () => railState.setOpen(!railState.open),
  onNewComment: handlePlusClick,
  onSwitchTab: (tab) => railState.expand(tab),
  onOpenSearch: () => setSearchOpen(true),
});

// Add search result handler:
const handleSearchSelect = useCallback((item: { category: string; id: string; pageId?: string }) => {
  if (item.category === 'page') {
    handleNavigateToPage(item.id);
  } else if (item.category === 'glossary') {
    navigate(`/book/${registry.manifest.slug}/glossary#${item.id}`);
  } else if (item.pageId) {
    handleNavigateToPage(item.pageId);
  } else {
    navigate(`/book/${registry.manifest.slug}/glossary`);
  }
}, [handleNavigateToPage, navigate, registry.manifest.slug]);

// At the bottom, near the closing fragment, add:
return (
  <>
    {/* existing children */}
    <SearchModal
      open={searchOpen}
      onOpenChange={setSearchOpen}
      registry={registry}
      onSelectResult={handleSearchSelect}
    />
  </>
);
```

Import at top:

```tsx
import { SearchModal } from '../search/SearchModal';
```

- [ ] **Step 3: Modify `ReaderShell.tsx`**

Pass `onOpenSearch` from MagazineReader to ReaderShell via a new prop, render `<SearchTrigger>` in the brand area.

In `ReaderShellProps`:
```ts
onOpenSearch: () => void;
```

In ReaderShell JSX, locate the header brand block (where the logo + title + meta render). Insert `<SearchTrigger>` between brand/meta and the controls (评论模式 / Debug):

```tsx
import { SearchTrigger } from '../search/SearchTrigger';

// inside header:
{/* ...brand spans... */}
<SearchTrigger onClick={onOpenSearch} />
<span className="w-px h-3.5 bg-white/15 mx-1 shrink-0" aria-hidden="true" />
{/* ChromeButton for 评论模式 etc... */}
```

In MagazineReader, pass `onOpenSearch={() => setSearchOpen(true)}` to `<ReaderShell>`.

- [ ] **Step 4: Modify `GlossaryRoute.tsx` for hash scroll**

Add inside `GlossaryRoute` body, after the registry-ready render:

```tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// inside the component:
const { hash } = useLocation();

useEffect(() => {
  if (!registry || !hash) return;
  const id = hash.slice(1);
  // Wait one tick for DOM to render the glossary list
  const handle = setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('outline', 'outline-2', 'outline-accent', 'rounded');
      setTimeout(() => el.classList.remove('outline', 'outline-2', 'outline-accent', 'rounded'), 2000);
    }
  }, 50);
  return () => clearTimeout(handle);
}, [registry, hash]);
```

Note: `GlossaryPageTemplate.tsx` already gives each entry an `id={entry.termId}` (verified at Spec C). If a future refactor breaks that contract, this hash scroll silently no-ops.

- [ ] **Step 5: Run tests**

`npm test` → green. Some existing reader/integration tests may fail because they pass `<ReaderShell>` without the new `onOpenSearch` prop. Add `onOpenSearch={() => {}}` to those fixture renders.

Find affected test files:
```bash
grep -rln "ReaderShell" src/atlas-ui/reader/__tests__ src/__tests__
```

- [ ] **Step 6: Smoke**

Run `npm run dev` briefly. Press Cmd+K — modal should open. Type a query. Click a glossary result — page should navigate to `/glossary#<termId>` and the entry should briefly highlight.

- [ ] **Step 7: Commit**

```bash
git add src/atlas-core/reader/useKeyboardNavigation.ts \
        src/atlas-ui/reader/MagazineReader.tsx \
        src/atlas-ui/reader/ReaderShell.tsx \
        src/app/routes/GlossaryRoute.tsx \
        src/atlas-ui/reader/__tests__ src/__tests__
git commit -m "feat(search): integrate SearchModal + ⌘K trigger + glossary hash scroll"
```

---

# Phase J — TOC Folding

## Task 6: `tocGrouping` utility + `useTocFolds` hook

**Files:**
- Create: `src/atlas-ui/rail/tabs/tocGrouping.ts`
- Create: `src/atlas-ui/rail/tabs/__tests__/tocGrouping.test.ts`
- Create: `src/atlas-core/reader/useTocFolds.ts`
- Create: `src/atlas-core/reader/__tests__/useTocFolds.test.ts`

- [ ] **Step 1: Failing test for `tocGrouping`**

Create `src/atlas-ui/rail/tabs/__tests__/tocGrouping.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { groupPages } from '../tocGrouping';
import type { PageManifest } from '../../../atlas-core/types/page';

function p(sectionCode: string, pageId: string, title: string): PageManifest {
  return { sectionCode, pageId, title: { 'zh-CN': title } } as unknown as PageManifest;
}

describe('groupPages', () => {
  it('splits readingOrder into groups by sectionCode prefix', () => {
    const pages = [
      p('TOC', 'toc', 'TOC'),
      p('01', '01-fw', 'Framework'),
      p('09', '09', 'Chapter 9'),
      p('09-01', '09-01', '9.1'),
      p('09-02', '09-02', '9.2'),
      p('SC-01A', 'sc-01a', 'SC 1A'),
      p('SC-02', 'sc-02', 'SC 2'),
      p('G', 'glossary', 'Glossary'),
      p('APP-A', 'app-a', 'App A'),
    ];
    const groups = groupPages(pages);
    expect(groups.map((g) => g.key)).toEqual(['TOC', '01', '09', 'SC', 'G', 'APP']);
  });

  it('multi-page group with first page sectionCode == groupKey → real header', () => {
    const pages = [
      p('09', '09', 'Chapter 9'),
      p('09-01', '09-01', '9.1'),
    ];
    const groups = groupPages(pages);
    expect(groups[0].header.kind).toBe('real');
    expect(groups[0].header.page?.pageId).toBe('09');
    expect(groups[0].children).toHaveLength(1);
    expect(groups[0].children[0].pageId).toBe('09-01');
  });

  it('multi-page group without matching first page sectionCode → virtual header', () => {
    const pages = [
      p('SC-01A', 'sc-01a', 'SC 1A'),
      p('SC-02', 'sc-02', 'SC 2'),
    ];
    const groups = groupPages(pages);
    expect(groups[0].header.kind).toBe('virtual');
    expect(groups[0].header.label).toBe('场景');
    expect(groups[0].children).toHaveLength(2);
  });

  it('single-page group has no header, just the page as the sole child', () => {
    const pages = [p('TOC', 'toc', 'TOC')];
    const groups = groupPages(pages);
    expect(groups[0].header.kind).toBe('real');
    expect(groups[0].header.page?.pageId).toBe('toc');
    expect(groups[0].children).toHaveLength(0);
  });

  it('groupKey unrecognized → label falls back to groupKey itself', () => {
    const pages = [
      p('XYZ-1', 'xyz-1', 'X1'),
      p('XYZ-2', 'xyz-2', 'X2'),
    ];
    const groups = groupPages(pages);
    expect(groups[0].header.label).toBe('XYZ');
  });

  it('exposes findGroupKey helper to locate the group containing a pageId', () => {
    const pages = [
      p('09', '09', 'Chapter 9'),
      p('09-01', '09-01', '9.1'),
      p('SC-01A', 'sc-01a', 'SC 1A'),
    ];
    const groups = groupPages(pages);
    // Find the group key for '09-01':
    const found = groups.find((g) => g.header.page?.pageId === '09-01' || g.children.some((c) => c.pageId === '09-01'));
    expect(found?.key).toBe('09');
  });
});
```

- [ ] **Step 2: Implement `tocGrouping`**

Create `src/atlas-ui/rail/tabs/tocGrouping.ts`:

```ts
import type { PageManifest } from '../../../atlas-core/types/page';

export type TocGroupHeader =
  | { kind: 'real'; page: PageManifest; label: string }
  | { kind: 'virtual'; page?: undefined; label: string };

export type TocGroup = {
  key: string;                  // 'TOC' / '01' / '09' / 'SC' / 'G' / 'APP' / etc.
  header: TocGroupHeader;
  children: PageManifest[];     // siblings of the header (header.page is NOT in children)
};

const VIRTUAL_LABELS: Record<string, string> = {
  SC: '场景',
  APP: '附录',
  G: '术语',
};

function virtualLabel(groupKey: string): string {
  return VIRTUAL_LABELS[groupKey] ?? groupKey;
}

function groupKeyOf(p: PageManifest): string {
  const code = p.sectionCode ?? p.pageId;
  return code.split('-')[0];
}

export function groupPages(pages: PageManifest[]): TocGroup[] {
  const groups: TocGroup[] = [];
  let current: { key: string; pages: PageManifest[] } | null = null;

  for (const p of pages) {
    const k = groupKeyOf(p);
    if (!current || current.key !== k) {
      if (current) groups.push(toGroup(current));
      current = { key: k, pages: [p] };
    } else {
      current.pages.push(p);
    }
  }
  if (current) groups.push(toGroup(current));
  return groups;
}

function toGroup({ key, pages }: { key: string; pages: PageManifest[] }): TocGroup {
  const first = pages[0];
  const firstSection = first.sectionCode ?? first.pageId;
  if (firstSection === key) {
    return {
      key,
      header: { kind: 'real', page: first, label: first.title?.['zh-CN'] ?? first.pageId },
      children: pages.slice(1),
    };
  }
  return {
    key,
    header: { kind: 'virtual', label: virtualLabel(key) },
    children: pages,
  };
}

export function findGroupKey(groups: TocGroup[], pageId: string): string | null {
  for (const g of groups) {
    if (g.header.kind === 'real' && g.header.page.pageId === pageId) return g.key;
    if (g.children.some((c) => c.pageId === pageId)) return g.key;
  }
  return null;
}
```

- [ ] **Step 3: Tests pass for tocGrouping**

`npx vitest run src/atlas-ui/rail/tabs/__tests__/tocGrouping.test.ts` → 6 passed.

- [ ] **Step 4: Failing test for `useTocFolds`**

Create `src/atlas-core/reader/__tests__/useTocFolds.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTocFolds } from '../useTocFolds';

describe('useTocFolds', () => {
  beforeEach(() => { localStorage.clear(); });

  it('initial: returns smart default (only current group expanded, others collapsed)', () => {
    const { result } = renderHook(() => useTocFolds('book-a', ['09', 'SC', 'APP'], '09'));
    expect(result.current.isExpanded('09')).toBe(true);
    expect(result.current.isExpanded('SC')).toBe(false);
    expect(result.current.isExpanded('APP')).toBe(false);
  });

  it('toggle persists per-group', () => {
    const { result } = renderHook(() => useTocFolds('book-a', ['09', 'SC'], '09'));
    act(() => result.current.toggle('SC'));
    expect(result.current.isExpanded('SC')).toBe(true);
    const stored = JSON.parse(localStorage.getItem('atlas-toc-folds-book-a') ?? '{}');
    expect(stored.SC).toBe('expanded');
  });

  it('user explicit state overrides smart default when currentGroupKey changes', () => {
    localStorage.setItem('atlas-toc-folds-book-a', JSON.stringify({ '09': 'collapsed' }));
    const { result } = renderHook(() => useTocFolds('book-a', ['09', 'SC'], '09'));
    // even though 09 is current, user said collapsed
    expect(result.current.isExpanded('09')).toBe(false);
  });

  it('group never visited in storage falls back to smart default', () => {
    localStorage.setItem('atlas-toc-folds-book-a', JSON.stringify({ SC: 'expanded' }));
    const { result } = renderHook(() => useTocFolds('book-a', ['09', 'SC'], '09'));
    expect(result.current.isExpanded('09')).toBe(true);  // smart default (current)
    expect(result.current.isExpanded('SC')).toBe(true);  // user explicit
  });
});
```

- [ ] **Step 5: Implement `useTocFolds`**

Create `src/atlas-core/reader/useTocFolds.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';

type FoldState = 'expanded' | 'collapsed';
type FoldMap = Record<string, FoldState>;

function storageKey(bookId: string) {
  return `atlas-toc-folds-${bookId}`;
}

function loadStored(bookId: string): FoldMap {
  try {
    const raw = localStorage.getItem(storageKey(bookId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as FoldMap;
  } catch {
    return {};
  }
}

export type UseTocFolds = {
  isExpanded: (groupKey: string) => boolean;
  toggle: (groupKey: string) => void;
};

export function useTocFolds(
  bookId: string,
  groupKeys: string[],
  currentGroupKey: string | null,
): UseTocFolds {
  const [userFolds, setUserFolds] = useState<FoldMap>(() => loadStored(bookId));

  useEffect(() => {
    setUserFolds(loadStored(bookId));
  }, [bookId]);

  const isExpanded = useCallback(
    (groupKey: string) => {
      if (userFolds[groupKey] === 'expanded') return true;
      if (userFolds[groupKey] === 'collapsed') return false;
      // smart default: only current group
      return groupKey === currentGroupKey;
    },
    [userFolds, currentGroupKey],
  );

  const toggle = useCallback(
    (groupKey: string) => {
      setUserFolds((prev) => {
        const currentlyExpanded = prev[groupKey] === 'expanded' ||
          (prev[groupKey] === undefined && groupKey === currentGroupKey);
        const next: FoldMap = { ...prev, [groupKey]: currentlyExpanded ? 'collapsed' : 'expanded' };
        try { localStorage.setItem(storageKey(bookId), JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    },
    [bookId, currentGroupKey],
  );

  // Reference unused groupKeys param to satisfy lint
  void groupKeys;

  return { isExpanded, toggle };
}
```

- [ ] **Step 6: Tests pass**

`npx vitest run src/atlas-core/reader/__tests__/useTocFolds.test.ts` → 4 passed. `npm test` → all green.

- [ ] **Step 7: Commit**

```bash
git add src/atlas-ui/rail/tabs/tocGrouping.ts src/atlas-ui/rail/tabs/__tests__/tocGrouping.test.ts \
        src/atlas-core/reader/useTocFolds.ts src/atlas-core/reader/__tests__/useTocFolds.test.ts
git commit -m "feat(toc): add groupPages utility and useTocFolds hook"
```

---

## Task 7: TocTab rewrite (grouped rendering + chevron toggle)

**Files:**
- Modify: `src/atlas-ui/rail/tabs/TocTab.tsx`
- Modify: `src/atlas-ui/rail/__tests__/TocTab.test.tsx` (or wherever current tests live)

- [ ] **Step 1: Rewrite TocTab**

Replace `src/atlas-ui/rail/tabs/TocTab.tsx` entirely:

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { ChevronRight, ChevronDown, List } from 'lucide-react';
import type { BookRegistry } from '../../../atlas-core/registry';
import { useTocFolds } from '../../../atlas-core/reader/useTocFolds';
import { EmptyState, Icon } from '../../primitives';
import { groupPages, findGroupKey, type TocGroup } from './tocGrouping';

export type TocTabProps = {
  registry: BookRegistry;
  currentPageId: string | null;
  onNavigate: (pageId: string) => void;
};

export function TocTab({ registry, currentPageId, onNavigate }: TocTabProps) {
  const groups: TocGroup[] = useMemo(() => groupPages(registry.manifest.pages), [registry]);
  const currentGroupKey = useMemo(
    () => (currentPageId ? findGroupKey(groups, currentPageId) : null),
    [groups, currentPageId],
  );
  const folds = useTocFolds(
    registry.manifest.bookId,
    groups.map((g) => g.key),
    currentGroupKey,
  );

  const currentRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [currentPageId]);

  if (groups.length === 0) {
    return <EmptyState icon={List} title="暂无目录" description="此书未配置 readingOrder。" />;
  }

  // Build flat numbered list across all pages for displayed numbering
  const pageNumbers = new Map<string, number>();
  let n = 0;
  for (const g of groups) {
    if (g.header.kind === 'real') pageNumbers.set(g.header.page.pageId, ++n);
    for (const c of g.children) pageNumbers.set(c.pageId, ++n);
  }

  return (
    <div className="h-full overflow-y-auto py-2" data-testid="toc-scroll">
      {groups.map((g) => {
        const expanded = folds.isExpanded(g.key);
        const singlePage = g.children.length === 0 && g.header.kind === 'real';
        const isCurrentGroup = g.key === currentGroupKey;

        if (singlePage) {
          const pg = g.header.kind === 'real' ? g.header.page : null;
          if (!pg) return null;
          const num = pageNumbers.get(pg.pageId) ?? 0;
          const isCurrent = pg.pageId === currentPageId;
          return (
            <button
              key={g.key}
              ref={isCurrent ? currentRef : null}
              type="button"
              data-toc-current={isCurrent ? 'true' : 'false'}
              onClick={() => onNavigate(pg.pageId)}
              className={[
                'w-full text-left flex items-baseline gap-3 px-4 py-2 text-sm transition-colors',
                isCurrent ? 'bg-accent-bg text-accent font-medium' : 'text-text hover:bg-surface-2',
              ].join(' ')}
            >
              <span className="text-text-muted text-xs w-6 text-right shrink-0 tabular-nums">{num}</span>
              <span className="flex-1 truncate">{pg.title?.['zh-CN'] ?? pg.pageId}</span>
            </button>
          );
        }

        // Multi-page group
        return (
          <div key={g.key} data-toc-group={g.key}>
            <div
              className={[
                'flex items-baseline gap-2 px-3 py-1.5 text-sm',
                isCurrentGroup ? 'text-accent font-semibold' : 'text-text-2 font-medium',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => folds.toggle(g.key)}
                className="shrink-0 text-text-muted hover:text-text"
                aria-label={`${expanded ? '折叠' : '展开'}${g.header.label}`}
                aria-expanded={expanded}
                data-toc-chevron={g.key}
              >
                <Icon icon={expanded ? ChevronDown : ChevronRight} size={14} />
              </button>
              {g.header.kind === 'real' ? (
                <button
                  ref={g.header.page.pageId === currentPageId ? currentRef : null}
                  type="button"
                  data-toc-current={g.header.page.pageId === currentPageId ? 'true' : 'false'}
                  onClick={() => onNavigate(g.header.kind === 'real' ? g.header.page.pageId : '')}
                  className="flex-1 text-left flex items-baseline gap-2 hover:underline"
                >
                  <span className="text-text-muted text-xs w-6 text-right shrink-0 tabular-nums">
                    {pageNumbers.get(g.header.page.pageId) ?? ''}
                  </span>
                  <span className="truncate">{g.header.label}</span>
                </button>
              ) : (
                <span className="flex-1 flex items-baseline gap-2">
                  <span className="text-text-muted text-xs uppercase tracking-wider shrink-0">{g.key}</span>
                  <span className="truncate">{g.header.label}({g.children.length})</span>
                </span>
              )}
            </div>
            {expanded && (
              <div>
                {g.children.map((c) => {
                  const isCurrent = c.pageId === currentPageId;
                  const num = pageNumbers.get(c.pageId) ?? 0;
                  return (
                    <button
                      key={c.pageId}
                      ref={isCurrent ? currentRef : null}
                      type="button"
                      data-toc-current={isCurrent ? 'true' : 'false'}
                      onClick={() => onNavigate(c.pageId)}
                      className={[
                        'w-full text-left flex items-baseline gap-3 pl-10 pr-4 py-1.5 text-sm transition-colors',
                        isCurrent ? 'bg-accent-bg text-accent font-medium' : 'text-text-2 hover:bg-surface-2 hover:text-text',
                      ].join(' ')}
                    >
                      <span className="text-text-muted text-xs w-6 text-right shrink-0 tabular-nums">{num}</span>
                      <span className="flex-1 truncate">{c.title?.['zh-CN'] ?? c.pageId}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update existing TocTab tests**

The existing test (verify location with `ls src/atlas-ui/rail/__tests__/TocTab.test.tsx`) likely uses MemoryRouter and expects flat list. Update to handle grouped output. Replace with:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TocTab } from '../tabs/TocTab';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { PageManifest } from '../../../atlas-core/types/page';

function page(id: string, num: number, title: string, sectionCode: string): PageManifest {
  return { pageId: id, sectionCode, type: 'imageOverlay', pageNumber: num,
    title: { 'zh-CN': title }, layout: { mode: 'single' } } as unknown as PageManifest;
}

function makeRegistry(): BookRegistry {
  const pages = [
    page('toc', 1, 'TOC', 'TOC'),
    page('09', 2, '第 09 章', '09'),
    page('09-01', 3, '统一给付', '09-01'),
    page('sc-01a', 4, 'SC 1A', 'SC-01A'),
    page('sc-02', 5, 'SC 2', 'SC-02'),
  ];
  return {
    manifest: { slug: 'demo', bookId: 'demo-book', readingOrder: pages.map((p) => p.pageId), pages },
    getPage: (id: string) => pages.find((p) => p.pageId === id),
  } as unknown as BookRegistry;
}

describe('TocTab (grouped)', () => {
  beforeEach(() => { localStorage.clear(); });

  it('renders single-page groups flat (TOC)', () => {
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="toc" onNavigate={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText('TOC')).toBeInTheDocument();
  });

  it('multi-page group with real header is expanded when it contains current page', () => {
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="09-01" onNavigate={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText('第 09 章')).toBeInTheDocument();
    expect(screen.getByText('统一给付')).toBeInTheDocument();
  });

  it('multi-page group without real header gets virtual label "场景"', () => {
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="sc-01a" onNavigate={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText(/场景\(2\)/)).toBeInTheDocument();
  });

  it('non-current group is collapsed by default', () => {
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="toc" onNavigate={vi.fn()} /></MemoryRouter>);
    // SC group is not current → collapsed → SC-01A title not visible
    expect(screen.queryByText('SC 1A')).not.toBeInTheDocument();
  });

  it('clicking chevron toggles fold state and persists', async () => {
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="toc" onNavigate={vi.fn()} /></MemoryRouter>);
    const chevronBtn = screen.getByRole('button', { name: /展开场景/ });
    await userEvent.click(chevronBtn);
    expect(screen.getByText('SC 1A')).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem('atlas-toc-folds-demo-book') ?? '{}');
    expect(stored.SC).toBe('expanded');
  });

  it('clicking page navigates via onNavigate', async () => {
    const onNav = vi.fn();
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="09-01" onNavigate={onNav} /></MemoryRouter>);
    await userEvent.click(screen.getByText('统一给付'));
    expect(onNav).toHaveBeenCalledWith('09-01');
  });
});
```

- [ ] **Step 3: Tests pass**

`npm test` → green; ~+6 TocTab tests.

- [ ] **Step 4: Commit**

```bash
git add src/atlas-ui/rail/tabs/TocTab.tsx src/atlas-ui/rail/__tests__/TocTab.test.tsx
git commit -m "feat(toc): rewrite TocTab with section folding and chevron toggle"
```

---

## Task 8: Sticky current-section band

**Files:**
- Modify: `src/atlas-ui/rail/tabs/TocTab.tsx`

- [ ] **Step 1: Add IntersectionObserver-based sticky band**

In `TocTab.tsx`, add a sticky band that appears when the current group's header scrolls out of view. Insert near the top of the return JSX (just before the `<div className="h-full overflow-y-auto py-2" ...>` opening):

Replace the existing return with:

```tsx
import { useState } from 'react';
// ... existing imports
import { Pin } from 'lucide-react';

// ... existing component up through pageNumbers computation
const scrollContainerRef = useRef<HTMLDivElement>(null);
const currentGroupHeaderRef = useRef<HTMLElement | null>(null);
const [stickyVisible, setStickyVisible] = useState(false);

useEffect(() => {
  const root = scrollContainerRef.current;
  const target = currentGroupHeaderRef.current;
  if (!root || !target || typeof IntersectionObserver === 'undefined') return;

  const obs = new IntersectionObserver(
    (entries) => {
      const ent = entries[0];
      // header off-screen → show sticky
      setStickyVisible(!ent.isIntersecting);
    },
    { root, threshold: 0 },
  );
  obs.observe(target);
  return () => obs.disconnect();
}, [currentGroupKey, currentPageId]);

const currentGroup = groups.find((g) => g.key === currentGroupKey) ?? null;
const stickyLabel = currentGroup
  ? currentGroup.header.kind === 'real'
    ? currentGroup.header.label
    : `${currentGroup.key} · ${currentGroup.header.label}`
  : '';

function handleStickyClick() {
  currentRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
}
```

In the group rendering, attach `ref` to the multi-page group's header div if `g.key === currentGroupKey`:

```tsx
<div
  ref={isCurrentGroup ? (el) => { currentGroupHeaderRef.current = el; } : undefined}
  className={...}
>
```

Adjust the outer div to attach `scrollContainerRef` to it, and prepend the sticky band:

```tsx
return (
  <div className="h-full flex flex-col">
    {stickyVisible && stickyLabel && (
      <button
        type="button"
        onClick={handleStickyClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent-bg text-accent font-medium border-b border-border w-full text-left hover:bg-accent-bg-2 shrink-0"
        data-testid="toc-sticky"
      >
        <Icon icon={Pin} size={11} className="shrink-0" />
        <span>当前位置 · {stickyLabel}</span>
      </button>
    )}
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto py-2" data-testid="toc-scroll">
      {/* ... existing groups.map ... */}
    </div>
  </div>
);
```

- [ ] **Step 2: Test (manual smoke + add a small unit)**

Append to `TocTab.test.tsx`:

```tsx
  it('renders sticky band container (visibility controlled by IntersectionObserver, mocked)', () => {
    // jsdom lacks IntersectionObserver; mock it to be a no-op
    class IO { observe(){} unobserve(){} disconnect(){} }
    // @ts-expect-error jsdom polyfill
    global.IntersectionObserver = IO;
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="09-01" onNavigate={vi.fn()} /></MemoryRouter>);
    // Sticky starts hidden (observer hasn't fired yet)
    expect(screen.queryByTestId('toc-sticky')).not.toBeInTheDocument();
    // Just verify the scroll container is there
    expect(screen.getByTestId('toc-scroll')).toBeInTheDocument();
  });
```

- [ ] **Step 3: Tests pass**

`npm test` → green.

- [ ] **Step 4: Smoke**

Run dev server, navigate to a chapter, expand the 09 group, scroll the TOC down past the chapter header — sticky band should appear.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/rail/tabs/TocTab.tsx src/atlas-ui/rail/__tests__/TocTab.test.tsx
git commit -m "feat(toc): add sticky current-section band with IntersectionObserver"
```

---

## Task 9: Final integration + lint + smoke

**Files:** any if smoke surfaces issues.

- [ ] **Step 1: Full test suite**

```bash
npm test 2>&1 | tail -3
```
Expected: 327 + ~25 new (5 flatten + 4 buildIndex + 7 searchIndex + 5 modal + 2 trigger + 6 grouping + 4 useTocFolds + 6 TocTab grouped + 1 sticky) = ~355.

- [ ] **Step 2: Lint baseline**

```bash
npm run lint 2>&1 | grep "✖" | tail -1
```
Expected: `✖ 40 problems` (baseline). If a new error is introduced, fix in this commit.

- [ ] **Step 3: Build**

```bash
npx vite build --logLevel warn 2>&1 | tail -5
```
Expected: success.

- [ ] **Step 4: Manual smoke**

```bash
npm run dev
```

Test:
1. Press Cmd+K → modal opens with autofocus.
2. Type "vat" → page result appears.
3. Type "加工" → glossary match shows.
4. ↑↓ navigates, Enter jumps, Esc closes.
5. Click glossary result → navigates to `/glossary#<termId>`, term briefly highlights.
6. Open TOC tab → only current chapter expanded, others collapsed.
7. Click a chapter chevron → expands; reload page → state persists.
8. Scroll TOC past current chapter → sticky band appears with "当前位置".
9. Click sticky band → scrolls back to current page.

- [ ] **Step 5: Final commit (only if smoke surfaced changes)**

```bash
git add -A
git commit -m "fix: polish from Spec F smoke test"
```

---

## Acceptance Criteria

- [ ] All 9 commits land matching plan tasks
- [ ] `Cmd+K` opens search modal anywhere in reader
- [ ] Search matches across 6 categories, grouped, ≤5 per category
- [ ] `<mark>` highlights matched substring
- [ ] ↑↓ navigates result list; Enter jumps; Esc closes
- [ ] Glossary result navigates to `/book/<slug>/glossary#<termId>` and entry highlights briefly
- [ ] TOC tab shows folded groups by sectionCode prefix
- [ ] Only current-page group expanded by default; others folded
- [ ] User toggle persists per-group via `localStorage["atlas-toc-folds-<bookId>"]`
- [ ] Sticky band appears when current group's header scrolls out of view
- [ ] `npm test` ~355 passed
- [ ] `npm run lint` 40 baseline preserved
- [ ] `npx vite build` succeeds

---

## Self-Review

**Spec → plan coverage:**

| Spec §  | Task |
|---|---|
| §2.1 顶栏入口 | Task 4 (SearchTrigger) + Task 5 (ReaderShell insert) |
| §2.2 模态 | Task 4 (SearchModal) |
| §2.3 6 categories result grouping | Task 4 (CATEGORY_LABEL + grouping render) + Task 3 (searchIndex grouping) |
| §2.4 buildIndex | Task 2 |
| §2.5 flattenRichText | Task 1 |
| §2.6 keyboard | Task 4 (modal-internal) + Task 5 (global ⌘K) |
| §2.7 new files | Tasks 1–4 |
| §2.8 改造 | Task 5 |
| §2.9 dep | Task 4 step 1 |
| §3.1 grouping algorithm | Task 6 (`groupPages`) |
| §3.2 virtual labels | Task 6 (VIRTUAL_LABELS map) |
| §3.3 折叠 + localStorage | Task 6 (`useTocFolds`) |
| §3.4 sticky | Task 8 |
| §3.5 existing保留 | Task 7 (scrollIntoView + accent-bg) |
| §3.6/3.7 改造 + 测试 | Task 7 |

**Placeholder scan:** Each step contains full code. No "TBD".

**Type consistency:**
- `IndexedItem`, `IndexCategory`, `GroupedResults` — defined in Task 2, used identically in 3/4/5 ✓
- `TocGroup`, `TocGroupHeader`, `groupPages`, `findGroupKey` — defined in Task 6, used in Task 7 ✓
- `useTocFolds(bookId, groupKeys, currentGroupKey)` — same signature in Task 6 + Task 7 ✓

**Known judgement calls during execution:**
- Task 5: existing reader tests may need `onOpenSearch={() => {}}` added — grep + bulk fix as needed.
- Task 8: jsdom lacks IntersectionObserver — `IO` polyfill at test top is sufficient.
