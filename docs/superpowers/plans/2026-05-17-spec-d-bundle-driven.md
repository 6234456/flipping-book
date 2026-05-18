# Spec D — Bundle-Driven Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace de-eu-vat-specific runtime bindings with a generic `loadBook(baseUrl)` that reads any conforming bundle from `public/book/`. Drop in a new bundle, refresh, done.

**Architecture:** New `src/atlas-core/loader/` with three small modules — `fetchOptional` (404-tolerant fetch), `mergeManifestDefaults` (shallow-merge user manifest with code defaults), and `loadBook` (orchestrate parallel fetches of manifest/pages/glossary/notes/scenarios/contents/legal-refs/overlays). Move v0.6.1-specific schema conversion (`convertOverlay` + raw schema types) from `src/books/de-eu-vat/` to `src/atlas-core/overlay/`. Delete the entire `src/books/de-eu-vat/` directory (8 source files). Materialize a generic bundle at `public/book/` — manifest.json + data/*.json + images/ + overlays/.

**Tech Stack:** React 19, TypeScript 5.8, Vite 8, Vitest 4 + React Testing Library 16, framer-motion 12, lucide-react. **No new dependencies.**

**Spec source:** [`docs/superpowers/specs/2026-05-17-spec-d-bundle-driven-design.md`](../specs/2026-05-17-spec-d-bundle-driven-design.md)
**Companion contract:** [`docs/book-bundle-contract.md`](../../book-bundle-contract.md)

---

## Prerequisite — Merge Spec C into main

Spec D builds on Spec C (worktree branch `worktree-spec-c-assets` at `72d38f3`). Before running this plan:

```bash
# From repo root /Users/qiouyang/Documents/Claude/Codes/flipping-book
git merge --ff-only worktree-spec-c-assets
git worktree remove --force /Users/qiouyang/Documents/Claude/Codes/flipping-book/.claude/worktrees/spec-c-assets
git branch -d worktree-spec-c-assets
```

Verify main HEAD = `72d38f3` (or descendant). Now create Spec D worktree:

```bash
git -C /Users/qiouyang/Documents/Claude/Codes/flipping-book \
    worktree add /Users/qiouyang/Documents/Claude/Codes/flipping-book/.claude/worktrees/spec-d-bundle \
    -b claude/spec-d-bundle
cd /Users/qiouyang/Documents/Claude/Codes/flipping-book/.claude/worktrees/spec-d-bundle
npm install
```

All subsequent commands run inside this worktree.

---

## File Plan

**Create:**

```
src/atlas-core/loader/
  fetchOptional.ts
  mergeManifestDefaults.ts
  loadBook.ts
  index.ts
  __tests__/
    fetchOptional.test.ts
    mergeManifestDefaults.test.ts
    loadBook.test.ts
    fixtures/
      minimal-manifest.json
      full-manifest.json
      partial-manifest.json
      sample-pages.json
      sample-glossary.json

src/atlas-core/overlay/                            ← directory already exists
  convertOverlay.ts                                ← moved from books/de-eu-vat/converter.ts
  rawSchema.ts                                     ← moved from books/de-eu-vat/types.ts
  __tests__/
    convertOverlay.test.ts                         ← moved from books/de-eu-vat/__tests__/
    fixtures/
      sample-overlay.json                          ← moved

scripts/
  export-glossary-to-json.mjs                      ← one-time, deleted post-run

public/book/                                       ← new generic bundle directory
  manifest.json
  data/
    pages.json
    glossary.json
  images/                                          ← 22 PNGs (moved from public/books/de-eu-vat/v0.6.1/)
  overlays/                                        ← 22 JSON (moved)
```

**Modify:**

```
src/app/App.tsx                                    ← loadDeEuVat → loadBook
src/app/routes/GlossaryRoute.tsx                   ← same
```

**Delete (after content has been migrated):**

```
src/books/                                         ← entire tree
  de-eu-vat/
    loader.ts
    manifest-builder.ts
    converter.ts                                   ← moved
    types.ts                                       ← moved
    glossary.ts                                    ← exported to JSON
    index.ts
    __tests__/                                     ← all loader/manifest-builder tests, converter test moved
public/books/                                      ← entire tree (old v0.6.1 location)
scripts/export-glossary-to-json.mjs                ← post-run
```

---

## Conventions

- **Test runner:** `npm test` (Vitest, once). Single file: `npx vitest run <path>`.
- **Lint:** `npm run lint`. Must not regress beyond baseline 40.
- **Dev server:** `npm run dev`.
- **Commits:** Conventional Commits (`feat:` / `fix:` / `chore:` / `refactor:` / `test:`).
- **TDD:** Every primitive starts with a failing test.
- **No new deps:** Vite-only fetch, no MSW, no zod.
- **Coordinates:** Pixel-to-percentage conversion happens at converter boundary only (already in `convertOverlay`).

---

# Phase 1 — Loader Primitives

## Task 1.1: `fetchOptional`

**Files:**
- Create: `src/atlas-core/loader/fetchOptional.ts`
- Create: `src/atlas-core/loader/__tests__/fetchOptional.test.ts`

- [ ] **Step 1: Failing test**

Create `src/atlas-core/loader/__tests__/fetchOptional.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchOptional } from '../fetchOptional';

describe('fetchOptional', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns parsed JSON array on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ a: 1 }]), { status: 200 }),
    );
    const out = await fetchOptional<{ a: number }>('/x');
    expect(out).toEqual([{ a: 1 }]);
  });

  it('returns [] on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }));
    expect(await fetchOptional('/missing')).toEqual([]);
  });

  it('returns [] and warns on 500', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await fetchOptional('/broken')).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('returns [] when JSON is not an array', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ not: 'array' }), { status: 200 }),
    );
    expect(await fetchOptional('/wrong-shape')).toEqual([]);
  });

  it('returns [] and warns on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await fetchOptional('/offline')).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-core/loader/__tests__/fetchOptional.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement**

Create `src/atlas-core/loader/fetchOptional.ts`:

```ts
/**
 * Tolerant fetch for optional bundle JSON files.
 *
 * - 200 + valid array → parsed array
 * - 200 + non-array → [] (no throw; bundle author error, log nothing)
 * - 404 → [] (file simply absent)
 * - other non-OK → [] + console.warn
 * - network/JSON-parse error → [] + console.warn
 */
