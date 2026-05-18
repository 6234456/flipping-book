# VAT Atlas 素材包技术契约 (v1.0)

> 本文档面向**素材包提供方**(内容编辑、数据工程师、外包团队)。
> 你不需要懂前端代码,只需要按下文产出一组文件,放到约定目录,reader 就会自动启动。
>
> 配套交付物:示例素材包(可作为模板)、最小化测试包(用于本地预览)。

---

## 0. TL;DR

1. 整理一个目录,叫什么名字都行(例如 `vat-atlas-v0.7.0/`)。
2. 目录内文件结构必须**严格符合本契约**(章节 §2)。
3. 测试方法:把目录拷贝到项目 `public/book/`,运行 `npm run dev`,在浏览器看效果。
4. 满意后,把目录交付给开发团队(zip 或 git PR),他们把它放进 `public/book/` 即上线。

**核心契约:** 一个素材包至少包含 5 个东西:

| # | 路径 | 必填? | 内容 |
|---|---|---|---|
| 1 | `manifest.json` | ✅ | 书的元信息(标题、版本、功能开关) |
| 2 | `data/pages.json` | ✅ | 页目录(至少 1 页) |
| 3 | `images/<page>.png` | ✅ | 每个页面的图(对应 pages.json 中 `imageFile`) |
| 4 | `data/glossary.json` | 可选 | 术语表 |
| 5 | `overlays/<pageId>_interactive_overlay_v0.6.1.json` | 可选 | 每页的可点击区域定义 |

可选数据文件:`data/notes.json`、`data/scenarios.json`、`data/contents.json`、`data/legal-refs.json`(章节 §9-12)。

---

## 1. 文档目的

把"reader 能展示的内容"与"reader 程序本身"彻底分开。素材提供方按本契约产出一份**自包含的素材包**(JSON + PNG),开发不动代码就能换书。

**这意味着:**
- 同一套 reader 程序可承载不同书(目前同时只展示一本)
- 内容更新不需要 push 代码,只需替换 `public/book/` 目录
- JSON 文件可以用任何工具生成(手写、Excel 导出、Python 脚本、CMS 输出),只要符合 schema

---

## 2. 物理布局

```
<bundle-root>/                                    ← 这个目录将被放到 public/book/
├── manifest.json                                 ← 必填
├── data/                                         ← 必填目录(至少含 pages.json)
│   ├── pages.json                                ← 必填
│   ├── glossary.json                             ← 可选
│   ├── notes.json                                ← 可选
│   ├── scenarios.json                            ← 可选
│   ├── contents.json                             ← 可选
│   └── legal-refs.json                           ← 可选
├── images/                                       ← 必填目录(至少 1 张 PNG)
│   ├── 01_current_final.png
│   ├── 02_current_final.png
│   └── ...
└── overlays/                                     ← 可选目录
    ├── 01-vat-framework_interactive_overlay_v0.6.1.json
    ├── 02-some-page_interactive_overlay_v0.6.1.json
    └── ...
```

**绝对路径约定:**
- 整个素材包必须放到 `public/book/`(路径写死,不可改)
- 子目录名称(`data/` / `images/` / `overlays/`)写死,不可改
- 文件名必须严格小写匹配(macOS 容忍大小写,Linux 不容忍 — **请用小写**;但 `01_current_final.png` 这种已存在的大小写文件可保留,只要 `pages.json` 的 `imageFile` 引用一致)

---

## 3. 最小可行包(MVP)

下面是一个 **3 页、无术语、无 overlay** 的最小包,可以直接复制粘贴测试:

### `manifest.json`

```json
{
  "schemaVersion": "1.0",
  "bookId": "test-atlas-001",
  "slug": "test-atlas",
  "title": { "zh-CN": "测试图册" },
  "version": "0.1.0"
}
```

### `data/pages.json`

```json
[
  {
    "sectionCode": "01",
    "pageId": "page-1",
    "title": "封面",
    "imageFile": "page-1.png",
    "canvas": { "width": 1086, "height": 1448 }
  },
  {
    "sectionCode": "02",
    "pageId": "page-2",
    "title": "第二页",
    "imageFile": "page-2.png",
    "canvas": { "width": 1086, "height": 1448 }
  },
  {
    "sectionCode": "03",
    "pageId": "page-3",
    "title": "第三页",
    "imageFile": "page-3.png",
    "canvas": { "width": 1086, "height": 1448 }
  }
]
```

### `images/`

放 3 张 PNG,文件名分别 `page-1.png` / `page-2.png` / `page-3.png`,推荐尺寸 1086×1448(任意尺寸都能跑,但请保持同一包内所有页面比例一致)。

---

**就这些。**这 5 个文件就能让 reader 跑起来,显示 3 页,带翻页、缩放、评论功能。

---

## 4. manifest.json 详解

