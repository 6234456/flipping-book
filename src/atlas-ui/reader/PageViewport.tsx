import { useNavigate } from 'react-router-dom';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import { useSpreadMode } from '../../atlas-core/reader/useSpreadMode';
import { PageRenderer } from '../renderers/PageRenderer';
import { SpreadPageRenderer } from '../renderers/SpreadPageRenderer';
import { HotspotLayer } from '../overlay/HotspotLayer';
import { DebugOverlay } from '../overlay/DebugOverlay';
import type { HotspotTarget } from '../../atlas-core/types/overlay';
import { resolveTargetRoute } from '../../atlas-core/registry/resolveTarget';
import type { PageManifest } from '../../atlas-core/types/page';

function PageContent({
  page,
  registry,
  interactionMode,
  onNavigate,
}: {
  page: PageManifest;
  registry: BookRegistry;
  interactionMode: ReaderState['interactionMode'];
  onNavigate: (target: HotspotTarget) => void;
}) {
  const spreadMode = useSpreadMode(page, registry.manifest.reader);

  // Spread mode
  if (page.spreadImages && spreadMode.mode === 'spread') {
    return (
      <main className="flex-1 flex items-center justify-center overflow-auto p-2">
        <SpreadPageRenderer
          page={page}
          spreadImages={page.spreadImages}
          registry={registry}
          locale="zh-CN"
          spreadMode={spreadMode.mode}
          interactionMode={interactionMode}
          onNavigate={onNavigate}
        />
      </main>
    );
  }

  // Single page mode
  const imageAsset = page.image
    ? registry.getImage(page.image.assetId)
    : undefined;

  const overlayConfig = page.overlay
    ? registry.getOverlay(page.overlay.overlayId)
    : undefined;

  return (
    <main className="flex-1 flex items-center justify-center overflow-auto p-2">
      <div className="relative inline-block max-h-full">
        <PageRenderer page={page} imageAsset={imageAsset} locale="zh-CN" registry={registry} />

        {overlayConfig && interactionMode === 'read' && (
          <HotspotLayer
            overlay={overlayConfig}
            imageAsset={imageAsset}
            onNavigate={onNavigate}
          />
        )}

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
};

export function PageViewport({ registry, readerState }: PageViewportProps) {
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
    />
  );
}
