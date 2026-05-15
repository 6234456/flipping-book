import { useCallback } from 'react';
import type { AnnotationAnchor } from '../../atlas-core/types/comments';

type CommentCaptureLayerProps = {
  pageId: string;
  imageAssetId: string;
  imageVersion: string;
  active: boolean;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
};

export function CommentCaptureLayer({
  pageId,
  imageAssetId,
  imageVersion,
  active,
  onCreateAnchor,
}: CommentCaptureLayerProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!active) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      onCreateAnchor({
        kind: 'imagePoint',
        pageId,
        imageAssetId,
        imageVersion,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
      });
    },
    [active, pageId, imageAssetId, imageVersion, onCreateAnchor],
  );

  return (
    <div
      className={`absolute inset-0 z-20 ${active ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onClick={handleClick}
    />
  );
}
