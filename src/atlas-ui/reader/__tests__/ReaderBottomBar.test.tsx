import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ReaderBottomBar } from '../ReaderBottomBar';
import type { PageManifest } from '../../../atlas-core/types/page';

function fakeGetPage(id: string): PageManifest | undefined {
  return { pageId: id, title: { 'zh-CN': `Page ${id}` } } as unknown as PageManifest;
}

function renderBottomBar(
  overrides: Partial<React.ComponentProps<typeof ReaderBottomBar>> = {},
) {
  return render(
    <ReaderBottomBar
      currentIndex={0}
      totalPages={5}
      canGoNext={true}
      canGoPrevious={true}
      onNext={vi.fn()}
      onPrevious={vi.fn()}
      readingOrder={['p-1', 'p-2', 'p-3', 'p-4', 'p-5']}
      getPage={fakeGetPage}
      onNavigateToPage={vi.fn()}
      {...overrides}
    />,
  );
}

describe('ReaderBottomBar', () => {
  it('renders page indicator', () => {
    renderBottomBar({ currentIndex: 2, totalPages: 10 });
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('next button enabled and fires onNext', async () => {
    const onNext = vi.fn();
    renderBottomBar({ canGoNext: true, canGoPrevious: false, onNext });
    const btn = screen.getByRole('button', { name: '下一页' });
    expect(btn).not.toBeDisabled();
    await userEvent.click(btn);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('next button disabled when cannot go next', () => {
    renderBottomBar({ canGoNext: false });
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();
  });

  it('previous button disabled when cannot go previous', () => {
    renderBottomBar({ canGoPrevious: false });
    expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled();
  });

  it('calls onPrevious when clicked', async () => {
    const onPrevious = vi.fn();
    renderBottomBar({ onPrevious });
    await userEvent.click(screen.getByRole('button', { name: '上一页' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('shows full progress fill for single page', () => {
    const { container } = renderBottomBar({ totalPages: 1 });
    const fill = container.querySelector('[data-testid="progress-bar"] .bg-accent');
    expect(fill).toHaveStyle({ width: '100%' });
  });
});
