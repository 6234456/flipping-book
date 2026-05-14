import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageRenderer } from '../PageRenderer';
import type { PageManifest } from '../../../atlas-core/types/page';
import type { ImageAsset } from '../../../atlas-core/types/image';

function makePage(overrides: Partial<PageManifest> = {}): PageManifest {
  return {
    pageId: "test-page",
    slug: "/test",
    type: "imageOverlay",
    title: { "zh-CN": "测试页" },
    layout: {
      mode: "single",
      format: "magazine-portrait",
      size: { preset: "magazine-portrait-1000", width: 1000, height: 1414 },
      background: "image",
    },
    ...overrides,
  };
}

function makeImage(overrides: Partial<ImageAsset> = {}): ImageAsset {
  return {
    assetId: "img-1",
    src: "/images/test.png",
    version: "v1",
    width: 1000,
    height: 1414,
    format: "png",
    visualSystem: "VAT_ATLAS_MAGAZINE_V2",
    pageFormat: "single",
    sizePreset: "magazine-portrait-1000",
    alt: { "zh-CN": "测试图片" },
    ...overrides,
  };
}

describe('PageRenderer', () => {
  it('renders cover page with image', () => {
    const page = makePage({ type: 'cover' });
    const image = makeImage({ src: '/images/cover.png' });
    const { container } = render(
      <PageRenderer page={page} imageAsset={image} locale="zh-CN" />
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/cover.png');
  });

  it('renders cover page fallback without image', () => {
    const page = makePage({ type: 'cover', subtitle: { 'zh-CN': '副标题' } });
    render(<PageRenderer page={page} locale="zh-CN" />);
    expect(screen.getByText('测试页')).toBeInTheDocument();
    expect(screen.getByText('副标题')).toBeInTheDocument();
  });

  it('renders toc page', () => {
    const page = makePage({ type: 'toc' });
    render(<PageRenderer page={page} locale="zh-CN" />);
    expect(screen.getByText('测试页')).toBeInTheDocument();
  });

  it('renders image for imageOverlay type', () => {
    const page = makePage({ type: 'imageOverlay' });
    const image = makeImage();
    const { container } = render(
      <PageRenderer page={page} imageAsset={image} locale="zh-CN" />
    );
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('shows placeholder when image is missing', () => {
    const page = makePage({ type: 'imageOverlay' });
    render(<PageRenderer page={page} locale="zh-CN" />);
    expect(screen.getByText(/图片不可用/)).toBeInTheDocument();
  });

  it('renders chapter type as image overlay', () => {
    const page = makePage({ type: 'chapter' });
    const image = makeImage();
    const { container } = render(
      <PageRenderer page={page} imageAsset={image} locale="zh-CN" />
    );
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('shows unknown page type message', () => {
    const page = makePage({ type: 'unknown-type' as PageManifest['type'] });
    render(<PageRenderer page={page} locale="zh-CN" />);
    expect(screen.getByText(/未知页面类型/)).toBeInTheDocument();
  });
});
