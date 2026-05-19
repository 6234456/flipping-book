import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionItem } from '../SectionItem';
import type { RichRegion } from '../../../atlas-core/types/regions';

const region: RichRegion = {
  regionId: 'sec-1',
  kind: 'section',
  role: 'detectedSection',
  rect: { x: 10, y: 20, width: 30, height: 40 },
};

describe('SectionItem', () => {
  it('calls onToggle with regionId when clicked', () => {
    const onToggle = vi.fn();
    render(<SectionItem region={region} selected={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('section-item-sec-1'));
    expect(onToggle).toHaveBeenCalledWith('sec-1');
  });

  it('renders selected styling when selected=true', () => {
    render(<SectionItem region={region} selected={true} onToggle={() => {}} />);
    const el = screen.getByTestId('section-item-sec-1');
    expect(el.className).toMatch(/bg-accent-bg-faint/);
    expect(el.getAttribute('data-selected')).toBe('true');
  });

  it('renders unselected hover-outline styling when selected=false', () => {
    render(<SectionItem region={region} selected={false} onToggle={() => {}} />);
    const el = screen.getByTestId('section-item-sec-1');
    expect(el.className).toMatch(/hover:outline/);
    expect(el.getAttribute('data-selected')).toBe('false');
  });

  it('positions absolutely using rect percentages', () => {
    render(<SectionItem region={region} selected={false} onToggle={() => {}} />);
    const el = screen.getByTestId('section-item-sec-1');
    expect(el.style.left).toBe('10%');
    expect(el.style.top).toBe('20%');
    expect(el.style.width).toBe('30%');
    expect(el.style.height).toBe('40%');
  });
});
