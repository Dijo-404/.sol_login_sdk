const STORAGE_KEY = "sol_login_token";

export function getStoredToken() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token) {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Ignore
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function decodeTokenPayload(token) {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return true;
  return Date.now() / 1000 > payload.exp;
}
