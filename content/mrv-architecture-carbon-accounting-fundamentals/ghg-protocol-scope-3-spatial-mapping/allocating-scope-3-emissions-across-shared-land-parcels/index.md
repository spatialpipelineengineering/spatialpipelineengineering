---
shortTitle: "Allocating Scope 3 Emissions Across Shared Land Parcels"
title: "Allocating Scope 3 Emissions Across Shared Land Parcels"
description: "Apportion land-use-change emissions across buyers sharing a parcel: allocation bases compared, a conservation-checked allocator in Python, partial-year and multi-tier handling, and the evidence a verifier asks for."
slug: allocating-scope-3-emissions-across-shared-land-parcels
type: guide
breadcrumb: "Allocating Across Shared Parcels"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Allocating Scope 3 Emissions Across Shared Land Parcels

A single hectare of converted forest usually supplies more than one buyer, and the emission it carries has to be divided among them. That division is not a measurement — it is a rule, applied to a measurement, and the same parcel produces materially different tonnages for the same buyer depending on which rule is chosen. This guide implements the allocation rigorously, within [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) in the [MRV architecture and carbon accounting fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack, and it assumes the fan-out controls from [preventing Scope 3 double-counting in spatial joins](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/preventing-scope-3-double-counting-in-spatial-joins/) are already in place.

The distinction worth holding onto is that double counting and misallocation are different failures with different fixes. Double counting is an arithmetic error — shares that sum above one — and it is caught by an assertion. Misallocation is a methodological error — shares that sum to exactly one under the wrong rule — and no assertion catches it, because the arithmetic is impeccable. The defence against the second is carrying the rule as data so the figure can be recomputed under a different one.

<svg viewBox="0 -4 940 262" role="img" aria-labelledby="alloc-t alloc-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="alloc-t">Four allocation bases applied to one parcel, and the spread they produce</title>
  <desc id="alloc-d">One 400 hectare parcel carrying 10000 tonnes of land-use-change emissions, supplying three buyers, allocated four ways. By physical area nominally assigned, buyer A receives 4500 tonnes, B 3500 and C 2000. By purchased mass, A receives 5500, B 3000 and C 1500. By purchased economic value, A receives 6200, B 2700 and C 1100. By contracted supply commitment, A receives 3800, B 3800 and C 2400. Every basis sums to 10000. Buyer A's figure ranges from 3800 to 6200, a spread of 63 percent of its lowest value. A panel notes that all four are defensible, that the methodology chooses, and that the chosen basis must therefore travel on the row.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Buyer A's figure ranges from 3 800 to 6 200 on identical measurements</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">One 400 ha parcel, 10 000 tCO₂e, three buyers, four defensible bases.</text>
    <text x="12" y="72" fill="currentColor" font-size="10" font-weight="700">By area</text>
    <text x="12" y="118" fill="currentColor" font-size="10" font-weight="700">By mass</text>
    <text x="12" y="164" fill="currentColor" font-size="10" font-weight="700">By value</text>
    <text x="12" y="210" fill="currentColor" font-size="10" font-weight="700">By commitment</text>
  </g>
  <g>
    <rect x="150" y="54" width="315" height="26" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="465" y="54" width="245" height="26" rx="4" fill="currentColor" opacity="0.18"/>
    <rect x="710" y="54" width="140" height="26" rx="4" fill="currentColor" opacity="0.09"/>
    <text x="307" y="72" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">A · 4 500</text>
    <text x="587" y="72" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">B · 3 500</text>
    <text x="780" y="72" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">C · 2 000</text>
    <rect x="150" y="100" width="385" height="26" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="535" y="100" width="210" height="26" rx="4" fill="currentColor" opacity="0.18"/>
    <rect x="745" y="100" width="105" height="26" rx="4" fill="currentColor" opacity="0.09"/>
    <text x="342" y="118" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">A · 5 500</text>
    <text x="640" y="118" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">B · 3 000</text>
    <text x="797" y="118" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">C · 1 500</text>
    <rect x="150" y="146" width="434" height="26" rx="4" fill="#f3a712" opacity="0.36"/>
    <rect x="584" y="146" width="189" height="26" rx="4" fill="currentColor" opacity="0.18"/>
    <rect x="773" y="146" width="77" height="26" rx="4" fill="currentColor" opacity="0.09"/>
    <text x="367" y="164" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">A · 6 200 — highest</text>
    <text x="678" y="164" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">B · 2 700</text>
    <text x="811" y="164" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">C · 1 100</text>
    <rect x="150" y="192" width="266" height="26" rx="4" fill="#f3a712" opacity="0.36"/>
    <rect x="416" y="192" width="266" height="26" rx="4" fill="currentColor" opacity="0.18"/>
    <rect x="682" y="192" width="168" height="26" rx="4" fill="currentColor" opacity="0.09"/>
    <text x="283" y="210" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">A · 3 800 — lowest</text>
    <text x="549" y="210" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">B · 3 800</text>
    <text x="766" y="210" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">C · 2 400</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="230" width="916" height="26" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="248" fill="currentColor" font-size="9.5" font-weight="700">Every row sums to 10 000. The arithmetic is never the question — the basis is, and it has to travel on the row.</text>
  </g>
</svg>

## Root Cause Analysis

Three structural features of supply-chain land data make allocation harder than a proportional split.

**The denominator is rarely observed.** Allocating by purchased mass requires knowing the parcel's total output, not just your share of it, and a buyer typically knows only its own purchases. Using your own volume over an estimated total introduces an error in the denominator that scales the whole allocation, and — worse — it is invisible in your own books because your shares still sum to one across the buyers you know about. The parcel's other buyers, whom you cannot see, are precisely what makes the denominator uncertain.

**Relationships are intervals, not facts.** A supplier relationship that begins in March and a conversion event that occurred in January are not connected in the way a naive join implies, and a relationship ending mid-year leaves a partial-period claim that must be apportioned in time as well as across buyers. Systems that treat the supplier link as a current-state attribute rather than a dated interval silently attribute a full year of a parcel's emissions to a relationship that lasted four months.

**Multi-tier chains compound the ambiguity.** Where a parcel supplies a processor that supplies several manufacturers, the allocation happens twice, and the two stages may use different bases — physical mass at the farm gate, economic value at the processor. Composing two allocations is legitimate; composing them without recording both is what makes the resulting figure unreconcilable against either supplier's own disclosure.

The failure mode common to all three is not an obviously wrong number. It is a number that is internally consistent, sums correctly, and cannot be reproduced by anyone else — including you, six months later.

## Diagnostic Pipeline / Pre-Flight Validation

Before allocating, verify that the inputs can support an allocation at all. Three checks matter: that a basis is available for every parcel-buyer pair, that the denominator is observed rather than inferred, and that relationship intervals overlap the emission event.

```python
from dataclasses import dataclass
from datetime import date

import structlog

log = structlog.get_logger()

VALID_BASES = {"area", "mass", "value", "commitment"}


@dataclass(frozen=True)
class SupplyLink:
    """A dated relationship, not a current-state attribute.

    Modelling this as an interval is what makes partial-period apportionment
    possible; a boolean 'is_supplier' flag cannot express a link that started
    after the conversion it is being asked to carry.
    """
    parcel_id: str
    buyer_id: str
    valid_from: date
    valid_to: date | None
    basis_value: float          # the buyer's share numerator, in the basis unit
    basis: str

    def overlap_days(self, start: date, end: date) -> int:
        lo = max(self.valid_from, start)
        hi = min(self.valid_to or end, end)
        return max(0, (hi - lo).days)


@dataclass(frozen=True)
class AllocationReadiness:
    parcel_id: str
    basis: str
    denominator_observed: bool
    links: int
    covered_fraction: float
    ready: bool
    reason: str | None


def assess(parcel_id: str, links: list[SupplyLink], declared_total: float | None,
           period_start: date, period_end: date) -> AllocationReadiness:
    """Can this parcel be allocated honestly, and on what basis?"""
    if not links:
        return AllocationReadiness(parcel_id, "none", False, 0, 0.0, False, "no_links")

    bases = {link.basis for link in links}
    if len(bases) > 1:
        # Mixing bases within one parcel produces shares that sum to one and
        # mean nothing — the arithmetic hides the incoherence.
        log.error("alloc.mixed_basis", parcel_id=parcel_id, bases=sorted(bases))
        return AllocationReadiness(parcel_id, "mixed", False, len(links), 0.0,
                                   False, "mixed_basis")
    basis = bases.pop()
    if basis not in VALID_BASES:
        return AllocationReadiness(parcel_id, basis, False, len(links), 0.0,
                                   False, "unknown_basis")

    known = sum(link.basis_value for link in links)
    denominator_observed = declared_total is not None
    denominator = declared_total if denominator_observed else known
    covered = known / denominator if denominator else 0.0

    reason = None
    if not denominator_observed:
        # Our own shares will sum to one regardless — which is exactly why an
        # unobserved denominator is dangerous rather than merely uncertain.
        log.warning("alloc.denominator_inferred", parcel_id=parcel_id,
                    known=known,
                    note="shares will sum to 1 across known buyers and may overstate each")
    elif covered > 1.0001:
        reason = "shares_exceed_declared_total"
        log.error("alloc.over_subscribed", parcel_id=parcel_id,
                  known=known, declared=declared_total)

    period_days = (period_end - period_start).days
    if not any(link.overlap_days(period_start, period_end) for link in links):
        reason = reason or "no_link_overlaps_period"

    return AllocationReadiness(parcel_id, basis, denominator_observed, len(links),
                               round(covered, 4), reason is None, reason)
```

The `denominator_inferred` warning is the one to act on. Shares computed over known buyers always sum to one, so an inferred denominator produces a self-consistent allocation that systematically overstates every known buyer's share by the fraction attributable to buyers you cannot see. It is not detectable from your own data, which is why it must be recorded as a property of the figure rather than discovered later.

<svg viewBox="0 -4 900 246" role="img" aria-labelledby="den-t den-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="den-t">Observed against inferred denominator, and the systematic overstatement it causes</title>
  <desc id="den-d">A parcel's output split between three known buyers and an unknown remainder. With an observed denominator, the known buyers hold 62 percent of the parcel's output between them, so they receive 62 percent of its emissions and the remaining 38 percent is attributed to buyers outside the disclosure. With an inferred denominator computed only from known buyers, the same three receive 100 percent of the emissions between them, overstating each by roughly 61 percent. A panel notes that the inferred case still passes every conservation check, because the shares sum to one across the buyers the pipeline can see, and that only an externally observed total exposes the gap.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Shares summing to one is not evidence of correctness</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">The same three buyers, with and without an observed parcel total.</text>
    <text x="12" y="74" fill="currentColor" font-size="10" font-weight="700">Observed total</text>
    <text x="12" y="90" fill="currentColor" font-size="9" opacity="0.7">registry or supplier declared</text>
    <text x="12" y="154" fill="currentColor" font-size="10" font-weight="700">Inferred total</text>
    <text x="12" y="170" fill="currentColor" font-size="9" opacity="0.7">summed from known buyers</text>
  </g>
  <g>
    <rect x="196" y="56" width="180" height="26" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="376" y="56" width="130" height="26" rx="4" fill="currentColor" opacity="0.2"/>
    <rect x="506" y="56" width="112" height="26" rx="4" fill="currentColor" opacity="0.12"/>
    <rect x="618" y="56" width="252" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="286" y="74" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">A · 2 800</text>
    <text x="441" y="74" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">B · 2 100</text>
    <text x="562" y="74" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">C · 1 300</text>
    <text x="744" y="74" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.8">unknown buyers · 3 800</text>
    <text x="196" y="110" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.85">known buyers hold 62% of output → 62% of the emissions</text>
    <rect x="196" y="136" width="290" height="26" rx="4" fill="#f3a712" opacity="0.36"/>
    <rect x="486" y="136" width="218" height="26" rx="4" fill="#f3a712" opacity="0.24"/>
    <rect x="704" y="136" width="166" height="26" rx="4" fill="#f3a712" opacity="0.14"/>
    <text x="341" y="154" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">A · 4 516</text>
    <text x="595" y="154" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">B · 3 387</text>
    <text x="787" y="154" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">C · 2 097</text>
    <text x="196" y="190" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">each overstated by ~61%, and the shares still sum to exactly one</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="206" width="876" height="30" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="226" fill="currentColor" font-size="9.5" font-weight="700">No conservation check catches this. Only an externally observed total does — so record which one you had.</text>
  </g>
</svg>

## Deterministic Transformation Logic

The allocator applies the basis, apportions in time where relationships are partial, and asserts conservation. It records the basis, the denominator source, and the period fraction on every output row, so the figure can be recomputed under a different rule without re-deriving the measurement.

```python
from dataclasses import dataclass, asdict
from datetime import date

import structlog

log = structlog.get_logger()

TOLERANCE = 1e-6


@dataclass(frozen=True)
class Allocation:
    parcel_id: str
    buyer_id: str
    period_start: str
    period_end: str
    basis: str
    denominator_source: str        # observed | inferred
    share: float
    period_fraction: float
    parcel_tco2e: float
    allocated_tco2e: float
    unallocated_tco2e: float       # the share belonging to buyers we cannot see


def allocate(parcel_id: str, parcel_tco2e: float, links: list[SupplyLink],
             declared_total: float | None, period_start: date,
             period_end: date) -> list[Allocation]:
    """Allocate one parcel's emissions across its buyers for one period.

    Two independent factors multiply: the buyer's share of the basis, and the
    fraction of the period its relationship actually covered. Collapsing them
    into one number loses the ability to explain either.
    """
    readiness = assess(parcel_id, links, declared_total, period_start, period_end)
    if not readiness.ready:
        raise ValueError(f"{parcel_id}: not allocatable ({readiness.reason})")

    known = sum(link.basis_value for link in links)
    denominator = declared_total if declared_total is not None else known
    source = "observed" if declared_total is not None else "inferred"
    period_days = max((period_end - period_start).days, 1)

    rows: list[Allocation] = []
    for link in links:
        share = link.basis_value / denominator
        fraction = link.overlap_days(period_start, period_end) / period_days
        if fraction == 0:
            continue                       # relationship did not cover this period
        rows.append(Allocation(
            parcel_id=parcel_id, buyer_id=link.buyer_id,
            period_start=period_start.isoformat(), period_end=period_end.isoformat(),
            basis=readiness.basis, denominator_source=source,
            share=round(share, 6), period_fraction=round(fraction, 6),
            parcel_tco2e=round(parcel_tco2e, 3),
            allocated_tco2e=round(parcel_tco2e * share * fraction, 3),
            unallocated_tco2e=0.0,
        ))

    allocated = sum(r.allocated_tco2e for r in rows)
    unallocated = parcel_tco2e - allocated

    # Conservation: allocated plus unallocated must equal the parcel's emission.
    # The unallocated remainder is a real quantity — the share belonging to
    # buyers outside our disclosure — not a rounding artefact to be absorbed.
    if abs(allocated + unallocated - parcel_tco2e) > TOLERANCE * max(parcel_tco2e, 1):
        raise RuntimeError(f"{parcel_id}: allocation not conserved")

    rows = [Allocation(**{**asdict(r), "unallocated_tco2e": round(unallocated, 3)})
            for r in rows]

    log.info("alloc.parcel", parcel_id=parcel_id, buyers=len(rows),
             basis=readiness.basis, denominator_source=source,
             allocated=round(allocated, 2), unallocated=round(unallocated, 2),
             coverage=round(allocated / parcel_tco2e, 4) if parcel_tco2e else 0.0)
    return rows


def assert_portfolio_conservation(rows: list[Allocation],
                                  parcel_totals: dict[str, float]) -> dict:
    """Across the portfolio, every parcel's allocations plus its unallocated
    remainder must reconstruct its emission exactly once."""
    by_parcel: dict[str, float] = {}
    for row in rows:
        by_parcel.setdefault(row.parcel_id, 0.0)
        by_parcel[row.parcel_id] += row.allocated_tco2e

    problems = {}
    for parcel_id, total in parcel_totals.items():
        allocated = by_parcel.get(parcel_id, 0.0)
        if allocated - total > TOLERANCE * max(total, 1):
            problems[parcel_id] = {"allocated": allocated, "parcel_total": total}

    if problems:
        log.error("alloc.over_allocated", parcels=len(problems),
                  example=next(iter(problems.items())))
        raise RuntimeError(f"{len(problems)} parcel(s) allocated above their emission")

    result = {"parcels": len(parcel_totals), "rows": len(rows),
              "allocated_total": round(sum(by_parcel.values()), 2),
              "parcel_total": round(sum(parcel_totals.values()), 2)}
    log.info("alloc.portfolio_conserved", **result)
    return result
```

The `unallocated_tco2e` column is the design decision that matters. Most implementations either omit it, implying the known buyers account for the whole parcel, or absorb it proportionally, which silently applies the inferred-denominator error. Carrying it explicitly makes the disclosure gap a number rather than an assumption, and it is the figure a reader most wants when assessing how complete a supply-chain inventory really is.

## Compliance Gating & Audit Trail Generation

Four fields turn an allocation into evidence, and all four are cheap to record at the time and impossible to reconstruct later.

**The basis and its source.** The methodology chooses the basis, so the record should name both the basis applied and the methodology clause requiring it. Where a methodology permits several, the choice and its justification belong in the record because a reviewer will otherwise assume the most favourable one was selected.

**The denominator source.** Observed versus inferred is the single most informative quality signal in a supply-chain allocation, and it changes how much weight a reader should give the figure. An inventory whose parcels are mostly inferred-denominator is making a much weaker claim than one whose parcels are observed, and the two look identical without the field.

**The period fraction.** A relationship covering four months of a year carries a third of the year's emission, and recording the fraction separately from the share is what lets a verifier check the temporal apportionment independently of the allocation basis.

**The unallocated remainder**, aggregated to the portfolio. This is the disclosure-completeness figure, and under a reasonable-assurance engagement it is the number that determines whether the inventory can be substantiated at all. Route these through the schema contract in the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) and the lineage chain in [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), so a figure can be traced to the specific parcel-buyer rows that produced it.

