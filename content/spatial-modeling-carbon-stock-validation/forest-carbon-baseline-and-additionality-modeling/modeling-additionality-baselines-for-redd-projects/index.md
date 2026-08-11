---
shortTitle: "Modeling Additionality Baselines for REDD+ Projects"
title: "Modeling Additionality Baselines for REDD+ Projects"
description: "Build a defensible REDD+ additionality baseline in Python: define a reference region, model deforestation risk, allocate expected loss, convert to baseline emissions, and net observed with an uncertainty deduction."
slug: modeling-additionality-baselines-for-redd-projects
type: guide
breadcrumb: "Additionality Baselines for REDD+"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Modeling Additionality Baselines for REDD+ Projects

An additionality baseline is the counterfactual a REDD+ project is credited against: the forest loss that would have happened in the absence of the intervention. Get it wrong and every subsequent tonne is either over-issued or stranded. This guide is the task-level recipe under [Forest Carbon Baseline & Additionality Modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/), the counterfactual-construction discipline within the [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack. It consumes the canopy-cover masks tuned during [threshold tuning for carbon stock baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) and produces a per-stratum baseline emission surface that downstream verification can recompute from raw inputs.

The engineering problem is not curve-fitting a historical deforestation rate. It is building a spatially explicit, reproducible counterfactual: select a reference region whose covariate distribution genuinely matches the project, model where deforestation risk is concentrated, allocate an expected quantity of forest loss to the highest-risk pixels, convert that loss to emissions with per-stratum carbon densities, and net it against observed loss with a conservative uncertainty deduction. Each of those steps is a place where an unexamined assumption inflates the credit, so each one carries an explicit gate that refuses to proceed on data it cannot defend.

<svg viewBox="-4 80 1008 216" role="img" aria-labelledby="redd-add-t redd-add-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="redd-add-t">REDD+ additionality baseline modelling flow with comparability gate</title>
  <desc id="redd-add-d">A reference region and its covariate stack pass through a comparability gate that checks whether the project and reference covariate distributions are balanced. If balanced, a deforestation-risk model is fitted and used to allocate expected baseline loss to the highest-risk pixels, which is converted to baseline emissions with per-stratum carbon densities. Baseline emissions are compared to observed loss, and an uncertainty deduction is applied to produce the credited, audited additionality in the amber output box. If the comparability gate fails, the flow routes to reference-region reselection rather than modelling.</desc>
  <defs>
    <marker id="redd-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- boxes -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="12" y="120" width="130" height="66" rx="9"/>
      <rect x="404" y="120" width="130" height="66" rx="9"/>
      <rect x="548" y="120" width="130" height="66" rx="9"/>
      <rect x="692" y="120" width="130" height="66" rx="9"/>
      <rect x="404" y="228" width="274" height="52" rx="9" stroke-dasharray="5,3"/>
    </g>
    <!-- comparability decision diamond -->
    <polygon points="273,96 335,153 273,210 211,153" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <!-- audited output (accent) -->
    <rect x="836" y="112" width="152" height="82" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <!-- titles -->
    <g fill="currentColor" font-size="11" font-weight="600">
      <text x="77" y="149">Reference region</text>
      <text x="469" y="149">Risk model</text>
      <text x="613" y="149">Allocate loss</text>
      <text x="757" y="149">Baseline emissions</text>
      <text x="541" y="250">Reselect reference region</text>
    </g>
    <text x="912" y="147" fill="#f3a712" font-size="11.5" font-weight="700">Additionality</text>
    <!-- subtitles -->
    <g fill="currentColor" font-size="9" opacity="0.72">
      <text x="77" y="166">covariate stack</text>
      <text x="469" y="166">logistic / GBM</text>
      <text x="613" y="166">expected ha</text>
      <text x="757" y="166">&#215; carbon density</text>
      <text x="912" y="165">credited &#183; audited</text>
      <text x="912" y="179">less deduction</text>
    </g>
    <!-- decision label -->
    <g fill="currentColor" font-size="9.5" font-weight="600">
      <text x="273" y="150">covariate</text>
      <text x="273" y="163">balance?</text>
    </g>
    <!-- compare annotation -->
    <text x="757" y="205" fill="currentColor" font-size="9" opacity="0.72" text-anchor="middle">compare vs observed loss</text>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#redd-arrow)">
    <line x1="142" y1="153" x2="209" y2="153"/>
    <line x1="335" y1="153" x2="402" y2="153"/>
    <line x1="534" y1="153" x2="546" y2="153"/>
    <line x1="678" y1="153" x2="690" y2="153"/>
    <line x1="822" y1="153" x2="834" y2="153"/>
    <path d="M273 210 L273 254 L402 254"/>
  </g>
  <!-- branch labels -->
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="9.5" font-weight="600">
    <text x="352" y="145" fill="#f3a712">balanced</text>
    <text x="238" y="235" fill="currentColor" opacity="0.8">imbalanced</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Model a defensible REDD+ additionality baseline in Python",
  "description": "Define a comparable reference region, fit a spatial deforestation-risk model, allocate expected baseline loss, convert to baseline emissions with per-stratum carbon densities, and net observed loss with a conservative uncertainty deduction.",
  "totalTime": "PT50M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "geopandas" },
    { "@type": "HowToTool", "name": "scikit-learn" },
    { "@type": "HowToTool", "name": "rasterio" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest project and reference covariates", "text": "Load the project boundary, candidate reference region, and the stacked spatial covariates onto a common equal-area grid." },
    { "@type": "HowToStep", "name": "Diagnose comparability", "text": "Test covariate balance between project and reference and confirm sufficient historical deforestation observations before any model is fitted." },
    { "@type": "HowToStep", "name": "Fit the deforestation-risk model", "text": "Train a logistic or gradient-boosted classifier on historical loss against the covariate stack and predict per-pixel risk." },
    { "@type": "HowToStep", "name": "Allocate and convert to emissions", "text": "Allocate the expected quantity of baseline deforestation to the highest-risk pixels and multiply by per-stratum carbon densities." },
    { "@type": "HowToStep", "name": "Net observed and apply the deduction", "text": "Subtract observed emissions from the baseline and apply a conservative uncertainty deduction to produce credited additionality." },
    { "@type": "HowToStep", "name": "Export audit-ready lineage", "text": "Serialise the baseline surface, deduction factor, and covariate-balance report for third-party verification." }
  ]
}
</script>

