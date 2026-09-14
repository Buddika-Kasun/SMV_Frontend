import { useEffect, useRef, useState } from "react";
import { TokenService } from "../api/services/token.service";
import { useAuth } from "../contexts/AuthContext";

export const useTokenRefresh = (intervalMs: number = 60000) => {
  const { isAuthenticated, refreshUser } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkToken = async () => {
      if (TokenService.isTokenExpiringSoon() && !isRefreshing) {
        setIsRefreshing(true);
        try {
          // Token refresh will be handled by AuthContext
          // Just trigger a user refresh if needed
          await refreshUser();
        } catch (error) {
          console.error("Token refresh failed:", error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    // Check immediately
    checkToken();

    // Set up interval
    intervalRef.current = setInterval(checkToken, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, refreshUser, intervalMs, isRefreshing]);
};
