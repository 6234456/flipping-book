import type { PageManifest } from '../../atlas-core/types/page';
import type { ImageAsset } from '../../atlas-core/types/image';
import type { ZoomLevel } from './ImageOverlayTemplate';
import type { LocaleCode } from '../../atlas-core/types/primitives';

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
          alt={imageAsset.alt?.[locale as LocaleCode] ?? page.title?.[locale as LocaleCode] ?? ''}
          style={{ width: imageAsset.width, height: imageAsset.height }}
          draggable={false}
        />
      );
    }

    if (zoom === 'fit-page') {
      return (
        <img
          src={imageAsset.src}
          alt={imageAsset.alt?.[locale as LocaleCode] ?? page.title?.[locale as LocaleCode] ?? ''}
          className="block max-h-[calc(100dvh-130px)] max-w-full object-contain"
          draggable={false}
        />
      );
    }

    return (
      <img
        src={imageAsset.src}
        alt={imageAsset.alt?.[locale as LocaleCode] ?? page.title?.[locale as LocaleCode] ?? ''}
        className="w-full h-auto"
        draggable={false}
      />
    );
  }

  return (
    <div className="w-[1000px] h-[1414px] bg-gradient-to-b from-chrome-2 to-chrome flex flex-col items-center justify-center text-page">
      <h1 className="text-4xl font-bold mb-4">{page.title?.[locale as LocaleCode]}</h1>
      {page.subtitle?.[locale as LocaleCode] && (
        <p className="text-xl text-text-muted">{page.subtitle[locale as LocaleCode]}</p>
      )}
    </div>
  );
}
