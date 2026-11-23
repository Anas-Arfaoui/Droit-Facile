import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, FileText, Loader2, Sparkles } from "lucide-react";
import { listContracts, type Contract } from "@/api/contracts";
import {
  analyzeContract,
  CLAUSE_TYPE_LABELS,
  describeClauseError,
  listClauses,
  type RiskLevel,
} from "@/api/clauses";
import { LevelBadge } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

const LEVELS: Record<RiskLevel, "ok" | "warn" | "risk"> = {
  FAIBLE: "ok",
  MOYEN: "warn",
  ELEVE: "risk",
};

export function AnalysisPanel({ dossierId }: { dossierId: number }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Le backend réserve les contrats et l'analyse à l'avocat du dossier.
  const isAvocat = user?.role === "AVOCAT";

  const contractsQuery = useQuery({
    queryKey: ["dossier-contracts", dossierId],
    queryFn: () => listContracts(dossierId),
    enabled: isAvocat,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const contracts = contractsQuery.data ?? [];
  const contract: Contract | undefined = contracts.find((c) => c.id === selectedId) ?? contracts[0];
  const contractId = contract?.id;

  const clausesQuery = useQuery({
    queryKey: ["contract-clauses", contractId],
    queryFn: () => listClauses(contractId ?? 0),
    enabled: isAvocat && contract !== undefined && !contract.ocrNecessaire,
    retry: false,
  });

  if (!isAvocat) {
    return (
      <p className="text-sm text-muted-foreground">
        L&apos;analyse des clauses est réservée à l&apos;avocat du dossier.
      </p>
    );
  }
  if (contractsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }
  if (contractsQuery.isError) {
    return <p className="text-sm text-destructive">Impossible de charger les contrats.</p>;
  }
  if (!contract) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm">
        <p className="font-medium">Aucun contrat à analyser.</p>
        <p className="mt-1 text-muted-foreground">
          Importe d&apos;abord un contrat dans l&apos;onglet « Résumé ».
        </p>
      </div>
    );
  }

  async function analyze() {
    if (!contract || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await analyzeContract(contract.id);
      queryClient.setQueryData(["contract-clauses", contract.id], result);
    } catch (err) {
      setError(describeClauseError(err));
    } finally {
      setBusy(false);
    }
  }

  const analysis = clausesQuery.data;
  const clauses = analysis?.clauses ?? [];
  const hasClauses = clauses.length > 0;
  const counts = {
    risk: clauses.filter((c) => c.niveauRisque === "ELEVE").length,
    warn: clauses.filter((c) => c.niveauRisque === "MOYEN").length,
    ok: clauses.filter((c) => c.niveauRisque === "FAIBLE").length,
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <FileText className="h-4 w-4 text-muted-foreground" />
        {contracts.length > 1 ? (
          <select
            value={contract.id}
            onChange={(event) => setSelectedId(Number(event.target.value))}
            disabled={busy}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomFichier}
              </option>
            ))}
          </select>
        ) : (
          <span>{contract.nomFichier}</span>
        )}
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{t("draft")}</span>
        {hasClauses && (
          <span className="ms-auto flex gap-2">
            {(["risk", "warn", "ok"] as const).map((lv) => (
              <span key={lv} className="flex items-center gap-1">
                <LevelBadge level={lv} /> {counts[lv]}
              </span>
            ))}
          </span>
        )}
      </div>

      {contract.ocrNecessaire ? (
        <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Analyse IA impossible : ce document est un scan (OCR nécessaire).
        </p>
      ) : (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void analyze()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? t("analyzing") : t("analyze")}
          </button>
          {busy && <span className="text-xs text-muted-foreground">10 à 30 secondes</span>}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {clausesQuery.isError && !error && (
        <p className="mb-4 text-sm text-destructive">
          Impossible de charger les clauses déjà analysées.
        </p>
      )}
      {!contract.ocrNecessaire && clausesQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      )}
      {analysis && !hasClauses && !busy && !error && (
        <p className="text-sm text-muted-foreground">
          Aucune clause analysée pour ce contrat. Lance l&apos;analyse.
        </p>
      )}

      {analysis && hasClauses && (
        <>
          <p className="mb-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {analysis.avertissement}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {clauses.map((clause, i) => (
              <article key={clause.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg">
                    {i + 1}. {clause.titre}
                  </h3>
                  <LevelBadge level={LEVELS[clause.niveauRisque]} />
                </div>
                <p dir="auto" className="mt-2 text-sm italic text-muted-foreground">
                  « {clause.extrait} »
                </p>
                {!clause.extraitVerifie && (
                  <p className="mt-1 text-xs text-amber-700">
                    Extrait non retrouvé tel quel dans le contrat : à vérifier.
                  </p>
                )}
                <p className="mt-2 text-sm">{clause.explication}</p>
                {clause.niveauRisque !== "FAIBLE" && clause.motifRisque && (
                  <p className="mt-2 text-sm text-muted-foreground">{clause.motifRisque}</p>
                )}
                <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" /> {CLAUSE_TYPE_LABELS[clause.type]}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
