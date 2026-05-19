import type { BookRegistry } from '../registry';
import { flattenRichText } from './flattenRichText';

export type IndexCategory =
  | 'page' | 'glossary' | 'legal' | 'scenario' | 'note' | 'content';

export type IndexedItem = {
  category: IndexCategory;
  id: string;
  haystack: string;
  display: { primary: string; secondary?: string };
  pageId?: string;
};

function lc(s: string | undefined | null): string {
  return (s ?? '').toLowerCase();
}

export function buildIndex(registry: BookRegistry): IndexedItem[] {
  const items: IndexedItem[] = [];

  // Pages
  for (const p of registry.manifest.pages) {
    const title = p.title?.['zh-CN'] ?? p.pageId;
    const subtitle = p.subtitle?.['zh-CN'];
    items.push({
      category: 'page',
      id: p.pageId,
      haystack: lc(`${title} ${subtitle ?? ''}`),
      display: { primary: title, secondary: subtitle },
      pageId: p.pageId,
    });
  }

  // Glossary
  for (const t of registry.glossary.values()) {
    const primary = `${t.zh}(${t.original})`;
    items.push({
      category: 'glossary',
      id: t.termId,
      haystack: lc([t.zh, t.original, t.abbreviation, t.shortDefinition, t.longDefinition].filter(Boolean).join(' ')),
      display: { primary, secondary: t.shortDefinition },
    });
  }

  // Legal refs
  for (const l of registry.legalRefs.values()) {
    items.push({
      category: 'legal',
      id: l.legalRefId,
      haystack: lc([l.ref, l.title?.['zh-CN'], l.summary?.['zh-CN']].filter(Boolean).join(' ')),
      display: { primary: l.ref, secondary: l.summary?.['zh-CN'] ?? l.title?.['zh-CN'] },
    });
  }

  // Scenarios
  for (const s of registry.scenarios.values()) {
    const primary = s.title?.['zh-CN'] ?? s.scenarioId;
    items.push({
      category: 'scenario',
      id: s.scenarioId,
      haystack: lc([s.title?.['zh-CN'], s.subtitle?.['zh-CN'], s.oneSentence?.['zh-CN']].filter(Boolean).join(' ')),
      display: { primary, secondary: s.oneSentence?.['zh-CN'] },
    });
  }

  // Notes
  for (const n of registry.notes.values()) {
    const flat = flattenRichText(n.body);
    const primary = n.title?.['zh-CN'] ?? `[${n.noteType}] ${flat.slice(0, 24)}`;
    items.push({
      category: 'note',
      id: n.noteId,
      haystack: lc(`${n.title?.['zh-CN'] ?? ''} ${flat}`),
      display: { primary, secondary: flat.slice(0, 80) },
      pageId: n.pageId,
    });
  }

  // Contents
  for (const c of registry.contents.values()) {
    const flat = c.blocks
      .map((b) => {
        if (b.type === 'heading' || b.type === 'paragraph') return flattenRichText(b.text);
        if (b.type === 'callout') return flattenRichText(b.body);
        if (b.type === 'checklist') return b.items.map((i) => flattenRichText(i)).join(' ');
        return '';
      })
      .join(' ');
    items.push({
      category: 'content',
      id: c.contentId,
      haystack: lc(flat),
      display: { primary: c.contentId, secondary: flat.slice(0, 80) },
      pageId: c.pageId,
    });
  }

  return items;
}
