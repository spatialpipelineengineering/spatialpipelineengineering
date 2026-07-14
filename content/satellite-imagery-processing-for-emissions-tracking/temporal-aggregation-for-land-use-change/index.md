---
shortTitle: "Temporal Aggregation for Land-Use Change in MRV Pipelines"
---
# Temporal Aggregation for Land-Use Change

Temporal aggregation for land-use change is the synthesis subsystem that collapses a noisy, irregularly sampled stream of optical acquisitions into clean, periodic composites — the statistical foundation on which every downstream land-use-change signal in the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack is built. It sits between raw ingestion and analytical detection, transforming per-scene reflectance into reporting-period composites that align with IPCC inventory cycles and corporate ESG disclosure windows. The engineering problem is not averaging pixels; it is producing a baseline that is reproducible, gap-aware, and auditable across heterogeneous revisit frequencies, atmospheric conditions, and sensor-specific spectral responses, while preserving the abrupt spectral signatures of genuine anthropogenic disturbance.

Because this stage is squarely in the middle of the pipeline, it inherits everything upstream and dictates everything downstream. A composite is only as honest as the [Sentinel-2 & Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) that gate which pixels are allowed to contribute, and its stability is what makes the [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) downstream trustworthy rather than a generator of atmospheric false positives. Get the masking and the aggregation right and a baseline reflects true surface state; get them wrong and median composites silently inherit cloud edges, drift, and phenological bias that no later threshold can recover.

