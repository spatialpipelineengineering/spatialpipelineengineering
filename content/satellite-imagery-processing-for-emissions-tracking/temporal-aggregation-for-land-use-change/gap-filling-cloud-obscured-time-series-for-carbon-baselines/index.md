---
shortTitle: "Gap-Filling Cloud-Obscured Time Series for Carbon Baselines"
title: "Gap-Filling Cloud-Obscured Time Series for Carbon Baselines"
description: "Filling cloud gaps in a satellite time series without inventing a baseline: which methods are defensible, how to propagate fill uncertainty, and when a gap should be left as a gap and reported."
slug: gap-filling-cloud-obscured-time-series-for-carbon-baselines
type: guide
breadcrumb: "Gap-Filling Cloud-Obscured Series"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Gap-Filling Cloud-Obscured Time Series for Carbon Baselines

A carbon baseline built from optical satellite imagery in the humid tropics is built on a time series with holes in it. Persistent cloud in some regions leaves fewer than a handful of clear observations per year, and a baseline period spanning ten years may have entire wet seasons with nothing usable. Every pipeline fills those gaps somehow, and the question that matters is whether the fill is a stated estimate with its own uncertainty or an invisible interpolation that the baseline then treats as data. This guide covers the difference, within [temporal aggregation for land use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) in the [satellite imagery processing for emissions tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack.

The stakes are specific rather than general. Cloud is not randomly distributed in time: it clusters in the wet season, which in many forest landscapes is also when deforestation activity is lowest and when flooding is highest. A gap-filling method that carries the last clear value forward therefore extends dry-season conditions across the wet season, and one that interpolates linearly across a long gap smooths out any event that occurred inside it. Both produce a baseline that is systematically biased, in a direction that depends on the local seasonality of clearing.

<svg viewBox="0 -4 940 268" role="img" aria-labelledby="gap-t gap-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="gap-t">Four fills across the same wet-season gap, and what each asserts</title>
  <desc id="gap-d">A time series of a vegetation index with clear observations either side of a long wet-season gap, and a clearing event that occurred inside the gap. Four candidate fills are drawn across it. Last observation carried forward holds the pre-gap value flat and then drops abruptly at the first post-gap observation, placing the event at the wrong date and asserting the forest was intact throughout. Linear interpolation draws a straight line between the two endpoints, smearing the abrupt event into a gradual decline and understating the loss at every intermediate date. A seasonal climatology fill follows the pixel's typical annual curve and also misses the event, but at least does not assert dry-season conditions through the wet season. A fill marked as unobserved leaves the interval blank with an uncertainty envelope spanning the full plausible range, which is the only one of the four that does not assert something false. A panel notes that the event is invisible to all four, and that only the fourth says so.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">A clearing happened inside the gap. None of the four fills can see it.</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Three of them assert it did not happen. One of them says it does not know.</text>
  </g>
  <rect x="260" y="48" width="300" height="164" fill="currentColor" opacity="0.07"/>
  <text x="410" y="66" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.7" font-weight="700">wet season — no clear observation</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="70" y1="48" x2="70" y2="212"/><line x1="70" y1="212" x2="640" y2="212"/>
  </g>
  <g fill="currentColor">
    <circle cx="100" cy="88" r="4"/><circle cx="150" cy="84" r="4"/><circle cx="200" cy="90" r="4"/><circle cx="250" cy="86" r="4"/>
    <circle cx="580" cy="176" r="4"/><circle cx="620" cy="180" r="4"/>
  </g>
  <path d="M250 86 L560 86 L570 176 L620 180" fill="none" stroke="currentColor" stroke-width="1.8" opacity="0.55"/>
  <path d="M250 86 L580 176" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="6,4" opacity="0.75"/>
  <path d="M250 86 C320 100 380 118 440 116 C500 114 540 150 580 176" fill="none" stroke="#f3a712" stroke-width="1.8" opacity="0.8"/>
  <rect x="262" y="76" width="316" height="112" fill="#f3a712" opacity="0.13"/>
  <line x1="420" y1="86" x2="420" y2="180" stroke="#f3a712" stroke-width="2.2"/>
  <text x="420" y="234" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#f3a712" font-weight="700">the actual clearing date</text>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="656" y="90" fill="currentColor" font-weight="700">LOCF</text>
    <text x="656" y="106" fill="currentColor" opacity="0.75">event dated at the first</text>
    <text x="656" y="122" fill="currentColor" opacity="0.75">post-gap observation</text>
    <text x="656" y="146" fill="currentColor" font-weight="700">Linear</text>
    <text x="656" y="162" fill="currentColor" opacity="0.75">abrupt loss smeared into</text>
    <text x="656" y="178" fill="currentColor" opacity="0.75">a gradual decline</text>
    <text x="656" y="202" fill="#f3a712" font-weight="700">Climatology / envelope</text>
    <text x="656" y="218" fill="currentColor" opacity="0.75">follows the seasonal shape;</text>
    <text x="656" y="234" fill="currentColor" opacity="0.75">shading = plausible range</text>
  </g>
  <text x="12" y="258" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.85">Whichever fill is chosen, the baseline must carry the width of that shaded region into its uncertainty — otherwise the gap becomes free precision.</text>
</svg>

## Root Cause Analysis

Three properties of cloud gaps determine which fills are defensible and which are not.

**Gaps are not missing at random.** The statistical machinery for imputation mostly assumes missingness unrelated to the value being imputed, and cloud violates that in two ways at once. Cloud correlates with season, and season correlates with both vegetation state and clearing activity. It also correlates with the phenomenon itself in one important case: burning produces smoke and haze that trigger cloud masks, so the pixels most likely to be obscured immediately after a fire are the ones that just changed. A fill that assumes randomness therefore imputes the pre-event value at precisely the moment the event occurred.

**Gap length changes which method is appropriate, discontinuously.** Interpolating across a two-week gap between clear observations is nearly free of risk in stable forest, because vegetation changes slowly and the endpoints constrain the interior tightly. Interpolating across a five-month wet season is a different operation entirely: the endpoints constrain almost nothing, and an abrupt event anywhere inside is invisible. Treating both with the same function is the usual structural error, and the fix is a hard length threshold above which fill is refused rather than performed less confidently.

**A fill that is not marked propagates as data.** This is the mechanism by which gap-filling causes real harm. A filled value written into the same column as an observed one, with no accompanying flag, is consumed downstream by a change detection algorithm that has no way to weight it lower, by a zonal statistic that counts it equally, and by an uncertainty calculation that treats it as an independent observation. The fill may have been reasonable; the failure is that its provenance was lost one step after it was created.

The practical consequence is that the fill method matters less than the accounting around it. A crude fill that is flagged, weighted, and carried into the uncertainty budget is safer than a sophisticated one that is silently written into the observation column.

## Diagnostic Pipeline / Pre-Flight Validation

Before filling, characterise the gaps. The two numbers that decide everything are the longest gap and the fraction of the period spent in gaps, computed per pixel rather than for the scene, because scene-level cloud statistics hide the persistently obscured corners where the problem actually lives.

```python
from dataclasses import dataclass
from datetime import date, timedelta

import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class ClearObservation:
    observed_on: date
    value: float
    quality: float          # 0–1 confidence from the mask, not a hard flag


@dataclass(frozen=True)
class GapProfile:
    """Per-pixel gap structure over the analysis period."""
    pixel_id: str
    period_start: date
    period_end: date
    n_clear: int
    longest_gap_days: int
    gap_day_fraction: float
    wet_season_clear_fraction: float
    fillable: bool
    reason: str


MAX_FILL_GAP_DAYS = 90
MIN_CLEAR_PER_YEAR = 4


def profile_gaps(
    pixel_id: str,
    obs: list[ClearObservation],
    period_start: date,
    period_end: date,
    wet_season_months: frozenset[int],
) -> GapProfile:
    """Describe a pixel's observability before deciding how to treat it.

    The wet-season clear fraction is reported separately because a pixel with
    adequate annual coverage concentrated entirely in the dry season is not
    adequately observed — its baseline describes dry-season conditions and
    is silent about half the year.
    """
    ordered = sorted(obs, key=lambda o: o.observed_on)
    if not ordered:
        return GapProfile(
            pixel_id, period_start, period_end, 0,
            (period_end - period_start).days, 1.0, 0.0,
            False, "no clear observations in the period",
        )

    edges = [period_start] + [o.observed_on for o in ordered] + [period_end]
    gaps = [(edges[i + 1] - edges[i]).days for i in range(len(edges) - 1)]
    longest = max(gaps)
    total_days = (period_end - period_start).days

    wet_obs = [o for o in ordered if o.observed_on.month in wet_season_months]
    wet_days = sum(
        1 for d in range(total_days)
        if (period_start + timedelta(days=d)).month in wet_season_months
    )
    wet_fraction = len(wet_obs) / (wet_days / 30.0) if wet_days else 0.0

    years = max(total_days / 365.25, 1e-6)
    per_year = len(ordered) / years

    if per_year < MIN_CLEAR_PER_YEAR:
        fillable, reason = False, (
            f"{per_year:.1f} clear observations per year is below the "
            f"{MIN_CLEAR_PER_YEAR} needed to constrain a seasonal shape"
        )
    elif longest > MAX_FILL_GAP_DAYS:
        fillable, reason = False, (
            f"longest gap {longest} d exceeds the {MAX_FILL_GAP_DAYS} d fill "
            "limit — an abrupt change inside it would be undetectable"
        )
    else:
        fillable, reason = True, "within fill limits"

    profile = GapProfile(
        pixel_id, period_start, period_end, len(ordered), longest,
        round(sum(g for g in gaps if g > 16) / total_days, 4),
        round(wet_fraction, 3), fillable, reason,
    )

    if not fillable:
        log.warning("gap.unfillable", pixel=pixel_id, reason=reason,
                    longest_gap_days=longest, n_clear=len(ordered))
    return profile
```

The refusal path is the important one. A pixel with a five-month gap should not receive a filled value at all — it should be marked unobserved for that interval and excluded from any statistic that requires continuity, with its area reported as an observability limitation. Projects resist this because the resulting map has holes, and the holes are exactly the honest output.

<svg viewBox="0 -4 900 254" role="img" aria-labelledby="len-t len-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="len-t">Gap length against what a fill can honestly claim</title>
  <desc id="len-d">A horizontal scale of gap length divided into four bands with different treatments. Gaps under about sixteen days, shorter than a revisit cycle, are safely interpolated because the endpoints constrain the interior tightly and an abrupt change would be visible at one end. Gaps of sixteen to sixty days are interpolated but flagged and down-weighted, since a fast event could hide inside. Gaps of sixty to ninety days are filled only from a seasonal climatology and carry a wide uncertainty envelope. Gaps beyond ninety days are not filled at all and are marked unobserved, with the affected area reported as an observability limitation rather than estimated. A panel notes that the boundary between the third and fourth bands is where most pipelines silently keep interpolating, and that it is the boundary that matters.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">What a fill can honestly claim, by gap length</text>
  </g>
  <rect x="12" y="44" width="200" height="52" rx="7" fill="currentColor" opacity="0.16"/>
  <rect x="212" y="44" width="220" height="52" rx="7" fill="currentColor" opacity="0.11"/>
  <rect x="432" y="44" width="220" height="52" rx="7" fill="#f3a712" opacity="0.14"/>
  <rect x="652" y="44" width="236" height="52" rx="7" fill="none" stroke="#f3a712" stroke-width="2" stroke-dasharray="6,3"/>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="112" y="70" fill="currentColor" font-size="10" font-weight="700">&lt; 16 days</text>
    <text x="112" y="88" fill="currentColor" font-size="9" opacity="0.8">under one revisit</text>
    <text x="322" y="70" fill="currentColor" font-size="10" font-weight="700">16–60 days</text>
    <text x="322" y="88" fill="currentColor" font-size="9" opacity="0.8">a fast event could hide</text>
    <text x="542" y="70" fill="currentColor" font-size="10" font-weight="700">60–90 days</text>
    <text x="542" y="88" fill="currentColor" font-size="9" opacity="0.8">endpoints barely constrain</text>
    <text x="770" y="70" fill="currentColor" font-size="10" font-weight="700">&gt; 90 days</text>
    <text x="770" y="88" fill="#f3a712" font-size="9" font-weight="700">a whole season, unobserved</text>
    <text x="112" y="126" fill="currentColor" font-size="9.5" font-weight="700">interpolate freely</text>
    <text x="112" y="144" fill="currentColor" font-size="9" opacity="0.8">treat as observed</text>
    <text x="322" y="126" fill="currentColor" font-size="9.5" font-weight="700">interpolate, flag, down-weight</text>
    <text x="322" y="144" fill="currentColor" font-size="9" opacity="0.8">not an independent observation</text>
    <text x="542" y="126" fill="currentColor" font-size="9.5" font-weight="700">climatology only</text>
    <text x="542" y="144" fill="currentColor" font-size="9" opacity="0.8">wide uncertainty envelope</text>
    <text x="770" y="126" fill="#f3a712" font-size="9.5" font-weight="700">do not fill</text>
    <text x="770" y="144" fill="currentColor" font-size="9" opacity="0.8">mark unobserved, report the area</text>
  </g>
  <line x1="652" y1="100" x2="652" y2="164" stroke="#f3a712" stroke-width="2"/>
  <rect x="12" y="182" width="876" height="64" rx="9" fill="currentColor" opacity="0.06"/>
  <rect x="12" y="182" width="876" height="64" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="206" fill="#f3a712" font-size="10" font-weight="700">The fourth boundary is the one that matters — and the one most pipelines never draw.</text>
    <text x="450" y="228" fill="currentColor" font-size="9.5" opacity="0.85">An interpolation across a whole wet season produces a smooth, complete, entirely fictional record of a period nobody observed.</text>
  </g>
</svg>

## Deterministic Transformation Logic

The fill itself writes to a separate column from the observation, carries a method label and a weight, and never overwrites an observed value. That structure is what keeps the provenance attached through every downstream step.

```python
from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class SeriesPoint:
    """One point in the analysis-ready series.

    `observed` and `filled` are separate fields on purpose. A single value
    column with a companion boolean is equivalent in principle and worse in
    practice, because a join, a pivot, or a careless select drops the boolean
    and keeps the value.
    """
    on_date: date
    observed: float | None
    filled: float | None
    fill_method: str | None
    weight: float               # 1.0 for observed, < 1 for filled, 0 = unusable
    fill_sigma: float | None    # uncertainty introduced by the fill

    @property
    def value(self) -> float | None:
        return self.observed if self.observed is not None else self.filled


def fill_series(
    points: list[SeriesPoint],
    profile: GapProfile,
    climatology: dict[int, tuple[float, float]],
) -> list[SeriesPoint]:
    """Fill a gapped series according to the length bands.

    `climatology` maps day-of-year decade to (mean, sd) for this pixel's
    class. It supplies both the fill value and its spread, so the uncertainty
    is derived from the same source as the estimate rather than assumed.
    """
    if not profile.fillable:
        # Mark unobserved rather than filling. Weight zero means every
        # downstream consumer that respects weights excludes it, and any
        # consumer that ignores weights produces an obviously wrong answer
        # rather than a subtly wrong one.
        return [
            p if p.observed is not None
            else SeriesPoint(p.on_date, None, None, "unobserved", 0.0, None)
            for p in points
        ]

    out: list[SeriesPoint] = []
    observed = [p for p in points if p.observed is not None]

    for p in points:
        if p.observed is not None:
            out.append(p)
            continue

        prior = [o for o in observed if o.on_date < p.on_date]
        later = [o for o in observed if o.on_date > p.on_date]
        if not prior or not later:
            # Edge of the series: extrapolation is not interpolation.
            out.append(SeriesPoint(p.on_date, None, None, "series_edge", 0.0, None))
            continue

        a, b = prior[-1], later[0]
        gap_days = (b.on_date - a.on_date).days
        decade = min(36, (p.on_date.timetuple().tm_yday - 1) // 10)
        clim_mean, clim_sd = climatology[decade]

        if gap_days <= 16:
            frac = (p.on_date - a.on_date).days / gap_days
            value = a.observed + frac * (b.observed - a.observed)
            out.append(SeriesPoint(p.on_date, None, value, "linear", 0.9,
                                   clim_sd * 0.3))
        elif gap_days <= 60:
            frac = (p.on_date - a.on_date).days / gap_days
            value = a.observed + frac * (b.observed - a.observed)
            out.append(SeriesPoint(p.on_date, None, value, "linear_flagged", 0.5,
                                   clim_sd * 0.7))
        else:
            out.append(SeriesPoint(p.on_date, None, clim_mean, "climatology", 0.2,
                                   clim_sd * 1.5))

    return out


def effective_observation_count(points: list[SeriesPoint]) -> float:
    """Sum of weights, not count of rows.

    This is the number that should enter any standard error calculation. A
    series of fifty rows of which forty are climatology fills carries about
    eighteen observations' worth of information, and reporting fifty is how
    a gap-filled baseline acquires a confidence interval it has not earned.
    """
    return sum(p.weight for p in points)
```

The weight-sum function is short and it is the load-bearing piece. Gap-filling converts a sparse series into a dense one, and a dense series looks like abundant evidence to every statistical routine downstream. Carrying the weight through to the standard error is what prevents the fill from manufacturing precision out of cloud.

## Compliance Gating & Audit Trail Generation

Four records make a gap-filled baseline defensible.

Per-pixel observability, including clear observation counts, longest gap, and the wet-season clear fraction. A verifier assessing a baseline over a cloudy region will ask how much of it was actually seen, and a map of clear observation counts answers that question immediately.

The fill method applied to each imputed value, retained through to the final product. This is the record that distinguishes a baseline from an interpolation, and it is the one most often lost in an aggregation step.

The effective observation count alongside the nominal one, wherever a statistic is reported. The ratio between them is the single number describing how much of the baseline is evidence and how much is inference.

The unobserved area, reported rather than filled. Where a pixel could not be filled within limits, its area belongs in an observability statement — so much of the project could not be assessed for so much of the period — and that statement is materially better received than a complete-looking map that turns out to rest on climatology.

## Production Integration

Gap-filling sits after masking and before compositing, and its position relative to compositing matters. Compositing first and filling afterwards loses the per-observation information that decides the fill band, because a monthly composite made from one observation and one made from six look identical. Filling on the observation series and compositing weighted afterwards preserves it, and the monthly aggregation described in [monthly temporal aggregation of NDVI for land cover change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/) is the natural consumer of the weights this step produces.

The strongest available mitigation is not a better fill at all — it is more observations. Adding Landsat to a Sentinel-2 series roughly doubles the clear-observation rate and converts many unfillable pixels into fillable ones, which is a larger effect than any choice of interpolation method. That path runs through [harmonizing Sentinel-2 and Landsat surface reflectance](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/harmonizing-sentinel-2-and-landsat-surface-reflectance/), and in persistently cloudy regions radar adds observations that cloud does not affect at all.

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="wt-t wt-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="wt-t">How the weight column travels through aggregation into the uncertainty budget</title>
  <desc id="wt-d">A left to right flow showing the weight column surviving each downstream step. Observations and fills enter with weights of one, nine tenths, one half, one fifth, or zero. The monthly composite is a weighted mean rather than a plain mean, and it carries forward the sum of its input weights as an effective observation count. The change detection step uses the weight to scale each residual, so a climatology fill cannot drive a breakpoint on its own. The uncertainty budget divides by the effective count rather than the row count. A parallel greyed path shows the same flow with the weight dropped after the first step: every subsequent stage treats fills as observations, the effective count equals the row count, and the reported confidence interval is too narrow by a factor that nobody can recover afterwards.</desc>
  <defs>
    <marker id="wt-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">The weight has to survive every step, or the fill becomes free precision</text>
    <rect x="12" y="40" width="196" height="72" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="12" y="40" width="196" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="110" y="66" fill="currentColor" font-size="10" font-weight="700">Series + weights</text>
    <text x="110" y="86" fill="currentColor" font-size="8.5" opacity="0.8">1.0 observed · 0.9 linear</text>
    <text x="110" y="102" fill="currentColor" font-size="8.5" opacity="0.8">0.2 climatology · 0 unobserved</text>
    <rect x="232" y="40" width="196" height="72" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="232" y="40" width="196" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="330" y="66" fill="currentColor" font-size="10" font-weight="700">Weighted composite</text>
    <text x="330" y="86" fill="currentColor" font-size="8.5" opacity="0.8">carries forward Σ weights</text>
    <text x="330" y="102" fill="currentColor" font-size="8.5" opacity="0.8">as effective count</text>
    <rect x="452" y="40" width="196" height="72" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="452" y="40" width="196" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="550" y="66" fill="currentColor" font-size="10" font-weight="700">Change detection</text>
    <text x="550" y="86" fill="currentColor" font-size="8.5" opacity="0.8">residuals scaled by weight —</text>
    <text x="550" y="102" fill="currentColor" font-size="8.5" opacity="0.8">a fill cannot drive a break</text>
    <rect x="672" y="40" width="216" height="72" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="672" y="40" width="216" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="780" y="66" fill="currentColor" font-size="10" font-weight="700">Uncertainty budget</text>
    <text x="780" y="86" fill="currentColor" font-size="8.5" opacity="0.8">divides by the effective count,</text>
    <text x="780" y="102" fill="currentColor" font-size="8.5" opacity="0.8">not by the row count</text>
    <rect x="232" y="170" width="656" height="74" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="232" y="170" width="656" height="74" rx="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="6,3"/>
    <text x="560" y="194" fill="currentColor" font-size="10" font-weight="700">Drop the weight after step one and every later stage treats a fill as an observation.</text>
    <text x="560" y="216" fill="currentColor" font-size="9.5" opacity="0.85">The effective count equals the row count, the interval narrows, and nothing downstream can recover</text>
    <text x="560" y="234" fill="currentColor" font-size="9.5" opacity="0.85">what was evidence and what was inference.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#wt-arrow)">
    <line x1="208" y1="76" x2="230" y2="76"/><line x1="428" y1="76" x2="450" y2="76"/>
    <line x1="648" y1="76" x2="670" y2="76"/>
    <path d="M330 112 L330 168"/>
  </g>
</svg>

## Frequently Asked Questions

### Is a harmonic or seasonal model a better fill than interpolation?

For gaps in the middle band it usually is, because it uses the pixel's own history rather than only its two nearest neighbours, and it respects the seasonal shape. It carries a specific risk worth naming: a harmonic fitted over a window containing a disturbance absorbs that disturbance into its seasonal terms and then predicts a distorted expectation for every subsequent year. Fit on a window verified stable, refit after a confirmed change, and record which window each fit used.

### Can radar fill optical gaps directly?

Not as a substitute value, because radar backscatter and a reflectance index measure different physical properties and the relationship between them is site-specific and non-linear. Radar fills gaps in a different and more useful way: as independent evidence that a change did or did not occur inside the gap. A wet-season gap with stable radar backscatter throughout is much better constrained than one with no information at all, even though radar supplies no value for the optical series.

### How should the fill uncertainty enter the final budget?

As an additional variance term at the pixel level, propagated through the aggregation alongside everything else. The practical shortcut that works is to treat the filled series as having the effective observation count rather than the nominal one wherever a standard error is computed, which handles the dominant effect. Where fills are a large share of the series, the fill's own spread should also be carried, since a climatology fill in a variable stand has a wide distribution that a weight alone does not capture.

### What if a whole project area is unfillable under these limits?

Then the limits are telling you something true, and the response is to change the observation strategy rather than the limits. Options in rough order of cost: add Landsat and any other optical sources, add radar, relax the mask's aggressiveness after checking that it is over-masking rather than correctly masking, and lengthen the baseline period so that more clear observations accumulate per pixel. Lowering the fill threshold to make the map complete is the one option that changes nothing about what was observed.

### Should filled values be used for change detection at all?

For detecting change, they should be weighted down heavily or excluded — a breakpoint driven by imputed values is an artefact of the imputation. For estimating a stable baseline level, they are more useful, because the quantity being estimated changes slowly and the fill is only mildly wrong. This asymmetry is why the weight belongs on the data rather than in a single global decision: different consumers legitimately want to use fills differently, and the weight lets each decide.

### Does the minimum clear-observation threshold vary by forest type?

Yes, and it follows from how much the index varies seasonally. An evergreen tropical forest has a nearly flat seasonal curve, so a handful of observations per year constrains it well. A dry deciduous forest swings substantially between seasons, so the same handful of observations leaves the curve badly determined and the threshold should be higher — a dozen or more per year, distributed across seasons rather than clustered. Setting one global threshold across a project spanning both types under-protects the deciduous part.

### How is the wet-season clear fraction used in practice?

As a targeting metric more than a gate. Pixels with adequate annual counts but near-zero wet-season observations are the ones where the baseline is most likely to be seasonally biased, and they usually form a coherent region rather than scattering randomly. Mapping the fraction shows immediately which part of a project is effectively dry-season-only, which is the part where radar or an extended period will pay for itself, and which is worth stating explicitly in a monitoring report.

## Related guides

- [Temporal Aggregation for Land Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — the parent topic and where the weighted series is consumed.
- [Monthly Temporal Aggregation of NDVI for Land Cover Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/) — the compositing step that must respect these weights.
- [Harmonizing Sentinel-2 and Landsat Surface Reflectance](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/harmonizing-sentinel-2-and-landsat-surface-reflectance/) — the most effective way to reduce gaps rather than fill them.
- [Propagating Spatial Autocorrelation into Uncertainty Budgets](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/propagating-spatial-autocorrelation-into-uncertainty-budgets/) — where the effective observation count meets the effective sample size.
