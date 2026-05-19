import { describe, it, expect } from 'vitest';
import { validateBundle, formatResult } from '../../../scripts/validate-bundle.mjs';
import type { ValidationError } from '../../../scripts/validate-bundle.d.mts';

const FIXTURES = new URL('fixtures/', import.meta.url).pathname;
const VALID = FIXTURES + 'valid-bundle';
const BROKEN = FIXTURES + 'broken-bundle';

type Err = ValidationError;

describe('validate-bundle — basic shape', () => {
  it('valid bundle returns passed=true with no errors', async () => {
    const result = await validateBundle(VALID);
    expect(result.passed).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('broken bundle (missing manifest version) returns error', async () => {
    const result = await validateBundle(BROKEN);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e: Err) => e.kind === 'manifest-missing-field' && e.field === 'version')).toBe(true);
  });

  it('broken bundle (missing imageFile) reports per-page error', async () => {
    const result = await validateBundle(BROKEN);
    expect(result.errors.some((e: Err) => e.kind === 'missing-image' && e.file === 'missing.png')).toBe(true);
  });

  it('reports stats with page/glossary counts', async () => {
    const result = await validateBundle(VALID);
    expect(result.stats.pages).toBe(1);
    expect(result.stats.glossary).toBe(1);
    expect(result.stats.images).toBe(1);
  });

  it('rejects nonexistent bundle path', async () => {
    const result = await validateBundle(FIXTURES + 'does-not-exist');
    expect(result.passed).toBe(false);
    expect(result.errors.some((e: Err) => e.kind === 'bundle-not-found')).toBe(true);
  });
});

describe('validate-bundle — dangling references', () => {
  it('flags page.noteIds[] referencing missing noteId', async () => {
    const result = await validateBundle(BROKEN);
    expect(
      result.errors.some(
        (e: Err) => e.kind === 'dangling-ref' && e.refType === 'noteId' && e.value === 'nope-dangling',
      ),
    ).toBe(true);
  });

  it('flags notes.bookId !== manifest.bookId', async () => {
    const result = await validateBundle(BROKEN);
    expect(result.errors.some((e: Err) => e.kind === 'book-id-mismatch')).toBe(true);
  });
});

describe('validate-bundle — uniqueness', () => {
  it('flags duplicate pageId', async () => {
    const result = await validateBundle(BROKEN);
    expect(result.errors.some((e: Err) => e.kind === 'duplicate-id' && e.field === 'pageId')).toBe(true);
  });

  it('flags duplicate glossary termId', async () => {
    const result = await validateBundle(BROKEN);
    expect(result.errors.some((e: Err) => e.kind === 'duplicate-id' && e.field === 'termId')).toBe(true);
  });
});

describe('validate-bundle — output formatters', () => {
  it('text mode includes ✓ for passing checks and "Result: PASS"', async () => {
    const result = await validateBundle(VALID);
    const out = formatResult(result, { mode: 'text', quiet: false });
    expect(out).toContain('✓');
    expect(out).toContain('Result: PASS');
  });

  it('text mode shows "Result: FAIL" when failing', async () => {
    const result = await validateBundle(BROKEN);
    const out = formatResult(result, { mode: 'text', quiet: false });
    expect(out).toContain('✗');
    expect(out).toContain('Result: FAIL');
  });

  it('json mode emits valid JSON', async () => {
    const result = await validateBundle(VALID);
    const out = formatResult(result, { mode: 'json', quiet: false });
    const parsed = JSON.parse(out);
    expect(parsed.passed).toBe(true);
    expect(parsed.stats.pages).toBe(1);
  });

  it('quiet text mode hides ✓ lines but shows errors + final result', async () => {
    const result = await validateBundle(BROKEN);
    const out = formatResult(result, { mode: 'text', quiet: true });
    expect(out).not.toMatch(/^✓/m);
    expect(out).toContain('✗');
    expect(out).toContain('Result: FAIL');
  });
});
