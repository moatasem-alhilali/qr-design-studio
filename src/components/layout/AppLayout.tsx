import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Github, Languages, Layers, Moon, PlusCircle, Settings, Sparkles, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { ColourBar } from "@/components/workshop/InkWell";
import { applyPageMeta } from "@/shared/seo/page-meta";
import { useI18n } from "@/shared/i18n/i18n";
import { useShift } from "@/shared/theme/use-shift";

const navItems = [
  { path: "/", labelKey: "create", icon: PlusCircle, no: "01" },
  { path: "/templates", labelKey: "templates", icon: Sparkles, no: "02" },
  { path: "/batch", labelKey: "batch", icon: Layers, no: "03" },
  { path: "/settings", labelKey: "settings", icon: Settings, no: "04" },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { direction, locale, t, toggleLocale } = useI18n();
  const { shift, toggleShift } = useShift();

  useEffect(() => {
    applyPageMeta(location.pathname, locale);
  }, [locale, location.pathname]);

  const isNight = shift === "night";

  return (
    <div className="flex min-h-screen flex-col" dir={direction}>
      {/*
        The masthead is a letterpress plate bolted to the top of the bench:
        the shop name cut in heavy type, the CMYK control strip beneath it, and
        the sections presented as numbered drawers rather than sidebar links.
      */}
      <header className="sticky top-0 z-50 steel tex-grain">
        <div className="mx-auto w-full max-w-[1560px] px-4">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-2 pt-3">
            <Link to="/" className="group flex items-end gap-3">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[3px] bg-ink text-paper"
                style={{ boxShadow: "0 2px 0 hsl(var(--cast) / 0.4), 0 6px 12px -6px hsl(var(--cast) / 0.6)" }}
                aria-hidden
              >
                {/* A composing-stick glyph: four modules of a QR finder */}
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                  <rect x="2" y="2" width="8" height="8" rx="1" />
                  <rect x="14" y="2" width="8" height="8" rx="1" />
                  <rect x="2" y="14" width="8" height="8" rx="1" />
                  <rect x="14.5" y="14.5" width="3" height="3" />
                  <rect x="19" y="19" width="3" height="3" />
                </svg>
              </span>
              <span className="leading-none">
                <span className="plate-title letterpress block text-[1.6rem] sm:text-[2rem]">
                  {t.appName}
                </span>
                <span className="spec mt-1 block">{t.layout.tagline}</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLocale}
                aria-label={t.layout.switchLanguage}
                className="tool tool-wide px-3"
              >
                <Languages className="h-4 w-4" />
                {t.languageToggle}
              </button>
              <button
                type="button"
                onClick={toggleShift}
                aria-label={t.layout.switchShift}
                title={isNight ? t.layout.dayShift : t.layout.nightShift}
                className="tool px-3 py-2.5"
              >
                {isNight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <ColourBar className="opacity-80" />

          {/* Drawer fronts. The open one is pulled forward out of the rail. */}
          <nav className="-mb-px flex items-stretch gap-1 overflow-x-auto pt-2" aria-label={t.appName}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex shrink-0 items-center gap-2 rounded-t-[4px] px-3.5 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-paper text-ink"
                      : "text-ink-mid hover:bg-paper/55 hover:text-ink",
                  )}
                  style={
                    active
                      ? { boxShadow: "0 -2px 0 hsl(var(--press-red)) inset, 0 -6px 12px -8px hsl(var(--cast) / 0.5)" }
                      : undefined
                  }
                >
                  <span className="font-mono text-[10px] text-ink-faint">{item.no}</span>
                  <item.icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t.layout.nav[item.labelKey]}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Colophon: how the thing was set and printed. */}
      <footer className="mt-10 border-t-0 bg-desk-deep/25 tex-grain">
        <div className="mx-auto w-full max-w-[1560px] px-4 py-6">
          <hr className="perf mb-5" />
          <div className="flex flex-col items-start justify-between gap-3 text-sm text-ink-mid md:flex-row md:items-center">
            <div>
              <p className="font-medium text-ink">{t.layout.builtBy}</p>
              <p className="spec mt-1 max-w-lg normal-case tracking-normal">{t.layout.colophon}</p>
            </div>
            <a
              href="https://github.com/moatasem-alhilali"
              target="_blank"
              rel="noreferrer"
              className="tool tool-wide px-3"
            >
              <Github className="h-4 w-4" />
              {t.layout.githubProfile}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
