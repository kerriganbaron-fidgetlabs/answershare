import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Corpus, Run } from "./types";

export const ROOT = process.cwd();
export const CORPUS_FILE = path.join(ROOT, "corpus", "queries.json");
export const DATA_DIR = path.join(ROOT, "data");
export const RUNS_DIR = path.join(DATA_DIR, "runs");
export const DERIVED_DIR = path.join(DATA_DIR, "derived");

export async function loadCorpus(): Promise<Corpus> {
  return JSON.parse(await readFile(CORPUS_FILE, "utf8")) as Corpus;
}

/** Runs oldest first. Missing directory means no runs yet, not an error. */
export async function loadRuns(): Promise<Run[]> {
  let names: string[];
  try {
    names = await readdir(RUNS_DIR);
  } catch {
    return [];
  }
  const files = names.filter((n) => n.endsWith(".json")).sort();
  const runs: Run[] = [];
  for (const name of files) {
    runs.push(JSON.parse(await readFile(path.join(RUNS_DIR, name), "utf8")) as Run);
  }
  return runs;
}
