import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, formatShare, getDomain, getIndex } from "@/lib/data";

type Params = { domain: string };

export async function generateStaticParams() {
  const index = await getIndex();
  return index.domains.map((domain) => ({ domain }));
}

export const dynamicParams = false;

async function load(params: Promise<Params>) {
  const { domain } = await params;
  try {
    return await getDomain(decodeURIComponent(domain));
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
    title: `${page.domain} in AI answers`,
    description: `Measured Answer Share for ${page.domain}: which commercial questions AI answer engines cite it for, and how prominently.`,
    alternates: { canonical: `/domains/${page.domain}` },
  };
}

export default async function DomainPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const page = await load(params);
  const primary = page.categories.filter((c) => c.metric === "in-answer");
  const referenced = page.citedIn.filter((c) => c.inAnswer);

  return (
    <article className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
        {page.domain}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-text-muted">
        Measured across {page.citedIn.length} of our questions, of which{" "}
        {referenced.length}{" "}
        {referenced.length === 1 ? "answer" : "answers"} referenced this source
        in the text. Last measured {formatDate(page.updatedAt)}.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight">
          Answer Share by category
        </h2>
        {primary.length === 0 ? (
          <p className="mt-3 text-text-muted">
            Not referenced in any measured answer.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <caption className="sr-only">
                Answer Share for {page.domain} by category
              </caption>
              <thead>
                <tr className="border-b border-border-strong text-left">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Category
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    Answer Share
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Answers
                  </th>
                </tr>
              </thead>
              <tbody>
                {primary.map((entry) => (
                  <tr
                    key={`${entry.category.id}-${entry.engineId}`}
                    className="border-b border-border"
                  >
                    <td className="py-2 pr-3">
                      <Link
                        href={`/categories/${entry.category.id}`}
                        className="underline decoration-border underline-offset-4 hover:decoration-text"
                      >
                        {entry.category.label}
                      </Link>
                    </td>
                    <td className="tabular py-2 pr-3 text-right font-medium">
                      {formatShare(entry.share)}
                    </td>
                    <td className="tabular py-2 text-right text-text-muted">
                      {entry.citedQueries} of {entry.observedQueries}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">
          Questions where it appears
        </h2>
        <ul className="mt-5 space-y-2">
          {page.citedIn.map((entry) => (
            <li
              key={entry.queryId}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2 text-sm"
            >
              <span className="tabular w-8 shrink-0 text-text-muted">
                #{entry.position}
              </span>
              <Link
                href={`/questions/${entry.queryId}`}
                className="font-medium underline decoration-border underline-offset-4 hover:decoration-text"
              >
                {entry.title}
              </Link>
              {entry.inAnswer ? (
                <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-medium">
                  referenced
                </span>
              ) : (
                <span className="rounded border border-border px-2 py-0.5 text-xs text-text-muted">
                  consulted only
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-12 text-sm text-text-muted">
        This page reports what we measured. It is not an endorsement, a ranking
        of quality, or a claim about the site itself.{" "}
        <Link href="/methodology" className="underline underline-offset-4">
          Read the methodology
        </Link>
        .
      </p>
    </article>
  );
}
