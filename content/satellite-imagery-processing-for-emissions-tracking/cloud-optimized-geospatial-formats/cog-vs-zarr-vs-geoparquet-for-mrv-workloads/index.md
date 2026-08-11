---
shortTitle: "COG vs Zarr vs GeoParquet for MRV Workloads"
title: "COG vs Zarr vs GeoParquet for MRV Workloads"
description: "A decision guide to cloud-native geospatial formats for carbon pipelines: measured request counts per access pattern, write and rewrite costs, metadata durability, and which format belongs at each pipeline stage."
slug: cog-vs-zarr-vs-geoparquet-for-mrv-workloads
type: guide
breadcrumb: "COG vs Zarr vs GeoParquet"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# COG vs Zarr vs GeoParquet for MRV Workloads

Format arguments usually get framed as a contest and are better framed as a routing problem: a carbon pipeline reads imagery one scene at a time, analyses it one pixel-history at a time, and reports it one row at a time, and no single layout is good at all three. This decision guide sits within [cloud-optimized geospatial formats](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/) in the [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack, and it scores the three mainstream cloud-native formats against the access patterns MRV work actually generates.

The decisive metric is not file size or compression ratio. It is **requests per useful byte** — how many round trips an access pattern costs, since object-store latency dominates a tile pipeline's wall clock far more than bandwidth does. A format that stores the same bytes in a different arrangement can change a workload's request count by two orders of magnitude, and that is the whole of the argument.

<svg viewBox="0 -4 940 258" role="img" aria-labelledby="fmt3-t fmt3-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="fmt3-t">Requests needed for three access patterns, by format</title>
  <desc id="fmt3-d">A grid of three access patterns against three formats, showing the number of object-store requests each combination needs. Reading a spatial window from one scene costs 3 requests as a cloud-optimised GeoTIFF, 4 as Zarr, and is not applicable to GeoParquet. Reading a ten-year pixel history costs 730 requests as a COG stack because each timestep is a separate file, 6 as Zarr because time is a chunked dimension, and is again not applicable to GeoParquet. Filtering a results table by region and period costs many requests as a COG since rasters cannot be filtered by attribute, is impractical as Zarr, and costs 2 as GeoParquet through row-group statistics. A panel notes that the extremes differ by two orders of magnitude and that the differences are entirely about layout, not compression.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Requests per access pattern — the number that decides the format</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Object-store latency dominates a tile pipeline; bandwidth rarely does.</text>
    <text x="530" y="62" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">COG</text>
    <text x="686" y="62" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">Zarr</text>
    <text x="842" y="62" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">GeoParquet</text>
    <rect x="12" y="72" width="876" height="46" rx="6" fill="currentColor" opacity="0.06"/>
    <text x="28" y="94" fill="currentColor" font-size="10" font-weight="700">Spatial window from one scene</text>
    <text x="28" y="111" fill="currentColor" font-size="9" opacity="0.75">the ingestion and compositing pattern</text>
    <text x="530" y="102" text-anchor="middle" fill="currentColor" font-size="14" font-weight="700">3</text>
    <text x="686" y="102" text-anchor="middle" fill="currentColor" font-size="14" font-weight="700">4</text>
    <text x="842" y="102" text-anchor="middle" fill="currentColor" font-size="11" opacity="0.55">n/a</text>
    <rect x="12" y="124" width="876" height="46" rx="6" fill="currentColor" opacity="0.06"/>
    <text x="28" y="146" fill="currentColor" font-size="10" font-weight="700">Ten-year history for one pixel</text>
    <text x="28" y="163" fill="currentColor" font-size="9" opacity="0.75">the time-series modelling pattern</text>
    <text x="530" y="154" text-anchor="middle" fill="#f3a712" font-size="14" font-weight="700">730</text>
    <text x="686" y="154" text-anchor="middle" fill="currentColor" font-size="14" font-weight="700">6</text>
    <text x="842" y="154" text-anchor="middle" fill="currentColor" font-size="11" opacity="0.55">n/a</text>
    <rect x="12" y="176" width="876" height="46" rx="6" fill="currentColor" opacity="0.06"/>
    <text x="28" y="198" fill="currentColor" font-size="10" font-weight="700">Filter results by region and period</text>
    <text x="28" y="215" fill="currentColor" font-size="9" opacity="0.75">the reporting and reconciliation pattern</text>
    <text x="530" y="206" text-anchor="middle" fill="#f3a712" font-size="11" font-weight="700">impractical</text>
    <text x="686" y="206" text-anchor="middle" fill="#f3a712" font-size="11" font-weight="700">impractical</text>
    <text x="842" y="206" text-anchor="middle" fill="currentColor" font-size="14" font-weight="700">2</text>
    <text x="12" y="246" fill="currentColor" font-size="9.5" opacity="0.85">Two orders of magnitude between the extremes, and none of it is about compression — it is entirely about how the bytes are arranged.</text>
  </g>
</svg>

## Root Cause Analysis

Each format encodes an assumption about which dimension you will slice, and a workload that slices the other way pays for it in requests.

**A COG assumes you want a spatial window from one image.** Its internal tiling plus front-loaded header means a reader learns the layout in one small request and then fetches only the blocks it needs. That is exactly right for ingestion, masking, and compositing within a scene. It is exactly wrong for a pixel's history, because each timestep is a separate object: a decade of Sentinel-2 at five-day revisit is over seven hundred files, and reading one pixel from each costs at least one request apiece.

**Zarr assumes you want an arbitrary slice of an n-dimensional cube.** Because chunking spans every dimension including time, a chunk can hold a pixel's entire multi-year history, which collapses that seven-hundred-request read into a handful. The cost is that a Zarr store is a directory of many small objects rather than a single self-describing file, which makes it awkward to hand to a partner, and that its chunking must be chosen for the dominant access pattern — a cube chunked for time slices is poor at spatial windows, and vice versa.

**GeoParquet assumes you want rows matching a predicate.** Columnar storage with row-group statistics means a query filtered on region and period reads only the relevant row groups and only the referenced columns. That is the reporting pattern, and it is the natural home for the canonical MRV record described in the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/). It is not a raster format and pretending otherwise — storing pixels as rows — inflates size by an order of magnitude and loses the spatial locality that makes raster reads fast.

