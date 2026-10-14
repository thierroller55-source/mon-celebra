const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel =
  process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug;

function format(level, message) {
  const time = new Date().toISOString();
  return `[${time}] [${level.toUpperCase()}] ${message}`;
}

function log(level, message) {
  if (LEVELS[level] > currentLevel) return;
  const line = format(level, message);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  error: (message) => log('error', message),
  warn: (message) => log('warn', message),
  info: (message) => log('info', message),
  debug: (message) => log('debug', message),
};
