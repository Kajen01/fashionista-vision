import axios from 'axios';
import { buildBackendUrl } from './runtimeConfig';

const productReviewClient = axios.create({
  baseURL: buildBackendUrl('/api/product-reviews'),
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

export const productReviewApi = {
  getMyReviews(token) {
    return request(productReviewClient.get('/me', withAuth(token)));
  },
  getProductReviews(productId) {
    return request(productReviewClient.get(`/product/${productId}`));
  },
  getProductSummary(productId) {
    return request(productReviewClient.get(`/product/${productId}/summary`));
  },
  getMyProductReview(productId, token) {
    return request(productReviewClient.get(`/product/${productId}/me`, withAuth(token)));
  },
  upsertProductReview(productId, payload, token) {
    return request(productReviewClient.post(`/product/${productId}`, payload, withAuth(token)));
  },
};
