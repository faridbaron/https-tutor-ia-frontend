import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import AppHeader from "../components/AppHeader";
import Icon from "../components/Icon";
import "../auth.css";

const NIVEL_COLOR = { BASICO: "#10b981", MEDIO: "#f59e0b", ALTO: "#6366f1" };

/* ── Sección Inicio ─────────────────────────────────────────── */
function HomeSection({ user, authHeader }) {
  const navigate = useNavigate();
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
        <h2>Hola, {user.nombre.split(" ")[0]} 👋</h2>
        <p className="dash-welcome-sub">Bienvenido a tu panel de aprendizaje</p>
      </div>

      {UNIDADES_INFO.map((u, i) => {
        const p = progreso?.[i];
        const estadoDiag = p?.diagnostico_estado || "no_iniciado";
        const rutaCompleta = !!p && p.total_nodos > 0 && p.nodos_dominados === p.total_nodos;
        const pct = p && p.total_nodos > 0 ? Math.round((p.nodos_dominados / p.total_nodos) * 100) : 0;

        return (
          <div key={u.id} className="dash-info-card" style={{ borderColor: "#c4b5fd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="node" size={18} style={{ color: "var(--accent)" }} /> {u.titulo}
              </h3>
              {estadoDiag === "completado" && (
                <span style={{
                  fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.6rem",
                  borderRadius: 999, background: "#ede9fe", color: NIVEL_COLOR[p.nivel_diagnostico],
                  whiteSpace: "nowrap",
                }}>
                  {p.nivel_diagnostico}
                </span>
              )}
            </div>
            <p style={{ marginBottom: 4 }}>{u.descripcion}</p>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 10 }}>
              {u.kcs} dominios · 12–{u.kcs * 4} preguntas adaptativas
            </p>

            {estadoDiag !== "completado" && (
              <>
                <p>
                  {estadoDiag === "en_progreso"
                    ? "Tienes una evaluación en progreso. Puedes reanudarla ahora."
                    : "Completa la evaluación diagnóstica para conocer tu nivel de partida en esta unidad."}
                </p>
                <button
                  className="auth-btn"
                  style={{ marginTop: 0 }}
                  onClick={() => navigate(`/diagnostico/${u.id}`)}
                >
                  {estadoDiag === "en_progreso" ? "Continuar evaluación →" : "Iniciar prueba diagnóstica →"}
                </button>
              </>
            )}

            {estadoDiag === "completado" && rutaCompleta && (
              <>
                <p style={{ color: "#065f46", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="checkCircle" size={18} /> Ruta de aprendizaje completada
                </p>
                <button className="btn-ghost" onClick={() => navigate(`/diagnostico/${u.id}`)}>
                  Ver resultado del diagnóstico →
                </button>
              </>
            )}

            {estadoDiag === "completado" && p && !rutaCompleta && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#6b7280", marginBottom: 4 }}>
                    <span>Progreso en la ruta</span>
                    <span>{p.nodos_dominados}/{p.total_nodos} nodos · {pct}%</span>
                  </div>
                  <div style={{ background: "#e5e7eb", borderRadius: 999, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, background: "#10b981", height: "100%", borderRadius: 999, transition: "width 0.4s" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    style={{
                      marginTop: 0, padding: "0.6rem 1rem",
                      background: "#ede9fe", color: "#6366f1", border: "none",
                      borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: "0.9rem",
                    }}
                    onClick={() => navigate("/ruta")}
                  >
                    Continuar ruta →
                  </button>
                  <button className="btn-ghost" onClick={() => navigate(`/diagnostico/${u.id}`)}>
                    Ver resultado del diagnóstico →
                  </button>
                </div>
              </>
            )}

            <button
              className="btn-ghost"
              style={{ marginTop: 10 }}
              onClick={() => navigate(`/ruta?unidad=${u.id}`)}
            >
              Ir a ruta de aprendizaje →
            </button>
          </div>
        );
      })}

      <div className="dash-info-card">
        <h3>Sobre el tutor</h3>
        <p>
          Este tutor inteligente te guiará en el aprendizaje de lógica y pensamiento
          computacional, adaptando el contenido a tu nivel y ritmo de aprendizaje.
        </p>
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
            <div className="pipe-drop-icon"><Icon name="upload" size={34} style={{ color: "var(--accent)" }} /></div>
            <p className="pipe-drop-text">Arrastra los PDFs aquí o haz clic para seleccionar</p>
            <span className="pipe-drop-hint">Puedes cargar múltiples libros</span>
          </>
        ) : (
          <ul className="pipe-file-list">
            {pdfs.map((f, i) => (
              <li key={i}>
                <span className="pipe-file-icon"><Icon name="file" size={15} /></span>
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
            <span className="pipe-resumen-check"><Icon name="checkCircle" size={16} /></span> Ingesta completada
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

/* ── Info de unidades (usada en Inicio) ──────────────────────── */
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

/* ── Dashboard principal ───────────────────────────────────── */
const MENU = [
  { id: "home",        label: "Inicio",                roles: ["ADMIN","ESTUDIANTE","PROFESOR"] },
  { id: "ruta",        label: "Ruta de aprendizaje",   roles: ["ESTUDIANTE","PROFESOR"] },
  { id: "ingesta",     label: "Ingesta de documentos", roles: ["ADMIN"] },
];

export default function Dashboard() {
  const { user, authHeader } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("home");

  const visibleMenu = MENU.filter((m) => m.roles.includes(user.rol));

  return (
    <div className="dash-root">
      <AppHeader />

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
          {section === "home"    && <HomeSection user={user} authHeader={authHeader} />}
          {section === "ingesta" && <PipelineSection authHeader={authHeader} />}
        </div>
      </div>
    </div>
  );
}
