import { Check } from 'lucide-react';
import { Icon } from './Icon';

export type PinStatus = 'open' | 'resolved';

export type PinProps = {
  status: PinStatus;
  highlighted: boolean;
  count: number;
  onClick: () => void;
  onHover?: (entering: boolean) => void;
  label?: string;
  className?: string;
};

const STATE: Record<PinStatus, string> = {
  open: 'bg-accent border-accent-strong',
  resolved: 'bg-page border-accent-soft',
};

const HIGHLIGHT = 'bg-accent-strong border-accent-strong ring-4 ring-accent-strong/25';

export function Pin({
  status,
  highlighted,
  count,
  onClick,
  onHover,
  label,
  className,
}: PinProps) {
  const stateClass = highlighted ? HIGHLIGHT : STATE[status];
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      aria-label={label ?? `评论 · ${count} 条`}
      className={[
        'relative inline-flex items-center justify-center',
        'w-8 h-8 rounded-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        data-pin-status={status}
        data-pin-highlighted={highlighted ? 'true' : 'false'}
        className={[
          'block rounded-full border-2 shadow-[var(--shadow-2)] transition-transform duration-150',
          highlighted ? 'w-[22px] h-[22px]' : 'w-[18px] h-[18px]',
          stateClass,
        ].join(' ')}
      >
        {status === 'resolved' && !highlighted ? (
          <span className="flex items-center justify-center w-full h-full text-accent">
            <Icon icon={Check} size={14} />
          </span>
        ) : null}
      </span>
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-[3px] flex items-center justify-center bg-chrome text-page text-[9px] font-semibold tabular-nums rounded-full">
          {count}
        </span>
      ) : null}
    </button>
  );
}
