import { describe, expect, it } from "vitest";
import {
  computeChanges,
  computeShares,
  positionWeight,
  toDomain,
} from "../engine/score";
import { parseReferencedIndices } from "../engine/engines/perplexity";
import { PROBE_VERSION } from "../engine/types";
import type { Citation, Corpus, Observation, Run } from "../engine/types";

const corpus: Corpus = {
  version: "test",
  categories: [
    { id: "cat", label: "Cat", buyer: "b", description: "d" },
    { id: "other", label: "Other", buyer: "b", description: "d" },
  ],
  queries: [
    { id: "q1", categoryId: "cat", title: "Q1", prompt: "q1?" },
    { id: "q2", categoryId: "cat", title: "Q2", prompt: "q2?" },
  ],
};

function cite(domain: string, position: number, inAnswer = true): Citation {
  return { url: `https://${domain}/x`, domain, position, inAnswer };
}

function ok(queryId: string, citations: Citation[]): Observation {
  return {
    queryId,
    engineId: "e",
    model: "m",
    measuredAt: "2026-08-09T00:00:00.000Z",
    status: "ok",
    referenceMarkersDetected: citations.some((c) => c.inAnswer),
    citations,
  };
}

function failed(queryId: string): Observation {
  return {
    queryId,
    engineId: "e",
    model: "m",
    measuredAt: "2026-08-09T00:00:00.000Z",
    status: "failed",
    failureReason: "http 500",
    referenceMarkersDetected: false,
    citations: [],
  };
}

function run(observations: Observation[], overrides: Partial<Run> = {}): Run {
  return {
    runId: "2026-08-09",
    corpusVersion: "test",
    probeVersion: PROBE_VERSION,
    vantage: "test-vantage",
    startedAt: "2026-08-09T00:00:00.000Z",
    finishedAt: "2026-08-09T00:01:00.000Z",
    engines: [{ id: "e", label: "E", model: "m", surface: "s" }],
    observations,
    partial: observations.some((o) => o.status === "failed"),
    ...overrides,
  };
}

describe("toDomain", () => {
  it("normalises host and strips www", () => {
    expect(toDomain("https://www.Example.com/a/b?c=1")).toBe("example.com");
  });

  it("rejects non-http schemes and malformed input", () => {
    expect(toDomain("javascript:alert(1)")).toBeNull();
    expect(toDomain("not a url")).toBeNull();
    expect(toDomain("https://localhost")).toBeNull();
  });
});

describe("positionWeight", () => {
  it("discounts later positions monotonically", () => {
    expect(positionWeight(1)).toBe(1);
    expect(positionWeight(2)).toBeLessThan(positionWeight(1));
    expect(positionWeight(10)).toBeLessThan(positionWeight(2));
  });

  it("returns 0 for invalid positions rather than throwing", () => {
    expect(positionWeight(0)).toBe(0);
    expect(positionWeight(Number.NaN)).toBe(0);
  });
});

describe("parseReferencedIndices", () => {
  it("extracts inline reference markers", () => {
    expect([...parseReferencedIndices("a[1] b[3][12] c")]).toEqual([1, 3, 12]);
  });

  it("returns empty when the answer references nothing", () => {
    expect(parseReferencedIndices("no markers here").size).toBe(0);
  });
});

