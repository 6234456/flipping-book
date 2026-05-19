# VAT Atlas Reader — Spec G: Rich Region UI + Bundle CLI

**日期:** 2026-05-19
**状态:** 待用户审核 → 进 writing-plans
**前置:** Spec A-D 合入 main(`8e287e2`),Spec E / F 可独立合入或不合(无依赖)
**后续:** 待 v0.6.1 之后的素材富化(M drill-down / OCR 等)再起新 spec

---

## 1. 目标与范围

把 Spec C/D 加载到内存但**未渲染**的 rich region 数据点亮一部分;同时给素材提供方一个**离线静态校验工具**,在交付前自检 bundle 完整性。

### 1.1 范围内(2 项)

- **E** — Rich Region UI:顶栏新增"区域" toggle;开后 `textRegions` hover 显示文本 tooltip,`sections` click 切换蓝色高亮
- **R** — Bundle CLI:`node scripts/validate-bundle.mjs <path>` 基本 shape 校验 + 悬挂引用检查 + 唯一性检查 + 彩色文本/JSON 双输出

### 1.2 范围外(明示推迟)

- `gridRegions` / `imageHotspots` / `navigationRegions` 的 UI(v0.6.1 数据无可用语义) — 等 bundle 富化
- colorRole 的 5 色调色板(`evidence_green` / `tax_red` 等)反映在高亮上 — 用户已选统一蓝色方案,保留 Spec A 单蓝色板一致性;colorRole 字段仍解析但不影响视觉
- CLI 的图片尺寸校验(PNG 实际 px 对比 canvas)— 用户选基本+悬挂方案,不引 `probe-image-size` 依赖
- CLI 通过 `npx atlas-validate` 注册全局命令 — 仅 `node scripts/validate-bundle.mjs` 或 `npm run validate-bundle`,YAGNI
- CLI 校验图片格式 / 色彩深度 / 文件大小上限 — Spec D 契约里有建议但非强制,Spec G 不查
- a11y / 完整键盘 scrub / 焦点环优化 — 同 Spec E/F,用户明示不做

---

## 2. (E) Rich Region UI

### 2.1 Toggle

**位置:** 顶栏深色条 controls 区,Debug 左侧。

```
... [评论模式]  [区域]  [Debug]  ... 第 N / 22 页
                  ^^^^ 新增
```

- Label: `区域`
- Icon: lucide `LayoutGrid`
- 复用现有 `<ChromeButton>` primitive(Spec B 引入)
- 默认 `off`
- **不持久化**:每次新 session 默认 off(与 Debug 一致)
- 移动端 toolbar 折叠时该按钮也进 menu(后续 Spec D 移动端打磨时再调,本期不动)

### 2.2 状态

新增 `useRichRegionToggle` 状态在 `MagazineReader` 内:

```ts
const [richRegionsOn, setRichRegionsOn] = useState(false);
```

向下传递到 `ReaderShell` → `PageViewport`。`PageViewport` 内部持有 `selectedRegionIds: Set<string>`,**切页时自动清空**(`useEffect` watching `currentPageId`)。

### 2.3 RichRegionLayer 组件

新建 `src/atlas-ui/overlay/RichRegionLayer.tsx`:

```tsx
type RichRegionLayerProps = {
  regions: RichRegion[];           // 从 registry.getOverlay(...).regions 取
  selectedIds: ReadonlySet<string>;
  onToggleSection: (regionId: string) => void;
};

export function RichRegionLayer({ regions, selectedIds, onToggleSection }: RichRegionLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none" data-testid="rich-region-layer">
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
        return null;            // 其他 kind 暂不渲染
      })}
    </div>
  );
}
```

挂载位置:在 `PageContent` 的 `<PageRenderer>` 之后、`HotspotLayer` 之前(z 顺序最低,避免遮挡 hotspot 点击)。`pointer-events: none` 在容器上,子元素内自己开 `pointer-events: auto`。

### 2.4 TextRegionItem

