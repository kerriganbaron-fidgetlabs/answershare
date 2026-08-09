import Link from "next/link";
import type { Metadata } from "next";
import { formatDate, getSummary } from "@/lib/data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Data",
  description:
    "Download the full Answer Share dataset. Every measurement run is archived as JSON and licensed CC BY 4.0.",
  alternates: { canonical: "/data" },
};

const ENDPOINTS = [
  {
    path: "/api/summary.json",
    what: "Headline figures, category leaderboards and recent movement.",
  },
  {
    path: "/api/corpus.json",
    what: "The full versioned question corpus with categories.",
  },
  {
    path: "/api/latest-run.json",
    what: "The most recent raw run, including every citation observed.",
  },
  {
    path: "/api/categories/headless-cms.json",
    what: "One file per category, with both metrics and every ranked source.",
  },
];

export default async function DataPage() {
  const summary = await getSummary();

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
        Data
      </h1>
      <p className="mt-5 text-lg text-text-muted">
        The dataset is the point. Everything published on this site is derived
        from files you can download, and the scoring code is open, so you can
        reproduce every number.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Endpoints</h2>
        <p className="mt-2 text-sm text-text-muted">
          Static JSON, no key, no rate limit. Updated {formatDate(summary.updatedAt)}.
        </p>
        <ul className="mt-5 space-y-3">
          {ENDPOINTS.map((endpoint) => (
            <li key={endpoint.path} className="border-b border-border pb-3">
              <a
                href={endpoint.path}
                className="font-mono text-sm underline underline-offset-4"
              >
                {endpoint.path}
              </a>
              <p className="mt-1 text-sm text-text-muted">{endpoint.what}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Raw measurement runs
        </h2>
        <p>
          Every run is committed to the repository under{" "}
          <code className="font-mono text-sm">data/runs/</code> and never
          rewritten. {summary.runCount}{" "}
          {summary.runCount === 1 ? "run is" : "runs are"} archived so far.
        </p>
        <p>
          <a
            href={`${SITE.repo}/tree/main/data/runs`}
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            Browse the archived runs on GitHub
          </a>
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Licence</h2>
        <p>
          The dataset is licensed{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            CC BY 4.0
          </a>
          . Use it, publish it, build on it. Attribute it to {SITE.name} with a
          link, and state the measurement date, because these numbers move.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Want a category we do not cover
        </h2>
        <p>
          The corpus is public and versioned. If a category matters to you and
          is missing, open an issue on{" "}
          <a
            href={`${SITE.repo}/issues`}
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            GitHub
          </a>{" "}
          with the questions a buyer would actually ask.
        </p>
        <p className="text-sm text-text-muted">
          <Link href="/methodology" className="underline underline-offset-4">
            Read the methodology
          </Link>{" "}
          before using these numbers in anything that matters.
        </p>
      </section>
    </article>
  );
}
