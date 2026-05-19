import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTocFolds } from '../useTocFolds';

describe('useTocFolds', () => {
  beforeEach(() => { localStorage.clear(); });

  it('initial: returns smart default (only current group expanded, others collapsed)', () => {
    const { result } = renderHook(() => useTocFolds('book-a', ['09', 'SC', 'APP'], '09'));
    expect(result.current.isExpanded('09')).toBe(true);
    expect(result.current.isExpanded('SC')).toBe(false);
    expect(result.current.isExpanded('APP')).toBe(false);
  });

  it('toggle persists per-group', () => {
    const { result } = renderHook(() => useTocFolds('book-a', ['09', 'SC'], '09'));
    act(() => result.current.toggle('SC'));
    expect(result.current.isExpanded('SC')).toBe(true);
    const stored = JSON.parse(localStorage.getItem('atlas-toc-folds-book-a') ?? '{}');
    expect(stored.SC).toBe('expanded');
  });

  it('user explicit state overrides smart default when currentGroupKey changes', () => {
    localStorage.setItem('atlas-toc-folds-book-a', JSON.stringify({ '09': 'collapsed' }));
    const { result } = renderHook(() => useTocFolds('book-a', ['09', 'SC'], '09'));
    expect(result.current.isExpanded('09')).toBe(false);
  });

  it('group never visited in storage falls back to smart default', () => {
    localStorage.setItem('atlas-toc-folds-book-a', JSON.stringify({ SC: 'expanded' }));
    const { result } = renderHook(() => useTocFolds('book-a', ['09', 'SC'], '09'));
    expect(result.current.isExpanded('09')).toBe(true);
    expect(result.current.isExpanded('SC')).toBe(true);
  });
});
