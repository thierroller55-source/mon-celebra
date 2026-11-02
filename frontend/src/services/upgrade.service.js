import { api } from './api.js';

export const upgradeService = {
  paymentInfo: () => api.get('/upgrades/payment-info').then((r) => r.data.data),
  createRequest: (payload) => api.post('/upgrades', payload).then((r) => r.data.data.request),
  myRequests: () => api.get('/upgrades').then((r) => r.data.data.requests),
};
