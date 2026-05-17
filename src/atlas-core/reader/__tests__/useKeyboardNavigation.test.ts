import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';
import type { ReaderState } from '../useReaderState';

function buildReaderState(): ReaderState {
  return {
    currentPage: undefined,
    currentPageIndex: 0,
    totalPages: 1,
    interactionMode: 'read',
    canGoNext: true,
    canGoPrevious: true,
    goToPage: vi.fn(),
    goNext: vi.fn(),
    goPrevious: vi.fn(),
    setInteractionMode: vi.fn(),
    toggleDebugOverlay: vi.fn(),
  } as unknown as ReaderState;
}

function press(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('useKeyboardNavigation', () => {
  let state: ReaderState;
  beforeEach(() => {
    state = buildReaderState();
  });

  it('ArrowRight goes next', () => {
    renderHook(() => useKeyboardNavigation(state, true, {}));
    act(() => press('ArrowRight'));
    expect(state.goNext).toHaveBeenCalled();
  });

  it('does not trigger when disabled', () => {
    renderHook(() => useKeyboardNavigation(state, false, {}));
    act(() => press('ArrowRight'));
    expect(state.goNext).not.toHaveBeenCalled();
  });

  it('backslash triggers onToggleRail', () => {
    const onToggleRail = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onToggleRail }));
    act(() => press('\\'));
    expect(onToggleRail).toHaveBeenCalled();
  });

  it('N triggers onNewComment', () => {
    const onNewComment = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onNewComment }));
    act(() => press('n'));
    expect(onNewComment).toHaveBeenCalled();
  });

  it('1 triggers onSwitchTab with comments', () => {
    const onSwitchTab = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onSwitchTab }));
    act(() => press('1'));
    expect(onSwitchTab).toHaveBeenCalledWith('comments');
  });

  it('2 triggers onSwitchTab with notes', () => {
    const onSwitchTab = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onSwitchTab }));
    act(() => press('2'));
    expect(onSwitchTab).toHaveBeenCalledWith('notes');
  });

  it('3 triggers onSwitchTab with toc', () => {
    const onSwitchTab = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onSwitchTab }));
    act(() => press('3'));
    expect(onSwitchTab).toHaveBeenCalledWith('toc');
  });

  it('ignores keys when focus is in textarea', () => {
    const onNewComment = vi.fn();
    const onSwitchTab = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onNewComment, onSwitchTab }));
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();
    const evt = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
    Object.defineProperty(evt, 'target', { value: ta, enumerable: true });
    act(() => { window.dispatchEvent(evt); });
    expect(onNewComment).not.toHaveBeenCalled();
    ta.remove();
  });
});
