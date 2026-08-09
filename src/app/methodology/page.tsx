import Link from "next/link";
import type { Metadata } from "next";
import { formatDate, getSummary } from "@/lib/data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "Exactly how Answer Share measures which sources AI answer engines cite, what the numbers mean, and what this measurement cannot tell you.",
  alternates: { canonical: "/methodology" },
};

export default async function MethodologyPage() {
  const summary = await getSummary();

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
        Methodology
      </h1>
      <p className="mt-5 text-lg text-text-muted">
        A measurement is only worth citing if you can check it. This page states
        what we do, what the numbers mean, and where the limits are.
      </p>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          What we measure
        </h2>
        <p>
          We maintain a versioned corpus of {summary.queryCount} commercial
          questions across {summary.categories.length} categories. Each question
          is one a real buyer would ask before spending money.
        </p>
        <p>
          On each run, every question is sent verbatim to every configured
          engine. There is no system prompt, no retrieval hints, and no
          per-engine rewording, so what we record is the engine&rsquo;s default
          behaviour rather than our steering of it.
        </p>
        <p>
          We record the ordered list of sources the engine returns and which of
          those the answer text references inline. We then discard the answer
          prose. It is never republished and never influences a number.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          The two metrics
        </h2>
        <p>
          <strong>Answer Share</strong> is the share of measured answers whose
          text actually referenced a source. This is the headline number.
        </p>
        <p>
          <strong>Consulted share</strong> is the share of answers that attached
          a source to the response at all. It is always higher. Many tools
          report this number and call it a citation, which overstates how
          visible a brand really is, so we publish both and lead with the
          stricter one.
        </p>
        <p>
          <strong>Prominence</strong> applies a standard log2 positional
          discount, so a source cited first counts more than one cited
          twentieth. A source cited several times in one answer counts once, at
          its best position, so repeated self-citation gains nothing.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Four rules the code enforces
        </h2>
        <ol className="space-y-4">
          <li>
            <strong>No model in the scoring path.</strong> Every published
            figure is a pure function over archived citation lists. No language
            model judges, ranks, weights, or summarises anything that becomes a
            number.
          </li>
          <li>
            <strong>Unobservable is unknown, never zero.</strong> A value we
            could not measure is recorded as unknown and excluded from
            averages. It is never rendered as 0%.
          </li>
          <li>
            <strong>A measurement we failed to take is never charged to a
            source.</strong> When a request fails, that question leaves the
            denominator for that engine and the run is flagged partial. It is
            never recorded as &ldquo;this source was not cited&rdquo;.
          </li>
          <li>
            <strong>Every number carries its provenance.</strong> Corpus
            version, probe version, engine, model and vantage point are stamped
            on every run and published alongside the results.
          </li>
        </ol>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Change detection
        </h2>
        <p>
          Movement between runs is only published when the two runs are
          comparable. If the probe version changed, or the run was measured from
          a different network vantage point, the comparison is suppressed rather
          than published.
        </p>
        <p>
          This matters more than it sounds. Answer engines return different
          results from different networks and locations. Without this rule,
          moving our own job to a different machine would publish
          &ldquo;example.com lost citations&rdquo; about sites that did nothing
          at all.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          What this cannot tell you
        </h2>
        <ul className="space-y-3">
          <li>
            <strong>Coverage is limited to the engines listed below.</strong> We
            do not claim to measure any surface we cannot reach
            programmatically. Where we do not measure an engine, we say so
            rather than implying coverage.
          </li>
          <li>
            <strong>Answers vary between users.</strong> Personalisation,
            location, and time all move results. A single run is a sample, not a
            verdict, which is why we keep every historical run.
          </li>
          <li>
            <strong>Being cited is not being recommended.</strong> A source can
            be cited in an answer that criticises it. We measure citation, not
            sentiment.
          </li>
          <li>
            <strong>The corpus is ours.</strong> It reflects our judgement about
            what buyers ask. It is versioned and public so you can disagree with
            it specifically.
          </li>
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Current coverage
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-muted">Corpus version</dt>
            <dd className="tabular">{summary.corpusVersion}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Probe version</dt>
            <dd className="tabular">{summary.probeVersion}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Vantage point</dt>
            <dd>{summary.vantage}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Last measured</dt>
            <dd>{formatDate(summary.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Runs archived</dt>
            <dd className="tabular">{summary.runCount}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Failed measurements</dt>
            <dd className="tabular">{summary.failedCount}</dd>
          </div>
        </dl>

        <h3 className="mt-6 text-lg font-semibold">Engines measured</h3>
        <ul className="space-y-3">
          {summary.engines.map((engine) => (
            <li key={engine.id}>
              <strong>{engine.label}</strong>{" "}
              <span className="text-text-muted">({engine.model})</span>
              <p className="mt-1 text-sm text-text-muted">{engine.surface}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Check us</h2>
        <p>
          Every run is committed as a JSON file and the scoring code is open.
          Download the runs, re-run the scoring, and you should get identical
          numbers. If you do not, that is a bug and we want to hear about it.
        </p>
        <p>
          <Link href="/data" className="underline underline-offset-4">
            Download the data
          </Link>{" "}
          or read the{" "}
          <a
            href={SITE.repo}
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            source on GitHub
          </a>
          .
        </p>
      </section>
    </article>
  );
}
