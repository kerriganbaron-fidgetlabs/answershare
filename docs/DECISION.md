# Why this, and not the alternatives

**Written:** 2026-08-09, the session that built it.
**Read this before proposing a different income project.** The search below cost
a lot of research and killed six candidates with evidence. Repeating it is waste.

---

## The brief

Build an income stream that is autonomous, self-marketing, and self-sustaining
on a EUR 250 seed. Available: Ollama with Qwen3 on 8GB VRAM, the Fidget Labs
Vercel account, Supabase, Docker, and everything already built. Excluded:
AtomDigit, Upwork, X/Twitter, ongoing direct selling, maintenance-heavy
regulatory products, competing with hyperscalers in saturated categories.

Two prior reports were supplied.

- **`crawlindex/docs/HANDOVER.md`** — a post-mortem of the previous attempt. Its
  central lesson is correct and became the operating rule here: **validate
  demand before writing code.** CrawlIndex was built well and had no buyer.
- **A Qwen3 "deep research" report.** Discarded. Its 22 sources include Lowe's,
  Best Buy, Zara, a Klondike solitaire site, a German shopping mall and an
  Arabic dictionary. It proposes a rap song generator, claims Supabase Edge
  Functions can host Ollama (Deno, no GPU), and specifies a KEDA/Kubernetes
  autoscaling stack for a single-GPU machine. It contains no demand evidence.

## What was rejected, and on what evidence

| Candidate | Verdict | Evidence |
|---|---|---|
| WordPress plugin, freemium | Rejected | WP.org ranking is install-weighted, so incumbents compound. Top 20 plugins hold 32.6% of all active installs. The 2026 Featured Plugins experiment is capped at sub-10k-install plugins and is the exception, not the route. |
| API marketplaces (Rapid/RapidAPI) | Rejected | 25% marketplace fee per official docs. Sellers report payout delays, spam and crypto scams. Evidence of meaningful independent seller income is thin and self-reported. |
| Marketplace digital goods (Etsy, Notion, Figma, VS Code, Gumroad) | Rejected | Every one requires either ranking inside the marketplace or an existing audience. VS Code has no native paid model. Gumroad and Lemon Squeezy are checkouts, not channels. |
| Accessibility / EAA scanning | Rejected | Still no publicly confirmed EAA fine anywhere in the EU as of mid-2026. Low end already commoditised by free Lighthouse, axe and WAVE, and occupied by overlay vendors at $38-49/month. Also a maintenance-heavy regulatory product, which the brief excludes. |
| Technographic list product (a better BuiltWith) | Rejected | The blind-spot thesis was tested directly and failed. BuiltWith lists 88,304 Contentful sites and sells Vue Storefront lists filtered by tech spend, revenue and SKU count. Wappalyzer sells Vue Storefront lead lists. Klazify, wmtips and websitecategorizationapi all have pages. Incumbents own both the detection and the SERP. |
| EU AI Act GPAI compliance | Rejected | The research pointed here as the single strongest uncontested niche. Rejected anyway: the Digital Omnibus is amending the Act right now, so it is precisely the maintenance-heavy regulatory product the brief excludes. A stale compliance product is worse than none. |
| AEO monitoring SaaS, head-on | Rejected | Profound raised $96M at a $1B valuation in February 2026; Peec has $29M. Entry tiers already sit at $95-99/month. A solo entrant with no audience does not win this fight. |

## What survived, and why

Two findings, taken together, decided it.

**One.** Google's March 2026 core update hit affiliate and roundup content
harder than any other category. What survives is content with *original
testing, named methodology, and specific outcome data*. That is a requirement a
content farm cannot meet and an autonomous measurement system meets by
construction.

**Two.** Across every research pass in this session, the sources actually cited
by an answer engine for commercial comparison questions were small, new,
structured sites — trakkr.ai, turboaudit.ai, geoscout.pro, fixaeo.com,
checkthat.ai, scrutia.io, auditsu.com, accessalyze.com — cited *over* Deque,
Level Access and BuiltWith. Distribution is not closed to new entrants. It is
closed to slow ones.

So: **do not compete with the funded AEO vendors. Measure the thing they all
sell access to, publish it openly, and let freshness be the moat.** Every
competitor's data is a gated dashboard. Ours is a public, dated, reproducible
record. Freshness and reproducibility are the two things an autonomous system
wins at permanently and a human-run content business cannot match.

## The money

Deliberately not left to hope, because that is what sank the last one.

- **Affiliate, disclosed.** Verified programmes in adjacent categories with real
  terms: Semrush $100-300 per sale plus $10 per trial on a 120-day cookie;
  Jasper 25% recurring; Surfer 75-125% CPA; Frase 30% recurring. Typical EPC
  $3-9.50. Two to three conversions a month covers all running costs several
  times over.
- **Paid measurement.** Organisations wanting questions we do not publish, or a
  private corpus, pay for custom runs. Marginal cost is about $0.005 per
  question per run.
- **The dataset itself.** CC BY 4.0 and free, because citation is the
  distribution.

OpenAI, Anthropic and Google pay no consumer affiliate commission. Do not plan
around them.

## Running cost

| Item | Cost |
|---|---|
| Perplexity API | ~$0.38 per full run, ~$1.65/month weekly |
| GitHub Actions | EUR 0. Public repo, unlimited minutes |
| Vercel | EUR 0 incremental, rides the existing Pro plan |
| Supabase | **None. There is no database.** |
| Domain | $37.99/year for answershare.io, once bought |

Under EUR 5/month all-in. The EUR 250 seed covers roughly four years of
operation before a single conversion.

## What would falsify this

State it now, while it is cheap to admit.

1. **No organic traffic within six months.** The whole thesis is that fresh
   original measurement gets indexed and cited. If it does not, this fails the
   same way CrawlIndex did, and it should be sunset rather than propped up.
2. **Traffic without conversions.** If the pages rank but nobody clicks an
   affiliate link or asks for custom measurement, the audience is researchers,
   not buyers. That is a study, not a business.
3. **An engine closes API access to citations.** Single-engine coverage is the
   main technical risk. Adding a second engine is the mitigation and the
   adapter interface exists for it.

Review at three months and six months against these three, honestly.

## Known limits as shipped

- **One engine.** Perplexity Sonar only. The site says so plainly rather than
  implying broader coverage. A Gemini grounded-search adapter is the obvious
  second, and needs a key.
- **One vantage point.** All runs from `gha-ubuntu`. Change detection is
  suppressed across a vantage mismatch, so this is safe, but it means results
  reflect one network location.
- **A single run is a sample, not a verdict.** Answers vary by user, location
  and time. This is why every run is kept.
