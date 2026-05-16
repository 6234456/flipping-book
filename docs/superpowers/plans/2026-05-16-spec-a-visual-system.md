# Spec A — Visual System + P0 Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the VAT Atlas visual system (slate + blue tokens, lucide-react icons, primitive components, framer-motion micro-interactions) and fix all 5 P0 bugs identified in spec A.

**Architecture:** All design tokens live in `src/styles/globals.css` via Tailwind v4 `@theme`. Reusable UI atoms ship in a new `src/atlas-ui/primitives/` directory (Button, Pin, Tooltip, Callout, Toast, etc.), each independently testable. Existing reader components (`ReaderShell`, `CommentPin`, `Term`, etc.) replace inline styles/emoji with primitives. Strict TDD: every primitive gets a failing test first.

**Tech Stack:** React 19, TypeScript 5.8, Vite 8, Tailwind CSS 4 (`@theme`), framer-motion 12, lucide-react, @radix-ui/react-tooltip, Vitest 4 + React Testing Library 16.

**Spec source:** [`docs/superpowers/specs/2026-05-16-visual-system-spec-a-design.md`](../specs/2026-05-16-visual-system-spec-a-design.md)

---

## File Plan

**Create (new files):**

```
src/atlas-ui/primitives/
  Icon.tsx
  Button.tsx
  Toggle.tsx
  Chip.tsx
  EmptyState.tsx
  motion.ts
  Tooltip.tsx
  Toast.tsx
  DrawerHeader.tsx
  Pin.tsx
  Callout.tsx
  index.ts
  __tests__/
    Icon.test.tsx
    Button.test.tsx
    Toggle.test.tsx
    Chip.test.tsx
    EmptyState.test.tsx
    Tooltip.test.tsx
    Toast.test.tsx
    DrawerHeader.test.tsx
    Pin.test.tsx
    Callout.test.tsx

src/__tests__/
  tocPageNavigation.test.tsx
  commentPinHighlight.test.tsx
  importToast.test.tsx
```

**Modify (existing files):**

```
package.json                                    — add lucide-react, @radix-ui/react-tooltip
index.html                                       — add font links
src/styles/globals.css                          — replace with @theme tokens + reduced motion
src/app/App.tsx                                  — wrap children with <ToastProvider>
src/atlas-ui/reader/ReaderShell.tsx              — token replacement, icon replacement
src/atlas-ui/reader/ReaderTopBar.tsx             — logo icon, tabular nums
src/atlas-ui/reader/ReaderBottomBar.tsx          — bg-page, icon buttons
src/atlas-ui/reader/PageViewport.tsx             — empty state, zoom button
src/atlas-ui/reader/MagazineReader.tsx           — alert → toast
src/atlas-ui/comments/CommentPin.tsx             — rewrite using Pin primitive
src/atlas-ui/comments/CommentPanel.tsx           — DrawerHeader, animations, icons
src/atlas-ui/notes/NotesDrawer.tsx               — DrawerHeader, animations, icons, empty state
src/atlas-ui/glossary/Term.tsx                   — use Tooltip primitive
src/atlas-ui/glossary/GlossaryPageTemplate.tsx   — token cleanup, Chip
src/atlas-ui/renderers/ContentBlockRenderer.tsx  — use Callout primitive
src/atlas-ui/renderers/TOCPageTemplate.tsx       — fix route, style with tokens
src/atlas-ui/renderers/PageRenderer.tsx          — pass bookSlug to TOCPageTemplate
src/atlas-ui/overlay/HotspotLayer.tsx            — token cleanup
src/atlas-ui/comments/__tests__/CommentPin.test.tsx — update assertions
```

**Delete:**

```
src/atlas-ui/glossary/Tooltip.tsx                — replaced by primitives/Tooltip.tsx
```

---

## Conventions

- **Test runner:** `npm test` (Vitest, runs once). Watch mode is `npm run test:watch`.
- **Lint:** `npm run lint`. Must stay green.
- **Dev server:** `npm run dev` (Vite, port 5173).
- **Commit messages:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`).
- **TDD:** Every primitive starts with a failing test. Every bug fix gets a regression test that fails first.
- **Imports:** Use `@/` alias only when crossing top-level directories; same-directory imports use relative paths.

---

# Phase 1 — Tokens & Dependencies

Sets the foundation. After Phase 1, the app should still render (worse than before due to missing utility classes that no longer exist), but token build infrastructure is in place.

## Task 1.1: Install lucide-react & @radix-ui/react-tooltip

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install lucide-react@^0.500.0 @radix-ui/react-tooltip@^1.2.0
```

Expected: `package.json` updated, `package-lock.json` updated.

- [ ] **Step 2: Verify installation**

Run:
```bash
npm ls lucide-react @radix-ui/react-tooltip
```

Expected: both packages listed with versions in the expected range.

- [ ] **Step 3: Run existing tests to confirm nothing broke**

Run:
```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lucide-react and @radix-ui/react-tooltip for visual system"
```

---

## Task 1.2: Add font links to `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace `<head>` to include font preconnects and font links**

Replace the contents of `index.html` with:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VAT Atlas — 德国/欧盟 VAT 财务速查图册</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+Pro:wght@600;700&family=JetBrains+Mono:wght@500&family=Noto+Serif+SC:wght@600;700&display=swap"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Run existing tests**

Run:
```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "chore: load Inter, Source Serif Pro, JetBrains Mono, Noto Serif SC from Google Fonts"
```

---

## Task 1.3: Replace `globals.css` with `@theme` tokens

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Replace file contents**

Overwrite `src/styles/globals.css` with:

```css
@import "tailwindcss";

@theme {
  /* === Neutral === */
  --color-chrome: #0F172A;
  --color-chrome-2: #1E293B;
  --color-text: #0F172A;
  --color-text-2: #475569;
  --color-text-muted: #94A3B8;
  --color-divider: #CBD5E1;
  --color-border: #E2E8F0;
  --color-surface: #F1F5F9;
  --color-surface-2: #F8FAFC;
  --color-page: #FFFFFF;

  /* === Accent (blue) === */
  --color-accent: #1D4ED8;
  --color-accent-hover: #1E40AF;
  --color-accent-strong: #1E3A8A;
  --color-accent-2: #60A5FA;
  --color-accent-soft: #93C5FD;
  --color-accent-bg: #DBEAFE;
  --color-accent-bg-2: #BFDBFE;
  --color-accent-bg-faint: #EFF6FF;

  /* === Typography === */
  --font-sans: "Inter", "Noto Sans SC", system-ui, sans-serif;
  --font-serif: "Source Serif Pro", "Noto Serif SC", Georgia, serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  /* === Shadows === */
  --shadow-1: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-2: 0 4px 12px rgba(15, 23, 42, 0.08);
  --shadow-3: 0 10px 24px rgba(15, 23, 42, 0.20);
}

:root {
  color-scheme: light;
}

body {
  margin: 0;
  background-color: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.term {
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--color-accent);
  text-underline-offset: 4px;
  cursor: help;
}

/* Reduce motion site-wide when user prefers it */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Smoke-test the dev server**

Run:
```bash
npm run dev
```

Expected: server starts, no compile errors. Stop with Ctrl+C.

(Note: visual regressions are expected — existing components still reference `bg-stone-*` etc. They'll be cleaned up in Phase 4-5.)

- [ ] **Step 3: Run tests**

Run:
```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: introduce design tokens (slate + blue) via Tailwind @theme"
```

---

# Phase 2 — Basic Primitives

Each primitive is TDD: failing test → implementation → green. The primitives have no dependencies beyond React + lucide-react + Tailwind.

## Task 2.1: `Icon` primitive

**Files:**
- Create: `src/atlas-ui/primitives/Icon.tsx`
- Create: `src/atlas-ui/primitives/__tests__/Icon.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/atlas-ui/primitives/__tests__/Icon.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Check } from 'lucide-react';
import { Icon } from '../Icon';

