import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GlossaryPageTemplate } from '../GlossaryPageTemplate';
import { createBookRegistry } from '../../../atlas-core/registry';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { BookManifest } from '../../../atlas-core/types/manifest';
import type { GlossaryEntry } from '../../../atlas-core/types/glossary';

function makeRegistry(): BookRegistry {
  const manifest: BookManifest = {
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

  const glossary: GlossaryEntry[] = [
    {
      termId: "leistung",
      zh: "给付",
      original: "Leistung",
      category: "vat-basic",
      shortDefinition: "VAT 判断的基本对象",
      firstMentionFormat: "给付（Leistung）",
    },
    {
      termId: "lieferung",
      zh: "货物供应",
      original: "Lieferung",
      category: "goods",
      shortDefinition: "使对方取得像所有者一样处分物的能力",
      firstMentionFormat: "货物供应（Lieferung）",
    },
  ];

  return createBookRegistry(manifest, [], [], glossary, [], [], [], [], []);
}

describe('GlossaryPageTemplate', () => {
  it('renders all glossary terms grouped by category', () => {
    const registry = makeRegistry();
    render(
      <MemoryRouter>
        <GlossaryPageTemplate registry={registry} />
      </MemoryRouter>
    );
    expect(screen.getByText('给付（Leistung）')).toBeInTheDocument();
    expect(screen.getByText('货物供应（Lieferung）')).toBeInTheDocument();
  });

  it('shows category headers', () => {
    render(
      <MemoryRouter>
        <GlossaryPageTemplate registry={makeRegistry()} />
      </MemoryRouter>
    );
    expect(screen.getByText('VAT 基础概念')).toBeInTheDocument();
    expect(screen.getByText('货物供应')).toBeInTheDocument();
  });

  it('shows term definitions', () => {
    render(
      <MemoryRouter>
        <GlossaryPageTemplate registry={makeRegistry()} />
      </MemoryRouter>
    );
    expect(screen.getByText('VAT 判断的基本对象')).toBeInTheDocument();
  });

  it('has anchor IDs for term linking', () => {
    const { container } = render(
      <MemoryRouter>
        <GlossaryPageTemplate registry={makeRegistry()} />
      </MemoryRouter>
    );
    expect(container.querySelector('#leistung')).toBeInTheDocument();
    expect(container.querySelector('#lieferung')).toBeInTheDocument();
  });
});