<svg viewBox="0 0 1000 430" role="img" aria-labelledby="agg-t agg-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="agg-t">Temporal aggregation pipeline for land-use-change compositing</title>
  <desc id="agg-d">Irregularly dated optical scenes, each carrying a boolean validity mask, enter an alignment stage that enforces the reporting CRS and sorts the stack to a monotonic UTC time axis. The aligned stack feeds a per-window reduce step that computes a per-pixel valid-observation count alongside a masked temporal median. A confidence gate then forks each pixel: where valid_count is greater than or equal to the threshold the pixel becomes part of the periodic composite that flows to change detection, and where valid_count is below threshold the pixel is routed to a logged, ratio-gated fallback of carry-forward or constrained interpolation. Both the reduce stage and the gate write provenance to a compliance metadata ledger recording observation density, fallback_triggered state, datum and audit timestamp.</desc>
  <defs>
    <marker id="agg-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- input -->
    <rect x="14" y="134" width="132" height="92" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="80" y="166" font-size="11.5" font-weight="600">Optical scenes</text>
      <text x="80" y="184" font-size="9.5" opacity="0.8">irregular revisit · dated</text>
      <text x="80" y="200" font-size="9.5" opacity="0.8">+ boolean validity mask</text>
    </g>
    <!-- align -->
    <rect x="170" y="144" width="120" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="230" y="170" font-size="11.5" font-weight="600">Align</text>
      <text x="230" y="187" font-size="9.5" opacity="0.8">CRS normalize</text>
      <text x="230" y="202" font-size="9.5" opacity="0.8">UTC sort · monotonic</text>
    </g>
    <!-- reduce container -->
    <rect x="312" y="118" width="208" height="124" rx="11" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.85"/>
    <text x="416" y="138" fill="currentColor" font-size="11" font-weight="600">Per-window reduce</text>
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="326" y="150" width="180" height="38" rx="7"/>
      <rect x="326" y="196" width="180" height="38" rx="7"/>
    </g>
    <g fill="currentColor">
      <text x="416" y="174" font-size="10.5" font-weight="600">valid_observation_count</text>
      <text x="416" y="220" font-size="10.5" font-weight="600">masked temporal median</text>
    </g>
    <!-- confidence gate (diamond) -->
    <polygon points="528,180 600,128 672,180 600,232" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="600" y="176" font-size="10" font-weight="600">valid_count ≥</text>
      <text x="600" y="191" font-size="10" font-weight="600">threshold?</text>
    </g>
    <!-- outputs -->
    <rect x="726" y="92" width="150" height="74" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="801" y="116" font-size="11.5" font-weight="600">Composite</text>
      <text x="801" y="133" font-size="9.5" opacity="0.8">periodic baseline</text>
      <text x="801" y="149" font-size="9.5" opacity="0.8">→ change detection</text>
    </g>
    <rect x="726" y="232" width="170" height="74" rx="9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
    <g fill="currentColor">
      <text x="811" y="256" font-size="11.5" font-weight="600">Fallback</text>
      <text x="811" y="273" font-size="9.5" opacity="0.8">carry-forward / interpolate</text>
      <text x="811" y="289" font-size="9.5" opacity="0.8">logged · ratio-gated</text>
    </g>
    <!-- compliance ledger -->
    <rect x="312" y="338" width="564" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="594" y="362" font-size="11.5" font-weight="600">Compliance metadata ledger</text>
      <text x="594" y="382" font-size="9.5" opacity="0.8">observation density · fallback_triggered</text>
      <text x="594" y="398" font-size="9.5" opacity="0.8">datum · audit timestamp</text>
    </g>
    <!-- flow arrows -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M146 180 H168" marker-end="url(#agg-arrow)"/>
      <path d="M290 180 H310" marker-end="url(#agg-arrow)"/>
      <path d="M520 180 H526" marker-end="url(#agg-arrow)"/>
      <path d="M642 156 L724 128" marker-end="url(#agg-arrow)"/>
      <path d="M642 204 L724 262" marker-end="url(#agg-arrow)"/>
    </g>
    <!-- provenance (dashed) into ledger -->
    <g fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.85">
      <path d="M416 242 V336" marker-end="url(#agg-arrow)"/>
      <path d="M600 232 V336" marker-end="url(#agg-arrow)"/>
    </g>
    <g fill="currentColor">
      <text x="690" y="124" font-size="9" opacity="0.8">≥ threshold</text>
      <text x="690" y="236" font-size="9" opacity="0.8">&lt; threshold</text>
      <text x="455" y="294" font-size="8.5" opacity="0.7" text-anchor="start">provenance written per window</text>
    </g>
  </g>
</svg>

## Role in the MRV Workflow

Temporal aggregation executes during the Compositing stage, positioned strictly between spectral preprocessing and change detection. Its upstream dependency is a stack of analysis-ready surface reflectance: cloud-, shadow-, and cirrus-masked Sentinel-2 L2A and Landsat 8/9 Collection 2 tiles, each carrying a boolean validity mask, an explicit machine-readable coordinate reference system tag, and a normalized acquisition timestamp. Its downstream consumers are unforgiving — composites become the rolling baselines that alert pipelines difference a new observation against, and the aggregated index trajectories feed parcel-level estimates in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) layer, ultimately entering the wider [MRV architecture and carbon accounting fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack as activity data that must survive third-party verification.

That position imposes two hard requirements. First, spatial fidelity across the time axis: a composite stacks observations that may originate from different orbits, zones, or sensors, so deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) at ingestion is non-negotiable — a sub-pixel misregistration between epochs is indistinguishable from real surface change once they are reduced into a single composite, and a datum mismatch relocates the entire reporting cell. Second, evidentiary completeness: every composite must carry the count of valid observations behind each pixel, the fallback decisions taken where data was thin, and the exact aggregation parameters used, because those attributes flow directly into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/). A composite without that record is unverifiable even when it is statistically sound.

The stage is also where observations acquire periodicity. Production systems operate on a tile-based, distributed execution model: imagery is partitioned into windows aligned to a reference grid (MGRS, UTM, or an H3 hexagonal scheme) and reduced over a fixed temporal window — typically monthly to match inventory cadence. Tiling and windowing are what let a single routine composite a continental footprint deterministically, but they also introduce the boundary and density effects that the failure modes below address. Throughput at that scale leans on [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) so that out-of-core array operations never block on a single oversized stack.

## Core Failure Modes

Three failure modes dominate production aggregation routines. Each has a distinct technical root cause and a measurable impact on carbon accounting integrity.

1. **Phantom values from unmasked observation gaps.** When cloud-free observations fall below a usable count within the reduction window, a naive `median` or `mean` over the surviving samples still emits a number — but that number is an artifact of one or two contaminated or off-phase scenes, not a representative surface state. The mechanism is statistical: a temporal reducer has no concept of confidence, so a pixel backed by a single hazy acquisition is reported with the same authority as one backed by twelve clear ones. In persistently cloudy tropics this routinely affects 10–30% of pixels in a monthly window, and every one of those pixels injects spurious variance into downstream change detection. The fix is a per-pixel `valid_observation_count` computed before reduction and a hard threshold below which the pixel is routed to an explicit, logged fallback rather than trusted.

