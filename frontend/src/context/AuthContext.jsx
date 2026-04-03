import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
// Assuming backend is at 3000
const API_URL = 'http://localhost:3000/api'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, role, ...details }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to hydrate on refresh (Since we use httpOnly cookies, we might just 
    // rely on storing {role, id} in localStorage as a helper, or verify endpoint)
    const stored = localStorage.getItem('userMeta');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (role, data) => {
    const res = await axios.post(`${API_URL}/auth/${role}/login`, data);
    const userData = { ...res.data[role], role };
    setUser(userData);
    localStorage.setItem('userMeta', JSON.stringify(userData));
    return res.data;
  };

  const register = async (role, data) => {
    const res = await axios.post(`${API_URL}/auth/${role}/register`, data);
    const userData = { ...res.data[role], role };
    setUser(userData);
    localStorage.setItem('userMeta', JSON.stringify(userData));
    return res.data;
  };

  const logout = async () => {
    if (!user) return;
    try {
      await axios.post(`${API_URL}/auth/${user.role}/logout`);
    } catch(e) {}
    setUser(null);
    localStorage.removeItem('userMeta');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
