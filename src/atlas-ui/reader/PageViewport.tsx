import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize, Maximize2, ZoomIn, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import { useSpreadMode } from '../../atlas-core/reader/useSpreadMode';
import { PageRenderer } from '../renderers/PageRenderer';
import { SpreadPageRenderer } from '../renderers/SpreadPageRenderer';
import { HotspotLayer } from '../overlay/HotspotLayer';
import { DebugOverlay } from '../overlay/DebugOverlay';
import { CommentPinLayer } from '../comments/CommentPinLayer';
import { CommentCaptureLayer } from '../comments/CommentCaptureLayer';
import { Button, EmptyState, MOTION } from '../primitives';
import type { HotspotTarget } from '../../atlas-core/types/overlay';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import { resolveTargetRoute } from '../../atlas-core/registry/resolveTarget';
import type { PageManifest } from '../../atlas-core/types/page';
import type { ZoomLevel } from '../renderers/ImageOverlayTemplate';

const ZOOM_LABEL: Record<ZoomLevel, string> = {
  'fit-page': '适应页面',
  'fit-width': '适应宽度',
  'actual-size': '实际大小',
};

const ZOOM_ICON: Record<ZoomLevel, LucideIcon> = {
  'fit-page': Maximize,
  'fit-width': Maximize2,
  'actual-size': ZoomIn,
};

type Direction = 1 | -1 | 0;

function PageContent({
  page,
  registry,
  interactionMode,
  onNavigate,
  zoom,
  onCycleZoom,
  commentThreads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onCreateAnchor,
  direction,
}: {
  page: PageManifest;
  registry: BookRegistry;
  interactionMode: ReaderState['interactionMode'];
  onNavigate: (target: HotspotTarget) => void;
  zoom: ZoomLevel;
  onCycleZoom: () => void;
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
  direction: Direction;
}) {
  const spreadMode = useSpreadMode(page, registry.manifest.reader);

  const imageAsset = page.image ? registry.getImage(page.image.assetId) : undefined;
  const effectiveImageAssetId = page.image?.assetId ?? '';
  const effectiveImageVersion = page.image?.version ?? '';

  const isFitPage = zoom === 'fit-page';
  const ZoomIconComp = ZOOM_ICON[zoom];

  const overlayConfig = page.overlay ? registry.getOverlay(page.overlay.overlayId) : undefined;

  function renderPins() {
    return (
      <CommentPinLayer
        threads={commentThreads}
        highlightedThreadId={highlightedThreadId}
        onHoverThread={onHoverThread}
        onClickThread={(id) => onSelectThread(id === selectedThreadId ? null : id)}
      />
    );
  }

  const slide = direction * 8;

  if (page.spreadImages && spreadMode.mode === 'spread') {
    return (
      <main className="flex-1 flex flex-col items-center overflow-auto bg-surface">
        <div className="sticky top-0 z-50 flex items-center gap-1 px-2 py-1 bg-page/90 backdrop-blur shrink-0 self-start border-b border-border">
          <Button variant="ghost" size="sm" leadingIcon={ZoomIconComp} onClick={onCycleZoom}>
            {ZOOM_LABEL[zoom]}
          </Button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page.pageId}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide }}
            transition={MOTION.pageFade}
            className="relative"
          >
            <SpreadPageRenderer
              page={page}
              spreadImages={page.spreadImages}
              registry={registry}
              locale="zh-CN"
              spreadMode={spreadMode.mode}
              interactionMode={interactionMode}
              onNavigate={onNavigate}
            />
            {interactionMode === 'comment' && renderPins()}
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center overflow-auto bg-surface">
      <div className="sticky top-0 z-50 flex items-center gap-2 px-2 py-1 bg-page/90 backdrop-blur shrink-0 self-start border-b border-border">
        <Button variant="ghost" size="sm" leadingIcon={ZoomIconComp} onClick={onCycleZoom}>
          {ZOOM_LABEL[zoom]}
        </Button>
        {imageAsset ? (
          <span className="text-text-muted text-xs tabular-nums">
            {imageAsset.width}×{imageAsset.height}
          </span>
        ) : null}
      </div>

      <div className={`relative ${isFitPage ? 'flex-1 flex items-center justify-center overflow-hidden' : ''}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page.pageId}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide }}
            transition={MOTION.pageFade}
            className="relative"
          >
            <PageRenderer
              page={page}
              imageAsset={imageAsset}
              locale="zh-CN"
              registry={registry}
              zoom={zoom}
            />

            {overlayConfig && interactionMode === 'read' && (
              <HotspotLayer overlay={overlayConfig} imageAsset={imageAsset} onNavigate={onNavigate} />
            )}

            {interactionMode === 'comment' && renderPins()}

            <CommentCaptureLayer
              pageId={page.pageId}
              imageAssetId={effectiveImageAssetId}
              imageVersion={effectiveImageVersion}
              active={interactionMode === 'comment'}
              onCreateAnchor={onCreateAnchor}
            />

            {overlayConfig && interactionMode === 'debugOverlay' && (
              <DebugOverlay overlay={overlayConfig} imageAsset={imageAsset} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

type PageViewportProps = {
  registry: BookRegistry;
  readerState: ReaderState;
  zoom: ZoomLevel;
  onCycleZoom: () => void;
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
};

export function PageViewport({
  registry,
  readerState,
  zoom,
  onCycleZoom,
  commentThreads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onCreateAnchor,
}: PageViewportProps) {
  const { currentPage, interactionMode, currentPageIndex } = readerState;
  const navigate = useNavigate();
  const bookSlug = registry.manifest.slug;

  // Observe page-index changes to derive transition direction.
  const prevIndexRef = useRef(currentPageIndex);
  const [direction, setDirection] = useState<Direction>(0);

  useEffect(() => {
    const prev = prevIndexRef.current;
    if (currentPageIndex !== prev) {
      setDirection(
        Math.abs(currentPageIndex - prev) === 1 ? (currentPageIndex > prev ? 1 : -1) : 0,
      );
    } else {
      setDirection(0);
    }
    prevIndexRef.current = currentPageIndex;
  }, [currentPageIndex]);

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <EmptyState
          icon={BookOpen}
          title="页面未找到"
          description="可能链接已失效。返回首页继续阅读。"
          action={
            <Link
              to={`/book/${bookSlug}`}
              className="text-accent hover:text-accent-hover text-sm font-medium"
            >
              返回首页 →
            </Link>
          }
        />
      </div>
    );
  }

  function handleNavigate(target: HotspotTarget) {
    const route = resolveTargetRoute(target, registry.manifest.slug);
    if (route && target.kind !== 'external') {
      navigate(route);
    } else if (route && target.kind === 'external') {
      window.open(route, target.openInNewTab ? '_blank' : '_self');
    }
  }

  return (
    <PageContent
      page={currentPage}
      registry={registry}
      interactionMode={interactionMode}
      onNavigate={handleNavigate}
      zoom={zoom}
      onCycleZoom={onCycleZoom}
      commentThreads={commentThreads}
      selectedThreadId={selectedThreadId}
      highlightedThreadId={highlightedThreadId}
      onSelectThread={onSelectThread}
      onHoverThread={onHoverThread}
      onCreateAnchor={onCreateAnchor}
      direction={direction}
    />
  );
}
