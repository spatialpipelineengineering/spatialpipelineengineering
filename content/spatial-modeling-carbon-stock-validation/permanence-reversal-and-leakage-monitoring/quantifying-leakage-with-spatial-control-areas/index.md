---
shortTitle: "Quantifying Leakage with Spatial Control Areas"
title: "Quantifying Leakage with Spatial Control Areas"
description: "Select matched control areas, define a defensible leakage belt, and estimate activity-shifting leakage with difference-in-differences in Python — including the balance diagnostics a verifier will ask for."
slug: quantifying-leakage-with-spatial-control-areas
type: guide
breadcrumb: "Quantifying Leakage"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Quantifying Leakage with Spatial Control Areas

Leakage is the part of a carbon project's claim that cannot be measured directly, only inferred. The question — how much of the deforestation this project prevented simply moved somewhere else — is counterfactual, and the answer depends entirely on the credibility of the comparison you construct. This guide implements that comparison, within [permanence, reversal and leakage monitoring](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/) in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack, and it treats control selection as the primary engineering task rather than a preliminary to it.

The estimator itself is simple — a difference-in-differences on deforestation rates — and takes twenty lines. The work is everything around it: choosing controls that were genuinely similar to the project before it started, proving that similarity with balance diagnostics, defining a leakage belt whose width is justified rather than assumed, and freezing all of it before the first monitoring period so the choices cannot drift toward the answer you want.

<svg viewBox="0 54 940 218" role="img" aria-labelledby="lk-t lk-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="lk-t">Leakage estimation workflow from covariate matching to a frozen, reusable control set</title>
  <desc id="lk-d">A workflow in five steps. Step one assembles candidate units — grid cells or parcels outside the project and outside the leakage belt — with their baseline covariates: slope, elevation, distance to road, distance to market, tenure class, and prior deforestation rate. Step two matches candidates to project units, using propensity or Mahalanobis matching with a caliper. Step three runs balance diagnostics, requiring standardised mean differences below 0.1 and, critically, parallel pre-project trends. Step four freezes the matched set with an identifier and a version, at validation, before any monitoring period. Step five runs difference-in-differences each period against the frozen set. A rejection path returns unbalanced matches to step two, and an annotation warns that re-matching after a monitoring period has begun is selection on the outcome.</desc>
  <defs>
    <marker id="lk-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="10" y="70" width="160" height="80" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="10" y="70" width="160" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="90" y="94" fill="currentColor" font-size="10.5" font-weight="700">1 · Candidate pool</text>
    <text x="90" y="112" fill="currentColor" font-size="9" opacity="0.78">outside project AND belt</text>
    <text x="90" y="128" fill="currentColor" font-size="9" opacity="0.78">slope · roads · market</text>
    <text x="90" y="144" fill="currentColor" font-size="9" opacity="0.78">tenure · prior rate</text>
    <rect x="204" y="70" width="160" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="284" y="94" fill="currentColor" font-size="10.5" font-weight="700">2 · Match</text>
    <text x="284" y="114" fill="currentColor" font-size="9" opacity="0.78">propensity or Mahalanobis</text>
    <text x="284" y="130" fill="currentColor" font-size="9" opacity="0.78">with a caliper</text>
    <rect x="398" y="70" width="160" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="478" y="94" fill="currentColor" font-size="10.5" font-weight="700">3 · Balance</text>
    <text x="478" y="114" fill="currentColor" font-size="9" opacity="0.78">|SMD| &lt; 0.1 on every</text>
    <text x="478" y="130" fill="currentColor" font-size="9" opacity="0.78">covariate + parallel trends</text>
    <rect x="592" y="70" width="160" height="80" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="592" y="70" width="160" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="672" y="94" fill="currentColor" font-size="10.5" font-weight="700">4 · Freeze</text>
    <text x="672" y="114" fill="currentColor" font-size="9" opacity="0.78">control_set_id + version</text>
    <text x="672" y="130" fill="currentColor" font-size="9" opacity="0.78">at validation, once</text>
    <rect x="786" y="70" width="146" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="859" y="94" fill="currentColor" font-size="10.5" font-weight="700">5 · Estimate</text>
    <text x="859" y="114" fill="currentColor" font-size="9" opacity="0.78">difference-in-differences</text>
    <text x="859" y="130" fill="currentColor" font-size="9" opacity="0.78">every period, same set</text>
    <rect x="204" y="196" width="354" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3" opacity="0.85"/>
    <text x="381" y="220" fill="currentColor" font-size="10" font-weight="700">Unbalanced → re-match, widen the pool, or narrow the claim</text>
    <text x="381" y="240" fill="#f3a712" font-size="9.5" font-weight="700">Never re-match after monitoring starts — that is selection on the outcome</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#lk-arrow)">
    <line x1="170" y1="110" x2="202" y2="110"/>
    <line x1="364" y1="110" x2="396" y2="110"/>
    <line x1="558" y1="110" x2="590" y2="110"/>
    <line x1="752" y1="110" x2="784" y2="110"/>
    <path d="M478 150 C 478 180, 460 190, 420 196" stroke-dasharray="5,4"/>
    <path d="M230 196 C 210 180, 210 160, 240 152" stroke-dasharray="5,4"/>
  </g>
