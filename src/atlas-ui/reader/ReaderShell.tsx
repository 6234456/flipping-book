import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import type { NoteId } from '../../atlas-core/types/primitives';
import { ReaderTopBar } from './ReaderTopBar';
import { ReaderBottomBar } from './ReaderBottomBar';
import { PageViewport } from './PageViewport';
import { NotesDrawer } from '../notes/NotesDrawer';
import { CommentPanel } from '../comments/CommentPanel';

type ReaderShellProps = {
  registry: BookRegistry;
  readerState: ReaderState;
  // Notes
  noteIds: NoteId[];
  notesOpen: boolean;
  onToggleNotes: () => void;
  // Comments
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
  commentsOpen: boolean;
  onToggleComments: () => void;
  // Export/Import
  onExportComments: () => void;
  onImportComments: () => void;
};

export function ReaderShell({
  registry,
  readerState,
  noteIds,
  notesOpen,
  onToggleNotes,
  commentThreads,
  selectedThreadId,
  onSelectThread,
  onAddMessage,
  onResolve,
  onReopen,
  onCreateAnchor,
  commentsOpen,
  onToggleComments,
  onExportComments,
  onImportComments,
}: ReaderShellProps) {
  const { manifest } = registry;
  const { currentPage, interactionMode } = readerState;

  const featureFlags = manifest.featureFlags;

  return (
    <div className="flex flex-col h-dvh bg-stone-900" role="application" aria-label="VAT Atlas 阅读器">
      {/* Top Bar */}
      {manifest.navigation?.showTopBar && (
        <ReaderTopBar
          title={manifest.title}
          pageTitle={currentPage?.title}
          pageNumber={currentPage?.pageNumber}
          totalPages={readerState.totalPages}
          interactionMode={interactionMode}
        />
      )}

      {/* Toolbar */}
      <nav className="flex items-center gap-2 px-4 py-1 bg-stone-900 border-b border-stone-800 shrink-0" aria-label="工具栏">
        {featureFlags?.notesDrawer && (
          <button
            onClick={onToggleNotes}
            className={`px-2 py-0.5 rounded text-xs ${notesOpen ? 'bg-stone-600 text-stone-100' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}
            aria-pressed={notesOpen}
            aria-label="笔记面板"
          >
            📝 笔记
          </button>
        )}
        {featureFlags?.comments && (
          <>
            <button
              onClick={onToggleComments}
              className={`px-2 py-0.5 rounded text-xs ${commentsOpen ? 'bg-stone-600 text-stone-100' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}
              aria-pressed={commentsOpen}
              aria-label={`评论面板 (${commentThreads.length} 条)`}
            >
              💬 评论 ({commentThreads.length})
            </button>
            <button
              onClick={() => readerState.setInteractionMode(
                readerState.interactionMode === 'comment' ? 'read' : 'comment',
              )}
              className={`px-2 py-0.5 rounded text-xs ${
                readerState.interactionMode === 'comment'
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              aria-pressed={readerState.interactionMode === 'comment'}
              aria-label="切换评论模式"
            >
              {readerState.interactionMode === 'comment' ? '🔍 评论中' : '🖊 评论模式'}
            </button>
            <button
              onClick={onExportComments}
              className="px-2 py-0.5 rounded text-xs bg-stone-800 text-stone-400 hover:text-stone-200"
              aria-label="导出评论"
              title="导出评论为 JSON"
            >
              📤
            </button>
            <button
              onClick={onImportComments}
              className="px-2 py-0.5 rounded text-xs bg-stone-800 text-stone-400 hover:text-stone-200"
              aria-label="导入评论"
              title="从 JSON 导入评论"
            >
              📥
            </button>
          </>
        )}
        {featureFlags?.debugOverlay && (
          <button
            onClick={readerState.toggleDebugOverlay}
            className={`px-2 py-0.5 rounded text-xs ${
              readerState.interactionMode === 'debugOverlay'
                ? 'bg-orange-600 text-white'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            aria-pressed={readerState.interactionMode === 'debugOverlay'}
            aria-label="切换调试覆盖层"
          >
            🐛 Debug
          </button>
        )}
      </nav>

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        <PageViewport
          registry={registry}
          readerState={readerState}
          commentThreads={commentThreads}
          selectedThreadId={selectedThreadId}
          onSelectThread={onSelectThread}
          onCreateAnchor={onCreateAnchor}
        />

        {featureFlags?.notesDrawer && noteIds.length > 0 && (
          <NotesDrawer
            noteIds={noteIds}
            registry={registry}
            open={notesOpen}
            onToggle={onToggleNotes}
          />
        )}

        {featureFlags?.comments && (
          <CommentPanel
            threads={commentThreads}
            selectedThreadId={selectedThreadId}
            onSelectThread={onSelectThread}
            onAddMessage={onAddMessage}
            onResolve={onResolve}
            onReopen={onReopen}
            open={commentsOpen}
            onToggle={onToggleComments}
          />
        )}
      </div>

      {/* Bottom Bar */}
      {manifest.navigation?.showBottomBar && (
        <ReaderBottomBar
          currentIndex={readerState.currentPageIndex}
          totalPages={readerState.totalPages}
          canGoNext={readerState.canGoNext}
          canGoPrevious={readerState.canGoPrevious}
          onNext={readerState.goNext}
          onPrevious={readerState.goPrevious}
        />
      )}
    </div>
  );
}
