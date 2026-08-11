---
shortTitle: "Dynamic vs Static Baselines for REDD Projects"
title: "Dynamic vs Static Baselines for REDD Projects"
description: "The engineering consequences of choosing a fixed ten-year baseline against a periodically recalculated jurisdictional one: data dependencies, restatement behaviour, crediting volatility, and what each demands of a pipeline."
slug: dynamic-vs-static-baselines-for-redd-projects
type: guide
breadcrumb: "Dynamic vs Static Baselines"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Dynamic vs Static Baselines for REDD Projects

A baseline is a counterfactual: how much forest would have been lost had the project not existed. Because the counterfactual is unobservable, every methodology substitutes something measurable for it, and the two families of substitute in current use behave completely differently as software. A static baseline is fixed at validation and held for a crediting period. A dynamic baseline is recalculated periodically from observed deforestation in a comparison region, so this year's issuance depends on data that did not exist when the project was designed. This guide covers what that difference costs a pipeline, within [forest carbon baseline and additionality modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/) in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack.

The engineering distinction is sharper than the methodological one. A static baseline is a constant the pipeline reads. A dynamic baseline is an output the pipeline computes, from third-party inputs, on a schedule the project does not control, with a result that can revise previously reported figures. Systems built for the first shape rarely survive contact with the second, and the migration between them — which VM0048 forced on a large part of the REDD portfolio — is where most of the pain has been.

<svg viewBox="0 -4 940 268" role="img" aria-labelledby="bl-t bl-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="bl-t">A static baseline against a dynamic one over a ten-year crediting period</title>
  <desc id="bl-d">A time series over ten years showing deforestation rate on the vertical axis. A flat horizontal line represents the static baseline, set at validation from the historical reference period and held constant for the whole crediting period. A stepped line represents the dynamic baseline, recalculated every two years from observed deforestation in the jurisdictional comparison region, which falls when regional pressure falls and rises when it rises. A third jagged line is the project's own observed deforestation, well below both. The credited volume is the gap between baseline and observed, shaded, and the two shadings are visibly different in later years: the static baseline keeps crediting at the original level while the dynamic one has fallen with regional pressure, producing far fewer credits from identical project performance.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Identical project performance, two baselines, different issuance</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">The gap between the lines is the credit. In year 8 the two disagree by more than half.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="70" y1="54" x2="70" y2="214"/>
    <line x1="70" y1="214" x2="700" y2="214"/>
  </g>
  <path d="M70 200 L133 196 L196 204 L259 194 L322 199 L385 191 L448 202 L511 195 L574 198 L637 193 L700 197" fill="none" stroke="currentColor" stroke-width="2" opacity="0.85"/>
  <line x1="70" y1="82" x2="700" y2="82" stroke="currentColor" stroke-width="2.4" stroke-dasharray="7,4"/>
  <path d="M70 90 L196 90 L196 108 L322 108 L322 134 L448 134 L448 160 L574 160 L574 152 L700 152" fill="none" stroke="#f3a712" stroke-width="2.6"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">
    <text x="62" y="86" text-anchor="end" font-weight="700">high</text>
    <text x="62" y="218" text-anchor="end" font-weight="700">0</text>
    <text x="70" y="234" font-size="9" opacity="0.72">yr 0</text>
    <text x="385" y="234" font-size="9" opacity="0.72" text-anchor="middle">yr 5</text>
    <text x="700" y="234" font-size="9" opacity="0.72" text-anchor="end">yr 10</text>
    <text x="30" y="134" transform="rotate(-90 30 134)" text-anchor="middle" font-weight="600">deforestation rate</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="716" y="76" fill="currentColor" font-weight="700">static baseline</text>
    <text x="716" y="92" fill="currentColor" opacity="0.75">fixed at validation,</text>
    <text x="716" y="108" fill="currentColor" opacity="0.75">held for 10 years</text>
    <text x="716" y="146" fill="#f3a712" font-weight="700">dynamic baseline</text>
    <text x="716" y="162" fill="currentColor" opacity="0.75">recalculated every 2 years</text>
    <text x="716" y="178" fill="currentColor" opacity="0.75">from the comparison region</text>
    <text x="716" y="204" fill="currentColor" font-weight="700">project observed</text>
    <text x="716" y="220" fill="currentColor" opacity="0.75">unchanged in both cases</text>
  </g>
  <text x="12" y="256" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.85">The project did the same thing either way. What changed was the counterfactual it is measured against — and whether that counterfactual can move after issuance.</text>
