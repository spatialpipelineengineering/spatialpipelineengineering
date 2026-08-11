---
shortTitle: "Validating Soil Carbon Models Against Core Samples"
title: "Validating Soil Carbon Models Against Core Samples"
description: "Design-based validation for soil carbon MRV: probability sampling that gives a model-independent estimate, paired re-measurement for stock change, power analysis before the field campaign, and the conservativeness deduction."
slug: validating-soil-carbon-models-against-core-samples
type: guide
breadcrumb: "Validating Against Core Samples"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Validating Soil Carbon Models Against Core Samples

There are two ways to say how good a soil carbon map is, and only one of them survives an audit. The model-based route reports cross-validation statistics from the data the model was fitted on; it is useful for development and it depends entirely on the model being right about its own errors. The design-based route draws an independent probability sample, compares predictions against measurements at those locations, and produces an unbiased estimate of the map's error whose validity rests on the sampling design rather than on the model. This guide implements the second, within [soil organic carbon modeling and validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/soil-organic-carbon-modeling-and-validation/) in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack.

The distinction is not academic. A model can be confidently, systematically wrong in a way its own cross-validation cannot reveal, because the validation data shares the model's blind spots — the same clustering, the same covariate gaps, the same laboratory. A probability sample drawn independently of the model's training data has none of those correlations by construction, which is exactly why methodologies increasingly require it and why the number it produces is the one that ends up in the report.

<svg viewBox="0 -4 940 284" role="img" aria-labelledby="db-t db-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="db-t">Two validation routes and the different claims they support</title>
  <desc id="db-d">Two parallel paths from a fitted soil carbon model. The upper path, model-based, reuses the calibration cores through spatially blocked cross-validation and yields a root mean square error and an R squared. Its claim is limited to how well the model predicts at sites like those sampled, and its validity depends on the model's own assumptions. The lower path, design-based, draws an independent probability sample across the whole project area, measures those locations, and yields an unbiased mean bias and a confidence interval. Its claim covers the whole mapped area and its validity depends only on the sampling design. A panel notes that the reported figure comes from the lower path and that the upper path is a development tool.</desc>
  <defs>
    <marker id="db-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="10" y="96" width="146" height="70" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="10" y="96" width="146" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="83" y="124" fill="currentColor" font-size="11" font-weight="700">Fitted model</text>
    <text x="83" y="144" fill="currentColor" font-size="9" opacity="0.78">+ prediction surface</text>
    <rect x="204" y="14" width="196" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="302" y="38" fill="currentColor" font-size="10.5" font-weight="700">Model-based</text>
    <text x="302" y="58" fill="currentColor" font-size="9" opacity="0.78">blocked CV on calibration cores</text>
    <text x="302" y="76" fill="currentColor" font-size="9" opacity="0.78">→ RMSE, R²</text>
    <rect x="204" y="172" width="196" height="76" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="204" y="172" width="196" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="302" y="196" fill="currentColor" font-size="10.5" font-weight="700">Design-based</text>
    <text x="302" y="216" fill="currentColor" font-size="9" opacity="0.78">independent probability sample</text>
    <text x="302" y="234" fill="currentColor" font-size="9" opacity="0.78">→ bias, CI, no model assumed</text>
    <rect x="448" y="14" width="238" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.85"/>
    <text x="567" y="38" fill="currentColor" font-size="9.5" font-weight="700">Claim: predicts well at sites LIKE</text>
    <text x="567" y="56" fill="currentColor" font-size="9.5" font-weight="700">the ones sampled</text>
    <text x="567" y="76" fill="currentColor" font-size="9" opacity="0.75">valid only if the model's assumptions hold</text>
    <rect x="448" y="172" width="238" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="567" y="196" fill="currentColor" font-size="9.5" font-weight="700">Claim: the whole mapped area</text>
    <text x="567" y="216" fill="currentColor" font-size="9.5" font-weight="700">is unbiased to within ± this</text>
    <text x="567" y="236" fill="currentColor" font-size="9" opacity="0.75">valid because of the design, not the model</text>
    <rect x="734" y="88" width="198" height="86" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="734" y="88" width="198" height="86" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="833" y="114" fill="currentColor" font-size="10.5" font-weight="700">What goes in the report</text>
    <text x="833" y="138" fill="currentColor" font-size="10">the design-based figure</text>
    <text x="833" y="158" fill="currentColor" font-size="9" opacity="0.78">the other is a development tool</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#db-arrow)">
    <path d="M156 118 C 180 106, 182 62, 202 52"/>
    <path d="M156 144 C 180 156, 182 200, 202 210"/>
    <line x1="400" y1="52" x2="446" y2="52"/>
    <line x1="400" y1="210" x2="446" y2="210"/>
    <path d="M686 200 C 720 190, 726 150, 732 138" stroke-width="1.8"/>
  </g>
