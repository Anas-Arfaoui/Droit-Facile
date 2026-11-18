import { createFileRoute } from "@tanstack/react-router";

import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      {
        title: "Réinitialisation du mot de passe — Droit-Facile",
      },
      {
        name: "description",
        content: "Réinitialisation du mot de passe.",
      },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { l } = useI18n();

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-sm px-5 py-12">
        <h1 className="mb-6 text-3xl">
          {l({
            fr: "Réinitialisation du mot de passe",
            ar: "إعادة تعيين كلمة المرور",
          })}
        </h1>

        <p className="text-muted-foreground">
          {l({
            fr: "Cette fonctionnalité sera disponible prochainement.",
            ar: "ستتوفر هذه الميزة قريبًا.",
          })}
        </p>
      </main>
    </div>
  );
}
