// Post-build step for static SPA hosting.
//
// GitHub Pages (and most static hosts without rewrite rules) return the file
// at the requested path or a 404. Since this app uses HTML5 history routing,
// deep links like /book/<slug>/page/<id> have no matching file. Copying
// index.html → 404.html makes the host serve the SPA shell for any unknown
// path; React Router then resolves the real route on the client.
//
// .nojekyll tells GitHub Pages not to run the content through Jekyll (harmless
// elsewhere). Both files are inert for servers that use their own fallback
// (e.g. the nginx `try_files ... /index.html` setup).

import { copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const indexHtml = join(dist, 'index.html');

if (!existsSync(indexHtml)) {
  console.error(`postbuild-pages: ${indexHtml} not found — did vite build run?`);
  process.exit(1);
}

copyFileSync(indexHtml, join(dist, '404.html'));
writeFileSync(join(dist, '.nojekyll'), '');

console.log('postbuild-pages: wrote dist/404.html + dist/.nojekyll (SPA fallback)');
