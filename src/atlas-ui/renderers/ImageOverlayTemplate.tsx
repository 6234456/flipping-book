import type { PageManifest } from '../../atlas-core/types/page';
import type { ImageAsset } from '../../atlas-core/types/image';

export type ZoomLevel = 'fit-width' | 'fit-page' | 'actual-size';

type ImageOverlayTemplateProps = {
  page: PageManifest;
  imageAsset?: ImageAsset;
  locale: string;
  zoom?: ZoomLevel;
};

export function ImageOverlayTemplate({ page, imageAsset, zoom = 'fit-width' }: ImageOverlayTemplateProps) {
  if (!imageAsset) {
    return (
      <div className="w-[1000px] h-[1414px] bg-surface-2 flex items-center justify-center text-text-muted">
        图片不可用: {page.title?.['zh-CN'] ?? page.pageId}
      </div>
    );
  }

  if (zoom === 'actual-size') {
    return (
      <img
        src={imageAsset.src}
        alt={imageAsset.alt?.['zh-CN'] ?? page.title?.['zh-CN'] ?? ''}
        style={{ width: imageAsset.width, height: imageAsset.height }}
        draggable={false}
      />
    );
  }

  if (zoom === 'fit-page') {
    return (
      <img
        src={imageAsset.src}
        alt={imageAsset.alt?.['zh-CN'] ?? page.title?.['zh-CN'] ?? ''}
        className="block max-h-[calc(100dvh-130px)] max-w-full object-contain"
        draggable={false}
      />
    );
  }

  // fit-width (default): width fills container, height auto, scroll if needed
  return (
    <img
      src={imageAsset.src}
      alt={imageAsset.alt?.['zh-CN'] ?? page.title?.['zh-CN'] ?? ''}
      className="w-full h-auto"
      draggable={false}
    />
  );
}
