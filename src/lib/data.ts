/**
 * Build-time data access.
 *
 * The site reads the derived JSON produced by `npm run derive`. There is no
 * database and no request-time fetching: every page is a pure render of a file
 * that is committed to the repository, so a page can never disagree with the
 * published evidence.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  CategoryDescriptor,
  EngineDescriptor,
} from "../../engine/types";

const DERIVED = path.join(process.cwd(), "data", "derived");

export interface LeaderboardRow {
  domain: string;
  share: number | null;
  weightedShare: number | null;
  citedQueries: number;
  observedQueries: number;
}

export interface Summary {
  corpusVersion: string;
  probeVersion: number;
  vantage: string;
  updatedAt: string;
  runCount: number;
  latestRunId: string;
  partial: boolean;
  queryCount: number;
  observedCount: number;
  failedCount: number;
  domainCount: number;
  engines: EngineDescriptor[];
  categories: Array<
    CategoryDescriptor & {
      queryCount: number;
      leaderCount: number;
      top: LeaderboardRow[];
    }
  >;
  changes: Array<{
    domain: string;
    categoryId: string;
    engineId: string;
    previous: number | null;
    current: number | null;
    delta: number | null;
    suppressedReason?: string;
  }>;
}

export interface CategoryPage {
  category: CategoryDescriptor;
  engines: EngineDescriptor[];
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
    citations: Array<{
      url: string;
      domain: string;
      position: number;
      inAnswer: boolean;
    }>;
  }>;
  updatedAt: string;
}

export interface DomainPage {
  domain: string;
  categories: Array<{
    category: CategoryDescriptor;
    engineId: string;
    metric: string;
    share: number | null;
    weightedShare: number | null;
    citedQueries: number;
    observedQueries: number;
  }>;
  citedIn: Array<{
    queryId: string;
    title: string;
    categoryId: string;
    position: number;
    inAnswer: boolean;
  }>;
  updatedAt: string;
}

export interface DataIndex {
  categories: string[];
  queries: string[];
  domains: string[];
}

async function read<T>(...segments: string[]): Promise<T> {
  return JSON.parse(await readFile(path.join(DERIVED, ...segments), "utf8")) as T;
}

export const getSummary = () => read<Summary>("summary.json");
export const getIndex = () => read<DataIndex>("index.json");
export const getCategory = (id: string) =>
  read<CategoryPage>("categories", `${id}.json`);
export const getQuery = (id: string) => read<QueryPage>("queries", `${id}.json`);
export const getDomain = (domain: string) =>
  read<DomainPage>("domains", `${domain}.json`);

/** Percentages are shown to one decimal. `null` means we could not observe it,
 *  which is deliberately never rendered as 0. */
export function formatShare(share: number | null): string {
  if (share === null) return "not observed";
  return `${(share * 100).toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const PRIMARY_METRIC = "in-answer";
