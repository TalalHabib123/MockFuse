import { useMemo, useState } from "react";
import type { GatewayState } from "../../../lib/contracts/gateway";
import type {
  CreateProjectInput,
  ProjectSummary,
} from "../../../lib/contracts/projects";

export default function CreateProjectView({
  disabled,
  activeProject,
  gatewayState,
  onCancel,
  onCreate,
}: {
  disabled: boolean;
  activeProject: ProjectSummary | null;
  gatewayState: GatewayState;
  onCancel: () => void;
  onCreate: (input: CreateProjectInput) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [bindHost, setBindHost] = useState("127.0.0.1");
  const [port, setPort] = useState(4010);
  const [upstreamBaseUrl, setUpstreamBaseUrl] = useState("");

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!Number.isFinite(port) || port < 1 || port > 65535) return false;
    return true;
  }, [name, port]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // If active exists, confirm replacement
    let replaceActive = false;
    if (activeProject) {
      const ok = confirm(
        gatewayState === "running"
          ? `An active project exists (${activeProject.name}) and the gateway is running.\n\nStop gateway, archive active project, and replace with the new project?`
          : `An active project exists (${activeProject.name}).\n\nArchive it and replace with the new project?`
      );
      if (!ok) return;
      replaceActive = true;
    }

    await onCreate({
      name: trimmed,
      bindHost,
      port,
      upstreamBaseUrl: upstreamBaseUrl.trim() ? upstreamBaseUrl.trim() : null,
      replaceActive,
    });
  };

  return (
    <section className="rounded-2xl border border-(--border) bg-(--card) p-4">
      <div className="font-semibold">Create Project</div>
      <div className="mt-1 text-sm text-(--muted)">
        Creates a project YAML and sets it as active.
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <div className="text-sm font-medium">Project name</div>
          <div className="mt-1">
            <input
              className="h-10 w-full rounded-xl border border-(--border) bg-(--bg) px-3 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-sm font-medium">Bind host</div>
            <div className="mt-1">
              <select
                className="h-10 w-full rounded-xl border border-(--border) bg-(--bg) px-3 outline-none"
                value={bindHost}
                onChange={(e) => setBindHost(e.target.value)}
                disabled={disabled}
              >
                <option value="127.0.0.1">127.0.0.1 (recommended)</option>
                <option value="localhost">localhost</option>
              </select>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Port</div>
            <div className="mt-1">
              <input
                className="h-10 w-full rounded-xl border border-(--border) bg-(--bg) px-3 outline-none"
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Upstream base URL (optional)</div>
          <div className="mt-1">
            <input
              className="h-10 w-full rounded-xl border border-(--border) bg-(--bg) px-3 outline-none"
              value={upstreamBaseUrl}
              onChange={(e) => setUpstreamBaseUrl(e.target.value)}
              disabled={disabled}
              placeholder="https://api.your-backend.com"
            />
          </div>
        </div>

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
