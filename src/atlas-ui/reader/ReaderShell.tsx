import { AnimatePresence } from 'framer-motion';
import { BookOpen, Bug, Eye, LayoutGrid, MousePointerClick } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import type { NoteId } from '../../atlas-core/types/primitives';
import type { ZoomLevel } from '../renderers/ImageOverlayTemplate';
import type { RailTab } from '../../atlas-core/reader/useRailState';
import { ChromeButton, Icon, InfoBanner } from '../primitives';
import { ReaderBottomBar } from './ReaderBottomBar';
import { PageViewport } from './PageViewport';
import { ReaderRail } from '../rail/ReaderRail';
import { MobileRailSheet } from '../rail/MobileRailSheet';
import { SlimRail } from '../rail/SlimRail';

type ReaderShellProps = {
  registry: BookRegistry;
  readerState: ReaderState;
  zoom: ZoomLevel;
  onCycleZoom: () => void;

  // Comments
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
  onDeleteThread: (threadId: string) => void;
  onEditMessage: (threadId: string, messageId: string, text: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;

  // Notes
  noteIds: NoteId[];

  // Rail state
  railOpen: boolean;
  railTab: RailTab;
  railWidth: number;
  onRailTabChange: (tab: RailTab) => void;
  onRailCollapse: () => void;
  onRailExpand: (toTab: RailTab) => void;

  // + button / banner
  onPlusClick: () => void;
  onDismissCommentMode: () => void;

  // Mobile
  isMobile: boolean;

  // Navigation
  onNavigateToPage: (pageId: string) => void;

  // Rich regions
  richRegionsOn: boolean;
  onToggleRichRegions: () => void;
};

export function ReaderShell({
  registry,
  readerState,
  zoom,
  onCycleZoom,
  commentThreads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onAddMessage,
  onResolve,
  onReopen,
  onCreateAnchor,
  onDeleteThread,
  onEditMessage,
  onDeleteMessage,
  noteIds,
  railOpen,
  railTab,
  railWidth,
  onRailTabChange,
  onRailCollapse,
  onRailExpand,
  onPlusClick,
  onDismissCommentMode,
  isMobile,
  onNavigateToPage,
  richRegionsOn,
  onToggleRichRegions,
}: ReaderShellProps) {
  const { manifest } = registry;
  const { currentPage, interactionMode } = readerState;
  const featureFlags = manifest.featureFlags;
  const inCommentMode = interactionMode === 'comment';
  const inDebugMode = interactionMode === 'debugOverlay';

  const brand = manifest.title['zh-CN'] ?? '';
  const sectionTitle = currentPage?.title?.['zh-CN'];

  const railHandlers = {
    threads: commentThreads,
    noteIds,
    registry,
    currentPageId: currentPage?.pageId ?? null,
    selectedThreadId,
    highlightedThreadId,
    onSelectThread,
    onHoverThread,
    onAddMessage,
    onResolve,
    onReopen,
    onDeleteThread,
    onEditMessage,
    onDeleteMessage,
    onPlusClick,
    onNavigate: onNavigateToPage,
  };

  return (
    <div className="flex flex-col h-dvh bg-surface" role="application" aria-label="VAT Atlas 阅读器">
      {manifest.navigation?.showTopBar && (
        <header className="flex items-center bg-chrome text-page h-11 px-3.5 gap-2.5 shrink-0 text-[12px]">
          <span className="text-accent-2 shrink-0">
            <Icon icon={BookOpen} size={14} />
          </span>
          <span className="font-semibold shrink-0">{brand}</span>
          {sectionTitle ? (
            <>
              <span className="opacity-30" aria-hidden="true">·</span>
              <span className="opacity-60 truncate">{sectionTitle}</span>
            </>
          ) : null}
          <span className="w-px h-3.5 bg-white/15 mx-1 shrink-0" aria-hidden="true" />

          {featureFlags?.comments && (
            <ChromeButton
              pressed={inCommentMode}
              leadingIcon={inCommentMode ? Eye : MousePointerClick}
              onClick={() => readerState.setInteractionMode(inCommentMode ? 'read' : 'comment')}
              aria-label="切换评论模式"
            >
              评论模式
            </ChromeButton>
          )}
          <ChromeButton
            pressed={richRegionsOn}
            leadingIcon={LayoutGrid}
            onClick={onToggleRichRegions}
            aria-label="切换区域高亮"
          >
            区域
          </ChromeButton>
          {featureFlags?.debugOverlay && (
            <ChromeButton
              pressed={inDebugMode}
              leadingIcon={Bug}
              onClick={readerState.toggleDebugOverlay}
              aria-label="切换调试覆盖层"
            >
              Debug
            </ChromeButton>
          )}

          <div className="ml-auto opacity-65 tabular-nums shrink-0 font-mono text-[11px]">
            第 {currentPage?.pageNumber ?? '-'} / {readerState.totalPages} 页
          </div>
        </header>
      )}

      {inCommentMode && (
        <InfoBanner
          variant="accent"
          icon={MousePointerClick}
          message="点击图片任意位置添加评论 · 按 ESC 取消"
          onDismiss={onDismissCommentMode}
        />
      )}

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
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
            richRegionsOn={richRegionsOn}
          />
        </div>

        {!isMobile && (
          <ReaderRail
            open={railOpen}
            tab={railTab}
            width={railWidth}
            onTabChange={onRailTabChange}
            onCollapse={onRailCollapse}
            onExpand={onRailExpand}
            {...railHandlers}
          />
        )}

        {isMobile && !railOpen && (
          <SlimRail
            activeTab={null}
            badges={{ comments: commentThreads.length, notes: noteIds.length, toc: 0 }}
            onExpand={onRailExpand}
          />
        )}
        {isMobile && (
          <AnimatePresence>
            {railOpen ? (
              <MobileRailSheet
                tab={railTab}
                onTabChange={onRailTabChange}
                onClose={onRailCollapse}
                {...railHandlers}
              />
            ) : null}
          </AnimatePresence>
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
          readingOrder={registry.manifest.readingOrder}
          getPage={(id) => registry.getPage(id)}
          onNavigateToPage={onNavigateToPage}
        />
      )}
    </div>
  );
}
