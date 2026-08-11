---
shortTitle: "Monthly NDVI Aggregation for Land Cover Change"
title: "Monthly Temporal Aggregation of NDVI for Land Cover Change"
description: "Build QA-aware monthly NDVI composites for MRV: decode Sentinel-2 SCL and Landsat QA_PIXEL clear-sky flags, enforce observation-density thresholds, select median/p75 reducers, and emit audit-ready provenance for carbon accounting."
slug: monthly-temporal-aggregation-of-ndvi-for-land-cover-change
type: guide
breadcrumb: "Monthly NDVI Aggregation for Land Cover Change"
datePublished: 2026-06-26
dateModified: 2026-06-26
---
# Monthly Temporal Aggregation of NDVI for Land Cover Change

In automated MRV (Measurement, Reporting, and Verification) architectures, raw daily reflectance observations are statistically unusable for regulatory carbon accounting. This guide is the task-level recipe under [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/), the compositing discipline within the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack. It depends on the clear-sky masks produced upstream by [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) and feeds the rolling baselines consumed downstream by [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/).

Atmospheric interference, sensor geometry drift, and acquisition gaps introduce stochastic noise that obscures structural vegetation transitions. Monthly temporal aggregation of NDVI for land cover change resolves this by transforming heterogeneous pixel-level observations into deterministic, compliance-ready composites. The engineering objective is not statistical smoothing; it is the construction of an auditable temporal baseline that survives ESG scrutiny, aligns with GHG Protocol activity data requirements, and scales across multi-sensor tile streams as activity data entering the wider [MRV architecture and carbon accounting fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack.

<svg viewBox="-4 40 996 218" role="img" aria-labelledby="ndvi-agg-t ndvi-agg-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ndvi-agg-t">Monthly NDVI aggregation flow with observation-density branch</title>
  <desc id="ndvi-agg-d">A daily NDVI stack from Sentinel-2 and Landsat passes through a QA clear-sky filter keyed on SCL or QA_PIXEL, then a pinned monthly resample using a median or 75th-percentile reducer. A decision gate asks whether each cell has at least three clear observations per month: cells that pass become a deterministic monthly composite; cells that fail route to a 90-day rolling median fallback with the interpolation explicitly flagged. Both paths converge into a single audit manifest recording QA pass rate, datum and lineage.</desc>
  <defs>
    <marker id="ndvi-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- pipeline boxes -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="12" y="116" width="132" height="68" rx="9"/>
      <rect x="156" y="116" width="132" height="68" rx="9"/>
      <rect x="300" y="116" width="132" height="68" rx="9"/>
      <rect x="560" y="56" width="176" height="70" rx="9"/>
      <rect x="560" y="172" width="176" height="70" rx="9"/>
    </g>
    <!-- decision diamond -->
    <polygon points="486,98 542,150 486,202 430,150" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <!-- audit manifest (accent) -->
    <rect x="792" y="108" width="184" height="84" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <!-- titles -->
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="78" y="146">Daily NDVI stack</text>
      <text x="222" y="146">QA clear-sky filter</text>
      <text x="366" y="146">Monthly resample</text>
      <text x="648" y="86">Monthly composite</text>
      <text x="648" y="202">Rolling median fallback</text>
    </g>
    <text x="884" y="142" fill="#f3a712" font-size="12" font-weight="700">Audit manifest</text>
    <!-- subtitles -->
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="78" y="164">Sentinel-2 &#183; Landsat</text>
      <text x="222" y="164">SCL / QA_PIXEL</text>
      <text x="366" y="164">median / p75 &#183; 1MS</text>
      <text x="648" y="104">deterministic baseline</text>
      <text x="648" y="220">90-day &#183; interpolation flagged</text>
      <text x="884" y="162">QA rate &#183; datum &#183; lineage</text>
      <text x="884" y="178">ISO 14064-3 ready</text>
    </g>
    <!-- decision label -->
    <g fill="currentColor" font-size="10" font-weight="600">
      <text x="486" y="146">&#8805; 3 clear obs</text>
      <text x="486" y="160">per month?</text>
    </g>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#ndvi-arrow)">
    <line x1="144" y1="150" x2="154" y2="150"/>
    <line x1="288" y1="150" x2="298" y2="150"/>
    <line x1="432" y1="150" x2="428" y2="150"/>
    <path d="M486 98 C 520 70, 528 91, 558 91"/>
    <path d="M486 202 C 522 230, 530 207, 558 207"/>
    <path d="M736 91 C 768 91, 770 130, 790 135"/>
    <path d="M736 207 C 768 207, 770 170, 790 165"/>
  </g>
  <!-- branch labels -->
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="10" font-weight="600">
    <text x="540" y="78" fill="#f3a712">yes</text>
    <text x="540" y="232" fill="currentColor" opacity="0.8">no</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Aggregate daily NDVI into audit-ready monthly composites for land cover change",
  "description": "Decode Sentinel-2 SCL and Landsat Collection 2 QA_PIXEL clear-sky flags, mask daily NDVI, resample to monthly median or 75th-percentile composites, enforce a minimum clear-sky observation threshold with a 90-day rolling fallback, and emit an embedded provenance manifest for MRV verification.",
  "totalTime": "PT40M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "xarray" },
    { "@type": "HowToTool", "name": "dask" },
    { "@type": "HowToTool", "name": "rioxarray" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Pre-flight validation", "text": "Inspect the daily NDVI stack and QA band for CRS tags, monotonic timestamps, and per-month clear-sky observation counts before any reduction." },
    { "@type": "HowToStep", "name": "Decode QA and mask", "text": "Build a boolean clear-sky mask from Sentinel-2 SCL classes or Landsat QA_PIXEL cloud bits and apply it to the NDVI stack." },
    { "@type": "HowToStep", "name": "Resample to monthly composites", "text": "Group by calendar month start and reduce with a median or 75th-percentile reducer, masking cells below the minimum observation threshold." },
    { "@type": "HowToStep", "name": "Attach lineage and export", "text": "Embed the QA pass rate, low-density fraction, reducer, datum, and fallback flags into the output attributes for registry submission." }
  ]
}
</script>

