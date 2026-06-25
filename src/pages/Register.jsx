import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(form.username)) {
      setError("El alias solo puede contener letras, números, puntos, guiones y _");
      return;
    }
    setLoading(true);
    try {
      await register(form.nombre, form.username, form.password);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🧠</span>
          <h1 className="auth-title">Tutor Inteligente</h1>
          <p className="auth-subtitle">Lógica y Pensamiento Computacional</p>
        </div>

        <h2 className="auth-heading">Crear cuenta</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Juan Pérez"
              value={form.nombre}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="username">Alias <span className="auth-hint">(identificador único)</span></label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="juan_perez"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm">Confirmar contraseña</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="auth-link-text">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="auth-link">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
