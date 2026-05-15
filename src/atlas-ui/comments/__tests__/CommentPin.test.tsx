import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CommentPin } from '../CommentPin';
import type { CommentThread } from '../../../atlas-core/types/comments';

const openThread: CommentThread = {
  threadId: "thread-1",
  bookId: "test", pageId: "page-1",
  anchor: { kind: "imagePoint", pageId: "page-1", imageAssetId: "img-1", imageVersion: "v1", x: 45, y: 30 },
  status: "open",
  category: "question",
  messages: [{ messageId: "msg-1", authorId: "user-1", body: [{ type: "text", value: "test" }], createdAt: new Date().toISOString() }],
  createdBy: "user-1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('CommentPin', () => {
  it('renders at correct percentage position', () => {
    const { container } = render(
      <CommentPin thread={openThread} onClick={vi.fn()} />
    );
    const btn = container.querySelector('button');
    expect(btn).toHaveStyle({ left: '45%', top: '30%' });
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<CommentPin thread={openThread} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith('thread-1');
  });

  it('shows message count', () => {
    render(<CommentPin thread={openThread} onClick={vi.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('returns null for non-image anchors', () => {
    const { container } = render(
      <CommentPin
        thread={{ ...openThread, anchor: { kind: "term", termId: "leistung" } }}
        onClick={vi.fn()}
      />
    );
    expect(container.querySelector('button')).not.toBeInTheDocument();
  });
});
