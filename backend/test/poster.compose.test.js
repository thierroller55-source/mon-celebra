import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {
  composePosterBuffer,
  getPosterCaption,
  inspectPosterQr,
  validatePosterSource,
} from '../src/services/poster.service.js';
import {
  QR_MIN_SIZE,
  normalizeQrSettings,
  resolveQrPreset,
} from '../src/config/poster.js';

function solidImage(width, height, background) {
  return sharp({
    create: { width, height, channels: 3, background },
  })
    .png()
    .toBuffer();
}

test('la composition conserve la resolution d origine et produit un PNG', async () => {
  const source = await solidImage(1200, 1500, '#F5EFE6');
  const result = await composePosterBuffer({
    sourceBuffer: source,
    qrUrl: 'https://example.test/e/mariage-diop',
    qr: { position: 'bottom-right' },
    caption: getPosterCaption('fr'),
  });

  assert.equal(result.format, 'png');
  assert.equal(result.width, 1200);
  assert.equal(result.height, 1500);
  assert.ok(Buffer.isBuffer(result.buffer));

  const metadata = await sharp(result.buffer).metadata();
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 1500);
  assert.equal(metadata.format, 'png');
});

test('les positions predefinies restent dans les limites de l image', async () => {
  const width = 1080;
  const height = 1350;
  const source = await solidImage(width, height, '#1F2937');
  const caption = getPosterCaption('en');

  for (const position of ['bottom-right', 'bottom-left', 'bottom-center', 'top-right']) {
    const qr = resolveQrPreset({ position, size: 0.2, width, height, caption });
    assert.ok(qr.x >= 0 && qr.x + qr.size <= 1.000001, `${position} x hors limites`);
    assert.ok(qr.y >= 0 && qr.y + qr.size <= 1.000001, `${position} y hors limites`);
    assert.ok(qr.size >= QR_MIN_SIZE, `${position} taille minimale non respectee`);

    const result = await composePosterBuffer({
      sourceBuffer: source,
      qrUrl: 'https://example.test/e/anniversaire',
      qr,
      caption,
    });
    assert.equal(result.width, width);
    assert.equal(result.height, height);
  }
});

test('les coordonnees sont normalisees et bornees cote serveur', () => {
  const settings = normalizeQrSettings({ x: 2, y: -3, size: 0.01, position: 'inconnue' });
  assert.equal(settings.size, QR_MIN_SIZE);
  assert.equal(settings.x, 1 - QR_MIN_SIZE);
  assert.equal(settings.y, 0);
  assert.equal(settings.position, 'bottom-right');
  assert.equal(settings.captionVisible, true);

  const hidden = normalizeQrSettings({ captionVisible: false });
  assert.equal(hidden.captionVisible, false);
});

test('une taille minimale produit toujours une image valide', async () => {
  const source = await solidImage(800, 800, '#FFFFFF');
  const result = await composePosterBuffer({
    sourceBuffer: source,
    qrUrl: 'https://example.test/e/bapteme',
    qr: { x: 0, y: 0, size: QR_MIN_SIZE, position: 'custom' },
    caption: getPosterCaption('wo'),
  });

  assert.equal(result.width, 800);
  assert.equal(result.height, 800);
  assert.ok(result.qr.size >= QR_MIN_SIZE);
});


test('le QR compose est effectivement decodable', async () => {
  const source = await solidImage(1200, 1500, '#F8FAFC');
  const qrUrl = 'https://example.test/e/lecture-qr';
  const result = await composePosterBuffer({
    sourceBuffer: source,
    qrUrl,
    qr: { position: 'bottom-right', size: 0.22 },
    caption: getPosterCaption('fr'),
  });

  const inspection = await inspectPosterQr(result.buffer, qrUrl);
  assert.equal(inspection.qrReadable, true);
  assert.equal(inspection.decodedUrl, qrUrl);
});

test('la validation refuse un fichier non image et une image trop petite', async () => {
  await assert.rejects(
    () => validatePosterSource(Buffer.from('pas une image')),
    /image valide|Format d'image/,
  );

  const tiny = await solidImage(400, 400, '#FFFFFF');
  await assert.rejects(
    () => validatePosterSource(tiny),
    /trop petite/,
  );

  const valid = await solidImage(900, 1200, '#FFFFFF');
  const metadata = await validatePosterSource(valid);
  assert.equal(metadata.width, 900);
  assert.equal(metadata.format, 'png');
});
