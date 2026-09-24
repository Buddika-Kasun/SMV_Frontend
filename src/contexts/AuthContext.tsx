import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { userService } from "../services/user.service";
import toast from "react-hot-toast";
import { User } from "../api";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isManagerOrAdmin: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = () => {
      try {
        // Direct localStorage check - most reliable
        const token = localStorage.getItem("access_token");
        const userStr = localStorage.getItem("smv_user");

        if (token && userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback((user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    toast.success(`Welcome back, ${user.fullName}!`);
  }, []);

  const logout = useCallback(() => {
    userService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast.success("You have been logged out securely.");
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const user = await userService.refreshCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        return user;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      return null;
    }
  }, []);

  const value = {
    currentUser,
    loading,
    isAuthenticated,
    isManagerOrAdmin:
      currentUser?.role === "admin" || currentUser?.role === "manager",
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};;

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
