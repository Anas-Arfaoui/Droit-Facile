import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Upload } from "lucide-react";
import {
  deleteDocument,
  downloadDocument,
  listDocuments,
  uploadDocument,
} from "@/api/documents";

export function DocumentPanel({ dossierId }: { dossierId: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const documentsQuery = useQuery({
    queryKey: ["dossier-documents", dossierId],
    queryFn: () => listDocuments(dossierId),
  });

  async function upload() {
    if (!file || busy) return;

    setBusy(true);
    setError("");

    try {
      await uploadDocument(dossierId, file);
      setFile(null);
      await documentsQuery.refetch();
    } catch {
      setError("Impossible d'envoyer le document.");
    } finally {
      setBusy(false);
    }
  }

  async function download(id: number, name: string) {
    const blob = await downloadDocument(id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = name;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function remove(id: number) {
    await deleteDocument(id);
    await documentsQuery.refetch();
  }

  return (
    <section className="mt-6 max-w-3xl space-y-4">
      <h2 className="text-xl">Documents partagés</h2>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            disabled={!file || busy}
            onClick={() => void upload()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Envoyer
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {documentsQuery.isLoading && <p>Chargement...</p>}

      {documentsQuery.data?.map((document) => (
        <article
          key={document.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
        >
          <FileText className="h-5 w-5" />

          <div className="flex-1">
            <p className="font-medium">{document.nomFichier}</p>
            <p className="text-xs text-muted-foreground">
              Envoyé par {document.envoyeurNom}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void download(document.id, document.nomFichier)}
            className="text-sm underline"
          >
            Télécharger
          </button>

          <button
            type="button"
            onClick={() => void remove(document.id)}
            className="text-sm text-destructive"
          >
            Supprimer
          </button>
        </article>
      ))}
    </section>
  );
}