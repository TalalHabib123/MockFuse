import { ThemeSwitcher } from "../theme/ThemeSwitcher";

export default function SettingsPage() {
  return (
    <div className="max-w-full">
      <h2 className="m-0 text-xl font-semibold">Settings</h2>
      <p className="mt-2 text-(--muted)">
        Personalize the desktop experience and keep project defaults close at hand.
      </p>

      <section className="mt-5 rounded-2xl border border-(--border) bg-(--card) p-4">
        <div className="font-semibold">Appearance</div>
        <div className="mt-1 text-sm text-(--muted)">
          Theme preference is stored in desktop settings and cached locally for faster startup.
        </div>

        <div className="mt-4">
          <ThemeSwitcher />
        </div>
      </section>
    </div>
  );
}
