import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
});

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Un access token expire (401) declenche une seule tentative de refresh via le
// cookie httpOnly, puis la requete d'origine est rejouee automatiquement.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = config?.url?.includes('/auth/');

    if (response?.status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true;
      try {
        refreshPromise =
          refreshPromise ||
          api.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        const { data } = await refreshPromise;
        setAccessToken(data.data.accessToken);
        config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(config);
      } catch {
        clearAccessToken();
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Transforme une erreur Axios en message comprehensible pour l'utilisateur.
 * Ne jamais afficher d'erreur technique brute.
 */
export function getErrorMessage(error) {
  const data = error?.response?.data;
  // Priorite au detail de validation (message de champ precis) pour un retour
  // utilisateur actionnable plutot que "Formulaire invalide.".
  const detailMessage = data?.details?.[0]?.message;
  if (detailMessage) return detailMessage;

  const apiMessage = data?.message;
  if (apiMessage) return apiMessage;

  if (error?.code === 'ECONNABORTED') {
    return 'Le serveur met trop de temps a repondre. Veuillez reessayer.';
  }
  if (!error?.response) {
    return 'Impossible de contacter le serveur. Verifiez votre connexion internet.';
  }
  return 'Une erreur est survenue. Veuillez reessayer dans quelques instants.';
}

/**
 * Extrait les erreurs de validation par champ.
 * Les details de formulaire sont prefixes par "details." ; on ne retourne que
 * ceux-la, indexes par cle de champ (ex: { graduateName: 'Ce champ est obligatoire.' }).
 */
export function getFieldErrors(error) {
  const details = error?.response?.data?.details;
  if (!Array.isArray(details)) return {};

  return details.reduce((acc, item) => {
    const field = item?.field;
    if (typeof field === 'string' && field.startsWith('details.')) {
      acc[field.slice('details.'.length)] = item.message;
    }
    return acc;
  }, {});
}
