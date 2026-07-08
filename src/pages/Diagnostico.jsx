import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import Icon from "../components/Icon";
import "../auth.css";

const KC_NOMBRES = {
  KC_ALGORITHMIC_THINKING:  "Pensamiento Algorítmico",
  KC_ABSTRACTION:           "Abstracción",
  KC_PATTERN_RECOGNITION:   "Reconocimiento de Patrones",
  KC_PROBLEM_DECOMPOSITION: "Descomposición de Problemas",
  KC_PROPOSITIONAL_LOGIC:   "Lógica Proposicional",
  KC_LOOPS_AND_ITERATION:   "Ciclos e Iteración",
};

const UNIDADES = {
  unidad_1: {
    nombre: "Unidad 1: Algoritmos y Pensamiento Computacional",
    corto:  "Unidad 1",
  },
  unidad_2: {
    nombre: "Unidad 2: Lógica y Estructuras de Control",
    corto:  "Unidad 2",
  },
  unidad_3: {
    nombre: "Unidad 3: Abstracción y Algoritmos Avanzados",
    corto:  "Unidad 3",
  },
};

const NIVEL_COLOR = { BASICO: "#10b981", MEDIO: "#f59e0b", ALTO: "#6366f1" };
const NIVEL_BG    = { BASICO: "#d1fae5", MEDIO: "#fef3c7", ALTO: "#ede9fe" };
const NIVEL_DOT   = { BASICO: "#10b981", MEDIO: "#f59e0b", ALTO: "#ef4444" };

/* ── Pantalla de Inicio ─────────────────────────────────────── */
function PantallaIntro({ onIniciar, cargando, sesionActiva, onReanudar, unidadNombre }) {
  return (
    <div className="diag-page">
      <div className="diag-card">
        <div className="diag-card-header">
          <span className="diag-icon"><Icon name="node" size={38} style={{ color: "var(--accent)" }} /></span>
          <h1 className="diag-title">Evaluación Diagnóstica</h1>
          <p className="diag-subtitle">{unidadNombre}</p>
        </div>

        <div className="diag-intro-lista">
          <div className="diag-intro-item">
            <span className="diag-intro-bullet"><Icon name="list" size={18} /></span>
            <span>Entre 12 y 20 preguntas adaptativas según tu nivel</span>
          </div>
          <div className="diag-intro-item">
            <span className="diag-intro-bullet"><Icon name="target" size={18} /></span>
            <span>El sistema ajusta la dificultad según tus respuestas</span>
          </div>
          <div className="diag-intro-item">
            <span className="diag-intro-bullet"><Icon name="barChart" size={18} /></span>
            <span>Al finalizar sabrás tu nivel en 4 dominios del pensamiento computacional</span>
          </div>
        </div>

        <div className="diag-advertencia" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Icon name="alertTriangle" size={17} style={{ marginTop: 2 }} />
          <span><strong>Una vez iniciada no puedes pausar la evaluación.</strong> Asegúrate de tener tiempo suficiente.</span>
        </div>

        {sesionActiva && (
          <div className="diag-retomar">
            <p>Tienes una evaluación en progreso.</p>
            <button className="auth-btn" onClick={onReanudar}>
              Continuar evaluación anterior
            </button>
          </div>
        )}

        <button
          className="auth-btn diag-btn-iniciar"
          onClick={onIniciar}
          disabled={cargando}
        >
          {cargando ? "Iniciando…" : sesionActiva ? "Nueva evaluación" : "Iniciar evaluación"}
        </button>
      </div>
    </div>
  );
}

