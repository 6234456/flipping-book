import type { PageManifest } from '../../../atlas-core/types/page';

export type TocGroupHeader =
  | { kind: 'real'; page: PageManifest; label: string }
  | { kind: 'virtual'; page?: undefined; label: string };

export type TocGroup = {
  key: string;
  header: TocGroupHeader;
  children: PageManifest[];
};

const VIRTUAL_LABELS: Record<string, string> = {
  SC: '场景',
  APP: '附录',
  G: '术语',
};

function virtualLabel(groupKey: string): string {
  return VIRTUAL_LABELS[groupKey] ?? groupKey;
}

function groupKeyOf(p: PageManifest): string {
  const code = p.sectionCode ?? p.pageId;
  return code.split('-')[0];
}

function toGroup({ key, pages }: { key: string; pages: PageManifest[] }): TocGroup {
  const first = pages[0];
  const firstSection = first.sectionCode ?? first.pageId;
  if (firstSection === key) {
    return {
      key,
      header: { kind: 'real', page: first, label: first.title?.['zh-CN'] ?? first.pageId },
      children: pages.slice(1),
    };
  }
  return {
    key,
    header: { kind: 'virtual', label: virtualLabel(key) },
    children: pages,
  };
}

export function groupPages(pages: PageManifest[]): TocGroup[] {
  const groups: TocGroup[] = [];
  let current: { key: string; pages: PageManifest[] } | null = null;

  for (const p of pages) {
    const k = groupKeyOf(p);
    if (!current || current.key !== k) {
      if (current) groups.push(toGroup(current));
      current = { key: k, pages: [p] };
    } else {
      current.pages.push(p);
    }
  }
  if (current) groups.push(toGroup(current));
  return groups;
}

export function findGroupKey(groups: TocGroup[], pageId: string): string | null {
  for (const g of groups) {
    if (g.header.kind === 'real' && g.header.page.pageId === pageId) return g.key;
    if (g.children.some((c) => c.pageId === pageId)) return g.key;
  }
  return null;
}
