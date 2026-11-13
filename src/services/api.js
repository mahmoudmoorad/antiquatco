/**
 * Centralized API Service for ANTIKATKO.
 * Handles environment-based URL configuration, JWT authorization headers,
 * automatic token refresh, guest order headers, and error formatting.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "antikatko_access_token";
const REFRESH_TOKEN_KEY = "antikatko_refresh_token";
const GUEST_TOKEN_KEY = "antikatko_guest_token";

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getGuestToken() {
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setAuthTokens({ access, refresh }) {
  try {
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } catch (e) {
    console.error("Failed to persist auth tokens:", e);
  }
}

export function setGuestToken(token) {
  try {
    if (token) {
      localStorage.setItem(GUEST_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(GUEST_TOKEN_KEY);
    }
  } catch (e) {
    console.error("Failed to save guest token:", e);
  }
}

export function clearAuthTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.error("Failed to clear auth tokens:", e);
  }
}

/**
 * Format image URLs so that relative Django media paths (/media/...)
 * are resolved against the API server base URL.
 */
export function formatImageUrl(imageUrl) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }
  const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${API_BASE_URL}${cleanPath}`;
}

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token, error = null) {
  refreshSubscribers.forEach((callback) => callback(token, error));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

/**
 * Perform token refresh with the backend.
 */
async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearAuthTokens();
    throw new Error("No refresh token available");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearAuthTokens();
    window.dispatchEvent(new Event("authExpired"));
    throw new Error("Session expired. Please log in again.");
  }

  const json = await response.json();
  const newAccess = json?.data?.access || json?.access;
  if (newAccess) {
    setAuthTokens({ access: newAccess });
    return newAccess;
  }
  throw new Error("Invalid token refresh response");
}

/**
 * Centralized fetch request wrapper with auth and refresh support.
 */
export async function apiRequest(endpoint, options = {}, isRetry = false) {
  const url = endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = {
    ...(options.headers || {}),
  };

  // Add Authorization if access token is present
  const accessToken = getAccessToken();
  if (accessToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Add X-Guest-Token if available and not already provided
  const guestToken = options.guestToken || getGuestToken();
  if (guestToken && !headers["X-Guest-Token"]) {
    headers["X-Guest-Token"] = guestToken;
  }

  // Set Content-Type only if body is not FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);

    // If 401 and we have a refresh token, try refreshing once
    if (response.status === 401 && !isRetry && getRefreshToken()) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newAccess = await refreshAccessToken();
          isRefreshing = false;
          onRefreshed(newAccess, null);
          return apiRequest(endpoint, options, true);
        } catch (refreshErr) {
          isRefreshing = false;
          onRefreshed(null, refreshErr);
          throw refreshErr;
        }
      } else {
        // Wait for active refresh to complete
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newAccess, error) => {
            if (newAccess) {
              resolve(apiRequest(endpoint, options, true));
            } else {
              reject(error || new Error("Token refresh failed"));
            }
          });
        });
      }
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const contentType = response.headers.get("content-type") || "";
    let resultData = null;
    if (contentType.includes("application/json")) {
      resultData = await response.json();
    } else {
      resultData = await response.text();
    }

    if (!response.ok) {
      let errorMessage = "An error occurred during the request.";
      let errors = {};

      if (typeof resultData === "object" && resultData !== null) {
        errorMessage = resultData.message || resultData.detail || errorMessage;
        errors = resultData.errors || resultData;
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.errors = errors;
      error.data = resultData;
      throw error;
    }

    return resultData;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      const netError = new Error("Network connection error. Please ensure the backend is running.");
      netError.isNetworkError = true;
      throw netError;
    }
    throw error;
  }
}

export const api = {
  get(endpoint, params = {}, options = {}) {
    let url = endpoint;
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        queryParams.append(key, val);
      }
    });
    const qs = queryParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
    return apiRequest(url, { ...options, method: "GET" });
  },

  post(endpoint, data = {}, options = {}) {
    const isFormData = data instanceof FormData;
    return apiRequest(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  patch(endpoint, data = {}, options = {}) {
    const isFormData = data instanceof FormData;
    return apiRequest(endpoint, {
      ...options,
      method: "PATCH",
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  put(endpoint, data = {}, options = {}) {
    const isFormData = data instanceof FormData;
    return apiRequest(endpoint, {
      ...options,
      method: "PUT",
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  delete(endpoint, options = {}) {
    return apiRequest(endpoint, { ...options, method: "DELETE" });
  },
};

export default api;