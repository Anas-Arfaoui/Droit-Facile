import { Link } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { AccountControl } from "@/components/AccountControl";

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
  return (
    <header className="bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Scale className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-serif text-xl leading-none">{t("app")}</span>
            <span className="text-xs text-sidebar-foreground/60">{t("tagline")}</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
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
