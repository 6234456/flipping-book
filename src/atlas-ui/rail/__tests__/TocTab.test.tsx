import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TocTab } from '../tabs/TocTab';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { PageManifest } from '../../../atlas-core/types/page';

function page(id: string, num: number, title: string): PageManifest {
  return { pageId: id, type: 'imageOverlay', pageNumber: num, title: { 'zh-CN': title }, layout: { mode: 'single' } } as unknown as PageManifest;
}

function makeRegistry(): BookRegistry {
  return {
    manifest: {
      slug: 'demo',
      bookId: 'demo',
      readingOrder: ['p1', 'p2', 'p3'],
    } as unknown as BookRegistry['manifest'],
    getPage: (id: string) => {
      const map: Record<string, PageManifest> = {
        p1: page('p1', 1, '封面'),
        p2: page('p2', 2, '导论'),
        p3: page('p3', 3, '三角贸易'),
      };
      return map[id];
    },
  } as unknown as BookRegistry;
}

describe('TocTab', () => {
  it('renders all pages from readingOrder', () => {
    render(
      <MemoryRouter>
        <TocTab registry={makeRegistry()} currentPageId="p2" onNavigate={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('封面')).toBeInTheDocument();
    expect(screen.getByText('导论')).toBeInTheDocument();
    expect(screen.getByText('三角贸易')).toBeInTheDocument();
  });

  it('highlights the current page', () => {
    render(
      <MemoryRouter>
        <TocTab registry={makeRegistry()} currentPageId="p2" onNavigate={vi.fn()} />
      </MemoryRouter>,
    );
    const current = screen.getByText('导论').closest('[data-toc-current]');
    expect(current).toHaveAttribute('data-toc-current', 'true');
  });

  it('clicking item calls onNavigate with pageId', async () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <TocTab registry={makeRegistry()} currentPageId="p1" onNavigate={onNavigate} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByText('三角贸易'));
    expect(onNavigate).toHaveBeenCalledWith('p3');
  });
});
