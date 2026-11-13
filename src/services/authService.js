
/**
 * Authentication and User Service for ANTIKATKO.
 */

import api, {
  setAuthTokens,
  clearAuthTokens,
  getRefreshToken,
} from "./api";

export const authService = {
  async login(email, password) {
    const response = await api.post("/api/v1/auth/login/", {
      email: email.trim().toLowerCase(),
      password,
    });

    const data = response?.data || response;
    const tokens = data?.tokens;
    const user = data?.user;

    if (tokens) {
      setAuthTokens(tokens);
    }

    return { user, tokens };
  },

  /**
   * Start registration and request email verification OTP.
   * This does NOT create a user or issue tokens.
   */
  async register({ email, name, password, phone_number }) {
    const response = await api.post("/api/v1/auth/register/", {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password,
      ...(phone_number ? { phone_number: phone_number.trim() } : {}),
    });

    return response?.data || response;
  },

  /**
   * Verify registration OTP.
   * The backend creates the account and returns JWT tokens only after success.
   */
  async verifyRegistration(email, otp) {
    const response = await api.post("/api/v1/auth/register/verify/", {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });

    const data = response?.data || response;
    const tokens = data?.tokens;
    const user = data?.user;

    if (tokens) {
      setAuthTokens(tokens);
    }

    return { user, tokens };
  },

  async getCurrentUser() {
    const response = await api.get("/api/v1/auth/me/");
    return response?.data || response;
  },

  async updateProfile(profileData) {
    const response = await api.patch("/api/v1/auth/me/", profileData);
    return response?.data || response;
  },

  async logout() {
    const refresh = getRefreshToken();

    try {
      if (refresh) {
        await api.post("/api/v1/auth/logout/", { refresh });
      }
    } catch (error) {
      console.warn(
        "Logout request failed, proceeding to clear client session:",
        error
      );
    } finally {
      clearAuthTokens();
    }
  },

  async changePassword(old_password, new_password) {
    return api.post("/api/v1/auth/change-password/", {
      old_password,
      new_password,
    });
  },

  async requestPasswordReset(email) {
    const response = await api.post(
      "/api/v1/auth/password-reset/request/",
      {
        email: email.trim().toLowerCase(),
      }
    );

    return response?.data || response;
  },

  async confirmPasswordReset(email, otp, new_password) {
    const response = await api.post(
      "/api/v1/auth/password-reset/confirm/",
      {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        new_password,
      }
    );

    return response?.data || response;
  },

  async linkGuestOrders(verified_email, otp) {
    const response = await api.post(
      "/api/v1/auth/link-guest-orders/",
      {
        verified_email: verified_email.trim().toLowerCase(),
        otp: otp.trim(),
      }
    );

    return response?.data || response;
  },
};

export default authService;