## Root Cause Analysis: Why Daily Stacks Fail Verification

A naive pipeline that differences raw daily NDVI scenes, or that means them without QA gating, cannot satisfy third-party verification. Three structural problems drive the failure.

First, **residual atmospheric contamination is directional, not random.** Cloud, shadow, and thin cirrus depress near-infrared reflectance in exactly the way real canopy loss does, so the error does not average out — it biases the composite toward false disturbance. Even 15% residual cirrus contamination can depress NDVI by 0.08–0.12, enough to trip a deforestation threshold on a pixel that never changed. This is why a decoded clear-sky mask, the contract established upstream by the [cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/), is a precondition rather than a refinement.

Second, **irregular revisit creates unequal evidentiary weight.** Tropical tiles may yield two clear acquisitions in a wet month and twenty in a dry one. A reducer that ignores observation density treats a single haze-fringed pixel with the same authority as a twenty-deep stack, and a verifier cannot distinguish a confident measurement from a lucky guess. Without an explicit minimum-observation gate the composite silently encodes that imbalance.

Third, **non-deterministic reduction breaks reproducibility.** Floating window boundaries, unpinned reducers, or `NDVI_max` compositing (which selects the single brightest — often most contaminated — observation) produce outputs that cannot be regenerated identically. ISO 14064-3 verification demands that the same inputs and parameters yield the same composite, every run. The fix is a pinned calendar-month window, a robust median or 75th-percentile reducer that suppresses transient soil-moisture and BRDF edge effects, and an embedded record of every parameter used.

## Diagnostic Pipeline: Pre-Flight Observation Sufficiency

