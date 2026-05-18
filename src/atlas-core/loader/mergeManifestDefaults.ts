import type {
  BookManifest,
  FeatureFlags,
  BookNavigationConfig,
  RegistryRefs,
} from '../types/manifest';
import type { ReaderConfig } from '../types/page';

const DEFAULT_READER: ReaderConfig = {
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

const DEFAULT_NAVIGATION: BookNavigationConfig = {
  showTopBar: true,
  showBottomBar: true,
  showPageNumbers: true,
  showBreadcrumbs: false,
  showThumbnailStrip: false,
  showTableOfContentsButton: true,
};

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  glossaryTooltips: true,
  notesDrawer: false,
  comments: true,
  debugOverlay: true,
  pageFlip: false,
  search: false,
  exportComments: true,
};

const DEFAULT_REGISTRIES: RegistryRefs = {
  imageAssets: '/book/images',
  overlays: '/book/overlays',
  glossary: '/book/data/glossary.json',
  pages: '/book/data/pages.json',
};

function required<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Manifest is missing required field: ${name}`);
  }
  return value;
}

/**
 * Merges a partial raw manifest with code defaults.
 * - Required fields (schemaVersion, bookId, slug, title, version) → throw if missing
 * - Optional top-level (subtitle, defaultLocale, ...) → fall back to default
 * - reader / navigation / featureFlags → shallow merge (1 level)
 * - pages / readingOrder → initialized to [] (filled by loader after pages.json fetch)
 */
export function mergeManifestDefaults(raw: Partial<BookManifest>): BookManifest {
  return {
    schemaVersion: required(raw.schemaVersion, 'schemaVersion'),
    bookId: required(raw.bookId, 'bookId'),
    slug: required(raw.slug, 'slug'),
    title: required(raw.title, 'title'),
    version: required(raw.version, 'version'),
    subtitle: raw.subtitle,
    defaultLocale: raw.defaultLocale ?? 'zh-CN',
    supportedLocales: raw.supportedLocales ?? ['zh-CN'],
    visualSystem: raw.visualSystem ?? 'VAT_ATLAS_MAGAZINE_V2',
    reader: { ...DEFAULT_READER, ...(raw.reader ?? {}) },
    navigation: { ...DEFAULT_NAVIGATION, ...(raw.navigation ?? {}) },
    featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...(raw.featureFlags ?? {}) },
    pages: [],
    readingOrder: [],
    registries: { ...DEFAULT_REGISTRIES, ...(raw.registries ?? {}) },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