`manifest.json` 描述"这本书是谁、什么时候、开哪些功能"。

### 4.1 必填字段(5 个)

| 字段 | 类型 | 示例 | 说明 |
|---|---|---|---|
| `schemaVersion` | string | `"1.0"` | 本契约的版本,目前固定 `"1.0"` |
| `bookId` | string | `"de-eu-vat-atlas"` | 全局唯一书 ID(用作 localStorage 评论 key),建议含字母数字与 `-` |
| `slug` | string | `"de-eu-vat"` | URL 友好的短名,用于 `/book/<slug>` 路由展示 |
| `title` | `{ "zh-CN": string }` | `{ "zh-CN": "VAT 图册" }` | 书名,顶栏显示 |
| `version` | string | `"0.6.1"` | 版本号,用户切换素材包时建议升此号 |

### 4.2 可选字段

| 字段 | 默认 | 说明 |
|---|---|---|
| `subtitle` | 无 | `{ "zh-CN": "..." }` 副标题,部分场景显示 |
| `defaultLocale` | `"zh-CN"` | 默认语言 |
| `supportedLocales` | `["zh-CN"]` | 支持的语言数组 |
| `visualSystem` | `"VAT_ATLAS_MAGAZINE_V2"` | 视觉主题 ID(目前只支持这一种) |
| `reader` | (内置默认) | reader 行为配置,见 §4.3 |
| `navigation` | (内置默认) | 顶栏/底栏开关,见 §4.4 |
| `featureFlags` | (内置默认) | 功能开关,见 §4.5 |

**重要:** 可选字段可以**整体省略**(走默认),也可以**只提供部分子字段**(其他子字段走默认)。这叫"浅合并"。

### 4.3 `reader` 字段

完整形态:

```json
{
  "defaultMode": "auto",
  "allowModeSwitch": false,
  "transition": "fade",
  "enableKeyboardNavigation": true,
  "enableSwipeNavigation": true,
  "enableProgressBar": true,
  "enableTableOfContents": true,
  "defaultZoom": "fit-page",
  "spreadBehavior": {
    "desktopDefault": "single",
    "mobileDefault": "single",
    "spreadPageAdvance": "by-page",
    "keyboard": { "arrowLeft": "previous", "arrowRight": "next" },
    "clickZones": { "enabled": false, "leftEdgePercent": 0, "rightEdgePercent": 0 }
  }
}
```

**只想改默认缩放为"适应宽度"?写:**

```json
{ "reader": { "defaultZoom": "fit-width" } }
```

其他字段全部走默认。

**注意:** `reader.spreadBehavior` 若你提供,需要**整段提供**(不递归合并到子对象)。例如不能只写 `"reader": { "spreadBehavior": { "desktopDefault": "spread" } }`,因为这样 `keyboard`/`clickZones` 就丢了。要么不写 spreadBehavior,要么写完整。

可选值:
- `defaultMode`: `"singlePage" | "spread" | "auto"`
- `transition`: `"none" | "fade" | "slide" | "magazine-slide" | "page-flip"`
- `defaultZoom`: `"fit-width" | "fit-page" | "actual-size"`

### 4.4 `navigation` 字段

```json
{
  "showTopBar": true,
  "showBottomBar": true,
  "showPageNumbers": true,
  "showBreadcrumbs": false,
  "showThumbnailStrip": false,
  "showTableOfContentsButton": true
}
```

全部布尔。浅合并。

### 4.5 `featureFlags` 字段

```json
{
  "glossaryTooltips": true,    // 术语下划线 + 弹层
  "notesDrawer": false,         // 笔记 tab 是否启用
  "comments": true,             // 评论功能
  "debugOverlay": true,         // 调试模式按钮
  "pageFlip": false,            // (预留)
  "search": false,              // (预留)
  "exportComments": true        // 评论导出/导入
}
```

**`notesDrawer` 与 `notes.json` 的关系:**
- 即使 `notes.json` 有数据,如果 `notesDrawer: false`,笔记 tab 仍隐藏
- 反之,即使 `notes.json` 为空,`notesDrawer: true` 也会让 tab 显示(只是内容为空)
- 上线时机由你决定

### 4.6 完整 manifest.json 示例

