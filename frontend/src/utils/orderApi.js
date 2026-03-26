import axios from 'axios';
import { buildBackendUrl } from './runtimeConfig';

const orderClient = axios.create({
  baseURL: buildBackendUrl('/api/orders'),
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

export const orderApi = {
  createOrder(payload, token) {
    return request(orderClient.post('/', payload, withAuth(token)));
  },
  getMyOrders(token) {
    return request(orderClient.get('/my', withAuth(token)));
  },
  getOrderById(id, token) {
    return request(orderClient.get(`/${id}`, withAuth(token)));
  },
  getAllOrders(token) {
    return request(orderClient.get('/', withAuth(token)));
  },
  updateOrderStatus(id, payload, token) {
    return request(orderClient.put(`/${id}/status`, payload, withAuth(token)));
  },
  deleteOrder(id, token) {
    return request(orderClient.delete(`/${id}`, withAuth(token)));
  },
};
