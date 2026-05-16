import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotesDrawer } from '../NotesDrawer';
import { createBookRegistry } from '../../../atlas-core/registry';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { BookManifest } from '../../../atlas-core/types/manifest';
import type { AtlasNote } from '../../../atlas-core/types/notes';

function makeRegistry(notes: AtlasNote[]): BookRegistry {
  const manifest: BookManifest = {
    schemaVersion: "1.0", bookId: "test", slug: "test",
    title: { "zh-CN": "测试" }, version: "0.1",
    defaultLocale: "zh-CN", supportedLocales: ["zh-CN"],
    visualSystem: "VAT_ATLAS_MAGAZINE_V2",
    reader: {
      defaultMode: "auto", allowModeSwitch: true,
      transition: "magazine-slide",
      enableKeyboardNavigation: true, enableSwipeNavigation: true,
      enableProgressBar: true, enableTableOfContents: true,
      defaultZoom: "fit-width",
      spreadBehavior: {
        desktopDefault: "spread", mobileDefault: "single",
        spreadPageAdvance: "by-spread",
        keyboard: { arrowLeft: "previous", arrowRight: "next" },
        clickZones: { enabled: true, leftEdgePercent: 8, rightEdgePercent: 8 },
      },
    },
    pages: [], readingOrder: [],
    registries: { imageAssets: "", overlays: "", glossary: "" },
  };
  return createBookRegistry(manifest, [], [], [], [], [], notes, [], []);
}

const testNotes: AtlasNote[] = [
  {
    noteId: "note-1", bookId: "test", pageId: "page-1",
    title: { "zh-CN": "演讲提示" },
    body: [{ type: "text", value: "这是备注内容" }],
    noteType: "speaker-note",
    visibility: "reader",
  },
  {
    noteId: "note-2", bookId: "test", pageId: "page-1",
    body: [{ type: "text", value: "补充说明" }],
    noteType: "supplement",
    visibility: "reader",
  },
];

describe('NotesDrawer', () => {
  it('shows notes when open', () => {
    const registry = makeRegistry(testNotes);
    render(
      <MemoryRouter>
        <NotesDrawer noteIds={["note-1"]} registry={registry} open={true} onToggle={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('演讲提示')).toBeInTheDocument();
    expect(screen.getByText('这是备注内容')).toBeInTheDocument();
  });

  it('hides notes when closed', () => {
    const registry = makeRegistry(testNotes);
    render(
      <MemoryRouter>
        <NotesDrawer noteIds={["note-1"]} registry={registry} open={false} onToggle={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('filters by note type', async () => {
    const registry = makeRegistry(testNotes);
    render(
      <MemoryRouter>
        <NotesDrawer noteIds={["note-1", "note-2"]} registry={registry} open={true} onToggle={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('演讲提示')).toBeInTheDocument();
    expect(screen.getByText('补充说明')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    const registry = makeRegistry([]);
    render(
      <MemoryRouter>
        <NotesDrawer noteIds={[]} registry={registry} open={true} onToggle={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('这一页还没有笔记')).toBeInTheDocument();
  });
});
