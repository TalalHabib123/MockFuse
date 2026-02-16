import { useState } from "react";
import { FiHome, FiSettings, FiChevronLeft, FiChevronRight, FiBox, FiFolder } from "react-icons/fi";

export type NavKey = "home" | "projects" | "settings";

type Props = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  active: NavKey;
  onNavigate: (key: NavKey) => void;
};

export default function Sidebar({ collapsed, onToggleCollapsed, active, onNavigate }: Props) {
  const [brandHover, setBrandHover] = useState(false);

  return (
    <aside
      className={[
        "h-screen flex flex-col border-r",
        collapsed ? "w-16" : "w-60",
        "bg-(--card) border-(--border) text-(--fg)",
      ].join(" ")}
      aria-label="Sidebar navigation"
    >
      {/* Brand row */}
      <div
        className={[
          "h-14 px-2.5 flex items-center border-b border-(--border)",
          collapsed ? "justify-center" : "justify-between",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center min-w-0",
            collapsed ? "w-full justify-center" : "gap-2", // spacing icon <-> name
          ].join(" ")}
        >
          {collapsed ? (
            <button
              type="button"
              onMouseEnter={() => setBrandHover(true)}
              onMouseLeave={() => setBrandHover(false)}
              onFocus={() => setBrandHover(true)}
              onBlur={() => setBrandHover(false)}
              onClick={onToggleCollapsed}
              aria-label="Expand sidebar"
              title="Expand"
              className={[
                "w-10 h-10 grid place-items-center rounded-xl",
                "bg-transparent border border-(--border)",
                "hover:bg-(--nav-hover-bg)",
                "transition-colors",
                "text-lg",
              ].join(" ")}
            >
              {brandHover ? <FiChevronRight /> : <FiBox />}
            </button>
          ) : (
            <>
              <span
                className={[
                  "w-10 h-10 grid place-items-center rounded-xl",
                  "bg-transparent",
                  "text-lg",
                ].join(" ")}
                aria-hidden="true"
              >
                <FiBox />
              </span>

              <span className="font-semibold truncate leading-none">MockFuse</span>
            </>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Collapse sidebar"
            title="Collapse"
            className={[
              "w-10 h-10 grid place-items-center rounded-xl",
              "bg-transparent border border-(--border)",
              "hover:bg-(--nav-hover-bg)",
              "transition-colors",
              "text-lg",
            ].join(" ")}
          >
            <FiChevronLeft />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={collapsed ? "p-2 flex flex-col gap-1.5" : "p-2.5 flex flex-col gap-1.5"} aria-label="Primary">
        <NavItem
          collapsed={collapsed}
          icon={<FiHome />}
          label="Home"
          active={active === "home"}
          onClick={() => onNavigate("home")}
        />
        <NavItem
        collapsed={collapsed}
        icon={<FiFolder />}
        label="Projects"
        active={active === "projects"}
        onClick={() => onNavigate("projects")}
        />
      </nav>

      {/* Bottom */}
      <div className={(collapsed ? "p-2" : "p-2.5") + " mt-auto border-t border-(--border)"}>
        <NavItem
          collapsed={collapsed}
          icon={<FiSettings />}
          label="Settings"
          active={active === "settings"}
          onClick={() => onNavigate("settings")}
        />
      </div>
    </aside>
  );
}

function NavItem({
  collapsed,
  icon,
  label,
  active,
  onClick,
}: {
  collapsed: boolean;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={[
        "h-10 w-full rounded-xl border text-left cursor-pointer",
        "flex items-center gap-2.5",
        collapsed ? "justify-center px-0" : "px-2.5",
        active ? "bg-(--bg) border-(--border)" : "bg-transparent border-transparent",
        "hover:bg-(--bg) hover:border-(--border)",
        "text-(--fg)",
      ].join(" ")}
    >
      <span className="w-7 h-7 grid place-items-center text-lg" aria-hidden="true">
        {icon}
      </span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );
}
