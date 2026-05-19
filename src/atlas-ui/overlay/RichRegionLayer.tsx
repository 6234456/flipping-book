import type { RichRegion } from '../../atlas-core/types/regions';
import { TextRegionItem } from './TextRegionItem';
import { SectionItem } from './SectionItem';

type RichRegionLayerProps = {
  regions: RichRegion[];
  selectedIds: ReadonlySet<string>;
  onToggleSection: (regionId: string) => void;
};

export function RichRegionLayer({ regions, selectedIds, onToggleSection }: RichRegionLayerProps) {
  return (
    <div
      data-testid="rich-region-layer"
      className="absolute inset-0 pointer-events-none"
    >
      {regions.map((r) => {
        if (r.kind === 'textRegion') {
          return <TextRegionItem key={r.regionId} region={r} />;
        }
        if (r.kind === 'section') {
          return (
            <SectionItem
              key={r.regionId}
              region={r}
              selected={selectedIds.has(r.regionId)}
              onToggle={onToggleSection}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