## Root Cause Analysis: Why Baselines Fail Verification

Most REDD+ baselines that collapse under third-party scrutiny fail for the same three structural reasons, and none of them are fixed by a better classifier.

First, **the reference region is not comparable to the project.** A baseline is a counterfactual, so the reference region must stand in for the project as it would have evolved without intervention. If the reference is drier, closer to roads, or under weaker land tenure than the project, its deforestation rate is not the project's counterfactual — it is a different landscape's history. Covariate imbalance of even a modest magnitude (a mean distance-to-road difference of a few kilometres, or a slope distribution shifted by several degrees) can bias the projected baseline rate by 30-50%, and it biases it upward in exactly the direction that inflates issuance. Comparability is a precondition, not a diagnostic afterthought.

Second, **an aspatial rate is applied uniformly.** Taking a single historical hectares-per-year figure and multiplying it by the project area assumes deforestation is spatially random. It is not: loss concentrates near roads, on gentle slopes, at forest edges, and around existing clearings. A model that allocates the expected loss to the highest-risk pixels captures the fact that those pixels also tend to carry different carbon densities than the interior forest, so an aspatial rate systematically misprices the emissions even when the total hectares are correct.

Third, **uncertainty is reported but not deducted.** A baseline emission figure without a conservative deduction implicitly claims the point estimate is the truth. Verification under the VM-series and ISO 14064-3 requires conservativeness: where the combined uncertainty of the risk model, the allocation, and the carbon densities is high, the credited additionality must be discounted so the claim stays on the conservative side of the distribution. A pipeline that omits the deduction produces a number that is statistically indefensible however good the model is.

