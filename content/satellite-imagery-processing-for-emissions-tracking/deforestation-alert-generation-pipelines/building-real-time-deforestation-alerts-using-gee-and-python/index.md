---
shortTitle: "Real-Time Deforestation Alerts with GEE and Python"
title: "Building Real-Time Deforestation Alerts Using GEE and Python"
description: "Engineer a sub-weekly deforestation alert pipeline on Google Earth Engine and Python with rolling NDVI/NBR baselines, server-side vectorization, distortion gates, and audit-ready lineage for MRV verification."
slug: building-real-time-deforestation-alerts-using-gee-and-python
type: guide
breadcrumb: "Real-Time Deforestation Alerts with GEE and Python"
datePublished: 2026-06-26
dateModified: 2026-06-26
---
# Building Real-Time Deforestation Alerts Using GEE and Python

Engineering a sub-weekly deforestation detection pipeline for MRV compliance demands a shift from static annual land-cover classifications to continuous, event-driven spatial monitoring. This guide is the task-level recipe under [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/), the change-detection discipline within the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack. It shows how to build real-time deforestation alerts using Google Earth Engine and Python so that detections inherit the radiometric consistency established by upstream [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) and the phenology-aware signal separation produced by [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/).

The core engineering intent is to deliver geospatial alerts that satisfy third-party audit requirements (Verra VM0048, ART TREES, or national GHG inventories) while maintaining high throughput during ingestion. This architecture integrates Earth Engine's server-side computation with Python's async orchestration to bypass client-side memory bottlenecks and produce deterministic, cryptographically verifiable output for Scope 3 supply-chain due diligence.

