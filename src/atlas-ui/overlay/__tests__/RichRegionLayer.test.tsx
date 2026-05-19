import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { RichRegionLayer } from '../RichRegionLayer';
import type { RichRegion } from '../../../atlas-core/types/regions';

const regions: RichRegion[] = [
  {
    regionId: 'tx-1',
    kind: 'textRegion',
    role: 'title',
    rect: { x: 0, y: 0, width: 10, height: 10 },
    text: 'Section A',
  },
  {
    regionId: 'sec-1',
    kind: 'section',
    role: 'detectedSection',
    rect: { x: 10, y: 10, width: 30, height: 30 },
  },
  {
    regionId: 'grid-1',
    kind: 'gridRegion',
    role: 'gridRegion',
    rect: { x: 40, y: 40, width: 10, height: 10 },
  },
  {
    regionId: 'nav-1',
    kind: 'navigation',
    role: 'bottomNavigation',
    rect: { x: 50, y: 50, width: 10, height: 10 },
  },
];

function withProvider(ui: React.ReactNode) {
  return <RadixTooltip.Provider>{ui}</RadixTooltip.Provider>;
}

describe('RichRegionLayer', () => {
  it('renders textRegion + section items, ignores other kinds', () => {
    render(
      withProvider(
        <RichRegionLayer
          regions={regions}
          selectedIds={new Set()}
          onToggleSection={() => {}}
        />,
      ),
    );
    expect(screen.getByTestId('text-region-tx-1')).toBeInTheDocument();
    expect(screen.getByTestId('section-item-sec-1')).toBeInTheDocument();
    expect(screen.queryByTestId('text-region-grid-1')).toBeNull();
    expect(screen.queryByTestId('section-item-nav-1')).toBeNull();
  });

  it('container has pointer-events-none and absolute inset-0', () => {
    render(
      withProvider(
        <RichRegionLayer
          regions={regions}
          selectedIds={new Set()}
          onToggleSection={() => {}}
        />,
      ),
    );
    const layer = screen.getByTestId('rich-region-layer');
    expect(layer.className).toMatch(/absolute/);
    expect(layer.className).toMatch(/inset-0/);
    expect(layer.className).toMatch(/pointer-events-none/);
  });

  it('passes selected state to sections via selectedIds set', () => {
    render(
      withProvider(
        <RichRegionLayer
          regions={regions}
          selectedIds={new Set(['sec-1'])}
          onToggleSection={() => {}}
        />,
      ),
    );
    expect(screen.getByTestId('section-item-sec-1').getAttribute('data-selected')).toBe('true');
  });
});
