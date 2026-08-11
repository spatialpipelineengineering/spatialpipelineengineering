---
shortTitle: "Reconciling Credit Serial Numbers Across Registries"
title: "Reconciling Credit Serial Numbers Across Registries"
description: "Reconcile a carbon credit ledger against registry state at serial-range granularity: interval arithmetic for issuance, retirement, cancellation and transfer, gap and overlap detection, and the restatement trigger."
slug: reconciling-credit-serial-numbers-across-registries
type: guide
breadcrumb: "Reconciling Serial Numbers"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Reconciling Credit Serial Numbers Across Registries

A carbon credit is not a quantity, it is an interval. Registries issue serial-number ranges, retire sub-ranges, cancel others, and transfer the rest, and a ledger that tracks only totals cannot represent any of those events distinctly. This guide reconciles at the granularity that actually exists, within [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) in the [MRV architecture and carbon accounting fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack, consuming the verified crawl output produced by [handling registry API rate limits and idempotent retries](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/handling-registry-api-rate-limits-and-idempotent-retries/).

The reason totals fail is simple arithmetic. A project issues 250,000 credits; you hold 50,000; the registry later cancels 40,000 following a reversal. Whether those cancelled credits were yours is not derivable from any of those three numbers — it depends on which serials were cancelled and which you hold. Reconciling on totals produces an answer that is right by luck or wrong invisibly, and the difference between those two outcomes is the whole of the exercise.

<svg viewBox="0 -4 940 254" role="img" aria-labelledby="ivl-t ivl-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ivl-t">Interval arithmetic on one project's issued serial range</title>
  <desc id="ivl-d">A project's issued range from 1 to 250000 shown as a bar, with the holder's claimed sub-range from 90001 to 140000 highlighted beneath it. A cancellation of 40000 credits is then applied in two scenarios. In the first, the cancelled range 180001 to 220000 sits entirely outside the holder's claim, so the holder is unaffected and no restatement is needed. In the second, the cancelled range 120001 to 160000 overlaps the holder's claim between 120001 and 140000, so 20000 of the holder's credits are cancelled and the previously reported figure must be restated. A panel states that both scenarios have identical totals — 250000 issued, 50000 claimed, 40000 cancelled — and that only the intervals distinguish them.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Identical totals, opposite outcomes</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">250 000 issued · 50 000 claimed · 40 000 cancelled, in both scenarios.</text>
    <text x="12" y="66" fill="currentColor" font-size="9.5" font-weight="700">Issued range</text>
  </g>
  <g>
    <rect x="140" y="52" width="700" height="22" rx="4" fill="currentColor" opacity="0.12"/>
    <text x="146" y="68" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">1</text>
    <text x="834" y="68" text-anchor="end" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">250 000</text>
    <text x="12" y="102" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">Our claim</text>
    <rect x="392" y="86" width="140" height="22" rx="4" fill="currentColor" opacity="0.32"/>
    <text x="462" y="102" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor">90 001 – 140 000</text>
    <text x="12" y="146" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">Scenario A</text>
    <rect x="644" y="130" width="112" height="22" rx="4" fill="#f3a712" opacity="0.34"/>
    <text x="700" y="146" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor">180 001 – 220 000</text>
    <text x="770" y="146" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">no overlap → unaffected</text>
    <text x="12" y="190" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">Scenario B</text>
    <rect x="476" y="174" width="112" height="22" rx="4" fill="#f3a712" opacity="0.34"/>
    <text x="532" y="190" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor">120 001 – 160 000</text>
    <rect x="476" y="174" width="56" height="22" rx="4" fill="#f3a712" opacity="0.5"/>
    <text x="606" y="190" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">20 000 of ours cancelled → restate</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="212" width="916" height="30" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="232" fill="currentColor" font-size="9.5" font-weight="700">A total-based ledger cannot tell these apart. Only the intervals can, and only if the ledger stores them.</text>
  </g>
</svg>

## Root Cause Analysis

Three properties of serial ranges make them awkward enough that teams reach for totals, and each of the three is exactly why totals do not work.

**Ranges are split by events rather than by design.** A holding of 90,001–140,000 becomes three holdings the moment 100,000–110,000 is retired: two remaining sub-ranges and one retired one. Nothing about the original issuance anticipated the split, and the number of intervals a position occupies grows monotonically over its life. A schema with one row per holding will eventually be wrong; a schema with one row per contiguous sub-range with a state stays correct.

**Registries express the same event in different vocabularies.** One publishes explicit start and end serials, another publishes a block identifier plus a quantity, a third publishes a retirement record referencing a serial prefix with an implied range. Normalising all of them into half-open integer intervals at ingestion is the only way the arithmetic downstream stays simple, and doing it later means every consumer re-implements the parsing with its own off-by-one.

**Off-by-one errors are systematically invisible.** A range expressed inclusively as 1–100 holds a hundred credits; the same range read as half-open holds ninety-nine. That single credit per range disappears into rounding at portfolio level and produces a reconciliation that is off by exactly the number of ranges you hold — a discrepancy that looks like noise and is in fact a deterministic bug. Fixing the convention once at the boundary, and asserting the implied count against the registry's published quantity, catches it immediately.

The failure these produce together is a ledger that agrees with the registry on totals and disagrees on which specific credits it holds — which surfaces the first time a cancellation lands anywhere near your position.

## Diagnostic Pipeline / Pre-Flight Validation

Before reconciling, normalise and check the intervals themselves. Three defects make the arithmetic meaningless: overlapping ranges within one holder's position, gaps in a range the registry says is contiguous, and an implied count that disagrees with the registry's stated quantity.

```python
from dataclasses import dataclass

import structlog

log = structlog.get_logger()


@dataclass(frozen=True, order=True)
class SerialRange:
    """A half-open interval [start, end). One convention, fixed at the boundary.

    Registries publish inclusive ranges, block identifiers with quantities, and
    prefixes with implied spans. Normalising all of them here means no consumer
    downstream re-implements the off-by-one.
    """
    start: int
    end: int
    project_id: str
    state: str          # issued | held | retired | cancelled | transferred
    vintage: int

    def __post_init__(self) -> None:
        if self.end <= self.start:
            raise ValueError(f"empty or inverted range [{self.start}, {self.end})")

    @property
    def count(self) -> int:
        return self.end - self.start

    def overlaps(self, other: "SerialRange") -> bool:
        return self.project_id == other.project_id and \
            self.start < other.end and other.start < self.end

    def intersect(self, other: "SerialRange") -> "SerialRange | None":
        if not self.overlaps(other):
            return None
        return SerialRange(max(self.start, other.start), min(self.end, other.end),
                           self.project_id, self.state, self.vintage)

    def subtract(self, other: "SerialRange") -> list["SerialRange"]:
        """What remains of this range after removing another. Zero, one or two
        pieces — the split that makes a one-row-per-holding schema wrong."""
        if not self.overlaps(other):
            return [self]
        pieces = []
        if self.start < other.start:
            pieces.append(SerialRange(self.start, other.start, self.project_id,
                                      self.state, self.vintage))
        if other.end < self.end:
            pieces.append(SerialRange(other.end, self.end, self.project_id,
                                      self.state, self.vintage))
        return pieces


def from_inclusive(start: int, end_inclusive: int, **kw) -> SerialRange:
    """The single place the inclusive-to-half-open conversion happens."""
    return SerialRange(start, end_inclusive + 1, **kw)


def check_position(ranges: list[SerialRange], declared_quantity: int | None) -> dict:
    """Three defects that make the downstream arithmetic meaningless."""
    ordered = sorted(ranges)
    overlaps = [(a, b) for a, b in zip(ordered, ordered[1:]) if a.overlaps(b)]
    implied = sum(r.count for r in ordered)

    gaps = []
    for a, b in zip(ordered, ordered[1:]):
        if a.project_id == b.project_id and a.end < b.start:
            gaps.append((a.end, b.start))

    result = {
        "ranges": len(ordered),
        "implied_count": implied,
        "declared_quantity": declared_quantity,
        "overlaps": len(overlaps),
        "gaps": len(gaps),
        "count_matches": declared_quantity is None or implied == declared_quantity,
    }

    if overlaps:
        # Two ranges in one position claiming the same serial is double counting
        # inside a single holder — the most direct form of the error.
        log.error("serials.overlap", count=len(overlaps),
                  example=[(overlaps[0][0].start, overlaps[0][0].end),
                           (overlaps[0][1].start, overlaps[0][1].end)])
    if declared_quantity is not None and implied != declared_quantity:
        log.error("serials.count_mismatch", implied=implied,
                  declared=declared_quantity, delta=implied - declared_quantity,
                  hint="a delta equal to the range count is an inclusive/half-open error")
    if gaps:
        log.info("serials.gaps", count=len(gaps), example=gaps[0],
                 note="expected where sub-ranges were retired or transferred away")

    return result
```

The mismatch hint earns its place. A delta exactly equal to the number of ranges is the signature of an inclusive range read as half-open, and it is the single most common defect in a serial ledger — recognisable instantly once you know to look, and otherwise mistaken for a rounding artefact for months.

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="st-t st-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="st-t">Legal state transitions for a serial range, and the one that triggers a restatement</title>
  <desc id="st-d">A state machine for a serial range. Issued moves to held when acquired, and held moves to retired when the holder retires it against a claim, which is terminal and expected. Held or issued moves to transferred when sold, which is terminal for this holder. Any state can move to cancelled when the registry cancels following a reversal or an error, and cancelled is terminal. A highlighted path marks the transition from retired to cancelled: credits already retired against a published claim that are subsequently cancelled force a restatement of that claim, because the retirement no longer rests on a valid credit. A panel notes that this is the only transition that reaches backwards into an already-published figure.</desc>
  <defs>
    <marker id="st-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">One transition reaches backwards into a published figure</text>
    <rect x="12" y="94" width="140" height="56" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="12" y="94" width="140" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="82" y="120" fill="currentColor" font-size="10.5" font-weight="700">issued</text>
    <text x="82" y="138" fill="currentColor" font-size="9" opacity="0.78">registry created it</text>
    <rect x="216" y="94" width="140" height="56" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="216" y="94" width="140" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="286" y="120" fill="currentColor" font-size="10.5" font-weight="700">held</text>
    <text x="286" y="138" fill="currentColor" font-size="9" opacity="0.78">in our account</text>
    <rect x="420" y="42" width="140" height="56" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="420" y="42" width="140" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="490" y="68" fill="currentColor" font-size="10.5" font-weight="700">transferred</text>
    <text x="490" y="86" fill="currentColor" font-size="9" opacity="0.78">sold on · terminal</text>
    <rect x="420" y="146" width="140" height="56" rx="9" fill="currentColor" opacity="0.14"/>
    <rect x="420" y="146" width="140" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <text x="490" y="172" fill="currentColor" font-size="10.5" font-weight="700">retired</text>
    <text x="490" y="190" fill="currentColor" font-size="9" opacity="0.78">claimed · published</text>
    <rect x="640" y="94" width="150" height="56" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="715" y="120" fill="currentColor" font-size="10.5" font-weight="700">cancelled</text>
    <text x="715" y="138" fill="currentColor" font-size="9" opacity="0.78">registry revoked it</text>
    <rect x="640" y="176" width="248" height="60" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="640" y="176" width="248" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="764" y="198" fill="#f3a712" font-size="9.5" font-weight="700">retired → cancelled = restatement</text>
    <text x="764" y="218" fill="currentColor" font-size="9" opacity="0.85">the claim no longer rests on a valid credit</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#st-arrow)">
    <line x1="152" y1="122" x2="214" y2="122"/>
    <path d="M356 110 C 386 100, 396 78, 418 72"/>
    <path d="M356 134 C 386 144, 396 168, 418 174"/>
    <path d="M560 68 C 600 78, 610 100, 638 110"/>
  </g>
  <path d="M560 174 C 600 168, 614 140, 638 128" fill="none" stroke="#f3a712" stroke-width="2.2" marker-end="url(#st-arrow)"/>
</svg>

## Deterministic Transformation Logic

The reconciler applies registry events to the local position as interval arithmetic, splitting ranges where events partially overlap, and separates the outcome into three buckets: unaffected, newly affected, and — the one that matters — affecting credits already retired against a published claim.

```python
from dataclasses import dataclass, asdict

import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class Reconciliation:
    project_id: str
    snapshot: str
    our_ranges_before: int
    our_credits_before: int
    our_ranges_after: int
    our_credits_after: int
    cancelled_from_held: int
    cancelled_from_retired: int      # the restatement trigger
    transferred_away: int
    restatement_required: bool


def apply_registry_events(position: list[SerialRange],
                          events: list[SerialRange]) -> tuple[list[SerialRange], dict]:
    """Apply cancellations and transfers to our position by interval arithmetic.

    Each event may split one of our ranges into two, leave it untouched, or
    consume it entirely — which is why the position is stored as ranges rather
    than as one row per holding.
    """
    remaining = list(position)
    impact = {"cancelled_from_held": 0, "cancelled_from_retired": 0,
              "transferred_away": 0}

    for event in events:
        if event.state not in ("cancelled", "transferred"):
            continue
        next_remaining: list[SerialRange] = []
        for held in remaining:
            hit = held.intersect(event)
            if hit is None:
                next_remaining.append(held)
                continue

            if event.state == "cancelled":
                key = "cancelled_from_retired" if held.state == "retired" \
                    else "cancelled_from_held"
                impact[key] += hit.count
            else:
                impact["transferred_away"] += hit.count

            # Keep whatever of our range the event did not touch.
            next_remaining.extend(held.subtract(event))

            log.info("serials.event_applied", project=held.project_id,
                     event=event.state, our_state=held.state,
                     range=(hit.start, hit.end), credits=hit.count)
        remaining = next_remaining

    return remaining, impact


def reconcile(project_id: str, snapshot: str, position: list[SerialRange],
              registry_events: list[SerialRange]) -> Reconciliation:
    """Reconcile one project's position against a registry snapshot."""
    before_ranges, before_credits = len(position), sum(r.count for r in position)

    after, impact = apply_registry_events(position, registry_events)

    result = Reconciliation(
        project_id=project_id, snapshot=snapshot,
        our_ranges_before=before_ranges, our_credits_before=before_credits,
        our_ranges_after=len(after), our_credits_after=sum(r.count for r in after),
        cancelled_from_held=impact["cancelled_from_held"],
        cancelled_from_retired=impact["cancelled_from_retired"],
        transferred_away=impact["transferred_away"],
        # Only cancellation of ALREADY-RETIRED credits reaches backwards into a
        # figure that has been published. Everything else changes the future.
        restatement_required=impact["cancelled_from_retired"] > 0,
    )

    if result.restatement_required:
        log.error("serials.restatement_required", **asdict(result),
                  note="credits retired against a published claim have been cancelled")
    else:
        log.info("serials.reconciled", **asdict(result))

    # Conservation check: nothing may appear from nowhere.
    accounted = (result.our_credits_after + result.cancelled_from_held
                 + result.cancelled_from_retired + result.transferred_away)
    if accounted != before_credits:
        raise RuntimeError(
            f"credits not conserved: {accounted} accounted vs {before_credits} before")

    return result
```

The conservation check at the end is the assertion worth keeping. Every credit in the position before reconciliation must appear afterwards in exactly one of four places — still held, cancelled from held, cancelled from retired, or transferred away — and a mismatch means the interval arithmetic dropped or duplicated something. It is cheap, it runs on every reconciliation, and it catches the class of bug that a totals-based ledger cannot even express.

## Compliance Gating & Audit Trail Generation

The reconciliation record is evidence, and four fields make it usable years later.

**The snapshot identity and its retrieval time**, so a discrepancy can be attributed to timing rather than error. A reconciliation without it asserts something about "the registry" with no statement of when.

**The per-range disposition**, not just the totals. When a verifier asks which specific credits backed a retirement claim, the answer is a list of intervals with their states — and reconstructing that from totals after the fact is impossible.

**The restatement flag with its cause.** A cancellation touching already-retired credits invalidates a published claim, which is a disclosure event with its own obligations, and it is materially different from a cancellation touching unretired holdings. Recording the distinction is what lets the disclosure be scoped correctly rather than defensively over-broad.

**The conservation assertion result**, because a reconciliation that did not check conservation is a reconciliation whose arithmetic nobody verified.

Route these into the evidence chain through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), keyed on the same run identifier as the crawl that produced the registry state, so the two can be joined without reconciling identifiers by hand.

