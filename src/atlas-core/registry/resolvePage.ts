import type { BookRegistry } from './createBookRegistry';
import type { PageManifest } from '../types/page';

export function resolvePageBySlug(registry: BookRegistry, slug: string): PageManifest | undefined {
  return registry.pagesBySlug.get(slug);
}

export function resolvePageById(registry: BookRegistry, pageId: string): PageManifest | undefined {
  return registry.getPage(pageId);
}

export function resolveFirstPage(registry: BookRegistry): PageManifest | undefined {
  const firstId = registry.manifest.readingOrder[0];
  if (!firstId) return undefined;
  return registry.getPage(firstId);
}

export function resolveNextPage(registry: BookRegistry, currentPageId: string): PageManifest | undefined {
  const idx = registry.manifest.readingOrder.indexOf(currentPageId);
  if (idx === -1 || idx >= registry.manifest.readingOrder.length - 1) return undefined;
  const nextId = registry.manifest.readingOrder[idx + 1];
  return registry.getPage(nextId);
}

export function resolvePreviousPage(registry: BookRegistry, currentPageId: string): PageManifest | undefined {
  const idx = registry.manifest.readingOrder.indexOf(currentPageId);
  if (idx <= 0) return undefined;
  const prevId = registry.manifest.readingOrder[idx - 1];
  return registry.getPage(prevId);
}
