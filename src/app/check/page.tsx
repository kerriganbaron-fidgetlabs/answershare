import type { Metadata } from "next";
import { getIndex, getSummary } from "@/lib/data";
import { DomainSearch } from "./DomainSearch";

export const metadata: Metadata = {
  title: "Check a domain",
  description:
    "Check whether AI answer engines cite a domain, which commercial questions it appears for, and how prominently.",
  alternates: { canonical: "/check" },
};

export default async function CheckPage() {
  const [index, summary] = await Promise.all([getIndex(), getSummary()]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
        Check a domain
      </h1>
      <p className="mt-5 text-lg text-text-muted">
        Search {summary.domainCount.toLocaleString("en-GB")} sources observed
        across {summary.queryCount} commercial questions.
      </p>

      <DomainSearch domains={index.domains} />

      <div className="mt-12 rounded border border-border bg-surface-sunken p-5 text-sm text-text-muted">
        <h2 className="font-semibold text-text">Not finding a domain?</h2>
        <p className="mt-2">
          That means it was not cited in any of our{" "}
          {summary.queryCount} measured questions, not that it is invisible to
          AI generally. Our corpus is deliberately narrow and public. A domain
          can be well cited for questions we do not ask.
        </p>
      </div>
    </div>
  );
}