</svg>

## Root Cause Analysis

Three structural differences drive everything else, and each one lands somewhere specific in a pipeline.

**A static baseline is an input; a dynamic one is a dependency.** With a static baseline the deforestation rate to beat is a validated constant, versioned alongside the project design document and read like any other reference value. With a dynamic baseline the pipeline must ingest a jurisdictional activity-data product it does not own, on the publisher's schedule, in whatever format the publisher chose, with whatever restatements the publisher applies to prior years. That is an integration with an external party, and it needs the treatment integrations get — schema pinning, version capture, availability monitoring, and a defined behaviour when the upstream product is late.

**A dynamic baseline makes past results revisable.** When the comparison region's historical rate is restated — because the jurisdiction reprocessed its imagery, or corrected a classification error, or extended its reference period — the baseline for periods already credited changes. Whether that triggers a restatement of issued credits is a methodological question with different answers in different programmes, but the pipeline must at minimum be able to answer what the figure was, what it is now, and why. A pipeline that overwrites the baseline in place cannot answer any of those.

**The volatility profile is completely different.** A static baseline produces smooth, predictable issuance and a well-known risk: if regional deforestation collapses for reasons unrelated to the project, the project keeps crediting against a counterfactual that no longer describes anything. A dynamic baseline removes that risk and adds another: issuance now varies year to year with regional conditions the project cannot influence, which makes revenue forecasting harder and makes a bad year attributable to a neighbouring jurisdiction's enforcement campaign.

The failure mode that connects all three is a pipeline that models the baseline as a scalar in a configuration file. That representation is adequate for exactly one of the two families, and converting it later means touching every calculation that read it.

## Diagnostic Pipeline / Pre-Flight Validation

Before a period can be credited under either regime, the baseline that will be used has to be resolved, verified as applicable to the period, and frozen. Under a dynamic regime that resolution is the step where most errors originate, because it involves choosing among several vintages of an external product.

```python
from dataclasses import dataclass
from datetime import date

import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class BaselineVintage:
    """One published version of a baseline rate, with its provenance.

    A dynamic baseline is never a single number — it is a series of vintages,
    and which one applies to a monitoring period is a decision that must be
    recorded rather than implied by whatever was current at run time.
    """
    baseline_id: str
    regime: str                 # static | dynamic
    rate_ha_yr: float
    applies_from: date
    applies_to: date
    source_product: str
    source_version: str
    published_on: date
    supersedes: str | None


@dataclass(frozen=True)
class MonitoringPeriod:
    period_id: str
    start: date
    end: date
    observed_loss_ha: float


class BaselineResolutionError(RuntimeError):
    """Raised when no single vintage unambiguously covers the period."""


def resolve_baseline(
    period: MonitoringPeriod,
    vintages: list[BaselineVintage],
    *,
    as_of: date,
) -> BaselineVintage:
    """Pick the vintage that governs a period, as known at a stated date.

    `as_of` is mandatory and is the point of the function. Resolving 'the
    current baseline' is not reproducible — the same call next year returns
    something different. Resolving 'the baseline as known on 2027-03-01'
    returns the same answer forever, which is what an audit needs.
    """
    candidates = [
        v for v in vintages
        if v.published_on <= as_of
        and v.applies_from <= period.start
        and v.applies_to >= period.end
    ]

    if not candidates:
        raise BaselineResolutionError(
            f"no baseline vintage published by {as_of} covers period "
            f"{period.period_id} ({period.start}..{period.end}); the "
            "jurisdictional product may be late — do not fall back to the "
            "previous vintage silently"
        )

    # Latest publication wins; ties are a data error, not a preference.
    latest = max(candidates, key=lambda v: v.published_on)
    same_date = [v for v in candidates if v.published_on == latest.published_on]
    if len(same_date) > 1:
        raise BaselineResolutionError(
            f"{len(same_date)} vintages share publication date "
            f"{latest.published_on} for period {period.period_id}: "
            + ", ".join(v.baseline_id for v in same_date)
        )

    superseded = [v.baseline_id for v in candidates if v.baseline_id != latest.baseline_id]
    log.info(
        "baseline.resolved",
        period=period.period_id,
        baseline=latest.baseline_id,
        regime=latest.regime,
        rate_ha_yr=latest.rate_ha_yr,
        as_of=as_of.isoformat(),
        superseded=superseded,
    )
    return latest


def assert_comparison_region_current(
    vintage: BaselineVintage, period: MonitoringPeriod, *, max_lag_days: int = 550
) -> None:
    """A dynamic baseline built from stale regional data is a static one.

    The whole justification for the dynamic regime is that the counterfactual
    tracks current regional pressure. When the underlying product has not been
    refreshed within roughly the recalculation interval, that justification
    is gone and the fact should surface rather than be absorbed.
    """
    if vintage.regime != "dynamic":
        return

    lag = (period.end - vintage.published_on).days
    if lag > max_lag_days:
        raise BaselineResolutionError(
            f"dynamic baseline {vintage.baseline_id} was published "
            f"{lag} days before the end of period {period.period_id}, "
            f"beyond the {max_lag_days}-day freshness limit — it no longer "
            "reflects current regional pressure"
        )
```