</svg>

## Root Cause Analysis

Leakage estimates fail for three reasons, and only one of them is statistical.

The first is **role confusion between the belt and the controls**. The leakage belt is where displaced activity is expected to land — the treated area for leakage purposes. The controls supply the counterfactual rate the belt is compared against. Using the belt as a control subtracts the effect from itself and produces an estimate near zero, which is why a suspiciously small leakage figure should always prompt a check of which polygon played which role. The three geometries — project, belt, controls — must be distinct, and the controls must be far enough away that project activity does not plausibly reach them.

The second is **matching on the wrong things, or on things measured after treatment**. Controls must be matched on the drivers of deforestation as they stood *before* the project: slope, elevation, distance to road and to market, tenure class, protected status, and the historical deforestation rate over a pre-project window. Matching on a post-treatment variable — current forest cover, for instance — conditions on an outcome and biases the estimate in an unpredictable direction. Matching on convenience — administrative boundaries, a neighbouring reserve — usually produces controls with systematically lower accessibility than the project, which understates the counterfactual rate and therefore overstates the project's benefit while understating leakage.

The third is **assuming parallel trends without testing them**. Difference-in-differences is unbiased only if, absent the project, the belt and controls would have followed parallel paths. That assumption is testable on pre-project data: if belt and control deforestation rates diverged before the project existed, they will not become parallel because you need them to be. Testing it is cheap and almost never done, and its absence is the first thing a competent verifier probes.

