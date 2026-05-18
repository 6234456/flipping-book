# VAT Atlas Reader — Spec D: 包驱动通用加载

**日期:** 2026-05-17
**作者:** 设计协作(用户 + Claude)
**状态:** 待用户审核 → 进 writing-plans
**前置:** Spec C 已合入 main(预计 `a11d6e5` 后的 v0.6.1 整合 commits)
**配套交付物:** `docs/book-bundle-contract.md`(给素材提供方读的合约文档)
**后续 spec:** E(rich region 渲染 / 多版本 / 多本书 / 完整性校验)

---

## 1. 目标与范围

### 1.1 目标

把当前"de-eu-vat-specific"的运行时绑定移除,使 reader 成为**通用图册引擎**:
将一个符合契约的素材包(manifest.json + data/*.json + images/ + overlays/)放到 `public/book/`,刷新页面即正确加载,无需任何源代码修改。

### 1.2 关键设计决定(brainstorming 已确认)

| 决定 | 选择 |
|---|---|
| 同时支持几本书 | **始终一本** |
| 素材包位置 | `public/book/`(固定路径) |
| 包内分层 | manifest.json + data/*.json + images/ + overlays/ |
| 必填字段 | `schemaVersion` / `bookId` / `slug` / `title` / `version` |
| reader/navigation/featureFlags | 浅合并 1 层 default + bundle 提供值 |
| 可选数据文件(缺则空) | glossary / notes / scenarios / contents / legal-refs |
| pages.json 长度 | 任意 N ≥ 1 |
| 默认 URL | 仍 `/book/:bookSlug`,slug 仅作展示(不参与加载) |

### 1.3 范围内

- 新建 `src/atlas-core/loader/loadBook.ts` 通用加载器
- 移动 `src/books/de-eu-vat/converter.ts` 与 `types.ts` → `src/atlas-core/overlay/{convertOverlay,rawSchema}.ts`
- 删除整个 `src/books/de-eu-vat/`(8 个源文件 + 测试)
- 把现有 `public/books/de-eu-vat/v0.6.1/{images,overlays}` 内容搬到 `public/book/`
- 把 `data/page_catalog.json` 重命名为 `data/pages.json` 并适配新字段(per-page 引用)
- 把 `src/books/de-eu-vat/glossary.ts` 一次性导出为 `public/book/data/glossary.json`
- 手写 `public/book/manifest.json`(从原 `buildManifest()` 常量反推)
- 改 `App.tsx` 与 `GlossaryRoute.tsx`:`loadDeEuVat` → `loadBook`
- 编写测试 fixtures,覆盖加载器各分支
- 编写并交付 `docs/book-bundle-contract.md`

### 1.4 范围外(明确推迟)

- 多本书并存 / 书架 UI → 不在路线图
- 多版本切换(同一 slug 多版本) → 不需要
- SHA256 / JSON schema 严格校验 → Spec E
- 远端 bundle(同源以外) → Spec E
- Rich region(textRegions / sections / gridRegions)UI 渲染 → Spec E
- 用 zod / Ajv 做运行时校验 → 不需要,minimal manual 校验即可

---

## 2. 物理布局(契约)

```
public/book/                                  ← 固定路径
├── manifest.json                             ← 必填,书元信息
└── data/
│   ├── pages.json                            ← 必填,页目录数组(任意长度 N)
│   ├── glossary.json                         ← 可选,GlossaryEntry[]
│   ├── notes.json                            ← 可选,AtlasNote[]
│   ├── scenarios.json                        ← 可选,VatScenario[]
│   ├── contents.json                         ← 可选,PageContent[]
│   └── legal-refs.json                       ← 可选,LegalRef[]
├── images/                                   ← 必填目录(至少含 pages.json 引用的 PNG)
│   └── <imageFile>.png
└── overlays/                                 ← 可选,缺失则该页 hotspots/regions = []
    └── <pageId>_interactive_overlay_v0.6.1.json
```

**约定不变,不允许结构变种。**详细的 schema 与示例见 `docs/book-bundle-contract.md`。

---

## 3. manifest.json 合并策略

```ts
const DEFAULTS = {
  defaultLocale: 'zh-CN',
  supportedLocales: ['zh-CN'],
  visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
  reader: { /* 完整 ReaderConfig */ },
  navigation: { /* 完整 BookNavigationConfig */ },
  featureFlags: { /* 完整 FeatureFlags */ },
};
```

**算法:**
- 必填字段(`schemaVersion` / `bookId` / `slug` / `title` / `version`):bundle 缺失 → throw
- 顶层可选字段(`subtitle` / `defaultLocale` / `supportedLocales` / `visualSystem`):bundle 缺则用 DEFAULTS
- `reader` / `navigation` / `featureFlags`:**浅合并 1 层**
  - bundle 提供哪个 key 就覆盖 default 同名 key
  - bundle 没提供的 key 走 default
  - **不递归**:`reader.spreadBehavior` 若 bundle 出现,完整覆盖 default 的子对象

伪代码:
```ts
function mergeManifestDefaults(raw: Partial<BookManifest>): BookManifest {
  return {
    schemaVersion: raw.schemaVersion ?? throwRequired('schemaVersion'),
    bookId: raw.bookId ?? throwRequired('bookId'),
    slug: raw.slug ?? throwRequired('slug'),
    title: raw.title ?? throwRequired('title'),
    version: raw.version ?? throwRequired('version'),
    subtitle: raw.subtitle,
    defaultLocale: raw.defaultLocale ?? DEFAULTS.defaultLocale,
    supportedLocales: raw.supportedLocales ?? DEFAULTS.supportedLocales,
    visualSystem: raw.visualSystem ?? DEFAULTS.visualSystem,
    reader: { ...DEFAULTS.reader, ...(raw.reader ?? {}) },
    navigation: { ...DEFAULTS.navigation, ...(raw.navigation ?? {}) },
    featureFlags: { ...DEFAULTS.featureFlags, ...(raw.featureFlags ?? {}) },
    pages: [], // 由 loader 后续从 pages.json 填充
    readingOrder: [], // 同上
    registries: { imageAssets: '/book/images', overlays: '/book/overlays', glossary: '/book/data/glossary.json' },
  };
}
```

---

## 4. 加载器 API

### 4.1 类型

```ts
// src/atlas-core/loader/loadBook.ts
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

