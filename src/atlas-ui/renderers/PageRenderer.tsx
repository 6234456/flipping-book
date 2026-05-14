import type { PageManifest } from '../../atlas-core/types/page';
import type { ImageAsset } from '../../atlas-core/types/image';
import { ImageOverlayTemplate } from './ImageOverlayTemplate';
import { CoverPageTemplate } from './CoverPageTemplate';
import { TOCPageTemplate } from './TOCPageTemplate';

type PageRendererProps = {
  page: PageManifest;
  imageAsset?: ImageAsset;
  locale: string;
};

export function PageRenderer({ page, imageAsset, locale }: PageRendererProps) {
  switch (page.type) {
    case 'cover':
      return <CoverPageTemplate page={page} imageAsset={imageAsset} locale={locale} />;
    case 'toc':
      return <TOCPageTemplate page={page} locale={locale} />;
    case 'imageOverlay':
    case 'chapter':
    case 'decisionFlow':
    case 'caseStudy':
    case 'appendix':
    case 'scenarioDetail':
    case 'legalReference':
    case 'glossary':
      return <ImageOverlayTemplate page={page} imageAsset={imageAsset} locale={locale} />;
    default:
      return (
        <div className="text-stone-400 p-8">
          未知页面类型: {page.type}
        </div>
      );
  }
}