describe('Icon', () => {
  it('renders an svg with the provided lucide icon', () => {
    const { container } = render(<Icon icon={Check} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('defaults size to 16px', () => {
    const { container } = render(<Icon icon={Check} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });

  it('respects explicit size', () => {
    const { container } = render(<Icon icon={Check} size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('uses stroke-width 2 by default', () => {
    const { container } = render(<Icon icon={Check} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('stroke-width', '2');
  });

  it('sets aria-hidden by default', () => {
    const { container } = render(<Icon icon={Check} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('can be made non-hidden', () => {
    const { container } = render(<Icon icon={Check} aria-hidden={false} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('aria-hidden');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Icon.test.tsx
```

Expected: FAIL — `Cannot find module '../Icon'`.

- [ ] **Step 3: Implement `Icon`**

Create `src/atlas-ui/primitives/Icon.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react';

export type IconSize = 14 | 16 | 18 | 20 | 24;

export type IconProps = {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  'aria-hidden'?: boolean;
};

export function Icon({ icon: LucideIconComp, size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <LucideIconComp
      width={size}
      height={size}
      strokeWidth={2}
      className={className}
      aria-hidden={ariaHidden ? true : undefined}
    />
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Icon.test.tsx
```

Expected: PASS — 6 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/primitives/Icon.tsx src/atlas-ui/primitives/__tests__/Icon.test.tsx
git commit -m "feat(primitives): add Icon wrapper for lucide-react"
```

---

## Task 2.2: `Button` primitive

**Files:**
- Create: `src/atlas-ui/primitives/Button.tsx`
- Create: `src/atlas-ui/primitives/__tests__/Button.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/atlas-ui/primitives/__tests__/Button.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>保存</Button>);
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>保存</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders leadingIcon', () => {
    const { container } = render(<Button leadingIcon={Check}>保存</Button>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders trailingIcon', () => {
    const { container } = render(<Button trailingIcon={Check}>下一页</Button>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>保存</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-accent');
  });

  it('applies ghost variant when specified', () => {
    render(<Button variant="ghost">取消</Button>);
    const btn = screen.getByRole('button');
    expect(btn).not.toHaveClass('bg-accent');
    expect(btn.className).toMatch(/bg-transparent|hover:bg-surface-2/);
  });

  it('respects disabled state', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>保存</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('iconOnly requires aria-label', () => {
    render(<Button iconOnly leadingIcon={Trash2} aria-label="删除" />);
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument();
  });

  it('forwards type attribute', () => {
    render(<Button type="submit">提交</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Button.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Button`**

Create `src/atlas-ui/primitives/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger-default'
  | 'danger-confirm';

export type ButtonSize = 'sm' | 'md';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  iconOnly?: boolean;
  children?: ReactNode;
};

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium leading-none transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3.5 text-[13px]',
};

const SIZE_ICON_ONLY: Record<ButtonSize, string> = {
  sm: 'h-7 w-7 px-0',
  md: 'h-8 w-8 px-0',
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-page hover:bg-accent-hover',
  secondary:
    'bg-page text-text border border-border hover:bg-surface-2 hover:border-divider',
  ghost: 'bg-transparent text-text-2 hover:bg-surface-2 hover:text-text',
  'danger-default':
    'bg-page text-text-2 border border-border hover:bg-surface-2 hover:text-text hover:border-divider',
  'danger-confirm': 'bg-chrome text-page hover:bg-chrome-2 border border-chrome',
};

const ICON_SIZE: Record<ButtonSize, 14 | 16> = { sm: 14, md: 16 };

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  iconOnly,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const iconSize = ICON_SIZE[size];
  return (
    <button
      type={type}
      className={[BASE, iconOnly ? SIZE_ICON_ONLY[size] : SIZE[size], VARIANT[variant], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {leadingIcon ? <Icon icon={leadingIcon} size={iconSize} /> : null}
      {!iconOnly ? children : null}
      {trailingIcon ? <Icon icon={trailingIcon} size={iconSize} /> : null}
    </button>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Button.test.tsx
```

Expected: PASS — 9 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/primitives/Button.tsx src/atlas-ui/primitives/__tests__/Button.test.tsx
git commit -m "feat(primitives): add Button with 5 variants and 2 sizes"
```

---

## Task 2.3: `Toggle` primitive

**Files:**
- Create: `src/atlas-ui/primitives/Toggle.tsx`
- Create: `src/atlas-ui/primitives/__tests__/Toggle.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/atlas-ui/primitives/__tests__/Toggle.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { FileText } from 'lucide-react';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('renders with leading icon and children', () => {
    render(<Toggle pressed={false} onPressedChange={vi.fn()} leadingIcon={FileText}>笔记</Toggle>);
    expect(screen.getByRole('button', { name: /笔记/ })).toBeInTheDocument();
  });

  it('sets aria-pressed=false when not pressed', () => {
    render(<Toggle pressed={false} onPressedChange={vi.fn()} leadingIcon={FileText}>笔记</Toggle>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('sets aria-pressed=true when pressed', () => {
    render(<Toggle pressed onPressedChange={vi.fn()} leadingIcon={FileText}>笔记</Toggle>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onPressedChange with toggled value when clicked', async () => {
    const handler = vi.fn();
    render(<Toggle pressed={false} onPressedChange={handler} leadingIcon={FileText}>笔记</Toggle>);
    await userEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledWith(true);
  });

  it('applies accent styling when pressed', () => {
    render(<Toggle pressed onPressedChange={vi.fn()} leadingIcon={FileText}>笔记</Toggle>);
    expect(screen.getByRole('button').className).toContain('bg-accent');
  });

  it('does not apply accent styling when not pressed', () => {
    render(<Toggle pressed={false} onPressedChange={vi.fn()} leadingIcon={FileText}>笔记</Toggle>);
    expect(screen.getByRole('button').className).not.toContain('bg-accent');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Toggle.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Toggle`**

Create `src/atlas-ui/primitives/Toggle.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type ToggleProps = {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
  leadingIcon: LucideIcon;
  children: ReactNode;
  size?: 'sm' | 'md';
  'aria-label'?: string;
  className?: string;
};

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium leading-none transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40';

const SIZE = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3.5 text-[13px]',
} as const;

const ON = 'bg-accent text-page hover:bg-accent-hover';
const OFF = 'bg-page text-text-2 border border-border hover:bg-surface-2 hover:text-text';

export function Toggle({
  pressed,
  onPressedChange,
  leadingIcon,
  children,
  size = 'md',
  className,
  ...rest
}: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={[BASE, SIZE[size], pressed ? ON : OFF, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <Icon icon={leadingIcon} size={size === 'sm' ? 14 : 16} />
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Toggle.test.tsx
```

Expected: PASS — 6 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/primitives/Toggle.tsx src/atlas-ui/primitives/__tests__/Toggle.test.tsx
git commit -m "feat(primitives): add Toggle with aria-pressed"
```

---

## Task 2.4: `Chip` primitive

**Files:**
- Create: `src/atlas-ui/primitives/Chip.tsx`
- Create: `src/atlas-ui/primitives/__tests__/Chip.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/atlas-ui/primitives/__tests__/Chip.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chip } from '../Chip';

describe('Chip', () => {
  it('renders children as text', () => {
    render(<Chip>3</Chip>);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('uses neutral variant by default', () => {
    render(<Chip>3</Chip>);
    expect(screen.getByText('3').className).toContain('bg-surface-2');
  });

  it('applies accent variant', () => {
    render(<Chip variant="accent">3</Chip>);
    expect(screen.getByText('3').className).toContain('bg-accent-bg');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Chip.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Chip`**

Create `src/atlas-ui/primitives/Chip.tsx`:

```tsx
import type { ReactNode } from 'react';

export type ChipProps = {
  variant?: 'neutral' | 'accent';
  children: ReactNode;
  className?: string;
};

const NEUTRAL = 'bg-surface-2 text-text-2';
const ACCENT = 'bg-accent-bg text-accent';

export function Chip({ variant = 'neutral', children, className }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums',
        variant === 'accent' ? ACCENT : NEUTRAL,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Chip.test.tsx
```

Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/primitives/Chip.tsx src/atlas-ui/primitives/__tests__/Chip.test.tsx
git commit -m "feat(primitives): add Chip"
```

---

## Task 2.5: `EmptyState` primitive

**Files:**
- Create: `src/atlas-ui/primitives/EmptyState.tsx`
- Create: `src/atlas-ui/primitives/__tests__/EmptyState.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/atlas-ui/primitives/__tests__/EmptyState.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={FileText} title="还没有笔记" description="切换章节再查看" />);
    expect(screen.getByText('还没有笔记')).toBeInTheDocument();
    expect(screen.getByText('切换章节再查看')).toBeInTheDocument();
  });

  it('renders icon as decorative', () => {
    const { container } = render(<EmptyState icon={FileText} title="还没有笔记" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders action when provided', () => {
    render(
      <EmptyState
        icon={FileText}
        title="还没有笔记"
        action={<button>添加笔记</button>}
      />,
    );
    expect(screen.getByRole('button', { name: '添加笔记' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/EmptyState.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `EmptyState`**

Create `src/atlas-ui/primitives/EmptyState.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center px-6 py-10 gap-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="text-divider mb-1">
        <Icon icon={icon} size={24} />
      </div>
      <div className="text-text font-medium text-sm">{title}</div>
      {description ? <div className="text-text-2 text-xs leading-relaxed">{description}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/EmptyState.test.tsx
```

Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/primitives/EmptyState.tsx src/atlas-ui/primitives/__tests__/EmptyState.test.tsx
git commit -m "feat(primitives): add EmptyState"
```

---

## Task 2.6: `motion.ts` shared presets

**Files:**
- Create: `src/atlas-ui/primitives/motion.ts`

- [ ] **Step 1: Create the file**

Create `src/atlas-ui/primitives/motion.ts`:

```ts
import type { Transition } from 'framer-motion';

export const MOTION = {
  drawerSpring: { type: 'spring', stiffness: 320, damping: 30 } satisfies Transition,
  drawerExit: { duration: 0.18, ease: 'easeIn' } satisfies Transition,
  pageFade: { duration: 0.18, ease: 'easeOut' } satisfies Transition,
  pinPop: { type: 'spring', stiffness: 500, damping: 22 } satisfies Transition,
  hover: { duration: 0.12, ease: 'easeOut' } satisfies Transition,
} as const;
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
npm test
```

Expected: all tests pass (this file has no tests of its own — it's a constants module).

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/primitives/motion.ts
git commit -m "feat(primitives): add shared framer-motion presets"
```

---

# Phase 3 — Complex Primitives

These depend on third-party libraries (Radix, framer-motion) and have more behavior.

## Task 3.1: `Tooltip` primitive (Radix wrapper)

**Files:**
- Create: `src/atlas-ui/primitives/Tooltip.tsx`
- Create: `src/atlas-ui/primitives/__tests__/Tooltip.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/atlas-ui/primitives/__tests__/Tooltip.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Tooltip, TooltipProvider } from '../Tooltip';

describe('Tooltip', () => {
  it('shows tooltip content when trigger is focused', async () => {
    render(
      <TooltipProvider>
        <Tooltip content="完整术语说明">
          <button>WL</button>
        </Tooltip>
      </TooltipProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'WL' });
    trigger.focus();
    await screen.findByText('完整术语说明');
  });

  it('renders multi-line content without truncation classes', async () => {
    const longContent = '加工供货:承包人提供主要材料并加工后交付,按 § 3 Abs. 4 UStG 视为货物供应,适用相应税率。';
    render(
      <TooltipProvider>
        <Tooltip content={longContent}>
          <button>Werklieferung</button>
        </Tooltip>
      </TooltipProvider>,
    );
    const trigger = screen.getByRole('button');
    trigger.focus();
    const tip = await screen.findByText(longContent);
    expect(tip.className).not.toContain('whitespace-nowrap');
  });

  it('shows tooltip on mouse hover', async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip content="hover content">
          <button>trigger</button>
        </Tooltip>
      </TooltipProvider>,
    );
    await userEvent.hover(screen.getByRole('button'));
    await screen.findByText('hover content');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Tooltip.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Tooltip`**

Create `src/atlas-ui/primitives/Tooltip.tsx`:

```tsx
import type { ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

export const TooltipProvider = RadixTooltip.Provider;

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  collisionPadding?: number;
  asChild?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Tooltip({
  content,
  children,
  side = 'top',
  sideOffset = 6,
  collisionPadding = 8,
  asChild = true,
  open,
  onOpenChange,
}: TooltipProps) {
  return (
    <RadixTooltip.Root open={open} onOpenChange={onOpenChange}>
      <RadixTooltip.Trigger asChild={asChild}>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          className="z-50 max-w-[260px] rounded-md bg-chrome text-page text-xs leading-relaxed px-3 py-2 shadow-[var(--shadow-3)]"
        >
          {content}
          <RadixTooltip.Arrow className="fill-chrome" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Tooltip.test.tsx
```

Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/primitives/Tooltip.tsx src/atlas-ui/primitives/__tests__/Tooltip.test.tsx
git commit -m "feat(primitives): add Tooltip with Radix collision flip and multi-line support"
```

---

## Task 3.2: `Toast` primitive

**Files:**
- Create: `src/atlas-ui/primitives/Toast.tsx`
- Create: `src/atlas-ui/primitives/__tests__/Toast.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/atlas-ui/primitives/__tests__/Toast.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ToastProvider, useToast } from '../Toast';

function Demo() {
  const toast = useToast();
  return <button onClick={() => toast('Saved', { variant: 'success' })}>fire</button>;
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a toast when fired', async () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'fire' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('auto-dismisses after 3 seconds', async () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'fire' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(3500); });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('renders with role="status" for a11y', async () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'fire' }));
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Saved');
  });

  it('limits visible toasts to 3', async () => {
    function MultiDemo() {
      const toast = useToast();
      return (
        <button onClick={() => { toast('A'); toast('B'); toast('C'); toast('D'); }}>fire-many</button>
      );
    }
    render(
      <ToastProvider>
        <MultiDemo />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'fire-many' }));
    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Toast.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Toast`**

Create `src/atlas-ui/primitives/Toast.tsx`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, Info, X } from 'lucide-react';
import { Icon } from './Icon';

export type ToastVariant = 'default' | 'success' | 'error';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastOptions = {
  duration?: number;
  variant?: ToastVariant;
};

type ToastFn = (message: string, options?: ToastOptions) => void;

const ToastContext = createContext<ToastFn | null>(null);

const DEFAULT_DURATION = 3000;
const MAX_VISIBLE = 3;

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const handle = timeouts.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timeouts.current.delete(id);
    }
  }, []);

  const toast = useCallback<ToastFn>(
    (message, opts = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const next: ToastItem = {
        id,
        message,
        variant: opts.variant ?? 'default',
      };
      setToasts((prev) => {
        const merged = [...prev, next];
        return merged.length > MAX_VISIBLE ? merged.slice(merged.length - MAX_VISIBLE) : merged;
      });
      const handle = setTimeout(() => remove(id), opts.duration ?? DEFAULT_DURATION);
      timeouts.current.set(id, handle);
    },
    [remove],
  );

  useEffect(() => {
    const handles = timeouts.current;
    return () => {
      handles.forEach((h) => clearTimeout(h));
      handles.clear();
    };
  }, []);

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(<ToastViewport toasts={toasts} onClose={remove} />, document.body)
        : null}
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) {
  return (
    <ol
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <li key={t.id} className="pointer-events-auto">
          <ToastCard item={t} onClose={() => onClose(t.id)} />
        </li>
      ))}
    </ol>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const accent =
    item.variant === 'success'
      ? 'border-l-accent'
      : item.variant === 'error'
      ? 'border-l-chrome'
      : 'border-l-divider';
  const icon = item.variant === 'success' ? Check : item.variant === 'error' ? Info : Info;
  return (
    <div
      className={`flex items-start gap-2 bg-page border border-border border-l-2 ${accent} rounded-md px-3 py-2 shadow-[var(--shadow-2)] min-w-[260px]`}
    >
      <span className="text-accent mt-0.5">
        <Icon icon={icon} size={16} />
      </span>
      <div className="flex-1 text-[13px] text-text leading-relaxed">{item.message}</div>
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭通知"
        className="text-text-muted hover:text-text -mr-1 -mt-1 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40"
      >
        <Icon icon={X} size={14} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Toast.test.tsx
```

Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/primitives/Toast.tsx src/atlas-ui/primitives/__tests__/Toast.test.tsx
git commit -m "feat(primitives): add Toast + ToastProvider with auto-dismiss and FIFO limit"
```

---

## Task 3.3: `DrawerHeader` primitive

**Files:**
- Create: `src/atlas-ui/primitives/DrawerHeader.tsx`
- Create: `src/atlas-ui/primitives/__tests__/DrawerHeader.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/atlas-ui/primitives/__tests__/DrawerHeader.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MessageSquare } from 'lucide-react';
import { DrawerHeader } from '../DrawerHeader';

describe('DrawerHeader', () => {
  it('renders title and icon', () => {
    render(<DrawerHeader icon={MessageSquare} title="评论" onClose={vi.fn()} />);
    expect(screen.getByText('评论')).toBeInTheDocument();
  });

  it('renders count when provided', () => {
    render(<DrawerHeader icon={MessageSquare} title="评论" count={3} onClose={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('omits count chip when count is undefined', () => {
    render(<DrawerHeader icon={MessageSquare} title="评论" onClose={vi.fn()} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<DrawerHeader icon={MessageSquare} title="评论" onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /关闭/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/DrawerHeader.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `DrawerHeader`**

Create `src/atlas-ui/primitives/DrawerHeader.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { Icon } from './Icon';
import { Chip } from './Chip';
import { Button } from './Button';

export type DrawerHeaderProps = {
  icon: LucideIcon;
  title: string;
  count?: number;
  onClose: () => void;
};

export function DrawerHeader({ icon, title, count, onClose }: DrawerHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-text-2">
          <Icon icon={icon} size={18} />
        </span>
        <h2 className="text-text font-semibold text-sm truncate">{title}</h2>
        {count !== undefined ? <Chip>{count}</Chip> : null}
      </div>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        leadingIcon={X}
        onClick={onClose}
        aria-label={`关闭${title}`}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/DrawerHeader.test.tsx
```

Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/primitives/DrawerHeader.tsx src/atlas-ui/primitives/__tests__/DrawerHeader.test.tsx
git commit -m "feat(primitives): add DrawerHeader composing Icon/Chip/Button"
```

---

## Task 3.4: `Pin` primitive

**Files:**
- Create: `src/atlas-ui/primitives/Pin.tsx`
- Create: `src/atlas-ui/primitives/__tests__/Pin.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/atlas-ui/primitives/__tests__/Pin.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Pin } from '../Pin';

describe('Pin', () => {
  it('renders a button with the count', () => {
    render(<Pin status="open" highlighted={false} count={2} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('applies open-state class when status=open', () => {
    const { container } = render(
      <Pin status="open" highlighted={false} count={2} onClick={vi.fn()} />,
    );
    expect(container.querySelector('[data-pin-status="open"]')).not.toBeNull();
  });

  it('applies resolved-state class when status=resolved', () => {
    const { container } = render(
      <Pin status="resolved" highlighted={false} count={5} onClick={vi.fn()} />,
    );
    expect(container.querySelector('[data-pin-status="resolved"]')).not.toBeNull();
  });

  it('applies highlight data attribute when highlighted', () => {
    const { container } = render(
      <Pin status="open" highlighted count={1} onClick={vi.fn()} />,
    );
    expect(container.querySelector('[data-pin-highlighted="true"]')).not.toBeNull();
  });

  // Regression guard: ensure we never fall back to the old split('-') CSS-class-as-color hack.
  it('does not produce inline backgroundColor with raw tailwind class names', () => {
    const { container } = render(
      <Pin status="open" highlighted count={1} onClick={vi.fn()} />,
    );
    const inline = container.querySelector('[data-pin-status]') as HTMLElement;
    const bg = inline.style.backgroundColor;
    expect(bg).not.toMatch(/yellow|green|stone|400|600/);
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Pin status="open" highlighted={false} count={1} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fires onHover with entering=true on mouse enter', async () => {
    const onHover = vi.fn();
    render(<Pin status="open" highlighted={false} count={1} onClick={vi.fn()} onHover={onHover} />);
    await userEvent.hover(screen.getByRole('button'));
    expect(onHover).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Pin.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Pin`**

Create `src/atlas-ui/primitives/Pin.tsx`:

```tsx
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
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Pin.test.tsx
```

Expected: PASS — 7 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/primitives/Pin.tsx src/atlas-ui/primitives/__tests__/Pin.test.tsx
git commit -m "feat(primitives): add Pin with open/resolved/highlight states (no split-string CSS hack)"
```

---

## Task 3.5: `Callout` primitive

**Files:**
- Create: `src/atlas-ui/primitives/Callout.tsx`
- Create: `src/atlas-ui/primitives/__tests__/Callout.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/atlas-ui/primitives/__tests__/Callout.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Callout } from '../Callout';

describe('Callout', () => {
  it('renders title and body', () => {
    render(
      <Callout variant="info" title="提示">
        欧盟 VAT 调整
      </Callout>,
    );
    expect(screen.getByText('提示')).toBeInTheDocument();
    expect(screen.getByText('欧盟 VAT 调整')).toBeInTheDocument();
  });

  it.each(['info', 'warning', 'risk', 'legal', 'evidence'] as const)(
    'applies variant=%s without raising',
    (variant) => {
      const { container } = render(
        <Callout variant={variant} title="t">body</Callout>,
      );
      expect(container.querySelector(`[data-callout-variant="${variant}"]`)).not.toBeNull();
    },
  );

  it('renders without title', () => {
    render(<Callout variant="info">无标题正文</Callout>);
    expect(screen.getByText('无标题正文')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Callout.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Callout`**

Create `src/atlas-ui/primitives/Callout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Info, AlertTriangle, ShieldAlert, BookOpen, Check, type LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type CalloutVariant = 'info' | 'warning' | 'risk' | 'legal' | 'evidence';

export type CalloutProps = {
  variant: CalloutVariant;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

const STYLES: Record<CalloutVariant, { wrap: string; title: string; icon: LucideIcon }> = {
  info: {
    wrap: 'bg-surface-2 border border-border text-text-2',
    title: 'text-text',
    icon: Info,
  },
  warning: {
    wrap: 'bg-accent-bg-faint border border-accent-bg-2 text-accent-strong',
    title: 'text-accent-strong',
    icon: AlertTriangle,
  },
  risk: {
    wrap: 'bg-chrome text-divider border-l-[3px] border-l-accent-2',
    title: 'text-page',
    icon: ShieldAlert,
  },
  legal: {
    wrap: 'bg-surface-2 border border-border border-l-[3px] border-l-chrome text-text-2',
    title: 'text-text',
    icon: BookOpen,
  },
  evidence: {
    wrap: 'bg-page border border-accent-bg-2 border-l-[3px] border-l-accent text-text-2',
    title: 'text-accent',
    icon: Check,
  },
};

export function Callout({ variant, title, children, className }: CalloutProps) {
  const s = STYLES[variant];
  return (
    <div
      data-callout-variant={variant}
      className={['flex gap-2.5 rounded-md px-3.5 py-3 text-[13px] leading-relaxed', s.wrap, className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={`shrink-0 mt-0.5 ${s.title}`}>
        <Icon icon={s.icon} size={16} />
      </span>
      <div className="min-w-0">
        {title ? <div className={`font-semibold mb-0.5 ${s.title}`}>{title}</div> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/primitives/__tests__/Callout.test.tsx
```

Expected: PASS — 7 tests passed (1 base + 5 variants + 1 no-title).

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/primitives/Callout.tsx src/atlas-ui/primitives/__tests__/Callout.test.tsx
git commit -m "feat(primitives): add Callout with 5 monochrome variants"
```

---

## Task 3.6: Barrel `primitives/index.ts`

**Files:**
- Create: `src/atlas-ui/primitives/index.ts`

- [ ] **Step 1: Create the barrel file**

Create `src/atlas-ui/primitives/index.ts`:

```ts
export { Icon } from './Icon';
export type { IconProps, IconSize } from './Icon';

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Toggle } from './Toggle';
export type { ToggleProps } from './Toggle';

export { Chip } from './Chip';
export type { ChipProps } from './Chip';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { Tooltip, TooltipProvider } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export { ToastProvider, useToast } from './Toast';
export type { ToastVariant } from './Toast';

export { DrawerHeader } from './DrawerHeader';
export type { DrawerHeaderProps } from './DrawerHeader';

export { Pin } from './Pin';
export type { PinProps, PinStatus } from './Pin';

export { Callout } from './Callout';
export type { CalloutProps, CalloutVariant } from './Callout';

export { MOTION } from './motion';
```

- [ ] **Step 2: Run full test suite**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/primitives/index.ts
git commit -m "feat(primitives): add barrel export"
```

---

# Phase 4 — Shell Replacement

Replace emoji + stone palette in the reader shell. After Phase 4 the chrome looks correct; drawers/pins still on old style (Phase 5).

## Task 4.1: Wrap App with `ToastProvider` and `TooltipProvider`

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Update App.tsx**

Replace the body of `App.tsx` to wrap children:

```tsx
import { useParams } from 'react-router-dom';
import { MagazineReader } from '../atlas-ui/reader/MagazineReader';
import { createBookRegistry } from '../atlas-core/registry';
import { ToastProvider, TooltipProvider } from '../atlas-ui/primitives';
import type { BookManifest } from '../atlas-core/types/manifest';
import type { ImageAsset } from '../atlas-core/types/image';
import type { OverlayConfig } from '../atlas-core/types/overlay';
import type { GlossaryEntry } from '../atlas-core/types/glossary';
import type { LegalRef } from '../atlas-core/types/legal';
import type { VatScenario } from '../atlas-core/types/scenario';
import type { AtlasNote } from '../atlas-core/types/notes';
import type { PageContent } from '../atlas-core/types/content';
import type { CommentThread } from '../atlas-core/types/comments';

import { vatAtlasManifest } from '../books/de-eu-vat/manifest';
import { imageAssets } from '../books/de-eu-vat/imageAssets';
import { glossary } from '../books/de-eu-vat/glossary';
import { legalRefs } from '../books/de-eu-vat/legalRefs';
import { scenarios } from '../books/de-eu-vat/scenarios';
import { contents } from '../books/de-eu-vat/contents';
import { notes } from '../books/de-eu-vat/notes';
import { vatAtlasOverlays } from '../books/de-eu-vat/overlays/index.js';

const emptyComments: CommentThread[] = [];

const registry = createBookRegistry(
  vatAtlasManifest as unknown as BookManifest,
  imageAssets as unknown as ImageAsset[],
  vatAtlasOverlays as unknown as OverlayConfig[],
  glossary as unknown as GlossaryEntry[],
  legalRefs as unknown as LegalRef[],
  scenarios as unknown as VatScenario[],
  notes as unknown as AtlasNote[],
  contents as unknown as PageContent[],
  emptyComments,
);

export function App() {
  const { pageId } = useParams<{ pageId?: string }>();

  return (
    <TooltipProvider delayDuration={200}>
      <ToastProvider>
        <MagazineReader registry={registry} initialPageId={pageId} />
      </ToastProvider>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2: Run all tests**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/App.tsx
git commit -m "feat: wrap reader with ToastProvider and TooltipProvider"
```

---

## Task 4.2: Update `ReaderTopBar` with logo icon and tabular nums

**Files:**
- Modify: `src/atlas-ui/reader/ReaderTopBar.tsx`

- [ ] **Step 1: Replace `ReaderTopBar.tsx`**

```tsx
import { BookOpen } from 'lucide-react';
import { Icon } from '../primitives';
import type { LocalizedText } from '../../atlas-core/types/primitives';
import type { ReaderInteractionMode } from '../../atlas-core/types/primitives';

type ReaderTopBarProps = {
  title: LocalizedText;
  pageTitle?: LocalizedText;
  pageNumber?: number;
  totalPages: number;
  interactionMode: ReaderInteractionMode;
};

export function ReaderTopBar({
  title,
  pageTitle,
  pageNumber,
  totalPages,
  interactionMode,
}: ReaderTopBarProps) {
  const brand = title['zh-CN'] ?? '';
  const sub = pageTitle?.['zh-CN'];

  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-chrome text-page text-sm shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-accent-2"><Icon icon={BookOpen} size={18} /></span>
        <span className="font-semibold truncate">{brand}</span>
        {sub ? (
          <>
            <span className="text-text-muted">·</span>
            <span className="text-divider truncate">{sub}</span>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-divider shrink-0">
        {pageNumber != null ? (
          <span className="tabular-nums">
            {pageNumber} / {totalPages}
          </span>
        ) : null}
        {interactionMode === 'debugOverlay' ? (
          <span className="text-accent-2 text-xs font-mono">DEBUG</span>
        ) : null}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/reader/ReaderTopBar.tsx
git commit -m "refactor(reader): rewrite TopBar with logo icon, tokens, tabular nums"
```

---

## Task 4.3: Update `ReaderBottomBar` to use Button + tokens

**Files:**
- Modify: `src/atlas-ui/reader/ReaderBottomBar.tsx`

- [ ] **Step 1: Replace `ReaderBottomBar.tsx`**

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../primitives';

type ReaderBottomBarProps = {
  currentIndex: number;
  totalPages: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
};

export function ReaderBottomBar({
  currentIndex,
  totalPages,
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
}: ReaderBottomBarProps) {
  const progress = totalPages > 1 ? (currentIndex / (totalPages - 1)) * 100 : 100;

  return (
    <footer className="flex flex-col shrink-0 bg-page border-t border-border">
      <div className="h-1 bg-border">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between px-4 py-2">
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={ChevronLeft}
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          上一页
        </Button>
        <span className="text-xs text-text-2 tabular-nums">
          {currentIndex + 1} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          trailingIcon={ChevronRight}
          onClick={onNext}
          disabled={!canGoNext}
        >
          下一页
        </Button>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/reader/ReaderBottomBar.tsx
git commit -m "refactor(reader): rewrite BottomBar with Button primitive and accent progress"
```

---

## Task 4.4: Update `ReaderShell` toolbar with icons and Toggle

**Files:**
- Modify: `src/atlas-ui/reader/ReaderShell.tsx`

- [ ] **Step 1: Replace `ReaderShell.tsx`**

```tsx
import { FileText, MessageSquare, MousePointerClick, Eye, Upload, Download, Bug } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import type { NoteId } from '../../atlas-core/types/primitives';
import type { ZoomLevel } from '../renderers/ImageOverlayTemplate';
import { Button, Toggle } from '../primitives';
import { ReaderTopBar } from './ReaderTopBar';
import { ReaderBottomBar } from './ReaderBottomBar';
import { PageViewport } from './PageViewport';
import { NotesDrawer } from '../notes/NotesDrawer';
import { CommentPanel } from '../comments/CommentPanel';

type ReaderShellProps = {
  registry: BookRegistry;
  readerState: ReaderState;
  zoom: ZoomLevel;
  onCycleZoom: () => void;
  noteIds: NoteId[];
  notesOpen: boolean;
  onToggleNotes: () => void;
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
  commentsOpen: boolean;
  onToggleComments: () => void;
  onExportComments: () => void;
  onImportComments: () => void;
  onDeleteThread: (threadId: string) => void;
  onEditMessage: (threadId: string, messageId: string, text: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;
};

export function ReaderShell({
  registry,
  readerState,
  zoom,
  onCycleZoom,
  noteIds,
  notesOpen,
  onToggleNotes,
  commentThreads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onAddMessage,
  onResolve,
  onReopen,
  onCreateAnchor,
  commentsOpen,
  onToggleComments,
  onExportComments,
  onImportComments,
  onDeleteThread,
  onEditMessage,
  onDeleteMessage,
}: ReaderShellProps) {
  const { manifest } = registry;
  const { currentPage, interactionMode } = readerState;
  const featureFlags = manifest.featureFlags;
  const inCommentMode = interactionMode === 'comment';
  const inDebugMode = interactionMode === 'debugOverlay';

  return (
    <div className="flex flex-col h-dvh bg-surface" role="application" aria-label="VAT Atlas 阅读器">
      {manifest.navigation?.showTopBar && (
        <ReaderTopBar
          title={manifest.title}
          pageTitle={currentPage?.title}
          pageNumber={currentPage?.pageNumber}
          totalPages={readerState.totalPages}
          interactionMode={interactionMode}
        />
      )}

      <nav
        className="flex items-center gap-1 px-3 py-1.5 bg-page border-b border-border shrink-0"
        aria-label="工具栏"
      >
        {featureFlags?.notesDrawer && (
          <Toggle
            size="sm"
            pressed={notesOpen}
            onPressedChange={onToggleNotes}
            leadingIcon={FileText}
            aria-label="笔记面板"
          >
            笔记
          </Toggle>
        )}
        {featureFlags?.comments && (
          <>
            <Toggle
              size="sm"
              pressed={commentsOpen}
              onPressedChange={onToggleComments}
              leadingIcon={MessageSquare}
              aria-label={`评论面板 (${commentThreads.length} 条)`}
            >
              评论 ({commentThreads.length})
            </Toggle>
            <Toggle
              size="sm"
              pressed={inCommentMode}
              onPressedChange={() =>
                readerState.setInteractionMode(inCommentMode ? 'read' : 'comment')
              }
              leadingIcon={inCommentMode ? Eye : MousePointerClick}
              aria-label="切换评论模式"
            >
              评论模式
            </Toggle>
            <span className="w-px h-4 bg-divider mx-1" aria-hidden="true" />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              leadingIcon={Upload}
              onClick={onExportComments}
              aria-label="导出评论为 JSON"
              title="导出评论为 JSON"
            />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              leadingIcon={Download}
              onClick={onImportComments}
              aria-label="从 JSON 导入评论"
              title="从 JSON 导入评论"
            />
          </>
        )}
        {featureFlags?.debugOverlay && (
          <>
            <span className="w-px h-4 bg-divider mx-1" aria-hidden="true" />
            <Toggle
              size="sm"
              pressed={inDebugMode}
              onPressedChange={readerState.toggleDebugOverlay}
              leadingIcon={Bug}
              aria-label="切换调试覆盖层"
            >
              Debug
            </Toggle>
          </>
        )}
      </nav>

      <div className="flex-1 relative overflow-hidden">
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

        {featureFlags?.notesDrawer && noteIds.length > 0 && (
          <NotesDrawer
            noteIds={noteIds}
            registry={registry}
            open={notesOpen}
            onToggle={onToggleNotes}
          />
        )}

        {featureFlags?.comments && (
          <CommentPanel
            threads={commentThreads}
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
            open={commentsOpen}
            onToggle={onToggleComments}
          />
        )}
      </div>

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

- [ ] **Step 2: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass. (Existing toolbar tests in `src/atlas-ui/reader/__tests__/` may need assertion updates — see Step 3.)

- [ ] **Step 3: Update any failing toolbar/shell tests**

Run:
```bash
ls src/atlas-ui/reader/__tests__
```

If shell tests assert against old emoji text (`📝 笔记`, `💬 评论 (...)`), update them to assert against role + accessible name:

```tsx
expect(screen.getByRole('button', { name: /笔记/ })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /评论面板/ })).toBeInTheDocument();
```

(Aria-pressed assertions on `Toggle` should keep working.)

Then run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/atlas-ui/reader/ReaderShell.tsx src/atlas-ui/reader/__tests__
git commit -m "refactor(reader): rewrite toolbar with Toggle + Button + lucide icons"
```

---

## Task 4.5: Update `PageViewport` empty state and zoom button

**Files:**
- Modify: `src/atlas-ui/reader/PageViewport.tsx`

- [ ] **Step 1: Replace `PageViewport.tsx`**

```tsx
import { Link, useNavigate } from 'react-router-dom';
import { Maximize, Maximize2, ZoomIn, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import { useSpreadMode } from '../../atlas-core/reader/useSpreadMode';
import { PageRenderer } from '../renderers/PageRenderer';
import { SpreadPageRenderer } from '../renderers/SpreadPageRenderer';
import { HotspotLayer } from '../overlay/HotspotLayer';
import { DebugOverlay } from '../overlay/DebugOverlay';
import { CommentPinLayer } from '../comments/CommentPinLayer';
import { CommentCaptureLayer } from '../comments/CommentCaptureLayer';
import { Button, EmptyState } from '../primitives';
import type { HotspotTarget } from '../../atlas-core/types/overlay';
import type { CommentThread, AnnotationAnchor } from '../../atlas-core/types/comments';
import { resolveTargetRoute } from '../../atlas-core/registry/resolveTarget';
import type { PageManifest } from '../../atlas-core/types/page';
import type { ZoomLevel } from '../renderers/ImageOverlayTemplate';

const ZOOM_LABEL: Record<ZoomLevel, string> = {
  'fit-page': '适应页面',
  'fit-width': '适应宽度',
  'actual-size': '实际大小',
};

const ZOOM_ICON: Record<ZoomLevel, LucideIcon> = {
  'fit-page': Maximize,
  'fit-width': Maximize2,
  'actual-size': ZoomIn,
};

function PageContent({
  page,
  registry,
  interactionMode,
  onNavigate,
  zoom,
  onCycleZoom,
  commentThreads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onCreateAnchor,
}: {
  page: PageManifest;
  registry: BookRegistry;
  interactionMode: ReaderState['interactionMode'];
  onNavigate: (target: HotspotTarget) => void;
  zoom: ZoomLevel;
  onCycleZoom: () => void;
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
}) {
  const spreadMode = useSpreadMode(page, registry.manifest.reader);

  const imageAsset = page.image ? registry.getImage(page.image.assetId) : undefined;
  const effectiveImageAssetId = page.image?.assetId ?? '';
  const effectiveImageVersion = page.image?.version ?? '';

  const isFitPage = zoom === 'fit-page';
  const ZoomIconComp = ZOOM_ICON[zoom];

  const overlayConfig = page.overlay ? registry.getOverlay(page.overlay.overlayId) : undefined;

  function renderPins() {
    return (
      <CommentPinLayer
        threads={commentThreads}
        highlightedThreadId={highlightedThreadId}
        onHoverThread={onHoverThread}
        onClickThread={(id) => onSelectThread(id === selectedThreadId ? null : id)}
      />
    );
  }

  if (page.spreadImages && spreadMode.mode === 'spread') {
    return (
      <main className="flex-1 flex flex-col items-center overflow-auto bg-surface">
        <div className="sticky top-0 z-50 flex items-center gap-1 px-2 py-1 bg-page/90 backdrop-blur shrink-0 self-start border-b border-border">
          <Button variant="ghost" size="sm" leadingIcon={ZoomIconComp} onClick={onCycleZoom}>
            {ZOOM_LABEL[zoom]}
          </Button>
        </div>
        <div className="relative">
          <SpreadPageRenderer
            page={page}
            spreadImages={page.spreadImages}
            registry={registry}
            locale="zh-CN"
            spreadMode={spreadMode.mode}
            interactionMode={interactionMode}
            onNavigate={onNavigate}
          />
          {interactionMode === 'comment' && renderPins()}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center overflow-auto bg-surface">
      <div className="sticky top-0 z-50 flex items-center gap-2 px-2 py-1 bg-page/90 backdrop-blur shrink-0 self-start border-b border-border">
        <Button variant="ghost" size="sm" leadingIcon={ZoomIconComp} onClick={onCycleZoom}>
          {ZOOM_LABEL[zoom]}
        </Button>
        {imageAsset ? (
          <span className="text-text-muted text-xs tabular-nums">
            {imageAsset.width}×{imageAsset.height}
          </span>
        ) : null}
      </div>

      <div className={`relative ${isFitPage ? 'flex-1 flex items-center justify-center overflow-hidden' : ''}`}>
        <div className="relative">
          <PageRenderer
            page={page}
            imageAsset={imageAsset}
            locale="zh-CN"
            registry={registry}
            zoom={zoom}
          />

          {overlayConfig && interactionMode === 'read' && (
            <HotspotLayer overlay={overlayConfig} imageAsset={imageAsset} onNavigate={onNavigate} />
          )}

          {interactionMode === 'comment' && renderPins()}

          <CommentCaptureLayer
            pageId={page.pageId}
            imageAssetId={effectiveImageAssetId}
            imageVersion={effectiveImageVersion}
            active={interactionMode === 'comment'}
            onCreateAnchor={onCreateAnchor}
          />

          {overlayConfig && interactionMode === 'debugOverlay' && (
            <DebugOverlay overlay={overlayConfig} imageAsset={imageAsset} />
          )}
        </div>
      </div>
    </main>
  );
}

type PageViewportProps = {
  registry: BookRegistry;
  readerState: ReaderState;
  zoom: ZoomLevel;
  onCycleZoom: () => void;
  commentThreads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onCreateAnchor: (anchor: AnnotationAnchor) => void;
};

export function PageViewport({
  registry,
  readerState,
  zoom,
  onCycleZoom,
  commentThreads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onCreateAnchor,
}: PageViewportProps) {
  const { currentPage, interactionMode } = readerState;
  const navigate = useNavigate();
  const bookSlug = registry.manifest.slug;

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <EmptyState
          icon={BookOpen}
          title="页面未找到"
          description="可能链接已失效。返回首页继续阅读。"
          action={
            <Link
              to={`/book/${bookSlug}`}
              className="text-accent hover:text-accent-hover text-sm font-medium"
            >
              返回首页 →
            </Link>
          }
        />
      </div>
    );
  }

  function handleNavigate(target: HotspotTarget) {
    const route = resolveTargetRoute(target, registry.manifest.slug);
    if (route && target.kind !== 'external') {
      navigate(route);
    } else if (route && target.kind === 'external') {
      window.open(route, target.openInNewTab ? '_blank' : '_self');
    }
  }

  return (
    <PageContent
      page={currentPage}
      registry={registry}
      interactionMode={interactionMode}
      onNavigate={handleNavigate}
      zoom={zoom}
      onCycleZoom={onCycleZoom}
      commentThreads={commentThreads}
      selectedThreadId={selectedThreadId}
      highlightedThreadId={highlightedThreadId}
      onSelectThread={onSelectThread}
      onHoverThread={onHoverThread}
      onCreateAnchor={onCreateAnchor}
    />
  );
}
```

- [ ] **Step 2: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/reader/PageViewport.tsx
git commit -m "refactor(reader): replace emoji zoom toggle with Button + EmptyState"
```

---

# Phase 5 — Drawers + Comments + Notes + Callout

## Task 5.1: Update `NotesDrawer` with DrawerHeader and animations

**Files:**
- Modify: `src/atlas-ui/notes/NotesDrawer.tsx`

- [ ] **Step 1: Replace `NotesDrawer.tsx`**

```tsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { NoteId } from '../../atlas-core/types/primitives';
import { RichTextRenderer } from '../renderers/RichTextRenderer';
import { Chip, DrawerHeader, EmptyState, MOTION } from '../primitives';

type NotesDrawerProps = {
  noteIds: NoteId[];
  registry: BookRegistry;
  open: boolean;
  onToggle: () => void;
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  'speaker-note': '演讲备注',
  supplement: '补充材料',
  'legal-background': '法规背景',
  example: '示例',
  'authoring-note': '创作说明',
  'image-prompt-note': '图片生成提示',
  'review-note': '审阅备注',
};

export function NotesDrawer({ noteIds, registry, open, onToggle }: NotesDrawerProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const notes = noteIds
    .map((id) => registry.notes.get(id))
    .filter((n) => n != null)
    .filter((n) => n.visibility !== 'editor-only')
    .filter((n) => !filter || n.noteType === filter);

  const availableTypes = new Set(notes.map((n) => n.noteType));

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={MOTION.drawerSpring}
          className="fixed right-0 top-0 h-full w-96 bg-page border-l border-border z-40 flex flex-col shadow-[var(--shadow-2)]"
          role="dialog"
          aria-modal="false"
          aria-label="笔记面板"
        >
          <DrawerHeader icon={FileText} title="笔记" count={notes.length} onClose={onToggle} />

          {availableTypes.size > 1 && (
            <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border shrink-0">
              <button
                type="button"
                onClick={() => setFilter(null)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  !filter
                    ? 'bg-accent-bg text-accent'
                    : 'bg-surface-2 text-text-2 hover:text-text'
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
                    filter === type
                      ? 'bg-accent-bg text-accent'
                      : 'bg-surface-2 text-text-2 hover:text-text'
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
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass. If `NotesDrawer` tests assert the old `w-96`/`w-0` classes, update them to query the `role="dialog"` element.

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/notes/NotesDrawer.tsx src/atlas-ui/notes/__tests__
git commit -m "refactor(notes): NotesDrawer uses DrawerHeader, animation, EmptyState"
```

---

## Task 5.2: Update `CommentPanel` with DrawerHeader, icons, animations

**Files:**
- Modify: `src/atlas-ui/comments/CommentPanel.tsx`

- [ ] **Step 1: Replace `CommentPanel.tsx`**

```tsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Edit2, Trash2, Check, RotateCcw } from 'lucide-react';
import type { CommentThread, CommentMessage } from '../../atlas-core/types/comments';
import { CommentComposer } from './CommentComposer';
import { Button, DrawerHeader, EmptyState, MOTION } from '../primitives';

type CommentPanelProps = {
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
  open: boolean;
  onToggle: () => void;
};

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

function MessageItem({
  msg,
  threadId,
  onEdit,
  onDelete,
}: {
  msg: CommentMessage;
  threadId: string;
  onEdit: (threadId: string, messageId: string, text: string) => void;
  onDelete: (threadId: string, messageId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(
    msg.body.filter((n) => n.type === 'text').map((n) => n.value).join(''),
  );

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
              setEditText(msg.body.filter((n) => n.type === 'text').map((n) => n.value).join(''));
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
      <p className="text-text text-sm">
        {msg.body.filter((n) => n.type === 'text').map((n) => n.value).join('')}
      </p>
    </div>
  );
}

export function CommentPanel({
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
  open,
  onToggle,
}: CommentPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={MOTION.drawerSpring}
          className="fixed left-0 top-0 h-full w-80 bg-page border-r border-border z-40 flex flex-col shadow-[var(--shadow-2)]"
          role="dialog"
          aria-modal="false"
          aria-label="评论面板"
        >
          <DrawerHeader icon={MessageSquare} title="评论" count={threads.length} onClose={onToggle} />

          <div className="flex-1 overflow-y-auto">
            {threads.map((thread) => {
              const isSelected = selectedThreadId === thread.threadId;
              const isOpen = thread.status === 'open';
              const itemHighlight =
                highlightedThreadId === thread.threadId
                  ? 'bg-accent-bg-faint border-l-2 border-l-accent'
                  : isSelected
                  ? 'bg-surface-2'
                  : '';

              return (
                <div
                  key={thread.threadId}
                  className={`border-b border-border transition-colors ${itemHighlight}`}
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
                        className={`w-2 h-2 rounded-full ${
                          isOpen ? 'bg-accent' : 'bg-accent-soft'
                        }`}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDelete(null)}
                            >
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

            {threads.length === 0 && (
              <EmptyState
                icon={MessageSquare}
                title="这一页还没有评论"
                description="开启评论模式后,点击图片即可添加。"
              />
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Update `CommentComposer.tsx` to align with new tokens**

Replace `src/atlas-ui/comments/CommentComposer.tsx`:

```tsx
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../primitives';

type CommentComposerProps = {
  onSubmit: (text: string) => void;
  onCancel: () => void;
};

export function CommentComposer({ onSubmit, onCancel }: CommentComposerProps) {
  const [text, setText] = useState('');

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  }

  return (
    <div className="border-t border-border p-3 bg-surface-2 rounded-md">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="添加评论…"
        className="w-full bg-page text-text text-sm rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent-2/40 border border-border"
        rows={3}
      />
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>取消</Button>
        <Button variant="primary" size="sm" trailingIcon={Send} onClick={handleSubmit} disabled={!text.trim()}>
          发送
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass; update any text-based assertions to use role/name queries.

- [ ] **Step 4: Commit**

```bash
git add src/atlas-ui/comments/CommentPanel.tsx src/atlas-ui/comments/CommentComposer.tsx src/atlas-ui/comments/__tests__
git commit -m "refactor(comments): CommentPanel + Composer use primitives and tokens"
```

---

## Task 5.3: Rewrite `CommentPin` using `Pin` primitive

**Files:**
- Modify: `src/atlas-ui/comments/CommentPin.tsx`
- Modify: `src/atlas-ui/comments/__tests__/CommentPin.test.tsx`

- [ ] **Step 1: Update the test to reflect the new behavior**

Replace the section of `src/atlas-ui/comments/__tests__/CommentPin.test.tsx` that tests highlight colors with assertions on `data-pin-highlighted` and `data-pin-status`. Append (or rewrite) tests:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CommentPin } from '../CommentPin';
import type { CommentThread } from '../../../atlas-core/types/comments';

function buildThread(status: CommentThread['status']): CommentThread {
  return {
    threadId: `thread-${status}`,
    bookId: 'test',
    pageId: 'page-1',
    anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 45, y: 30 },
    status,
    category: 'question',
    messages: [
      {
        messageId: 'msg-1',
        authorId: 'user-1',
        body: [{ type: 'text', value: 'test' }],
        createdAt: new Date().toISOString(),
      },
    ],
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('CommentPin', () => {
  it('renders at correct percentage position', () => {
    const { container } = render(
      <CommentPin thread={buildThread('open')} onClick={vi.fn()} />,
    );
    const btn = container.querySelector('button');
    expect(btn).toHaveStyle({ left: '45%', top: '30%' });
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<CommentPin thread={buildThread('open')} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith('thread-open');
  });

  it('exposes status via data-pin-status', () => {
    const { container } = render(<CommentPin thread={buildThread('resolved')} onClick={vi.fn()} />);
    expect(container.querySelector('[data-pin-status="resolved"]')).not.toBeNull();
  });

  it('exposes highlight state via data attribute', () => {
    const { container } = render(
      <CommentPin thread={buildThread('open')} isHighlighted onClick={vi.fn()} />,
    );
    expect(container.querySelector('[data-pin-highlighted="true"]')).not.toBeNull();
  });

  it('does not produce inline backgroundColor with raw class names (regression)', () => {
    const { container } = render(
      <CommentPin thread={buildThread('open')} isHighlighted onClick={vi.fn()} />,
    );
    const html = container.innerHTML;
    expect(html).not.toMatch(/background-color:\s*(yellow|green|stone)-\d+/);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/atlas-ui/comments/__tests__/CommentPin.test.tsx
```

Expected: FAIL on the data-attribute assertions.

- [ ] **Step 3: Rewrite `CommentPin.tsx`**

Replace `src/atlas-ui/comments/CommentPin.tsx`:

```tsx
import type { CommentThread } from '../../atlas-core/types/comments';
import { Pin } from '../primitives';

type CommentPinProps = {
  thread: CommentThread;
  onClick: (threadId: string) => void;
  isHighlighted?: boolean;
  onHover?: (threadId: string | null) => void;
};

export function CommentPin({ thread, onClick, isHighlighted = false, onHover }: CommentPinProps) {
  const anchor = thread.anchor;
  if (anchor.kind !== 'imagePoint' && anchor.kind !== 'imageRect') return null;

  const x = anchor.kind === 'imagePoint' ? anchor.x : anchor.rect.x + anchor.rect.width / 2;
  const y = anchor.kind === 'imagePoint' ? anchor.y : anchor.rect.y + anchor.rect.height / 2;

  const pinStatus = thread.status === 'resolved' ? 'resolved' : 'open';
  const lastMessage = thread.messages[thread.messages.length - 1];
  const preview =
    lastMessage?.body
      .filter((n) => n.type === 'text')
      .map((n) => n.value)
      .join('')
      .slice(0, 24) ?? '新评论';

  return (
    <button
      type="button"
      onClick={() => onClick(thread.threadId)}
      onMouseEnter={() => onHover?.(thread.threadId)}
      onMouseLeave={() => onHover?.(null)}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-label={`评论 · ${thread.category} · ${thread.messages.length} 条 · ${preview}`}
    >
      <Pin
        status={pinStatus}
        highlighted={isHighlighted}
        count={thread.messages.length}
        onClick={() => onClick(thread.threadId)}
        onHover={(entering) => onHover?.(entering ? thread.threadId : null)}
        label={preview}
      />
    </button>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/atlas-ui/comments/__tests__/CommentPin.test.tsx
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/atlas-ui/comments/CommentPin.tsx src/atlas-ui/comments/__tests__/CommentPin.test.tsx
git commit -m "fix(comments): CommentPin uses Pin primitive (removes split('-') color bug)"
```

---

## Task 5.4: Update `ContentBlockRenderer` to use `Callout`

**Files:**
- Modify: `src/atlas-ui/renderers/ContentBlockRenderer.tsx`

- [ ] **Step 1: Replace `ContentBlockRenderer.tsx`**

```tsx
import { Square, FileText } from 'lucide-react';
import type { ContentBlock } from '../../atlas-core/types/content';
import type { BookRegistry } from '../../atlas-core/registry';
import { RichTextRenderer } from './RichTextRenderer';
import { Callout, Icon } from '../primitives';

type ContentBlockRendererProps = {
  block: ContentBlock;
  registry: BookRegistry;
  bookSlug: string;
};

export function ContentBlockRenderer({ block, registry, bookSlug }: ContentBlockRendererProps) {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as const;
      const sizeClass = {
        1: 'text-3xl font-bold font-serif',
        2: 'text-2xl font-semibold font-serif',
        3: 'text-xl font-semibold',
        4: 'text-lg font-medium',
      }[block.level];
      return (
        <Tag className={`${sizeClass} mt-6 mb-2 text-text`}>
          <RichTextRenderer nodes={block.text} registry={registry} bookSlug={bookSlug} />
        </Tag>
      );
    }

    case 'paragraph':
      return (
        <p className="my-2 text-text-2 leading-relaxed">
          <RichTextRenderer nodes={block.text} registry={registry} bookSlug={bookSlug} />
        </p>
      );

    case 'callout':
      return (
        <Callout
          variant={block.variant as 'info' | 'warning' | 'risk' | 'legal' | 'evidence'}
          title={
            block.title ? (
              <RichTextRenderer nodes={block.title} registry={registry} bookSlug={bookSlug} />
            ) : undefined
          }
        >
          <RichTextRenderer nodes={block.body} registry={registry} bookSlug={bookSlug} />
        </Callout>
      );

    case 'checklist':
      return (
        <div className="my-3">
          {block.title && (
            <div className="font-semibold text-text mb-2">
              <RichTextRenderer nodes={block.title} registry={registry} bookSlug={bookSlug} />
            </div>
          )}
          <ul className="space-y-1">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-text-2">
                <span className="text-text-muted mt-1"><Icon icon={Square} size={14} /></span>
                <span>
                  <RichTextRenderer nodes={item} registry={registry} bookSlug={bookSlug} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'comparisonTable':
      return (
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {block.columns.map((col) => (
                  <th
                    key={col.columnId}
                    className="border border-border px-3 py-2 text-left text-text bg-surface-2"
                    style={col.width ? { width: col.width } : undefined}
                  >
                    <RichTextRenderer nodes={col.header} registry={registry} bookSlug={bookSlug} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.rowId}>
                  {block.columns.map((col) => (
                    <td key={col.columnId} className="border border-border px-3 py-2 text-text-2">
                      {row.cells[col.columnId] && (
                        <RichTextRenderer
                          nodes={row.cells[col.columnId]}
                          registry={registry}
                          bookSlug={bookSlug}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'scenarioSummary':
      return (
        <div className="my-3 p-4 bg-surface-2 rounded-md text-text-2 border border-border">
          <span className="text-text-muted text-xs">场景摘要: {block.scenarioId}</span>
        </div>
      );

    case 'decisionFlow':
      return (
        <div className="my-3 p-4 bg-surface-2 rounded-md text-text-2 border border-border">
          <span className="text-text-muted text-xs">判断流程: {block.scenarioId}</span>
        </div>
      );

    case 'glossary':
      return (
        <div className="my-3 p-4 bg-surface-2 rounded-md text-text-2 border border-border">
          <span className="text-text-muted text-xs">术语块: {block.termIds.join(', ')}</span>
        </div>
      );

    case 'imageCaption':
      return (
        <div className="my-1 text-sm text-text-2 italic">
          <RichTextRenderer nodes={block.caption} registry={registry} bookSlug={bookSlug} />
        </div>
      );

    case 'notesPlaceholder':
      return (
        <div className="my-2 text-xs text-text-muted flex items-center gap-1.5">
          <Icon icon={FileText} size={12} />
          笔记: {block.noteIds.join(', ')}
        </div>
      );

    default:
      return null;
  }
}
```

- [ ] **Step 2: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/renderers/ContentBlockRenderer.tsx
git commit -m "refactor(renderers): ContentBlockRenderer uses Callout primitive and tokens"
```

---

## Task 5.5: Update `Term` to use new `Tooltip` primitive

**Files:**
- Modify: `src/atlas-ui/glossary/Term.tsx`

- [ ] **Step 1: Replace `Term.tsx`**

```tsx
import { Link } from 'react-router-dom';
import type { GlossaryEntry } from '../../atlas-core/types/glossary';
import { Tooltip } from '../primitives';

type TermProps = {
  entry: GlossaryEntry;
  bookSlug: string;
  first?: boolean;
};

export function Term({ entry, bookSlug, first }: TermProps) {
  const displayText = first
    ? entry.firstMentionFormat
    : (entry.abbreviation ?? entry.original);

  const tooltipContent = (
    <span className="flex flex-col gap-1">
      <span className="font-semibold text-page">{entry.zh}</span>
      <span className="text-divider text-[11px]">
        {entry.original}
        {entry.abbreviation ? ` (${entry.abbreviation})` : ''}
      </span>
      <span className="text-divider text-[11px] mt-1 leading-relaxed">
        {entry.shortDefinition}
      </span>
      <Link
        to={`/book/${bookSlug}/glossary#${entry.termId}`}
        className="text-accent-2 text-[11px] hover:underline mt-1"
      >
        查看完整术语 →
      </Link>
    </span>
  );

  return (
    <Tooltip content={tooltipContent}>
      <span className="term" tabIndex={0} role="button">
        {displayText}
      </span>
    </Tooltip>
  );
}
```

- [ ] **Step 2: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass; update Term tests if they queried the old hover-only behavior. If Tooltip wraps the term in Radix, ensure `getByRole('button', { name: displayText })` still works (the Term has `role="button"`).

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/glossary/Term.tsx src/atlas-ui/glossary/__tests__
git commit -m "refactor(glossary): Term uses Radix-backed Tooltip primitive"
```

---

## Task 5.6: Delete legacy `glossary/Tooltip.tsx`

**Files:**
- Delete: `src/atlas-ui/glossary/Tooltip.tsx`

- [ ] **Step 1: Verify there are no other imports**

Run:
```bash
grep -rn "glossary/Tooltip" src
```

Expected: no results (Term was the last consumer).

- [ ] **Step 2: Delete file**

Run:
```bash
rm src/atlas-ui/glossary/Tooltip.tsx
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -u src/atlas-ui/glossary/Tooltip.tsx
git commit -m "chore(glossary): remove legacy Tooltip (replaced by primitives/Tooltip)"
```

---

## Task 5.7: Update `GlossaryPageTemplate` with tokens and Chip

**Files:**
- Modify: `src/atlas-ui/glossary/GlossaryPageTemplate.tsx`

- [ ] **Step 1: Replace `GlossaryPageTemplate.tsx`**

```tsx
import type { BookRegistry } from '../../atlas-core/registry';
import type { GlossaryCategory, GlossaryEntry } from '../../atlas-core/types/glossary';
import { Term } from './Term';
import { Chip } from '../primitives';

const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  'vat-basic': 'VAT 基础概念',
  goods: '货物供应',
  services: '服务给付',
  invoice: '发票与凭证',
  reporting: '申报与报告',
  legal: '法规与条文',
  customs: '海关',
  'reader-ui': '阅读器界面',
};

type GlossaryPageTemplateProps = {
  registry: BookRegistry;
};

export function GlossaryPageTemplate({ registry }: GlossaryPageTemplateProps) {
  const terms = Array.from(registry.glossary.values());
  const grouped = new Map<GlossaryCategory, GlossaryEntry[]>();
  for (const term of terms) {
    const list = grouped.get(term.category) ?? [];
    list.push(term);
    grouped.set(term.category, list);
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-8 text-text overflow-auto max-h-full bg-page">
      <h1 className="text-3xl font-bold font-serif mb-8 text-text">术语表</h1>

      {Array.from(grouped.entries()).map(([category, categoryTerms]) => (
        <section key={category} className="mb-8">
          <h2 className="text-xl font-semibold font-serif mb-4 text-text border-b border-border pb-2">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="space-y-4">
            {categoryTerms.map((entry) => (
              <div key={entry.termId} id={entry.termId} className="scroll-mt-16">
                <div className="flex items-baseline gap-2">
                  <Term entry={entry} bookSlug={registry.manifest.slug} first />
                </div>
                <p className="text-text-2 text-sm mt-1 ml-1 leading-relaxed">
                  {entry.shortDefinition}
                </p>
                {entry.relatedTermIds && entry.relatedTermIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-1 ml-1">
                    <span className="text-text-muted text-[11px]">相关术语:</span>
                    {entry.relatedTermIds.map((id) => {
                      const related = registry.getTerm(id);
                      const label = related ? `${related.zh}(${related.original})` : id;
                      return <Chip key={id}>{label}</Chip>;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/glossary/GlossaryPageTemplate.tsx
git commit -m "refactor(glossary): GlossaryPageTemplate uses tokens, serif, Chip"
```

---

## Task 5.8: Update `HotspotLayer` token cleanup

**Files:**
- Modify: `src/atlas-ui/overlay/HotspotLayer.tsx`

- [ ] **Step 1: Replace `HotspotLayer.tsx`**

```tsx
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
            type="button"
            onClick={() => onNavigate(hs.target)}
            title={hs.tooltip?.['zh-CN'] ?? hs.label?.['zh-CN']}
            className="absolute cursor-pointer transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40"
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
```

- [ ] **Step 2: Run tests**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/atlas-ui/overlay/HotspotLayer.tsx
git commit -m "refactor(overlay): HotspotLayer uses accent/border tokens"
```

---

# Phase 6 — P0 Bug Fixes & Integration

## Task 6.1: Fix `TOCPageTemplate` route + style

**Files:**
- Modify: `src/atlas-ui/renderers/TOCPageTemplate.tsx`
- Modify: `src/atlas-ui/renderers/PageRenderer.tsx`
- Create: `src/__tests__/tocPageNavigation.test.tsx`

- [ ] **Step 1: Write the failing integration test**

Create `src/__tests__/tocPageNavigation.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TOCPageTemplate } from '../atlas-ui/renderers/TOCPageTemplate';
import type { PageManifest } from '../atlas-core/types/page';

const tocPage = {
  pageId: 'toc',
  type: 'toc',
  title: { 'zh-CN': '目录' },
  layout: { mode: 'single' },
} as unknown as PageManifest;

function buildPage(id: string, num: number): PageManifest {
  return {
    pageId: id,
    type: 'imageOverlay',
    title: { 'zh-CN': `Page ${num}` },
    layout: { mode: 'single' },
    pageNumber: num,
  } as unknown as PageManifest;
}

describe('TOCPageTemplate', () => {
  it('generates full /book/<slug>/page/<id> links (regression: was missing slug)', () => {
    const order = ['p-1', 'p-2'];
    const getPage = (id: string) => buildPage(id, Number(id.replace('p-', '')));

    render(
      <MemoryRouter>
        <TOCPageTemplate
          page={tocPage}
          locale="zh-CN"
          readingOrder={order}
          getPage={getPage}
          bookSlug="de-eu-vat"
        />
      </MemoryRouter>,
    );

    const link1 = screen.getByRole('link', { name: /Page 1/ });
    expect(link1.getAttribute('href')).toBe('/book/de-eu-vat/page/p-1');
    const link2 = screen.getByRole('link', { name: /Page 2/ });
    expect(link2.getAttribute('href')).toBe('/book/de-eu-vat/page/p-2');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/__tests__/tocPageNavigation.test.tsx
```

Expected: FAIL — `TOCPageTemplate` doesn't accept `bookSlug`; link is `/page/p-1`.

- [ ] **Step 3: Fix `TOCPageTemplate.tsx`**

Replace `src/atlas-ui/renderers/TOCPageTemplate.tsx`:

```tsx
import { Link } from 'react-router-dom';
import type { PageManifest } from '../../atlas-core/types/page';

type TOCPageTemplateProps = {
  page: PageManifest;
  locale: string;
  readingOrder?: string[];
  getPage?: (pageId: string) => PageManifest | undefined;
  bookSlug: string;
};

export function TOCPageTemplate({
  page,
  locale,
  readingOrder,
  getPage,
  bookSlug,
}: TOCPageTemplateProps) {
  const items = readingOrder
    ?.map((pageId) => getPage?.(pageId))
    .filter((p): p is PageManifest => p != null);

  return (
    <div className="w-[1000px] min-h-[800px] bg-page text-text p-16">
      <h1 className="text-3xl font-bold font-serif mb-8">
        {page.title?.[locale] ?? '目录'}
      </h1>

      {items && items.length > 0 ? (
        <ol className="space-y-2">
          {items.map((p, i) => (
            <li key={p.pageId} className="flex items-baseline gap-4">
              <span className="text-text-muted text-sm w-8 text-right shrink-0 tabular-nums">
                {p.pageNumber ?? i + 1}
              </span>
              <Link
                to={`/book/${bookSlug}/page/${p.pageId}`}
                className="text-text hover:text-accent hover:underline text-lg"
              >
                {p.title?.[locale] ?? p.pageId}
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-text-2">目录内容将通过 readingOrder 动态生成</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update `PageRenderer.tsx` to pass `bookSlug`**

Replace `src/atlas-ui/renderers/PageRenderer.tsx`:

```tsx
import type { PageManifest } from '../../atlas-core/types/page';
import type { ImageAsset } from '../../atlas-core/types/image';
import type { BookRegistry } from '../../atlas-core/registry';
import type { ZoomLevel } from './ImageOverlayTemplate';
import { ImageOverlayTemplate } from './ImageOverlayTemplate';
import { CoverPageTemplate } from './CoverPageTemplate';
import { TOCPageTemplate } from './TOCPageTemplate';
import { GlossaryPageTemplate } from './GlossaryPageTemplate';

type PageRendererProps = {
  page: PageManifest;
  imageAsset?: ImageAsset;
  locale: string;
  registry?: BookRegistry;
  zoom?: ZoomLevel;
};

export function PageRenderer({ page, imageAsset, locale, registry, zoom }: PageRendererProps) {
  switch (page.type) {
    case 'cover':
      return <CoverPageTemplate page={page} imageAsset={imageAsset} locale={locale} zoom={zoom} />;
    case 'toc':
      return (
        <TOCPageTemplate
          page={page}
          locale={locale}
          readingOrder={registry?.manifest.readingOrder}
          getPage={registry ? (id: string) => registry.getPage(id) : undefined}
          bookSlug={registry?.manifest.slug ?? ''}
        />
      );
    case 'glossary':
      if (registry) {
        return <GlossaryPageTemplate registry={registry} />;
      }
      return <ImageOverlayTemplate page={page} imageAsset={imageAsset} locale={locale} zoom={zoom} />;
    case 'imageOverlay':
    case 'chapter':
    case 'decisionFlow':
    case 'caseStudy':
    case 'appendix':
    case 'scenarioDetail':
    case 'legalReference':
      return <ImageOverlayTemplate page={page} imageAsset={imageAsset} locale={locale} zoom={zoom} />;
    default:
      return (
        <div className="text-text-2 p-8">未知页面类型: {page.type}</div>
      );
  }
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run:
```bash
npm test src/__tests__/tocPageNavigation.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run all tests**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/atlas-ui/renderers/TOCPageTemplate.tsx src/atlas-ui/renderers/PageRenderer.tsx src/__tests__/tocPageNavigation.test.tsx
git commit -m "fix(toc): include bookSlug in TOC links (P0)"
```

---

## Task 6.2: Replace `alert()` with `useToast()` and add regression test

**Files:**
- Modify: `src/atlas-ui/reader/MagazineReader.tsx`
- Create: `src/__tests__/importToast.test.tsx`

- [ ] **Step 1: Write the failing integration test**

Create `src/__tests__/importToast.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
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

describe('Import comments toast', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
  });
  afterEach(() => {
    alertSpy.mockRestore();
    vi.useRealTimers();
  });

  function renderApp() {
    const registry = createBookRegistry(
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
    return render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={registry} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );
  }

  it('shows a toast (not native alert) after importing JSON', async () => {
    renderApp();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    const fileContent = JSON.stringify({ version: 1, comments: [] });
    const file = new File([fileContent], 'comments.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    // Wait for FileReader.onload
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(alertSpy).not.toHaveBeenCalled();
    expect(await screen.findByText(/导入/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npm test src/__tests__/importToast.test.tsx
```

Expected: FAIL — `alert` IS called.

- [ ] **Step 3: Update `MagazineReader.tsx`** (replace only `handleImportFile`)

Open `src/atlas-ui/reader/MagazineReader.tsx`. Replace the existing `handleImportFile` callback with:

```tsx
// At top of file, add import:
import { useToast } from '../primitives';

// Inside MagazineReader function, near other hooks:
const toast = useToast();

// Replace the existing handleImportFile:
const handleImportFile = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = commentStore.importJSON(text);
      refreshThreads();
      toast(`导入 ${result.imported} 条新评论 · 跳过 ${result.skipped} 条重复`, {
        variant: 'success',
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  },
  [commentStore, refreshThreads, toast],
);
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test src/__tests__/importToast.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run all tests**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/atlas-ui/reader/MagazineReader.tsx src/__tests__/importToast.test.tsx
git commit -m "fix(reader): replace alert() with toast for import feedback (P0)"
```

---

## Task 6.3: Add comment-pin highlight integration test

**Files:**
- Create: `src/__tests__/commentPinHighlight.test.tsx`

- [ ] **Step 1: Write the failing integration test**

Create `src/__tests__/commentPinHighlight.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CommentPin } from '../atlas-ui/comments/CommentPin';
import type { CommentThread } from '../atlas-core/types/comments';

const thread: CommentThread = {
  threadId: 'thread-x',
  bookId: 'test',
  pageId: 'page-1',
  anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 50, y: 50 },
  status: 'open',
  category: 'general',
  messages: [
    {
      messageId: 'm1',
      authorId: 'a1',
      body: [{ type: 'text', value: 'hi' }],
      createdAt: new Date().toISOString(),
    },
  ],
  createdBy: 'a1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('CommentPin highlight', () => {
  it('exposes data-pin-highlighted=true when isHighlighted', () => {
    const { container } = render(<CommentPin thread={thread} onClick={() => {}} isHighlighted />);
    expect(container.querySelector('[data-pin-highlighted="true"]')).not.toBeNull();
  });

  it('exposes data-pin-highlighted=false when not highlighted', () => {
    const { container } = render(<CommentPin thread={thread} onClick={() => {}} />);
    expect(container.querySelector('[data-pin-highlighted="false"]')).not.toBeNull();
  });

  // Regression guard:
  it('does not write tailwind class names as CSS color values', () => {
    const { container } = render(<CommentPin thread={thread} onClick={() => {}} isHighlighted />);
    expect(container.innerHTML).not.toMatch(/background-color:\s*(yellow|green|stone)-\d+/);
  });
});
```

- [ ] **Step 2: Run the test**

Run:
```bash
npm test src/__tests__/commentPinHighlight.test.tsx
```

Expected: PASS (already covered by Task 5.3, this is the integration-level guard).

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/commentPinHighlight.test.tsx
git commit -m "test: integration guard against CommentPin highlight regression"
```

---

## Task 6.4: Final verification

**Files:** none modified

- [ ] **Step 1: Search for stray emoji**

Run:
```bash
grep -RnE "(📝|💬|📤|📥|🐛|🖊|✏️|🗑|☐|✕)" src
```

Expected: no matches. If anything turns up, replace with a `lucide-react` icon and commit.

- [ ] **Step 2: Search for stray stone color tokens**

Run:
```bash
grep -RnE "(stone-[1-9])" src
```

Expected: no matches. If found, replace with the appropriate semantic token (`text-text`, `bg-surface`, `border-border`, …).

- [ ] **Step 3: Search for stray `alert(` outside tests**

Run:
```bash
grep -Rn "alert(" src --include="*.tsx" --include="*.ts" | grep -v __tests__
```

Expected: no matches.

- [ ] **Step 4: Run lint**

Run:
```bash
npm run lint
```

Expected: no errors. Warnings should be zero unless they preexisted.

- [ ] **Step 5: Run full test suite**

Run:
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Manual smoke test in the dev server**

Run:
```bash
npm run dev
```

In the browser, walk through:
1. Cover page renders with serif title.
2. TOC page links navigate to `/book/de-eu-vat/page/<id>` (no 404).
3. Open a content page — emoji-free toolbar, lucide icons.
4. Hover a term — multiline Tooltip with no truncation.
5. Toggle Notes drawer — slides in from the right with spring animation.
6. Toggle Comments drawer — slides in from the left.
7. Switch to 评论模式 — toolbar button shows pressed state; click on image creates a pin.
8. Hover a comment list item — corresponding pin shows highlight halo (and the regression bug is gone).
9. Import a JSON file via the toolbar — toast appears bottom-right, dismisses after 3 s. No native alert.
10. Resize to phone width — still readable (mobile polish is out of scope but should not be broken).

Stop the dev server with Ctrl+C.

- [ ] **Step 7: Final commit (if anything was tweaked)**

If smoke test surfaced minor adjustments, commit them:

```bash
git add -A
git commit -m "fix: polish from final smoke test"
```

If nothing changed, skip.

---

## Acceptance Criteria

This plan is complete when:

- [x] All Phase 1-6 tasks are checked off
- [ ] `grep -RnE "(📝|💬|📤|📥|🐛|🖊|✏️|🗑|☐|✕)" src` returns nothing
- [ ] `grep -RnE "stone-[1-9]" src` returns nothing
- [ ] `grep -Rn "alert(" src --include="*.tsx" --include="*.ts" | grep -v __tests__` returns nothing
- [ ] `npm test` passes (all unit + integration tests including new ones)
- [ ] `npm run lint` passes
- [ ] Manual smoke test passes for all 10 scenarios above
- [ ] Each phase has at least one commit (6+ commits total)

---

## Self-Review Notes

**Spec → Plan coverage:**
- §3.1 colors → Task 1.3 (globals.css)
- §3.2/3.3 typography → Task 1.2 (font links) + Task 1.3 (theme)
- §3.4 spacing/radius/shadow → Task 1.3 (theme variables)
- §3.5 motion → Task 2.6 (motion.ts) + Task 5.1 + 5.2 (drawer animations)
- §4 primitives → Tasks 2.1–2.6, 3.1–3.6
- §5.1 globals.css → Task 1.3
- §5.2 ReaderShell → Task 4.4
- §5.3 ReaderTopBar → Task 4.2
- §5.4 ReaderBottomBar → Task 4.3
- §5.5 PageViewport → Task 4.5
- §5.6 CommentPin → Task 5.3
- §5.7 CommentPanel → Task 5.2
- §5.8 NotesDrawer → Task 5.1
- §5.9 ContentBlockRenderer → Task 5.4
- §5.10/5.11 Term + Tooltip → Tasks 5.5, 5.6
- §5.12 GlossaryPageTemplate → Task 5.7
- §5.13 TOCPageTemplate → Task 6.1
- §5.14 MagazineReader alert → Task 6.2
- §5.15 HotspotLayer → Task 5.8
- §6 P0 bugs → all five mapped (CommentPin Task 5.3, Tooltip Tasks 3.1+5.5, setTimeout init in Task 3.1 by switching to Radix, TOC Task 6.1, alert Task 6.2)
- §8 dependencies → Task 1.1
- §9 tests → integrated per primitive + Tasks 6.1/6.2/6.3
- §11 6-phase plan → six Phase headers in this doc
- §13 acceptance checklist → mirrored in Acceptance Criteria above

**Known judgement calls inside the plan (worth flagging during execution):**
- `lucide-react` icons are looked up by named import; if any chosen icon doesn't exist in the installed version, swap to the closest alternative.
- Drawer animations use `motion.aside` inside `AnimatePresence`; existing `Drawer` tests may need to query by `role="dialog"`/`aria-label` instead of width classes.
- Task 5.5 keeps `Term`'s `role="button"` for backwards-compatible test queries.
- The `useToast` import in `MagazineReader` requires the `ToastProvider` already in `App.tsx` (Task 4.1) — keep these tasks in order.
