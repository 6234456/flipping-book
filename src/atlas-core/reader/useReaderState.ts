import { useState, useCallback, useMemo } from 'react';
import type { BookRegistry } from '../registry/createBookRegistry';
import type { PageManifest } from '../types/page';
import type { ReaderInteractionMode } from '../types/primitives';
import { resolveNextPage, resolvePreviousPage, resolveFirstPage, resolvePageById } from '../registry/resolvePage';

export type ReaderState = {
  currentPage: PageManifest | undefined;
  currentPageIndex: number;
  totalPages: number;
  interactionMode: ReaderInteractionMode;
  canGoNext: boolean;
  canGoPrevious: boolean;

  goToPage: (pageId: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  setInteractionMode: (mode: ReaderInteractionMode) => void;
  toggleDebugOverlay: () => void;
};

export function useReaderState(
  registry: BookRegistry,
  initialPageId?: string,
): ReaderState {
  const firstPage = resolveFirstPage(registry);
  const initialPage = initialPageId
    ? resolvePageById(registry, initialPageId) ?? firstPage
    : firstPage;

  const [currentPageId, setCurrentPageId] = useState(initialPage?.pageId ?? '');
  const [interactionMode, setInteractionMode] = useState<ReaderInteractionMode>('read');

  const currentPage = useMemo(
    () => resolvePageById(registry, currentPageId),
    [registry, currentPageId],
  );

  const currentPageIndex = useMemo(() => {
    return registry.manifest.readingOrder.indexOf(currentPageId);
  }, [registry.manifest.readingOrder, currentPageId]);

  const totalPages = registry.manifest.readingOrder.length;

  const canGoNext = currentPageIndex < totalPages - 1;
  const canGoPrevious = currentPageIndex > 0;

  const goToPage = useCallback((pageId: string) => {
    const page = resolvePageById(registry, pageId);
    if (page) setCurrentPageId(pageId);
  }, [registry]);

  const goNext = useCallback(() => {
    const next = resolveNextPage(registry, currentPageId);
    if (next) setCurrentPageId(next.pageId);
  }, [registry, currentPageId]);

  const goPrevious = useCallback(() => {
    const prev = resolvePreviousPage(registry, currentPageId);
    if (prev) setCurrentPageId(prev.pageId);
  }, [registry, currentPageId]);

  const toggleDebugOverlay = useCallback(() => {
    setInteractionMode((m) => (m === 'debugOverlay' ? 'read' : 'debugOverlay'));
  }, []);

  return {
    currentPage,
    currentPageIndex,
    totalPages,
    interactionMode,
    canGoNext,
    canGoPrevious,
    goToPage,
    goNext,
    goPrevious,
    setInteractionMode,
    toggleDebugOverlay,
  };
}