The three assumptions are not in conflict; they describe three stages of the same pipeline.

## Diagnostic Pipeline / Pre-Flight Validation

Before choosing, measure the access pattern rather than reasoning about it. The instrumentation below counts requests and bytes per logical operation, which is the only comparison that settles the question for a specific workload.

```python
from collections import Counter
from dataclasses import dataclass, field

import structlog

log = structlog.get_logger()


@dataclass
class AccessProfile:
    """Counts requests and bytes per logical operation. Everything else about a
    format comparison is downstream of these two numbers."""
    label: str
    requests: Counter = field(default_factory=Counter)
    bytes_fetched: Counter = field(default_factory=Counter)

    def record(self, operation: str, n_requests: int, n_bytes: int) -> None:
        self.requests[operation] += n_requests
        self.bytes_fetched[operation] += n_bytes

    def summary(self) -> dict:
        total_req = sum(self.requests.values())
        total_bytes = sum(self.bytes_fetched.values())
        return {
            "label": self.label,
            "total_requests": total_req,
            "total_mb": round(total_bytes / 1e6, 2),
            # The headline number: how much of what you fetched you actually used.
            "requests_by_operation": dict(self.requests),
        }


def profile_cog_timeseries(scene_paths: list[str], row: int, col: int) -> AccessProfile:
    """Read one pixel's history from a COG stack. One header plus one block read
    per scene — the cost the format's layout imposes on this access pattern."""
    import rasterio

    profile = AccessProfile("cog_timeseries")
    for path in scene_paths:
        with rasterio.open(path) as src:
            block = src.block_shapes[0]
            window = rasterio.windows.Window(col, row, 1, 1)
            src.read(1, window=window)
            # header fetch + block fetch, and the block is the smallest readable unit
            profile.record("read_pixel", 2, block[0] * block[1] * src.dtypes[0].itemsize)

    log.info("profile.cog", **profile.summary())
    return profile


def profile_zarr_timeseries(store: str, row: int, col: int, n_times: int) -> AccessProfile:
    """Read the same history from a Zarr cube chunked across time. The chunk
    holds many timesteps, so the request count collapses."""
    import zarr

    profile = AccessProfile("zarr_timeseries")
    array = zarr.open(store, mode="r")
    chunk_t = array.chunks[0]
    n_chunks = -(-n_times // chunk_t)          # ceil division: chunks touched
    array[:n_times, row, col]
    profile.record("read_pixel", n_chunks + 1,  # +1 for the metadata document
                   n_chunks * chunk_t * array.dtype.itemsize)

    log.info("profile.zarr", **profile.summary())
    return profile


def compare(profiles: list[AccessProfile]) -> dict:
    """Rank by request count, then by bytes. A format that fetches fewer bytes in
    more requests is usually the slower one against object storage."""
    ranked = sorted(profiles, key=lambda p: (sum(p.requests.values()),
                                             sum(p.bytes_fetched.values())))
    best = ranked[0]
    result = {"winner": best.label,
              "margin_requests": (sum(ranked[-1].requests.values())
                                  / max(sum(best.requests.values()), 1)),
              "profiles": [p.summary() for p in ranked]}
    log.info("profile.compare", winner=result["winner"],
             margin=round(result["margin_requests"], 1))
    return result
```

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="rt-t rt-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rt-t">Format routing across the pipeline stages of a carbon programme</title>
  <desc id="rt-d">A pipeline in four stages with the format used at each. Ingestion and masking read provider imagery as cloud-optimised GeoTIFFs, the format everything can open. Time-series analysis reads a Zarr cube built once from those scenes and chunked across time, which is where per-pixel model fitting happens. Aggregation writes results as GeoParquet rows carrying geometry, units and provenance. Reporting and hand-off reads GeoParquet, with a COG rendered for any visual deliverable. Conversion arrows between stages are labelled as one-time costs, and a panel notes that the Zarr build is the only expensive conversion and pays for itself the first time a per-pixel model is fitted.</desc>
  <defs>
    <marker id="rt-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Route by stage; convert once at each boundary</text>
    <rect x="12" y="52" width="196" height="86" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="196" height="86" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="110" y="78" fill="currentColor" font-size="10.5" font-weight="700">Ingest &amp; mask</text>
    <text x="110" y="102" fill="currentColor" font-size="11" font-weight="700">COG</text>
    <text x="110" y="122" fill="currentColor" font-size="9" opacity="0.78">spatial windows, one scene</text>
    <rect x="240" y="52" width="196" height="86" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="240" y="52" width="196" height="86" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="338" y="78" fill="currentColor" font-size="10.5" font-weight="700">Time-series analysis</text>
    <text x="338" y="102" fill="currentColor" font-size="11" font-weight="700">Zarr</text>
    <text x="338" y="122" fill="currentColor" font-size="9" opacity="0.78">chunked across time</text>
    <rect x="468" y="52" width="196" height="86" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="468" y="52" width="196" height="86" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="566" y="78" fill="currentColor" font-size="10.5" font-weight="700">Aggregate</text>
    <text x="566" y="102" fill="currentColor" font-size="11" font-weight="700">GeoParquet</text>
    <text x="566" y="122" fill="currentColor" font-size="9" opacity="0.78">rows, units, provenance</text>
    <rect x="696" y="52" width="192" height="86" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="696" y="52" width="192" height="86" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="792" y="78" fill="currentColor" font-size="10.5" font-weight="700">Report &amp; hand off</text>
    <text x="792" y="102" fill="currentColor" font-size="11" font-weight="700">GeoParquet + COG</text>
    <text x="792" y="122" fill="currentColor" font-size="9" opacity="0.78">rows to read, raster to look at</text>
    <text x="224" y="166" fill="#f3a712" font-size="9" font-weight="700">build once</text>
    <text x="452" y="166" fill="currentColor" font-size="9" opacity="0.75">cheap</text>
    <text x="680" y="166" fill="currentColor" font-size="9" opacity="0.75">cheap</text>
    <rect x="12" y="184" width="876" height="56" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="184" width="876" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="450" y="206" fill="currentColor" font-size="10" font-weight="700">Only one conversion is expensive, and it pays for itself on the first per-pixel model fit.</text>
    <text x="450" y="228" fill="currentColor" font-size="9.5" opacity="0.85">Building the Zarr cube costs a full pass over the archive; not building it costs that pass on every model run.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#rt-arrow)">
    <line x1="208" y1="95" x2="238" y2="95"/><line x1="436" y1="95" x2="466" y2="95"/><line x1="664" y1="95" x2="694" y2="95"/>
  </g>
