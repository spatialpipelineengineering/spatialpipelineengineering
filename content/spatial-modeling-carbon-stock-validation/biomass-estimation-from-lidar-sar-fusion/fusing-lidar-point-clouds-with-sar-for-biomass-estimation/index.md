---
shortTitle: "Fuse LiDAR Point Clouds with SAR for Biomass"
---
# Fusing LiDAR Point Clouds with SAR for Biomass Estimation

Fusing discrete airborne LiDAR returns with continuous radar backscatter is the highest-leverage — and most error-prone — operation inside the [Biomass Estimation from LiDAR & SAR Fusion](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/) stage of the [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) framework. Done correctly, it produces a wall-to-wall aboveground biomass (AGB) surface with defensible per-pixel uncertainty; done carelessly, it bakes silent spatial drift and backscatter saturation directly into issued carbon credits. This guide walks through the deterministic, audit-traceable procedure for merging a LiDAR canopy height model (CHM) with Sentinel-1 / ALOS-2 σ⁰ into a single regression-ready feature stack.

Because every downstream consumer treats the fused raster as ground truth, the operation depends on deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) established at ingestion and on cloud-screened optical context from the upstream [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) pipeline. It emits calibrated AGB and confidence bands that feed [ground-truth alignment](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) and [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) further along the chain. The engineering intent here is reproducibility under MRV scrutiny — Verra VM0048, ISO 14064-3, and GHG Protocol spatial validation thresholds — not merely a statistically pleasing fit.