export async function fetchOptional<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    if (res.status === 404) return [];
    if (!res.ok) {
      console.warn(`fetchOptional: ${url} returned ${res.status}, using []`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? (data as T[]) : [];
  } catch (e) {
    console.warn(`fetchOptional: ${url} threw, using []`, e);
    return [];
  }
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-core/loader/__tests__/fetchOptional.test.ts` → 5 passed.
`npm test` → existing 304 + 5 = 309 passing.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-core/loader/fetchOptional.ts src/atlas-core/loader/__tests__/fetchOptional.test.ts
git commit -m "feat(loader): add fetchOptional with 404 + error fallback to []"
```

---

## Task 1.2: `mergeManifestDefaults`

**Files:**
- Create: `src/atlas-core/loader/mergeManifestDefaults.ts`
- Create: `src/atlas-core/loader/__tests__/mergeManifestDefaults.test.ts`

- [ ] **Step 1: Failing test**

Create `src/atlas-core/loader/__tests__/mergeManifestDefaults.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mergeManifestDefaults } from '../mergeManifestDefaults';

const REQUIRED = {
  schemaVersion: '1.0' as const,
  bookId: 'b-1',
  slug: 'b',
  title: { 'zh-CN': 'T' },
  version: '0.1.0',
};

describe('mergeManifestDefaults', () => {
  it('passes through required fields', () => {
    const m = mergeManifestDefaults({ ...REQUIRED });
    expect(m.bookId).toBe('b-1');
    expect(m.slug).toBe('b');
    expect(m.title['zh-CN']).toBe('T');
    expect(m.version).toBe('0.1.0');
  });

  it('throws when schemaVersion is missing', () => {
    expect(() => mergeManifestDefaults({ ...REQUIRED, schemaVersion: undefined } as never))
      .toThrow(/schemaVersion/);
  });

  it('throws when bookId is missing', () => {
    expect(() => mergeManifestDefaults({ ...REQUIRED, bookId: undefined } as never))
      .toThrow(/bookId/);
  });

  it('throws when slug is missing', () => {
    expect(() => mergeManifestDefaults({ ...REQUIRED, slug: undefined } as never))
      .toThrow(/slug/);
  });

  it('throws when title is missing', () => {
    expect(() => mergeManifestDefaults({ ...REQUIRED, title: undefined } as never))
      .toThrow(/title/);
  });

  it('throws when version is missing', () => {
    expect(() => mergeManifestDefaults({ ...REQUIRED, version: undefined } as never))
      .toThrow(/version/);
  });

  it('fills default reader when omitted', () => {
    const m = mergeManifestDefaults({ ...REQUIRED });
    expect(m.reader.defaultZoom).toBe('fit-page');
    expect(m.reader.enableKeyboardNavigation).toBe(true);
  });

  it('shallow-merges reader: overrides specified keys, defaults others', () => {
    const m = mergeManifestDefaults({
      ...REQUIRED,
      reader: { defaultZoom: 'fit-width' } as never,
    });
    expect(m.reader.defaultZoom).toBe('fit-width');
    expect(m.reader.enableKeyboardNavigation).toBe(true); // still default
  });

  it('shallow-merges featureFlags', () => {
    const m = mergeManifestDefaults({
      ...REQUIRED,
      featureFlags: { notesDrawer: true } as never,
    });
    expect(m.featureFlags?.notesDrawer).toBe(true);
    expect(m.featureFlags?.comments).toBe(true); // still default
  });

  it('shallow-merges navigation', () => {
    const m = mergeManifestDefaults({
      ...REQUIRED,
      navigation: { showTopBar: false } as never,
    });
    expect(m.navigation?.showTopBar).toBe(false);
    expect(m.navigation?.showBottomBar).toBe(true); // still default
  });

  it('uses default supportedLocales when omitted', () => {
    const m = mergeManifestDefaults({ ...REQUIRED });
    expect(m.supportedLocales).toEqual(['zh-CN']);
  });

  it('respects bundle-provided supportedLocales', () => {
    const m = mergeManifestDefaults({ ...REQUIRED, supportedLocales: ['zh-CN', 'en'] });
    expect(m.supportedLocales).toEqual(['zh-CN', 'en']);
  });

  it('initializes pages and readingOrder as empty (filled later)', () => {
    const m = mergeManifestDefaults({ ...REQUIRED });
    expect(m.pages).toEqual([]);
    expect(m.readingOrder).toEqual([]);
  });

  it('uses default registries pointing at /book/', () => {
    const m = mergeManifestDefaults({ ...REQUIRED });
    expect(m.registries.imageAssets).toBe('/book/images');
    expect(m.registries.overlays).toBe('/book/overlays');
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-core/loader/__tests__/mergeManifestDefaults.test.ts` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-core/loader/mergeManifestDefaults.ts`:

```ts
import type {
  BookManifest,
  FeatureFlags,
  BookNavigationConfig,
  RegistryRefs,
} from '../types/manifest';
import type { ReaderConfig } from '../types/page';

const DEFAULT_READER: ReaderConfig = {
  defaultMode: 'auto',
  allowModeSwitch: false,
  transition: 'fade',
  enableKeyboardNavigation: true,
  enableSwipeNavigation: true,
  enableProgressBar: true,
  enableTableOfContents: true,
  defaultZoom: 'fit-page',
  spreadBehavior: {
    desktopDefault: 'single',
    mobileDefault: 'single',
    spreadPageAdvance: 'by-page',
    keyboard: { arrowLeft: 'previous', arrowRight: 'next' },
    clickZones: { enabled: false, leftEdgePercent: 0, rightEdgePercent: 0 },
  },
};

const DEFAULT_NAVIGATION: BookNavigationConfig = {
  showTopBar: true,
  showBottomBar: true,
  showPageNumbers: true,
  showBreadcrumbs: false,
  showThumbnailStrip: false,
  showTableOfContentsButton: true,
};

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  glossaryTooltips: true,
  notesDrawer: false,
  comments: true,
  debugOverlay: true,
  pageFlip: false,
  search: false,
  exportComments: true,
};

const DEFAULT_REGISTRIES: RegistryRefs = {
  imageAssets: '/book/images',
  overlays: '/book/overlays',
  glossary: '/book/data/glossary.json',
  pages: '/book/data/pages.json',
};

