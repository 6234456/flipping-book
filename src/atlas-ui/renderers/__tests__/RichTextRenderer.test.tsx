import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RichTextRenderer } from '../RichTextRenderer';
import type { RichTextNode } from '../../../atlas-core/types/content';
import type { BookRegistry } from '../../../atlas-core/registry';
import { createBookRegistry } from '../../../atlas-core/registry';
import type { BookManifest } from '../../../atlas-core/types/manifest';
import type { GlossaryEntry } from '../../../atlas-core/types/glossary';

function makeTestRegistry(): BookRegistry {
  const manifest: BookManifest = {
    schemaVersion: "1.0",
    bookId: "test",
    slug: "test",
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
    pages: [
      {
        pageId: "target-page",
        slug: "/target",
        type: "imageOverlay",
        title: { "zh-CN": "目标页" },
        layout: {
          mode: "single", format: "magazine-portrait",
          size: { preset: "magazine-portrait-1000", width: 1000, height: 1414 },
          background: "image",
        },
      },
    ],
    readingOrder: ["target-page"],
    registries: { imageAssets: "", overlays: "", glossary: "" },
  };

  const glossary: GlossaryEntry[] = [{
    termId: "leistung",
    zh: "给付",
    original: "Leistung",
    category: "vat-basic",
    shortDefinition: "VAT 判断的基本对象",
    firstMentionFormat: "给付（Leistung）",
  }];

  return createBookRegistry(manifest, [], [], glossary, [], [], [], [], []);
}

function renderNodes(nodes: RichTextNode[]) {
  const registry = makeTestRegistry();
  return render(
    <MemoryRouter>
      <RichTextRenderer nodes={nodes} registry={registry} bookSlug="test" />
    </MemoryRouter>
  );
}

describe('RichTextRenderer', () => {
  it('renders plain text', () => {
    renderNodes([{ type: 'text', value: 'Hello World' }]);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders strong text', () => {
    renderNodes([
      { type: 'strong', children: [{ type: 'text', value: 'Bold' }] },
    ]);
    const el = screen.getByText('Bold');
    expect(el.tagName).toBe('STRONG');
  });

  it('renders emphasized text', () => {
    renderNodes([
      { type: 'em', children: [{ type: 'text', value: 'Italic' }] },
    ]);
    const el = screen.getByText('Italic');
    expect(el.tagName).toBe('EM');
  });

  it('renders nested formatting', () => {
    renderNodes([
      {
        type: 'strong',
        children: [
          { type: 'text', value: 'Bold ' },
          { type: 'em', children: [{ type: 'text', value: 'and Italic' }] },
        ],
      },
    ]);
    expect(screen.getByText(/Bold/)).toBeInTheDocument();
    expect(screen.getByText('and Italic')).toBeInTheDocument();
  });

  it('renders term with dotted underline', () => {
    renderNodes([
      { type: 'term', termId: 'leistung', first: true },
    ]);
    const term = screen.getByText('给付（Leistung）');
    expect(term.className).toContain('term');
  });

  it('renders term without first when not specified', () => {
    renderNodes([
      { type: 'term', termId: 'leistung' },
    ]);
    // Without first=true, shows original
    expect(screen.getByText('Leistung')).toBeInTheDocument();
  });

  it('renders page link', () => {
    renderNodes([
      { type: 'pageLink', pageId: 'target-page', label: '跳转' },
    ]);
    const link = screen.getByText('跳转');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/book/test/page/target-page');
  });

  it('renders page link with fallback label from page title', () => {
    renderNodes([
      { type: 'pageLink', pageId: 'target-page' },
    ]);
    expect(screen.getByText('目标页')).toBeInTheDocument();
  });

  it('renders legal ref as link', () => {
    renderNodes([
      { type: 'legalRef', legalRefId: 'ustg-1' },
    ]);
    const link = screen.getByText('ustg-1');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/book/test/legal/ustg-1');
  });

  it('renders scenario link', () => {
    renderNodes([
      { type: 'scenarioLink', scenarioId: 'sc-01', label: '场景1' },
    ]);
    const link = screen.getByText('场景1');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/book/test/scenario/sc-01');
  });

  it('renders mixed content', () => {
    renderNodes([
      { type: 'text', value: '根据 ' },
      { type: 'term', termId: 'leistung', first: true },
      { type: 'text', value: ' 的定义，参见 ' },
      { type: 'legalRef', legalRefId: 'ustg-1-1' },
      { type: 'text', value: '。' },
    ]);
    expect(screen.getByText(/根据/)).toBeInTheDocument();
    expect(screen.getByText('给付（Leistung）')).toBeInTheDocument();
    expect(screen.getByText(/参见/)).toBeInTheDocument();
    expect(screen.getByText('ustg-1-1')).toBeInTheDocument();
  });
});
