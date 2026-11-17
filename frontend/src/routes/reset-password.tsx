import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Droit-Facile" },
      { name: "description", content: "Réinitialisez votre mot de passe Droit-Facile." },
      { property: "og:title", content: "Nouveau mot de passe — Droit-Facile" },
      { property: "og:description", content: "Récupérez l’accès à votre compte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { l } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const marker =
      hash.get("type") === "recovery" || sessionStorage.getItem("df-recovery") === "true";
    if (marker) sessionStorage.setItem("df-recovery", "true");
    void supabase.auth.getUser().then(({ data }) => setRecovery(marker && !!data.user));
  }, []);
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-sm px-5 py-12">
        <h1 className="mb-8 text-3xl">
          {l({ fr: "Nouveau mot de passe", ar: "كلمة مرور جديدة" })}
        </h1>
        {done ? (
          <p role="status" className="text-success">
            {l({ fr: "Votre mot de passe a été modifié.", ar: "تم تغيير كلمة المرور." })}
          </p>
        ) : !recovery ? (
          <p className="text-muted-foreground">
            {l({
              fr: "Ouvrez le lien de réinitialisation reçu par e-mail. S’il a expiré, demandez un nouveau lien depuis la connexion.",
              ar: "افتح رابط إعادة التعيين الذي وصلك عبر البريد. إذا انتهت صلاحيته، اطلب رابطاً جديداً من صفحة الدخول.",
            })}
          </p>
        ) : (
          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              if (password !== confirmation) {
                setError(
                  l({
                    fr: "Les mots de passe ne correspondent pas.",
                    ar: "كلمتا المرور غير متطابقتين.",
                  }),
                );
                return;
              }
              setBusy(true);
              const { error } = await supabase.auth.updateUser({ password });
              setBusy(false);
              if (error)
                setError(
                  l({
                    fr: "Impossible de modifier le mot de passe. Essayez un mot de passe plus fort ou demandez un nouveau lien.",
                    ar: "تعذر تغيير كلمة المرور. جرّب كلمة أقوى أو اطلب رابطاً جديداً.",
                  }),
                );
              else {
                setDone(true);
                sessionStorage.removeItem("df-recovery");
              }
            }}
          >
            {[
              {
                label: l({ fr: "Nouveau mot de passe", ar: "كلمة مرور جديدة" }),
                value: password,
                set: setPassword,
              },
              {
                label: l({ fr: "Confirmer le mot de passe", ar: "تأكيد كلمة المرور" }),
                value: confirmation,
                set: setConfirmation,
              },
            ].map((field) => (
              <label key={field.label} className="block text-sm">
                {field.label}
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3"
                />
              </label>
            ))}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button disabled={busy} className="w-full">
              {l({ fr: "Enregistrer", ar: "حفظ" })}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
