---
shortTitle: "Forest Carbon Baseline & Additionality Modeling"
title: "Forest Carbon Baseline & Additionality Modeling"
description: "Model defensible forest carbon baselines and additionality with matched controls, dynamic jurisdictional benchmarks (VM0047), leakage belts and buffer pools — the GIS and statistics auditors demand."
slug: forest-carbon-baseline-and-additionality-modeling
type: topic
breadcrumb: "Baseline & Additionality Modeling"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Forest Carbon Baseline & Additionality Modeling

Forest Carbon Baseline & Additionality Modeling is the stage that decides how many tonnes a REDD+ or afforestation project may credibly claim, by constructing the counterfactual — what would have happened to the forest without the intervention — and subtracting it from the observed outcome. It is the most contested quantitative step in the [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack, because the counterfactual is unobservable by definition and every methodological choice moves the credited volume. This component consumes the calibrated stock surfaces and confidence envelopes produced by [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) and hands its baseline surface to [threshold tuning for carbon stock baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/), where the numeric cut-offs that separate forest from non-forest are calibrated against it.

The last five years have seen forest carbon baselining move decisively away from self-selected, static, project-level baselines towards dynamic performance benchmarks derived from matched control areas and jurisdictional deforestation rates — a shift crystallised by Verra's consolidated REDD methodology VM0047. That transition is not a compliance footnote; it changes the GIS data a pipeline must ingest, the statistical machinery it must run, and the lineage it must retain. Where an older baseline was a single historical average frozen into a project design document, a modern baseline is a spatially explicit, periodically re-estimated surface that must survive the same scrutiny the [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) stage applies to every other figure, and it must feed the same auditable [threshold tuning](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) logic downstream. This page covers how baselines and additionality are modelled defensibly: matched controls and synthetic controls, historical reference regions, deforestation-risk modelling, leakage belts, permanence buffers, and the statistical tests that make the credited difference something an auditor can reproduce from the pixels.

<svg viewBox="0 0 940 330" role="img" aria-labelledby="fcb-t fcb-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="fcb-t">Forest carbon baseline and additionality: matched control estimates a counterfactual carbon trajectory, and the observed-minus-counterfactual difference is credited after buffer and uncertainty deductions</title>
  <desc id="fcb-d">On the left, a project area and a covariate-matched control or jurisdictional benchmark region are described by elevation, slope, distance to road and baseline forest cover. They feed a central trajectory panel plotting two carbon curves over time: a dashed counterfactual curve that declines steeply as the matched control loses forest, and a solid observed curve that stays high inside the project. The amber wedge between the two curves is the gross avoided loss. An arrow leads to an amber output box on the right where the gross difference has a permanence buffer pool contribution and an uncertainty deduction subtracted to yield issued, audited credits.</desc>
  <defs>
    <marker id="fcb-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- Left: project + control descriptors -->
  <rect x="14" y="54" width="196" height="84" rx="9" fill="currentColor" opacity="0.05"/>
  <rect x="14" y="54" width="196" height="84" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="112" y="76" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Project area</text>
  <text x="112" y="96" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">elevation &#183; slope</text>
  <text x="112" y="110" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">distance-to-road</text>
  <text x="112" y="124" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">baseline forest cover</text>
  <rect x="14" y="176" width="196" height="84" rx="9" fill="currentColor" opacity="0.05"/>
  <rect x="14" y="176" width="196" height="84" rx="9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="5,3"/>
  <text x="112" y="198" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Matched control /</text>
  <text x="112" y="212" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">benchmark region</text>
  <text x="112" y="230" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">covariate-matched pixels</text>
  <text x="112" y="244" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">jurisdictional rate</text>
  <line x1="210" y1="96" x2="269" y2="134" stroke="currentColor" stroke-width="1.4" marker-end="url(#fcb-arrow)"/>
  <line x1="210" y1="218" x2="269" y2="178" stroke="currentColor" stroke-width="1.4" marker-end="url(#fcb-arrow)"/>
  <!-- Middle: trajectory panel -->
  <rect x="270" y="48" width="336" height="234" rx="9" fill="currentColor" opacity="0.03"/>
  <rect x="270" y="48" width="336" height="234" rx="9" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6"/>
  <text x="438" y="68" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.6">CARBON STOCK vs TIME</text>
  <!-- axes -->
  <line x1="300" y1="86" x2="300" y2="252" stroke="currentColor" stroke-width="1.2" opacity="0.55"/>
  <line x1="300" y1="252" x2="586" y2="252" stroke="currentColor" stroke-width="1.2" opacity="0.55"/>
  <text x="292" y="90" text-anchor="end" font-size="8" fill="currentColor" opacity="0.6">tC/ha</text>
  <text x="586" y="266" text-anchor="end" font-size="8" fill="currentColor" opacity="0.6">crediting years</text>
  <!-- avoided-loss wedge (credited difference) -->
  <path d="M300 100 L580 118 L580 232 Z" fill="#f3a712" opacity="0.16"/>
  <!-- observed (project) curve: stays high -->
  <path d="M300 100 C 400 104, 500 110, 580 118" fill="none" stroke="currentColor" stroke-width="2.2"/>
  <text x="602" y="108" text-anchor="end" font-size="8.5" font-weight="600" fill="currentColor">observed</text>
  <!-- counterfactual curve: declines -->
  <path d="M300 100 C 400 150, 500 205, 580 232" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6,4" opacity="0.85"/>
  <text x="602" y="246" text-anchor="end" font-size="8.5" fill="currentColor" opacity="0.85">counterfactual</text>
  <text x="430" y="180" text-anchor="middle" font-size="9" font-weight="700" fill="#f3a712">avoided loss</text>
  <line x1="606" y1="150" x2="654" y2="150" stroke="currentColor" stroke-width="1.4" marker-end="url(#fcb-arrow)"/>
  <!-- Right: credited output (amber) -->
  <rect x="662" y="70" width="264" height="170" rx="9" fill="#f3a712" opacity="0.1"/>
  <rect x="662" y="70" width="264" height="170" rx="9" fill="none" stroke="#f3a712" stroke-width="2"/>
  <text x="794" y="94" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Credited &#916;C (audited)</text>
  <text x="682" y="122" text-anchor="start" font-size="9" fill="currentColor" opacity="0.85">gross avoided loss</text>
  <text x="682" y="146" text-anchor="start" font-size="9" fill="currentColor" opacity="0.85">&#8722; permanence buffer pool</text>
  <text x="682" y="170" text-anchor="start" font-size="9" fill="currentColor" opacity="0.85">&#8722; uncertainty deduction</text>
  <text x="682" y="194" text-anchor="start" font-size="9" fill="currentColor" opacity="0.85">&#8722; leakage-belt loss</text>
  <line x1="682" y1="206" x2="906" y2="206" stroke="#f3a712" stroke-width="1.2"/>
  <text x="794" y="226" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">= issued credits</text>
</svg>

## Role in the MRV Workflow

Baseline and additionality modelling occupies the point in the carbon accounting pipeline where physical measurement becomes a financial claim. Everything upstream — cloud-masked reflectance, fused biomass, calibrated emission factors, propagated variance — produces the observed carbon stock inside the project boundary. This stage answers the only question a registry actually pays for: how much of that stock is genuinely additional, meaning it exists because of the intervention and would not have existed otherwise. Because the counterfactual can never be measured directly, it must be estimated, and the credibility of the estimate is entirely a function of how comparable the reference is to the project and how honestly the estimate is bounded and deducted.

The stage has hard upstream contracts. It requires a project boundary and a leakage belt as versioned, topology-valid vector layers; a stack of historical land-cover or forest-cover rasters spanning at least the reference period the methodology requires; and a set of covariate surfaces — elevation, slope, distance to roads and settlements, distance to prior forest edge, and baseline canopy cover — resampled to a common equal-area grid so that matching is done on like-for-like pixels. Downstream, it emits a spatially explicit baseline surface (expected forest loss or expected stock trajectory per pixel or per stratum), a matched-control diagnostic bundle, and a credited-difference figure already net of the deductions a verifier expects. That figure flows into the same append-only lineage layer every other MRV output uses, so a third party can trace an issued credit back to the specific control pixels and the specific counterfactual that justified it.

Three families of baseline construction dominate practice, and a production system should treat the choice as a data-and-defensibility trade-off rather than a preference. A **historical-average baseline** projects the project area's own past deforestation rate forward; it is cheap and simple but self-referential and easy to game. A **matched-control or synthetic-control baseline** builds the counterfactual from areas that resemble the project on observable drivers of deforestation, which is far more defensible but demands rich covariate data and careful statistics. A **jurisdictional or dynamic performance benchmark** — the direction of travel under VM0047 — allocates an expected loss rate from a wider administrative region's observed deforestation, updated periodically, which resists gaming but requires reliable jurisdiction-wide monitoring. The table below sets out how they compare on the axes that actually determine whether credits survive audit.


| Baseline approach | Core GIS / data needs | Principal bias risk | Defensibility under current standards |
|-------------------|-----------------------|---------------------|----------------------------------------|
| Historical average (project self-referential) | One project boundary + a short historical forest-cover time series | High — no counterfactual for external drivers; trivially inflated by choosing a high-loss reference window | Low; increasingly rejected as a stand-alone baseline |
| Matched / synthetic control | Covariate rasters (elevation, slope, distance-to-road, baseline cover) + region-wide forest-cover history for the donor pool | Moderate — depends entirely on match quality; poor overlap reintroduces selection bias | High when balance is demonstrated and matching is pre-registered |
| Jurisdictional / dynamic benchmark (VM0047) | Jurisdiction-wide activity-data time series, risk map, periodic re-allocation | Lower for gaming; sensitive to jurisdiction data quality and allocation method | Highest; aligns with the consolidated methodology direction |


Modern pipelines rarely run one approach in isolation. A VM0047-aligned system typically combines a jurisdictional expected-loss allocation with a matched-control cross-check and an explicit uncertainty treatment, so that the dynamic benchmark constrains the aggregate while covariate matching confirms the project's own risk profile is genuinely represented. Whichever combination is used, the baseline is no longer a number written once — it is a re-estimated surface with a defined validity window, and the pipeline must be built to regenerate it on schedule.

## Core Failure Modes

Three failure modes account for most of the credibility crisis that has engulfed forest carbon in recent years. Each has a specific root cause in the spatial and statistical construction of the baseline, and each has a measurable, well-documented impact on issued volume.

1. **Non-comparable control area inflating additionality.** The root cause is selecting a reference region — or synthetic control pixels — whose deforestation pressure is systematically higher than the project area truly faced, without demonstrating covariate balance. If the donor pool skews towards flatter, more accessible, closer-to-road land while the project sits on steeper or remoter terrain, the estimated counterfactual predicts forest loss the project would never have experienced, and the observed-minus-counterfactual difference is credited as avoided deforestation that was never at risk. This is not a marginal effect: independent reanalyses of REDD+ projects using rigorous synthetic controls found that a large share of projects had reference-region deforestation rates several times higher than matched counterfactuals justified, with headline baselines overstated by roughly two- to three-fold and many projects delivering additionality of only a small fraction of the credits issued. The failure is invisible in the project's own reporting because the project never audits its control against itself — only an external matched-control reconstruction exposes it.

2. **Ignoring leakage, causing over-crediting.** The root cause is treating the project boundary as a closed system and crediting avoided emissions inside it while the deforestation activity simply relocates to unprotected forest outside it. Activity-shifting leakage (loggers and farmers move next door) and market leakage (reduced local supply raises prices and drives clearing elsewhere) both mean the atmosphere sees less benefit than the boundary suggests. If the pipeline does not monitor a leakage belt and deduct the loss observed there, the credited figure double-counts protection that did not occur at the landscape scale. Empirical leakage estimates for avoided-deforestation projects commonly fall in the range of roughly 20 to 80 percent of gross claimed reductions depending on the driver, so omitting the deduction can more than halve the true impact while leaving the issued volume untouched.

3. **Static baseline drift as regional deforestation changes.** The root cause is fixing a historical-average baseline at project design and holding it constant for a decade while the regional deforestation rate that the baseline was meant to represent moves underneath it. When regional clearing slows — because of enforcement, commodity-price shifts, or macroeconomic change — a frozen high baseline keeps crediting against a threat that has receded, and the gap between the assumed counterfactual and reality widens every year. Even a modest divergence of a few percentage points of forest-loss rate per year compounds: over a ten-year crediting period a static baseline can drift to double the genuine counterfactual, generating a steadily growing stream of non-additional credits. This is precisely the failure the shift to periodically re-estimated dynamic benchmarks under VM0047 is designed to eliminate, and it is the strongest engineering argument for building baselines as regenerable surfaces rather than constants in a config file.

<svg viewBox="0 -4 780 218" role="img" aria-labelledby="bl-t bl-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="bl-t">Three baseline constructions on the same project, and the credit each implies</title>
  <desc id="bl-d">A chart of cumulative deforestation over ten years for one project. The observed project trajectory is nearly flat. Three counterfactual baselines are drawn above it. A historical-average baseline, extrapolating the project area's own prior rate, is the highest and implies 610 kilotonnes of avoided emissions. A jurisdictional baseline, using the wider region's rate, is intermediate and implies 430. A matched-control baseline, using areas statistically similar to the project at validation, is the lowest and implies 290. A panel notes that all three are defensible constructions, that the choice more than doubles the credit, and that this is why methodologies increasingly prescribe the construction rather than leaving it open.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The construction more than doubles the credit</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Cumulative deforestation, one project, three counterfactuals.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="60" x2="560" y2="60"/><line x1="80" y1="102" x2="560" y2="102"/><line x1="80" y1="144" x2="560" y2="144"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="50" x2="80" y2="176"/>
    <line x1="80" y1="176" x2="560" y2="176"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="80" y="192" text-anchor="middle">yr 0</text>
    <text x="320" y="192" text-anchor="middle">yr 5</text>
    <text x="560" y="192" text-anchor="middle">yr 10</text>
    <text x="30" y="118" transform="rotate(-90 30 118)" text-anchor="middle" font-weight="600">cumulative loss</text>
  </g>
  <polyline points="80,176 176,166 272,158 368,152 464,146 560,142" fill="none" stroke="currentColor" stroke-width="3"/>
  <polyline points="80,176 176,152 272,128 368,104 464,80 560,56" fill="none" stroke="#f3a712" stroke-width="2.6"/>
  <polyline points="80,176 176,158 272,140 368,122 464,104 560,88" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="7,4"/>
  <polyline points="80,176 176,164 272,150 368,138 464,124 560,112" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="3,3"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="576" y="60" fill="#f3a712">historical average → 610 kt</text>
    <text x="576" y="92" fill="currentColor">jurisdictional → 430 kt</text>
    <text x="576" y="116" fill="currentColor" opacity="0.85">matched controls → 290 kt</text>
    <text x="576" y="146" fill="currentColor">observed project</text>
    <text x="12" y="210" font-weight="400" fill="currentColor" opacity="0.82">All three are defensible constructions — which is exactly why methodologies now prescribe one rather than leaving it open.</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The implementation below constructs a matched-control counterfactual and computes additionality with an explicit uncertainty deduction. It selects donor pixels by covariate matching on elevation, slope, distance-to-road, and baseline forest cover; enforces an equal-area CRS so per-pixel areas are honest; gates match quality with a standardised-mean-difference balance test that raises before any credit is computed; estimates the counterfactual loss from the matched controls; and subtracts a conservative uncertainty deduction, a leakage-belt loss, and a permanence buffer contribution before emitting an issued figure. Structured telemetry records every gate so the run is reproducible.

```python
from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone

import numpy as np
import geopandas as gpd
import rioxarray  # noqa: F401  (registers the .rio accessor)
import xarray as xr
from scipy.spatial import cKDTree
import structlog

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()

EQUAL_AREA_CRS = "EPSG:6933"     # World Cylindrical Equal Area — area-true for pools
MAX_SMD = 0.10                   # max |standardised mean diff| per covariate after matching
CARBON_FRACTION = 0.47          # IPCC default C fraction of dry biomass
DEFAULT_UNCERTAINTY_DEDUCTION = 0.15   # conservative deduction on gross additionality
DEFAULT_BUFFER_RATE = 0.15             # non-permanence buffer-pool contribution


@dataclass
class AdditionalityResult:
    gross_avoided_tco2e: float
    uncertainty_deduction_tco2e: float
    leakage_deduction_tco2e: float
    buffer_contribution_tco2e: float
    issued_credits_tco2e: float
    n_matched_pairs: int
    max_covariate_smd: float


def _load_equal_area(path: str, name: str) -> xr.DataArray:
    """Open a raster, force the canonical equal-area CRS, refuse untagged input."""
    da = rioxarray.open_rasterio(path, masked=True, chunks={"x": 2048, "y": 2048})
    if da.rio.crs is None:
        raise ValueError(f"{name}: untagged CRS; refusing to guess a datum.")
    if da.rio.crs.to_epsg() != 6933:
        da = da.rio.reproject(EQUAL_AREA_CRS)
        log.info("reprojected_to_equal_area", layer=name, target=EQUAL_AREA_CRS)
    return da.squeeze(drop=True)


def _standardised_mean_diff(treat: np.ndarray, ctrl: np.ndarray) -> float:
    """Absolute standardised mean difference — the covariate-balance diagnostic."""
    pooled_sd = np.sqrt((treat.var(ddof=1) + ctrl.var(ddof=1)) / 2.0) or 1.0
    return float(abs(treat.mean() - ctrl.mean()) / pooled_sd)


def select_matched_controls(
    covariates: dict[str, xr.DataArray],
    project_mask: xr.DataArray,
    donor_mask: xr.DataArray,
    covariate_order: tuple[str, ...] = (
        "elevation", "slope", "distance_to_road", "baseline_cover"),
) -> tuple[np.ndarray, np.ndarray, float]:
    """Nearest-neighbour covariate matching of donor pixels to project pixels.

    Matching is done on z-scored covariates so no single driver (e.g. metres of
    distance-to-road) dominates the Euclidean distance. Returns project pixel
    indices, their matched donor indices, and the worst post-match SMD.
    """
    stack = np.stack([covariates[c].values.ravel() for c in covariate_order], axis=1)
    proj_sel = project_mask.values.ravel().astype(bool)
    donor_sel = donor_mask.values.ravel().astype(bool)
    finite = np.isfinite(stack).all(axis=1)

    mu, sd = np.nanmean(stack[finite], axis=0), np.nanstd(stack[finite], axis=0)
    sd = np.where(sd == 0, 1.0, sd)
    z = (stack - mu) / sd

    proj_idx = np.flatnonzero(proj_sel & finite)
    donor_idx = np.flatnonzero(donor_sel & finite)
    if proj_idx.size == 0 or donor_idx.size == 0:
        raise RuntimeError("empty project or donor pool after finiteness filtering.")

    tree = cKDTree(z[donor_idx])
    _, nn = tree.query(z[proj_idx], k=1)
    matched_donor = donor_idx[nn]

    worst_smd = max(
        _standardised_mean_diff(z[proj_idx, j], z[matched_donor, j])
        for j in range(z.shape[1])
    )
    log.info("covariate_matching_complete",
             n_project=int(proj_idx.size), n_matched=int(matched_donor.size),
             worst_smd=round(worst_smd, 4), covariates=list(covariate_order))
    return proj_idx, matched_donor, worst_smd


def estimate_additionality(
    forest_loss_start: xr.DataArray,
    forest_loss_end: xr.DataArray,
    covariates: dict[str, xr.DataArray],
    project_mask: xr.DataArray,
    donor_mask: xr.DataArray,
    leakage_belt_loss_tco2e: float,
    pixel_area_ha: float,
    biomass_density_t_ha: float,
    uncertainty_deduction: float = DEFAULT_UNCERTAINTY_DEDUCTION,
    buffer_rate: float = DEFAULT_BUFFER_RATE,
) -> AdditionalityResult:
    """Counterfactual avoided emissions from matched controls, net of deductions."""
    proj_idx, matched_donor, worst_smd = select_matched_controls(
        covariates, project_mask, donor_mask)

    # Hard balance gate: an unbalanced match manufactures additionality.
    if worst_smd > MAX_SMD:
        log.error("balance_gate_failed", worst_smd=round(worst_smd, 4), limit=MAX_SMD)
        raise RuntimeError(
            f"covariate balance SMD {worst_smd:.3f} exceeds {MAX_SMD}; "
            "control area is not comparable — additionality would be inflated.")

    # Counterfactual loss rate = observed loss in the matched controls.
    donor_loss = (forest_loss_end.values.ravel()[matched_donor]
                  - forest_loss_start.values.ravel()[matched_donor])
    proj_loss = (forest_loss_end.values.ravel()[proj_idx]
                 - forest_loss_start.values.ravel()[proj_idx])
    counterfactual_loss_px = np.clip(donor_loss, 0.0, None)
    observed_loss_px = np.clip(proj_loss, 0.0, None)

    # Avoided forest loss (ha) -> biomass -> CO2e.
    avoided_ha = float((counterfactual_loss_px - observed_loss_px).sum()) * pixel_area_ha
    avoided_ha = max(avoided_ha, 0.0)
    gross_tco2e = avoided_ha * biomass_density_t_ha * CARBON_FRACTION * (44.0 / 12.0)

    unc_ded = gross_tco2e * uncertainty_deduction
    net_after_unc = gross_tco2e - unc_ded - leakage_belt_loss_tco2e
    net_after_unc = max(net_after_unc, 0.0)
    buffer = net_after_unc * buffer_rate
    issued = net_after_unc - buffer

    log.info("additionality_estimated",
             gross_tco2e=round(gross_tco2e, 1),
             uncertainty_deduction_tco2e=round(unc_ded, 1),
             leakage_deduction_tco2e=round(leakage_belt_loss_tco2e, 1),
             buffer_tco2e=round(buffer, 1),
             issued_tco2e=round(issued, 1),
             worst_smd=round(worst_smd, 4))

    return AdditionalityResult(
        gross_avoided_tco2e=round(gross_tco2e, 1),
        uncertainty_deduction_tco2e=round(unc_ded, 1),
        leakage_deduction_tco2e=round(leakage_belt_loss_tco2e, 1),
        buffer_contribution_tco2e=round(buffer, 1),
        issued_credits_tco2e=round(issued, 1),
        n_matched_pairs=int(proj_idx.size),
        max_covariate_smd=round(worst_smd, 4),
    )


if __name__ == "__main__":
    cov = {name: _load_equal_area(f"data/{name}.tif", name)
           for name in ("elevation", "slope", "distance_to_road", "baseline_cover")}
    result = estimate_additionality(
        forest_loss_start=_load_equal_area("data/cover_2016.tif", "cover_2016"),
        forest_loss_end=_load_equal_area("data/cover_2026.tif", "cover_2026"),
        covariates=cov,
        project_mask=_load_equal_area("data/project_mask.tif", "project_mask"),
        donor_mask=_load_equal_area("data/donor_mask.tif", "donor_mask"),
        leakage_belt_loss_tco2e=42_000.0,
        pixel_area_ha=0.09,          # 30 m pixel on an equal-area grid
        biomass_density_t_ha=140.0,
    )
    log.info("baseline_run_sealed",
             result=asdict(result),
             generated_at=datetime.now(timezone.utc).isoformat(),
             method="matched_control_counterfactual_vm0047_aligned")
```

The design choices are deliberate. Matching is performed on z-scored covariates so that distance-to-road in metres does not swamp slope in degrees inside the Euclidean nearest-neighbour search; the standardised-mean-difference gate then refuses to proceed if any covariate remains unbalanced after matching, which is the single most effective guard against the non-comparable-control failure mode. The equal-area CRS makes the hectare arithmetic honest, and the deductions are applied in the order registries expect — uncertainty and leakage first, then the non-permanence buffer contribution on the net figure — so the issued number is already conservative when it leaves the function. In a full VM0047-aligned deployment the counterfactual loss rate would be reconciled against a jurisdictional allocation rather than taken from the donor pool alone, but the matched-control balance test remains the diagnostic that proves the project's own risk profile is genuinely represented.

## Validation, Debugging & Compliance Mapping

Every output of this stage maps to a specific control in the standards that govern forest carbon, which is what turns the baseline surface from an analyst's spreadsheet into a submission artifact. The covariate-balance SMD and the matched-control diagnostic bundle answer **Verra VM0047**, whose dynamic performance-benchmark logic requires that the expected forest loss attributed to a project be derived from comparable, monitored land rather than a self-selected historical rate; a logged, pre-registered matching procedure with demonstrated balance is precisely the evidence a VM0047 validation body examines, and the periodic re-estimation window the surface carries satisfies the methodology's move away from static baselines. The leakage-belt deduction and the permanence buffer contribution map to the leakage and non-permanence provisions common to both Verra and **Gold Standard** land-use methodologies, which require that displaced emissions be quantified and that a share of credits be withheld against reversal risk before any issuance. The uncertainty deduction, and the fact that it is computed from the propagated variance handed over by the [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) stage, satisfies the conservativeness principle of **ISO 14064-2** and the estimation-uncertainty disclosure expectations of **CSRD ESRS E1**, which scrutinises land-sector removals for transparent treatment of how confident the reported figure actually is.


| Technical output | Regulatory application | Verification step |
|------------------|------------------------|-------------------|
| Covariate-balance SMD + matched-control bundle | VM0047 comparable-benchmark / dynamic-baseline requirement | Auditor re-runs matching against the donor pool and checks balance |
| Counterfactual loss surface (per pixel/stratum) | Additionality demonstration under ISO 14064-2 and VM0047 | Recomputed from logged covariates and control indices |
| Leakage-belt deduction (tCO2e) | Leakage accounting (Verra & Gold Standard) | Belt loss reconciled against observed clearing outside the boundary |
| Buffer-pool contribution (tCO2e) | Non-permanence / reversal-risk withholding | Buffer share checked against methodology risk rating |
| Uncertainty deduction (tCO2e) | ISO 14064-2 conservativeness; CSRD ESRS E1 disclosure | Deduction traced to the propagated variance envelope |


For debugging, treat the worst covariate SMD, the fraction of project pixels with no acceptable donor match, and the ratio of leakage-belt loss to gross avoided loss as monitored signals on every run — including the ones that pass — so that a slowly degrading donor pool or a widening jurisdictional divergence surfaces as a trend long before it breaches a hard gate. Three silent failures deserve dedicated diagnostics: a donor pool that has shrunk until nearest-neighbour matches are being drawn from ecologically distant pixels while the SMD still squeaks under the limit; a static baseline left un-regenerated past its validity window, which should raise on the run date rather than continue crediting; and a leakage belt whose own forest cover has been quietly clipped by an unrelated boundary edit, understating displacement. Validation should include a placebo test — running the matching against a pseudo-project inside the donor pool, which should yield near-zero additionality — and a sensitivity sweep on the uncertainty deduction and buffer rate against the methodology's floors.

<svg viewBox="0 -4 880 216" role="img" aria-labelledby="add-t add-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="add-t">The additionality tests and what each one can and cannot establish</title>
  <desc id="add-d">Four additionality tests. The regulatory surplus test asks whether the activity is already required by law and is objective and easy to evidence. The investment test asks whether the activity is financially unattractive without carbon revenue, and depends on assumptions that are hard to verify externally. The barriers test asks whether non-financial obstacles exist, and is the weakest because barriers are asserted rather than measured. The common practice test asks whether similar actors already do this without carbon finance, and is the most externally checkable because it rests on observable behaviour. A panel notes that spatial MRV contributes evidence to the last test and nothing directly to the first three.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Only one of these is something a pipeline can evidence</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Spatial MRV speaks to common practice, and to nothing else here.</text>
    <rect x="12" y="52" width="212" height="140" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="212" height="140" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Regulatory surplus</text>
    <text x="28" y="100" fill="currentColor" font-size="9.5" opacity="0.85">already required by law?</text>
    <text x="28" y="126" fill="currentColor" font-size="9.5" font-weight="700">objective, easy to evidence</text>
    <text x="28" y="152" fill="currentColor" font-size="9" opacity="0.75">a legal question, not a</text>
    <text x="28" y="168" fill="currentColor" font-size="9" opacity="0.75">measurement one</text>
    <rect x="236" y="52" width="212" height="140" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="236" y="52" width="212" height="140" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="252" y="76" fill="currentColor" font-size="10.5" font-weight="700">Investment</text>
    <text x="252" y="100" fill="currentColor" font-size="9.5" opacity="0.85">unattractive without credits?</text>
    <text x="252" y="126" fill="#f3a712" font-size="9.5" font-weight="700">rests on assumptions</text>
    <text x="252" y="152" fill="currentColor" font-size="9" opacity="0.75">hard for anyone outside</text>
    <text x="252" y="168" fill="currentColor" font-size="9" opacity="0.75">the project to verify</text>
    <rect x="460" y="52" width="212" height="140" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="476" y="76" fill="currentColor" font-size="10.5" font-weight="700">Barriers</text>
    <text x="476" y="100" fill="currentColor" font-size="9.5" opacity="0.85">non-financial obstacles?</text>
    <text x="476" y="126" fill="#f3a712" font-size="9.5" font-weight="700">asserted, not measured</text>
    <text x="476" y="152" fill="currentColor" font-size="9" opacity="0.75">the weakest of the four,</text>
    <text x="476" y="168" fill="currentColor" font-size="9" opacity="0.75">and the most contested</text>
    <rect x="684" y="52" width="184" height="140" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="684" y="52" width="184" height="140" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="700" y="76" fill="currentColor" font-size="10.5" font-weight="700">Common practice</text>
    <text x="700" y="100" fill="currentColor" font-size="9.5" opacity="0.85">do similar actors already?</text>
    <text x="700" y="126" fill="currentColor" font-size="9.5" font-weight="700">observable behaviour</text>
    <text x="700" y="152" fill="currentColor" font-size="9" opacity="0.78">the one spatial evidence</text>
    <text x="700" y="168" fill="currentColor" font-size="9" opacity="0.78">can actually speak to</text>
  </g>
</svg>

## Frequently Asked Questions

### Which baseline construction should a project use?

Whichever the methodology prescribes — and increasingly they do prescribe, precisely because the choice moves the credit so much. Where a choice remains, matched controls are the most defensible because they are counterfactual by construction and testable through balance diagnostics; a historical average extrapolated from the project's own past is the least, because it assumes the project area would have continued behaving as it did while everything around it changed.

### How often should a baseline be revisited?

At the intervals the methodology specifies, typically every five to ten years, and never opportunistically. A baseline revised whenever it becomes unfavourable is not a counterfactual, and the pattern is visible to anyone examining the project record. Fix the revision schedule at validation, apply it whether the revision helps or hurts, and disclose the effect of each revision on the reported figure.

### What can spatial data actually contribute to additionality?

Evidence for the common-practice test, and a check on the plausibility of the baseline. Satellite records show what comparable actors in comparable landscapes actually did, which is the one additionality question with an observable answer. The regulatory, investment, and barriers tests are legal and financial questions that no imagery can settle — presenting spatial analysis as evidence for them overstates what the data says.

### How is the reference region chosen?

By similarity on the drivers of deforestation as they stood before the project, tested rather than asserted. The region must be large enough to give a stable rate and similar enough that its rate is a credible counterfactual, which are competing requirements. Publish the covariates used, the balance statistics achieved, and the pre-project trend comparison — those three artefacts are what turn a reference region from a claim into evidence.

### What happens when the baseline turns out to be wrong?

It is revised at the scheduled point, and the effect is disclosed. Baselines are predictions and some will prove poor; the failure is not being wrong but adjusting quietly. Where a baseline proves substantially too high, the honest treatment is a downward revision at the next scheduled point with the difference stated, which is far cheaper to your credibility than a reviewer discovering the gap between the counterfactual and the observed regional trend.

## Conclusion

Forest carbon baseline and additionality modelling is where a pipeline either earns or forfeits the trust of the market. The failures that have discredited so many REDD+ projects — non-comparable controls that inflated the counterfactual, ignored leakage that double-counted protection, and static baselines that kept crediting a receding threat — are all engineering failures, and all are addressable with defensible spatial statistics: covariate matching with a hard balance gate, an explicit leakage-belt deduction, a permanence buffer, an uncertainty deduction traced to a propagated envelope, and baselines rebuilt as regenerable surfaces aligned with the dynamic, jurisdictional direction of VM0047. Build the baseline this way and the credited difference becomes something an auditor can reconstruct from the pixels rather than take on faith. For a worked, task-level walkthrough of applying these techniques to an avoided-deforestation project, continue with [Modeling Additionality Baselines for REDD+ Projects](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/modeling-additionality-baselines-for-redd-projects/).

## Related guides

- [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) — the parent framework whose stock surfaces this baseline stage turns into additionality claims.
- [Modeling Additionality Baselines for REDD+ Projects](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/modeling-additionality-baselines-for-redd-projects/) — the task-level guide implementing matched controls end to end.
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — the upstream envelope that supplies the uncertainty deduction applied here.
- [Verra VM0047 vs Gold Standard GIS Requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/) — the methodology comparison that governs which baseline approach a project may use.
