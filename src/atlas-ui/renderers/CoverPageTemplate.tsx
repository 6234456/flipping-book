import type { PageManifest } from '../../atlas-core/types/page';
import type { ImageAsset } from '../../atlas-core/types/image';

type CoverPageTemplateProps = {
  page: PageManifest;
  imageAsset?: ImageAsset;
  locale: string;
};

export function CoverPageTemplate({ page, imageAsset, locale }: CoverPageTemplateProps) {
  if (imageAsset) {
    return (
      <img
        src={imageAsset.src}
        alt={imageAsset.alt?.[locale] ?? page.title?.[locale] ?? ''}
        className="block max-h-full w-auto"
        style={{ width: '100%', height: 'auto' }}
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
