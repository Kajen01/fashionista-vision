const DEFAULT_BACKEND_URL = 'http://localhost:5000';
const DEFAULT_ML_API_URL = 'http://127.0.0.1:8000';
const DEFAULT_STRIPE_KEY = 'pk_test_51SX0AdCMqeEsvOyIkN6pGGa5IbBJ0dfAfOoumSM6GYebBc6niHPf08X4v4atgiWYkPZEzs9M96jj3qyxihmlFViA00XI2wIV0P';

function trimTrailingSlash(value = '') {
  return value.replace(/\/+$/, '');
}

function trimLeadingSlash(value = '') {
  return value.replace(/^\/+/, '');
}

function shouldUseLocalBackend() {
  return typeof window !== 'undefined' && window.location.port === '3000';
}

export const BACKEND_BASE_URL = trimTrailingSlash(
  process.env.REACT_APP_BACKEND_URL || (shouldUseLocalBackend() ? DEFAULT_BACKEND_URL : ''),
);

export const ML_API_BASE_URL = trimTrailingSlash(
  process.env.REACT_APP_ML_API_URL || DEFAULT_ML_API_URL,
);

export const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || DEFAULT_STRIPE_KEY;

export function buildBackendUrl(path = '') {
  if (!path) {
    return BACKEND_BASE_URL;
  }

  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) {
    return path;
  }

  const normalizedPath = `/${trimLeadingSlash(path)}`;
  return BACKEND_BASE_URL ? `${BACKEND_BASE_URL}${normalizedPath}` : normalizedPath;
}

export function buildMlApiUrl(path = '') {
  if (!path) {
    return ML_API_BASE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${ML_API_BASE_URL}/${trimLeadingSlash(path)}`;
}

export function resolveProductImageUrl(product) {
  const imageSource = product?.image?.url || product?.image || '';
  return buildBackendUrl(imageSource);
}