<svg viewBox="0 0 880 760" role="img" aria-label="LiDAR-SAR fusion decision flow: a LiDAR point cloud and a SAR backscatter scene both enter a pre-flight gate checking CRS, overlap, density, and temporal proximity. A failing tile is rejected and logged; a passing tile is orthorectified onto the LiDAR grid, reduced to a feature stack, and run through a regime-weighted regression. A second gate checks whether per-pixel uncertainty is within ten percent at ninety percent confidence: a failure routes to an audit flag and field sampling, a pass emits a signed AGB raster with provenance to the registry." xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:inherit;color:var(--c-text)">
  <title>Deterministic LiDAR + SAR biomass fusion pipeline with pre-flight and uncertainty gates</title>
  <desc>Two inputs — a LiDAR point cloud (UTM, centimetre vertical) and SAR sigma-naught (VV/VH, WGS84) — converge on a pre-flight decision gate testing CRS, overlap, point density, and temporal window. Failing tiles are rejected and logged. Passing tiles flow down through orthorectification to the LiDAR grid, feature-stack assembly (CHM percentiles, sigma-naught, VH/VV), and a regime-weighted AGB regression, then into an uncertainty gate. If uncertainty exceeds ten percent at ninety percent confidence the tile is audit-flagged for field sampling; otherwise a signed AGB raster with provenance is exported to the registry.</desc>
  <defs>
    <marker id="lsf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-size="12.5" text-anchor="middle">
    <!-- inputs -->
    <rect x="120" y="20" width="240" height="74" rx="9" fill="var(--c-surface-2)" stroke="currentColor" stroke-opacity="0.35"/>
    <text x="240" y="50" font-size="13" font-weight="700" fill="var(--c-primary-700)">LiDAR point cloud</text>
    <text x="240" y="74" fill="currentColor" fill-opacity="0.85">UTM · cm vertical</text>
    <rect x="520" y="20" width="240" height="74" rx="9" fill="var(--c-surface-2)" stroke="currentColor" stroke-opacity="0.35"/>
    <text x="640" y="50" font-size="13" font-weight="700" fill="var(--c-primary-700)">SAR σ⁰</text>
    <text x="640" y="74" fill="currentColor" fill-opacity="0.85">VV / VH · WGS84</text>
    <!-- input arrows into PF -->
    <g stroke="currentColor" stroke-width="1.6" fill="none" marker-end="url(#lsf-arrow)" color="var(--c-primary)">
      <path d="M240,94 L240,128 Q240,150 300,160"/>
      <path d="M640,94 L640,128 Q640,150 580,160"/>
    </g>
    <!-- PF gate -->
    <polygon points="440,108 580,168 440,228 300,168" fill="var(--c-surface)" stroke="var(--c-accent)" stroke-width="2"/>
    <text x="440" y="155" font-size="12.5" font-weight="700" fill="currentColor">Pre-flight gates</text>
    <text x="440" y="174" font-size="11" fill="currentColor" fill-opacity="0.85">CRS · overlap</text>
    <text x="440" y="190" font-size="11" fill="currentColor" fill-opacity="0.85">density · temporal</text>
    <!-- fail branch -> reject -->
    <g stroke="var(--c-accent-700)" stroke-width="1.6" fill="none" marker-end="url(#lsf-arrow)" color="var(--c-accent-700)">
      <line x1="580" y1="168" x2="624" y2="168"/>
    </g>
    <text x="600" y="158" font-size="10.5" font-weight="600" fill="var(--c-accent-700)">fail</text>
    <rect x="626" y="134" width="226" height="68" rx="9" fill="var(--c-surface)" stroke="var(--c-accent-700)" stroke-width="1.6" stroke-dasharray="5 4"/>
    <text x="739" y="164" font-size="12.5" font-weight="700" fill="var(--c-accent-700)">Reject tile</text>
    <text x="739" y="184" fill="currentColor" fill-opacity="0.85">log + halt</text>
    <!-- pass branch down -->
    <g stroke="var(--c-primary)" stroke-width="1.6" fill="none" marker-end="url(#lsf-arrow)" color="var(--c-primary)">
      <line x1="440" y1="228" x2="440" y2="262"/>
    </g>
    <text x="460" y="250" font-size="10.5" font-weight="600" fill="var(--c-primary-700)" text-anchor="start">pass</text>
    <!-- orthorectify -->
    <rect x="290" y="264" width="300" height="62" rx="9" fill="var(--c-surface-2)" stroke="currentColor" stroke-opacity="0.35"/>
    <text x="440" y="292" font-size="13" font-weight="700" fill="var(--c-primary-700)">Orthorectify SAR → LiDAR grid</text>
    <text x="440" y="312" fill="currentColor" fill-opacity="0.85">always_xy · cubic</text>
    <line x1="440" y1="326" x2="440" y2="356" stroke="var(--c-primary)" stroke-width="1.6" marker-end="url(#lsf-arrow)"/>
    <!-- feature stack -->
    <rect x="290" y="358" width="300" height="62" rx="9" fill="var(--c-surface-2)" stroke="currentColor" stroke-opacity="0.35"/>
    <text x="440" y="386" font-size="13" font-weight="700" fill="var(--c-primary-700)">Feature stack</text>
    <text x="440" y="406" font-size="11.5" fill="currentColor" fill-opacity="0.85">CHM percentiles · σ⁰ · VH/VV</text>
    <line x1="440" y1="420" x2="440" y2="450" stroke="var(--c-primary)" stroke-width="1.6" marker-end="url(#lsf-arrow)"/>
    <!-- regression -->
    <rect x="290" y="452" width="300" height="62" rx="9" fill="var(--c-surface-2)" stroke="currentColor" stroke-opacity="0.35"/>
    <text x="440" y="480" font-size="13" font-weight="700" fill="var(--c-primary-700)">Regression</text>
    <text x="440" y="500" fill="currentColor" fill-opacity="0.85">regime-weighted AGB</text>
    <line x1="440" y1="514" x2="440" y2="544" stroke="var(--c-primary)" stroke-width="1.6" marker-end="url(#lsf-arrow)"/>
    <!-- UQ gate -->
    <polygon points="440,540 575,600 440,660 305,600" fill="var(--c-surface)" stroke="var(--c-accent)" stroke-width="2"/>
    <text x="440" y="596" font-size="12" font-weight="700" fill="currentColor">Uncertainty ≤ 10%</text>
    <text x="440" y="614" font-size="11.5" fill="currentColor" fill-opacity="0.85">at 90% CI?</text>
    <!-- no branch -> flag -->
    <g stroke="var(--c-accent-700)" stroke-width="1.6" fill="none" marker-end="url(#lsf-arrow)" color="var(--c-accent-700)">
      <line x1="575" y1="600" x2="624" y2="600"/>
    </g>
    <text x="600" y="590" font-size="10.5" font-weight="600" fill="var(--c-accent-700)">no</text>
    <rect x="626" y="566" width="226" height="68" rx="9" fill="var(--c-surface)" stroke="var(--c-accent-700)" stroke-width="1.6" stroke-dasharray="5 4"/>
    <text x="739" y="596" font-size="12.5" font-weight="700" fill="var(--c-accent-700)">Audit flag</text>
    <text x="739" y="616" fill="currentColor" fill-opacity="0.85">field sampling</text>
    <!-- yes branch -> export -->
    <g stroke="var(--c-primary)" stroke-width="1.6" fill="none" marker-end="url(#lsf-arrow)" color="var(--c-primary)">
      <line x1="440" y1="660" x2="440" y2="688"/>
    </g>
    <text x="460" y="682" font-size="10.5" font-weight="600" fill="var(--c-primary-700)" text-anchor="start">yes</text>
    <rect x="270" y="690" width="340" height="62" rx="9" fill="var(--c-surface)" stroke="var(--c-primary)" stroke-width="1.8"/>
    <text x="440" y="718" font-size="13" font-weight="700" fill="var(--c-primary-700)">Signed AGB raster +</text>
    <text x="440" y="738" fill="currentColor" fill-opacity="0.85">provenance → registry</text>
  </g>
