// scripts/validate-bundle.mjs
// VAT Atlas bundle validator. Zero deps, Node 22+ ESM.

import { access, readFile, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { argv, cwd, exit } from 'node:process';

const REQUIRED_MANIFEST_FIELDS = ['schemaVersion', 'bookId', 'slug', 'title', 'version'];
const REQUIRED_PAGE_FIELDS = ['sectionCode', 'pageId', 'title', 'imageFile', 'canvas'];
const REQUIRED_GLOSSARY_FIELDS = ['termId', 'zh', 'original', 'category', 'shortDefinition', 'firstMentionFormat'];
const OPTIONAL_DATA_FILES = ['notes', 'scenarios', 'contents', 'legal-refs'];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson(p) {
  const raw = await readFile(p, 'utf8');
  return JSON.parse(raw);
}

// ---- helpers ----

function collectIds(arr, idField) {
  const seen = new Map();
  const duplicates = [];
  for (let i = 0; i < arr.length; i += 1) {
    const v = arr[i]?.[idField];
    if (v == null) continue;
    if (seen.has(v)) {
      duplicates.push({ value: v, indices: [seen.get(v), i] });
    } else {
      seen.set(v, i);
    }
  }
  return { ids: new Set(seen.keys()), duplicates };
}

function checkDanglingRef(refType, value, targetSet, sourceIndex, errors) {
  if (value == null) return;
  if (!targetSet.has(value)) {
    errors.push({ kind: 'dangling-ref', refType, value, sourceIndex });
  }
}

// ---- main validator ----

export async function validateBundle(bundlePath) {
  const errors = [];
  const warnings = [];
  const stats = {
    pages: 0,
    glossary: 0,
    notes: 0,
    scenarios: 0,
    contents: 0,
    legalRefs: 0,
    images: 0,
    overlays: 0,
  };

  // 1. Bundle path exists
  if (!(await exists(bundlePath))) {
    errors.push({ kind: 'bundle-not-found', path: bundlePath });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  const bundleStat = await stat(bundlePath);
  if (!bundleStat.isDirectory()) {
    errors.push({ kind: 'bundle-not-directory', path: bundlePath });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  // 2. manifest.json
  const manifestPath = join(bundlePath, 'manifest.json');
  if (!(await exists(manifestPath))) {
    errors.push({ kind: 'manifest-missing', file: 'manifest.json' });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  let manifest;
  try {
    manifest = await readJson(manifestPath);
  } catch (err) {
    errors.push({ kind: 'manifest-invalid-json', message: String(err) });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!(field in manifest)) {
      errors.push({ kind: 'manifest-missing-field', field });
    }
  }

  // 3. pages.json
  const pagesPath = join(bundlePath, 'data', 'pages.json');
  if (!(await exists(pagesPath))) {
    errors.push({ kind: 'pages-missing', file: 'data/pages.json' });
    return { bundlePath, passed: errors.length === 0, errors, warnings, stats };
  }

  let pages;
  try {
    pages = await readJson(pagesPath);
  } catch (err) {
    errors.push({ kind: 'pages-invalid-json', message: String(err) });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  if (!Array.isArray(pages) || pages.length === 0) {
    errors.push({ kind: 'pages-empty' });
    return { bundlePath, passed: false, errors, warnings, stats };
  }

  stats.pages = pages.length;

  // 4. Per-page required fields + image existence
  for (let i = 0; i < pages.length; i += 1) {
    const p = pages[i];
    for (const field of REQUIRED_PAGE_FIELDS) {
      if (!(field in p)) {
        errors.push({ kind: 'page-missing-field', index: i, field });
      }
    }
    if (p.imageFile) {
      const imgPath = join(bundlePath, 'images', basename(p.imageFile));
      if (await exists(imgPath)) {
        stats.images += 1;
      } else {
        errors.push({ kind: 'missing-image', index: i, file: p.imageFile });
      }
    }
  }

  // 5. Optional JSON files: glossary + notes + scenarios + contents + legal-refs
  const glossaryPath = join(bundlePath, 'data', 'glossary.json');
  let glossary = [];
  if (await exists(glossaryPath)) {
    try {
      glossary = await readJson(glossaryPath);
    } catch (err) {
      errors.push({ kind: 'glossary-invalid-json', message: String(err) });
      glossary = [];
    }
    if (!Array.isArray(glossary)) {
      errors.push({ kind: 'glossary-not-array' });
    } else {
      stats.glossary = glossary.length;
      for (let i = 0; i < glossary.length; i += 1) {
        const g = glossary[i];
        for (const field of REQUIRED_GLOSSARY_FIELDS) {
          if (!(field in g)) {
            errors.push({ kind: 'glossary-missing-field', index: i, field });
          }
        }
      }
    }
  } else {
    warnings.push({ kind: 'missing-optional-file', file: 'data/glossary.json' });
  }

  const FILE_TO_KEY = {
    'notes': 'notes',
    'scenarios': 'scenarios',
    'contents': 'contents',
    'legal-refs': 'legalRefs',
  };

  const loaded = { notes: [], scenarios: [], contents: [], legalRefs: [] };

  for (const optName of OPTIONAL_DATA_FILES) {
    const p = join(bundlePath, 'data', `${optName}.json`);
    if (await exists(p)) {
      try {
        const arr = await readJson(p);
        if (!Array.isArray(arr)) {
          errors.push({ kind: 'optional-not-array', file: `data/${optName}.json` });
        } else {
          loaded[FILE_TO_KEY[optName]] = arr;
          stats[FILE_TO_KEY[optName]] = arr.length;
        }
      } catch (err) {
        errors.push({ kind: 'optional-invalid-json', file: `data/${optName}.json`, message: String(err) });
      }
    } else {
      warnings.push({ kind: 'missing-optional-file', file: `data/${optName}.json` });
    }
  }

  // 6. Uniqueness — pageId
  const { duplicates: pageDup } = collectIds(pages, 'pageId');
  for (const d of pageDup) {
    errors.push({ kind: 'duplicate-id', field: 'pageId', value: d.value, indices: d.indices });
  }

  // Uniqueness — termId (glossary)
  let glossaryIdSet = new Set();
  if (Array.isArray(glossary)) {
    const { ids, duplicates } = collectIds(glossary, 'termId');
    glossaryIdSet = ids;
    for (const d of duplicates) {
      errors.push({ kind: 'duplicate-id', field: 'termId', value: d.value, indices: d.indices });
    }
  }

  // Uniqueness — noteId / scenarioId / contentId / legalRefId
  const noteIdSet = new Set();
  const scenarioIdSet = new Set();
  const contentIdSet = new Set();
  const legalRefIdSet = new Set();

  const UNIQ_TARGETS = [
    { arr: loaded.notes, idField: 'noteId', set: noteIdSet },
    { arr: loaded.scenarios, idField: 'scenarioId', set: scenarioIdSet },
    { arr: loaded.contents, idField: 'contentId', set: contentIdSet },
    { arr: loaded.legalRefs, idField: 'legalRefId', set: legalRefIdSet },
  ];
  for (const { arr, idField, set } of UNIQ_TARGETS) {
    const { ids, duplicates } = collectIds(arr, idField);
    for (const id of ids) set.add(id);
    for (const d of duplicates) {
      errors.push({ kind: 'duplicate-id', field: idField, value: d.value, indices: d.indices });
    }
  }

  // 7. Dangling refs from pages → notes / scenarios / contents / legal-refs
  for (let i = 0; i < pages.length; i += 1) {
    const p = pages[i];
    for (const noteId of p.noteIds ?? []) {
      checkDanglingRef('noteId', noteId, noteIdSet, i, errors);
    }
    for (const scenarioId of p.scenarioIds ?? []) {
      checkDanglingRef('scenarioId', scenarioId, scenarioIdSet, i, errors);
    }
    if (p.contentId != null) {
      checkDanglingRef('contentId', p.contentId, contentIdSet, i, errors);
    }
    for (const legalRefId of p.legalRefIds ?? []) {
      checkDanglingRef('legalRefId', legalRefId, legalRefIdSet, i, errors);
    }
  }

  // 8. notes[i].bookId must match manifest.bookId
  for (let i = 0; i < loaded.notes.length; i += 1) {
    const n = loaded.notes[i];
    if (n.bookId != null && n.bookId !== manifest.bookId) {
      errors.push({
        kind: 'book-id-mismatch',
        index: i,
        expected: manifest.bookId,
        actual: n.bookId,
      });
    }
  }

  return { bundlePath, passed: errors.length === 0, errors, warnings, stats };
}

// ---- output formatters ----

const ANSI = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function describeError(e) {
  switch (e.kind) {
    case 'bundle-not-found':
      return `Bundle path not found: ${e.path}`;
    case 'bundle-not-directory':
      return `Bundle path is not a directory: ${e.path}`;
    case 'manifest-missing':
      return 'manifest.json: file missing';
    case 'manifest-invalid-json':
      return `manifest.json: invalid JSON — ${e.message}`;
    case 'manifest-missing-field':
      return `manifest.json: required field "${e.field}" missing`;
    case 'pages-missing':
      return 'data/pages.json: file missing';
    case 'pages-invalid-json':
      return `data/pages.json: invalid JSON — ${e.message}`;
    case 'pages-empty':
      return 'data/pages.json: array is empty';
    case 'page-missing-field':
      return `data/pages.json[${e.index}]: required field "${e.field}" missing`;
    case 'missing-image':
      return `data/pages.json[${e.index}]: imageFile "${e.file}" not found in images/`;
    case 'glossary-invalid-json':
      return `data/glossary.json: invalid JSON — ${e.message}`;
    case 'glossary-not-array':
      return 'data/glossary.json: must be an array';
    case 'glossary-missing-field':
      return `data/glossary.json[${e.index}]: required field "${e.field}" missing`;
    case 'optional-not-array':
      return `${e.file}: must be an array`;
    case 'optional-invalid-json':
      return `${e.file}: invalid JSON — ${e.message}`;
    case 'dangling-ref':
      return `dangling ${e.refType} "${e.value}" referenced from page[${e.sourceIndex}]`;
    case 'duplicate-id':
      return `duplicate ${e.field} "${e.value}" at indices [${e.indices.join(', ')}]`;
    case 'book-id-mismatch':
      return `notes[${e.index}].bookId "${e.actual}" !== manifest.bookId "${e.expected}"`;
    default:
      return JSON.stringify(e);
  }
}

function describeWarning(w) {
  switch (w.kind) {
    case 'missing-optional-file':
      return `${w.file}: not found (treating as [])`;
    default:
      return JSON.stringify(w);
  }
}

export function formatResult(result, { mode, quiet }) {
  if (mode === 'json') {
    return JSON.stringify(result, null, 2);
  }

  const lines = [];
  lines.push(`Validating bundle: ${result.bundlePath}`);
  lines.push('─'.repeat(40));

  if (!quiet) {
    if (result.stats.pages > 0) {
      lines.push(`${ANSI.green}✓${ANSI.reset} data/pages.json: ${result.stats.pages} entries`);
    }
    if (result.stats.images > 0) {
      lines.push(
        `${ANSI.green}✓${ANSI.reset} images/: ${result.stats.images}/${result.stats.pages} referenced files present`,
      );
    }
    if (result.stats.glossary > 0) {
      lines.push(`${ANSI.green}✓${ANSI.reset} data/glossary.json: ${result.stats.glossary} entries`);
    }
  }

  for (const w of result.warnings) {
    lines.push(`${ANSI.yellow}⚠${ANSI.reset} ${describeWarning(w)}`);
  }
  for (const e of result.errors) {
    lines.push(`${ANSI.red}✗${ANSI.reset} ${describeError(e)}`);
  }

  lines.push('─'.repeat(40));
  const verdict = result.passed
    ? `${ANSI.green}${ANSI.bold}Result: PASS${ANSI.reset}`
    : `${ANSI.red}${ANSI.bold}Result: FAIL${ANSI.reset}`;
  lines.push(
    `${verdict}  (${result.errors.length} errors, ${result.warnings.length} warnings)`,
  );
  return lines.join('\n');
}

// ---- CLI entry ----

const isDirectInvocation = argv[1] && argv[1].endsWith('validate-bundle.mjs');
if (isDirectInvocation) {
  const args = argv.slice(2);
  if (args.length === 0 || args[0].startsWith('--')) {
    console.error('Usage: node scripts/validate-bundle.mjs <bundle-path> [--json] [--quiet]');
    exit(2);
  }
  const bundleArg = args[0];
  const flags = new Set(args.slice(1));
  const mode = flags.has('--json') ? 'json' : 'text';
  const quiet = flags.has('--quiet');
  const resolved = bundleArg.startsWith('/') ? bundleArg : join(cwd(), bundleArg);
  const result = await validateBundle(resolved);
  console.log(formatResult(result, { mode, quiet }));
  exit(result.passed ? 0 : 1);
}
