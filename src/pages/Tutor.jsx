import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import AppHeader from "../components/AppHeader";
import Icon from "../components/Icon";
import Markdown from "../components/Markdown";
import "../auth.css";

// ── styles ────────────────────────────────────────────────────────────────────

const BURBUJA_STYLE = {
  inicial:     { cls: "inicial",     icon: null },
  correcto:    { cls: "correcto",    icon: "checkCircle" },
  no_entiende: { cls: "no_entiende", icon: "bulb" },
  error_comun: { cls: "error_comun", icon: "alertTriangle" },
  pregunta:    { cls: "pregunta",    icon: null },
  prereq:      { cls: "prereq",      icon: "lock" },
};

function BurbujaTutor({ msg }) {
  const esUsuario = msg.rol === "user";
  const estilo = BURBUJA_STYLE[msg.tipo_respuesta] || BURBUJA_STYLE.inicial;

  if (esUsuario) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <div className="tutor-burbuja user">{msg.contenido}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
      <div className={`tutor-burbuja ${estilo.cls}`}>
        {estilo.icon && <Icon name={estilo.icon} size={15} style={{ marginRight: 6 }} />}
        <Markdown style={{ display: "inline" }}>{msg.contenido}</Markdown>
      </div>
    </div>
  );
}

function Celebracion({ nombreTema, siguienteId, onSiguiente, onCerrar }) {
  return (
    <div className="tutor-celebra-overlay">
      <div className="tutor-celebra-card">
        <div className="tutor-celebra-icon">
          <Icon name="trophy" size={56} />
        </div>
        <h2 className="tutor-celebra-titulo">¡Dominaste este tema!</h2>
        <p className="tutor-celebra-msg">
          <strong>{nombreTema}</strong> — alcanzaste 75% de dominio.
        </p>
        {siguienteId ? (
          <button className="tutor-celebra-btn-sig" onClick={onSiguiente}>Siguiente tema →</button>
        ) : null}
        <button className="tutor-celebra-btn-cerrar" onClick={onCerrar}>Volver a la ruta</button>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Tutor() {
  const { nodeId } = useParams();
  const navigate    = useNavigate();
  const { authHeader } = useAuth();

  const [contexto,    setContexto]    = useState(null);

  // Chat state
  const [mensajes,    setMensajes]    = useState([]);
  const [input,       setInput]       = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
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
        setDominado(sesion.dominado || false);

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
      // Solo el mensaje enviado por el estudiante puede disparar la celebración.
      // El mensaje "inicial" automático (addUserMsg=false) no cuenta: en ese
      // punto `dominado` todavía puede no reflejar el valor recién cargado de
      // la sesión (setDominado es async), lo que causaba una celebración
      // falsa al entrar a un tema que ya estaba dominado.
      if (addUserMsg && data.p_dominio >= 0.75 && !dominado) {
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

  return (
    <div className="tutor-page">
      <AppHeader />
      {/* Header */}
      <header className="tutor-header">
        <button className="tutor-back-btn" onClick={() => navigate("/ruta")}>←</button>
        <span className="tutor-titulo">{contexto?.nombre || nodeId}</span>
        {dominado && <span className="tutor-dominado-badge">✓ Dominado</span>}
      </header>

      {/* Body: chat a pantalla completa */}
      <div className="tutor-body">
        <div className="tutor-col-der">
          {/* Chat messages */}
          <div className="tutor-chat-msgs">
            {cargandoInit ? (
              <div className="tutor-chat-loading">Cargando tutor...</div>
            ) : (
              mensajes.map(msg => <BurbujaTutor key={msg.id} msg={msg} />)
            )}
            {escribiendo && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <div className="tutor-typing">El tutor está escribiendo...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="tutor-inputrow">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu respuesta o pregunta..."
              rows={2}
              className="tutor-textarea"
            />
            <button className="tutor-enviar-btn" onClick={handleEnviar} disabled={!input.trim() || escribiendo}>
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
