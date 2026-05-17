import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReaderRail } from '../ReaderRail';
import type { BookRegistry } from '../../../atlas-core/registry';

function makeRegistry(): BookRegistry {
  return {
    manifest: { slug: 'demo', bookId: 'demo', readingOrder: [] } as unknown as BookRegistry['manifest'],
    notes: new Map(),
    getPage: () => undefined,
  } as unknown as BookRegistry;
}

const noop = vi.fn();
const baseProps = {
  registry: makeRegistry(),
  threads: [],
  noteIds: [],
  currentPageId: null,
  selectedThreadId: null,
  highlightedThreadId: null,
  open: true,
  tab: 'comments' as const,
  width: 320,
  onTabChange: vi.fn(),
  onCollapse: vi.fn(),
  onExpand: vi.fn(),
  onPlusClick: vi.fn(),
  onNavigate: vi.fn(),
  onSelectThread: noop,
  onHoverThread: noop,
  onAddMessage: noop,
  onResolve: noop,
  onReopen: noop,
  onDeleteThread: noop,
  onEditMessage: noop,
  onDeleteMessage: noop,
};

describe('ReaderRail', () => {
  it('renders expanded rail when open=true', () => {
    render(
      <MemoryRouter>
        <ReaderRail {...baseProps} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders slim rail when open=false', () => {
    render(
      <MemoryRouter>
        <ReaderRail {...baseProps} open={false} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('toolbar', { name: /侧栏/ })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('shows active tab content (comments)', () => {
    render(
      <MemoryRouter>
        <ReaderRail {...baseProps} tab="comments" />
      </MemoryRouter>,
    );
    expect(screen.getByText('这一页还没有评论')).toBeInTheDocument();
  });

  it('shows notes tab content when tab=notes', () => {
    render(
      <MemoryRouter>
        <ReaderRail {...baseProps} tab="notes" />
      </MemoryRouter>,
    );
    expect(screen.getByText('这一页还没有笔记')).toBeInTheDocument();
  });
});
