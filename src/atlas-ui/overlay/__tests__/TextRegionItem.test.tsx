import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextRegionItem } from '../TextRegionItem';
import type { RichRegion } from '../../../atlas-core/types/regions';
import * as RadixTooltip from '@radix-ui/react-tooltip';

function withProvider(ui: React.ReactNode) {
  return <RadixTooltip.Provider>{ui}</RadixTooltip.Provider>;
}

const baseRegion: RichRegion = {
  regionId: 'tx-1',
  kind: 'textRegion',
  role: 'title',
  rect: { x: 5, y: 10, width: 20, height: 8 },
};

describe('TextRegionItem', () => {
  it('renders nothing when region.text is undefined', () => {
    const { container } = render(withProvider(<TextRegionItem region={baseRegion} />));
    expect(container.querySelector('[data-testid="text-region-tx-1"]')).toBeNull();
  });

  it('renders nothing when region.text is empty string', () => {
    const { container } = render(
      withProvider(<TextRegionItem region={{ ...baseRegion, text: '' }} />),
    );
    expect(container.querySelector('[data-testid="text-region-tx-1"]')).toBeNull();
  });

  it('renders an absolutely-positioned trigger when region.text is set', () => {
    render(withProvider(<TextRegionItem region={{ ...baseRegion, text: 'Hello' }} />));
    const el = screen.getByTestId('text-region-tx-1');
    expect(el.style.left).toBe('5%');
    expect(el.style.top).toBe('10%');
    expect(el.style.width).toBe('20%');
    expect(el.style.height).toBe('8%');
  });
});
