import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';
import type { ReaderState } from '../useReaderState';

function mockReaderState(overrides: Partial<ReaderState> = {}): ReaderState {
  return {
    currentPage: undefined,
    currentPageIndex: 0,
    totalPages: 5,
    interactionMode: 'read',
    canGoNext: true,
    canGoPrevious: false,
    goToPage: vi.fn(),
    goNext: vi.fn(),
    goPrevious: vi.fn(),
    setInteractionMode: vi.fn(),
    toggleDebugOverlay: vi.fn(),
    ...overrides,
  };
}

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any lingering event listeners
    window.dispatchEvent(new Event('unload'));
  });

  it('does nothing when disabled', () => {
    const state = mockReaderState();
    renderHook(() => useKeyboardNavigation(state, false));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(state.goNext).not.toHaveBeenCalled();
  });

  it('calls goNext on ArrowRight', () => {
    const state = mockReaderState();
    renderHook(() => useKeyboardNavigation(state, true));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(state.goNext).toHaveBeenCalledTimes(1);
  });

  it('calls goNext on ArrowDown', () => {
    const state = mockReaderState();
    renderHook(() => useKeyboardNavigation(state, true));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(state.goNext).toHaveBeenCalledTimes(1);
  });

  it('calls goPrevious on ArrowLeft', () => {
    const state = mockReaderState();
    renderHook(() => useKeyboardNavigation(state, true));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(state.goPrevious).toHaveBeenCalledTimes(1);
  });

  it('calls goPrevious on ArrowUp', () => {
    const state = mockReaderState();
    renderHook(() => useKeyboardNavigation(state, true));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(state.goPrevious).toHaveBeenCalledTimes(1);
  });

  it('calls toggleDebugOverlay on Ctrl+D', () => {
    const state = mockReaderState();
    renderHook(() => useKeyboardNavigation(state, true));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));
    expect(state.toggleDebugOverlay).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys', () => {
    const state = mockReaderState();
    renderHook(() => useKeyboardNavigation(state, true));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(state.goNext).not.toHaveBeenCalled();
    expect(state.goPrevious).not.toHaveBeenCalled();
    expect(state.toggleDebugOverlay).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const state = mockReaderState();
    const { unmount } = renderHook(() => useKeyboardNavigation(state, true));
    unmount();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(state.goNext).not.toHaveBeenCalled();
  });
});
