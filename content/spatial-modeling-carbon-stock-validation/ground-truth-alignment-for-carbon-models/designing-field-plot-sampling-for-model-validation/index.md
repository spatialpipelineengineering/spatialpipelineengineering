---
shortTitle: "Designing Field Plot Sampling for Model Validation"
title: "Designing Field Plot Sampling for Model Validation"
description: "How to lay out a field plot network that can actually validate a carbon model: stratification that matches the model's failure modes, plot size against pixel support, sample size from the interval you need, and the plots to hold back."
slug: designing-field-plot-sampling-for-model-validation
type: guide
breadcrumb: "Designing Field Plot Sampling"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Designing Field Plot Sampling for Model Validation

Field plots are the most expensive data in a carbon project and the most frequently wasted. A network laid out for convenience — along roads, near the field station, in stands the team already knows — produces measurements that are perfectly accurate and nearly useless for validating a model, because the model's errors do not live where the plots are. This guide covers designing a network that can support a validation claim, within [ground truth alignment for carbon models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack.

The design question is narrower than it first appears, because a validation network has one job: to produce an unbiased estimate of the model's error, with a stated precision, across the range of conditions the model will be applied to. That is a different job from estimating the stock itself, and it leads to a different layout. A network optimised for stock estimation concentrates effort where the stock is; a network optimised for validation concentrates effort where the model is uncertain, which is usually somewhere else entirely.

