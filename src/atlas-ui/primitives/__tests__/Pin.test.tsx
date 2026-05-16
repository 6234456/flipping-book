import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Pin } from '../Pin';

describe('Pin', () => {
  it('renders a button with the count', () => {
    render(<Pin status="open" highlighted={false} count={2} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('applies open-state class when status=open', () => {
    const { container } = render(
      <Pin status="open" highlighted={false} count={2} onClick={vi.fn()} />,
    );
    expect(container.querySelector('[data-pin-status="open"]')).not.toBeNull();
  });

  it('applies resolved-state class when status=resolved', () => {
    const { container } = render(
      <Pin status="resolved" highlighted={false} count={5} onClick={vi.fn()} />,
    );
    expect(container.querySelector('[data-pin-status="resolved"]')).not.toBeNull();
  });

  it('applies highlight data attribute when highlighted', () => {
    const { container } = render(
      <Pin status="open" highlighted count={1} onClick={vi.fn()} />,
    );
    expect(container.querySelector('[data-pin-highlighted="true"]')).not.toBeNull();
  });

  // Regression guard: ensure we never fall back to the old split('-') CSS-class-as-color hack.
  it('does not produce inline backgroundColor with raw tailwind class names', () => {
    const { container } = render(
      <Pin status="open" highlighted count={1} onClick={vi.fn()} />,
    );
    const inline = container.querySelector('[data-pin-status]') as HTMLElement;
    const bg = inline.style.backgroundColor;
    expect(bg).not.toMatch(/yellow|green|stone|400|600/);
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Pin status="open" highlighted={false} count={1} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fires onHover with entering=true on mouse enter', async () => {
    const onHover = vi.fn();
    render(<Pin status="open" highlighted={false} count={1} onClick={vi.fn()} onHover={onHover} />);
    await userEvent.hover(screen.getByRole('button'));
    expect(onHover).toHaveBeenCalledWith(true);
  });
});
