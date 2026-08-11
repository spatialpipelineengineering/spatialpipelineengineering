---
shortTitle: "Tuning Canopy-Cover Thresholds for Forest Baselines"
title: "Tuning Canopy-Cover Thresholds for Forest Baselines"
description: "Calibrate the canopy-cover % threshold that defines forest for a carbon baseline: reconcile the FAO/national definition with Hansen GFC tree cover, sweep thresholds against reference plots, and document the choice for audit."
slug: tuning-canopy-cover-thresholds-for-forest-baselines
type: guide
breadcrumb: "Tuning Canopy-Cover Thresholds"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Tuning Canopy-Cover Thresholds for Forest Baselines

The single number that decides whether a pixel is "forest" — the canopy-cover percentage above which tree cover counts — quietly governs the entire credited area of a forest carbon baseline, and getting it wrong swings both the mapped extent and the tonnage that flows from it. This guide is the task-level recipe under [Threshold Tuning for Carbon Stock Baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/), part of the [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) framework, and it depends directly on the field measurements harmonized by [ground-truth alignment for carbon models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) to calibrate the threshold rather than guess it.

A canopy-cover threshold is not a modelling convenience; it is a legal definition rendered as a raster operation. The FAO defines forest as land with tree canopy cover of more than 10% over a minimum area with trees able to reach a minimum height, and most national forest definitions restate that with locally binding cut-offs — the same cut-off that determines additionality baselines in [forest carbon baseline and additionality modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/), and the same one that a change-detection layer must respect when it flags loss, as covered in [change detection algorithms for land cover](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/). When a project applies an arbitrary threshold to a tree-cover product such as the Hansen Global Forest Change (GFC) `treecover2000` layer, it silently redefines what counts as forest, and the credited baseline area moves with it — often by tens of percent across a plausible range of thresholds. The engineering task is to make that number defensible: pin it to the applicable definition, calibrate it against reference plots, quantify the sensitivity, and record the justification so a verifier can reproduce the mask.

<svg viewBox="0 0 1000 300" role="img" aria-labelledby="cct-t cct-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cct-t">Canopy-cover threshold calibration and forest-mask build</title>
  <desc id="cct-d">A tree-cover raster such as Hansen GFC treecover2000 and a set of reference plots feed a threshold sweep across candidate canopy-cover cut-offs. Each candidate is scored on overall accuracy, omission error and commission error against the plots. A selection step picks the optimum subject to the applicable FAO or national forest definition and writes a justification. The chosen threshold produces the calibrated, audited forest mask, shown in amber.</desc>
  <defs>
    <marker id="cct-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- input boxes -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="14" y="40" width="150" height="60" rx="9"/>
      <rect x="14" y="180" width="150" height="60" rx="9"/>
      <rect x="210" y="110" width="150" height="70" rx="9"/>
      <rect x="406" y="110" width="160" height="70" rx="9"/>
    </g>
    <!-- selection diamond -->
    <polygon points="672,145 736,110 800,145 736,180" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <!-- output mask (accent) -->
    <rect x="836" y="108" width="150" height="74" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <!-- titles -->
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="89" y="66">Tree-cover raster</text>
      <text x="89" y="206">Reference plots</text>
      <text x="285" y="140">Sweep thresholds</text>
      <text x="486" y="140">Score</text>
    </g>
    <text x="736" y="148" fill="currentColor" font-size="10.5" font-weight="600">Select +</text>
    <text x="736" y="162" fill="currentColor" font-size="10.5" font-weight="600">justify</text>
    <text x="911" y="140" fill="#f3a712" font-size="11.5" font-weight="700">Forest mask</text>
    <!-- subtitles -->
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="89" y="84">Hansen GFC &#183; %</text>
      <text x="89" y="224">field / photo-interp</text>
      <text x="285" y="158">10 &#8594; 60% grid</text>
      <text x="486" y="158">accuracy &#183; omission</text>
      <text x="486" y="172">commission</text>
      <text x="911" y="158">calibrated &#183; audited</text>
      <text x="911" y="172">FAO / national def.</text>
    </g>
    <!-- definition constraint feeding selection -->
    <text x="736" y="222" fill="currentColor" font-size="9.5" opacity="0.72">def. constraint</text>
    <line x1="736" y1="208" x2="736" y2="182" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4,3" marker-end="url(#cct-arrow)"/>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#cct-arrow)">
    <path d="M164 70 C 188 70, 190 130, 208 135"/>
    <path d="M164 210 C 188 210, 190 158, 208 155"/>
    <line x1="360" y1="145" x2="404" y2="145"/>
    <line x1="566" y1="145" x2="670" y2="145"/>
    <line x1="800" y1="145" x2="834" y2="145"/>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Calibrate a canopy-cover threshold to define forest for a carbon baseline",
  "description": "Reconcile the applicable FAO or national forest definition with a tree-cover product, sweep candidate thresholds against reference plots, select the optimum by balanced accuracy, and build an audited forest mask with an equal-area extent calculation.",
  "totalTime": "PT45M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "rioxarray" },
    { "@type": "HowToTool", "name": "geopandas" },
    { "@type": "HowToTool", "name": "scikit-learn" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest", "text": "Load the tree-cover raster and reference plots, confirming CRS tags and the applicable forest definition constraints." },
    { "@type": "HowToStep", "name": "Diagnose", "text": "Quantify credited-area sensitivity across a candidate threshold sweep and confirm reference-plot count and class balance are sufficient to calibrate." },
    { "@type": "HowToStep", "name": "Transform", "text": "Sample tree cover at plot locations, compute the confusion matrix and balanced accuracy per threshold, and select the optimum subject to the definition." },
    { "@type": "HowToStep", "name": "Validate", "text": "Gate the chosen threshold against the definition floor and a minimum accuracy, then build the forest mask and compute area in an equal-area CRS." },
    { "@type": "HowToStep", "name": "Export", "text": "Write the mask, the per-threshold metric table, and the justification record for verifier reproduction." },
    { "@type": "HowToStep", "name": "Submit", "text": "Forward the mask and threshold provenance to the additionality baseline and registry submission." }
  ]
}
</script>