<svg viewBox="0 -4 940 264" role="img" aria-labelledby="lay-t lay-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="lay-t">Three plot layouts over the same project, and what each can support</title>
  <desc id="lay-d">Three panels showing the same project outline with different plot distributions. The first is convenience sampling: plots cluster along a road and near a field station, leaving most of the project unsampled; it can describe the stands visited and nothing else, and its bias is unquantifiable. The second is simple random sampling: plots scatter uniformly, giving an unbiased estimate overall but leaving rare strata with too few plots to say anything about, which is where model error is usually largest. The third is stratified random sampling with allocation weighted toward uncertain strata: plots are spread across all strata with extra effort in the regrowth and degraded classes, giving both an unbiased overall estimate and enough plots per stratum to detect a model that fails in one of them. A note reads that only the third supports a per-stratum error statement.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Same budget, same number of plots, three different validation claims</text>
    <rect x="12" y="34" width="298" height="176" rx="9" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.6"/>
    <text x="28" y="56" fill="currentColor" font-size="10.5" font-weight="700">Convenience</text>
    <path d="M40 92 L120 106 L200 100 L286 118" fill="none" stroke="currentColor" stroke-width="1.6" opacity="0.4"/>
    <g fill="currentColor">
      <circle cx="52" cy="94" r="3.5"/><circle cx="68" cy="98" r="3.5"/><circle cx="84" cy="100" r="3.5"/><circle cx="100" cy="103" r="3.5"/><circle cx="116" cy="106" r="3.5"/><circle cx="130" cy="105" r="3.5"/><circle cx="146" cy="103" r="3.5"/><circle cx="60" cy="86" r="3.5"/><circle cx="76" cy="90" r="3.5"/><circle cx="92" cy="110" r="3.5"/><circle cx="108" cy="112" r="3.5"/><circle cx="124" cy="96" r="3.5"/>
    </g>
    <text x="28" y="146" fill="currentColor" font-size="9.5" opacity="0.85">describes the stands visited</text>
    <text x="28" y="166" fill="currentColor" font-size="9.5" opacity="0.85">bias present, magnitude unknowable</text>
    <text x="28" y="192" fill="currentColor" font-size="9" opacity="0.72">supports: no validation claim</text>
    <rect x="322" y="34" width="298" height="176" rx="9" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.6"/>
    <text x="338" y="56" fill="currentColor" font-size="10.5" font-weight="700">Simple random</text>
    <g fill="currentColor">
      <circle cx="352" cy="82" r="3.5"/><circle cx="404" cy="94" r="3.5"/><circle cx="466" cy="76" r="3.5"/><circle cx="530" cy="90" r="3.5"/><circle cx="588" cy="80" r="3.5"/><circle cx="368" cy="112" r="3.5"/><circle cx="432" cy="120" r="3.5"/><circle cx="498" cy="108" r="3.5"/><circle cx="562" cy="118" r="3.5"/><circle cx="386" cy="76" r="3.5"/><circle cx="546" cy="104" r="3.5"/><circle cx="602" cy="112" r="3.5"/>
    </g>
    <text x="338" y="146" fill="currentColor" font-size="9.5" opacity="0.85">unbiased overall estimate</text>
    <text x="338" y="166" fill="currentColor" font-size="9.5" opacity="0.85">rare strata get 1–2 plots or none</text>
    <text x="338" y="192" fill="currentColor" font-size="9" opacity="0.72">supports: one overall error figure</text>
    <rect x="632" y="34" width="296" height="176" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="648" y="56" fill="currentColor" font-size="10.5" font-weight="700">Stratified, uncertainty-weighted</text>
    <rect x="644" y="66" width="272" height="26" fill="currentColor" opacity="0.08"/>
    <rect x="644" y="96" width="272" height="26" fill="#f3a712" opacity="0.14"/>
    <g fill="currentColor">
      <circle cx="668" cy="79" r="3.5"/><circle cx="726" cy="79" r="3.5"/><circle cx="790" cy="79" r="3.5"/><circle cx="854" cy="79" r="3.5"/>
      <circle cx="660" cy="109" r="3.5"/><circle cx="700" cy="109" r="3.5"/><circle cx="740" cy="109" r="3.5"/><circle cx="780" cy="109" r="3.5"/><circle cx="820" cy="109" r="3.5"/><circle cx="860" cy="109" r="3.5"/><circle cx="900" cy="109" r="3.5"/><circle cx="680" cy="122" r="3.5"/>
    </g>
    <text x="648" y="146" fill="currentColor" font-size="9.5" opacity="0.85">unbiased with stratum weights</text>
    <text x="648" y="166" fill="#f3a712" font-size="9.5" font-weight="700">extra effort where the model is weak</text>
    <text x="648" y="192" fill="currentColor" font-size="9" opacity="0.72">supports: per-stratum error statements</text>
    <text x="12" y="238" fill="currentColor" font-size="9.5" opacity="0.85">Only the third can answer “does the model work in regrowth?” — which is the question a verifier asks, because regrowth is where the credits are.</text>
    <text x="12" y="256" fill="currentColor" font-size="9" opacity="0.7">The first two answer a question nobody asked.</text>
  </g>
</svg>

## Root Cause Analysis

Four design decisions determine whether a network can support a validation claim, and each one fails in a characteristic way when got wrong.

**Stratification must follow the model's uncertainty, not the landscape's area.** Allocating plots proportionally to stratum area is the instinctive choice and it is wrong for validation. The strata that matter are the ones where the model is least constrained — regrowth, degraded stands, transitional classes, the extremes of the biomass range — and those are usually small in area and large in leverage. Proportional allocation gives them two plots each and produces a validation that is silent about exactly the classes generating the credits.

**Plot size must be commensurate with the model's support.** A 0.02 ha plot compared against a 30 m pixel is comparing a measurement of one small patch against a prediction about an area nine times larger, and the mismatch appears in the residuals as noise that has nothing to do with the model. The plot should be at least comparable to the pixel, and where that is impractical, several small plots should be aggregated to pixel support before comparison rather than compared individually.

**Location accuracy has to be better than the pixel.** A plot recorded with a handheld GPS under canopy can be off by fifteen metres or more, which under a 30 m pixel means the comparison is sometimes against the wrong pixel entirely. The resulting residual distribution has fat tails that look like model failure and are actually positional error, and no amount of model refitting removes them. Differential correction or a survey-grade receiver is the fix, and it is cheap relative to the cost of the plot itself.

