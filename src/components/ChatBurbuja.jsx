import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import Markdown from "./Markdown";
import "../auth.css";

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
        <div className="chatb-panel">
          {/* Header */}
          <div className="chatb-header">
            <span>Pregunta sobre el tema</span>
            <button className="chatb-close" onClick={() => setAbierto(false)}>×</button>
          </div>

          {/* Mensajes */}
          <div className="chatb-messages">
            {mensajes.length === 0 && (
              <p className="chatb-empty">¿Tienes dudas sobre este tema? Pregúntame.</p>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={`chatb-bubble ${m.rol === "user" ? "user" : "assistant"}`}>
                {m.rol === "user" ? m.contenido : <Markdown>{m.contenido}</Markdown>}
              </div>
            ))}
            {escribiendo && <div className="chatb-typing">Escribiendo...</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chatb-inputrow">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              placeholder="Escribe tu pregunta..."
              className="chatb-input"
            />
            <button className="chatb-send" onClick={enviar} disabled={!input.trim() || escribiendo}>
              →
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button className="chatb-fab" onClick={() => setAbierto((v) => !v)} title="Preguntar sobre el tema">
        {abierto ? "×" : "?"}
      </button>
    </>
  );
}