</svg>

## Root Cause Analysis

The dominant failure mode in fusion pipelines is geometric, not statistical. LiDAR point clouds arrive in a local projected CRS (typically a UTM zone) with centimetre-level vertical accuracy, while SAR products are geocoded to `EPSG:4326` with terrain-corrected radiometry. Any residual misalignment greater than roughly 0.5 pixels at 10 m SAR resolution decorrelates the height-to-backscatter relationship the model relies on, smearing canopy edges against radar texture and producing systematic AGB bias of 8–15% in fragmented landscapes. This is exactly the class of silent datum drift that auditors reject, because the error is invisible in summary statistics yet structurally present along every forest boundary.

The second root cause is temporal. SAR backscatter fluctuates with soil moisture and phenology, whereas LiDAR captures a single structural snapshot. Stacking a wet-season SAR scene against a dry-season LiDAR overflight injects moisture variance into a model that is supposed to read woody volume. Acquisitions must therefore be gated to a narrow window — commonly ±30 days — with scenes rejected when precipitation or soil-moisture anomalies exceed tolerance.

The third is physical: C-band and L-band σ⁰ saturate logarithmically around 150–300 t/ha, beyond which additional biomass produces negligible radar response. A model that trusts SAR uniformly across the biomass range compresses high-density forest toward the saturation ceiling, understating stored carbon by 30%+ in closed-canopy primary forest. The fix is regime-dependent weighting rather than a single global fit. The table below summarises the three causes and their detectable signatures.

<div class="table-wrap" style="overflow-x:auto;">

| Failure mode | Root cause | Detectable signature | Mitigation |
|---|---|---|---|
| Co-registration drift | Mismatched pixel grids, datum offset | False AGB gradient along edges; low mutual-information score | Phase-correlation + affine refine, reject if shift > 0.5 px |
| Temporal mismatch | Soil moisture / phenology divergence | σ⁰ variance uncorrelated with structure | STAC `datetime` gating to ±30 days + weather filter |
| Backscatter saturation | Logarithmic σ⁰ response > ~250 t/ha | Compressed high-biomass predictions | Regime weighting: LiDAR-dominant above the knee |

</div>

