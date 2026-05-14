import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContentBlockRenderer } from '../ContentBlockRenderer';
import { createBookRegistry } from '../../../atlas-core/registry';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { BookManifest } from '../../../atlas-core/types/manifest';
import type { ContentBlock } from '../../../atlas-core/types/content';

const emptyManifest: BookManifest = {
  schemaVersion: "1.0",
  bookId: "test", slug: "test",
  title: { "zh-CN": "测试" },
  version: "0.1",
  defaultLocale: "zh-CN",
  supportedLocales: ["zh-CN"],
  visualSystem: "VAT_ATLAS_MAGAZINE_V2",
  reader: {
    defaultMode: "auto", allowModeSwitch: true,
    transition: "magazine-slide",
    enableKeyboardNavigation: true, enableSwipeNavigation: true,
    enableProgressBar: true, enableTableOfContents: true,
    defaultZoom: "fit-width",
    spreadBehavior: {
      desktopDefault: "spread", mobileDefault: "single",
      spreadPageAdvance: "by-spread",
      keyboard: { arrowLeft: "previous", arrowRight: "next" },
      clickZones: { enabled: true, leftEdgePercent: 8, rightEdgePercent: 8 },
    },
  },
  pages: [],
  readingOrder: [],
  registries: { imageAssets: "", overlays: "", glossary: "" },
};

let registry: BookRegistry;

function renderBlock(block: ContentBlock) {
  if (!registry) {
    registry = createBookRegistry(emptyManifest, [], [], [], [], [], [], [], []);
  }
  return render(
    <MemoryRouter>
      <ContentBlockRenderer block={block} registry={registry} bookSlug="test" />
    </MemoryRouter>
  );
}

describe('ContentBlockRenderer', () => {
  it('renders heading with correct level', () => {
    renderBlock({
      blockId: "h1",
      type: "heading",
      level: 2,
      text: [{ type: "text", value: "章节标题" }],
    });
    const h2 = screen.getByText('章节标题');
    expect(h2.tagName).toBe('H2');
  });

  it('renders paragraph', () => {
    renderBlock({
      blockId: "p1",
      type: "paragraph",
      text: [{ type: "text", value: "这是一段文字" }],
    });
    expect(screen.getByText('这是一段文字')).toBeInTheDocument();
  });

  it('renders callout with variant', () => {
    renderBlock({
      blockId: "c1",
      type: "callout",
      variant: "warning",
      title: [{ type: "text", value: "注意" }],
      body: [{ type: "text", value: "重要提示内容" }],
    });
    expect(screen.getByText('注意')).toBeInTheDocument();
    expect(screen.getByText('重要提示内容')).toBeInTheDocument();
  });

  it('renders callout without title', () => {
    renderBlock({
      blockId: "c2",
      type: "callout",
      variant: "info",
      body: [{ type: "text", value: "纯信息" }],
    });
    expect(screen.getByText('纯信息')).toBeInTheDocument();
  });

  it('renders checklist', () => {
    renderBlock({
      blockId: "cl1",
      type: "checklist",
      title: [{ type: "text", value: "清单" }],
      items: [
        [{ type: "text", value: "项目1" }],
        [{ type: "text", value: "项目2" }],
      ],
    });
    expect(screen.getByText('清单')).toBeInTheDocument();
    expect(screen.getByText('项目1')).toBeInTheDocument();
    expect(screen.getByText('项目2')).toBeInTheDocument();
  });

  it('renders comparison table', () => {
    renderBlock({
      blockId: "t1",
      type: "comparisonTable",
      columns: [
        { columnId: "col1", header: [{ type: "text", value: "列A" }] },
        { columnId: "col2", header: [{ type: "text", value: "列B" }] },
      ],
      rows: [
        {
          rowId: "r1",
          cells: {
            col1: [{ type: "text", value: "值A1" }],
            col2: [{ type: "text", value: "值B1" }],
          },
        },
      ],
    });
    expect(screen.getByText('列A')).toBeInTheDocument();
    expect(screen.getByText('值A1')).toBeInTheDocument();
  });

  it('renders scenario summary stub', () => {
    renderBlock({
      blockId: "ss1",
      type: "scenarioSummary",
      scenarioId: "sc-01",
    });
    expect(screen.getByText(/sc-01/)).toBeInTheDocument();
  });
});