</svg>

## Root Cause Analysis

Three design decisions determine whether a validation campaign produces a usable number, and all three are made before anyone reaches the field.

**Inclusion probabilities must be known.** A design-based estimate is unbiased because every location in the project had a known, non-zero chance of selection and the estimator weights by the inverse of that probability. Convenience sampling — accessible fields, cooperative landowners, the corner near the track — has unknown inclusion probabilities and therefore supports no design-based claim at all, regardless of how many cores are taken. Stratified random and generalised random-tessellation stratified designs both preserve known probabilities while giving good spatial spread; simple random sampling works but wastes effort clustering by chance.

**Power must be sized to the effect, not to the budget.** For a stock-change claim, the quantity of interest is a difference of one to four tonnes of carbon per hectare per year against a field-scale spatial standard deviation that is often 20–40% of the stock. The sample size needed to detect that difference is calculable in advance, and it is frequently larger than teams expect — or implies a longer re-measurement interval than the reporting cycle. Discovering this after the campaign means paying for a sample that cannot support the claim.

**Paired re-measurement beats independent samples by a wide margin.** Sampling the same georeferenced locations in both periods removes the spatial variance from the comparison, because each location acts as its own control. The remaining variance is the within-location temporal and analytical variance, typically several times smaller. The cost is the discipline of relocating positions to within a metre or two and handling the fact that a core destroys the soil it samples — resolved by sampling a small offset within a fixed micro-plot rather than the identical hole.