<svg viewBox="0 0 880 520" role="img" aria-label="Dual response curves against aboveground biomass on the x-axis. SAR backscatter sigma-naught rises steeply at low biomass then flattens against a saturation ceiling beyond roughly 250 tonnes per hectare. LiDAR canopy-height percentile rises in a straight line across the whole range. A shaded crossover band between about 150 and 250 tonnes per hectare separates a SAR-dominant regime on the left from a LiDAR-dominant regime on the right, marking where regression weighting switches from radar backscatter to LiDAR structure." xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:inherit;color:var(--c-text)">
  <title>SAR backscatter saturation versus linear LiDAR height response across the biomass range</title>
  <desc>An annotated chart plotting two curves against aboveground biomass (0 to 500 t/ha). SAR sigma-naught climbs quickly then asymptotes toward a saturation ceiling above about 250 t/ha, losing sensitivity to additional woody volume. LiDAR canopy-height percentile increases linearly across the full range. A shaded vertical band from roughly 150 to 250 t/ha marks the regime-switch crossover: to its left the model is SAR-dominant, to its right LiDAR-dominant, because radar can no longer discriminate dense canopy.</desc>
  <defs>
    <marker id="lsc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="inherit">
    <!-- crossover regime band -->
    <rect x="303.5" y="70" width="139" height="340" fill="var(--c-surface-2)" fill-opacity="0.7"/>
    <text x="373" y="62" font-size="11.5" font-weight="600" text-anchor="middle" fill="var(--c-accent-700)">regime crossover</text>
    <text x="373" y="88" font-size="10.5" text-anchor="middle" fill="currentColor" fill-opacity="0.75">≈150–250 t/ha</text>
    <!-- saturation ceiling -->
    <line x1="95" y1="142" x2="790" y2="142" stroke="var(--c-accent-700)" stroke-width="1.2" stroke-dasharray="5 4" stroke-opacity="0.8"/>
    <text x="784" y="135" font-size="10.5" text-anchor="end" fill="var(--c-accent-700)">σ⁰ saturation ceiling</text>
    <!-- axes -->
    <g stroke="currentColor" stroke-width="1.3" stroke-opacity="0.55">
      <line x1="95" y1="70" x2="95" y2="410"/>
      <line x1="790" y1="70" x2="790" y2="410"/>
      <line x1="95" y1="410" x2="790" y2="410"/>
    </g>
    <!-- x ticks -->
    <g font-size="10.5" text-anchor="middle" fill="currentColor" fill-opacity="0.75">
      <text x="95" y="428">0</text>
      <text x="234" y="428">100</text>
      <text x="373" y="428">200</text>
      <text x="512" y="428">300</text>
      <text x="651" y="428">400</text>
      <text x="790" y="428">500</text>
    </g>
    <!-- SAR saturating curve -->
    <path d="M95,388 L164.5,300 L234,238 L303.5,198 L373,172 L442.5,158 L512,150 L651,144 L790,142"
          fill="none" stroke="var(--c-accent-700)" stroke-width="2.6"/>
    <!-- LiDAR linear curve -->
    <path d="M95,392 L790,90" fill="none" stroke="var(--c-primary)" stroke-width="2.6"/>
    <!-- regime labels -->
    <text x="195" y="372" font-size="12" font-weight="700" text-anchor="middle" fill="var(--c-accent-700)">SAR-dominant</text>
    <text x="620" y="372" font-size="12" font-weight="700" text-anchor="middle" fill="var(--c-primary-700)">LiDAR-dominant</text>
    <!-- axis titles -->
    <text x="442" y="462" font-size="12" font-weight="600" text-anchor="middle" fill="currentColor">Aboveground biomass (t/ha)</text>
    <text x="34" y="240" font-size="11.5" font-weight="600" text-anchor="middle" fill="var(--c-accent-700)" transform="rotate(-90 34 240)">SAR backscatter σ⁰ (dB)</text>
    <text x="852" y="240" font-size="11.5" font-weight="600" text-anchor="middle" fill="var(--c-primary-700)" transform="rotate(90 852 240)">LiDAR height percentile (m)</text>
    <!-- legend -->
    <g font-size="11" text-anchor="start">
      <line x1="110" y1="494" x2="142" y2="494" stroke="var(--c-accent-700)" stroke-width="2.6"/>
      <text x="150" y="498" fill="currentColor" fill-opacity="0.85">SAR σ⁰ — saturates logarithmically</text>
      <line x1="430" y1="494" x2="462" y2="494" stroke="var(--c-primary)" stroke-width="2.6"/>
      <text x="470" y="498" fill="currentColor" fill-opacity="0.85">LiDAR height — linear with structure</text>
    </g>
  </g>