## Root Cause Analysis: Why an Arbitrary Threshold Corrupts the Baseline

The failure is structural, not statistical. A tree-cover product reports a continuous percentage per pixel; a forest baseline needs a binary mask. The threshold is the bridge, and because it is applied once and reused everywhere, an unjustified value contaminates every downstream figure without leaving an obvious error.

First, **the credited area is a step function of the threshold, and the steps are large.** Canopy-cover distributions in tropical and degraded landscapes are dense in the 10–40% band, exactly where thresholds are typically set. Moving a Hansen GFC threshold from 30% to 10% can pull a fifth of a project's pixels across the forest boundary in a single reclassification, and every one of those pixels then carries a carbon density into the baseline. A choice made for convenience — copying a default from another project, or matching a figure someone remembered — becomes a multi-thousand-tonne swing that nobody explicitly authorized.

Second, **the tree-cover product and the definition measure different things.** Hansen `treecover2000` estimates canopy closure of vegetation taller than five metres at a 30 m Landsat pixel; a national forest definition may specify a minimum height, a minimum mapping unit, and a land-use rather than land-cover test. Applying the product's percentage directly to the definition's percentage assumes the two are interchangeable when they are not — the product has its own bias and saturation behaviour, so a nominal 10% definition may correspond to a materially different cut-off on the product to reproduce the same field-observed forest extent.

Third, **an uncalibrated threshold hides its own error.** Without reference plots, there is no way to distinguish omission (real forest the mask drops) from commission (non-forest the mask credits), yet the two have opposite economic consequences: commission inflates baseline stock and invites verifier rejection, while omission strands legitimate area. A threshold picked to maximize mapped area silently maximizes commission. The only defensible procedure is to score candidate thresholds against ground truth and select on a balanced criterion, then document why that value — and not the one a percentage point away — was chosen.

## Diagnostic Pipeline: Sensitivity Sweep and Plot Sufficiency

Before calibrating, quantify how much is actually at stake and confirm the reference data can support a decision. The diagnostic sweeps the credited area across the candidate threshold range so the sensitivity is a logged number rather than an assumption, and it checks that enough reference plots exist in each class to calibrate at all. A calibration built on twelve plots is not a calibration; it is a coincidence.

