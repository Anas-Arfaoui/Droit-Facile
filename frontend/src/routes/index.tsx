import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FolderOpen, Plus, Search } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { dossiers, steps } from "@/lib/demo-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Droit-Facile — Dossiers du cabinet" },
      {
        name: "description",
        content:
          "Gestion des dossiers et analyse IA des contrats de travail pour avocats en Tunisie.",
      },
      { property: "og:title", content: "Droit-Facile — Dossiers du cabinet" },
      {
        property: "og:description",
        content: "Dossiers, analyse IA de contrats de travail et suivi client.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { t, l } = useI18n();
  const [q, setQ] = useState("");
  const list = dossiers.filter((d) =>
    (d.client + d.id + l(d.title)).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl">{t("dossiers")}</h1>
            <p className="mt-1 text-muted-foreground">{t("ruleBanner")}</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> {t("newDossier")}
          </button>
        </div>
        <div className="relative mb-6">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="w-full rounded-md border border-input bg-card py-2.5 pe-3 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((d) => (
            <Link
              key={d.id}
              to="/dossiers/$id"
              params={{ id: d.id }}
              className="group rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{d.id}</p>
                  <h2 className="mt-1 text-xl">{d.client}</h2>
                  <p className="text-sm text-muted-foreground">{l(d.title)}</p>
                </div>
                <FolderOpen className="h-5 w-5 text-accent" />
              </div>
              <div className="mt-5 flex gap-1">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i <= d.step ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{l(d.status)}</span>
                <span>
                  {t("updated")} {d.updated}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
