import ReactMarkdown from "react-markdown";
import "../auth.css";

const COMPONENTS = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">{children}</a>
  ),
};

export default function Markdown({ children, className = "", style }) {
  if (!children) return null;
  return (
    <div className={`md-content ${className}`} style={style}>
      <ReactMarkdown components={COMPONENTS}>{children}</ReactMarkdown>
    </div>
  );
}
