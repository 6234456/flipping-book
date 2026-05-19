import type { RichRegion } from '../../atlas-core/types/regions';

type SectionItemProps = {
  region: RichRegion;
  selected: boolean;
  onToggle: (regionId: string) => void;
};

export function SectionItem({ region, selected, onToggle }: SectionItemProps) {
  return (
    <div
      role="button"
      tabIndex={-1}
      data-testid={`section-item-${region.regionId}`}
      data-region-id={region.regionId}
      data-selected={selected ? 'true' : 'false'}
      style={{
        position: 'absolute',
        left: `${region.rect.x}%`,
        top: `${region.rect.y}%`,
        width: `${region.rect.width}%`,
        height: `${region.rect.height}%`,
        pointerEvents: 'auto',
      }}
      className={[
        'transition-colors duration-150',
        selected
          ? 'bg-accent-bg-faint border border-accent'
          : 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-accent',
      ].join(' ')}
      onClick={() => onToggle(region.regionId)}
    />
  );
}
