import { describe, it, expect } from 'vitest';
import sample from './fixtures/sample-overlay.json';
import { convertOverlay } from '../converter';
import type { RawOverlay } from '../types';

const raw = sample as RawOverlay;

describe('convertOverlay', () => {
  it('returns RichOverlayConfig with canvas + regions + hotspots', () => {
    const out = convertOverlay(raw);
    expect(out.canvas).toEqual({ width: 1000, height: 1500 });
    expect(out.coordinateSystem).toBe('percentage');
    expect(out.imageVersion).toBe('0.6.1');
    expect(out.regions.length).toBe(6);
    expect(out.hotspots.length).toBe(3);
  });

  it('converts pixel bbox to percentage', () => {
    const out = convertOverlay(raw);
    const title = out.regions.find((r) => r.regionId === 'main_title');
    expect(title?.rect).toEqual({
      x: (100 / 1000) * 100,
      y: (150 / 1500) * 100,
      width: (800 / 1000) * 100,
      height: (100 / 1500) * 100,
    });
  });

  it('preserves text on textRegions', () => {
    const out = convertOverlay(raw);
    const title = out.regions.find((r) => r.regionId === 'main_title');
    expect(title?.text).toBe('VAT 判断总框架');
    expect(title?.kind).toBe('textRegion');
  });

  it('maps known colorRole to enum, drops unknown', () => {
    const out = convertOverlay(raw);
    const section = out.regions.find((r) => r.regionId === 'section_01');
    expect(section?.colorRole).toBe('evidence_green');
  });

  it('drops unknown colorRole', () => {
    const customRaw = JSON.parse(JSON.stringify(raw)) as RawOverlay;
    customRaw.sections[0].colorRole = 'rainbow_unicorn';
    const out = convertOverlay(customRaw);
    const section = out.regions.find((r) => r.regionId === 'section_01');
    expect(section?.colorRole).toBeUndefined();
  });

  it('projects navigationRegion to Hotspot with target', () => {
    const out = convertOverlay(raw);
    const navHotspot = out.hotspots.find((h) => h.hotspotId === 'nav_to_toc');
    expect(navHotspot).toBeDefined();
    expect(navHotspot?.target.kind).toBe('page');
    if (navHotspot?.target.kind === 'page') {
      expect(navHotspot.target.pageId).toBe('toc');
    }
  });

  it('projects legalAnchor to Hotspot with glossary target', () => {
    const out = convertOverlay(raw);
    const legalHotspot = out.hotspots.find((h) => h.hotspotId === 'anchor_25b');
    expect(legalHotspot?.target.kind).toBe('glossary');
  });

  it('projects imageHotspot to Hotspot with self-page no-op target', () => {
    const out = convertOverlay(raw);
    const imageHotspot = out.hotspots.find((h) => h.hotspotId === 'icon_chain');
    expect(imageHotspot?.target.kind).toBe('page');
    if (imageHotspot?.target.kind === 'page') {
      expect(imageHotspot.target.pageId).toBe('01-vat-framework');
    }
  });

  it('overlayId and imageAssetId follow sectionCode pattern', () => {
    const out = convertOverlay(raw);
    expect(out.overlayId).toBe('01-overlay-v06');
    expect(out.imageAssetId).toBe('01-current-final-v06');
  });

  it('hotspot tooltip uses text if present', () => {
    const out = convertOverlay(raw);
    const legalHotspot = out.hotspots.find((h) => h.hotspotId === 'anchor_25b');
    expect(legalHotspot?.tooltip?.['zh-CN']).toBe('§ 25b UStG');
  });
});
