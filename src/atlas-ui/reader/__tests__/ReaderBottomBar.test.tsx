import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ReaderBottomBar } from '../ReaderBottomBar';

describe('ReaderBottomBar', () => {
  it('renders page indicator', () => {
    render(
      <ReaderBottomBar
        currentIndex={2}
        totalPages={10}
        canGoNext={true}
        canGoPrevious={true}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
      />
    );
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('next button is enabled when canGoNext', async () => {
    const onNext = vi.fn();
    render(
      <ReaderBottomBar
        currentIndex={0}
        totalPages={5}
        canGoNext={true}
        canGoPrevious={false}
        onNext={onNext}
        onPrevious={vi.fn()}
      />
    );
    const btn = screen.getByText('下一页 →');
    expect(btn).not.toBeDisabled();
    await userEvent.click(btn);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('next button is disabled when cannot go next', () => {
    render(
      <ReaderBottomBar
        currentIndex={4}
        totalPages={5}
        canGoNext={false}
        canGoPrevious={true}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
      />
    );
    expect(screen.getByText('下一页 →')).toBeDisabled();
  });

  it('previous button is disabled when cannot go previous', () => {
    render(
      <ReaderBottomBar
        currentIndex={0}
        totalPages={5}
        canGoNext={true}
        canGoPrevious={false}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
      />
    );
    expect(screen.getByText('← 上一页')).toBeDisabled();
  });

  it('calls onPrevious when clicked', async () => {
    const onPrevious = vi.fn();
    render(
      <ReaderBottomBar
        currentIndex={2}
        totalPages={5}
        canGoNext={true}
        canGoPrevious={true}
        onNext={vi.fn()}
        onPrevious={onPrevious}
      />
    );
    await userEvent.click(screen.getByText('← 上一页'));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('shows full progress bar for single page', () => {
    const { container } = render(
      <ReaderBottomBar
        currentIndex={0}
        totalPages={1}
        canGoNext={false}
        canGoPrevious={false}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
      />
    );
    const bar = container.querySelector('.h-1.bg-stone-800 > div');
    expect(bar).toHaveStyle({ width: '100%' });
  });
});
