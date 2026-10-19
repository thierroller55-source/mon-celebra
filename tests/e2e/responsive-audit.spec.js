import { test } from '@playwright/test';
import fs from 'node:fs';

// DIAGNOSTIC RESPONSIVE (Etape 0 / B2). Liste les elements qui depassent de
// l'ecran sur toutes les routes, tous les viewports, en clair et en sombre.
// N'echoue pas : ecrit un rapport JSON + un tableau lisible.
//
//   BASE_URL=http://localhost:5173 npx playwright test responsive-audit --project=chromium
//
// Teste aussi les routes authentifiees si DEMO_EMAIL/DEMO_PASSWORD sont fournis.

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const DEMO_EMAIL = process.env.DEMO_EMAIL || '';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || '';

const VIEWPORTS = [
  { w: 320, h: 568, name: '320' },
  { w: 360, h: 640, name: '360' },
  { w: 375, h: 667, name: '375' },
  { w: 390, h: 844, name: '390' },
  { w: 393, h: 852, name: '393' },
  { w: 412, h: 915, name: '412' },
  { w: 414, h: 896, name: '414-xsmax' },
  { w: 428, h: 926, name: '428' },
  { w: 430, h: 932, name: '430' },
  { w: 440, h: 956, name: '440' },
  { w: 480, h: 800, name: '480' },
  { w: 600, h: 900, name: '600' },
  { w: 768, h: 1024, name: '768' },
  { w: 820, h: 1180, name: '820' },
  { w: 834, h: 1112, name: '834' },
  { w: 1024, h: 768, name: '1024' },
];

const PUBLIC_ROUTES = [
  { path: '/', name: 'home' },
  { path: '/e/mariage-2', name: 'event-public' },
  { path: '/fr/e/mariage-2', name: 'event-public-fr' },
  { path: '/categories', name: 'categories' },
  { path: '/connexion', name: 'login' },
  { path: '/inscription', name: 'register' },
  { path: '/mot-de-passe-oublie', name: 'forgot' },
  { path: '/page-inexistante-xyz', name: 'notfound' },
];

const AUTH_ROUTES = [
  { path: '/dashboard', name: 'dashboard' },
  { path: '/dashboard/creer', name: 'create' },
  { path: '/dashboard/compte', name: 'account' },
  { path: '/dashboard/evenements/:id', name: 'event-manage', dynamic: true },
];

const ALL_ROUTES = [...PUBLIC_ROUTES, ...AUTH_ROUTES];

const AUDIT = `(() => {
  const vw = window.innerWidth;
  const doc = document.documentElement;
  const offenders = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.position === 'fixed' || style.visibility === 'hidden') continue;
    // On ignore les tuiles Leaflet : Leaflet positionne des tuiles de 256px
    // qui depassent volontairement mais sont clippees par .leaflet-container.
    if (el.classList.contains('leaflet-tile') || el.closest('.leaflet-tile-pane')) continue;
    if (r.right > vw + 1 || r.left < -1) {
      let n = el, parts = [];
      while (n && n.nodeType === 1 && parts.length < 4) {
        const id = n.id ? '#' + n.id : '';
        const cls = n.className && typeof n.className === 'string'
          ? '.' + n.className.trim().split(/\\s+/).slice(0, 3).join('.')
          : '';
        parts.unshift(n.tagName.toLowerCase() + id + cls);
        n = n.parentElement;
      }
      offenders.push({
        path: parts.join(' > '),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        overflowRight: Math.round(r.right - vw),
        overflowLeft: Math.round(-r.left),
      });
    }
  }
  return {
    vw,
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    horizontalScroll: doc.scrollWidth > window.innerWidth + 1,
    offenders: offenders.slice(0, 20),
  };
})()`;

async function login(page) {
  if (!DEMO_EMAIL || !DEMO_PASSWORD) return false;
  try {
    await page.goto('/connexion', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', DEMO_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

test.setTimeout(900000);

test('responsive audit', async ({ page }, testInfo) => {
  const browser = testInfo.project.name;
  const results = [];

  for (const theme of ['light', 'dark']) {
    await page.addInitScript((t) => {
      localStorage.setItem('celebra-theme', t);
    }, theme);

    let authed = false;
    if (DEMO_EMAIL && DEMO_PASSWORD) authed = await login(page);

    const routes = authed ? ALL_ROUTES : PUBLIC_ROUTES;

    for (const vp of VIEWPORTS) {
      for (const route of routes) {
        if (route.dynamic) continue; // necessite un id reel
        await page.setViewportSize({ width: vp.w, height: vp.h });
        try {
          await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(600);
        } catch {
          results.push({ browser, theme, vp: vp.name, route: route.name, error: 'navigation' });
          continue;
        }
        const audit = await page.evaluate(AUDIT);
        if (audit.horizontalScroll || audit.offenders.length) {
          results.push({ browser, theme, vp: vp.name, route: route.name, ...audit });
        }
      }
    }
  }

  const file = `tests/e2e/responsive-report.${browser}.json`;
  fs.writeFileSync(file, JSON.stringify(results, null, 2));

  // Tableau lisible
  console.log(`\n=== ${browser}: ${results.length} probleme(s) -> ${file} ===`);
  for (const r of results) {
    console.log(
      `${r.theme} ${r.vp} ${r.route} scrollH=${r.horizontalScroll} offenders=${r.offenders?.length ?? 0}`,
    );
    for (const o of r.offenders || []) console.log(`   - ${o.path} (+${o.overflowRight})`);
  }
});
