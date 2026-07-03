import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";

// ── styles ────────────────────────────────────────────────────────────────────

const BURBUJA_STYLE = {
  inicial:     { bg: "#f1f5f9", border: "#e2e8f0", icon: null },
  correcto:    { bg: "#d1fae5", border: "#6ee7b7", icon: "✓" },
  no_entiende: { bg: "#fef9c3", border: "#fde68a", icon: "💡" },
  error_comun: { bg: "#fee2e2", border: "#fca5a5", icon: "⚠️" },
  pregunta:    { bg: "#f1f5f9", border: "#e2e8f0", icon: null },
  prereq:      { bg: "#fff7ed", border: "#fdba74", icon: "🔒" },
};

function BurbujaTutor({ msg }) {
  const esUsuario = msg.rol === "user";
  const estilo = BURBUJA_STYLE[msg.tipo_respuesta] || BURBUJA_STYLE.inicial;

  if (esUsuario) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <div style={{
          maxWidth: "72%", background: "#6366f1", color: "#fff",
          borderRadius: "18px 18px 4px 18px",
          padding: "0.65rem 1rem", fontSize: "0.9rem", lineHeight: 1.5,
        }}>
          {msg.contenido}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
      <div style={{
        maxWidth: "82%",
        background: estilo.bg,
        border: `1px solid ${estilo.border}`,
        borderRadius: "18px 18px 18px 4px",
        padding: "0.65rem 1rem", fontSize: "0.9rem", lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}>
        {estilo.icon && (
          <span style={{ marginRight: 6, fontSize: "1rem" }}>{estilo.icon}</span>
        )}
        {msg.contenido}
      </div>
    </div>
  );
}

function BarraDominio({ p }) {
  const pct = Math.round(p * 100);
  const color = p >= 0.75 ? "#10b981" : p >= 0.4 ? "#f59e0b" : "#6366f1";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>Dominio del tema</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, background: color,
          height: "100%", borderRadius: 999,
          transition: "width 0.6s ease, background 0.3s",
        }} />
      </div>
    </div>
  );
}