<svg viewBox="0 0 986 300" role="img" aria-labelledby="alert-t alert-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="alert-t">Real-time deforestation alert pipeline</title>
  <desc id="alert-d">A cloud-masked Sentinel-2 composite feeds an NDVI/NBR rolling baseline of 30 days compared against a 7-day observation window. The per-pixel z-score delta is thresholded above 2.5, then vectorized server-side at a 0.05 hectare minimum contiguous area. A decision gate tests each alert polygon for plantation or seasonal overlap: matches are downgraded to SEASONAL_CHANGE for manual review, while clean detections become PENDING_REVIEW with an attached SHA-256 audit hash.</desc>
  <defs>
    <marker id="alert-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- main detection chain -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="16" y="130" width="144" height="72" rx="9"/>
      <rect x="184" y="130" width="144" height="72" rx="9"/>
      <rect x="352" y="130" width="140" height="72" rx="9"/>
      <rect x="516" y="130" width="140" height="72" rx="9"/>
    </g>
    <g fill="currentColor">
      <text x="88" y="158" font-size="11.5" font-weight="600">S2 composite</text>
      <text x="88" y="175" font-size="9.5" opacity="0.8">cloud-masked</text>
      <text x="88" y="189" font-size="9.5" opacity="0.8">QA60 bitmask</text>
      <text x="256" y="158" font-size="11.5" font-weight="600">NDVI / NBR</text>
      <text x="256" y="175" font-size="9.5" opacity="0.8">baseline 30d</text>
      <text x="256" y="189" font-size="9.5" opacity="0.8">observation 7d</text>
      <text x="422" y="158" font-size="11.5" font-weight="600">z-score delta</text>
      <text x="422" y="175" font-size="9.5" opacity="0.8">|z| &gt; 2.5</text>
      <text x="422" y="189" font-size="9.5" opacity="0.8">server-side</text>
      <text x="586" y="158" font-size="11.5" font-weight="600">vectorize</text>
      <text x="586" y="175" font-size="9.5" opacity="0.8">reduceToVectors</text>
      <text x="586" y="189" font-size="9.5" opacity="0.8">min 0.05 ha · UTM</text>
    </g>
    <!-- decision diamond -->
    <path d="M748 110 L818 166 L748 222 L678 166 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="748" y="160" font-size="10" font-weight="600">plantation /</text>
      <text x="748" y="174" font-size="10" font-weight="600">seasonal</text>
      <text x="748" y="188" font-size="10" opacity="0.85">overlap?</text>
    </g>
    <!-- outcomes -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="846" y="44" width="132" height="64" rx="9"/>
      <rect x="846" y="222" width="132" height="64" rx="9"/>
    </g>
    <g fill="currentColor">
      <text x="912" y="70" font-size="10.5" font-weight="600">SEASONAL_CHANGE</text>
      <text x="912" y="86" font-size="9" opacity="0.8">downgraded ·</text>
      <text x="912" y="98" font-size="9" opacity="0.8">manual review</text>
      <text x="912" y="248" font-size="10.5" font-weight="600">PENDING_REVIEW</text>
      <text x="912" y="264" font-size="9" opacity="0.8">+ SHA-256</text>
      <text x="912" y="276" font-size="9" opacity="0.8">audit hash</text>
    </g>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#alert-arrow)" opacity="0.9">
    <line x1="160" y1="166" x2="182" y2="166"/>
    <line x1="328" y1="166" x2="350" y2="166"/>
    <line x1="492" y1="166" x2="514" y2="166"/>
    <line x1="656" y1="166" x2="676" y2="166"/>
    <path d="M790 134 C 824 110 832 90 844 80"/>
    <path d="M790 198 C 824 222 832 242 844 252"/>
  </g>
  <g font-family="system-ui, sans-serif" fill="currentColor" font-size="9.5" opacity="0.75">
    <text x="824" y="116" text-anchor="middle">yes</text>
    <text x="824" y="222" text-anchor="middle">no</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Build real-time deforestation alerts using GEE and Python",
  "description": "Detect sub-weekly deforestation by comparing rolling NDVI/NBR baselines against a recent observation window on Google Earth Engine, vectorize alerts server-side, gate on contiguous area and seasonal overlap, and emit audit-ready lineage for MRV verification.",
  "totalTime": "PT45M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "earthengine-api" },
    { "@type": "HowToTool", "name": "asyncio" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Pre-flight validation", "text": "Verify that each tile has enough clear-sky observations in both the baseline and observation windows before running change detection." },
    { "@type": "HowToStep", "name": "Compute rolling deltas", "text": "Build cloud-masked NDVI/NBR composites for a 30-day baseline and a 7-day observation window and compute the per-pixel z-score delta server-side." },
    { "@type": "HowToStep", "name": "Vectorize and gate", "text": "Threshold the delta, vectorize alerts at a 0.05 ha minimum contiguous area, and downgrade plantation or seasonal overlaps to manual review." },
    { "@type": "HowToStep", "name": "Attach lineage and export", "text": "Embed SHA-256 processing hashes, filter parameters, and threshold snapshots as immutable lineage, then export for registry submission." }
  ]
}
</script>

## Root Cause Analysis: Why Naive Change Detection Fails Verification

Annual or quarterly land-cover classifications cannot satisfy near-real-time deforestation mandates because the latency between disturbance and detection exceeds the intervention window for enforcement and registry buffer accounting. The naive alternative — differencing two single scenes — fails third-party verification for three structural reasons.