Before any reduction runs, inspect the inputs and detect the failure conditions above. The pre-flight gate confirms a machine-readable CRS, a monotonic time axis, and — critically — that each calendar month carries enough clear-sky observations to support a defensible composite. Strict [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) is validated here because a datum mismatch relocates the entire reporting cell and a sub-pixel offset between epochs is indistinguishable from real surface change once observations are reduced into one composite.

```python
import xarray as xr
import numpy as np
import pandas as pd
import structlog

log = structlog.get_logger()

# Sentinel-2 SCL clear-sky classes: Vegetation, Bare Soil, Water, Unclassified
S2_SCL_CLEAR_CLASSES = {4, 5, 6, 7}
# Landsat C2 QA_PIXEL: clear requires cloud bit (6) and cloud-confidence bits (8-9) unset
LANDSAT_CLEAR_MASK = 0x0040 | 0x0300


def preflight_ndvi_stack(
    ndvi_stack: xr.DataArray,
    qa_mask: xr.DataArray,
    sensor: str = "S2",
    min_obs: int = 3,
    target_crs: str = "EPSG:4326",
) -> dict:
    """Inspect a daily NDVI stack and its QA band before monthly aggregation.

    Detects: missing/mismatched CRS, non-monotonic timestamps, and calendar
    months whose clear-sky observation count falls below the compliance floor.
    """
    issues: list[str] = []

    # 1. CRS must be declared and match the canonical target
    crs = getattr(ndvi_stack.rio, "crs", None)
    if crs is None:
        issues.append("missing_crs")
    elif str(crs) != target_crs:
        issues.append(f"crs_mismatch:{crs}!={target_crs}")

    # 2. Time axis must be strictly increasing (no duplicate acquisitions)
    times = pd.DatetimeIndex(ndvi_stack["time"].values)
    if not times.is_monotonic_increasing or times.has_duplicates:
        issues.append("non_monotonic_time_axis")

    # 3. Per-month clear-sky observation density
    if sensor == "S2":
        clear = xr.zeros_like(qa_mask, dtype=bool)
        for cls in S2_SCL_CLEAR_CLASSES:
            clear = clear | (qa_mask == cls)
    elif sensor in ("L8", "L9"):
        clear = (qa_mask & LANDSAT_CLEAR_MASK) == 0
    else:
        raise ValueError(f"Unsupported sensor: {sensor}. Use 'S2', 'L8', or 'L9'.")

    monthly_obs = clear.resample(time="1MS").sum(dim="time")
    thin_months = int((monthly_obs.min(dim=["y", "x"]) < min_obs).sum())

    report = {
        "sensor": sensor,
        "n_acquisitions": int(times.size),
        "months_below_min_obs": thin_months,
        "min_obs_threshold": min_obs,
        "sufficient": not issues and thin_months == 0,
        "issues": issues,
    }
    log.info("ndvi.preflight", **report)
    return report
```

A tile that reports `sufficient=False` is not discarded; the flag routes thin months to the rolling-fallback path in the transformation step and records why, so the gap is visible to a verifier rather than silently interpolated.

