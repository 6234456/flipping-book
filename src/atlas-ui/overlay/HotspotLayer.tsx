import type { OverlayConfig, HotspotTarget } from '../../atlas-core/types/overlay';

type HotspotLayerProps = {
  overlay: OverlayConfig;
  imageAsset?: unknown;
  onNavigate: (target: HotspotTarget) => void;
};

export function HotspotLayer({ overlay, onNavigate }: HotspotLayerProps) {
  return (
    <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
      {overlay.hotspots.map((hs) => {
        if (!hs.rect || hs.disabled) return null;

        return (
          <button
            key={hs.hotspotId}
            onClick={() => onNavigate(hs.target)}
            title={hs.tooltip?.['zh-CN'] ?? hs.label?.['zh-CN']}
            className="absolute cursor-pointer transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            style={{
              left: `${hs.rect.x}%`,
              top: `${hs.rect.y}%`,
              width: `${hs.rect.width}%`,
              height: `${hs.rect.height}%`,
              pointerEvents: 'auto',
              zIndex: hs.style?.zIndex ?? 1,
            }}
            aria-label={hs.label?.['zh-CN']}
          />
        );
      })}
    </div>
  );
}
