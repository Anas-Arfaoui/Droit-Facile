import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { registerAccount } from "@/lib/auth-actions";
import { loginUser, Role } from "@/api/auth";
import { ApiError } from "@/api/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Droit-Facile" },
      {
        name: "description",
        content: "Connectez-vous à votre compte Droit-Facile ou créez votre profil.",
      },
      { property: "og:title", content: "Connexion — Droit-Facile" },
      { property: "og:description", content: "Accédez à votre compte Droit-Facile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { l } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("CLIENT");
  const [avocatNom, setAvocatNom] = useState("");
  const [avocatId, setAvocatId] = useState("");
  const [officialRecords, setOfficialRecords] = useState("");
  const [correspondenceRecords, setCorrespondenceRecords] = useState("");
  const [numeroAffaire, setNumeroAffaire] = useState("");
  const [contractFile, setContractFile] = useState<File | undefined>();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (user) void navigate({ to: "/", replace: true });
  }, [user, navigate]);
  const changeMode = (next: typeof mode) => {
    setMode(next);
    setError("");
    setMessage("");
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        const outcome = await registerAccount(email, password, name, window.location.origin, role, {
          ...(avocatNom.trim() ? { avocatNom: avocatNom.trim() } : {}),
          ...(avocatId ? { avocatId: Number(avocatId) } : {}),
          ...(officialRecords.trim() ? { officialRecords: officialRecords.trim() } : {}),
          ...(correspondenceRecords.trim() ? { correspondenceRecords: correspondenceRecords.trim() } : {}),
          ...(numeroAffaire.trim() ? { numeroAffaire: numeroAffaire.trim() } : {}),
          ...(contractFile ? { contractFile } : {}),
        });
        if (outcome === "pending-review")
          setMessage(
            l({
              fr: "Votre demande a été envoyée. Un administrateur doit vérifier vos informations avant l'activation du compte.",
              ar: "تحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول.",
            }),
          );
      } else if (mode === "forgot") {
        setError(
          l({
            fr: "La réinitialisation du mot de passe sera disponible prochainement.",
            ar: "ستتوفر إعادة تعيين كلمة المرور قريبًا.",
          }),
        );
        return;
      } else {
        await loginUser({
          email,
          motDePasse: password,
        });
      }
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? err.code : "";
      if (err instanceof ApiError) {
        setError(err.message);
        return;
      }
      setError(
        code === "email_not_confirmed"
          ? l({
              fr: "Confirmez votre adresse e-mail avant de vous connecter.",
              ar: "أكد بريدك الإلكتروني قبل تسجيل الدخول.",
            })
          : mode === "login"
            ? l({
                fr: "Connexion impossible. Vérifiez votre e-mail et votre mot de passe.",
                ar: "تعذر الدخول. تحقق من بريدك وكلمة المرور.",
              })
            : l({
                fr: "La demande a échoué. Vérifiez les informations et réessayez dans quelques instants.",
                ar: "تعذر إتمام الطلب. تحقق من المعلومات وحاول لاحقاً.",
              }),
      );
    } finally {
      setBusy(false);
    }
  }
  const title =
    mode === "signup"
      ? l({ fr: "Créer un compte", ar: "إنشاء حساب" })
      : mode === "forgot"
        ? l({ fr: "Mot de passe oublié", ar: "نسيت كلمة المرور" })
        : l({ fr: "Connexion", ar: "تسجيل الدخول" });
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-sm px-5 py-12 sm:py-16">
        <LockKeyhole className="mb-5 h-8 w-8 text-primary" />
        <p className="mb-2 font-serif text-xl text-primary">
          {l({ fr: "Droit-Facile", ar: "القانون الميسّر" })}
        </p>
        <h1 className="mb-8 text-3xl">{title}</h1>
        {mode !== "forgot" && (
          <>
            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {l({ fr: "ou par e-mail", ar: "أو بالبريد الإلكتروني" })}
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
        <form onSubmit={submit} className="space-y-5">
          {mode === "signup" && (
            <label className="block text-sm font-medium">
              {l({ fr: "Nom complet", ar: "الاسم الكامل" })}
              <input
                required
                autoComplete="name"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          )}
          {mode === "signup" && (
            <label className="block text-sm font-medium">
              Rôle
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3"
              >
                <option value="CLIENT">Client</option>
                <option value="AVOCAT">Avocat</option>
              </select>
            </label>
          )}
          {mode === "signup" && role === "AVOCAT" && (
            <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold">Vérification professionnelle</p>
              <label className="block text-sm font-medium">Documents officiels
                <input required value={officialRecords} onChange={(event) => setOfficialRecords(event.target.value)} placeholder="Ex. numéro d'inscription au barreau" className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3" />
              </label>
              <label className="block text-sm font-medium">Documents de correspondance
                <input required value={correspondenceRecords} onChange={(event) => setCorrespondenceRecords(event.target.value)} placeholder="Ex. adresse professionnelle ou justificatif" className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3" />
              </label>
            </div>
          )}
          {mode === "signup" && role === "CLIENT" && (
            <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold">Informations du dossier</p>
              <label className="block text-sm font-medium">Nom de votre avocat
                <input required value={avocatNom} onChange={(event) => setAvocatNom(event.target.value)} placeholder="Nom complet de l'avocat" className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3" />
              </label>
              <label className="block text-sm font-medium">ID de l'avocat
                <input required type="number" min="1" value={avocatId} onChange={(event) => setAvocatId(event.target.value)} placeholder="ID communiqué par votre avocat" className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3" />
              </label>
              <label className="block text-sm font-medium">Numéro d'affaire <span className="font-normal text-muted-foreground">(ou contrat ci-dessous)</span>
                <input value={numeroAffaire} onChange={(event) => setNumeroAffaire(event.target.value)} placeholder="Ex. AFF-2026-001" className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3" />
              </label>
              <label className="block text-sm font-medium">Contrats et accords
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(event) => setContractFile(event.target.files?.[0])} className="mt-2 block w-full text-sm" />
                <span className="mt-1 block text-xs font-normal text-muted-foreground">Fournissez un fichier si vous n'avez pas encore le numéro d'affaire.</span>
              </label>
            </div>
          )}
          <label className="block text-sm font-medium">
            {l({ fr: "Adresse e-mail", ar: "البريد الإلكتروني" })}
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          {mode !== "forgot" && (
            <label className="block text-sm font-medium">
              {l({ fr: "Mot de passe", ar: "كلمة المرور" })}
              <div className="relative mt-2">
                <input
                  required
                  type={visible ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-card ps-3 pe-12 outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1"
                  aria-label={l(
                    visible
                      ? { fr: "Masquer le mot de passe", ar: "إخفاء كلمة المرور" }
                      : { fr: "Afficher le mot de passe", ar: "إظهار كلمة المرور" },
                  )}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </label>
          )}
          {mode === "login" && (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => changeMode("forgot")}
            >
              {l({ fr: "Mot de passe oublié ?", ar: "نسيت كلمة المرور؟" })}
            </Button>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-success">
              {message}
            </p>
          )}
          <Button className="h-11 w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === "forgot"
              ? l({ fr: "Envoyer le lien", ar: "إرسال الرابط" })
              : mode === "signup"
                ? title
                : l({ fr: "Se connecter", ar: "دخول" })}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Button variant="link" onClick={() => changeMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? (
              l({ fr: "Créer un compte", ar: "إنشاء حساب" })
            ) : (
              <>
                <ArrowLeft className="rtl:rotate-180" />
                {l({ fr: "Retour à la connexion", ar: "العودة إلى تسجيل الدخول" })}
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
