import { createFileRoute, notFound } from "@tanstack/react-router";
import { Check, FileText, Lock } from "lucide-react";
import { getSharedDossier } from "@/api/dossiers";
import { ApiError } from "@/api/client";
import { LangSwitch } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { downloadSharedDocument, listSharedDocuments } from "@/api/documents";

export const Route = createFileRoute("/suivi/$token")({
  loader: async ({ params }) => {
    try {
      const [dossier, documents] = await Promise.all([
        getSharedDossier(params.token),
        listSharedDocuments(params.token),
      ]);

      return { dossier, documents };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw notFound();
      }

      throw error;
    }
  },
  head: () => ({
    meta: [
      { title: "Suivi de votre dossier — Droit-Facile" },
      {
        name: "description",
        content: "Consultez le suivi de votre dossier.",
      },
    ],
  }),
  component: Suivi,
});

function Suivi() {
  const { dossier, documents } = Route.useLoaderData();
  const { token } = Route.useParams();
  const { t } = useI18n();

  const steps = ["OUVERT", "EN_COURS", "EN_ATTENTE", "CLOTURE"];

  const currentStep = steps.indexOf(dossier.statut);

  return (
    <div className="min-h-screen">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <span className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4" />
            {t("tagline")}
          </span>
          <LangSwitch />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10">
        <p className="text-muted-foreground">{t("clientHello")},</p>

        <h1 className="text-3xl">{dossier.clientNom}</h1>

        <p className="text-muted-foreground">
          {dossier.titre} · <span className="font-mono text-xs">{dossier.id}</span>
        </p>

        <h2 className="mt-10 text-xl">{t("timeline")}</h2>

        <ol className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-3">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                  index <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </span>

              <span className={index <= currentStep ? "font-medium" : "text-muted-foreground"}>
                {step}
              </span>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 text-xl">{t("sharedDocs")}</h2>

        <div className="mt-4 space-y-3">
          {documents.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{t("nothingShared")}</p>
            </div>
          ) : (
            documents.map((document) => (
              <article
                key={document.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
              >
                <FileText className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">{document.nomFichier}</p>
                  <p className="text-xs text-muted-foreground">{document.envoyeurNom}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const blob = await downloadSharedDocument(token, document.id);
                    const url = URL.createObjectURL(blob);
                    const link = window.document.createElement("a");
                    link.href = url;
                    link.download = document.nomFichier;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-sm underline"
                >
                  Télécharger
                </button>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
