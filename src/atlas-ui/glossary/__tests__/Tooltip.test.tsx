import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip content="提示信息">
        <span>悬停我</span>
      </Tooltip>
    );
    expect(screen.getByText('悬停我')).toBeInTheDocument();
  });

  it('shows tooltip on hover', async () => {
    render(
      <Tooltip content={<span>提示内容</span>}>
        <span>悬停目标</span>
      </Tooltip>
    );
    const trigger = screen.getByText('悬停目标');
    await userEvent.hover(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('提示内容')).toBeInTheDocument();
  });

  it('hides tooltip on unhover', async () => {
    render(
      <Tooltip content="提示">
        <span>目标</span>
      </Tooltip>
    );
    const trigger = screen.getByText('目标');
    await userEvent.hover(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await userEvent.unhover(trigger);
    // Tooltip should disappear after the 150ms delay
    // Wait for the timeout to fire
    await new Promise(r => setTimeout(r, 200));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on focus', async () => {
    render(
      <Tooltip content="焦点提示">
        <span tabIndex={0}>可聚焦</span>
      </Tooltip>
    );
    await userEvent.tab();
    const focused = screen.getByText('可聚焦');
    expect(focused).toHaveFocus();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
