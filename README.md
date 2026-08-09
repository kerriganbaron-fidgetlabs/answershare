# Answer Share

An open, continuously re-measured record of **which sources AI answer engines cite** when people ask commercial questions.

Live: https://answershare.vercel.app

## What it does

A fixed, versioned corpus of commercial questions is sent to answer engines on a schedule. Every source the engine returns is recorded, along with whether the answer text actually referenced it. From that we publish, per category and per domain:

- **Answer Share** — the share of measured answers whose text referenced a source. The headline metric.
- **Consulted share** — the share of answers that attached a source at all. Always higher, and the number most tools quietly report as a citation.
- **Prominence** — a log2 positional discount, so being cited first counts more than being cited twentieth.

## Why it is trustworthy

Four rules are enforced in code and pinned by tests in `tests/score.test.ts`. Do not relax them.

1. **No model in the scoring path.** `computeShares` is a pure function over archived citation lists. Prose is never an input to a number.
2. **Unobservable is `null`, never 0**, and excluded from aggregates.
3. **A measurement we failed to take is never charged to a source.** A failed observation leaves the denominator and flags the run partial.
4. **Every number carries its provenance** — corpus version, probe version, engine, model, and vantage point.

Change detection is suppressed across a probe-version or vantage-point mismatch. Answer engines return different results from different networks, so without this, moving the job to another machine publishes "example.com lost citations" about sites that did nothing.

## Running it

```bash
npm install
npm test                        # scoring rules, 18 tests
npm run measure -- --dry        # print what would be sent, call nothing
npm run measure -- --limit 5    # smoke test against the live API
npm run measure                 # full run, writes data/runs/<date>.json
npm run derive                  # rebuild data/derived and public/api
npm run build                   # static site
```

`PERPLEXITY_API_KEY` is required to measure. `ANSWERSHARE_VANTAGE` labels where the run was taken from and defaults to `gha-ubuntu`.

## Architecture

Deliberately boring, because it has to run unattended and cost nothing.

- **No database.** Runs are JSON files committed to this repo. Derived data is regenerated from them and is reproducible byte for byte.
- **Static site.** Every page is prerendered at build time. Nothing is computed per request.
- **GitHub Actions** runs the weekly measurement on a public repo, so Actions minutes are free.
- **Vercel** deploys on push. A finished run is live within minutes with no manual step.

Running cost is the Perplexity API only, roughly $0.005 per question per run.

## Adding an engine

Implement `EngineAdapter` in `engine/engines/`, add it to the list in `engine/run.ts`, and bump `PROBE_VERSION` in `engine/types.ts` so change detection does not compare across the procedure change. Adapters must throw rather than return a partial result: a silent partial is indistinguishable from a real absence and would be charged to a domain.

## Adding a category

Edit `corpus/queries.json` and bump `version`. Questions should be ones a buyer would genuinely ask before spending money. The corpus is public so people can disagree with it specifically.

## Licence

Dataset: CC BY 4.0. Attribute with a link and state the measurement date, because these numbers move.
