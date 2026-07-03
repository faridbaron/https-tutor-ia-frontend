import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Diagnostico from "./pages/Diagnostico";
import Ruta from "./pages/Ruta";
import Tutor from "./pages/Tutor";
import TemaEstudio from "./pages/TemaEstudio";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagnostico/:unidadId"
            element={
              <ProtectedRoute>
                <Diagnostico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ruta"
            element={
              <ProtectedRoute>
                <Ruta />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estudio/:nodeId"
            element={
              <ProtectedRoute>
                <TemaEstudio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor/:nodeId"
            element={
              <ProtectedRoute>
                <Tutor />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
