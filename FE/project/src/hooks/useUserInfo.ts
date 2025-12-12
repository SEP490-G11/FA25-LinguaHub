import { useEffect, useState, useCallback } from "react";
import api from "@/config/axiosConfig";

export interface UserInfo {
  userID: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  avatarURL?: string;
}

export const useUserInfo = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/users/myInfo");
      setUser(res.data?.result || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token") {
        fetchUser();
      }
    };

    // Listen for custom event when login happens in same tab
    const handleLoginEvent = () => {
      fetchUser();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-login", handleLoginEvent);
    window.addEventListener("user-logout", handleLoginEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-login", handleLoginEvent);
      window.removeEventListener("user-logout", handleLoginEvent);
    };
  }, [fetchUser]);

  return { user, loading, refetch: fetchUser };
};