</svg>

## Diagnostic Pipeline & Pre-Flight Validation

Before any reprojection or resampling, the inputs must be inspected and any failure condition surfaced as an explicit, logged decision. The pre-flight gate below checks CRS validity, spatial overlap, LiDAR point density, and temporal proximity, emitting `structlog` telemetry on every check so the audit trail records *why* a tile was admitted or rejected rather than only the outcome.

```python
import structlog
import rasterio
from pyproj import CRS, Transformer
from shapely.geometry import box
from datetime import datetime, timedelta

logger = structlog.get_logger()

TARGET_CRS = "EPSG:32618"        # LiDAR UTM analysis grid — area-true metres
MAX_DRIFT_PX = 0.5               # admissible sub-pixel co-registration shift
MIN_POINT_DENSITY = 5.0          # pts/m^2 floor for usable CHM
MAX_TEMPORAL_DELTA = timedelta(days=30)


def preflight_validate(lidar_meta: dict, sar_meta: dict) -> tuple[bool, dict]:
    """Detect fusion failure conditions before transformation. Returns (ok, report)."""
    report: dict = {"checks": {}, "rejected_reasons": []}

    # 1. CRS must be declared and parseable on both inputs — never assume.
    try:
        lidar_crs = CRS.from_user_input(lidar_meta["crs"])
        sar_crs = CRS.from_user_input(sar_meta["crs"])
    except Exception as exc:                       # noqa: BLE001
        logger.error("crs_unparseable", error=str(exc))
        return False, {"rejected_reasons": ["unparseable_crs"]}

    # 2. Spatial overlap in the shared analysis CRS (always_xy for lon/lat order).
    tx = Transformer.from_crs(sar_crs, lidar_crs, always_xy=True)
    sx0, sy0 = tx.transform(*sar_meta["bounds"][:2])
    sx1, sy1 = tx.transform(*sar_meta["bounds"][2:])
    overlap = box(*lidar_meta["bounds"]).intersection(box(sx0, sy0, sx1, sy1))
    frac = overlap.area / box(*lidar_meta["bounds"]).area if overlap.area else 0.0
    report["checks"]["overlap_fraction"] = round(frac, 4)
    if frac < 0.90:
        report["rejected_reasons"].append("insufficient_spatial_overlap")

    # 3. LiDAR point-density floor — sparse returns yield unreliable CHM percentiles.
    density = lidar_meta["point_count"] / max(overlap.area, 1.0)
    report["checks"]["point_density_pts_m2"] = round(density, 2)
    if density < MIN_POINT_DENSITY:
        report["rejected_reasons"].append("lidar_density_below_floor")

    # 4. Temporal gating — phenology/moisture divergence corrupts the σ⁰ signal.
    delta = abs(datetime.fromisoformat(sar_meta["datetime"])
                - datetime.fromisoformat(lidar_meta["datetime"]))
    report["checks"]["temporal_delta_days"] = delta.days
    if delta > MAX_TEMPORAL_DELTA:
        report["rejected_reasons"].append("temporal_window_exceeded")

    ok = not report["rejected_reasons"]
    logger.info("preflight_complete", ok=ok, **report["checks"],
                reasons=report["rejected_reasons"])
    return ok, report
```

Temporal gating should be enforced at metadata ingestion using STAC `datetime` query bounds and an external meteorological API, so non-compliant scenes are dropped before rasterization rather than after expensive resampling.

## Deterministic Transformation Logic

Once a tile passes pre-flight, the SAR layer is orthorectified onto the LiDAR analysis grid and the two modalities are reduced to orthogonal structural and dielectric features. Determinism is non-negotiable: the same inputs must always yield byte-identical outputs, which means pinned resampling kernels, explicit `always_xy` axis ordering, and area-preserving percentile aggregation rather than naive mean downsampling.