export async function loadBook(baseUrl?: string): Promise<LoadedBook>;
export function __resetCache(): void;
```

`baseUrl` 默认 `/book`,测试可覆盖。

### 4.2 流程

```
1. fetch ${baseUrl}/manifest.json     → raw manifest
   └─ throw on 404 / parse error
   └─ mergeManifestDefaults() → BookManifest 骨架

2. 并行 fetch:
   ├─ ${baseUrl}/data/pages.json      → 必填,RawPageEntry[]
   ├─ ${baseUrl}/data/glossary.json   → fetchOptional → []
   ├─ ${baseUrl}/data/notes.json      → fetchOptional → []
   ├─ ${baseUrl}/data/scenarios.json  → fetchOptional → []
   ├─ ${baseUrl}/data/contents.json   → fetchOptional → []
   └─ ${baseUrl}/data/legal-refs.json → fetchOptional → []

3. 校验:pages.length === 0 → throw "empty pages.json"

4. 构造 PageManifest[]:catalog.map(entry => buildPageManifest(entry, idx+1))
   └─ 把 entry.notes/contentId/scenarioIds/legalRefIds 透传到 PageManifest

5. 构造 ImageAsset[]:catalog.map(entry => buildImageAsset(entry, baseUrl))

6. 并行 fetch 所有 overlay:
   catalog.map(entry => fetch(`${baseUrl}/overlays/${entry.pageId}_interactive_overlay_v0.6.1.json`))
   ├─ 单个失败 → console.warn + emptyOverlayFor(sectionCode)
   └─ 用 convertOverlay() 转 RichOverlayConfig

7. 把 §3 manifest 骨架的 pages / readingOrder 填上

