import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclosure",
  description:
    "How Answer Share is funded, and the rules that keep funding separate from measurement.",
  alternates: { canonical: "/disclosure" },
};

export default function DisclosurePage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
        Disclosure
      </h1>
      <p className="mt-5 text-lg text-text-muted">
        A measurement site is worthless if its numbers can be bought. This page
        states how {SITE.name} is funded and the rules that keep that separate
        from what gets measured.
      </p>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          How this is funded
        </h2>
        <p>
          {SITE.name} is run by Fidget Labs. It is intended to cover its own
          running costs through clearly labelled affiliate links to tools
          mentioned on the site, and through paid access to custom measurement
          for organisations that want questions we do not publish.
        </p>
        <p>
          Where a link earns a commission, it is marked. Where it does not, it
          is not marked. Nothing on this site is a paid placement.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Rules we hold ourselves to
        </h2>
        <ol className="space-y-4">
          <li>
            <strong>Money never touches a number.</strong> No commercial
            relationship affects the corpus, the scoring, or where a source
            ranks. The scoring code is a pure function over archived evidence
            and is open for inspection.
          </li>
          <li>
            <strong>The corpus is fixed before the results are seen.</strong>{" "}
            Questions are versioned and public. We do not add or remove a
            question because of who it favours.
          </li>
          <li>
            <strong>We will not sell placement.</strong> Not a ranking, not a
            badge, not a &ldquo;featured&rdquo; slot in a leaderboard. If we are
            ever asked, the answer is on this page.
          </li>
          <li>
            <strong>We publish our own conflicts.</strong> Fidget Labs works in
            the composable architecture and AI visibility space and has its own
            products. Any Fidget Labs domain that appears in a leaderboard is
            labelled as ours.
          </li>
          <li>
            <strong>Corrections are public.</strong> If a number is wrong, we
            fix it and say what changed. Runs are never rewritten, so the
            history stays auditable.
          </li>
        </ol>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          What being listed means
        </h2>
        <p>
          Appearing in a leaderboard is not an endorsement and not a quality
          judgement. It records that an answer engine cited a source when asked
          a specific question on a specific date. A source can be cited in an
          answer that criticises it.
        </p>
        <p>
          If you believe a measurement is wrong, the raw run that produced it is{" "}
          <Link href="/data" className="underline underline-offset-4">
            downloadable
          </Link>
          , and you can open an issue on{" "}
          <a
            href={`${SITE.repo}/issues`}
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            GitHub
          </a>
          .
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Opting out
        </h2>
        <p>
          We do not crawl the sites we list. We record which sources an answer
          engine chose to cite, which is an observation about the engine, not
          about your site. There is nothing to opt out of, and removing a domain
          would falsify the measurement.
        </p>
        <p>
          If a page linked here is harmful or unlawful, contact us and we will
          remove the outbound link while keeping the measurement intact.
        </p>
      </section>
    </article>
  );
}
