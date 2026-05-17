import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RailHeader } from '../RailHeader';

const baseProps = {
  activeTab: 'comments' as const,
  commentCount: 3,
  noteCount: 2,
  onTabChange: vi.fn(),
  onPlusClick: vi.fn(),
  onCollapse: vi.fn(),
};

describe('RailHeader', () => {
  it('renders all three tabs', () => {
    render(<RailHeader {...baseProps} />);
    expect(screen.getByRole('tab', { name: /评论/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /笔记/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /目录/ })).toBeInTheDocument();
  });

  it('shows comment count badge', () => {
    render(<RailHeader {...baseProps} commentCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marks active tab via aria-selected', () => {
    render(<RailHeader {...baseProps} activeTab="notes" />);
    expect(screen.getByRole('tab', { name: /笔记/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /评论/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking tab calls onTabChange', async () => {
    const onTabChange = vi.fn();
    render(<RailHeader {...baseProps} onTabChange={onTabChange} />);
    await userEvent.click(screen.getByRole('tab', { name: /笔记/ }));
    expect(onTabChange).toHaveBeenCalledWith('notes');
  });

  it('plus button only on comments tab and calls onPlusClick', async () => {
    const onPlusClick = vi.fn();
    const { rerender } = render(<RailHeader {...baseProps} activeTab="comments" onPlusClick={onPlusClick} />);
    const plus = screen.getByRole('button', { name: /新增评论/ });
    await userEvent.click(plus);
    expect(onPlusClick).toHaveBeenCalledTimes(1);

    rerender(<RailHeader {...baseProps} activeTab="notes" onPlusClick={onPlusClick} />);
    expect(screen.queryByRole('button', { name: /新增评论/ })).not.toBeInTheDocument();
  });

  it('collapse button calls onCollapse', async () => {
    const onCollapse = vi.fn();
    render(<RailHeader {...baseProps} onCollapse={onCollapse} />);
    await userEvent.click(screen.getByRole('button', { name: /收起/ }));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});