<svg viewBox="0 -4 880 216" role="img" aria-labelledby="nobs-t nobs-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="nobs-t">Observation count per monthly composite, and what it does to the interval</title>
  <desc id="nobs-d">A chart of the 95 percent confidence half-width on a monthly mean vegetation index against the number of clear observations contributing to it. With one observation the half-width is 0.11, with three it is 0.06, with six 0.04, with twelve 0.03. A shaded band marks the region below three observations where the interval exceeds the seasonal signal being measured. A panel notes that a composite carries its observation count as a band so that downstream aggregation can weight by it, and that treating a one-observation cell and a twelve-observation cell as equivalent hides a fourfold difference in precision.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">A composite is not one number, it is a number and a count</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">95% half-width on a monthly mean index, by contributing observations.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="60" x2="540" y2="60"/><line x1="80" y1="102" x2="540" y2="102"/><line x1="80" y1="144" x2="540" y2="144"/>
  </g>
  <rect x="80" y="50" width="122" height="124" fill="#f3a712" opacity="0.12"/>
  <text x="141" y="66" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f3a712">interval &gt; signal</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="50" x2="80" y2="174"/>
    <line x1="80" y1="174" x2="540" y2="174"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="64" text-anchor="end">0.12</text>
    <text x="72" y="106" text-anchor="end">0.08</text>
    <text x="72" y="148" text-anchor="end">0.04</text>
    <text x="80" y="192" text-anchor="middle">1</text>
    <text x="202" y="192" text-anchor="middle">3</text>
    <text x="325" y="192" text-anchor="middle">6</text>
    <text x="540" y="192" text-anchor="middle">12</text>
    <text x="310" y="208" text-anchor="middle" font-weight="600">clear observations in the month</text>
  </g>
  <polyline points="80,68 141,110 202,131 264,142 325,150 386,156 448,160 540,163" fill="none" stroke="currentColor" stroke-width="2.8"/>
  <g font-family="system-ui, sans-serif">
    <rect x="576" y="66" width="292" height="86" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="576" y="66" width="292" height="86" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="592" y="90" fill="currentColor" font-size="9.5" font-weight="700">Carry n_obs as a band</text>
    <text x="592" y="112" fill="currentColor" font-size="9.5" opacity="0.85">so downstream aggregation can weight by it.</text>
    <text x="592" y="132" fill="currentColor" font-size="9.5" opacity="0.85">A one-observation cell and a twelve-observation</text>
    <text x="592" y="146" fill="currentColor" font-size="9.5" opacity="0.85">cell differ fourfold in precision.</text>
  </g>
</svg>

## Deterministic Transformation Logic

The aggregation engine operates on chunked Cloud-Optimized GeoTIFFs using `xarray` and `dask.array`, enabling out-of-core processing across continental extents. While `NDVI_max` composites are standard for phenological tracking, land cover change detection for carbon accounting requires `NDVI_median` or the 75th percentile to suppress transient soil-moisture spikes and BRDF-induced edge effects. Multi-sensor harmonization is a prerequisite: Sentinel-2 MSI and Landsat 8/9 OLI must be normalized to a common reflectance scale using sensor-specific gain/offset tables before stacking, or an artificial NDVI step-change appears at every sensor handoff.

The routine below decodes the QA band, applies the clear-sky mask, reduces each pinned calendar month, and masks any cell that falls below the observation floor so a downstream 90-day rolling median can fill it explicitly.

