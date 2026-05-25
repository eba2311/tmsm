import axios from 'axios';

/** Axios instance without staff auth interceptors — for passenger portal tokens. */
export function createPassengerClient(accessToken) {
  const client = axios.create({
    baseURL: '/api/v1',
    headers: { 'Content-Type': 'application/json' },
    timeout: 20000,
  });
  if (accessToken) {
    client.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });
  }
  return client;
}
