import { test } from '@playwright/test';
import fs from 'node:fs';

// DIAGNOSTIC (Etape 0 / B2). N'echoue pas : il liste les elements qui
// depassent de l'ecran. On l'execute via: npx playwright test responsive-audit
// Resultat: tests/e2e/responsive-report.json

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

// Routes testables sans authentification.
const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/e/mariage-2', name: 'event-public' },
  { path: '/categories', name: 'categories' },
  { path: '/connexion', name: 'login' },
  { path: '/inscription', name: 'register' },
  { path: '/mot-de-passe-oublie', name: 'forgot' },
  { path: '/fr/e/mariage-2', name: 'event-public-fr' },
  { path: '/page-inexistante-xyz', name: 'notfound' },
];

const AUDIT = `(() => {
  const vw = window.innerWidth;
  const doc = document.documentElement;
  const offenders = [];
  const all = document.querySelectorAll('*');
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.position === 'fixed' || style.visibility === 'hidden') continue;
    if (r.right > vw + 1 || r.left < -1) {
      const path = (() => {
        let n = el, parts = [];
        while (n && n.nodeType === 1 && parts.length < 4) {
          const id = n.id ? '#' + n.id : '';
          const cls = n.className && typeof n.className === 'string'
            ? '.' + n.className.trim().split(/\\s+/).slice(0, 3).join('.')
            : '';
          parts.unshift(n.tagName.toLowerCase() + id + cls);
          n = n.parentElement;
        }
        return parts.join(' > ');
      })();
      offenders.push({
        path,
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        overflowRight: Math.round(r.right - vw),
      });
    }
  }
  return {
    vw,
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    horizontalScroll: doc.scrollWidth > window.innerWidth + 1,
    offenders: offenders.slice(0, 25),
  };
})()`;

test.setTimeout(600000);

test('responsive audit', async ({ page }, testInfo) => {
  const browser = testInfo.project.name;
  const results = [];

  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      try {
        await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(700);
      } catch {
        results.push({ browser, vp: vp.name, route: route.name, error: 'navigation' });
        continue;
      }
      const audit = await page.evaluate(AUDIT);
      if (audit.horizontalScroll || audit.offenders.length) {
        results.push({ browser, vp: vp.name, route: route.name, ...audit });
      }
    }
  }

  const file = `tests/e2e/responsive-report.${browser}.json`;
  fs.writeFileSync(file, JSON.stringify(results, null, 2));
  console.log(`\n=== ${browser}: ${results.length} probleme(s) -> ${file} ===`);
});
