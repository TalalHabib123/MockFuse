import { useEffect, useMemo, useState } from "react";
import Sidebar, { type NavKey } from "./components/layout/Sidebar";
import HomePage from "./pages/Home";
import ProjectsPage from "./pages/Projects";
import SettingsPage from "./pages/Settings";
import { settingsGet, settingsSetLastActiveView } from "./core/settings";

const VALID_VIEWS: NavKey[] = ["home", "projects", "settings"];

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<NavKey>("home");
  const [bootstrapped, setBootstrapped] = useState(false);

  // Load last active view once on startup
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const s = await settingsGet();
        const v = s.lastActiveView ?? "home";
        if (!cancelled && VALID_VIEWS.includes(v)) setActive(v);
      } catch (e) {
        console.warn("[App] settings_get failed, using default view", e);
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist active view whenever it changes (after bootstrap)
  useEffect(() => {
    if (!bootstrapped) return;
    void settingsSetLastActiveView(active).catch((e) => {
      console.warn("[App] failed to persist active view", e);
    });
  }, [active, bootstrapped]);

  const content = useMemo(() => {
    if (active === "projects") return <ProjectsPage />;
    if (active === "settings") return <SettingsPage />;
    return <HomePage onCreateProject={() => setActive("projects")} />;
  }, [active]);

  return (
    <div className="flex w-full min-h-screen bg-(--bg) text-(--fg)">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        active={active}
        onNavigate={setActive}
      />

      <main className="flex-1 p-6 overflow-auto">{content}</main>
    </div>
  );
}