2. **Spectral drift masked by carry-forward fallback.** The fallback that rescues data-poor pixels is itself a failure mode if applied blindly. Carry-forward preserves spatial continuity by substituting the last valid composite, but it also freezes the surface in time — a pixel that was cleared during a cloudy month will continue to report the pre-disturbance value until a clear acquisition arrives, delaying the alert and biasing the reporting period's activity data toward "no change." The impact is directional and therefore dangerous to an auditor: it systematically under-reports loss. The mitigation is to treat fallback as a tracked event, logging the `fallback_triggered` ratio per administrative boundary and escalating to manual review when it exceeds a calibrated fraction (commonly 15%) of a reporting unit.

3. **Temporal misalignment corrupting interpolation.** Constrained interpolation is the alternative fallback, and it depends entirely on a correctly ordered time axis. Acquisition timestamps that arrive in mixed local times, or that are concatenated unsorted, produce a time dimension whose order does not match real chronology. `interpolate_na` along that axis then fills gaps with inverted or implausible gradients, manufacturing smooth trends that never occurred. The root cause is metadata hygiene, not algorithm choice. The fix is to normalize every timestamp to UTC and sort the stack along the time coordinate before any concatenation or interpolation, and to assert monotonicity as a validation gate rather than assume it.

## Deterministic Implementation Architecture

The following implementation composites an irregular temporal stack into a monthly surface, enforcing a valid-observation threshold and routing low-confidence pixels through an explicit fallback. It uses `prefect` for orchestration and retries, `xarray`/`dask` for chunked out-of-core reduction, `rasterio`/`rioxarray` for explicit CRS handling, and `structlog` for the structured telemetry that compliance traceability requires. Fallback activations and observation density are emitted as machine-readable events, not free-text logs, so they can be aggregated into audit reports.

