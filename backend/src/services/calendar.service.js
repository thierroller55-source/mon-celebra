/**
 * Genere un flux iCalendar (RFC 5545) minimal pour un evenement, afin que les
 * invites puissent l'ajouter a leur agenda (Google Agenda, Apple Calendar, ...).
 */

/** Echappe les caracteres speciaux ICS (virgule, point-virgule, retour ligne). */
function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Replie une ligne ICS a 75 octets comme l'exige la RFC 5545. */
function foldLine(line) {
  const chunks = [];
  let current = line;
  while (current.length > 73) {
    chunks.push(`${current.slice(0, 73)}`);
    current = ` ${current.slice(73)}`;
  }
  chunks.push(current);
  return chunks.join('\r\n');
}

function pad(value) {
  return String(value).padStart(2, '0');
}

/** Convertit une Date (+ heure "HH:MM" optionnelle) en horodatage ICS. */
function toIcsDateTime(date, time) {
  const d = new Date(date);
  const [hours, minutes] = /^\d{1,2}:\d{2}$/.test(time || '')
    ? time.split(':').map(Number)
    : [d.getHours(), d.getMinutes()];
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hours)}${pad(minutes)}00`;
}

function toIcsDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function toUtcStamp(date = new Date()) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate(),
  )}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function formatLocation(event) {
  const parts = [
    event.location?.name,
    event.location?.address,
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Construit le contenu iCalendar d'un evenement.
 * @param {object} event document Event (ou objet brut)
 * @param {string} url URL publique de l'evenement
 */
export function buildEventIcs(event, url) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mon Celebra//Mon Celebra//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event._id}@moncelebra`,
    `DTSTAMP:${toUtcStamp()}`,
  ];

  if (event.date) {
    if (event.startTime) {
      lines.push(`DTSTART:${toIcsDateTime(event.date, event.startTime)}`);
      if (event.endTime) {
        lines.push(`DTEND:${toIcsDateTime(event.date, event.endTime)}`);
      }
    } else {
      lines.push(`DTSTART;VALUE=DATE:${toIcsDate(event.date)}`);
    }
  }

  lines.push(`SUMMARY:${escapeText(event.title)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);

  const location = formatLocation(event);
  if (location) lines.push(`LOCATION:${escapeText(location)}`);
  if (url) lines.push(`URL:${escapeText(url)}`);

  lines.push(`STATUS:${event.status === 'published' ? 'CONFIRMED' : 'TENTATIVE'}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
