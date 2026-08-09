import Link from "next/link";
import type { Metadata } from "next";
import { formatShare, getSummary } from "@/lib/data";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Every category measured by Answer Share, with the sources AI answer engines cite most often in each.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const summary = await getSummary();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
        Categories
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-text-muted">
        Each category is a fixed set of commercial questions that a real buyer
        would ask. The corpus is versioned, so a question cannot be quietly
        swapped to change a result.
      </p>

      <div className="mt-10 space-y-8">
        {summary.categories.map((category) => (
          <article
            key={category.id}
            className="rounded-lg border border-border bg-surface p-6"
          >
            <h2 className="text-xl font-semibold">
              <Link
                href={`/categories/${category.id}`}
                className="underline decoration-border underline-offset-4 hover:decoration-text"
              >
                {category.label}
              </Link>
            </h2>
            <p className="mt-2 max-w-3xl text-text-muted">
              {category.description}
            </p>
            <p className="mt-2 text-sm text-text-muted">
              {category.queryCount} questions, {category.leaderCount} sources
              cited.
            </p>
            <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {category.top.map((row, index) => (
                <li key={row.domain}>
                  <span className="tabular text-text-muted">{index + 1}. </span>
                  <Link
                    href={`/domains/${row.domain}`}
                    className="underline decoration-border underline-offset-4 hover:decoration-text"
                  >
                    {row.domain}
                  </Link>
                  <span className="tabular ml-2 font-medium">
                    {formatShare(row.share)}
                  </span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </div>
  );
}
