import { useMemo, useState } from "react";
import type { CreateProjectInput, ProjectSummary } from "../../../core/projects";
import type { GatewayState } from "../../../core/gateway";
import { gatewayStop } from "../../../core/gateway";

export default function CreateProjectView({
  disabled,
  activeProject,
  gatewayState,
  onCreate,
  onCancel,
}: {
  disabled: boolean;
  activeProject: ProjectSummary | null;
  gatewayState: GatewayState;
  onCreate: (input: CreateProjectInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [bindHost, setBindHost] = useState("127.0.0.1");
  const [port, setPort] = useState(4010);
  const [upstreamBaseUrl, setUpstreamBaseUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!Number.isFinite(port) || port < 1 || port > 65535) return false;
    return true;
  }, [name, port]);

  const submit = async () => {
    setError(null);

    // if active exists: prompt user to replace
    if (activeProject) {
      const ok = confirm(
        gatewayState === "running"
          ? `An active project exists (${activeProject.name}) and the gateway is running.\n\nStop gateway, archive active project, and replace with the new project?`
          : `An active project exists (${activeProject.name}).\n\nArchive it and replace with the new project?`
      );
      if (!ok) return;

      if (gatewayState === "running") {
        await gatewayStop();
      }

      await onCreate({
        name: name.trim(),
        bindHost,
        port,
        upstreamBaseUrl: upstreamBaseUrl.trim() ? upstreamBaseUrl.trim() : null,
        replaceActive: true,
      });
      return;
    }

    // no active: normal create
    await onCreate({
      name: name.trim(),
      bindHost,
      port,
      upstreamBaseUrl: upstreamBaseUrl.trim() ? upstreamBaseUrl.trim() : null,
      replaceActive: false,
    });
  };

  return (
    <section className="rounded-2xl border border-(--border) bg-(--card) p-4">
      <div className="font-semibold">Create Project</div>
      <div className="mt-1 text-sm text-(--muted)">
        Creates a project YAML and sets it as active.
      </div>

      <div className="mt-4 grid gap-3">
        <Field label="Project name">
          <input
            className="h-10 w-full rounded-xl border border-(--border) bg-(--bg) px-3 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Payments Mock"
            disabled={disabled}
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Bind host">
            <select
              className="h-10 w-full rounded-xl border border-(--border) bg-(--bg) px-3 outline-none"
              value={bindHost}
              onChange={(e) => setBindHost(e.target.value)}
              disabled={disabled}
            >
              <option value="127.0.0.1">127.0.0.1 (recommended)</option>
              <option value="localhost">localhost</option>
            </select>
          </Field>

          <Field label="Port">
            <input
              className="h-10 w-full rounded-xl border border-(--border) bg-(--bg) px-3 outline-none"
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              min={1}
              max={65535}
              disabled={disabled}
            />
          </Field>
        </div>

        <Field label="Upstream base URL (optional)">
          <input
            className="h-10 w-full rounded-xl border border-(--border) bg-(--bg) px-3 outline-none"
            value={upstreamBaseUrl}
            onChange={(e) => setUpstreamBaseUrl(e.target.value)}
            placeholder="https://api.your-backend.com"
            disabled={disabled}
          />
        </Field>

        {error && (
          <div className="rounded-xl border border-(--border) bg-(--bg) p-3 text-sm">
            <span className="text-(--muted)">Error: </span>
            <span>{error}</span>
          </div>
        )}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="h-10 px-4 rounded-xl bg-(--accent) text-(--accent-contrast) hover:brightness-105 focus:outline-none disabled:opacity-60"
            onClick={submit}
            disabled={disabled || !canSubmit}
          >
            Create & Activate
          </button>
          <button
            type="button"
            className="h-10 px-4 rounded-xl border border-(--border) bg-(--bg) hover:brightness-105 focus:outline-none"
            onClick={onCancel}
            disabled={disabled}
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}