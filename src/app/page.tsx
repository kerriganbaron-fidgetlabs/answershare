import Link from "next/link";
import type { Metadata } from "next";
import { formatDate, formatShare, getSummary } from "@/lib/data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const summary = await getSummary();
  const engine = summary.engines[0];

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
            Measured {formatDate(summary.updatedAt)} from {summary.vantage}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Who AI answer engines actually cite.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-text-muted">
            We ask {summary.queryCount} real commercial questions on a fixed
            schedule and record every source the answer engine cites. The result
            is a public record of which sites shape AI answers in a category,
            and which do not.
          </p>

          <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Questions measured", value: summary.queryCount },
              { label: "Sources observed", value: summary.domainCount },
              { label: "Categories", value: summary.categories.length },
              {
                label: "Failed measurements",
                value: summary.failedCount,
              },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-sm text-text-muted">{stat.label}</dt>
                <dd className="tabular mt-1 text-3xl font-semibold">
                  {stat.value.toLocaleString("en-GB")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">
          Answer Share by category
        </h2>
        <p className="mt-3 max-w-2xl text-text-muted">
          Answer Share is the percentage of measured answers in a category whose
          text actually references a given source. It counts sources the answer
          leaned on, not merely sources it consulted.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {summary.categories.map((category) => (
            <article
              key={category.id}
              className="rounded-lg border border-border bg-surface p-6"
            >
              <h3 className="text-lg font-semibold">
                <Link
                  href={`/categories/${category.id}`}
                  className="underline decoration-border underline-offset-4 hover:decoration-text"
                >
                  {category.label}
                </Link>
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                {category.queryCount} questions, {category.leaderCount} sources
                cited.
              </p>
              <ol className="mt-4 space-y-1.5 text-sm">
                {category.top.map((row) => (
                  <li key={row.domain} className="flex justify-between gap-4">
                    <Link
                      href={`/domains/${row.domain}`}
                      className="truncate underline decoration-border underline-offset-4 hover:decoration-text"
                    >
                      {row.domain}
                    </Link>
                    <span className="tabular shrink-0 font-medium">
                      {formatShare(row.share)}
                    </span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface-sunken">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            What makes this different
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold">Referenced, not just consulted</h3>
              <p className="mt-2 text-sm text-text-muted">
                Engines attach a list of sources to an answer but only reference
                some of them in the text. Counting the whole list overstates how
                visible a brand really is, so we separate the two and lead with
                the stricter number.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">No model in the scoring path</h3>
              <p className="mt-2 text-sm text-text-muted">
                Every number is a pure function over archived citation lists. No
                language model judges, ranks, or summarises anything that
                becomes a figure on this site.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Unmeasured is never zero</h3>
              <p className="mt-2 text-sm text-text-muted">
                When a measurement fails, it leaves the denominator instead of
                being recorded as an absence. A question we could not ask is
                never held against a brand.
              </p>
            </div>
          </div>
          <p className="mt-8 text-sm text-text-muted">
            Currently measuring {engine ? engine.label : "no engine"}
            {engine ? ` (${engine.model})` : ""}. Read the{" "}
            <Link href="/methodology" className="underline underline-offset-4">
              methodology
            </Link>{" "}
            for exactly what that covers and what it does not.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="rounded-lg border border-border bg-surface p-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Check a domain
          </h2>
          <p className="mt-3 max-w-2xl text-text-muted">
            See whether a site appears in any measured answer, where it ranks,
            and which questions it wins.
          </p>
          <Link
            href="/check"
            className="mt-6 inline-block rounded bg-accent px-5 py-2.5 font-medium text-accent-text"
          >
            Check a domain
          </Link>
          <p className="mt-4 text-sm text-text-muted">
            The full dataset is downloadable from{" "}
            <Link href="/data" className="underline underline-offset-4">
              the data page
            </Link>{" "}
            and the source is on{" "}
            <a
              href={SITE.repo}
              className="underline underline-offset-4"
              rel="noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
