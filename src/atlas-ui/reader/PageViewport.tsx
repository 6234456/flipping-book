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

function PageContent({
  page,
  registry,
  interactionMode,
  onNavigate,
  commentThreads,
  selectedThreadId,
  onSelectThread,
  onCreateAnchor,
}: {
  page: PageManifest;
  registry: BookRegistry;
  interactionMode: ReaderState['interactionMode'];
  onNavigate: (target: HotspotTarget) => void;
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
}) {
  const spreadMode = useSpreadMode(page, registry.manifest.reader);

  const imageAsset = page.image
    ? registry.getImage(page.image.assetId)
    : undefined;

  // Determine image info for comment anchoring
  const effectiveImageAssetId = page.image?.assetId ?? '';
  const effectiveImageVersion = page.image?.version ?? '';

  // Spread mode
  if (page.spreadImages && spreadMode.mode === 'spread') {
    return (
      <main className="flex-1 flex items-center justify-center overflow-auto p-2">
        <div className="relative inline-block max-h-full">
          <SpreadPageRenderer
            page={page}
            spreadImages={page.spreadImages}
            registry={registry}
            locale="zh-CN"
            spreadMode={spreadMode.mode}
            interactionMode={interactionMode}
            onNavigate={onNavigate}
          />
          {(interactionMode === 'read' || interactionMode === 'comment') && (
            <CommentPinLayer
              threads={commentThreads}
              onClickThread={(id) => onSelectThread(id === selectedThreadId ? null : id)}
            />
          )}
        </div>
      </main>
    );
  }

  // Single page mode
  const overlayConfig = page.overlay
    ? registry.getOverlay(page.overlay.overlayId)
    : undefined;

  return (
    <main className="flex-1 flex items-center justify-center overflow-auto p-2">
      <div className="relative inline-block max-h-full">
        <PageRenderer page={page} imageAsset={imageAsset} locale="zh-CN" registry={registry} />

        {/* Hotspots: only active in read mode */}
        {overlayConfig && interactionMode === 'read' && (
          <HotspotLayer
            overlay={overlayConfig}
            imageAsset={imageAsset}
            onNavigate={onNavigate}
          />
        )}

        {/* Comment pins: visible in read and comment modes */}
        {(interactionMode === 'read' || interactionMode === 'comment') && (
          <CommentPinLayer
            threads={commentThreads}
            onClickThread={(id) => onSelectThread(id === selectedThreadId ? null : id)}
          />
        )}

        {/* Comment capture: only active in comment mode */}
        <CommentCaptureLayer
          pageId={page.pageId}
          imageAssetId={effectiveImageAssetId}
          imageVersion={effectiveImageVersion}
          active={interactionMode === 'comment'}
          onCreateAnchor={onCreateAnchor}
        />

        {/* Debug overlay */}
        {overlayConfig && interactionMode === 'debugOverlay' && (
          <DebugOverlay overlay={overlayConfig} imageAsset={imageAsset} />
        )}
      </div>
    </main>
  );
}

type PageViewportProps = {
  registry: BookRegistry;
  readerState: ReaderState;
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
};

export function PageViewport({
  registry,
  readerState,
  commentThreads,
  selectedThreadId,
  onSelectThread,
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
      commentThreads={commentThreads}
      selectedThreadId={selectedThreadId}
      onSelectThread={onSelectThread}
      onCreateAnchor={onCreateAnchor}
    />
  );
}
