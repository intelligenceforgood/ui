import {
  createClient,
  createMockClient,
  type DossierListOptions,
  type I4GClient,
  type SearchRequest,
} from "@i4g/sdk";
import { createPlatformClient } from "@/lib/platform-client";

let cachedClient: I4GClient | null = null;
let cachedMockClient: I4GClient | null = null;

function getMockClient(): I4GClient {
  if (!cachedMockClient) {
    cachedMockClient = createMockClient();
  }
  return cachedMockClient;
}

function withMockFallback(client: I4GClient): I4GClient {
  const mock = getMockClient();

  async function withFallback<T>(
    label: string,
    exec: () => Promise<T>,
    fallback: () => Promise<T>,
  ) {
    try {
      return await exec();
    } catch (error) {
      console.warn(`Falling back to mock ${label}`, error);
      return fallback();
    }
  }

  return {
    async getDashboardOverview() {
      return withFallback(
        "dashboard overview",
        () => client.getDashboardOverview(),
        () => mock.getDashboardOverview(),
      );
    },
    async searchIntelligence(request: SearchRequest) {
      return withFallback(
        "search results",
        () => client.searchIntelligence(request),
        () => mock.searchIntelligence(request),
      );
    },
    async listCases() {
      return withFallback(
        "case list",
        () => client.listCases(),
        () => mock.listCases(),
      );
    },
    async getCase(id) {
      return withFallback(
        `case detail ${id}`,
        () => client.getCase(id),
        () => mock.getCase(id),
      );
    },
    async getTaxonomy() {
      return withFallback(
        "taxonomy",
        () => client.getTaxonomy(),
        () => mock.getTaxonomy(),
      );
    },
    async getAnalyticsOverview() {
      return withFallback(
        "analytics overview",
        () => client.getAnalyticsOverview(),
        () => mock.getAnalyticsOverview(),
      );
    },
    async listDossiers(options?: DossierListOptions) {
      return withFallback(
        "dossier list",
        () => client.listDossiers(options),
        () => mock.listDossiers(options),
      );
    },
    async verifyDossier(planId) {
      return withFallback(
        "dossier verification",
        () => client.verifyDossier(planId),
        () => mock.verifyDossier(planId),
      );
    },
    async detokenize(token, caseId) {
      return withFallback(
        "detokenize",
        () => client.detokenize(token, caseId),
        () => mock.detokenize(token, caseId),
      );
    },
  } satisfies I4GClient;
}

function resolveClient(): I4GClient {
  if (cachedClient) {
    return cachedClient;
  }

  const useMock =
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ||
    (!process.env.I4G_API_URL && !process.env.NEXT_PUBLIC_API_BASE_URL);

  if (useMock) {
    cachedClient = getMockClient();
    return cachedClient;
  }

  const baseUrl =
    process.env.I4G_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  if (!baseUrl) {
    cachedClient = getMockClient();
    return cachedClient;
  }

  const useCoreApi = process.env.I4G_API_KIND === "core";

  const resolvedClient: I4GClient = useCoreApi
    ? createPlatformClient({
        baseUrl,
        apiKey: process.env.I4G_API_KEY,
        iapClientId: process.env.I4G_IAP_CLIENT_ID,
      })
    : createClient({
        baseUrl,
        apiKey: process.env.I4G_API_KEY,
      });

  // Only enable mock fallback if explicitly requested, otherwise fail loudly so
  // configuration/networking errors are visible.
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK === "true") {
    cachedClient = withMockFallback(resolvedClient);
  } else {
    cachedClient = resolvedClient;
  }

  return cachedClient;
}

export function getI4GClient() {
  return resolveClient();
}
