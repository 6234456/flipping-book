// Auto-generated VAT Atlas asset registry v0.3
export const contents = [
  {
    "contentId": "cover-content-v03",
    "pageId": "cover",
    "blocks": [
      {
        "blockId": "cover-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "德国 / 欧盟 VAT 财务速查图册"
          }
        ]
      },
      {
        "blockId": "cover-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "一本面向财务团队的德国 / 欧盟 VAT 可交互速查图册。视觉页为入口，术语、发票、申报、证据与风险提示由结构化数据层控制。"
          }
        ]
      },
      {
        "blockId": "cover-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "先判断交易性质"
            }
          ],
          [
            {
              "type": "text",
              "value": "再判断给付地点"
            }
          ],
          [
            {
              "type": "text",
              "value": "再判断纳税义务人"
            }
          ],
          [
            {
              "type": "text",
              "value": "最后落到发票、申报和证据"
            }
          ]
        ]
      },
      {
        "blockId": "cover-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "中文主标签优先，德语作为法规锚点。"
            }
          ],
          [
            {
              "type": "text",
              "value": "图像只承载视觉；专业文案以结构化 text layer 为准。"
            }
          ],
          [
            {
              "type": "text",
              "value": "热点、术语、notes、comments 均由 manifest 和 registry 驱动。"
            }
          ]
        ]
      },
      {
        "blockId": "cover-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 不要把图像中的生成文字作为税法最终事实。\n• 图片版本变化必须同步 overlay 与 comment anchor。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "toc-content-v03",
    "pageId": "toc",
    "blocks": [
      {
        "blockId": "toc-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "目录与阅读路径"
          }
        ]
      },
      {
        "blockId": "toc-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "本页作为全书导航入口。每个卡片可绑定透明热点，跳转到章节页或 drill-down 页。"
          }
        ]
      },
      {
        "blockId": "toc-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "01 VAT 判断总框架"
            }
          ],
          [
            {
              "type": "text",
              "value": "09 交易性质判断"
            }
          ],
          [
            {
              "type": "text",
              "value": "SC-01 德国国内 B2B"
            }
          ],
          [
            {
              "type": "text",
              "value": "SC-02 欧盟货物交易"
            }
          ],
          [
            {
              "type": "text",
              "value": "SC-03 欧盟 B2B 服务"
            }
          ],
          [
            {
              "type": "text",
              "value": "SC-04 §13b 反向征税"
            }
          ],
          [
            {
              "type": "text",
              "value": "SC-05 进口与出口"
            }
          ],
          [
            {
              "type": "text",
              "value": "SC-06 连环交易"
            }
          ],
          [
            {
              "type": "text",
              "value": "SC-07 三角贸易"
            }
          ],
          [
            {
              "type": "text",
              "value": "SC-08 发票与申报"
            }
          ],
          [
            {
              "type": "text",
              "value": "G 术语表"
            }
          ],
          [
            {
              "type": "text",
              "value": "附录A 货物场景速查"
            }
          ]
        ]
      },
      {
        "blockId": "toc-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "目录热点必须使用 pageId 作为 target。"
            }
          ],
          [
            {
              "type": "text",
              "value": "章节页可不进入 readingOrder，但必须可由 toc 或 hotspot 访问。"
            }
          ],
          [
            {
              "type": "text",
              "value": "移动端使用单页顺序阅读。"
            }
          ]
        ]
      },
      {
        "blockId": "toc-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 不要把 overlay 坐标绑定到未版本化图片。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "vat-framework-content-v03",
    "pageId": "vat-framework",
    "blocks": [
      {
        "blockId": "vat-framework-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "VAT 判断总框架"
          }
        ]
      },
      {
        "blockId": "vat-framework-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "VAT 判断的错误往往发生在第一步：交易本身到底是什么。必须先判断交易性质，再进入地点、纳税义务、发票、申报和证据。"
          }
        ]
      },
      {
        "blockId": "vat-framework-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "交易性质：供应了什么？"
            }
          ],
          [
            {
              "type": "text",
              "value": "给付地点：在哪里征税？"
            }
          ],
          [
            {
              "type": "text",
              "value": "纳税义务：谁申报 VAT？"
            }
          ],
          [
            {
              "type": "text",
              "value": "发票处理：是否列税或提示反向征税？"
            }
          ],
          [
            {
              "type": "text",
              "value": "申报路径：UStVA、ZM、Intrastat？"
            }
          ],
          [
            {
              "type": "text",
              "value": "证据链：VAT ID、到达证明、出口证明、进口凭证？"
            }
          ]
        ]
      },
      {
        "blockId": "vat-framework-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "合同标题不是 VAT 分类。"
            }
          ],
          [
            {
              "type": "text",
              "value": "Incoterms 不是 VAT 结论。"
            }
          ],
          [
            {
              "type": "text",
              "value": "ERP 税码是结果，不是判断依据。"
            }
          ]
        ]
      },
      {
        "blockId": "vat-framework-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 先看发票税率，会掩盖交易性质错误。\n• 把服务、货物、加工供货混同会连锁影响地点与申报。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "transaction-classification-content-v03",
    "pageId": "transaction-classification",
    "blocks": [
      {
        "blockId": "transaction-classification-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "交易性质判断"
          }
        ]
      },
      {
        "blockId": "transaction-classification-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "很多 VAT 错误不是发生在申报字段，而是发生在更早一步：交易本身到底是什么。"
          }
        ]
      },
      {
        "blockId": "transaction-classification-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "一个给付还是多个给付？"
            }
          ],
          [
            {
              "type": "text",
              "value": "货物供应还是服务给付？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否存在法定拟制？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否存在法定拆分要求？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否只是赔偿或价款调整？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否是委托买卖 / 行纪结构？"
            }
          ]
        ]
      },
      {
        "blockId": "transaction-classification-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "价值比例不是决定性因素。"
            }
          ],
          [
            {
              "type": "text",
              "value": "发票分行不是 VAT classification。"
            }
          ],
          [
            {
              "type": "text",
              "value": "专业术语首次出现：中文译名 + 德语原文。"
            }
          ]
        ]
      },
      {
        "blockId": "transaction-classification-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 把工程 / 加工 / 维修全部误判为普通服务。\n• 把合同 package 误认为统一给付。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "09-01-single-supply-content-v03",
    "pageId": "09-01-single-supply",
    "blocks": [
      {
        "blockId": "09-01-single-supply-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "统一给付 / 单一交易"
          }
        ]
      },
      {
        "blockId": "09-01-single-supply-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "判断多个组成部分是否应作为一个 VAT supply 处理，还是拆成多个 taxable components。"
          }
        ]
      },
      {
        "blockId": "09-01-single-supply-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "是否存在多个组成部分？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否由同一企业提供？"
            }
          ],
          [
            {
              "type": "text",
              "value": "客户是否追求一个整体经济结果？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否存在主给付与从给付？"
            }
          ],
          [
            {
              "type": "text",
              "value": "多个元素是否紧密结合、拆分显得人为？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否存在法定拆分要求？"
            }
          ]
        ]
      },
      {
        "blockId": "09-01-single-supply-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "合同、发票、价格结构只是 evidence。"
            }
          ],
          [
            {
              "type": "text",
              "value": "统一经济交易不得人为拆分。"
            }
          ],
          [
            {
              "type": "text",
              "value": "多个独立主给付也不能因 package 强行合并。"
            }
          ]
        ]
      },
      {
        "blockId": "09-01-single-supply-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 金额占比不能替代普通消费者视角。\n• 发票分行不等于多个独立给付。\n• 法定拆分要求优先。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "09-02-main-ancillary-content-v03",
    "pageId": "09-02-main-ancillary",
    "blocks": [
      {
        "blockId": "09-02-main-ancillary-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "主给付 / 从给付"
          }
        ]
      },
      {
        "blockId": "09-02-main-ancillary-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "从给付通常跟随主给付，但这只是一般原则；存在法定拆分要求时，必须拆分处理。"
          }
        ]
      },
      {
        "blockId": "09-02-main-ancillary-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "是否已经识别一个主给付？"
            }
          ],
          [
            {
              "type": "text",
              "value": "该组成部分是否对客户有独立经济目的？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否只是为了更好取得主给付？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否通常伴随主交易出现？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否可单独购买、取消或替换？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否存在法定拆分要求？"
            }
          ]
        ]
      },
      {
        "blockId": "09-02-main-ancillary-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "单独收费本身不是决定性因素。"
            }
          ],
          [
            {
              "type": "text",
              "value": "住宿 + 早餐 / 停车 / minibar / wellness 不能作为从给付正面例子。"
            }
          ],
          [
            {
              "type": "text",
              "value": "销售包装与周转运输器具需区分。"
            }
          ]
        ]
      },
      {
        "blockId": "09-02-main-ancillary-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• “从给付跟随主给付”不是 universal rule。\n• 安装、培训、维护、保证承诺不能机械作为销售从给付。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "09-03-work-supply-service-content-v03",
    "pageId": "09-03-work-supply-service",
    "blocks": [
      {
        "blockId": "09-03-work-supply-service-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "加工供货与加工服务边界"
          }
        ]
      },
      {
        "blockId": "09-03-work-supply-service-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "当加工方对客户或第三方物品加工、维修、安装或改造，并使用自购材料时，需要判断是加工供货还是加工服务。"
          }
        ]
      },
      {
        "blockId": "09-03-work-supply-service-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "是否对他人物品加工 / 处理？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否使用自购材料？"
            }
          ],
          [
            {
              "type": "text",
              "value": "材料是否只是辅料 / 附属材料？"
            }
          ],
          [
            {
              "type": "text",
              "value": "材料是否构成主要材料？"
            }
          ],
          [
            {
              "type": "text",
              "value": "材料是否包含在加工成果中？"
            }
          ],
          [
            {
              "type": "text",
              "value": "动产维修仍不明确时，才检查 50% 材料比例线索。"
            }
          ]
        ]
      },
      {
        "blockId": "09-03-work-supply-service-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "材料 / 人工金额比例不是首要判断标准。"
            }
          ],
          [
            {
              "type": "text",
              "value": "材料费与人工费分列，不自动拆分 VAT treatment。"
            }
          ],
          [
            {
              "type": "text",
              "value": "供应商销售自有产品通常先按普通货物供应判断。"
            }
          ]
        ]
      },
      {
        "blockId": "09-03-work-supply-service-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 禁用“工程供货 / 工程服务”。\n• 不要用“材料价值 > 人工价值”直接下结论。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "09-04-deemed-supply-min-base-content-v03",
    "pageId": "09-04-deemed-supply-min-base",
    "blocks": [
      {
        "blockId": "09-04-deemed-supply-min-base-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "无偿价值转移与最低计税基础"
          }
        ]
      },
      {
        "blockId": "09-04-deemed-supply-min-base-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "区分完全无偿与有偿但低价：前者检查视同给付，后者检查最低计税基础。"
          }
        ]
      },
      {
        "blockId": "09-04-deemed-supply-min-base-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "是否存在对价？"
            }
          ],
          [
            {
              "type": "text",
              "value": "无偿：货物、服务还是资产使用？"
            }
          ],
          [
            {
              "type": "text",
              "value": "货物：是否企业资产且满足进项税 gate？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否有小额礼品、样品或业务原因例外？"
            }
          ],
          [
            {
              "type": "text",
              "value": "低价：是否为员工、股东或关联方场景？"
            }
          ],
          [
            {
              "type": "text",
              "value": "§10(4) value 是否高于实际对价，并受 market value cap 限制？"
            }
          ]
        ]
      },
      {
        "blockId": "09-04-deemed-supply-min-base-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "员工长期私人使用公司车通常不是无偿，而是有偿服务给付。"
            }
          ],
          [
            {
              "type": "text",
              "value": "关联方低价交易不是简单“按市价计税”。"
            }
          ],
          [
            {
              "type": "text",
              "value": "recipient 不能因为赠与方内部计提 VAT 就抵扣进项税。"
            }
          ]
        ]
      },
      {
        "blockId": "09-04-deemed-supply-min-base-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 免费福利不能只做工资税处理。\n• ERP gift item 不能自动排除 VAT。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "09-05-damages-consideration-content-v03",
    "pageId": "09-05-damages-consideration",
    "blocks": [
      {
        "blockId": "09-05-damages-consideration-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "损害赔偿还是对价"
          }
        ]
      },
      {
        "blockId": "09-05-damages-consideration-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "核心是是否存在给付交换：付款方是否取得可识别的给付、容忍、放弃、使用权或经济利益。"
          }
        ]
      },
      {
        "blockId": "09-05-damages-consideration-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "是否存在给付交换？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否只是补偿已发生损害？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否对应容忍 / 放弃 / 不作为？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否只是调整原交易价款？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否涉及提前终止、取消、改约？"
            }
          ],
          [
            {
              "type": "text",
              "value": "take-or-pay 是否对应可用性、保留产能或补提权？"
            }
          ]
        ]
      },
      {
        "blockId": "09-05-damages-consideration-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "真正损害赔偿没有给付交换。"
            }
          ],
          [
            {
              "type": "text",
              "value": "质量扣款和折让通常先检查 §17。"
            }
          ],
          [
            {
              "type": "text",
              "value": "荷兰 VAT 的 take-or-pay 判断对德国有高参考价值。"
            }
          ]
        ]
      },
      {
        "blockId": "09-05-damages-consideration-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• take-or-pay 不应默认作为真正损害赔偿。\n• 客户未实际提货 / 使用，不等于没有给付交换。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "09-06-commission-transaction-content-v03",
    "pageId": "09-06-commission-transaction",
    "blocks": [
      {
        "blockId": "09-06-commission-transaction-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "委托买卖交易 / 行纪交易"
          }
        ]
      },
      {
        "blockId": "09-06-commission-transaction-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "判断中间人到底只是显名代理，还是在 VAT 上被视为买入再卖出。关键是对外名义与内部法律后果的分层。"
          }
        ]
      },
      {
        "blockId": "09-06-commission-transaction-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "交易对象是货物还是服务？"
            }
          ],
          [
            {
              "type": "text",
              "value": "中间人是否以自己名义对外交易？"
            }
          ],
          [
            {
              "type": "text",
              "value": "内部法律后果是否归属于委托方？"
            }
          ],
          [
            {
              "type": "text",
              "value": "货物：销售委托还是采购委托？"
            }
          ],
          [
            {
              "type": "text",
              "value": "服务：是否形成服务委托拟制？"
            }
          ],
          [
            {
              "type": "text",
              "value": "分别检查发票链、货物流、服务流和 VAT 拟制链。"
            }
          ]
        ]
      },
      {
        "blockId": "09-06-commission-transaction-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "受托买卖人对外直接享有权利、承担义务。"
            }
          ],
          [
            {
              "type": "text",
              "value": "内部利益、成本、结算义务、风险和最终法律后果归属于委托方。"
            }
          ],
          [
            {
              "type": "text",
              "value": "“为他人账户”为禁用译法。"
            }
          ]
        ]
      },
      {
        "blockId": "09-06-commission-transaction-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 只收佣金不代表只是代理。\n• 货物流直达客户不代表 VAT 链条跳过中间人。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "09-07-vehicle-maintenance-case-content-v03",
    "pageId": "09-07-vehicle-maintenance-case",
    "blocks": [
      {
        "blockId": "09-07-vehicle-maintenance-case-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "车辆保养、换机油与质保维修"
          }
        ]
      },
      {
        "blockId": "09-07-vehicle-maintenance-case-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "客户取得的是车辆维护 / 修复结果，还是单独购买零部件？本页训练统一给付、主从给付、加工供货 / 加工服务三层判断。"
          }
        ]
      },
      {
        "blockId": "09-07-vehicle-maintenance-case-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "客户是否另行支付？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是单独零部件，还是维护 / 修复结果？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否属于统一保养或维修给付？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否使用维修方自购的主要零部件？"
            }
          ],
          [
            {
              "type": "text",
              "value": "质保场景中，谁实际承担义务，谁向谁结算？"
            }
          ]
        ]
      },
      {
        "blockId": "09-07-vehicle-maintenance-case-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "换机油通常先看维护结果，不自动拆分机油和人工。"
            }
          ],
          [
            {
              "type": "text",
              "value": "保外更换发动机高风险进入加工供货审查。"
            }
          ],
          [
            {
              "type": "text",
              "value": "质保期内更换发动机，客户通常不是重新购买发动机。"
            }
          ]
        ]
      },
      {
        "blockId": "09-07-vehicle-maintenance-case-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 客户免费不代表整条维修结算链没有 VAT。\n• 商业延长保修不能与法定瑕疵担保混同。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "sc-01-domestic-b2b-content-v03",
    "pageId": "sc-01-domestic-b2b",
    "blocks": [
      {
        "blockId": "sc-01-domestic-b2b-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "德国国内 B2B"
          }
        ]
      },
      {
        "blockId": "sc-01-domestic-b2b-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "德国供应商 + 德国客户，不等于一定 19%。应按交易性质、给付地点、免税、反向征税、税率和发票顺序判断。"
          }
        ]
      },
      {
        "blockId": "sc-01-domestic-b2b-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "先完成交易性质判断。"
            }
          ],
          [
            {
              "type": "text",
              "value": "确认给付地点是否在德国。"
            }
          ],
          [
            {
              "type": "text",
              "value": "检查是否免税。"
            }
          ],
          [
            {
              "type": "text",
              "value": "检查是否适用反向征税。"
            }
          ],
          [
            {
              "type": "text",
              "value": "判断税率：19%、7% 或特殊规则。"
            }
          ],
          [
            {
              "type": "text",
              "value": "检查发票、申报和进项税抵扣。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-01-domestic-b2b-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "B2B 不等于自动 reverse charge。"
            }
          ],
          [
            {
              "type": "text",
              "value": "有 VAT 不等于买方一定可抵扣。"
            }
          ],
          [
            {
              "type": "text",
              "value": "税码是结果，不是判断依据。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-01-domestic-b2b-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 免税交易误开 VAT 可能触发 §14c。\n• 低税率必须有明确法律依据。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "sc-02-eu-goods-content-v03",
    "pageId": "sc-02-eu-goods",
    "blocks": [
      {
        "blockId": "sc-02-eu-goods-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "欧盟货物交易"
          }
        ]
      },
      {
        "blockId": "sc-02-eu-goods-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "第一步不是看发票，而是看货物是否实际跨越欧盟成员国边界。"
          }
        ]
      },
      {
        "blockId": "sc-02-eu-goods-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "先确认是货物，不是服务。"
            }
          ],
          [
            {
              "type": "text",
              "value": "确认货物是否实际跨越欧盟成员国边界。"
            }
          ],
          [
            {
              "type": "text",
              "value": "有客户销售：检查欧盟内免税供应 / 欧盟内购置。"
            }
          ],
          [
            {
              "type": "text",
              "value": "无客户销售：检查自有货物调拨。"
            }
          ],
          [
            {
              "type": "text",
              "value": "仓库后续提货：检查寄售库存规则。"
            }
          ],
          [
            {
              "type": "text",
              "value": "多方买卖一次运输：转入连环交易。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-02-eu-goods-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "VAT ID 不是运输证明。"
            }
          ],
          [
            {
              "type": "text",
              "value": "自有货物跨境移动也可能产生 VAT 后果。"
            }
          ],
          [
            {
              "type": "text",
              "value": "Intrastat 是统计申报，不是 VAT 申报。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-02-eu-goods-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• EXW 自提不是免税保证。\n• 寄售库存必须满足 §6b 条件。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "sc-03-eu-b2b-services-content-v03",
    "pageId": "sc-03-eu-b2b-services",
    "blocks": [
      {
        "blockId": "sc-03-eu-b2b-services-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "欧盟 B2B 服务"
          }
        ]
      },
      {
        "blockId": "sc-03-eu-b2b-services-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "跨境服务先判断服务性质、客户身份和固定机构，再检查不动产、活动入场、短期租赁、餐饮等特殊地点规则。"
          }
        ]
      },
      {
        "blockId": "sc-03-eu-b2b-services-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "确认是服务给付。"
            }
          ],
          [
            {
              "type": "text",
              "value": "判断客户是否为企业客户。"
            }
          ],
          [
            {
              "type": "text",
              "value": "判断服务提供给客户总部还是固定机构。"
            }
          ],
          [
            {
              "type": "text",
              "value": "检查是否属于特殊服务。"
            }
          ],
          [
            {
              "type": "text",
              "value": "德国供应商向欧盟企业：通常不列德国 VAT，检查 ZM。"
            }
          ],
          [
            {
              "type": "text",
              "value": "德国企业从欧盟供应商取得服务：通常按 §13b 自申报。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-03-eu-b2b-services-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "VAT ID 不是全部判断。"
            }
          ],
          [
            {
              "type": "text",
              "value": "付款方不一定是服务接受方。"
            }
          ],
          [
            {
              "type": "text",
              "value": "服务交易不做 Intrastat。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-03-eu-b2b-services-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 不动产、活动入场、短期租赁、餐饮不能套普通 B2B 规则。\n• 发票写 reverse charge 不等于法律上适用。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "sc-04-reverse-charge-content-v03",
    "pageId": "sc-04-reverse-charge",
    "blocks": [
      {
        "blockId": "sc-04-reverse-charge-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "§13b 反向征税"
          }
        ]
      },
      {
        "blockId": "sc-04-reverse-charge-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "先确认交易在德国应税且不免税，再确认是否落入 §13b 列举场景，最后确认接受方是否满足身份条件。"
          }
        ]
      },
      {
        "blockId": "sc-04-reverse-charge-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "交易是否在德国应税？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否应税且不免税？"
            }
          ],
          [
            {
              "type": "text",
              "value": "是否属于 §13b 列举场景？"
            }
          ],
          [
            {
              "type": "text",
              "value": "接受方是否满足身份条件？"
            }
          ],
          [
            {
              "type": "text",
              "value": "发票是否不列税并注明反向征税？"
            }
          ],
          [
            {
              "type": "text",
              "value": "接受方是否完成自申报与抵扣检查？"
            }
          ]
        ]
      },
      {
        "blockId": "sc-04-reverse-charge-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "境外供应商德国给付：欧盟或第三国供应商均需检查。"
            }
          ],
          [
            {
              "type": "text",
              "value": "废旧金属回收替代清洁服务作为典型主卡。"
            }
          ],
          [
            {
              "type": "text",
              "value": "建筑服务必须检查接受方是否持续提供建筑服务。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-04-reverse-charge-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• B2B 不等于自动 §13b。\n• 德国 VAT ID 不等于德国设立。\n• 发票文字不能替代法律判断。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "sc-05-import-export-content-v03",
    "pageId": "sc-05-import-export",
    "blocks": [
      {
        "blockId": "sc-05-import-export-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "进口与出口"
          }
        ]
      },
      {
        "blockId": "sc-05-import-export-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "第三国客户地址不等于出口免税；清关付款人不一定是进口增值税抵扣权利人。"
          }
        ]
      },
      {
        "blockId": "sc-05-import-export-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "先确认是货物。"
            }
          ],
          [
            {
              "type": "text",
              "value": "货物离开欧盟：检查出口供应和出口证明。"
            }
          ],
          [
            {
              "type": "text",
              "value": "货物进入德国：检查进口清关、进口增值税和抵扣资格。"
            }
          ],
          [
            {
              "type": "text",
              "value": "多方买卖一次运输：转入连环交易。"
            }
          ],
          [
            {
              "type": "text",
              "value": "Incoterms 只作线索，不是 VAT 结论。"
            }
          ],
          [
            {
              "type": "text",
              "value": "最后检查发票、海关凭证、ERP 税码和申报。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-05-import-export-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "Commercial invoice 不是出口完成证明。"
            }
          ],
          [
            {
              "type": "text",
              "value": "DDP 德国交付可能触发供应方德国 VAT 风险。"
            }
          ],
          [
            {
              "type": "text",
              "value": "进口增值税不是供应商发票 VAT。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-05-import-export-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• EXW 自提不是出口免税保证。\n• 货代参与清关通常不取得进口 VAT 抵扣资格。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "sc-06-chain-transaction-content-v03",
    "pageId": "sc-06-chain-transaction",
    "blocks": [
      {
        "blockId": "sc-06-chain-transaction-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "连环交易"
          }
        ]
      },
      {
        "blockId": "sc-06-chain-transaction-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "同一货物、多方连续买卖、一次直接运输时，唯一一次运输只能归属于其中一段供应。"
          }
        ]
      },
      {
        "blockId": "sc-06-chain-transaction-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "是否为同一货物连续买卖？"
            }
          ],
          [
            {
              "type": "text",
              "value": "货物是否从第一方直接到最后一方？"
            }
          ],
          [
            {
              "type": "text",
              "value": "谁安排唯一一次运输？"
            }
          ],
          [
            {
              "type": "text",
              "value": "中间商运输时，是否使用起运国 VAT ID / 税号？"
            }
          ],
          [
            {
              "type": "text",
              "value": "确认有运输归属的供应。"
            }
          ],
          [
            {
              "type": "text",
              "value": "其他段作为静止供应判断地点和税务处理。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-06-chain-transaction-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "只有一段供应可以享受运输归属。"
            }
          ],
          [
            {
              "type": "text",
              "value": "静止供应不是无税。"
            }
          ],
          [
            {
              "type": "text",
              "value": "中间商使用哪个 VAT ID，可能改变整条链。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-06-chain-transaction-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 不要把所有三方交易写成三角贸易。\n• Incoterms 不能替代运输归属判断。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "sc-07-triangular-trade-content-v03",
    "pageId": "sc-07-triangular-trade",
    "blocks": [
      {
        "blockId": "sc-07-triangular-trade-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "三角贸易"
          }
        ]
      },
      {
        "blockId": "sc-07-triangular-trade-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "三角贸易是连环交易中的特殊简化规则；三方以上交易不能整链套用，必须先按连环交易切分。"
          }
        ]
      },
      {
        "blockId": "sc-07-triangular-trade-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "是否为同一货物三方连续买卖？"
            }
          ],
          [
            {
              "type": "text",
              "value": "三方是否使用不同成员国 VAT ID？"
            }
          ],
          [
            {
              "type": "text",
              "value": "货物是否从第一卖方直接到最终买方？"
            }
          ],
          [
            {
              "type": "text",
              "value": "运输是否由第一卖方或中间商作为第一买方安排？"
            }
          ],
          [
            {
              "type": "text",
              "value": "中间商是否未在目的国设立，并使用非目的国 VAT ID？"
            }
          ],
          [
            {
              "type": "text",
              "value": "发票是否写明三角贸易和最终买方纳税义务？"
            }
          ]
        ]
      },
      {
        "blockId": "sc-07-triangular-trade-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "主图使用：第一卖方 / 中间商 / 最终买方。"
            }
          ],
          [
            {
              "type": "text",
              "value": "最终买方自提通常不能适用简化。"
            }
          ],
          [
            {
              "type": "text",
              "value": "第三国公司也可能参与，但必须以欧盟成员国 VAT ID 进入判断。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-07-triangular-trade-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 三方交易不等于三角贸易。\n• 三方以上交易不能整链套用；只有合格连续三方片段可能适用。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "sc-08-invoice-reporting-content-v03",
    "pageId": "sc-08-invoice-reporting",
    "blocks": [
      {
        "blockId": "sc-08-invoice-reporting-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "发票与申报"
          }
        ]
      },
      {
        "blockId": "sc-08-invoice-reporting-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "发票与申报不是 VAT 判断的起点，而是 VAT 判断的结果。"
          }
        ]
      },
      {
        "blockId": "sc-08-invoice-reporting-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "先确认 VAT 定性。"
            }
          ],
          [
            {
              "type": "text",
              "value": "判断发票应列 VAT、不列 VAT、反向征税、免税还是三角贸易 wording。"
            }
          ],
          [
            {
              "type": "text",
              "value": "判断是否进入 UStVA、ZM、Intrastat。"
            }
          ],
          [
            {
              "type": "text",
              "value": "检查电子发票与结构化数据。"
            }
          ],
          [
            {
              "type": "text",
              "value": "检查到达证明、出口证明、进口凭证。"
            }
          ],
          [
            {
              "type": "text",
              "value": "检查 §14c、§17 与进项税抵扣风险。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-08-invoice-reporting-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "电子发票不是普通 PDF。"
            }
          ],
          [
            {
              "type": "text",
              "value": "UStVA、ZM、Intrastat 是三套不同申报。"
            }
          ],
          [
            {
              "type": "text",
              "value": "ERP 税码是结果，不是法律依据。"
            }
          ]
        ]
      },
      {
        "blockId": "sc-08-invoice-reporting-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 发票有 VAT 不等于一定可抵扣。\n• 错误列税可能触发 §14c。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "glossary-content-v03",
    "pageId": "glossary",
    "blocks": [
      {
        "blockId": "glossary-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "术语表与悬浮提示词库"
          }
        ]
      },
      {
        "blockId": "glossary-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "术语表不是普通附录，而是全书术语控制层。图中文字、tooltip、页边补充、法规锚点和最终打包文件必须一致。"
          }
        ]
      },
      {
        "blockId": "glossary-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "中文主译名优先。"
            }
          ],
          [
            {
              "type": "text",
              "value": "首次出现：中文术语（德语原文）。"
            }
          ],
          [
            {
              "type": "text",
              "value": "后续出现：只写中文主译名。"
            }
          ],
          [
            {
              "type": "text",
              "value": "图中放短定义，长解释进入 tooltip。"
            }
          ],
          [
            {
              "type": "text",
              "value": "同一术语全书只允许一个中文译法。"
            }
          ]
        ]
      },
      {
        "blockId": "glossary-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "Werklieferung = 加工供货。"
            }
          ],
          [
            {
              "type": "text",
              "value": "Werkleistung = 加工服务。"
            }
          ],
          [
            {
              "type": "text",
              "value": "für fremde Rechnung = 内部法律后果归属于委托方。"
            }
          ],
          [
            {
              "type": "text",
              "value": "E-Rechnung = 电子发票。"
            }
          ],
          [
            {
              "type": "text",
              "value": "三角贸易主图：第一卖方 / 中间商 / 最终买方。"
            }
          ]
        ]
      },
      {
        "blockId": "glossary-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 禁用：工程供货 / 工程服务。\n• 禁用：为他人账户。\n• 禁用：第一供应方 / 最终取得方。"
          }
        ]
      }
    ]
  },
  {
    "contentId": "appendix-goods-quick-reference-content-v03",
    "pageId": "appendix-goods-quick-reference",
    "blocks": [
      {
        "blockId": "appendix-goods-quick-reference-heading",
        "type": "heading",
        "level": 1,
        "text": [
          {
            "type": "text",
            "value": "常用货物场景速查"
          }
        ]
      },
      {
        "blockId": "appendix-goods-quick-reference-core",
        "type": "callout",
        "variant": "info",
        "title": [
          {
            "type": "text",
            "value": "核心问题 / 页面定位"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "先判断货物路径，再决定进入哪个章节。客户国别和 Incoterms 都不是 VAT 结论。"
          }
        ]
      },
      {
        "blockId": "appendix-goods-quick-reference-flow",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "判断流程"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "德国公司是卖方还是买方？"
            }
          ],
          [
            {
              "type": "text",
              "value": "货物留在德国、去欧盟，还是去第三国？"
            }
          ],
          [
            {
              "type": "text",
              "value": "欧盟方向：检查 VAT ID 与到达证明。"
            }
          ],
          [
            {
              "type": "text",
              "value": "第三国出口：检查出口完成确认。"
            }
          ],
          [
            {
              "type": "text",
              "value": "第三国进口：检查清关主体、进口税债务人和处分权。"
            }
          ],
          [
            {
              "type": "text",
              "value": "多方买卖一次运输：转入连环交易。"
            }
          ]
        ]
      },
      {
        "blockId": "appendix-goods-quick-reference-key",
        "type": "checklist",
        "title": [
          {
            "type": "text",
            "value": "关键规则"
          }
        ],
        "items": [
          [
            {
              "type": "text",
              "value": "VAT ID 不是到达证明。"
            }
          ],
          [
            {
              "type": "text",
              "value": "EXW 自提不是免税保证。"
            }
          ],
          [
            {
              "type": "text",
              "value": "商业发票不是出口完成证明。"
            }
          ],
          [
            {
              "type": "text",
              "value": "DDP 德国交付可能触发供应方德国 VAT 风险。"
            }
          ]
        ]
      },
      {
        "blockId": "appendix-goods-quick-reference-risk",
        "type": "callout",
        "variant": "risk",
        "title": [
          {
            "type": "text",
            "value": "高风险误区"
          }
        ],
        "body": [
          {
            "type": "text",
            "value": "• 客户在欧盟 / 第三国不等于自动免税。\n• 清关付款人不一定是进口增值税抵扣权利人。"
          }
        ]
      }
    ]
  }
] as const;
export default contents;