参考 `public/book/manifest.json`(实施 Spec D 后会创建):

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
  "featureFlags": {
    "comments": true,
    "debugOverlay": true,
    "notesDrawer": false
  }
}
```

---

## 5. data/pages.json 详解

`pages.json` 是**数组**(`[ ... ]`),每个元素描述一页。数组顺序 = 阅读顺序。

### 5.1 必填字段(5 个)

| 字段 | 类型 | 说明 |
|---|---|---|
| `sectionCode` | string | 章节代号(`"01"` / `"SC-04"` 等),用作图与 overlay 的 ID 前缀 |
| `pageId` | string | 全局唯一页 ID,作为 URL `?page=<pageId>` 与评论 anchor |
| `title` | string | 页标题(纯字符串,默认中文。**不是** `{"zh-CN": ...}`!) |
| `imageFile` | string | 相对 `images/` 的 PNG 文件名,例如 `"01_current_final.png"` |
| `canvas` | `{ width: number, height: number }` | 图的像素尺寸 |

### 5.2 可选字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `subtitle` | string | 副标题 |
| `sizeStatus` | string | QA 标记,`"canonical"` / `"draft"` 等,不影响渲染 |
| `noteIds` | string[] | 引用 `notes.json` 里的 `noteId`(注意:**不是** `notes`,后者是预留的 QA 元数据字符串) |
| `contentId` | string | 引用 `contents.json` 里的 `contentId`(单数,1 页对应 1 个 content) |
| `scenarioIds` | string[] | 引用 `scenarios.json` 里的 `scenarioId` |
| `legalRefIds` | string[] | 引用 `legal-refs.json` 里的 `legalRefId` |

### 5.3 示例

```json
[
  {
    "sectionCode": "TOC",
    "pageId": "toc",
    "title": "图册导航",
    "subtitle": "VAT 场景速查路径",
    "imageFile": "TOC_current_final.png",
    "canvas": { "width": 1086, "height": 1448 },
    "sizeStatus": "canonical"
  },
  {
    "sectionCode": "01",
    "pageId": "01-vat-framework",
    "title": "VAT 判断总框架",
    "subtitle": "五步速查法",
    "imageFile": "01_current_final.png",
    "canvas": { "width": 1086, "height": 1448 },
    "noteIds": ["note-five-step", "note-why-five"],
    "contentId": "content-01-framework",
    "legalRefIds": ["§ 1 UStG"]
  },
  {
    "sectionCode": "SC-07",
    "pageId": "sc-07-triangular-trade",
    "title": "三角贸易",
    "subtitle": "仅限符合条件的欧盟三方简化",
    "imageFile": "SC-07_current_final.png",
    "canvas": { "width": 1086, "height": 1448 },
    "scenarioIds": ["sc-triangulation-01"],
    "legalRefIds": ["§ 25b UStG"]
  }
]
```

### 5.4 注意事项

- `pageId` 必须**全局唯一**且**与 overlay 文件名前缀一致**(见 §11)
- `pageId` 不能含 `/`、空格(URL 不友好)
- 数组顺序决定翻页顺序,第一项即默认首页
- 数组长度任意,1 页也行,100 页也行(但 100+ 时首屏加载会慢)
- `imageFile` 区分大小写,**请确保与 `images/` 下的实际文件名匹配**

---

## 6. images/ 详解

每页一张 PNG(其他格式不支持本期)。

**约束:**
- 文件名 = `pages.json` 中对应条目的 `imageFile`
- 尺寸 ≥ 800px 任一边(过小会糊)
- 推荐尺寸 **1086 × 1448**(3:4 portrait,本契约的标称尺寸)
- 同一包内尺寸最好统一(布局不会因页面切换而跳动)
- 颜色深度 8-bit sRGB
- 单文件 ≤ 2MB(浏览器加载体验)

**TOC(目录)页:** 推荐自己绘制一张包含章节链接的 PNG,然后用 overlay JSON 在上面定义可点击区域(见 §11)。

---

## 7. data/glossary.json 详解

`glossary.json` 是**数组**,每个元素是一个术语。

### 7.1 字段

| 字段 | 必填? | 类型 | 说明 |
|---|---|---|---|
| `termId` | ✅ | string | 全局唯一术语 ID(只用字母数字与 `-`,无空格) |
| `zh` | ✅ | string | 中文译名 |
| `original` | ✅ | string | 原文(德/英/...) |
| `category` | ✅ | string | 见下表 |
| `shortDefinition` | ✅ | string | 短定义(弹层显示) |
| `firstMentionFormat` | ✅ | string | 首次出现的展示形式,例如 `"加工供货 (Werklieferung)"` |
| `abbreviation` | 可选 | string | 缩写,例如 `"WL"` |
| `longDefinition` | 可选 | string | 长定义 |
| `relatedTermIds` | 可选 | string[] | 相关术语 ID |
| `legalRefIds` | 可选 | string[] | 相关法条 ID(引用 `legal-refs.json`) |
| `warning` | 可选 | string | 使用警示文本 |

**`category` 可选值:**
- `"vat-basic"` — VAT 基础概念
- `"goods"` — 货物供应
- `"services"` — 服务给付
- `"invoice"` — 发票与凭证
- `"reporting"` — 申报与报告
- `"legal"` — 法规与条文
- `"customs"` — 海关
- `"reader-ui"` — 阅读器界面

### 7.2 示例

```json
[
  {
    "termId": "werklieferung",
    "zh": "加工供货",
    "original": "Werklieferung",
    "abbreviation": "WL",
    "category": "goods",
    "shortDefinition": "承包人提供主材并加工后交付,被视为货物供应。",
    "longDefinition": "见 § 3 Abs. 4 UStG。区别于 Werkleistung(加工服务)。",
    "firstMentionFormat": "加工供货 (Werklieferung)",
    "relatedTermIds": ["werkleistung", "lieferung"],
    "legalRefIds": ["§ 3 Abs. 4 UStG"],
    "warning": "不要与 für fremde Rechnung 混用"
  },
  {
    "termId": "reverse-charge",
    "zh": "反向征税",
    "original": "Steuerschuldnerschaft des Leistungsempfängers",
    "abbreviation": "RC",
    "category": "vat-basic",
    "shortDefinition": "由接受方申报和缴纳 VAT 的特定交易机制。",
    "firstMentionFormat": "反向征税 (Reverse Charge)"
  }
]
```

### 7.3 注意

- 术语在富文本中通过 `{ "type": "term", "termId": "xxx" }` 引用(见 §13.2)
- `firstMentionFormat` 是出现第一次时的全名,后续可用 `abbreviation` 或 `original` 简写

---

## 8. data/notes.json 详解

笔记 = 页面外的旁注 / 教学说明 / 演讲备注 / QA 评论。

### 8.1 字段

| 字段 | 必填? | 类型 | 说明 |
|---|---|---|---|
| `noteId` | ✅ | string | 全局唯一 ID |
| `bookId` | ✅ | string | 必须与 `manifest.json` 的 `bookId` 一致 |
| `pageId` | ✅ | string | note 属于哪一页(决定它在哪页的笔记 tab 里出现) |
| `body` | ✅ | RichTextNode[] | note 正文,富文本数组(见 §13) |
| `noteType` | ✅ | enum | 见下 |
| `visibility` | ✅ | enum | 见下 |
| `title` | 可选 | `{ "zh-CN": string }` | note 标题 |
| `anchor` | 可选 | NoteAnchor | 锚到某 hotspot / 内容块 / 术语 / 法条(见 §8.2) |
| `tags` | 可选 | string[] | 标签 |

**`noteType` 可选值:**
- `"speaker-note"` — 演讲备注
- `"supplement"` — 补充材料
- `"legal-background"` — 法规背景
- `"example"` — 示例
- `"authoring-note"` — 创作说明(给作者自己看)
- `"image-prompt-note"` — 图片生成提示(给设计师看)
- `"review-note"` — 审阅备注

**`visibility` 可选值:**
- `"reader"` — 公开,普通读者可见
- `"presenter"` — 仅演讲模式可见
- `"editor-only"` — 仅编辑模式可见(读者看不到)

### 8.2 `anchor` 子结构

| `kind` | 必填子字段 | 用途 |
|---|---|---|
| `"page"` | `pageId` | 锚到整页(冗余,因 note 本身已 pageId) |
| `"hotspot"` | `pageId` + `hotspotId` | 锚到某可点击区域(对应 overlay 的 region.id) |
| `"contentBlock"` | `pageId` + `blockId` | 锚到 contents.json 里某 block |
| `"term"` | `termId` | 锚到术语(适合术语解释 note) |
| `"legalRef"` | `legalRefId` | 锚到法条 |

### 8.3 示例

```json
[
  {
    "noteId": "note-five-step",
    "bookId": "de-eu-vat-atlas",
    "pageId": "01-vat-framework",
    "title": { "zh-CN": "为什么是五步?" },
    "body": [
      { "type": "paragraph", "children": [
        { "type": "text", "value": "五步法源自 BFH 判例,先看交易性质再看场所..." }
      ]}
    ],
    "noteType": "supplement",
    "visibility": "reader",
    "tags": ["五步", "教学"]
  }
]
```

---

## 9. data/scenarios.json 详解

场景 = "假设是这样,VAT 该怎么处理"的可点开决策包。

### 9.1 字段

| 字段 | 必填? | 类型 |
|---|---|---|
| `scenarioId` | ✅ | string |
| `title` | ✅ | `{ "zh-CN": string }` |
| `category` | ✅ | enum(见下) |
| `oneSentence` | ✅ | `{ "zh-CN": string }` — 一句话结论 |
| `subtitle` | 可选 | `{ "zh-CN": string }` |
| `facts` | 可选 | 场景事实(supplier / customer / 等) |
| `decisionFlow` | 可选 | DecisionNode[] — 判定路径 |
| `result` | 可选 | VatResult — VAT 处理结果 |
| `invoiceHints` | 可选 | RichTextNode[][] — 发票要点 |
| `reportingHints` | 可选 | RichTextNode[][] — 申报要点 |
| `evidenceHints` | 可选 | RichTextNode[][] — 证据要点 |
| `redFlags` | 可选 | RichTextNode[][] — 风险点 |
| `legalRefIds` | 可选 | string[] |
| `glossaryTermIds` | 可选 | string[] |
| `relatedScenarioIds` | 可选 | string[] |

**`category` 可选值:**
`"classification"` / `"domestic-b2b"` / `"eu-goods"` / `"eu-services"` / `"reverse-charge"` / `"import-export"` / `"chain-transaction"` / `"triangulation"` / `"invoice-reporting"` / `"appendix-quick-reference"`

### 9.2 `facts` 子字段(全可选)

`supplier` / `customer` / `transactionType` / `goodsMovement` / `servicePlace` / `vatIdStatus` / `incoterms` — 全是 string。

### 9.3 `result` 子结构

```json
{
  "treatment": { "zh-CN": "中间商免征,最终买方反向征税" },
  "taxableInGermany": false,
  "taxRate": "reverse-charge",
  "taxLiability": "customer"
}
```

- `taxRate` 可选值:`"19%" | "7%" | "0%" | "exempt" | "not-taxable" | "reverse-charge" | "depends"`
- `taxLiability` 可选值:`"supplier" | "customer" | "importer" | "depends"`

### 9.4 `decisionFlow` 子结构

每个 `DecisionNode`:
```json
{
  "nodeId": "q1",
  "question": { "zh-CN": "三方是否均提供有效 USt-IdNr?" },
  "answerType": "yes_no",
  "options": [
    { "value": "yes", "label": { "zh-CN": "是" }, "nextNodeId": "q2" },
    { "value": "no", "label": { "zh-CN": "否" }, "resultHint": { "zh-CN": "不能适用 § 25b 简化" } }
  ],
  "explanation": [
    { "type": "text", "value": "USt-IdNr 必须有效,可通过 VIES 校验。" }
  ],
  "legalRefIds": ["§ 25b UStG"]
}
```

- `answerType`: `"yes_no" | "single_choice" | "multi_choice" | "info"`

### 9.5 完整示例

```json
[
  {
    "scenarioId": "sc-triangulation-01",
    "title": { "zh-CN": "三角贸易简化(三方有效 USt-IdNr)" },
    "category": "triangulation",
    "oneSentence": { "zh-CN": "中间商免征,最终买方按反向征税。" },
    "facts": {
      "supplier": "DE",
      "customer": "FR",
      "transactionType": "三角贸易",
      "goodsMovement": "DE→FR",
      "vatIdStatus": "三方均有"
    },
    "result": {
      "treatment": { "zh-CN": "适用 § 25b 简化" },
      "taxableInGermany": false,
      "taxRate": "reverse-charge",
      "taxLiability": "customer"
    },
    "legalRefIds": ["§ 25b UStG"],
    "glossaryTermIds": ["dreiecksgeschaeft", "reverse-charge"]
  }
]
```

---

## 10. data/contents.json 详解

contents = 页面除图片外的"可选中、可富文本"内容主体。

> **何时需要?** 当一页除了 PNG 图,还想提供可搜索 / 可复制的结构化文字(段落、表格、callout、清单)。
> v0.6.1 把所有内容烧进 PNG,**所以本期 contents.json 为空数组或缺失**。
> 未来如果新页面需要文字主体,在这里加。

### 10.1 字段

每个 PageContent:
```json
{
  "contentId": "content-01-framework",
  "pageId": "01-vat-framework",
  "blocks": [ ... ContentBlock[] ... ]
}
```

### 10.2 ContentBlock 类型(union)

每个 block 必有 `blockId` + `type`。其他字段依 type 而定。

**`heading`:**
```json
{ "blockId": "b1", "type": "heading", "level": 2,
  "text": [{ "type": "text", "value": "总框架" }] }
