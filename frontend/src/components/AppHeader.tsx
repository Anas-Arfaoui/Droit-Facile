import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Scale, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { AccountControl } from "@/components/AccountControl";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useAuth } from "@/lib/auth";

export function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex rounded-md border border-sidebar-border p-0.5 text-sm">
      {(["fr", "ar"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded px-3 py-1 transition-colors ${lang === l ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
        >
          {l === "fr" ? "FR" : "عربي"}
        </button>
      ))}
    </div>
  );
}

export function AppHeader() {
  const { t } = useI18n();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar/95 text-sidebar-foreground backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Scale className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-serif text-lg leading-none sm:text-xl">{t("app")}</span>
            <span className="hidden text-xs text-sidebar-foreground/60 sm:block">{t("tagline")}</span>
          </span>
        </Link>

        {user && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            <Link
              to="/"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Tableau de bord
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-sidebar-border px-3 py-1.5 text-xs font-medium text-sidebar-foreground/70">
              {user.role === "ADMIN" && <ShieldCheck className="h-3.5 w-3.5 text-sidebar-primary" />}
              {user.role}
            </span>
          </nav>
        )}

        <div className="flex items-center gap-3">
          <NotificationPanel enabled={Boolean(user)} variant="header" />
          <LangSwitch />
          <AccountControl />
        </div>
      </div>
    </header>
  );
}

export function LevelBadge({ level }: { level: "ok" | "warn" | "risk" }) {
  const { t } = useI18n();
  const cls = {
    ok: "bg-success/15 text-success",
    warn: "bg-warning/20 text-accent-foreground",
    risk: "bg-destructive/15 text-destructive",
  }[level];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{t(level)}</span>
  );
}
