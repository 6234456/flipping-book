import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  // Helper: stub the bar's bounding rect so jsdom click math works.
  function stubBarRect(container: HTMLElement, width = 100) {
    const wrapper = container.querySelector('[data-testid="progress-bar"]') as HTMLDivElement | null;
    if (!wrapper) throw new Error('progress bar wrapper not found');
    const bar = wrapper.querySelector('.h-1') as HTMLDivElement | null;
    if (!bar) throw new Error('progress bar inner not found');
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, right: width, width, top: 0, bottom: 4, height: 4,
      toJSON: () => ({}),
    } as DOMRect);
    return wrapper;
  }

  it('clicking the progress bar at 40% navigates to the page at that ratio', async () => {
    const onNavigateToPage = vi.fn();
    const { container } = renderBottomBar({
      currentIndex: 0,
      totalPages: 5,
      readingOrder: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5'],
      onNavigateToPage,
    });
    const bar = stubBarRect(container, 100);
    // floor(0.4 * 5) = 2  → page id "p-3"
    bar.dispatchEvent(new MouseEvent('click', { clientX: 40, bubbles: true }));
    expect(onNavigateToPage).toHaveBeenCalledWith('p-3');
  });

  it('mousemove on the progress bar shows tooltip with page number and title', async () => {
    const { container } = renderBottomBar({
      currentIndex: 0,
      totalPages: 5,
      readingOrder: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5'],
    });
    const bar = stubBarRect(container, 100);
    bar.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, bubbles: true }));
    // floor(0.6 * 5) = 3 → page id "p-4", page number 4
    const tip = await screen.findByTestId('progress-tooltip');
    expect(tip).toBeInTheDocument();
    expect(tip).toHaveTextContent('4');
    expect(tip).toHaveTextContent('Page p-4');
  });

  it('mouseleave hides the tooltip', async () => {
    const { container } = renderBottomBar({
      currentIndex: 0,
      totalPages: 5,
      readingOrder: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5'],
    });
    const bar = stubBarRect(container, 100);
    bar.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, bubbles: true }));
    expect(await screen.findByTestId('progress-tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(bar);
    // tooltip should disappear after state update
    await waitFor(() => {
      expect(screen.queryByTestId('progress-tooltip')).not.toBeInTheDocument();
    });
  });
});