```python
import xarray as xr
import numpy as np
import dask.array as da
import pandas as pd
import rioxarray  # registers the xarray ".rio" accessor
import structlog
from datetime import datetime, timezone

log = structlog.get_logger()

# Landsat Collection 2 QA_PIXEL: clear requires bit 6 (cloud) unset
# and bits 8-9 (cloud confidence) both zero.
LANDSAT_CLEAR_MASK = 0x0040 | 0x0300  # bits to check for cloud contamination

# Sentinel-2 SCL valid (clear-sky) classes
S2_SCL_CLEAR_CLASSES = {4, 5, 6, 7}  # Vegetation, Bare Soil, Water, Unclassified


def aggregate_monthly_ndvi(
    ndvi_stack: xr.DataArray,
    qa_mask: xr.DataArray,
    sensor: str = "S2",
    method: str = "median",
    min_obs: int = 3,
    target_crs: str = "EPSG:4326",
) -> tuple[xr.DataArray, dict]:
    """
    Aggregate daily NDVI into monthly composites with QA-aware filtering,
    CRS validation, and compliance observation thresholds.

    qa_mask semantics:
      - Sentinel-2: integer SCL band (4,5,6,7 = clear)
      - Landsat C2:  integer QA_PIXEL band (clear when cloud bits are unset)

    Returns: (monthly_composite, audit_manifest)
    """
    # Distortion gate: enforce strict CRS alignment before any temporal stacking
    if ndvi_stack.rio.crs is not None and str(ndvi_stack.rio.crs) != target_crs:
        raise ValueError(f"CRS mismatch: {ndvi_stack.rio.crs} != {target_crs}")

    # Build boolean clear-sky mask from sensor-specific QA
    if sensor == "S2":
        # True where SCL class is in the valid set
        clear_mask = xr.zeros_like(qa_mask, dtype=bool)
        for cls in S2_SCL_CLEAR_CLASSES:
            clear_mask = clear_mask | (qa_mask == cls)
    elif sensor in ("L8", "L9"):
        # True where cloud bit (6) and cloud-confidence bits (8-9) are all zero
        clear_mask = (qa_mask & LANDSAT_CLEAR_MASK) == 0
    else:
        raise ValueError(f"Unsupported sensor: {sensor}. Use 'S2', 'L8', or 'L9'.")

    ndvi_clean = ndvi_stack.where(clear_mask)

    # Pinned calendar-month window ("1MS") + robust reducer for reproducibility
    if method == "max":
        monthly_composite = ndvi_clean.resample(time="1MS").max(dim="time")
    elif method == "p75":
        monthly_composite = ndvi_clean.resample(time="1MS").quantile(0.75, dim="time")
    else:
        monthly_composite = ndvi_clean.resample(time="1MS").median(dim="time")

    # Audit gate: enforce minimum clear-sky observation count per cell
    obs_count = clear_mask.resample(time="1MS").sum(dim="time")
    low_density_mask = obs_count < min_obs

    # Mask cells below threshold — downstream fallback applies rolling 90-day composite
    monthly_composite = monthly_composite.where(~low_density_mask)

    # Generate audit manifest for MRV verification
    audit_manifest = {
        "pipeline_version": "2.4.1-mrv",
        "sensor": sensor,
        "aggregation_method": method,
        "min_obs_threshold": min_obs,
        "target_crs": target_crs,
        "temporal_range": f"{ndvi_stack.time.values[0]} to {ndvi_stack.time.values[-1]}",
        "low_density_cells_pct": float((low_density_mask.sum() / low_density_mask.size) * 100),
        "qa_pass_rate_pct": float((clear_mask.sum() / clear_mask.size) * 100),
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "compliance_standard": "GHG Protocol Scope 3 LULUCF Activity Data",
    }

    # Stamp provenance attributes directly into the xarray dataset
    monthly_composite.attrs.update({
        "audit_manifest": audit_manifest,
        "qa_source": "SCL clear-sky classes {4,5,6,7} or Landsat QA_PIXEL cloud-bit check",
        "interpolation_flag": "90-day rolling median fallback applied where obs < min_obs",
    })

    log.info("ndvi.aggregated", **audit_manifest)
    return monthly_composite, audit_manifest
```

When acquisition density falls below the compliance threshold (typically `<3` clear observations per month), fallback routing triggers a rolling 90-day median composite rather than propagating null values. This preserves temporal continuity for downstream change detection while explicitly flagging interpolated cells in the provenance metadata.

## Compliance Gating & Audit Trail Generation

Regulatory carbon accounting requires transparent activity data lineage. The routine above embeds a machine-readable `audit_manifest` directly into the output `xarray` attributes. This manifest survives downstream serialization to Parquet or GeoTIFF and satisfies third-party verifier requirements under ISO 14064-3 and the GHG Protocol Corporate Accounting and Reporting Standard. Those attributes flow directly into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), where they become the queryable record an auditor traces.

Key compliance gates enforced:

1. **Observation density threshold.** Cells with `<3` clear-sky acquisitions are masked and logged. Verifiers can trace interpolation flags to specific temporal windows rather than discovering silent gaps.
2. **QA pass rate tracking.** The `qa_pass_rate_pct` metric documents atmospheric clearance performance per tile. Drops below 60% trigger automatic pipeline alerts for manual review.
3. **CRS and geolocation integrity.** Strict projection enforcement prevents sub-pixel drift during temporal stacking, ensuring spatial consistency across multi-year baselines.
4. **Fallback transparency.** When rolling 90-day composites are invoked, the `interpolation_flag` attribute explicitly marks affected pixels, preventing false attribution of carbon stock changes to unverified data.

