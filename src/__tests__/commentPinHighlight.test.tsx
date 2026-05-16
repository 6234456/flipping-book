import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CommentPin } from '../atlas-ui/comments/CommentPin';
import type { CommentThread } from '../atlas-core/types/comments';

const thread: CommentThread = {
  threadId: 'thread-x',
  bookId: 'test',
  pageId: 'page-1',
  anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 50, y: 50 },
  status: 'open',
  category: 'general',
  messages: [
    {
      messageId: 'm1',
      authorId: 'a1',
      body: [{ type: 'text', value: 'hi' }],
      createdAt: new Date().toISOString(),
    },
  ],
  createdBy: 'a1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('CommentPin highlight', () => {
  it('exposes data-pin-highlighted=true when isHighlighted', () => {
    const { container } = render(<CommentPin thread={thread} onClick={() => {}} isHighlighted />);
    expect(container.querySelector('[data-pin-highlighted="true"]')).not.toBeNull();
  });

  it('exposes data-pin-highlighted=false when not highlighted', () => {
    const { container } = render(<CommentPin thread={thread} onClick={() => {}} />);
    expect(container.querySelector('[data-pin-highlighted="false"]')).not.toBeNull();
  });

  it('does not write tailwind class names as CSS color values', () => {
    const { container } = render(<CommentPin thread={thread} onClick={() => {}} isHighlighted />);
    expect(container.innerHTML).not.toMatch(/background-color:\s*(yellow|green|stone)-\d+/);
  });
});