<svg viewBox="0 -4 900 300" role="img" aria-labelledby="pw-t pw-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="pw-t">Sample size required to detect a soil carbon stock change, paired against independent designs</title>
  <desc id="pw-d">A chart of required sample size on the vertical axis, from 0 to 700 locations, against the annual stock change to be detected on the horizontal axis, from 0.5 to 3 tonnes of carbon per hectare per year, over a five-year interval at 80 percent power. The independent-sample curve falls steeply from 640 locations at 0.5 tonnes to 44 at 3 tonnes. The paired re-measurement curve is far lower throughout, from 112 at 0.5 tonnes to 9 at 3 tonnes. A shaded band marks the 0.5 to 1.2 tonne range typical of cropland management change, where the independent design needs several hundred locations and the paired design needs a few dozen. An annotation states that pairing removes the spatial variance, which is the dominant term.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Pairing is worth more than sample size</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Locations needed at 80% power, five-year interval, field CV 30%.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="72" x2="620" y2="72"/><line x1="80" y1="118" x2="620" y2="118"/>
    <line x1="80" y1="164" x2="620" y2="164"/><line x1="80" y1="210" x2="620" y2="210"/>
  </g>
  <rect x="80" y="60" width="140" height="196" fill="currentColor" opacity="0.07"/>
  <text x="150" y="76" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor" opacity="0.75">typical cropland range</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="60" x2="80" y2="256"/>
    <line x1="80" y1="256" x2="620" y2="256"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="76" text-anchor="end">700</text>
    <text x="72" y="122" text-anchor="end">525</text>
    <text x="72" y="168" text-anchor="end">350</text>
    <text x="72" y="214" text-anchor="end">175</text>
    <text x="72" y="260" text-anchor="end">0</text>
    <text x="80" y="276" text-anchor="middle">0.5</text>
    <text x="215" y="276" text-anchor="middle">1.1</text>
    <text x="350" y="276" text-anchor="middle">1.7</text>
    <text x="485" y="276" text-anchor="middle">2.3</text>
    <text x="620" y="276" text-anchor="middle">3.0</text>
    <text x="350" y="294" text-anchor="middle" font-weight="600">detectable change (t C ha⁻¹ yr⁻¹)</text>
  </g>
  <text x="30" y="158" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="currentColor" opacity="0.72" transform="rotate(-90 30 158)" text-anchor="middle">locations required</text>
  <polyline points="80,88 148,150 215,186 283,208 350,222 418,232 485,240 553,244 620,244" fill="none" stroke="#f3a712" stroke-width="2.8"/>
  <polyline points="80,225 148,240 215,246 283,249 350,251 418,252 485,253 553,254 620,254" fill="none" stroke="currentColor" stroke-width="2.8"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="632" y="248" fill="#f3a712">independent</text>
    <text x="632" y="262" fill="currentColor" font-size="8.5" opacity="0.72">640 → 44 locations</text>
    <text x="632" y="222" fill="currentColor">paired</text>
    <text x="632" y="236" fill="currentColor" font-size="8.5" opacity="0.72">112 → 9 locations</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="656" y="60" width="232" height="130" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="656" y="60" width="232" height="130" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="674" y="86" fill="currentColor" font-size="10.5" font-weight="700">Why the gap is so large</text>
    <text x="674" y="110" fill="currentColor" font-size="9.5" opacity="0.85">Independent designs must overcome the</text>
    <text x="674" y="126" fill="currentColor" font-size="9.5" opacity="0.85">spatial variance between locations —</text>
    <text x="674" y="142" fill="currentColor" font-size="9.5" opacity="0.85">the dominant term in soil carbon.</text>
    <text x="674" y="166" fill="currentColor" font-size="9.5" opacity="0.85">Pairing cancels it; only the smaller</text>
    <text x="674" y="182" fill="currentColor" font-size="9.5" opacity="0.85">within-location variance remains.</text>
  </g>
</svg>

## Diagnostic Pipeline / Pre-Flight Validation

The pre-flight is a power calculation and a design check, run before the field campaign is commissioned. It answers one question: given the variance we expect and the change we intend to claim, how many locations does the design need — and is the answer affordable?

```python
from dataclasses import dataclass

import numpy as np
import structlog
from scipy import stats

log = structlog.get_logger()


@dataclass(frozen=True)
class PowerResult:
    design: str
    effect_t_c_ha_yr: float
    interval_years: float
    field_sd_t_c_ha: float
    within_location_sd_t_c_ha: float
    n_required: int
    achievable_with: int | None
    detectable_at_budget: float | None


def required_n(effect_total: float, sd: float, power: float = 0.80,
               alpha: float = 0.05) -> int:
    """Two-sided sample size for a mean difference. The only inputs that matter
    are the effect you intend to claim and the standard deviation of the
    comparison — which is where the paired design earns its keep."""
    z_a = stats.norm.ppf(1 - alpha / 2)
    z_b = stats.norm.ppf(power)
    return int(np.ceil(((z_a + z_b) * sd / effect_total) ** 2))


def power_analysis(
    effect_t_c_ha_yr: float, interval_years: float, field_sd_t_c_ha: float,
    within_location_sd_t_c_ha: float, budget_locations: int | None = None,
) -> list[PowerResult]:
    """Compare an independent design against paired re-measurement.

    Independent sampling must beat the BETWEEN-location spatial variance; paired
    re-measurement only has to beat the within-location variance, which in soil
    carbon is typically three to six times smaller.
    """
    effect_total = effect_t_c_ha_yr * interval_years
    results = []

    for design, sd in (("independent", field_sd_t_c_ha * np.sqrt(2)),
                       ("paired", within_location_sd_t_c_ha * np.sqrt(2))):
        n = required_n(effect_total, sd)
        detectable = None
        if budget_locations:
            z = stats.norm.ppf(0.975) + stats.norm.ppf(0.80)
            detectable = float(z * sd / np.sqrt(budget_locations) / interval_years)

        result = PowerResult(
            design=design, effect_t_c_ha_yr=effect_t_c_ha_yr,
            interval_years=interval_years, field_sd_t_c_ha=field_sd_t_c_ha,
            within_location_sd_t_c_ha=within_location_sd_t_c_ha, n_required=n,
            achievable_with=budget_locations,
            detectable_at_budget=None if detectable is None else round(detectable, 3),
        )
        results.append(result)
        log.info("soc.power", **result.__dict__)

        if budget_locations and n > budget_locations:
            log.warning("soc.power.insufficient", design=design, required=n,
                        budget=budget_locations,
                        detectable_at_budget=result.detectable_at_budget,
                        remedy="lengthen the interval, pair the design, or narrow the claim")
    return results
```

