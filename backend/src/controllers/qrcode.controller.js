import QRCode from 'qrcode';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

/**
 * QR Code PNG haute resolution pointant vers la page publique de l'evenement.
 * `?download=1` force le telechargement, sinon affichage inline.
 */
export const getEventQr = asyncHandler(async (req, res) => {
  const target = `${env.CLIENT_URL}/e/${req.event.slug}`;

  const buffer = await QRCode.toBuffer(target, {
    type: 'png',
    width: 1024,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1F2937', light: '#FFFFFF' },
  });

  const filename = `${req.event.slug}-qr.png`;
  res.set('Content-Type', 'image/png');
  res.set(
    'Content-Disposition',
    `${req.query.download ? 'attachment' : 'inline'}; filename="${filename}"`,
  );
  res.send(buffer);
});