**Some plots must never enter the model.** A network entirely consumed by calibration leaves nothing to validate with, and cross-validation on the calibration set answers a weaker question than an independent hold-out does. Reserving a share of plots before any modelling starts, chosen by the same design rather than by what is left over, is the difference between a validation and a goodness-of-fit statistic.

The common thread is that all four failures are locked in at design time and cannot be repaired by analysis. This is the rare part of an MRV pipeline where the engineering decision must be made before any data exists.

## Diagnostic Pipeline / Pre-Flight Validation

Before committing a survey budget, check that the proposed design can deliver the precision the claim needs, and that each stratum will receive enough plots to say anything about. Both checks are arithmetic and both routinely reject a design that looked adequate.

```python
import math
from dataclasses import dataclass

import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class Stratum:
    """One validation stratum with its area and its expected variability.

    `prior_cv` is the coefficient of variation expected within the stratum,
    from a pilot, a previous project, or literature. It is the number that
    drives allocation, and guessing it low is the usual way a design ends up
    underpowered.
    """
    stratum_id: str
    label: str
    area_ha: float
    prior_cv: float
    model_confidence: str        # high | medium | low


@dataclass(frozen=True)
class Allocation:
    stratum_id: str
    n_plots: int
    expected_half_width_pct: float
    adequate: bool


MIN_PLOTS_PER_STRATUM = 8
UNCERTAINTY_WEIGHT = {"high": 1.0, "medium": 1.6, "low": 2.5}


def neyman_allocation(
    strata: list[Stratum], total_plots: int, *, weight_by_uncertainty: bool = True
) -> dict[str, int]:
    """Allocate plots by area times variability, optionally weighted.

    Plain Neyman allocation optimises the precision of the overall mean.
    The uncertainty weighting deliberately departs from that: it buys
    precision where the model is least trusted, at a small cost to the
    overall figure. For a validation network that trade is correct.
    """
    weights: dict[str, float] = {}
    for s in strata:
        w = s.area_ha * s.prior_cv
        if weight_by_uncertainty:
            w *= UNCERTAINTY_WEIGHT[s.model_confidence]
        weights[s.stratum_id] = w

    total_w = sum(weights.values())
    raw = {k: total_plots * v / total_w for k, v in weights.items()}

    # Floor every stratum first, then distribute the remainder by largest
    # fractional part. Strata below the floor take priority over rounding.
    alloc = {k: max(MIN_PLOTS_PER_STRATUM, int(v)) for k, v in raw.items()}
    assigned = sum(alloc.values())

    if assigned > total_plots:
        raise ValueError(
            f"{len(strata)} strata at a floor of {MIN_PLOTS_PER_STRATUM} plots "
            f"each require {assigned} plots but only {total_plots} are budgeted; "
            "merge strata or raise the budget — do not drop the floor, because "
            "a stratum with four plots supports no statement about that stratum"
        )

    remainder = sorted(raw, key=lambda k: raw[k] - int(raw[k]), reverse=True)
    i = 0
    while assigned < total_plots:
        alloc[remainder[i % len(remainder)]] += 1
        assigned += 1
        i += 1

    return alloc


def assess_allocation(
    strata: list[Stratum], alloc: dict[str, int], *, target_half_width_pct: float
) -> list[Allocation]:
    """Expected precision per stratum, and whether it meets the target."""
    out: list[Allocation] = []
    for s in strata:
        n = alloc[s.stratum_id]
        half_width = 1.96 * s.prior_cv / math.sqrt(n) * 100
        adequate = half_width <= target_half_width_pct
        if not adequate:
            log.warning(
                "allocation.underpowered",
                stratum=s.stratum_id,
                n_plots=n,
                expected_half_width_pct=round(half_width, 1),
                target=target_half_width_pct,
                plots_needed=math.ceil((1.96 * s.prior_cv / (target_half_width_pct / 100)) ** 2),
            )
        out.append(
            Allocation(s.stratum_id, n, round(half_width, 1), adequate)
        )
    return out
```

