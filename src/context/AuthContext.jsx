import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const getStoredUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      localStorage.removeItem('user');
      return null;
    }
  };

  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.data);
          localStorage.setItem('user', JSON.stringify(response.data.data));
        } catch (error) {
          console.error('Failed to load user:', error);
          if (error.response?.status === 401) {
            logout();
          } else {
            const cachedUser = getStoredUser();
            if (cachedUser) {
              setUser(cachedUser);
            }
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (payload) => {
    const response = await authAPI.login(payload);
    const { token: authToken, data } = response.data;
    
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(data));
    
    setToken(authToken);
    setUser(data);
    
    return data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { token: authToken, data } = response.data;
    
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(data));
    
    setToken(authToken);
    setUser(data);
    
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
