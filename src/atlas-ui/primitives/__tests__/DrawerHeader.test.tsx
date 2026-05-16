import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MessageSquare } from 'lucide-react';
import { DrawerHeader } from '../DrawerHeader';

describe('DrawerHeader', () => {
  it('renders title and icon', () => {
    render(<DrawerHeader icon={MessageSquare} title="评论" onClose={vi.fn()} />);
    expect(screen.getByText('评论')).toBeInTheDocument();
  });

  it('renders count when provided', () => {
    render(<DrawerHeader icon={MessageSquare} title="评论" count={3} onClose={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('omits count chip when count is undefined', () => {
    render(<DrawerHeader icon={MessageSquare} title="评论" onClose={vi.fn()} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<DrawerHeader icon={MessageSquare} title="评论" onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /关闭/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
