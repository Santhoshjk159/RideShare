import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000; // 10 second timeout to prevent hanging

// Add request interceptor to include access token
axios.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Avoid infinite loops and don't retry refresh/auth endpoints
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh") &&
      !original.url?.includes("/auth/me")
    ) {
      original._retry = true;

      try {
        await axios.post("/auth/refresh");
        return axios(original);
      } catch (refreshError) {
        Cookies.remove("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authCheckAttempts, setAuthCheckAttempts] = useState(0);

  useEffect(() => {
    // Only check auth once on mount
    if (authCheckAttempts === 0) {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    // Prevent too many auth check attempts
    if (authCheckAttempts >= 3) {
      console.log("Too many auth check attempts, skipping");
      setLoading(false);
      return;
    }

    setAuthCheckAttempts((prev) => prev + 1);

    try {
      // Only check auth if we have a token
      const token = Cookies.get("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get("/auth/me");
      setUser(response.data.user);
      setAuthCheckAttempts(0); // Reset on success
    } catch (error) {
      console.log("Auth check failed:", error);
      Cookies.remove("accessToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post("/auth/login", { email, password });
      const { user, accessToken } = response.data;

      Cookies.set("accessToken", accessToken, { expires: 1 }); // 1 day
      setUser(user);
      toast.success("Welcome back!");
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post("/auth/register", {
        name,
        email,
        password,
      });
      const { user, accessToken } = response.data;

      Cookies.set("accessToken", accessToken, { expires: 1 });
      setUser(user);
      toast.success("Account created successfully!");
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      Cookies.remove("accessToken");
      setUser(null);
      toast.success("Logged out successfully");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