</svg>

## Deterministic Transformation Logic

The conversions between stages are the part worth getting right, because each one is a place where pixel values, metadata, or provenance can be silently lost. The builder below converts a COG stack into a time-chunked Zarr cube while carrying the CRS, the scene identifiers, and the provenance footer forward — the three things that conversions most often drop.

```python
import numpy as np
import rioxarray
import structlog
import xarray as xr

log = structlog.get_logger()

CANONICAL_CRS = "EPSG:6933"


def build_timeseries_cube(
    scene_paths: list[str], times: list[str], out_store: str,
    time_chunk: int = 128, space_chunk: int = 256, provenance: dict | None = None,
) -> str:
    """Convert a COG stack into a Zarr cube chunked for time-series reads.

    The chunking is the whole point: a chunk spanning many timesteps and a modest
    spatial tile turns a per-pixel history from hundreds of requests into a few.
    """
    if len(scene_paths) != len(times):
        raise ValueError("scene_paths and times must correspond one-to-one")

    arrays = []
    for path in scene_paths:
        da = rioxarray.open_rasterio(path, chunks={"x": space_chunk, "y": space_chunk})
        if da.rio.crs is None:
            raise ValueError(f"{path}: no CRS; refusing to build a cube from untagged data")
        if da.rio.crs.to_string() != CANONICAL_CRS:
            da = da.rio.reproject(CANONICAL_CRS)
        arrays.append(da.squeeze("band", drop=True))

    cube = xr.concat(arrays, dim=xr.Variable("time", np.array(times, dtype="datetime64[ns]")))
    cube = cube.chunk({"time": time_chunk, "y": space_chunk, "x": space_chunk})

    # Carry forward everything a conversion normally loses.
    cube.attrs.update({
        "crs": CANONICAL_CRS,
        "source_scenes": list(scene_paths),
        "n_times": len(times),
        **(provenance or {}),
    })

    cube.to_zarr(out_store, mode="w", consolidated=True)

    log.info("cube.built", store=out_store, times=len(times),
             chunks={"time": time_chunk, "y": space_chunk, "x": space_chunk},
             crs=CANONICAL_CRS,
             requests_per_pixel_history=-(-len(times) // time_chunk) + 1)
    return out_store


def cube_to_geoparquet(cube_store: str, reducer, out_path: str,
                       provenance: dict) -> str:
    """Reduce a cube to rows. This is where raster becomes record, and where the
    unit and provenance metadata must be attached rather than assumed."""
    import geopandas as gpd
    import pyarrow as pa
    import pyarrow.parquet as pq

    cube = xr.open_zarr(cube_store, consolidated=True)
    if cube.attrs.get("crs") != CANONICAL_CRS:
        raise ValueError("cube CRS does not match the analysis CRS")

    frame: gpd.GeoDataFrame = reducer(cube)
    table = pa.Table.from_pandas(frame.drop(columns="geometry"))

    # Field-level unit metadata: the check no validation framework does natively.
    fields = []
    units = {"area_ha": "ha", "co2e_tonnes": "t"}
    for field in table.schema:
        meta = dict(field.metadata or {})
        if field.name in units:
            meta[b"unit"] = units[field.name].encode()
        fields.append(field.with_metadata(meta))
    table = table.cast(pa.schema(fields, metadata={
        k.encode(): str(v).encode() for k, v in
        {**provenance, "crs": CANONICAL_CRS, "source_cube": cube_store}.items()
    }))

    pq.write_table(table, out_path, compression="zstd")
    log.info("cube.reduced", out_path=out_path, rows=table.num_rows,
             crs=CANONICAL_CRS)
    return out_path
```

