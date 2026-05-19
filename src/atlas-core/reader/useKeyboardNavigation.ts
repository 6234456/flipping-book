import { useEffect } from 'react';
import type { ReaderState } from './useReaderState';
import type { RailTab } from './useRailState';

export type KeyboardActions = {
  onToggleRail?: () => void;
  onNewComment?: () => void;
  onSwitchTab?: (tab: RailTab) => void;
  onOpenSearch?: () => void;
};

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useKeyboardNavigation(
  readerState: ReaderState,
  enabled: boolean,
  actions: KeyboardActions = {},
) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        actions.onOpenSearch?.();
        return;
      }

      if (isEditable(e.target)) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        readerState.goNext();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        readerState.goPrevious();
        return;
      }
      if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault();
        readerState.toggleDebugOverlay();
        return;
      }

      if (e.key === '\\') {
        e.preventDefault();
        actions.onToggleRail?.();
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        actions.onNewComment?.();
        return;
      }
      if (e.key === '1') {
        e.preventDefault();
        actions.onSwitchTab?.('comments');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        actions.onSwitchTab?.('notes');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        actions.onSwitchTab?.('toc');
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readerState, enabled, actions.onToggleRail, actions.onNewComment, actions.onSwitchTab]);
}