<svg viewBox="0 -4 900 300" role="img" aria-labelledby="pt-t pt-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="pt-t">Parallel pre-project trends: a valid control set and an invalid one</title>
  <desc id="pt-d">Two line charts of annual deforestation rate as a percentage per year, from six years before project start to five years after. In the left panel, the valid control set, belt and control lines track each other closely before project start at rates near 1.4 to 1.6 percent, then diverge after start with the belt rising to 2.3 percent and controls staying near 1.5, giving an excess of 0.8 percentage points. In the right panel, the invalid control set, the belt and control lines already diverge before project start, the belt falling from 2.1 to 1.4 while controls rise from 1.0 to 1.5, so the post-project difference cannot be attributed to the project. A caption states that the pre-project period is the test, and that the assumption is checkable rather than assumable.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The assumption is testable — so test it</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Annual deforestation rate, % yr⁻¹. Only the pre-project segment decides whether the estimator is valid.</text>
    <text x="220" y="62" text-anchor="middle" fill="currentColor" font-size="10.5" font-weight="700">Valid controls — parallel before start</text>
    <text x="676" y="62" text-anchor="middle" fill="currentColor" font-size="10.5" font-weight="700">Invalid controls — already diverging</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="60" y1="98" x2="400" y2="98"/><line x1="60" y1="152" x2="400" y2="152"/><line x1="60" y1="206" x2="400" y2="206"/>
    <line x1="516" y1="98" x2="856" y2="98"/><line x1="516" y1="152" x2="856" y2="152"/><line x1="516" y1="206" x2="856" y2="206"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="60" y1="82" x2="60" y2="240"/><line x1="60" y1="240" x2="400" y2="240"/>
    <line x1="516" y1="82" x2="516" y2="240"/><line x1="516" y1="240" x2="856" y2="240"/>
  </g>
  <rect x="60" y="82" width="185" height="158" fill="currentColor" opacity="0.05"/>
  <rect x="516" y="82" width="185" height="158" fill="currentColor" opacity="0.05"/>
  <line x1="245" y1="82" x2="245" y2="240" stroke="#f3a712" stroke-width="1.8" stroke-dasharray="5,4"/>
  <line x1="701" y1="82" x2="701" y2="240" stroke="#f3a712" stroke-width="1.8" stroke-dasharray="5,4"/>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="52" y="102" text-anchor="end">2.5</text><text x="52" y="156" text-anchor="end">1.5</text><text x="52" y="210" text-anchor="end">0.5</text>
    <text x="150" y="258" text-anchor="middle">pre-project</text>
    <text x="322" y="258" text-anchor="middle">post-start</text>
    <text x="606" y="258" text-anchor="middle">pre-project</text>
    <text x="778" y="258" text-anchor="middle">post-start</text>
  </g>
  <polyline points="60,163 97,158 134,166 171,160 208,157 245,158 282,136 319,120 356,114 400,110" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <polyline points="60,168 97,164 134,170 171,163 208,161 245,162 282,159 319,157 356,160 400,158" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="7,4" opacity="0.85"/>
  <polyline points="516,131 553,140 590,148 627,152 664,158 701,163 738,150 775,142 812,138 856,136" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <polyline points="516,190 553,183 590,176 627,170 664,164 701,158 738,156 775,155 812,157 856,156" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="7,4" opacity="0.85"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="300" y="106" fill="currentColor">belt</text>
    <text x="300" y="176" fill="currentColor" opacity="0.8">controls</text>
    <text x="360" y="96" fill="currentColor" font-size="9" opacity="0.75">excess +0.8 pp</text>
    <text x="756" y="132" fill="currentColor">belt</text>
    <text x="756" y="176" fill="currentColor" opacity="0.8">controls</text>
    <text x="600" y="112" fill="#f3a712" font-size="9" font-weight="700">already crossing — DiD invalid</text>
    <text x="12" y="286" fill="currentColor" font-size="9.5" opacity="0.78">A right-hand panel is not a project that caused less leakage. It is an estimator that cannot tell you anything, and reporting its number anyway is the failure.</text>
  </g>
</svg>

## Diagnostic Pipeline / Pre-Flight Validation

The pre-flight computes balance diagnostics and the parallel-trends test, and refuses to proceed when either fails. Standardised mean difference is the standard balance statistic; below 0.1 in absolute value is the conventional threshold, and any covariate above 0.25 makes the match indefensible regardless of what the others do.