<svg viewBox="0 -4 880 242" role="img" aria-labelledby="spl-t spl-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="spl-t">How one holding becomes five sub-ranges over four years of ordinary events</title>
  <desc id="spl-d">A single acquired holding from 90001 to 140000 tracked across four events. After acquisition it is one contiguous held range. A retirement of 100001 to 110000 splits it into two held ranges plus one retired range. A transfer of 130001 to 140000 removes the upper end, leaving two held ranges, one retired and one transferred. A cancellation of 105001 to 108000 cuts into the already-retired portion, splitting it and producing a cancelled-from-retired range that forces a restatement. The final position occupies five distinct sub-ranges. A panel notes that a schema with one row per holding was wrong after the first event, and that the count of sub-ranges only ever grows.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">One holding, four ordinary events, five sub-ranges</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">The count only ever grows — which is why one row per holding is wrong after the first event.</text>
    <text x="12" y="70" fill="currentColor" font-size="9.5" font-weight="700">Acquired</text>
    <text x="12" y="110" fill="currentColor" font-size="9.5" font-weight="700">After retirement</text>
    <text x="12" y="150" fill="currentColor" font-size="9.5" font-weight="700">After transfer</text>
    <text x="12" y="190" fill="currentColor" font-size="9.5" font-weight="700">After cancellation</text>
  </g>
  <g>
    <rect x="160" y="54" width="700" height="22" rx="4" fill="currentColor" opacity="0.3"/>
    <text x="510" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor">held · 90 001 – 140 000</text>
    <rect x="160" y="94" width="140" height="22" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="300" y="94" width="140" height="22" rx="4" fill="currentColor" opacity="0.16"/>
    <rect x="440" y="94" width="420" height="22" rx="4" fill="currentColor" opacity="0.3"/>
    <text x="370" y="110" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor">retired</text>
    <rect x="160" y="134" width="140" height="22" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="300" y="134" width="140" height="22" rx="4" fill="currentColor" opacity="0.16"/>
    <rect x="440" y="134" width="280" height="22" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="720" y="134" width="140" height="22" rx="4" fill="currentColor" opacity="0.08"/>
    <text x="790" y="150" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.8">transferred</text>
    <rect x="160" y="174" width="140" height="22" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="300" y="174" width="42" height="22" rx="4" fill="currentColor" opacity="0.16"/>
    <rect x="342" y="174" width="42" height="22" rx="4" fill="#f3a712" opacity="0.42"/>
    <rect x="384" y="174" width="56" height="22" rx="4" fill="currentColor" opacity="0.16"/>
    <rect x="440" y="174" width="280" height="22" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="720" y="174" width="140" height="22" rx="4" fill="currentColor" opacity="0.08"/>
    <text x="363" y="212" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f3a712">cancelled from retired</text>
    <text x="510" y="212" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">→ restatement</text>
  </g>
  <text x="12" y="234" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.85">Store one row per contiguous sub-range with a state, and every one of these transitions is a routine update rather than a schema problem.</text>
