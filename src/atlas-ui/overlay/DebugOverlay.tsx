import type { OverlayConfig } from '../../atlas-core/types/overlay';

const DEBUG_COLORS: Record<string, string> = {
  blue: 'rgba(59, 130, 246, 0.3)',
  orange: 'rgba(249, 115, 22, 0.3)',
  green: 'rgba(34, 197, 94, 0.3)',
  purple: 'rgba(168, 85, 247, 0.3)',
  red: 'rgba(239, 68, 68, 0.3)',
};

type DebugOverlayProps = {
  overlay: OverlayConfig;
  imageAsset?: unknown;
};

export function DebugOverlay({ overlay }: DebugOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {overlay.hotspots.map((hs) => {
        if (!hs.rect) return null;
        const color = DEBUG_COLORS[hs.style?.debugColor ?? 'blue'] ?? DEBUG_COLORS.blue;
        const borderColor = color.replace('0.3', '0.7');

        return (
          <div
            key={hs.hotspotId}
            className="absolute border-2 flex items-center justify-center text-[10px] text-white font-mono"
            style={{
              left: `${hs.rect.x}%`,
              top: `${hs.rect.y}%`,
              width: `${hs.rect.width}%`,
              height: `${hs.rect.height}%`,
              backgroundColor: color,
              borderColor,
            }}
          >
            <span className="bg-black/60 px-1 rounded truncate max-w-full">
              {hs.label?.['zh-CN'] ?? hs.hotspotId}
            </span>
          </div>
        );
      })}
    </div>
  );
}
