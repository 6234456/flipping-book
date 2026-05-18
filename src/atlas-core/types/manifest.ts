import type {
  ISODateTime, LocalizedText, AtlasVisualSystem,
  ManifestSchemaVersion, BookId, LocaleCode,
} from './primitives';
import type { PageId } from './primitives';
import type { PageManifest, ReaderConfig } from './page';

// Re-export ReaderConfig so manifest.ts consumers get it
export type { ReaderConfig, SpreadBehaviorConfig } from './page';

export type RegistryRefs = {
  imageAssets: string;
  overlays: string;
  glossary: string;
  pages?: string;
  contents?: string;
  scenarios?: string;
  legalRefs?: string;
  notes?: string;
  comments?: string;
};

export type FeatureFlags = {
  glossaryTooltips: boolean;
  notesDrawer: boolean;
  comments: boolean;
  debugOverlay: boolean;
  pageFlip: boolean;
  search: boolean;
  exportComments: boolean;
};

export type BookNavigationConfig = {
  showTopBar: boolean;
  showBottomBar: boolean;
  showPageNumbers: boolean;
  showBreadcrumbs: boolean;
  showThumbnailStrip: boolean;
  showTableOfContentsButton: boolean;
};

export type BookManifest = {
  schemaVersion: ManifestSchemaVersion;
  bookId: BookId;
  slug: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  version: string;
  defaultLocale: LocaleCode;
  supportedLocales: LocaleCode[];
  visualSystem: AtlasVisualSystem;
  reader: ReaderConfig;
  pages: PageManifest[];
  readingOrder: PageId[];
  registries: RegistryRefs;
  navigation?: BookNavigationConfig;
  featureFlags?: FeatureFlags;
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
};