The mandatory `as_of` argument is the single most valuable line in this module. It converts every baseline lookup from a query about the present into a query about a stated moment, which is what makes a recomputation two years later reproduce the original number instead of quietly producing a better one.

<svg viewBox="0 -4 900 272" role="img" aria-labelledby="dep-t dep-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="dep-t">What each regime demands of the pipeline, side by side</title>
  <desc id="dep-d">Two columns comparing pipeline obligations. Under a static baseline the pipeline reads a validated constant, has no external dependency, produces stable issuance, restates only when the project itself restates, and needs a single frozen reference value under version control. Under a dynamic baseline the pipeline ingests a third-party jurisdictional product on the publisher's schedule, must handle late and restated upstream data, produces issuance that varies with regional conditions outside the project's control, must be able to reproduce any past figure as it stood on a stated date, and needs a full vintage table rather than a constant. A panel notes that the second column is an integration with an external party and should be engineered as one.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The same calculation, two very different systems around it</text>
    <rect x="12" y="36" width="430" height="180" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="36" width="430" height="180" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="28" y="60" fill="currentColor" font-size="10.5" font-weight="700">Static baseline</text>
    <text x="28" y="86" fill="currentColor" font-size="9.5" opacity="0.85">reads a validated constant</text>
    <text x="28" y="108" fill="currentColor" font-size="9.5" opacity="0.85">no external dependency</text>
    <text x="28" y="130" fill="currentColor" font-size="9.5" opacity="0.85">issuance is smooth and forecastable</text>
    <text x="28" y="152" fill="currentColor" font-size="9.5" opacity="0.85">restates only when the project does</text>
    <text x="28" y="174" fill="currentColor" font-size="9.5" opacity="0.85">storage: one versioned value</text>
    <text x="28" y="200" fill="currentColor" font-size="9" opacity="0.72">risk: the counterfactual stops describing reality</text>
    <rect x="462" y="36" width="426" height="180" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="478" y="60" fill="currentColor" font-size="10.5" font-weight="700">Dynamic baseline</text>
    <text x="478" y="86" fill="currentColor" font-size="9.5" opacity="0.85">ingests a jurisdictional product</text>
    <text x="478" y="108" fill="currentColor" font-size="9.5" opacity="0.85">handles late and restated upstream data</text>
    <text x="478" y="130" fill="currentColor" font-size="9.5" opacity="0.85">issuance varies with the region</text>
    <text x="478" y="152" fill="currentColor" font-size="9.5" opacity="0.85">must reproduce any figure as-of a date</text>
    <text x="478" y="174" fill="currentColor" font-size="9.5" opacity="0.85">storage: a vintage table</text>
    <text x="478" y="200" fill="#f3a712" font-size="9" font-weight="700">risk: a neighbour's enforcement year cuts issuance</text>
    <rect x="12" y="230" width="876" height="30" rx="8" fill="currentColor" opacity="0.06"/>
    <text x="450" y="250" text-anchor="middle" fill="currentColor" font-size="9.5" opacity="0.85">The right-hand column is an external integration. Engineer it as one, or it will fail like one.</text>
  </g>
