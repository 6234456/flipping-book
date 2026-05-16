import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
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

describe('Import comments toast', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
  });
  afterEach(() => {
    alertSpy.mockRestore();
  });

  function renderApp() {
    const registry = createBookRegistry(
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
    return render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={registry} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );
  }

  it('shows a toast (not native alert) after importing JSON', async () => {
    renderApp();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    const fileContent = JSON.stringify({ version: 1, comments: [] });
    const file = new File([fileContent], 'comments.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    // Wait for FileReader.onload
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(alertSpy).not.toHaveBeenCalled();
    expect(await screen.findByText(/导入/)).toBeInTheDocument();
  });
});
