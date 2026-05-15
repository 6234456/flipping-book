import { useNavigate } from 'react-router-dom';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import { useSpreadMode } from '../../atlas-core/reader/useSpreadMode';
import { PageRenderer } from '../renderers/PageRenderer';
import { SpreadPageRenderer } from '../renderers/SpreadPageRenderer';
import { HotspotLayer } from '../overlay/HotspotLayer';
import { DebugOverlay } from '../overlay/DebugOverlay';
import { CommentPinLayer } from '../comments/CommentPinLayer';
import { CommentCaptureLayer } from '../comments/CommentCaptureLayer';
import type { HotspotTarget } from '../../atlas-core/types/overlay';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import { resolveTargetRoute } from '../../atlas-core/registry/resolveTarget';
import type { PageManifest } from '../../atlas-core/types/page';
import type { ZoomLevel } from '../renderers/ImageOverlayTemplate';

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
}) {
  const spreadMode = useSpreadMode(page, registry.manifest.reader);

  const imageAsset = page.image
    ? registry.getImage(page.image.assetId)
    : undefined;
  const effectiveImageAssetId = page.image?.assetId ?? '';
  const effectiveImageVersion = page.image?.version ?? '';

  const zoomLabel = zoom === 'fit-page' ? '适应页面' : zoom === 'fit-width' ? '适应宽度' : '实际大小';
  const isFitPage = zoom === 'fit-page';

  const overlayConfig = page.overlay
    ? registry.getOverlay(page.overlay.overlayId)
    : undefined;

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

  // Spread mode
  if (page.spreadImages && spreadMode.mode === 'spread') {
    const mainClass = isFitPage
      ? 'flex-1 flex flex-col overflow-hidden'
      : 'flex-1 flex flex-col overflow-auto';

    return (
      <main className={`${mainClass} bg-stone-900`}>
        <div className="sticky top-0 z-50 flex items-center gap-1 px-2 py-1 bg-stone-900/90 backdrop-blur shrink-0">
          <button onClick={onCycleZoom} className="px-2 py-0.5 rounded text-xs bg-stone-800 text-stone-400 hover:text-stone-200" title="切换缩放模式">
            🔍 {zoomLabel}
          </button>
        </div>
        <div className={`relative ${isFitPage ? 'flex-1 flex items-center justify-center overflow-hidden' : ''}`}>
          <div className="relative">
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
          </div>
        </div>
      </main>
    );
  }

  // Single page mode
  const mainClass = isFitPage
    ? 'flex-1 flex flex-col overflow-hidden'
    : 'flex-1 flex flex-col overflow-auto';

  return (
    <main className={`${mainClass} bg-stone-900`}>
      {/* Zoom bar */}
      <div className="sticky top-0 z-50 flex items-center gap-1 px-2 py-1 bg-stone-900/90 backdrop-blur shrink-0">
        <button onClick={onCycleZoom} className="px-2 py-0.5 rounded text-xs bg-stone-800 text-stone-400 hover:text-stone-200">
          🔍 {zoomLabel}
        </button>
        {imageAsset && (
          <span className="text-stone-500 text-xs">{imageAsset.width}×{imageAsset.height}</span>
        )}
      </div>

      {/* Page content: fit-page fills remaining height, constrains image */}
      <div className={`relative ${isFitPage ? 'flex-1 flex items-center justify-center overflow-hidden' : ''}`}>
        <div className="relative">
          <PageRenderer page={page} imageAsset={imageAsset} locale="zh-CN" registry={registry} zoom={zoom} />

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
        </div>
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
  const { currentPage, interactionMode } = readerState;
  const navigate = useNavigate();

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400">
        页面未找到
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
    />
  );
}
