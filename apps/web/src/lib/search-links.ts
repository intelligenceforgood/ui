import { isPlainObject, normalizeTimeRange, serializeSearchPayloadParam, toStringArray } from "@/lib/search/filters";

export type SearchParamPayload = Record<string, unknown>;

type BuildSearchHrefOptions = {
  label?: string | null;
};

function extractSearchPayload(params: SearchParamPayload | null | undefined): SearchParamPayload {
  if (params && typeof params === "object") {
    const record = params as Record<string, unknown>;
    if (isPlainObject(record.request)) {
      return record.request;
    }
    return params;
  }
  return {};
}

export function buildSearchHref(
  params: SearchParamPayload | null | undefined,
  options?: BuildSearchHrefOptions
): string {
  const payload = extractSearchPayload(params);

  const query =
    typeof payload.query === "string"
      ? payload.query
      : typeof payload.text === "string"
        ? payload.text
        : "";

  const sources = toStringArray(payload.sources ?? payload.source);
  const taxonomy = toStringArray(payload.taxonomy ?? payload.classification);
  const indicatorTypes = toStringArray(payload.indicatorTypes ?? payload.indicator_types);
  const datasets = toStringArray(payload.datasets);

  const timePreset =
    typeof payload.timePreset === "string"
      ? payload.timePreset
      : typeof payload.time_preset === "string"
        ? payload.time_preset
        : "";

  const timeRange = normalizeTimeRange(payload.timeRange ?? payload.time_range);

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
  if (indicatorTypes.length) {
    searchParams.set("indicatorTypes", indicatorTypes.join(","));
  }
  if (datasets.length) {
    searchParams.set("datasets", datasets.join(","));
  }
  if (timePreset) {
    searchParams.set("timePreset", timePreset);
  }
  if (timeRange && typeof timeRange.start === "string" && typeof timeRange.end === "string") {
    searchParams.set("timeStart", timeRange.start);
    searchParams.set("timeEnd", timeRange.end);
  }
  if (options?.label) {
    searchParams.set("savedSearchLabel", options.label);
  }

  const payloadParam = serializeSearchPayloadParam(payload);
  if (payloadParam) {
    searchParams.set("payload", payloadParam);
  }

  const qs = searchParams.toString();
  return qs ? `/search?${qs}` : "/search";
}
