import type { BookManifest } from '../types/manifest';
import type { ImageAsset } from '../types/image';
import type { PageManifest } from '../types/page';
import type { RichOverlayConfig } from '../types/regions';
import type { GlossaryEntry } from '../types/glossary';
import type { AtlasNote } from '../types/notes';
import type { VatScenario } from '../types/scenario';
import type { PageContent } from '../types/content';
import type { LegalRef } from '../types/legal';
import type { RawOverlay, RawPageEntry } from '../overlay/rawSchema';
import { convertOverlay } from '../overlay/convertOverlay';
import { fetchOptional } from './fetchOptional';
import { mergeManifestDefaults } from './mergeManifestDefaults';

export type LoadedBook = {
  manifest: BookManifest;
  images: ImageAsset[];
  overlays: RichOverlayConfig[];
  glossary: GlossaryEntry[];
  notes: AtlasNote[];
  scenarios: VatScenario[];
  contents: PageContent[];
  legalRefs: LegalRef[];
};

const DEFAULT_BASE = '/book';

let cached: { base: string; promise: Promise<LoadedBook> } | null = null;

export function __resetCache(): void {
  cached = null;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return (await res.json()) as T;
}

function basename(p: string): string {
  return p.split('/').pop() ?? p;
}

function buildImageAsset(entry: RawPageEntry, base: string): ImageAsset {
  return {
    assetId: `${entry.sectionCode}-current-final-v06`,
    version: '0.6.1',
    src: `${base}/images/${basename(entry.imageFile)}`,
    width: entry.canvas.width,
    height: entry.canvas.height,
    format: 'png',
    visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
    pageFormat: 'single',
    sizePreset: 'custom',
    alt: { 'zh-CN': entry.title },
  };
}

function buildPageManifest(entry: RawPageEntry, pageNumber: number): PageManifest {
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
    image: { assetId: `${entry.sectionCode}-current-final-v06`, version: '0.6.1' },
    overlay: {
      overlayId: `${entry.sectionCode}-overlay-v06`,
      imageAssetId: `${entry.sectionCode}-current-final-v06`,
      imageVersion: '0.6.1',
    },
    notes: entry.noteIds
      ? { enabled: true, noteIds: entry.noteIds }
      : undefined,
    content: entry.contentId
      ? { contentId: entry.contentId }
      : undefined,
    scenarioIds: entry.scenarioIds,
    legalRefIds: entry.legalRefIds,
  };
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

async function loadOneOverlay(base: string, sectionCode: string, pageId: string): Promise<RichOverlayConfig> {
  const url = `${base}/overlays/${sectionCode}_interactive_overlay_v0.6.1.json`;
  try {
    const raw = await fetchJSON<RawOverlay>(url);
    return convertOverlay(raw);
  } catch (err) {
    console.warn(`overlay load failed for ${pageId}, using empty fallback:`, err);
    return emptyOverlayFor(sectionCode);
  }
}

async function load(base: string): Promise<LoadedBook> {
  // 1) Fetch manifest first (required)
  const rawManifest = await fetchJSON<Partial<BookManifest>>(`${base}/manifest.json`);
  const manifestSkeleton = mergeManifestDefaults(rawManifest);

  // 2) Fetch pages + optional data files in parallel
  const [pages, glossary, notes, scenarios, contents, legalRefs] = await Promise.all([
    fetchJSON<RawPageEntry[]>(`${base}/data/pages.json`),
    fetchOptional<GlossaryEntry>(`${base}/data/glossary.json`),
    fetchOptional<AtlasNote>(`${base}/data/notes.json`),
    fetchOptional<VatScenario>(`${base}/data/scenarios.json`),
    fetchOptional<PageContent>(`${base}/data/contents.json`),
    fetchOptional<LegalRef>(`${base}/data/legal-refs.json`),
  ]);

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(`Bundle has no pages: ${base}/data/pages.json is empty or invalid`);
  }

  // 3) Build derived structures
  const pageManifests = pages.map((entry, i) => buildPageManifest(entry, i + 1));
  const images = pages.map((entry) => buildImageAsset(entry, base));

  // 4) Fetch overlays in parallel
  const overlays = await Promise.all(
    pages.map((entry) => loadOneOverlay(base, entry.sectionCode, entry.pageId)),
  );

  // 5) Finalize manifest
  const manifest: BookManifest = {
    ...manifestSkeleton,
    pages: pageManifests,
    readingOrder: pages.map((entry) => entry.pageId),
  };

  return { manifest, images, overlays, glossary, notes, scenarios, contents, legalRefs };
}

export function loadBook(base: string = DEFAULT_BASE): Promise<LoadedBook> {
  if (cached && cached.base === base) return cached.promise;
  const promise = load(base);
  cached = { base, promise };
  return promise;
}
