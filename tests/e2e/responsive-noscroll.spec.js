import { test, expect } from '@playwright/test';

// VERIFICATION RESPONSIVE (critere d'acceptation B2).
// Echoue si une page produit un defilement horizontal, pour tout viewport
// de 320 a 1024 px. Le diagnostic detaille (tableau des debordeurs) est dans
// responsive-audit.spec.js ; ici c'est un garde-fou strict.
//
//   BASE_URL=http://localhost:5173 npx playwright test responsive-noscroll
//   BASE_URL=https://mon-celebra.vercel.app npx playwright test responsive-noscroll

const BASE = process.env.BASE_URL || 'http://localhost:5173';

const VIEWPORTS = [320, 360, 375, 390, 393, 412, 414, 428, 430, 440, 480, 600, 768, 820, 834, 1024];

const ROUTES = ['/', '/e/mariage-2', '/fr/e/mariage-2', '/categories', '/connexion', '/inscription', '/mot-de-passe-oublie', '/page-inexistante-xyz'];

// Les tuiles Leaflet (tuiles de 256 px placees volontairement hors cadre mais
// clippees par .leaflet-container) ne comptent pas comme debordement.
const MEASURE = `(() => {
  const doc = document.documentElement;
  return {
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    innerWidth: window.innerWidth,
  };
})()`;

test.describe('responsive : aucun defilement horizontal', () => {
  for (const width of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${width}px ${route}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(500);
        const m = await page.evaluate(MEASURE);
        expect(
          m.scrollWidth,
          `Defilement horizontal sur ${route} a ${width}px (scrollWidth=${m.scrollWidth} > innerWidth=${m.innerWidth})`,
        ).toBeLessThanOrEqual(m.innerWidth + 1);
      });
    }
  }
});
