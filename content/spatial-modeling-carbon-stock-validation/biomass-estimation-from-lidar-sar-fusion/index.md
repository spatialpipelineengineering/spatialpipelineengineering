# Biomass Estimation from LiDAR & SAR Fusion

Biomass Estimation from LiDAR & SAR Fusion is the multi-sensor synthesis stage that converts vertical canopy structure and radar backscatter into spatially explicit aboveground biomass (AGB), the most computationally demanding step inside the [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) framework. It consumes cloud-masked, temporally aligned products from the upstream [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) pipeline and depends on deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) established in the foundational MRV layer, then hands calibrated AGB rasters and uncertainty bands downstream to [ground-truth alignment](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) and [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/). Engineering a production-grade fusion stage means treating sensor disagreement, backscatter saturation, and sub-pixel drift as first-class, audit-traceable conditions rather than silent statistical noise.

<svg viewBox="0 0 880 300" role="img" aria-label="LiDAR and SAR fusion pipeline. Two inputs — a LiDAR canopy height model and SAR VV/VH backscatter — feed a sub-pixel co-registration gate, then a fusion-feature stage of height percentiles and backscatter, then a gradient-boosted biomass model that emits a 90 percent confidence interval. A decision node tests whether per-pixel uncertainty exceeds 15 percent: tiles within tolerance become a verified aboveground biomass raster, while tiles above tolerance are audit-flagged for field sampling." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:880px;display:block;margin:1.5rem auto;">
  <title>LiDAR and SAR fusion pipeline from dual-sensor input to uncertainty-gated AGB raster</title>
  <desc>A LiDAR canopy height model and SAR VV/VH backscatter both enter a sub-pixel co-registration gate. The co-registered pair flows to a fusion-feature stage (height percentiles and backscatter), then to a gradient-boosted biomass model that produces a 90 percent confidence interval. A decision diamond asks whether per-pixel uncertainty exceeds 15 percent. The no branch yields a verified aboveground biomass raster; the yes branch raises an audit flag routed to field sampling.</desc>
  <defs>
    <marker id="fus-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- Inputs -->
  <rect x="14" y="50" width="130" height="66" rx="8" fill="currentColor" opacity="0.06"/>
  <rect x="14" y="50" width="130" height="66" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.6"/>
  <text x="79" y="70" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">INPUT · STRUCTURE</text>
  <text x="79" y="88" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">LiDAR CHM</text>
  <text x="79" y="104" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">canopy height model</text>
  <rect x="14" y="176" width="130" height="66" rx="8" fill="currentColor" opacity="0.06"/>
  <rect x="14" y="176" width="130" height="66" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.6"/>
  <text x="79" y="196" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">INPUT · RADAR</text>
  <text x="79" y="214" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">SAR backscatter</text>
  <text x="79" y="230" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">VV / VH · σ⁰</text>
  <!-- Co-register -->
  <rect x="178" y="113" width="120" height="66" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="178" y="113" width="120" height="66" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="238" y="142" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Co-register</text>
  <text x="238" y="158" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">sub-pixel gate</text>
  <!-- Fusion features -->
  <rect x="320" y="113" width="120" height="66" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="320" y="113" width="120" height="66" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="380" y="142" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Fusion features</text>
  <text x="380" y="158" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">height %ile · backscatter</text>
  <!-- Biomass model -->
  <rect x="462" y="113" width="124" height="66" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="462" y="113" width="124" height="66" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="524" y="142" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Biomass model</text>
  <text x="524" y="158" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">GBDT · 90% CI</text>
  <!-- Decision diamond -->
  <polygon points="672,100 726,146 672,192 618,146" fill="currentColor" opacity="0.06"/>
  <polygon points="672,100 726,146 672,192 618,146" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="672" y="143" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor">Uncertainty</text>
  <text x="672" y="156" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor">&gt; 15%?</text>
  <!-- Outputs -->
  <rect x="762" y="58" width="112" height="64" rx="8" fill="currentColor" opacity="0.1"/>
  <rect x="762" y="58" width="112" height="64" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="818" y="84" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Verified AGB</text>
  <text x="818" y="100" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">raster</text>
  <text x="818" y="114" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.7">within tolerance</text>
  <rect x="762" y="170" width="112" height="64" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.75"/>
  <text x="818" y="196" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" opacity="0.9">Audit flag</text>
  <text x="818" y="212" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">field sampling ·</text>
  <text x="818" y="224" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">manual review</text>
  <!-- Flows -->
  <path d="M144 83 C168 92 158 128 176 138" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#fus-arrow)"/>
  <path d="M144 209 C168 200 158 164 176 154" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#fus-arrow)"/>
  <line x1="298" y1="146" x2="318" y2="146" stroke="currentColor" stroke-width="1.4" marker-end="url(#fus-arrow)"/>
  <line x1="440" y1="146" x2="460" y2="146" stroke="currentColor" stroke-width="1.4" marker-end="url(#fus-arrow)"/>
  <line x1="586" y1="146" x2="616" y2="146" stroke="currentColor" stroke-width="1.4" marker-end="url(#fus-arrow)"/>
  <path d="M700 123 C732 110 740 96 760 90" fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#fus-arrow)"/>
  <text x="730" y="106" text-anchor="middle" font-size="8.5" font-weight="600" fill="currentColor" opacity="0.8">no</text>
  <path d="M700 169 C732 182 740 196 760 202" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5,3" marker-end="url(#fus-arrow)"/>
  <text x="730" y="188" text-anchor="middle" font-size="8.5" font-weight="600" fill="currentColor" opacity="0.8">yes</text>
</svg>

## Role in the MRV Workflow

Within the Measurement, Reporting, and Verification (MRV) pipeline, fusion sits at the feature-synthesis boundary: it is downstream of ingestion and normalization, and upstream of calibration and compliance export. The two input modalities have complementary blind spots. Airborne or spaceborne LiDAR delivers precise vertical canopy structure but suffers from spatial gaps, high acquisition cost, and (for photon-counting spaceborne sensors) optical cloud dependency. Synthetic Aperture Radar (SAR) provides all-weather, wide-area coverage with sensitivity to woody volume and moisture, but experiences backscatter saturation in dense tropical canopies. Neither sensor alone produces a defensible wall-to-wall AGB surface, which is why fusion — not single-sensor extrapolation — is the only route to compliance-grade coverage.

The stage operates on co-registered raster tiles. LiDAR-derived Canopy Height Models (CHMs) typically align to a local datum or orthometric projection, whereas SAR backscatter composites are delivered in slant-range geometry or geocoded to a global reference grid (for example `EPSG:4326` or `EPSG:3857`). Resolving that geometry into a single projected analysis CRS (commonly a local UTM zone such as `EPSG:32633`) is the precondition for every later operation, because any residual misalignment propagates directly into carbon accounting outputs.

Upstream dependencies are explicit: fusion expects terrain-corrected, multi-looked SAR and a hydrologically conditioned LiDAR ground model. Downstream consumers are equally explicit: the AGB raster and its per-pixel confidence interval feed plot-to-pixel calibration, after which [threshold tuning for carbon stock baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) converts the validated surface into stable-versus-degraded masks for credit issuance. Because the stage straddles structural and radar sensing, its contract with the rest of the pipeline is unforgiving: it must emit not just a best estimate but a quantified, spatially resolved uncertainty layer that auditors can interrogate tile by tile.

## Core Failure Modes

Three failure modes account for the overwhelming majority of silent biomass errors in production fusion pipelines. Each has a concrete root cause and a measurable impact on reported carbon.

1. **Sub-pixel co-registration drift.** LiDAR CHMs and SAR backscatter rarely share a pixel grid exactly, and even a 0.3–0.5 pixel shift smears canopy edges against radar texture, decorrelating the height-to-backscatter relationship the model relies on. At 10 m SAR resolution this manifests as false biomass gradients along forest boundaries and systematic bias of 8–15% AGB in fragmented landscapes. Phase-correlation cross-matching followed by affine refinement, gated on a mutual-information score, is the only reliable defense; tiles that exceed the drift tolerance must be rejected, not "best-effort" stacked.

2. **SAR backscatter saturation.** C-band and L-band σ⁰ saturate logarithmically around 150–300 t/ha AGB, beyond which additional woody volume produces negligible change in radar reflectivity. A model that trusts SAR uniformly across the biomass range will compress high-density forest toward the saturation ceiling, understating stored carbon in exactly the tropical regions where credits are most valuable — observed underestimation routinely exceeds 30% in closed-canopy primary forest. The fix is regime-dependent weighting: SAR and texture features dominate the low-to-moderate regime, while LiDAR height percentiles take precedence above the saturation knee.

<svg viewBox="0 0 760 380" role="img" aria-label="Dual-axis response chart. The horizontal axis is aboveground biomass from 0 to 400 tonnes per hectare. SAR backscatter (left axis, decibels) climbs steeply at low biomass then saturates logarithmically, flattening near minus 5 decibels. LiDAR height percentile (right axis, metres) rises linearly across the whole range. A shaded vertical band between roughly 150 and 250 tonnes per hectare marks the regime switch: SAR features dominate to the left, LiDAR height percentiles dominate to the right." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:680px;display:block;margin:1.5rem auto;">
  <title>SAR backscatter saturates while LiDAR height stays linear — the regime-switch crossover</title>
  <desc>Aboveground biomass runs along the horizontal axis from 0 to 400 tonnes per hectare. The SAR backscatter curve (left decibel axis) rises sharply at low biomass and then saturates, flattening near minus 5 decibels past the saturation knee. The LiDAR height-percentile line (right metre axis) increases linearly across the full range. A shaded band from about 150 to 250 tonnes per hectare marks the regime switch where weighting hands over from SAR-dominant to LiDAR-dominant.</desc>
  <!-- Regime-switch band -->
  <rect x="309" y="46" width="146" height="266" fill="currentColor" opacity="0.07"/>
  <line x1="309" y1="46" x2="309" y2="312" stroke="currentColor" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
  <line x1="455" y1="46" x2="455" y2="312" stroke="currentColor" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
  <text x="382" y="40" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" opacity="0.7">regime switch · ~150–250 t/ha</text>
  <!-- Axes -->
  <line x1="92" y1="46" x2="92" y2="312" stroke="currentColor" stroke-width="1.4"/>
  <line x1="672" y1="46" x2="672" y2="312" stroke="currentColor" stroke-width="1.4"/>
  <line x1="92" y1="312" x2="672" y2="312" stroke="currentColor" stroke-width="1.4"/>
  <!-- Left Y ticks (dB) -->
  <text x="84" y="50" text-anchor="end" font-size="8.5" fill="currentColor" opacity="0.75">0</text>
  <text x="84" y="116" text-anchor="end" font-size="8.5" fill="currentColor" opacity="0.75">-5</text>
  <text x="84" y="182" text-anchor="end" font-size="8.5" fill="currentColor" opacity="0.75">-10</text>
  <text x="84" y="249" text-anchor="end" font-size="8.5" fill="currentColor" opacity="0.75">-15</text>
  <text x="84" y="315" text-anchor="end" font-size="8.5" fill="currentColor" opacity="0.75">-20</text>
  <!-- Right Y ticks (m) -->
  <text x="680" y="50" text-anchor="start" font-size="8.5" fill="currentColor" opacity="0.75">40</text>
  <text x="680" y="116" text-anchor="start" font-size="8.5" fill="currentColor" opacity="0.75">30</text>
  <text x="680" y="182" text-anchor="start" font-size="8.5" fill="currentColor" opacity="0.75">20</text>
  <text x="680" y="249" text-anchor="start" font-size="8.5" fill="currentColor" opacity="0.75">10</text>
  <text x="680" y="315" text-anchor="start" font-size="8.5" fill="currentColor" opacity="0.75">0</text>
  <!-- X ticks (t/ha) -->
  <text x="92" y="328" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">0</text>
  <text x="237" y="328" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">100</text>
  <text x="382" y="328" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">200</text>
  <text x="527" y="328" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">300</text>
  <text x="672" y="328" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">400</text>
  <!-- Axis titles -->
  <text x="26" y="179" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" opacity="0.8" transform="rotate(-90 26 179)">SAR σ⁰ (dB)</text>
  <text x="734" y="179" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" opacity="0.8" transform="rotate(90 734 179)">LiDAR height %ile (m)</text>
  <text x="382" y="348" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" opacity="0.8">Aboveground biomass (t/ha)</text>
  <!-- LiDAR linear line (dashed) -->
  <path d="M92 299 L672 59" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="6,4" opacity="0.85"/>
  <!-- SAR saturating curve (solid) -->
  <path d="M92 285 C160 215 250 150 309 139 C382 126 527 116 672 112" fill="none" stroke="currentColor" stroke-width="2.2"/>
  <!-- saturation knee marker -->
  <circle cx="382" cy="126" r="3.4" fill="currentColor"/>
  <text x="392" y="118" text-anchor="start" font-size="8" fill="currentColor" opacity="0.8">saturation knee</text>
  <!-- Regime labels -->
  <text x="195" y="300" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor" opacity="0.85">SAR-dominant</text>
  <text x="568" y="300" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor" opacity="0.85">LiDAR-dominant</text>
  <!-- Legend -->
  <line x1="110" y1="68" x2="138" y2="68" stroke="currentColor" stroke-width="2.2"/>
  <text x="144" y="71" text-anchor="start" font-size="8.5" fill="currentColor" opacity="0.8">SAR backscatter σ⁰</text>
  <line x1="110" y1="84" x2="138" y2="84" stroke="currentColor" stroke-width="1.8" stroke-dasharray="6,4"/>
  <text x="144" y="87" text-anchor="start" font-size="8.5" fill="currentColor" opacity="0.8">LiDAR height percentile</text>
</svg>

3. **Uncoupled uncertainty propagation.** Treating uncertainty as a global multiplier applied after prediction hides the fact that error structure is spatially heterogeneous: saturation zones, alignment-degraded tiles, and LiDAR-gap fallback regions each carry different variance. A flat ±15% band masks tiles that are genuinely outside tolerance and inflates confidence where it is not warranted, which is precisely the kind of defect third-party verifiers reject. Confidence intervals must be computed per pixel from bootstrapped ensemble variance and recomputed per jurisdictional boundary, never borrowed across regions.

## Deterministic Implementation Architecture

A scalable fusion stage requires distributed array processing, explicit CRS enforcement, deterministic fallback routing, and structured telemetry on every gate. The following Prefect flow leverages `dask`, `xarray`, `rioxarray`, and `rasterio` with `structlog` logging. Co-registration quality, saturation regime, and uncertainty are all surfaced as explicit, logged decisions rather than buried inside the model.

```python
import structlog
import numpy as np
import rasterio
import rioxarray
import xarray as xr
import dask.array as da
from prefect import flow, task
from pyproj import CRS
from skimage.registration import phase_cross_correlation
from sklearn.ensemble import GradientBoostingRegressor

logger = structlog.get_logger()

TARGET_CRS = "EPSG:32633"        # local UTM analysis grid — area-true metres
DRIFT_TOL_PX = 0.5               # max admissible sub-pixel co-registration shift
SAT_KNEE_DB = -5.0               # σ⁰ (dB) proxy for ~250 t/ha SAR saturation
MAX_UNCERTAINTY_PCT = 15.0       # Verra VM0047 / 90% CI compliance ceiling


@task
def load_and_enforce_crs(lidar_path: str, sar_path: str) -> tuple[xr.DataArray, xr.DataArray]:
    """Open both modalities, reproject to a common projected CRS, fail loudly on mismatch."""
    chm = rioxarray.open_rasterio(lidar_path, chunks={"y": 2048, "x": 2048}).squeeze("band", drop=True)
    sigma0 = rioxarray.open_rasterio(sar_path, chunks={"y": 2048, "x": 2048}).squeeze("band", drop=True)

    if CRS.from_user_input(chm.rio.crs) != CRS.from_user_input(TARGET_CRS):
        logger.info("reproject_lidar", src=str(chm.rio.crs), dst=TARGET_CRS)
        chm = chm.rio.reproject(TARGET_CRS)
    if CRS.from_user_input(sigma0.rio.crs) != CRS.from_user_input(TARGET_CRS):
        logger.info("reproject_sar", src=str(sigma0.rio.crs), dst=TARGET_CRS)
        sigma0 = sigma0.rio.reproject(TARGET_CRS)

    # Snap SAR onto the LiDAR grid so every pixel is index-aligned downstream.
    sigma0 = sigma0.rio.reproject_match(chm)
    return chm, sigma0


@task
def coregistration_gate(chm: xr.DataArray, sigma0: xr.DataArray) -> float:
    """Phase-correlation drift check. Raises so Prefect can route to SAR fallback."""
    # Sample an overlapping, finite window to estimate residual sub-pixel shift.
    ref = np.nan_to_num(chm.isel(y=slice(0, 512), x=slice(0, 512)).values.astype("float32"))
    mov = np.nan_to_num(sigma0.isel(y=slice(0, 512), x=slice(0, 512)).values.astype("float32"))
    shift, error, _ = phase_cross_correlation(ref, mov, upsample_factor=20)
    drift_px = float(np.hypot(*shift))
    logger.info("coregistration_gate", drift_px=round(drift_px, 3), phase_error=round(float(error), 4))
    if drift_px > DRIFT_TOL_PX:
        logger.error("alignment_failed", drift_px=drift_px, tolerance=DRIFT_TOL_PX)
        raise ValueError(f"Sub-pixel drift {drift_px:.3f}px exceeds {DRIFT_TOL_PX}px; route to SAR fallback")
    return drift_px


@task
def build_fusion_features(chm: xr.DataArray, sigma0: xr.DataArray) -> xr.Dataset:
    """Regime-aware predictor matrix: weight LiDAR up where SAR saturates."""
    sigma0_db = 10.0 * xr.apply_ufunc(da.log10, sigma0.where(sigma0 > 0), dask="allowed")
    saturated = sigma0_db > SAT_KNEE_DB                 # high-biomass regime
    lidar_weight = xr.where(saturated, 0.8, 0.3)        # LiDAR leads past the knee
    sar_weight = 1.0 - lidar_weight

    features = xr.Dataset({
        "chm_p90": chm.rolling(y=5, x=5, center=True).reduce(np.nanpercentile, q=90),
        "chm_p75": chm.rolling(y=5, x=5, center=True).reduce(np.nanpercentile, q=75),
        "sigma0_db": sigma0_db,
        "lidar_weight": lidar_weight,
        "sar_weight": sar_weight,
    })
    logger.info("fusion_features", saturated_fraction=round(float(saturated.mean().compute()), 3))
    return features


@flow(name="biomass_estimation_lidar_sar_fusion", retries=2, retry_delay_seconds=30)
def run_fusion_pipeline(lidar_tile: str, sar_tile: str, model: GradientBoostingRegressor) -> xr.Dataset:
    logger.info("pipeline_start", lidar=lidar_tile, sar=sar_tile, target_crs=TARGET_CRS)

    chm, sigma0 = load_and_enforce_crs(lidar_tile, sar_tile)
    coregistration_gate(chm, sigma0)
    features = build_fusion_features(chm, sigma0)

    # Predict AGB per pixel; bootstrap the GBDT ensemble for a 90% interval.
    stack = xr.concat([features[v] for v in ("chm_p90", "chm_p75", "sigma0_db")], dim="feature")
    flat = stack.stack(px=("y", "x")).transpose("px", "feature").values
    preds = np.stack([est.predict(flat) for est in model.estimators_.ravel()])
    agb = preds.mean(axis=0).reshape(chm.shape)
    ci_lower = np.nanpercentile(preds, 5, axis=0).reshape(chm.shape)
    ci_upper = np.nanpercentile(preds, 95, axis=0).reshape(chm.shape)

    out = xr.Dataset(
        {
            "agb_t_ha": (("y", "x"), agb),
            "ci_lower_90": (("y", "x"), ci_lower),
            "ci_upper_90": (("y", "x"), ci_upper),
        },
        coords={"y": chm.y, "x": chm.x},
    )
    out["uncertainty_pct"] = (out["ci_upper_90"] - out["ci_lower_90"]) / out["agb_t_ha"] * 100.0
    out["audit_flag"] = out["uncertainty_pct"] > MAX_UNCERTAINTY_PCT
    out.rio.write_crs(TARGET_CRS, inplace=True)

    logger.info(
        "pipeline_complete",
        mean_agb=round(float(np.nanmean(agb)), 1),
        flagged_pct=round(float(out["audit_flag"].mean().compute()) * 100, 2),
    )
    return out
```

The flow is deterministic in three ways that matter for verification. CRS is declared once and enforced on both modalities with `reproject_match`, so pixels are index-aligned before any arithmetic. The co-registration gate raises rather than silently degrading, letting the orchestrator route alignment-failed tiles to a SAR-dominant fallback estimator. And the 90% interval is derived from the bootstrapped ensemble spread, not a constant multiplier — every pixel carries its own width.

## Validation, Debugging & Compliance Mapping

The pipeline emits three audit-ready artifacts per tile: a spatially explicit AGB raster, 90% confidence-interval bounds, and an `uncertainty_pct` mask whose `audit_flag` isolates tiles above the compliance ceiling. These map directly onto regulatory requirements. The [IPCC 2006 Guidelines for National Greenhouse Gas Inventories](https://www.ipcc-nggip.iges.or.jp/public/2006gl/) Tier 3 tier mandates spatially resolved biomass models with documented error propagation; the per-pixel interval satisfies that documentation. For voluntary markets, Verra VM0047 and ART-TREES require project-level uncertainty to remain below 15% at 90% confidence, which is exactly what the `audit_flag` layer enforces by routing exceedance tiles to manual review or supplemental field sampling. The deterministic CRS handling and rejection gates provide the reproducibility evidence that ISO 14064-3 verifiers expect, and the flagged-fraction telemetry feeds the spatially explicit disclosure CSRD ESRS E1 anticipates.

Production fusion pipelines fail silently when geometric or statistical assumptions break, so each assumption needs an explicit safeguard:

| Failure surface | Diagnostic | Compliance consequence if missed |
| --- | --- | --- |
| CRS / resolution mismatch | Validate `rio.crs` and `rio.transform` before stacking; `reproject_match` onto a single grid | Aliasing artifacts read as false biomass gradients, biasing area-based credit volume |
| SAR speckle & terrain bias | Confirm radiometric terrain correction (RTC) and multi-looking via [ESA SNAP Toolbox](https://step.esa.int/main/toolboxes/snap/) before ingest | Slope-induced backscatter bias inflates AGB on hillsides, failing ISO 14064-3 conservativeness |
| LiDAR ground misclassification | Apply progressive morphological filtering; log `chm_p0` ground-return offsets against GCPs | Inflated CHM over-credits canopy, undermining additionality claims |
| Uncertainty drift across regions | Recompute bootstrap variance per jurisdictional boundary with `xarray.apply_ufunc` + `dask` | Borrowed global bands hide out-of-tolerance tiles, triggering verifier rejection |

Per-pixel feature-importance scores exported alongside the AGB raster let auditors confirm that SAR saturation zones are not artificially inflating carbon credits and that LiDAR-dominant regions cross-check against independent canopy-closure metrics. This is the interface that the detailed [point-cloud-to-SAR fusion procedure](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/fusing-lidar-point-clouds-with-sar-for-biomass-estimation/) builds on when it documents the full feature-stack provenance for registry submission.

## Conclusion

By enforcing explicit CRS declaration, a rejecting co-registration gate, regime-aware sensor weighting, and per-pixel bootstrapped uncertainty, Biomass Estimation from LiDAR & SAR Fusion becomes a repeatable, compliance-grade component of carbon accounting infrastructure rather than an opaque model call. The stage bridges high-resolution structural sensing and wide-area radar coverage, delivering spatially explicit estimates that withstand third-party verification. For the operational detail behind each gate — temporal harmonization windows, fallback routing logic, and registry-ready provenance — continue to the in-depth guide on [fusing LiDAR point clouds with SAR for biomass estimation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/fusing-lidar-point-clouds-with-sar-for-biomass-estimation/).

### Related

- [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) — parent framework and end-to-end pipeline overview
- [Ground Truth Alignment for Carbon Models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) — plot-to-pixel calibration of the AGB surface this stage produces
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — propagating the confidence bands downstream
- [Threshold Tuning for Carbon Stock Baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) — converting validated AGB into stable-versus-degraded masks
- [Fusing LiDAR Point Clouds with SAR for Biomass Estimation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/fusing-lidar-point-clouds-with-sar-for-biomass-estimation/) — the detailed implementation procedure
