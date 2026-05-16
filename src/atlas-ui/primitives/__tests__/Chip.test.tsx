import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chip } from '../Chip';

describe('Chip', () => {
  it('renders children as text', () => {
    render(<Chip>3</Chip>);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('uses neutral variant by default', () => {
    render(<Chip>3</Chip>);
    expect(screen.getByText('3').className).toContain('bg-surface-2');
  });

  it('applies accent variant', () => {
    render(<Chip variant="accent">3</Chip>);
    expect(screen.getByText('3').className).toContain('bg-accent-bg');
  });
});
