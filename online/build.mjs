// Builds the online site: node online/build.mjs   (build.py does the same for computers with Python)
// 1. puts every src/ file back inside one self-contained page, in the order smart-coach.html loads them
// 2. adds online/cloud.js just before src/app/start.js: it fills in the HOOK points (src/app/core.js)
// 3. wraps it in the published head (icons, manifest, Firebase)
// No text of the app is searched and replaced: the online layer plugs in only through HOOK.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const D = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(D, p), 'utf8').replace(/\r\n/g, '\n');
const write = (p, s) => writeFileSync(join(D, p), s, 'utf8');
const stop = msg => { console.error('build fermo: ' + msg); process.exit(1); };
const insertBefore = (s, mark, text) => { const i = s.indexOf(mark); if (i < 0) stop('non trovo ' + mark); return s.slice(0, i) + text + s.slice(i); };

const START = '<script src="src/app/start.js"></script>';
let s = read('smart-coach.html');
if (!s.includes(START)) stop('in smart-coach.html manca la riga ' + START);
s = insertBefore(s, START, '<script src="online/cloud.js"></script>\n');
// the source page declares utf-8 so the browser reads the src/ files right; the published head below has its own
s = s.replace(/^<meta charset="utf-8">\n/, '')
  .replace(/<link rel="stylesheet" href="(src\/[^"]+)">/g, (_, f) => `<style>\n${read(f)}</style>`)
  .replace(/<script src="((?:src\/|online\/cloud\.js)[^"]*)"><\/script>/g, (_, f) => `<script>\n${read(f)}</script>`);

const head = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Smart Coach">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" href="icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
`;
const FIREBASE = ['app', 'auth', 'firestore'].map(m => `<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-${m}-compat.js"></script>\n`).join('');
s = head + insertBefore(s, '<title>Tennis Smart Coach</title>', '');
s = s.replace('<title>Tennis Smart Coach</title>', '<title>Tennis Smart Coach</title>\n</head>\n<body>');
s = insertBefore(s, '<script>', FIREBASE);
s = s.replace(/\s+$/, '') + '\n</body>\n</html>\n';

mkdirSync(join(D, 'online/site'), { recursive: true });
write('online/site/index.html', s);
// all the app's code in one file, to check it with: node --check online/check.js
write('online/check.js', [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n'));
// the same page with a fake Firebase (online/mockfb.js), to try the online version without touching real data
write('online/test.html', insertBefore(s.replace(FIREBASE, ''), '<script>', `<script>${read('online/mockfb.js')}</script>\n`));
console.log('built');
