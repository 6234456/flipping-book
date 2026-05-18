import type { BookManifest } from '../types/manifest';
import type { ImageAsset } from '../types/image';
import type { OverlayConfig } from '../types/overlay';

export type ManifestValidationError = {
  kind: 'missing_page_ref' | 'missing_image_ref' | 'missing_overlay_ref' | 'image_version_mismatch';
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

export function validateImageRefs(
  manifest: BookManifest,
  imageAssets: ImageAsset[],
): ManifestValidationError[] {
  const errors: ManifestValidationError[] = [];
  const imageIds = new Set(imageAssets.map((a) => a.assetId));

  for (const page of manifest.pages) {
    if (page.image) {
      const img = imageAssets.find((a) => a.assetId === page.image!.assetId);
      if (!img) {
        errors.push({
          kind: 'missing_image_ref',
          message: `页面 "${page.pageId}" 引用 imageAsset "${page.image.assetId}" 但该资产不存在`,
          pageId: page.pageId,
        });
      }
    }
    if (page.spreadImages) {
      if (page.spreadImages.sourceMode === 'single-spread-image') {
        if (!imageIds.has(page.spreadImages.spread.assetId)) {
          errors.push({
            kind: 'missing_image_ref',
            message: `页面 "${page.pageId}" 引用 spread image "${page.spreadImages.spread.assetId}" 但该资产不存在`,
            pageId: page.pageId,
          });
        }
      } else {
        if (!imageIds.has(page.spreadImages.left.assetId)) {
          errors.push({
            kind: 'missing_image_ref',
            message: `页面 "${page.pageId}" 引用 left image "${page.spreadImages.left.assetId}" 但该资产不存在`,
            pageId: page.pageId,
          });
        }
        if (!imageIds.has(page.spreadImages.right.assetId)) {
          errors.push({
            kind: 'missing_image_ref',
            message: `页面 "${page.pageId}" 引用 right image "${page.spreadImages.right.assetId}" 但该资产不存在`,
            pageId: page.pageId,
          });
        }
      }
    }
  }

  return errors;
}

export function validateOverlayRefs(
  manifest: BookManifest,
  overlays: OverlayConfig[],
): ManifestValidationError[] {
  const errors: ManifestValidationError[] = [];

  for (const page of manifest.pages) {
    if (!page.overlay) continue;

    const overlay = overlays.find((o) => o.overlayId === page.overlay!.overlayId);
    if (!overlay) {
      errors.push({
        kind: 'missing_overlay_ref',
        message: `页面 "${page.pageId}" 引用 overlay "${page.overlay.overlayId}" 但该配置不存在`,
        pageId: page.pageId,
      });
      continue;
    }

    // Check image version match
    if (page.image) {
      if (overlay.imageAssetId !== page.image.assetId || overlay.imageVersion !== page.image.version) {
        errors.push({
          kind: 'image_version_mismatch',
          message: `页面 "${page.pageId}" 的 overlay 绑定 imageAsset="${overlay.imageAssetId}" version="${overlay.imageVersion}" 但 page.image 是 assetId="${page.image.assetId}" version="${page.image.version}"`,
          pageId: page.pageId,
        });
      }
    }
  }

  return errors;
}

export function validateAll(
  manifest: BookManifest,
  imageAssets: ImageAsset[],
  overlays: OverlayConfig[],
): ManifestValidationError[] {
  return [
    ...validateManifest(manifest),
    ...validateImageRefs(manifest, imageAssets),
    ...validateOverlayRefs(manifest, overlays),
  ];
}