```python
import geopandas as gpd
import numpy as np
import rioxarray  # registers the xarray ".rio" accessor
import structlog
import xarray as xr

log = structlog.get_logger()

EQUAL_AREA_CRS = "EPSG:6933"     # World Cylindrical Equal Area — area-true masks
MIN_PLOTS_PER_CLASS = 30         # floor before a calibration is trustworthy
DEFINITION_FLOOR_PCT = 10.0      # FAO/national canopy-cover floor for "forest"


def diagnose_threshold_sensitivity(
    treecover_path: str,
    plots_path: str,
    candidates: tuple[float, ...] = (10, 20, 25, 30, 40, 50, 60),
    label_col: str = "is_forest",
) -> dict:
    """Report credited-area sensitivity across a threshold sweep and plot sufficiency.

    Detects the two conditions that make calibration meaningless: a credited area
    that swings wildly across plausible thresholds (high stakes), and reference
    plots too few or too imbalanced per class to score a threshold defensibly.
    """
    issues: list[str] = []

    tc = rioxarray.open_rasterio(treecover_path, masked=True, chunks={"x": 2048, "y": 2048})
    if tc.rio.crs is None:
        raise ValueError("tree-cover raster has no CRS tag; refusing to guess a datum.")

    # Area per pixel is only honest in an equal-area CRS.
    tc_ea = tc.rio.reproject(EQUAL_AREA_CRS)
    px_area_ha = abs(tc_ea.rio.resolution()[0] * tc_ea.rio.resolution()[1]) / 10_000.0

    areas_ha: dict[float, float] = {}
    for thr in candidates:
        forest_px = int((tc_ea >= thr).sum().compute())
        areas_ha[thr] = round(forest_px * px_area_ha, 1)

    a_lo, a_hi = areas_ha[min(candidates)], areas_ha[max(candidates)]
    swing_pct = round(100.0 * (a_lo - a_hi) / a_lo, 1) if a_lo else float("nan")
    if swing_pct >= 15.0:
        issues.append(f"high_area_sensitivity:{swing_pct}pct")

    # Reference-plot sufficiency and class balance.
    plots = gpd.read_file(plots_path)
    if plots.crs is None:
        raise ValueError("reference plots have no CRS; cannot sample tree cover.")
    n_forest = int((plots[label_col] == 1).sum())
    n_nonforest = int((plots[label_col] == 0).sum())
    if min(n_forest, n_nonforest) < MIN_PLOTS_PER_CLASS:
        issues.append(f"insufficient_plots:forest={n_forest},nonforest={n_nonforest}")

    report = {
        "candidates": list(candidates),
        "credited_area_ha": areas_ha,
        "area_swing_pct": swing_pct,
        "n_plots_forest": n_forest,
        "n_plots_nonforest": n_nonforest,
        "definition_floor_pct": DEFINITION_FLOOR_PCT,
        "calibratable": not issues,
        "issues": issues,
    }
    log.info("canopy.threshold.diagnosed", **report)
    return report
```

A report with `calibratable=False` does not stop the pipeline blindly; a high area swing simply confirms the threshold matters enough to justify the calibration effort, while insufficient plots route the project back to a field-sampling campaign rather than letting an underpowered calibration masquerade as evidence.

## Deterministic Transformation Logic: Calibrate and Build the Mask

The calibration samples the tree-cover product at each reference-plot location, then treats every candidate threshold as a binary classifier scored against the plot labels. Balanced accuracy — the mean of sensitivity and specificity — is the selection criterion because it refuses to reward a threshold that simply calls everything forest, which raw accuracy would do on a forest-heavy sample. The optimum is chosen from candidates that also satisfy the applicable definition floor, so the statistics can refine the choice but never override the legal minimum. The winning threshold then builds the mask, and the credited area is computed in an equal-area CRS so the tonnage that follows is area-honest.