```python
from dataclasses import dataclass

import numpy as np
import pandas as pd
import structlog

log = structlog.get_logger()

SMD_GOOD = 0.10
SMD_FAIL = 0.25
PRE_TREND_P_GATE = 0.10     # a pre-trend interaction this significant invalidates DiD


@dataclass(frozen=True)
class MatchQuality:
    control_set_id: str
    n_treated: int
    n_control: int
    worst_covariate: str
    worst_smd: float
    pre_trend_p: float
    usable: bool
    reason: str | None


def standardised_mean_difference(treated: np.ndarray, control: np.ndarray) -> float:
    """SMD: mean difference in pooled-standard-deviation units. Scale-free, so it
    is comparable across covariates measured in metres, percent, and categories."""
    pooled = np.sqrt((treated.var(ddof=1) + control.var(ddof=1)) / 2.0)
    return float((treated.mean() - control.mean()) / max(pooled, 1e-9))


def check_balance(units: pd.DataFrame, covariates: list[str],
                  control_set_id: str) -> tuple[dict[str, float], str, float]:
    """Balance on every matched covariate, reported individually.

    A mean SMD hides the covariate that is wrong; verifiers ask for the worst one,
    so that is what this returns.
    """
    treated = units[units["group"] == "belt"]
    control = units[units["group"] == "control"]

    smds = {c: standardised_mean_difference(treated[c].to_numpy(), control[c].to_numpy())
            for c in covariates}
    worst = max(smds, key=lambda c: abs(smds[c]))

    log.info("leakage.balance", control_set_id=control_set_id,
             smds={k: round(v, 3) for k, v in smds.items()},
             worst_covariate=worst, worst_smd=round(smds[worst], 3))
    return smds, worst, smds[worst]


def parallel_trends_test(panel: pd.DataFrame) -> float:
    """Regress pre-project rate on group x time. A significant interaction means
    the two series were already diverging, so DiD attributes to the project a
    difference that predates it."""
    import statsmodels.formula.api as smf

    pre = panel[panel["period"] < 0].copy()
    pre["is_belt"] = (pre["group"] == "belt").astype(int)
    model = smf.ols("rate ~ is_belt * period", data=pre).fit()
    p = float(model.pvalues.get("is_belt:period", 1.0))

    log.info("leakage.pre_trends", interaction_p=round(p, 4),
             n_pre_periods=int(pre["period"].nunique()))
    return p


def preflight(units: pd.DataFrame, panel: pd.DataFrame, covariates: list[str],
              control_set_id: str) -> MatchQuality:
    smds, worst, worst_smd = check_balance(units, covariates, control_set_id)
    p = parallel_trends_test(panel)

    reason = None
    if abs(worst_smd) > SMD_FAIL:
        reason = f"covariate_imbalance:{worst}"
    elif p < PRE_TREND_P_GATE:
        reason = "pre_trends_not_parallel"
    elif abs(worst_smd) > SMD_GOOD:
        log.warning("leakage.balance.marginal", covariate=worst,
                    smd=round(worst_smd, 3), note="report the imbalance explicitly")

    quality = MatchQuality(
        control_set_id=control_set_id,
        n_treated=int((units["group"] == "belt").sum()),
        n_control=int((units["group"] == "control").sum()),
        worst_covariate=worst, worst_smd=round(worst_smd, 3),
        pre_trend_p=round(p, 4), usable=reason is None, reason=reason,
    )
    if reason:
        log.error("leakage.preflight.failed", **quality.__dict__)
    return quality
```

## Deterministic Transformation Logic

With a validated control set, the estimator runs each period. It computes the difference-in-differences on rates, converts the excess rate to a tonnage using the belt's area and the applicable carbon density, floors the result at zero, and reports a bootstrap confidence interval alongside the raw uncorrected estimate.

```python
import numpy as np
import pandas as pd
import structlog

log = structlog.get_logger()

BOOTSTRAP_DRAWS = 2000
RNG_SEED = 20260811     # fixed: a leakage figure must be byte-reproducible


def difference_in_differences(panel: pd.DataFrame) -> dict:
    """Excess deforestation rate in the belt relative to matched controls.

    Rates, not counts: belt and control areas differ, and comparing counts would
    measure the sampling design rather than the landscape.
    """
    def mean_rate(group: str, post: bool) -> float:
        sel = (panel["group"] == group) & ((panel["period"] >= 0) == post)
        return float(panel.loc[sel, "rate"].mean())

    belt_delta = mean_rate("belt", True) - mean_rate("belt", False)
    ctrl_delta = mean_rate("control", True) - mean_rate("control", False)
    excess = belt_delta - ctrl_delta

    log.info("leakage.did", belt_delta=round(belt_delta, 5),
             control_delta=round(ctrl_delta, 5), excess=round(excess, 5))
    return {"belt_delta": belt_delta, "control_delta": ctrl_delta, "excess": excess}


def bootstrap_interval(panel: pd.DataFrame, draws: int = BOOTSTRAP_DRAWS) -> tuple[float, float]:
    """Resample UNITS, not observations, so the interval respects the fact that a
    unit's periods are correlated with each other."""
    rng = np.random.default_rng(RNG_SEED)
    units = panel["unit_id"].unique()
    estimates = np.empty(draws)

    for i in range(draws):
        sample = rng.choice(units, size=len(units), replace=True)
        resampled = pd.concat([panel[panel["unit_id"] == u] for u in sample])
        estimates[i] = difference_in_differences(resampled)["excess"]

    return float(np.percentile(estimates, 2.5)), float(np.percentile(estimates, 97.5))


def leakage_tonnage(
    panel: pd.DataFrame, belt_area_ha: float, carbon_density_tco2e_ha: float,
    control_set_id: str, period: str, years: float,
) -> dict:
    """Excess rate -> tonnes, floored at zero, with the raw estimate preserved."""
    did = difference_in_differences(panel)
    ci_low, ci_high = bootstrap_interval(panel)

    raw_tco2e = did["excess"] * belt_area_ha * carbon_density_tco2e_ha * years
    reported = max(0.0, raw_tco2e)

    significant = not (ci_low <= 0.0 <= ci_high)
    if raw_tco2e < 0:
        # Publish it, do not credit it. A project does not earn tonnes because its
        # neighbours happened to clear less than the controls this period.
        log.info("leakage.negative_estimate", raw_tco2e=round(raw_tco2e, 1),
                 note="reported as zero; raw value retained for transparency")

    result = {
        "period": period,
        "control_set_id": control_set_id,
        "excess_rate": round(did["excess"], 5),
        "excess_rate_ci": (round(ci_low, 5), round(ci_high, 5)),
        "raw_tco2e": round(raw_tco2e, 1),
        "reported_tco2e": round(reported, 1),
        "significant": significant,
        "belt_area_ha": belt_area_ha,
        "carbon_density_tco2e_ha": carbon_density_tco2e_ha,
        "estimator": "difference-in-differences/matched-controls/v1",
        "bootstrap_draws": BOOTSTRAP_DRAWS,
        "rng_seed": RNG_SEED,
    }
    log.info("leakage.period.complete", **{k: v for k, v in result.items()
                                           if k != "excess_rate_ci"})
    return result
```

