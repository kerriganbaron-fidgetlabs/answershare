/**
 * Derive the published dataset from the raw runs.
 *
 * Every file written here is a pure function of `data/runs/*.json` plus the
 * corpus. Delete `data/derived` and re-run and you get byte-identical output,
 * which is what lets anyone check our numbers against our evidence.
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { computeChanges, computeShares, type Metric } from "./score";
import { DERIVED_DIR, loadCorpus, loadRuns } from "./paths";
import type {
  CategoryDescriptor,
  Corpus,
  DomainCategoryShare,
  EngineDescriptor,
  Run,
} from "./types";

const METRICS: Metric[] = ["in-answer", "attached"];

export interface LeaderboardRow {
  domain: string;
  share: number | null;
  weightedShare: number | null;
  citedQueries: number;
  observedQueries: number;
}

export interface CategoryPage {
  category: CategoryDescriptor;
  engines: EngineDescriptor[];
  /** metric -> engineId -> ranked rows */
  leaderboards: Record<string, Record<string, LeaderboardRow[]>>;
  queries: Array<{ id: string; title: string; prompt: string }>;
  updatedAt: string;
}

export interface QueryPage {
  query: { id: string; title: string; prompt: string; categoryId: string };
  category: CategoryDescriptor;
  latest: Array<{
    engine: EngineDescriptor;
    measuredAt: string;
    status: string;
    failureReason?: string;
    citations: Array<{ url: string; domain: string; position: number; inAnswer: boolean }>;
  }>;
  updatedAt: string;
}

export interface DomainPage {
  domain: string;
  categories: Array<{
    category: CategoryDescriptor;
    engineId: string;
    metric: Metric;
    share: number | null;
    weightedShare: number | null;
    citedQueries: number;
    observedQueries: number;
  }>;
  citedIn: Array<{ queryId: string; title: string; categoryId: string; position: number; inAnswer: boolean }>;
  updatedAt: string;
}

function toRows(shares: DomainCategoryShare[]): LeaderboardRow[] {
  return shares.map((s) => ({
    domain: s.domain,
    share: s.share,
    weightedShare: s.weightedShare,
    citedQueries: s.citedQueries,
    observedQueries: s.observedQueries,
  }));
}

async function writeJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildCategoryPages(
  corpus: Corpus,
  runs: Run[],
  engines: EngineDescriptor[],
  updatedAt: string,
): CategoryPage[] {
  const byMetric = new Map<Metric, DomainCategoryShare[]>(
    METRICS.map((metric) => [metric, computeShares({ runs, corpus, metric })]),
  );

  return corpus.categories.map((category) => {
    const leaderboards: Record<string, Record<string, LeaderboardRow[]>> = {};
    for (const metric of METRICS) {
      leaderboards[metric] = {};
      for (const engine of engines) {
        const rows = toRows(
          byMetric
            .get(metric)!
            .filter((s) => s.categoryId === category.id && s.engineId === engine.id),
        );
        leaderboards[metric]![engine.id] = rows;
      }
    }
    return {
      category,
      engines,
      leaderboards,
      queries: corpus.queries
        .filter((q) => q.categoryId === category.id)
        .map((q) => ({ id: q.id, title: q.title, prompt: q.prompt })),
      updatedAt,
    };
  });
}

