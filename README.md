# VAT Atlas Dev Assets v0.3

本包是 **Interactive Atlas Framework** 的首本图册资产包，按 `spec_v0.2.md` 的目录结构和数据模型生成。

## 交付内容

- `books/de-eu-vat/manifest.json` / `manifest.ts`：BookManifest。
- `books/de-eu-vat/data/*.json`：imageAssets、pages、glossary、legalRefs、scenarios、contents、notes、overlays index。
- `books/de-eu-vat/overlays/*.overlay.json`：每页标准热点区域。
- `books/de-eu-vat/assets/images/reference-pages/*.png`：内容锁定参考页，中文文案准确优先。
- `books/de-eu-vat/assets/images/generated-drafts/*.png`：已生成视觉草图，仅作风格参考，需按 QA 清单校正。
- `books/de-eu-vat/copy/page-copy/*.md`：每页可审阅文案。
- `books/de-eu-vat/copy/TERMINOLOGY_LOCK.md`：全局术语锁定。
- `books/de-eu-vat/qa/VISUAL_AND_CONTENT_QA.md`：最终视觉与内容 QA 清单。
- `docs/spec_v0.2.md`：设计文档原件。

## 开发接入方式

将 `books/de-eu-vat` 复制到项目的 `src/books/de-eu-vat` 或等价目录。

```ts
import { vatAtlasManifest } from "./books/de-eu-vat/manifest";
```

优先使用 `manifest.json` / `data/*.json` 驱动页面渲染。TypeScript 文件仅作为便捷导入版本。

## 内容权威顺序

1. `copy/page-copy/*.md`
2. `data/contents.json`
3. `data/glossary.json`
4. `assets/images/reference-pages/*.png`
5. `assets/images/generated-drafts/*.png` 仅作视觉参考

## 重要规则

- 图像可以替换，但必须新建 image version。
- overlay 和 comment anchor 必须绑定 image version。
- 术语必须通过 glossary termId 渲染。
- 电子发票 = E-Rechnung。
- Werklieferung = 加工供货；Werkleistung = 加工服务。
- für fremde Rechnung = 内部法律后果归属于委托方。
- 三角贸易主图使用“第一卖方 / 中间商 / 最终买方”。

生成时间：2026-05-14T18:04:15.613791+00:00
