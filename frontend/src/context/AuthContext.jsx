import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authApi } from '../utils/authApi';
import { clearStoredToken, getStoredToken, setStoredToken } from '../utils/token';

const AuthContext = createContext(null);

function getRedirectPath(location) {
  return `${location.pathname}${location.search}${location.hash}`;
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  const persistToken = (nextToken) => {
    setToken(nextToken);

    if (nextToken) {
      setStoredToken(nextToken);
    } else {
      clearStoredToken();
    }
  };

  const clearAuth = () => {
    persistToken('');
    setUser(null);
  };

  const fetchMe = async (overrideToken = token) => {
    if (!overrideToken) {
      setLoading(false);
      setUser(null);
      return null;
    }

    setLoading(true);

    try {
      const response = await authApi.getMe(overrideToken);
      setUser(response.user);
      return response.user;
    } catch (error) {
      clearAuth();
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = getStoredToken();

    if (storedToken) {
      persistToken(storedToken);
      fetchMe(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    persistToken(response.token);
    setUser(response.user);
    return response;
  };

  const register = async (payload) => {
    const response = await authApi.register(payload);

    if (response.token && response.user) {
      persistToken(response.token);
      setUser(response.user);
    }

    return response;
  };

  const logout = async ({ redirectTo = '/' } = {}) => {
    const activeToken = token;

    try {
      if (activeToken) {
        await authApi.logout(activeToken);
      }
    } catch (error) {
      // Clear local state even if logout transport fails.
    } finally {
      clearAuth();
      navigate(redirectTo, { replace: true });
      toast.success('Logged out successfully.');
    }
  };

  const updateProfile = async (payload) => {
    const response = await authApi.updateProfile(payload, token);
    setUser(response.user);
    return response;
  };

  const changePassword = async (payload) => {
    return authApi.changePassword(payload, token);
  };

  const verifyEmail = async (verificationToken) => {
    const response = await authApi.verifyEmail({ token: verificationToken });

    if (user && response.user?._id === user._id) {
      setUser(response.user);
    }

    return response;
  };

  const resendVerification = async (email) => {
    return authApi.resendVerification(email ? { email } : {});
  };

  const requireLogin = (actionName = 'continue', redirectPath = getRedirectPath(location)) => {
    if (token && user) {
      return true;
    }

    toast.error(`Please login to ${actionName}.`);
    navigate('/login', {
      replace: true,
      state: { from: redirectPath },
    });
    return false;
  };

  const value = useMemo(() => {
    const isAuthenticated = Boolean(token && user);
    const isAdmin = Boolean(user && ((user.role || (user.isAdmin ? 'admin' : 'user')) === 'admin'));

    return {
      user,
      token,
      loading,
      isAuthenticated,
      isAdmin,
      register,
      login,
      logout,
      fetchMe,
      verifyEmail,
      resendVerification,
      updateProfile,
      changePassword,
      requireLogin,
      canAccessCart: () => isAuthenticated,
      canAccessTryOn: () => isAuthenticated,
    };
  }, [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};
