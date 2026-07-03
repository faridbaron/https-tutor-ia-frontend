import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import ChatBurbuja from "../components/ChatBurbuja";

const PASOS = ["Definición", "Ejemplo", "Ejercicio", "Quiz"];

export default function TemaEstudio() {
  const { nodeId } = useParams();
  const { authHeader } = useAuth();
  const navigate = useNavigate();

  const [contenido, setContenido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [paso, setPaso] = useState(0);

  // Ejercicio
  const [respuestaEjercicio, setRespuestaEjercicio] = useState("");
  const [feedbackEjercicio, setFeedbackEjercicio] = useState(null);
  const [evaluandoEjercicio, setEvaluandoEjercicio] = useState(false);

  // Quiz
  const [preguntaQuiz, setPreguntaQuiz] = useState(null);
  const [generandoQuiz, setGenerandoQuiz] = useState(false);
  const [respuestaQuiz, setRespuestaQuiz] = useState("");
  const [feedbackQuiz, setFeedbackQuiz] = useState(null);
  const [evaluandoQuiz, setEvaluandoQuiz] = useState(false);
  const [aprobado, setAprobado] = useState(false);
  const [nodeSiguiente, setNodeSiguiente] = useState(null);

  useEffect(() => {
    cargarContenido();
  }, [nodeId]);

  const cargarContenido = async () => {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API}/estudio/contenido/${nodeId}`, { headers: authHeader() });
      setContenido(data);
      if (data.dominado) setPaso(0); // siempre arranca en definición aunque ya lo haya dominado
    } catch (e) {
      console.error("Error cargando contenido:", e);
    } finally {
      setCargando(false);
    }
  };

  const irAlPaso = async (nuevoPaso) => {
    if (nuevoPaso === 3 && !preguntaQuiz && !generandoQuiz) {
      await generarQuiz();
    }
    setPaso(nuevoPaso);
  };

  const evaluarEjercicio = async () => {
    if (!respuestaEjercicio.trim()) return;
    setEvaluandoEjercicio(true);
    setFeedbackEjercicio(null);
    try {
      const { data } = await axios.post(
        `${API}/estudio/evaluar-ejercicio`,
        {
          node_id: nodeId,
          enunciado: contenido.enunciado?.contenido || "",
          respuesta_estudiante: respuestaEjercicio,
        },
        { headers: authHeader() }
      );
      setFeedbackEjercicio(data);
    } catch (e) {
      console.error("Error evaluando ejercicio:", e);
    } finally {
      setEvaluandoEjercicio(false);
    }
  };

  const generarQuiz = async () => {
    setGenerandoQuiz(true);
    try {
      const { data } = await axios.post(
        `${API}/estudio/generar-quiz`,
        { node_id: nodeId },
        { headers: authHeader() }
      );
      setPreguntaQuiz(data.pregunta);
    } catch (e) {
      console.error("Error generando quiz:", e);
    } finally {
      setGenerandoQuiz(false);
    }
  };

  const evaluarQuiz = async () => {
    if (!respuestaQuiz.trim()) return;
    setEvaluandoQuiz(true);
    setFeedbackQuiz(null);
    try {
      const { data } = await axios.post(
        `${API}/estudio/evaluar-quiz`,
        { node_id: nodeId, pregunta: preguntaQuiz, respuesta_estudiante: respuestaQuiz },
        { headers: authHeader() }
      );
      setFeedbackQuiz(data.feedback);
      setAprobado(data.aprobado);
      setNodeSiguiente(data.node_id_siguiente);
    } catch (e) {
      console.error("Error evaluando quiz:", e);
    } finally {
      setEvaluandoQuiz(false);
    }
  };

  const reintentar = () => {
    setRespuestaQuiz("");
    setFeedbackQuiz(null);
    setAprobado(false);
    setPreguntaQuiz(null);
    generarQuiz();
  };

  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <p style={{ color: "#9ca3af" }}>Cargando tema...</p>
      </div>
    );
  }

  if (!contenido) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <p style={{ color: "#ef4444" }}>No se pudo cargar el tema.</p>
      </div>
    );
  }

  const enQuiz = paso === 3;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "1rem",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <button
          onClick={() => navigate("/ruta")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: "#6366f1", padding: 4 }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
            {contenido.nombre}
          </h1>
          {contenido.dominado && (
            <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>✓ Dominado</span>
          )}
        </div>
      </header>

      {/* Barra de pasos */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "0.75rem 2rem" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: "0.5rem" }}>
          {PASOS.map((nombre, i) => {
            const activo = paso === i;
            const completado = paso > i;
            return (
              <button
                key={i}
                onClick={() => i < paso || i === paso + 1 ? irAlPaso(i) : null}
                style={{
                  flex: 1, padding: "0.4rem 0", borderRadius: 8, border: "none",
                  fontSize: "0.8rem", fontWeight: 600, cursor: i <= paso + 1 ? "pointer" : "default",
                  background: activo ? "#6366f1" : completado ? "#d1fae5" : "#f1f5f9",
                  color: activo ? "#fff" : completado ? "#059669" : "#9ca3af",
                  transition: "all 0.15s",
                }}
              >
                {completado && !activo ? "✓ " : `${i + 1}. `}{nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, maxWidth: 680, margin: "2rem auto", padding: "0 1rem", width: "100%" }}>

        {/* PASO 0: Definición */}
        {paso === 0 && (
          <div>
            <Tarjeta titulo="Definición" color="#6366f1">
              {contenido.definicion
                ? <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{contenido.definicion.contenido}</p>
                : <p style={{ color: "#9ca3af" }}>No hay definición disponible para este tema.</p>
              }
            </Tarjeta>
            <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
              <BotonSiguiente onClick={() => irAlPaso(1)} label="Ver ejemplo →" />
            </div>
          </div>
        )}

        {/* PASO 1: Ejemplo */}
        {paso === 1 && (
          <div>
            <Tarjeta titulo="Ejemplo resuelto" color="#8b5cf6">
              {contenido.ejemplo
                ? <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{contenido.ejemplo.contenido}</p>
                : <p style={{ color: "#9ca3af" }}>No hay ejemplo disponible para este tema.</p>
              }
            </Tarjeta>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
              <BotonSecundario onClick={() => setPaso(0)} label="← Volver" />
              <BotonSiguiente onClick={() => irAlPaso(2)} label="Ir al ejercicio →" />
            </div>
          </div>
        )}

        {/* PASO 2: Ejercicio */}
        {paso === 2 && (
          <div>
            <Tarjeta titulo="Ejercicio" color="#f59e0b">
              {contenido.enunciado
                ? <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{contenido.enunciado.contenido}</p>
                : <p style={{ color: "#9ca3af" }}>No hay ejercicio disponible para este tema.</p>
              }
            </Tarjeta>

            <div style={{ marginTop: "1.25rem" }}>
              <label style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                Tu respuesta
              </label>
              <textarea
                value={respuestaEjercicio}
                onChange={(e) => setRespuestaEjercicio(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={5}
                style={{
                  width: "100%", borderRadius: 10, border: "1.5px solid #e2e8f0",
                  padding: "0.75rem", fontSize: "0.9rem", resize: "vertical",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
                <button
                  onClick={evaluarEjercicio}
                  disabled={!respuestaEjercicio.trim() || evaluandoEjercicio}
                  style={{
                    background: "#f59e0b", color: "#fff", border: "none",
                    borderRadius: 8, padding: "0.55rem 1.25rem",
                    fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                    opacity: !respuestaEjercicio.trim() || evaluandoEjercicio ? 0.5 : 1,
                  }}
                >
                  {evaluandoEjercicio ? "Evaluando..." : "Evaluar respuesta"}
                </button>
              </div>
            </div>

            {feedbackEjercicio && (
              <div style={{
                marginTop: "1rem", padding: "1rem 1.25rem", borderRadius: 10,
                background: feedbackEjercicio.correcto ? "#f0fdf4" : "#fff7ed",
                border: `1px solid ${feedbackEjercicio.correcto ? "#bbf7d0" : "#fed7aa"}`,
              }}>
                <p style={{ margin: 0, lineHeight: 1.6, fontSize: "0.9rem", color: "#374151" }}>
                  {feedbackEjercicio.feedback}
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
              <BotonSecundario onClick={() => setPaso(1)} label="← Volver" />
              <BotonSiguiente onClick={() => irAlPaso(3)} label="Ir al quiz →" />
            </div>
          </div>
        )}

        {/* PASO 3: Quiz */}
        {paso === 3 && (
          <div>
            <Tarjeta titulo="Quiz final" color="#10b981">
              {generandoQuiz ? (
                <p style={{ color: "#9ca3af", textAlign: "center" }}>Generando pregunta...</p>
              ) : preguntaQuiz ? (
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontWeight: 500 }}>{preguntaQuiz}</p>
              ) : (
                <p style={{ color: "#9ca3af" }}>No se pudo generar la pregunta.</p>
              )}
            </Tarjeta>

            {!aprobado && preguntaQuiz && !feedbackQuiz && (
              <div style={{ marginTop: "1.25rem" }}>
                <label style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  Tu respuesta
                </label>
                <textarea
                  value={respuestaQuiz}
                  onChange={(e) => setRespuestaQuiz(e.target.value)}
                  placeholder="Responde con tus propias palabras..."
                  rows={4}
                  style={{
                    width: "100%", borderRadius: 10, border: "1.5px solid #e2e8f0",
                    padding: "0.75rem", fontSize: "0.9rem", resize: "vertical",
                    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
                <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
                  <button
                    onClick={evaluarQuiz}
                    disabled={!respuestaQuiz.trim() || evaluandoQuiz}
                    style={{
                      background: "#10b981", color: "#fff", border: "none",
                      borderRadius: 8, padding: "0.55rem 1.25rem",
                      fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                      opacity: !respuestaQuiz.trim() || evaluandoQuiz ? 0.5 : 1,
                    }}
                  >
                    {evaluandoQuiz ? "Evaluando..." : "Enviar respuesta"}
                  </button>
                </div>
              </div>
            )}

            {feedbackQuiz && (
              <div style={{
                marginTop: "1rem", padding: "1.25rem",
                borderRadius: 12, textAlign: "center",
                background: aprobado ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${aprobado ? "#bbf7d0" : "#fecaca"}`,
              }}>
                <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>{aprobado ? "🎉" : "💪"}</p>
                <p style={{ fontWeight: 700, color: aprobado ? "#059669" : "#dc2626", marginBottom: "0.5rem" }}>
                  {aprobado ? "¡Tema dominado!" : "Casi lo logras"}
                </p>
                <p style={{ color: "#374151", fontSize: "0.9rem", lineHeight: 1.6, margin: "0 0 1rem" }}>
                  {feedbackQuiz}
                </p>
                {aprobado ? (
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() => navigate("/ruta")}
                      style={{
                        background: "#e0e7ff", color: "#4338ca", border: "none",
                        borderRadius: 8, padding: "0.5rem 1.25rem",
                        fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Volver a la ruta
                    </button>
                    {nodeSiguiente && (
                      <button
                        onClick={() => navigate(`/estudio/${nodeSiguiente}`)}
                        style={{
                          background: "#6366f1", color: "#fff", border: "none",
                          borderRadius: 8, padding: "0.5rem 1.25rem",
                          fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Siguiente tema →
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={reintentar}
                    style={{
                      background: "#6366f1", color: "#fff", border: "none",
                      borderRadius: 8, padding: "0.5rem 1.25rem",
                      fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Intentar de nuevo
                  </button>
                )}
              </div>
            )}

            {!feedbackQuiz && (
              <div style={{ marginTop: "1.5rem" }}>
                <BotonSecundario onClick={() => setPaso(2)} label="← Volver al ejercicio" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat burbuja solo en pasos 0-2 */}
      {!enQuiz && <ChatBurbuja nodeId={nodeId} />}
    </div>
  );
}

function Tarjeta({ titulo, color, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      boxShadow: "0 1px 6px rgba(0,0,0,.07)",
      overflow: "hidden",
    }}>
      <div style={{ background: color, padding: "0.65rem 1.25rem" }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{titulo}</span>
      </div>
      <div style={{ padding: "1.25rem 1.5rem", color: "#374151", fontSize: "0.92rem" }}>
        {children}
      </div>
    </div>
  );
}

function BotonSiguiente({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#6366f1", color: "#fff", border: "none",
        borderRadius: 8, padding: "0.55rem 1.4rem",
        fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function BotonSecundario({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#f1f5f9", color: "#374151", border: "none",
        borderRadius: 8, padding: "0.55rem 1.1rem",
        fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