function required<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Manifest is missing required field: ${name}`);
  }
  return value;
}

/**
 * Merges a partial raw manifest with code defaults.
 * - Required fields (schemaVersion, bookId, slug, title, version) → throw if missing
 * - Optional top-level (subtitle, defaultLocale, ...) → fall back to default
 * - reader / navigation / featureFlags → shallow merge (1 level)
 * - pages / readingOrder → initialized to [] (filled by loader after pages.json fetch)
 */
export function mergeManifestDefaults(raw: Partial<BookManifest>): BookManifest {
  return {
    schemaVersion: required(raw.schemaVersion, 'schemaVersion'),
    bookId: required(raw.bookId, 'bookId'),
    slug: required(raw.slug, 'slug'),
    title: required(raw.title, 'title'),
    version: required(raw.version, 'version'),
    subtitle: raw.subtitle,
    defaultLocale: raw.defaultLocale ?? 'zh-CN',
    supportedLocales: raw.supportedLocales ?? ['zh-CN'],
    visualSystem: raw.visualSystem ?? 'VAT_ATLAS_MAGAZINE_V2',
    reader: { ...DEFAULT_READER, ...(raw.reader ?? {}) },
    navigation: { ...DEFAULT_NAVIGATION, ...(raw.navigation ?? {}) },
    featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...(raw.featureFlags ?? {}) },
    pages: [],
    readingOrder: [],
    registries: { ...DEFAULT_REGISTRIES, ...(raw.registries ?? {}) },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-core/loader/__tests__/mergeManifestDefaults.test.ts` → 14 passed.
`npm test` → 323 passing.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-core/loader/mergeManifestDefaults.ts src/atlas-core/loader/__tests__/mergeManifestDefaults.test.ts
git commit -m "feat(loader): add mergeManifestDefaults with shallow merge of reader/nav/flags"
```

---

# Phase 2 — Move Schema Code to atlas-core

## Task 2.1: Move converter + rawSchema to atlas-core/overlay/

**Files:**
- Create: `src/atlas-core/overlay/convertOverlay.ts` (content from `src/books/de-eu-vat/converter.ts`)
- Create: `src/atlas-core/overlay/rawSchema.ts` (content from `src/books/de-eu-vat/types.ts`)
- Create: `src/atlas-core/overlay/__tests__/convertOverlay.test.ts` (moved)
- Create: `src/atlas-core/overlay/__tests__/fixtures/sample-overlay.json` (moved)
- Modify: `src/books/de-eu-vat/loader.ts` (update import paths)
- Modify: `src/books/de-eu-vat/manifest-builder.ts` (no consumer change expected, but verify)
- Delete: `src/books/de-eu-vat/converter.ts`, `types.ts`, `__tests__/converter.test.ts`, `__tests__/fixtures/sample-overlay.json`

The deletion of the old paths happens in this same task to keep the change atomic.

- [ ] **Step 1: Copy converter.ts contents to new file**

```bash
mkdir -p src/atlas-core/overlay/__tests__/fixtures
cp src/books/de-eu-vat/converter.ts src/atlas-core/overlay/convertOverlay.ts
cp src/books/de-eu-vat/types.ts src/atlas-core/overlay/rawSchema.ts
cp src/books/de-eu-vat/__tests__/converter.test.ts src/atlas-core/overlay/__tests__/convertOverlay.test.ts
cp src/books/de-eu-vat/__tests__/fixtures/sample-overlay.json src/atlas-core/overlay/__tests__/fixtures/sample-overlay.json
```

- [ ] **Step 2: Update import paths inside new files**

In `src/atlas-core/overlay/convertOverlay.ts`, change:
```ts
import type { RawBBox, RawOverlay, RawRegion } from './types';
```
to:
```ts
import type { RawBBox, RawOverlay, RawRegion } from './rawSchema';
```

Also change other relative imports — verify nothing imports from `../../atlas-core/...` (they should already be at `../../...` shape that still resolves). Run:
```bash
grep -n "from '" src/atlas-core/overlay/convertOverlay.ts
```
All `../../atlas-core/types/...` paths must now be `../types/...` (one fewer `..`).

Likely replacements (verify each):
- `../../atlas-core/types/regions` → `../types/regions`
- `../../atlas-core/types/overlay` → `../types/overlay`
- `../../atlas-core/types/page` → `../types/page`
- `./types` → `./rawSchema`

Apply same import-fixing in `src/atlas-core/overlay/rawSchema.ts` (likely no external imports — it's pure types).

- [ ] **Step 3: Update import paths inside test file**

In `src/atlas-core/overlay/__tests__/convertOverlay.test.ts`, change:
- `'./fixtures/sample-overlay.json'` → unchanged (relative to test)
- `'../converter'` → `'../convertOverlay'`
- `'../types'` → `'../rawSchema'`

- [ ] **Step 4: Update consumers in books/de-eu-vat/**

In `src/books/de-eu-vat/loader.ts`, change:
```ts
import { convertOverlay } from './converter';
import type { RawOverlay, RawPageCatalog } from './types';
```
to:
```ts
import { convertOverlay } from '../../atlas-core/overlay/convertOverlay';
import type { RawOverlay, RawPageCatalog } from '../../atlas-core/overlay/rawSchema';
```

In `src/books/de-eu-vat/manifest-builder.ts`:
```ts
import type { RawPageCatalog, RawPageEntry } from './types';
```
to:
```ts
import type { RawPageCatalog, RawPageEntry } from '../../atlas-core/overlay/rawSchema';
```

- [ ] **Step 5: Update test consumers in books/de-eu-vat/__tests__/**

In `src/books/de-eu-vat/__tests__/loader.test.ts` and `manifest-builder.test.ts`, similarly update any `from '../types'` or `from '../converter'` to the new paths.

- [ ] **Step 6: Delete the old files**

```bash
rm src/books/de-eu-vat/converter.ts
rm src/books/de-eu-vat/types.ts
rm src/books/de-eu-vat/__tests__/converter.test.ts
rm src/books/de-eu-vat/__tests__/fixtures/sample-overlay.json
```

- [ ] **Step 7: Tests pass**

`npm test` → 323 passing (converter test moved, not added/removed).
`npm run lint` → no new errors.

- [ ] **Step 8: Commit**

```bash
git add -A src/atlas-core/overlay src/books/de-eu-vat
git commit -m "refactor(overlay): move v0.6.1 converter+rawSchema to atlas-core/overlay"
```

---

# Phase 3 — `loadBook`

## Task 3.1: Test fixtures

**Files:**
- Create: `src/atlas-core/loader/__tests__/fixtures/minimal-manifest.json`
- Create: `src/atlas-core/loader/__tests__/fixtures/full-manifest.json`
- Create: `src/atlas-core/loader/__tests__/fixtures/sample-pages.json`
- Create: `src/atlas-core/loader/__tests__/fixtures/sample-glossary.json`

- [ ] **Step 1: minimal-manifest.json (5 required fields only)**

```json
{
  "schemaVersion": "1.0",
  "bookId": "test-atlas",
  "slug": "test",
  "title": { "zh-CN": "测试图册" },
  "version": "0.1.0"
}
```

- [ ] **Step 2: full-manifest.json (all fields, partial overrides)**

```json
{
  "schemaVersion": "1.0",
  "bookId": "de-eu-vat-atlas",
  "slug": "de-eu-vat",
  "title": { "zh-CN": "德国 / 欧盟 VAT 财务速查图册" },
  "subtitle": { "zh-CN": "测试副标题" },
  "version": "0.6.1",
  "defaultLocale": "zh-CN",
  "supportedLocales": ["zh-CN"],
  "visualSystem": "VAT_ATLAS_MAGAZINE_V2",
  "reader": { "defaultZoom": "fit-width" },
  "navigation": { "showTopBar": true, "showBottomBar": false },
  "featureFlags": { "comments": true, "debugOverlay": true, "notesDrawer": false }
}
```

- [ ] **Step 3: sample-pages.json (2 pages)**

```json
[
  {
    "sectionCode": "TOC",
    "pageId": "toc",
    "title": "图册导航",
    "imageFile": "TOC_current_final.png",
    "canvas": { "width": 1086, "height": 1448 }
  },
  {
    "sectionCode": "01",
    "pageId": "01-vat-framework",
    "title": "VAT 判断总框架",
    "imageFile": "01_current_final.png",
    "canvas": { "width": 1086, "height": 1448 }
  }
]
```

- [ ] **Step 4: sample-glossary.json (1 term)**

```json
[
  {
    "termId": "werklieferung",
    "zh": "加工供货",
    "original": "Werklieferung",
    "abbreviation": "WL",
    "category": "goods",
    "shortDefinition": "承包人提供主材并加工后交付,视为货物供应。",
    "firstMentionFormat": "加工供货 (Werklieferung)"
  }
]
```

- [ ] **Step 5: Verify fixtures parse**

```bash
node -e "const f=require('./src/atlas-core/loader/__tests__/fixtures/'); ['minimal-manifest.json','full-manifest.json','sample-pages.json','sample-glossary.json'].forEach(n=>console.log(n, JSON.parse(require('fs').readFileSync('./src/atlas-core/loader/__tests__/fixtures/'+n,'utf8')) ? 'ok':'fail'))"
```

Expected: 4 `ok` lines.

- [ ] **Step 6: Commit (interim — fixtures only)**

```bash
git add src/atlas-core/loader/__tests__/fixtures
git commit -m "test(loader): add test fixtures for loadBook"
```

---

## Task 3.2: `loadBook` implementation

**Files:**
- Create: `src/atlas-core/loader/loadBook.ts`
- Create: `src/atlas-core/loader/__tests__/loadBook.test.ts`
- Create: `src/atlas-core/loader/index.ts`

- [ ] **Step 1: Failing test**

Create `src/atlas-core/loader/__tests__/loadBook.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import minimalManifest from './fixtures/minimal-manifest.json';
import fullManifest from './fixtures/full-manifest.json';
import samplePages from './fixtures/sample-pages.json';
import sampleGlossary from './fixtures/sample-glossary.json';
import sampleOverlay from '../../overlay/__tests__/fixtures/sample-overlay.json';
import { loadBook, __resetCache } from '../loadBook';

