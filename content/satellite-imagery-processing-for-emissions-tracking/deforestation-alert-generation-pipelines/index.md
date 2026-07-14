---
shortTitle: "Deforestation Alert Generation Pipelines for MRV"
---
# Deforestation Alert Generation Pipelines

Deforestation alert generation pipelines are the change-detection subsystem that converts a stream of preprocessed satellite observations into geolocated, confidence-scored disturbance signals — the operational heartbeat of land-use change monitoring within the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack. They consume spectrally clean reflectance composites and emit alert polygons that feed carbon accounting, supply-chain due diligence, and regulatory submission directly, so every design decision here propagates into a reportable number. The engineering problem is not simply detecting canopy loss; it is detecting it reproducibly across heterogeneous biomes, sensor constellations, and temporal baselines while attaching the uncertainty and provenance that third-party verification demands.

Because this component sits downstream of acquisition and masking, it inherits the quality of everything before it. Alerts are only as trustworthy as the [Sentinel-2 & Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) that gate the input reflectance and the [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) routines that build the baselines a new observation is measured against. Get those two upstream stages right and an alert reflects genuine phenological or anthropogenic disturbance; get them wrong and the pipeline manufactures false positives that no downstream threshold can recover from.

<svg viewBox="0 0 980 360" role="img" aria-labelledby="alert-t alert-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="alert-t">Deforestation alert generation pipeline</title>
  <desc id="alert-d">Masked reflectance composites and a rolling temporal baseline both feed a change-detection engine offering a CUSUM control chart, Bayesian change-point detection or a random-forest classifier. Its output passes a threshold and uncertainty gate that scores alert confidence between zero and one. High-confidence alerts fork to an automated registry and supplier workflow; low-confidence alerts route to a manual review queue. Every alert also writes to a lineage ledger recording acquisition timestamps, spectral confidence and the WGS84 datum.</desc>
  <defs>
    <marker id="alert-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- inputs -->
    <g fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.9">
      <rect x="18" y="40" width="176" height="72" rx="9"/>
      <rect x="18" y="150" width="176" height="72" rx="9"/>
    </g>
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="106" y="70">Masked reflectance</text>
      <text x="106" y="86">composites</text>
      <text x="106" y="180">Rolling temporal</text>
      <text x="106" y="196">baseline</text>
    </g>
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="106" y="103">cloud + shadow gated</text>
      <text x="106" y="213">per-pixel reference</text>
    </g>
    <!-- engine -->
    <rect x="258" y="68" width="190" height="124" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="353" y="92" fill="currentColor" font-size="11.5" font-weight="600">Change-detection</text>
    <text x="353" y="108" fill="currentColor" font-size="11.5" font-weight="600">engine</text>
    <line x1="276" y1="118" x2="430" y2="118" stroke="currentColor" stroke-width="1" opacity="0.4"/>
    <g fill="currentColor" font-size="10" opacity="0.82">
      <text x="353" y="138">CUSUM control chart</text>
      <text x="353" y="156">Bayesian change-point</text>
      <text x="353" y="174">RF / GBM classifier</text>
    </g>
    <!-- gate -->
    <rect x="512" y="84" width="176" height="92" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="600" y="112" fill="currentColor" font-size="11.5" font-weight="600">Threshold +</text>
    <text x="600" y="130" fill="currentColor" font-size="11.5" font-weight="600">uncertainty gate</text>
    <text x="600" y="152" fill="currentColor" font-size="9.5" opacity="0.72">alert_confidence 0&#8211;1</text>
    <!-- high confidence (accent) -->
    <rect x="752" y="28" width="210" height="80" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <text x="857" y="56" fill="#f3a712" font-size="11.5" font-weight="700">High confidence</text>
    <text x="857" y="76" fill="currentColor" font-size="10">&#8594; automated registry /</text>
    <text x="857" y="92" fill="currentColor" font-size="10">supplier workflow</text>
    <!-- low confidence -->
    <rect x="752" y="176" width="210" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="857" y="204" fill="currentColor" font-size="11.5" font-weight="600">Low confidence</text>
    <text x="857" y="224" fill="currentColor" font-size="10" opacity="0.85">&#8594; manual review</text>
    <text x="857" y="240" fill="currentColor" font-size="10" opacity="0.85">queue</text>
    <!-- lineage ledger -->
    <rect x="258" y="262" width="430" height="82" rx="9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="473" y="290" fill="#f3a712" font-size="11.5" font-weight="700">Alert lineage ledger</text>
    <text x="473" y="312" fill="currentColor" font-size="10" opacity="0.82">acquisition timestamps &#183; spectral</text>
    <text x="473" y="330" fill="currentColor" font-size="10" opacity="0.82">confidence &#183; datum (EPSG:4326)</text>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#alert-arrow)" opacity="0.9">
    <path d="M194 76 C 228 76, 226 112, 256 116"/>
    <path d="M194 186 C 228 186, 226 150, 256 146"/>
    <line x1="448" y1="130" x2="510" y2="130"/>
    <path d="M688 112 C 720 112, 720 70, 750 68"/>
    <path d="M688 150 C 720 150, 720 214, 750 216"/>
    <path d="M600 176 C 600 220, 540 232, 500 260"/>
  </g>