## Diagnostic Pipeline: Reference-Region Comparability Pre-Flight

Before any model is fitted, confirm that the reference region can legitimately stand in for the project and that there is enough historical signal to train on. The gate below tests covariate balance with a standardised mean difference per covariate and counts historical deforestation observations, refusing to proceed when either fails. Strict [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) is enforced first, because a datum mismatch between the project and reference grids silently corrupts every covariate comparison downstream.

```python
import geopandas as gpd
import numpy as np
import pandas as pd
import structlog

log = structlog.get_logger()

EQUAL_AREA_CRS = "EPSG:6933"      # equal-area so pixel counts map to real hectares
MAX_STD_MEAN_DIFF = 0.25          # covariate-balance gate (standardised mean difference)
MIN_LOSS_OBSERVATIONS = 500       # historical deforested pixels needed to train


def comparability_preflight(
    project: gpd.GeoDataFrame,
    reference: gpd.GeoDataFrame,
    covariates: list[str],
    loss_column: str = "hist_loss",
) -> dict:
    """Check project/reference comparability and training sufficiency.

    Detects: CRS mismatch, covariate imbalance (|SMD| above the gate), and too
    few historical deforestation observations to fit a stable risk model.
    """
    issues: list[str] = []

    # 1. Both frames must share the canonical equal-area CRS.
    for name, gdf in (("project", project), ("reference", reference)):
        if gdf.crs is None:
            issues.append(f"{name}_missing_crs")
        elif gdf.crs.to_string() != EQUAL_AREA_CRS:
            issues.append(f"{name}_crs_mismatch:{gdf.crs.to_string()}")

    # 2. Covariate balance: standardised mean difference per covariate.
    balance: dict[str, float] = {}
    for cov in covariates:
        p, r = project[cov].to_numpy(), reference[cov].to_numpy()
        pooled_sd = np.sqrt((p.var(ddof=1) + r.var(ddof=1)) / 2.0) or np.nan
        smd = abs(p.mean() - r.mean()) / pooled_sd
        balance[cov] = round(float(smd), 3)
        if not np.isfinite(smd) or smd > MAX_STD_MEAN_DIFF:
            issues.append(f"imbalanced_covariate:{cov}={balance[cov]}")

    # 3. Enough historical loss pixels in the reference to train on.
    n_loss = int(reference[loss_column].sum())
    if n_loss < MIN_LOSS_OBSERVATIONS:
        issues.append(f"insufficient_loss_obs:{n_loss}<{MIN_LOSS_OBSERVATIONS}")

    report = {
        "n_reference_loss_pixels": n_loss,
        "covariate_smd": balance,
        "worst_smd": max(balance.values()) if balance else None,
        "comparable": not issues,
        "issues": issues,
    }
    log.info("redd.comparability_preflight", **report)
    return report
```

A report with `comparable=False` does not get patched by tightening the model. It routes back to reference-region reselection — dropping the imbalanced covariates' worst matches, or resampling the reference pool — until the balance gate passes, so the counterfactual rests on a defensible analogue rather than a convenient one.