```tsx
function TextRegionItem({ region }: { region: RichRegion }) {
  if (!region.text) return null;
  return (
    <Tooltip content={region.text} side="top">
      <div
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

- 默认无视觉,仅 hover 时 1px dotted accent outline
- Hover 200ms 后显示 Radix tooltip(用 Spec A 的 `Tooltip` primitive),内容 = `region.text`
- 移动端无 hover → 不可见(可接受,触屏不是核心场景)
- `region.text` 为空时 **不渲染**(常见于 sections / gridRegions,但此分支也容错 textRegions 出现空 text)

### 2.5 SectionItem

```tsx
function SectionItem({
  region,
  selected,
  onToggle,
}: {
  region: RichRegion;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={-1}
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
      data-region-id={region.regionId}
      data-selected={selected ? 'true' : 'false'}
    />
  );
}
```

- 未选中:默认无视觉,hover 时 1px dashed accent outline
- 选中:`bg-accent-bg-faint`(blue-50,几乎透明)+ 1px solid accent border
- click → `onToggle(region.regionId)` → 父级切换 set 中的成员
- 多个 section 可同时选中,无数量上限
- 跨页面 selected 清空(切页 useEffect)

### 2.6 改造

- `src/atlas-ui/reader/ReaderShell.tsx` — controls 区追加 `<ChromeButton pressed={richRegionsOn} ...>区域</ChromeButton>`
- `src/atlas-ui/reader/MagazineReader.tsx` — 新建 `richRegionsOn` state + 传给 ReaderShell + PageViewport
- `src/atlas-ui/reader/PageViewport.tsx` — 接 `richRegionsOn` prop + 内部持 `selectedRegionIds` set + 切页清空;richRegionsOn 时挂 `<RichRegionLayer>`

### 2.7 测试

- `RichRegionLayer.test.tsx`:渲染所有 textRegion / section / 忽略其他 kind
- `TextRegionItem.test.tsx`:有 text → 渲染 tooltip 包装;text 空 → 不渲染
- `SectionItem.test.tsx`:click → 触发 onToggle;selected 时含 bg-accent-bg-faint
- 集成 `richRegionToggle.test.tsx`:模拟 toggle on → 层出现;切页 → selected 清空

---

## 3. (R) Bundle CLI

### 3.1 文件

```
scripts/
  validate-bundle.mjs                — 单文件 ESM,~250 行,纯 node,无新 dep
  __tests__/
    validate-bundle.test.mjs         — 单测覆盖核心校验函数(导出可测试)
```

`package.json` 增加:
```json
"scripts": {
  "validate-bundle": "node scripts/validate-bundle.mjs"
}
```

### 3.2 调用

```bash
# 直接调用
node scripts/validate-bundle.mjs public/book
node scripts/validate-bundle.mjs ./path/to/another/bundle

# 通过 npm script
npm run validate-bundle -- public/book

# JSON 模式(供 CI)
node scripts/validate-bundle.mjs public/book --json

# 安静模式(只输出 errors + 最终状态)
node scripts/validate-bundle.mjs public/book --quiet
```

退出码:
- `0`:无 error(可有 warning)
- `1`:任一 error
- `2`:CLI 用法错(bundle path 不存在 / 路径不可读)

### 3.3 校验项(20 项)

**A. 基本 shape(8 项):**
1. `<path>/manifest.json` 存在 + 是有效 JSON
2. manifest 必填字段全在(`schemaVersion / bookId / slug / title / version`)
3. `<path>/data/pages.json` 存在 + 是非空数组
4. 每条 page entry 必填字段(`sectionCode / pageId / title / imageFile / canvas.{width,height}`)
5. `imageFile` 在 `<path>/images/<basename(imageFile)>` 实际存在(`fs.access` 检查)
6. 可选 JSON(`glossary` / `notes` / `scenarios` / `contents` / `legal-refs`):若文件存在则必须为数组
7. 每条 GlossaryEntry 必填字段(`termId / zh / original / category / shortDefinition / firstMentionFormat`)
8. 每条 AtlasNote / VatScenario / PageContent / LegalRef 各自必填字段(参照 atlas-core 类型,见 contract §8-11)

**B. 悬挂引用(7 项):**
9. pages.json[i].noteIds[] 每个 noteId 必须在 notes.json 中能找到
10. pages.json[i].scenarioIds[] 每个 scenarioId 必须在 scenarios.json 中能找到
11. pages.json[i].contentId 必须在 contents.json 中能找到
12. pages.json[i].legalRefIds[] 每个 legalRefId 必须在 legal-refs.json 中能找到
13. glossary[i].relatedTermIds[] / legalRefIds[] 同上
14. scenarios[i].legalRefIds[] / glossaryTermIds[] / relatedScenarioIds[] 同上
15. notes[i].bookId 必须 === manifest.bookId

**C. 唯一性(5 项):**
16-20. pages.json / glossary / notes / scenarios / legal-refs / contents 内的 ID 字段不能重复

### 3.4 输出格式(默认 ANSI 彩色文本)

```
$ node scripts/validate-bundle.mjs public/book