```python
import json
import numpy as np
import xarray as xr
import rasterio as rio
import rioxarray  # noqa: F401  (registers the .rio accessor)
import structlog
from dask import config as dask_config
from prefect import flow, task
from pathlib import Path
from typing import Tuple, Dict, Any

logger = structlog.get_logger()

# --- Injected configuration: traceable, never literals buried inline ---
TARGET_CRS = "EPSG:4326"          # registry/reporting datum (WGS84)
VALID_COUNT_THRESHOLD = 4         # min clear observations per pixel per window
FALLBACK_MODE = "carry_forward"   # "carry_forward" | "interpolate"
FALLBACK_REVIEW_RATIO = 0.15      # escalate to manual audit above this fraction

# Dask memory model for continental-scale stacks
dask_config.set({
    "scheduler": "threads",
    "array.slicing.split_large_chunks": False,
    "array.chunk-size": "100MB",
})


@task(retries=2, retry_delay_seconds=10)
def load_and_validate_stack(tile_paths: list[str],
                            target_crs: str = TARGET_CRS) -> xr.Dataset:
    """Load dated tiles, enforce CRS, attach validity masks, sort by UTC time."""
    log = logger.bind(stage="ingest", tiles=len(tile_paths))
    log.info("stack_load_start")
    members = []
    for path in tile_paths:
        with rio.open(path) as src:
            if src.crs is None:
                raise ValueError(f"missing CRS tag, refusing tile: {path}")
            if str(src.crs) != target_crs:
                # Reject rather than silently assume-good; alignment is explicit upstream.
                raise ValueError(f"CRS mismatch {src.crs} != {target_crs}: {path}")
            data = src.read()                       # bands 1..N, last band = QA mask
            acq = src.tags().get("acquisition_date")
        if acq is None:
            raise ValueError(f"missing acquisition_date tag: {path}")

        valid_mask = (data[-1, :, :] == 1)
        reflectance = data[:-1, :, :].astype("float32")
        ds = xr.Dataset(
            data_vars={
                "reflectance": (["band", "y", "x"], reflectance),
                "valid_mask": (["y", "x"], valid_mask.astype(np.uint8)),
            },
            coords={
                "band": np.arange(1, reflectance.shape[0] + 1),
                "time": [np.datetime64(acq)],   # normalized to UTC upstream
            },
        )
        members.append(ds)

    # Chronological order is a hard precondition for any temporal reducer.
    stack = xr.concat(members, dim="time").sortby("time")
    if not np.all(np.diff(stack["time"].values).astype("int64") >= 0):
        raise AssertionError("time axis is not monotonic after sort")
    stack.rio.write_crs(target_crs, inplace=True)
    log.info("stack_load_complete", time_steps=stack.sizes["time"])
    return stack.chunk({"y": 512, "x": 512, "time": -1})


@task
def compute_temporal_aggregate(
    stack: xr.Dataset,
    threshold: int = VALID_COUNT_THRESHOLD,
    fallback: str = FALLBACK_MODE,
) -> Tuple[xr.Dataset, Dict[str, Any]]:
    """Masked median with per-pixel confidence gating and logged fallback routing."""
    log = logger.bind(stage="aggregate", threshold=threshold, fallback=fallback)

    valid_counts = stack["valid_mask"].sum(dim="time")
    masked = stack["reflectance"].where(stack["valid_mask"] == 1)
    composite = masked.median(dim="time")          # primary reducer

    low_conf = valid_counts < threshold
    n_low = int(low_conf.sum().compute())
    n_total = int(valid_counts.notnull().sum().compute())
    fallback_ratio = (n_low / n_total) if n_total else 0.0
    fallback_triggered = n_low > 0

    if fallback_triggered:
        log.warning("fallback_activated", low_conf_pixels=n_low,
                    fallback_ratio=round(fallback_ratio, 4))
        if fallback == "carry_forward":
            composite = composite.where(~low_conf, masked.isel(time=-1))
        elif fallback == "interpolate":
            composite = composite.where(
                ~low_conf, masked.interpolate_na(dim="time").isel(time=-1))
        else:
            raise ValueError(f"unsupported fallback mode: {fallback}")

    if fallback_ratio > FALLBACK_REVIEW_RATIO:
        # Directional bias risk (see Failure Mode 2): force human verification.
        log.error("fallback_ratio_exceeds_audit_tolerance",
                   fallback_ratio=round(fallback_ratio, 4),
                   limit=FALLBACK_REVIEW_RATIO, review_required=True)

    compliance_meta = {
        "aggregation_method": "median",
        "valid_count_threshold": threshold,
        "fallback_mode": fallback,
        "fallback_triggered": bool(fallback_triggered),
        "fallback_ratio": round(fallback_ratio, 4),
        "min_valid_count": int(valid_counts.min().compute()),
        "max_valid_count": int(valid_counts.max().compute()),
        "ipcc_tier_alignment": "Tier 3 (spatially explicit)",
        "datum": TARGET_CRS,
        "audit_timestamp": str(np.datetime64("now", "s")),
    }
    out = composite.to_dataset(name="reflectance")
    out["valid_observation_count"] = valid_counts
    out.attrs["compliance_metadata"] = json.dumps(compliance_meta)
    log.info("aggregate_complete", **compliance_meta)
    return out, compliance_meta


@flow(name="mrv-temporal-aggregation")
def run_aggregation_pipeline(tile_directory: str, output_path: str) -> Dict[str, Any]:
    """Orchestrate window compositing end to end with embedded provenance."""
    tiles = sorted(str(p) for p in Path(tile_directory).glob("*.tif"))
    if not tiles:
        raise FileNotFoundError(f"no tiles found in {tile_directory}")
    logger.info("pipeline_init", stage="compositing", tiles=len(tiles))

    stack = load_and_validate_stack(tiles)
    composite, meta = compute_temporal_aggregate(stack)

    composite["reflectance"].rio.write_crs(TARGET_CRS, inplace=True)
    composite["reflectance"].rio.to_raster(
        output_path, driver="GTiff", compress="DEFLATE", dtype="float32",
        tags={"compliance_metadata": composite.attrs["compliance_metadata"]})
    logger.info("pipeline_complete", output=output_path,
                compliance_status="PASSED")
    return meta
```

Three design choices here are load-bearing. First, **rejection over coercion**: a tile lacking a CRS tag, carrying the wrong datum, or missing an acquisition timestamp is dropped, never assumed-good, because an undocumented assumption is exactly what an auditor exploits. Second, **confidence is computed before the reducer runs, not after** — `valid_observation_count` is the gate that decides which pixels are trusted and which are routed to a logged fallback, so a single hazy scene can never masquerade as a representative composite. Third, **fallback is an event, not a silent rescue**: every activation is emitted as structured telemetry and the per-window ratio is checked against an audit tolerance, so the directional under-reporting risk of carry-forward surfaces as a flagged record long before it reaches a verifier.