The warning path matters more than the happy path. When the budget cannot support the claim, there are exactly three honest responses: lengthen the re-measurement interval so the accumulated effect is larger, switch to a paired design if you have not already, or narrow the claim to what the sample can detect. Proceeding anyway and reporting a point estimate whose interval straddles zero is the fourth option, and it is the one that gets a project sent back.

## Deterministic Transformation Logic

After the campaign, the design-based estimator computes the map's bias and its confidence interval, weighting by inverse inclusion probability. It also tests paired stock change, and — importantly — reports the result as non-significant when it is.

```python
import numpy as np
import pandas as pd
import structlog
from scipy import stats

log = structlog.get_logger()


def design_based_validation(sample: pd.DataFrame) -> dict:
    """Unbiased estimate of map error over the whole area.

    `weight` is the inverse inclusion probability. Ignoring it — treating a
    stratified sample as if it were simple random — biases the estimate toward
    whichever stratum was oversampled, usually the accessible one.
    """
    for column in ("predicted", "observed", "weight", "stratum"):
        if column not in sample.columns:
            raise ValueError(f"validation sample missing required column: {column}")

    error = sample["observed"] - sample["predicted"]
    w = sample["weight"].to_numpy()
    w = w / w.sum()

    bias = float(np.sum(w * error))
    rmse = float(np.sqrt(np.sum(w * error ** 2)))

    # Variance of a weighted mean, accumulated within strata then combined.
    var = 0.0
    for _, block in sample.groupby("stratum"):
        e = (block["observed"] - block["predicted"]).to_numpy()
        wb = block["weight"].to_numpy().sum() / sample["weight"].sum()
        if len(e) > 1:
            var += wb ** 2 * float(np.var(e, ddof=1)) / len(e)

    se = float(np.sqrt(var))
    ci = (bias - 1.96 * se, bias + 1.96 * se)
    unbiased = ci[0] <= 0.0 <= ci[1]

    log.info("soc.validation.design_based", n=len(sample), bias=round(bias, 3),
             rmse=round(rmse, 3), se=round(se, 3),
             ci=(round(ci[0], 3), round(ci[1], 3)), unbiased_at_95=unbiased)
    return {"n": len(sample), "bias": round(bias, 3), "rmse": round(rmse, 3),
            "se": round(se, 3), "ci_low": round(ci[0], 3), "ci_high": round(ci[1], 3),
            "unbiased_at_95": unbiased,
            "estimator": "design-based/inverse-probability-weighted/v1"}


def paired_stock_change(paired: pd.DataFrame, interval_years: float) -> dict:
    """Paired t-test on stock change at fixed locations, on the equivalent-soil-mass
    basis. The spatial variance cancels; what remains is the real comparison."""
    for column in ("location_id", "stock_t0", "stock_t1", "esm_reference_kg_m2"):
        if column not in paired.columns:
            raise ValueError(f"paired table missing required column: {column}")
    if paired["esm_reference_kg_m2"].nunique() != 1:
        # Different reference masses between periods reintroduces exactly the
        # density artefact the ESM basis exists to remove.
        raise ValueError("paired samples use different ESM reference masses")

    delta = (paired["stock_t1"] - paired["stock_t0"]).to_numpy()
    annual = delta / interval_years
    t, p = stats.ttest_rel(paired["stock_t1"], paired["stock_t0"])

    mean = float(annual.mean())
    se = float(annual.std(ddof=1) / np.sqrt(len(annual)))
    ci = (mean - 1.96 * se, mean + 1.96 * se)
    significant = bool(p < 0.05)

    if not significant:
        log.warning("soc.change.not_significant", mean=round(mean, 3),
                    p_value=round(float(p), 4),
                    note="report as non-significant; do not credit a point estimate")

    log.info("soc.change.paired", n=len(paired), mean_t_c_ha_yr=round(mean, 3),
             ci=(round(ci[0], 3), round(ci[1], 3)), p_value=round(float(p), 4),
             significant=significant)
    return {"n_locations": len(paired), "mean_change_t_c_ha_yr": round(mean, 3),
            "ci_low": round(ci[0], 3), "ci_high": round(ci[1], 3),
            "p_value": round(float(p), 4), "significant": significant,
            "interval_years": interval_years}


def conservativeness_deduction(mean_change: float, ci_low: float, ci_high: float,
                               confidence: float = 0.90) -> dict:
    """Most methodologies credit the conservative end of the interval rather than
    the point estimate, with the deduction scaling with the interval's width.
    Wide uncertainty therefore has a direct, visible cost — which is the incentive
    the mechanism is designed to create."""
    half_width = (ci_high - ci_low) / 2.0
    relative = half_width / max(abs(mean_change), 1e-9)
    creditable = max(0.0, min(mean_change, ci_low)) if mean_change > 0 else 0.0

    log.info("soc.conservativeness", mean=round(mean_change, 3),
             creditable=round(creditable, 3), relative_uncertainty=round(relative, 3),
             deduction=round(mean_change - creditable, 3))
    return {"mean_change": round(mean_change, 3), "creditable": round(creditable, 3),
            "deduction": round(mean_change - creditable, 3),
            "relative_uncertainty": round(relative, 3), "confidence": confidence}
```