```
`level: 1 | 2 | 3 | 4`

**`paragraph`:**
```json
{ "blockId": "b2", "type": "paragraph",
  "text": [{ "type": "text", "value": "段落内容..." }] }
```

**`callout`:**
```json
{ "blockId": "b3", "type": "callout", "variant": "info",
  "title": [{ "type": "text", "value": "提示" }],
  "body":  [{ "type": "text", "value": "..." }] }
```
`variant: "info" | "warning" | "risk" | "legal" | "evidence"`

**`checklist`:**
```json
{ "blockId": "b4", "type": "checklist",
  "title": [{ "type": "text", "value": "清单" }],
  "items": [
    [{ "type": "text", "value": "校验 USt-IdNr" }],
    [{ "type": "text", "value": "标注 Reverse charge" }]
  ] }
```

**`comparisonTable`:**
```json
{
  "blockId": "b5", "type": "comparisonTable",
  "columns": [
    { "columnId": "c1", "header": [{ "type": "text", "value": "项目" }] },
    { "columnId": "c2", "header": [{ "type": "text", "value": "原值" }] }
  ],
  "rows": [
    { "rowId": "r1",
      "cells": {
        "c1": [{ "type": "text", "value": "税率" }],
        "c2": [{ "type": "text", "value": "19%" }]
      } }
  ]
}
```

**`scenarioSummary`:** 嵌入引用 scenarios.json 的卡片
```json
{ "blockId": "b6", "type": "scenarioSummary", "scenarioId": "sc-triangulation-01" }
```

**`decisionFlow`:** 嵌入引用 scenarios.json 的决策流
```json
{ "blockId": "b7", "type": "decisionFlow", "scenarioId": "sc-triangulation-01" }
```

**`glossary`:** 嵌入若干术语
```json
{ "blockId": "b8", "type": "glossary",
  "termIds": ["werklieferung", "werkleistung"],
  "layout": "list" }