Two details are load-bearing. The bootstrap resamples **units, not observations**, because a unit's periods are correlated and treating them as independent produces an interval that is far too narrow — a common and flattering error. And the **RNG seed is fixed and recorded**, so the interval is byte-reproducible; a confidence interval that changes on re-run is not evidence.

## Compliance Gating & Audit Trail Generation

The leakage record must carry enough for a verifier to re-run the estimate without re-deciding anything. That means the control set identifier and version, the belt definition with the justification for its width, the covariates matched on and their balance statistics, the parallel-trends test result, the estimator name and version, the bootstrap seed and draw count, and both the raw and reported tonnages. Store it under the schema contract in the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) and chain it through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/).

The belt width is where methodologies differ most, and where an unjustified choice is most visible. Most frameworks expect the width to reflect the displacement distance of the specific drivers — smallholder agricultural expansion displaces over a few kilometres, commercial logging over tens — supported by evidence from the local context rather than a default. Record the evidence, because a belt chosen to make the number small is the first thing a reviewer will suspect if the justification is missing. The requirements as they differ across frameworks are compared in [Verra VM0047 vs Gold Standard GIS requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/).

<svg viewBox="0 -4 880 288" role="img" aria-labelledby="bal-t bal-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="bal-t">Covariate balance before and after matching, as a verifier reads it</title>
  <desc id="bal-d">A dot plot of absolute standardised mean difference for six covariates, with unmatched and matched values shown for each. Distance to road moves from 0.68 unmatched to 0.06 matched. Slope moves from 0.41 to 0.04. Prior deforestation rate moves from 0.37 to 0.09. Distance to market moves from 0.29 to 0.07. Elevation moves from 0.22 to 0.05. Tenure class moves from 0.18 to 0.14, remaining the worst matched covariate. Two vertical guide lines mark the good threshold at 0.10 and the failure threshold at 0.25. An annotation notes that tenure class is the one to disclose, because a verifier reads the worst covariate rather than the average.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Balance is read one covariate at a time</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">|standardised mean difference|, belt versus controls. Hollow = before matching, filled = after.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.2">
    <line x1="196" y1="60" x2="196" y2="248"/>
  </g>
  <line x1="272" y1="60" x2="272" y2="248" stroke="currentColor" stroke-width="1.6" stroke-dasharray="5,4" opacity="0.7"/>
  <line x1="386" y1="60" x2="386" y2="248" stroke="#f3a712" stroke-width="1.8" stroke-dasharray="5,4"/>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">
    <text x="196" y="266" text-anchor="middle">0.0</text>
    <text x="272" y="266" text-anchor="middle">0.10</text>
    <text x="386" y="266" text-anchor="middle">0.25</text>
    <text x="576" y="266" text-anchor="middle">0.50</text>
    <text x="766" y="266" text-anchor="middle">0.75</text>
    <text x="272" y="54" text-anchor="middle" font-weight="600">good</text>
    <text x="386" y="54" text-anchor="middle" font-weight="600" fill="#f3a712">fail</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="10" fill="currentColor">
    <text x="188" y="84" text-anchor="end">distance to road</text>
    <text x="188" y="114" text-anchor="end">slope</text>
    <text x="188" y="144" text-anchor="end">prior deforestation rate</text>
    <text x="188" y="174" text-anchor="end">distance to market</text>
    <text x="188" y="204" text-anchor="end">elevation</text>
    <text x="188" y="234" text-anchor="end">tenure class</text>
  </g>
  <g>
    <line x1="242" y1="80" x2="713" y2="80" stroke="currentColor" stroke-width="1" opacity="0.35"/>
    <circle cx="713" cy="80" r="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <circle cx="242" cy="80" r="5.5" fill="currentColor"/>
    <line x1="226" y1="110" x2="508" y2="110" stroke="currentColor" stroke-width="1" opacity="0.35"/>
    <circle cx="508" cy="110" r="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <circle cx="226" cy="110" r="5.5" fill="currentColor"/>
    <line x1="264" y1="140" x2="477" y2="140" stroke="currentColor" stroke-width="1" opacity="0.35"/>
    <circle cx="477" cy="140" r="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <circle cx="264" cy="140" r="5.5" fill="currentColor"/>
    <line x1="249" y1="170" x2="416" y2="170" stroke="currentColor" stroke-width="1" opacity="0.35"/>
    <circle cx="416" cy="170" r="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <circle cx="249" cy="170" r="5.5" fill="currentColor"/>
    <line x1="234" y1="200" x2="363" y2="200" stroke="currentColor" stroke-width="1" opacity="0.35"/>
    <circle cx="363" cy="200" r="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <circle cx="234" cy="200" r="5.5" fill="currentColor"/>
    <line x1="302" y1="230" x2="333" y2="230" stroke="currentColor" stroke-width="1" opacity="0.35"/>
    <circle cx="333" cy="230" r="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <circle cx="302" cy="230" r="6" fill="#f3a712"/>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="700" y="152" fill="currentColor" font-size="9.5" font-weight="700">Worst matched: tenure class, 0.14</text>
    <text x="700" y="168" fill="currentColor" font-size="9.5" opacity="0.8">above 0.10, below 0.25 — usable,</text>
    <text x="700" y="184" fill="currentColor" font-size="9.5" opacity="0.8">but disclose it in the record.</text>
    <text x="700" y="208" fill="currentColor" font-size="9" opacity="0.72">A mean SMD of 0.08 would have</text>
    <text x="700" y="222" fill="currentColor" font-size="9" opacity="0.72">hidden exactly this covariate.</text>
  </g>
