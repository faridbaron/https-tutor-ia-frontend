import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import AppHeader from "../components/AppHeader";
import ChatBurbuja from "../components/ChatBurbuja";
import Icon from "../components/Icon";
import Markdown from "../components/Markdown";
import "../auth.css";

const PASOS = ["Definición", "Ejemplo", "Ejercicio", "Quiz"];
const PASO_COLOR = ["var(--accent)", "#8B5CF6", "#F59E0B", "var(--accent-2)"];

export default function TemaEstudio() {
  const { nodeId } = useParams();
  const { authHeader } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repaso = searchParams.get("repaso") === "1";

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
      if (repaso) {
        setPaso(3); // repaso rápido: va directo al quiz de autoevaluación
        generarQuiz();
      } else {
        setPaso(0); // siempre arranca en definición
      }
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

  const generarQuiz = async (excluirPregunta = null) => {
    setGenerandoQuiz(true);
    try {
      const { data } = await axios.post(
        `${API}/estudio/generar-quiz`,
        { node_id: nodeId, excluir_pregunta: excluirPregunta },
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
    const preguntaAnterior = preguntaQuiz;
    setRespuestaQuiz("");
    setFeedbackQuiz(null);
    setAprobado(false);
    setPreguntaQuiz(null);
    generarQuiz(preguntaAnterior);
  };

  if (cargando) {
    return (
      <>
        <AppHeader />
        <div className="tema-loading">Cargando tema...</div>
      </>
    );
  }

  if (!contenido) {
    return (
      <>
        <AppHeader />
        <div className="tema-error">No se pudo cargar el tema.</div>
      </>
    );
  }

  const enQuiz = paso === 3;

  return (
    <div className="tema-page">
      <AppHeader />
      {/* Header */}
      <header className="tema-header">
        <button className="tema-back-btn" onClick={() => navigate(`/ruta?unidad=${contenido.unidad_id}`)}>←</button>
        <div style={{ flex: 1 }}>
          <h1 className="tema-titulo">{contenido.nombre}</h1>
          {contenido.dominado && <span className="tema-dominado-tag">✓ Dominado</span>}
        </div>
      </header>

      {/* Barra de pasos */}
      <div className="tema-steps-bar">
        <div className="tema-steps-row">
          {PASOS.map((nombre, i) => {
            const activo = paso === i;
            const completado = paso > i;
            const puedeIr = i <= paso + 1;
            return (
              <button
                key={i}
                onClick={() => (i < paso || i === paso + 1 ? irAlPaso(i) : null)}
                className={`tema-step-btn ${activo ? "active" : completado ? "done" : ""} ${puedeIr ? "clickable" : ""}`}
              >
                {completado && !activo ? "✓ " : `${i + 1}. `}{nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      <div className="tema-content">

        {/* PASO 0: Definición */}
        {paso === 0 && (
          <div>
            <Tarjeta titulo="Definición" color={PASO_COLOR[0]}>
              {contenido.definicion
                ? <Markdown>{contenido.definicion.contenido}</Markdown>
                : <p className="tema-card-empty">No hay definición disponible para este tema.</p>
              }
            </Tarjeta>
            <div className="tema-actions-right">
              <button className="tema-btn-siguiente" onClick={() => irAlPaso(1)}>Ver ejemplo →</button>
            </div>
          </div>
        )}

        {/* PASO 1: Ejemplo */}
        {paso === 1 && (
          <div>
            <Tarjeta titulo="Ejemplo resuelto" color={PASO_COLOR[1]}>
              {contenido.ejemplo
                ? <Markdown>{contenido.ejemplo.contenido}</Markdown>
                : <p className="tema-card-empty">No hay ejemplo disponible para este tema.</p>
              }
            </Tarjeta>
            <div className="tema-actions-row">
              <button className="tema-btn-secundario" onClick={() => setPaso(0)}>← Volver</button>
              <button className="tema-btn-siguiente" onClick={() => irAlPaso(2)}>Ir al ejercicio →</button>
            </div>
          </div>
        )}

        {/* PASO 2: Ejercicio */}
        {paso === 2 && (
          <div>
            <Tarjeta titulo="Ejercicio" color={PASO_COLOR[2]}>
              {contenido.enunciado
                ? <Markdown>{contenido.enunciado.contenido}</Markdown>
                : <p className="tema-card-empty">No hay ejercicio disponible para este tema.</p>
              }
            </Tarjeta>

            <div style={{ marginTop: "1.25rem" }}>
              <label className="tema-label">Tu respuesta</label>
              <textarea
                value={respuestaEjercicio}
                onChange={(e) => setRespuestaEjercicio(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={5}
                className="tema-textarea"
              />
              <div className="tema-actions-right" style={{ marginTop: "0.5rem" }}>
                <button
                  onClick={evaluarEjercicio}
                  disabled={!respuestaEjercicio.trim() || evaluandoEjercicio}
                  className="tema-btn-eval ejercicio"
                >
                  {evaluandoEjercicio ? "Evaluando..." : "Evaluar respuesta"}
                </button>
              </div>
            </div>

            {feedbackEjercicio && (
              <div className={`tema-feedback ${feedbackEjercicio.correcto ? "ok" : "mal"}`}>
                <Markdown>{feedbackEjercicio.feedback}</Markdown>
              </div>
            )}

            <div className="tema-actions-row">
              <button className="tema-btn-secundario" onClick={() => setPaso(1)}>← Volver</button>
              <button className="tema-btn-siguiente" onClick={() => irAlPaso(3)}>Ir al quiz →</button>
            </div>
          </div>
        )}

        {/* PASO 3: Quiz */}
        {paso === 3 && (
          <div>
            <Tarjeta titulo="Quiz final" color={PASO_COLOR[3]}>
              {generandoQuiz ? (
                <p className="tema-card-empty" style={{ textAlign: "center" }}>Generando pregunta...</p>
              ) : preguntaQuiz ? (
                <Markdown style={{ fontWeight: 500 }}>{preguntaQuiz}</Markdown>
              ) : (
                <p className="tema-card-empty">No se pudo generar la pregunta.</p>
              )}
            </Tarjeta>

            {!aprobado && preguntaQuiz && !feedbackQuiz && (
              <div style={{ marginTop: "1.25rem" }}>
                <label className="tema-label">Tu respuesta</label>
                <textarea
                  value={respuestaQuiz}
                  onChange={(e) => setRespuestaQuiz(e.target.value)}
                  placeholder="Responde con tus propias palabras..."
                  rows={4}
                  className="tema-textarea"
                />
                <div className="tema-actions-right" style={{ marginTop: "0.5rem" }}>
                  <button
                    onClick={evaluarQuiz}
                    disabled={!respuestaQuiz.trim() || evaluandoQuiz}
                    className="tema-btn-eval quiz"
                  >
                    {evaluandoQuiz ? "Evaluando..." : "Enviar respuesta"}
                  </button>
                </div>
              </div>
            )}

            {feedbackQuiz && (
              <div className={`tema-resultado ${aprobado ? "aprobado" : "no-aprobado"}`}>
                <div className={`tema-resultado-icon ${aprobado ? "aprobado" : "no-aprobado"}`}>
                  <Icon name={aprobado ? "trophy" : "target"} size={30} />
                </div>
                <p className={`tema-resultado-titulo ${aprobado ? "aprobado" : "no-aprobado"}`}>
                  {aprobado ? "¡Tema dominado!" : "Casi lo logras"}
                </p>
                <Markdown className="tema-resultado-msg">{feedbackQuiz}</Markdown>
                {aprobado ? (
                  <div className="tema-resultado-actions">
                    <button className="tema-btn-ruta" onClick={() => navigate(`/ruta?unidad=${contenido.unidad_id}`)}>Volver a la ruta</button>
                    {nodeSiguiente && (
                      <button className="tema-btn-sig" onClick={() => navigate(`/estudio/${nodeSiguiente}`)}>
                        Siguiente tema →
                      </button>
                    )}
                  </div>
                ) : (
                  <button className="tema-btn-retry" onClick={reintentar}>Intentar de nuevo</button>
                )}
              </div>
            )}

            {!feedbackQuiz && (
              <div style={{ marginTop: "1.5rem" }}>
                <button className="tema-btn-secundario" onClick={() => setPaso(2)}>← Volver al ejercicio</button>
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
    <div className="tema-card">
      <div className="tema-card-head" style={{ background: color }}>
        <span>{titulo}</span>
      </div>
      <div className="tema-card-body">
        {children}
      </div>
    </div>
  );
}