```python
import geopandas as gpd
import numpy as np
import pandas as pd
import rioxarray  # registers the xarray ".rio" accessor
import structlog
import xarray as xr
from datetime import datetime, timezone
from sklearn.metrics import balanced_accuracy_score, confusion_matrix

log = structlog.get_logger()

EQUAL_AREA_CRS = "EPSG:6933"
DEFINITION_FLOOR_PCT = 10.0      # threshold may not fall below the definition
MIN_BALANCED_ACCURACY = 0.80     # validation gate on the chosen threshold


def _sample_treecover_at_plots(tc: xr.DataArray, plots: gpd.GeoDataFrame) -> np.ndarray:
    """Sample the tree-cover raster at plot centroids in the raster's CRS."""
    pts = plots.to_crs(tc.rio.crs)
    xs = xr.DataArray(pts.geometry.x.values, dims="plot")
    ys = xr.DataArray(pts.geometry.y.values, dims="plot")
    sampled = tc.sel(x=xs, y=ys, method="nearest").squeeze(drop=True)
    return np.asarray(sampled.compute()).astype("float32")


def calibrate_and_build_forest_mask(
    treecover_path: str,
    plots_path: str,
    output_mask_path: str,
    candidates: tuple[float, ...] = (10, 20, 25, 30, 40, 50, 60),
    label_col: str = "is_forest",
) -> tuple[pd.DataFrame, dict]:
    """Calibrate a canopy-cover threshold against reference plots and build a mask.

    Returns (metrics_table, provenance). The metrics table carries per-threshold
    accuracy, omission, commission and credited area; provenance records the
    selected threshold, the constraint that bounded it, and the audit gate result.
    """
    tc = rioxarray.open_rasterio(treecover_path, masked=True, chunks={"x": 2048, "y": 2048})
    if tc.rio.crs is None:
        raise ValueError("tree-cover raster has no CRS tag; refusing to guess a datum.")

    plots = gpd.read_file(plots_path)
    y_true = plots[label_col].astype(int).to_numpy()
    tc_at_plots = _sample_treecover_at_plots(tc, plots)

    # Score every candidate threshold as a binary classifier against ground truth.
    rows: list[dict] = []
    for thr in candidates:
        y_pred = (tc_at_plots >= thr).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        # Omission = real forest missed; commission = non-forest wrongly credited.
        omission = fn / (fn + tp) if (fn + tp) else float("nan")
        commission = fp / (fp + tp) if (fp + tp) else float("nan")
        rows.append({
            "threshold_pct": float(thr),
            "balanced_accuracy": round(balanced_accuracy_score(y_true, y_pred), 4),
            "omission_error": round(float(omission), 4),
            "commission_error": round(float(commission), 4),
            "true_pos": int(tp), "false_pos": int(fp), "false_neg": int(fn),
        })
    metrics = pd.DataFrame(rows)

    # Selection is constrained by the legal definition, then optimised on the data.
    eligible = metrics[metrics["threshold_pct"] >= DEFINITION_FLOOR_PCT]
    if eligible.empty:
        raise ValueError("no candidate threshold satisfies the definition floor.")
    best = eligible.loc[eligible["balanced_accuracy"].idxmax()]
    chosen = float(best["threshold_pct"])
    chosen_ba = float(best["balanced_accuracy"])

    # Validation gate: refuse to ship a mask the plots cannot defend.
    if chosen_ba < MIN_BALANCED_ACCURACY:
        log.error("canopy.calibration.gate_failed", threshold_pct=chosen,
                  balanced_accuracy=chosen_ba, floor=MIN_BALANCED_ACCURACY)
        raise RuntimeError(
            f"best threshold {chosen}% scores {chosen_ba:.3f} balanced accuracy, "
            f"below the {MIN_BALANCED_ACCURACY} gate; recalibrate or add plots.")

    # Build the mask and compute area in an equal-area CRS so tonnage is honest.
    forest = (tc >= chosen).astype("uint8").rio.write_nodata(255)
    forest_ea = forest.rio.reproject(EQUAL_AREA_CRS)
    px_area_ha = abs(forest_ea.rio.resolution()[0] * forest_ea.rio.resolution()[1]) / 10_000.0
    credited_area_ha = round(int((forest_ea == 1).sum().compute()) * px_area_ha, 1)
    forest.rio.to_raster(output_mask_path, compress="deflate", tiled=True)

    provenance = {
        "selected_threshold_pct": chosen,
        "selection_criterion": "max_balanced_accuracy_subject_to_definition_floor",
        "definition_floor_pct": DEFINITION_FLOOR_PCT,
        "balanced_accuracy": chosen_ba,
        "credited_area_ha": credited_area_ha,
        "area_crs": EQUAL_AREA_CRS,
        "n_reference_plots": int(len(plots)),
        "mask_path": output_mask_path,
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "compliance_standard": "FAO forest definition / Verra VM0047 / ISO 14064-3",
    }
    log.info("canopy.threshold.calibrated", **provenance)
    return metrics, provenance
```

