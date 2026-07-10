import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogicMindMark from "./LogicMindMark";

const ROL_LABEL = { ADMIN: "Administrador", ESTUDIANTE: "Estudiante", PROFESOR: "Profesor" };

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => { logout(); navigate("/login"); };

  const initials = user.nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="dash-header">
      <div
        className="dash-brand"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/dashboard")}
      >
        <LogicMindMark size="sm" />
        <span className="dash-brand-name">LogicMind</span>
      </div>
      <div className="dash-header-right">
        <span className={`role-badge role-${user.rol.toLowerCase()}`}>
          {ROL_LABEL[user.rol]}
        </span>
        <span className="dash-username">@{user.username}</span>
        <div className="dash-avatar" title={user.nombre}>{initials}</div>
        <button className="btn-ghost" onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </header>
  );
}