</svg>

## Role in the MRV Workflow

Alert generation executes during the Change Detection stage, positioned strictly between spectral preprocessing and carbon attribution. Its upstream dependency is a stack of analysis-ready surface reflectance: cloud- and shadow-masked Sentinel-2 L2A and Landsat 8/9 Collection 2 tiles, each carrying an explicit, machine-readable coordinate reference system tag and acquisition timestamp. Its downstream consumers are unforgiving — alert polygons are intersected with project boundaries in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) layer to estimate avoided or lost tonnage, and they are submitted as activity data into the wider [MRV architecture and carbon accounting fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack, where they must survive an auditor's scrutiny.

That position imposes two hard requirements. First, spatial fidelity: an alert is a claim about a specific parcel of land, so the geometry must be honest. The pipeline depends on deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) at ingestion — a sub-pixel misregistration between baseline and current acquisition is indistinguishable from real canopy change along tile edges, and a datum mismatch silently relocates the alert onto the wrong landholder. Second, evidentiary completeness: each alert must arrive with its acquisition dates, the spectral indices and thresholds that triggered it, and a confidence score, because those attributes flow directly into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/). An alert without that record is unverifiable even when it is correct.

The stage is also where alerts acquire spatial structure. Production systems operate on a tile-based, distributed execution model: imagery is partitioned into windows aligned to a reference grid (MGRS, UTM, or an H3 hexagonal scheme) so that processing parallelizes cleanly and caches deterministically. Tiling is what lets a single pipeline cover a continental basin, but it also introduces the boundary effects that the failure modes below address. Throughput at that scale leans on [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) so that out-of-core array operations never block on a single oversized scene.

## Core Failure Modes

Three failure modes dominate production alert pipelines. Each has a distinct technical root cause and a measurable impact on carbon accounting integrity.

1. **Spatial drift at tile boundaries.** Subtle misalignment between acquisition dates — from orthorectification residuals, inconsistent DEM corrections, or mixed UTM zones across an MGRS seam — produces phantom change signals along tile edges. The mechanism is geometric: when a baseline pixel and a current pixel sample different ground areas, their spectral difference is non-zero even when the canopy is untouched. A 0.5-pixel registration error on a 10 m Sentinel-2 grid is enough to line a basin's tile boundaries with false alerts. The fix is strict CRS enforcement, affine-transform validation, and resampling both epochs onto a single canonical pixel grid before any differencing occurs.

2. **Cloud and shadow leakage misread as clearing.** Optical change detection is fundamentally constrained by atmospheric interference. A partially masked cloud edge, an undilated shadow, or seasonal aerosol haze depresses near-infrared reflectance in exactly the way a canopy loss does, so leaked contamination surfaces as a spurious deforestation front. In humid tropics, where persistent cloud already starves the time series of valid observations, a single leaked acquisition can dominate a short baseline window and drive the false-positive rate into double digits. Mitigation is to treat masking as a hard gate — apply dilated, probabilistic cloud/shadow masks per biome and reject any composite whose valid-pixel fraction falls below a configured floor rather than silently differencing through the gaps.

3. **Static thresholds across mismatched phenology.** A fixed spectral threshold cannot generalize across biomes. A NDVI drop of `0.2` may indicate selective logging in the Amazon yet represent normal dry-season senescence in the Cerrado or harvest in a managed plantation. Hard-coding one threshold guarantees over-detection in seasonally dynamic landscapes and under-detection in dense evergreen canopy where genuine clearing produces a smaller relative drop. The consequence is systematic, directional bias in activity data — precisely the misstatement an auditor probes. The resolution is to calibrate thresholds per biome and sensor against historical ground-truth (GLAD alerts, PRODES) and to expose them as validated configuration rather than literals buried in code.

## Deterministic Implementation Architecture

