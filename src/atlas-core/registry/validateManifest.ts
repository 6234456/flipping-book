import type { BookManifest } from '../types/manifest';

export type ManifestValidationError = {
  kind: 'missing_page_ref' | 'missing_image_ref' | 'missing_overlay_ref';
  message: string;
  pageId?: string;
};

export function validateManifest(manifest: BookManifest): ManifestValidationError[] {
  const errors: ManifestValidationError[] = [];
  const pageIds = new Set(manifest.pages.map((p) => p.pageId));

  for (const pageId of manifest.readingOrder) {
    if (!pageIds.has(pageId)) {
      errors.push({
        kind: 'missing_page_ref',
        message: `readingOrder 引用 "${pageId}" 但该 pageId 不存在于 pages 数组中`,
        pageId,
      });
    }
  }

  return errors;
}
