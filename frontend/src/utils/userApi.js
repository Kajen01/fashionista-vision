import axios from 'axios';
import { buildBackendUrl } from './runtimeConfig';

const userClient = axios.create({
  baseURL: buildBackendUrl('/api/users'),
});

function withAuth(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function normalizeError(error) {
  const message = error.response?.data?.message || error.message || 'Request failed.';
  const normalizedError = new Error(message);
  normalizedError.status = error.response?.status;
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

export const userApi = {
  getUsers(token) {
    return request(userClient.get('/', withAuth(token)));
  },
  getUserById(id, token) {
    return request(userClient.get(`/${id}`, withAuth(token)));
  },
  updateUser(id, payload, token) {
    return request(userClient.put(`/${id}`, payload, withAuth(token)));
  },
  deleteUser(id, token) {
    return request(userClient.delete(`/${id}`, withAuth(token)));
  },
};
