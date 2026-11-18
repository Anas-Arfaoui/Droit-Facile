import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const summarizeContract = createServerFn({ method: "POST" })
  .validator((input: { name: string; text: string; lang: "fr" | "ar" }) => {
    if (!input.text?.trim()) throw new Error("Texte du contrat vide");
    return {
      name: String(input.name).slice(0, 200),
      text: String(input.text).slice(0, 60000),
      lang: input.lang === "ar" ? "ar" : "fr",
    } as const;
  })
  .handler(async ({ data }) => {
    const key = process.env["AI_API_KEY"];
    if (!key) return { error: "Configuration IA manquante." };
    let runId: string | undefined;
    const openai = createOpenAI({
      baseURL: process.env["AI_BASE_URL"] ?? "https://api.openai.com/v1",
      apiKey: key,
      headers: { "X-AIG-SDK": "vercel-ai-sdk" },
      fetch: async (input, init) => {
        const h = new Headers(init?.headers);
        if (runId) h.set("X-AIG-Run-ID", runId);
        const r = await fetch(input, { ...init, headers: h });
        runId ??= r.headers.get("X-AIG-Run-ID") ?? undefined;
        return r;
      },
    });
    let failure: unknown;
    try {
      const result = streamText({
        model: openai.responses("openai/gpt-6-astra"),
        maxRetries: 0,
        system:
          (data.lang === "ar" ? "اكتب بالعربية. " : "Rédige en français. ") +
          "Tu aides un avocat. Résume le contrat en 4 à 6 phrases courtes : nature du contrat, parties, durée, rémunération, et les clauses qui semblent problématiques. Pas de conseil définitif : c'est un brouillon que l'avocat validera. Texte brut, sans titres ni listes.",
        prompt: `Contrat « ${data.name} » :\n\n${data.text}`,
        onError: ({ error }) => {
          failure = error;
        },
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const text = (await result.text).trim();
      if (failure || !text) throw failure ?? new Error("empty");
      return { summary: text };
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      console.error("summarizeContract failed", status, e);
      if (status === 402)
        return { error: "Crédits IA épuisés. Ajoutez des crédits pour continuer." };
      if (status === 429) return { error: "Trop de demandes, réessayez dans un instant." };
      return { error: "Le résumé n'a pas pu être généré." };
    }
  });