Scaling alert generation across continental basins requires asynchronous orchestration and out-of-core array computing. The pattern below uses Prefect for declarative workflow management and retry semantics, Dask for chunked raster operations that never load a full tile into memory, and `structlog` for audit-ready telemetry. Every task either emits an aligned, validated artifact or raises — there is no silent pass-through, because an alert produced from unvalidated input is worse than no alert at all.

```python
import json
import structlog
import numpy as np
import xarray as xr
import rasterio as rio
import rioxarray  # noqa: F401  (registers the .rio accessor)
from prefect import flow, task
from pyproj import CRS

logger = structlog.get_logger()

TARGET_CRS = CRS.from_epsg(4326)   # registry submission datum (WGS84)
NDVI_DROP_THRESHOLD = -0.15        # biome-calibrated; injected, never hard-coded inline
MIN_VALID_FRACTION = 0.70          # reject composites with too few clear pixels


@task(retries=2, retry_delay_seconds=30)
def load_and_align_tile(tile_path: str, target_crs: CRS = TARGET_CRS) -> xr.DataArray:
    """Load a masked reflectance tile and force it onto the canonical grid."""
    with rio.open(tile_path) as src:
        if src.crs is None:
            raise ValueError(f"{tile_path} missing CRS metadata — rejecting for compliance.")
        src_crs = CRS.from_user_input(src.crs)

    data = rioxarray.open_rasterio(tile_path, chunks={"x": 1024, "y": 1024})
    if src_crs != target_crs:
        logger.info("reprojecting_tile", path=tile_path,
                    source_crs=src_crs.to_string(), target_crs=target_crs.to_string())
        data = data.rio.reproject(target_crs)

    logger.info("tile_loaded", path=tile_path, shape=list(data.shape),
                crs=target_crs.to_string())
    return data.rename({"band": "band_id"})


@task
def gate_valid_fraction(mask: xr.DataArray, tile_path: str) -> None:
    """Hard gate: refuse to difference through excessive cloud/shadow loss."""
    valid_fraction = float(mask.mean().compute())
    if valid_fraction < MIN_VALID_FRACTION:
        logger.warning("valid_fraction_below_floor", path=tile_path,
                       valid_fraction=valid_fraction, floor=MIN_VALID_FRACTION)
        raise RuntimeError(
            f"Valid fraction {valid_fraction:.2%} below floor for {tile_path}; "
            "composite rejected to prevent cloud-leakage false positives."
        )


@task
def compute_ndvi_anomaly(baseline: xr.DataArray, current: xr.DataArray,
                         valid_mask: xr.DataArray,
                         threshold: float = NDVI_DROP_THRESHOLD) -> xr.DataArray:
    """Difference NDVI against a rolling baseline and emit a boolean alert mask."""
    def ndvi(arr):  # band 8 = NIR, band 4 = Red for Sentinel-2
        nir, red = arr.sel(band_id=8), arr.sel(band_id=4)
        return (nir - red) / (nir + red)

    delta = ndvi(current) - ndvi(baseline)
    alerts = ((delta < threshold) & valid_mask).compute()
    alert_pixels = int(alerts.sum())
    logger.info("anomaly_computed", threshold=threshold,
                alert_pixels=alert_pixels)
    return alerts


@flow(name="deforestation-alert-pipeline")
def run_alert_generation(baseline_paths: list[str], current_paths: list[str],
                         valid_mask_paths: list[str]) -> list[xr.DataArray]:
    logger.info("pipeline_init", stage="change_detection",
                tiles=len(current_paths))
    alerts = []
    for base_p, curr_p, mask_p in zip(baseline_paths, current_paths, valid_mask_paths):
        base = load_and_align_tile(base_p)
        curr = load_and_align_tile(curr_p)
        mask = load_and_align_tile(mask_p).sel(band_id=1).astype(bool)
        gate_valid_fraction(mask, curr_p)
        alerts.append(compute_ndvi_anomaly(base, curr, mask))

    logger.info("pipeline_complete", alerts_generated=len(alerts),
                compliance_status="PASSED")
    return alerts
```

Three design choices here are load-bearing. First, **rejection over coercion**: a tile without a CRS tag or with too few clear pixels is dropped, never assumed-good, because an undocumented assumption is what an auditor exploits. Second, **single-pass alignment before differencing**: both epochs are reprojected onto `TARGET_CRS` from their authoritative sources so that the tile-boundary drift described above cannot survive into the anomaly computation. Third, **the validity mask is a multiplicand, not an afterthought** — it gates the difference at the pixel level so leaked cloud edges are excluded from the alert rather than masked out cosmetically after the fact.

