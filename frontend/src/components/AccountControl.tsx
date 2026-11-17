import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { signOutAccount } from "@/lib/auth-actions";
import { supabase } from "@/integrations/client";
import { useI18n } from "@/lib/i18n";

export function AccountControl() {
  const { user, loading } = useAuth();
  const { l } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
  if (loading) return <span className="h-9 w-9" />;
  if (!user)
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
  const signOut = async () => {
    setBusy(true);
    setError("");
    try {
      await signOutAccount(queryClient);
      setOpen(false);
      await navigate({ to: "/auth", replace: true });
    } catch {
      setError(
        l({ fr: "La déconnexion a échoué. Réessayez.", ar: "تعذر تسجيل الخروج. حاول مجدداً." }),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        variant="ghost"
        aria-label={l({ fr: "Mon profil", ar: "ملفي الشخصي" })}
        onClick={() => {
          setName(profile.data?.display_name ?? "");
          setError("");
          setOpen(true);
        }}
        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <UserRound />
        <span className="hidden max-w-32 truncate sm:inline">
          {profile.data?.display_name || l({ fr: "Mon compte", ar: "حسابي" })}
        </span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{l({ fr: "Mon profil", ar: "ملفي الشخصي" })}</DialogTitle>
          </DialogHeader>
          <p className="break-all text-sm text-muted-foreground" dir="ltr">
            {user.email}
          </p>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError("");
              const { error } = await supabase
                .from("profiles")
                .update({ display_name: name.trim() })
                .eq("id", user.id);
              setBusy(false);
              if (error)
                setError(
                  l({ fr: "Impossible de sauvegarder le profil.", ar: "تعذر حفظ الملف الشخصي." }),
                );
              else {
                await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
                setOpen(false);
              }
            }}
          >
            <label className="block text-sm">
              {l({ fr: "Nom complet", ar: "الاسم الكامل" })}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-between gap-3">
              <Button type="button" variant="outline" disabled={busy} onClick={signOut}>
                <LogOut />
                {l({ fr: "Se déconnecter", ar: "تسجيل الخروج" })}
              </Button>
              <Button disabled={busy}>{l({ fr: "Enregistrer", ar: "حفظ" })}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
