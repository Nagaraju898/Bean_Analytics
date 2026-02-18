import React, {
  createContext,
  useState,
  useContext,
  useEffect
} from "react";
import API from "../config/axiosConfig";

const AuthContext = createContext(null);

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 Restore session on refresh
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      try {
        // Validate token format before using it
        const parts = storedToken.split(".");
        if (parts.length !== 3) {
          throw new Error("Invalid token format");
        }
        
        const payload = JSON.parse(
          atob(parts[1])
        );
        
        // Verify token has required fields
        if (!payload.userId || !payload.username) {
          throw new Error("Token missing required fields");
        }

        setUser({
          id: payload.userId,
          username: payload.username,
          email: payload.email
        });

        setToken(storedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Invalid token in storage:", error);
        // Clear invalid token
        localStorage.removeItem("token");
      }
    }
    
    // Mark loading as complete
    setIsLoading(false);
  }, []);

  // ✅ LOGIN
  const login = async (email, password) => {
    try {
      const response = await API.post("/auth/login", {
        email,
        password
      });

      const { token, userId, username } = response.data;

      localStorage.setItem("token", token);

      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      setToken(token);
      setUser({ 
        id: userId, 
        username,
        email: payload.email
      });
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Login failed"
      };
    }
  };

  // ✅ REGISTER
  const register = async (username, email, password) => {
    try {
      const response = await API.post(
        "/auth/register",
        {
          username,
          email,
          password
        }
      );

      const { token } = response.data;

      localStorage.setItem("token", token);

      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      setUser({
        id: payload.userId,
        username: payload.username,
        email: payload.email
      });

      setToken(token);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Registration failed"
      };
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
