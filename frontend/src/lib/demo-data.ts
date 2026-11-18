import type { L } from "./i18n";

export type Level = "ok" | "warn" | "risk";
export type Clause = { title: L; level: Level; excerpt: L; note: L; law: string };
export type Dossier = {
  id: string;
  token: string;
  client: string;
  title: L;
  status: L;
  step: number;
  updated: string;
  contract: string;
};

export const steps: L[] = [
  { fr: "Dossier ouvert", ar: "فتح الملف" },
  { fr: "Contrat reçu", ar: "استلام العقد" },
  { fr: "Analyse par l'avocat", ar: "دراسة المحامي" },
  { fr: "Avis rendu", ar: "إبداء الرأي" },
];

export const dossiers: Dossier[] = [
  {
    id: "D-2026-014",
    token: "k7f2-a91c",
    client: "Sami Trabelsi",
    title: { fr: "CDI — Ingénieur logiciel", ar: "عقد غير محدد المدة — مهندس برمجيات" },
    status: { fr: "Analyse en cours", ar: "قيد الدراسة" },
    step: 2,
    updated: "28/10/2026",
    contract: "contrat_trabelsi_cdi.pdf",
  },
  {
    id: "D-2026-013",
    token: "p3d8-77ee",
    client: "Leila Mansour",
    title: { fr: "CDD — Assistante commerciale", ar: "عقد محدد المدة — مساعدة تجارية" },
    status: { fr: "Contrat reçu", ar: "تم استلام العقد" },
    step: 1,
    updated: "26/10/2026",
    contract: "cdd_mansour.pdf",
  },
  {
    id: "D-2026-011",
    token: "z1q4-0b6d",
    client: "Société Olea SARL",
    title: { fr: "Clause de non-concurrence", ar: "شرط عدم المنافسة" },
    status: { fr: "Avis rendu", ar: "تم إبداء الرأي" },
    step: 3,
    updated: "19/10/2026",
    contract: "olea_contrat_cadre.pdf",
  },
  {
    id: "D-2026-009",
    token: "m8r5-c2aa",
    client: "Youssef Gharbi",
    title: { fr: "Rupture abusive — CDI", ar: "طرد تعسفي — عقد غير محدد المدة" },
    status: { fr: "Dossier ouvert", ar: "ملف مفتوح" },
    step: 0,
    updated: "12/10/2026",
    contract: "",
  },
];

export const clauses: Clause[] = [
  {
    title: { fr: "Type et durée", ar: "النوع والمدة" },
    level: "ok",
    excerpt: {
      fr: "« Le présent contrat est conclu pour une durée indéterminée. »",
      ar: "« أبرم هذا العقد لمدة غير محددة. »",
    },
    note: { fr: "CDI clairement identifié.", ar: "عقد غير محدد المدة بوضوح." },
    law: "Code du travail, art. 6-2",
  },
  {
    title: { fr: "Période d'essai", ar: "فترة التجربة" },
    level: "risk",
    excerpt: {
      fr: "« Période d'essai de 12 mois renouvelable. »",
      ar: "« فترة تجربة 12 شهراً قابلة للتجديد. »",
    },
    note: {
      fr: "Durée excessive : à ramener à 6 mois, renouvelable une fois.",
      ar: "مدة مفرطة: يجب تخفيضها إلى 6 أشهر قابلة للتجديد مرة واحدة.",
    },
    law: "Code du travail, art. 18",
  },
  {
    title: { fr: "Rémunération", ar: "الأجر" },
    level: "ok",
    excerpt: {
      fr: "« Salaire brut mensuel de 3 200 TND. »",
      ar: "« أجر شهري خام قدره 3200 دينار. »",
    },
    note: { fr: "Supérieur au SMIG, montant précis.", ar: "أعلى من الأجر الأدنى، والمبلغ محدد." },
    law: "Code du travail, art. 134-2",
  },
  {
    title: { fr: "Horaires de travail", ar: "ساعات العمل" },
    level: "warn",
    excerpt: {
      fr: "« Horaires selon les besoins du service. »",
      ar: "« ساعات العمل حسب حاجة المصلحة. »",
    },
    note: {
      fr: "Clause floue : préciser la durée hebdomadaire (48 h max).",
      ar: "بند غامض: يجب تحديد المدة الأسبوعية (48 ساعة كحد أقصى).",
    },
    law: "Code du travail, art. 79",
  },
  {
    title: { fr: "Préavis et rupture", ar: "الإعلام المسبق والإنهاء" },
    level: "warn",
    excerpt: {
      fr: "« Préavis de 15 jours pour l'employé. »",
      ar: "« إعلام مسبق بـ15 يوماً للأجير. »",
    },
    note: {
      fr: "Préavis non réciproque, à harmoniser (1 mois).",
      ar: "إعلام غير متبادل، يجب توحيده (شهر واحد).",
    },
    law: "Code du travail, art. 14",
  },
  {
    title: { fr: "Non-concurrence", ar: "عدم المنافسة" },
    level: "risk",
    excerpt: {
      fr: "« Interdiction d'exercer dans le secteur pendant 5 ans, sans contrepartie. »",
      ar: "« منع العمل في القطاع لمدة 5 سنوات دون مقابل. »",
    },
    note: {
      fr: "Durée excessive et absence de contrepartie financière.",
      ar: "مدة مفرطة وغياب المقابل المالي.",
    },
    law: "Code des obligations et des contrats, art. 1-2",
  },
  {
    title: { fr: "Confidentialité", ar: "السرية" },
    level: "ok",
    excerpt: {
      fr: "« Le salarié s'engage à ne divulguer aucune information… »",
      ar: "« يلتزم الأجير بعدم إفشاء أي معلومة… »",
    },
    note: { fr: "Clause standard et proportionnée.", ar: "بند عادي ومتناسب." },
    law: "—",
  },
  {
    title: { fr: "Tribunal compétent", ar: "المحكمة المختصة" },
    level: "ok",
    excerpt: { fr: "« Conseil de prud'hommes de Tunis. »", ar: "« دائرة الشغل بتونس. »" },
    note: { fr: "Conforme.", ar: "مطابق." },
    law: "Code du travail, art. 183",
  },
];