<svg viewBox="0 -4 900 300" role="img" aria-labelledby="ded-t ded-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ded-t">How the conservativeness rule converts uncertainty into a deduction</title>
  <desc id="ded-d">Three scenarios shown as horizontal intervals around a mean stock change of 1.4 tonnes of carbon per hectare per year. In the first, a wide interval from minus 0.3 to 3.1 straddles zero, so nothing is creditable and the result is reported as non-significant. In the second, a moderate interval from 0.4 to 2.4 yields a creditable figure of 0.4, a deduction of 71 percent of the mean. In the third, a tight interval from 1.0 to 1.8, achieved by pairing the design and running one laboratory, yields a creditable figure of 1.0, a deduction of 29 percent. An annotation states that the mean is identical in all three and only the design differs.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Same measured change, three designs, three credits</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Mean change 1.4 t C ha⁻¹ yr⁻¹ throughout. Only the interval differs — and the interval is a design choice.</text>
  </g>
  <line x1="196" y1="56" x2="196" y2="252" stroke="#f3a712" stroke-width="1.8" stroke-dasharray="5,4"/>
  <text x="196" y="270" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f3a712">zero</text>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="330" y1="56" x2="330" y2="252"/><line x1="464" y1="56" x2="464" y2="252"/><line x1="598" y1="56" x2="598" y2="252"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="330" y="270" text-anchor="middle">1.0</text>
    <text x="464" y="270" text-anchor="middle">2.0</text>
    <text x="598" y="270" text-anchor="middle">3.0</text>
    <text x="400" y="286" text-anchor="middle" font-weight="600">stock change (t C ha⁻¹ yr⁻¹)</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="82" fill="currentColor" font-size="10" font-weight="700">Independent, one period</text>
    <line x1="156" y1="96" x2="612" y2="96" stroke="currentColor" stroke-width="3" opacity="0.5"/>
    <line x1="156" y1="88" x2="156" y2="104" stroke="currentColor" stroke-width="2.4" opacity="0.6"/>
    <line x1="612" y1="88" x2="612" y2="104" stroke="currentColor" stroke-width="2.4" opacity="0.6"/>
    <circle cx="384" cy="96" r="5.5" fill="currentColor"/>
    <text x="636" y="92" fill="#f3a712" font-size="10" font-weight="700">non-significant</text>
    <text x="636" y="108" fill="currentColor" font-size="9" opacity="0.78">creditable 0.00 — interval crosses zero</text>
    <text x="12" y="150" fill="currentColor" font-size="10" font-weight="700">Paired, two laboratories</text>
    <line x1="250" y1="164" x2="518" y2="164" stroke="currentColor" stroke-width="3" opacity="0.6"/>
    <line x1="250" y1="156" x2="250" y2="172" stroke="currentColor" stroke-width="2.4" opacity="0.7"/>
    <line x1="518" y1="156" x2="518" y2="172" stroke="currentColor" stroke-width="2.4" opacity="0.7"/>
    <circle cx="384" cy="164" r="5.5" fill="currentColor"/>
    <text x="636" y="160" fill="currentColor" font-size="10" font-weight="700">creditable 0.40</text>
    <text x="636" y="176" fill="currentColor" font-size="9" opacity="0.78">deduction 71% of the mean</text>
    <text x="12" y="218" fill="currentColor" font-size="10" font-weight="700">Paired, one laboratory, ESM</text>
    <line x1="330" y1="232" x2="437" y2="232" stroke="currentColor" stroke-width="3.4"/>
    <line x1="330" y1="224" x2="330" y2="240" stroke="currentColor" stroke-width="2.6"/>
    <line x1="437" y1="224" x2="437" y2="240" stroke="currentColor" stroke-width="2.6"/>
    <circle cx="384" cy="232" r="5.5" fill="currentColor"/>
    <text x="636" y="228" fill="currentColor" font-size="10" font-weight="700">creditable 1.00</text>
    <text x="636" y="244" fill="currentColor" font-size="9" opacity="0.78">deduction 29% — the design paid for itself</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

