import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRailState } from '../useRailState';

describe('useRailState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initial state: open=true, tab=comments, width=clamped default', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    expect(result.current.open).toBe(true);
    expect(result.current.tab).toBe('comments');
    expect(result.current.width).toBeGreaterThanOrEqual(280);
    expect(result.current.width).toBeLessThanOrEqual(480);
  });

  it('setTab updates active tab', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.setTab('notes'));
    expect(result.current.tab).toBe('notes');
  });

  it('toggleTab(currentTab) collapses the rail', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.setTab('comments'));
    act(() => result.current.toggleTab('comments'));
    expect(result.current.open).toBe(false);
  });

  it('toggleTab(differentTab) switches and opens', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.collapse());
    act(() => result.current.toggleTab('notes'));
    expect(result.current.open).toBe(true);
    expect(result.current.tab).toBe('notes');
  });

  it('collapse() sets open to false', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.collapse());
    expect(result.current.open).toBe(false);
  });

  it('expand(tab) sets open to true and changes tab', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.collapse());
    act(() => result.current.expand('toc'));
    expect(result.current.open).toBe(true);
    expect(result.current.tab).toBe('toc');
  });

  it('expand() without arg keeps existing tab', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.setTab('notes'));
    act(() => result.current.collapse());
    act(() => result.current.expand());
    expect(result.current.open).toBe(true);
    expect(result.current.tab).toBe('notes');
  });

  it('persists state to localStorage on change', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.setTab('notes'));
    act(() => result.current.collapse());
    const stored = JSON.parse(localStorage.getItem('atlas-rail-book-a') ?? '{}');
    expect(stored.tab).toBe('notes');
    expect(stored.open).toBe(false);
  });

  it('restores state from localStorage on mount', () => {
    localStorage.setItem(
      'atlas-rail-book-a',
      JSON.stringify({ open: false, tab: 'toc', width: 360 }),
    );
    const { result } = renderHook(() => useRailState('book-a'));
    expect(result.current.open).toBe(false);
    expect(result.current.tab).toBe('toc');
    expect(result.current.width).toBe(360);
  });

  it('ignores invalid persisted JSON', () => {
    localStorage.setItem('atlas-rail-book-a', 'not-json');
    const { result } = renderHook(() => useRailState('book-a'));
    expect(result.current.open).toBe(true);
    expect(result.current.tab).toBe('comments');
  });

  it('separate keys per book id', () => {
    const { result: a } = renderHook(() => useRailState('book-a'));
    act(() => a.current.setTab('notes'));
    const { result: b } = renderHook(() => useRailState('book-b'));
    expect(b.current.tab).toBe('comments');
  });
});