<svg viewBox="0 -4 900 244" role="img" aria-labelledby="tier-t tier-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="tier-t">A two-stage allocation through a processor, and why both bases must be recorded</title>
  <desc id="tier-d">A parcel emitting 10000 tonnes allocates to a processor by mass, giving the processor 4200 tonnes for its 42 percent of the parcel's output. The processor then allocates its own footprint to three manufacturers by economic value, giving them 1890, 1470 and 840 tonnes respectively. The effective share reaching the first manufacturer is 18.9 percent of the parcel, which is the product of a 42 percent mass share and a 45 percent value share. A panel notes that recording only the effective 18.9 percent makes the figure impossible to reconcile against either the parcel operator's or the processor's own disclosure, because neither of them ever computed that number.</desc>
  <defs>
    <marker id="tier-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Two allocations compose; record both, never only the product</text>
    <rect x="12" y="82" width="150" height="70" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="82" width="150" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="87" y="108" fill="currentColor" font-size="10.5" font-weight="700">Parcel</text>
    <text x="87" y="128" fill="currentColor" font-size="11" font-weight="700">10 000 t</text>
    <text x="87" y="144" fill="currentColor" font-size="9" opacity="0.78">land-use change</text>
    <rect x="290" y="82" width="164" height="70" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="290" y="82" width="164" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="372" y="108" fill="currentColor" font-size="10.5" font-weight="700">Processor</text>
    <text x="372" y="128" fill="currentColor" font-size="11" font-weight="700">4 200 t</text>
    <text x="372" y="144" fill="currentColor" font-size="9" opacity="0.78">42% by mass</text>
    <rect x="590" y="34" width="150" height="52" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="590" y="34" width="150" height="52" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="665" y="56" fill="currentColor" font-size="10" font-weight="700">Manufacturer A</text>
    <text x="665" y="74" fill="currentColor" font-size="10">1 890 t · 45% by value</text>
    <rect x="590" y="94" width="150" height="46" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="590" y="94" width="150" height="46" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="665" y="114" fill="currentColor" font-size="10" font-weight="700">Manufacturer B</text>
    <text x="665" y="130" fill="currentColor" font-size="10">1 470 t · 35%</text>
    <rect x="590" y="148" width="150" height="46" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="590" y="148" width="150" height="46" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="665" y="168" fill="currentColor" font-size="10" font-weight="700">Manufacturer C</text>
    <text x="665" y="184" fill="currentColor" font-size="10">840 t · 20%</text>
    <text x="226" y="106" fill="currentColor" font-size="9" font-weight="700" opacity="0.8">by mass</text>
    <text x="524" y="76" fill="currentColor" font-size="9" font-weight="700" opacity="0.8">by value</text>
    <rect x="768" y="66" width="120" height="88" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="828" y="92" fill="currentColor" font-size="9.5" font-weight="700">Effective share</text>
    <text x="828" y="114" fill="#f3a712" font-size="13" font-weight="700">18.9%</text>
    <text x="828" y="134" fill="currentColor" font-size="9" opacity="0.8">0.42 × 0.45</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#tier-arrow)">
    <line x1="162" y1="117" x2="288" y2="117"/>
    <path d="M454 104 C 500 92, 520 66, 588 60"/>
    <line x1="454" y1="117" x2="588" y2="117"/>
    <path d="M454 130 C 500 142, 520 166, 588 171"/>
  </g>
  <text x="450" y="228" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.85">Neither the parcel operator nor the processor ever computed 18.9% — so a figure recording only that number reconciles against nobody.</text>