<svg viewBox="0 -4 880 214" role="img" aria-labelledby="ref-t ref-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ref-t">Reference-region comparability, tested rather than asserted</title>
  <desc id="ref-d">Four comparability criteria with a pass or fail verdict for a candidate reference region. Deforestation rate over the pre-project decade matches within 12 percent and passes. Distance-to-road distribution differs by a standardised mean difference of 0.07 and passes. Slope distribution differs by 0.31, exceeding the 0.25 threshold, and fails — the candidate region is systematically flatter and therefore more accessible than the project. Tenure composition differs materially and fails. A verdict panel states that two failures make the region unusable as it stands, and that the fix is to restrict the candidate area to comparable terrain and tenure rather than to relax the thresholds.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Test the reference region; do not assert it</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">One candidate region, four criteria.</text>
    <rect x="12" y="52" width="612" height="34" rx="6" fill="currentColor" opacity="0.07"/>
    <text x="28" y="74" fill="currentColor" font-size="10">Pre-project deforestation rate — within 12%</text>
    <text x="608" y="74" text-anchor="end" fill="currentColor" font-size="10" font-weight="700">pass</text>
    <rect x="12" y="92" width="612" height="34" rx="6" fill="currentColor" opacity="0.07"/>
    <text x="28" y="114" fill="currentColor" font-size="10">Distance to road — SMD 0.07</text>
    <text x="608" y="114" text-anchor="end" fill="currentColor" font-size="10" font-weight="700">pass</text>
    <rect x="12" y="132" width="612" height="34" rx="6" fill="#f3a712" opacity="0.2"/>
    <text x="28" y="154" fill="currentColor" font-size="10">Slope — SMD 0.31, above the 0.25 limit</text>
    <text x="608" y="154" text-anchor="end" fill="#f3a712" font-size="10" font-weight="700">fail — flatter, more accessible</text>
    <rect x="12" y="172" width="612" height="34" rx="6" fill="#f3a712" opacity="0.2"/>
    <text x="28" y="194" fill="currentColor" font-size="10">Tenure composition — materially different</text>
    <text x="608" y="194" text-anchor="end" fill="#f3a712" font-size="10" font-weight="700">fail</text>
    <rect x="648" y="66" width="220" height="126" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="648" y="66" width="220" height="126" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="664" y="90" fill="currentColor" font-size="10" font-weight="700">Verdict: unusable as it stands</text>
    <text x="664" y="116" fill="currentColor" font-size="9.5" opacity="0.85">Restrict the candidate area to</text>
    <text x="664" y="132" fill="currentColor" font-size="9.5" opacity="0.85">comparable terrain and tenure.</text>
    <text x="664" y="158" fill="#f3a712" font-size="9.5" font-weight="700">Do not relax the thresholds</text>
    <text x="664" y="174" fill="#f3a712" font-size="9.5" font-weight="700">to make it pass.</text>
  </g>
</svg>

## Deterministic Transformation Logic

With comparability established, the transformation fits a deforestation-risk model on the stacked covariates, allocates the expected baseline loss to the highest-risk pixels, converts that loss to emissions with per-stratum carbon densities, and nets observed emissions with a conservative uncertainty deduction. The risk model is a gradient-boosted classifier here for its handling of non-linear covariate interactions; a regularised logistic model is the interpretable alternative where a verifier wants coefficient-level transparency. Everything runs on an explicit equal-area grid so that a predicted-risk rank translates directly to real hectares.

