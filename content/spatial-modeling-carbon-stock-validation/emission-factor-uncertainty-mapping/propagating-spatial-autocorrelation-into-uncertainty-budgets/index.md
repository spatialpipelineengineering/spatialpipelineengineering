---
shortTitle: "Propagating Spatial Autocorrelation into Uncertainty Budgets"
title: "Propagating Spatial Autocorrelation into Uncertainty Budgets"
description: "Why aggregating spatial carbon estimates as if pixels were independent understates uncertainty by an order of magnitude, and how to compute an effective sample size, a variogram-based aggregation, and a defensible confidence interval."
slug: propagating-spatial-autocorrelation-into-uncertainty-budgets
type: guide
breadcrumb: "Spatial Autocorrelation in Uncertainty"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Propagating Spatial Autocorrelation into Uncertainty Budgets

Aggregating a carbon estimate over an area is the last arithmetic step in most MRV pipelines and the one most likely to be wrong by a large factor. The reason is that the standard error of a mean shrinks as the square root of the sample size only when the samples are independent, and pixels in a carbon map are emphatically not. Neighbouring pixels share terrain, share climate, share management history, and — critically — share the model that produced them, so a million-pixel project does not contain a million independent observations. This guide shows how to account for that, within [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack.

The practical consequence is stark. A project reporting a total stock with a confidence interval computed from independent pixel variance will typically report an interval one to two orders of magnitude too narrow. That interval then feeds an uncertainty deduction, and the deduction comes out near zero — which is exactly the outcome that makes a reviewer look closely, and exactly the outcome the arithmetic guarantees regardless of the data.

<svg viewBox="0 -4 920 262" role="img" aria-labelledby="corr-t corr-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="corr-t">Independent pixels versus correlated pixels, and what happens to the interval</title>
  <desc id="corr-d">Two panels side by side over the same project area. On the left, the independence assumption: one hundred thousand pixels are treated as one hundred thousand observations, the standard error divides by the square root of that number, and the resulting confidence interval on total stock is plus or minus a fraction of a percent. On the right, the same area with a correlation range of eight hundred metres: the number of effectively independent observations falls to a few hundred blocks, the standard error divides by the square root of that much smaller number, and the interval widens by a factor of roughly twenty. A panel notes that the data did not change, only the assumption about it, and that the wide interval is the honest one.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Same map, same pixels, two assumptions</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Only one of them is defensible, and it is the one that widens the interval.</text>
    <rect x="12" y="50" width="440" height="192" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="50" width="440" height="192" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="28" y="74" fill="currentColor" font-size="10.5" font-weight="700">Assumed independent</text>
    <g fill="currentColor" opacity="0.35">
      <rect x="30" y="88" width="14" height="14"/><rect x="48" y="88" width="14" height="14"/><rect x="66" y="88" width="14" height="14"/><rect x="84" y="88" width="14" height="14"/><rect x="102" y="88" width="14" height="14"/><rect x="120" y="88" width="14" height="14"/><rect x="138" y="88" width="14" height="14"/><rect x="156" y="88" width="14" height="14"/>
      <rect x="30" y="106" width="14" height="14"/><rect x="48" y="106" width="14" height="14"/><rect x="66" y="106" width="14" height="14"/><rect x="84" y="106" width="14" height="14"/><rect x="102" y="106" width="14" height="14"/><rect x="120" y="106" width="14" height="14"/><rect x="138" y="106" width="14" height="14"/><rect x="156" y="106" width="14" height="14"/>
      <rect x="30" y="124" width="14" height="14"/><rect x="48" y="124" width="14" height="14"/><rect x="66" y="124" width="14" height="14"/><rect x="84" y="124" width="14" height="14"/><rect x="102" y="124" width="14" height="14"/><rect x="120" y="124" width="14" height="14"/><rect x="138" y="124" width="14" height="14"/><rect x="156" y="124" width="14" height="14"/>
      <rect x="30" y="142" width="14" height="14"/><rect x="48" y="142" width="14" height="14"/><rect x="66" y="142" width="14" height="14"/><rect x="84" y="142" width="14" height="14"/><rect x="102" y="142" width="14" height="14"/><rect x="120" y="142" width="14" height="14"/><rect x="138" y="142" width="14" height="14"/><rect x="156" y="142" width="14" height="14"/>
    </g>
    <text x="190" y="104" fill="currentColor" font-size="9.5" opacity="0.85">n = 100,000 observations</text>
    <text x="190" y="126" fill="currentColor" font-size="9.5" opacity="0.85">SE = σ / √100,000</text>
    <text x="190" y="148" fill="currentColor" font-size="9.5" font-weight="700">interval ≈ ±0.4%</text>
    <text x="28" y="184" fill="currentColor" font-size="9" opacity="0.72">Nothing in the pipeline objects.</text>
    <text x="28" y="204" fill="currentColor" font-size="9" opacity="0.72">The uncertainty deduction comes out near zero,</text>
    <text x="28" y="222" fill="currentColor" font-size="9" opacity="0.72">and the reviewer starts asking questions.</text>
    <rect x="472" y="50" width="436" height="192" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="488" y="74" fill="currentColor" font-size="10.5" font-weight="700">Correlated, range 800 m</text>
    <g fill="#f3a712" opacity="0.35">
      <rect x="490" y="88" width="32" height="32"/><rect x="526" y="88" width="32" height="32"/><rect x="562" y="88" width="32" height="32"/><rect x="598" y="88" width="32" height="32"/>
      <rect x="490" y="124" width="32" height="32"/><rect x="526" y="124" width="32" height="32"/><rect x="562" y="124" width="32" height="32"/><rect x="598" y="124" width="32" height="32"/>
    </g>
    <text x="652" y="104" fill="currentColor" font-size="9.5" opacity="0.85">n_eff ≈ 300 blocks</text>
    <text x="652" y="126" fill="currentColor" font-size="9.5" opacity="0.85">SE = σ / √300</text>
    <text x="652" y="148" fill="#f3a712" font-size="9.5" font-weight="700">interval ≈ ±7%</text>
    <text x="488" y="184" fill="currentColor" font-size="9" opacity="0.72">The data did not change.</text>
    <text x="488" y="204" fill="currentColor" font-size="9" opacity="0.72">Only the assumption about how much</text>
    <text x="488" y="222" fill="currentColor" font-size="9" opacity="0.72">independent information it contains.</text>
  </g>
</svg>

## Root Cause Analysis

Spatial autocorrelation in a carbon map has three distinct sources, and they need separating because they behave differently under aggregation.

**The landscape itself is autocorrelated.** Soil type, elevation, rainfall, and disturbance history all vary smoothly, so two nearby hectares genuinely resemble each other more than two distant ones. This is real structure in the world and it is the component a variogram is designed to describe. It has a finite range: beyond some distance, typically hundreds of metres to a few kilometres depending on the biome, the resemblance disappears.

**The model that produced the map is autocorrelated in its errors.** This is the component most often forgotten. A biomass model that systematically underpredicts in dense canopy produces errors that cluster wherever canopy is dense, and that clustering has whatever spatial pattern the canopy has. Crucially, model error correlation does not necessarily decay with distance at all — a bias affecting an entire forest type is perfectly correlated across every pixel of that type, however far apart they are. Averaging over more area does not reduce it.

**The inputs are shared.** Every pixel derived from a single satellite scene inherits that scene's atmospheric correction, its calibration, and its geolocation. A single emission factor applied across a stratum makes every pixel in that stratum share one number, and the uncertainty in that number is fully correlated across all of them. This component is often the largest and it is the easiest to handle, because it does not require a variogram — a factor applied to the whole area propagates as a proportional uncertainty on the total, unreduced by area.

The failure this produces is systematic in one direction. Every one of the three sources makes the effective sample size smaller than the pixel count, so treating pixels as independent always understates the interval and never overstates it. That one-sided bias is why the assumption is not a neutral simplification.

## Diagnostic Pipeline / Pre-Flight Validation

Before computing any interval, establish the correlation structure empirically and check that the aggregation is not operating in a regime where the arithmetic breaks down. The empirical variogram is the standard tool and it is worth computing even when a model-based approach will follow, because its shape is diagnostic.

```python
import math
from dataclasses import dataclass

import numpy as np
import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class VariogramPoint:
    lag_m: float
    semivariance: float
    n_pairs: int


@dataclass(frozen=True)
class CorrelationStructure:
    """Fitted spherical variogram parameters, in the units of the variable."""
    nugget: float
    sill: float
    range_m: float
    fit_rmse: float

    @property
    def nugget_fraction(self) -> float:
        """Share of total variance that is uncorrelated at the shortest lag."""
        return self.nugget / self.sill if self.sill > 0 else 1.0


def empirical_variogram(
    x: np.ndarray,
    y: np.ndarray,
    values: np.ndarray,
    *,
    lag_m: float,
    n_lags: int,
    max_pairs: int = 2_000_000,
) -> list[VariogramPoint]:
    """Binned semivariance against separation distance.

    Subsamples when the full pair set would be prohibitive. Subsampling
    is unbiased for the variogram; it only widens the estimate's own
    uncertainty, which is reported through n_pairs.
    """
    n = len(values)
    if n * (n - 1) // 2 > max_pairs:
        rng = np.random.default_rng(seed=0)
        keep = rng.choice(n, size=int(math.sqrt(2 * max_pairs)), replace=False)
        x, y, values = x[keep], y[keep], values[keep]
        log.info("variogram.subsampled", kept=len(keep), original=n)

    dx = x[:, None] - x[None, :]
    dy = y[:, None] - y[None, :]
    dist = np.sqrt(dx * dx + dy * dy)
    diff_sq = (values[:, None] - values[None, :]) ** 2

    iu = np.triu_indices(len(values), k=1)
    dist, diff_sq = dist[iu], diff_sq[iu]

    points: list[VariogramPoint] = []
    for i in range(n_lags):
        lo, hi = i * lag_m, (i + 1) * lag_m
        sel = (dist >= lo) & (dist < hi)
        count = int(sel.sum())
        if count < 30:
            # Too few pairs for a stable estimate; report, do not fabricate.
            log.warning("variogram.sparse_lag", lag_m=(lo + hi) / 2, n_pairs=count)
            continue
        points.append(
            VariogramPoint(
                lag_m=(lo + hi) / 2,
                semivariance=float(diff_sq[sel].mean() / 2),
                n_pairs=count,
            )
        )
    return points


def assert_structure_usable(cs: CorrelationStructure, extent_m: float) -> None:
    """Refuse structures that cannot support an aggregation.

    Two regimes break the arithmetic: a range comparable to the extent,
    where the whole area is one correlated blob and there is effectively
    one observation; and a pure nugget, where the variogram found no
    structure at all and is probably being computed on residual noise.
    """
    if cs.range_m > extent_m / 3:
        raise ValueError(
            f"correlation range {cs.range_m:.0f} m exceeds a third of the "
            f"{extent_m:.0f} m extent — the area contains too few independent "
            "blocks for a mean to be meaningful; report the estimate at a "
            "coarser unit or widen the area"
        )

    if cs.nugget_fraction > 0.95:
        raise ValueError(
            f"nugget is {cs.nugget_fraction:.0%} of the sill — no spatial "
            "structure detected; check that the variable is the model output "
            "rather than its residual, and that coordinates are projected"
        )

    log.info(
        "variogram.accepted",
        range_m=cs.range_m,
        nugget_fraction=round(cs.nugget_fraction, 3),
        fit_rmse=round(cs.fit_rmse, 4),
    )
```

The check that fires most usefully is the first. A project whose correlation range is comparable to its own extent is not a project with a precise mean and a wide interval — it is a project with one observation, and the correct response is to say so rather than to report a number with a confidence interval that implies replication.

<svg viewBox="0 -4 900 258" role="img" aria-labelledby="vgm-t vgm-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="vgm-t">A variogram and what each of its three parameters costs the uncertainty budget</title>
  <desc id="vgm-d">A variogram curve rising from a non-zero intercept at the origin to a plateau. The intercept is labelled nugget and annotated as the uncorrelated component, which is the only part that averages away with more pixels. The plateau is labelled sill and annotated as the total variance. The distance at which the curve reaches the plateau is labelled range and annotated as the block size for effective sample size: pixels closer than this share information. A shaded region below the nugget line is labelled the only variance that shrinks with area, and a second annotation notes that everything above it persists no matter how many pixels are averaged.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Only the nugget averages away</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">The rest of the variance is shared between neighbours and survives aggregation.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="78" y1="56" x2="78" y2="212"/>
    <line x1="78" y1="212" x2="640" y2="212"/>
  </g>
  <rect x="78" y="176" width="562" height="36" fill="currentColor" opacity="0.12"/>
  <line x1="78" y1="176" x2="640" y2="176" stroke="currentColor" stroke-width="1.1" stroke-dasharray="4,3" opacity="0.7"/>
  <line x1="78" y1="80" x2="640" y2="80" stroke="currentColor" stroke-width="1.1" stroke-dasharray="4,3" opacity="0.7"/>
  <line x1="430" y1="80" x2="430" y2="212" stroke="#f3a712" stroke-width="1.4" stroke-dasharray="5,3"/>
  <path d="M78 176 C170 148 300 96 430 80 L640 80" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">
    <text x="70" y="84" text-anchor="end" font-weight="700">sill</text>
    <text x="70" y="180" text-anchor="end" font-weight="700">nugget</text>
    <text x="430" y="230" text-anchor="middle" fill="#f3a712" font-weight="700">range</text>
    <text x="360" y="248" text-anchor="middle" opacity="0.72">separation distance →</text>
    <text x="34" y="140" transform="rotate(-90 34 140)" text-anchor="middle" font-weight="600">semivariance</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="660" y="96" fill="currentColor" font-weight="700">total variance</text>
    <text x="660" y="112" fill="currentColor" opacity="0.75">what one pixel varies by</text>
    <text x="660" y="150" fill="#f3a712" font-weight="700">block size for n_eff</text>
    <text x="660" y="166" fill="currentColor" opacity="0.75">pixels closer than this</text>
    <text x="660" y="182" fill="currentColor" opacity="0.75">share their information</text>
    <text x="660" y="206" fill="currentColor" font-weight="700">shaded: shrinks with area</text>
    <text x="660" y="222" fill="currentColor" opacity="0.75">everything above it does not</text>
  </g>
</svg>

## Deterministic Transformation Logic

The aggregation itself replaces the pixel count with an effective sample size and then adds back the components that do not decay with distance at all. Three terms, computed separately and combined in quadrature only when they are genuinely independent of one another.

```python
import math
from dataclasses import dataclass


@dataclass(frozen=True)
class UncertaintyBudget:
    """The three components of an aggregated uncertainty, kept separate.

    They are kept separate because they respond differently to a change in
    area, and a verifier asking 'what would halve this' needs to see which
    term dominates.
    """
    area_ha: float
    mean_estimate: float
    se_random: float        # decays with effective sample size
    se_model_bias: float    # does not decay with area at all
    se_factor: float        # proportional, shared across the whole stratum

    @property
    def se_total(self) -> float:
        return math.sqrt(
            self.se_random ** 2 + self.se_model_bias ** 2 + self.se_factor ** 2
        )

    @property
    def relative_half_width_95(self) -> float:
        return 1.96 * self.se_total / self.mean_estimate

    @property
    def dominant_term(self) -> str:
        terms = {
            "random": self.se_random,
            "model_bias": self.se_model_bias,
            "emission_factor": self.se_factor,
        }
        return max(terms, key=terms.get)


def effective_sample_size(
    n_pixels: int, pixel_m: float, range_m: float, nugget_fraction: float
) -> float:
    """Independent observations implied by the correlation structure.

    Pixels within one correlation range of each other contribute roughly one
    observation between them. The nugget fraction restores the share of
    variance that is genuinely independent at pixel scale, so a high-nugget
    field keeps more of its nominal sample size.
    """
    if range_m <= pixel_m:
        return float(n_pixels)

    pixels_per_block = (range_m / pixel_m) ** 2
    n_blocks = n_pixels / pixels_per_block

    # Blend: the nugget share behaves independently, the structured share
    # behaves at block scale.
    return nugget_fraction * n_pixels + (1 - nugget_fraction) * n_blocks


def aggregate_with_correlation(
    *,
    pixel_values: list[float],
    pixel_m: float,
    cs: CorrelationStructure,
    model_bias_rel: float,
    factor_rel: float,
) -> UncertaintyBudget:
    """Aggregate a carbon field to a total with a defensible interval.

    model_bias_rel and factor_rel are relative standard errors that do NOT
    shrink with area — a systematic model bias and a shared emission factor
    respectively. Passing zero for either is a claim that the model is
    unbiased and the factor exact, which no pipeline should assert silently.
    """
    if model_bias_rel <= 0 or factor_rel <= 0:
        raise ValueError(
            "model bias and emission factor uncertainty must be positive; "
            "zero asserts a perfect model and an exact factor"
        )

    n = len(pixel_values)
    mean = sum(pixel_values) / n
    var = sum((v - mean) ** 2 for v in pixel_values) / (n - 1)

    n_eff = effective_sample_size(n, pixel_m, cs.range_m, cs.nugget_fraction)
    area_ha = n * (pixel_m ** 2) / 10_000
    total = mean * area_ha

    return UncertaintyBudget(
        area_ha=area_ha,
        mean_estimate=total,
        se_random=math.sqrt(var / n_eff) * area_ha,
        se_model_bias=total * model_bias_rel,
        se_factor=total * factor_rel,
    )
```

The refusal to accept zero for the two non-decaying terms is deliberate and it changes behaviour more than the variogram does. In a large project the random term is often not the dominant one even after correction — model bias and emission factor uncertainty are, and neither of them cares how many pixels there are. A pipeline that models only the random term produces a budget that gets arbitrarily tight as the project grows, which is obviously wrong and yet is what most implementations do.

## Compliance Gating & Audit Trail Generation

The audit record for an aggregated figure needs four things, and a budget object with the terms kept separate supplies all of them.

The variogram itself, with its fitted parameters and the number of pairs behind each lag. A range fitted from three sparse lags is not evidence, and a verifier who cannot see the pair counts cannot tell the difference between a fitted structure and a plausible one.

The effective sample size and the pixel count together. The ratio between them is the single number that says how much the correction mattered, and stating it pre-empts the question of whether autocorrelation was considered at all.

Which term dominates the budget. This is what a reviewer needs to assess whether the project's proposed improvements are the ones that would help — buying more imagery does not reduce an emission-factor term, and refitting the model does not reduce a term driven by a factor from a national database.

Whether the correlation range was estimated on this project's data or imported. Importing a range from a published study of a different biome is sometimes the only option, and it is acceptable when disclosed; it is not acceptable when a fitted-looking number in a report turns out on questioning to have come from a paper about a different continent.

## Production Integration

The natural place for this logic is immediately before the reporting step and immediately after the per-pixel Monte Carlo, so that the pixel-level uncertainty from [Monte Carlo uncertainty propagation for emission factors](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/monte-carlo-uncertainty-propagation-for-emission-factors/) feeds the aggregation rather than being replaced by it. The two are complements: the Monte Carlo establishes what a pixel's uncertainty is, and this step establishes how much of it survives averaging.

One operational detail matters more than it looks. The variogram should be computed on the quantity being aggregated, not on its residuals against field data, unless the intent is specifically to characterise model error correlation — in which case that is a separate variogram feeding the model bias term rather than the random one. Conflating the two is common and it produces a range that describes neither.

<svg viewBox="-4 -12 732 256" role="img" aria-labelledby="bud-t bud-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="bud-t">How each uncertainty term responds when the project area grows tenfold</title>
  <desc id="bud-d">Three horizontal bars showing the relative size of the three uncertainty terms at a small project area and at ten times that area. The random sampling term shrinks substantially when the area grows, because more independent blocks are averaged. The model bias term does not change at all, because a systematic bias affects every pixel in the same direction regardless of how many there are. The shared emission factor term also does not change, because one factor applies across the whole stratum. A panel notes that as a project grows the budget becomes dominated by the two terms that area cannot help, and that a pipeline modelling only the random term produces a total uncertainty that falsely approaches zero.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">What growing the project tenfold actually buys</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Two of the three terms do not move.</text>
    <text x="12" y="66" fill="currentColor" font-size="10" font-weight="700">Random sampling</text>
    <text x="12" y="132" fill="currentColor" font-size="10" font-weight="700">Model bias</text>
    <text x="12" y="198" fill="currentColor" font-size="10" font-weight="700">Emission factor</text>
    <text x="180" y="52" fill="currentColor" font-size="9" opacity="0.7">small area</text>
    <text x="180" y="90" fill="currentColor" font-size="9" opacity="0.7">10× area</text>
  </g>
  <g>
    <rect x="256" y="42" width="420" height="18" rx="4" fill="currentColor" opacity="0.35"/>
    <rect x="256" y="78" width="134" height="18" rx="4" fill="currentColor" opacity="0.35"/>
    <rect x="256" y="108" width="300" height="18" rx="4" fill="#f3a712" opacity="0.4"/>
    <rect x="256" y="144" width="300" height="18" rx="4" fill="#f3a712" opacity="0.4"/>
    <rect x="256" y="174" width="240" height="18" rx="4" fill="#f3a712" opacity="0.4"/>
    <rect x="256" y="210" width="240" height="18" rx="4" fill="#f3a712" opacity="0.4"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor">
    <text x="686" y="56" opacity="0.85">±6.0%</text>
    <text x="400" y="92" opacity="0.85">±1.9% — √n_eff helps here</text>
    <text x="566" y="122" opacity="0.85">±4.3%</text>
    <text x="566" y="158" font-weight="700" fill="#f3a712">±4.3% — unchanged</text>
    <text x="506" y="188" opacity="0.85">±3.4%</text>
    <text x="506" y="224" font-weight="700" fill="#f3a712">±3.4% — unchanged</text>
  </g>
</svg>

## Frequently Asked Questions

### Is a variogram always necessary, or is a fixed block size acceptable?

A fixed block size is acceptable as a conservative stand-in provided it is chosen larger than any plausible correlation range for the biome and the choice is disclosed. It costs precision — the interval comes out wider than a fitted structure would give — but it errs in the safe direction and it removes a fitting step that can go wrong. What is not acceptable is a fixed block size chosen small enough to be convenient, because that reintroduces the original error in a form that looks like it was considered.

### What if the variogram does not reach a sill within the project extent?

Then the project has no scale at which its pixels become independent, and the mean over the project is one observation rather than an average of many. This happens with strong regional gradients — a rainfall or elevation trend running across the site. The usual fix is to detrend first: fit and remove the large-scale trend, compute the variogram on the residual, and carry the trend's own uncertainty as a separate term. Reporting a mean with a narrow interval over an undetrended gradient is the failure mode this avoids.

### Does this apply to area-based activity data as well as to stock?

Yes, and it is often overlooked there because area feels like it is counted rather than estimated. A deforestation area derived from a classified map has classification errors that cluster — confusion between forest and shrubland concentrates in transitional zones — so the area estimate has a correlated error structure exactly like a stock estimate. The standard approach in that setting is a design-based estimator with a stratified reference sample, which handles the correlation implicitly by sampling rather than by modelling it.

### How does this interact with the uncertainty deduction a methodology requires?

Directly, and usually in the project's disfavour, which is why the arithmetic gets attention. Most crediting methodologies deduct a share of the estimate as a function of the relative half-width of the confidence interval, with a threshold below which no deduction applies. Correcting for autocorrelation typically moves a project from below that threshold to above it. The correct response is to reduce the uncertainty rather than the estimate of it — better calibration, project-specific factors, more field plots — and the budget's dominant-term field says which of those would actually work.

### Can more pixels ever compensate for correlation?

For the random term, yes, but with sharply diminishing returns: doubling the pixel count at fixed area does nothing at all once the pixel is smaller than the correlation range, because the extra pixels carry no new information. Increasing the area does help the random term, since it adds genuinely new blocks. Neither helps the model bias or emission factor terms. This is the practical reason to keep the terms separate — it makes visible that resampling a map to a finer grid, a common instinct, changes nothing.

### Should model error correlation be a separate variogram or folded into the main one?

Separate, because they answer different questions and often have different ranges. The variogram of the predicted field describes how the landscape varies. The variogram of the residuals against field observations describes how the model's errors cluster, and its range is frequently much longer — a bias tied to forest type persists across every stand of that type. Folding them together produces a single range that under-corrects for the model term and over-corrects for the landscape one.

### What is a reasonable relative uncertainty to expect after correcting properly?

For a project-scale forest carbon stock with project-specific allometry and a decent field plot network, a 95% half-width in the region of eight to fifteen percent is typical and defensible. Below five percent is unusual and invites scrutiny about which terms were omitted. Above about twenty-five percent, methodological deductions usually become large enough that improving the estimate is cheaper than accepting the deduction. Those bands are heuristics from practice rather than requirements, and a specific methodology's own thresholds always govern.

## Related guides

- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — the parent topic and where the per-pixel uncertainty comes from.
- [Monte Carlo Uncertainty Propagation for Emission Factors](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/monte-carlo-uncertainty-propagation-for-emission-factors/) — the pixel-level step this aggregation consumes.
- [Designing Field Plot Sampling for Model Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/designing-field-plot-sampling-for-model-validation/) — how plot spacing interacts with the correlation range fitted here.
- [Validating Carbon Models with Field Inventory Data in Python](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/validating-carbon-models-with-field-inventory-data-in-python/) — where the model bias term is estimated.