</svg>

## Production Integration

1. **Model supplier relationships as dated intervals** from the start, never as current-state flags, and store the basis value per relationship rather than per buyer.
2. **Assess allocatability before allocating**, rejecting mixed bases within a parcel and recording where the denominator had to be inferred.
3. **Apply share and period fraction as separate factors**, and store both, so either can be checked without recomputing the other.
4. **Assert conservation per parcel and across the portfolio**, treating over-allocation as a hard failure rather than a warning.
5. **Carry the unallocated remainder** as a column and aggregate it into the completeness statement.
6. **Recompute under an alternative basis** at least once per period as a sensitivity check, and keep the comparison — it is the fastest way to show a reviewer that the chosen basis was not selected for its result.

For scale, allocation is a small join relative to the geospatial work upstream: a portfolio of a hundred thousand parcel-buyer pairs allocates in seconds. The engineering effort belongs in the interval modelling and the conservation assertions, both of which are cheap and both of which are what a verifier actually examines.

## Frequently Asked Questions

### Which allocation basis should be used?

Whichever the applicable methodology specifies — and where it permits a choice, the one that best reflects the physical relationship between the buyer and the land. Mass is usually the most defensible for agricultural commodities because it tracks what actually left the parcel; economic value is prescribed by some frameworks and is sensitive to price volatility that has nothing to do with emissions; area is appropriate only where the buyer genuinely has a claim on specific hectares. Whatever the choice, record it and be prepared to show the figure under an alternative.

