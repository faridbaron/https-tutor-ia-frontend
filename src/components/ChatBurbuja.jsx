import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import Markdown from "./Markdown";
import "../auth.css";

export default function ChatBurbuja({ nodeId, unidadId }) {
  const { authHeader } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const bottomRef = useRef(null);

  const esUnidad = !!unidadId;
  const endpoint = esUnidad ? "/estudio/chat-unidad" : "/estudio/chat-burbuja";
  const idPayload = esUnidad ? { unidad_id: unidadId } : { node_id: nodeId };
  const titulo = esUnidad ? "Pregunta sobre la unidad" : "Pregunta sobre el tema";
  const textoVacio = esUnidad
    ? "¿Tienes dudas sobre algún tema de esta unidad? Pregúntame."
    : "¿Tienes dudas sobre este tema? Pregúntame.";

  useEffect(() => {
    if (abierto) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  useEffect(() => {
    const ambitoId = esUnidad ? unidadId : nodeId;
    if (!ambitoId) return;
    axios
      .get(`${API}/estudio/chat-historial`, {
        params: { node_id: ambitoId },
        headers: authHeader(),
      })
      .then(({ data }) => setMensajes(data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, unidadId]);

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || escribiendo) return;
    setInput("");

    const historial = mensajes.map((m) => ({ rol: m.rol, contenido: m.contenido }));
    setMensajes((prev) => [...prev, { rol: "user", contenido: texto }]);
    setEscribiendo(true);

    try {
      const { data } = await axios.post(
        `${API}${endpoint}`,
        { ...idPayload, mensaje: texto, historial },
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
            <span>{titulo}</span>
            <button className="chatb-close" onClick={() => setAbierto(false)}>×</button>
          </div>

          {/* Mensajes */}
          <div className="chatb-messages">
            {mensajes.length === 0 && (
              <p className="chatb-empty">{textoVacio}</p>
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
      <button className="chatb-fab" onClick={() => setAbierto((v) => !v)} title={titulo}>
        {abierto ? "×" : "?"}
      </button>
    </>
  );
}
