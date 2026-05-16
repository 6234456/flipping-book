import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Tooltip } from '../Tooltip';
import { TooltipProvider } from '../TooltipProvider';

describe('Tooltip', () => {
  it('shows tooltip content when trigger is focused', async () => {
    render(
      <TooltipProvider>
        <Tooltip content="完整术语说明">
          <button>WL</button>
        </Tooltip>
      </TooltipProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'WL' });
    trigger.focus();
    await screen.findByText('完整术语说明');
  });

  it('renders multi-line content without truncation classes', async () => {
    const longContent = '加工供货:承包人提供主要材料并加工后交付,按 § 3 Abs. 4 UStG 视为货物供应,适用相应税率。';
    render(
      <TooltipProvider>
        <Tooltip content={longContent}>
          <button>Werklieferung</button>
        </Tooltip>
      </TooltipProvider>,
    );
    const trigger = screen.getByRole('button');
    trigger.focus();
    const tip = await screen.findByText(longContent);
    expect(tip.className).not.toContain('whitespace-nowrap');
  });

  it('shows tooltip on mouse hover', async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip content="hover content">
          <button>trigger</button>
        </Tooltip>
      </TooltipProvider>,
    );
    await userEvent.hover(screen.getByRole('button'));
    await screen.findByText('hover content');
  });
});