### What should happen when a parcel's total output is unknown?

Allocate on the inferred denominator, mark the row as inferred, and carry the resulting overstatement risk into the disclosure rather than into the number. The alternative — refusing to allocate — removes the parcel from the inventory entirely, which understates rather than overstates and is not obviously better. What is not acceptable is treating an inferred denominator as observed, because the resulting figure is systematically high in a way nothing downstream can detect.

### How are multi-tier supply chains handled?

By composing allocations and recording each stage separately. A parcel allocated to a processor by mass, then from processor to manufacturers by value, produces a manufacturer-level figure that depends on both bases — so both must appear in the lineage. Collapsing the two into a single effective share loses the ability to reconcile against either intermediary's own disclosure, which is exactly the reconciliation a verifier will attempt.

### Does a relationship starting after a conversion event carry that event's emissions?

Under most methodologies, yes, for as long as the amortisation window runs — the emission is attached to the land and to sourcing from it, not to who was buying on the day of conversion. That is why relationships must be intervals: the correct treatment is to apportion the amortised annual figure over the period the relationship covered, which requires knowing both the event date and the relationship dates. A buyer joining in year three of a twenty-year amortisation carries years three onward, not the whole event and not nothing.

### How should shares be handled when a buyer's own records disagree?

Investigate before adjusting, and expect the disagreement to be about the denominator or the period rather than the arithmetic. The most common causes are a different view of the parcel's total output, a relationship interval recorded differently on the two sides, and one party amortising while the other assigns the whole event to the conversion year. Publishing your basis, denominator source, and period fractions alongside the figure turns that reconciliation from an argument into a comparison of stated assumptions.

