import { getI4GClient } from "@/lib/i4g-client";
import { ThreatActorTable } from "@i4g/ui-kit";

export default async function ThreatActorsPage() {
  const client = await getI4GClient();
  const actors = await client.getPhishDestroyActors();

  // Add target_brands which might be missing but is expected by the component as optional
  const formattedActors = actors.map((actor) => ({
    ...actor,
    stolen_amount: actor.stolenAmount,
    target_brands: [], // Mock target brands as the API doesn't return them currently
  }));

  return (
    <div>
      <ThreatActorTable data={formattedActors} />
    </div>
  );
}
