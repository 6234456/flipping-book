import { useNavigate } from 'react-router-dom';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import { PageRenderer } from '../renderers/PageRenderer';
import { HotspotLayer } from '../overlay/HotspotLayer';
import { DebugOverlay } from '../overlay/DebugOverlay';
import type { HotspotTarget } from '../../atlas-core/types/overlay';
import { resolveTargetRoute } from '../../atlas-core/registry/resolveTarget';

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

  const imageAsset = currentPage.image
    ? registry.getImage(currentPage.image.assetId)
    : undefined;

  const overlayConfig = currentPage.overlay
    ? registry.getOverlay(currentPage.overlay.overlayId)
    : undefined;

  function handleNavigate(target: HotspotTarget) {
    const route = resolveTargetRoute(target, registry.manifest.slug);
    if (route && target.kind !== 'external') {
      navigate(route);
    } else if (route && target.kind === 'external') {
      window.open(route, target.openInNewTab ? '_blank' : '_self');
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center overflow-auto p-2">
      <div className="relative inline-block max-h-full">
        <PageRenderer page={currentPage} imageAsset={imageAsset} locale="zh-CN" registry={registry} />

        {overlayConfig && interactionMode === 'read' && (
          <HotspotLayer
            overlay={overlayConfig}
            imageAsset={imageAsset}
            onNavigate={handleNavigate}
          />
        )}

        {overlayConfig && interactionMode === 'debugOverlay' && (
          <DebugOverlay overlay={overlayConfig} imageAsset={imageAsset} />
        )}
      </div>
    </main>
  );
}
