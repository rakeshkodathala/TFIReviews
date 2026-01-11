import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "../services/api";

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  avatar?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    name?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await authService.getStoredToken();
      const storedUser = await authService.getStoredUser();

      if (storedToken && storedUser) {
        try {
          await authService.verifyToken();
          setToken(storedToken);
          setUser(storedUser);
        } catch (error) {
          await authService.logout();
        }
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
    setToken(response.token);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    name?: string
  ) => {
    const response = await authService.register({
      username,
      email,
      password,
      name,
    });
    setUser(response.user);
    setToken(response.token);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    const response = await authService.updateProfile(userData);
    if (response.user) {
      setUser(response.user);
    }
  };

  // Ensure primitive booleans - use !! to convert to boolean primitive
  const isLoadingValue: boolean = !!isLoading;
  const isAuthenticatedValue: boolean = !!(user && token);

  const value: AuthContextType = {
    user,
    token,
    isLoading: isLoadingValue,
    isAuthenticated: isAuthenticatedValue,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