</svg>

## Deterministic Transformation Logic

The crediting calculation itself is short. What makes it defensible is that every input to it is captured at the moment of calculation, so the result can be regenerated later without needing the world to still be in the state it was.

```python
from dataclasses import dataclass, asdict
from datetime import date


@dataclass(frozen=True)
class CreditingResult:
    """A crediting calculation with every input that produced it.

    Everything needed to reproduce the number is inside this record. Nothing
    in it is a reference to mutable external state, which is what allows a
    verifier in 2033 to check a 2027 figure.
    """
    period_id: str
    baseline_id: str
    baseline_regime: str
    baseline_rate_ha_yr: float
    baseline_as_of: date
    source_product: str
    source_version: str
    observed_loss_ha: float
    period_years: float
    avoided_loss_ha: float
    carbon_density_tco2e_ha: float
    gross_tco2e: float
    leakage_deduction_tco2e: float
    uncertainty_deduction_tco2e: float
    net_tco2e: float


def compute_crediting(
    period: MonitoringPeriod,
    vintage: BaselineVintage,
    *,
    as_of: date,
    carbon_density_tco2e_ha: float,
    leakage_rate: float,
    uncertainty_rate: float,
) -> CreditingResult:
    """Avoided loss against the resolved baseline, with deductions applied.

    Negative avoided loss is preserved rather than clamped: a period where
    the project lost more forest than the baseline predicted is real
    information, and clamping it to zero converts a bad period into a
    neutral one, which compounds across a crediting period.
    """
    years = (period.end - period.start).days / 365.25
    expected_loss_ha = vintage.rate_ha_yr * years
    avoided_ha = expected_loss_ha - period.observed_loss_ha

    gross = avoided_ha * carbon_density_tco2e_ha
    leakage = max(0.0, gross) * leakage_rate
    uncertainty = max(0.0, gross - leakage) * uncertainty_rate

    return CreditingResult(
        period_id=period.period_id,
        baseline_id=vintage.baseline_id,
        baseline_regime=vintage.regime,
        baseline_rate_ha_yr=vintage.rate_ha_yr,
        baseline_as_of=as_of,
        source_product=vintage.source_product,
        source_version=vintage.source_version,
        observed_loss_ha=period.observed_loss_ha,
        period_years=round(years, 4),
        avoided_loss_ha=round(avoided_ha, 3),
        carbon_density_tco2e_ha=carbon_density_tco2e_ha,
        gross_tco2e=round(gross, 2),
        leakage_deduction_tco2e=round(leakage, 2),
        uncertainty_deduction_tco2e=round(uncertainty, 2),
        net_tco2e=round(gross - leakage - uncertainty, 2),
    )


def diff_against_prior(
    current: CreditingResult, prior: CreditingResult
) -> dict[str, tuple[object, object]]:
    """Field-level differences between two runs of the same period.

    Under a dynamic regime this runs on every recalculation and its output is
    the restatement note. An empty dict means the period is unchanged; a dict
    containing only baseline fields means the project's own data is stable
    and the movement came from upstream.
    """
    if current.period_id != prior.period_id:
        raise ValueError("cannot diff crediting results for different periods")

    a, b = asdict(prior), asdict(current)
    return {k: (a[k], b[k]) for k in a if a[k] != b[k]}
```

The `diff_against_prior` helper does more work than its size suggests. Under a dynamic regime, every recalculation potentially moves a previously reported figure, and the difference between "our monitoring changed" and "the jurisdiction restated its history" is the first question anyone will ask. Producing that answer mechanically from the two records removes the investigation entirely.

## Compliance Gating & Audit Trail Generation

Both regimes need the crediting result persisted immutably per period per run, but the dynamic regime needs three additional things.

