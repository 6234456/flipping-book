# Spec B — Toolbar Merge + Tabbed Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dual-bar / dual-overlay reader chrome with a single merged dark top bar + a single right-side multi-tab rail (collapsible to a 36px slim rail, mobile bottom sheet), plus one-click `+` button comment creation.

**Architecture:** Introduce two new primitives (`ChromeButton`, `InfoBanner`) and a `useRailState` hook with localStorage persistence. Extract reusable subcomponents from the existing `CommentPanel` (`MessageItem`, `ThreadList`), then build three tab panes (`CommentsTab`, `NotesTab`, `TocTab`). Compose them in a new `ReaderRail` directory (`ReaderRail`, `RailHeader`, `SlimRail`, `MobileRailSheet`). Rewrite `ReaderShell` to host a single merged dark bar and the rail; delete `CommentPanel`, `NotesDrawer`, and `ReaderTopBar` files (their roles split into the new structure). Add `+` button flow with `InfoBanner` and minimal keyboard shortcuts.

**Tech Stack:** React 19, TypeScript 5.8, Vite 8, Tailwind CSS 4 (`@theme` tokens already defined), framer-motion 12, lucide-react, @radix-ui/react-tooltip, Vitest 4 + React Testing Library 16.

**Spec source:** [`docs/superpowers/specs/2026-05-16-toolbar-and-rail-spec-b-design.md`](../specs/2026-05-16-toolbar-and-rail-spec-b-design.md)

---

## File Plan

**Create:**

```
src/atlas-ui/primitives/
  ChromeButton.tsx
  InfoBanner.tsx
  __tests__/
    ChromeButton.test.tsx
    InfoBanner.test.tsx

src/atlas-core/reader/
  useRailState.ts
  __tests__/
    useRailState.test.ts

src/atlas-ui/comments/
  MessageItem.tsx               — extracted from CommentPanel
  ThreadList.tsx                — extracted from CommentPanel
  __tests__/
    MessageItem.test.tsx
    ThreadList.test.tsx

src/atlas-ui/rail/
  ReaderRail.tsx
  RailHeader.tsx
  SlimRail.tsx
  MobileRailSheet.tsx
  tabs/
    CommentsTab.tsx
    NotesTab.tsx
    TocTab.tsx
  __tests__/
    ReaderRail.test.tsx
    RailHeader.test.tsx
    SlimRail.test.tsx
    MobileRailSheet.test.tsx
    CommentsTab.test.tsx
    NotesTab.test.tsx
    TocTab.test.tsx

src/__tests__/
  railIntegration.test.tsx
  railPersistence.test.tsx
  plusButtonFlow.test.tsx
```

**Modify:**

```
src/atlas-ui/primitives/motion.ts          — add railWidth, tabFade, bannerSlide presets
src/atlas-ui/primitives/index.ts           — barrel exports
src/atlas-ui/reader/ReaderShell.tsx        — full rewrite: merged dark bar + ReaderRail
src/atlas-ui/reader/MagazineReader.tsx     — add useRailState, pendingAnchor, + flow handlers
src/atlas-core/reader/useKeyboardNavigation.ts — extend with rail shortcuts and input-focus guard
src/atlas-core/reader/index.ts             — export useRailState
```

**Delete:**

```
src/atlas-ui/reader/ReaderTopBar.tsx       (merged into ReaderShell)
src/atlas-ui/reader/__tests__/ReaderTopBar.test.tsx
src/atlas-ui/comments/CommentPanel.tsx     (replaced by CommentsTab + ThreadList + MessageItem)
src/atlas-ui/comments/__tests__/CommentPanel.test.tsx (if exists)
src/atlas-ui/notes/NotesDrawer.tsx         (replaced by NotesTab)
src/atlas-ui/notes/__tests__/NotesDrawer.test.tsx
```

---

## Conventions

- **Test runner:** `npm test` (Vitest, runs once). Single file: `npx vitest run <path>`.
- **Lint:** `npm run lint`. Must not regress.
- **Dev server:** `npm run dev` (Vite, port 5173).
- **Commit messages:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`).
- **TDD:** Every primitive and tab starts with a failing test.
- **Token references:** Use semantic tokens (`bg-chrome`, `text-page`, `bg-accent`, etc.) — never raw hex or `stone-*`.
- **Branch:** Spec A merged into `main` at `b0cf8f2`. Phase 1+ commits land on top of `main` (or on a Spec B feature branch — caller's choice; tasks below assume direct commits, adjust if branching).

---

# Phase 1 — Primitives & Hook

## Task 1.1: `ChromeButton` primitive

**Files:**
- Create: `src/atlas-ui/primitives/ChromeButton.tsx`
- Create: `src/atlas-ui/primitives/__tests__/ChromeButton.test.tsx`
- Modify: `src/atlas-ui/primitives/index.ts` (add export)

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/primitives/__tests__/ChromeButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Bug } from 'lucide-react';
import { ChromeButton } from '../ChromeButton';

describe('ChromeButton', () => {
  it('renders children', () => {
    render(<ChromeButton>Debug</ChromeButton>);
    expect(screen.getByRole('button', { name: 'Debug' })).toBeInTheDocument();
  });

  it('renders leadingIcon when provided', () => {
    const { container } = render(<ChromeButton leadingIcon={Bug}>Debug</ChromeButton>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies pressed=false styling by default', () => {
    render(<ChromeButton>Debug</ChromeButton>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn.className).not.toContain('bg-accent');
  });

  it('applies pressed=true styling and aria', () => {
    render(<ChromeButton pressed>Debug</ChromeButton>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn.className).toContain('bg-accent');
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<ChromeButton onClick={onClick}>Debug</ChromeButton>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to size=md (h-7)', () => {
    render(<ChromeButton>Debug</ChromeButton>);
    expect(screen.getByRole('button').className).toContain('h-7');
  });

  it('applies size=sm (h-6)', () => {
    render(<ChromeButton size="sm">Debug</ChromeButton>);
    expect(screen.getByRole('button').className).toContain('h-6');
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/primitives/__tests__/ChromeButton.test.tsx` → FAIL (module not found).

- [ ] **Step 3: Implement**

Create `src/atlas-ui/primitives/ChromeButton.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type ChromeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  pressed?: boolean;
  leadingIcon?: LucideIcon;
  children?: ReactNode;
  size?: 'sm' | 'md';
};

const BASE =
  'inline-flex items-center gap-1.5 rounded-md font-medium leading-none transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/50';

const SIZE = {
  sm: 'h-6 px-2 text-[11px]',
  md: 'h-7 px-2.5 text-xs',
} as const;

const ICON_SIZE = { sm: 12, md: 14 } as const;

const OFF =
  'bg-white/[0.08] text-divider hover:bg-white/[0.14] hover:text-page';
const ON = 'bg-accent text-page hover:bg-accent-hover';

export function ChromeButton({
  pressed = false,
  leadingIcon,
  children,
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ChromeButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={[BASE, SIZE[size], pressed ? ON : OFF, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {leadingIcon ? <Icon icon={leadingIcon} size={ICON_SIZE[size]} /> : null}
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Export from barrel**

Edit `src/atlas-ui/primitives/index.ts` — add at top of exports (alphabetical):

```ts
export { ChromeButton } from './ChromeButton';
export type { ChromeButtonProps } from './ChromeButton';
```

- [ ] **Step 5: Tests pass**

`npx vitest run src/atlas-ui/primitives/__tests__/ChromeButton.test.tsx` → 7 passed.
`npm test` → 223+ passing (no regression).

- [ ] **Step 6: Commit**

```
git add src/atlas-ui/primitives/ChromeButton.tsx src/atlas-ui/primitives/__tests__/ChromeButton.test.tsx src/atlas-ui/primitives/index.ts
git commit -m "feat(primitives): add ChromeButton for dark top-bar context"
```

---

## Task 1.2: `InfoBanner` primitive

**Files:**
- Create: `src/atlas-ui/primitives/InfoBanner.tsx`
- Create: `src/atlas-ui/primitives/__tests__/InfoBanner.test.tsx`
- Modify: `src/atlas-ui/primitives/index.ts`

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/primitives/__tests__/InfoBanner.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Info } from 'lucide-react';
import { InfoBanner } from '../InfoBanner';

describe('InfoBanner', () => {
  it('renders message', () => {
    render(<InfoBanner message="点击图片任意位置添加评论" />);
    expect(screen.getByText('点击图片任意位置添加评论')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(<InfoBanner message="hi" icon={Info} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders dismiss button when onDismiss provided', async () => {
    const onDismiss = vi.fn();
    render(<InfoBanner message="hi" onDismiss={onDismiss} />);
    const btn = screen.getByRole('button', { name: /关闭/ });
    await userEvent.click(btn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('omits dismiss button when onDismiss is undefined', () => {
    render(<InfoBanner message="hi" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies info variant (default) with surface-2 bg', () => {
    const { container } = render(<InfoBanner message="hi" />);
    expect(container.firstChild).toHaveAttribute('data-banner-variant', 'info');
  });

  it('applies accent variant', () => {
    const { container } = render(<InfoBanner message="hi" variant="accent" />);
    expect(container.firstChild).toHaveAttribute('data-banner-variant', 'accent');
  });

  it('has role=status', () => {
    render(<InfoBanner message="hi" />);
    expect(screen.getByRole('status')).toHaveTextContent('hi');
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/primitives/__tests__/InfoBanner.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-ui/primitives/InfoBanner.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { Icon } from './Icon';

export type InfoBannerVariant = 'info' | 'accent';

export type InfoBannerProps = {
  message: ReactNode;
  icon?: LucideIcon;
  onDismiss?: () => void;
  variant?: InfoBannerVariant;
  className?: string;
};

const VARIANT_BG: Record<InfoBannerVariant, string> = {
  info: 'bg-surface-2 text-text-2 border-border',
  accent: 'bg-accent-bg-faint text-accent-strong border-accent-bg-2',
};

export function InfoBanner({
  message,
  icon,
  onDismiss,
  variant = 'info',
  className,
}: InfoBannerProps) {
  return (
    <div
      role="status"
      data-banner-variant={variant}
      className={[
        'flex items-center gap-2 px-3 h-8 border-b text-[12px] leading-none',
        VARIANT_BG[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? <Icon icon={icon} size={14} /> : null}
      <span className="flex-1">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="关闭通知"
          className="text-text-muted hover:text-text p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40"
        >
          <Icon icon={X} size={12} />
        </button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Export**

Edit `src/atlas-ui/primitives/index.ts` — append:

```ts
export { InfoBanner } from './InfoBanner';
export type { InfoBannerProps, InfoBannerVariant } from './InfoBanner';
```

- [ ] **Step 5: Tests pass**

`npx vitest run src/atlas-ui/primitives/__tests__/InfoBanner.test.tsx` → 7 passed. `npm test` → green.

- [ ] **Step 6: Commit**

```
git add src/atlas-ui/primitives/InfoBanner.tsx src/atlas-ui/primitives/__tests__/InfoBanner.test.tsx src/atlas-ui/primitives/index.ts
git commit -m "feat(primitives): add InfoBanner for horizontal status messages"
```

---

## Task 1.3: `useRailState` hook with localStorage

**Files:**
- Create: `src/atlas-core/reader/useRailState.ts`
- Create: `src/atlas-core/reader/__tests__/useRailState.test.ts`
- Modify: `src/atlas-core/reader/index.ts`
- Modify: `src/atlas-ui/primitives/motion.ts` (add `railWidth`, `tabFade`, `bannerSlide`)

- [ ] **Step 1: Failing test**

Create `src/atlas-core/reader/__tests__/useRailState.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRailState } from '../useRailState';

