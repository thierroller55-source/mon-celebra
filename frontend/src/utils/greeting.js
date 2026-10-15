/**
 * Retourne une salutation adaptee a l'heure de la journee :
 * matin (avant 12h), apres-midi (12h-18h), soiree (apres 18h).
 */
export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon apres-midi';
  return 'Bonsoir';
}

/** Salutation complete avec le prenom (et nom optionnel). */
export function greetUser(user, { withLastName = false } = {}) {
  const name = [user?.firstName, withLastName ? user?.lastName : null]
    .filter(Boolean)
    .join(' ');
  return `${getGreeting()}${name ? ` ${name}` : ''}`;
}
