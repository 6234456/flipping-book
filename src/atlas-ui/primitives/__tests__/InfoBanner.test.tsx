import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Info } from 'lucide-react';
import { InfoBanner } from '../InfoBanner';

describe('InfoBanner', () => {
  it('renders message', () => {
    render(<InfoBanner message="点击图片任意位置添加评论" />);
    expect(screen.getByText('点击图片任意位置添加评论')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(<InfoBanner message="hi" icon={Info} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders dismiss button when onDismiss provided', async () => {
    const onDismiss = vi.fn();
    render(<InfoBanner message="hi" onDismiss={onDismiss} />);
    const btn = screen.getByRole('button', { name: /关闭/ });
    await userEvent.click(btn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('omits dismiss button when onDismiss is undefined', () => {
    render(<InfoBanner message="hi" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies info variant (default) with surface-2 bg', () => {
    const { container } = render(<InfoBanner message="hi" />);
    expect(container.firstChild).toHaveAttribute('data-banner-variant', 'info');
  });

  it('applies accent variant', () => {
    const { container } = render(<InfoBanner message="hi" variant="accent" />);
    expect(container.firstChild).toHaveAttribute('data-banner-variant', 'accent');
  });

  it('has role=status', () => {
    render(<InfoBanner message="hi" />);
    expect(screen.getByRole('status')).toHaveTextContent('hi');
  });
});
