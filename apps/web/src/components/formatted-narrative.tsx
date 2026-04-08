"use client";

import { TokenReveal } from "@/components/token-reveal";

interface FormattedNarrativeProps {
  text: string;
  caseId?: string;
  className?: string;
}

/** Render a text fragment, replacing token patterns with TokenReveal chips. */
function TokenizedText({ text, caseId }: { text: string; caseId?: string }) {
  const parts = text.split(/([A-Z]{3}-[0-9A-F]{8})/g);
  return (
    <>
      {parts.map((part, i) =>
        part.match(/^[A-Z]{3}-[0-9A-F]{8}$/) ? (
          <TokenReveal key={i} token={part} caseId={caseId} />
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * Detect whether a block of text looks like structured key-value data.
 * Matches patterns like "Bank Name: PNC Bank. Account No: 123."
 * Returns parsed pairs if ≥2 are found, otherwise null.
 */
function parseKeyValuePairs(
  text: string,
): { key: string; value: string }[] | null {
  // Split on ". " followed by a Key: pattern, or on line breaks
  // Match "Key: Value" where key is 1-4 title-cased words
  const kvRegex =
    /(?:^|(?<=\.\s))([A-Z][A-Za-z /&()-]*?):\s*([^:]+?)(?=\.\s+[A-Z][A-Za-z /&()-]*?:|$)/g;

  const pairs: { key: string; value: string }[] = [];
  let match;
  while ((match = kvRegex.exec(text)) !== null) {
    const key = match[1]!.trim();
    const value = match[2]!.trim().replace(/\.$/, "");
    if (key && value && key.length < 40) {
      pairs.push({ key, value });
    }
  }

  return pairs.length >= 2 ? pairs : null;
}

/** Format a single line or block of text. */
function FormattedBlock({ text, caseId }: { text: string; caseId?: string }) {
  // Try to detect key-value pair structure
  const kvPairs = parseKeyValuePairs(text);
  if (kvPairs) {
    return (
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {kvPairs.map((pair, i) => (
          <div key={i} className="contents">
            <dt className="text-slate-500 font-medium whitespace-nowrap">
              {pair.key}
            </dt>
            <dd className="text-slate-700 break-all">
              <TokenizedText text={pair.value} caseId={caseId} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <TokenizedText text={text} caseId={caseId} />;
}

/**
 * Block-level formatted narrative for case descriptions and similar long-form text.
 * Handles: line breaks, email-style quoting (>), and structured key-value detection.
 */
export function FormattedNarrative({
  text,
  caseId,
  className,
}: FormattedNarrativeProps) {
  if (!text) return null;

  const lines = text.split(/\r?\n/);

  // Group consecutive quoted lines and consecutive plain lines together
  type Block =
    | { type: "empty" }
    | { type: "quote"; lines: string[] }
    | { type: "text"; lines: string[] };

  const blocks: Block[] = [];

  for (const line of lines) {
    const isEmpty = line.trim() === "";
    const isQuoted = line.startsWith(">");

    if (isEmpty) {
      blocks.push({ type: "empty" });
    } else if (isQuoted) {
      const prev = blocks[blocks.length - 1];
      if (prev && prev.type === "quote") {
        prev.lines.push(line.replace(/^>\s?/, ""));
      } else {
        blocks.push({ type: "quote", lines: [line.replace(/^>\s?/, "")] });
      }
    } else {
      const prev = blocks[blocks.length - 1];
      if (prev && prev.type === "text") {
        prev.lines.push(line);
      } else {
        blocks.push({ type: "text", lines: [line] });
      }
    }
  }

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.type === "empty") {
          return <div key={i} className="h-3" />;
        }

        if (block.type === "quote") {
          return (
            <div
              key={i}
              className="border-l-2 border-slate-300 pl-3 text-slate-400 italic my-1"
            >
              {block.lines.map((line, j) => (
                <div key={j}>
                  <TokenizedText text={line} caseId={caseId} />
                </div>
              ))}
            </div>
          );
        }

        // Plain text block — try structured formatting
        const joined = block.lines.join(" ");
        return (
          <div key={i} className="my-1">
            <FormattedBlock text={joined} caseId={caseId} />
          </div>
        );
      })}
    </div>
  );
}
