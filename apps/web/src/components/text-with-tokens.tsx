import { TokenReveal } from "@/components/token-reveal";

interface TextWithTokensProps {
  text: string;
  caseId?: string;
  className?: string;
}

export function TextWithTokens({
  text,
  caseId,
  className,
}: TextWithTokensProps) {
  if (!text) return null;

  // Regex to match tokens: 3 uppercase letters, hyphen, 8 hex digits
  // We use capturing group to include the separator in the split result
  const parts = text.split(/([A-Z]{3}-[0-9A-F]{8})/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(/^[A-Z]{3}-[0-9A-F]{8}$/)) {
          return <TokenReveal key={index} token={part} caseId={caseId} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
