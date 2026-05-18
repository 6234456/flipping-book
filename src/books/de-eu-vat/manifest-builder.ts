import type { BookManifest, FeatureFlags, RegistryRefs } from '../../atlas-core/types/manifest';
import type { ImageAsset } from '../../atlas-core/types/image';
import type { PageManifest } from '../../atlas-core/types/page';
import type { ReaderConfig } from '../../atlas-core/types/page';
import type { RawPageCatalog, RawPageEntry } from '../../atlas-core/overlay/rawSchema';

const BASE_URL = '/books/de-eu-vat/v0.6.1';

export function buildImageAsset(entry: RawPageEntry): ImageAsset {
  const fileName = entry.imageFile.split('/').pop() ?? entry.imageFile;
  return {
    assetId: `${entry.sectionCode}-current-final-v06`,
    version: '0.6.1',
    src: `${BASE_URL}/images/${fileName}`,
    width: entry.canvas.width,
    height: entry.canvas.height,
    format: 'png',
    visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
    pageFormat: 'single',
    sizePreset: 'custom',
    alt: { 'zh-CN': entry.title },
  };
}

export function buildPageManifest(entry: RawPageEntry, pageNumber: number): PageManifest {
  return {
    pageId: entry.pageId,
    slug: `/page/${entry.pageId}`,
    type: 'imageOverlay',
    sectionCode: entry.sectionCode,
    pageNumber,
    title: { 'zh-CN': entry.title },
    subtitle: entry.subtitle ? { 'zh-CN': entry.subtitle } : undefined,
    layout: {
      mode: 'single',
      format: 'custom',
      size: {
        preset: 'custom',
        width: entry.canvas.width,
        height: entry.canvas.height,
        aspectRatioLabel: '3:4 portrait',
      },
      background: 'image',
    },
    image: {
      assetId: `${entry.sectionCode}-current-final-v06`,
      version: '0.6.1',
    },
    overlay: {
      overlayId: `${entry.sectionCode}-overlay-v06`,
      imageAssetId: `${entry.sectionCode}-current-final-v06`,
      imageVersion: '0.6.1',
    },
  };
}

function defaultReaderConfig(): ReaderConfig {
  return {
    defaultMode: 'auto',
    allowModeSwitch: false,
    transition: 'fade',
    enableKeyboardNavigation: true,
    enableSwipeNavigation: true,
    enableProgressBar: true,
    enableTableOfContents: true,
    defaultZoom: 'fit-page',
    spreadBehavior: {
      desktopDefault: 'single',
      mobileDefault: 'single',
      spreadPageAdvance: 'by-page',
      keyboard: { arrowLeft: 'previous', arrowRight: 'next' },
      clickZones: { enabled: false, leftEdgePercent: 0, rightEdgePercent: 0 },
    },
  };
}

function defaultFeatureFlags(): FeatureFlags {
  return {
    glossaryTooltips: true,
    notesDrawer: false,
    comments: true,
    debugOverlay: true,
    pageFlip: false,
    search: false,
    exportComments: true,
  };
}

function defaultRegistries(): RegistryRefs {
  return {
    imageAssets: `${BASE_URL}/images`,
    overlays: `${BASE_URL}/overlays`,
    glossary: 'src/books/de-eu-vat/glossary.ts',
    pages: `${BASE_URL}/data/page_catalog.json`,
  };
}

export function buildManifest(catalog: RawPageCatalog): BookManifest {
  return {
    schemaVersion: '1.0',
    bookId: 'de-eu-vat-atlas',
    slug: 'de-eu-vat',
    title: { 'zh-CN': '德国 / 欧盟 VAT 财务速查图册' },
    subtitle: { 'zh-CN': '常用 B2B 场景 · 法规提示 · 可点击 Drill-down 导览' },
    version: '0.6.1',
    defaultLocale: 'zh-CN',
    supportedLocales: ['zh-CN'],
    visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
    reader: defaultReaderConfig(),
    pages: catalog.map((entry, i) => buildPageManifest(entry, i + 1)),
    readingOrder: catalog.map((entry) => entry.pageId),
    registries: defaultRegistries(),
    navigation: {
      showTopBar: true,
      showBottomBar: true,
      showPageNumbers: true,
      showBreadcrumbs: false,
      showThumbnailStrip: false,
      showTableOfContentsButton: true,
    },
    featureFlags: defaultFeatureFlags(),
  };
}
