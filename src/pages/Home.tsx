import InfoCard from "../components/layout/InfoCard";

export default function HomePage({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="max-w-full">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold leading-tight m-0">MockFuse</h1>
          <p className="mt-2 text-(--muted)">
            Mock or proxy endpoints locally so frontend and backend can move in parallel.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateProject}
          className={[
            "h-10 px-4 rounded-xl border",
            "bg-(--accent) text-(--accent-contrast) border-transparent",
            "hover:brightness-105",
            "focus:outline-none focus:ring-2 focus:ring-(--accent)",
            "whitespace-nowrap",
          ].join(" ")}
        >
          Create Project
        </button>
      </div>

      {/* Lightweight value props */}
      <div className="mt-6 grid gap-3">
        <InfoCard
          title="Local gateway"
          desc="Run a loopback server and define routes in one place."
        />
        <InfoCard
          title="Mock + Proxy"
          desc="Serve responses for missing APIs, or forward to a real backend when ready."
        />
        <InfoCard
          title="Visibility"
          desc="Inspect requests and quickly switch behaviors while developing."
        />
      </div>

      {/* Small footer note */}
      <div className="mt-8 text-sm text-(--muted)">
        Tip: Start with a couple of routes and iterate—no need to model everything upfront.
      </div>
    </div>
  );
}

