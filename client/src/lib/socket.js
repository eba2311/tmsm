import { io } from 'socket.io-client';

export function createTrackingSocket({ accessToken } = {}) {
  const url = '/tracking';
  const socket = io(url, {
    path: '/socket.io',
    autoConnect: false,
    auth: { token: accessToken },
  });
  return socket;
}

export function createNotificationsSocket({ userId, accessToken } = {}) {
  const url = '/notifications';
  const socket = io(url, {
    path: '/socket.io',
    autoConnect: false,
    auth: { userId, token: accessToken },
  });
  return socket;
}
