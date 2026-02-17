import { TokenReveal } from "@/components/token-reveal";

interface PreWithTokensProps {
  text: string;
  caseId?: string;
  className?: string;
}

/**
 * Like `TextWithTokens` but for preformatted content (JSON, logs).
 *
 * Renders inside a `<span>` with `whitespace-pre-wrap` so it can be
 * placed inside `<pre>` elements while still highlighting PII tokens.
 */
export function PreWithTokens({ text, caseId, className }: PreWithTokensProps) {
  if (!text) return null;

  const parts = text.split(/([A-Z]{3}-[0-9A-F]{8})/g);

  return (
    <span className={`whitespace-pre-wrap ${className ?? ""}`}>
      {parts.map((part, index) => {
        if (part.match(/^[A-Z]{3}-[0-9A-F]{8}$/)) {
          return <TokenReveal key={index} token={part} caseId={caseId} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