The critical design choice is the ordering: the definition floor filters the candidates *before* the data selects among them. Statistics can push the threshold above the legal minimum when the plots show a higher cut-off reproduces field-observed forest more faithfully, but they can never pull it below the floor to credit more area. That ordering is precisely what a verifier checks, so it is encoded as code rather than left to discipline.

<svg viewBox="0 -4 780 222" role="img" aria-labelledby="swp-t swp-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="swp-t">Threshold sensitivity sweep, and the plateau that makes a choice defensible</title>
  <desc id="swp-d">A chart of baseline forest area against canopy-cover threshold from 10 to 60 percent. In a well-separated landscape the curve falls steeply at low thresholds, flattens into a plateau between 25 and 40 percent where a five-point change moves the area by under 2 percent, then falls steeply again. In a landscape with a continuous cover gradient the curve declines smoothly throughout with no plateau, so every threshold choice moves the area materially. A panel notes that the plateau is what allows a threshold to be defended as insensitive, and that its absence should be disclosed rather than hidden behind a chosen number.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Look for a plateau before defending a number</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Baseline forest area against the canopy-cover cut-off.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="60" x2="560" y2="60"/><line x1="80" y1="104" x2="560" y2="104"/><line x1="80" y1="148" x2="560" y2="148"/>
  </g>
  <rect x="224" y="50" width="144" height="130" fill="currentColor" opacity="0.09"/>
  <text x="296" y="66" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor">plateau · 25–40%</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="50" x2="80" y2="180"/>
    <line x1="80" y1="180" x2="560" y2="180"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="80" y="196" text-anchor="middle">10%</text>
    <text x="224" y="196" text-anchor="middle">25%</text>
    <text x="368" y="196" text-anchor="middle">40%</text>
    <text x="560" y="196" text-anchor="middle">60%</text>
    <text x="34" y="118" transform="rotate(-90 34 118)" text-anchor="middle" font-weight="600">baseline area</text>
  </g>
  <polyline points="80,58 152,84 224,110 296,114 368,118 440,144 512,166 560,174" fill="none" stroke="currentColor" stroke-width="2.8"/>
  <polyline points="80,62 152,80 224,98 296,116 368,134 440,150 512,164 560,172" fill="none" stroke="#f3a712" stroke-width="2.6" stroke-dasharray="7,4"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="576" y="112" fill="currentColor">well-separated landscape</text>
    <text x="576" y="132" fill="#f3a712">continuous cover gradient</text>
    <text x="576" y="152" fill="currentColor" opacity="0.82" font-weight="400" font-size="9">no plateau — disclose it</text>
    <text x="12" y="212" font-weight="400" font-size="9" fill="currentColor" opacity="0.82">On the plateau, a five-point change moves the area by under 2%. That insensitivity is the argument; the number alone is not.</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

The per-threshold metrics table is the audit artifact. It shows every value that was considered, what each would have credited, and why the selected one won — turning a contestable judgement call into a reproducible record. The table below is a representative output over a degraded tropical project where the definition floor is 10% but the plots favour a higher operational cut-off.


| Threshold (%) | Balanced accuracy | Omission error | Commission error | Credited area (ha) |
|--------------:|------------------:|---------------:|-----------------:|-------------------:|
| 10 | 0.79 | 0.04 | 0.38 | 48,120 |
| 20 | 0.86 | 0.07 | 0.24 | 41,760 |
| 25 | 0.90 | 0.09 | 0.16 | 38,540 |
| 30 | 0.91 | 0.12 | 0.11 | 35,910 |
| 40 | 0.87 | 0.21 | 0.06 | 30,180 |
| 50 | 0.81 | 0.33 | 0.03 | 25,470 |
| 60 | 0.74 | 0.47 | 0.02 | 20,090 |