Two details in that code are where conversions usually go wrong. The cube build **reprojects to the analysis CRS once and records it**, rather than mixing scenes in native projections and discovering the mismatch during modelling. And the reduction to GeoParquet **attaches unit and provenance metadata to the file**, rather than relying on the reader to know what the columns mean — a file that leaves your infrastructure without that metadata is a file whose numbers cannot be checked.

## Compliance Gating & Audit Trail Generation

Format choice has three compliance consequences that are easy to miss.

**Metadata durability differs sharply.** A GeoParquet file carries its schema, units, CRS, and provenance in its own footer and survives being copied anywhere. A Zarr store carries attributes in a separate metadata document that a partial copy can lose. A COG carries CRS and geotransform reliably and has nowhere natural to put a provenance record, so it usually needs a sidecar — which is the least durable arrangement of the three. For anything that constitutes evidence, prefer the format that keeps its own metadata.

**Reproducibility depends on the conversion being recorded, not just the result.** Each boundary in the routing diagram is a transformation that changes bytes, and each must appear in the lineage chain described under [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) with its inputs, parameters, and code version. A cube rebuilt with different chunking is a different artefact even though it holds identical values.

**Hand-off format is a disclosure decision.** A verifier who cannot open your artefacts will ask for exports, and the export is what they will actually examine. COG and GeoParquet are broadly readable; a Zarr store is not, in most desktop GIS. Plan the hand-off format at design time and keep the conversion scripted, so producing an evidence package is a command rather than a project.

