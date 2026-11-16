"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

// Server-side provider boundary for the AI Learning Hub. The gateway is
// OpenAI-compatible and is reached with the deployment's integration key, so
// the key never reaches the browser. Callers must treat a null response as
// "provider unavailable" and fall back to their own deterministic answer.
const DEFAULT_BASE_URL = "https://integrations.vly.ai/v1/llm";
const DEFAULT_MODEL = "gpt-4o-mini";

export const complete = internalAction({
  args: {
    system: v.string(),
    prompt: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const key = process.env.VLY_INTEGRATION_KEY;
    if (!key) {
      console.warn("[study-ai] VLY_INTEGRATION_KEY is not set; using the local engine.");
      return { text: null as string | null, model: null as string | null };
    }

    const base = (process.env.VLY_LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
    const model = process.env.STUDY_AI_MODEL || DEFAULT_MODEL;

    try {
      const response = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: args.system },
            { role: "user", content: args.prompt },
          ],
          temperature: args.temperature ?? 0.4,
          max_tokens: args.maxTokens ?? 800,
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (!response.ok) {
        // Never log the request: it carries the Authorization header.
        console.warn(`[study-ai] gateway returned HTTP ${response.status}; using the local engine.`);
        return { text: null as string | null, model: null as string | null };
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const raw = payload.choices?.[0]?.message?.content;
      const text = typeof raw === "string" ? raw.trim() : "";
      if (!text) {
        console.warn("[study-ai] gateway returned an empty completion; using the local engine.");
        return { text: null as string | null, model: null as string | null };
      }

      return { text, model };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[study-ai] request failed (${message}); using the local engine.`);
      return { text: null as string | null, model: null as string | null };
    }
  },
});