describe('useRailState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initial state: open=true, tab=comments, width=clamped default', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    expect(result.current.open).toBe(true);
    expect(result.current.tab).toBe('comments');
    expect(result.current.width).toBeGreaterThanOrEqual(280);
    expect(result.current.width).toBeLessThanOrEqual(480);
  });

  it('setTab updates active tab', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.setTab('notes'));
    expect(result.current.tab).toBe('notes');
  });

  it('toggleTab(currentTab) collapses the rail', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.setTab('comments'));
    act(() => result.current.toggleTab('comments'));
    expect(result.current.open).toBe(false);
  });

  it('toggleTab(differentTab) switches and opens', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.collapse());
    act(() => result.current.toggleTab('notes'));
    expect(result.current.open).toBe(true);
    expect(result.current.tab).toBe('notes');
  });

  it('collapse() sets open to false', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.collapse());
    expect(result.current.open).toBe(false);
  });

  it('expand(tab) sets open to true and changes tab', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.collapse());
    act(() => result.current.expand('toc'));
    expect(result.current.open).toBe(true);
    expect(result.current.tab).toBe('toc');
  });

  it('expand() without arg keeps existing tab', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.setTab('notes'));
    act(() => result.current.collapse());
    act(() => result.current.expand());
    expect(result.current.open).toBe(true);
    expect(result.current.tab).toBe('notes');
  });

  it('persists state to localStorage on change', () => {
    const { result } = renderHook(() => useRailState('book-a'));
    act(() => result.current.setTab('notes'));
    act(() => result.current.collapse());
    const stored = JSON.parse(localStorage.getItem('atlas-rail-book-a') ?? '{}');
    expect(stored.tab).toBe('notes');
    expect(stored.open).toBe(false);
  });

  it('restores state from localStorage on mount', () => {
    localStorage.setItem(
      'atlas-rail-book-a',
      JSON.stringify({ open: false, tab: 'toc', width: 360 }),
    );
    const { result } = renderHook(() => useRailState('book-a'));
    expect(result.current.open).toBe(false);
    expect(result.current.tab).toBe('toc');
    expect(result.current.width).toBe(360);
  });

  it('ignores invalid persisted JSON', () => {
    localStorage.setItem('atlas-rail-book-a', 'not-json');
    const { result } = renderHook(() => useRailState('book-a'));
    expect(result.current.open).toBe(true);
    expect(result.current.tab).toBe('comments');
  });

  it('separate keys per book id', () => {
    const { result: a } = renderHook(() => useRailState('book-a'));
    act(() => a.current.setTab('notes'));
    const { result: b } = renderHook(() => useRailState('book-b'));
    expect(b.current.tab).toBe('comments');
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-core/reader/__tests__/useRailState.test.ts` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-core/reader/useRailState.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';

export type RailTab = 'comments' | 'notes' | 'toc';

export type RailState = {
  open: boolean;
  tab: RailTab;
  width: number;
  setOpen: (open: boolean) => void;
  setTab: (tab: RailTab) => void;
  toggleTab: (tab: RailTab) => void;
  collapse: () => void;
  expand: (toTab?: RailTab) => void;
};

const DEFAULT_WIDTH_RATIO = 0.32;
const MIN_WIDTH = 280;
const MAX_WIDTH = 480;
const VALID_TABS: readonly RailTab[] = ['comments', 'notes', 'toc'];

function defaultWidth(): number {
  if (typeof window === 'undefined') return MIN_WIDTH;
  return clamp(Math.round(window.innerWidth * DEFAULT_WIDTH_RATIO));
}

function clamp(n: number): number {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, n));
}

function storageKey(bookId: string): string {
  return `atlas-rail-${bookId}`;
}

type Stored = { open?: boolean; tab?: string; width?: number };

function loadStored(bookId: string): Stored {
  try {
    const raw = localStorage.getItem(storageKey(bookId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed != null ? parsed : {};
  } catch {
    return {};
  }
}

function isValidTab(t: unknown): t is RailTab {
  return typeof t === 'string' && VALID_TABS.includes(t as RailTab);
}

export function useRailState(bookId: string): RailState {
  const [open, setOpenInternal] = useState<boolean>(true);
  const [tab, setTabInternal] = useState<RailTab>('comments');
  const [width, setWidth] = useState<number>(defaultWidth);

  // Hydrate from localStorage on mount and when book changes
  useEffect(() => {
    const stored = loadStored(bookId);
    if (typeof stored.open === 'boolean') setOpenInternal(stored.open);
    if (isValidTab(stored.tab)) setTabInternal(stored.tab);
    if (typeof stored.width === 'number') setWidth(clamp(stored.width));
  }, [bookId]);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey(bookId),
        JSON.stringify({ open, tab, width }),
      );
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [bookId, open, tab, width]);

  const setOpen = useCallback((next: boolean) => setOpenInternal(next), []);
  const setTab = useCallback((next: RailTab) => setTabInternal(next), []);
  const collapse = useCallback(() => setOpenInternal(false), []);
  const expand = useCallback((toTab?: RailTab) => {
    setOpenInternal(true);
    if (toTab) setTabInternal(toTab);
  }, []);
  const toggleTab = useCallback(
    (next: RailTab) => {
      setOpenInternal((curOpen) => {
        // If currently open AND clicking same tab → close
        if (curOpen && tab === next) return false;
        // Otherwise open
        return true;
      });
      setTabInternal(next);
    },
    [tab],
  );

  return { open, tab, width, setOpen, setTab, toggleTab, collapse, expand };
}
```

- [ ] **Step 4: Export from reader barrel**

Edit `src/atlas-core/reader/index.ts` — add:

```ts
export { useRailState } from './useRailState';
export type { RailTab, RailState } from './useRailState';
```

- [ ] **Step 5: Add motion presets**

Edit `src/atlas-ui/primitives/motion.ts` — REPLACE the entire MOTION object with:

```ts
import type { Transition } from 'framer-motion';

export const MOTION = {
  drawerSpring: { type: 'spring', stiffness: 320, damping: 30 } satisfies Transition,
  drawerExit: { duration: 0.18, ease: 'easeIn' } satisfies Transition,
  pageFade: { duration: 0.18, ease: 'easeOut' } satisfies Transition,
  pinPop: { type: 'spring', stiffness: 500, damping: 22 } satisfies Transition,
  hover: { duration: 0.12, ease: 'easeOut' } satisfies Transition,
  // === Spec B additions ===
  railWidth: { type: 'spring', stiffness: 320, damping: 32 } satisfies Transition,
  tabFade: { duration: 0.12, ease: 'easeOut' } satisfies Transition,
  bannerSlide: { duration: 0.18, ease: 'easeOut' } satisfies Transition,
} as const;
```

- [ ] **Step 6: Tests pass**

`npx vitest run src/atlas-core/reader/__tests__/useRailState.test.ts` → 11 passed.
`npm test` → green.

- [ ] **Step 7: Commit**

```
git add src/atlas-core/reader/useRailState.ts src/atlas-core/reader/__tests__/useRailState.test.ts src/atlas-core/reader/index.ts src/atlas-ui/primitives/motion.ts
git commit -m "feat(reader): add useRailState hook with localStorage persistence and motion presets"
```

---

# Phase 2 — Tab Content Extraction

We extract reusable subcomponents from `CommentPanel` first, then build the three tab panes. The old `CommentPanel.tsx` and `NotesDrawer.tsx` files stay alive until Phase 4 removes them — this keeps each commit working.

## Task 2.1: Extract `MessageItem` from `CommentPanel`

**Files:**
- Create: `src/atlas-ui/comments/MessageItem.tsx`
- Create: `src/atlas-ui/comments/__tests__/MessageItem.test.tsx`
- Modify: `src/atlas-ui/comments/CommentPanel.tsx` (delete local `MessageItem`, import from new file)

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/comments/__tests__/MessageItem.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MessageItem } from '../MessageItem';
import type { CommentMessage } from '../../../atlas-core/types/comments';

const msg: CommentMessage = {
  messageId: 'm1',
  authorId: 'alice',
  body: [{ type: 'text', value: '需要确认 USt-IdNr 校验' }],
  createdAt: '2026-05-16T08:00:00Z',
};

describe('MessageItem', () => {
  it('renders message text and authorId', () => {
    render(<MessageItem msg={msg} threadId="t1" onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('需要确认 USt-IdNr 校验')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('clicking edit reveals textarea', async () => {
    render(<MessageItem msg={msg} threadId="t1" onEdit={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /编辑/ }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('save calls onEdit with trimmed text', async () => {
    const onEdit = vi.fn();
    render(<MessageItem msg={msg} threadId="t1" onEdit={onEdit} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /编辑/ }));
    const ta = screen.getByRole('textbox');
    await userEvent.clear(ta);
    await userEvent.type(ta, '  改后  ');
    await userEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(onEdit).toHaveBeenCalledWith('t1', 'm1', '改后');
  });

  it('delete triggers onDelete', async () => {
    const onDelete = vi.fn();
    render(<MessageItem msg={msg} threadId="t1" onEdit={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /删除消息/ }));
    expect(onDelete).toHaveBeenCalledWith('t1', 'm1');
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/comments/__tests__/MessageItem.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-ui/comments/MessageItem.tsx`:

```tsx
import { useState } from 'react';
import { Edit2, Trash2, Check } from 'lucide-react';
import type { CommentMessage } from '../../atlas-core/types/comments';
import { Button } from '../primitives';

export type MessageItemProps = {
  msg: CommentMessage;
  threadId: string;
  onEdit: (threadId: string, messageId: string, text: string) => void;
  onDelete: (threadId: string, messageId: string) => void;
};

function bodyText(msg: CommentMessage): string {
  return msg.body
    .filter((n) => n.type === 'text')
    .map((n) => n.value)
    .join('');
}

export function MessageItem({ msg, threadId, onEdit, onDelete }: MessageItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(() => bodyText(msg));

  function handleSave() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onEdit(threadId, msg.messageId, trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-surface-2 rounded-md p-2 border border-border">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full bg-page text-text text-sm rounded p-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-accent-2/40"
          rows={3}
        />
        <div className="flex justify-end gap-1 mt-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>取消</Button>
          <Button variant="primary" size="sm" leadingIcon={Check} onClick={handleSave} disabled={!editText.trim()}>
            保存
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 rounded-md p-2 group border border-border">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-2">{msg.authorId}</span>
          <span className="text-[11px] text-text-muted">
            {new Date(msg.createdAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leadingIcon={Edit2}
            aria-label="编辑消息"
            onClick={() => {
              setEditText(bodyText(msg));
              setEditing(true);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leadingIcon={Trash2}
            aria-label="删除消息"
            onClick={() => onDelete(threadId, msg.messageId)}
          />
        </div>
      </div>
      <p className="text-text text-sm">{bodyText(msg)}</p>
    </div>
  );
}
```

- [ ] **Step 4: Refactor CommentPanel to import MessageItem**

Open `src/atlas-ui/comments/CommentPanel.tsx`. Replace the **local `function MessageItem({...})` declaration block (lines ~35-120)** with this single import at the top:

```tsx
import { MessageItem } from './MessageItem';
```

Remove the original `MessageItem` function definition entirely. All other code (CommentPanel function itself) stays the same.

- [ ] **Step 5: Tests pass**

`npx vitest run src/atlas-ui/comments/__tests__/MessageItem.test.tsx` → 4 passed.
`npm test` → green. (Existing CommentPanel tests should still pass since behavior is unchanged.)

- [ ] **Step 6: Commit**

```
git add src/atlas-ui/comments/MessageItem.tsx src/atlas-ui/comments/__tests__/MessageItem.test.tsx src/atlas-ui/comments/CommentPanel.tsx
git commit -m "refactor(comments): extract MessageItem from CommentPanel"
```

---

## Task 2.2: Extract `ThreadList` from `CommentPanel`

**Files:**
- Create: `src/atlas-ui/comments/ThreadList.tsx`
- Create: `src/atlas-ui/comments/__tests__/ThreadList.test.tsx`
- Modify: `src/atlas-ui/comments/CommentPanel.tsx` (use new ThreadList)

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/comments/__tests__/ThreadList.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ThreadList } from '../ThreadList';
import type { CommentThread } from '../../../atlas-core/types/comments';

function buildThread(id: string, status: CommentThread['status'] = 'open'): CommentThread {
  return {
    threadId: id,
    bookId: 'b',
    pageId: 'p',
    anchor: { kind: 'imagePoint', pageId: 'p', imageAssetId: 'img', imageVersion: 'v1', x: 50, y: 50 },
    status,
    category: 'question',
    messages: [
      { messageId: 'm1', authorId: 'a', body: [{ type: 'text', value: `body-${id}` }], createdAt: new Date().toISOString() },
    ],
    createdBy: 'a',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const handlers = {
  onSelectThread: vi.fn(),
  onHoverThread: vi.fn(),
  onAddMessage: vi.fn(),
  onResolve: vi.fn(),
  onReopen: vi.fn(),
  onDeleteThread: vi.fn(),
  onEditMessage: vi.fn(),
  onDeleteMessage: vi.fn(),
};

describe('ThreadList', () => {
  it('renders each thread', () => {
    const threads = [buildThread('t1'), buildThread('t2')];
    render(<ThreadList threads={threads} selectedThreadId={null} highlightedThreadId={null} {...handlers} />);
    expect(screen.getByText('body-t1')).toBeInTheDocument();
    expect(screen.getByText('body-t2')).toBeInTheDocument();
  });

  it('renders EmptyState when no threads', () => {
    render(<ThreadList threads={[]} selectedThreadId={null} highlightedThreadId={null} {...handlers} />);
    expect(screen.getByText('这一页还没有评论')).toBeInTheDocument();
  });

  it('clicking thread row calls onSelectThread', async () => {
    const onSelectThread = vi.fn();
    render(<ThreadList threads={[buildThread('t1')]} selectedThreadId={null} highlightedThreadId={null} {...handlers} onSelectThread={onSelectThread} />);
    await userEvent.click(screen.getByText('body-t1'));
    expect(onSelectThread).toHaveBeenCalledWith('t1');
  });

  it('highlight applies accent-bg-faint bg when highlightedThreadId matches', () => {
    const { container } = render(<ThreadList threads={[buildThread('t1')]} selectedThreadId={null} highlightedThreadId="t1" {...handlers} />);
    expect(container.querySelector('[data-thread-highlighted="true"]')).not.toBeNull();
  });

  it('expanded thread (selected) shows resolve button when open', () => {
    render(<ThreadList threads={[buildThread('t1')]} selectedThreadId="t1" highlightedThreadId={null} {...handlers} />);
    expect(screen.getByRole('button', { name: /标记已解决/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/comments/__tests__/ThreadList.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-ui/comments/ThreadList.tsx`:

```tsx
import { useState } from 'react';
import { MessageSquare, Check, RotateCcw, Trash2 } from 'lucide-react';
import type { CommentThread } from '../../atlas-core/types/comments';
import { CommentComposer } from './CommentComposer';
import { MessageItem } from './MessageItem';
import { Button, EmptyState } from '../primitives';

const CATEGORY_LABELS: Record<string, string> = {
  question: '问题',
  correction: '纠正',
  'tax-risk': '税务风险',
  'legal-source': '法规来源',
  design: '设计',
  translation: '翻译',
  todo: '待办',
  general: '一般',
};

export type ThreadListProps = {
  threads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onEditMessage: (threadId: string, messageId: string, text: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;
};

export function ThreadList({
  threads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onAddMessage,
  onResolve,
  onReopen,
  onDeleteThread,
  onEditMessage,
  onDeleteMessage,
}: ThreadListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="这一页还没有评论"
        description="开启评论模式后,点击图片即可添加。"
      />
    );
  }

  return (
    <div>
      {threads.map((thread) => {
        const isSelected = selectedThreadId === thread.threadId;
        const isOpen = thread.status === 'open';
        const highlighted = highlightedThreadId === thread.threadId;
        const containerClass = highlighted
          ? 'bg-accent-bg-faint border-l-2 border-l-accent'
          : isSelected
          ? 'bg-surface-2'
          : '';

        return (
          <div
            key={thread.threadId}
            data-thread-highlighted={highlighted ? 'true' : 'false'}
            className={`border-b border-border transition-colors ${containerClass}`}
          >
            <button
              type="button"
              onClick={() => onSelectThread(isSelected ? null : thread.threadId)}
              onMouseEnter={() => onHoverThread(thread.threadId)}
              onMouseLeave={() => onHoverThread(null)}
              className="w-full text-left p-3 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full ${isOpen ? 'bg-accent' : 'bg-accent-soft'}`}
                  aria-hidden="true"
                />
                <span className="text-[11px] text-text-2 font-medium">
                  {CATEGORY_LABELS[thread.category] ?? thread.category}
                </span>
                {thread.priority === 'high' && (
                  <span className="text-[11px] text-accent-strong font-bold">!!</span>
                )}
              </div>
              {thread.messages.length > 0 && (
                <p className="text-text text-sm line-clamp-2">
                  {thread.messages[thread.messages.length - 1].body
                    .filter((n) => n.type === 'text')
                    .map((n) => n.value)
                    .join('')}
                </p>
              )}
              <p className="text-text-muted text-xs mt-1">
                {thread.messages.length} 条消息 · {isOpen ? '未解决' : '已解决'}
              </p>
            </button>

            {isSelected && (
              <div className="px-3 pb-2 space-y-2">
                {thread.messages.map((msg) => (
                  <MessageItem
                    key={msg.messageId}
                    msg={msg}
                    threadId={thread.threadId}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                  />
                ))}

                <div className="flex items-center gap-2 flex-wrap">
                  {isOpen ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      leadingIcon={Check}
                      onClick={() => onResolve(thread.threadId)}
                    >
                      标记已解决
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      leadingIcon={RotateCcw}
                      onClick={() => onReopen(thread.threadId)}
                    >
                      重新打开
                    </Button>
                  )}

                  {confirmDelete === thread.threadId ? (
                    <>
                      <span className="text-[11px] text-text-2">确认删除?</span>
                      <Button
                        variant="danger-confirm"
                        size="sm"
                        onClick={() => {
                          onDeleteThread(thread.threadId);
                          setConfirmDelete(null);
                        }}
                      >
                        是
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                        否
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="danger-default"
                      size="sm"
                      leadingIcon={Trash2}
                      onClick={() => setConfirmDelete(thread.threadId)}
                    >
                      删除
                    </Button>
                  )}
                </div>

                {isOpen && (
                  <CommentComposer
                    onSubmit={(text) => onAddMessage(thread.threadId, text)}
                    onCancel={() => onSelectThread(null)}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Refactor CommentPanel to use ThreadList**

Open `src/atlas-ui/comments/CommentPanel.tsx`. Replace the **entire body of the `.flex-1 overflow-y-auto` div** (the `threads.map(...)` block and the empty-state branch) with:

```tsx
<div className="flex-1 overflow-y-auto">
  <ThreadList
    threads={threads}
    selectedThreadId={selectedThreadId}
    highlightedThreadId={highlightedThreadId}
    onSelectThread={onSelectThread}
    onHoverThread={onHoverThread}
    onAddMessage={onAddMessage}
    onResolve={onResolve}
    onReopen={onReopen}
    onDeleteThread={onDeleteThread}
    onEditMessage={onEditMessage}
    onDeleteMessage={onDeleteMessage}
  />
</div>
```

Add at top: `import { ThreadList } from './ThreadList';`.
Remove unused imports (CATEGORY_LABELS const, the `confirmDelete` useState, Button/MessageItem/lucide icons only used inside removed code, EmptyState).

- [ ] **Step 5: Tests pass**

`npx vitest run src/atlas-ui/comments/__tests__/ThreadList.test.tsx` → 5 passed. `npm test` → green.

- [ ] **Step 6: Commit**

```
git add src/atlas-ui/comments/ThreadList.tsx src/atlas-ui/comments/__tests__/ThreadList.test.tsx src/atlas-ui/comments/CommentPanel.tsx
git commit -m "refactor(comments): extract ThreadList from CommentPanel"
```

---

## Task 2.3: `CommentsTab` (tab pane wrapping ThreadList)

**Files:**
- Create: `src/atlas-ui/rail/tabs/CommentsTab.tsx`
- Create: `src/atlas-ui/rail/__tests__/CommentsTab.test.tsx`

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/rail/__tests__/CommentsTab.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommentsTab } from '../tabs/CommentsTab';
import type { CommentThread } from '../../../atlas-core/types/comments';

function thread(id: string): CommentThread {
  return {
    threadId: id, bookId: 'b', pageId: 'p',
    anchor: { kind: 'imagePoint', pageId: 'p', imageAssetId: 'i', imageVersion: 'v', x: 0, y: 0 },
    status: 'open', category: 'general',
    messages: [{ messageId: 'm', authorId: 'a', body: [{ type: 'text', value: `text-${id}` }], createdAt: new Date().toISOString() }],
    createdBy: 'a', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

const noop = vi.fn();
const handlers = {
  onSelectThread: noop, onHoverThread: noop, onAddMessage: noop,
  onResolve: noop, onReopen: noop, onDeleteThread: noop,
  onEditMessage: noop, onDeleteMessage: noop,
};

describe('CommentsTab', () => {
  it('renders the ThreadList with provided threads', () => {
    render(
      <CommentsTab threads={[thread('t1')]} selectedThreadId={null} highlightedThreadId={null} {...handlers} />,
    );
    expect(screen.getByText('text-t1')).toBeInTheDocument();
  });

  it('renders empty state when no threads', () => {
    render(<CommentsTab threads={[]} selectedThreadId={null} highlightedThreadId={null} {...handlers} />);
    expect(screen.getByText('这一页还没有评论')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/rail/__tests__/CommentsTab.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-ui/rail/tabs/CommentsTab.tsx`:

```tsx
import type { CommentThread } from '../../../atlas-core/types/comments';
import { ThreadList } from '../../comments/ThreadList';

export type CommentsTabProps = {
  threads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onEditMessage: (threadId: string, messageId: string, text: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;
};

export function CommentsTab(props: CommentsTabProps) {
  return (
    <div className="h-full overflow-y-auto">
      <ThreadList {...props} />
    </div>
  );
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-ui/rail/__tests__/CommentsTab.test.tsx` → 2 passed. `npm test` → green.

- [ ] **Step 5: Commit**

```
git add src/atlas-ui/rail/tabs/CommentsTab.tsx src/atlas-ui/rail/__tests__/CommentsTab.test.tsx
git commit -m "feat(rail): add CommentsTab pane"
```

---

## Task 2.4: `NotesTab`

**Files:**
- Create: `src/atlas-ui/rail/tabs/NotesTab.tsx`
- Create: `src/atlas-ui/rail/__tests__/NotesTab.test.tsx`

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/rail/__tests__/NotesTab.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotesTab } from '../tabs/NotesTab';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { AtlasNote } from '../../../atlas-core/types/notes';

function makeRegistry(notes: AtlasNote[]): BookRegistry {
  const map = new Map<string, AtlasNote>();
  for (const n of notes) map.set(n.noteId, n);
  return {
    manifest: { slug: 'demo', bookId: 'demo', readingOrder: [] } as unknown as BookRegistry['manifest'],
    notes: map,
  } as unknown as BookRegistry;
}

const note1: AtlasNote = {
  noteId: 'n1',
  noteType: 'supplement',
  visibility: 'public',
  title: { 'zh-CN': '补充材料' },
  body: [{ type: 'paragraph', text: [{ type: 'text', value: '说明文本' }] }],
} as unknown as AtlasNote;

describe('NotesTab', () => {
  it('renders notes', () => {
    render(<NotesTab noteIds={['n1']} registry={makeRegistry([note1])} />);
    expect(screen.getByText('补充材料')).toBeInTheDocument();
  });

  it('renders empty state when no notes', () => {
    render(<NotesTab noteIds={[]} registry={makeRegistry([])} />);
    expect(screen.getByText('这一页还没有笔记')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/rail/__tests__/NotesTab.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-ui/rail/tabs/NotesTab.tsx`:

```tsx
import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { NoteId } from '../../../atlas-core/types/primitives';
import { RichTextRenderer } from '../../renderers/RichTextRenderer';
import { Chip, EmptyState } from '../../primitives';

const NOTE_TYPE_LABELS: Record<string, string> = {
  'speaker-note': '演讲备注',
  supplement: '补充材料',
  'legal-background': '法规背景',
  example: '示例',
  'authoring-note': '创作说明',
  'image-prompt-note': '图片生成提示',
  'review-note': '审阅备注',
};

export type NotesTabProps = {
  noteIds: NoteId[];
  registry: BookRegistry;
};

export function NotesTab({ noteIds, registry }: NotesTabProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const notes = noteIds
    .map((id) => registry.notes.get(id))
    .filter((n): n is NonNullable<typeof n> => n != null)
    .filter((n) => n.visibility !== 'editor-only')
    .filter((n) => !filter || n.noteType === filter);

  const availableTypes = new Set(notes.map((n) => n.noteType));

  return (
    <div className="h-full flex flex-col">
      {availableTypes.size > 1 && (
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              !filter ? 'bg-accent-bg text-accent' : 'bg-surface-2 text-text-2 hover:text-text'
            }`}
          >
            全部
          </button>
          {Array.from(availableTypes).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                filter === type ? 'bg-accent-bg text-accent' : 'bg-surface-2 text-text-2 hover:text-text'
              }`}
            >
              {NOTE_TYPE_LABELS[type] ?? type}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notes.map((note) => (
          <div key={note.noteId} className="bg-surface-2 rounded-md p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] text-text-2">
                {NOTE_TYPE_LABELS[note.noteType] ?? note.noteType}
              </span>
              {note.tags?.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>
            {note.title?.['zh-CN'] && (
              <h3 className="text-text text-sm font-semibold mb-1">{note.title['zh-CN']}</h3>
            )}
            <div className="text-text-2 text-sm leading-relaxed">
              <RichTextRenderer
                nodes={note.body}
                registry={registry}
                bookSlug={registry.manifest.slug}
              />
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <EmptyState
            icon={FileText}
            title="这一页还没有笔记"
            description="切换章节,或查看其他页面。"
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-ui/rail/__tests__/NotesTab.test.tsx` → 2 passed. `npm test` → green.

- [ ] **Step 5: Commit**

```
git add src/atlas-ui/rail/tabs/NotesTab.tsx src/atlas-ui/rail/__tests__/NotesTab.test.tsx
git commit -m "feat(rail): add NotesTab pane (filter chips preserved from NotesDrawer)"
```

---

## Task 2.5: `TocTab` (basic version)

**Files:**
- Create: `src/atlas-ui/rail/tabs/TocTab.tsx`
- Create: `src/atlas-ui/rail/__tests__/TocTab.test.tsx`

This is the **basic version**: list of pages from `readingOrder`, click → navigate, current page highlighted. Spec C adds search/anchors/folding.

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/rail/__tests__/TocTab.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TocTab } from '../tabs/TocTab';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { PageManifest } from '../../../atlas-core/types/page';

function page(id: string, num: number, title: string): PageManifest {
  return { pageId: id, type: 'imageOverlay', pageNumber: num, title: { 'zh-CN': title }, layout: { mode: 'single' } } as unknown as PageManifest;
}

function makeRegistry(): BookRegistry {
  return {
    manifest: {
      slug: 'demo',
      bookId: 'demo',
      readingOrder: ['p1', 'p2', 'p3'],
    } as unknown as BookRegistry['manifest'],
    getPage: (id: string) => {
      const map: Record<string, PageManifest> = {
        p1: page('p1', 1, '封面'),
        p2: page('p2', 2, '导论'),
        p3: page('p3', 3, '三角贸易'),
      };
      return map[id];
    },
  } as unknown as BookRegistry;
}

describe('TocTab', () => {
  it('renders all pages from readingOrder', () => {
    render(
      <MemoryRouter>
        <TocTab registry={makeRegistry()} currentPageId="p2" onNavigate={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('封面')).toBeInTheDocument();
    expect(screen.getByText('导论')).toBeInTheDocument();
    expect(screen.getByText('三角贸易')).toBeInTheDocument();
  });

  it('highlights the current page', () => {
    render(
      <MemoryRouter>
        <TocTab registry={makeRegistry()} currentPageId="p2" onNavigate={vi.fn()} />
      </MemoryRouter>,
    );
    const current = screen.getByText('导论').closest('[data-toc-current]');
    expect(current).toHaveAttribute('data-toc-current', 'true');
  });

  it('clicking item calls onNavigate with pageId', async () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <TocTab registry={makeRegistry()} currentPageId="p1" onNavigate={onNavigate} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByText('三角贸易'));
    expect(onNavigate).toHaveBeenCalledWith('p3');
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/rail/__tests__/TocTab.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-ui/rail/tabs/TocTab.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { List } from 'lucide-react';
import type { BookRegistry } from '../../../atlas-core/registry';
import { EmptyState } from '../../primitives';

export type TocTabProps = {
  registry: BookRegistry;
  currentPageId: string | null;
  onNavigate: (pageId: string) => void;
};

export function TocTab({ registry, currentPageId, onNavigate }: TocTabProps) {
  const currentRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentPageId]);

  const order = registry.manifest.readingOrder ?? [];

  if (order.length === 0) {
    return <EmptyState icon={List} title="暂无目录" description="此书未配置 readingOrder。" />;
  }

  return (
    <div className="h-full overflow-y-auto py-2">
      <ol className="space-y-px">
        {order.map((pageId, i) => {
          const p = registry.getPage(pageId);
          if (!p) return null;
          const current = pageId === currentPageId;
          const title = p.title?.['zh-CN'] ?? pageId;
          return (
            <li key={pageId}>
              <button
                ref={current ? currentRef : null}
                type="button"
                data-toc-current={current ? 'true' : 'false'}
                onClick={() => onNavigate(pageId)}
                className={[
                  'w-full text-left flex items-baseline gap-3 px-4 py-2 text-sm transition-colors',
                  current
                    ? 'bg-accent-bg text-accent font-medium'
                    : 'text-text hover:bg-surface-2',
                ].join(' ')}
              >
                <span className="text-text-muted text-xs w-6 text-right shrink-0 tabular-nums">
                  {p.pageNumber ?? i + 1}
                </span>
                <span className="flex-1 truncate">{title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-ui/rail/__tests__/TocTab.test.tsx` → 3 passed. `npm test` → green.

- [ ] **Step 5: Commit**

```
git add src/atlas-ui/rail/tabs/TocTab.tsx src/atlas-ui/rail/__tests__/TocTab.test.tsx
git commit -m "feat(rail): add TocTab basic listing with current-page highlight"
```

---

# Phase 3 — Rail Composition

## Task 3.1: `RailHeader`

**Files:**
- Create: `src/atlas-ui/rail/RailHeader.tsx`
- Create: `src/atlas-ui/rail/__tests__/RailHeader.test.tsx`

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/rail/__tests__/RailHeader.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RailHeader } from '../RailHeader';

const baseProps = {
  activeTab: 'comments' as const,
  commentCount: 3,
  noteCount: 2,
  onTabChange: vi.fn(),
  onPlusClick: vi.fn(),
  onCollapse: vi.fn(),
};

describe('RailHeader', () => {
  it('renders all three tabs', () => {
    render(<RailHeader {...baseProps} />);
    expect(screen.getByRole('tab', { name: /评论/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /笔记/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /目录/ })).toBeInTheDocument();
  });

  it('shows comment count badge', () => {
    render(<RailHeader {...baseProps} commentCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marks active tab via aria-selected', () => {
    render(<RailHeader {...baseProps} activeTab="notes" />);
    expect(screen.getByRole('tab', { name: /笔记/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /评论/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking tab calls onTabChange', async () => {
    const onTabChange = vi.fn();
    render(<RailHeader {...baseProps} onTabChange={onTabChange} />);
    await userEvent.click(screen.getByRole('tab', { name: /笔记/ }));
    expect(onTabChange).toHaveBeenCalledWith('notes');
  });

  it('plus button only on comments tab and calls onPlusClick', async () => {
    const onPlusClick = vi.fn();
    const { rerender } = render(<RailHeader {...baseProps} activeTab="comments" onPlusClick={onPlusClick} />);
    const plus = screen.getByRole('button', { name: /新增评论/ });
    await userEvent.click(plus);
    expect(onPlusClick).toHaveBeenCalledTimes(1);

    rerender(<RailHeader {...baseProps} activeTab="notes" onPlusClick={onPlusClick} />);
    expect(screen.queryByRole('button', { name: /新增评论/ })).not.toBeInTheDocument();
  });

  it('collapse button calls onCollapse', async () => {
    const onCollapse = vi.fn();
    render(<RailHeader {...baseProps} onCollapse={onCollapse} />);
    await userEvent.click(screen.getByRole('button', { name: /收起/ }));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/rail/__tests__/RailHeader.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-ui/rail/RailHeader.tsx`:

```tsx
import { MessageSquare, FileText, List, Plus, PanelRightClose } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RailTab } from '../../atlas-core/reader/useRailState';
import { Button, Chip, Icon } from '../primitives';

export type RailHeaderProps = {
  activeTab: RailTab;
  commentCount: number;
  noteCount: number;
  onTabChange: (tab: RailTab) => void;
  onPlusClick: () => void;
  onCollapse: () => void;
};

const TABS: ReadonlyArray<{ id: RailTab; label: string; icon: LucideIcon }> = [
  { id: 'comments', label: '评论', icon: MessageSquare },
  { id: 'notes', label: '笔记', icon: FileText },
  { id: 'toc', label: '目录', icon: List },
];

export function RailHeader({
  activeTab,
  commentCount,
  noteCount,
  onTabChange,
  onPlusClick,
  onCollapse,
}: RailHeaderProps) {
  return (
    <div className="flex items-center border-b border-border h-10 shrink-0">
      <div role="tablist" className="flex h-full">
        {TABS.map(({ id, label, icon }) => {
          const active = id === activeTab;
          const badge = id === 'comments' ? commentCount : id === 'notes' ? noteCount : null;
          return (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={[
                'inline-flex items-center gap-1.5 px-3 text-[12px] font-medium transition-colors border-b-2 -mb-px',
                active
                  ? 'text-accent border-accent'
                  : 'text-text-2 border-transparent hover:text-text',
              ].join(' ')}
            >
              <Icon icon={icon} size={14} />
              {label}
              {badge != null && badge > 0 ? (
                <Chip variant={active ? 'accent' : 'neutral'}>{badge}</Chip>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-1 pr-2">
        {activeTab === 'comments' && (
          <Button
            variant="primary"
            size="sm"
            iconOnly
            leadingIcon={Plus}
            onClick={onPlusClick}
            aria-label="新增评论(快捷键 N)"
            title="新增评论 (N)"
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          leadingIcon={PanelRightClose}
          onClick={onCollapse}
          aria-label="收起侧栏"
          title="收起侧栏 (\\)"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-ui/rail/__tests__/RailHeader.test.tsx` → 6 passed. `npm test` → green.

- [ ] **Step 5: Commit**

```
git add src/atlas-ui/rail/RailHeader.tsx src/atlas-ui/rail/__tests__/RailHeader.test.tsx
git commit -m "feat(rail): add RailHeader with tabs + plus + collapse"
```

---

## Task 3.2: `SlimRail`

**Files:**
- Create: `src/atlas-ui/rail/SlimRail.tsx`
- Create: `src/atlas-ui/rail/__tests__/SlimRail.test.tsx`

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/rail/__tests__/SlimRail.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SlimRail } from '../SlimRail';

describe('SlimRail', () => {
  it('renders three icon buttons', () => {
    render(<SlimRail badges={{ comments: 3, notes: 2, toc: 0 }} activeTab={null} onExpand={vi.fn()} />);
    expect(screen.getByRole('button', { name: /打开评论/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /打开笔记/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /打开目录/ })).toBeInTheDocument();
  });

  it('shows comment badge when count > 0', () => {
    render(<SlimRail badges={{ comments: 3, notes: 0, toc: 0 }} activeTab={null} onExpand={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('hides badge when count = 0', () => {
    render(<SlimRail badges={{ comments: 0, notes: 0, toc: 0 }} activeTab={null} onExpand={vi.fn()} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('clicking a button calls onExpand with tab id', async () => {
    const onExpand = vi.fn();
    render(<SlimRail badges={{ comments: 0, notes: 0, toc: 0 }} activeTab={null} onExpand={onExpand} />);
    await userEvent.click(screen.getByRole('button', { name: /打开评论/ }));
    expect(onExpand).toHaveBeenCalledWith('comments');
  });

  it('marks activeTab with data-active', () => {
    const { container } = render(<SlimRail badges={{ comments: 0, notes: 0, toc: 0 }} activeTab="notes" onExpand={vi.fn()} />);
    const activeBtn = container.querySelector('[data-slim-active="true"]');
    expect(activeBtn).not.toBeNull();
    expect(activeBtn?.getAttribute('aria-label')).toMatch(/笔记/);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/rail/__tests__/SlimRail.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-ui/rail/SlimRail.tsx`:

```tsx
import { MessageSquare, FileText, List } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '../primitives';
import type { RailTab } from '../../atlas-core/reader/useRailState';

export type SlimRailProps = {
  badges: Record<RailTab, number>;
  activeTab: RailTab | null;
  onExpand: (toTab: RailTab) => void;
};

const ITEMS: ReadonlyArray<{ id: RailTab; label: string; icon: LucideIcon }> = [
  { id: 'comments', label: '评论', icon: MessageSquare },
  { id: 'notes', label: '笔记', icon: FileText },
  { id: 'toc', label: '目录', icon: List },
];

export function SlimRail({ badges, activeTab, onExpand }: SlimRailProps) {
  return (
    <div
      role="toolbar"
      aria-orientation="vertical"
      aria-label="侧栏"
      className="w-9 bg-page border-l border-border flex flex-col items-center py-2 gap-1 shrink-0"
    >
      {ITEMS.map(({ id, label, icon }) => {
        const isActive = activeTab === id;
        const count = badges[id];
        return (
          <button
            key={id}
            type="button"
            data-slim-active={isActive ? 'true' : 'false'}
            onClick={() => onExpand(id)}
            aria-label={`打开${label}`}
            title={`打开${label}`}
            className={[
              'relative w-7 h-7 rounded-md flex items-center justify-center transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40',
              isActive
                ? 'bg-accent-bg text-accent'
                : 'text-text-2 hover:bg-surface-2 hover:text-text',
            ].join(' ')}
          >
            <Icon icon={icon} size={14} />
            {count > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-accent text-page text-[9px] font-semibold tabular-nums rounded-full flex items-center justify-center px-[3px]">
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-ui/rail/__tests__/SlimRail.test.tsx` → 5 passed. `npm test` → green.

- [ ] **Step 5: Commit**

```
git add src/atlas-ui/rail/SlimRail.tsx src/atlas-ui/rail/__tests__/SlimRail.test.tsx
git commit -m "feat(rail): add SlimRail (36px collapsed view) with badges"
```

---

## Task 3.3: `ReaderRail` (desktop expanded/collapsed switcher)

**Files:**
- Create: `src/atlas-ui/rail/ReaderRail.tsx`
- Create: `src/atlas-ui/rail/__tests__/ReaderRail.test.tsx`

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/rail/__tests__/ReaderRail.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReaderRail } from '../ReaderRail';
import type { BookRegistry } from '../../../atlas-core/registry';

function makeRegistry(): BookRegistry {
  return {
    manifest: { slug: 'demo', bookId: 'demo', readingOrder: [] } as unknown as BookRegistry['manifest'],
    notes: new Map(),
    getPage: () => undefined,
  } as unknown as BookRegistry;
}

const noop = vi.fn();
const baseProps = {
  registry: makeRegistry(),
  threads: [],
  noteIds: [],
  currentPageId: null,
  selectedThreadId: null,
  highlightedThreadId: null,
  open: true,
  tab: 'comments' as const,
  width: 320,
  onTabChange: vi.fn(),
  onCollapse: vi.fn(),
  onExpand: vi.fn(),
  onPlusClick: vi.fn(),
  onNavigate: vi.fn(),
  onSelectThread: noop,
  onHoverThread: noop,
  onAddMessage: noop,
  onResolve: noop,
  onReopen: noop,
  onDeleteThread: noop,
  onEditMessage: noop,
  onDeleteMessage: noop,
};

describe('ReaderRail', () => {
  it('renders expanded rail when open=true', () => {
    render(
      <MemoryRouter>
        <ReaderRail {...baseProps} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders slim rail when open=false', () => {
    render(
      <MemoryRouter>
        <ReaderRail {...baseProps} open={false} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('toolbar', { name: /侧栏/ })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('shows active tab content (comments)', () => {
    render(
      <MemoryRouter>
        <ReaderRail {...baseProps} tab="comments" />
      </MemoryRouter>,
    );
    expect(screen.getByText('这一页还没有评论')).toBeInTheDocument();
  });

  it('shows notes tab content when tab=notes', () => {
    render(
      <MemoryRouter>
        <ReaderRail {...baseProps} tab="notes" />
      </MemoryRouter>,
    );
    expect(screen.getByText('这一页还没有笔记')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/rail/__tests__/ReaderRail.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-ui/rail/ReaderRail.tsx`:

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import type { BookRegistry } from '../../atlas-core/registry';
import type { CommentThread } from '../../atlas-core/types/comments';
import type { NoteId } from '../../atlas-core/types/primitives';
import type { RailTab } from '../../atlas-core/reader/useRailState';
import { MOTION } from '../primitives';
import { RailHeader } from './RailHeader';
import { SlimRail } from './SlimRail';
import { CommentsTab } from './tabs/CommentsTab';
import { NotesTab } from './tabs/NotesTab';
import { TocTab } from './tabs/TocTab';

export type ReaderRailProps = {
  registry: BookRegistry;
  threads: CommentThread[];
  noteIds: NoteId[];
  currentPageId: string | null;
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  open: boolean;
  tab: RailTab;
  width: number;
  onTabChange: (tab: RailTab) => void;
  onCollapse: () => void;
  onExpand: (toTab: RailTab) => void;
  onPlusClick: () => void;
  onNavigate: (pageId: string) => void;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onEditMessage: (threadId: string, messageId: string, text: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;
};

export function ReaderRail(props: ReaderRailProps) {
  const {
    open,
    tab,
    width,
    threads,
    noteIds,
    registry,
    currentPageId,
    selectedThreadId,
    highlightedThreadId,
    onTabChange,
    onCollapse,
    onExpand,
    onPlusClick,
    onNavigate,
    ...threadHandlers
  } = props;

  const commentCount = threads.length;
  const noteCount = noteIds.length;

  if (!open) {
    return (
      <SlimRail
        activeTab={null}
        badges={{ comments: commentCount, notes: noteCount, toc: 0 }}
        onExpand={onExpand}
      />
    );
  }

  return (
    <motion.aside
      role="complementary"
      aria-label="侧栏"
      style={{ width }}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={MOTION.railWidth}
      className="bg-page border-l border-border flex flex-col shrink-0 overflow-hidden"
    >
      <RailHeader
        activeTab={tab}
        commentCount={commentCount}
        noteCount={noteCount}
        onTabChange={onTabChange}
        onPlusClick={onPlusClick}
        onCollapse={onCollapse}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          role="tabpanel"
          aria-label={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MOTION.tabFade}
          className="flex-1 min-h-0"
        >
          {tab === 'comments' && (
            <CommentsTab
              threads={threads}
              selectedThreadId={selectedThreadId}
              highlightedThreadId={highlightedThreadId}
              {...threadHandlers}
            />
          )}
          {tab === 'notes' && <NotesTab noteIds={noteIds} registry={registry} />}
          {tab === 'toc' && (
            <TocTab registry={registry} currentPageId={currentPageId} onNavigate={onNavigate} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.aside>
  );
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-ui/rail/__tests__/ReaderRail.test.tsx` → 4 passed. `npm test` → green.

- [ ] **Step 5: Commit**

```
git add src/atlas-ui/rail/ReaderRail.tsx src/atlas-ui/rail/__tests__/ReaderRail.test.tsx
git commit -m "feat(rail): add ReaderRail composing tabs with framer-motion"
```

---

## Task 3.4: `MobileRailSheet`

**Files:**
- Create: `src/atlas-ui/rail/MobileRailSheet.tsx`
- Create: `src/atlas-ui/rail/__tests__/MobileRailSheet.test.tsx`

For now, implement the layout. Full drag-to-dismiss behavior is verified manually since jsdom doesn't simulate pointer events to framer-motion's drag system well.

- [ ] **Step 1: Failing test**

Create `src/atlas-ui/rail/__tests__/MobileRailSheet.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MobileRailSheet } from '../MobileRailSheet';
import type { BookRegistry } from '../../../atlas-core/registry';

const registry = {
  manifest: { slug: 'demo', bookId: 'demo', readingOrder: [] } as unknown as BookRegistry['manifest'],
  notes: new Map(),
  getPage: () => undefined,
} as unknown as BookRegistry;

const noop = vi.fn();
const baseProps = {
  registry,
  threads: [],
  noteIds: [],
  currentPageId: null,
  selectedThreadId: null,
  highlightedThreadId: null,
  tab: 'comments' as const,
  onTabChange: vi.fn(),
  onClose: vi.fn(),
  onPlusClick: vi.fn(),
  onNavigate: vi.fn(),
  onSelectThread: noop,
  onHoverThread: noop,
  onAddMessage: noop,
  onResolve: noop,
  onReopen: noop,
  onDeleteThread: noop,
  onEditMessage: noop,
  onDeleteMessage: noop,
};

describe('MobileRailSheet', () => {
  it('renders dialog role', () => {
    render(
      <MemoryRouter>
        <MobileRailSheet {...baseProps} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders tab strip', () => {
    render(
      <MemoryRouter>
        <MobileRailSheet {...baseProps} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('tab', { name: /评论/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /笔记/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /目录/ })).toBeInTheDocument();
  });

  it('close button calls onClose', async () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <MobileRailSheet {...baseProps} onClose={onClose} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /关闭侧栏/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-ui/rail/__tests__/MobileRailSheet.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-ui/rail/MobileRailSheet.tsx`:

```tsx
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { CommentThread } from '../../atlas-core/types/comments';
import type { NoteId } from '../../atlas-core/types/primitives';
import type { RailTab } from '../../atlas-core/reader/useRailState';
import { Button, MOTION } from '../primitives';
import { CommentsTab } from './tabs/CommentsTab';
import { NotesTab } from './tabs/NotesTab';
import { TocTab } from './tabs/TocTab';

export type MobileRailSheetProps = {
  registry: BookRegistry;
  threads: CommentThread[];
  noteIds: NoteId[];
  currentPageId: string | null;
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  tab: RailTab;
  onTabChange: (tab: RailTab) => void;
  onClose: () => void;
  onPlusClick: () => void;
  onNavigate: (pageId: string) => void;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onEditMessage: (threadId: string, messageId: string, text: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;
};

const TABS: { id: RailTab; label: string }[] = [
  { id: 'comments', label: '评论' },
  { id: 'notes', label: '笔记' },
  { id: 'toc', label: '目录' },
];

export function MobileRailSheet(props: MobileRailSheetProps) {
  const {
    tab,
    onTabChange,
    onClose,
    threads,
    noteIds,
    registry,
    currentPageId,
    selectedThreadId,
    highlightedThreadId,
    onNavigate,
    onPlusClick,
    ...threadHandlers
  } = props;

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label="侧栏内容"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={MOTION.drawerSpring}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.4 }}
      onDragEnd={(_e, info) => {
        if (info.offset.y > 120) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-[28%] z-40 bg-page rounded-t-xl shadow-[var(--shadow-3)] flex flex-col"
      style={{ touchAction: 'pan-y' }}
    >
      <div className="flex justify-center pt-2 pb-1" aria-hidden="true">
        <div className="w-7 h-[3px] rounded bg-divider" />
      </div>
      <div role="tablist" className="flex items-center border-b border-border px-1">
        {TABS.map(({ id, label }) => {
          const active = id === tab;
          return (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={[
                'px-3 py-2 text-[12px] font-medium border-b-2 -mb-px',
                active ? 'text-accent border-accent' : 'text-text-2 border-transparent',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
        <Button
          className="ml-auto"
          variant="ghost"
          size="sm"
          iconOnly
          leadingIcon={X}
          onClick={onClose}
          aria-label="关闭侧栏"
        />
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'comments' && (
          <CommentsTab
            threads={threads}
            selectedThreadId={selectedThreadId}
            highlightedThreadId={highlightedThreadId}
            {...threadHandlers}
          />
        )}
        {tab === 'notes' && <NotesTab noteIds={noteIds} registry={registry} />}
        {tab === 'toc' && (
          <TocTab registry={registry} currentPageId={currentPageId} onNavigate={onNavigate} />
        )}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 4: Tests pass**

`npx vitest run src/atlas-ui/rail/__tests__/MobileRailSheet.test.tsx` → 3 passed. `npm test` → green.

- [ ] **Step 5: Commit**

```
git add src/atlas-ui/rail/MobileRailSheet.tsx src/atlas-ui/rail/__tests__/MobileRailSheet.test.tsx
git commit -m "feat(rail): add MobileRailSheet bottom sheet with drag-to-dismiss"
```

---

# Phase 4 — Shell Rewrite + Cleanup

After this phase, the merged dark bar is live, old `CommentPanel` / `NotesDrawer` / `ReaderTopBar` files are deleted, and the rail is the only side panel.

## Task 4.1: Add `useMediaQuery` helper (mobile breakpoint)

**Files:**
- Create: `src/atlas-core/reader/useMediaQuery.ts`
- Create: `src/atlas-core/reader/__tests__/useMediaQuery.test.ts`
- Modify: `src/atlas-core/reader/index.ts`

- [ ] **Step 1: Failing test**

Create `src/atlas-core/reader/__tests__/useMediaQuery.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '../useMediaQuery';

describe('useMediaQuery', () => {
  it('returns true when query matches', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(true);
  });

  it('responds to change events', () => {
    let listener: ((e: MediaQueryListEvent) => void) | null = null;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => {
          listener = l;
        },
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
    act(() => {
      listener?.({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-core/reader/__tests__/useMediaQuery.test.ts` → FAIL.

- [ ] **Step 3: Implement**

Create `src/atlas-core/reader/useMediaQuery.ts`:

```ts
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

- [ ] **Step 4: Export and run tests**

Edit `src/atlas-core/reader/index.ts` — add:

```ts
export { useMediaQuery } from './useMediaQuery';
```

`npx vitest run src/atlas-core/reader/__tests__/useMediaQuery.test.ts` → 2 passed. `npm test` → green.

- [ ] **Step 5: Commit**

```
git add src/atlas-core/reader/useMediaQuery.ts src/atlas-core/reader/__tests__/useMediaQuery.test.ts src/atlas-core/reader/index.ts
git commit -m "feat(reader): add useMediaQuery hook for breakpoint detection"
```

---

## Task 4.2: Rewrite `ReaderShell` with merged dark bar + ReaderRail

**Files:**
- Modify: `src/atlas-ui/reader/ReaderShell.tsx` (full rewrite)
- Modify: `src/atlas-ui/reader/MagazineReader.tsx` (use useRailState, pass new props)
- Modify (if needed): `src/atlas-ui/reader/__tests__/*` (update assertions)

- [ ] **Step 1: Rewrite `ReaderShell.tsx`**

Replace the entire file with:

```tsx
import { AnimatePresence } from 'framer-motion';
import { BookOpen, MousePointerClick, Eye, Bug } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import type { NoteId } from '../../atlas-core/types/primitives';
import type { ZoomLevel } from '../renderers/ImageOverlayTemplate';
import type { RailTab } from '../../atlas-core/reader/useRailState';
import { ChromeButton, Icon, InfoBanner } from '../primitives';
import { ReaderBottomBar } from './ReaderBottomBar';
import { PageViewport } from './PageViewport';
import { ReaderRail } from '../rail/ReaderRail';
import { MobileRailSheet } from '../rail/MobileRailSheet';

type ReaderShellProps = {
  registry: BookRegistry;
  readerState: ReaderState;
  zoom: ZoomLevel;
  onCycleZoom: () => void;

  // Comments
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
  onDeleteThread: (threadId: string) => void;
  onEditMessage: (threadId: string, messageId: string, text: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;

  // Notes
  noteIds: NoteId[];

  // Rail state
  railOpen: boolean;
  railTab: RailTab;
  railWidth: number;
  onRailTabChange: (tab: RailTab) => void;
  onRailCollapse: () => void;
  onRailExpand: (toTab: RailTab) => void;

  // + button / banner
  onPlusClick: () => void;
  onDismissCommentMode: () => void;

  // Mobile
  isMobile: boolean;

  // Navigation (for TOC)
  onNavigateToPage: (pageId: string) => void;
};

export function ReaderShell({
  registry,
  readerState,
  zoom,
  onCycleZoom,
  commentThreads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onAddMessage,
  onResolve,
  onReopen,
  onCreateAnchor,
  onDeleteThread,
  onEditMessage,
  onDeleteMessage,
  noteIds,
  railOpen,
  railTab,
  railWidth,
  onRailTabChange,
  onRailCollapse,
  onRailExpand,
  onPlusClick,
  onDismissCommentMode,
  isMobile,
  onNavigateToPage,
}: ReaderShellProps) {
  const { manifest } = registry;
  const { currentPage, interactionMode } = readerState;
  const featureFlags = manifest.featureFlags;
  const inCommentMode = interactionMode === 'comment';
  const inDebugMode = interactionMode === 'debugOverlay';

  const brand = manifest.title['zh-CN'] ?? '';
  const sectionTitle = currentPage?.title?.['zh-CN'];

  // Mobile sheet visibility uses railOpen too — on mobile, "open" means the sheet is up.
  const railHandlers = {
    threads: commentThreads,
    noteIds,
    registry,
    currentPageId: currentPage?.pageId ?? null,
    selectedThreadId,
    highlightedThreadId,
    onSelectThread,
    onHoverThread,
    onAddMessage,
    onResolve,
    onReopen,
    onDeleteThread,
    onEditMessage,
    onDeleteMessage,
    onPlusClick,
    onNavigate: onNavigateToPage,
  };

  return (
    <div className="flex flex-col h-dvh bg-surface" role="application" aria-label="VAT Atlas 阅读器">
      {/* Merged dark top bar */}
      {manifest.navigation?.showTopBar && (
        <header className="flex items-center bg-chrome text-page h-11 px-3.5 gap-2.5 shrink-0 text-[12px]">
          <span className="text-accent-2 shrink-0">
            <Icon icon={BookOpen} size={16} />
          </span>
          <span className="font-semibold shrink-0">{brand}</span>
          {sectionTitle ? (
            <>
              <span className="opacity-30" aria-hidden="true">·</span>
              <span className="opacity-60 truncate">{sectionTitle}</span>
            </>
          ) : null}
          <span className="w-px h-3.5 bg-white/15 mx-1 shrink-0" aria-hidden="true" />

          {featureFlags?.comments && (
            <ChromeButton
              pressed={inCommentMode}
              leadingIcon={inCommentMode ? Eye : MousePointerClick}
              onClick={() => readerState.setInteractionMode(inCommentMode ? 'read' : 'comment')}
              aria-label="切换评论模式"
            >
              评论模式
            </ChromeButton>
          )}
          {featureFlags?.debugOverlay && (
            <ChromeButton
              pressed={inDebugMode}
              leadingIcon={Bug}
              onClick={readerState.toggleDebugOverlay}
              aria-label="切换调试覆盖层"
            >
              Debug
            </ChromeButton>
          )}

          <div className="ml-auto opacity-65 tabular-nums shrink-0 font-mono text-[11px]">
            第 {currentPage?.pageNumber ?? '-'} / {readerState.totalPages} 页
          </div>
        </header>
      )}

      {/* Comment-mode banner (one-shot or sustained) */}
      {inCommentMode && (
        <InfoBanner
          variant="accent"
          icon={MousePointerClick}
          message="点击图片任意位置添加评论 · 按 ESC 取消"
          onDismiss={onDismissCommentMode}
        />
      )}

      {/* Main area + rail */}
      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <PageViewport
            registry={registry}
            readerState={readerState}
            zoom={zoom}
            onCycleZoom={onCycleZoom}
            commentThreads={commentThreads}
            selectedThreadId={selectedThreadId}
            highlightedThreadId={highlightedThreadId}
            onSelectThread={onSelectThread}
            onHoverThread={onHoverThread}
            onCreateAnchor={onCreateAnchor}
          />
        </div>

        {!isMobile && (
          <ReaderRail
            open={railOpen}
            tab={railTab}
            width={railWidth}
            onTabChange={onRailTabChange}
            onCollapse={onRailCollapse}
            onExpand={onRailExpand}
            {...railHandlers}
          />
        )}

        {isMobile && (
          <AnimatePresence>
            {railOpen ? (
              <MobileRailSheet
                tab={railTab}
                onTabChange={onRailTabChange}
                onClose={onRailCollapse}
                {...railHandlers}
              />
            ) : null}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom bar (unchanged) */}
      {manifest.navigation?.showBottomBar && (
        <ReaderBottomBar
          currentIndex={readerState.currentPageIndex}
          totalPages={readerState.totalPages}
          canGoNext={readerState.canGoNext}
          canGoPrevious={readerState.canGoPrevious}
          onNext={readerState.goNext}
          onPrevious={readerState.goPrevious}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `MagazineReader.tsx`**

Replace the entire file with:

```tsx
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReaderState, useKeyboardNavigation, useRailState, useMediaQuery } from '../../atlas-core/reader';
import type { BookRegistry } from '../../atlas-core/registry';
import { createCommentStore } from '../../atlas-core/annotations/commentStore';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import type { ZoomLevel } from '../renderers/ImageOverlayTemplate';
import { useToast } from '../primitives';
import { ReaderShell } from './ReaderShell';

type MagazineReaderProps = {
  registry: BookRegistry;
  initialPageId?: string;
};

const ANONYMOUS_USER = 'anonymous';
const LAST_PAGE_KEY = 'atlas-last-page';
const MOBILE_QUERY = '(max-width: 767px)';

export function MagazineReader({ registry, initialPageId }: MagazineReaderProps) {
  const restoredPageId = useMemo(() => {
    if (initialPageId) return initialPageId;
    try {
      const saved = localStorage.getItem(`${LAST_PAGE_KEY}-${registry.manifest.bookId}`);
      return saved ?? undefined;
    } catch {
      return undefined;
    }
  }, [registry.manifest.bookId, initialPageId]);

  const toast = useToast();
  const navigate = useNavigate();

  const readerState = useReaderState(registry, restoredPageId);
  useKeyboardNavigation(readerState, registry.manifest.reader.enableKeyboardNavigation);

  const railState = useRailState(registry.manifest.bookId);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  useEffect(() => {
    if (readerState.currentPage) {
      try {
        localStorage.setItem(
          `${LAST_PAGE_KEY}-${registry.manifest.bookId}`,
          readerState.currentPage.pageId,
        );
      } catch { /* ignore */ }
    }
  }, [registry.manifest.bookId, readerState.currentPage]);

  const commentStore = useMemo(
    () => createCommentStore(registry.manifest.bookId),
    [registry.manifest.bookId],
  );

  const [commentThreads, setCommentThreads] = useState<CommentThread[]>(() => commentStore.getAll());
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [highlightedThreadId, setHighlightedThreadId] = useState<string | null>(null);

  const [zoom, setZoom] = useState<ZoomLevel>('fit-page');
  const cycleZoom = useCallback(() => {
    setZoom((z) => (z === 'fit-page' ? 'fit-width' : z === 'fit-width' ? 'actual-size' : 'fit-page'));
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPageThreads = useMemo(
    () => commentThreads.filter((t) => t.pageId === readerState.currentPage?.pageId),
    [commentThreads, readerState.currentPage?.pageId],
  );

  const refreshThreads = useCallback(() => {
    setCommentThreads(commentStore.getAll());
  }, [commentStore]);

  const handleCreateAnchor = useCallback(
    (anchor: AnnotationAnchor) => {
      const thread = commentStore.createThread({
        bookId: registry.manifest.bookId,
        pageId: readerState.currentPage?.pageId ?? '',
        anchor,
        category: 'general',
        createdBy: ANONYMOUS_USER,
      });
      refreshThreads();
      setSelectedThreadId(thread.threadId);
      railState.expand('comments');
      // One-shot: exit comment mode after a pin is created
      readerState.setInteractionMode('read');
    },
    [commentStore, registry.manifest.bookId, readerState, refreshThreads, railState],
  );

  const handleAddMessage = useCallback((threadId: string, text: string) => {
    commentStore.addMessage(threadId, {
      authorId: ANONYMOUS_USER,
      body: [{ type: 'text', value: text }],
    });
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleDeleteThread = useCallback((threadId: string) => {
    commentStore.deleteThread(threadId);
    setSelectedThreadId(null);
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleEditMessage = useCallback((threadId: string, messageId: string, text: string) => {
    commentStore.editMessage(threadId, messageId, [{ type: 'text', value: text }]);
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleDeleteMessage = useCallback((threadId: string, messageId: string) => {
    commentStore.deleteMessage(threadId, messageId);
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleResolve = useCallback((threadId: string) => {
    commentStore.resolve(threadId);
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleReopen = useCallback((threadId: string) => {
    commentStore.reopen(threadId);
    refreshThreads();
  }, [commentStore, refreshThreads]);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = commentStore.importJSON(text);
      refreshThreads();
      toast(`导入 ${result.imported} 条新评论 · 跳过 ${result.skipped} 条重复`, { variant: 'success' });
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [commentStore, refreshThreads, toast]);

  // + button: enter comment mode + open rail to comments + show banner.
  const handlePlusClick = useCallback(() => {
    readerState.setInteractionMode('comment');
    railState.expand('comments');
  }, [readerState, railState]);

  const handleDismissCommentMode = useCallback(() => {
    readerState.setInteractionMode('read');
  }, [readerState]);

  // ESC key to cancel comment mode
  useEffect(() => {
    if (readerState.interactionMode !== 'comment') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        readerState.setInteractionMode('read');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readerState]);

  const handleNavigateToPage = useCallback((pageId: string) => {
    readerState.goToPage(pageId);
    navigate(`/book/${registry.manifest.slug}/page/${pageId}`);
  }, [readerState, registry.manifest.slug, navigate]);

  const currentNoteIds = readerState.currentPage?.notes?.noteIds ?? [];

  // Hidden file input (kept for future import UI in rail overflow menu)
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
        aria-label="导入评论 JSON"
      />

      <ReaderShell
        registry={registry}
        readerState={readerState}
        zoom={zoom}
        onCycleZoom={cycleZoom}
        commentThreads={currentPageThreads}
        selectedThreadId={selectedThreadId}
        highlightedThreadId={highlightedThreadId}
        onSelectThread={setSelectedThreadId}
        onHoverThread={setHighlightedThreadId}
        onAddMessage={handleAddMessage}
        onResolve={handleResolve}
        onReopen={handleReopen}
        onDeleteThread={handleDeleteThread}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onCreateAnchor={handleCreateAnchor}
        noteIds={currentNoteIds}
        railOpen={railState.open}
        railTab={railState.tab}
        railWidth={railState.width}
        onRailTabChange={railState.setTab}
        onRailCollapse={railState.collapse}
        onRailExpand={railState.expand}
        onPlusClick={handlePlusClick}
        onDismissCommentMode={handleDismissCommentMode}
        isMobile={isMobile}
        onNavigateToPage={handleNavigateToPage}
      />
    </>
  );
}
```

- [ ] **Step 3: Update existing tests that referenced removed props**

Run: `npx vitest run src/atlas-ui/reader/__tests__`

Likely failures:
- Tests referencing `notesOpen` / `commentsOpen` / `onToggleNotes` / `onToggleComments` / `onExportComments` / `onImportComments` props on `ReaderShell`.
- Tests asserting against old emoji or `📝 笔记` / `💬 评论` text in the toolbar.

Update each failing test to the new API:
- `notesOpen` / `commentsOpen` removed; rail state now controls visibility.
- Use `railOpen`, `railTab`, etc.
- Old `📝 笔记` and `💬 评论` toggle buttons are gone — they're now tabs inside the rail.

When in doubt, delete the obsolete assertion (the integration tests added in Phase 5 cover end-to-end behavior).

- [ ] **Step 4: Tests pass**

`npm test` → green. New count: 240+ tests (Phase 1-3 added ~50).

- [ ] **Step 5: Commit**

```
git add src/atlas-ui/reader/ReaderShell.tsx src/atlas-ui/reader/MagazineReader.tsx src/atlas-ui/reader/__tests__
git commit -m "refactor(reader): merge TopBar+Toolbar, swap drawer overlays for ReaderRail"
```

---

## Task 4.3: Delete legacy files

**Files:**
- Delete: `src/atlas-ui/reader/ReaderTopBar.tsx`
- Delete: `src/atlas-ui/reader/__tests__/ReaderTopBar.test.tsx`
- Delete: `src/atlas-ui/comments/CommentPanel.tsx`
- Delete: `src/atlas-ui/comments/__tests__/CommentPanel.test.tsx` (if exists)
- Delete: `src/atlas-ui/notes/NotesDrawer.tsx`
- Delete: `src/atlas-ui/notes/__tests__/NotesDrawer.test.tsx`

- [ ] **Step 1: Verify no remaining imports**

Run:
```bash
grep -rnE "(ReaderTopBar|CommentPanel|NotesDrawer)" src --include="*.tsx" --include="*.ts" | grep -v __tests__
```

Expected: only references inside the files we're about to delete (the files themselves, not other modules).

If any other file still imports them, that file was missed in Task 4.2. Fix the import there first.

- [ ] **Step 2: Delete files**

```
rm src/atlas-ui/reader/ReaderTopBar.tsx
rm -f src/atlas-ui/reader/__tests__/ReaderTopBar.test.tsx
rm src/atlas-ui/comments/CommentPanel.tsx
rm -f src/atlas-ui/comments/__tests__/CommentPanel.test.tsx
rm src/atlas-ui/notes/NotesDrawer.tsx
rm -f src/atlas-ui/notes/__tests__/NotesDrawer.test.tsx
```

- [ ] **Step 3: Tests pass**

`npm test` → green. (Some test count may decrease since legacy test files were removed.)

- [ ] **Step 4: Commit**

```
git add -A src/atlas-ui/reader src/atlas-ui/comments src/atlas-ui/notes
git commit -m "chore: remove legacy ReaderTopBar, CommentPanel, NotesDrawer (superseded by rail)"
```

---

# Phase 5 — + Button Flow + Keyboard + Final Verification

## Task 5.1: Extend `useKeyboardNavigation` with rail shortcuts

**Files:**
- Modify: `src/atlas-core/reader/useKeyboardNavigation.ts`
- Create: `src/atlas-core/reader/__tests__/useKeyboardNavigation.test.ts`

- [ ] **Step 1: Failing test**

Create `src/atlas-core/reader/__tests__/useKeyboardNavigation.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';
import type { ReaderState } from '../useReaderState';

function buildReaderState(): ReaderState {
  return {
    currentPage: undefined,
    currentPageIndex: 0,
    totalPages: 1,
    interactionMode: 'read',
    canGoNext: true,
    canGoPrevious: true,
    goToPage: vi.fn(),
    goNext: vi.fn(),
    goPrevious: vi.fn(),
    setInteractionMode: vi.fn(),
    toggleDebugOverlay: vi.fn(),
  } as unknown as ReaderState;
}

function press(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('useKeyboardNavigation', () => {
  let state: ReaderState;
  beforeEach(() => {
    state = buildReaderState();
  });

  it('ArrowRight goes next', () => {
    renderHook(() => useKeyboardNavigation(state, true, {}));
    act(() => press('ArrowRight'));
    expect(state.goNext).toHaveBeenCalled();
  });

  it('does not trigger when disabled', () => {
    renderHook(() => useKeyboardNavigation(state, false, {}));
    act(() => press('ArrowRight'));
    expect(state.goNext).not.toHaveBeenCalled();
  });

  it('backslash triggers onToggleRail', () => {
    const onToggleRail = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onToggleRail }));
    act(() => press('\\'));
    expect(onToggleRail).toHaveBeenCalled();
  });

  it('N triggers onNewComment', () => {
    const onNewComment = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onNewComment }));
    act(() => press('n'));
    expect(onNewComment).toHaveBeenCalled();
  });

  it('1 triggers onSwitchTab with comments', () => {
    const onSwitchTab = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onSwitchTab }));
    act(() => press('1'));
    expect(onSwitchTab).toHaveBeenCalledWith('comments');
  });

  it('2 triggers onSwitchTab with notes', () => {
    const onSwitchTab = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onSwitchTab }));
    act(() => press('2'));
    expect(onSwitchTab).toHaveBeenCalledWith('notes');
  });

  it('3 triggers onSwitchTab with toc', () => {
    const onSwitchTab = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onSwitchTab }));
    act(() => press('3'));
    expect(onSwitchTab).toHaveBeenCalledWith('toc');
  });

  it('ignores keys when focus is in textarea', () => {
    const onNewComment = vi.fn();
    const onSwitchTab = vi.fn();
    renderHook(() => useKeyboardNavigation(state, true, { onNewComment, onSwitchTab }));
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();
    const evt = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
    Object.defineProperty(evt, 'target', { value: ta, enumerable: true });
    act(() => { window.dispatchEvent(evt); });
    expect(onNewComment).not.toHaveBeenCalled();
    ta.remove();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`npx vitest run src/atlas-core/reader/__tests__/useKeyboardNavigation.test.ts` → FAIL (signature mismatch + missing callbacks).

- [ ] **Step 3: Replace `useKeyboardNavigation.ts`**

Replace the file with:

```ts
import { useEffect } from 'react';
import type { ReaderState } from './useReaderState';
import type { RailTab } from './useRailState';

export type KeyboardActions = {
  onToggleRail?: () => void;
  onNewComment?: () => void;
  onSwitchTab?: (tab: RailTab) => void;
};

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useKeyboardNavigation(
  readerState: ReaderState,
  enabled: boolean,
  actions: KeyboardActions = {},
) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (isEditable(e.target)) return;

      // Navigation (always active)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        readerState.goNext();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        readerState.goPrevious();
        return;
      }
      if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault();
        readerState.toggleDebugOverlay();
        return;
      }

      // Spec B additions
      if (e.key === '\\') {
        e.preventDefault();
        actions.onToggleRail?.();
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        actions.onNewComment?.();
        return;
      }
      if (e.key === '1') {
        e.preventDefault();
        actions.onSwitchTab?.('comments');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        actions.onSwitchTab?.('notes');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        actions.onSwitchTab?.('toc');
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readerState, enabled, actions.onToggleRail, actions.onNewComment, actions.onSwitchTab]);
}
```

- [ ] **Step 4: Wire `MagazineReader` to pass the new actions**

Open `src/atlas-ui/reader/MagazineReader.tsx`. Find the line:
```ts
useKeyboardNavigation(readerState, registry.manifest.reader.enableKeyboardNavigation);
```

Replace with:
```ts
useKeyboardNavigation(readerState, registry.manifest.reader.enableKeyboardNavigation, {
  onToggleRail: () => railState.setOpen(!railState.open),
  onNewComment: handlePlusClick,
  onSwitchTab: (tab) => railState.expand(tab),
});
```

(`handlePlusClick` must be declared before this line — move it above the `useKeyboardNavigation` call if needed.)

- [ ] **Step 5: Tests pass**

`npx vitest run src/atlas-core/reader/__tests__/useKeyboardNavigation.test.ts` → 8 passed. `npm test` → green.

- [ ] **Step 6: Commit**

```
git add src/atlas-core/reader/useKeyboardNavigation.ts src/atlas-core/reader/__tests__/useKeyboardNavigation.test.ts src/atlas-ui/reader/MagazineReader.tsx
git commit -m "feat(reader): keyboard shortcuts \\ N 1 2 3 with input-focus guard"
```

---

## Task 5.2: Rail persistence integration test

**Files:**
- Create: `src/__tests__/railPersistence.test.tsx`

- [ ] **Step 1: Write the test**

Create `src/__tests__/railPersistence.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider, TooltipProvider } from '../atlas-ui/primitives';
import { MagazineReader } from '../atlas-ui/reader/MagazineReader';
import { createBookRegistry } from '../atlas-core/registry';
import { vatAtlasManifest } from '../books/de-eu-vat/manifest';
import { imageAssets } from '../books/de-eu-vat/imageAssets';
import { glossary } from '../books/de-eu-vat/glossary';
import { legalRefs } from '../books/de-eu-vat/legalRefs';
import { scenarios } from '../books/de-eu-vat/scenarios';
import { contents } from '../books/de-eu-vat/contents';
import { notes } from '../books/de-eu-vat/notes';
import { vatAtlasOverlays } from '../books/de-eu-vat/overlays/index.js';
import type { BookManifest } from '../atlas-core/types/manifest';
import type { ImageAsset } from '../atlas-core/types/image';
import type { OverlayConfig } from '../atlas-core/types/overlay';
import type { GlossaryEntry } from '../atlas-core/types/glossary';
import type { LegalRef } from '../atlas-core/types/legal';
import type { VatScenario } from '../atlas-core/types/scenario';
import type { AtlasNote } from '../atlas-core/types/notes';
import type { PageContent } from '../atlas-core/types/content';
import type { CommentThread } from '../atlas-core/types/comments';

function build() {
  return createBookRegistry(
    vatAtlasManifest as unknown as BookManifest,
    imageAssets as unknown as ImageAsset[],
    vatAtlasOverlays as unknown as OverlayConfig[],
    glossary as unknown as GlossaryEntry[],
    legalRefs as unknown as LegalRef[],
    scenarios as unknown as VatScenario[],
    notes as unknown as AtlasNote[],
    contents as unknown as PageContent[],
    [] as CommentThread[],
  );
}

describe('Rail persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists collapsed state across remount', () => {
    const registry = build();
    const bookId = registry.manifest.bookId;

    // Simulate pre-persisted state
    localStorage.setItem(
      `atlas-rail-${bookId}`,
      JSON.stringify({ open: false, tab: 'notes', width: 320 }),
    );

    const { container } = render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={registry} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    // When collapsed, the slim rail toolbar should be present (not the expanded tablist).
    const slim = container.querySelector('[role="toolbar"][aria-label="侧栏"]');
    expect(slim).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run, confirm pass (no implementation needed; we wrote the persistence in Task 1.3 and wired it in 4.2)**

`npx vitest run src/__tests__/railPersistence.test.tsx` → 1 passed.

- [ ] **Step 3: Commit**

```
git add src/__tests__/railPersistence.test.tsx
git commit -m "test: integration guard for rail localStorage persistence"
```

---

## Task 5.3: + button flow integration test

**Files:**
- Create: `src/__tests__/plusButtonFlow.test.tsx`

- [ ] **Step 1: Write the test**

Create `src/__tests__/plusButtonFlow.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider, TooltipProvider } from '../atlas-ui/primitives';
import { MagazineReader } from '../atlas-ui/reader/MagazineReader';
import { createBookRegistry } from '../atlas-core/registry';
import { vatAtlasManifest } from '../books/de-eu-vat/manifest';
import { imageAssets } from '../books/de-eu-vat/imageAssets';
import { glossary } from '../books/de-eu-vat/glossary';
import { legalRefs } from '../books/de-eu-vat/legalRefs';
import { scenarios } from '../books/de-eu-vat/scenarios';
import { contents } from '../books/de-eu-vat/contents';
import { notes } from '../books/de-eu-vat/notes';
import { vatAtlasOverlays } from '../books/de-eu-vat/overlays/index.js';
import type { BookManifest } from '../atlas-core/types/manifest';
import type { ImageAsset } from '../atlas-core/types/image';
import type { OverlayConfig } from '../atlas-core/types/overlay';
import type { GlossaryEntry } from '../atlas-core/types/glossary';
import type { LegalRef } from '../atlas-core/types/legal';
import type { VatScenario } from '../atlas-core/types/scenario';
import type { AtlasNote } from '../atlas-core/types/notes';
import type { PageContent } from '../atlas-core/types/content';
import type { CommentThread } from '../atlas-core/types/comments';

function build() {
  return createBookRegistry(
    vatAtlasManifest as unknown as BookManifest,
    imageAssets as unknown as ImageAsset[],
    vatAtlasOverlays as unknown as OverlayConfig[],
    glossary as unknown as GlossaryEntry[],
    legalRefs as unknown as LegalRef[],
    scenarios as unknown as VatScenario[],
    notes as unknown as AtlasNote[],
    contents as unknown as PageContent[],
    [] as CommentThread[],
  );
}

describe('+ button flow', () => {
  beforeEach(() => localStorage.clear());

  it('shows banner when + button clicked, then dismisses after ESC', async () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={build()} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    // The rail starts open at comments tab — find the + button
    const plus = await screen.findByRole('button', { name: /新增评论/ });
    await userEvent.click(plus);

    // Banner appears
    expect(screen.getByText(/点击图片任意位置添加评论/)).toBeInTheDocument();

    // ESC dismisses
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText(/点击图片任意位置添加评论/)).not.toBeInTheDocument();
  });

  it('N keyboard shortcut also triggers the flow', async () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={build()} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: 'n' });
    expect(await screen.findByText(/点击图片任意位置添加评论/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm pass**

`npx vitest run src/__tests__/plusButtonFlow.test.tsx` → 2 passed.

- [ ] **Step 3: Commit**

```
git add src/__tests__/plusButtonFlow.test.tsx
git commit -m "test: integration coverage for + button + N shortcut flow"
```

---

## Task 5.4: Final verification + cleanup

**Files:** none modified by default; if anything turns up, fix and commit.

- [ ] **Step 1: Grep for leftovers**

Run each:

```bash
grep -RnE "(CommentPanel|NotesDrawer|ReaderTopBar)" src --include="*.tsx" --include="*.ts"
```
Expected: zero matches.

```bash
grep -RnE "(📝|💬|📤|📥|🐛|🖊|✏️|🗑|☐|✕)" src
```
Expected: zero matches.

```bash
grep -RnE "stone-[1-9]" src --include="*.tsx" --include="*.ts" | grep -v __tests__
```
Expected: zero matches.

If anything turns up, fix it in a follow-up commit before moving on.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no NEW errors beyond Spec A's pre-existing baseline (40 errors at merge time; verify by `git stash` + lint count if uncertain).

- [ ] **Step 3: Full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Build**

```bash
npx vite build --mode development --logLevel warn
```

Expected: success.

- [ ] **Step 5: Manual smoke test in dev server**

```bash
npm run dev
```

Walk through, in the browser:
1. **Default load** — single dark bar visible, rail expanded right (32%), comments tab active, page area centered.
2. **Click 笔记 tab** — content switches with fade.
3. **Click 目录 tab** — TOC list visible, current page highlighted accent-bg.
4. **Click TOC item** — page navigates, URL updates, TOC current highlight follows.
5. **Click × (rail collapse)** — rail becomes 36px slim with badges; main area expands. Refresh page — still collapsed (persistence).
6. **Click 评论 slim icon** — rail re-expands.
7. **Click +** — banner appears, cursor crosshair on image. Click image → pin appears, comment composer focused. Type "测试" and press Enter → pin solid, banner dismissed.
8. **Hit `\`** — rail toggles. Hit `2` while expanded — switches to notes tab. Hit `n` — banner shows.
9. **Hit ESC** while banner showing — banner dismissed, comment mode exited.
10. **Resize browser to 600px wide** — rail switches to mobile mode. Click 评论 slim icon — Sheet rises from bottom. Drag down ~150px — Sheet closes.
11. **Toggle 评论模式 in top bar** — banner appears; click image → pin created; banner stays (sustained mode). Click 评论模式 again to exit.

Stop dev server with Ctrl+C.

- [ ] **Step 6: Final commit (only if step 5 surfaced anything)**

```
git add -A
git commit -m "fix: polish from final smoke test"
```

If nothing changed, skip.

---

## Acceptance Criteria

- [x] All Phase 1-5 tasks checked off
- [ ] `grep -RnE "(CommentPanel|NotesDrawer|ReaderTopBar)" src` returns no production-code matches
- [ ] `grep -RnE "(📝|💬|📤|📥|🐛|🖊|✏️|🗑|☐|✕)" src` returns nothing
- [ ] `npm test` passes (~290 tests; was 223 after Spec A)
- [ ] `npm run lint` does not regress
- [ ] Top bar is a single 44px dark slate-900 bar
- [ ] Rail can be expanded / collapsed / restored via slim rail click
- [ ] Tab switching preserves per-tab scroll position (verify in smoke test)
- [ ] `+` button triggers one-shot comment mode (auto-exits after one pin created)
- [ ] `评论模式` toolbar toggle still allows sustained / batch mode
- [ ] Mobile breakpoint (< 768px) switches to bottom Sheet
- [ ] localStorage `atlas-rail-${bookId}` persists open/tab/width
- [ ] Keyboard shortcuts `\` `N` `1` `2` `3` work outside of inputs

---

## Self-Review Notes

**Spec → plan coverage:**
- §2.1/2.2 layout — Task 4.2 (ReaderShell rewrite includes both desktop and mobile branches)
- §3 merged top bar — Task 4.2
- §4 rail states — Tasks 3.1, 3.2, 3.3, 3.4
- §4.2.3 overflow menu — Note: only the `+` and `×` buttons in RailHeader are in Spec B; the actual overflow menu (导入 / 导出) is **out of scope for Phase 1-5** since CommentPanel's existing handlers stay accessible via legacy file-input ref. A follow-up commit may add the kebab menu — flagged below as a residual gap.
- §5 + button flow — Tasks 4.2 (handler + banner wiring) + 5.3 (integration test)
- §6 state — Task 1.3 (hook) + Task 4.2 (wiring)
- §7 file structure — entire plan
- §8 component APIs — Tasks 1.1, 1.2, 3.1, 3.2, 3.3, 3.4
- §9 motion presets — Task 1.3 step 5
- §10 a11y (role / aria-pressed / role=status / role=dialog / role=complementary / role=toolbar) — covered in primitives and rail components
- §11 tests — each Task includes TDD; integration in 5.2 / 5.3
- §13 deps — already installed in Spec A
- §15 acceptance — checklist above

**Known residual gaps (deliberate):**
1. **Rail overflow menu** (导入 / 导出 / 清空已解决) — UI placement defined in spec §4.2.3, but the actual dropdown is not implemented in this plan. The hidden file-input ref in `MagazineReader` keeps import wired, but there's no visible trigger. **Resolution:** add a small kebab `<Button iconOnly leadingIcon={MoreHorizontal}>` in `RailHeader` that opens a simple positioned `<ul>` menu; left as a TODO comment in `RailHeader` for the implementer to add in a 5th polish task if needed. Not a blocker for Spec B closing.
2. **Rail width drag** — Spec §6.1 mentions `width` but drag-to-resize is not in this plan (Spec D).
3. **Sheet pull-to-90vh** — Spec §4.4 mentions snap to 90vh, but this plan only implements 70vh default + drag-to-dismiss. Stretch goal.

**Type consistency check:**
- `RailTab` = `'comments' | 'notes' | 'toc'` — used identically across `useRailState`, `RailHeader`, `SlimRail`, `ReaderRail`, `MobileRailSheet`, `useKeyboardNavigation`. ✓
- `ReaderRail` and `MobileRailSheet` accept the same handler signatures (CommentsTab's full set) — verified inline. ✓
- `ChromeButtonProps.pressed` and `ChromeButton`'s `aria-pressed` attribute — consistent. ✓

**Type inconsistencies flagged during review:**
- `useKeyboardNavigation` signature changed from 2 args to 3 args (Phase 5 Task 5.1). The existing call site in `MagazineReader` (Phase 4 Task 4.2) passes 2 args. **Resolution:** Task 5.1 Step 4 explicitly updates that call site. ✓