</svg>

## Production Integration

1. **Normalise every registry vocabulary into half-open integer intervals at ingestion**, in one place, and assert the implied count against the registry's stated quantity.
2. **Store the position as ranges with states**, one row per contiguous sub-range, never one row per holding.
3. **Reconcile against a verified crawl snapshot**, refusing to run against a crawl whose completeness could not be established.
4. **Apply events as interval arithmetic**, letting ranges split, and assert conservation afterwards.
5. **Separate the restatement case explicitly** and route it to the disclosure process rather than treating all cancellations alike.
6. **Retain retired and cancelled ranges permanently** — they are the record a claim is checked against, and deleting them makes the ledger unreconcilable.

For scale, interval arithmetic over a portfolio is trivial computationally: even a large holder tracks tens of thousands of ranges, which fits comfortably in memory and reconciles in seconds. The engineering effort goes into the normalisation at the boundary and the conservation assertions, not into performance.

## Frequently Asked Questions

### Why not just track quantities per project and vintage?

Because cancellations and retirements apply to specific serials, and quantities cannot express which. Two portfolios with identical quantities can be affected completely differently by the same cancellation, and no amount of totals arithmetic distinguishes them. Quantities are a summary you compute from intervals; treating them as the source of truth means the summary is the only thing you have when a specific question is asked.

