import type { BookManifest } from '../types/manifest';
import type { ImageAsset } from '../types/image';
import type { OverlayConfig } from '../types/overlay';
import type { GlossaryEntry } from '../types/glossary';
import type { LegalRef } from '../types/legal';
import type { VatScenario } from '../types/scenario';
import type { AtlasNote } from '../types/notes';
import type { PageContent } from '../types/content';
import type { CommentThread } from '../types/comments';
import type { PageManifest } from '../types/page';

export type BookRegistry = {
  manifest: BookManifest;
  imageAssets: Map<string, ImageAsset>;
  overlays: Map<string, OverlayConfig>;
  glossary: Map<string, GlossaryEntry>;
  legalRefs: Map<string, LegalRef>;
  scenarios: Map<string, VatScenario>;
  notes: Map<string, AtlasNote>;
  contents: Map<string, PageContent>;
  comments: Map<string, CommentThread>;
  pagesBySlug: Map<string, PageManifest>;

  getPage: (pageId: string) => PageManifest | undefined;
  getImage: (assetId: string) => ImageAsset | undefined;
  getOverlay: (overlayId: string) => OverlayConfig | undefined;
  getTerm: (termId: string) => GlossaryEntry | undefined;
};

export function createBookRegistry(
  manifest: BookManifest,
  imageAssets: ImageAsset[],
  overlays: OverlayConfig[],
  glossary: GlossaryEntry[],
  legalRefs: LegalRef[],
  scenarios: VatScenario[],
  notes: AtlasNote[],
  contents: PageContent[],
  comments: CommentThread[],
): BookRegistry {
  const imageMap = new Map(imageAssets.map((a) => [a.assetId, a]));
  const overlayMap = new Map(overlays.map((o) => [o.overlayId, o]));
  const glossaryMap = new Map(glossary.map((g) => [g.termId, g]));
  const legalMap = new Map(legalRefs.map((l) => [l.legalRefId, l]));
  const scenarioMap = new Map(scenarios.map((s) => [s.scenarioId, s]));
  const noteMap = new Map(notes.map((n) => [n.noteId, n]));
  const contentMap = new Map(contents.map((c) => [c.contentId, c]));
  const commentMap = new Map(comments.map((c) => [c.threadId, c]));
  const slugMap = new Map(manifest.pages.map((p) => [p.slug, p]));

  return {
    manifest,
    imageAssets: imageMap,
    overlays: overlayMap,
    glossary: glossaryMap,
    legalRefs: legalMap,
    scenarios: scenarioMap,
    notes: noteMap,
    contents: contentMap,
    comments: commentMap,
    pagesBySlug: slugMap,

    getPage(pageId) {
      return manifest.pages.find((p) => p.pageId === pageId);
    },
    getImage(assetId) {
      return imageMap.get(assetId);
    },
    getOverlay(overlayId) {
      return overlayMap.get(overlayId);
    },
    getTerm(termId) {
      return glossaryMap.get(termId);
    },
  };
}
