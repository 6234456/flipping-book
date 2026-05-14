import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DebugOverlay } from '../DebugOverlay';
import type { OverlayConfig } from '../../../atlas-core/types/overlay';

const testOverlay: OverlayConfig = {
  overlayId: "test-overlay",
  imageAssetId: "img-1",
  imageVersion: "v1",
  coordinateSystem: "percentage",
  hotspots: [
    {
      hotspotId: "hs-1",
      label: { "zh-CN": "核心问题" },
      shape: "rect",
      rect: { x: 5, y: 13, width: 90, height: 9 },
      target: { kind: "page", pageId: "p1" },
      style: { debugColor: "blue" },
    },
    {
      hotspotId: "hs-2",
      label: { "zh-CN": "术语区" },
      shape: "rect",
      rect: { x: 50, y: 55, width: 45, height: 19 },
      target: { kind: "glossary" },
      style: { debugColor: "purple" },
    },
  ],
};

describe('DebugOverlay', () => {
  it('renders hotspot labels', () => {
    render(<DebugOverlay overlay={testOverlay} />);
    // Just verify it renders without crashing for now
    const divs = document.querySelectorAll('.absolute');
    expect(divs.length).toBeGreaterThan(0);
  });

  it('renders hotspot label text', () => {
    const { container } = render(<DebugOverlay overlay={testOverlay} />);
    expect(container.textContent).toContain('核心问题');
    expect(container.textContent).toContain('术语区');
  });
});
