/**
 * Answer Share data model.
 *
 * Four rules are enforced across this engine and pinned by tests. They are the
 * difference between a dataset that can be cited and one that gets discredited.
 *
 *  1. No model output is ever an input to a number. We parse the citation list
 *     an engine returns and nothing else. Prose is written afterwards, never
 *     as an input.
 *  2. Unobservable is `null`, never 0, and is excluded from aggregates.
 *  3. A measurement we failed to take is never charged to a domain. A failed
 *     observation leaves that engine's denominator, and the run is marked
 *     partial.
 *  4. Every published number carries the engine, model, corpus version, probe
 *     version and vantage point that produced it.
 */

/** Bumped whenever the measurement procedure changes in a way that could move
 *  a number without the underlying reality changing. Change detection is
 *  suppressed across a mismatch. */
export const PROBE_VERSION = 1;

export interface EngineDescriptor {
  /** Stable slug used in URLs and derived data. */
  id: string;
  label: string;
  /** Exact model identifier used for the run. Part of the evidence. */
  model: string;
  /** What surface this actually measures, stated plainly for the methodology
   *  page. We never imply we measure a surface we cannot reach. */
  surface: string;
}

export interface QueryDescriptor {
  id: string;
  categoryId: string;
  /** The question exactly as sent to every engine. Never templated per engine. */
  prompt: string;
  /** Human-readable page title. */
  title: string;
}

export interface CategoryDescriptor {
  id: string;
  label: string;
  /** Who is asking these questions and what they are trying to decide. */
  buyer: string;
  description: string;
}

export interface Corpus {
  version: string;
  categories: CategoryDescriptor[];
  queries: QueryDescriptor[];
}

export interface Citation {
  url: string;
  /** Registrable domain, lowercased, `www.` stripped. */
  domain: string;
  /** 1-indexed order in which the engine returned the citation. */
  position: number;
  /**
   * Whether the answer text actually referenced this source, as opposed to
   * merely consulting it. Engines attach a list of sources to an answer but
   * only reference some of them inline. Conflating the two overstates how
   * visible a brand really is, so we record both and publish both.
   */
  inAnswer: boolean;
}

export type ObservationStatus = "ok" | "failed";

export interface Observation {
  queryId: string;
  engineId: string;
  model: string;
  measuredAt: string;
  status: ObservationStatus;
  /** Present only when status is "failed". Rule 3: this excludes the
   *  observation from every denominator rather than scoring it as zero. */
  failureReason?: string;
  /**
   * Whether inline reference markers were detectable in the answer. When they
   * are not, `inAnswer` cannot be determined, so this observation leaves the
   * in-answer denominator entirely rather than reporting every source as
   * unreferenced. Rule 2.
   */
  referenceMarkersDetected: boolean;
  citations: Citation[];
}

export interface Run {
  runId: string;
  corpusVersion: string;
  probeVersion: number;
  /** Where the measurement was taken from. Results differ by network vantage
   *  point, so diffing across a mismatch is suppressed. */
  vantage: string;
  startedAt: string;
  finishedAt: string;
  engines: EngineDescriptor[];
  observations: Observation[];
  /** True when any observation failed. Partial runs stay out of leaderboards
   *  for the affected engine. */
  partial: boolean;
}

export interface DomainCategoryShare {
  domain: string;
  categoryId: string;
  engineId: string;
  /** Queries in which this domain was cited at least once. */
  citedQueries: number;
  /** Queries actually observed for this engine. Failed observations are not
   *  counted. Rule 3. */
  observedQueries: number;
  /** citedQueries / observedQueries, or null when nothing was observable. */
  share: number | null;
  /** Prominence-weighted share using a log2 positional discount. */
  weightedShare: number | null;
}

/** An engine adapter. Adapters return citations or throw. They never return a
 *  partial-but-plausible result, because a silent partial is indistinguishable
 *  from a real absence and would be charged to the domain. */
export interface EngineAdapter {
  descriptor: EngineDescriptor;
  ask(prompt: string): Promise<Citation[]>;
}
