// Runtime check: opens the app in Edge like a real user, on phone and desktop sizes,
// goes through every role and every tab, and reports crashes, error screens and pages wider than the screen.
// Usage: node tools/verify/verify.mjs            (local smart-coach.html + online build with fake Firebase)
//        node tools/verify/verify.mjs --local    (only smart-coach.html)
//        --save-baseline   keep these screenshots as the reference (tools/verify/baseline)
//        --compare         after the run, list screenshots that differ from the reference
// A clean-up that must not change the app should end with "identiche: N / N".
import { chromium } from 'playwright-core';
import { mkdirSync, rmSync, existsSync, readdirSync, readFileSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(HERE, 'out');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const VIEWPORTS = [{ n: 'phone', width: 390, height: 844 }, { n: 'desktop', width: 1280, height: 800 }];
const onlyLocal = process.argv.includes('--local');

rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const problems = []; let checks = 0;
const fail = (where, what) => problems.push(`${where}: ${what}`);

async function inspect(page, where, shot) {
  checks++;
  await page.waitForTimeout(120);
  const r = await page.evaluate(() => ({
    crash: document.querySelector('#app h2')?.textContent === 'Qualcosa non ha funzionato' ? (document.querySelector('#app .muted')?.textContent || 'errore') : null,
    wide: document.documentElement.scrollWidth > innerWidth + 1,
    empty: !document.querySelector('#app main')?.textContent.trim(),
  }));
  if (r.crash) fail(where, 'schermata di errore: ' + r.crash);
  if (r.wide) fail(where, 'la pagina è più larga dello schermo (scroll orizzontale)');
  if (r.empty) fail(where, 'schermata vuota');
  if (shot) await page.screenshot({ path: join(OUT, shot + '.png') });
}

async function walkTabs(page, prefix) {
  const tabs = await page.$$eval('.tabs button[data-k]', bs => bs.map(b => b.dataset.k));
  if (!tabs.length) fail(prefix, 'barra in basso non trovata');
  for (const k of tabs) {
    await page.click(`.tabs button[data-k="${k}"]`);
    await inspect(page, `${prefix} › ${k}`, `${prefix}-${k}`);
  }
  return tabs;
}

async function newPage(browser, vp, where) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  // same fake day on every run, so screenshots can be compared across days
  await ctx.clock.setFixedTime(new Date('2026-10-16T10:00:00'));
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(where, 'errore JavaScript: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) fail(where, 'console: ' + m.text()); });
  // icon and manifest sit next to the published page, not next to online/test.html; fonts need the internet
  page.on('requestfailed', r => { if (!/icon-\d+\.png|manifest\.webmanifest|fonts\.g/.test(r.url())) fail(where, 'file non caricato: ' + r.url()); });
  return { ctx, page };
}

async function local(browser, vp) {
  const url = pathToFileURL(join(ROOT, 'smart-coach.html')).href;
  const roles = [['coach', null], ['student', 'r0'], ['parent', 'r0'], ['fit', null], ['mind', null]];
  for (const [role, aid] of roles) {
    const where = `locale ${vp.n} ${role}`;
    const { ctx, page } = await newPage(browser, vp, where);
    await page.goto(url);
    await inspect(page, where + ' › accesso', role === 'coach' ? `local-${vp.n}-login` : null);
    await page.click(`[data-a="role"][data-k="${role}"]`);
    if (aid) await page.click(`[data-a="pickname"][data-k="${aid}"]`);
    await walkTabs(page, `local-${vp.n}-${role}`);
    if (role === 'coach') { // athlete detail and its sub-tabs
      await page.evaluate(() => { U.tab = 'ath'; U.athleteOpen = 'r0'; render(); });
      for (const k of await page.$$eval('[data-a="athtab"]', bs => bs.map(b => b.dataset.k))) {
        await page.click(`[data-a="athtab"][data-k="${k}"]`);
        await inspect(page, `${where} › atleta › ${k}`, `local-${vp.n}-coach-atleta-${k}`);
      }
    }
    await page.click('[data-a="logout"]');
    await inspect(page, where + ' › uscita', null);
    await ctx.close();
  }
}

async function online(browser, vp) {
  const test = join(ROOT, 'online', 'test.html');
  if (!existsSync(test)) { fail('online', 'manca online/test.html: lancia prima node online/build.mjs'); return; }
  const where = `online ${vp.n} maestro`;
  const { ctx, page } = await newPage(browser, vp, where);
  await page.goto(pathToFileURL(test).href);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('[data-a="cwho"][data-k="coach"]');
  await page.click('[data-a="cmode"][data-k="signup"]');
  await page.fill('#c-name', 'Maestro Prova'); await page.fill('#c-email', 'prova@esempio.it'); await page.fill('#c-pw', 'segreta1');
  await page.click('[data-a="csignup"]');
  await page.waitForSelector('#c-club');
  await page.fill('#c-club', 'Circolo di prova');
  await page.click('[data-a="cstart"][data-k="example"]');
  await page.click('[data-a="ccreate"]');
  await page.waitForSelector('.tabs button', { timeout: 8000 }).catch(() => fail(where, "l'app non si apre dopo la creazione del circolo"));
  await walkTabs(page, `online-${vp.n}-coach`);
  const writes = await page.evaluate(() => window.__mockLog.filter(x => x.startsWith('set clubs/')).length);
  if (!writes) fail(where, 'nessun salvataggio sul database finto');
  await ctx.close();
}

const browser = await chromium.launch({ executablePath: EDGE });
// a step that cannot go on (a missing button, a screen that never opens) is reported, and the run continues
const guard = async (where, fn) => { try { await fn(); } catch (e) { fail(where, 'bloccato: ' + String(e.message || e).split('\n')[0]); } };
for (const vp of VIEWPORTS) {
  await guard('locale ' + vp.n, () => local(browser, vp));
  if (!onlyLocal) await guard('online ' + vp.n, () => online(browser, vp));
}
await browser.close();
console.log(`${checks} schermate controllate · screenshot in tools/verify/out`);
const BASE = join(HERE, 'baseline');
if (process.argv.includes('--save-baseline')) { rmSync(BASE, { recursive: true, force: true }); cpSync(OUT, BASE, { recursive: true }); console.log('Riferimento salvato in tools/verify/baseline'); }
if (process.argv.includes('--compare')) {
  if (!existsSync(BASE)) fail('confronto', 'nessun riferimento: lancia prima con --save-baseline');
  else {
    const shots = readdirSync(BASE).filter(f => f.endsWith('.png'));
    const diff = shots.filter(f => !existsSync(join(OUT, f)) || !readFileSync(join(OUT, f)).equals(readFileSync(join(BASE, f))));
    console.log(`identiche: ${shots.length - diff.length} / ${shots.length}`);
    diff.forEach(f => fail('confronto', 'schermata cambiata: ' + f));
  }
}
if (problems.length) { console.log(`\n${problems.length} problemi:\n- ` + problems.join('\n- ')); process.exit(1); }
console.log('Tutto ok');
