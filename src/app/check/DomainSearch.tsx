"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const MAX_RESULTS = 40;

/** Reduce whatever the visitor pasted (a URL, a hostname, a brand) to
 *  something comparable with our stored domains. */
function normalise(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]!;
}

export function DomainSearch({ domains }: { domains: string[] }) {
  const [term, setTerm] = useState("");
  const query = normalise(term);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const exact: string[] = [];
    const prefix: string[] = [];
    const contains: string[] = [];
    for (const domain of domains) {
      if (domain === query) exact.push(domain);
      else if (domain.startsWith(query)) prefix.push(domain);
      else if (domain.includes(query)) contains.push(domain);
      if (exact.length + prefix.length + contains.length > MAX_RESULTS * 3) break;
    }
    return [...exact, ...prefix, ...contains].slice(0, MAX_RESULTS);
  }, [domains, query]);

  const searched = query.length >= 2;

  return (
    <div className="mt-8">
      <label htmlFor="domain" className="block font-medium">
        Domain or website address
      </label>
      <input
        id="domain"
        type="text"
        inputMode="url"
        autoComplete="url"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="example.com"
        aria-describedby="domain-hint"
        className="mt-2 w-full rounded border border-border-strong bg-surface px-4 py-3 text-base"
      />
      <p id="domain-hint" className="mt-2 text-sm text-text-muted">
        Paste a full URL or just the domain. Type at least two characters.
      </p>

      <div aria-live="polite" className="mt-6">
        {searched && results.length === 0 && (
          <p className="rounded border border-border bg-surface p-4">
            No measured citations for <strong>{query}</strong>.
          </p>
        )}

        {results.length > 0 && (
          <>
            <p className="text-sm text-text-muted">
              {results.length === MAX_RESULTS
                ? `First ${MAX_RESULTS} matches`
                : `${results.length} ${results.length === 1 ? "match" : "matches"}`}
            </p>
            <ul className="mt-3 divide-y divide-border rounded border border-border bg-surface">
              {results.map((domain) => (
                <li key={domain}>
                  <Link
                    href={`/domains/${domain}`}
                    className="block px-4 py-3 hover:bg-surface-sunken"
                  >
                    {domain}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