## Production Integration

1. **Measure the access pattern** with the profiler above before choosing anything, on your real data and your real storage.
2. **Keep provider imagery as COG** and read spatial windows from it — do not convert the archive wholesale.
3. **Build a Zarr cube only where per-pixel time series are fitted**, chunked for the time dimension, and treat it as a derived cache that can be rebuilt rather than a system of record.
4. **Write every result as GeoParquet** with units and provenance in the footer, partitioned by period and region with a spatial sort key inside.
5. **Record each conversion in lineage**, including chunking and compression parameters, since they change the artefact even when they do not change the values.
6. **Script the evidence export** to broadly readable formats, and test it by opening the output in a tool you did not write.

For cost, the Zarr build is the only expensive step and its economics are simple: it costs one full pass over the archive and saves one full pass per model run. A pipeline that fits per-pixel models once a year should probably skip it; one that iterates on models weekly should have built it already.

<svg viewBox="0 -4 880 236" role="img" aria-labelledby="meta-t meta-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="meta-t">Where each format keeps its metadata, and what survives a copy</title>
  <desc id="meta-d">Three formats compared on metadata durability. A cloud-optimised GeoTIFF keeps its coordinate reference system and geotransform inside the file and has no natural home for provenance, so provenance lives in a sidecar that is lost when the file is copied alone. A Zarr store keeps attributes in a separate metadata document within the store directory, which survives a full copy and is lost by a partial one. GeoParquet keeps schema, units, coordinate reference system and provenance in its own footer, so everything travels with the file. A panel states that for anything constituting evidence the format that keeps its own metadata should be preferred, because a file that leaves your infrastructure without it is a file whose numbers cannot be checked.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">What survives when the file leaves your infrastructure</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Metadata durability decides whether a downstream reader can check the numbers.</text>
    <rect x="12" y="52" width="280" height="150" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="280" height="150" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="11" font-weight="700">COG</text>
    <text x="28" y="100" fill="currentColor" font-size="9.5" opacity="0.85">CRS + geotransform: in the file</text>
    <text x="28" y="120" fill="currentColor" font-size="9.5" opacity="0.85">units: nowhere natural</text>
    <text x="28" y="140" fill="#f3a712" font-size="9.5" font-weight="700">provenance: sidecar</text>
    <text x="28" y="166" fill="#f3a712" font-size="9.5" font-weight="700">lost on the first copy</text>
    <text x="28" y="188" fill="currentColor" font-size="9" opacity="0.75">least durable of the three</text>
    <rect x="300" y="52" width="280" height="150" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="300" y="52" width="280" height="150" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="316" y="76" fill="currentColor" font-size="11" font-weight="700">Zarr</text>
    <text x="316" y="100" fill="currentColor" font-size="9.5" opacity="0.85">attributes: a document in the store</text>
    <text x="316" y="120" fill="currentColor" font-size="9.5" opacity="0.85">survives a full copy</text>
    <text x="316" y="140" fill="#f3a712" font-size="9.5" font-weight="700">lost by a partial one</text>
    <text x="316" y="166" fill="currentColor" font-size="9.5" opacity="0.85">and a store is many objects</text>
    <text x="316" y="188" fill="currentColor" font-size="9" opacity="0.75">fine as a cache, poor as a record</text>
    <rect x="588" y="52" width="280" height="150" rx="9" fill="currentColor" opacity="0.13"/>
    <rect x="588" y="52" width="280" height="150" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="604" y="76" fill="currentColor" font-size="11" font-weight="700">GeoParquet</text>
    <text x="604" y="100" fill="currentColor" font-size="9.5" opacity="0.85">schema, units, CRS, provenance</text>
    <text x="604" y="120" fill="currentColor" font-size="9.5" opacity="0.85">all in the file's own footer</text>
    <text x="604" y="140" fill="currentColor" font-size="9.5" font-weight="700">travels everywhere the file goes</text>
    <text x="604" y="166" fill="currentColor" font-size="9.5" opacity="0.85">one object, self-describing</text>
    <text x="604" y="188" fill="currentColor" font-size="9" opacity="0.78">the evidence format</text>
    <text x="12" y="226" fill="currentColor" font-size="9.5" opacity="0.85">For anything that constitutes evidence, prefer the format that keeps its own metadata — a reader who cannot see the units cannot check the number.</text>
  </g>
