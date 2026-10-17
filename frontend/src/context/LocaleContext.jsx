import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  COOKIE_MAX_AGE,
  COOKIE_NAME,
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
} from '../i18n/config.js';
import { ensureLanguage } from '../i18n/index.js';
import { useAuth } from '../hooks/useAuth.js';
import { userService } from '../services/user.service.js';

const LocaleContext = createContext(null);

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name, value) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function detectFromNavigator() {
  if (typeof navigator === 'undefined') return null;
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const entry of list) {
    const code = String(entry).slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return null;
}

function prefixOf(pathname) {
  const segment = pathname.split('/')[1];
  return isLocale(segment) ? segment : null;
}

export function LocaleProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const [locale, setLocaleState] = useState(
    () =>
      prefixOf(location.pathname) ||
      readCookie(COOKIE_NAME) ||
      detectFromNavigator() ||
      DEFAULT_LOCALE,
  );
  const adoptedUserLanguage = useRef(false);

  useEffect(() => {
    let active = true;
    ensureLanguage(locale).then(() => {
      if (active && i18n.resolvedLanguage !== locale) i18n.changeLanguage(locale);
    });
    document.documentElement.lang = locale;
    writeCookie(COOKIE_NAME, locale);
    return () => {
      active = false;
    };
  }, [locale, i18n]);

  useEffect(() => {
    const prefix = prefixOf(location.pathname);
    if (prefix && prefix !== locale) setLocaleState(prefix);
  }, [location.pathname, locale]);

  useEffect(() => {
    if (adoptedUserLanguage.current) return;
    if (!prefixOf(location.pathname) && isLocale(user?.language)) {
      adoptedUserLanguage.current = true;
      if (user.language !== locale) setLocaleState(user.language);
    }
  }, [user, location.pathname, locale]);

  const setLocale = useCallback(
    (next) => {
      if (!isLocale(next) || next === locale) return;
      setLocaleState(next);
      if (user && !user.isGuest && user.language !== next) {
        userService.updateMe({ language: next }).catch(() => {});
      }
      const segment = location.pathname.split('/')[1];
      const rest = isLocale(segment) ? location.pathname.slice(segment.length + 1) : location.pathname;
      const path =
        rest && rest !== '/'
          ? `/${next}${rest.startsWith('/') ? rest : `/${rest}`}`
          : `/${next}`;
      navigate(`${path}${location.search}`);
    },
    [locale, location.pathname, location.search, navigate, user],
  );

  const value = useMemo(
    () => ({ locale, setLocale, locales: LOCALES }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale doit etre utilise dans LocaleProvider.');
  return context;
}

export function useLocalePath() {
  const { locale } = useLocale();
  return useCallback(
    (path = '/') => {
      const clean = path.startsWith('/') ? path : `/${path}`;
      return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
    },
    [locale],
  );
}