A record of every recalculation, not just the latest. The set of `CreditingResult` records for a period, ordered by `baseline_as_of`, is the restatement history, and it is what a verifier reads to understand why an issued volume differs from a reported one.

The upstream product's own version and publication date, captured at ingestion rather than looked up later. Jurisdictional products are frequently republished under the same name, and a version string captured after the fact describes what is available now rather than what was used.

An explicit decision when the upstream product is late. The resolution function above refuses rather than falling back, and the operational counterpart is a documented choice: delay the monitoring report, or issue against the prior vintage with a stated note. Either is defensible; making the choice implicitly in code is not, because the pipeline then quietly credits against a baseline the methodology may no longer consider valid.

## Production Integration

Projects converting from static to dynamic baselines — the direction the market has moved — should expect the work to land in ingestion and storage rather than in the crediting arithmetic. The calculation barely changes. What changes is that a constant becomes a table with validity intervals, every read acquires an `as_of`, and the pipeline grows a dependency whose availability it does not control.

The pattern that works is to treat the jurisdictional baseline exactly as [versioning emission factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) treats factor tables: append-only vintages, validity intervals, mandatory as-of resolution, and a refusal to interpolate across a gap. The problems are the same problems, and a project that has already solved them for emission factors has most of the machinery.

One further consideration applies to projects running both regimes at once, which is more common than it sounds during a transition. Keep the two paths structurally identical — same result record, same resolution function, with the regime as a field rather than a branch — so that comparing what a period would have earned under each is a query rather than a parallel implementation. That comparison is usually the first thing a project developer asks for, and building it in costs nothing at the start.

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="rest-t rest-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rest-t">A restatement, and how the audit record separates upstream movement from project movement</title>
  <desc id="rest-d">A timeline showing one monitoring period calculated three times. The first calculation in March 2027 uses baseline vintage one and reports a net volume. The second calculation in March 2029 uses vintage two, published after the jurisdiction reprocessed its historical imagery, and reports a lower net volume; the field-level difference shows only baseline fields changing, so the note reads upstream restatement, project data unchanged. The third calculation in March 2031 uses vintage two still but with corrected project monitoring, and the difference shows only observed loss changing, so the note reads project restatement, baseline unchanged. A panel notes that the distinction is produced mechanically by diffing the two stored records, not by investigation.</desc>
  <defs>
    <marker id="rest-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">One period, three calculations, two different reasons for moving</text>
    <rect x="12" y="40" width="272" height="120" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="40" width="272" height="120" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="28" y="64" fill="currentColor" font-size="10.5" font-weight="700">2027-03 · first calculation</text>
    <text x="28" y="88" fill="currentColor" font-size="9.5" opacity="0.85">baseline vintage v1</text>
    <text x="28" y="110" fill="currentColor" font-size="9.5" opacity="0.85">observed loss 412 ha</text>
    <text x="28" y="132" fill="currentColor" font-size="9.5" font-weight="700">net 184,200 tCO₂e</text>
    <text x="28" y="152" fill="currentColor" font-size="9" opacity="0.7">reported and issued</text>
    <rect x="314" y="40" width="272" height="120" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="330" y="64" fill="currentColor" font-size="10.5" font-weight="700">2029-03 · recalculated</text>
    <text x="330" y="88" fill="#f3a712" font-size="9.5" font-weight="700">baseline vintage v2</text>
    <text x="330" y="110" fill="currentColor" font-size="9.5" opacity="0.85">observed loss 412 ha — same</text>
    <text x="330" y="132" fill="currentColor" font-size="9.5" font-weight="700">net 141,800 tCO₂e</text>
    <text x="330" y="152" fill="#f3a712" font-size="9" font-weight="700">diff: baseline fields only</text>
    <rect x="616" y="40" width="272" height="120" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="616" y="40" width="272" height="120" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="632" y="64" fill="currentColor" font-size="10.5" font-weight="700">2031-03 · recalculated</text>
    <text x="632" y="88" fill="currentColor" font-size="9.5" opacity="0.85">baseline vintage v2 — same</text>
    <text x="632" y="110" fill="currentColor" font-size="9.5" font-weight="700">observed loss 438 ha</text>
    <text x="632" y="132" fill="currentColor" font-size="9.5" font-weight="700">net 130,100 tCO₂e</text>
    <text x="632" y="152" fill="currentColor" font-size="9" font-weight="700">diff: project fields only</text>
    <rect x="12" y="186" width="876" height="52" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="186" width="876" height="52" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="450" y="208" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">Which one moved is answered by diffing two stored records.</text>
    <text x="450" y="228" text-anchor="middle" fill="currentColor" font-size="9.5" opacity="0.85">Without both records stored in full, the same question takes a week and ends in an assertion nobody can check.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#rest-arrow)">
    <line x1="284" y1="100" x2="312" y2="100"/><line x1="586" y1="100" x2="614" y2="100"/>
  </g>
