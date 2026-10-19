import { APP_NAME } from '../config/brand.js';

const BRAND = {
  gold: '#B08D57',
  dark: '#1F2937',
  cream: '#FAF7F2',
  name: APP_NAME,
  slogan: "Chaque moment merite d'etre celebre.",
};

function layout({ title, intro, buttonLabel, buttonUrl, outro }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:Arial,Helvetica,sans-serif;color:${BRAND.dark};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(31,41,55,0.08);">
          <tr>
            <td style="background:${BRAND.dark};padding:28px 32px;text-align:center;">
              <div style="font-size:22px;font-weight:bold;letter-spacing:1px;color:${BRAND.gold};">${BRAND.name}</div>
              <div style="font-size:12px;color:#d1d5db;margin-top:4px;">${BRAND.slogan}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND.dark};">${title}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">${intro}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="border-radius:10px;background:${BRAND.gold};">
                    <a href="${buttonUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px;">${buttonLabel}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;"><a href="${buttonUrl}" style="color:${BRAND.gold};">${buttonUrl}</a></p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">${outro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:${BRAND.cream};text-align:center;font-size:12px;color:#9ca3af;">
              &copy; ${new Date().getFullYear()} ${BRAND.name}. Tous droits reserves.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function resetPasswordTemplate({ name, resetUrl }) {
  return {
    subject: `Reinitialisation de votre mot de passe - ${APP_NAME}`,
    html: layout({
      title: 'Reinitialiser votre mot de passe',
      intro: `Bonjour ${name || ''},<br /><br />Vous avez demande la reinitialisation de votre mot de passe. Ce lien est valable <strong>1 heure</strong>.`,
      buttonLabel: 'Choisir un nouveau mot de passe',
      buttonUrl: resetUrl,
      outro: "Si vous n'etes pas a l'origine de cette demande, ignorez simplement cet email : votre mot de passe reste inchange.",
    }),
  };
}

export function verifyEmailTemplate({ name, verifyUrl }) {
  return {
    subject: `Confirmez votre adresse email - ${APP_NAME}`,
    html: layout({
      title: 'Confirmez votre adresse email',
      intro: `Bonjour ${name || ''},<br /><br />Bienvenue sur ${APP_NAME}. Merci de confirmer votre adresse email pour activer toutes les fonctionnalites de votre compte. Ce lien est valable <strong>24 heures</strong>.`,
      buttonLabel: 'Confirmer mon email',
      buttonUrl: verifyUrl,
      outro: "Si vous n'avez pas cree de compte, vous pouvez ignorer cet email.",
    }),
  };
}
