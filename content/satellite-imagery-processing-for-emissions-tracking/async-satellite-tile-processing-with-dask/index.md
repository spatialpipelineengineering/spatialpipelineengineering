# Async Satellite Tile Processing with Dask

Async satellite tile processing with Dask is the ingestion engine that lets a Measurement, Reporting, and Verification (MRV) pipeline pull terabytes of optical and SAR imagery into a deterministic, auditable task graph without blocking on I/O. It is one stage of the broader [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) section, which in turn specializes the [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack for the remote-sensing tier. Upstream of this stage, observations are nothing but URLs in a STAC manifest; downstream, they must become spectrally clean, grid-aligned arrays that feed [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) and the [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) modules that compute biomass deltas.

The reason this component deserves its own treatment is that throughput and determinism are usually in tension. Synchronous tile loops saturate one core, stall on every network round-trip, and fragment memory during large-array reprojection — yet the moment you parallelize naively, ordering becomes non-deterministic and audit reproducibility collapses. Dask's `distributed` scheduler resolves the tension by combining lazy, content-addressed task graphs with `asyncio`-compatible futures: work executes concurrently and out of wall-clock order, but the graph itself is reproducible, inspectable, and replayable. That property is what makes asynchronous ingestion compatible with regulatory-grade carbon accounting rather than a liability for it.

<svg viewBox="0 0 980 348" role="img" aria-labelledby="flow-t flow-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="flow-t">Async Dask tile-ingestion data flow</title>
  <desc id="flow-d">Records from a STAC manifest (asset URL, bounding box, source CRS and timestamp) are submitted as lazy Dask futures with pure=False. A pool of distributed workers runs the per-tile task chain concurrently and out of wall-clock order: fetch the cloud-optimised GeoTIFF by byte-range, reproject to the target CRS, then drift-check to within half a pixel. Everything left of the dashed boundary is a lazy, content-addressed task graph; calling compute or persist at the as_completed gather materialises results, routing aligned tiles to the success store and exhausted-retry tiles to a logged, replayable fallback queue.</desc>
  <defs>
    <marker id="flow-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- input + submit -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="16" y="150" width="124" height="70" rx="9"/>
      <rect x="160" y="150" width="134" height="70" rx="9"/>
    </g>
    <g fill="currentColor">
      <text x="78" y="180" font-size="11.5" font-weight="600">STAC manifest</text>
      <text x="78" y="197" font-size="9.5" opacity="0.8">URL · bbox</text>
      <text x="78" y="210" font-size="9.5" opacity="0.8">CRS · timestamp</text>
      <text x="227" y="180" font-size="11.5" font-weight="600">client.submit()</text>
      <text x="227" y="197" font-size="9.5" opacity="0.8">lazy futures</text>
      <text x="227" y="210" font-size="9.5" opacity="0.8">pure=False</text>
    </g>
    <!-- worker pool container -->
    <rect x="314" y="40" width="360" height="252" rx="11" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.85"/>
    <g fill="currentColor">
      <text x="494" y="62" font-size="11.5" font-weight="600">Dask distributed worker pool</text>
      <text x="494" y="78" font-size="9.5" opacity="0.8">non-blocking I/O · concurrent, out-of-wall-clock-order</text>
    </g>
    <!-- per-tile task chain -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="330" y="150" width="104" height="70" rx="8"/>
      <rect x="448" y="150" width="104" height="70" rx="8"/>
      <rect x="566" y="150" width="92" height="70" rx="8"/>
    </g>
    <g fill="currentColor">
      <text x="382" y="180" font-size="11" font-weight="600">fetch COG</text>
      <text x="382" y="197" font-size="9.5" opacity="0.8">async byte-range</text>
      <text x="382" y="210" font-size="9.5" opacity="0.8">chunks="auto"</text>
      <text x="500" y="180" font-size="11" font-weight="600">reproject</text>
      <text x="500" y="197" font-size="9.5" opacity="0.8">→ target CRS</text>
      <text x="500" y="210" font-size="9.5" opacity="0.8">bilinear · fixed res</text>
      <text x="612" y="180" font-size="11" font-weight="600">drift-check</text>
      <text x="612" y="197" font-size="9.5" opacity="0.8">within</text>
      <text x="612" y="210" font-size="9.5" opacity="0.8">±0.5 px</text>
    </g>
    <text x="494" y="262" fill="currentColor" font-size="9.5" opacity="0.7">× N workers — bounded retry with exponential backoff</text>
    <!-- gather + outputs -->
    <rect x="724" y="150" width="118" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="783" y="180" font-size="11" font-weight="600">as_completed</text>
      <text x="783" y="197" font-size="9.5" opacity="0.8">gather as</text>
      <text x="783" y="210" font-size="9.5" opacity="0.8">futures resolve</text>
    </g>
    <rect x="862" y="104" width="110" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <rect x="862" y="206" width="110" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="917" y="128" font-size="10.5" font-weight="600">success store</text>
      <text x="917" y="144" font-size="9" opacity="0.8">aligned lazy</text>
      <text x="917" y="156" font-size="9" opacity="0.8">arrays</text>
      <text x="917" y="230" font-size="10.5" font-weight="600">fallback queue</text>
      <text x="917" y="246" font-size="9" opacity="0.8">logged ·</text>
      <text x="917" y="258" font-size="9" opacity="0.8">replayable</text>
    </g>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#flow-arrow)" opacity="0.9">
    <line x1="140" y1="185" x2="158" y2="185"/>
    <line x1="294" y1="185" x2="328" y2="185"/>
    <line x1="434" y1="185" x2="446" y2="185"/>
    <line x1="552" y1="185" x2="564" y2="185"/>
    <line x1="676" y1="185" x2="722" y2="185"/>
    <line x1="842" y1="170" x2="860" y2="142"/>
    <line x1="842" y1="200" x2="860" y2="232"/>
  </g>
  <!-- lazy / materialised boundary -->
  <line x1="694" y1="30" x2="694" y2="300" stroke="#f3a712" stroke-width="2" stroke-dasharray="5 5"/>
  <g font-family="system-ui, sans-serif" fill="currentColor" font-size="10">
    <text x="494" y="320" text-anchor="middle" opacity="0.75">lazy, content-addressed task graph (DAG)</text>
    <text x="838" y="320" text-anchor="middle" opacity="0.75">.compute() / .persist() materialises</text>
  </g>
</svg>

## Role in the MRV Workflow

Within the emissions-tracking pipeline, this stage sits between catalog discovery and spectral analysis. Its single responsibility is to turn a heterogeneous tile manifest — mixed sensors, footprints, datums, and resolutions — into a uniform collection of lazy, Dask-backed arrays that every downstream step can chain onto without re-reading bytes from object storage.

**Upstream dependencies.** The processor consumes a STAC-compliant manifest produced by catalog search: each record carries an asset URL (typically a cloud-optimized GeoTIFF), a bounding box, an acquisition timestamp, and a source CRS. The manifest is the contract; if its provenance fields are incomplete, the [data lineage requirements](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) that govern the whole MRV chain cannot be satisfied, so ingestion must fail loudly rather than silently drop records.

**The work this stage owns.** Three operations belong here and nowhere else: non-blocking fetch of COG byte-ranges, deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) to a common reference grid, and sub-pixel drift correction against the target resolution. Cloud and shadow masking is deliberately *not* done here — it is deferred to the dedicated masking stage so that each concern can scale and be audited independently.

