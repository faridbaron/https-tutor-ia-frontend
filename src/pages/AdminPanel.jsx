import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import "../App.css";

export default function AdminPanel() {
  const { user, logout, authHeader } = useAuth();
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState([]);
  const [uploaded, setUploaded] = useState(false);
  const [running, setRunning] = useState(false);
  const [limpiar, setLimpiar] = useState(false);
  const [logs, setLogs] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const logRef = useRef(null);

  const appendLog = (msg) => {
    setLogs((prev) => {
      const next = [...prev, msg];
      setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50);
      return next;
    });
  };

  const handleFiles = (files) => {
    const pdfFiles = Array.from(files).filter((f) => f.name.endsWith(".pdf"));
    if (pdfFiles.length === 0) return;
    setPdfs(pdfFiles);
    setUploaded(false);
    setLogs([]);
    setResumen(null);
    setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const uploadPdfs = async () => {
    const form = new FormData();
    pdfs.forEach((f) => form.append("files", f));
    try {
      await axios.post(`${API}/upload-pdfs`, form, { headers: authHeader() });
      setUploaded(true);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al subir los archivos.");
    }
  };

  const runGrafo = async () => {
    setLogs([]);
    setResumen(null);
    setError(null);
    setRunning(true);

    try {
      await axios.post(`${API}/run-grafo`, {}, { headers: authHeader() });
    } catch (e) {
      setError(e.response?.data?.detail || "Error al iniciar la migración del grafo.");
      setRunning(false);
      return;
    }

    const es = new EventSource(`${API}/logs`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "ping") return;
      if (data.type === "done") { es.close(); setRunning(false); return; }
      if (data.type === "error") { setError(data.message); es.close(); setRunning(false); return; }
      if (data.type === "log") appendLog(data.message);
    };
    es.onerror = () => { es.close(); setRunning(false); };
  };

  const runPipeline = async () => {
    setLogs([]);
    setResumen(null);
    setError(null);
    setRunning(true);

    try {
      await axios.post(`${API}/run?limpiar=${limpiar}`, {}, { headers: authHeader() });
    } catch (e) {
      setError(e.response?.data?.detail || "Error al iniciar el pipeline.");
      setRunning(false);
      return;
    }

    const es = new EventSource(`${API}/logs`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "ping") return;
      if (data.type === "done") { es.close(); setRunning(false); return; }
      if (data.type === "resumen") { setResumen(data); return; }
      if (data.type === "error") {
        setError(data.message);
        es.close();
        setRunning(false);
        return;
      }
      if (data.type === "log") appendLog(data.message);
    };

    es.onerror = () => { es.close(); setRunning(false); };
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="container">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Panel de Administración</h1>
          <p className="subtitle">Pipeline de ingesta · {user?.nombre}</p>
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            className="btn"
            style={{ background: "#1e293b", color: "#94a3b8", fontSize: "0.82rem" }}
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
          <button
            className="btn"
            style={{ background: "#1e293b", color: "#94a3b8", fontSize: "0.82rem" }}
            onClick={handleLogout}
          >
            Salir
          </button>
        </div>
      </header>

      <div
        className={`dropzone ${dragging ? "dragging" : ""} ${pdfs.length > 0 ? "has-files" : ""}`}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => document.getElementById("file-input").click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {pdfs.length === 0 ? (
          <>
            <div className="drop-icon">📄</div>
            <p>Arrastra los PDFs aquí o haz clic para seleccionar</p>
            <span className="drop-hint">Puedes cargar múltiples libros</span>
          </>
        ) : (
          <ul className="file-list">
            {pdfs.map((f, i) => (
              <li key={i}>
                <span className="file-icon">📖</span>
                <span className="file-name">{f.name}</span>
                <span className="file-size">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="controls" style={{ marginTop: "12px" }}>
        <button
          className="btn"
          style={{ background: "#1e3a5f", color: "#7dd3fc", border: "1px solid #2563eb" }}
          onClick={runGrafo}
          disabled={running}
        >
          {running ? "Procesando..." : "Regenerar grafo de temas"}
        </button>
        <span style={{ fontSize: "0.78rem", color: "#64748b", alignSelf: "center" }}>
          Migra Neo4j a 228 nodos sin re-procesar PDFs
        </span>
      </div>

      {pdfs.length > 0 && (
        <div className="controls">
          {!uploaded ? (
            <button className="btn btn-primary" onClick={uploadPdfs}>
              Subir archivos
            </button>
          ) : (
            <>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={limpiar}
                  onChange={(e) => setLimpiar(e.target.checked)}
                />
                Limpiar Neo4j y Pinecone antes de iniciar
              </label>
              <button className="btn btn-run" onClick={runPipeline} disabled={running}>
                {running ? "Procesando..." : "Ejecutar pipeline"}
              </button>
            </>
          )}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {logs.length > 0 && (
        <div className="log-section">
          <div className="log-header">
            <span>Logs</span>
            {running && <span className="badge running">En ejecución</span>}
          </div>
          <div className="log-terminal" ref={logRef}>
            {logs.map((line, i) => (
              <div
                key={i}
                className={`log-line ${
                  line.includes("ERROR") ? "log-error" :
                  line.includes("===") ? "log-highlight" : ""
                }`}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {resumen && (
        <div className="resumen">
          <h3>Ingesta completada</h3>
          <div className="resumen-grid">
            {resumen.libros.map((l, i) => (
              <div key={i} className="resumen-card">
                <span className="resumen-label">{l.fuente}</span>
                <span className="resumen-value">{l.chunks} chunks</span>
              </div>
            ))}
            <div className="resumen-card total">
              <span className="resumen-label">Total</span>
              <span className="resumen-value">{resumen.total} chunks</span>
            </div>
            <div className="resumen-card costo">
              <span className="resumen-label">Costo estimado</span>
              <span className="resumen-value">${resumen.costo?.costo_estimado_usd} USD</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
