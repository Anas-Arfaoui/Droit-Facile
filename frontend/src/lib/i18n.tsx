import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "ar";
export type L = { fr: string; ar: string };

const dict = {
  app: { fr: "Droit-Facile", ar: "القانون الميسّر" },
  tagline: { fr: "Cabinet Ben Salah & Associés", ar: "مكتب بن صالح وشركاؤه" },
  dossiers: { fr: "Dossiers", ar: "الملفات" },
  newDossier: { fr: "Nouveau dossier", ar: "ملف جديد" },
  search: { fr: "Rechercher un client ou un dossier…", ar: "ابحث عن حريف أو ملف…" },
  client: { fr: "Client", ar: "الحريف" },
  status: { fr: "État", ar: "الحالة" },
  updated: { fr: "Mis à jour", ar: "آخر تحديث" },
  open: { fr: "Ouvrir", ar: "فتح" },
  ruleBanner: {
    fr: "L'IA aide, l'avocat décide. Toute réponse de l'IA est un brouillon.",
    ar: "الذكاء الاصطناعي يساعد، والمحامي يقرّر. كل إجابة هي مسودة.",
  },
  analysis: { fr: "Analyse du contrat", ar: "تحليل العقد" },
  chat: { fr: "Assistant", ar: "المساعد" },
  summary: { fr: "Résumé", ar: "الملخّص" },
  sharing: { fr: "Partage client", ar: "مشاركة مع الحريف" },
  upload: { fr: "Importer un contrat de travail", ar: "استيراد عقد شغل" },
  analyze: { fr: "Lancer l'analyse IA", ar: "إطلاق التحليل" },
  analyzing: { fr: "Analyse en cours…", ar: "جارٍ التحليل…" },
  draft: { fr: "Brouillon IA", ar: "مسودة آلية" },
  validated: { fr: "Validé par l'avocat", ar: "مصادق عليه من المحامي" },
  validate: { fr: "Valider le résumé", ar: "المصادقة على الملخّص" },
  exportPdf: { fr: "Exporter en PDF", ar: "تصدير PDF" },
  ask: { fr: "Posez une question…", ar: "اطرح سؤالا…" },
  send: { fr: "Envoyer", ar: "إرسال" },
  source: { fr: "Source", ar: "المصدر" },
  ok: { fr: "Conforme", ar: "مطابق" },
  warn: { fr: "À vérifier", ar: "للتثبت" },
  risk: { fr: "Risque", ar: "خطر" },
  shareLink: { fr: "Lien sécurisé du client", ar: "رابط آمن للحريف" },
  shareSummary: { fr: "Partager le résumé validé", ar: "مشاركة الملخّص المصادق عليه" },
  needValidate: {
    fr: "Validez d'abord le résumé pour pouvoir le partager.",
    ar: "صادق على الملخّص أولاً لتتمكن من مشاركته.",
  },
  viewClient: { fr: "Voir la page client", ar: "عرض صفحة الحريف" },
  timeline: { fr: "Suivi du dossier", ar: "متابعة الملف" },
  sharedDocs: { fr: "Documents partagés", ar: "الوثائق المشاركة" },
  nothingShared: {
    fr: "Aucun document partagé pour l'instant.",
    ar: "لا توجد وثائق مشاركة حالياً.",
  },
  clientHello: { fr: "Bonjour", ar: "مرحباً" },
  demo: { fr: "Démo — données fictives", ar: "عرض تجريبي — بيانات وهمية" },
  contracts: { fr: "Contrats du dossier", ar: "عقود الملف" },
  addContract: { fr: "Ajouter un contrat", ar: "إضافة عقد" },
  contractName: { fr: "Nom du contrat", ar: "اسم العقد" },
  contractText: {
    fr: "Collez le texte du contrat ou importez un fichier .txt",
    ar: "الصق نص العقد أو استورد ملف ‎.txt",
  },
  generate: { fr: "Ajouter et résumer", ar: "إضافة وتلخيص" },
  summarizing: { fr: "Rédaction du résumé…", ar: "جارٍ كتابة الملخّص…" },
  noContracts: { fr: "Aucun nouveau contrat ajouté.", ar: "لم تتم إضافة أي عقد جديد." },
  edit: { fr: "Modifier", ar: "تعديل" },
  save: { fr: "Enregistrer", ar: "حفظ" },
  share: { fr: "Partager avec le client", ar: "مشاركة مع الحريف" },
  back: { fr: "Retour", ar: "رجوع" },
} satisfies Record<string, L>;

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: keyof typeof dict) => string;
  l: (v: L) => string;
};
const I18n = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  useEffect(() => {
    const s = localStorage.getItem("df-lang");
    if (s === "ar" || s === "fr") setLang(s);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("df-lang", lang);
  }, [lang]);
  return (
    <I18n.Provider value={{ lang, setLang, t: (k) => dict[k][lang], l: (v) => v[lang] }}>
      {children}
    </I18n.Provider>
  );
}

export function useI18n() {
  const c = useContext(I18n);
  if (!c) throw new Error("I18nProvider missing");
  return c;
}
