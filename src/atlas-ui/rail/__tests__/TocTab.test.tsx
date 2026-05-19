import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TocTab } from '../tabs/TocTab';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { PageManifest } from '../../../atlas-core/types/page';

function page(id: string, num: number, title: string, sectionCode: string): PageManifest {
  return { pageId: id, sectionCode, type: 'imageOverlay', pageNumber: num, title: { 'zh-CN': title }, layout: { mode: 'single' } } as unknown as PageManifest;
}

function makeRegistry(): BookRegistry {
  const pages = [
    page('toc', 1, 'TOC', 'TOC'),
    page('09', 2, '第 09 章', '09'),
    page('09-01', 3, '统一给付', '09-01'),
    page('sc-01a', 4, 'SC 1A', 'SC-01A'),
    page('sc-02', 5, 'SC 2', 'SC-02'),
  ];
  return {
    manifest: { slug: 'demo', bookId: 'demo-book', readingOrder: pages.map((p) => p.pageId), pages },
    getPage: (id: string) => pages.find((p) => p.pageId === id),
  } as unknown as BookRegistry;
}

describe('TocTab (grouped)', () => {
  beforeEach(() => { localStorage.clear(); });

  it('renders single-page groups flat (TOC)', () => {
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="toc" onNavigate={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText('TOC')).toBeInTheDocument();
  });

  it('multi-page group with real header is expanded when it contains current page', () => {
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="09-01" onNavigate={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText('第 09 章')).toBeInTheDocument();
    expect(screen.getByText('统一给付')).toBeInTheDocument();
  });

  it('multi-page group without real header gets virtual label "场景"', () => {
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="sc-01a" onNavigate={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText(/场景\(2\)/)).toBeInTheDocument();
  });

  it('non-current group is collapsed by default', () => {
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="toc" onNavigate={vi.fn()} /></MemoryRouter>);
    expect(screen.queryByText('SC 1A')).not.toBeInTheDocument();
  });

  it('clicking chevron toggles fold state and persists', async () => {
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="toc" onNavigate={vi.fn()} /></MemoryRouter>);
    const chevronBtn = screen.getByRole('button', { name: /展开场景/ });
    await userEvent.click(chevronBtn);
    expect(screen.getByText('SC 1A')).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem('atlas-toc-folds-demo-book') ?? '{}');
    expect(stored.SC).toBe('expanded');
  });

  it('clicking page navigates via onNavigate', async () => {
    const onNav = vi.fn();
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="09-01" onNavigate={onNav} /></MemoryRouter>);
    await userEvent.click(screen.getByText('统一给付'));
    expect(onNav).toHaveBeenCalledWith('09-01');
  });

  it('renders sticky band container (visibility controlled by IntersectionObserver, mocked)', () => {
    const origIO = (globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
    class IO { observe(){} unobserve(){} disconnect(){} }
    // @ts-expect-error jsdom polyfill
    globalThis.IntersectionObserver = IO;
    render(<MemoryRouter><TocTab registry={makeRegistry()} currentPageId="09-01" onNavigate={vi.fn()} /></MemoryRouter>);
    expect(screen.queryByTestId('toc-sticky')).not.toBeInTheDocument();
    expect(screen.getByTestId('toc-scroll')).toBeInTheDocument();
    (globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver = origIO;
  });
});