```python
import numpy as np
import pandas as pd
import geopandas as gpd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import cross_val_score
from datetime import datetime, timezone
import structlog

log = structlog.get_logger()

EQUAL_AREA_CRS = "EPSG:6933"
MIN_MODEL_AUC = 0.75          # risk model must discriminate loss from no-loss
PIXEL_HA = 0.09              # 30 m equal-area pixel = 0.09 ha


def model_additionality_baseline(
    covariate_gdf: gpd.GeoDataFrame,
    covariates: list[str],
    carbon_density_tco2_ha: pd.Series,   # per-pixel aboveground carbon (tCO2e/ha)
    expected_annual_loss_ha: float,       # reference-derived baseline deforestation
    crediting_years: int,
    observed_emissions_tco2: float,       # measured project-period emissions
    uncertainty_cv: float,                # combined coefficient of variation (0-1)
) -> tuple[gpd.GeoDataFrame, dict]:
    """Fit deforestation risk, allocate baseline loss, and net observed emissions.

    Returns (per-pixel baseline surface, additionality audit manifest).
    """
    gdf = covariate_gdf.copy()
    if gdf.crs is None or gdf.crs.to_string() != EQUAL_AREA_CRS:
        raise ValueError(f"expected {EQUAL_AREA_CRS}; got {gdf.crs}")

    # 1. Fit and validate the deforestation-risk model on historical loss.
    X, y = gdf[covariates].to_numpy(), gdf["hist_loss"].to_numpy().astype(int)
    model = HistGradientBoostingClassifier(
        max_depth=4, learning_rate=0.05, max_iter=400, random_state=42)
    auc = float(cross_val_score(model, X, y, cv=5, scoring="roc_auc").mean())
    if auc < MIN_MODEL_AUC:
        raise RuntimeError(f"risk model AUC {auc:.3f} < gate {MIN_MODEL_AUC}")
    model.fit(X, y)
    gdf["risk"] = model.predict_proba(X)[:, 1]
    log.info("redd.risk_model_fit", auc=round(auc, 3), n_pixels=len(gdf))

    # 2. Allocate expected baseline loss to the highest-risk pixels.
    total_expected_ha = expected_annual_loss_ha * crediting_years
    n_pixels = int(round(total_expected_ha / PIXEL_HA))
    n_pixels = min(n_pixels, len(gdf))
    gdf = gdf.sort_values("risk", ascending=False).reset_index(drop=True)
    gdf["baseline_deforested"] = False
    gdf.loc[: n_pixels - 1, "baseline_deforested"] = True

    # 3. Convert allocated loss to baseline emissions via per-stratum densities.
    density = carbon_density_tco2_ha.reindex(gdf.index).to_numpy()
    gdf["baseline_emissions_tco2"] = np.where(
        gdf["baseline_deforested"], density * PIXEL_HA, 0.0)
    baseline_total = float(gdf["baseline_emissions_tco2"].sum())

    # 4. Net observed emissions and apply a conservative uncertainty deduction.
    gross_additionality = baseline_total - observed_emissions_tco2
    # Deduction scales with combined uncertainty (VM-series style, ~half-CV band).
    deduction_factor = min(0.5 * uncertainty_cv, 0.30)
    credited = max(gross_additionality * (1.0 - deduction_factor), 0.0)

    manifest = {
        "risk_model_auc": round(auc, 3),
        "expected_loss_ha": round(total_expected_ha, 1),
        "baseline_emissions_tco2": round(baseline_total, 1),
        "observed_emissions_tco2": round(observed_emissions_tco2, 1),
        "gross_additionality_tco2": round(gross_additionality, 1),
        "uncertainty_cv": round(uncertainty_cv, 3),
        "deduction_factor": round(deduction_factor, 3),
        "credited_additionality_tco2": round(credited, 1),
        "equal_area_crs": EQUAL_AREA_CRS,
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "compliance_standard": "Verra VM0047 / ISO 14064-3",
    }
    gdf.attrs.update(manifest)
    log.info("redd.additionality_computed", **manifest)
    return gdf, manifest
```

Two design choices carry the defensibility. The `MIN_MODEL_AUC` gate refuses to allocate loss from a risk surface that cannot distinguish deforested from intact pixels — an undiscriminating model degenerates to the aspatial rate the whole approach exists to avoid. The deduction ties the credited figure to the combined coefficient of variation of the model, allocation, and carbon densities, so a noisy baseline is discounted rather than banked; those density variances are exactly what the [Monte Carlo uncertainty propagation for emission factors](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/monte-carlo-uncertainty-propagation-for-emission-factors/) step produces upstream.

## Compliance Gating & Audit Trail Generation

The manifest stamped into the output frame is the submission artifact. It records the risk-model AUC, the expected loss, the baseline and observed emissions, the uncertainty CV, the deduction factor, and the credited additionality — every quantity a verifier needs to recompute the number from the covariate stack. Those attributes flow into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), where the covariate-balance report, the reference-region selection, and the model parameters become the queryable record an auditor traces.