### Is it double counting if two buyers both report emissions from the same parcel?

Not if their shares sum to at most one — that is correct behaviour, and it is the same structure as two reporting entities both counting a facility under different consolidation approaches. Double counting is shares summing above one across all buyers, which the portfolio conservation assertion catches. What the assertion cannot catch is two buyers each allocating on an inferred denominator, since each sees shares summing to one within its own view; that is the case where an industry-level view, or a supplier publishing its total output, is the only detection available.

### How much does the choice of basis actually move a corporate footprint?

Enough to be material for commodity-exposed companies and negligible for most others. Where land-use change dominates a footprint — food, agricultural inputs, forestry products — a switch between mass and value bases can move a category's total by tens of percent, because the two weight buyers very differently when product mix and price diverge. Running the sensitivity once tells you which regime you are in, and it is worth knowing before a methodology revision forces the change.

## Related guides

- [GHG Protocol Scope 3 Spatial Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) — the parent topic and the locatability limits on Scope 3 categories.
- [Preventing Scope 3 Double-Counting in Spatial Joins](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/preventing-scope-3-double-counting-in-spatial-joins/) — the fan-out controls this allocation assumes.
- [Step-by-Step GHG Protocol Scope 3 Geospatial Calculation](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/step-by-step-ghg-protocol-scope-3-geospatial-calculation/) — where the parcel emission being allocated comes from.
- [Mapping CSRD ESRS E1 Disclosures to Spatial MRV Outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/) — where the unallocated remainder becomes a completeness statement.
