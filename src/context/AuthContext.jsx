
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "antikatko-demo-user";

function getSavedUser() {
  try {
    const savedUser = localStorage.getItem(STORAGE_KEY);

    if (!savedUser) return null;

    const parsedUser = JSON.parse(savedUser);

    if (
      !parsedUser ||
      typeof parsedUser.email !== "string" ||
      !parsedUser.email.trim()
    ) {
      return null;
    }

    return {
      name: parsedUser.name || parsedUser.email.split("@")[0],
      email: parsedUser.email.trim().toLowerCase(),
    };
  } catch {
    return null;
  }
}

// Temporary frontend authentication.
// This will be connected to Django REST API later.

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);

  // Persist the current demo session.
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Unable to save user session:", error);
    }
  }, [user]);

  // Login with a demo session.
  const login = (email, name = "") => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error("Email is required.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    const demoUser = {
      name: name.trim() || cleanEmail.split("@")[0],
      email: cleanEmail,
    };

    setUser(demoUser);

    return demoUser;
  };

  // Register a demo user.
  const register = (name, email) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      throw new Error("Name and email are required.");
    }

    return login(cleanEmail, cleanName);
  };

  // Logout.
  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user),
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
