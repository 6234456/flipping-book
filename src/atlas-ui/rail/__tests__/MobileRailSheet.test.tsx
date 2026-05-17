import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MobileRailSheet } from '../MobileRailSheet';
import type { BookRegistry } from '../../../atlas-core/registry';

const registry = {
  manifest: { slug: 'demo', bookId: 'demo', readingOrder: [] } as unknown as BookRegistry['manifest'],
  notes: new Map(),
  getPage: () => undefined,
} as unknown as BookRegistry;

const noop = vi.fn();
const baseProps = {
  registry,
  threads: [],
  noteIds: [],
  currentPageId: null,
  selectedThreadId: null,
  highlightedThreadId: null,
  tab: 'comments' as const,
  onTabChange: vi.fn(),
  onClose: vi.fn(),
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

describe('MobileRailSheet', () => {
  it('renders dialog role', () => {
    render(
      <MemoryRouter>
        <MobileRailSheet {...baseProps} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders tab strip', () => {
    render(
      <MemoryRouter>
        <MobileRailSheet {...baseProps} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('tab', { name: /评论/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /笔记/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /目录/ })).toBeInTheDocument();
  });

  it('close button calls onClose', async () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <MobileRailSheet {...baseProps} onClose={onClose} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /关闭侧栏/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