### How should a registry that publishes only quantities be handled?

Record that limitation explicitly and reconcile at the coarsest granularity the registry supports, marking the position as quantity-tracked rather than serial-tracked. Some registries genuinely do not expose serials through their API even though they maintain them internally, in which case a serial-level claim cannot be substantiated from your data alone and the honest record says so. Where serials are available only in a document export, parsing that export is usually worth the effort precisely because it upgrades every subsequent claim.

### What causes a count mismatch equal to the number of ranges?

An inclusive range read as half-open, or the reverse. Each range is then off by exactly one credit, so the total is off by the range count — a signature specific enough to diagnose on sight. Fix the conversion at the ingestion boundary rather than adjusting the total, and add the implied-versus-declared assertion so the same defect cannot recur silently when a new registry is added.

### Are gaps in a position always a problem?

No, and treating them as one produces noise. Gaps are expected wherever a sub-range has been retired or transferred away, which is normal for any position of age. What matters is that every gap is explained by a recorded event — a gap with no corresponding retirement, transfer or cancellation is unaccounted, and that is the case worth raising. Checking gaps against the event log rather than against contiguity is the useful test.

### How are transfers between our own accounts handled?

As transfers, recorded with both account identifiers, and excluded from the transferred-away impact. An internal move changes custody without changing what the organisation holds, so netting it out of the impact figures while keeping it in the event log gives both the correct position and a complete audit trail. Collapsing internal moves entirely loses the ability to answer where a credit sat at a point in time, which registries increasingly ask about.

