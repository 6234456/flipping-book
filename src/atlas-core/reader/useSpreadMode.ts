import { useState, useEffect } from 'react';
import type { PageManifest } from '../types/page';
import type { ReaderConfig } from '../types/manifest';

export type SpreadMode = 'single' | 'spread';

const MOBILE_BREAKPOINT = 768;

function isMobile(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useSpreadMode(page: PageManifest, readerConfig: ReaderConfig): { mode: SpreadMode } {
  const [mobile, setMobile] = useState(isMobile);

  useEffect(() => {
    function handleResize() {
      setMobile(isMobile());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Single pages always render as single
  if (page.layout.mode === 'single') {
    return { mode: 'single' };
  }

  // Spread pages: determine mode based on viewport and config
  if (mobile) {
    // On mobile, always use mobileDefault (which is always "single" per spec default)
    return { mode: readerConfig.spreadBehavior.mobileDefault };
  }

  return { mode: readerConfig.spreadBehavior.desktopDefault };
}