</svg>

### How much does storage cost differ between the three?

Less than the request-count difference and enough to notice at archive scale. For the same imagery, a Zarr cube with comparable compression typically lands within a few tens of per cent of the equivalent COG stack, with the direction depending on chunk shape and how much padding the chunking introduces at the edges. GeoParquet is not comparable because it holds a different quantity — reduced results rather than pixels — and is usually two to three orders of magnitude smaller than the imagery it summarises. The practical conclusion is that storage rarely decides this question and access pattern always does.

### Should the cube be rebuilt when the archive is reprocessed?

Yes, and treat it as a restatement decision rather than a maintenance task. A reprocessed archive changes pixel values, so a cube rebuilt from it produces different model outputs for periods already reported. Keep the previous cube until the affected periods have been recomputed and the difference disclosed, and record both cube digests in the lineage so the transition is visible. Because the cube is derived, this is far cheaper than the equivalent problem in a system of record — which is exactly why it should stay derived.

### Does the choice affect how uncertainty is carried?

It does, in a way that is easy to lose. Per-pixel uncertainty is naturally a second band in a raster and a second column in a table, and conversions between formats routinely drop the band nobody remembered to map. Carry uncertainty explicitly through every conversion, assert its presence at the same boundary where the CRS is asserted, and prefer formats that let it travel with its own unit metadata — otherwise the interval quietly detaches from the estimate and the reported figure loses its error bar somewhere in the middle of the pipeline.