8. return LoadedBook(包含全部数据集合)
```

### 4.3 fetchOptional 工具

```ts
async function fetchOptional<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn(`fetchOptional fallback for ${url}:`, e);
    return [];
  }
}
```

### 4.4 缓存

模块级 `let cached: { base: string; promise: Promise<LoadedBook> } | null = null;` 同 Spec C 模式;`__resetCache()` 测试钩子。

---

## 5. 文件结构(实施后)

```
src/
  atlas-core/
    loader/                                      ← 新增
      loadBook.ts
      mergeManifestDefaults.ts
      fetchOptional.ts
      __tests__/
        loadBook.test.ts
        mergeManifestDefaults.test.ts
        fetchOptional.test.ts
        fixtures/
          minimal-manifest.json
          partial-manifest.json
          full-manifest.json
          sample-pages.json
          sample-glossary.json
          sample-overlay.json
    overlay/
      convertOverlay.ts                          ← 从 books/de-eu-vat/converter.ts
      rawSchema.ts                               ← 从 books/de-eu-vat/types.ts
      __tests__/
        convertOverlay.test.ts                   ← 从原位置搬
      mapSpreadOverlay.ts                        ← 不动
  books/                                          ← 整个目录删除
  app/
    App.tsx                                       ← loadDeEuVat → loadBook(见 §5.1)
    routes/GlossaryRoute.tsx                      ← 同上
public/
  book/                                           ← 新建,固定路径
    manifest.json                                 ← 新手写
    data/
      pages.json                                  ← rename + 补 per-page 引用字段
      glossary.json                               ← 一次性脚本从 TS 导出
    images/                                       ← 22 PNG(从 books/de-eu-vat/v0.6.1/)
    overlays/                                     ← 22 JSON(从同处)
  books/                                          ← 整个删掉(旧 v0.6.1 目录)
docs/
  book-bundle-contract.md                         ← 新增,给素材提供方读
```

---

### 5.1 App.tsx 关键改动

createBookRegistry 现在接收完整数据集(不再传空数组):

```tsx
// 旧 (Spec C):
const registry = createBookRegistry(
  data.manifest, data.images, data.overlays as unknown as OverlayConfig[],
  data.glossary, [], [], [], [], [],
);

