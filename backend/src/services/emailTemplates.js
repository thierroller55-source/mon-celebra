import { APP_NAME } from '../config/brand.js';

const BRAND = {
  gold: '#B08D57',
  dark: '#1F2937',
  cream: '#FAF7F2',
  name: APP_NAME,
  slogan: "Chaque moment merite d'etre celebre.",
};

const LOCALES = ['fr', 'en', 'wo'];

/** Normalise une langue utilisateur vers une des locales supportees. */
function pickLocale(lang) {
  return LOCALES.includes(lang) ? lang : 'fr';
}

const COPY = {
  fr: {
    footer: `Tous droits reserves.`,
    reset: {
      subject: `Reinitialisation de votre mot de passe - ${APP_NAME}`,
      title: 'Reinitialiser votre mot de passe',
      intro: (name) =>
        `Bonjour ${name || ''},\n\nVous avez demande la reinitialisation de votre mot de passe. Ce lien est valable 1 heure.`,
      button: 'Choisir un nouveau mot de passe',
      outro: "Si vous n'etes pas a l'origine de cette demande, ignorez simplement cet email : votre mot de passe reste inchange.",
    },
    verify: {
      subject: `Confirmez votre adresse email - ${APP_NAME}`,
      title: 'Confirmez votre adresse email',
      intro: (name) =>
        `Bonjour ${name || ''},\n\nBienvenue sur ${APP_NAME}. Merci de confirmer votre adresse email pour activer toutes les fonctionnalites de votre compte. Ce lien est valable 24 heures.`,
      button: 'Confirmer mon email',
      outro: "Si vous n'avez pas cree de compte, vous pouvez ignorer cet email.",
    },
    test: {
      subject: `Test de configuration email - ${APP_NAME}`,
      title: 'Configuration email operationnelle',
      intro: () =>
        `Cet email de test confirme que les envois transactionnels fonctionnent correctement.`,
      button: 'Ouvrir le site',
      outro: '',
    },
  },
  en: {
    footer: 'All rights reserved.',
    reset: {
      subject: `Reset your password - ${APP_NAME}`,
      title: 'Reset your password',
      intro: (name) =>
        `Hello ${name || ''},\n\nYou requested a password reset. This link is valid for 1 hour.`,
      button: 'Choose a new password',
      outro: "If you did not request this, simply ignore this email: your password stays unchanged.",
    },
    verify: {
      subject: `Confirm your email address - ${APP_NAME}`,
      title: 'Confirm your email address',
      intro: (name) =>
        `Hello ${name || ''},\n\nWelcome to ${APP_NAME}. Please confirm your email address to activate all account features. This link is valid for 24 hours.`,
      button: 'Confirm my email',
      outro: "If you did not create an account, you can ignore this email.",
    },
    test: {
      subject: `Email configuration test - ${APP_NAME}`,
      title: 'Email configuration is working',
      intro: () => 'This test email confirms that transactional sending works correctly.',
      button: 'Open the site',
      outro: '',
    },
  },
  wo: {
    footer: 'Sañ-sañ yépp ñu koo denc.',
    reset: {
      subject: `Soppil sa baatujàll - ${APP_NAME}`,
      title: 'Soppil sa baatujàll',
      intro: (name) =>
        `Salaamaleekum ${name || ''},\n\nYóbbu nga ngir soppi sa baatujàll. Lien bii dina dox 1 waxtu.`,
      button: 'Tannal baatujàll bu bees',
      outro: 'Su fekke nga doon ci man, ba lépp baatujàll bi du soppiku.',
    },
    verify: {
      subject: `Dëggalal sa imel - ${APP_NAME}`,
      title: 'Dëggalal sa imel',
      intro: (name) =>
        `Salaamaleekum ${name || ''},\n\nDalal ak jàmm ci ${APP_NAME}. Dëggalal sa imel ngir dajale lépp ci kont bi. Lien bii dina dox 24 waxtu.`,
      button: 'Dëggalal sama imel',
      outro: 'Su fekke nga sosul kont, mën nga fàggoo ak imel bii.',
    },
    test: {
      subject: `Yeesal imel - ${APP_NAME}`,
      title: 'Yeesal imel bi dafay dox',
      intro: () => 'Imel bii bu jéem dëggal na ne yónnee imel yi dafay dox bu baax.',
      button: 'Ubbi site bi',
      outro: '',
    },
  },
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

/** Convertit un texte multiligne en paragraphes HTML. */
function toHtmlParagraphs(text) {
  return escapeHtml(text)
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">${p.replace(/\n/g, '<br />')}</p>`)
    .join('');
}

function layout({ title, introText, buttonLabel, buttonUrl, outroText, html, locale }) {
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>${escapeHtml(title)}</title>
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
              <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND.dark};">${escapeHtml(title)}</h1>
              ${html || toHtmlParagraphs(introText)}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 24px;">
                <tr>
                  <td style="border-radius:10px;background:${BRAND.gold};">
                    <a href="${buttonUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(buttonLabel)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">${escapeHtml(buttonUrl)}</p>
              ${outroText ? `<p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">${escapeHtml(outroText)}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:${BRAND.cream};text-align:center;font-size:12px;color:#9ca3af;">
              &copy; ${new Date().getFullYear()} ${BRAND.name}. ${COPY[locale].footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function build(kind, { name, url, locale }) {
  const lang = pickLocale(locale);
  const copy = COPY[lang][kind];
  const introText = copy.intro(name);
  const outroText = typeof copy.outro === 'function' ? copy.outro() : copy.outro;
  return {
    subject: copy.subject,
    html: layout({
      title: copy.title,
      introText,
      buttonLabel: copy.button,
      buttonUrl: url,
      outroText,
      locale: lang,
    }),
    text: `${copy.title}\n\n${introText}\n\n${copy.button}: ${url}\n\n${outroText || ''}`.trim(),
  };
}

export function resetPasswordTemplate({ name, resetUrl, locale }) {
  return build('reset', { name, url: resetUrl, locale });
}

export function verifyEmailTemplate({ name, verifyUrl, locale }) {
  return build('verify', { name, url: verifyUrl, locale });
}

export function testEmailTemplate({ url, locale }) {
  return build('test', { url, locale });
}
