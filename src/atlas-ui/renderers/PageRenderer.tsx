import type { PageManifest } from '../../atlas-core/types/page';
import type { ImageAsset } from '../../atlas-core/types/image';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ZoomLevel } from './ImageOverlayTemplate';
import { ImageOverlayTemplate } from './ImageOverlayTemplate';
import { CoverPageTemplate } from './CoverPageTemplate';
import { TOCPageTemplate } from './TOCPageTemplate';
import { GlossaryPageTemplate } from './GlossaryPageTemplate';

type PageRendererProps = {
  page: PageManifest;
  imageAsset?: ImageAsset;
  locale: string;
  registry?: BookRegistry;
  zoom?: ZoomLevel;
};

export function PageRenderer({ page, imageAsset, locale, registry, zoom }: PageRendererProps) {
  switch (page.type) {
    case 'cover':
      return <CoverPageTemplate page={page} imageAsset={imageAsset} locale={locale} zoom={zoom} />;
    case 'toc':
      return (
        <TOCPageTemplate
          page={page}
          locale={locale}
          readingOrder={registry?.manifest.readingOrder}
          getPage={registry ? (id: string) => registry.getPage(id) : undefined}
        />
      );
    case 'glossary':
      if (registry) {
        return <GlossaryPageTemplate registry={registry} />;
      }
      return <ImageOverlayTemplate page={page} imageAsset={imageAsset} locale={locale} zoom={zoom} />;
    case 'imageOverlay':
    case 'chapter':
    case 'decisionFlow':
    case 'caseStudy':
    case 'appendix':
    case 'scenarioDetail':
    case 'legalReference':
      return <ImageOverlayTemplate page={page} imageAsset={imageAsset} locale={locale} zoom={zoom} />;
    default:
      return (
        <div className="text-stone-400 p-8">
          未知页面类型: {page.type}
        </div>
      );
  }
}
