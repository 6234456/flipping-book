import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider, TooltipProvider } from '../atlas-ui/primitives';
import { MagazineReader } from '../atlas-ui/reader/MagazineReader';
import { createBookRegistry } from '../atlas-core/registry';
import { vatAtlasManifest } from '../books/de-eu-vat/manifest';
import { imageAssets } from '../books/de-eu-vat/imageAssets';
import { glossary } from '../books/de-eu-vat/glossary';
import { legalRefs } from '../books/de-eu-vat/legalRefs';
import { scenarios } from '../books/de-eu-vat/scenarios';
import { contents } from '../books/de-eu-vat/contents';
import { notes } from '../books/de-eu-vat/notes';
import { vatAtlasOverlays } from '../books/de-eu-vat/overlays/index.js';
import type { BookManifest } from '../atlas-core/types/manifest';
import type { ImageAsset } from '../atlas-core/types/image';
import type { OverlayConfig } from '../atlas-core/types/overlay';
import type { GlossaryEntry } from '../atlas-core/types/glossary';
import type { LegalRef } from '../atlas-core/types/legal';
import type { VatScenario } from '../atlas-core/types/scenario';
import type { AtlasNote } from '../atlas-core/types/notes';
import type { PageContent } from '../atlas-core/types/content';
import type { CommentThread } from '../atlas-core/types/comments';

function build() {
  return createBookRegistry(
    vatAtlasManifest as unknown as BookManifest,
    imageAssets as unknown as ImageAsset[],
    vatAtlasOverlays as unknown as OverlayConfig[],
    glossary as unknown as GlossaryEntry[],
    legalRefs as unknown as LegalRef[],
    scenarios as unknown as VatScenario[],
    notes as unknown as AtlasNote[],
    contents as unknown as PageContent[],
    [] as CommentThread[],
  );
}

describe('Rail persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists collapsed state across remount', () => {
    const registry = build();
    const bookId = registry.manifest.bookId;

    localStorage.setItem(
      `atlas-rail-${bookId}`,
      JSON.stringify({ open: false, tab: 'notes', width: 320 }),
    );

    const { container } = render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={registry} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    const slim = container.querySelector('[role="toolbar"][aria-label="侧栏"]');
    expect(slim).not.toBeNull();
  });
});