The validation record must let a verifier reconstruct both the design and the arithmetic. That means the sampling design and its inclusion probabilities, the realised sample with weights and strata, the laboratory method and its reference-material results, the equivalent-soil-mass reference and depth basis, the design-based bias with its interval, the paired change test with its p-value, and the conservativeness deduction actually applied.

Two gates matter most. **Non-significance must be reported as non-significance**, not as a point estimate with a footnote — a change whose interval straddles zero is not evidence of sequestration, and crediting it is the error the whole validation exercise exists to prevent. And **the conservativeness deduction must be applied from a stated rule** rather than negotiated per project; the rule belongs in the methodology annex, versioned like any other parameter and traceable through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/).

Laboratory provenance is the third gate and the one most often weak. Record the method, the laboratory, the batch, and the certified reference material results for every batch, and treat a laboratory change between periods as a potential step change requiring a cross-calibration subset measured by both. Without it, an analytical shift and a real stock change are indistinguishable, and the project has no way to argue which it observed.

## Production Integration

1. **Design before drilling**: run the power analysis, choose paired re-measurement unless there is a reason not to, and fix inclusion probabilities.
2. **Draw the sample** with a spatially balanced probability design, record every inclusion probability, and keep the realised sample even where a location proved inaccessible — recording the non-response rather than silently substituting a reachable neighbour.
3. **Georeference micro-plots** to a metre or better so re-measurement is genuinely paired, and sample an offset within the plot rather than the same destroyed hole.
4. **Run one laboratory, one method** per campaign, with certified reference materials in every batch and a cross-calibration subset whenever the laboratory changes.
5. **Estimate design-based bias** with inverse-probability weights, and paired change on the equivalent-soil-mass basis.
6. **Apply the conservativeness rule** and emit the record, including the non-significant result where that is the outcome.

The validation sample must take no part in fitting or tuning the model described in [modeling soil organic carbon with digital soil mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/soil-organic-carbon-modeling-and-validation/modeling-soil-organic-carbon-with-digital-soil-mapping/). Enforce this in code — a set difference on location identifiers asserted at the start of the validation run — because it is the constraint most likely to be violated by accident when a later modeller reaches for "all available cores".

