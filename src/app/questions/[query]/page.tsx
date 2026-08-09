import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, getIndex, getQuery } from "@/lib/data";

type Params = { query: string };

export async function generateStaticParams() {
  const index = await getIndex();
  return index.queries.map((query) => ({ query }));
}

export const dynamicParams = false;

async function load(params: Promise<Params>) {
  const { query } = await params;
  try {
    return await getQuery(query);
  } catch {
    notFound();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const page = await load(params);
  return {
    title: page.query.title,
    description: `Which sources AI answer engines cite when asked: ${page.query.prompt}`,
    alternates: { canonical: `/questions/${page.query.id}` },
  };
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const page = await load(params);

  return (
    <article className="mx-auto max-w-4xl px-5 py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
        <Link href="/categories" className="underline underline-offset-4">
          Categories
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          href={`/categories/${page.category.id}`}
          className="underline underline-offset-4"
        >
          {page.category.label}
        </Link>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
        {page.query.title}
      </h1>
      <blockquote className="mt-5 border-l-2 border-accent bg-surface px-5 py-4 text-lg">
        &ldquo;{page.query.prompt}&rdquo;
      </blockquote>
      <p className="mt-3 text-sm text-text-muted">
        Sent verbatim, with no system prompt. Last measured{" "}
        {formatDate(page.updatedAt)}.
      </p>

      {page.latest.map((observation) => (
        <section key={observation.engine.id} className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            {observation.engine.label}
          </h2>

          {observation.status !== "ok" ? (
            <p className="mt-3 rounded border border-border bg-surface-sunken p-4 text-sm">
              This measurement failed
              {observation.failureReason
                ? `: ${observation.failureReason}`
                : ""}
              . It is excluded from every average rather than being recorded as
              an absence of citations.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-text-muted">
                {observation.citations.length} sources attached,{" "}
                {observation.citations.filter((c) => c.inAnswer).length}{" "}
                referenced in the answer text.
              </p>
              <ol className="mt-5 space-y-2">
                {observation.citations.map((citation) => (
                  <li
                    key={`${citation.position}-${citation.url}`}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2 text-sm"
                  >
                    <span className="tabular w-6 shrink-0 text-text-muted">
                      {citation.position}
                    </span>
                    <Link
                      href={`/domains/${citation.domain}`}
                      className="font-medium underline decoration-border underline-offset-4 hover:decoration-text"
                    >
                      {citation.domain}
                    </Link>
                    {citation.inAnswer ? (
                      <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-medium">
                        referenced
                      </span>
                    ) : (
                      <span className="rounded border border-border px-2 py-0.5 text-xs text-text-muted">
                        consulted only
                      </span>
                    )}
                    <a
                      href={citation.url}
                      rel="nofollow noreferrer"
                      className="basis-full truncate text-xs text-text-muted underline underline-offset-4"
                    >
                      {citation.url}
                    </a>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      ))}

      <p className="mt-12 text-sm text-text-muted">
        <Link href="/methodology" className="underline underline-offset-4">
          How this is measured
        </Link>
      </p>
    </article>
  );
}
