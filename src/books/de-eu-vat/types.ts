// Raw v0.6.1 overlay schema types — consumed only by ./loader.ts and ./converter.ts.
// NOT re-exported from index.ts. See spec §3.2.

export type RawBBox = { x: number; y: number; w: number; h: number };

export type RawRegion = {
  id: string;
  type: string;
  role: string;
  bbox: RawBBox;
  text?: string;
  confidence?: number;
  source?: string;
  colorRole?: string;
};

export type RawCanvas = {
  width: number;
  height: number;
  aspect?: string;
  measurementBasis?: string;
};

export type RawOverlay = {
  version: string;
  pageId: string;
  sectionCode: string;
  canvas: RawCanvas;
  imageFile: string;
  overlayType: string;
  textRegions: RawRegion[];
  sections: RawRegion[];
  gridRegions: RawRegion[];
  imageHotspots: RawRegion[];
  navigationRegions: RawRegion[];
  legalAnchors: RawRegion[];
  interactionHints?: unknown[];
  qa?: unknown;
};

export type RawPageEntry = {
  sectionCode: string;
  pageId: string;
  title: string;
  subtitle: string;
  imageFile: string;
  canvas: { width: number; height: number };
  sizeStatus: string;
  notes?: string;
};

export type RawPageCatalog = RawPageEntry[];