</svg>

## Frequently Asked Questions

### Does a dynamic baseline eliminate over-crediting?

It removes one specific mechanism of it — a baseline drifting away from regional reality over a long fixed period — and leaves others intact. It does nothing about carbon density estimates, nothing about leakage, and nothing about whether the comparison region is genuinely comparable to the project area. Choosing the comparison region is in fact where the discretion moves to: a region with high deforestation pressure produces a high baseline and generous crediting, and that choice is now the lever it was previously not worth pulling.

### How should a pipeline behave when the jurisdictional product is late?

Refuse to resolve rather than falling back to the prior vintage, and let the delay surface as an operational decision. Falling back looks harmless and is the failure this whole design is built to prevent: it produces a number that appears current, was computed against stale inputs, and carries no marker distinguishing it from a properly resolved one. If the programme permits issuing against the prior vintage, that is a decision to record explicitly on the result, not a default in the resolution code.

### What happens to credits already issued when the baseline is restated downward?

That depends on the programme rather than on the engineering, and the answers range from no adjustment for issued vintages, through adjustment of future issuance to compensate, to formal cancellation obligations in the strictest cases. What the pipeline owes regardless is the ability to state both figures and the reason for the difference. Projects that cannot do that end up negotiating from a position where the buyer's analyst has reconstructed the discrepancy and the project has not.

### Is a static baseline still defensible for new projects?

For most forest projects in programmes that have adopted VM0048 or its equivalents, the choice has effectively been made. Static baselines remain in use for project types where no jurisdictional comparison data exists at usable quality, and for shorter crediting periods where drift has less room to accumulate. Where a static baseline is used, expect the validation to scrutinise the reference period selection heavily, since it is now the only defence against the drift a dynamic baseline handles automatically.

### How much does issuance actually vary under a dynamic regime?

Enough to matter for financing. Regional deforestation rates commonly move by tens of percent between recalculation cycles in response to enforcement, commodity prices, and weather, and the baseline moves with them while the project's own performance may be flat. A project modelling revenue should model the baseline as a distribution rather than a line, and should be explicit that a well-performing project can see issuance fall for reasons entirely outside its control.

### Should the comparison region be re-selected at each recalculation?

No — re-selecting it is exactly the discretion the regime is meant to remove. Fix the comparison region at validation, document the selection criteria, and recalculate only the rate observed within it. A pipeline that stores the region's geometry with the same vintage discipline as the rate makes this checkable, and makes an attempt to quietly redraw the region visible as a geometry change rather than as a rate change.

### Can the two regimes be compared retrospectively to justify a choice?

Yes, and it is worth doing before committing. Run both against the project's actual history: the static baseline as it would have been fixed at validation, and the dynamic one as it would have been recalculated. The difference in cumulative issuance over five or ten years is usually large and often surprising in direction. Keeping the regime as a field rather than a branch, as described above, makes this a query over stored results rather than a modelling exercise.

## Related guides

- [Forest Carbon Baseline and Additionality Modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/) — the parent topic and the additionality argument a baseline supports.
- [Modeling Additionality Baselines for REDD Projects](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/modeling-additionality-baselines-for-redd-projects/) — constructing the baseline this guide chooses between.
- [Versioning Emission Factor Databases for Reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) — the vintage discipline a dynamic baseline needs.
- [Verra VM0047 vs Gold Standard GIS Requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/) — the methodology side of the same decision.
