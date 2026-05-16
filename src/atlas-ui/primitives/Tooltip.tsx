import type { ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  collisionPadding?: number;
  asChild?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Tooltip({
  content,
  children,
  side = 'top',
  sideOffset = 6,
  collisionPadding = 8,
  asChild = true,
  open,
  onOpenChange,
}: TooltipProps) {
  return (
    <RadixTooltip.Root open={open} onOpenChange={onOpenChange}>
      <RadixTooltip.Trigger asChild={asChild}>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          className="z-50 max-w-[260px] rounded-md bg-chrome text-page text-xs leading-relaxed px-3 py-2 shadow-[var(--shadow-3)]"
        >
          {content}
          <RadixTooltip.Arrow className="fill-chrome" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
