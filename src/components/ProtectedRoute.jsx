import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div className="auth-spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.rol !== requiredRole) return <Navigate to="/dashboard" replace />;

  return children;
}
