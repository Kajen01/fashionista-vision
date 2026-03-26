import axios from 'axios';
import { buildBackendUrl } from './runtimeConfig';

const authClient = axios.create({
  baseURL: buildBackendUrl('/api/auth'),
});

function withAuth(token) {
  return token
    ? {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
    : {};
}

function normalizeError(error) {
  const message = error.response?.data?.message || error.message || 'Request failed.';
  const normalizedError = new Error(message);
  normalizedError.status = error.response?.status;
  normalizedError.code = error.response?.data?.code;
  normalizedError.data = error.response?.data;
  return normalizedError;
}

async function request(promise) {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export const authApi = {
  register(payload) {
    return request(authClient.post('/register', payload));
  },
  login(payload) {
    return request(authClient.post('/login', payload));
  },
  logout(token) {
    return request(authClient.post('/logout', {}, withAuth(token)));
  },
  getMe(token) {
    return request(authClient.get('/me', withAuth(token)));
  },
  verifyEmail(payload) {
    return request(authClient.post('/verify-email', payload));
  },
  resendVerification(payload) {
    return request(authClient.post('/resend-verification', payload));
  },
  updateProfile(payload, token) {
    return request(authClient.put('/profile', payload, withAuth(token)));
  },
  changePassword(payload, token) {
    return request(authClient.put('/change-password', payload, withAuth(token)));
  },
};