function Celebracion({ nombreTema, siguienteId, onSiguiente, onCerrar }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(16,185,129,0.18)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "2.5rem 2rem",
        textAlign: "center", maxWidth: 400, width: "90%",
        boxShadow: "0 24px 60px rgba(0,0,0,.18)",
        animation: "pop 0.35s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>🎉</div>
        <h2 style={{ margin: "0 0 0.4rem", color: "#059669", fontSize: "1.4rem" }}>
          ¡Dominaste este tema!
        </h2>
        <p style={{ color: "#6b7280", margin: "0 0 1.5rem", fontSize: "0.9rem" }}>
          <strong>{nombreTema}</strong> — alcanzaste 75% de dominio.
        </p>
        {siguienteId ? (
          <button
            onClick={onSiguiente}
            style={{
              width: "100%", padding: "0.75rem",
              background: "#6366f1", color: "#fff", border: "none",
              borderRadius: 10, fontWeight: 700, cursor: "pointer",
              fontSize: "1rem", marginBottom: "0.6rem",
            }}
          >
            Siguiente tema →
          </button>
        ) : null}
        <button
          onClick={onCerrar}
          style={{
            width: "100%", padding: "0.65rem",
            background: "#f1f5f9", color: "#374151", border: "none",
            borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
          }}
        >
          Volver a la ruta
        </button>
      </div>
      <style>{`@keyframes pop { from { transform: scale(.7); opacity:0 } to { transform: scale(1); opacity:1 } }`}</style>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Tutor() {
  const { nodeId } = useParams();
  const navigate    = useNavigate();
  const { authHeader } = useAuth();

  // Left column state
  const [contexto,    setContexto]    = useState(null);
  const [chunkVisible, setChunkVisible] = useState(null); // "ejemplo" | "ejercicio"

  // Right column state
  const [mensajes,    setMensajes]    = useState([]);
  const [input,       setInput]       = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [pDominio,    setPDominio]    = useState(0.0);
  const [dominado,    setDominado]    = useState(false);
  const [siguienteId, setSiguienteId] = useState(null);
  const [celebrar,    setCelebrar]    = useState(false);
  const [cargandoInit, setCargandoInit] = useState(true);

  const chatEndRef = useRef(null);
  const auth = authHeader();

  // Scroll to bottom on new message
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes, escribiendo]);

  // Load context + session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ctxRes, sesRes] = await Promise.all([
          axios.get(`${API}/tutor/contexto/${nodeId}`, { headers: auth }),
          axios.get(`${API}/tutor/sesion/${nodeId}`,   { headers: auth }),
        ]);
        if (cancelled) return;
        setContexto(ctxRes.data);
        const sesion = sesRes.data;
        setPDominio(sesion.p_dominio || 0);
        setDominado(sesion.dominado  || false);

        if (sesion.historial && sesion.historial.length > 0) {
          // Resume existing session
          setMensajes(sesion.historial.map((m, i) => ({ id: i, ...m })));
        } else {
          // First time: request intro message
          await sendChat("", [], false);
        }
      } catch (e) {
        console.error("Error iniciando tutor:", e);
      } finally {
        if (!cancelled) setCargandoInit(false);
      }
    })();
    return () => { cancelled = true; };
  }, [nodeId]);

  const sendChat = async (texto, historialActual, addUserMsg = true) => {
    const historialParaEnviar = historialActual ?? mensajes.map(m => ({ rol: m.rol, contenido: m.contenido }));

    if (addUserMsg && texto.trim()) {
      setMensajes(prev => [...prev, { id: Date.now(), rol: "user", contenido: texto, tipo_respuesta: null }]);
    }
    setEscribiendo(true);
    try {
      const { data } = await axios.post(
        `${API}/tutor/chat`,
        { node_id: nodeId, mensaje: texto, historial: historialParaEnviar },
        { headers: auth },
      );
      setMensajes(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          rol: "assistant",
          contenido: data.respuesta,
          tipo_respuesta: data.tipo_respuesta,
        },
      ]);
      setPDominio(data.p_dominio);
      if (data.p_dominio >= 0.75 && !dominado) {
        setDominado(true);
        setSiguienteId(data.node_id_siguiente);
        setCelebrar(true);
      }
    } catch (e) {
      console.error("Error en chat:", e);
      setMensajes(prev => [
        ...prev,
        { id: Date.now() + 1, rol: "assistant", contenido: "Error de conexión. Intenta de nuevo.", tipo_respuesta: "inicial" },
      ]);
    } finally {
      setEscribiendo(false);
    }
  };

  const handleEnviar = async () => {
    const texto = input.trim();
    if (!texto || escribiendo) return;
    setInput("");
    const historialActual = mensajes.map(m => ({ rol: m.rol, contenido: m.contenido }));
    await sendChat(texto, historialActual, true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); }
  };

  const chunkDef     = contexto?.chunks?.find(c => c.tipo === "definicion");
  const chunkEjemplo = contexto?.chunks?.find(c => c.tipo === "ejemplo_resuelto");
  const chunkEjercicio = contexto?.chunks?.find(c => c.tipo === "enunciado");

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <button
          onClick={() => navigate("/ruta")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "#6366f1" }}
        >←</button>
        <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>
          {contexto?.nombre || nodeId}
        </span>
        {dominado && (
          <span style={{
            background: "#d1fae5", color: "#059669",
            fontSize: "0.75rem", fontWeight: 700,
            padding: "0.2rem 0.65rem", borderRadius: 999,
          }}>
            ✓ Dominado
          </span>
        )}
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", maxWidth: 1200, margin: "0 auto", width: "100%", padding: "1.25rem 1rem", gap: "1.25rem" }}>

        {/* ── Left column (30%) ── */}
        <div style={{ width: "30%", minWidth: 240, display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Dominio */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
            <BarraDominio p={pDominio} />
          </div>

          {/* Definición */}
          {chunkDef && (
            <div style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Definición
              </div>
              <p style={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.6, margin: 0 }}>
                {chunkDef.contenido}
              </p>
            </div>
          )}

          {/* Botones ejemplo / ejercicio */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {chunkEjemplo && (
              <button
                onClick={() => setChunkVisible(chunkVisible === "ejemplo" ? null : "ejemplo")}
                style={{
                  background: chunkVisible === "ejemplo" ? "#ede9fe" : "#fff",
                  border: "1px solid #c4b5fd", borderRadius: 10,
                  padding: "0.6rem 1rem", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.87rem", color: "#7c3aed",
                  textAlign: "left",
                }}
              >
                {chunkVisible === "ejemplo" ? "▼" : "▶"} Ver ejemplo
              </button>
            )}
            {chunkVisible === "ejemplo" && chunkEjemplo && (
              <div style={{
                background: "#1e293b", color: "#e2e8f0", borderRadius: 10,
                padding: "0.75rem 1rem", fontSize: "0.82rem",
                fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.6,
              }}>
                {chunkEjemplo.contenido}
              </div>
            )}

            {chunkEjercicio && (
              <button
                onClick={() => setChunkVisible(chunkVisible === "ejercicio" ? null : "ejercicio")}
                style={{
                  background: chunkVisible === "ejercicio" ? "#fef9c3" : "#fff",
                  border: "1px solid #fde68a", borderRadius: 10,
                  padding: "0.6rem 1rem", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.87rem", color: "#92400e",
                  textAlign: "left",
                }}
              >
                {chunkVisible === "ejercicio" ? "▼" : "▶"} Ver ejercicio
              </button>
            )}
            {chunkVisible === "ejercicio" && chunkEjercicio && (
              <div style={{
                background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a",
                padding: "0.75rem 1rem", fontSize: "0.87rem", lineHeight: 1.6,
              }}>
                {chunkEjercicio.contenido}
              </div>
            )}
          </div>

          {/* Volver */}
          <button
            onClick={() => navigate("/ruta")}
            style={{
              marginTop: "auto", padding: "0.65rem",
              background: "none", border: "1px solid #e2e8f0", borderRadius: 10,
              color: "#6b7280", cursor: "pointer", fontWeight: 600, fontSize: "0.87rem",
            }}
          >
            ← Volver a la ruta
          </button>
        </div>

        {/* ── Right column (70%) ── */}
        <div style={{
          flex: 1, background: "#fff", borderRadius: 14,
          boxShadow: "0 1px 6px rgba(0,0,0,.08)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.25rem 0.5rem" }}>
            {cargandoInit ? (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: "3rem" }}>
                Cargando tutor...
              </div>
            ) : (
              mensajes.map(msg => <BurbujaTutor key={msg.id} msg={msg} />)
            )}
            {escribiendo && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <div style={{
                  background: "#f1f5f9", border: "1px solid #e2e8f0",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "0.65rem 1rem", fontSize: "0.88rem", color: "#9ca3af",
                  fontStyle: "italic",
                }}>
                  El tutor está escribiendo...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{
            borderTop: "1px solid #e2e8f0",
            padding: "0.85rem 1.25rem",
            display: "flex", gap: "0.6rem", alignItems: "flex-end",
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu respuesta o pregunta..."
              rows={2}
              style={{
                flex: 1, resize: "none", border: "1.5px solid #e2e8f0",
                borderRadius: 10, padding: "0.6rem 0.85rem",
                fontSize: "0.9rem", outline: "none", fontFamily: "inherit",
                lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
            <button
              onClick={handleEnviar}
              disabled={!input.trim() || escribiendo}
              style={{
                background: (!input.trim() || escribiendo) ? "#e5e7eb" : "#6366f1",
                color: (!input.trim() || escribiendo) ? "#9ca3af" : "#fff",
                border: "none", borderRadius: 10,
                padding: "0.65rem 1.25rem",
                fontWeight: 700, cursor: (!input.trim() || escribiendo) ? "not-allowed" : "pointer",
                fontSize: "0.9rem", whiteSpace: "nowrap",
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Celebración */}
      {celebrar && (
        <Celebracion
          nombreTema={contexto?.nombre || nodeId}
          siguienteId={siguienteId}
          onSiguiente={() => { setCelebrar(false); navigate(`/tutor/${siguienteId}`); }}
          onCerrar={() => { setCelebrar(false); navigate("/ruta"); }}
        />
      )}
    </div>
  );
}