| Technical output | Regulatory application | Verification step |
|------------------|------------------------|-------------------|
| Covariate SMD report | Reference-region comparability under Verra VM0047 | Auditor recomputes balance from project/reference covariates |
| Risk-model AUC + parameters | Reproducibility and predictive validity (ISO 14064-3) | Model refit from logged seed and covariates yields same AUC |
| Baseline emission surface | Ex-ante baseline emissions for the crediting period | Per-stratum densities checked against inventory plots |
| Deduction factor + credited additionality | Conservativeness / uncertainty deduction (VM-series) | Deduction recomputed from the combined CV |


Comparability is where a REDD+ baseline lives or dies, so treat the worst standardised mean difference, the risk-model AUC, and the deduction factor as monitored signals on every run, including the passing ones. A reference region that drifts toward imbalance as covariates are updated, or an AUC that erodes as land-cover conditions change, should surface as a trend well before it breaches a gate. Leakage — deforestation displaced beyond the project boundary rather than avoided — is not captured by the baseline model itself; it is estimated separately and subtracted before crediting, and the manifest should carry the leakage deduction alongside the uncertainty deduction so the two are never conflated.

## Production Integration

Deploy the routine within an orchestrated MRV pipeline, following a fixed ingest → diagnose → transform → validate → export → submit sequence:

1. **Ingest.** Load the project boundary, candidate reference region, and the stacked spatial covariates (distance-to-road, distance-to-edge, slope, elevation, prior clearing) onto the common equal-area grid, reading the forest mask from the [threshold tuning for carbon stock baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) stage.
2. **Diagnose.** Run `comparability_preflight` to confirm CRS alignment, covariate balance, and sufficient historical loss observations; route imbalanced runs to reference-region reselection.
3. **Transform.** Call `model_additionality_baseline` to fit the risk model, allocate expected loss, convert to baseline emissions, and net observed with the uncertainty deduction.
4. **Validate.** Assert the AUC gate and confirm the deduction factor and leakage estimate are present before the credited figure is accepted.
5. **Export.** Serialise the per-pixel baseline surface to Parquet or GeoTIFF with the manifest and covariate-balance report intact.
6. **Submit.** Forward the credited additionality and its lineage to registry submission, aligning outputs to the requirements in [Verra VM0047 vs Gold Standard GIS requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/).

By gating comparability before the model, allocating loss spatially rather than uniformly, and discounting the credit by its own uncertainty, the baseline stops being an optimistic projection and becomes a reproducible counterfactual an auditor can rebuild from raw inputs. That is the difference between a REDD+ claim that survives verification and one that unwinds the first time a reviewer resamples the reference region.

<svg viewBox="0 -4 740 212" role="img" aria-labelledby="dyn-t dyn-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="dyn-t">A static baseline against a dynamic benchmark when regional pressure falls</title>
  <desc id="dyn-d">A chart over ten years. Regional deforestation pressure falls markedly from year four onward, for reasons unconnected with the project — a commodity price fall and an enforcement campaign. A static baseline fixed at validation stays flat at the historical rate throughout, so the gap between it and the observed project trajectory widens and the project appears to perform better every year. A dynamic benchmark tracks the falling regional rate, so the credited difference shrinks in line with the reduced pressure. A panel notes that the static baseline credits the project for a regional trend it did not cause, and that this is the specific failure dynamic benchmarks were introduced to close.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">A static baseline credits you for other people's trends</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Regional pressure falls from year four for reasons unrelated to the project.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="60" x2="560" y2="60"/><line x1="80" y1="104" x2="560" y2="104"/><line x1="80" y1="148" x2="560" y2="148"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="50" x2="80" y2="176"/>
    <line x1="80" y1="176" x2="560" y2="176"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="80" y="192" text-anchor="middle">yr 0</text>
    <text x="272" y="192" text-anchor="middle">yr 4</text>
    <text x="560" y="192" text-anchor="middle">yr 10</text>
    <text x="34" y="118" transform="rotate(-90 34 118)" text-anchor="middle" font-weight="600">deforestation rate</text>
  </g>
  <line x1="272" y1="46" x2="272" y2="180" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4,3" opacity="0.6"/>
  <text x="278" y="46" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">price fall + enforcement</text>
  <polyline points="80,80 176,80 272,80 368,80 464,80 560,80" fill="none" stroke="#f3a712" stroke-width="2.8"/>
  <polyline points="80,80 176,82 272,84 368,120 464,142 560,150" fill="none" stroke="currentColor" stroke-width="2.8"/>
  <polyline points="80,164 176,166 272,166 368,168 464,169 560,170" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="6,3"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="576" y="84" fill="#f3a712">static baseline</text>
    <text x="576" y="154" fill="currentColor">dynamic benchmark</text>
    <text x="576" y="174" fill="currentColor" opacity="0.85">observed project</text>
    <text x="12" y="206" font-weight="400" fill="currentColor" opacity="0.82">The widening amber gap is not performance. It is a regional trend the project did not cause, credited as if it had.</text>
  </g>
