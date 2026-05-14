import { useNavigate } from 'react-router-dom';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';

type PageViewportProps = {
  registry: BookRegistry;
  readerState: ReaderState;
  /** These will be replaced with real components in Task 7/8 */
  PageRenderer?: React.ComponentType<{
    page: NonNullable<ReaderState['currentPage']>;
    imageAsset?: ReturnType<BookRegistry['getImage']>;
    locale: string;
  }>;
  HotspotLayer?: React.ComponentType<{
    overlay: ReturnType<BookRegistry['getOverlay']>;
    imageAsset?: ReturnType<BookRegistry['getImage']>;
    onNavigate: (target: { kind: string; [key: string]: unknown }) => void;
  }>;
  DebugOverlay?: React.ComponentType<{
    overlay: ReturnType<BookRegistry['getOverlay']>;
    imageAsset?: ReturnType<BookRegistry['getImage']>;
  }>;
};

export function PageViewport({
  registry,
  readerState,
  PageRenderer,
  HotspotLayer,
  DebugOverlay,
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

  const imageAsset = currentPage.image
    ? registry.getImage(currentPage.image.assetId)
    : undefined;

  const overlayConfig = currentPage.overlay
    ? registry.getOverlay(currentPage.overlay.overlayId)
    : undefined;

  function handleNavigate(target: { kind: string; [key: string]: unknown }) {
    if (target.kind === 'page' && target.pageId) {
      navigate(`/book/${registry.manifest.slug}/page/${target.pageId}`);
    } else if (target.kind === 'glossary') {
      navigate(`/book/${registry.manifest.slug}/glossary`);
    } else if (target.kind === 'external' && target.href) {
      window.open(target.href as string, '_blank');
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center overflow-auto p-2">
      <div className="relative inline-block max-h-full">
        {PageRenderer && (
          <PageRenderer page={currentPage} imageAsset={imageAsset} locale="zh-CN" />
        )}

        {!PageRenderer && imageAsset && (
          <img
            src={imageAsset.src}
            alt={imageAsset.alt?.['zh-CN'] ?? currentPage.title?.['zh-CN'] ?? ''}
            className="block max-h-full w-auto"
            style={{ width: '100%', height: 'auto' }}
            draggable={false}
          />
        )}

        {!PageRenderer && !imageAsset && (
          <div className="w-[1000px] h-[1414px] bg-stone-800 flex items-center justify-center text-stone-400">
            {currentPage.title?.['zh-CN'] ?? currentPage.pageId}
          </div>
        )}

        {overlayConfig && interactionMode === 'read' && HotspotLayer && (
          <HotspotLayer
            overlay={overlayConfig}
            imageAsset={imageAsset}
            onNavigate={handleNavigate}
          />
        )}

        {overlayConfig && interactionMode === 'debugOverlay' && DebugOverlay && (
          <DebugOverlay overlay={overlayConfig} imageAsset={imageAsset} />
        )}
      </div>
    </main>
  );
}