The temporal median shown is the simplest defensible reducer, but the same flow accepts more robust models in the `compute_temporal_aggregate` slot. A geometric-median (medoid) composite preserves cross-band spectral coherence better than a per-band median and resists residual cloud edges; a harmonic/Fourier fit models seasonal phenology explicitly and exposes residuals as a native disturbance signal; and a best-available-pixel score (weighting recency, view angle, and clear-sky confidence) is preferred where a single clean surface per window is needed. Whichever reducer is used, the threshold and window length must arrive as injected, biome-calibrated configuration validated against reference data — never as literals a reviewer cannot trace.

## Validation, Debugging & Compliance Mapping

A composite that is statistically sound but undocumented still fails an audit; technical outputs must map directly to regulatory verification steps. Every composite ships its `valid_observation_count` layer and an embedded `compliance_metadata` block, so the uncertainty and the exact parameters behind each pixel travel with the raster rather than living in a detached notebook. The pipeline's gates map onto specific frameworks:

- **Valid-count thresholding and embedded uncertainty → reportable-figure accuracy (ISO 14064-3 §5.4).** The hard rejection of data-poor pixels and the per-pixel observation count constitute the documented data-quality controls a verifier requires under ISO 14064-3, keeping low-confidence activity data out of the inventory rather than discovering it at audit. The `valid_observation_count` layer is the substrate for Tier 3 error propagation.
- **Threshold and window calibration → geometric and temporal integrity (Verra VM-series).** Calibrating the valid-count threshold and reduction window against historical reference, with the calibration logged, satisfies Verra VM0042 / VM0047 expectations for stable, defensible baselines across monitoring periods, and the immutable `fallback_triggered` record prevents emission reductions from being inflated by interpolated spectral values.
- **Lineage attachment → auditable provenance (CSRD ESRS E1).** Embedding `compliance_metadata` — datum, aggregation method, fallback state, observation density, audit timestamp — directly into raster tags creates the reproducible provenance chain that CSRD ESRS E1 disclosures are scrutinized for, and that feeds [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) submissions. Because the same metadata maps the composite to [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/), land-sector activity data inherits the exact parameters used during calculation.

For debugging, three silent failures deserve dedicated diagnostics. Edge discontinuities that trace tile seams indicate chunk-boundary artifacts — validate that adjacent outputs share an identical affine transform and run a `rasterio.merge` sanity check before trusting any composite mosaic. Composites that look unnaturally smooth across a known disturbance reveal carry-forward masking phenological change — trend the `fallback_ratio` per administrative unit and require manual review where it crosses the audit tolerance. And index trajectories that invert or trend implausibly point to temporal misalignment — assert UTC normalization and monotonic time before interpolation. As a continuous check, cross-reference aggregated NDVI/EVI trajectories against the [monthly temporal aggregation of NDVI for land cover change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/) benchmarks and compute RMSE against in-situ flux-tower observations where available, using [xarray's computation engine](https://docs.xarray.dev/en/stable/user-guide/computation.html) and aligning land-cover definitions with [IPCC AFOLU guidance](https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch04_Forest%20Land.pdf).

## Conclusion

Temporal aggregation for land-use change is the control point where raw optical observations become defensible baselines, not a cosmetic smoothing step. Its reliability rests on a short list of non-negotiables: explicit CRS enforcement and UTC-sorted time so observations stack honestly, per-pixel valid-observation counting so confidence is measured before any reducer runs, fallback treated as a logged and audit-gated event so carry-forward cannot quietly under-report loss, and `compliance_metadata` embedded on every output so the composite survives third-party verification. Wire those gates with `structlog` telemetry and distributed `xarray`/`dask` orchestration, and a single routine can composite continental footprints while remaining audit-ready under ISO 14064-3, the Verra VM-series, and CSRD ESRS E1. To implement the monthly NDVI variant end to end, work through [Monthly Temporal Aggregation of NDVI for Land Cover Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/).

## Related

- [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) — the parent stack this component anchors.
- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the upstream gate that produces the validity masks every composite depends on.
- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — the downstream consumer that differences new observations against these baselines.
- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — the out-of-core execution model that scales compositing to continental footprints.
- [Monthly Temporal Aggregation of NDVI for Land Cover Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/) — the step-by-step implementation walkthrough for this topic.
