import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CommentPin } from '../CommentPin';
import type { CommentThread } from '../../../atlas-core/types/comments';

function buildThread(status: CommentThread['status']): CommentThread {
  return {
    threadId: `thread-${status}`,
    bookId: 'test',
    pageId: 'page-1',
    anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 45, y: 30 },
    status,
    category: 'question',
    messages: [
      {
        messageId: 'msg-1',
        authorId: 'user-1',
        body: [{ type: 'text', value: 'test' }],
        createdAt: new Date().toISOString(),
      },
    ],
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('CommentPin', () => {
  it('renders at correct percentage position', () => {
    const { container } = render(<CommentPin thread={buildThread('open')} onClick={vi.fn()} />);
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.style.left).toBe('45%');
    expect(wrap.style.top).toBe('30%');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<CommentPin thread={buildThread('open')} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);          // critical: was double-firing
    expect(onClick).toHaveBeenCalledWith('thread-open');
  });

  it('exposes status via data-pin-status', () => {
    const { container } = render(<CommentPin thread={buildThread('resolved')} onClick={vi.fn()} />);
    expect(container.querySelector('[data-pin-status="resolved"]')).not.toBeNull();
  });

  it('exposes highlight state via data attribute', () => {
    const { container } = render(
      <CommentPin thread={buildThread('open')} isHighlighted onClick={vi.fn()} />,
    );
    expect(container.querySelector('[data-pin-highlighted="true"]')).not.toBeNull();
  });

  it('does not produce inline backgroundColor with raw class names (regression)', () => {
    const { container } = render(
      <CommentPin thread={buildThread('open')} isHighlighted onClick={vi.fn()} />,
    );
    const html = container.innerHTML;
    expect(html).not.toMatch(/background-color:\s*(yellow|green|stone)-\d+/);
  });
});