```
`layout: "list" | "grid"`

**`imageCaption`:**
```json
{ "blockId": "b9", "type": "imageCaption",
  "imageAssetId": "01-current-final-v06",
  "caption": [{ "type": "text", "value": "图 1:VAT 决策流" }] }
```

**`notesPlaceholder`:** 占位以触发 notes tab
```json
{ "blockId": "b10", "type": "notesPlaceholder",
  "noteIds": ["note-five-step"] }
```

---

## 11. data/legal-refs.json 详解

法条 / 判例 / 指南索引。

### 11.1 字段

| 字段 | 必填? | 类型 | 说明 |
|---|---|---|---|
| `legalRefId` | ✅ | string | 通常用人类可读形式,如 `"§ 25b UStG"` |
| `jurisdiction` | ✅ | enum | `"DE" | "EU" | "OTHER"` |
| `source` | ✅ | enum | 见下 |
| `ref` | ✅ | string | 引用全称,例如 `"§ 25b Abs. 2"` |
| `summary` | ✅ | `{ "zh-CN": string }` | 弹层显示的摘要 |
| `title` | 可选 | `{ "zh-CN": string }` | 完整标题 |
| `url` | 可选 | string | 外链 |
| `relatedTermIds` | 可选 | string[] | 相关术语 |
| `relatedScenarioIds` | 可选 | string[] | 相关场景 |
| `lastReviewed` | 可选 | string(`YYYY-MM-DD`) | 最后审阅日期 |

**`source` 可选值:**
`"UStG"` / `"UStAE"` / `"VAT_DIRECTIVE"` / `"BMF"` / `"EU_GUIDANCE"` / `"CASE_LAW"` / `"OTHER"`

### 11.2 示例

```json
[
  {
    "legalRefId": "§ 25b UStG",
    "jurisdiction": "DE",
    "source": "UStG",
    "ref": "§ 25b Abs. 2",
    "title": { "zh-CN": "三角贸易简化制度" },
    "summary": { "zh-CN": "三方均提供有效 USt-IdNr 时,中间商免征。" },
    "url": "https://www.gesetze-im-internet.de/ustg_1980/__25b.html",
    "relatedTermIds": ["dreiecksgeschaeft", "reverse-charge"],
    "relatedScenarioIds": ["sc-triangulation-01"],
    "lastReviewed": "2026-05-17"
  }
]
```

---

## 12. overlays/ 详解(可选,但强烈推荐)

每个 overlay JSON 描述**一页图上的可点击区域**。文件名严格约定:

```
overlays/<pageId>_interactive_overlay_v0.6.1.json
```

`<pageId>` 必须与 `pages.json` 中某条 `pageId` 完全匹配。

> **关于 `v0.6.1` 后缀:** 这是 overlay 内部 schema 的版本号(与 manifest 的 `version` 字段不同)。当前 reader 锁定该后缀;未来如果 overlay schema 升级,reader 与本契约会同步发版。**素材提供方目前保持使用 `_interactive_overlay_v0.6.1.json` 即可。**

### 12.1 文件结构

```json
{
  "version": "0.6.1",
  "pageId": "01-vat-framework",
  "sectionCode": "01",
  "canvas": { "width": 1086, "height": 1448 },
  "imageFile": "images/final/01_current_final.png",
  "overlayType": "refined_interactive_hotspots",
  "textRegions": [],
  "sections": [],
  "gridRegions": [],
  "imageHotspots": [],
  "navigationRegions": [],
  "legalAnchors": []
}
```

**6 个区域数组,每个数组元素都是一个 region:**

| 数组 | 用途 | 可点击? |
|---|---|---|
| `textRegions` | 文字 OCR 区(给后续搜索 / 选中用) | 否(本期) |
| `sections` | 视觉区块(整页的某一大块色框) | 否(本期) |
| `gridRegions` | 网格(表格 / 卡片矩阵) | 否(本期) |
| `imageHotspots` | 图标 / 装饰图 | **是**(本期 click → 该页自身 no-op) |
| `navigationRegions` | TOC 章节链接 / 翻页按钮 | **是**(本期 click → 跳 toc 页) |
| `legalAnchors` | 法条编号区(`§ 25b`) | **是**(本期 click → 跳术语表) |

### 12.2 Region 字段

```json
{
  "id": "icon-chain-trade",
  "type": "imageHotspot",
  "role": "imageHotspot",
  "bbox": { "x": 100, "y": 1200, "w": 200, "h": 100 },
  "text": "可选,该区域文字内容",
  "confidence": 0.95,
  "source": "human-labeled",
  "colorRole": "evidence_green"
}
```

| 字段 | 必填? | 类型 | 说明 |
|---|---|---|---|
| `id` | ✅ | string | region 唯一 ID |
| `type` | ✅ | string | 与所在数组对应(`"textRegion"` / `"section"` / etc) |
| `role` | ✅ | string | 语义角色(见下) |
| `bbox` | ✅ | `{ x, y, w, h }` | **像素坐标**(reader 内部转百分比),原点左上 |
| `text` | 可选 | string | 该区域内的文字(OCR 结果或手动注) |
| `confidence` | 可选 | number(0-1) | 标注置信度 |
| `source` | 可选 | string | 标注来源(`"catalog"` / `"human-labeled"` / `"ocr"`) |
| `colorRole` | 可选 | string | 视觉色调,见下 |

**`role` 可选值:**
`"pageCode"` / `"atlasHeader"` / `"title"` / `"subtitle"` / `"detectedSection"` / `"gridRegion"` / `"imageHotspot"` / `"bottomNavigation"` / `"legalAnchor"` / `"resourceFooter"`

**`colorRole` 可选值:** `"evidence_green"` / `"tax_red"` / `"legal_purple"` / `"warning_amber"` / `"info_blue"` / `"neutral_slate"`(未知值会被丢弃,不报错)

### 12.3 注意事项

- `bbox` 必须是**像素**坐标,与 `canvas` 的尺寸基准一致(reader 内部转百分比)
- 一页的 overlay JSON 缺失 → 该页 hotspot 全空,仍可正常显示图片
- 不需要可点击的页面可直接省略 overlay JSON

---

## 13. RichTextNode 富文本格式

`notes.body` / `contents.blocks` / `scenarios.invoiceHints` 等字段都用 `RichTextNode[]`。

### 13.1 节点类型

| `type` | 必有字段 | 示例 |
|---|---|---|
| `"text"` | `value` | `{ "type": "text", "value": "纯文本" }` |
| `"strong"` | `children` | `{ "type": "strong", "children": [{ "type": "text", "value": "粗体" }] }` |
| `"em"` | `children` | `{ "type": "em", "children": [{ "type": "text", "value": "斜体" }] }` |
| `"term"` | `termId`,可选 `first` | `{ "type": "term", "termId": "werklieferung" }` |
| `"legalRef"` | `legalRefId` | `{ "type": "legalRef", "legalRefId": "§ 25b UStG" }` |
| `"scenarioLink"` | `scenarioId`,可选 `label` | `{ "type": "scenarioLink", "scenarioId": "sc-triangulation-01" }` |
| `"pageLink"` | `pageId`,可选 `label` | `{ "type": "pageLink", "pageId": "01-vat-framework" }` |

### 13.2 完整示例

```json
[
  { "type": "text", "value": "在 " },
  { "type": "term", "termId": "werklieferung", "first": true },
  { "type": "text", "value": " 情境下,适用 " },
  { "type": "legalRef", "legalRefId": "§ 3 Abs. 4 UStG" },
  { "type": "text", "value": "。详见 " },
  { "type": "scenarioLink", "scenarioId": "sc-werklieferung-01", "label": "示例场景" },
  { "type": "text", "value": "。" }
]
```

渲染效果:
> 在 **加工供货 (Werklieferung)** 情境下,适用 [§ 3 Abs. 4 UStG]。详见 [示例场景]。
> (蓝色下划线项可点击弹出对应弹层)

---

## 14. 引用关系总览

```
pages.json ──┬──► notes.json      (notes 数组引用 noteId)
             ├──► contents.json   (contentId 引用 1 个)
             ├──► scenarios.json  (scenarioIds 数组)
             └──► legal-refs.json (legalRefIds 数组)

