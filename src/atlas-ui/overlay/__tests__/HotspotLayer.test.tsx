import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { HotspotLayer } from '../HotspotLayer';
import type { OverlayConfig } from '../../../atlas-core/types/overlay';

const testOverlay: OverlayConfig = {
  overlayId: "test-overlay",
  imageAssetId: "img-1",
  imageVersion: "v1",
  coordinateSystem: "percentage",
  hotspots: [
    {
      hotspotId: "hs-1",
      label: { "zh-CN": "热点1" },
      shape: "rect",
      rect: { x: 10, y: 20, width: 30, height: 15 },
      target: { kind: "page", pageId: "target-page" },
      tooltip: { "zh-CN": "跳转到目标页" },
    },
    {
      hotspotId: "hs-2",
      label: { "zh-CN": "热点2" },
      shape: "rect",
      rect: { x: 50, y: 60, width: 20, height: 10 },
      target: { kind: "glossary" },
      style: { debugColor: "green", zIndex: 2 },
    },
    {
      hotspotId: "hs-3",
      label: { "zh-CN": "已禁用" },
      shape: "rect",
      rect: { x: 0, y: 0, width: 10, height: 10 },
      target: { kind: "page", pageId: "p3" },
      disabled: true,
    },
  ],
};

describe('HotspotLayer', () => {
  it('renders clickable hotspots', () => {
    const { container } = render(
      <HotspotLayer overlay={testOverlay} onNavigate={vi.fn()} />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(2); // only non-disabled with rect
  });

  it('calls onNavigate when hotspot is clicked', async () => {
    const onNavigate = vi.fn();
    render(
      <HotspotLayer overlay={testOverlay} onNavigate={onNavigate} />
    );
    const btn = screen.getByLabelText('热点1');
    await userEvent.click(btn);
    expect(onNavigate).toHaveBeenCalledWith({ kind: "page", pageId: "target-page" });
  });

  it('shows tooltip as title', () => {
    render(
      <HotspotLayer overlay={testOverlay} onNavigate={vi.fn()} />
    );
    const btn = screen.getByLabelText('热点1');
    expect(btn).toHaveAttribute('title', '跳转到目标页');
  });

  it('positions hotspot by percentage', () => {
    const { container } = render(
      <HotspotLayer overlay={testOverlay} onNavigate={vi.fn()} />
    );
    const btn = container.querySelector('button');
    expect(btn).toHaveStyle({
      left: '10%',
      top: '20%',
      width: '30%',
      height: '15%',
    });
  });
});