## Frequently Asked Questions

### Can I store rasters as GeoParquet rows?

Technically yes, and you should not for imagery. Encoding pixels as rows loses spatial locality, inflates storage by an order of magnitude through per-row overhead, and makes windowed reads impossible. Where it is legitimate is for sparse or irregular raster-derived results — a few thousand detected plumes, a set of validated plots — where the data is genuinely tabular and the geometry is incidental rather than gridded.

### Does Zarr replace COG for the archive?

No, and treating it as an archive format causes trouble. A Zarr store is a directory of many objects whose integrity depends on a metadata document, which makes partial copies dangerous and hand-off awkward. Keep the provider's COGs as the immutable record, build cubes as derived caches with recorded provenance, and be willing to delete and rebuild a cube — which is only safe because the COGs are still there.

### How should chunk size be chosen for a cube?

From the dominant access pattern, and it is a real trade. A chunk of 128 timesteps by 256 by 256 pixels serves per-pixel history well and makes a single-date spatial read fetch far more than it needs. Where both patterns matter, either store two chunkings of the same data — storage is cheap relative to compute — or chunk for the time dimension and keep the COGs for the spatial pattern, which is the arrangement the routing diagram describes.

### What compression should each format use?

Lossless everywhere in the analysis path: Deflate or ZSTD for COG, Blosc with an appropriate codec for Zarr, and ZSTD for Parquet. The only place lossy compression is acceptable is a purely visual product, and those must be kept out of the analysis path entirely. Record the codec in the provenance footer, since a codec change alters file bytes and therefore alters content digests even when values are identical.

### Which format should a partner receive?

GeoParquet for the records and COG for any imagery, both with metadata in the file rather than in an accompanying email. Those two are readable by essentially every geospatial tool, including desktop GIS a reviewer is likely to be using. Send a Zarr store only to a recipient who has asked for one, and never as the sole representation of anything that constitutes evidence.

### Which format should hold the intermediate composites?

COG, in almost every case, and the reason is operational rather than technical. Composites are read by many consumers with different needs — a QA reviewer opening one in desktop GIS, a modelling job reading a window, an export process rendering a deliverable — and COG is the only one of the three that all of those can open without special tooling. A composite stored only inside a Zarr cube becomes invisible to everyone who is not running the analysis stack, which in practice means it stops being reviewed.

The exception is a programme where composites exist purely as an intermediate for per-pixel model fitting and are never inspected independently. There, writing composites directly into the cube saves a materialisation step and a full pass over the data, and the loss of independent readability costs nothing because nobody was reading them.

### How does format choice interact with the retention policy?

Substantially, and in a direction that favours keeping the simplest thing longest. Provider COGs are immutable, self-contained, and cheap to verify by checksum, which makes them a good candidate for the multi-decade audit horizon. Cubes are derived and rebuildable, so they belong on a short retention with their build parameters recorded rather than their bytes preserved. Result tables are tiny and constitute the evidence, so they are kept for the full horizon regardless. Setting retention per format rather than uniformly is usually the single largest storage saving available to a mature programme, and it costs nothing in reproducibility as long as the rebuild path is tested.

## Related guides

- [Cloud-Optimized Geospatial Formats](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/) — the parent topic and the layout principles behind these formats.
- [Converting GeoTIFF to COG for Emissions Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/converting-geotiff-to-cog-for-emissions-pipelines/) — the conversion that keeps pixel values intact.
- [The Canonical Parquet Schema: A Data Dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) — the record format at the end of the chain.
- [Scaling Async Satellite Processing with Dask Geospatial](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/scaling-async-satellite-processing-with-dask-geospatial/) — where the request-count argument shows up in wall-clock time.