scenarios.json ──┬──► legal-refs.json (legalRefIds)
                 └──► glossary.json   (glossaryTermIds)

glossary.json ──┬──► glossary.json    (relatedTermIds 互引)
                └──► legal-refs.json  (legalRefIds)

legal-refs.json ──┬──► glossary.json   (relatedTermIds)
                  └──► scenarios.json  (relatedScenarioIds)

富文本中 (notes.body / contents.blocks / scenarios.*Hints 内嵌):
  type: "term"          → glossary.json
  type: "legalRef"      → legal-refs.json
  type: "scenarioLink"  → scenarios.json
  type: "pageLink"      → pages.json
```

**引用失效不会崩溃** —— 找不到的 ID 在 UI 上显示为普通文本(无弹层),不抛错。

---

## 15. ID 命名约定

| 类别 | 推荐格式 | 示例 |
|---|---|---|
| `bookId` | `<book>-atlas` | `"de-eu-vat-atlas"` |
| `slug` | URL-safe 短名 | `"de-eu-vat"` |
| `pageId` | `<section>-<topic>` | `"01-vat-framework"`、`"sc-07-triangular-trade"` |
| `sectionCode` | 2-4 字母数字 | `"01"`、`"SC-07"`、`"TOC"` |
| `termId` | 单词或带 `-` | `"werklieferung"`、`"reverse-charge"` |
| `noteId` | `note-<topic>` | `"note-five-step"` |
| `scenarioId` | `sc-<topic>-<n>` | `"sc-triangulation-01"` |
| `contentId` | `content-<topic>` | `"content-01-framework"` |
| `legalRefId` | 人类可读原文 | `"§ 25b UStG"`、`"BFH-Urteil 2020-07-14"` |

**通用规则:**
- 全 ID 区分大小写
- 不含空格(`legalRefId` 例外,因为人类可读)
- 优先小写 + `-` 分隔(kebab-case)
- 跨文件引用必须**字符完全匹配**

---

## 16. 校验清单(交付前自查)

提交素材包前过一遍:

- [ ] `manifest.json` 含全部 5 个必填字段
- [ ] `data/pages.json` 是数组,至少 1 条
- [ ] 每条 page entry 的 `imageFile` 在 `images/` 下能找到
- [ ] `images/` 下所有文件被 `pages.json` 引用(无孤立文件)
- [ ] 如有 `overlays/`,每个 overlay 的 `pageId` 字段与文件名前缀、`pages.json` 都一致
- [ ] 所有 JSON 用 UTF-8 编码,无 BOM
- [ ] 所有 JSON 通过 `JSON.parse` / `python -m json.tool` 检查无语法错
- [ ] 所有 ID 跨文件引用都能对上(没有 dangling reference 是加分项,但不会崩)
- [ ] 包内总大小 ≤ 50 MB(避免首屏加载过慢)
- [ ] 单张 PNG ≤ 2 MB
- [ ] 没有调试用的临时文件混入(`.DS_Store`、`*.swp`、`*.bak`)
- [ ] 在本地放进 `public/book/` 跑 `npm run dev`,翻 3-5 页无控制台错误

---

## 17. 常见错误

| 症状 | 原因 | 解决 |
|---|---|---|
| 浏览器一直显示"加载图册中…" | `manifest.json` 缺必填字段,或某 JSON 语法错 | 看浏览器控制台具体报错;用 `python -m json.tool` 校验每个 JSON |
| 翻页显示"图片未找到" | `imageFile` 大小写不匹配 / 文件不在 `images/` | 检查文件名,Linux 严格区分大小写 |
| Hotspot 点了没反应 | overlay JSON 缺失或 `bbox` 像素超出 `canvas` 范围 | 校对 bbox 数值 |
| 术语下划线但弹层显示原文 | `termId` 引用错误 | 检查 `glossary.json` 是否有该 termId |
| 评论功能消失 | `manifest.json` 的 `featureFlags.comments` 误设 false | 改回 true 或省略此字段 |
| TOC 页面点击无效 | 该页 overlay 的 `navigationRegions` 数组为空 | 加 navigationRegion,指定 bbox |
| 顶栏页码显示 "第 N / undefined 页" | `pages.json` 不是数组(可能是 object) | 修复为数组 |

---

## 18. 版本与升级

- 本契约版本 = **1.0**(对应 `manifest.json` 的 `schemaVersion: "1.0"`)
- 未来若 schema 升级:
  - 兼容性更新(加字段,不动旧字段)→ 仍 `"1.0"`,旧包继续可用
  - 不兼容更新(改字段含义)→ `"2.0"`,reader 同步升级支持

reader 看到不认识的 `schemaVersion` 时,会在控制台 warn 但仍尝试加载(向前兼容)。

---

## 19. 反馈与变更

发现契约描述与实际行为不符 / 想加新字段 / schema 需调整 → 联系工程团队提 issue。

**禁止**:
- 私自往包内加 reader 不认识的字段(无害但浪费空间)
- 改 `data/` / `images/` / `overlays/` 子目录名
- 把 PNG 换成 JPG/WebP(本期仅支持 PNG)

---

**本契约配套示例素材包**(参考实施):`public/book/`(Spec D 完成后)。
