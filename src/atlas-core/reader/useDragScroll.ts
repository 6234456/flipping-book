import { useEffect, useRef } from 'react';

export function useDragScroll(enabled: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    function onMouseDown(e: MouseEvent) {
      dragging.current = true;
      startPos.current = {
        x: e.clientX,
        y: e.clientY,
        scrollX: el!.scrollLeft,
        scrollY: el!.scrollTop,
      };
      el!.style.cursor = 'grabbing';
      el!.style.userSelect = 'none';
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      el!.scrollLeft = startPos.current.scrollX - dx;
      el!.scrollTop = startPos.current.scrollY - dy;
    }

    function onMouseUp() {
      dragging.current = false;
      el!.style.cursor = enabled ? 'grab' : '';
      el!.style.userSelect = '';
    }

    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.style.cursor = '';
      el.style.userSelect = '';
    };
  }, [enabled]);

  return ref;
}
