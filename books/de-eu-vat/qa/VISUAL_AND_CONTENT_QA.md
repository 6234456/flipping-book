# VAT Atlas 视觉与内容 QA 清单 v0.3

## 已知视觉修复项

1. 背景底色需要在最终打包阶段统一。
2. 早期 GPT-Image 图中可能存在错字、旧译名或低信息密度；不得以生成图中的文字作为最终内容来源。
3. SC-07 旧图若出现“第一供应方 / 最终取得方”，必须改为“第一卖方 / 最终买方”。
4. 旧图若出现“工程供货 / 工程服务”，必须改为“加工供货 / 加工服务”。
5. 09-02 不得把“住宿 + 早餐”作为从给付跟随住宿的正面例子。
6. SC-04 主典型场景应包含“废旧金属回收”，建筑物清洁仅作为页边补充或 tooltip。

## 开发侧校验

- `manifest.readingOrder` 必须全部指向有效 pageId。
- `imageAsset.width/height` 必须与实际文件一致。
- overlay 必须绑定 `imageAssetId + imageVersion`。
- comments anchor 绑定图片版本；替换图片必须将旧 anchor 标记为 `needs-review`。
- glossary term 必须用 `termId`，不得在组件里硬编码词条。
