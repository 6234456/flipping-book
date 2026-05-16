import { FileText, MessageSquare, MousePointerClick, Eye, Upload, Download, Bug } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import type { NoteId } from '../../atlas-core/types/primitives';
import type { ZoomLevel } from '../renderers/ImageOverlayTemplate';
import { Button, Toggle } from '../primitives';
import { ReaderTopBar } from './ReaderTopBar';
import { ReaderBottomBar } from './ReaderBottomBar';
import { PageViewport } from './PageViewport';
import { NotesDrawer } from '../notes/NotesDrawer';
import { CommentPanel } from '../comments/CommentPanel';

type ReaderShellProps = {
  registry: BookRegistry;
  readerState: ReaderState;
  zoom: ZoomLevel;
  onCycleZoom: () => void;
  noteIds: NoteId[];
  notesOpen: boolean;
  onToggleNotes: () => void;
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
  commentsOpen: boolean;
  onToggleComments: () => void;
  onExportComments: () => void;
  onImportComments: () => void;
  onDeleteThread: (threadId: string) => void;
  onEditMessage: (threadId: string, messageId: string, text: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;
};

export function ReaderShell({
  registry,
  readerState,
  zoom,
  onCycleZoom,
  noteIds,
  notesOpen,
  onToggleNotes,
  commentThreads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onAddMessage,
  onResolve,
  onReopen,
  onCreateAnchor,
  commentsOpen,
  onToggleComments,
  onExportComments,
  onImportComments,
  onDeleteThread,
  onEditMessage,
  onDeleteMessage,
}: ReaderShellProps) {
  const { manifest } = registry;
  const { currentPage, interactionMode } = readerState;
  const featureFlags = manifest.featureFlags;
  const inCommentMode = interactionMode === 'comment';
  const inDebugMode = interactionMode === 'debugOverlay';

  return (
    <div className="flex flex-col h-dvh bg-surface" role="application" aria-label="VAT Atlas 阅读器">
      {manifest.navigation?.showTopBar && (
        <ReaderTopBar
          title={manifest.title}
          pageTitle={currentPage?.title}
          pageNumber={currentPage?.pageNumber}
          totalPages={readerState.totalPages}
          interactionMode={interactionMode}
        />
      )}

      <nav
        className="flex items-center gap-1 px-3 py-1.5 bg-page border-b border-border shrink-0"
        aria-label="工具栏"
      >
        {featureFlags?.notesDrawer && (
          <Toggle
            size="sm"
            pressed={notesOpen}
            onPressedChange={onToggleNotes}
            leadingIcon={FileText}
            aria-label="笔记面板"
          >
            笔记
          </Toggle>
        )}
        {featureFlags?.comments && (
          <>
            <Toggle
              size="sm"
              pressed={commentsOpen}
              onPressedChange={onToggleComments}
              leadingIcon={MessageSquare}
              aria-label={`评论面板 (${commentThreads.length} 条)`}
            >
              评论 ({commentThreads.length})
            </Toggle>
            <Toggle
              size="sm"
              pressed={inCommentMode}
              onPressedChange={() =>
                readerState.setInteractionMode(inCommentMode ? 'read' : 'comment')
              }
              leadingIcon={inCommentMode ? Eye : MousePointerClick}
              aria-label="切换评论模式"
            >
              评论模式
            </Toggle>
            <span className="w-px h-4 bg-divider mx-1" aria-hidden="true" />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              leadingIcon={Upload}
              onClick={onExportComments}
              aria-label="导出评论为 JSON"
              title="导出评论为 JSON"
            />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              leadingIcon={Download}
              onClick={onImportComments}
              aria-label="从 JSON 导入评论"
              title="从 JSON 导入评论"
            />
          </>
        )}
        {featureFlags?.debugOverlay && (
          <>
            <span className="w-px h-4 bg-divider mx-1" aria-hidden="true" />
            <Toggle
              size="sm"
              pressed={inDebugMode}
              onPressedChange={readerState.toggleDebugOverlay}
              leadingIcon={Bug}
              aria-label="切换调试覆盖层"
            >
              Debug
            </Toggle>
          </>
        )}
      </nav>

      <div className="flex-1 relative overflow-hidden">
        <PageViewport
          registry={registry}
          readerState={readerState}
          zoom={zoom}
          onCycleZoom={onCycleZoom}
          commentThreads={commentThreads}
          selectedThreadId={selectedThreadId}
          highlightedThreadId={highlightedThreadId}
          onSelectThread={onSelectThread}
          onHoverThread={onHoverThread}
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
            highlightedThreadId={highlightedThreadId}
            onSelectThread={onSelectThread}
            onHoverThread={onHoverThread}
            onAddMessage={onAddMessage}
            onResolve={onResolve}
            onReopen={onReopen}
            onDeleteThread={onDeleteThread}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            open={commentsOpen}
            onToggle={onToggleComments}
          />
        )}
      </div>

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
