import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API } from "../config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    axios
      .get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { username, password });
    localStorage.setItem("token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (nombre, username, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { nombre, username, password });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
