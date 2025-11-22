export type DiscoveryDefaults = {
  project: string;
  location: string;
  dataStoreId: string;
  servingConfigId: string;
};

function normalize(value: string | undefined | null, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

function resolveEnvName() {
  const raw = process.env.I4G_ENV ?? process.env.NODE_ENV ?? "";
  return raw.trim().toLowerCase();
}

function isProdEnv(value: string) {
  if (!value) {
    return false;
  }
  return value === "prod" || value === "production" || value.includes("prod");
}

function fallbackProject() {
  const env = resolveEnvName();
  return isProdEnv(env) ? "i4g-prod" : "i4g-dev";
}

function fallbackDataStore() {
  const env = resolveEnvName();
  return isProdEnv(env) ? "retrieval-prod" : "retrieval-poc";
}

const FALLBACKS: DiscoveryDefaults = {
  project: fallbackProject(),
  location: "global",
  dataStoreId: fallbackDataStore(),
  servingConfigId: "default_search",
};

export function getDiscoveryDefaults(): DiscoveryDefaults {
  return {
    project:
      normalize(process.env.I4G_VERTEX_SEARCH_PROJECT) ||
      normalize(process.env.NEXT_PUBLIC_VERTEX_SEARCH_PROJECT) ||
      FALLBACKS.project,
    location:
      normalize(process.env.I4G_VERTEX_SEARCH_LOCATION) ||
      normalize(process.env.NEXT_PUBLIC_VERTEX_SEARCH_LOCATION) ||
      FALLBACKS.location,
    dataStoreId:
      normalize(process.env.I4G_VERTEX_SEARCH_DATA_STORE) ||
      normalize(process.env.NEXT_PUBLIC_VERTEX_SEARCH_DATA_STORE) ||
      FALLBACKS.dataStoreId,
    servingConfigId:
      normalize(process.env.I4G_VERTEX_SEARCH_SERVING_CONFIG) ||
      normalize(process.env.NEXT_PUBLIC_VERTEX_SEARCH_SERVING_CONFIG) ||
      FALLBACKS.servingConfigId,
  } satisfies DiscoveryDefaults;
}