</svg>

One gate is worth enforcing in code rather than in review: **the control set must be immutable after validation**. Implement it as a content hash over the control unit identifiers, stored with the project record and asserted at the start of every monitoring run. If someone changes the control set, the run fails rather than quietly producing a better number.

## Production Integration

1. **Assemble the candidate pool** at validation from units outside both the project and the belt, with pre-project covariates only.
2. **Match** with a caliper, discarding treated units with no acceptable match rather than forcing a poor one — and record how many were discarded, since a large fraction narrows what the estimate covers.
3. **Run the pre-flight**: per-covariate balance and the parallel-trends test. Fail loudly, and prefer widening the candidate pool over relaxing the thresholds.
4. **Freeze** the matched set with an identifier, a version, and a content hash. This is the step teams skip and later regret.
5. **Estimate each period** with the frozen set, bootstrapping over units with a fixed seed.
6. **Report raw and floored tonnage** with the interval, and deduct the floored figure from net issuance.

For batch operation, the bootstrap dominates runtime; precompute per-unit period aggregates so each draw is a group-by over a small table rather than a re-read of the rasters. The change rates themselves come from the same composites used by [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/), and must be computed identically for belt and controls — a different cloud threshold on the two sets is a silent, systematic bias.

## Frequently Asked Questions

### How wide should the leakage belt be?

