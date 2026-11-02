import { defineConfig } from '@playwright/test';

// Tests responsive et parcours publics de Mon Celebra.
// Par defaut on teste l'application deployee (le plus proche de la realite
// pour les invites qui scannent un QR code). Surcharger avec BASE_URL=...
const BASE_URL = process.env.BASE_URL || 'https://mon-celebra.vercel.app';

// WebKit est optionnel : il exige des dependances systeme
// (`sudo npx playwright install-deps`) absentes de certains environnements.
// L'activer avec PLAYWRIGHT_WEBKIT=1.
const projects = [{ name: 'chromium', use: { browserName: 'chromium' } }];
if (process.env.PLAYWRIGHT_WEBKIT === '1') {
  projects.push({ name: 'webkit', use: { browserName: 'webkit' } });
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
  },
  projects,
});
