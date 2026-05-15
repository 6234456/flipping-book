import { useState, useCallback, useMemo } from 'react';
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

export function MagazineReader({ registry, initialPageId }: MagazineReaderProps) {
  const readerState = useReaderState(registry, initialPageId);
  useKeyboardNavigation(readerState, registry.manifest.reader.enableKeyboardNavigation);

  // Comment store
  const commentStore = useMemo(
    () => createCommentStore(registry.manifest.bookId),
    [registry.manifest.bookId],
  );

  const [commentThreads, setCommentThreads] = useState<CommentThread[]>(
    () => commentStore.getAll(),
  );

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Notes drawer state
  const [notesOpen, setNotesOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

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

  // Determine note IDs for current page
  const currentNoteIds = readerState.currentPage?.notes?.noteIds ?? [];

  return (
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
      onSelectThread={setSelectedThreadId}
      onAddMessage={handleAddMessage}
      onResolve={handleResolve}
      onReopen={handleReopen}
      onCreateAnchor={handleCreateAnchor}
      commentsOpen={commentsOpen}
      onToggleComments={() => { setCommentsOpen((o) => !o); setNotesOpen(false); }}
    />
  );
}