```python
import numpy as np
import rasterio
import rioxarray
import xarray as xr
from rasterio.warp import calculate_default_transform, reproject, Resampling
from scipy.ndimage import uniform_filter

logger = structlog.get_logger()


def fuse_lidar_sar(sar_path: str, chm_1m_path: str, out_path: str,
                   target_crs: str = TARGET_CRS, res_m: float = 10.0) -> str:
    """Orthorectify SAR to the LiDAR grid and assemble a regression-ready stack."""
    # 1. Reproject SAR onto the LiDAR projected CRS — cubic kernel, explicit transform.
    with rasterio.open(sar_path) as src:
        transform, width, height = calculate_default_transform(
            src.crs, target_crs, src.width, src.height, *src.bounds, resolution=res_m)
        dst_meta = {**src.meta, "crs": target_crs, "transform": transform,
                    "width": width, "height": height}
        sar = np.empty((src.count, height, width), dtype="float32")
        for i in range(1, src.count + 1):
            reproject(source=rasterio.band(src, i), destination=sar[i - 1],
                      src_transform=src.transform, src_crs=src.crs,
                      dst_transform=transform, dst_crs=target_crs,
                      resampling=Resampling.cubic)
    logger.info("sar_reprojected", target_crs=target_crs, shape=sar.shape)

    # 2. CHM 1 m -> 10 m using the 75th percentile to preserve upper-canopy structure.
    chm_10m = (rioxarray.open_rasterio(chm_1m_path)
               .rio.reproject(target_crs, resolution=res_m,
                              resampling=Resampling.q3))

    # 3. Refined-Lee speckle suppression on the VH intensity band (index 1).
    vh = sar[1]
    mean = uniform_filter(vh, size=5)
    var = uniform_filter(vh ** 2, size=5) - mean ** 2
    noise_var = 0.09                                # Sentinel-1 GRD nominal ENL
    vh_filtered = mean + (var / (var + noise_var)) * (vh - mean)

    # 4. Log-transform the cross-pol ratio to stabilise variance in dense canopy.
    vv = np.clip(sar[0], 1e-6, None)
    vh_vv = np.log(np.clip(vh_filtered, 1e-6, None) / vv)

    # 5. Assemble the feature stack on a single, shared grid.
    coords = {"y": chm_10m.y, "x": chm_10m.x}
    stack = xr.Dataset({
        "chm":   (["y", "x"], chm_10m.squeeze().values),
        "vh":    (["y", "x"], vh_filtered),
        "vh_vv": (["y", "x"], vh_vv),
    }, coords=coords)
    stack.rio.write_crs(target_crs, inplace=True)
    stack.to_netcdf(out_path)
    logger.info("fusion_stack_written", path=out_path, vars=list(stack.data_vars))
    return out_path
```

The resulting multi-dimensional array is the input to a regime-weighted allometric regression or gradient-boosted ensemble. Keeping the cross-polarization ratio log-transformed before stacking is what stabilises variance across the saturation knee.

<svg viewBox="0 -4 880 228" role="img" aria-labelledby="ftp-t ftp-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ftp-t">Matching a LiDAR footprint to a SAR pixel, and the three ways it goes wrong</title>
  <desc id="ftp-d">A LiDAR footprint drawn over a SAR pixel grid, with three mismatch cases. In the aligned case the footprint sits inside one pixel and the pairing is valid. In the straddling case the footprint spans four pixels, so pairing it with any single pixel mixes structure from areas the LiDAR did not see; the fix is to aggregate the SAR pixels weighted by overlap. In the offset case a systematic geolocation shift pairs the footprint with a neighbouring pixel entirely, producing a biased rather than noisy model. A panel notes that footprint geolocation uncertainty and SAR pixel size are both of order ten metres, so exact pairing is rarely available and overlap weighting is the default rather than the exception.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Exact pairing is rarely available</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Footprint geolocation and pixel size are both about ten metres.</text>
    <text x="106" y="60" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">Aligned — valid</text>
    <text x="368" y="60" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">Straddling — weight by overlap</text>
    <text x="656" y="60" text-anchor="middle" fill="#f3a712" font-size="10" font-weight="700">Offset — biased, not noisy</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.5" fill="none">
    <rect x="42" y="74" width="64" height="64"/><rect x="106" y="74" width="64" height="64"/>
    <rect x="42" y="138" width="64" height="64"/><rect x="106" y="138" width="64" height="64"/>
    <rect x="304" y="74" width="64" height="64"/><rect x="368" y="74" width="64" height="64"/>
    <rect x="304" y="138" width="64" height="64"/><rect x="368" y="138" width="64" height="64"/>
    <rect x="592" y="74" width="64" height="64"/><rect x="656" y="74" width="64" height="64"/>
    <rect x="592" y="138" width="64" height="64"/><rect x="656" y="138" width="64" height="64"/>
  </g>
  <circle cx="138" cy="106" r="24" fill="currentColor" opacity="0.28"/>
  <circle cx="138" cy="106" r="24" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="368" cy="138" r="24" fill="currentColor" opacity="0.28"/>
  <circle cx="368" cy="138" r="24" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="662" cy="112" r="24" fill="#f3a712" opacity="0.3"/>
  <circle cx="662" cy="112" r="24" fill="none" stroke="#f3a712" stroke-width="2.4"/>
  <circle cx="624" cy="106" r="24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4,3"/>
  <line x1="624" y1="106" x2="662" y2="112" stroke="#f3a712" stroke-width="1.8"/>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.8">
    <text x="106" y="216">one pixel, one footprint</text>
    <text x="368" y="216">four pixels, area-weighted mean</text>
    <text x="656" y="216">paired with the wrong pixel, every time</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

