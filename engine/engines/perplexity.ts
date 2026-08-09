/**
 * Perplexity adapter.
 *
 * Measures the sources Perplexity attaches to an answer, and which of those the
 * answer text actually references inline.
 *
 * We publish only the citation URLs and our derived counts. Answer prose is
 * parsed for reference markers and then discarded; it is never republished and
 * never influences a number.
 */

import { toDomain } from "../score";
import type { Citation, EngineAdapter, EngineDescriptor } from "../types";

const ENDPOINT = "https://api.perplexity.ai/chat/completions";
const MODEL = "sonar";

export const perplexityDescriptor: EngineDescriptor = {
  id: "perplexity-sonar",
  label: "Perplexity",
  model: MODEL,
  surface:
    "Perplexity's Sonar API. This is the same retrieval-and-answer pipeline behind Perplexity's consumer answers, queried programmatically. It is not a scrape of the consumer web interface.",
};

interface PerplexityResponse {
  choices?: Array<{ message?: { content?: string } }>;
  citations?: string[];
}

/**
 * Inline reference markers look like `[1]` or `[1][3]`. We collect the indices
 * the answer actually used so that "attached to the answer" and "referenced by
 * the answer" stay distinguishable.
 */
export function parseReferencedIndices(answer: string): Set<number> {
  const referenced = new Set<number>();
  for (const match of answer.matchAll(/\[(\d{1,3})\]/g)) {
    const index = Number.parseInt(match[1]!, 10);
    if (Number.isFinite(index) && index >= 1) referenced.add(index);
  }
  return referenced;
}

/** Node's fetch reports every transport failure as the string "fetch failed".
 *  The real reason is on `cause`, so unwrap it or every outage looks identical. */
function describeFetchError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error) return `${error.message}: ${cause.message}`;
  if (cause) return `${error.message}: ${String(cause)}`;
  return error.message;
}

export function createPerplexityAdapter(apiKey: string): EngineAdapter {
  return {
    descriptor: perplexityDescriptor,
    async ask(prompt: string): Promise<Citation[]> {
      let response: Response;
      try {
        response = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            // Deterministic as far as the API allows. The corpus prompt is sent
            // verbatim with no system prompt, so the measurement reflects the
            // engine's default behaviour rather than our steering of it.
            temperature: 0,
          }),
        });
      } catch (error) {
        throw new Error(`request failed: ${describeFetchError(error)}`);
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `http ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
        );
      }

      const payload = (await response.json()) as PerplexityResponse;
      const urls = payload.citations ?? [];
      if (urls.length === 0) {
        // No sources attached means we learned nothing about who gets cited.
        // Throwing marks the observation failed so it leaves the denominator
        // rather than scoring every domain as absent.
        throw new Error("no citations returned");
      }

      const answer = payload.choices?.[0]?.message?.content ?? "";
      const referenced = parseReferencedIndices(answer);

      const citations: Citation[] = [];
      urls.forEach((url, index) => {
        const domain = toDomain(url);
        if (!domain) return;
        const position = index + 1;
        citations.push({
          url,
          domain,
          position,
          inAnswer: referenced.has(position),
        });
      });
      return citations;
    },
  };
}

/** True when the answer exposed inline markers at all. When it did not, the
 *  in-answer metric is unobservable for that query rather than zero. */
export function hasReferenceMarkers(citations: Citation[]): boolean {
  return citations.some((citation) => citation.inAnswer);
}
