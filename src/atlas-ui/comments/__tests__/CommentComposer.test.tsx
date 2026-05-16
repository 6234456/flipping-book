import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CommentComposer } from '../CommentComposer';

describe('CommentComposer', () => {
  it('calls onSubmit with text', async () => {
    const onSubmit = vi.fn();
    render(<CommentComposer onSubmit={onSubmit} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText('添加评论…'), '测试评论');
    await userEvent.click(screen.getByText('发送'));

    expect(onSubmit).toHaveBeenCalledWith('测试评论');
  });

  it('does not submit empty text', async () => {
    const onSubmit = vi.fn();
    render(<CommentComposer onSubmit={onSubmit} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByText('发送'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel', async () => {
    const onCancel = vi.fn();
    render(<CommentComposer onSubmit={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByText('取消'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables send button for empty text', () => {
    render(<CommentComposer onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('发送')).toBeDisabled();
  });
});