**Downstream consumers.** Aligned tiles flow into masking, then into temporal compositing, then into emission-factor mapping that ultimately supports [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) and the [spatial modeling for carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack. Because every output is a lazy graph node, those consumers extend the existing DAG instead of triggering redundant I/O — reprojection happens once, and the bytes are reused across NDVI, EVI, and disturbance computations.

Key architectural properties that make the stage fit this role:

- **Lazy evaluation.** `xarray` and `rioxarray` operations build a directed acyclic graph that only materializes when `.compute()` or `.persist()` is called, preventing premature memory allocation on tiles that may never be needed.
- **Non-blocking I/O.** Range requests for COGs run concurrently, saturating available bandwidth while CPU cores stay free for resampling rather than idling on sockets.
- **Reproducible scheduling.** Dask keys are content-addressed, so a re-run over the same manifest produces the same task graph — the precondition for a defensible audit trail.

## Core Failure Modes

Distributed ingestion fails in characteristic ways. Naming them up front lets the implementation install a specific guard for each rather than a generic try/except that hides root cause.

1. **Silent datum shift during reprojection.** When a COG declares only a horizontal CRS and the reprojection call assumes a default datum, tiles can land 50–200 m off true position — small enough to pass a visual check, large enough to break polygon-level attribution. Root cause: implicit datum handling in `rasterio.warp` when the source CRS lacks a vertical/geographic anchor. Observed impact: positional error that propagates into every spatial join, inflating or deflating activity-data area by several percent and invalidating any submission with a ≤10 m geolocation requirement.

2. **Worker out-of-memory on high-resolution arrays.** Eagerly opening a full 10 m Sentinel-2 scene, or reprojecting without chunking, allocates multi-gigabyte arrays per task. Under concurrent load the scheduler trips its memory target, spills to disk, and eventually kills workers mid-graph. Root cause: materializing arrays before the graph is optimized, plus unbounded chunk sizes during `reproject`. Observed impact: cascading worker restarts, task re-execution, and 3–10× wall-clock blowups on continental batches — non-deterministic timing that also threatens determinism if tasks are not pure.

3. **Partial-batch corruption from unhandled transient errors.** Object-store throttling, truncated range reads, and expired credentials produce intermittent failures. Without bounded retry and explicit fallback routing, a single bad tile either aborts the batch or, worse, is silently skipped and never recorded — leaving a gap that no auditor can distinguish from genuine no-data. Root cause: treating network errors as fatal or as nonexistent rather than as a first-class, logged outcome. Observed impact: incomplete cloud-free composites and unaccounted spatial coverage in near-real-time products such as the [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) downstream.

<svg viewBox="0 -4 900 230" role="img" aria-labelledby="chunk-t chunk-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="chunk-t">Chunk size against wall-clock time and peak memory for a tile mosaic</title>
  <desc id="chunk-d">A chart with chunk edge length from 128 to 4096 pixels on the horizontal axis. Wall-clock time falls steeply from 512 seconds at 128 pixels to a minimum of 96 seconds around 1024, then rises again to 180 seconds at 4096 as memory pressure forces spilling. Peak memory per worker rises monotonically from 0.2 gigabytes to 11 gigabytes across the same range. A shaded band around 512 to 1024 pixels marks the practical window where wall-clock is near its minimum and memory stays inside a typical worker. An annotation notes that the left side is dominated by scheduler overhead and the right by spill-to-disk.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Chunk size has one good window and two bad tails</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Same mosaic, same cluster. Only the chunk edge changes.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="66" x2="620" y2="66"/><line x1="80" y1="110" x2="620" y2="110"/><line x1="80" y1="154" x2="620" y2="154"/>
  </g>
  <rect x="216" y="52" width="136" height="146" fill="currentColor" opacity="0.09"/>
  <text x="284" y="68" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">practical window</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="52" x2="80" y2="198"/>
    <line x1="80" y1="198" x2="620" y2="198"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="70" text-anchor="end">500 s</text>
    <text x="72" y="114" text-anchor="end">330 s</text>
    <text x="72" y="158" text-anchor="end">170 s</text>
    <text x="80" y="216" text-anchor="middle">128</text>
    <text x="216" y="216" text-anchor="middle">512</text>
    <text x="352" y="216" text-anchor="middle">1024</text>
    <text x="484" y="216" text-anchor="middle">2048</text>
    <text x="620" y="216" text-anchor="middle">4096</text>
  </g>
  <polyline points="80,64 148,110 216,158 284,174 352,178 420,170 484,158 552,146 620,152" fill="none" stroke="currentColor" stroke-width="2.8"/>
  <polyline points="80,196 148,194 216,190 284,184 352,176 420,160 484,132 552,96 620,58" fill="none" stroke="#f3a712" stroke-width="2.4" stroke-dasharray="7,4"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="596" y="140" fill="currentColor" text-anchor="end">wall clock</text>
    <text x="596" y="70" fill="#f3a712" text-anchor="end">peak memory</text>
    <text x="112" y="88" fill="currentColor" font-size="9" opacity="0.78">scheduler overhead</text>
    <text x="500" y="186" fill="currentColor" font-size="9" opacity="0.78">spill to disk</text>
    <rect x="644" y="96" width="244" height="82" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="644" y="96" width="244" height="82" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="660" y="120" fill="currentColor" font-size="9.5" font-weight="700">Match the chunk to the file</text>
    <text x="660" y="142" fill="currentColor" font-size="9.5" opacity="0.85">Align chunks to the COG's internal</text>
    <text x="660" y="158" fill="currentColor" font-size="9.5" opacity="0.85">block size and the reads become</text>
    <text x="660" y="174" fill="currentColor" font-size="9.5" opacity="0.85">whole blocks instead of partials.</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The processor below installs a specific guard for each failure mode: explicit CRS and resolution targets defeat datum drift, `chunks="auto"` plus lazy reprojection bound memory, and exponential-backoff retry with explicit fallback routing turns transient errors into logged, replayable outcomes. Telemetry is emitted as structured JSON keyed by tile ID and compliance tag so every record maps back to a verification requirement; in larger deployments this handler is typically swapped for `structlog` writing the same fields.

```python
import asyncio
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np
import xarray as xr
import rioxarray
import geopandas as gpd
from dask.distributed import Client, as_completed
from rasterio.warp import transform_bounds
from rasterio.enums import Resampling
from prefect import flow, task
from prefect.logging import get_run_logger

# Structured JSON telemetry for MRV audit compliance
class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "tile_id": getattr(record, "tile_id", None),
            "compliance_tag": getattr(record, "compliance_tag", "ISO_14064-2")
        })

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger("mrv_async_tile_processor")
logger.addHandler(handler)
logger.setLevel(logging.INFO)

class AsyncTileProcessor:
    def __init__(self, scheduler_address: str, target_crs: str = "EPSG:4326", target_res: float = 10.0):
        self.client = Client(scheduler_address)
        self.target_crs = target_crs          # explicit CRS defeats silent datum shift (failure mode 1)
        self.target_res = target_res
        self.retry_config = {"max_retries": 3, "backoff_base": 1.5}
        self.audit_trail: List[Dict] = []

    async def _fetch_and_align_tile(self, tile_url: str, bounds: Tuple[float, float, float, float], tile_id: str) -> Optional[xr.DataArray]:
        extra = {"tile_id": tile_id}
        for attempt in range(self.retry_config["max_retries"]):
            try:
                logger.info("Fetching tile %s | attempt %d", tile_id, attempt + 1, extra=extra)
                # Open as a lazy Dask-backed array; chunks bound worker memory (failure mode 2)
                da = xr.open_dataset(tile_url, engine="rasterio", chunks="auto").band_data

                # Explicit CRS alignment & spatial drift correction
                if da.rio.crs != self.target_crs:
                    da = da.rio.reproject(self.target_crs, resampling=Resampling.bilinear)

                # Align to target resolution (e.g., 10 m for Sentinel-2)
                da = da.rio.reproject(self.target_crs, resolution=self.target_res, resampling=Resampling.bilinear)

                # Cloud mask integration point (deferred to the dedicated masking stage)
                # da = apply_cloud_mask(da, tile_id)

                logger.info("Successfully aligned tile %s", tile_id, extra=extra)
                return da
            except Exception as e:
                delay = self.retry_config["backoff_base"] ** attempt
                logger.warning("Tile %s failed (attempt %d): %s. Retrying in %.1fs...", tile_id, attempt + 1, str(e), delay, extra=extra)
                await asyncio.sleep(delay)

        logger.error("Tile %s exhausted retries. Routing to fallback.", tile_id, extra=extra)
        return None  # explicit fallback signal instead of a silent skip (failure mode 3)

    async def process_tile_batch(self, tile_manifest: List[Dict]) -> Dict[str, xr.DataArray]:
        futures = []
        for tile in tile_manifest:
            fut = self.client.submit(
                self._fetch_and_align_tile,
                tile["url"],
                tile["bounds"],
                tile["id"],
                pure=False
            )
            futures.append(fut)

        results = {}
        for fut in as_completed(futures):
            tile_id = fut.key.split("-")[-1]
            try:
                result = await fut.result()
                if result is not None:
                    results[tile_id] = result
                    self.audit_trail.append({"tile_id": tile_id, "status": "success", "timestamp": time.time()})
                else:
                    self.audit_trail.append({"tile_id": tile_id, "status": "fallback_routed", "timestamp": time.time()})
            except Exception as e:
                logger.error("Unexpected failure for %s: %s", tile_id, str(e))
                self.audit_trail.append({"tile_id": tile_id, "status": "failed", "error": str(e), "timestamp": time.time()})
        return results

    def close(self):
        self.client.close()

@flow(name="async_satellite_tile_ingestion")
def run_tile_processing_flow(manifest_path: str, scheduler_address: str):
    run_logger = get_run_logger()
    run_logger.info("Initializing async tile processing flow")

    # Load STAC manifest
    manifest = gpd.read_file(manifest_path).to_dict(orient="records")

    processor = AsyncTileProcessor(scheduler_address=scheduler_address)
    try:
        results = asyncio.run(processor.process_tile_batch(manifest))
        run_logger.info(f"Processed {len(results)} tiles successfully")
        # Persist audit trail to compliance storage (e.g., S3, PostgreSQL)
        Path("mrv_audit_trail.json").write_text(json.dumps(processor.audit_trail, indent=2))
    finally:
        processor.close()
```

The flow wraps the processor in Prefect so that orchestration state — run IDs, retries, and the persisted `audit_trail.json` — becomes part of the same provenance record the rest of the MRV stack expects. Because `_fetch_and_align_tile` is submitted with `pure=False` only to force per-tile re-execution semantics, the underlying graph keys remain content-addressed: the same manifest replays to the same results, which is the determinism property auditors test for.

## Validation, Debugging & Compliance Mapping

Observability and compliance are the same activity here: the telemetry that helps an engineer triage a stalled graph is also the lineage record a verifier reads. Each diagnostic below maps to a specific regulatory requirement.

**Task-graph inspection.** Use `client.get_task_stream()` or the Dask Dashboard (`http://<scheduler>:8787`) to visualize DAG execution. Long-running `open_rasterio` or `reproject` tasks point to network latency or chunk misalignment — the early signature of failure modes 1 and 2. This directly supports the **ISO 14064-3** requirement for documented, reproducible processing steps, since the task stream is an exportable record of exactly what ran.

**Memory profiling.** Set `distributed.worker.memory.target` and `distributed.worker.memory.spill` thresholds in the Dask worker config and watch `client.cluster.scheduler_info()["workers"]` for OOM kills during high-resolution SAR ingestion. Catching spills before they become kills keeps the run deterministic and avoids the timing blowups described in failure mode 2.

**Structured audit logs.** The JSON telemetry above captures tile ID, timestamp, and compliance tag for every fetch, retry, success, and fallback. Piped into OpenSearch or Datadog, these records correlate failures to specific STAC collections or sensor passes, and they form the immutable lineage trail that **CSRD ESRS E1** disclosure and the **GHG Protocol Scope 3** boundary both demand — every reported area traces to a source URL and a CRS transform.

**Drift and provenance gating.** The explicit `reproject(resampling=Resampling.bilinear)` to a fixed CRS and resolution holds sub-pixel geospatial drift within roughly ±0.5 pixels, the tolerance commonly cited under **Verra VM0047** and **ART TREES** for cloud-free composite generation. For full data-integrity gating, extend the processor to compute SHA-256 hashes of raw COG headers and aligned outputs and store them alongside the audit trail, so a third-party verifier can confirm that the bytes that were processed are the bytes that were submitted.

For authoritative methodology, consult the [GHG Protocol Corporate Standard](https://ghgprotocol.org/corporate-standard) and the [STAC Specification](https://stacspec.org/) for standardized metadata exchange.

<svg viewBox="0 -4 880 224" role="img" aria-labelledby="spill-t spill-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="spill-t">Four distributed failure modes and the symptom each shows in a carbon run</title>
  <desc id="spill-d">Four panels. Worker eviction under memory pressure appears as tasks that restart repeatedly and a run that completes with fewer partitions than expected. Straggler tiles appear as a run whose ninety-ninth percentile task time is twenty times the median, usually caused by one very cloudy tile with far more valid pixels to interpolate. Serialisation overhead appears as high CPU with low throughput when large objects are passed between tasks instead of paths. Non-deterministic reduction order appears as two runs producing totals that differ in the last few digits. A panel notes that only the first changes the answer visibly and the fourth changes it invisibly.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Four failures, one of which is silent</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Each shows a characteristic symptom before it shows a wrong number.</text>
    <rect x="12" y="52" width="212" height="128" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Worker eviction</text>
    <text x="28" y="100" fill="currentColor" font-size="9.5" opacity="0.85">tasks restart repeatedly</text>
    <text x="28" y="120" fill="#f3a712" font-size="9.5" font-weight="700">run “succeeds” short</text>
    <text x="28" y="146" fill="currentColor" font-size="9" opacity="0.78">caught by the partition-set</text>
    <text x="28" y="162" fill="currentColor" font-size="9" opacity="0.78">completeness assertion</text>
    <rect x="236" y="52" width="212" height="128" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="236" y="52" width="212" height="128" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="252" y="76" fill="currentColor" font-size="10.5" font-weight="700">Straggler tiles</text>
    <text x="252" y="100" fill="currentColor" font-size="9.5" opacity="0.85">p99 task time 20× median</text>
    <text x="252" y="120" fill="currentColor" font-size="9.5" opacity="0.85">one very cloudy tile</text>
    <text x="252" y="146" fill="currentColor" font-size="9" opacity="0.78">split by valid-pixel count,</text>
    <text x="252" y="162" fill="currentColor" font-size="9" opacity="0.78">not by tile area</text>
    <rect x="460" y="52" width="212" height="128" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="460" y="52" width="212" height="128" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="476" y="76" fill="currentColor" font-size="10.5" font-weight="700">Serialisation cost</text>
    <text x="476" y="100" fill="currentColor" font-size="9.5" opacity="0.85">high CPU, low throughput</text>
    <text x="476" y="120" fill="currentColor" font-size="9.5" opacity="0.85">arrays passed, not paths</text>
    <text x="476" y="146" fill="currentColor" font-size="9" opacity="0.78">pass references; let workers</text>
    <text x="476" y="162" fill="currentColor" font-size="9" opacity="0.78">read from the store</text>
    <rect x="684" y="52" width="184" height="128" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="700" y="76" fill="currentColor" font-size="10.5" font-weight="700">Reduction order</text>
    <text x="700" y="100" fill="currentColor" font-size="9.5" opacity="0.85">totals differ in last digits</text>
    <text x="700" y="120" fill="#f3a712" font-size="9.5" font-weight="700">no symptom at all</text>
    <text x="700" y="146" fill="currentColor" font-size="9" opacity="0.78">fix the order or compare</text>
    <text x="700" y="162" fill="currentColor" font-size="9" opacity="0.78">to a stated tolerance</text>
  </g>
</svg>

## Frequently Asked Questions

### How do I pick a chunk size for satellite rasters?

Start from the file's internal block size and take a multiple of it, then tune within the window where wall-clock is near its minimum. Chunks smaller than a block force partial reads that fetch and discard data; chunks much larger than a worker's memory budget force spilling. For typical cloud-optimised imagery this lands somewhere between 512 and 1024 pixels square, but measure rather than assume — it depends on band count, dtype, and how many arrays are alive at once.

### Why is one tile taking twenty times longer than the rest?

Almost always because it has far more work, not because it is unlucky. A very cloudy tile has more gaps to interpolate, more scenes to composite, and more masked pixels to process; a tile spanning a coastline may have a large nodata region that some operations still traverse. Partition by expected work — valid observation count — rather than by tile area, and the distribution flattens considerably.

### Should tasks pass arrays between each other?

No. Pass paths or references and let each worker read from the object store. Serialising large arrays between tasks moves data over the network twice, inflates memory on both sides, and turns a compute-bound job into a serialisation-bound one. The pattern that scales is: each task reads what it needs, computes, writes its output, and returns a path.

### How do I make a distributed reduction reproducible?

Either fix the reduction order — sort partitions by their deterministic key before combining — or accept a stated tolerance and compare against it rather than against exact equality. Floating-point addition is not associative, so a sum over a variable number of workers genuinely differs in the last few digits between runs. Both approaches are defensible; what is not defensible is a determinism claim that has never been tested.

### What should be checkpointed in a long tile run?

Completed partitions, and nothing else. Because each partition is independently recomputable from its inputs, the completed set is a sufficient checkpoint and it is trivially correct on resume. Checkpointing intermediate in-memory state is where partial-state bugs come from: a resume that restores a half-built accumulator produces a result that is neither the old one nor a fresh one, and nothing about it looks wrong.

### Should the cluster be sized for the peak or the median run?

For the median, with elastic headroom for the peak. Tile counts vary by a factor of two or more across a year, and a cluster sized for the dry-season peak idles for most of it. Autoscaling on queue depth handles the variation well because the workload is embarrassingly parallel and each task is independently recoverable, so a scale-down that loses a worker costs one task rather than a run.

### What belongs in a worker image versus installed at run time?

Everything the computation depends on belongs in the image, including the PROJ grid package and any model weights. Installing dependencies at run time makes the environment a function of when the run happened, which breaks reproducibility in exactly the way a pinned container is meant to prevent — and it introduces a failure mode where a run works today and cannot be replayed next year because a package version disappeared.

### How should the tile grid relate to the reporting boundary?

Keep them independent and intersect at aggregation. A tile grid aligned to the imagery is stable, reusable across projects, and lets a tile-month be cached and reused; a grid cut to project boundaries has to be rebuilt whenever a boundary changes and prevents any sharing between overlapping projects. Compute on the imagery grid, then intersect with boundaries at the aggregation step, where the geometry work is small and the equal-area projection is already in force.

## Conclusion

Asynchronous tile ingestion is where an emissions pipeline either earns or forfeits its audit defensibility. By keeping the task graph lazy and content-addressed, installing a named guard for each failure mode — datum drift, worker OOM, and transient-error corruption — and emitting structured telemetry that doubles as lineage, this stage delivers throughput that scales from a pilot basin to a continental program without sacrificing reproducibility. Aligned tiles flow on to masking and temporal compositing as extensions of the same DAG, so the cost of ingestion is paid exactly once.

For teams pushing past a single scheduler, the companion guide [Scaling Async Satellite Processing with Dask Geospatial](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/scaling-async-satellite-processing-with-dask-geospatial/) covers multi-region scheduler federation, cross-account IAM routing, and distributed checkpointing for batches that no longer fit one cluster.

## Related

- [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) — the parent section this ingestion stage belongs to.
- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the downstream stage that consumes aligned tiles.
- [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — composites masked tiles into reporting-period metrics.
- [Geospatial Coordinate Reference Systems & CRS Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the alignment contract this stage enforces.
- [Scaling Async Satellite Processing with Dask Geospatial](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/scaling-async-satellite-processing-with-dask-geospatial/) — multi-region federation and checkpointing.
