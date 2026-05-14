import { useEffect } from 'react';
import type { ReaderState } from './useReaderState';

export function useKeyboardNavigation(readerState: ReaderState, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        readerState.goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        readerState.goPrevious();
      } else if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault();
        readerState.toggleDebugOverlay();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readerState, enabled]);
}
