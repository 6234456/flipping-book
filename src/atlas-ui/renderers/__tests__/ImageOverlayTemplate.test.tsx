import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ImageOverlayTemplate } from '../ImageOverlayTemplate';
import type { PageManifest } from '../../../atlas-core/types/page';
import type { ImageAsset } from '../../../atlas-core/types/image';

const testPage: PageManifest = {
  pageId: "test",
  slug: "/test",
  type: "imageOverlay",
  title: { "zh-CN": "测试页" },
  layout: {
    mode: "single",
    format: "magazine-portrait",
    size: { preset: "magazine-portrait-1000", width: 1000, height: 1414 },
    background: "image",
  },
};

const testImage: ImageAsset = {
  assetId: "img-1",
  src: "/images/test.png",
  version: "v1",
  width: 1055,
  height: 1491,
  format: "png",
  visualSystem: "VAT_ATLAS_MAGAZINE_V2",
  pageFormat: "single",
  sizePreset: "magazine-portrait-1000",
  alt: { "zh-CN": "测试图" },
};

describe('ImageOverlayTemplate', () => {
  it('fit-page uses max-h-full object-contain', () => {
    const { container } = render(
      <ImageOverlayTemplate page={testPage} imageAsset={testImage} locale="zh-CN" zoom="fit-page" />
    );
    const img = container.querySelector('img')!;
    expect(img.className).toContain('max-h-[');
    expect(img.className).toContain('object-contain');
  });

  it('fit-width uses w-full h-auto', () => {
    const { container } = render(
      <ImageOverlayTemplate page={testPage} imageAsset={testImage} locale="zh-CN" zoom="fit-width" />
    );
    const img = container.querySelector('img')!;
    expect(img.className).toContain('w-full');
    expect(img.className).toContain('h-auto');
  });

  it('actual-size uses image pixel dimensions', () => {
    const { container } = render(
      <ImageOverlayTemplate page={testPage} imageAsset={testImage} locale="zh-CN" zoom="actual-size" />
    );
    const img = container.querySelector('img')!;
    expect(img.style.width).toBe('1055px');
    expect(img.style.height).toBe('1491px');
  });

  it('switching zoom changes class', () => {
    const { container, rerender } = render(
      <ImageOverlayTemplate page={testPage} imageAsset={testImage} locale="zh-CN" zoom="fit-page" />
    );
    expect(container.querySelector('img')!.className).toContain('max-h-[');

    rerender(
      <ImageOverlayTemplate page={testPage} imageAsset={testImage} locale="zh-CN" zoom="fit-width" />
    );
    expect(container.querySelector('img')!.className).toContain('w-full');

    rerender(
      <ImageOverlayTemplate page={testPage} imageAsset={testImage} locale="zh-CN" zoom="actual-size" />
    );
    expect(container.querySelector('img')!.style.width).toBe('1055px');

    rerender(
      <ImageOverlayTemplate page={testPage} imageAsset={testImage} locale="zh-CN" zoom="fit-page" />
    );
    expect(container.querySelector('img')!.className).toContain('max-h-[');
  });

  it('shows placeholder when image is missing', () => {
    const { container } = render(
      <ImageOverlayTemplate page={testPage} locale="zh-CN" zoom="fit-page" />
    );
    expect(container.textContent).toContain('图片不可用');
  });
});
