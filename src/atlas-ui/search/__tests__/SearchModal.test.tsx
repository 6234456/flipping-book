import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SearchModal } from '../SearchModal';
import { createBookRegistry } from '../../../atlas-core/registry';
import type { BookManifest } from '../../../atlas-core/types/manifest';

function makeRegistry() {
  const manifest = {
    schemaVersion: '1.0', bookId: 'b', slug: 'b', version: '0.1',
    title: { 'zh-CN': 'B' }, defaultLocale: 'zh-CN', supportedLocales: ['zh-CN'],
    visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
    reader: { defaultMode: 'auto', allowModeSwitch: false, transition: 'fade',
      enableKeyboardNavigation: true, enableSwipeNavigation: true, enableProgressBar: true,
      enableTableOfContents: true, defaultZoom: 'fit-page',
      spreadBehavior: { desktopDefault: 'single', mobileDefault: 'single', spreadPageAdvance: 'by-page',
        keyboard: { arrowLeft: 'previous', arrowRight: 'next' },
        clickZones: { enabled: false, leftEdgePercent: 0, rightEdgePercent: 0 } } },
    pages: [
      { pageId: 'p-01', slug: '/p/01', type: 'imageOverlay', sectionCode: '01', pageNumber: 1,
        title: { 'zh-CN': 'VAT 判断' }, layout: { mode: 'single', format: 'custom', size: { preset: 'custom', width: 1086, height: 1448 }, background: 'image' } },
    ] as unknown,
    readingOrder: ['p-01'],
    registries: { imageAssets: '', overlays: '', glossary: '' },
  } as unknown as BookManifest;
  return createBookRegistry(manifest, [], [], [{
    termId: 'reverse-charge', zh: '反向征税', original: 'Reverse Charge',
    category: 'vat-basic', shortDefinition: '接收方申报',
    firstMentionFormat: '反向征税 (Reverse Charge)',
  }] as never, [], [], [], [], []);
}

describe('SearchModal', () => {
  it('renders nothing when closed', () => {
    render(<SearchModal open={false} onOpenChange={vi.fn()} registry={makeRegistry()} onSelectResult={vi.fn()} />);
    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
  });

  it('renders input when open', () => {
    render(<SearchModal open={true} onOpenChange={vi.fn()} registry={makeRegistry()} onSelectResult={vi.fn()} />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('shows grouped results matching the query', async () => {
    render(<SearchModal open={true} onOpenChange={vi.fn()} registry={makeRegistry()} onSelectResult={vi.fn()} />);
    await userEvent.type(screen.getByTestId('search-input'), '反向');
    expect(screen.getByText('术语 (1)')).toBeInTheDocument();
  });

  it('clicking a result calls onSelectResult then closes', async () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(<SearchModal open={true} onOpenChange={onOpenChange} registry={makeRegistry()} onSelectResult={onSelect} />);
    await userEvent.type(screen.getByTestId('search-input'), '反向');
    const result = await screen.findByRole('option');
    await userEvent.click(result);
    expect(onSelect).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('Enter selects active row', async () => {
    const onSelect = vi.fn();
    render(<SearchModal open={true} onOpenChange={vi.fn()} registry={makeRegistry()} onSelectResult={onSelect} />);
    const input = screen.getByTestId('search-input');
    await userEvent.type(input, '反向');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalled();
  });
});
