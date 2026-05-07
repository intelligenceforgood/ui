import type { Metadata } from "next";
import ActorDetail from "./actor-detail";

export const metadata: Metadata = {
  title: "Actor Detail",
  description: "Comprehensive view of a threat actor profile.",
};

export default function ActorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence / Actors
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Actor Profile
        </h1>
      </header>
      <ActorDetail actorId={params.id} />
    </div>
  );
}
