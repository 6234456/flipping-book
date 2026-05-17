import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ThreadList } from '../ThreadList';
import type { CommentThread } from '../../../atlas-core/types/comments';

function buildThread(id: string, status: CommentThread['status'] = 'open'): CommentThread {
  return {
    threadId: id,
    bookId: 'b',
    pageId: 'p',
    anchor: { kind: 'imagePoint', pageId: 'p', imageAssetId: 'img', imageVersion: 'v1', x: 50, y: 50 },
    status,
    category: 'question',
    messages: [
      { messageId: 'm1', authorId: 'a', body: [{ type: 'text', value: `body-${id}` }], createdAt: new Date().toISOString() },
    ],
    createdBy: 'a',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const handlers = {
  onSelectThread: vi.fn(),
  onHoverThread: vi.fn(),
  onAddMessage: vi.fn(),
  onResolve: vi.fn(),
  onReopen: vi.fn(),
  onDeleteThread: vi.fn(),
  onEditMessage: vi.fn(),
  onDeleteMessage: vi.fn(),
};

describe('ThreadList', () => {
  it('renders each thread', () => {
    const threads = [buildThread('t1'), buildThread('t2')];
    render(<ThreadList threads={threads} selectedThreadId={null} highlightedThreadId={null} {...handlers} />);
    expect(screen.getByText('body-t1')).toBeInTheDocument();
    expect(screen.getByText('body-t2')).toBeInTheDocument();
  });

  it('renders EmptyState when no threads', () => {
    render(<ThreadList threads={[]} selectedThreadId={null} highlightedThreadId={null} {...handlers} />);
    expect(screen.getByText('这一页还没有评论')).toBeInTheDocument();
  });

  it('clicking thread row calls onSelectThread', async () => {
    const onSelectThread = vi.fn();
    render(<ThreadList threads={[buildThread('t1')]} selectedThreadId={null} highlightedThreadId={null} {...handlers} onSelectThread={onSelectThread} />);
    await userEvent.click(screen.getByText('body-t1'));
    expect(onSelectThread).toHaveBeenCalledWith('t1');
  });

  it('highlight applies accent-bg-faint bg when highlightedThreadId matches', () => {
    const { container } = render(<ThreadList threads={[buildThread('t1')]} selectedThreadId={null} highlightedThreadId="t1" {...handlers} />);
    expect(container.querySelector('[data-thread-highlighted="true"]')).not.toBeNull();
  });

  it('expanded thread (selected) shows resolve button when open', () => {
    render(<ThreadList threads={[buildThread('t1')]} selectedThreadId="t1" highlightedThreadId={null} {...handlers} />);
    expect(screen.getByRole('button', { name: /标记已解决/ })).toBeInTheDocument();
  });
});