const BASE = '/book';

type FetchSpec = {
  manifest?: object | null; // null = 404, undefined = full
  manifestStatus?: number;
  pages?: object | null;
  pagesStatus?: number;
  glossary?: object | null;
  notes?: object | null;
  scenarios?: object | null;
  contents?: object | null;
  legalRefs?: object | null;
  overlayMissing?: string[]; // pageIds whose overlay 404s
};

function setupFetchMock(spec: FetchSpec = {}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    const json = (body: object | null | undefined, fallback: object) =>
      new Response(JSON.stringify(body ?? fallback), { status: 200 });
    const r404 = () => new Response('', { status: 404 });

    if (url.endsWith('/manifest.json')) {
      if (spec.manifest === null) return r404();
      if (spec.manifestStatus && spec.manifestStatus !== 200)
        return new Response('', { status: spec.manifestStatus });
      return json(spec.manifest, fullManifest);
    }
    if (url.endsWith('/data/pages.json')) {
      if (spec.pages === null) return r404();
      return json(spec.pages, samplePages);
    }
    if (url.endsWith('/data/glossary.json')) {
      return spec.glossary === null ? r404() : json(spec.glossary, sampleGlossary);
    }
    if (url.endsWith('/data/notes.json')) {
      return spec.notes === null ? r404() : json(spec.notes, []);
    }
    if (url.endsWith('/data/scenarios.json')) {
      return spec.scenarios === null ? r404() : json(spec.scenarios, []);
    }
    if (url.endsWith('/data/contents.json')) {
      return spec.contents === null ? r404() : json(spec.contents, []);
    }
    if (url.endsWith('/data/legal-refs.json')) {
      return spec.legalRefs === null ? r404() : json(spec.legalRefs, []);
    }
    if (url.includes('/overlays/')) {
      const file = url.split('/').pop() ?? '';
      const pageId = file.replace('_interactive_overlay_v0.6.1.json', '');
      if (spec.overlayMissing?.includes(pageId)) return r404();
      const overlay = { ...sampleOverlay, pageId, sectionCode: pageId.split('-')[0].toUpperCase() };
      return new Response(JSON.stringify(overlay), { status: 200 });
    }
    return new Response('', { status: 404 });
  });
}

