function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return [];
}

export type SearchParamPayload = Record<string, unknown>;

export function buildSearchHref(params: SearchParamPayload | null | undefined): string {
  if (!params) {
    return "/search";
  }

  const query =
    typeof params.query === "string"
      ? params.query
      : typeof params.text === "string"
        ? params.text
        : "";

  const sources = toArray(params.sources ?? params.source);
  const taxonomy = toArray(params.taxonomy ?? params.classification);

  const searchParams = new URLSearchParams();
  if (query) {
    searchParams.set("query", query);
  }
  if (sources.length) {
    searchParams.set("sources", sources.join(","));
  }
  if (taxonomy.length) {
    searchParams.set("taxonomy", taxonomy.join(","));
  }

  const qs = searchParams.toString();
  return qs ? `/search?${qs}` : "/search";
}