The `plots_needed` figure in the warning is the number that changes budgets. A stratum with a coefficient of variation of 0.5 needs about a hundred plots to reach a ten percent half-width, and seeing that written down before the survey is far cheaper than discovering it after.

<svg viewBox="0 -4 900 256" role="img" aria-labelledby="pix-t pix-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="pix-t">Plot size against pixel support, and the residual each mismatch produces</title>
  <desc id="pix-d">Three cases drawn over a grid of thirty metre pixels. In the first, a small circular plot of about eight metres radius sits inside one pixel: the plot measures a fraction of what the pixel predicts, and the residual carries within-pixel variability that the model was never asked to capture. In the second, a plot comparable in size to the pixel aligns well, and the residual reflects model error alone. In the third, a plot sits across a pixel boundary because its recorded position is off by fifteen metres, and the comparison is partly against the neighbouring pixel, producing a large residual that looks like model failure. A panel notes that only the second case produces a residual that means what the analyst thinks it means.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">What the residual actually contains</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Two of these three residuals are dominated by something other than the model.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.45" fill="none">
    <rect x="30" y="52" width="60" height="60"/><rect x="90" y="52" width="60" height="60"/><rect x="150" y="52" width="60" height="60"/>
    <rect x="30" y="112" width="60" height="60"/><rect x="90" y="112" width="60" height="60"/><rect x="150" y="112" width="60" height="60"/>
    <rect x="330" y="52" width="60" height="60"/><rect x="390" y="52" width="60" height="60"/><rect x="450" y="52" width="60" height="60"/>
    <rect x="330" y="112" width="60" height="60"/><rect x="390" y="112" width="60" height="60"/><rect x="450" y="112" width="60" height="60"/>
    <rect x="630" y="52" width="60" height="60"/><rect x="690" y="52" width="60" height="60"/><rect x="750" y="52" width="60" height="60"/>
    <rect x="630" y="112" width="60" height="60"/><rect x="690" y="112" width="60" height="60"/><rect x="750" y="112" width="60" height="60"/>
  </g>
  <circle cx="120" cy="112" r="16" fill="currentColor" opacity="0.3"/>
  <circle cx="120" cy="112" r="16" fill="none" stroke="currentColor" stroke-width="1.8"/>
  <circle cx="420" cy="112" r="30" fill="#f3a712" opacity="0.22"/>
  <circle cx="420" cy="112" r="30" fill="none" stroke="#f3a712" stroke-width="2"/>
  <circle cx="735" cy="97" r="30" fill="currentColor" opacity="0.22"/>
  <circle cx="735" cy="97" r="30" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5,3"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">
    <text x="30" y="196" font-weight="700">0.02 ha plot, 30 m pixel</text>
    <text x="30" y="216" opacity="0.85">residual = model error + within-pixel</text>
    <text x="30" y="234" opacity="0.85">variability the model never saw</text>
    <text x="330" y="196" font-weight="700" fill="#f3a712">plot ≈ pixel, well located</text>
    <text x="330" y="216" opacity="0.85">residual = model error</text>
    <text x="330" y="234" opacity="0.85">this is the only usable case</text>
    <text x="630" y="196" font-weight="700">plot ≈ pixel, 15 m position error</text>
    <text x="630" y="216" opacity="0.85">residual = model error + wrong pixel</text>
    <text x="630" y="234" opacity="0.85">fat tails, mistaken for model failure</text>
  </g>
</svg>

## Deterministic Transformation Logic

Once the allocation is fixed, plot locations are drawn and the hold-out set is separated. Both steps must be reproducible from a seed, because a verifier asking how a plot came to be where it is deserves an answer better than that someone chose it.

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class PlotSite:
    plot_id: str
    stratum_id: str
    x: float
    y: float
    role: str                    # calibration | holdout
    draw_index: int


