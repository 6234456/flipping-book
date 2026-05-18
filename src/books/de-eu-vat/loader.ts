import type { BookManifest } from '../../atlas-core/types/manifest';
import type { ImageAsset } from '../../atlas-core/types/image';
import type { RichOverlayConfig } from '../../atlas-core/types/regions';
import type { GlossaryEntry } from '../../atlas-core/types/glossary';
import type { RawOverlay, RawPageCatalog } from '../../atlas-core/overlay/rawSchema';
import { glossary } from './glossary';
import { buildImageAsset, buildManifest } from './manifest-builder';
import { convertOverlay } from '../../atlas-core/overlay/convertOverlay';

export type BookData = {
  manifest: BookManifest;
  images: ImageAsset[];
  overlays: RichOverlayConfig[];
  glossary: GlossaryEntry[];
};

const DEFAULT_BASE = '/books/de-eu-vat/v0.6.1';

let cached: { base: string; promise: Promise<BookData> } | null = null;

/** Test-only: clears the module-level cache. */
export function __resetCache(): void {
  cached = null;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return (await res.json()) as T;
}

function emptyOverlayFor(sectionCode: string): RichOverlayConfig {
  return {
    overlayId: `${sectionCode}-overlay-v06`,
    imageAssetId: `${sectionCode}-current-final-v06`,
    imageVersion: '0.6.1',
    coordinateSystem: 'percentage',
    canvas: { width: 1086, height: 1448 },
    hotspots: [],
    regions: [],
  };
}

async function loadOneOverlay(base: string, pageId: string, sectionCode: string): Promise<RichOverlayConfig> {
  const url = `${base}/overlays/${sectionCode}_interactive_overlay_v0.6.1.json`;
  try {
    const raw = await fetchJSON<RawOverlay>(url);
    return convertOverlay(raw);
  } catch (err) {
    console.warn(`overlay load failed for ${pageId}, using empty fallback:`, err);
    return emptyOverlayFor(sectionCode);
  }
}

async function load(base: string): Promise<BookData> {
  const catalog = await fetchJSON<RawPageCatalog>(`${base}/data/page_catalog.json`);
  const overlays = await Promise.all(
    catalog.map((entry) => loadOneOverlay(base, entry.pageId, entry.sectionCode)),
  );
  const images = catalog.map(buildImageAsset);
  const manifest = buildManifest(catalog);
  return {
    manifest,
    images,
    overlays,
    glossary: glossary as unknown as GlossaryEntry[],
  };
}

export function loadDeEuVat(base: string = DEFAULT_BASE): Promise<BookData> {
  if (cached && cached.base === base) return cached.promise;
  const promise = load(base);
  cached = { base, promise };
  return promise;
}
