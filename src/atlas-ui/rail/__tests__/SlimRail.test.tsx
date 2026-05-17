import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SlimRail } from '../SlimRail';

describe('SlimRail', () => {
  it('renders three icon buttons', () => {
    render(<SlimRail badges={{ comments: 3, notes: 2, toc: 0 }} activeTab={null} onExpand={vi.fn()} />);
    expect(screen.getByRole('button', { name: /打开评论/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /打开笔记/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /打开目录/ })).toBeInTheDocument();
  });

  it('shows comment badge when count > 0', () => {
    render(<SlimRail badges={{ comments: 3, notes: 0, toc: 0 }} activeTab={null} onExpand={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('hides badge when count = 0', () => {
    render(<SlimRail badges={{ comments: 0, notes: 0, toc: 0 }} activeTab={null} onExpand={vi.fn()} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('clicking a button calls onExpand with tab id', async () => {
    const onExpand = vi.fn();
    render(<SlimRail badges={{ comments: 0, notes: 0, toc: 0 }} activeTab={null} onExpand={onExpand} />);
    await userEvent.click(screen.getByRole('button', { name: /打开评论/ }));
    expect(onExpand).toHaveBeenCalledWith('comments');
  });

  it('marks activeTab with data-active', () => {
    const { container } = render(<SlimRail badges={{ comments: 0, notes: 0, toc: 0 }} activeTab="notes" onExpand={vi.fn()} />);
    const activeBtn = container.querySelector('[data-slim-active="true"]');
    expect(activeBtn).not.toBeNull();
    expect(activeBtn?.getAttribute('aria-label')).toMatch(/笔记/);
  });
});