def draw_sites(
    strata_masks: dict[str, list[tuple[float, float]]],
    alloc: dict[str, int],
    *,
    seed: int,
    min_separation_m: float,
    holdout_fraction: float = 0.3,
) -> list[PlotSite]:
    """Draw plot locations per stratum and split calibration from hold-out.

    Two properties make this defensible. Locations come from a seeded
    generator, so the draw reproduces exactly. And the hold-out split happens
    here, before any modelling — assigning roles after the fact allows the
    hold-out to be chosen, however unintentionally, to flatter the model.
    """
    import random

    rng = random.Random(seed)
    sites: list[PlotSite] = []

    for stratum_id, n in sorted(alloc.items()):
        candidates = list(strata_masks[stratum_id])
        if len(candidates) < n * 4:
            raise ValueError(
                f"stratum {stratum_id} offers {len(candidates)} candidate "
                f"cells for {n} plots; the separation constraint will not be "
                "satisfiable — enlarge the stratum or reduce its allocation"
            )

        rng.shuffle(candidates)
        chosen: list[tuple[float, float]] = []
        for x, y in candidates:
            if len(chosen) == n:
                break
            if all(
                (x - cx) ** 2 + (y - cy) ** 2 >= min_separation_m ** 2
                for cx, cy in chosen
            ):
                chosen.append((x, y))

        if len(chosen) < n:
            raise ValueError(
                f"stratum {stratum_id}: only {len(chosen)} of {n} plots could "
                f"be placed at {min_separation_m} m separation"
            )

        n_holdout = max(2, round(len(chosen) * holdout_fraction))
        for i, (x, y) in enumerate(chosen):
            sites.append(
                PlotSite(
                    plot_id=f"{stratum_id}-{i:03d}",
                    stratum_id=stratum_id,
                    x=x,
                    y=y,
                    role="holdout" if i < n_holdout else "calibration",
                    draw_index=i,
                )
            )

    return sites


def aggregate_to_pixel_support(
    plot_values: list[float], plot_areas_ha: list[float], pixel_area_ha: float
) -> float | None:
    """Combine sub-pixel plots into one pixel-support observation.

    Returns None when the plots cover too little of the pixel to represent it.
    Returning None rather than a value is the point: a pixel with 12% coverage
    produces a comparison whose error is dominated by what was not measured.
    """
    covered = sum(plot_areas_ha)
    if covered / pixel_area_ha < 0.5:
        return None
    return sum(v * a for v, a in zip(plot_values, plot_areas_ha)) / covered
