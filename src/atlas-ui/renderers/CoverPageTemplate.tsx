import type { PageManifest } from '../../atlas-core/types/page';
import type { ImageAsset } from '../../atlas-core/types/image';
import type { ZoomLevel } from './ImageOverlayTemplate';

type CoverPageTemplateProps = {
  page: PageManifest;
  imageAsset?: ImageAsset;
  locale: string;
  zoom?: ZoomLevel;
};

export function CoverPageTemplate({ page, imageAsset, locale, zoom = 'fit-width' }: CoverPageTemplateProps) {
  if (imageAsset) {
    if (zoom === 'actual-size') {
      return (
        <img
          src={imageAsset.src}
          alt={imageAsset.alt?.[locale] ?? page.title?.[locale] ?? ''}
          style={{ width: imageAsset.width, height: imageAsset.height }}
          draggable={false}
        />
      );
    }

    if (zoom === 'fit-page') {
      return (
        <img
          src={imageAsset.src}
          alt={imageAsset.alt?.[locale] ?? page.title?.[locale] ?? ''}
          className="block max-h-[calc(100dvh-120px)] max-w-full object-contain"
          draggable={false}
        />
      );
    }

    return (
      <img
        src={imageAsset.src}
        alt={imageAsset.alt?.[locale] ?? page.title?.[locale] ?? ''}
        className="w-full h-auto"
        draggable={false}
      />
    );
  }

  return (
    <div className="w-[1000px] h-[1414px] bg-gradient-to-b from-stone-800 to-stone-900 flex flex-col items-center justify-center text-stone-200">
      <h1 className="text-4xl font-bold mb-4">{page.title?.[locale]}</h1>
      {page.subtitle?.[locale] && (
        <p className="text-xl text-stone-400">{page.subtitle[locale]}</p>
      )}
    </div>
  );
}