The NDVI delta shown is the simplest defensible detector, but the same flow accepts more robust change models in the `compute_ndvi_anomaly` slot. CUSUM (cumulative sum) control charts detect sustained deviation from a rolling mean and excel at gradual clearing; Bayesian change-point detection returns posterior break probabilities that double as native confidence intervals; and a gradient-boosted or random-forest classifier trained on historical deforestation polygons scores change probability from multi-band temporal features. Whichever detector is used, the threshold (`NDVI_DROP_THRESHOLD`) must arrive as biome-calibrated configuration validated against PRODES or GLAD reference data before deployment — never as a literal a reviewer cannot trace. Dask's chunked model keeps continental tiles off the heap, and Prefect's retry and state tracking make recovery from transient archive or API failures deterministic. The companion walkthrough, [Building Real-Time Deforestation Alerts Using GEE and Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/building-real-time-deforestation-alerts-using-gee-and-python/), shows the same decomposition wired to a near-real-time trigger.

## Validation, Debugging & Compliance Mapping

A detector that is statistically sound but undocumented still fails an audit; technical outputs must map directly to regulatory verification steps. Every alert should carry an explicit `alert_confidence` (0.0–1.0) that propagates error from masking confidence, sensor noise, and threshold sensitivity into a single composite, so that high-confidence signals can trigger automated downstream workflows while low-confidence ones route to a manual review queue. The pipeline's gates map onto specific frameworks:

- **Valid-fraction and confidence gating → reportable-figure accuracy (ISO 14064-3 §5.4).** The hard rejection of cloud-starved composites and the per-alert confidence score constitute the documented data-quality controls a verifier requires under ISO 14064-3, keeping false-positive activity data out of the inventory rather than discovering it at audit.
- **Per-biome threshold calibration → geometric and temporal integrity (Verra VM-series).** Calibrating and validating thresholds against historical ground truth, with the calibration logged, satisfies Verra VM0042 / VM0047 expectations for stable, defensible detection logic across monitoring periods, and prevents the directional bias that systematic over- or under-detection introduces.
- **Lineage attachment → auditable provenance (CSRD ESRS E1).** Emitting alerts as GeoParquet or STAC-compliant GeoJSON in explicit `EPSG:4326` with acquisition timestamps, threshold values, and confidence scores creates the immutable provenance chain that CSRD ESRS E1 disclosures are scrutinized for, and that feeds [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) submissions. Where the EU Deforestation Regulation applies, the same polygon export — at ≤10 m positional accuracy with explicit coordinates — is what satisfies its geolocation requirement.

For debugging, three silent failures deserve dedicated diagnostics. Phantom boundary alerts that trace tile seams indicate residual registration error — validate that baseline and current share an identical affine transform after alignment before trusting any edge detection. Alert clusters that coincide with masked regions on the prior acquisition reveal cloud leakage — cross-check that the validity mask was dilated to cover shadow and cirrus adjacency. And a confidence distribution that collapses toward the threshold boundary signals a miscalibrated detector — trend the per-tile alert rate over time so a drifting upstream export or a quietly changed reflectance product surfaces as a regression long before it crosses an audit tolerance. A practical post-processing step intersects alert polygons with protected-area boundaries, concession maps, and historical deforestation layers (aligned with [IPCC AFOLU guidance](https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch04_Forest%20Land.pdf)) to suppress known false positives before submission.

## Conclusion

Deforestation alert generation pipelines are critical infrastructure for climate accountability, not experimental research tooling. Their reliability rests on a short list of non-negotiables: single-pass spatial alignment so tile boundaries do not manufacture change, masking as a hard gate so atmospheric contamination never differences through, biome-calibrated thresholds so phenology is not mistaken for clearing, and explicit confidence plus lineage on every alert so the output survives third-party verification. Embed those gates with `structlog` telemetry and distributed orchestration, and a pipeline can cover continental basins while remaining audit-ready under ISO 14064-3, the Verra VM-series, and CSRD ESRS E1. To implement the near-real-time variant end to end, work through [Building Real-Time Deforestation Alerts Using GEE and Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/building-real-time-deforestation-alerts-using-gee-and-python/).

## Related

- [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) — the parent stack this component anchors.
- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the upstream gate that produces the clean reflectance these alerts depend on.
- [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — how the rolling baselines a new observation is measured against are built.
- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — the out-of-core execution model that scales alerting to continental footprints.
- [Building Real-Time Deforestation Alerts Using GEE and Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/building-real-time-deforestation-alerts-using-gee-and-python/) — the step-by-step implementation walkthrough for this topic.
