#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { glossary } from '../src/books/de-eu-vat/glossary.ts';

const outPath = 'public/book/data/glossary.json';
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(glossary, null, 2) + '\n');
console.log(`Wrote ${glossary.length} glossary entries → ${outPath}`);
