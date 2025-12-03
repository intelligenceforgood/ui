import snapshot from "@/config/generated/hybrid_search_schema.json";
import { mapHybridSearchSchemaPayload } from "@/lib/server/reviews-service.helpers";
import type { HybridSearchSchema } from "@/types/reviews";

export const HYBRID_SEARCH_SCHEMA_SNAPSHOT: HybridSearchSchema = mapHybridSearchSchemaPayload(
	snapshot as Record<string, unknown>,
);
