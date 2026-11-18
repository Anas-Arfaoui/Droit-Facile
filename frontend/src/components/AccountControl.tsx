import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { signOutAccount } from "@/lib/auth-actions";
import { useI18n } from "@/lib/i18n";

export function AccountControl() {
  const { user, loading } = useAuth();
  const { l } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return <span className="h-9 w-9" />;
  }

  if (!user) {
    return (
      <Button
        asChild
        variant="ghost"
        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <Link to="/auth">
          <LogIn />
          <span className="hidden sm:inline">{l({ fr: "Connexion", ar: "تسجيل الدخول" })}</span>
        </Link>
      </Button>
    );
  }

  async function signOut() {
    setBusy(true);
    setError("");

    try {
      await signOutAccount(queryClient);
      setOpen(false);
      await navigate({ to: "/auth", replace: true });
    } catch {
      setError(
        l({
          fr: "La déconnexion a échoué. Réessayez.",
          ar: "تعذر تسجيل الخروج. حاول مجددًا.",
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        aria-label={l({ fr: "Mon profil", ar: "ملفي الشخصي" })}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <UserRound />
        <span className="hidden max-w-32 truncate sm:inline">{user.nom}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{l({ fr: "Mon profil", ar: "ملفي الشخصي" })}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="break-all text-sm text-muted-foreground" dir="ltr">
              {user.email}
            </p>

            <p className="text-sm">
              <span className="font-medium">{l({ fr: "Nom", ar: "الاسم" })}:</span> {user.nom}
            </p>

            <p className="text-sm">
              <span className="font-medium">{l({ fr: "Rôle", ar: "الدور" })}:</span> {user.role}
            </p>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="button" variant="outline" disabled={busy} onClick={signOut}>
              <LogOut />
              {l({ fr: "Se déconnecter", ar: "تسجيل الخروج" })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