describe('loadBook', () => {
  beforeEach(() => __resetCache());
  afterEach(() => vi.restoreAllMocks());

  it('returns LoadedBook with all sections populated when full bundle is served', async () => {
    setupFetchMock();
    const data = await loadBook(BASE);
    expect(data.manifest.bookId).toBe('de-eu-vat-atlas');
    expect(data.manifest.readingOrder).toEqual(['toc', '01-vat-framework']);
    expect(data.images).toHaveLength(2);
    expect(data.overlays).toHaveLength(2);
    expect(data.glossary).toHaveLength(1);
    expect(data.notes).toEqual([]);
    expect(data.scenarios).toEqual([]);
    expect(data.contents).toEqual([]);
    expect(data.legalRefs).toEqual([]);
  });

  it('applies manifest defaults when only minimal fields are provided', async () => {
    setupFetchMock({ manifest: minimalManifest });
    const data = await loadBook(BASE);
    expect(data.manifest.featureFlags?.comments).toBe(true);
    expect(data.manifest.reader.defaultZoom).toBe('fit-page');
  });

  it('shallow-merges partial reader override', async () => {
    setupFetchMock({ manifest: fullManifest });
    const data = await loadBook(BASE);
    expect(data.manifest.reader.defaultZoom).toBe('fit-width'); // from bundle
    expect(data.manifest.reader.enableKeyboardNavigation).toBe(true); // from default
  });

  it('throws when manifest.json returns 404', async () => {
    setupFetchMock({ manifest: null });
    await expect(loadBook(BASE)).rejects.toThrow(/manifest/);
  });

  it('throws when manifest is missing a required field', async () => {
    setupFetchMock({ manifest: { schemaVersion: '1.0' } }); // missing bookId etc.
    await expect(loadBook(BASE)).rejects.toThrow(/bookId|slug|title|version/);
  });

  it('throws when pages.json is empty', async () => {
    setupFetchMock({ pages: [] });
    await expect(loadBook(BASE)).rejects.toThrow(/pages/);
  });

  it('falls back to [] for missing glossary.json', async () => {
    setupFetchMock({ glossary: null });
    const data = await loadBook(BASE);
    expect(data.glossary).toEqual([]);
  });

  it('falls back to empty overlay for a single missing overlay JSON', async () => {
    setupFetchMock({ overlayMissing: ['01-vat-framework'] });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const data = await loadBook(BASE);
    const broken = data.overlays.find((o) => o.overlayId === '01-overlay-v06');
    expect(broken?.regions).toEqual([]);
    expect(broken?.hotspots).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('caches the result and does not refetch on repeat call with same baseUrl', async () => {
    const fetchMock = setupFetchMock();
    await loadBook(BASE);
    await loadBook(BASE);
    const manifestCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).endsWith('/manifest.json'),
    );
    expect(manifestCalls).toHaveLength(1);
  });

  it('rebuilds cache when baseUrl differs', async () => {
    const fetchMock = setupFetchMock();
    await loadBook('/book');
    await loadBook('/other-book');
    const manifestCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).endsWith('/manifest.json'),
    );
    expect(manifestCalls).toHaveLength(2);
  });

  it('per-page notes / contentId / scenarioIds / legalRefIds are propagated to PageManifest', async () => {
    setupFetchMock({
      pages: [
        {
          sectionCode: '01',
          pageId: '01-vat-framework',
          title: 'P1',
          imageFile: 'p1.png',
          canvas: { width: 1086, height: 1448 },
          notes: ['n1', 'n2'],
          contentId: 'c1',
          scenarioIds: ['s1'],
          legalRefIds: ['§ 1'],
        },
      ],
    });
    const data = await loadBook(BASE);
    const page = data.manifest.pages[0];
    expect(page.notes?.noteIds).toEqual(['n1', 'n2']);
    expect(page.content?.contentId).toBe('c1');
    expect(page.scenarioIds).toEqual(['s1']);
    expect(page.legalRefIds).toEqual(['§ 1']);
  });

  it('builds image src under baseUrl/images/', async () => {
    setupFetchMock();
    const data = await loadBook(BASE);
    expect(data.images[0].src).toBe('/book/images/TOC_current_final.png');
    expect(data.images[1].src).toBe('/book/images/01_current_final.png');
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-core/loader/__tests__/loadBook.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement loadBook**

Create `src/atlas-core/loader/loadBook.ts`:

```ts
import type { BookManifest } from '../types/manifest';
import type { ImageAsset } from '../types/image';
import type { PageManifest } from '../types/page';
import type { RichOverlayConfig } from '../types/regions';
import type { GlossaryEntry } from '../types/glossary';
import type { AtlasNote } from '../types/notes';
import type { VatScenario } from '../types/scenario';
import type { PageContent } from '../types/content';
import type { LegalRef } from '../types/legal';
import type { RawOverlay, RawPageEntry } from '../overlay/rawSchema';
import { convertOverlay } from '../overlay/convertOverlay';
import { fetchOptional } from './fetchOptional';
import { mergeManifestDefaults } from './mergeManifestDefaults';

export type LoadedBook = {
  manifest: BookManifest;
  images: ImageAsset[];
  overlays: RichOverlayConfig[];
  glossary: GlossaryEntry[];
  notes: AtlasNote[];
  scenarios: VatScenario[];
  contents: PageContent[];
  legalRefs: LegalRef[];
};

const DEFAULT_BASE = '/book';

let cached: { base: string; promise: Promise<LoadedBook> } | null = null;

export function __resetCache(): void {
  cached = null;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return (await res.json()) as T;
}

function basename(p: string): string {
  return p.split('/').pop() ?? p;
}

function buildImageAsset(entry: RawPageEntry, base: string): ImageAsset {
  return {
    assetId: `${entry.sectionCode}-current-final-v06`,
    version: '0.6.1',
    src: `${base}/images/${basename(entry.imageFile)}`,
    width: entry.canvas.width,
    height: entry.canvas.height,
    format: 'png',
    visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
    pageFormat: 'single',
    sizePreset: 'custom',
    alt: { 'zh-CN': entry.title },
  };
}

function buildPageManifest(entry: RawPageEntry, pageNumber: number): PageManifest {
  return {
    pageId: entry.pageId,
    slug: `/page/${entry.pageId}`,
    type: 'imageOverlay',
    sectionCode: entry.sectionCode,
    pageNumber,
    title: { 'zh-CN': entry.title },
    subtitle: entry.subtitle ? { 'zh-CN': entry.subtitle } : undefined,
    layout: {
      mode: 'single',
      format: 'custom',
      size: {
        preset: 'custom',
        width: entry.canvas.width,
        height: entry.canvas.height,
        aspectRatioLabel: '3:4 portrait',
      },
      background: 'image',
    },
    image: { assetId: `${entry.sectionCode}-current-final-v06`, version: '0.6.1' },
    overlay: {
      overlayId: `${entry.sectionCode}-overlay-v06`,
      imageAssetId: `${entry.sectionCode}-current-final-v06`,
      imageVersion: '0.6.1',
    },
    notes: (entry as RawPageEntry & { notes?: string[] }).notes
      ? { enabled: true, noteIds: (entry as RawPageEntry & { notes?: string[] }).notes }
      : undefined,
    content: (entry as RawPageEntry & { contentId?: string }).contentId
      ? { contentId: (entry as RawPageEntry & { contentId?: string }).contentId! }
      : undefined,
    scenarioIds: (entry as RawPageEntry & { scenarioIds?: string[] }).scenarioIds,
    legalRefIds: (entry as RawPageEntry & { legalRefIds?: string[] }).legalRefIds,
  };
}

function emptyOverlayFor(sectionCode: string): RichOverlayConfig {
  return {
    overlayId: `${sectionCode}-overlay-v06`,
    imageAssetId: `${sectionCode}-current-final-v06`,
    imageVersion: '0.6.1',
    coordinateSystem: 'percentage',
    canvas: { width: 1086, height: 1448 },
    hotspots: [],
    regions: [],
  };
}

async function loadOneOverlay(base: string, pageId: string, sectionCode: string): Promise<RichOverlayConfig> {
  const url = `${base}/overlays/${pageId}_interactive_overlay_v0.6.1.json`;
  try {
    const raw = await fetchJSON<RawOverlay>(url);
    return convertOverlay(raw);
  } catch (err) {
    console.warn(`overlay load failed for ${pageId}, using empty fallback:`, err);
    return emptyOverlayFor(sectionCode);
  }
}

async function load(base: string): Promise<LoadedBook> {
  // 1) Fetch manifest first (required)
  const rawManifest = await fetchJSON<Partial<BookManifest>>(`${base}/manifest.json`);
  const manifestSkeleton = mergeManifestDefaults(rawManifest);

  // 2) Fetch pages + optional data files in parallel
  const [pages, glossary, notes, scenarios, contents, legalRefs] = await Promise.all([
    fetchJSON<RawPageEntry[]>(`${base}/data/pages.json`),
    fetchOptional<GlossaryEntry>(`${base}/data/glossary.json`),
    fetchOptional<AtlasNote>(`${base}/data/notes.json`),
    fetchOptional<VatScenario>(`${base}/data/scenarios.json`),
    fetchOptional<PageContent>(`${base}/data/contents.json`),
    fetchOptional<LegalRef>(`${base}/data/legal-refs.json`),
  ]);

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(`Bundle has no pages: ${base}/data/pages.json is empty or invalid`);
  }

  // 3) Build derived structures
  const pageManifests = pages.map((entry, i) => buildPageManifest(entry, i + 1));
  const images = pages.map((entry) => buildImageAsset(entry, base));

  // 4) Fetch overlays in parallel
  const overlays = await Promise.all(
    pages.map((entry) => loadOneOverlay(base, entry.pageId, entry.sectionCode)),
  );

  // 5) Finalize manifest
  const manifest: BookManifest = {
    ...manifestSkeleton,
    pages: pageManifests,
    readingOrder: pages.map((entry) => entry.pageId),
  };

  return { manifest, images, overlays, glossary, notes, scenarios, contents, legalRefs };
}

export function loadBook(base: string = DEFAULT_BASE): Promise<LoadedBook> {
  if (cached && cached.base === base) return cached.promise;
  const promise = load(base);
  cached = { base, promise };
  return promise;
}
```

- [ ] **Step 4: Create barrel**

Create `src/atlas-core/loader/index.ts`:

```ts
export { loadBook, __resetCache, type LoadedBook } from './loadBook';
export { fetchOptional } from './fetchOptional';
export { mergeManifestDefaults } from './mergeManifestDefaults';
```

- [ ] **Step 5: Tests pass**

`npx vitest run src/atlas-core/loader/__tests__/loadBook.test.ts` → 12 passed.
`npm test` → 335 passing.

If TypeScript complains about the type-cast pattern `(entry as RawPageEntry & { notes?: string[] })`:
- The cleanest fix is to extend `RawPageEntry` in `src/atlas-core/overlay/rawSchema.ts` with the optional reference fields:

```ts
export type RawPageEntry = {
  sectionCode: string;
  pageId: string;
  title: string;
  subtitle?: string;
  imageFile: string;
  canvas: { width: number; height: number };
  sizeStatus?: string;
  notes?: string[];           // per-page note ids
  contentId?: string;         // per-page content id
  scenarioIds?: string[];     // per-page scenario ids
  legalRefIds?: string[];     // per-page legal ref ids
};
```

If you make this change, simplify `buildPageManifest` to drop the casts:
```ts
notes: entry.notes ? { enabled: true, noteIds: entry.notes } : undefined,
content: entry.contentId ? { contentId: entry.contentId } : undefined,
scenarioIds: entry.scenarioIds,
legalRefIds: entry.legalRefIds,
```

Re-run tests.

- [ ] **Step 6: Commit**

```bash
git add src/atlas-core/loader src/atlas-core/overlay/rawSchema.ts
git commit -m "feat(loader): add loadBook with manifest + 5 data files + overlay parallel fetch"
```

---

# Phase 4 — Materialize `public/book/`

## Task 4.1: Export glossary.ts → glossary.json

**Files:**
- Create: `scripts/export-glossary-to-json.mjs` (one-time, deleted after)
- Create: `public/book/data/glossary.json`

- [ ] **Step 1: Write the script**

Create `scripts/export-glossary-to-json.mjs`:

```js
#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { glossary } from '../src/books/de-eu-vat/glossary.ts';

const outPath = 'public/book/data/glossary.json';
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(glossary, null, 2) + '\n');
console.log(`Wrote ${glossary.length} glossary entries → ${outPath}`);
```

- [ ] **Step 2: Run the script**

```bash
node --experimental-strip-types --no-warnings scripts/export-glossary-to-json.mjs
```

Expected: `Wrote N glossary entries → public/book/data/glossary.json` (N depends on current glossary.ts length, likely 70+).

If Node version doesn't support `--experimental-strip-types`, fallback: temporarily rename to `.ts`, compile inline with esbuild, or just read the TS via `npx tsx scripts/export-glossary-to-json.mjs` (if `tsx` is in devDeps; check `package.json`).

- [ ] **Step 3: Verify**

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('public/book/data/glossary.json','utf8')).length)"
```

Expected: a positive integer (e.g. 70+).

- [ ] **Step 4: Commit (interim — glossary JSON only)**

```bash
git add public/book/data/glossary.json scripts/export-glossary-to-json.mjs
git commit -m "chore(assets): export glossary.ts to public/book/data/glossary.json"
```

The `scripts/export-glossary-to-json.mjs` file is committed so the migration is reproducible. It will be deleted in Task 5.3.

---

## Task 4.2: Create manifest.json and pages.json, copy images/overlays

**Files:**
- Create: `public/book/manifest.json`
- Create: `public/book/data/pages.json`
- Create: `public/book/images/*.png` (22, copied)
- Create: `public/book/overlays/*.json` (22, copied)

- [ ] **Step 1: Write manifest.json**

Create `public/book/manifest.json`:

```json
{
  "schemaVersion": "1.0",
  "bookId": "de-eu-vat-atlas",
  "slug": "de-eu-vat",
  "title": { "zh-CN": "德国 / 欧盟 VAT 财务速查图册" },
  "subtitle": { "zh-CN": "常用 B2B 场景 · 法规提示 · 可点击 Drill-down 导览" },
  "version": "0.6.1",
  "defaultLocale": "zh-CN",
  "supportedLocales": ["zh-CN"],
  "visualSystem": "VAT_ATLAS_MAGAZINE_V2",
  "featureFlags": {
    "comments": true,
    "debugOverlay": true,
    "notesDrawer": false
  }
}
```

(All omitted fields will be filled by `mergeManifestDefaults` at runtime.)

- [ ] **Step 2: Copy + rename pages catalog**

```bash
cp public/books/de-eu-vat/v0.6.1/data/page_catalog.json public/book/data/pages.json
```

Verify it parses and has 22 entries:
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('public/book/data/pages.json','utf8')).length)"
```
Expected: `22`.

- [ ] **Step 3: Copy images and overlays**

```bash
mkdir -p public/book/images public/book/overlays
cp public/books/de-eu-vat/v0.6.1/images/*.png public/book/images/
cp public/books/de-eu-vat/v0.6.1/overlays/*.json public/book/overlays/
```

Verify counts:
```bash
ls public/book/images | wc -l       # 22
ls public/book/overlays | wc -l     # 22
```

- [ ] **Step 4: Tests still pass**

`npm test` → 335 passing (loader tests use fixtures, not public assets, so they're unaffected; Spec C's `loadDeEuVat` tests still pass because they look at `/books/de-eu-vat/v0.6.1/` which still exists).

- [ ] **Step 5: Commit**

```bash
git add public/book
git commit -m "chore(assets): materialize public/book/ generic bundle (manifest + pages + images + overlays)"
```

---

# Phase 5 — App Integration + Cleanup

## Task 5.1: Update App.tsx and GlossaryRoute.tsx

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/routes/GlossaryRoute.tsx`

- [ ] **Step 1: Rewrite App.tsx**

Replace `src/app/App.tsx` with:

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { MagazineReader } from '../atlas-ui/reader/MagazineReader';
import { createBookRegistry } from '../atlas-core/registry';
import { loadBook, type LoadedBook } from '../atlas-core/loader';
import {
  EmptyState,
  ToastProvider,
  TooltipProvider,
} from '../atlas-ui/primitives';
import type { BookRegistry } from '../atlas-core/registry';
import type { OverlayConfig } from '../atlas-core/types/overlay';

function buildRegistry(data: LoadedBook): BookRegistry {
  return createBookRegistry(
    data.manifest,
    data.images,
    data.overlays as unknown as OverlayConfig[],
    data.glossary,
    data.legalRefs,
    data.scenarios,
    data.notes,
    data.contents,
    [],
  );
}

export function App() {
  const { pageId } = useParams<{ pageId?: string }>();
  const [registry, setRegistry] = useState<BookRegistry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadBook()
      .then((data) => {
        if (!cancelled) setRegistry(buildRegistry(data));
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <TooltipProvider>
        <ToastProvider>
          <div className="h-dvh flex items-center justify-center bg-surface">
            <EmptyState icon={AlertTriangle} title="图册加载失败" description={error} />
          </div>
        </ToastProvider>
      </TooltipProvider>
    );
  }

  if (!registry) {
    return (
      <TooltipProvider>
        <ToastProvider>
          <div className="h-dvh flex items-center justify-center bg-surface">
            <EmptyState icon={BookOpen} title="加载图册中…" />
          </div>
        </ToastProvider>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <ToastProvider>
        <MagazineReader registry={registry} initialPageId={pageId} />
      </ToastProvider>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2: Rewrite GlossaryRoute.tsx**

Replace `src/app/routes/GlossaryRoute.tsx` with:

```tsx
import { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { createBookRegistry } from '../../atlas-core/registry';
import { loadBook, type LoadedBook } from '../../atlas-core/loader';
import { GlossaryPageTemplate } from '../../atlas-ui/renderers/GlossaryPageTemplate';
import {
  EmptyState,
  ToastProvider,
  TooltipProvider,
} from '../../atlas-ui/primitives';
import type { BookRegistry } from '../../atlas-core/registry';
import type { OverlayConfig } from '../../atlas-core/types/overlay';

function buildRegistry(data: LoadedBook): BookRegistry {
  return createBookRegistry(
    data.manifest,
    data.images,
    data.overlays as unknown as OverlayConfig[],
    data.glossary,
    data.legalRefs,
    data.scenarios,
    data.notes,
    data.contents,
    [],
  );
}

export function GlossaryRoute() {
  const [registry, setRegistry] = useState<BookRegistry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadBook()
      .then((data) => {
        if (!cancelled) setRegistry(buildRegistry(data));
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <TooltipProvider>
        <ToastProvider>
          <div className="h-dvh flex items-center justify-center bg-surface">
            <EmptyState icon={AlertTriangle} title="术语表加载失败" description={error} />
          </div>
        </ToastProvider>
      </TooltipProvider>
    );
  }

  if (!registry) {
    return (
      <TooltipProvider>
        <ToastProvider>
          <div className="h-dvh flex items-center justify-center bg-surface">
            <EmptyState icon={BookOpen} title="加载术语表中…" />
          </div>
        </ToastProvider>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <ToastProvider>
        <div className="h-dvh overflow-auto bg-surface">
          <GlossaryPageTemplate registry={registry} />
        </div>
      </ToastProvider>
    </TooltipProvider>
  );
}
```

- [ ] **Step 3: Tests pass**

`npm test` → 335 passing.

Any test that mocked `loadDeEuVat` will break. Update them:
```bash
grep -rln "loadDeEuVat" src --include="*.test.tsx" --include="*.test.ts"
```

For each match, replace the import and the spy:
- `import { loadDeEuVat } from '../books/de-eu-vat/loader'` → `import { loadBook } from '../atlas-core/loader'`
- `vi.spyOn(LoaderMod, 'loadDeEuVat')` → similarly

If no test files import these (likely the case — Spec C used integration tests that mock `fetch` globally, not the loader), nothing more to do.

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx src/app/routes/GlossaryRoute.tsx
git commit -m "feat(app): wire App and GlossaryRoute to generic loadBook"
```

---

## Task 5.2: Delete `src/books/de-eu-vat/` and old `public/books/`

**Files:**
- Delete: `src/books/` (entire tree)
- Delete: `public/books/` (entire tree, was the old v0.6.1 location)
- Delete: `scripts/export-glossary-to-json.mjs`

- [ ] **Step 1: Verify no remaining consumers**

```bash
grep -rnE "from '.*books/de-eu-vat" src --include="*.ts" --include="*.tsx"
```
Expected: zero hits.

```bash
grep -rn "loadDeEuVat" src --include="*.ts" --include="*.tsx"
```
Expected: zero hits.

If anything turns up, fix that consumer first (likely missed in Task 5.1).

- [ ] **Step 2: Delete**

```bash
rm -rf src/books
rm -rf public/books
rm scripts/export-glossary-to-json.mjs
```

If `scripts/` becomes empty, leave the empty directory (some tooling expects it).

- [ ] **Step 3: Tests pass**

`npm test` → 335 passing (Spec C's loader tests that pointed at `src/books/de-eu-vat/__tests__/` were deleted along with the directory).

`npm run lint` → no new errors.

- [ ] **Step 4: Build**

```bash
npx vite build --logLevel warn 2>&1 | tail -10
```

Expected: succeed. Verify `dist/book/` is populated:
```bash
ls dist/book/images | wc -l   # 22
ls dist/book/overlays | wc -l # 22
ls dist/book/data | wc -l     # 2 (pages.json + glossary.json)
test -f dist/book/manifest.json && echo "manifest ok"
```

- [ ] **Step 5: Commit**

```bash
git add -A src/books public/books scripts
git commit -m "chore: delete books/de-eu-vat (replaced by generic bundle at public/book/)"
```

---

## Task 5.3: Final verification + smoke test

**Files:** none modified by default.

- [ ] **Step 1: Grep for stale references**

```bash
grep -rnE "(books/de-eu-vat|loadDeEuVat|vatAtlasManifest)" src --include="*.ts" --include="*.tsx"
```
Expected: zero hits.

```bash
grep -rnE "books/de-eu-vat" public 2>/dev/null
```
Expected: zero (the directory should be gone).

- [ ] **Step 2: Full lint**

```bash
npm run lint 2>&1 | tail -3
```
Expected: ≤ 40 errors (Spec A+B baseline).

- [ ] **Step 3: Full test suite**

```bash
npm test
```
Expected: all green.

- [ ] **Step 4: Build**

```bash
npx vite build --logLevel warn 2>&1 | tail -10
```
Expected: success. The `tsc -b` portion of `npm run build` has known pre-existing TS warnings (baseUrl deprecation, vite.config.ts `test` field) — that's unchanged from baseline; do not gate on those.

- [ ] **Step 5: Manual smoke**

```bash
npm run dev
```

In the browser:
1. Default `/book/de-eu-vat` — see loading EmptyState then TOC image (1086×1448).
2. Open dev-tools Network — confirm `manifest.json` + `data/pages.json` + `data/glossary.json` + (404 on notes/scenarios/contents/legal-refs) + 22 overlay JSON + first PNG.
3. ←/→ keyboard advances through 22 pages.
4. Top bar: "德国 / 欧盟 VAT 财务速查图册 · <page title> · 第 N / 22 页".
5. Rail expands/collapses; 评论 + button works; localStorage persists rail state.
6. `/book/de-eu-vat/glossary` — renders glossary list (loaded async by `GlossaryRoute`).
7. (Bonus) Edit `public/book/manifest.json` → change `title.zh-CN` to "Foo" → refresh → top bar updates. **This is the proof of "drop in a different manifest and it just works".**

Stop with Ctrl+C.

- [ ] **Step 6: Final commit (only if step 5 surfaced anything)**

```bash
git add -A
git commit -m "fix: polish from Spec D final smoke test"
```

If nothing changed, skip.

---

## Acceptance Criteria

- [ ] All Phase 1-5 tasks checked off
- [ ] `grep -rnE "(books/de-eu-vat|loadDeEuVat|vatAtlasManifest)" src` returns nothing
- [ ] `src/books/` directory does not exist
- [ ] `public/books/` directory does not exist
- [ ] `scripts/export-glossary-to-json.mjs` does not exist
- [ ] `public/book/{manifest.json, data/pages.json, data/glossary.json}` present
- [ ] `public/book/images/` contains 22 PNGs
- [ ] `public/book/overlays/` contains 22 JSON files
- [ ] `npm test` passes (~335 tests; new loader suite contributes ~31)
- [ ] `npm run lint` does not regress
- [ ] `npx vite build` succeeds; `dist/book/` is populated
- [ ] Manual: editing `public/book/manifest.json` and refreshing changes the UI

---

## Self-Review Notes

**Spec → plan coverage:**

| Spec §  | Task                                                |
|---|---|
| §1 goals/scope                              | Whole plan |
| §2 物理布局契约                              | Task 4.2 (manifest + pages + copy images/overlays) |
| §3 合并策略 (mergeManifestDefaults)         | Task 1.2 |
| §4.1 LoadedBook 类型                        | Task 3.2 |
| §4.2 加载流程 (parallel fetch + warn fallback) | Task 3.2 (loadBook impl + tests) |
| §4.3 fetchOptional                          | Task 1.1 |
| §4.4 缓存                                   | Task 3.2 (cached + __resetCache + tests) |
| §5 file structure                            | Tasks 2.1 (move) + 4.1/4.2 (materialize) + 5.2 (delete) |
| §5.1 App.tsx createBookRegistry signature   | Task 5.1 (full code) |
| §6 一次性脚本                                | Task 4.1 |
| §7 测试策略                                  | Tests in every task; loader.test covers all branches |
| §8 实施分期                                  | 5 phases as planned |
| §9 风险                                      | Embedded as inline notes (e.g. Step 3 of Task 3.2 explains the RawPageEntry type extension) |
| §10 验收清单                                 | Acceptance section above |

**Intentional carry-overs (not Spec D scope):**
- Rich-region UI rendering → Spec E
- Cache-busting query strings → Spec F
- SHA256 verification → Spec F

**Type consistency check:**
- `LoadedBook` shape — same in loader.ts (Task 3.2), App.tsx (Task 5.1), GlossaryRoute.tsx (Task 5.1) ✓
- `RawPageEntry` extension fields (notes/contentId/scenarioIds/legalRefIds) — added in rawSchema.ts during Task 3.2 Step 5 (the fallback fix), consumed in `buildPageManifest` same task ✓
- `convertOverlay` — now lives at `../overlay/convertOverlay`, imported with that path in loadBook.ts ✓
- `mergeManifestDefaults` signature `(raw: Partial<BookManifest>) => BookManifest` — same in Task 1.2 + 3.2 ✓
- `fetchOptional<T>(url): Promise<T[]>` — same in Task 1.1 + 3.2 ✓

**Known judgement calls during execution:**
- If `--experimental-strip-types` is unsupported in the user's Node, fall back to `npx tsx` or temporarily compile glossary.ts to JS.
- If Spec C's integration tests under `src/__tests__/` (railPersistence, plusButtonFlow) mock fetch in a way that conflicts with the new loader, they may need updating to point at `/book/` paths instead of `/books/de-eu-vat/v0.6.1/`. Verify and patch in Task 5.1 Step 3.
