import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";

export default function ChatBurbuja({ nodeId }) {
  const { authHeader } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (abierto) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || escribiendo) return;
    setInput("");

    const historial = mensajes.map((m) => ({ rol: m.rol, contenido: m.contenido }));
    setMensajes((prev) => [...prev, { rol: "user", contenido: texto }]);
    setEscribiendo(true);

    try {
      const { data } = await axios.post(
        `${API}/estudio/chat-burbuja`,
        { node_id: nodeId, mensaje: texto, historial },
        { headers: authHeader() }
      );
      setMensajes((prev) => [...prev, { rol: "assistant", contenido: data.respuesta }]);
    } catch {
      setMensajes((prev) => [...prev, { rol: "assistant", contenido: "Error de conexión. Intenta de nuevo." }]);
    } finally {
      setEscribiendo(false);
    }
  };

  return (
    <>
      {/* Panel de chat */}
      {abierto && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, width: 340, maxHeight: 460,
          background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,.18)",
          display: "flex", flexDirection: "column", zIndex: 1000,
          border: "1px solid #e2e8f0",
        }}>
          {/* Header */}
          <div style={{
            background: "#6366f1", borderRadius: "16px 16px 0 0",
            padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
              Pregunta sobre el tema
            </span>
            <button
              onClick={() => setAbierto(false)}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {mensajes.length === 0 && (
              <p style={{ color: "#9ca3af", fontSize: "0.83rem", textAlign: "center", margin: "auto" }}>
                ¿Tienes dudas sobre este tema? Pregúntame.
              </p>
            )}
            {mensajes.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.rol === "user" ? "flex-end" : "flex-start",
                  background: m.rol === "user" ? "#6366f1" : "#f1f5f9",
                  color: m.rol === "user" ? "#fff" : "#1e293b",
                  borderRadius: m.rol === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.85rem",
                  maxWidth: "85%",
                  lineHeight: 1.5,
                }}
              >
                {m.contenido}
              </div>
            ))}
            {escribiendo && (
              <div style={{
                alignSelf: "flex-start", background: "#f1f5f9",
                borderRadius: "12px 12px 12px 4px", padding: "0.5rem 0.75rem",
                fontSize: "0.85rem", color: "#9ca3af",
              }}>
                Escribiendo...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "0.6rem", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.4rem" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              placeholder="Escribe tu pregunta..."
              style={{
                flex: 1, border: "1px solid #e2e8f0", borderRadius: 8,
                padding: "0.45rem 0.65rem", fontSize: "0.85rem", outline: "none",
              }}
            />
            <button
              onClick={enviar}
              disabled={!input.trim() || escribiendo}
              style={{
                background: "#6366f1", color: "#fff", border: "none",
                borderRadius: 8, padding: "0.45rem 0.75rem",
                fontSize: "0.85rem", cursor: "pointer",
                opacity: !input.trim() || escribiendo ? 0.5 : 1,
              }}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setAbierto((v) => !v)}
        title="Preguntar sobre el tema"
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: "50%",
          background: "#6366f1", color: "#fff", border: "none",
          fontSize: "1.4rem", cursor: "pointer", zIndex: 1000,
          boxShadow: "0 4px 16px rgba(99,102,241,.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {abierto ? "×" : "?"}
      </button>
    </>
  );
}