## Frequently Asked Questions

### Can I reuse calibration cores for validation if I hold some back?

A held-out split of the calibration cores is better than nothing but it is not design-based validation, because the calibration cores were not drawn with known inclusion probabilities over the project area. They inherit whatever selection the campaign applied — accessibility, landowner cooperation, a preference for representative-looking sites — and a held-out subset inherits it too. Use the hold-out for interval calibration during development, and draw a separate probability sample for the reported figure.

### How do I re-sample the same location when the first core destroyed the soil?

Define a micro-plot of a few metres rather than a point, georeference its centre, and sample a fresh offset within it each period using a pre-defined rotation. The within-micro-plot variance is small relative to between-location variance, so the pairing benefit is retained almost in full. Record the offset used so the rotation can continue across many periods without re-sampling a disturbed spot.

### What if some sampled locations are inaccessible?

Record them as non-response and account for them, rather than substituting a convenient neighbour. Substitution silently changes the inclusion probabilities and destroys the design-based claim. Where non-response is material and non-random — steep or remote locations refused more often — weight-adjust for it explicitly and disclose the adjustment. A validation with 12% documented non-response is credible; one with a suspiciously complete sample of accessible fields is not.

### Does the validation sample need to cover the extrapolated part of the map?

Yes, and disproportionately. The extrapolated region is where the model is least trustworthy and where a design-based sample adds the most information, so a stratified design that oversamples it — with the inclusion probabilities recorded so the estimator corrects for the oversampling — is a better use of the same budget than a uniform draw. It also converts extrapolation into interpolation for the next model version, which is the cheapest map improvement available.

### How often should the validation campaign be repeated?

On the re-measurement interval the power analysis supports, which for soil carbon is usually longer than the reporting cycle — commonly three to five years where an annual report is expected. That mismatch is normal and is handled by reporting a modelled interim figure with an explicit statement that it is unvalidated between campaigns, then reconciling at each validation. What is not acceptable is re-drawing a fresh independent sample every year, each too small to detect anything, and reporting a series of non-significant point estimates as if they were a trend. Fewer, larger, properly spaced campaigns produce a defensible number; annual token sampling produces noise with a field cost attached.

Between campaigns the useful work is not more cores but better covariates: an updated land-use history, a management record from the operator, or a bare-soil composite from a newly exposed season all improve the model at no field cost. Schedule those refreshes deliberately, version them, and re-run the model so the interim figure improves even while the validation clock runs.

### What does a good validation report actually contain?

Six things, in this order: the design and why it was chosen, with the power analysis that sized it; the realised sample including non-response; the laboratory protocol and its quality-control results; the design-based bias with its confidence interval; the paired change test with its p-value and interval; and the conservativeness deduction applied, from a stated rule. Reports that lead with a map and bury the interval get sent back; reports that lead with the design and treat the map as its consequence tend not to. The asymmetry is informative — a verifier is assessing whether the number can be trusted, not whether the raster is pretty.

### How large a conservativeness deduction should I expect?

It scales with the width of the interval relative to the effect, so for soil carbon it is often substantial — a 30–50% deduction is common where the interval is wide, and that is the mechanism working as intended rather than a penalty. The way to reduce it is to reduce the interval: pair the design, increase the interval between measurements, run one laboratory, and correct to equivalent soil mass. Each of those tightens the interval and therefore raises the creditable fraction, which is why the investment in design usually pays for itself.

## Related guides

- [Soil Organic Carbon Modeling & Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/soil-organic-carbon-modeling-and-validation/) — the parent topic and its accounting requirements.
- [Modeling Soil Organic Carbon with Digital Soil Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/soil-organic-carbon-modeling-and-validation/modeling-soil-organic-carbon-with-digital-soil-mapping/) — the model this campaign validates.
- [Validating Carbon Models with Field Inventory Data in Python](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/validating-carbon-models-with-field-inventory-data-in-python/) — the equivalent workflow for above-ground biomass.
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — how these intervals become a conservative reported total.