</svg>

## Frequently Asked Questions

### Why did methodologies move to dynamic benchmarks?

Because a static baseline credits a project for regional trends it did not cause. When commodity prices fall or enforcement improves, deforestation drops everywhere, and a baseline frozen at the historical rate widens against the observed trajectory year after year — producing a rising credit stream from an external event. A dynamic benchmark tracks the regional rate, so the credited difference reflects the project's own effect. It also means the credit can fall for reasons outside the project's control, which is the symmetric and correct consequence.

### How large should the reference region be?

Large enough that its rate is statistically stable at the reporting interval, small enough that it remains comparable to the project on the drivers of change. Those pull in opposite directions, and the resolution is stratification: define a large candidate region, then restrict to strata matching the project's terrain, accessibility, and tenure. Report the region's area, its stratification, and the resulting sample size, since a benchmark computed from a handful of pixels is noise wearing a counterfactual's clothes.

### What if the project outperforms every comparable area by a wide margin?

Investigate before celebrating. A very large positive difference is more often a comparability problem than an exceptional intervention — an unmatched covariate, a boundary drawn around land that was never under pressure, or a difference in how change is measured inside and outside the project. Run the pre-project trend test, re-check the balance statistics, and confirm both areas were processed through an identical pipeline before attributing the gap to the project.

### How do I keep the baseline analysis reproducible across a decade?

Freeze the reference region and its stratification at validation with a content hash, pin the change-detection code and its parameters, and store the per-period inputs rather than only the computed rates. A baseline that cannot be recomputed from stored evidence is a baseline that will be re-estimated with whatever tools exist at the next revision, which makes the series discontinuous in a way nobody planned.

### Should the baseline be spatially explicit or a single rate?

Spatially explicit where the methodology allows it, because deforestation risk varies enormously within a project — roadsides and edges face pressure that interiors do not. A single rate applied uniformly over-credits protected interiors and under-credits genuinely threatened margins. A risk-stratified baseline is more work and more defensible, and it makes the leakage analysis easier because the belt's expected pressure is already modelled.

### How should the risk model's own uncertainty enter the baseline?

Through the allocation rather than as an afterthought. The risk model predicts where loss would occur, and its error means the allocated pattern is uncertain even when the total is not; propagating that through to the baseline emissions gives an interval that reflects both the quantity and its placement. Where the carbon density varies strongly across the project, placement uncertainty can dominate — the same hectares of loss allocated to high-density or low-density pixels produce materially different baseline emissions.

## Related guides

- [Forest Carbon Baseline & Additionality Modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/) — the parent counterfactual-construction discipline this recipe sits within.
- [Threshold Tuning for Carbon Stock Baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) — the canopy-cover masking that defines forest before any loss is modelled.
- [Monte Carlo Uncertainty Propagation for Emission Factors](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/monte-carlo-uncertainty-propagation-for-emission-factors/) — the source of the carbon-density variances that drive the deduction.
- [Verra VM0047 vs Gold Standard GIS Requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/) — the registry rules the credited baseline must satisfy at submission.