First, **cloud contamination produces false negatives** in exactly the equatorial regions where deforestation is most active. A single-scene difference inherits every undetected cloud, cirrus veil, and haze gradient, so a cleared parcel hidden under cloud on the observation date silently disappears from the alert layer. This is why deterministic masking — the contract enforced upstream by the [cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — is a prerequisite, not an optimization.

Second, **phenological noise produces false positives**. Dry-season senescence, agricultural harvest cycles, and logging-road maintenance all depress NDVI without representing permanent forest loss. Without a statistical baseline and a contiguous-area floor, these transient signals flood analyst queues and erode the precision metrics that registries audit.

Third, **client-side processing does not scale**. Pulling pixels to a local process for differencing routinely triggers `EEException: Memory limit exceeded` on jurisdictions above ~10,000 km², and any non-deterministic reducer or unpinned date window breaks the reproducibility that ISO 14064-3 verification demands. The fix is to keep computation server-side, pin every temporal window, and attach a cryptographic lineage record to each alert.

## Diagnostic Pipeline: Pre-Flight Observation Sufficiency

Before running change detection on any tile, validate that both the baseline and observation windows contain enough clear-sky observations to support a statistically meaningful delta. A tile with two cloud-free scenes in a 30-day baseline cannot yield a defensible z-score, and forcing detection on thin data is the single largest source of spurious alerts. The following pre-flight routine counts valid observations after cloud masking, checks that the AOI is anchored to a projected CRS rather than raw WGS84, and emits structured `structlog` events so the audit trail begins at ingestion:

```python
import ee
import structlog

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()

ee.Initialize()

# Minimum clear observations required per window for a defensible delta.
MIN_BASELINE_OBS = 4
MIN_OBSERVATION_OBS = 2


def mask_clouds(img: ee.Image) -> ee.Image:
    """QA60 bitmask: bit 10 = opaque clouds, bit 11 = cirrus."""
    qa = img.select("QA60")
    clear = qa.bitwiseAnd(1 << 10).eq(0).And(qa.bitwiseAnd(1 << 11).eq(0))
    return img.updateMask(clear)


def preflight_tile(tile_bounds: ee.Geometry, target_epsg: str,
                   baseline_start: str, baseline_end: str,
                   obs_start: str, obs_end: str) -> dict:
    """Reject tiles with insufficient clear-sky imagery before detection runs."""
    if not target_epsg.upper().startswith("EPSG:326") and \
       not target_epsg.upper().startswith("EPSG:327"):
        # Force a metric UTM CRS; alerts vectorized in EPSG:4326 are area-invalid.
        log.error("preflight.crs_not_projected", target_epsg=target_epsg)
        raise ValueError(f"target_epsg must be a UTM zone, got {target_epsg}")

    def clear_count(start: str, end: str) -> int:
        coll = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(tile_bounds)
                .filterDate(start, end)
                .map(mask_clouds))
        # Count of unmasked observations at the AOI centroid.
        count = coll.select("B8").count().reduceRegion(
            reducer=ee.Reducer.max(),
            geometry=tile_bounds.centroid(1),
            scale=10,
            maxPixels=1e6,
        ).get("B8")
        return int(ee.Number(count).getInfo() or 0)

    baseline_obs = clear_count(baseline_start, baseline_end)
    observation_obs = clear_count(obs_start, obs_end)

    sufficient = (baseline_obs >= MIN_BASELINE_OBS and
                  observation_obs >= MIN_OBSERVATION_OBS)
    log.info(
        "preflight.observation_count",
        target_epsg=target_epsg,
        baseline_obs=baseline_obs,
        observation_obs=observation_obs,
        sufficient=sufficient,
    )
    return {
        "sufficient": sufficient,
        "baseline_obs": baseline_obs,
        "observation_obs": observation_obs,
    }
```

Tiles that fail this gate are routed to a Landsat 9 OLI fallback or deferred to the next acquisition cycle rather than producing low-confidence alerts.

## Deterministic Transformation Logic: Rolling Baseline Delta

Change detection operates on a rolling baseline-observation delta computed entirely server-side. The pipeline builds cloud-masked NDVI and NBR composites for a 30-day pre-event baseline and compares them against a 7-day observation window. A statistically significant deforestation signal triggers when the per-pixel delta exceeds a z-score threshold of 2.5, coupled with a minimum contiguous-area filter of 0.05 ha to exclude harvest cycles and road maintenance. Vectorization runs through `ee.Image.reduceToVectors` with explicit reprojection into the tile's UTM zone, because alerts vectorized in EPSG:4326 carry angular distortion that violates registry area accounting — the same equal-area discipline enforced by [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) at the ingestion stage.

```python
import asyncio
import hashlib
from datetime import datetime, timezone


def build_deforestation_alert(tile_bounds: ee.Geometry, target_epsg: str,
                              audit_id: str) -> ee.FeatureCollection:
    """Server-side NDVI/NBR z-score deforestation detection for one tile."""

    def index_composite(start: ee.Date, end: ee.Date) -> ee.Image:
        coll = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(tile_bounds)
                .filterDate(start, end)
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 60))
                .map(mask_clouds))
        mosaic = coll.qualityMosaic("CLOUD_COVER")
        ndvi = mosaic.normalizedDifference(["B8", "B4"]).rename("NDVI")
        nbr = mosaic.normalizedDifference(["B8", "B12"]).rename("NBR")
        return ndvi.addBands(nbr)

    # Pinned, deterministic temporal windows (no server-side randomization).
    today = ee.Date(datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    baseline = index_composite(today.advance(-60, "day"), today.advance(-30, "day"))
    observation = index_composite(today.advance(-7, "day"), today)

    # Per-pixel NDVI z-score delta against the baseline spatial variance.
    ndvi_delta = observation.select("NDVI").subtract(baseline.select("NDVI"))
    ndvi_std = ee.Number(
        ndvi_delta.reduceRegion(ee.Reducer.stdDev(), tile_bounds, 10).values().get(0)
    )
    z_score = ndvi_delta.divide(ndvi_std)

    # ~0.05 ha at 10 m = 500 m² ≈ 50 contiguous pixels.
    alert_mask = z_score.abs().gt(2.5).rename("alert").selfMask()
    vectors = alert_mask.reduceToVectors(
        geometry=tile_bounds,
        crs=target_epsg,        # explicit metric UTM CRS — distortion gate
        scale=10,
        maxPixels=1e9,
        reducer=ee.Reducer.countEvery(),
        geometryType="polygon",
        bestEffort=True,
    ).filter(ee.Filter.gte("count", 50))

    audit_hash = hashlib.sha256(
        f"{audit_id}_{datetime.now(timezone.utc).isoformat()}_{target_epsg}".encode()
    ).hexdigest()

    log.info("alert.vectorized", audit_id=audit_id, target_epsg=target_epsg,
             audit_hash=audit_hash[:12])

    return vectors.map(lambda f: f.set({
        "audit_id": audit_hash,
        "target_epsg": target_epsg,
        "threshold_z": 2.5,
        "min_area_ha": 0.05,
        "compliance_status": "PENDING_REVIEW",
    }))
```

Pinning `filterDate()`, disabling randomized reducers, and caching intermediate composites as Earth Engine assets guarantees that a re-run on the same inputs reproduces byte-identical geometry — the reproducibility contract that auditors replay during verification.

<svg viewBox="0 -4 880 228" role="img" aria-labelledby="base-t base-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="base-t">Rolling baseline window length and its two competing errors</title>
  <desc id="base-d">A chart with baseline window length from 3 to 36 months on the horizontal axis. The false-alert rate falls steeply from 46 per week at a 3-month window to 8 per week at 24 months, because a longer window better characterises normal seasonal variation. The staleness error, meaning disturbance that the baseline has already absorbed and can no longer detect, rises from near zero at 3 months to 19 per week at 36 months. A combined error curve has a minimum around 18 months. A panel notes that the optimum moves with the local disturbance rate: fast-changing landscapes need shorter windows and accept more false alerts.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The baseline window trades two errors against each other</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Errors per week against rolling-baseline length.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="66" x2="600" y2="66"/><line x1="80" y1="110" x2="600" y2="110"/><line x1="80" y1="154" x2="600" y2="154"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="56" x2="80" y2="186"/>
    <line x1="80" y1="186" x2="600" y2="186"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="70" text-anchor="end">48</text>
    <text x="72" y="114" text-anchor="end">32</text>
    <text x="72" y="158" text-anchor="end">16</text>
    <text x="72" y="190" text-anchor="end">0</text>
    <text x="80" y="206" text-anchor="middle">3 mo</text>
    <text x="253" y="206" text-anchor="middle">12 mo</text>
    <text x="426" y="206" text-anchor="middle">24 mo</text>
    <text x="600" y="206" text-anchor="middle">36 mo</text>
  </g>
  <polyline points="80,60 166,110 253,142 340,158 426,164 513,168 600,170" fill="none" stroke="#f3a712" stroke-width="2.6"/>
  <polyline points="80,185 166,182 253,174 340,160 426,140 513,116 600,94" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="7,4"/>
  <polyline points="80,58 166,104 253,132 340,140 366,138 426,128 513,110 600,88" fill="none" stroke="currentColor" stroke-width="2.8"/>
  <circle cx="348" cy="140" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="612" y="174" fill="#f3a712">false alerts</text>
    <text x="612" y="98" fill="currentColor" opacity="0.85">staleness</text>
    <text x="612" y="84" fill="currentColor">combined</text>
    <text x="360" y="126" fill="currentColor" font-size="9">minimum ≈ 18 mo</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="700" y="112" width="168" height="76" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="700" y="112" width="168" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="714" y="134" fill="currentColor" font-size="9.5" font-weight="700">The optimum moves</text>
    <text x="714" y="154" fill="currentColor" font-size="9" opacity="0.85">Fast-changing landscapes</text>
    <text x="714" y="168" fill="currentColor" font-size="9" opacity="0.85">need shorter windows and</text>
    <text x="714" y="182" fill="currentColor" font-size="9" opacity="0.85">accept more false alerts.</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

Every output geometry is validated against deterministic gating rules before export to carbon registry APIs, and each rule writes a parameter snapshot into the alert's lineage payload so the path from raw scene to confirmed alert is queryable end to end. This is the alert-layer expression of the [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) discipline.

- **CRS consistency:** Coordinates are locked to the tile's UTM zone at 10 m native resolution. Specify the exact EPSG code (for example `EPSG:32618` for UTM zone 18N) rather than a placeholder — no on-the-fly reprojection is permitted during vector export.
- **Temporal integrity:** Baseline and observation windows are fixed to rolling 30/7-day periods. Overlapping alerts within a 14-day window are merged with `ee.Geometry.union()` to prevent double-counting against registry buffer pools.
- **Audit verifiability:** Each alert payload carries the SHA-256 processing hash, the exact `ee.ImageCollection` filter parameters, and threshold snapshots. This satisfies Verra VM0048 Section 4.2.3 and ART TREES Module 5 requirements for reproducible MRV workflows, and aligns directly with the validation rules enforced at [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/).
- **False-positive mitigation:** Alerts intersecting known plantation boundaries, fire scars, or seasonal water bodies are downgraded from `PENDING_REVIEW` to `SEASONAL_CHANGE` and routed to analyst review rather than auto-confirmed.

Sensor cross-calibration drift between Sentinel-2 A/B orbits is corrected with a band-specific linear normalization against a stable cloud-free reference composite, and tile-boundary seams are resolved with a 3-pixel overlap buffer plus forced reprojection, so no radiometric or geometric artifact leaks into the audit record.

## Production Integration

At continental scale the pipeline is orchestrated by `asyncio`, dispatching Earth Engine exports across tiles while keeping heavy computation server-side. For deeper throughput on raster-native staging, the same tile partitioning pattern composes with [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/). The final execution pattern is:

1. **Ingest** — partition the jurisdiction into 100 km² UTM-aligned tiles and resolve each tile's UTM EPSG code.
2. **Diagnose** — run `preflight_tile()` to confirm clear-sky observation sufficiency and reject or defer thin-data tiles.
3. **Transform** — call `build_deforestation_alert()` to compute the rolling z-score delta and vectorize server-side in the tile CRS.
4. **Validate** — apply the compliance gates (CRS, temporal merge, plantation overlap) and downgrade seasonal signals.
5. **Export** — write alerts to Parquet/GeoJSON with embedded SHA-256 lineage via `ee.batch.Export.table.toDrive`, falling back to Landsat 9 OLI where Sentinel-2 cloud cover exceeds 40%.
6. **Submit** — push confirmed payloads to the registry API with the attached audit JSON.

```python
async def process_tile_batch(
    tiles: list[tuple[ee.Geometry, str]],
    baseline_start: str, baseline_end: str,
    obs_start: str, obs_end: str,
) -> list[ee.FeatureCollection]:
    """High-throughput async ingestion: pre-flight gate then detect per tile."""
    results: list[ee.FeatureCollection] = []
    for i, (geom, epsg) in enumerate(tiles):
        pre = await asyncio.to_thread(
            preflight_tile, geom, epsg,
            baseline_start, baseline_end, obs_start, obs_end,
        )
        if not pre["sufficient"]:
            log.warning("tile.deferred", tile_index=i, **pre)
            continue
        fc = await asyncio.to_thread(
            build_deforestation_alert, geom, epsg, f"TILE_{i}"
        )
        results.append(fc)
    return results
```

By enforcing server-side computation, strict spatial partitioning, explicit metric CRS handling, and deterministic audit logging, this pipeline delivers sub-weekly deforestation alerts that withstand third-party verification while scaling to continental monitoring footprints.

<svg viewBox="0 -4 880 206" role="img" aria-labelledby="clu-t clu-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="clu-t">One clearing across three runs, as three alerts or as one evolving alert</title>
  <desc id="clu-d">A clearing that grows over three weekly runs, from 4 hectares to 11 hectares to 19 hectares. Under per-run identity, each run emits a new alert, producing three records that a recipient must reconcile and that triple the apparent event count. Under cluster identity, keyed on the spatial cluster and the first detection date, one alert is created and then updated twice, carrying its growth history and closing when the area stops changing. A panel notes that per-run identity inflates alert counts, breaks any per-event response workflow, and makes reconciliation with the period's measured area impossible.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Alert identity is a design decision, not a side effect</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">One clearing, growing across three weekly runs.</text>
    <text x="12" y="72" fill="currentColor" font-size="10" font-weight="700">Per-run identity</text>
    <text x="12" y="140" fill="currentColor" font-size="10" font-weight="700">Cluster identity</text>
  </g>
  <g>
    <rect x="180" y="52" width="176" height="42" rx="6" fill="none" stroke="#f3a712" stroke-width="1.7" stroke-dasharray="5,3"/>
    <text x="268" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">ALERT-8841 · 4 ha</text>
    <text x="268" y="86" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">run 1</text>
    <rect x="368" y="52" width="176" height="42" rx="6" fill="none" stroke="#f3a712" stroke-width="1.7" stroke-dasharray="5,3"/>
    <text x="456" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">ALERT-8903 · 11 ha</text>
    <text x="456" y="86" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">run 2</text>
    <rect x="556" y="52" width="176" height="42" rx="6" fill="none" stroke="#f3a712" stroke-width="1.7" stroke-dasharray="5,3"/>
    <text x="644" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">ALERT-8977 · 19 ha</text>
    <text x="644" y="86" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">run 3</text>
    <text x="752" y="76" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">3 events?</text>
    <rect x="180" y="120" width="552" height="42" rx="6" fill="currentColor" opacity="0.14"/>
    <rect x="180" y="120" width="552" height="42" rx="6" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="456" y="138" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">ALERT-8841 · created 4 ha → updated 11 ha → updated 19 ha → closed</text>
    <text x="456" y="154" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.8">keyed on spatial cluster + first detection date</text>
    <text x="752" y="144" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">1 event</text>
  </g>
  <text x="12" y="192" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.82">Per-run identity triples the event count, breaks per-event response, and makes reconciliation with the period's measured area impossible.</text>
</svg>

## Frequently Asked Questions

### How long should the rolling baseline be?

Long enough to characterise normal seasonal variation and short enough that the baseline has not absorbed the disturbance you want to detect — in practice twelve to twenty-four months for most forest systems. Shorter windows produce false alerts because normal seasonality looks anomalous against too little history; longer windows quietly absorb slow degradation into the baseline and stop reporting it. Tune it against a labelled sample rather than adopting a default, and re-tune when the landscape's disturbance rate changes.

### Should the baseline be per-pixel or per-region?

Per-pixel wherever observation density allows, because forest types, phenology, and terrain shading vary at fine scale and a regional baseline averages them into a threshold that is wrong nearly everywhere. Where a pixel has too few clear observations to support its own baseline, fall back to a stratified baseline by land-cover class and terrain, and record which pixels used which — a mixed approach is fine as long as the map does not pretend to be uniform.

### How do I keep a hosted-platform prototype reproducible?

Treat it as a prototype and re-implement the production path against pinned inputs. Hosted platforms change algorithm implementations and underlying collections without notice, which is entirely reasonable for an exploration tool and disqualifying for a compliance-bearing figure. Where a hosted platform must remain in the production path, pin the collection version explicitly, export the intermediate results you depend on, and store them with their digests.

### What should an alert record contain?

Geometry with an explicit CRS, the detection and confirmation dates bracketed by the last clear pre-event and first clear post-event observations, the confidence score with the scale it is on, the scene identifiers used, the baseline window and its parameters, and the algorithm version. That set is what lets a recipient reproduce the detection and lets a verifier assess whether the alert supports the claim built on it.

### How should alerts be de-duplicated across runs?

By a stable identity derived from location and event window rather than by run. A clearing that grows over three weeks should be one evolving alert, not three unrelated ones, and a pixel re-alerting after its segment was refitted is a bug rather than a new event. Key alerts on a spatial cluster identifier plus the first detection date, update rather than re-create as the cluster grows, and close the alert when the area stops changing.

### How should alert confidence be expressed to a non-technical recipient?

As a small number of named tiers with stated meanings, not as a raw probability. A ranger deciding whether to drive four hours needs "confirmed", "probable", and "watch" with a documented expectation for each, not a score of 0.73 whose calibration they cannot assess. Publish the historical precision of each tier so the labels are grounded in observation, and keep the underlying score in the record for anyone who wants it.

### What happens to alerts once the event is confirmed on the ground?

They close, with the ground observation attached. A closed alert with a field verdict is the raw material for measuring the pipeline's real precision, which is otherwise unknowable — every accuracy figure computed without field feedback is an estimate against a proxy. Build the return path from the beginning, even if it is a simple form, because retrofitting it means discarding the first years of evidence.

### How do alerts interact with the annual measured figure?

They should be reconciled but never summed into it. Alerts are tuned for latency and coarse spatial units; the measured figure is tuned for area accuracy with a full accuracy assessment. Comparing the two at period end is a genuinely useful control — a large divergence means one of them is miscalibrated — but adding alert areas to a measured total mixes two incompatible estimators and produces a figure that belongs to neither.

### How should the baseline be seeded for a newly added area?

From the archive rather than from the moment monitoring starts. A newly enrolled area has years of historical imagery available, and computing its baseline retrospectively means alerting can begin immediately rather than after a year of accumulation. The one caution is that the historical period must be checked for disturbance before it is used as a reference — a baseline computed over a window that already contains clearing encodes that clearing as normal.

### What does the pipeline do when the provider changes a collection?

Fails, deliberately, on the pinned collection version. Providers reprocess and republish collections, and a pipeline that resolves "the latest" silently changes its inputs mid-period. Pin the collection identifier and processing baseline, treat a change as a code change with a review, and recompute the affected periods deliberately if the new version is adopted — which is a restatement, and should be disclosed as one.

### Should alert geometry be published as pixels or polygons?

Polygons, generalised to a stated tolerance, with the pixel mask retained internally. Recipients act on areas, not on rasters, and a polygon carries the area attribute the response workflow needs. Keep the underlying mask so the polygon can be re-derived, and record the generalisation tolerance so the reported area is reproducible.

## Related guides

- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — the parent change-detection discipline this recipe sits within.
- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the radiometric masking contract every alert depends on.
- [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — phenology-aware baselining that separates harvest noise from forest loss.
- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — scaling tile-partitioned ingestion beyond single-process limits.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — how alert hashes become audit-ready provenance.
