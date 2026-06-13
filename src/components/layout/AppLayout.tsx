import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Github, Languages, Layers, PlusCircle, QrCode, Settings, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { applyPageMeta } from "@/shared/seo/page-meta";
import { useI18n } from "@/shared/i18n/i18n";

const navItems = [
  { path: "/", labelKey: "create", icon: PlusCircle },
  { path: "/templates", labelKey: "templates", icon: Sparkles },
  { path: "/batch", labelKey: "batch", icon: Layers },
  { path: "/settings", labelKey: "settings", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { direction, locale, t, toggleLocale } = useI18n();

  useEffect(() => {
    applyPageMeta(location.pathname, locale);
  }, [locale, location.pathname]);

  const languageToggle = (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={t.layout.switchLanguage}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Languages className="h-4 w-4" />
      {t.languageToggle}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          "hidden lg:flex w-60 border-border bg-card/50 flex-col shrink-0",
          direction === "rtl" ? "border-l" : "border-r",
        )}
      >
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">{t.appName}</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {t.layout.nav[item.labelKey]}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">{languageToggle}</div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="lg:hidden border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between h-14 px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <QrCode className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-base font-semibold text-foreground">{t.appName}</span>
            </Link>
            <div className="flex items-center gap-1">
              {languageToggle}
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                  aria-label={t.layout.nav[item.labelKey]}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-card/40 px-4 py-4">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-sm text-muted-foreground md:flex-row md:text-start">
            <p>{t.layout.builtBy}</p>
            <a
              href="https://github.com/moatasem-alhilali"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              {t.layout.githubProfile}
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