/* ── Barra de Progreso de KCs ─────────────────────────────── */
function BarraProgreso({ progreso }) {
  if (!progreso) return null;
  const { kc_actual, kcs_completados, kcs_totales, pregunta_num } = progreso;
  const aprox = kcs_totales * 4;

  return (
    <div className="diag-progreso">
      <div className="diag-progreso-info">
        <span className="diag-progreso-kc">{KC_NOMBRES[kc_actual] || kc_actual}</span>
        <span className="diag-progreso-num">Pregunta {pregunta_num} de aprox. {aprox}</span>
      </div>
      <div className="diag-progreso-segmentos">
        {Array.from({ length: kcs_totales }).map((_, i) => (
          <div
            key={i}
            className={`diag-segmento ${
              i < kcs_completados  ? "diag-segmento-done" :
              i === kcs_completados ? "diag-segmento-active" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Tarjeta de Pregunta ────────────────────────────────────── */
function TarjetaPregunta({ pregunta, progreso, onResponder, cargando }) {
  const [seleccionada, setSeleccionada] = useState(null);
  const [confirmada, setConfirmada]     = useState(false);
  const [resultado, setResultado]       = useState(null);

  const opciones = Array.isArray(pregunta.opciones)
    ? pregunta.opciones
    : Object.entries(pregunta.opciones).map(([k, v]) => `${k}) ${v}`);

  const extraerLetra = (texto) => texto.trim()[0].toUpperCase();

  const confirmar = async () => {
    if (!seleccionada || cargando) return;
    setConfirmada(true);
    const res = await onResponder(pregunta.pregunta_id, seleccionada);
    setResultado(res);
  };

  return (
    <div className="diag-page">
      <BarraProgreso progreso={progreso} />
      <div className="diag-card diag-card-pregunta">
        {/* Nivel e indicador */}
        <div className="diag-nivel-badge">
          <span
            className="diag-nivel-dot"
            style={{ background: NIVEL_DOT[pregunta.nivel] }}
          />
          <span style={{ color: NIVEL_DOT[pregunta.nivel], fontWeight: 600, fontSize: "0.78rem" }}>
            {pregunta.nivel}
          </span>
          <span className="diag-nivel-kc">{KC_NOMBRES[pregunta.dominio] || pregunta.dominio}</span>
        </div>

        {/* Enunciado */}
        <p className="diag-enunciado">{pregunta.enunciado}</p>

        {/* Opciones */}
        <div className="diag-opciones">
          {opciones.map((op, i) => {
            const letra = extraerLetra(op);
            let cls = "diag-opcion";
            if (confirmada && resultado) {
              if (letra === resultado.respuesta_correcta)    cls += " diag-opcion-correcta";
              else if (letra === seleccionada)               cls += " diag-opcion-incorrecta";
            } else if (seleccionada === letra) {
              cls += " diag-opcion-sel";
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => !confirmada && setSeleccionada(letra)}
                disabled={confirmada}
              >
                <span className="diag-opcion-letra">{letra}</span>
                <span className="diag-opcion-texto">{op.replace(/^[A-Da-d][).]?\s*/, "")}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback post-confirmación */}
        {confirmada && resultado && (
          <div className={`diag-feedback ${resultado.correcto ? "diag-feedback-ok" : "diag-feedback-mal"}`}>
            <div className="diag-feedback-titulo" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name={resultado.correcto ? "checkCircle" : "xCircle"} size={18} />
              {resultado.correcto ? "¡Correcto!" : "Incorrecto"}
            </div>
            <p className="diag-feedback-exp">{resultado.explicacion}</p>
            <div className="diag-p-barra-wrap">
              <span className="diag-p-label">Nivel de dominio</span>
              <div className="diag-p-barra">
                <div
                  className="diag-p-fill"
                  style={{
                    width: `${Math.round(resultado.p_dominio_actual * 100)}%`,
                    background: resultado.p_dominio_actual >= 0.75 ? "#10b981" : "#6366f1",
                  }}
                />
              </div>
              <span className="diag-p-valor">{Math.round(resultado.p_dominio_actual * 100)}%</span>
            </div>
            <button
              className="auth-btn diag-btn-sig"
              onClick={() => resultado.onSiguiente()}
              disabled={cargando}
            >
              {cargando ? "Cargando…" : "Siguiente pregunta →"}
            </button>
          </div>
        )}

        {/* Botón confirmar */}
        {!confirmada && (
          <button
            className="auth-btn diag-btn-confirmar"
            onClick={confirmar}
            disabled={!seleccionada || cargando}
          >
            {cargando ? "Verificando…" : "Confirmar respuesta"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Pantalla de Resultado ──────────────────────────────────── */
function PantallaResultado({ resultado, onDashboard }) {
  const nivel = resultado.nivel_global;

  return (
    <div className="diag-page">
      <div className="diag-card">
        <div className="diag-resultado-header" style={{ background: NIVEL_BG[nivel] }}>
          <div className="diag-resultado-icon" style={{ color: NIVEL_COLOR[nivel] }}>
            <Icon name={nivel === "ALTO" ? "trophy" : nivel === "MEDIO" ? "star" : "book"} size={38} />
          </div>
          <h2 className="diag-resultado-titulo">¡Evaluación completada!</h2>
          <div
            className="diag-resultado-nivel"
            style={{ color: NIVEL_COLOR[nivel], background: "#fff" }}
          >
            Nivel {nivel}
          </div>
          <p className="diag-resultado-msg">{resultado.mensaje}</p>
        </div>

        <div className="diag-resultado-meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="list" size={15} /> {resultado.total_preguntas} preguntas respondidas
          </span>
          {resultado.tiempo_minutos && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="clock" size={15} /> {resultado.tiempo_minutos} minutos
            </span>
          )}
        </div>

        <h3 className="diag-resultado-subtitulo">Resultado por dominio</h3>
        <div className="diag-resultado-grid">
          {(resultado.detalle_por_kc || []).map((d) => {
            const esDebil = d.kc === resultado.kc_mas_debil;
            return (
              <div
                key={d.kc}
                className={`diag-kc-card ${esDebil ? "diag-kc-debil" : ""}`}
              >
                {esDebil && <div className="diag-kc-debil-tag">Área de mejora</div>}
                <div className="diag-kc-nombre">{KC_NOMBRES[d.kc] || d.kc}</div>
                <div
                  className="diag-kc-nivel"
                  style={{ color: NIVEL_COLOR[d.nivel_confirmado] }}
                >
                  {d.nivel_confirmado}
                </div>
                <div className="diag-kc-barra-wrap">
                  <div className="diag-kc-barra">
                    <div
                      className="diag-kc-fill"
                      style={{
                        width: `${Math.round(d.p_dominio_final * 100)}%`,
                        background: NIVEL_COLOR[d.nivel_confirmado],
                      }}
                    />
                  </div>
                  <span className="diag-kc-pct">{Math.round(d.p_dominio_final * 100)}%</span>
                </div>
                <div className="diag-kc-stats">
                  {d.correctas}/{d.preguntas_respondidas} correctas
                </div>
              </div>
            );
          })}
        </div>

        <button className="auth-btn diag-btn-dashboard" onClick={onDashboard}>
          Ver mi panel de aprendizaje →
        </button>
      </div>
    </div>
  );
}

/* ── Componente principal ───────────────────────────────────── */
export default function Diagnostico() {
  const { authHeader } = useAuth();
  const navigate = useNavigate();
  const { unidadId: rawId = "unidad_1" } = useParams();
  // normalizar "unidad1" → "unidad_1" por compatibilidad con links viejos
  const unidadId = rawId.includes("_") ? rawId : rawId.replace(/^unidad(\d)$/, "unidad_$1");
  const unidadInfo = UNIDADES[unidadId] || UNIDADES["unidad_1"];

  const [fase, setFase]           = useState("intro");   // "intro" | "pregunta" | "resultado"
  const [sesionId, setSesionId]   = useState(null);
  const [pregunta, setPregunta]   = useState(null);
  const [progreso, setProgreso]   = useState(null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState(null);
  const [sesionActiva, setSesionActiva] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // Al montar: si ya hay un resultado completado para esta unidad, mostrarlo
  // directamente (no se permite repetir la evaluación). Si no, revisar si
  // hay una sesión en progreso para poder reanudarla.
  useEffect(() => {
    axios
      .get(`${API}/diagnostico/resultado-unidad/${unidadId}`, { headers: authHeader() })
      .then(({ data }) => {
        setResultado(data);
        setFase("resultado");
      })
      .catch(() => {
        axios
          .get(`${API}/diagnostico/sesion-activa`, {
            params: { unidad_id: unidadId },
            headers: authHeader(),
          })
          .then(({ data }) => {
            if (data.activa && data.sesion) setSesionActiva(true);
          })
          .catch(() => {});
      })
      .finally(() => setVerificando(false));
  }, [unidadId]);

  const reanudar = async () => {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API}/diagnostico/sesion-activa`, {
        params: { unidad_id: unidadId },
        headers: authHeader(),
      });
      if (data.activa && data.sesion) {
        setSesionId(data.sesion.sesion_id);
        setPregunta(data.sesion.pregunta);
        setProgreso(data.sesion.progreso);
        setFase("pregunta");
      }
    } catch {
      setError("No se pudo reanudar la sesión.");
    } finally {
      setCargando(false);
    }
  };

  const iniciar = async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await axios.post(
        `${API}/diagnostico/iniciar`,
        { unidad_id: unidadId },
        { headers: authHeader() },
      );
      setSesionId(data.sesion_id);
      setPregunta(data.pregunta);
      setProgreso(data.progreso);
      setFase("pregunta");
    } catch (e) {
      setError(e.response?.data?.detail || "Error al iniciar la evaluación.");
    } finally {
      setCargando(false);
    }
  };

  const responder = async (pregunta_id, respuesta) => {
    setCargando(true);
    try {
      const { data } = await axios.post(
        `${API}/diagnostico/responder`,
        { sesion_id: sesionId, pregunta_id, respuesta },
        { headers: authHeader() },
      );

      const resConCallback = {
        ...data,
        onSiguiente: async () => {
          if (data.siguiente.tipo === "resultado") {
            await cargarResultado(data.siguiente.sesion_id);
          } else {
            setPregunta(data.siguiente.pregunta);
            setProgreso(data.siguiente.progreso);
          }
        },
      };

      return resConCallback;
    } catch (e) {
      setError(e.response?.data?.detail || "Error al procesar la respuesta.");
      return null;
    } finally {
      setCargando(false);
    }
  };

  const cargarResultado = async (sid) => {
    setCargando(true);
    try {
      const { data } = await axios.get(
        `${API}/diagnostico/resultado/${sid}`,
        { headers: authHeader() },
      );
      setResultado(data);
      setFase("resultado");
    } catch {
      setError("Error al cargar el resultado.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {error && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 99 }}>
          <div className="auth-error">{error}</div>
        </div>
      )}

      {verificando && fase === "intro" && (
        <div className="diag-page">
          <div className="diag-card"><p>Cargando…</p></div>
        </div>
      )}

      {!verificando && fase === "intro" && (
        <PantallaIntro
          onIniciar={iniciar}
          cargando={cargando}
          sesionActiva={sesionActiva}
          onReanudar={reanudar}
          unidadNombre={unidadInfo.nombre}
        />
      )}

      {fase === "pregunta" && pregunta && (
        <TarjetaPregunta
          key={pregunta.pregunta_id}
          pregunta={pregunta}
          progreso={progreso}
          onResponder={responder}
          cargando={cargando}
        />
      )}

      {fase === "resultado" && resultado && (
        <PantallaResultado
          resultado={resultado}
          onDashboard={() => navigate("/dashboard")}
        />
      )}
    </>
  );
}