describe("computeShares", () => {
  it("is a pure function of the observations", () => {
    const runs = [run([ok("q1", [cite("a.com", 1)]), ok("q2", [cite("a.com", 1)])])];
    const first = computeShares({ runs, corpus });
    const second = computeShares({ runs, corpus });
    expect(first).toEqual(second);
    expect(first[0]!.share).toBe(1);
  });

  it("counts a domain once per answer even when cited repeatedly", () => {
    const runs = [
      run([
        ok("q1", [cite("a.com", 1), cite("a.com", 4), cite("b.com", 2)]),
        ok("q2", [cite("b.com", 1)]),
      ]),
    ];
    const shares = computeShares({ runs, corpus });
    const a = shares.find((s) => s.domain === "a.com")!;
    expect(a.citedQueries).toBe(1);
    expect(a.observedQueries).toBe(2);
    expect(a.share).toBe(0.5);
    // Best position wins, so repeated self-citation gains nothing.
    expect(a.weightedShare).toBeCloseTo(positionWeight(1) / 2, 10);
  });

  // Rule 3: a measurement we failed to take is never charged to a domain.
  it("excludes failed observations from the denominator", () => {
    const runs = [run([ok("q1", [cite("a.com", 1)]), failed("q2")])];
    const a = computeShares({ runs, corpus }).find((s) => s.domain === "a.com")!;
    expect(a.observedQueries).toBe(1);
    expect(a.share).toBe(1);
  });

  // Rule 2: unobservable is null, never 0.
  it("returns null rather than zero when nothing was observable", () => {
    const runs = [run([failed("q1"), failed("q2")])];
    expect(computeShares({ runs, corpus })).toEqual([]);
  });

  it("drops observations whose query is not in the corpus", () => {
    const runs = [run([ok("ghost", [cite("a.com", 1)]), ok("q1", [cite("a.com", 1)])])];
    const a = computeShares({ runs, corpus }).find((s) => s.domain === "a.com")!;
    expect(a.observedQueries).toBe(1);
  });

  it("uses only the most recent observation per query and engine", () => {
    const older = run([ok("q1", [cite("a.com", 1)])], { runId: "2026-08-01" });
    const newer = run([
      { ...ok("q1", [cite("b.com", 1)]), measuredAt: "2026-08-09T12:00:00.000Z" },
    ]);
    const shares = computeShares({ runs: [older, newer], corpus });
    expect(shares.find((s) => s.domain === "a.com")).toBeUndefined();
    expect(shares.find((s) => s.domain === "b.com")!.citedQueries).toBe(1);
  });

  describe("in-answer versus attached", () => {
    const runs = [
      run([
        ok("q1", [cite("a.com", 1, true), cite("b.com", 2, false)]),
        ok("q2", [cite("b.com", 1, true)]),
      ]),
    ];

    it("counts only referenced sources for the in-answer metric", () => {
      const shares = computeShares({ runs, corpus, metric: "in-answer" });
      expect(shares.find((s) => s.domain === "b.com")!.citedQueries).toBe(1);
    });

    it("counts every attached source for the attached metric", () => {
      const shares = computeShares({ runs, corpus, metric: "attached" });
      expect(shares.find((s) => s.domain === "b.com")!.citedQueries).toBe(2);
    });

    it("excludes answers with no detectable markers from the in-answer denominator", () => {
      const unmarked = run([
        ok("q1", [cite("a.com", 1, false)]),
        ok("q2", [cite("a.com", 1, true)]),
      ]);
      const inAnswer = computeShares({ runs: [unmarked], corpus, metric: "in-answer" });
      // q1 told us nothing about what was referenced, so it leaves the denominator
      // instead of being recorded as "a.com was not referenced".
      expect(inAnswer.find((s) => s.domain === "a.com")!.observedQueries).toBe(1);
      const attached = computeShares({ runs: [unmarked], corpus, metric: "attached" });
      expect(attached.find((s) => s.domain === "a.com")!.observedQueries).toBe(2);
    });
  });
});

describe("computeChanges", () => {
  // q2 is observable in both runs; only who it referenced changed.
  const before = run([ok("q1", [cite("a.com", 1)]), ok("q2", [cite("z.com", 1)])]);
  const after = run([ok("q1", [cite("a.com", 1)]), ok("q2", [cite("a.com", 1)])]);

  it("reports movement between comparable runs", () => {
    const [change] = computeChanges(before, after, corpus);
    expect(change!.domain).toBe("a.com");
    expect(change!.delta).toBeCloseTo(0.5, 10);
    expect(change!.suppressedReason).toBeUndefined();
  });

  // Improving our own probe would otherwise publish "x lost citations" about
  // domains that did nothing at all.
  it("suppresses comparison across a probe version change", () => {
    const [change] = computeChanges(
      { ...before, probeVersion: PROBE_VERSION + 1 },
      after,
      corpus,
    );
    expect(change!.delta).toBeNull();
    expect(change!.suppressedReason).toBe("probe version changed");
  });

  it("suppresses comparison across a vantage point change", () => {
    const [change] = computeChanges({ ...before, vantage: "elsewhere" }, after, corpus);
    expect(change!.delta).toBeNull();
    expect(change!.suppressedReason).toBe("vantage point changed");
  });
});