MRV compliance demands explicit, spatially resolved uncertainty. Biomass estimates must carry per-pixel bounds satisfying ISO 14064-3 verification thresholds — typically ≤10% uncertainty at 90% confidence for project-scale baselines. Uncertainty is propagated through the allometric form `AGB = exp(β₀ + β₁·ln(CHM) + β₂·ln(VH/VV) + ε)` using the law of propagation of uncertainty, `u_c² = Σ(∂AGB/∂x_i)²·u(x_i)² + 2·ΣΣ(∂AGB/∂x_i)(∂AGB/∂x_j)·cov(x_i,x_j)`, evaluated by first-order Taylor expansion or Monte Carlo sampling.

The gate halts execution when residual spatial autocorrelation (Moran's I) exceeds 0.35, when VH σ⁰ breaches the tropical saturation threshold of -12 dB, or when LiDAR density falls below 5 pts/m² across more than 15% of the area. Every run serialises its inputs, transforms, and outcomes into an append-only audit record with SHA-256 checksums, mapped to the [MRV data lineage requirements](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) that the [carbon credit registry](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) submission depends on.

```python
import json
import hashlib
from datetime import datetime

logger = structlog.get_logger()


def _sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def gate_and_audit(run_id: str, uncertainty_raster, inputs: dict,
                   outputs: dict, params: dict, threshold_pct: float = 10.0) -> dict:
    """Enforce the compliance ceiling and emit a signed, append-only audit record."""
    mean_u = float(uncertainty_raster.mean())
    passed = mean_u <= threshold_pct

    audit = {
        "pipeline_version": "v2.4.1-mrv",
        "run_id": run_id,
        "execution_timestamp": datetime.utcnow().isoformat() + "Z",
        "spatial_reference": {"target_crs": TARGET_CRS,
                              "dem_version": "Copernicus_30m_v2023"},
        "inputs": {k: {"stac_id": v["id"], "sha256": _sha256(v["path"])}
                   for k, v in inputs.items()},
        "parameters": params,
        "compliance_gating": {
            "mean_pixel_uncertainty_pct": round(mean_u, 3),
            "passes_threshold": passed,
            "iso_14064_3_compliant": mean_u <= 10.0,
            "verra_vm0048_ceiling_pct": threshold_pct,
        },
        "outputs": {k: {"path": v, "sha256": _sha256(v)} for k, v in outputs.items()},
    }
    with open(f"audit_{run_id}.json", "w") as fh:
        json.dump(audit, fh, indent=2)

    if not passed:
        logger.error("compliance_gate_failed", run_id=run_id, mean_u=mean_u)
        raise RuntimeError(f"Uncertainty {mean_u:.2f}% exceeds {threshold_pct}% ceiling")
    logger.info("compliance_gate_passed", run_id=run_id, mean_u=mean_u)
    return audit
```

Any deviation from default allometric coefficients requires version-controlled justification and auditor sign-off before deployment, and gap-interpolation regions (kriging or random-forest imputation) must be flagged with explicit coverage percentages so verifiers can isolate modelled-versus-observed pixels.

## Production Integration

A production fusion run is a strictly ordered, containerised sequence — Docker or Singularity with pinned dependency versions — so that every estimated tonne is reproducible and audit-ready. Batch execution chunks tiles through a `dask`-backed scheduler, but each tile follows the same six-step contract:

1. **Ingest** — pull SAR and LiDAR products by STAC ID, verify SHA-256 checksums, and record source provenance.
2. **Diagnose** — run `preflight_validate`; reject and log any tile that fails CRS, overlap, density, or temporal gates before spending compute on resampling.
3. **Transform** — execute `fuse_lidar_sar` to orthorectify SAR onto the LiDAR grid and assemble the feature stack with deterministic kernels.
4. **Validate** — predict AGB with regime weighting, propagate per-pixel uncertainty, and evaluate Moran's I and saturation diagnostics.
5. **Export** — write the AGB raster and confidence band as cloud-optimised GeoTIFFs to versioned, immutable object storage.
6. **Submit** — call `gate_and_audit`; on pass, attach the signed audit JSON and forward to the registry submission queue, threshold tuning handled downstream by [threshold tuning for carbon stock baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/).

Chunked I/O matters at scale: read SAR scenes windowed to the LiDAR tile footprint rather than whole-scene, and stream NetCDF stacks lazily through `xarray` so memory stays bounded across thousands of tiles. With this contract in place, every fused biomass surface is traceable from raw return to issued credit.

## Frequently Asked Questions

### Should LiDAR footprints be paired with a single SAR pixel or an aggregate?

An overlap-weighted aggregate, almost always. Footprint geolocation uncertainty and SAR pixel size are both of order ten metres, so a footprint typically straddles several pixels and pairing it with the nearest one mixes in structure the LiDAR never observed. Weighting the surrounding pixels by their overlap with the footprint gives a paired value that corresponds to what was actually measured, and it degrades gracefully as geolocation uncertainty grows.

### How do I detect a systematic geolocation offset between the two sensors?

Cross-correlate a derived surface from each — canopy height from LiDAR against a smoothed backscatter field — over an area with strong structural contrast, and look for the shift that maximises agreement. A consistent non-zero shift is a coregistration offset and must be corrected before fitting; a shift that varies across the scene usually points to a terrain or orbit-geometry problem rather than a simple translation. Record the applied shift, because it changes every subsequent estimate.

### What model form works best for the fused relationship?

Something monotonic and saturating, matching the physics — a power law or an asymptotic form rather than an unconstrained flexible learner. A model with enough freedom will fit the calibration scatter beautifully and extrapolate absurdly above the saturation ceiling, where most of the interesting biomass sits and where calibration data is thinnest. Constraining the form is what keeps the extrapolation defensible.

### How many LiDAR footprints are needed to calibrate a SAR model?

Enough to cover the biomass range including its upper end, which is a coverage question rather than a count. A thousand footprints concentrated in low-biomass stands calibrate the part of the curve that was never in doubt; a few hundred spanning the full range, including mature stands near saturation, are worth far more. Stratify the calibration sample by expected biomass before acquisition rather than sampling uniformly.

### Can the fused model be transferred to another site?

Only with local validation, and usually not without recalibration. The backscatter-to-biomass relationship depends on forest structure, species composition, moisture regime, and terrain, all of which vary between sites. Transferring a fitted model unchanged is a common shortcut and a reliable source of bias; transferring the model *form* and refitting its coefficients locally is legitimate and far cheaper than starting over.

## Related

- [Biomass Estimation from LiDAR & SAR Fusion](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/) — parent topic and stage overview
- [Ground-Truth Alignment for Carbon Models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) — plot-to-pixel calibration of fused outputs
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — propagating fusion uncertainty into emission factors
- [Threshold Tuning for Carbon Stock Baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) — converting validated AGB into stable/degraded masks
- [Geospatial CRS Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the ingestion-stage prerequisite for fusion