### What if the registry's own record and ours disagree on a range's state?

Investigate before adjusting, and never silently adopt the registry's view. A disagreement is either a timing artefact — an event we have not yet ingested — or a genuine discrepancy, and the two need different responses. Re-run the reconciliation against a fresh snapshot to eliminate timing, and if the disagreement survives, raise it with the registry with the specific interval and both states rather than adjusting the ledger to match. A ledger that silently converges on the registry cannot detect a registry error.

### How often should serial-level reconciliation run?

Monthly for the full position, and before any figure is published. Serial-level reconciliation is cheap once the crawl has run, so the cadence is really the crawl's cadence, and the publication-time run is the one that matters most — it is the last opportunity to catch a cancellation before it becomes a restatement rather than a correction.

### Should the ledger store the registry's raw event records too?

Yes, alongside the derived position. The position is what you reconcile and report against; the raw events are what let you rebuild it from scratch when a parsing bug is found, and they are what an auditor compares your interpretation against. Keeping both means a defect in the interval arithmetic is recoverable by replaying events rather than by re-crawling a registry that may no longer publish the same history.

The storage cost is negligible — a large portfolio generates thousands of events a year, not millions — and the recovery value is high. Treat the event log as the system of record and the position as a derived, rebuildable projection, which is the same relationship the raw and curated zones have elsewhere in the stack.

### How does vintage interact with serial ranges?

Vintage is an attribute of the range rather than a separate dimension, and conflating the two is a common source of double counting. A project's issuance for one vintage occupies a distinct serial range from the next vintage's, so a position spanning several vintages is simply several ranges with different vintage values — no special handling required. What does require care is a claim that draws on multiple vintages: it retires sub-ranges from each, and the retirement record must name every interval rather than a total per vintage, or the same reconstruction problem reappears one level down.

## Related guides

- [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) — the parent topic and the three failure modes this reconciliation defends against.
- [Handling Registry API Rate Limits and Idempotent Retries](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/handling-registry-api-rate-limits-and-idempotent-retries/) — the verified crawl this consumes.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — where the reconciliation record becomes audit evidence.
- [Permanence, Reversal & Leakage Monitoring](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/) — the upstream event that produces most cancellations.
