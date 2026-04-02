import type { ProjectSummary } from "../../../lib/contracts/projects";
import { displayPath } from "../utils/path";

export default function ArchivedProjectsSection({
  loading,
  projects,
  onRestore,
  onOpen,
}: {
  loading: boolean;
  projects: ProjectSummary[];
  onRestore: (id: string, name: string) => Promise<void>;
  onOpen: (project: ProjectSummary) => void;
}) {
  return (
    <section className="rounded-2xl border border-(--border) bg-(--card) p-4">
      <div className="font-semibold">Archived Projects</div>
      <div className="mt-1 text-sm text-(--muted)">
        Restore old projects when needed.
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-(--muted)">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-(--border) bg-(--bg) p-4">
            <div className="font-medium">No archived projects</div>
            <div className="mt-1 text-sm text-(--muted)">
              Archived projects will show up here.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => (
              <div key={p.id} className="rounded-xl border border-(--border) bg-(--bg) p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-sm text-(--muted) truncate">{displayPath(p.rootDir)}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="h-9 px-3 rounded-xl border border-(--border) hover:brightness-105"
                    onClick={() => onOpen(p)}
                  >
                    View
                  </button>

                  <button
                    type="button"
                    className="h-9 px-3 rounded-xl border border-(--border) hover:brightness-105"
                    onClick={() => void onRestore(p.id, p.name)}
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