Read across the row: the 10% floor credits the most area but at 38% commission, exactly the overcrediting a verifier rejects; pushing to 30% costs roughly a quarter of the area against the floor but balances omission and commission and maximizes balanced accuracy. Selecting 30% here is defensible, and the table is the defence. Each output maps to a specific control. The credited-area figure and its equal-area CRS satisfy the area-consistency expectations of **Verra VM0047** and related afforestation/reforestation methodologies, which require the forest definition and mapping approach to be stated and applied consistently. The omission and commission errors, derived from the confusion matrix against independent plots, provide the accuracy assessment that **ISO 14064-3** verification expects for a classified land-cover product. The selected threshold, its selection criterion, and the definition floor together form the transparent disclosure of a methodological choice that **CSRD ESRS E1** scrutinizes in land-use reporting. The provenance record then flows into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) so the mask is traceable to the exact threshold decision that produced it.

## Production Integration

Deploy the calibration within the baseline pipeline following a fixed ingest → diagnose → transform → validate → export → submit sequence, so the threshold decision is a versioned, gated stage rather than a one-off notebook cell.

1. **Ingest.** Load the tree-cover product (Hansen GFC `treecover2000`, or a national canopy-cover map where one is mandated) and the reference plots, confirming CRS tags on both and recording the applicable FAO or national forest definition — floor, minimum height, and minimum mapping unit — as pipeline configuration.
2. **Diagnose.** Run `diagnose_threshold_sensitivity` to log the credited-area swing across the candidate range and confirm each class carries enough plots; route an underpowered calibration back to field sampling aligned by [ground-truth alignment for carbon models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/).
3. **Transform.** Call `calibrate_and_build_forest_mask` to score every candidate against the plots, select the optimum subject to the definition floor, and build the mask.
4. **Validate.** Assert the balanced-accuracy gate and confirm the selected threshold sits at or above the definition floor; reject any run that credits area on a threshold the plots cannot defend.
5. **Export.** Write the forest mask as a Cloud-Optimized GeoTIFF, the per-threshold metrics table as Parquet, and the provenance record, all carrying the equal-area credited-area figure.
6. **Submit.** Forward the mask and threshold provenance to [forest carbon baseline and additionality modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/), where the mask defines the area over which the counterfactual baseline is projected, and hand the same threshold to [change detection algorithms for land cover](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/) so that loss and gain are measured against the identical forest definition.

