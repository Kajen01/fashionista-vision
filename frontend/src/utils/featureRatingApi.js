import axios from 'axios';
import { buildBackendUrl } from './runtimeConfig';

const featureRatingClient = axios.create({
  baseURL: buildBackendUrl('/api/feature-ratings'),
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

export const featureRatingApi = {
  getMyRatings(token) {
    return request(featureRatingClient.get('/me', withAuth(token)));
  },
  getSummary(targetType) {
    return request(featureRatingClient.get(`/${targetType}/summary`));
  },
  upsertRating(targetType, payload, token) {
    return request(featureRatingClient.post(`/${targetType}`, payload, withAuth(token)));
  },
};