async function main() {
  const [corpus, runs] = await Promise.all([loadCorpus(), loadRuns()]);
  if (runs.length === 0) {
    console.error("No runs found in data/runs. Run `npm run measure` first.");
    process.exit(1);
  }

  const latestRun = runs[runs.length - 1]!;
  const previousRun = runs.length > 1 ? runs[runs.length - 2] : undefined;
  const updatedAt = latestRun.finishedAt;

  // Engines are taken from the runs, not from code, so the published data always
  // describes what was actually measured.
  const engines = new Map<string, EngineDescriptor>();
  for (const run of runs) for (const e of run.engines) engines.set(e.id, e);
  const engineList = [...engines.values()];

  await rm(DERIVED_DIR, { recursive: true, force: true });

  const categoryPages = buildCategoryPages(corpus, runs, engineList, updatedAt);
  for (const page of categoryPages) {
    await writeJson(path.join(DERIVED_DIR, "categories", `${page.category.id}.json`), page);
  }

  // Per-query pages carry the raw citations so every claim on the site links
  // back to the evidence that produced it.
  const categoryById = new Map(corpus.categories.map((c) => [c.id, c]));
  const latestObservation = new Map<string, (typeof latestRun.observations)[number]>();
  for (const run of runs) {
    for (const observation of run.observations) {
      const key = `${observation.queryId} ${observation.engineId}`;
      const existing = latestObservation.get(key);
      if (!existing || observation.measuredAt >= existing.measuredAt) {
        latestObservation.set(key, observation);
      }
    }
  }

  for (const query of corpus.queries) {
    const category = categoryById.get(query.categoryId);
    if (!category) continue;
    const latest = engineList
      .map((engine) => {
        const observation = latestObservation.get(`${query.id} ${engine.id}`);
        if (!observation) return null;
        return {
          engine,
          measuredAt: observation.measuredAt,
          status: observation.status,
          ...(observation.failureReason ? { failureReason: observation.failureReason } : {}),
          citations: observation.citations,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const page: QueryPage = {
      query: { id: query.id, title: query.title, prompt: query.prompt, categoryId: query.categoryId },
      category,
      latest,
      updatedAt,
    };
    await writeJson(path.join(DERIVED_DIR, "queries", `${query.id}.json`), page);
  }

  // Domain pages. Only domains that were actually cited get one, so we never
  // publish an empty page asserting a domain has zero visibility.
  const allShares = METRICS.flatMap((metric) =>
    computeShares({ runs, corpus, metric }).map((s) => ({ ...s, metric })),
  );
  const domains = [...new Set(allShares.map((s) => s.domain))].sort();

  const queryById = new Map(corpus.queries.map((q) => [q.id, q]));
  for (const domain of domains) {
    const citedIn: DomainPage["citedIn"] = [];
    for (const observation of latestObservation.values()) {
      if (observation.status !== "ok") continue;
      const query = queryById.get(observation.queryId);
      if (!query) continue;
      const hit = observation.citations
        .filter((c) => c.domain === domain)
        .sort((a, b) => a.position - b.position)[0];
      if (!hit) continue;
      citedIn.push({
        queryId: query.id,
        title: query.title,
        categoryId: query.categoryId,
        position: hit.position,
        inAnswer: hit.inAnswer,
      });
    }
    citedIn.sort((a, b) => a.position - b.position || a.queryId.localeCompare(b.queryId));

    const page: DomainPage = {
      domain,
      categories: allShares
        .filter((s) => s.domain === domain)
        .map((s) => ({
          category: categoryById.get(s.categoryId)!,
          engineId: s.engineId,
          metric: s.metric,
          share: s.share,
          weightedShare: s.weightedShare,
          citedQueries: s.citedQueries,
          observedQueries: s.observedQueries,
        }))
        .filter((c) => c.category),
      citedIn,
      updatedAt,
    };
    await writeJson(path.join(DERIVED_DIR, "domains", `${domain}.json`), page);
  }

  // Movement between the two most recent runs. Suppressed automatically across
  // a probe-version or vantage-point mismatch.
  const changes = previousRun
    ? computeChanges(previousRun, latestRun, corpus)
    : [];

  const observedCount = latestRun.observations.filter((o) => o.status === "ok").length;
  const summary = {
    corpusVersion: corpus.version,
    probeVersion: latestRun.probeVersion,
    vantage: latestRun.vantage,
    updatedAt,
    runCount: runs.length,
    latestRunId: latestRun.runId,
    partial: latestRun.partial,
    queryCount: corpus.queries.length,
    observedCount,
    failedCount: latestRun.observations.length - observedCount,
    domainCount: domains.length,
    engines: engineList,
    categories: corpus.categories.map((category) => {
      const page = categoryPages.find((p) => p.category.id === category.id)!;
      const primary = page.leaderboards["in-answer"]?.[engineList[0]?.id ?? ""] ?? [];
      return {
        ...category,
        queryCount: page.queries.length,
        leaderCount: primary.length,
        top: primary.slice(0, 5),
      };
    }),
    changes: changes.slice(0, 50),
  };
  await writeJson(path.join(DERIVED_DIR, "summary.json"), summary);

  await writeJson(path.join(DERIVED_DIR, "index.json"), {
    categories: corpus.categories.map((c) => c.id),
    queries: corpus.queries.map((q) => q.id),
    domains,
  });

  // A stable public endpoint for the dataset. Served as static files so it
  // costs nothing to run and cannot fall over.
  const publicApi = path.join(process.cwd(), "public", "api");
  await rm(publicApi, { recursive: true, force: true });
  await writeJson(path.join(publicApi, "summary.json"), summary);
  await writeJson(path.join(publicApi, "corpus.json"), corpus);
  await writeJson(path.join(publicApi, "latest-run.json"), latestRun);
  for (const page of categoryPages) {
    await writeJson(path.join(publicApi, "categories", `${page.category.id}.json`), page);
  }

  console.log(
    `derived: ${corpus.categories.length} categories, ${corpus.queries.length} queries, ` +
      `${domains.length} domains, ${runs.length} run(s)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