Wide enough to contain the displacement distance of the drivers actually operating, and no wider. Smallholder agricultural expansion typically displaces a few kilometres; commercial logging and ranching displace much further, sometimes beyond any belt, which is why market leakage is handled separately by discount factors rather than spatially. Justify the width with local evidence — historical displacement patterns, road networks, land-tenure structure — and record the justification. A belt chosen without justification is treated as chosen to suit the result.

### What if I cannot find well-matched controls?

Then say so and narrow the claim. Options in order of preference: widen the candidate pool geographically while keeping the covariate constraints; relax to coarser matching on the strongest drivers only, and report the resulting imbalance; or, where neither works, use a conservative default leakage deduction from the methodology instead of a spatial estimate. What is not acceptable is proceeding with unbalanced controls and reporting the number as if it were an estimate.

### Should leakage be estimated per period or cumulatively?

Per period, then accumulated — because the belt and control rates both change over time and a single cumulative comparison hides that. Per-period estimation also lets you detect the characteristic pattern of displacement dying away as the belt's accessible forest is exhausted, which is real and materially reduces later-period leakage. Report the per-period series alongside the cumulative figure.

### Does difference-in-differences handle spatial autocorrelation?

Not by itself, and ignoring it makes the confidence interval far too narrow. Neighbouring units share drivers and shocks, so treating them as independent observations overstates the effective sample size. Resampling units in the bootstrap helps; clustering at a coarser spatial level — watershed, administrative unit — helps more where the correlation length is long. Report which clustering you used, because it changes the interval substantially and a verifier will want to know.

### What kinds of leakage does a spatial estimator miss entirely?

Two, and both matter. **Market leakage** — where reduced timber or agricultural supply from the project raises prices and induces production somewhere far outside any belt, potentially on another continent — is invisible to a spatial comparison by construction, and methodologies handle it with fixed discount factors derived from economic modelling rather than from your imagery. **Activity shifting by mobile actors** who relocate well beyond the belt is similarly out of reach; a logging operation that moves two hundred kilometres will not appear in any defensible belt. Report the spatial estimate for what it is — displacement into the monitored belt — and apply the methodology's market-leakage factor on top of it rather than in place of it. Presenting a spatial figure as total leakage is a substantive misstatement even when the arithmetic is impeccable.

### How do I keep the belt and control rates comparable over time?

By computing them through exactly the same code path with exactly the same parameters, and asserting that in the pipeline rather than trusting it. The failure is subtle: a cloud-cover threshold, a compositing window, or a minimum-mapping-unit that differs between the two sets introduces a systematic difference in measured rate that has nothing to do with land use. Because belts are usually closer to infrastructure and controls are often further into the interior, their cloud and observation statistics genuinely differ, so a threshold that discards more observations in one set than the other quietly biases the comparison. Compute both from one function call over a combined unit table, record the parameters on the result, and assert that the observation counts per unit are within a stated ratio — a divergence there is a signal in its own right.

### Does leakage decline over time, and should the estimate reflect that?

It usually does, and the estimate should reflect it because the per-period series is what reveals it. Displacement concentrates in the belt's accessible forest, and once that is exhausted the belt's excess rate falls back toward the control rate — a pattern visible in most long-running avoided-deforestation projects. Reporting a single leakage rate applied uniformly across the crediting period therefore overstates later-period leakage and understates early-period leakage, and a verifier comparing your figure against the observable series will notice. Estimate per period, report the series, and let the accumulation be the sum rather than a projection.

### Can I use the same controls for leakage and for the baseline?

It is usually a mistake even though it is tempting. The baseline counterfactual asks what would have happened *inside* the project area; the leakage counterfactual asks what would have happened *in the belt*. The two areas differ systematically — belts are typically more accessible than project interiors — so a control set matched to one is generally unmatched to the other. Build and validate two sets, and check balance separately for each.

## Related guides

- [Permanence, Reversal & Leakage Monitoring](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/) — the parent topic and the three post-issuance obligations.
- [Detecting Carbon Reversals from Satellite Time Series](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/detecting-carbon-reversals-from-satellite-time-series/) — the sibling obligation, measured inside the boundary.
- [Forest Carbon Baseline & Additionality Modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/) — the other counterfactual, and why it needs its own control set.
- [Verra VM0047 vs Gold Standard GIS Requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/) — how the frameworks differ on belts and controls.