// 新 (Spec D):
const registry = createBookRegistry(
  data.manifest,
  data.images,
  data.overlays as unknown as OverlayConfig[],
  data.glossary,
  data.legalRefs,   // ← 新数据来自 bundle
  data.scenarios,   // ←
  data.notes,       // ←
  data.contents,    // ←
  [],               // comments 仍是 localStorage 驱动,启动时空
);
```

`GlossaryRoute.tsx` 同改造。

## 6. 一次性脚本

`scripts/export-glossary-to-json.mjs`(写完即删,**不入生产构建**):

```js
import { writeFileSync } from 'fs';
import { glossary } from '../src/books/de-eu-vat/glossary.ts';
writeFileSync('public/book/data/glossary.json', JSON.stringify(glossary, null, 2));
console.log(`Wrote ${glossary.length} terms`);
```

执行:`node --experimental-strip-types scripts/export-glossary-to-json.mjs`,产物 commit 后删脚本。

---

## 7. 测试策略

### 7.1 单元

- `fetchOptional.test.ts`:200 → 数据;404 → [];500 → console.warn 后 [];非数组 JSON → []
- `mergeManifestDefaults.test.ts`:必填缺失 throw;部分 reader 浅合并;featureFlags 浅合并;subtitle 可选
- `convertOverlay.test.ts`:迁移自 Spec C(已绿)
- `loadBook.test.ts`:
  - 完整 manifest + minimal data 加载成功
  - manifest 缺必填 → throw
  - pages.json 空数组 → throw
  - glossary.json 404 → glossary=[]
  - 单个 overlay 404 → 该页 hotspots/regions=[],其余 OK
  - baseUrl 参数:`loadBook('/test-book')` 走对应路径
  - 缓存:第二次调用同 baseUrl 不重复 fetch manifest

### 7.2 集成

- 现有 `railIntegration` / `plusButtonFlow` / `railPersistence` / `importToast` / `tocPageNavigation` / `commentPinHighlight` 测试:
  - 不依赖具体书数据 → 不变
  - 部分测试构造 fixture registry → 不变

新增 `appLoadBook.test.tsx`:
  - 用 `vi.spyOn(globalThis, 'fetch').mockImplementation(...)` mock 5 个 fetch
  - 渲染 `<App />` 包装 `<MemoryRouter>` + `<TooltipProvider>` + `<ToastProvider>`
  - 等加载完成 → 看到顶栏标题来自 manifest.json
  - 错误路径:manifest 必填缺失 → 看到 "图册加载失败" EmptyState

### 7.3 守住

- `npm test` 全绿
- `npm run lint` 不增加新错误(baseline 40)
- `npx vite build` 成功,dist 含 `book/`

---

## 8. 实施分期(给 writing-plans)

**5 phase / 约 9 commits:**

1. **Phase 1 — 加载器原语**:`fetchOptional` / `mergeManifestDefaults` + 单测
2. **Phase 2 — 搬迁 schema 代码**:`convertOverlay.ts` + `rawSchema.ts` 移至 `atlas-core/overlay/`,更新所有 import
3. **Phase 3 — `loadBook.ts` + 测试**:用 fixture 全覆盖
4. **Phase 4 — 物化 public/book/**:
   - 拷贝 images / overlays
   - 重命名 `page_catalog.json` → `pages.json`(原内容保留)
   - 跑一次性脚本导出 glossary.json
   - 手写 manifest.json
   - 删除 `public/books/de-eu-vat/`
5. **Phase 5 — App 接入 + 清理**:
   - `App.tsx` / `GlossaryRoute.tsx` 改 import
   - 删 `src/books/de-eu-vat/` 整目录
   - 更新受影响测试
   - 最终验证

---

## 9. 风险与应对

| 风险 | 应对 |
|---|---|
| `public/book/` 静态资源命中浏览器缓存 → 切包不刷新 | 建议素材提供方在 manifest.json 升 `version` 字段;后续 Spec E 加 cache-busting query string |
| pages.json 中 imageFile 大小写与 images/ 文件名不一致(macOS/Windows 容忍,Linux 不容忍) | 一次性脚本里 toLowerCase + 真实存在性检查;contract 文档明示文件名规则 |
| 缺失某个 overlay JSON 时,该页 hotspot 全没了用户没感知 | console.warn 兜底,且 RichOverlayConfig.regions=[] 仍然渲染。本期可接受 |
| 老 localStorage 评论 anchor 指向已不存在的 pageId | 沿用 Spec C 的"漂浮无害"处理 |
| 测试 fetch mock 写起来繁琐 | 抽 `mockBundleFetch(spec: Partial<LoadedBook>)` 测试工具函数 |
| `convertOverlay` 现有路径 `from '../../books/de-eu-vat/converter'` 被多文件 import | grep + 批量 sed 替换 |
| Spec C 时存在的 `loadDeEuVat` 名字若被未迁移文档/test 引用 | grep 时一并修 |

---

## 10. 验收清单

- [ ] `public/book/manifest.json` 可访问,字段完整
- [ ] `public/book/data/pages.json` 长度 22
- [ ] `public/book/data/glossary.json` 长度 = 原 TS glossary.ts entries 数量
- [ ] `npm run dev` 启动,默认 `/` → 加载 → 显示首页(localStorage 干净时)
- [ ] 所有 22 页可翻
- [ ] 评论 / + 按钮 / 评论模式仍工作
- [ ] `/book/de-eu-vat/glossary` 渲染术语表
- [ ] `npm test` 全绿,新增 ≥ 8 个 loader 测试
- [ ] `npm run lint` 不增 error
- [ ] `npx vite build` 成功,`dist/book/` 含全部资源
- [ ] grep `'books/de-eu-vat'` 在 `src/` 中 0 命中
- [ ] grep `loadDeEuVat` 在 `src/` 中 0 命中
- [ ] 手动:用 `cp -r ref/<another-bundle> public/book` 替换包,刷新 → 新书加载成功(模拟"扔包就跑")
- [ ] `docs/book-bundle-contract.md` 已交付,内容自洽,无 TS 语法,可被无前端经验的素材提供方理解

---

## 11. 后续 Spec(非本期)

- **Spec E — Rich Region UI**:textRegions 弹层 / sections 高亮 / gridRegions hover
- **Spec F — Bundle 完整性 & 多版本**:SHA256SUMS 校验 / 多版本切换 / 远端 URL 支持 / cache-busting

——

**等待用户审核 → OK 则同步交付 `docs/book-bundle-contract.md`,然后进 writing-plans。**