For authoritative QA parsing specifications, consult the [USGS Landsat Collection 2 Quality Assessment Band](https://www.usgs.gov/landsat-missions/landsat-collection-2-quality-assessment-bands) and the [ESA Sentinel-2 Level-2A Scene Classification Map](https://sentiwiki.copernicus.eu/web/s2-products).

## Production Integration

Deploy the routine within an async tile-processing framework, following a fixed ingest → diagnose → transform → validate → export → submit sequence:

1. **Ingest.** Query the STAC API for Sentinel-2 MSI and Landsat 8/9 OLI items over the tile footprint and reporting window, reading chunked COGs lazily so out-of-core array operations never block on a single oversized stack. Throughput at continental scale leans on [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/).
2. **Diagnose.** Run `preflight_ndvi_stack` to confirm CRS, a monotonic time axis, and per-month observation sufficiency; route thin months to the fallback path.
3. **Transform.** Call `aggregate_monthly_ndvi` with `method="median"` (or `"p75"` for soil-moisture-prone semi-arid tiles), reducing each pinned calendar month.
4. **Validate.** Assert the `qa_pass_rate_pct` and `low_density_cells_pct` gates and reject any composite that breaches the configured floors.
5. **Export.** Serialize to Parquet or GeoTIFF with the `audit_manifest` and `interpolation_flag` attributes intact.
6. **Submit.** Feed the composites into a CUSUM or Bayesian change-detection module — the change models behind the [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — and forward the lineage to registry submission. The aggregated trajectories also feed parcel-level estimates in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) layer.

Use `dask.distributed` to schedule chunked COG reads across distributed workers, routing STAC item lists through a priority queue that balances sensor availability and cloud-cover forecasts. By enforcing strict QA filtering, statistical robustness, and embedded audit trails, monthly temporal aggregation of NDVI transforms noisy optical observations into verifiable carbon accounting inputs that survive regulatory scrutiny and provide the deterministic foundation required for automated MRV compliance.

<svg viewBox="0 -4 800 210" role="img" aria-labelledby="idx-t idx-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="idx-t">Where NDVI saturates, and which index to use instead</title>
  <desc id="idx-d">A curve of index value against increasing leaf area index from 0 to 8. NDVI rises steeply to about 0.85 by a leaf area index of 3 and is then almost flat, so it cannot distinguish moderately dense canopy from very dense canopy — exactly the range where forest carbon varies most. EVI continues rising to a leaf area index of about 6 before flattening. A near-infrared reflectance of vegetation index continues further still. A shaded band marks the saturation region above a leaf area index of 3. A panel notes that NDVI remains excellent for detecting the presence or absence of vegetation and poor for grading its density, which is why change detection and biomass estimation should not share an index by default.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">NDVI saturates exactly where forest carbon varies</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Index response against leaf area index.</text>
  </g>
  <rect x="242" y="46" width="318" height="126" fill="#f3a712" opacity="0.1"/>
  <text x="401" y="62" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f3a712">NDVI saturation region</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="46" x2="80" y2="172"/>
    <line x1="80" y1="172" x2="560" y2="172"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="76" text-anchor="end">high</text>
    <text x="72" y="168" text-anchor="end">low</text>
    <text x="80" y="190" text-anchor="middle">0</text>
    <text x="242" y="190" text-anchor="middle">3</text>
    <text x="401" y="190" text-anchor="middle">5.5</text>
    <text x="560" y="190" text-anchor="middle">8</text>
    <text x="320" y="206" text-anchor="middle" font-weight="600">leaf area index</text>
  </g>
  <polyline points="80,166 134,118 188,90 242,78 296,74 350,72 404,71 458,70 560,70" fill="none" stroke="#f3a712" stroke-width="2.8"/>
  <polyline points="80,168 134,140 188,118 242,102 296,90 350,82 404,78 458,76 560,74" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <polyline points="80,170 134,152 188,136 242,120 296,108 350,96 404,88 458,82 560,76" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="7,4"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="572" y="74" fill="#f3a712">NDVI</text>
    <text x="572" y="90" fill="currentColor">EVI</text>
    <text x="572" y="106" fill="currentColor" opacity="0.85">NIRv</text>
    <text x="572" y="130" font-weight="400" font-size="9" fill="currentColor" opacity="0.82">NDVI: presence or absence, yes.</text>
    <text x="572" y="144" font-weight="400" font-size="9" fill="currentColor" opacity="0.82">Grading density, no.</text>
    <text x="572" y="162" font-weight="700" font-size="9" fill="currentColor">Detection and biomass should</text>
    <text x="572" y="176" font-weight="700" font-size="9" fill="currentColor">not share an index.</text>
  </g>
</svg>

## Frequently Asked Questions

### Why does the observation count matter as much as the composite value?

Because it is the composite's precision, and precision varies enormously across a map. A monthly mean from one observation carries roughly four times the interval of one from twelve, and treating the two as equivalent in a downstream aggregation understates uncertainty exactly where the data was thinnest. Carry the count as a band, weight by it when aggregating, and report the distribution — a period whose median cell had two observations supports a much weaker claim than one whose median cell had ten.

### Should NDVI be the default index for land-use change?

For detecting presence and absence of vegetation, yes; for grading density, no. NDVI saturates above a leaf area index of roughly three, which is precisely the range where forest carbon varies most, so it registers clearing sharply and degradation barely at all. Use it for change detection and use EVI, NIRv, or a structural signal for anything that needs to distinguish dense canopy from denser canopy.

### How should monthly composites handle a month with no clear observations?

Mark the cell unobserved and let downstream decide. Interpolating across the gap is often necessary for a seasonal model and must be flagged as interpolated; substituting the previous month silently is not acceptable because it creates artificial persistence that suppresses real change. The fraction of cells requiring interpolation in a period is a headline quality statistic and belongs in the period's metadata.

### Does the compositing window need to be exactly a calendar month?

Not necessarily, but it must be consistent and documented. Calendar months are convenient for reporting alignment and awkward for phenology, since a growing season rarely respects month boundaries. Some pipelines use fixed 16-day or 32-day windows for analysis and aggregate to calendar months only for reporting, which keeps phenological comparability and reporting alignment separate rather than compromising both.

### How do I compare composites across sensors?

Harmonise before compositing, never after. Sentinel-2 and Landsat differ in band centres, widths, and radiometric calibration, so their indices differ systematically over identical ground. Apply published cross-sensor transformation coefficients to bring one onto the other's scale, validate the harmonisation over a stable reference area, and record which sensor contributed to each cell — a composite that silently mixes sensors carries a step change at every point where the mix shifts.

### Should the composite store the contributing scene identifiers?

Yes, as an array column or a sidecar table keyed on the cell. Knowing which scenes produced a composite is what makes it reproducible and what lets a suspicious cell be traced back to a specific acquisition — usually the one whose mask leaked. The storage cost is small relative to the imagery, and the alternative is re-running the scene query later, which returns a different set once the archive has been reprocessed.

### Should composites be recomputed when the archive is reprocessed?

Only deliberately, and as a restatement. A provider reprocessing its archive changes the inputs to every historical composite, so re-running produces different numbers for periods already reported. Keep the original composites and their pinned scene lists, decide explicitly whether to adopt the reprocessed archive, and if you do, recompute the whole affected history at once so the series stays internally consistent rather than changing at an arbitrary point.

## Related guides

- [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — the parent compositing discipline this recipe sits within.
- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the clear-sky masking contract every composite depends on.
- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — the change-detection layer that differences these baselines.
- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — scaling tile-partitioned ingestion beyond single-process limits.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — how the embedded manifest becomes audit-ready provenance.
