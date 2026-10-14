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

/**
 * Transforme une erreur Axios en message comprehensible pour l'utilisateur.
 * Ne jamais afficher d'erreur technique brute.
 */
export function getErrorMessage(error) {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) return apiMessage;

  if (error?.code === 'ECONNABORTED') {
    return 'Le serveur met trop de temps a repondre. Veuillez reessayer.';
  }
  if (!error?.response) {
    return 'Impossible de contacter le serveur. Verifiez votre connexion internet.';
  }
  return 'Une erreur est survenue. Veuillez reessayer dans quelques instants.';
}
