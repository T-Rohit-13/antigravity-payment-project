import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rq_token'));
  const [loading, setLoading] = useState(true);
  
  // App Lock State (Session-based lock)
  const [isUnlocked, setIsUnlocked] = useState(
    sessionStorage.getItem('rq_unlocked') === 'true'
  );

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Auth fetch failed:', err);
      localStorage.removeItem('rq_token');
      sessionStorage.removeItem('rq_unlocked');
      setToken(null);
      setUser(null);
      setIsUnlocked(false);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (phone, pin) => {
    // UPI style conversion: use phone as email, pin as password
    const email = `${phone}@retirequest.app`;
    const res = await api.post('/auth/login', { email, password: String(pin) });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('rq_token', newToken);
    sessionStorage.setItem('rq_unlocked', 'true');
    setToken(newToken);
    setUser(userData);
    setIsUnlocked(true);
    return userData;
  };

  const unlockApp = async (pin) => {
    try {
      if (!user) return false;
      const res = await api.post('/auth/login', { email: user.email, password: String(pin) });
      sessionStorage.setItem('rq_unlocked', 'true');
      setIsUnlocked(true);
      return true;
    } catch (err) {
      return false;
    }
  };

  const register = async (formData) => {
    // Convert to API format behind scenes
    const apiData = {
      name: formData.name || 'Demo User',
      email: `${formData.phone}@retirequest.app`,
      password: String(formData.pin),
      age: formData.age || 22,
      goalType: formData.goalType,
      retirementAge: formData.retirementAge || 55,
      targetAmount: formData.targetAmount || 5000000
    };

    const res = await api.post('/auth/register', apiData);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('rq_token', newToken);
    sessionStorage.setItem('rq_unlocked', 'true');
    setToken(newToken);
    setUser(userData);
    setIsUnlocked(true);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('rq_token');
    sessionStorage.removeItem('rq_unlocked');
    setToken(null);
    setUser(null);
    setIsUnlocked(false);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isUnlocked,
      login,
      unlockApp,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
