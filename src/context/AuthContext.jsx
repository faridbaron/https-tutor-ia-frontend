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

  // El token vive en localStorage, que es compartido por todas las pestañas del
  // mismo navegador. Si en otra pestaña se inicia/cierra sesión (o se entra con
  // otro usuario), esta pestaña quedaría mostrando datos del usuario anterior.
  // Escuchamos el evento `storage` (que solo se dispara en las OTRAS pestañas) y
  // recargamos para resincronizar toda la sesión con la actual.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "token" || e.oldValue === e.newValue) return;
      window.location.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
