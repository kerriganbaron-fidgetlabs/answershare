/**
 * Measurement run.
 *
 * Sends every corpus query to every configured engine, records what came back,
 * and writes one immutable run file. Deriving the published numbers is a
 * separate step (`derive.ts`) so that the raw evidence can always be re-scored
 * without re-measuring.
 *
 *   npm run measure              full run
 *   npm run measure -- --limit 5 smoke test, five queries
 *   npm run measure -- --dry     print what would be sent, call nothing
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadCorpus, RUNS_DIR } from "./paths";
import { createPerplexityAdapter } from "./engines/perplexity";
import { PROBE_VERSION } from "./types";
import type { EngineAdapter, Observation, Run } from "./types";

/** Concurrent in-flight requests. Deliberately low: we are a guest on these
 *  APIs and a measurement project that hammers them deserves to be blocked. */
const CONCURRENCY = 4;
const MAX_ATTEMPTS = 3;

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : (process.argv[index + 1] ?? "");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function observe(
  adapter: EngineAdapter,
  queryId: string,
  prompt: string,
): Promise<Observation> {
  let lastError = "unknown";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const citations = await adapter.ask(prompt);
      return {
        queryId,
        engineId: adapter.descriptor.id,
        model: adapter.descriptor.model,
        measuredAt: new Date().toISOString(),
        status: "ok",
        referenceMarkersDetected: citations.some((c) => c.inAnswer),
        citations,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < MAX_ATTEMPTS) await sleep(1500 * attempt);
    }
  }
  // Rule 3. A measurement we failed to take leaves the denominator; it is
  // never recorded as "this domain was not cited".
  return {
    queryId,
    engineId: adapter.descriptor.id,
    model: adapter.descriptor.model,
    measuredAt: new Date().toISOString(),
    status: "failed",
    failureReason: lastError,
    referenceMarkersDetected: false,
    citations: [],
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]!, index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const corpus = await loadCorpus();
  const limit = Number.parseInt(arg("limit") ?? "", 10);
  const dry = process.argv.includes("--dry");

  const queries = Number.isFinite(limit)
    ? corpus.queries.slice(0, limit)
    : corpus.queries;

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey && !dry) {
    console.error("PERPLEXITY_API_KEY is not set. Nothing was measured.");
    process.exit(1);
  }

  const adapters: EngineAdapter[] = dry ? [] : [createPerplexityAdapter(apiKey!)];

  if (dry) {
    console.log(`corpus ${corpus.version}: ${queries.length} queries`);
    for (const query of queries) console.log(`  ${query.id}  ${query.prompt}`);
    return;
  }

  // The vantage point is part of the evidence. Results differ by network
  // location, so a run measured elsewhere must not be diffed against this one.
  const vantage = process.env.ANSWERSHARE_VANTAGE ?? "gha-ubuntu";
  const startedAt = new Date().toISOString();
  const jobs = adapters.flatMap((adapter) =>
    queries.map((query) => ({ adapter, query })),
  );

  console.log(
    `measuring ${queries.length} queries across ${adapters.length} engine(s) from ${vantage}`,
  );

  let done = 0;
  const observations = await mapWithConcurrency(jobs, CONCURRENCY, async (job) => {
    const observation = await observe(job.adapter, job.query.id, job.query.prompt);
    done += 1;
    const mark = observation.status === "ok" ? "ok " : "FAIL";
    console.log(
      `[${String(done).padStart(3)}/${jobs.length}] ${mark} ${job.query.id}` +
        (observation.status === "ok"
          ? ` (${observation.citations.length} sources)`
          : ` (${observation.failureReason})`),
    );
    return observation;
  });

  const failed = observations.filter((o) => o.status === "failed").length;
  const runId = startedAt.slice(0, 10);
  const run: Run = {
    runId,
    corpusVersion: corpus.version,
    probeVersion: PROBE_VERSION,
    vantage,
    startedAt,
    finishedAt: new Date().toISOString(),
    engines: adapters.map((a) => a.descriptor),
    observations,
    partial: failed > 0,
  };

  await mkdir(RUNS_DIR, { recursive: true });
  const file = path.join(RUNS_DIR, `${runId}.json`);
  await writeFile(file, `${JSON.stringify(run, null, 2)}\n`, "utf8");

  console.log(
    `\nwrote ${path.relative(process.cwd(), file)}: ` +
      `${observations.length - failed} observed, ${failed} failed` +
      (run.partial ? " (run marked partial)" : ""),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
