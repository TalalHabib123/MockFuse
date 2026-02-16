export default function ProjectsPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold m-0">Projects</h2>
      <p className="mt-2 text-(--muted)">
        This is a placeholder. Next we’ll add: create project, import/export, and activate archive.
      </p>

      <div className="mt-4 rounded-2xl border border-(--border) bg-(--card) p-4">
        <div className="font-semibold">Dummy state</div>
        <div className="mt-1 text-(--muted)">
          Active project: <span className="font-medium">None</span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="h-10 px-4 rounded-xl border border-(--border) bg-(--bg) hover:brightness-105"
          >
            New Project (next)
          </button>
          <button
            type="button"
            className="h-10 px-4 rounded-xl border border-(--border) bg-(--bg) hover:brightness-105"
          >
            Import (next)
          </button>
        </div>
      </div>
    </div>
  );
}