import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Leaderboard } from "@/components/Leaderboard";
import { formatDate, getCategory, getIndex } from "@/lib/data";

type Params = { category: string };

export async function generateStaticParams() {
  const index = await getIndex();
  return index.categories.map((category) => ({ category }));
}

export const dynamicParams = false;

async function load(params: Promise<Params>) {
  const { category } = await params;
  try {
    return await getCategory(category);
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
    title: `Which sources AI answers cite for ${page.category.label.toLowerCase()}`,
    description: `Measured Answer Share for ${page.category.label.toLowerCase()} across ${page.queries.length} commercial questions. ${page.category.description}`,
    alternates: { canonical: `/categories/${page.category.id}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const page = await load(params);
  const engine = page.engines[0];

  return (
    <article className="mx-auto max-w-6xl px-5 py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
        <Link href="/categories" className="underline underline-offset-4">
          Categories
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{page.category.label}</span>
      </nav>

      <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
        Which sources AI answers cite for {page.category.label.toLowerCase()}
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-text-muted">
        {page.category.description}
      </p>
      <p className="mt-3 max-w-2xl text-sm text-text-muted">
        Asked on behalf of: {page.category.buyer}
      </p>

      {page.engines.map((currentEngine) => {
        const inAnswer =
          page.leaderboards["in-answer"]?.[currentEngine.id] ?? [];
        const attached = page.leaderboards["attached"]?.[currentEngine.id] ?? [];
        return (
          <section key={currentEngine.id} className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight">
              {currentEngine.label}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Model {currentEngine.model}. Measured{" "}
              {formatDate(page.updatedAt)} across {page.queries.length}{" "}
              questions.
            </p>

            <h3 className="mt-8 text-lg font-semibold">
              Referenced in the answer
            </h3>
            <p className="mb-3 mt-1 text-sm text-text-muted">
              The share of answers whose text actually cited the source. This is
              the headline metric.
            </p>
            <Leaderboard
              rows={inAnswer}
              limit={25}
              caption={`Answer Share for ${page.category.label} on ${currentEngine.label}, referenced in the answer`}
            />

            <details className="mt-8 rounded border border-border bg-surface p-4">
              <summary className="cursor-pointer font-medium">
                Consulted but not necessarily referenced
              </summary>
              <p className="mb-3 mt-3 text-sm text-text-muted">
                The share of answers that attached the source to the response at
                all. Always higher, and the number most tools report without
                saying so.
              </p>
              <Leaderboard
                rows={attached}
                limit={25}
                caption={`Sources consulted for ${page.category.label} on ${currentEngine.label}`}
              />
            </details>
          </section>
        );
      })}

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight">
          The questions we ask
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Every question is sent verbatim, with no system prompt, so the result
          reflects the engine&rsquo;s default behaviour rather than our steering
          of it.
        </p>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {page.queries.map((query) => (
            <li
              key={query.id}
              className="rounded border border-border bg-surface p-4"
            >
              <Link
                href={`/questions/${query.id}`}
                className="font-medium underline decoration-border underline-offset-4 hover:decoration-text"
              >
                {query.title}
              </Link>
              <p className="mt-1.5 text-sm text-text-muted">
                &ldquo;{query.prompt}&rdquo;
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-12 text-sm text-text-muted">
        {engine ? `Measured on ${engine.label}. ` : ""}
        <Link href="/methodology" className="underline underline-offset-4">
          How this is measured
        </Link>
      </p>
    </article>
  );
}
