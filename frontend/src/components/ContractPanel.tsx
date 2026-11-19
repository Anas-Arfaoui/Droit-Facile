import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  downloadContract,
  getContract,
  listContracts,
  uploadContract,
  type Contract,
} from "@/api/contracts";
import { useI18n } from "@/lib/i18n";

export function ContractPanel({ dossierId }: { dossierId: number }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAvocat = user?.role === "AVOCAT" || user?.role === "ADMIN";
  const contractsQuery = useQuery({
    queryKey: ["dossier-contracts", dossierId],
    queryFn: () => listContracts(dossierId),
    enabled: isAvocat,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [texts, setTexts] = useState<Record<number, string>>({});

  if (!isAvocat) return null;

  async function upload() {
    if (!selectedFile || busy) return;
    setBusy(true);
    setError("");
    try {
      await uploadContract(dossierId, selectedFile);
      setSelectedFile(null);
      await contractsQuery.refetch();
    } catch {
      setError("Le contrat n'a pas pu être importé.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleText(contract: Contract) {
    if (openId === contract.id) {
      setOpenId(null);
      return;
    }
    setOpenId(contract.id);
    if (texts[contract.id] !== undefined) return;
    try {
      const detail = await getContract(contract.id);
      setTexts((current) => ({ ...current, [contract.id]: detail.texte ?? "" }));
    } catch {
      setError("Le texte extrait n'a pas pu être chargé.");
    }
  }

  async function download(contract: Contract) {
    try {
      const blob = await downloadContract(contract.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = contract.nomFichier;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Le fichier n'a pas pu être téléchargé.");
    }
  }

  return (
    <div className="mt-8 max-w-3xl space-y-4">
      <h2 className="text-xl">{t("contracts")}</h2>
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-medium">{t("addContract")}</p>
        <p className="text-sm text-muted-foreground">PDF ou DOCX, 20 Mo maximum.</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <button
            type="button"
            onClick={() => void upload()}
            disabled={busy || !selectedFile}
            className="ms-auto inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? "Importation..." : "Importer"}
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {contractsQuery.isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
      {contractsQuery.isError && (
        <p className="text-sm text-destructive">Impossible de charger les contrats.</p>
      )}
      {!contractsQuery.isLoading &&
        !contractsQuery.isError &&
        contractsQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noContracts")}</p>
        )}

      {contractsQuery.data?.map((contract) => (
        <article key={contract.id} className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">{contract.nomFichier}</h3>
            <span className="ms-auto rounded-full bg-muted px-2.5 py-0.5 text-xs">
              {contract.langue}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {contract.nombreCaracteres} caractères extraits
          </p>
          {contract.ocrNecessaire && (
            <p className="mt-2 text-sm text-amber-700">
              OCR nécessaire pour ce document scanné.
            </p>
          )}
          {openId === contract.id && (
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
              {texts[contract.id] ?? "Chargement..."}
            </pre>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void toggleText(contract)}
              className="rounded-md border border-input px-3 py-1.5 text-sm"
            >
              {openId === contract.id ? "Masquer le texte" : "Voir le texte extrait"}
            </button>
            <button
              type="button"
              onClick={() => void download(contract)}
              className="rounded-md border border-input px-3 py-1.5 text-sm"
            >
              Télécharger
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
