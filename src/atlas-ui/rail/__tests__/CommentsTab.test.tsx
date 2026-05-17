import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommentsTab } from '../tabs/CommentsTab';
import type { CommentThread } from '../../../atlas-core/types/comments';

function thread(id: string): CommentThread {
  return {
    threadId: id, bookId: 'b', pageId: 'p',
    anchor: { kind: 'imagePoint', pageId: 'p', imageAssetId: 'i', imageVersion: 'v', x: 0, y: 0 },
    status: 'open', category: 'general',
    messages: [{ messageId: 'm', authorId: 'a', body: [{ type: 'text', value: `text-${id}` }], createdAt: new Date().toISOString() }],
    createdBy: 'a', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

const noop = vi.fn();
const handlers = {
  onSelectThread: noop, onHoverThread: noop, onAddMessage: noop,
  onResolve: noop, onReopen: noop, onDeleteThread: noop,
  onEditMessage: noop, onDeleteMessage: noop,
};

describe('CommentsTab', () => {
  it('renders the ThreadList with provided threads', () => {
    render(
      <CommentsTab threads={[thread('t1')]} selectedThreadId={null} highlightedThreadId={null} {...handlers} />,
    );
    expect(screen.getByText('text-t1')).toBeInTheDocument();
  });

  it('renders empty state when no threads', () => {
    render(<CommentsTab threads={[]} selectedThreadId={null} highlightedThreadId={null} {...handlers} />);
    expect(screen.getByText('这一页还没有评论')).toBeInTheDocument();
  });
});
