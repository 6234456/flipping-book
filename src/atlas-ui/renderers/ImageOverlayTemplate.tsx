import type { PageManifest } from '../../atlas-core/types/page';
import type { ImageAsset } from '../../atlas-core/types/image';

type ImageOverlayTemplateProps = {
  page: PageManifest;
  imageAsset?: ImageAsset;
  locale: string;
};

export function ImageOverlayTemplate({ page, imageAsset }: ImageOverlayTemplateProps) {
  if (!imageAsset) {
    return (
      <div className="w-[1000px] h-[1414px] bg-stone-800 flex items-center justify-center text-stone-400">
        图片不可用: {page.title?.['zh-CN'] ?? page.pageId}
      </div>
    );
  }

  return (
    <img
      src={imageAsset.src}
      alt={imageAsset.alt?.['zh-CN'] ?? page.title?.['zh-CN'] ?? ''}
      className="block max-h-full w-auto"
      style={{ width: '100%', height: 'auto' }}
      draggable={false}
    />
  );
}
