import Link from "next/link";
import { formatShare, type LeaderboardRow } from "@/lib/data";

export function Leaderboard({
  rows,
  caption,
  limit,
}: {
  rows: LeaderboardRow[];
  caption: string;
  limit?: number;
}) {
  const shown = limit ? rows.slice(0, limit) : rows;

  if (shown.length === 0) {
    return (
      <p className="rounded border border-border bg-surface-sunken p-4 text-sm text-text-muted">
        Nothing observed yet for this combination. Nothing observed is recorded
        as unknown, never as zero.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border-strong text-left">
            <th scope="col" className="py-2 pr-3 font-medium">
              #
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Source
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              Answer Share
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              Prominence
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Answers
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((row, index) => (
            <tr key={row.domain} className="border-b border-border">
              <td className="tabular py-2 pr-3 text-text-muted">{index + 1}</td>
              <td className="py-2 pr-3">
                <Link
                  href={`/domains/${row.domain}`}
                  className="underline decoration-border underline-offset-4 hover:decoration-text"
                >
                  {row.domain}
                </Link>
              </td>
              <td className="tabular py-2 pr-3 text-right font-medium">
                {formatShare(row.share)}
              </td>
              <td className="tabular py-2 pr-3 text-right text-text-muted">
                {row.weightedShare === null
                  ? "not observed"
                  : row.weightedShare.toFixed(3)}
              </td>
              <td className="tabular py-2 text-right text-text-muted">
                {row.citedQueries} of {row.observedQueries}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
