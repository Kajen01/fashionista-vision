import axios from 'axios';
import { buildBackendUrl } from './runtimeConfig';

const productClient = axios.create({
  baseURL: buildBackendUrl('/api/products'),
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

export const productApi = {
  getProducts() {
    return request(productClient.get('/'));
  },
  getProductById(id) {
    return request(productClient.get(`/${id}`));
  },
  createProduct(payload, token) {
    return request(productClient.post('/', payload, withAuth(token)));
  },
  updateProduct(id, payload, token) {
    return request(productClient.put(`/${id}`, payload, withAuth(token)));
  },
  deleteProduct(id, token) {
    return request(productClient.delete(`/${id}`, withAuth(token)));
  },
};
