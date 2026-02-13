import { getHelpEntry, type HelpEntry } from "@/content/help";

/**
 * Look up a help entry by key.
 *
 * Returns the entry or `undefined` if no content is registered for that key.
 * This is a thin wrapper—no React state required since help content is static.
 */
export function useHelp(key: string): HelpEntry | undefined {
  return getHelpEntry(key);
}

/**
 * Look up multiple help entries at once.
 *
 * Returns a record keyed by the input keys. Missing entries are omitted.
 */
export function useHelpEntries(keys: string[]): Record<string, HelpEntry> {
  const result: Record<string, HelpEntry> = {};
  for (const key of keys) {
    const entry = getHelpEntry(key);
    if (entry) {
      result[key] = entry;
    }
  }
  return result;
}
