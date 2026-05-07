import { getI4GClient } from "@/lib/i4g-client";
import { RelationshipGraph } from "@i4g/ui-kit";

export default async function ThreatGraphPage() {
  const client = await getI4GClient();
  const graphData = await client.getPhishDestroyGraph();

  return (
    <div>
      <RelationshipGraph data={graphData} width={1200} height={800} />
    </div>
  );
}
