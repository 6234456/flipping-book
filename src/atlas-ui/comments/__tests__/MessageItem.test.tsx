import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MessageItem } from '../MessageItem';
import type { CommentMessage } from '../../../atlas-core/types/comments';

const msg: CommentMessage = {
  messageId: 'm1',
  authorId: 'alice',
  body: [{ type: 'text', value: '需要确认 USt-IdNr 校验' }],
  createdAt: '2026-05-16T08:00:00Z',
};

describe('MessageItem', () => {
  it('renders message text and authorId', () => {
    render(<MessageItem msg={msg} threadId="t1" onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('需要确认 USt-IdNr 校验')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('clicking edit reveals textarea', async () => {
    render(<MessageItem msg={msg} threadId="t1" onEdit={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /编辑/ }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('save calls onEdit with trimmed text', async () => {
    const onEdit = vi.fn();
    render(<MessageItem msg={msg} threadId="t1" onEdit={onEdit} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /编辑/ }));
    const ta = screen.getByRole('textbox');
    await userEvent.clear(ta);
    await userEvent.type(ta, '  改后  ');
    await userEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(onEdit).toHaveBeenCalledWith('t1', 'm1', '改后');
  });

  it('delete triggers onDelete', async () => {
    const onDelete = vi.fn();
    render(<MessageItem msg={msg} threadId="t1" onEdit={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /删除消息/ }));
    expect(onDelete).toHaveBeenCalledWith('t1', 'm1');
  });
});
