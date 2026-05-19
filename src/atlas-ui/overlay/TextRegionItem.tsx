import type { RichRegion } from '../../atlas-core/types/regions';
import { Tooltip } from '../primitives/Tooltip';

type TextRegionItemProps = {
  region: RichRegion;
};

export function TextRegionItem({ region }: TextRegionItemProps) {
  if (!region.text) return null;
  return (
    <Tooltip content={region.text} side="top">
      <div
        data-testid={`text-region-${region.regionId}`}
        data-region-id={region.regionId}
        style={{
          position: 'absolute',
          left: `${region.rect.x}%`,
          top: `${region.rect.y}%`,
          width: `${region.rect.width}%`,
          height: `${region.rect.height}%`,
          pointerEvents: 'auto',
          cursor: 'help',
        }}
        className="hover:outline hover:outline-1 hover:outline-dotted hover:outline-accent transition-all"
      />
    </Tooltip>
  );
}
