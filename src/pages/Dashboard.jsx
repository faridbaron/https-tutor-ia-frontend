import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import LogicMindMark from "../components/LogicMindMark";
import "../auth.css";

const NIVEL_COLOR = { BASICO: "#10b981", MEDIO: "#f59e0b", ALTO: "#6366f1" };
const ROL_LABEL   = { ADMIN: "Administrador", ESTUDIANTE: "Estudiante", PROFESOR: "Profesor" };

/* ── Sección Inicio ─────────────────────────────────────────── */
function HomeSection({ user, authHeader }) {
  const navigate = useNavigate();
  const [diagInfo, setDiagInfo] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/diagnostico/sesion-activa`, { headers: authHeader() })
      .then(({ data }) => setDiagInfo(data))
      .catch(() => {});
  }, []);

  const nivelEsDefault = user.nivel_actual === "BASICO" && !diagInfo?.activa;

  return (
    <div className="section-content">
      <div className="dash-welcome">
        <h2>Hola, {user.nombre.split(" ")[0]} 👋</h2>
        <p className="dash-welcome-sub">Bienvenido a tu panel de aprendizaje</p>
      </div>

      <div className="dash-stats">
        <div className="stat-card">
          <span className="stat-icon">📚</span>
          <div className="stat-info">
            <span className="stat-label">Unidad actual</span>
            <span className="stat-value">Unidad {user.unidad_actual}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <div className="stat-info">
            <span className="stat-label">Nivel</span>
            <span className="stat-value" style={{ color: NIVEL_COLOR[user.nivel_actual] }}>
              {user.nivel_actual}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👤</span>
          <div className="stat-info">
            <span className="stat-label">Alias</span>
            <span className="stat-value">@{user.username}</span>
          </div>
        </div>
      </div>

      {/* Tarjeta diagnóstico */}
      <div className="dash-info-card" style={{ borderColor: "#c4b5fd" }}>
        <h3>🧠 Evaluación Diagnóstica — Unidad 1</h3>
        {nivelEsDefault ? (
          <>
            <p>
              Antes de comenzar, completa la evaluación diagnóstica para que el tutor
              conozca tu nivel de partida en pensamiento computacional.
            </p>
            <button
              className="auth-btn"
              style={{ marginTop: 0 }}
              onClick={() => navigate("/diagnostico/unidad_1")}
            >
              Iniciar evaluación diagnóstica →
            </button>
          </>
        ) : diagInfo?.activa ? (
          <>
            <p>Tienes una evaluación en progreso. Puedes reanudarla ahora.</p>
            <button
              className="auth-btn"
              style={{ marginTop: 0 }}
              onClick={() => navigate("/diagnostico/unidad_1")}
            >
              Continuar evaluación →
            </button>
          </>
        ) : (
          <p style={{ color: "#065f46" }}>
            ✅ Evaluación completada. Tu nivel en la Unidad 1 es{" "}
            <strong style={{ color: NIVEL_COLOR[user.nivel_actual] }}>
              {user.nivel_actual}
            </strong>.
          </p>
        )}
      </div>

      <div className="dash-info-card">
        <h3>Sobre el tutor</h3>
        <p>
          Este tutor inteligente te guiará en el aprendizaje de lógica y pensamiento
          computacional, adaptando el contenido a tu nivel y ritmo de aprendizaje.
        </p>
        <div className="coming-soon">
          🚀 Próximamente: sesiones de tutoría interactiva con IA
        </div>
      </div>
    </div>
  );
}

/* ── Sección Ingesta de Documentos ─────────────────────────── */
function PipelineSection({ authHeader }) {
  const [pdfs, setPdfs]         = useState([]);
  const [uploaded, setUploaded] = useState(false);
  const [running, setRunning]   = useState(false);
  const [limpiar, setLimpiar]   = useState(false);
  const [logs, setLogs]         = useState([]);
  const [resumen, setResumen]   = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError]       = useState(null);
  const logRef = useRef(null);

  const appendLog = (msg) =>
    setLogs((prev) => {
      const next = [...prev, msg];
      setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50);
      return next;
    });

  const handleFiles = (files) => {
    const ok = Array.from(files).filter((f) => f.name.endsWith(".pdf"));
    if (!ok.length) return;
    setPdfs(ok); setUploaded(false); setLogs([]); setResumen(null); setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files);
  }, []);

  const uploadPdfs = async () => {
    const form = new FormData();
    pdfs.forEach((f) => form.append("files", f));
    try {
      await axios.post(`${API}/upload-pdfs`, form, { headers: authHeader() });
      setUploaded(true); setError(null);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al subir los archivos.");
    }
  };

  const runGrafo = async () => {
    setLogs([]); setResumen(null); setError(null); setRunning(true);
    try {
      await axios.post(`${API}/run-grafo`, {}, { headers: authHeader() });
    } catch (e) {
      setError(e.response?.data?.detail || "Error al iniciar la migración del grafo.");
      setRunning(false); return;
    }
    const es = new EventSource(`${API}/logs`);
    es.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === "ping")  return;
      if (d.type === "done")  { es.close(); setRunning(false); return; }
      if (d.type === "error") { setError(d.message); es.close(); setRunning(false); return; }
      if (d.type === "log")   appendLog(d.message);
    };
    es.onerror = () => { es.close(); setRunning(false); };
  };

  const runPipeline = async () => {
    setLogs([]); setResumen(null); setError(null); setRunning(true);
    try {
      await axios.post(`${API}/run?limpiar=${limpiar}`, {}, { headers: authHeader() });
    } catch (e) {
      setError(e.response?.data?.detail || "Error al iniciar el pipeline.");
      setRunning(false); return;
    }
    const es = new EventSource(`${API}/logs`);
    es.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === "ping")    return;
      if (d.type === "done")    { es.close(); setRunning(false); return; }
      if (d.type === "resumen") { setResumen(d); return; }
      if (d.type === "error")   { setError(d.message); es.close(); setRunning(false); return; }
      if (d.type === "log")     appendLog(d.message);
    };
    es.onerror = () => { es.close(); setRunning(false); };
  };

  return (
    <div className="section-content">
      <div className="dash-welcome">
        <h2>Ingesta de Documentos</h2>
        <p className="dash-welcome-sub">Carga los libros PDF para procesarlos e indexarlos en el tutor</p>
      </div>

      {/* Regenerar grafo */}
      <div className="pipe-controls" style={{ marginBottom: "16px" }}>
        <button
          className="auth-btn"
          style={{ background: "#1e3a5f", color: "#7dd3fc", border: "1px solid #2563eb", marginTop: 0 }}
          onClick={runGrafo}
          disabled={running}
        >
          {running ? "Procesando..." : "Regenerar grafo de temas"}
        </button>
        <span style={{ fontSize: "0.78rem", color: "#64748b", alignSelf: "center" }}>
          Migra Neo4j a 228 nodos sin re-procesar PDFs
        </span>
      </div>

      {/* Dropzone */}
      <div
        className={`pipe-dropzone ${dragging ? "pipe-dragging" : ""} ${pdfs.length ? "pipe-has-files" : ""}`}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => document.getElementById("pipe-file-input").click()}
      >
        <input
          id="pipe-file-input"
          type="file" accept=".pdf" multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {pdfs.length === 0 ? (
          <>
            <div className="pipe-drop-icon">📄</div>
            <p className="pipe-drop-text">Arrastra los PDFs aquí o haz clic para seleccionar</p>
            <span className="pipe-drop-hint">Puedes cargar múltiples libros</span>
          </>
        ) : (
          <ul className="pipe-file-list">
            {pdfs.map((f, i) => (
              <li key={i}>
                <span className="pipe-file-icon">📖</span>
                <span className="pipe-file-name">{f.name}</span>
                <span className="pipe-file-size">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Controls */}
      {pdfs.length > 0 && (
        <div className="pipe-controls">
          {!uploaded ? (
            <button className="auth-btn pipe-upload-btn" onClick={uploadPdfs}>
              Subir archivos
            </button>
          ) : (
            <>
              <label className="pipe-checkbox-label">
                <input type="checkbox" checked={limpiar} onChange={(e) => setLimpiar(e.target.checked)} />
                Limpiar Neo4j y Pinecone antes de iniciar
              </label>
              <button
                className="auth-btn pipe-run-btn"
                onClick={runPipeline}
                disabled={running}
              >
                {running ? "Procesando…" : "Ejecutar pipeline"}
              </button>
            </>
          )}
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="pipe-log-section">
          <div className="pipe-log-header">
            <span>Registro de ejecución</span>
            {running && <span className="pipe-badge-running">En ejecución</span>}
          </div>
          <div className="pipe-terminal" ref={logRef}>
            {logs.map((line, i) => (
              <div key={i} className={`pipe-log-line ${
                line.includes("ERROR") ? "pipe-log-error" :
                line.includes("===")  ? "pipe-log-hi"    : ""
              }`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen */}
      {resumen && (
        <div className="pipe-resumen">
          <div className="pipe-resumen-title">
            <span className="pipe-resumen-check">✅</span> Ingesta completada
          </div>
          <div className="pipe-resumen-grid">
            {resumen.libros.map((l, i) => (
              <div key={i} className="pipe-resumen-card">
                <span className="pipe-resumen-label">{l.fuente}</span>
                <span className="pipe-resumen-value">{l.chunks} chunks</span>
              </div>
            ))}
            <div className="pipe-resumen-card pipe-resumen-total">
              <span className="pipe-resumen-label">Total</span>
              <span className="pipe-resumen-value">{resumen.total} chunks</span>
            </div>
            <div className="pipe-resumen-card pipe-resumen-costo">
              <span className="pipe-resumen-label">Costo estimado</span>
              <span className="pipe-resumen-value">${resumen.costo?.costo_estimado_usd} USD</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sección Diagnóstico (enlace) ───────────────────────────── */
const UNIDADES_INFO = [
  {
    id: "unidad_1",
    titulo: "Unidad 1: Algoritmos y Pensamiento Computacional",
    descripcion: "Evalúa 4 dominios: pensamiento algorítmico, abstracción, reconocimiento de patrones y descomposición de problemas.",
    kcs: 4,
  },
  {
    id: "unidad_2",
    titulo: "Unidad 2: Lógica y Estructuras de Control",
    descripcion: "Evalúa 4 dominios: lógica proposicional, ciclos e iteración, reconocimiento de patrones y descomposición de problemas.",
    kcs: 4,
  },
  {
    id: "unidad_3",
    titulo: "Unidad 3: Abstracción y Algoritmos Avanzados",
    descripcion: "Evalúa 5 dominios: abstracción, ciclos e iteración, reconocimiento de patrones, descomposición de problemas y pensamiento algorítmico.",
    kcs: 5,
  },
];

function DiagnosticoSection({ navigate, authHeader }) {
  const [progreso, setProgreso] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/ruta/progreso-completo`, { headers: authHeader() })
      .then(({ data }) => setProgreso(data.unidades))
      .catch(() => {});
  }, []);

  return (
    <div className="section-content">
      <div className="dash-welcome">
        <h2>Diagnóstico Adaptativo</h2>
        <p className="dash-welcome-sub">
          Evaluaciones de 12–20 preguntas adaptativas con algoritmo BKT
        </p>
      </div>
      {UNIDADES_INFO.map((u, i) => {
        const p = progreso?.[i];
        const pct = p && p.total_nodos > 0 ? Math.round((p.nodos_dominados / p.total_nodos) * 100) : 0;
        return (
          <div key={u.id} className="dash-info-card" style={{ borderColor: "#c4b5fd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ margin: 0 }}>🧠 {u.titulo}</h3>
              {p && (
                <span style={{
                  fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.6rem",
                  borderRadius: 999, background: "#ede9fe", color: "#6366f1",
                }}>
                  {p.nivel_diagnostico}
                </span>
              )}
            </div>
            <p style={{ marginBottom: 8 }}>{u.descripcion}</p>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: p ? 10 : 0 }}>
              {u.kcs} dominios · 12–{u.kcs * 4} preguntas adaptativas
            </p>
            {p && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#6b7280", marginBottom: 4 }}>
                  <span>Progreso en la ruta</span>
                  <span>{p.nodos_dominados}/{p.total_nodos} nodos · {pct}%</span>
                </div>
                <div style={{ background: "#e5e7eb", borderRadius: 999, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, background: "#10b981", height: "100%", borderRadius: 999, transition: "width 0.4s" }} />
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="auth-btn"
                style={{ marginTop: 0, flex: 1 }}
                onClick={() => navigate(`/diagnostico/${u.id}`)}
              >
                Ir a la evaluación →
              </button>
              <button
                style={{
                  marginTop: 0, flex: 1, padding: "0.6rem",
                  background: "#ede9fe", color: "#6366f1", border: "none",
                  borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: "0.9rem",
                }}
                onClick={() => navigate("/ruta")}
              >
                Ver ruta →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Dashboard principal ───────────────────────────────────── */
const MENU = [
  { id: "home",        label: "Inicio",                roles: ["ADMIN","ESTUDIANTE","PROFESOR"] },
  { id: "diagnostico", label: "Diagnóstico",           roles: ["ESTUDIANTE","PROFESOR"] },
  { id: "ruta",        label: "Ruta de aprendizaje",   roles: ["ESTUDIANTE","PROFESOR"] },
  { id: "ingesta",     label: "Ingesta de documentos", roles: ["ADMIN"] },
];

export default function Dashboard() {
  const { user, logout, authHeader } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("home");

  const handleLogout = () => { logout(); navigate("/login"); };

  const visibleMenu = MENU.filter((m) => m.roles.includes(user.rol));

  const initials = user.nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="dash-root">
      {/* ── Header ── */}
      <header className="dash-header">
        <div className="dash-brand">
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

      {/* ── Tab navigation ── */}
      <nav className="dash-tabs">
        {visibleMenu.map((item) => (
          <button
            key={item.id}
            className={`dash-tab ${section === item.id ? "dash-tab-active" : ""}`}
            onClick={() => item.id === "ruta" ? navigate("/ruta") : setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Contenido principal ── */}
      <div className="dash-body">
        <div className="dash-content">
          {section === "home"        && <HomeSection user={user} authHeader={authHeader} />}
          {section === "diagnostico" && <DiagnosticoSection navigate={navigate} authHeader={authHeader} />}
          {section === "ingesta"     && <PipelineSection authHeader={authHeader} />}
        </div>
      </div>
    </div>
  );
}
