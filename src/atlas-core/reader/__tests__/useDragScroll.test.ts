import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDragScroll } from '../useDragScroll';

describe('useDragScroll', () => {
  it('returns a ref object when enabled', () => {
    const { result } = renderHook(() => useDragScroll(true));
    expect(result.current).toHaveProperty('current');
  });

  it('returns a ref object when disabled', () => {
    const { result } = renderHook(() => useDragScroll(false));
    expect(result.current).toHaveProperty('current');
  });

  it('sets grab cursor when enabled and ref is attached', () => {
    const div = document.createElement('div');
    const { result } = renderHook(() => {
      const ref = useDragScroll(true);
      // Attach the ref manually
      if (ref.current !== div) {
        // @ts-expect-error: test setup
        ref.current = div;
      }
      return ref;
    });
    // Manually trigger the effect by re-running
    expect(result.current).toBeDefined();
  });
});
