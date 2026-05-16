import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { FileText } from 'lucide-react';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('renders with leading icon and children', () => {
    render(<Toggle pressed={false} onPressedChange={vi.fn()} leadingIcon={FileText}>笔记</Toggle>);
    expect(screen.getByRole('button', { name: /笔记/ })).toBeInTheDocument();
  });

  it('sets aria-pressed=false when not pressed', () => {
    render(<Toggle pressed={false} onPressedChange={vi.fn()} leadingIcon={FileText}>笔记</Toggle>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('sets aria-pressed=true when pressed', () => {
    render(<Toggle pressed onPressedChange={vi.fn()} leadingIcon={FileText}>笔记</Toggle>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onPressedChange with toggled value when clicked', async () => {
    const handler = vi.fn();
    render(<Toggle pressed={false} onPressedChange={handler} leadingIcon={FileText}>笔记</Toggle>);
    await userEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledWith(true);
  });

  it('applies accent styling when pressed', () => {
    render(<Toggle pressed onPressedChange={vi.fn()} leadingIcon={FileText}>笔记</Toggle>);
    expect(screen.getByRole('button').className).toContain('bg-accent');
  });

  it('does not apply accent styling when not pressed', () => {
    render(<Toggle pressed={false} onPressedChange={vi.fn()} leadingIcon={FileText}>笔记</Toggle>);
    expect(screen.getByRole('button').className).not.toContain('bg-accent');
  });
});
