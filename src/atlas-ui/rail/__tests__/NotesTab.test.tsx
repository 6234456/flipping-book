import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotesTab } from '../tabs/NotesTab';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { AtlasNote } from '../../../atlas-core/types/notes';

function makeRegistry(notes: AtlasNote[]): BookRegistry {
  const map = new Map<string, AtlasNote>();
  for (const n of notes) map.set(n.noteId, n);
  return {
    manifest: { slug: 'demo', bookId: 'demo', readingOrder: [] } as unknown as BookRegistry['manifest'],
    notes: map,
  } as unknown as BookRegistry;
}

const note1: AtlasNote = {
  noteId: 'n1',
  noteType: 'supplement',
  visibility: 'public',
  title: { 'zh-CN': '补充材料' },
  body: [{ type: 'paragraph', text: [{ type: 'text', value: '说明文本' }] }],
} as unknown as AtlasNote;

describe('NotesTab', () => {
  it('renders notes', () => {
    render(<NotesTab noteIds={['n1']} registry={makeRegistry([note1])} />);
    expect(screen.getByText('补充材料')).toBeInTheDocument();
  });

  it('renders empty state when no notes', () => {
    render(<NotesTab noteIds={[]} registry={makeRegistry([])} />);
    expect(screen.getByText('这一页还没有笔记')).toBeInTheDocument();
  });
});
