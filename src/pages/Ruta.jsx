import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";

const ESTADO_COLOR = { dominado: "#10b981", siguiente: "#f59e0b", bloqueado: "#9ca3af" };
const ESTADO_LABEL = { dominado: "Dominado", siguiente: "Disponible", bloqueado: "Bloqueado" };
const DIFICULTAD_LABEL = { 1: "Básico", 2: "Medio", 3: "Avanzado" };
const TABS = [
  { id: "unidad_1", label: "Unidad 1" },
  { id: "unidad_2", label: "Unidad 2" },
  { id: "unidad_3", label: "Unidad 3" },
];

export default function Ruta() {
  const { authHeader } = useAuth();
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState("unidad_1");
  const [nodos, setNodos] = useState([]);
  const [meta, setMeta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modalNodo, setModalNodo] = useState(null);
  const [prereqs, setPrereqs] = useState(null);
  const [cargandoModal, setCargandoModal] = useState(false);

  const cargarUnidad = async (unidad_id) => {
    setCargando(true);
    setNodos([]);
    setMeta(null);
    try {
      const { data } = await axios.get(`${API}/ruta/unidad/${unidad_id}`, { headers: authHeader() });
      setNodos(data.nodos);
      setMeta({ nivel: data.nivel_estudiante, total: data.total, dominados: data.dominados });
    } catch (e) {
      console.error("Error cargando ruta:", e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarUnidad(tabActiva); }, [tabActiva]);

  const abrirModal = async (nodo) => {
    if (nodo.estado !== "bloqueado") return;
    setModalNodo(nodo);
    setPrereqs(null);
    setCargandoModal(true);
    try {
      const { data } = await axios.get(`${API}/ruta/prerequisitos/${nodo.node_id}`, { headers: authHeader() });
      setPrereqs(data);
    } catch (e) {
      console.error("Error cargando prereqs:", e);
    } finally {
      setCargandoModal(false);
    }
  };

  const cerrarModal = () => { setModalNodo(null); setPrereqs(null); };

  const porcentaje = meta && meta.total > 0 ? Math.round((meta.dominados / meta.total) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "1rem",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: "#6366f1", padding: 4 }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>
          Ruta de Aprendizaje
        </h1>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTabActiva(t.id)}
              style={{
                padding: "0.5rem 1.25rem", borderRadius: 999,
                border: "2px solid", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem",
                borderColor: tabActiva === t.id ? "#6366f1" : "#e2e8f0",
                background: tabActiva === t.id ? "#6366f1" : "#fff",
                color: tabActiva === t.id ? "#fff" : "#374151",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Barra de progreso */}
        {meta && (
          <div style={{
            background: "#fff", borderRadius: 12, padding: "1rem 1.5rem",
            marginBottom: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,.07)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: "#374151" }}>
                Nivel diagnóstico:{" "}
                <span style={{ color: "#6366f1" }}>{meta.nivel}</span>
              </span>
              <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                {meta.dominados}/{meta.total} dominados · {porcentaje}%
              </span>
            </div>
            <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8, overflow: "hidden" }}>
              <div style={{
                width: `${porcentaje}%`, background: "#10b981",
                height: "100%", borderRadius: 999, transition: "width 0.5s",
              }} />
            </div>
          </div>
        )}

        {/* Nodos */}
        {cargando ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            Cargando ruta...
          </div>
        ) : nodos.length === 0 && meta ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            No hay nodos disponibles para tu nivel actual.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {nodos.map((nodo) => (
              <div
                key={nodo.node_id}
                onClick={() => abrirModal(nodo)}
                style={{
                  background: "#fff", borderRadius: 12,
                  padding: "1rem 1.25rem",
                  borderLeft: `5px solid ${ESTADO_COLOR[nodo.estado]}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                  cursor: nodo.estado === "bloqueado" ? "pointer" : "default",
                  opacity: nodo.estado === "bloqueado" ? 0.72 : 1,
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { if (nodo.estado === "bloqueado") e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 3, fontSize: "0.95rem" }}>
                      {nodo.nombre}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280", display: "flex", gap: "1rem" }}>
                      <span>{DIFICULTAD_LABEL[nodo.dificultad] || "Básico"}</span>
                      {nodo.tiempo_horas && <span>{nodo.tiempo_horas}h estimadas</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 700,
                      color: ESTADO_COLOR[nodo.estado],
                      background: `${ESTADO_COLOR[nodo.estado]}1a`,
                      padding: "0.2rem 0.65rem", borderRadius: 999,
                    }}>
                      {ESTADO_LABEL[nodo.estado]}
                    </span>
                    {nodo.estado === "siguiente" && (
                      <button
                        style={{
                          background: "#6366f1", color: "#fff", border: "none",
                          borderRadius: 8, padding: "0.35rem 0.9rem",
                          fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                        }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/estudio/${nodo.node_id}`); }}
                      >
                        Empezar
                      </button>
                    )}
                    {nodo.estado === "dominado" && (
                      <button
                        style={{
                          background: "#d1fae5", color: "#059669", border: "none",
                          borderRadius: 8, padding: "0.35rem 0.9rem",
                          fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                        }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/tutor/${nodo.node_id}`); }}
                      >
                        Repasar
                      </button>
                    )}
                    {nodo.estado === "bloqueado" && (
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>ver prereqs →</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal prereqs */}
      {modalNodo && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={cerrarModal}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, padding: "2rem",
              maxWidth: 480, width: "92%", boxShadow: "0 20px 60px rgba(0,0,0,.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 0.4rem", color: "#1e293b", fontSize: "1.1rem" }}>
              Prerrequisitos faltantes
            </h3>
            <p style={{ color: "#6b7280", fontSize: "0.88rem", margin: "0 0 1.25rem" }}>
              Para estudiar <strong style={{ color: "#1e293b" }}>{modalNodo.nombre}</strong>, primero debes completar:
            </p>

            {cargandoModal ? (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: "1rem" }}>Cargando...</div>
            ) : prereqs ? (
              <>
                {prereqs.requiere_contenido.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Contenido requerido
                    </div>
                    {prereqs.requiere_contenido.map((p) => (
                      <div key={p.node_id} style={{
                        padding: "0.5rem 0.75rem", background: "#fef2f2",
                        borderRadius: 8, marginBottom: 4, fontSize: "0.88rem", color: "#1e293b",
                      }}>
                        {p.nombre}
                      </div>
                    ))}
                  </div>
                )}
                {prereqs.refuerzo_previo.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Refuerzo necesario
                    </div>
                    {prereqs.refuerzo_previo.map((p) => (
                      <div key={p.node_id} style={{
                        padding: "0.5rem 0.75rem", background: "#fffbeb",
                        borderRadius: 8, marginBottom: 4, fontSize: "0.88rem", color: "#1e293b",
                      }}>
                        {p.nombre}
                      </div>
                    ))}
                  </div>
                )}
                {prereqs.faltantes.length === 0 && (
                  <p style={{ color: "#10b981", fontWeight: 600 }}>No hay prerrequisitos faltantes.</p>
                )}
              </>
            ) : null}

            <button
              onClick={cerrarModal}
              style={{
                marginTop: "1.25rem", width: "100%", padding: "0.65rem",
                background: "#6366f1", color: "#fff", border: "none",
                borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: "0.95rem",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