Validating bundle: public/book
─────────────────────────────────────
✓ manifest.json: 5/5 required fields present
✓ data/pages.json: 22 entries
✓ images/: 22/22 referenced files present
⚠ data/notes.json: not found (treating as [])
⚠ data/scenarios.json: not found (treating as [])
⚠ data/contents.json: not found (treating as [])
⚠ data/legal-refs.json: not found (treating as [])
✓ data/glossary.json: 40 entries, schema OK
✓ Reference integrity: 0 dangling references
✓ Uniqueness: pageId × 22, termId × 40 all unique
✓ Overlays: 22 files, all pageIds match filename prefix

─────────────────────────────────────
Result: PASS  (0 errors, 4 warnings)
```

错误示例:
```
$ node scripts/validate-bundle.mjs broken-bundle

Validating bundle: broken-bundle
─────────────────────────────────────
✓ manifest.json: 5/5 required fields present
✗ data/pages.json[14]: imageFile "SC-04_current_finals.png" not found in images/
✗ data/pages.json[3].noteIds[0]: "note-five-step" not found in notes.json
✗ data/glossary.json: termId "werklieferung" appears 2 times (entries 5, 27)
⚠ data/glossary.json[12].longDefinition: missing (allowed but recommended)

─────────────────────────────────────
Result: FAIL  (3 errors, 1 warning)
```

### 3.5 输出格式(--json)

```json
{
  "bundlePath": "public/book",
  "passed": true,
  "errors": [],
  "warnings": [
    { "kind": "missing-optional-file", "file": "data/notes.json" }
  ],
  "stats": {
    "pages": 22,
    "glossary": 40,
    "notes": 0,
    "scenarios": 0,
    "contents": 0,
    "legalRefs": 0,
    "images": 22,
    "overlays": 22
  }
}
```

### 3.6 实现要点

- 单文件 ESM (`.mjs`),用 Node 22+ 内置 API:`node:fs/promises`, `node:path`, `node:process`
- ANSI 颜色直接用模板字符串嵌入 `\x1b[3Xm`(无 dep)
- 校验函数(`checkManifest`, `checkPages`, `checkUniqueness`, `checkDanglingRefs`)各自导出,便于单测
- 主入口 `main()` 收集所有 `error / warning` 结果,最后聚合输出
- 不抛 throw,所有错误进 `errors[]` 收集
- 不需要 sourcemap 或 transpile;`.mjs` 直接 node 运行

### 3.7 测试

`scripts/__tests__/validate-bundle.test.mjs`(注:在项目 vitest 配置下可加 `include` 字段使其被 pick up,或者在 `vitest.config.ts` 的 `include` 数组加上 `scripts/**/*.test.mjs`)。

如不想动 vitest config,改用单独的 `npm run test:cli` 或干脆把测试放到 `src/__tests__/scripts/validate-bundle.test.ts`(import 校验函数从 `../scripts/validate-bundle.mjs`)。

**推荐:** 测试放 `src/__tests__/scripts/validate-bundle.test.ts`,沿用现有 vitest 配置。

测试用例:
- 完整 valid bundle(用 fixture 目录)→ passed=true, 0 errors
- 缺 manifest.json → error
- pages.json 空数组 → error
- imageFile 不存在 → error per entry
- 悬挂 noteId 引用 → error
- 重复 pageId → error
- 缺 notes.json(可选)→ warning, no error
- `--json` 输出格式正确
- `--quiet` 隐藏 ✓ 行

Fixture 文件放 `src/__tests__/scripts/fixtures/`(valid-bundle / broken-bundle)。

---

## 4. 文件结构总览

```
src/
  atlas-ui/overlay/
    RichRegionLayer.tsx                — 容器
    TextRegionItem.tsx                 — textRegion hover tooltip
    SectionItem.tsx                    — section click toggle
    __tests__/
      RichRegionLayer.test.tsx
      TextRegionItem.test.tsx
      SectionItem.test.tsx
  atlas-ui/reader/
    MagazineReader.tsx                 ← richRegionsOn state
    ReaderShell.tsx                    ← 区域 ChromeButton
    PageViewport.tsx                   ← 挂 RichRegionLayer + selectedRegionIds
  __tests__/
    richRegionToggle.test.tsx          ← 集成
    scripts/
      validate-bundle.test.ts          ← CLI 测试
      fixtures/
        valid-bundle/                  ← 完整可通过 bundle
        broken-bundle/                 ← 故意缺 imageFile / 悬挂引用 等
scripts/
  validate-bundle.mjs                  ← CLI 主文件
```

---

## 5. 依赖变更

无新依赖。CLI 纯 node 内置 API + ANSI 字符串;Rich Region UI 复用 Spec A `Tooltip` / Spec B `ChromeButton`。

---

## 6. 实施分期(给 writing-plans)

**E(Rich Region UI)5 commit:**
1. `RichRegionLayer` + `TextRegionItem` + `SectionItem` 与单测
2. PageViewport 集成 + `selectedRegionIds` state + 切页清空
3. MagazineReader `richRegionsOn` state + ReaderShell ChromeButton 接入
4. richRegionToggle 集成测试
5. 浏览器 smoke

**R(CLI)4 commit:**
6. `validate-bundle.mjs` 基本 shape 校验 + 单测(fixtures)
7. 悬挂引用 + 唯一性校验
8. ANSI 输出 + `--json` / `--quiet` 模式
9. `package.json` 加 script + 文档(README 一节)

**共 9 commit**

---

## 7. 风险

| 风险 | 应对 |
|---|---|
| RichRegionLayer 的子 div 太多(50+ section × 22 页)拖慢渲染 | 仅当前页渲染,且 `pointer-events: none` 容器,GPU 直接合成,实测无感 |
| Section bbox 重叠导致 hover/click 不可达 | 使用 `pointer-events: auto` 的子 div 按 React DOM 顺序响应;有重叠时上层胜出。本期接受 |
| `<Tooltip>` 用在 absolute 定位 div 上的 collision 计算 | Radix Tooltip 内置 collisionPadding,verified in Spec A |
| Toggle 与 Debug 视觉混淆 | label 文本差异化(区域 vs Debug)+ ChromeButton pressed 态 accent 蓝 |
| CLI 的 fixture 目录被 vite 打包 | 放 `src/__tests__/scripts/fixtures/` 不会被 build(只有 public/ 被打包) |
| Node 版本要求 | Node 22+(项目已要求 npm 10+,Node 22 是 ESM-native);在 README 注明 |
| 用户在 `public/book/` 外的路径调 CLI 时相对路径解析 | 用 `path.resolve(process.cwd(), arg)` 转绝对,无歧义 |

---

## 8. 验收清单

**E:**
- [ ] 顶栏 controls 区在 `评论模式` 和 `Debug` 之间出现"区域"按钮(LayoutGrid 图标)
- [ ] 默认状态 off;click → ON;再 click → OFF
- [ ] ON 状态下 textRegion bbox 可 hover,出 Radix tooltip 显示 `region.text`
- [ ] ON 状态下 section bbox 可 click,变蓝色高亮
- [ ] 多个 section 可同时选中
- [ ] 切换页面 → 选中清空
- [ ] OFF 状态下所有 region 不可见
- [ ] OFF 状态不影响 hotspot click(legalAnchor / navigation)

**R:**
- [ ] `node scripts/validate-bundle.mjs public/book` 退出码 0
- [ ] 默认输出 ANSI 彩色文本含 ✓ / ⚠ / ✗ 行 + 末尾 "Result: PASS/FAIL (N errors, M warnings)"
- [ ] `--json` 模式输出有效 JSON
- [ ] `--quiet` 模式只输出 errors + 最终状态
- [ ] 故意造一个 broken-bundle 测试 fixture → 退出码 1
- [ ] CLI 测试在 `npm test` 中跑(放在 `src/__tests__/scripts/`)
- [ ] `package.json` 有 `"validate-bundle"` script

**整体:**
- [ ] `npm test` 全绿,新增 ~12 个测试
- [ ] `npm run lint` 持平 baseline

---

## 9. 后续 Spec 预览

无明确后续 spec。Spec G 完成后,主要扩展方向:
- 等素材富化(scenarios.json / notes.json 真填上数据)→ Spec H 可能涉及 UI 改造
- v0.7 overlay schema 升级 → Spec I 处理 schema migration

——

**等待用户审核 → 若 OK 进 writing-plans 处理 F 与 G(可能两份单独 plan,或一份合并 plan)。**
