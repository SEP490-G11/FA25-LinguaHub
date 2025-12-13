import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/config/axiosConfig';

interface User {
  userID: number;
  fullName: string;
  email: string;
  avatarURL?: string;
  role: "Admin" | "Tutor" | "Learner";
  username?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  country?: string;
  address?: string;
  bio?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    // Get fresh token each time
    const currentToken =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/users/myInfo");
      const userData = res.data.result as User;
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshUser();
  }, []);

  // Listen to storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token" || e.key === null) {
        refreshUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
