import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useReaderState, useKeyboardNavigation } from '../../atlas-core/reader';
import type { BookRegistry } from '../../atlas-core/registry';
import { createCommentStore } from '../../atlas-core/annotations/commentStore';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import { ReaderShell } from './ReaderShell';

type MagazineReaderProps = {
  registry: BookRegistry;
  initialPageId?: string;
};

const ANONYMOUS_USER = 'anonymous';
const LAST_PAGE_KEY = 'atlas-last-page';

export function MagazineReader({ registry, initialPageId }: MagazineReaderProps) {
  // Restore last page from localStorage
  const restoredPageId = useMemo(() => {
    if (initialPageId) return initialPageId;
    try {
      const saved = localStorage.getItem(`${LAST_PAGE_KEY}-${registry.manifest.bookId}`);
      return saved ?? undefined;
    } catch {
      return undefined;
    }
  }, [registry.manifest.bookId, initialPageId]);

  const readerState = useReaderState(registry, restoredPageId);
  useKeyboardNavigation(readerState, registry.manifest.reader.enableKeyboardNavigation);

  // Persist current page on change
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

  // Comment store
  const commentStore = useMemo(
    () => createCommentStore(registry.manifest.bookId),
    [registry.manifest.bookId],
  );

  const [commentThreads, setCommentThreads] = useState<CommentThread[]>(
    () => commentStore.getAll(),
  );

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [highlightedThreadId, setHighlightedThreadId] = useState<string | null>(null);

  // Notes drawer state
  const [notesOpen, setNotesOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // File input ref for import
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
      setCommentsOpen(true);
    },
    [commentStore, registry.manifest.bookId, readerState.currentPage?.pageId, refreshThreads],
  );

  const handleAddMessage = useCallback(
    (threadId: string, text: string) => {
      commentStore.addMessage(threadId, {
        authorId: ANONYMOUS_USER,
        body: [{ type: 'text', value: text }],
      });
      refreshThreads();
    },
    [commentStore, refreshThreads],
  );

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      commentStore.deleteThread(threadId);
      setSelectedThreadId(null);
      refreshThreads();
    },
    [commentStore, refreshThreads],
  );

  const handleEditMessage = useCallback(
    (threadId: string, messageId: string, text: string) => {
      commentStore.editMessage(threadId, messageId, [{ type: 'text', value: text }]);
      refreshThreads();
    },
    [commentStore, refreshThreads],
  );

  const handleDeleteMessage = useCallback(
    (threadId: string, messageId: string) => {
      commentStore.deleteMessage(threadId, messageId);
      refreshThreads();
    },
    [commentStore, refreshThreads],
  );

  const handleResolve = useCallback(
    (threadId: string) => {
      commentStore.resolve(threadId);
      refreshThreads();
    },
    [commentStore, refreshThreads],
  );

  const handleReopen = useCallback(
    (threadId: string) => {
      commentStore.reopen(threadId);
      refreshThreads();
    },
    [commentStore, refreshThreads],
  );

  // Export
  const handleExport = useCallback(() => {
    const json = commentStore.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comments-${registry.manifest.bookId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [commentStore, registry.manifest.bookId]);

  // Import
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const result = commentStore.importJSON(text);
        refreshThreads();
        alert(`导入完成: ${result.imported} 条新评论, ${result.skipped} 条重复跳过`);
      };
      reader.readAsText(file);
      // Reset file input
      e.target.value = '';
    },
    [commentStore, refreshThreads],
  );

  // Determine note IDs for current page
  const currentNoteIds = readerState.currentPage?.notes?.noteIds ?? [];

  return (
    <>
      {/* Hidden file input for import */}
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
        // Notes
        noteIds={currentNoteIds}
        notesOpen={notesOpen}
        onToggleNotes={() => { setNotesOpen((o) => !o); setCommentsOpen(false); }}
        // Comments
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
        commentsOpen={commentsOpen}
        onToggleComments={() => { setCommentsOpen((o) => !o); setNotesOpen(false); }}
        // Export/Import
        onExportComments={handleExport}
        onImportComments={handleImportClick}
      />
    </>
  );
}
