import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReaderState, useKeyboardNavigation, useRailState, useMediaQuery } from '../../atlas-core/reader';
import type { BookRegistry } from '../../atlas-core/registry';
import { createCommentStore } from '../../atlas-core/annotations/commentStore';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import type { ZoomLevel } from '../renderers/ImageOverlayTemplate';
import { useToast } from '../primitives';
import { ReaderShell } from './ReaderShell';

type MagazineReaderProps = {
  registry: BookRegistry;
  initialPageId?: string;
};

const ANONYMOUS_USER = 'anonymous';
const LAST_PAGE_KEY = 'atlas-last-page';
const MOBILE_QUERY = '(max-width: 767px)';

export function MagazineReader({ registry, initialPageId }: MagazineReaderProps) {
  const restoredPageId = useMemo(() => {
    if (initialPageId) return initialPageId;
    try {
      const saved = localStorage.getItem(`${LAST_PAGE_KEY}-${registry.manifest.bookId}`);
      return saved ?? undefined;
    } catch {
      return undefined;
    }
  }, [registry.manifest.bookId, initialPageId]);

  const toast = useToast();
  const navigate = useNavigate();

  const readerState = useReaderState(registry, restoredPageId);

  const railState = useRailState(registry.manifest.bookId);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const handlePlusClick = useCallback(() => {
    readerState.setInteractionMode('comment');
    railState.expand('comments');
  }, [readerState, railState]);

  useKeyboardNavigation(readerState, registry.manifest.reader.enableKeyboardNavigation, {
    onToggleRail: () => railState.setOpen(!railState.open),
    onNewComment: handlePlusClick,
    onSwitchTab: (tab) => railState.expand(tab),
  });

  useEffect(() => {
    if (readerState.currentPage) {
      try {
        localStorage.setItem(
          `${LAST_PAGE_KEY}-${registry.manifest.bookId}`,
          readerState.currentPage.pageId,
        );
      } catch { /* ignore */ }
    }
  }, [registry.manifest.bookId, readerState.currentPage]);

  const commentStore = useMemo(
    () => createCommentStore(registry.manifest.bookId),
    [registry.manifest.bookId],
  );

  const [commentThreads, setCommentThreads] = useState<CommentThread[]>(() => commentStore.getAll());
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [highlightedThreadId, setHighlightedThreadId] = useState<string | null>(null);

  const [zoom, setZoom] = useState<ZoomLevel>('fit-page');
  const cycleZoom = useCallback(() => {
    setZoom((z) => (z === 'fit-page' ? 'fit-width' : z === 'fit-width' ? 'actual-size' : 'fit-page'));
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPageThreads = useMemo(
    () => commentThreads.filter((t) => t.pageId === readerState.currentPage?.pageId),
    [commentThreads, readerState.currentPage?.pageId],
  );

  const refreshThreads = useCallback(() => {
    setCommentThreads(commentStore.getAll());
  }, [commentStore]);

  const handleCreateAnchor = useCallback(
    (anchor: AnnotationAnchor) => {
      const thread = commentStore.createThread({
        bookId: registry.manifest.bookId,
        pageId: readerState.currentPage?.pageId ?? '',
        anchor,
        category: 'general',
        createdBy: ANONYMOUS_USER,
      });
      refreshThreads();
      setSelectedThreadId(thread.threadId);
      railState.expand('comments');
      // One-shot: exit comment mode after a pin is created
      readerState.setInteractionMode('read');
    },
    [commentStore, registry.manifest.bookId, readerState, refreshThreads, railState],
  );

  const handleAddMessage = useCallback((threadId: string, text: string) => {
    commentStore.addMessage(threadId, {
      authorId: ANONYMOUS_USER,
      body: [{ type: 'text', value: text }],
    });
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleDeleteThread = useCallback((threadId: string) => {
    commentStore.deleteThread(threadId);
    setSelectedThreadId(null);
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleEditMessage = useCallback((threadId: string, messageId: string, text: string) => {
    commentStore.editMessage(threadId, messageId, [{ type: 'text', value: text }]);
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleDeleteMessage = useCallback((threadId: string, messageId: string) => {
    commentStore.deleteMessage(threadId, messageId);
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleResolve = useCallback((threadId: string) => {
    commentStore.resolve(threadId);
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleReopen = useCallback((threadId: string) => {
    commentStore.reopen(threadId);
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = commentStore.importJSON(text);
      refreshThreads();
      toast(`导入 ${result.imported} 条新评论 · 跳过 ${result.skipped} 条重复`, { variant: 'success' });
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [commentStore, refreshThreads, toast]);

  const handleDismissCommentMode = useCallback(() => {
    readerState.setInteractionMode('read');
  }, [readerState]);

  // ESC key to cancel comment mode
  useEffect(() => {
    if (readerState.interactionMode !== 'comment') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        readerState.setInteractionMode('read');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readerState]);

  const handleNavigateToPage = useCallback((pageId: string) => {
    readerState.goToPage(pageId);
    navigate(`/book/${registry.manifest.slug}/page/${pageId}`);
  }, [readerState, registry.manifest.slug, navigate]);

  const currentNoteIds = readerState.currentPage?.notes?.noteIds ?? [];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
        aria-label="导入评论 JSON"
      />

      <ReaderShell
        registry={registry}
        readerState={readerState}
        zoom={zoom}
        onCycleZoom={cycleZoom}
        commentThreads={currentPageThreads}
        selectedThreadId={selectedThreadId}
        highlightedThreadId={highlightedThreadId}
        onSelectThread={setSelectedThreadId}
        onHoverThread={setHighlightedThreadId}
        onAddMessage={handleAddMessage}
        onResolve={handleResolve}
        onReopen={handleReopen}
        onDeleteThread={handleDeleteThread}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onCreateAnchor={handleCreateAnchor}
        noteIds={currentNoteIds}
        railOpen={railState.open}
        railTab={railState.tab}
        railWidth={railState.width}
        onRailTabChange={railState.setTab}
        onRailCollapse={railState.collapse}
        onRailExpand={railState.expand}
        onPlusClick={handlePlusClick}
        onDismissCommentMode={handleDismissCommentMode}
        isMobile={isMobile}
        onNavigateToPage={handleNavigateToPage}
      />
    </>
  );
}
