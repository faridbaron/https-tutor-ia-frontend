import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../auth.css";

const COMPONENTS = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">{children}</a>
  ),
  // Envuelve las tablas para que puedan desplazarse horizontalmente sin
  // desbordar el panel (p. ej. tablas de verdad con muchas columnas).
  table: ({ children }) => (
    <div className="md-table-wrap"><table>{children}</table></div>
  ),
};

export default function Markdown({ children, className = "", style }) {
  if (!children) return null;
  return (
    <div className={`md-content ${className}`} style={style}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>{children}</ReactMarkdown>
    </div>
  );
}
