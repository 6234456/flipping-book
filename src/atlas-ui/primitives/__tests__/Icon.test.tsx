import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Check } from 'lucide-react';
import { Icon } from '../Icon';

describe('Icon', () => {
  it('renders an svg with the provided lucide icon', () => {
    const { container } = render(<Icon icon={Check} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('defaults size to 16px', () => {
    const { container } = render(<Icon icon={Check} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });

  it('respects explicit size', () => {
    const { container } = render(<Icon icon={Check} size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('uses stroke-width 2 by default', () => {
    const { container } = render(<Icon icon={Check} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('stroke-width', '2');
  });

  it('sets aria-hidden by default', () => {
    const { container } = render(<Icon icon={Check} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('can be made non-hidden', () => {
    const { container } = render(<Icon icon={Check} aria-hidden={false} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('aria-hidden');
  });
});
