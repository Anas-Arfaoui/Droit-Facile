import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ApiError } from "@/api/client";
import { ContractPanel } from "@/components/ContractPanel";
import { DocumentPanel } from "@/components/DocumentPanel";
import { activateDossierSharing, createSeance, getDossier, listSeances } from "@/api/dossiers";
import { summarizeContract } from "@/lib/contract-summary.functions";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import { AppHeader, LevelBadge } from "@/components/AppHeader";
import { cannedAnswers, clauses, fallbackAnswer, summary, type Answer } from "@/lib/demo-data";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dossiers/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);

    if (!Number.isInteger(id)) {
      throw notFound();
    }

    try {
      const dossier = await getDossier(id);

      return {
        ...dossier,

        // Temporary compatibility fields for the existing UI.
        client: dossier.clientNom,
        title: {
          fr: dossier.titre,
          ar: dossier.titre,
        },
        status: {
          fr: dossier.statut,
          ar: dossier.statut,
        },
        step:
          dossier.statut === "CLOTURE"
            ? 3
            : dossier.statut === "EN_ATTENTE"
              ? 2
              : dossier.statut === "EN_COURS"
                ? 1
                : 0,
        contract: "contrat.pdf",
        token: String(dossier.id),
        updated: new Date(dossier.creeLe).toLocaleDateString(),
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw notFound();
      }

      throw error;
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.id} · ${loaderData.client} — Droit-Facile`
          : "Dossier — Droit-Facile",
      },
      {
        name: "description",
        content: "Analyse IA du contrat de travail, assistant et résumé à valider.",
      },
      { property: "og:title", content: "Dossier — Droit-Facile" },
      { property: "og:description", content: "Analyse de contrat de travail assistée par IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DossierPage,
});

type Tab = "analysis" | "chat" | "summary" | "sharing";

function DossierPage() {
  const d = Route.useLoaderData();
  const { t, l } = useI18n();
  const { user } = useAuth();
  const isAvocat = user?.role === "AVOCAT" || user?.role === "ADMIN";
  const visibleTabs: Tab[] = isAvocat
    ? ["analysis", "chat", "summary", "sharing"]
    : ["analysis", "chat", "summary"];
  const seancesQuery = useQuery({
    queryKey: ["dossier-seances", d.id],
    queryFn: () => listSeances(d.id),
  });
  const [sessionDate, setSessionDate] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [tab, setTab] = useState<Tab>("analysis");
  const [state, setState] = useState<"idle" | "loading" | "done">(d.step >= 2 ? "done" : "idle");
  const [validated, setValidated] = useState(d.step >= 3);
  const [shared, setShared] = useState(d.step >= 3);
  const [shareToken, setShareToken] = useState(d.partageToken ?? null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState("");

  const [contracts, setContracts] = useState<NewContract[]>([]);

  const run = () => {
    setState("loading");
    setTimeout(() => setState("done"), 1800);
  };
  async function handleCreateSeance(event: React.FormEvent) {
    event.preventDefault();

    if (!sessionDate || sessionBusy) return;

    setSessionBusy(true);
    setSessionError("");

    try {
      await createSeance(
        d.id,
        new Date(sessionDate).toISOString(),
        sessionNotes.trim() || undefined,
      );

      setSessionDate("");
      setSessionNotes("");
      await seancesQuery.refetch();
    } catch {
      setSessionError("Impossible d'enregistrer la séance.");
    } finally {
      setSessionBusy(false);
    }
  }

  async function handleActivateSharing() {
    if (shareBusy) return;

    setShareBusy(true);
    setShareError("");

    try {
      const updatedDossier = await activateDossierSharing(d.id);
      setShareToken(updatedDossier.partageToken);
    } catch (error) {
      if (error instanceof ApiError) {
        setShareError(`${error.status}: ${error.message}`);
      } else {
        setShareError("Impossible d'activer le partage client.");
      }
    } finally {
      setShareBusy(false);
    }
  }
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("back")}
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{d.id}</p>
            <h1 className="text-3xl">{d.client}</h1>
            <p className="text-muted-foreground">{l(d.title)}</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm">{l(d.status)}</span>
        </div>

        <div className="mt-4 rounded-md border-s-4 border-accent bg-accent/10 px-4 py-2 text-sm">
          {t("ruleBanner")}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          <h2 className="text-xl">Séances</h2>

          {isAvocat && (
            <form
              onSubmit={handleCreateSeance}
              className="mt-4 space-y-3 rounded-md border border-border p-4"
            >
              <label className="block text-sm font-medium">
                Date de la séance
                <input
                  type="datetime-local"
                  required
                  value={sessionDate}
                  onChange={(event) => setSessionDate(event.target.value)}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </label>

              <label className="block text-sm font-medium">
                Notes
                <textarea
                  value={sessionNotes}
                  onChange={(event) => setSessionNotes(event.target.value)}
                  rows={3}
                  placeholder="Notes de la séance"
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </label>

              {sessionError && (
                <p role="alert" className="text-sm text-destructive">
                  {sessionError}
                </p>
              )}

              <button
                type="submit"
                disabled={sessionBusy}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {sessionBusy ? "Enregistrement..." : "Ajouter la séance"}
              </button>
            </form>
          )}

          {seancesQuery.isLoading && (
            <p className="mt-3 text-sm text-muted-foreground">Chargement des séances...</p>
          )}

          {seancesQuery.isError && (
            <p className="mt-3 text-sm text-destructive">Impossible de charger les séances.</p>
          )}

          {!seancesQuery.isLoading && !seancesQuery.isError && seancesQuery.data?.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">Aucune séance enregistrée.</p>
          )}

          <div className="mt-4 space-y-3">
            {seancesQuery.data?.map((seance) => (
              <article key={seance.id} className="rounded-md border border-border p-3">
                <p className="font-medium">{new Date(seance.dateSeance).toLocaleString()}</p>

                {seance.notes && (
                  <p className="mt-1 text-sm text-muted-foreground">{seance.notes}</p>
                )}
              </article>
            ))}
          </div>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
          {visibleTabs.map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t(k)}
            </button>
          ))}
        </nav>

        <section className="py-6">
          {tab === "analysis" && (
            <div>
              {state !== "done" ? (
                <div className="rounded-lg border-2 border-dashed border-border bg-card p-10 text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">{t("upload")}</p>
                  <p className="text-sm text-muted-foreground">{d.contract || "contrat.pdf"}</p>
                  <button
                    onClick={run}
                    disabled={state === "loading"}
                    className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-70"
                  >
                    {state === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {state === "loading" ? t("analyzing") : t("analyze")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />{" "}
                    {d.contract || "contrat.pdf"}
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                      {t("draft")}
                    </span>
                    <span className="ms-auto flex gap-2">
                      {(["risk", "warn", "ok"] as const).map((lv) => (
                        <span key={lv} className="flex items-center gap-1">
                          <LevelBadge level={lv} /> {clauses.filter((c) => c.level === lv).length}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {clauses.map((c, i) => (
                      <article key={i} className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg">
                            {i + 1}. {l(c.title)}
                          </h3>
                          <LevelBadge level={c.level} />
                        </div>
                        <p className="mt-2 text-sm italic text-muted-foreground">{l(c.excerpt)}</p>
                        <p className="mt-2 text-sm">{l(c.note)}</p>
                        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                          <BookOpen className="h-3 w-3" /> {c.law}
                        </p>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "chat" && <Chat />}

          {tab === "summary" && (
            <div className="max-w-3xl rounded-lg border border-border bg-card p-6">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${validated ? "bg-success/15 text-success" : "bg-muted"}`}
              >
                {validated ? t("validated") : t("draft")}
              </span>
              <p className="mt-4 leading-relaxed">{l(summary)}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {!validated && (
                  <button
                    onClick={() => setValidated(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    <Check className="h-4 w-4" /> {t("validate")}
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  disabled={!validated}
                  className="rounded-md border border-input px-4 py-2 text-sm disabled:opacity-50"
                >
                  {t("exportPdf")}
                </button>
              </div>
            </div>
          )}

          {tab === "summary" && <ContractPanel dossierId={d.id} />}

          {tab === "sharing" && (
            <div className="max-w-3xl space-y-4">
               <DocumentPanel dossierId={d.id} />
              {contracts.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-card p-5">
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      disabled={!c.validated}
                      checked={c.shared && c.validated}
                      onChange={(e) =>
                        setContracts((cs) =>
                          cs.map((x) => (x.id === c.id ? { ...x, shared: e.target.checked } : x)),
                        )
                      }
                      className="h-4 w-4 accent-primary"
                    />
                    {t("share")} — {c.name}
                  </label>
                  {!c.validated && (
                    <p className="mt-2 text-xs text-destructive">{t("needValidate")}</p>
                  )}
                </div>
              ))}
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="text-sm font-medium">{t("shareLink")}</p>

                {!shareToken ? (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Activez le partage pour générer un lien client.
                    </p>

                    <button
                      type="button"
                      onClick={() => void handleActivateSharing()}
                      disabled={shareBusy}
                      className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    >
                      {shareBusy ? "Activation..." : "Activer le partage"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mt-2 rounded-md bg-muted px-3 py-2 font-mono text-sm" dir="ltr">
                      /suivi/{shareToken}
                    </div>

                    <Link
                      to="/suivi/$token"
                      params={{ token: shareToken }}
                      className="mt-3 inline-block text-sm text-primary underline"
                    >
                      {t("viewClient")}
                    </Link>
                  </>
                )}

                {shareError && <p className="mt-2 text-sm text-destructive">{shareError}</p>}
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    disabled={!validated}
                    checked={shared && validated}
                    onChange={(e) => setShared(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  {t("shareSummary")}
                </label>
                {!validated && <p className="mt-2 text-xs text-destructive">{t("needValidate")}</p>}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Chat() {
  const { t, l } = useI18n();
  const [msgs, setMsgs] = useState<{ q: string; a?: Answer }[]>([]);
  const [q, setQ] = useState("");
  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    const low = q.toLowerCase();
    const a = cannedAnswers.find((c) => c.keys.some((k) => low.includes(k)))?.a ?? fallbackAnswer;
    const idx = msgs.length;
    setMsgs((m) => [...m, { q }]);
    setQ("");
    setTimeout(() => setMsgs((m) => m.map((x, i) => (i === idx ? { ...x, a } : x))), 900);
  };
  return (
    <div className="flex max-w-3xl flex-col rounded-lg border border-border bg-card">
      <div className="min-h-72 space-y-4 p-5">
        {msgs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {l({
              fr: "Essayez : « La période d'essai est-elle légale ? »",
              ar: "جرّب: « هل فترة التجربة قانونية؟ »",
            })}
          </p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className="space-y-2">
            <p className="ms-auto w-fit max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
              {m.q}
            </p>
            {m.a ? (
              <div className="w-fit max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm">
                <p>{l(m.a.text)}</p>
                <p className="mt-2 flex items-center gap-1 border-t border-border pt-2 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" /> {t("source")} : {l(m.a.source)}
                </p>
              </div>
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
      <form onSubmit={ask} className="flex gap-2 border-t border-border p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("ask")}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
          <Send className="h-4 w-4 rtl:-scale-x-100" /> {t("send")}
        </button>
      </form>
    </div>
  );
}

type NewContract = {
  id: string;
  name: string;
  summary: string;
  validated: boolean;
  shared: boolean;
};

function Contracts({
  contracts,
  setContracts,
}: {
  contracts: NewContract[];
  setContracts: React.Dispatch<React.SetStateAction<NewContract[]>>;
}) {
  const { t, lang } = useI18n();
  const summarize = useServerFn(summarizeContract);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const update = (id: string, p: Partial<NewContract>) =>
    setContracts((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));

  const onFile = async (f?: File) => {
    if (!f) return;
    setText(await f.text());
    if (!name) setName(f.name);
  };
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setErr("");
    try {
      const r = await summarize({ data: { name: name || "contrat", text, lang } });
      if ("error" in r && r.error) setErr(r.error);
      else if ("summary" in r && r.summary) {
        setContracts((cs) => [
          {
            id: crypto.randomUUID(),
            name: name || "contrat",
            summary: r.summary,
            validated: false,
            shared: false,
          },
          ...cs,
        ]);
        setName("");
        setText("");
      }
    } catch {
      setErr("Le résumé n'a pas pu être généré.");
    }
    setBusy(false);
  };

  return (
    <div className="mt-8 max-w-3xl space-y-4">
      <h2 className="text-xl">{t("contracts")}</h2>
      <form onSubmit={add} className="space-y-3 rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-medium">{t("addContract")}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("contractName")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("contractText")}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".txt,text/plain"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="text-sm"
          />
          <button
            disabled={busy || !text.trim()}
            className="ms-auto inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{" "}
            {busy ? t("summarizing") : t("generate")}
          </button>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
      </form>
      {contracts.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("noContracts")}</p>
      )}
      {contracts.map((c) => (
        <article key={c.id} className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">{c.name}</h3>
            <span
              className={`ms-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${c.validated ? "bg-success/15 text-success" : "bg-muted"}`}
            >
              {c.validated ? t("validated") : t("draft")}
            </span>
          </div>
          {editing === c.id ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          ) : (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{c.summary}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {editing === c.id ? (
              <button
                onClick={() => {
                  update(c.id, { summary: draft, validated: false, shared: false });
                  setEditing(null);
                }}
                className="rounded-md border border-input px-3 py-1.5 text-sm"
              >
                {t("save")}
              </button>
            ) : (
              <button
                onClick={() => {
                  setDraft(c.summary);
                  setEditing(c.id);
                }}
                className="rounded-md border border-input px-3 py-1.5 text-sm"
              >
                {t("edit")}
              </button>
            )}
            {!c.validated && editing !== c.id && (
              <button
                onClick={() => update(c.id, { validated: true })}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                <Check className="h-4 w-4" /> {t("validate")}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
