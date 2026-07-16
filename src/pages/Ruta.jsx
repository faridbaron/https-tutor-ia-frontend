import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import AppHeader from "../components/AppHeader";
import ChatBurbuja from "../components/ChatBurbuja";
import "../auth.css";

const ESTADO_COLOR = {
  dominado:  "var(--accent-2)",
  siguiente: "#F59E0B",
  bloqueado: "var(--locked)",
};
const ESTADO_BADGE_BG = {
  dominado:  "var(--accent-2-soft)",
  siguiente: "#FEF3C7",
  bloqueado: "var(--locked-bg)",
};
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
  const [searchParams] = useSearchParams();
  const [tabActiva, setTabActiva] = useState(
    TABS.some((t) => t.id === searchParams.get("unidad")) ? searchParams.get("unidad") : "unidad_1"
  );
  const [nodos, setNodos] = useState([]);
  const [meta, setMeta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modalNodo, setModalNodo] = useState(null);
  const [prereqs, setPrereqs] = useState(null);
  const [cargandoModal, setCargandoModal] = useState(false);
  const [estadosDiag, setEstadosDiag] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/ruta/progreso-completo`, { headers: authHeader() })
      .then(({ data }) => {
        const mapa = {};
        data.unidades.forEach((u) => { mapa[u.unidad_id] = u.diagnostico_estado; });
        setEstadosDiag(mapa);
      })
      .catch(() => {});
  }, []);

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

  const diagCompletado = estadosDiag?.[tabActiva] === "completado";

  useEffect(() => {
    if (estadosDiag === null) return; // aún no sabemos el estado, esperar
    if (diagCompletado) cargarUnidad(tabActiva);
  }, [tabActiva, estadosDiag]);

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
    <div className="ruta-page">
      <AppHeader />
      {/* Header */}
      <header className="ruta-header">
        <button className="ruta-back-btn" onClick={() => navigate("/dashboard")}>←</button>
        <h1 className="ruta-title">Ruta de Aprendizaje</h1>
      </header>

      <div className="ruta-body">
        {/* Tabs */}
        <div className="ruta-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTabActiva(t.id)}
              className={`ruta-tab ${tabActiva === t.id ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Bloqueo: sin diagnóstico completado para esta unidad */}
        {estadosDiag !== null && !diagCompletado ? (
          <div className="ruta-estado-msg" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <p>Completa la evaluación diagnóstica de esta unidad para desbloquear tu ruta de aprendizaje.</p>
            <button className="ruta-btn-empezar" onClick={() => navigate(`/diagnostico/${tabActiva}`)}>
              Ir a la evaluación diagnóstica →
            </button>
          </div>
        ) : (
          <>
            {/* Barra de progreso */}
            {meta && (
              <div className="ruta-progreso-card">
                <div className="ruta-progreso-top">
                  <span className="ruta-progreso-nivel">
                    Nivel diagnóstico: <strong>{meta.nivel}</strong>
                  </span>
                  <span className="ruta-progreso-meta">
                    {meta.dominados}/{meta.total} dominados · {porcentaje}%
                  </span>
                </div>
                <div className="ruta-progreso-track">
                  <div className="ruta-progreso-fill" style={{ width: `${porcentaje}%` }} />
                </div>
              </div>
            )}

            {/* Nodos */}
            {cargando ? (
              <div className="ruta-estado-msg">Cargando ruta...</div>
            ) : nodos.length === 0 && meta ? (
              <div className="ruta-estado-msg">No hay nodos disponibles para tu nivel actual.</div>
            ) : (
          <div className="ruta-nodos">
            {nodos.map((nodo) => (
              <div
                key={nodo.node_id}
                onClick={() => abrirModal(nodo)}
                className={`ruta-nodo-card ${nodo.estado === "bloqueado" ? "locked" : ""}`}
                style={{ borderLeftColor: ESTADO_COLOR[nodo.estado] }}
              >
                <div className="ruta-nodo-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ruta-nodo-nombre">{nodo.nombre}</div>
                    <div className="ruta-nodo-meta">
                      <span>{DIFICULTAD_LABEL[nodo.dificultad] || "Básico"}</span>
                      {nodo.tiempo_horas && <span>{nodo.tiempo_horas}h estimadas</span>}
                    </div>
                  </div>
                  <div className="ruta-nodo-actions">
                    <span
                      className="ruta-nodo-badge"
                      style={{ color: ESTADO_COLOR[nodo.estado], background: ESTADO_BADGE_BG[nodo.estado] }}
                    >
                      {ESTADO_LABEL[nodo.estado]}
                    </span>
                    {nodo.estado === "siguiente" && (
                      <button
                        className="ruta-btn-empezar"
                        onClick={(e) => { e.stopPropagation(); navigate(`/estudio/${nodo.node_id}`); }}
                      >
                        Empezar
                      </button>
                    )}
                    {nodo.estado === "dominado" && (
                      <button
                        className="ruta-btn-repasar"
                        onClick={(e) => { e.stopPropagation(); navigate(`/estudio/${nodo.node_id}?repaso=1`); }}
                      >
                        Repasar
                      </button>
                    )}
                    {nodo.estado === "bloqueado" && (
                      <span className="ruta-nodo-prereq-hint">ver prereqs →</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}
      </div>

      {/* Chat de la unidad: siempre disponible una vez desbloqueada la ruta */}
      {diagCompletado && <ChatBurbuja key={tabActiva} unidadId={tabActiva} />}

      {/* Modal prereqs */}
      {modalNodo && (
        <div className="ruta-modal-overlay" onClick={cerrarModal}>
          <div className="ruta-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="ruta-modal-title">Prerrequisitos faltantes</h3>
            <p className="ruta-modal-sub">
              Para estudiar <strong>{modalNodo.nombre}</strong>, primero debes completar:
            </p>

            {cargandoModal ? (
              <div className="ruta-estado-msg" style={{ padding: "1rem" }}>Cargando...</div>
            ) : prereqs ? (
              <>
                {prereqs.requiere_contenido.length > 0 && (
                  <div className="ruta-prereq-section">
                    <div className="ruta-prereq-label req">Contenido requerido</div>
                    {prereqs.requiere_contenido.map((p) => (
                      <div key={p.node_id} className="ruta-prereq-item req">{p.nombre}</div>
                    ))}
                  </div>
                )}
                {prereqs.refuerzo_previo.length > 0 && (
                  <div className="ruta-prereq-section">
                    <div className="ruta-prereq-label ref">Refuerzo necesario</div>
                    {prereqs.refuerzo_previo.map((p) => (
                      <div key={p.node_id} className="ruta-prereq-item ref">{p.nombre}</div>
                    ))}
                  </div>
                )}
                {prereqs.faltantes.length === 0 && (
                  <p className="ruta-modal-ok">No hay prerrequisitos faltantes.</p>
                )}
              </>
            ) : null}

            <button className="ruta-modal-close" onClick={cerrarModal}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
