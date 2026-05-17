import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
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

describe('+ button flow', () => {
  beforeEach(() => localStorage.clear());

  it('shows banner when + button clicked, then dismisses after ESC', async () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={build()} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    const plus = await screen.findByRole('button', { name: /新增评论/ });
    await userEvent.click(plus);

    expect(screen.getByText(/点击图片任意位置添加评论/)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText(/点击图片任意位置添加评论/)).not.toBeInTheDocument();
  });

  it('N keyboard shortcut also triggers the flow', async () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={build()} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: 'n' });
    expect(await screen.findByText(/点击图片任意位置添加评论/)).toBeInTheDocument();
  });

  it('auto-exits comment mode after a pin is created', async () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={build()} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    const plus = await screen.findByRole('button', { name: /新增评论/ });
    await userEvent.click(plus);
    expect(screen.getByText(/点击图片任意位置添加评论/)).toBeInTheDocument();

    // Simulate creating a pin via CommentCaptureLayer
    const capture = document.querySelector('.cursor-crosshair') as HTMLElement | null;
    expect(capture).not.toBeNull();
    fireEvent.click(capture!, { clientX: 100, clientY: 100 });

    // Banner should disappear (comment mode auto-exited)
    expect(screen.queryByText(/点击图片任意位置添加评论/)).not.toBeInTheDocument();
  });
});