```

Assigning the hold-out role inside the draw, keyed on draw index rather than on anything measured, closes the most common quiet failure in this area. When the split is made later, it is nearly always made on data that has already been looked at, and the resulting validation is optimistic by an amount nobody can quantify.

## Compliance Gating & Audit Trail Generation

The survey design is itself an auditable artefact, and it needs recording before the field season rather than reconstructed after it.

The stratification and its justification, including the prior coefficient of variation used for each stratum and where it came from. A design whose allocation depended on a guessed variability is fine; a design where the guess is undocumented cannot be assessed.

The draw seed, the candidate mask, and the resulting site list. Together these let anyone reproduce the locations exactly, which converts "why is there no plot in the north-west?" from a suspicion into a checkable fact about the mask.

The role assignment, timestamped before the model was fitted. This is what makes an independent validation independent, and it is worth a signed record rather than a field in a spreadsheet.

Plots that could not be visited, with reasons. Inaccessible plots are normal and they matter: if the unvisitable set correlates with steep terrain or remoteness, the realised sample is biased relative to the design, and the analysis needs to say so and where possible reweight. Silently substituting a nearby accessible plot reintroduces convenience sampling into a design built to avoid it.

## Production Integration

The plot network is a long-lived asset and should be treated as one. Re-measuring the same plots over successive monitoring periods gives a paired comparison that is far more sensitive to change than two independent samples, and it turns the network into the project's own growth model rather than merely a validation set. That argues for permanent, monumented plots and against a fresh draw each period.

Where the network feeds a model, keep the interfaces described in [validating carbon models with field inventory data in Python](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/validating-carbon-models-with-field-inventory-data-in-python/), and note the interaction with correlation structure: plots spaced closer than the correlation range fitted in [propagating spatial autocorrelation into uncertainty budgets](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/propagating-spatial-autocorrelation-into-uncertainty-budgets/) carry less independent information than their count suggests, which is exactly what the minimum separation constraint above is protecting against.

One practical note on sequencing. The design depends on a stratification, the stratification usually depends on a preliminary map, and the preliminary map depends on a model that has not been validated yet. That circularity is unavoidable and it is handled by accepting that the first network validates a provisional stratification, and by revisiting the design once the first season's data shows where the real variability sits. Designing as though the stratification were certain is what produces the network with two plots in the class that turns out to matter most.

<svg viewBox="0 -4 900 254" role="img" aria-labelledby="seq-t seq-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="seq-t">The design sequence, and the one loop that has to close before fitting</title>
  <desc id="seq-d">A five-step sequence. A preliminary map produces a provisional stratification. The stratification plus prior variability estimates produce an allocation. The allocation plus a seeded draw produce site locations, split immediately into calibration and hold-out roles. The field season produces measurements, with unvisited plots recorded rather than substituted. The calibration plots fit the model and the hold-out plots validate it. A feedback arrow returns from the field measurements to the stratification, labelled revise the strata after season one, with a note that this loop must close before the hold-out is opened, because revising strata using hold-out data destroys the independence the design was built for.</desc>
  <defs>
    <marker id="seq-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Design, draw, measure, then fit — and keep the hold-out closed until the end</text>
    <rect x="12" y="40" width="160" height="76" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="40" width="160" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="92" y="68" fill="currentColor" font-size="10" font-weight="700">Provisional</text>
    <text x="92" y="86" fill="currentColor" font-size="10" font-weight="700">stratification</text>
    <text x="92" y="106" fill="currentColor" font-size="8.5" opacity="0.72">from a preliminary map</text>
    <rect x="192" y="40" width="160" height="76" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="192" y="40" width="160" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="272" y="68" fill="currentColor" font-size="10" font-weight="700">Allocation</text>
    <text x="272" y="86" fill="currentColor" font-size="8.5" opacity="0.8">area × variability ×</text>
    <text x="272" y="102" fill="currentColor" font-size="8.5" opacity="0.8">uncertainty weight</text>
    <rect x="372" y="40" width="160" height="76" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="372" y="40" width="160" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="452" y="68" fill="currentColor" font-size="10" font-weight="700">Seeded draw</text>
    <text x="452" y="86" fill="currentColor" font-size="8.5" opacity="0.8">+ role assignment</text>
    <text x="452" y="102" fill="currentColor" font-size="8.5" opacity="0.8">before any modelling</text>
    <rect x="552" y="40" width="160" height="76" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="552" y="40" width="160" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="632" y="68" fill="currentColor" font-size="10" font-weight="700">Field season</text>
    <text x="632" y="86" fill="currentColor" font-size="8.5" opacity="0.8">unvisited plots recorded,</text>
    <text x="632" y="102" fill="currentColor" font-size="8.5" opacity="0.8">never substituted</text>
    <rect x="732" y="40" width="156" height="76" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="810" y="68" fill="currentColor" font-size="10" font-weight="700">Fit, then validate</text>
    <text x="810" y="86" fill="#f3a712" font-size="8.5" font-weight="700">hold-out opened once,</text>
    <text x="810" y="102" fill="#f3a712" font-size="8.5" font-weight="700">at the end</text>
    <rect x="12" y="186" width="876" height="60" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="186" width="876" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="450" y="210" fill="currentColor" font-size="10" font-weight="700">Revise the strata after season one — using calibration data only.</text>
    <text x="450" y="232" fill="currentColor" font-size="9.5" opacity="0.85">Revising a design with hold-out data in hand converts an independent validation into a very expensive goodness-of-fit statistic.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#seq-arrow)">
    <line x1="172" y1="78" x2="190" y2="78"/><line x1="352" y1="78" x2="370" y2="78"/>
    <line x1="532" y1="78" x2="550" y2="78"/><line x1="712" y1="78" x2="730" y2="78"/>
    <path d="M632 116 L632 152 L92 152 L92 118"/>
  </g>
  <text x="362" y="168" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">revise the strata after season one</text>
</svg>

## Frequently Asked Questions

### How many plots does a project actually need?

The count follows from the precision required and the variability present, not from a rule of thumb, and the arithmetic is unforgiving: halving the half-width requires four times the plots. A stratum with a coefficient of variation around 0.4 needs roughly sixty plots for a ten percent half-width and around two hundred and forty for a five percent one. Projects usually discover that the budget supports one target and not the other, and the useful response is to decide which strata deserve the tighter figure rather than spreading the difference evenly.

### Should plot locations be shared with field teams in advance?

The coordinates, yes; the flexibility to move them, no. The most common way a good design degrades is a field team relocating a plot because the drawn location fell in difficult terrain or an awkward stand. Give teams a documented substitution protocol — a pre-drawn replacement from the same stratum, used in order — so that relocations remain part of the design rather than a judgement in the field. Record every substitution and the reason.

### What is the right minimum separation between plots?

Far enough apart that they carry independent information, which means at least the correlation range of the variable being measured, and in practice a few hundred metres in most forest types. Closer plots are not useless — they are informative about fine-scale variability — but they should not be counted as independent replicates in the precision calculation. Where cluster designs are used deliberately, the analysis must use a cluster-aware estimator, not a simple one.

### Can existing national forest inventory plots substitute for a project network?

Sometimes for calibration, rarely for validation. National inventories use their own plot design, their own measurement protocols, and often their own definitions of what counts as a tree, and those differences appear as an offset rather than as noise. They are also usually located on a grid designed for national estimates, which puts very few plots inside any one project. Where they are used, treat them as a distinct source with its own bias term rather than pooling them with project plots.

### How should destructively sampled plots be handled?

As a separate, small, precious set used to check the allometry rather than the map. Destructive sampling gives the only direct biomass measurement available, and it is typically limited to a few dozen trees rather than plots. Its role is to validate or localise the allometric equations that convert diameter measurements into biomass — a step whose error is often larger than the remote sensing error and is frequently taken on faith from a published equation fitted somewhere else.

### What happens when a stratum turns out not to exist in the field?

Record it, and do not redistribute its plots to the strata that were reachable. A stratum that the preliminary map predicted and the field team could not find is a finding about the map, and it changes the area weights used in every subsequent aggregation. Silently moving its plot budget elsewhere hides a map error and biases the resulting estimate, because the area attributed to a class nobody could find is still in the denominator.

### Is a hold-out set worth thirty percent of an expensive survey?

Yes, and the alternative is worse than it sounds. Cross-validation on the calibration set answers whether the model interpolates within data it has seen, which is a real question but a softer one than whether it predicts locations it has not. For a claim that will be scrutinised by a verifier, an independent hold-out is the evidence that is actually persuasive, and thirty percent is a common share. Where the budget genuinely will not support it, reserve a smaller fraction — twenty percent — rather than nothing, and state the limitation.

## Related guides

- [Ground Truth Alignment for Carbon Models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) — the parent topic and the alignment problem this network feeds.
- [Validating Carbon Models with Field Inventory Data in Python](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/validating-carbon-models-with-field-inventory-data-in-python/) — the analysis this design makes possible.
- [Propagating Spatial Autocorrelation into Uncertainty Budgets](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/propagating-spatial-autocorrelation-into-uncertainty-budgets/) — why plot separation and effective sample size are the same question.
- [GEDI vs ICESat-2 vs Airborne Lidar for Biomass](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/gedi-vs-icesat-2-vs-airborne-lidar-for-biomass/) — how plot size and geolocation interact with footprint geometry.
