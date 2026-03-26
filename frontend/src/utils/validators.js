export function validateEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password = '') {
  return password.trim().length >= 6;
}

export function validateRequired(value = '') {
  return value.trim().length > 0;
}
