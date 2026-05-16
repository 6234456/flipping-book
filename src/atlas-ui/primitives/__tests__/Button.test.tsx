import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>保存</Button>);
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>保存</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders leadingIcon', () => {
    const { container } = render(<Button leadingIcon={Check}>保存</Button>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders trailingIcon', () => {
    const { container } = render(<Button trailingIcon={Check}>下一页</Button>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>保存</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-accent');
  });

  it('applies ghost variant when specified', () => {
    render(<Button variant="ghost">取消</Button>);
    const btn = screen.getByRole('button');
    expect(btn).not.toHaveClass('bg-accent');
    expect(btn.className).toMatch(/bg-transparent|hover:bg-surface-2/);
  });

  it('respects disabled state', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>保存</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('iconOnly requires aria-label', () => {
    render(<Button iconOnly leadingIcon={Trash2} aria-label="删除" />);
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument();
  });

  it('forwards type attribute', () => {
    render(<Button type="submit">提交</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
