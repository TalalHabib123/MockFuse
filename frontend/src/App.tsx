import { useEffect, useMemo, useState } from "react";
import Sidebar, { type NavKey } from "./components/layout/Sidebar";
import { APP_VIEWS, type AppView } from "./lib/contracts/app";
import { DesktopAPI } from "./lib/desktop/DesktopAPI";
import { DesktopEvents } from "./lib/desktop/DesktopEvents";
import HomePage from "./pages/Home";
import ProjectsPage from "./pages/Projects/Projects";
import SettingsPage from "./pages/Settings";

const VALID_VIEWS: AppView[] = APP_VIEWS;

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<NavKey>("home");
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const settings = await DesktopAPI.getSettings();
        const view = settings.lastActiveView ?? "home";
        if (!cancelled && VALID_VIEWS.includes(view)) {
          setActive(view);
        }
      } catch (error) {
        console.warn("[App] getSettings failed, using default view", error);
      } finally {
        if (!cancelled) {
          setBootstrapped(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;

    void DesktopAPI.setLastActiveView(active).catch((error) => {
      console.warn("[App] failed to persist active view", error);
    });
  }, [active, bootstrapped]);

  useEffect(() => {
    return DesktopEvents.onSystemError((event) => {
      console.warn(`[Desktop] ${event.code}: ${event.message}`);
    });
  }, []);

  const content = useMemo(() => {
    if (active === "projects") return <ProjectsPage />;
    if (active === "settings") return <SettingsPage />;
    return <HomePage onCreateProject={() => setActive("projects")} />;
  }, [active]);

  return (
    <div className="flex w-full min-h-screen bg-(--bg) text-(--fg)">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        active={active}
        onNavigate={setActive}
      />

      <main className="flex-1 overflow-auto p-6">{content}</main>
    </div>
  );
}
