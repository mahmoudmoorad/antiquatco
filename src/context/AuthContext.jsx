
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import authService from "../services/authService";

import {
  getAccessToken,
  getRefreshToken,
  clearAuthTokens,
} from "../services/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "antikatko-auth-user";

function clearSavedUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear saved user:", error);
  }
}

function normalizeUser(userData) {
  if (!userData || !userData.email) {
    return null;
  }

  const role = String(userData.role || "").toUpperCase();

  return {
    ...userData,
    name:
      userData.name ||
      userData.full_name ||
      `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
      userData.username ||
      userData.email.split("@")[0],

    isAdmin:
      role === "ADMIN" ||
      userData.isAdmin === true ||
      userData.is_admin === true ||
      userData.is_staff === true,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateUserState = useCallback((userData) => {
    const normalizedUser = normalizeUser(userData);

    if (!normalizedUser) {
      setUser(null);
      clearSavedUser();
      return null;
    }

    setUser(normalizedUser);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(normalizedUser)
      );
    } catch (error) {
      console.warn("Failed to save user:", error);
    }

    return normalizedUser;
  }, []);

  const clearSession = useCallback(() => {
    clearAuthTokens();
    updateUserState(null);
  }, [updateUserState]);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken && !refreshToken) {
        clearSession();

        if (isMounted) {
          setLoading(false);
        }

        return;
      }

      try {
        const userData = await authService.getCurrentUser();

        if (isMounted) {
          updateUserState(userData);
        }
      } catch (error) {
        console.warn("Session validation failed:", error.message);

        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    validateSession();

    const handleAuthExpired = () => {
      if (isMounted) {
        clearSession();
        setLoading(false);
      }
    };

    window.addEventListener("authExpired", handleAuthExpired);

    return () => {
      isMounted = false;
      window.removeEventListener("authExpired", handleAuthExpired);
    };
  }, [updateUserState, clearSession]);

  const login = async (email, password) => {
    const { user: loggedInUser, tokens } = await authService.login(
      email,
      password
    );

    if (!tokens?.access || !loggedInUser) {
      clearSession();
      throw new Error("Invalid login response.");
    }

    const normalizedUser = updateUserState(loggedInUser);

    if (!normalizedUser) {
      clearSession();
      throw new Error("Invalid user data.");
    }

    return normalizedUser;
  };

  /**
   * Start registration.
   * No user session is created at this stage.
   */
  const register = async (name, email, password) => {
    return authService.register({
      name,
      email,
      password,
    });
  };

  /**
   * Complete registration after successful email OTP verification.
   */
  const verifyRegistration = async (email, otp) => {
    const { user: newUser, tokens } =
      await authService.verifyRegistration(email, otp);

    if (!tokens?.access || !newUser) {
      clearSession();
      throw new Error("Invalid registration verification response.");
    }

    const normalizedUser = updateUserState(newUser);

    if (!normalizedUser) {
      clearSession();
      throw new Error("Invalid user data.");
    }

    return normalizedUser;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  };

  const value = {
    user,
    login,
    register,
    verifyRegistration,
    logout,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: Boolean(user?.isAdmin),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export default AuthContext;
