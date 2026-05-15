import type { PageManifest, SpreadImageRefs, SpreadSourceMode } from '../../atlas-core/types/page';
import type { BookRegistry } from '../../atlas-core/registry';
import type { OverlayConfig } from '../../atlas-core/types/overlay';
import type { HotspotTarget } from '../../atlas-core/types/overlay';
import { HotspotLayer } from '../overlay/HotspotLayer';
import { DebugOverlay } from '../overlay/DebugOverlay';
import type { SpreadMode } from '../../atlas-core/reader/useSpreadMode';
import type { ReaderInteractionMode } from '../../atlas-core/types/primitives';
import { mapOverlayToSpread } from '../../atlas-core/overlay/mapSpreadOverlay';

type SpreadPageRendererProps = {
  page: PageManifest;
  spreadImages: SpreadImageRefs;
  registry: BookRegistry;
  locale: string;
  spreadMode: SpreadMode;
  interactionMode: ReaderInteractionMode;
  onNavigate: (target: HotspotTarget) => void;
};

function SpreadImage({
  src,
  alt,
  widthPercent,
}: {
  src: string;
  alt: string;
  widthPercent: number;
}) {
  return (
    <div style={{ width: `${widthPercent}%`, position: 'relative' }}>
      <img
        src={src}
        alt={alt}
        className="block"
        style={{ width: '100%', height: 'auto' }}
        draggable={false}
      />
    </div>
  );
}

export function SpreadPageRenderer({
  page,
  spreadImages,
  registry,
  locale,
  spreadMode,
  interactionMode,
  onNavigate,
}: SpreadPageRendererProps) {
  const gutterPercent = page.layout.spread?.gutterWidthPercent ?? 2;

  // Resolve overlay config(s)
  const overlayConfig = page.overlay
    ? registry.getOverlay(page.overlay.overlayId)
    : undefined;

  // In single mode (mobile), show as single page based on mobileOrder
  if (spreadMode === 'single') {
    const order = page.layout.spread?.mobileOrder ?? 'left-first';

    if (spreadImages.sourceMode === 'single-spread-image') {
      // Show the full spread image but as a single tall image
      const image = registry.getImage(spreadImages.spread.assetId);
      if (!image) return <div className="text-stone-400 p-8">跨页图片不可用</div>;

      return (
        <div className="relative inline-block max-h-full">
          <img
            src={image.src}
            alt={image.alt?.[locale] ?? ''}
            className="block max-h-full w-auto"
            style={{ width: '100%', height: 'auto' }}
            draggable={false}
          />
          {overlayConfig && interactionMode === 'read' && (
            <HotspotLayer
              overlay={overlayConfig}
              onNavigate={onNavigate}
            />
          )}
          {overlayConfig && interactionMode === 'debugOverlay' && (
            <DebugOverlay overlay={overlayConfig} />
          )}
        </div>
      );
    }

    // Two-page-composition in single mode: show one page at a time
    const side = order === 'left-first' ? 'left' : 'right';
    const imageRef = spreadImages.sourceMode === 'two-page-composition'
      ? (side === 'left' ? spreadImages.left : spreadImages.right)
      : null;
    const image = imageRef ? registry.getImage(imageRef.assetId) : undefined;

    if (!image) return <div className="text-stone-400 p-8">图片不可用</div>;

    const transformedOverlay = spreadImages.sourceMode === 'two-page-composition' && overlayConfig
      ? mapOverlayToSpread(overlayConfig, 'two-page-composition', side)
      : overlayConfig;

    return (
      <div className="relative inline-block max-h-full">
        <img
          src={image.src}
          alt={image.alt?.[locale] ?? ''}
          className="block max-h-full w-auto"
          style={{ width: '100%', height: 'auto' }}
          draggable={false}
        />
        {transformedOverlay && interactionMode === 'read' && (
          <HotspotLayer
            overlay={transformedOverlay}
            onNavigate={onNavigate}
          />
        )}
        {transformedOverlay && interactionMode === 'debugOverlay' && (
          <DebugOverlay overlay={transformedOverlay} />
        )}
      </div>
    );
  }

  // Spread mode (desktop): render as double-page spread
  if (spreadImages.sourceMode === 'single-spread-image') {
    const image = registry.getImage(spreadImages.spread.assetId);
    if (!image) return <div className="text-stone-400 p-8">跨页图片不可用</div>;

    return (
      <div className="relative inline-block max-h-full">
        <img
          src={image.src}
          alt={image.alt?.[locale] ?? ''}
          className="block max-h-full w-auto"
          style={{ width: '100%', height: 'auto' }}
          draggable={false}
        />
        {overlayConfig && interactionMode === 'read' && (
          <HotspotLayer
            overlay={overlayConfig}
            onNavigate={onNavigate}
          />
        )}
        {overlayConfig && interactionMode === 'debugOverlay' && (
          <DebugOverlay overlay={overlayConfig} />
        )}
      </div>
    );
  }

  // Two-page-composition spread mode
  const leftImage = registry.getImage(spreadImages.left.assetId);
  const rightImage = registry.getImage(spreadImages.right.assetId);

  const halfGutter = gutterPercent / 2;
  const pageWidth = (100 - gutterPercent) / 2;

  const leftOverlay = overlayConfig
    ? mapOverlayToSpread(overlayConfig, 'two-page-composition', 'left')
    : undefined;
  const rightOverlay = overlayConfig
    ? mapOverlayToSpread(overlayConfig, 'two-page-composition', 'right')
    : undefined;

  // For two-page-composition, each page has its own overlay.
  // The manifest's overlayRef points to a single overlay — but in practice
  // each page might have separate overlays. For Phase 1, we use the same
  // overlay transformed for each side.

  return (
    <div className="relative inline-flex max-h-full" style={{ gap: `${gutterPercent}%` }}>
      {/* Left page */}
      <div className="relative" style={{ width: `${pageWidth}%` }}>
        {leftImage ? (
          <img
            src={leftImage.src}
            alt={leftImage.alt?.[locale] ?? ''}
            className="block"
            style={{ width: '100%', height: 'auto' }}
            draggable={false}
          />
        ) : (
          <div className="bg-stone-800 aspect-[1/1.414] flex items-center justify-center text-stone-400">
            左页图片不可用
          </div>
        )}
        {leftOverlay && interactionMode === 'read' && (
          <HotspotLayer overlay={leftOverlay} onNavigate={onNavigate} />
        )}
        {leftOverlay && interactionMode === 'debugOverlay' && (
          <DebugOverlay overlay={leftOverlay} />
        )}
      </div>

      {/* Right page */}
      <div className="relative" style={{ width: `${pageWidth}%` }}>
        {rightImage ? (
          <img
            src={rightImage.src}
            alt={rightImage.alt?.[locale] ?? ''}
            className="block"
            style={{ width: '100%', height: 'auto' }}
            draggable={false}
          />
        ) : (
          <div className="bg-stone-800 aspect-[1/1.414] flex items-center justify-center text-stone-400">
            右页图片不可用
          </div>
        )}
        {rightOverlay && interactionMode === 'read' && (
          <HotspotLayer overlay={rightOverlay} onNavigate={onNavigate} />
        )}
        {rightOverlay && interactionMode === 'debugOverlay' && (
          <DebugOverlay overlay={rightOverlay} />
        )}
      </div>
    </div>
  );
}