For authoritative definitions, consult the [FAO Global Forest Resources Assessment terms and definitions](https://www.fao.org/forest-resources-assessment/en/) and the [Hansen Global Forest Change dataset documentation](https://glad.earthengine.app/view/global-forest-change). By pinning the threshold to a stated definition, calibrating it against independent plots, quantifying the area sensitivity, and shipping the metrics table as evidence, canopy-cover threshold tuning converts the most consequential single number in a forest baseline from an arbitrary default into an auditable, reproducible decision.

<svg viewBox="0 -4 880 212" role="img" aria-labelledby="def-t def-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="def-t">A forest definition has three criteria, and a cover threshold satisfies one</title>
  <desc id="def-d">Three criteria that together constitute a forest definition. Crown cover, expressed as a minimum percentage, is the one a canopy-cover threshold addresses directly. Minimum height, typically between two and five metres, requires a structural measurement that optical cover products do not provide. Minimum area, typically half a hectare to one hectare, is a spatial criterion applied after thresholding by removing patches below the size limit. A panel notes that applying only the cover criterion classifies scrub and young regrowth as forest and small clearings as deforestation, and that the three must be applied together in a stated order.</desc>
  <defs>
    <marker id="def-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="440" y="16" fill="currentColor" font-size="11.5" font-weight="700">A cover threshold satisfies one criterion of three</text>
    <rect x="12" y="44" width="272" height="112" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="12" y="44" width="272" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="148" y="70" fill="currentColor" font-size="10.5" font-weight="700">Crown cover ≥ 30%</text>
    <text x="148" y="96" fill="currentColor" font-size="9.5" opacity="0.85">what a cover threshold gives you</text>
    <text x="148" y="122" fill="currentColor" font-size="9.5" opacity="0.85">from optical or structural cover</text>
    <text x="148" y="142" fill="currentColor" font-size="9" opacity="0.75">necessary, not sufficient</text>
    <rect x="304" y="44" width="272" height="112" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="304" y="44" width="272" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="440" y="70" fill="currentColor" font-size="10.5" font-weight="700">Height ≥ 2–5 m</text>
    <text x="440" y="96" fill="currentColor" font-size="9.5" opacity="0.85">needs a structural measurement</text>
    <text x="440" y="122" fill="#f3a712" font-size="9.5" font-weight="700">without it, scrub is forest</text>
    <text x="440" y="142" fill="currentColor" font-size="9" opacity="0.75">LiDAR, GEDI, or a proxy</text>
    <rect x="596" y="44" width="272" height="112" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="596" y="44" width="272" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="732" y="70" fill="currentColor" font-size="10.5" font-weight="700">Area ≥ 0.5–1 ha</text>
    <text x="732" y="96" fill="currentColor" font-size="9.5" opacity="0.85">applied after thresholding</text>
    <text x="732" y="122" fill="#f3a712" font-size="9.5" font-weight="700">without it, a gap is deforestation</text>
    <text x="732" y="142" fill="currentColor" font-size="9" opacity="0.75">remove patches below the limit</text>
    <text x="440" y="192" fill="currentColor" font-size="9.5" opacity="0.85">Apply all three, in a stated order, and record the order — it changes the result at the margins where most disputes live.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#def-arrow)">
    <line x1="284" y1="100" x2="302" y2="100"/><line x1="576" y1="100" x2="594" y2="100"/>
  </g>
</svg>

## Frequently Asked Questions

### Does a cover threshold on its own implement a forest definition?

No. Every operational forest definition has at least three criteria — minimum crown cover, minimum height, and minimum area — and a cover threshold addresses only the first. Applying it alone classifies scrub and young regrowth as forest and treats sub-hectare canopy gaps as deforestation. Apply all three in a stated order, record the order, and expect the marginal cases to be where disputes concentrate.

### How is the minimum-area criterion applied?

As a morphological filter after thresholding: remove connected forest patches below the minimum area, and correspondingly remove non-forest patches below it from within forest. The second half is routinely forgotten, and its omission means small internal gaps count as loss while small external patches do not count as gain — an asymmetry that biases change detection in one direction. Apply both, in an equal-area projection, and record the connectivity rule used.

### What if no plateau exists in the sensitivity sweep?

Say so, and choose the threshold on external grounds — the methodological definition, a national convention — rather than pretending the choice is insensitive. A continuous cover gradient is a real landscape property, common in dry forest and savanna transitions, and the honest treatment is a wider stated uncertainty on the area estimate reflecting the threshold's influence. Hiding the absence of a plateau behind a confidently stated number is what a reviewer's sweep will find.

### Should the threshold differ between the baseline and monitoring periods?

Never. The whole purpose of freezing it is that measured change reflects the forest rather than the definition. If a revision is genuinely required — a methodology change, a new forest definition — recompute the entire history under both values, report the difference, and treat it as a restatement. A threshold that differs between periods makes the series meaningless in a way no footnote repairs.

### How does the height criterion get satisfied without LiDAR?

With a proxy and an honest statement about it. Where structural data is unavailable, a spectral or texture-based proxy for stand maturity, calibrated against whatever height measurements exist, is defensible if its error is characterised and its effect on the classification is reported. What is not defensible is silently omitting the height criterion, which systematically inflates forest area in regrowth and scrub, and therefore inflates both the baseline and any avoided-loss claim built on it.

## Related guides

- [Threshold Tuning for Carbon Stock Baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) — the parent discipline this canopy-cover recipe sits within.
- [Ground Truth Alignment for Carbon Models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) — the field-plot harmonization that supplies the reference labels for calibration.
- [Forest Carbon Baseline & Additionality Modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/) — the downstream consumer where the forest mask sets the baseline area.
- [Change Detection Algorithms for Land Cover](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/) — the loss/gain layer that must respect the same forest definition.
- [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) — the parent framework coordinating baseline validation.
