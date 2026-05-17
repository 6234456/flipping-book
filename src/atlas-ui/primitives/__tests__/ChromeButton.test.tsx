import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Bug } from 'lucide-react';
import { ChromeButton } from '../ChromeButton';

describe('ChromeButton', () => {
  it('renders children', () => {
    render(<ChromeButton>Debug</ChromeButton>);
    expect(screen.getByRole('button', { name: 'Debug' })).toBeInTheDocument();
  });

  it('renders leadingIcon when provided', () => {
    const { container } = render(<ChromeButton leadingIcon={Bug}>Debug</ChromeButton>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies pressed=false styling by default', () => {
    render(<ChromeButton>Debug</ChromeButton>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn.className).not.toContain('bg-accent');
  });

  it('applies pressed=true styling and aria', () => {
    render(<ChromeButton pressed>Debug</ChromeButton>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn.className).toContain('bg-accent');
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<ChromeButton onClick={onClick}>Debug</ChromeButton>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to size=md (h-7)', () => {
    render(<ChromeButton>Debug</ChromeButton>);
    expect(screen.getByRole('button').className).toContain('h-7');
  });

  it('applies size=sm (h-6)', () => {
    render(<ChromeButton size="sm">Debug</ChromeButton>);
    expect(screen.getByRole('button').className).toContain('h-6');
  });
});
