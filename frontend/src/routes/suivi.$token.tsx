import { createFileRoute, notFound } from "@tanstack/react-router";
import { Check, FileText, Lock } from "lucide-react";
import { LangSwitch } from "@/components/AppHeader";
import { dossiers, steps, summary } from "@/lib/demo-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/suivi/$token")({
  loader: ({ params }) => {
    const d = dossiers.find((x) => x.token === params.token);
    if (!d) throw notFound();
    return d;
  },
  head: () => ({
    meta: [
      { title: "Suivi de votre dossier — Droit-Facile" },
      {
        name: "description",
        content: "Consultez l'état de votre dossier et les documents partagés par votre avocat.",
      },
      { property: "og:title", content: "Suivi de votre dossier — Droit-Facile" },
      { property: "og:description", content: "Suivi sécurisé de votre dossier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Suivi,
});

function Suivi() {
  const d = Route.useLoaderData();
  const { t, l } = useI18n();
  return (
    <div className="min-h-screen">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <span className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4" /> {t("tagline")}
          </span>
          <LangSwitch />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10">
        <p className="text-muted-foreground">{t("clientHello")},</p>
        <h1 className="text-3xl">{d.client}</h1>
        <p className="text-muted-foreground">
          {l(d.title)} · <span className="font-mono text-xs">{d.id}</span>
        </p>

        <h2 className="mt-10 text-xl">{t("timeline")}</h2>
        <ol className="mt-4 space-y-4">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs ${i <= d.step ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
              >
                {i < d.step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={i <= d.step ? "font-medium" : "text-muted-foreground"}>{l(s)}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 text-xl">{t("sharedDocs")}</h2>
        {d.step >= 3 ? (
          <div className="mt-4 rounded-lg border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" /> {t("summary")} — {t("validated")}
            </p>
            <p className="mt-3 text-sm leading-relaxed">{l(summary)}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{t("nothingShared")}</p>
        )}
      </main>
    </div>
  );
}