export const summary: L = {
  fr: "Contrat CDI d'ingénieur logiciel, rémunération conforme. Deux points à risque : période d'essai de 12 mois (illégale, max. 6 mois renouvelable une fois) et non-concurrence de 5 ans sans contrepartie. Deux clauses à préciser : horaires et préavis. Recommandation : négocier un avenant avant signature.",
  ar: "عقد شغل غير محدد المدة لمهندس برمجيات، والأجر مطابق. نقطتان خطيرتان: فترة تجربة 12 شهراً (مخالفة للقانون، الحد الأقصى 6 أشهر قابلة للتجديد مرة) وشرط عدم منافسة لمدة 5 سنوات دون مقابل. بندان يجب توضيحهما: ساعات العمل والإعلام المسبق. التوصية: التفاوض على ملحق قبل الإمضاء.",
};

export type Answer = { text: L; source: L };
export const cannedAnswers: { keys: string[]; a: Answer }[] = [
  {
    keys: ["essai", "تجربة"],
    a: {
      text: {
        fr: "La période d'essai prévue (12 mois) dépasse le maximum légal de 6 mois, renouvelable une seule fois.",
        ar: "فترة التجربة المنصوص عليها (12 شهراً) تتجاوز الحد القانوني وهو 6 أشهر قابلة للتجديد مرة واحدة.",
      },
      source: {
        fr: "Code du travail, art. 18 · Contrat, art. 3",
        ar: "مجلة الشغل، الفصل 18 · العقد، الفصل 3",
      },
    },
  },
  {
    keys: ["concurrence", "منافسة"],
    a: {
      text: {
        fr: "Une clause de non-concurrence doit être limitée dans le temps et l'espace, et prévoir une contrepartie. Celle-ci (5 ans, sans contrepartie) est contestable.",
        ar: "يجب أن يكون شرط عدم المنافسة محدوداً زمنياً ومكانياً مع مقابل. هذا الشرط (5 سنوات دون مقابل) قابل للطعن.",
      },
      source: {
        fr: "Contrat, art. 9 · Jurisprudence Cass. 2019",
        ar: "العقد، الفصل 9 · فقه قضاء التعقيب 2019",
      },
    },
  },
];
export const fallbackAnswer: Answer = {
  text: {
    fr: "D'après le contrat, la rémunération est de 3 200 TND brut par mois, versée en fin de mois.",
    ar: "حسب العقد، الأجر 3200 دينار خام شهرياً، يصرف في آخر الشهر.",
  },
  source: { fr: "Contrat, art. 5", ar: "العقد، الفصل 5" },
};
