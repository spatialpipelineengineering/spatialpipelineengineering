---
shortTitle: "Scaling Async Satellite Processing with Dask Geospatial"
title: "Scaling Async Satellite Processing with Dask Geospatial"
description: "Production recipe for scaling async satellite tile processing with Dask: event-loop isolation, deterministic CRS alignment, lazy cloud masking, and audit-ready MRV lineage."
slug: scaling-async-satellite-processing-with-dask-geospatial
type: guide
breadcrumb: "Scaling Async Dask Satellite Processing"
datePublished: 2026-06-26
dateModified: 2026-06-26
---
# Scaling Async Satellite Processing with Dask Geospatial

Measurement, Reporting, and Verification (MRV) frameworks for Scope 3 land-use emissions and deforestation baselines require deterministic, auditable processing of multi-temporal optical and SAR archives. This guide is the task-level recipe under [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/), the distributed-ingestion sub-system within the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack. It shows how to scale async tile processing with Dask so that downstream [cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) and [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) inherit spatially aligned, reproducible rasters — covering event-loop isolation, deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/), bounded-memory lazy compute, and audit-ready [data lineage](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/).

Traditional synchronous raster workflows collapse at scale due to blocking I/O, unbounded memory allocation during cloud masking, and non-reproducible task graphs. The architectural intent here is singular: build a fault-tolerant, compliance-grade pipeline that ingests STAC catalogs, applies sensor-specific cloud masks, outputs spatially aligned emission proxies, and preserves full lineage for GHG Protocol and ISO 14064-2 audits.

<svg viewBox="0 0 650 712" role="img" aria-labelledby="pipe-t pipe-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="pipe-t">Async Dask tile-processing pipeline with two compliance gates</title>
  <desc id="pipe-d">A top-to-bottom flow: a STAC search resolves asset URLs, an async aiohttp range-read fetches each COG header, and the first decision gate checks that the CRS, dtype and bounds are valid. Invalid tiles branch right to a backoff-retry then fallback queue. Valid tiles pass to a synchronous windowed read on the Dask thread pool, a single deterministic reprojection to the target CRS, and a lazy QA60 or QA_PIXEL cloud mask. The second gate rejects any tile whose unmasked coverage falls below 65 percent, sending it to the same fallback queue; surviving tiles receive an audit hash and lineage and are exported to the temporal-aggregation stage.</desc>
  <defs>
    <marker id="pipe-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- connectors -->
    <g fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#pipe-arrow)">
      <path d="M230 78 V102"/>
      <path d="M230 152 V158"/>
      <path d="M230 252 V284"/>
      <path d="M230 340 V364"/>
      <path d="M230 420 V444"/>
      <path d="M230 500 V512"/>
      <path d="M230 606 V638"/>
      <path d="M308 206 H535 V346"/>
      <path d="M308 560 H535 V420"/>
    </g>
    <!-- yes / no labels -->
    <g fill="currentColor" font-size="9.5" font-weight="600">
      <text x="243" y="274">yes</text>
      <text x="243" y="628">yes</text>
      <text x="322" y="198" opacity="0.85">no</text>
      <text x="322" y="552" opacity="0.85">no</text>
    </g>
    <!-- process boxes -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="100" y="24" width="260" height="54" rx="9"/>
      <rect x="100" y="104" width="260" height="44" rx="9"/>
      <rect x="100" y="286" width="260" height="54" rx="9"/>
      <rect x="100" y="364" width="260" height="54" rx="9"/>
      <rect x="100" y="444" width="260" height="54" rx="9"/>
      <rect x="100" y="638" width="260" height="54" rx="9"/>
      <rect x="440" y="346" width="190" height="74" rx="9" stroke-dasharray="5 4"/>
    </g>
    <!-- decision diamonds -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M230 160 L308 206 L230 252 L152 206 Z"/>
      <path d="M230 514 L308 560 L230 606 L152 560 Z"/>
    </g>
    <!-- box labels -->
    <g fill="currentColor">
      <text x="230" y="47" font-size="12.5" font-weight="600">STAC search</text>
      <text x="230" y="64" font-size="9.5" opacity="0.8">collection · AOI · date range</text>
      <text x="230" y="127" font-size="12.5" font-weight="600">Async COG header fetch</text>
      <text x="230" y="144" font-size="9.5" opacity="0.8">aiohttp · byte-range reads</text>
      <text x="230" y="309" font-size="12.5" font-weight="600">Sync windowed read</text>
      <text x="230" y="326" font-size="9.5" opacity="0.8">Dask thread pool · event-loop safe</text>
      <text x="230" y="387" font-size="12.5" font-weight="600">Reproject → target CRS</text>
      <text x="230" y="404" font-size="9.5" opacity="0.8">deterministic resampling kernel</text>
      <text x="230" y="467" font-size="12.5" font-weight="600">Lazy cloud mask</text>
      <text x="230" y="484" font-size="9.5" opacity="0.8">QA60 · QA_PIXEL · stays in graph</text>
      <text x="230" y="661" font-size="12.5" font-weight="600">Audit hash + lineage</text>
      <text x="230" y="678" font-size="9.5" opacity="0.8">export → temporal stage</text>
    </g>
    <!-- diamond labels -->
    <g fill="currentColor">
      <text x="230" y="203" font-size="11" font-weight="600">Header valid?</text>
      <text x="230" y="219" font-size="9" opacity="0.8">CRS · dtype · bounds</text>
      <text x="230" y="557" font-size="11" font-weight="600">Coverage ≥ 65%?</text>
      <text x="230" y="573" font-size="9" opacity="0.8">MRV validity gate</text>
    </g>
    <!-- retry node label -->
    <g fill="currentColor">
      <text x="535" y="377" font-size="11.5" font-weight="600">Retry w/ backoff</text>
      <text x="535" y="394" font-size="9.5" opacity="0.8">then fallback queue</text>
    </g>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Scale async satellite tile processing with Dask geospatial",
  "description": "Build a distributed async satellite processing pipeline with Dask that isolates the event loop, enforces deterministic CRS alignment, applies lazy sensor-specific cloud masking, and emits audit-ready MRV lineage.",
  "totalTime": "PT45M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "dask.distributed" },
    { "@type": "HowToTool", "name": "rioxarray" },
    { "@type": "HowToTool", "name": "aiohttp" },
    { "@type": "HowToTool", "name": "xarray" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Validate tiles asynchronously", "text": "Fetch COG headers with async range reads and exponential backoff to detect malformed assets before compute." },
    { "@type": "HowToStep", "name": "Isolate the event loop", "text": "Offload blocking raster I/O to Dask's thread pool so async fetching never starves the event loop." },
    { "@type": "HowToStep", "name": "Reproject deterministically", "text": "Reproject every tile once to a unified target CRS with fixed resampling kernels for reproducible pixel values." },
    { "@type": "HowToStep", "name": "Mask lazily and gate", "text": "Apply chunk-wise QA-band cloud masks within the Dask graph and reject tiles below the coverage threshold." },
    { "@type": "HowToStep", "name": "Attach lineage and export", "text": "Hash the task graph and embed CRS, parameters, and provenance as immutable lineage before temporal aggregation." }
  ]
}
</script>

## Root Cause Analysis: Why Synchronous Raster Workflows Fail at Scale

Continental MRV workloads touch tens of thousands of tiles per acquisition cycle. A naive synchronous loop that opens each cloud-optimized GeoTIFF (COG), reads a window, reprojects, and masks in series fails for three structural reasons.

First, **blocking I/O dominates wall-clock time.** Each COG header and window read is a network round-trip to object storage; at ~150 ms latency per request, a 30,000-tile mosaic spends hours idle on the wire. Second, **unbounded memory allocation during masking** materializes full-resolution boolean arrays alongside reflectance bands, and a single worker holding several 10,980×10,980 Sentinel-2 tiles in RAM triggers out-of-memory kills that silently drop scenes. Third, **non-reproducible task graphs** — where reprojection order, resampling kernel, or chunk boundaries vary between runs — produce pixel values that differ run-to-run, which is disqualifying for an audit that must reproduce the exact emission proxy a verifier reviewed.

The fix is to decouple ingestion from compute. Async I/O saturates the network without spawning threads, Dask represents every tile as a lazily evaluated chunked array so nothing materializes until `.compute()`, and deterministic transformation parameters guarantee that the same inputs always yield the same outputs. This mirrors the alignment contract the [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) stage enforces upstream and the provenance contract that [MRV data lineage requirements](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) demand downstream.

## Diagnostic Pipeline: Async Pre-Flight Tile Validation

Before any reprojection, validate that each asset is reachable and that its COG header advertises the CRS, dtype, and bounds the pipeline expects. Detecting a malformed or truncated asset *before* it enters the Dask graph prevents a single bad tile from poisoning a batch reduction hours into a run.

The core execution model relies on `dask.array` and `dask-geopandas` to represent satellite footprints as chunked, lazily evaluated arrays. Each chunk maps to a standardized MGRS or UTM tile extent (typically 100×100 km for Sentinel-2, 30×30 km for Landsat 8/9). Deferring computation until an explicit `.compute()` or `.persist()` call lets the Dask scheduler optimize task dependencies across cloud masking, spectral-index derivation, and temporal aggregation.

Async I/O is injected via `aiohttp` and `aiobotocore` so concurrent COG fetches never saturate worker threads. Non-blocking HTTP/2 multiplexing reduces STAC API latency by 40–60% under high-concurrency loads. Crucially, heavy raster I/O must be offloaded to Dask's thread pool to prevent async event-loop starvation. The diagnostic below performs an async range-read of the COG header with exponential backoff and emits structured `structlog` events so the audit trail begins at ingestion:

```python
import asyncio
import aiohttp
import structlog
from tenacity import (
    retry, stop_after_attempt, wait_exponential, retry_if_exception_type,
)

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()

TARGET_CRS = "EPSG:4326"
TARGET_RES = 10.0  # meters

@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1.5, min=2, max=15),
    retry=retry_if_exception_type((aiohttp.ClientError, TimeoutError)),
)
async def validate_tile_async(
    session: aiohttp.ClientSession, asset_url: str, bbox: tuple
) -> dict:
    """Async COG-header validation: range-read the first IFD before any compute."""
    headers = {"Range": "bytes=0-16384"}
    async with session.get(asset_url, headers=headers) as resp:
        resp.raise_for_status()
        # Parse COG IFD0 headers for CRS, bounds, and dtype before admitting the tile
        if int(resp.headers.get("Content-Length", "0")) < 16384:
            log.warning("truncated_cog_header", url=asset_url)
            return {"status": "invalid", "url": asset_url, "bbox": bbox}
    log.info("tile_header_valid", url=asset_url, bbox=bbox)
    return {"status": "valid", "url": asset_url, "bbox": bbox}


async def prevalidate_batch(asset_urls: list[tuple]) -> list[dict]:
    """Concurrently validate a batch; the event loop owns I/O, not compute."""
    async with aiohttp.ClientSession() as session:
        tasks = [validate_tile_async(session, url, bbox) for url, bbox in asset_urls]
        return await asyncio.gather(*tasks, return_exceptions=False)
```

Tiles that fail validation are routed to a fallback queue rather than admitted to the graph, so the diagnostic acts as the first compliance gate in the workflow.

## Deterministic Transformation Logic

Once a tile validates, the windowed raster read is offloaded to Dask's thread pool via `dask.delayed`, keeping blocking `rasterio` calls off the async event loop. Strict CRS alignment is non-negotiable for MRV compliance: misaligned grids introduce spatial bias in emission-factor application and violate GHG Protocol quantification boundaries. The pipeline enforces a unified target CRS (`EPSG:4326` for global reporting or `EPSG:326xx` for regional baselines) via `rioxarray.reproject()`, padding chunk boundaries with `rio.clip_box()` to prevent edge artifacts. Deterministic resampling kernels — `bilinear` for continuous reflectance, `nearest` for categorical masks — guarantee reproducible pixel values across runs:

```python
import dask
import xarray as xr
import rioxarray  # noqa: F401 — registers the .rio accessor
import structlog
from rasterio.enums import Resampling

log = structlog.get_logger()
TARGET_CRS = "EPSG:4326"
TARGET_RES = 10.0  # meters

@dask.delayed
def process_tile_sync(
    asset_url: str, bbox: tuple, target_crs: str = TARGET_CRS
) -> xr.DataArray:
    """Blocking raster I/O in Dask's thread pool — preserves event-loop isolation."""
    import rasterio

    with rasterio.open(asset_url) as src:
        window = src.window(*bbox)
        data = src.read(window=window)
        transform = src.window_transform(window)
        da = xr.DataArray(
            data, dims=["band", "y", "x"], attrs={"crs": src.crs.to_string()}
        )
        da.rio.write_transform(transform, inplace=True)
        da.rio.write_crs(src.crs, inplace=True)

    # Single deterministic reprojection — fixed resolution + kernel for reproducibility
    aligned = da.rio.reproject(
        target_crs,
        resolution=(TARGET_RES, TARGET_RES),
        resampling=Resampling.bilinear,  # bilinear for continuous reflectance
        nodata=0,
    )
    log.info(
        "tile_reprojected",
        url=asset_url,
        target_crs=target_crs,
        shape=tuple(aligned.shape),
    )
    return aligned
```

Cloud and shadow contamination must be resolved before any spectral-index calculation. The pipeline applies lazy, chunk-wise masking using QA bands so the boolean mask stays inside the Dask graph and never materializes:

- **Sentinel-2:** `QA60` bitfield parsing (bit 10 for opaque clouds, bit 11 for cirrus). For L2A products, the SCL band (classes 3, 8, 9, 10) is preferred, as detailed in [automating Sentinel-2 cloud masking with STAC and Rasterio](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/automating-sentinel-2-cloud-masking-with-stac-and-rasterio/).
- **Landsat 8/9:** `QA_PIXEL` bitfield parsing per the USGS Collection 2 specification: bit 6 = cloud (mask value `0x40`), bit 3 = cloud shadow (`0x08`).

```python
import numpy as np
import xarray as xr

def apply_cloud_mask_lazy(
    da: xr.DataArray, qa_band: xr.DataArray, sensor: str
) -> xr.DataArray:
    """Chunk-wise QA masking that stays inside the Dask task graph."""
    if sensor == "S2":
        # QA60: bit 10 = opaque cloud, bit 11 = cirrus
        cloud_mask = (qa_band & 0x0C00) > 0
    elif sensor in ("L8", "L9"):
        # QA_PIXEL (Landsat C2): bit 6 = cloud (0x40), bit 3 = cloud shadow (0x08)
        cloud_mask = (qa_band & 0x48) > 0
    else:
        raise ValueError("Unsupported sensor. Use 'S2', 'L8', or 'L9'.")

    # Lazy boolean indexing preserves the Dask graph; nothing materializes here
    return da.where(~cloud_mask, np.nan)
```

Memory bounds are enforced by computing masks in parallel with spectral indices (NDVI, EVI, NBR) using `xarray.apply_ufunc` with `dask="parallelized"`. This prevents intermediate-array materialization and caps worker memory at roughly `chunk_size * n_bands * 4 bytes`. For multi-zone projects spanning several UTM zones, switch the target CRS to an Albers Equal-Area Conic projection to maintain continuous area preservation — the same equal-area constraint that governs [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) downstream.

<svg viewBox="0 -11 760 262" role="img" aria-labelledby="tl-t tl-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="tl-t">Wall-clock comparison of a synchronous tile loop versus the async plus Dask model</title>
  <desc id="tl-d">Two timelines share one wall-clock axis. The synchronous loop runs every step in series for each tile — a long idle network wait to fetch the COG, then read, reproject and mask — repeated tile after tile, so memory climbs until a worker is killed by an out-of-memory error and the scene is dropped; it reaches the far-right finish line. The async plus Dask model overlaps work: COG headers are fetched concurrently on the event loop, windowed reads run in parallel on the Dask thread pool, and masking with spectral indices is deferred to a single lazy compute. It crosses the finish line far earlier, and the gap between the two finish lines is marked as wall-clock saved.</desc>
  <defs>
    <marker id="tl-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <!-- saved-time bracket -->
    <g stroke="currentColor" stroke-width="1.3" fill="none">
      <path d="M440 30 V22 H708 V30"/>
    </g>
    <text x="574" y="16" text-anchor="middle" fill="currentColor" font-size="10" font-weight="600">wall-clock saved</text>
    <!-- finish lines -->
    <g stroke="currentColor" stroke-width="1.3" stroke-dasharray="4 4" opacity="0.7">
      <path d="M440 30 V214"/>
      <path d="M708 30 V214"/>
    </g>
    <!-- lane labels -->
    <g fill="currentColor" text-anchor="start">
      <text x="16" y="60" font-size="12" font-weight="600">Synchronous</text>
      <text x="16" y="75" font-size="9" opacity="0.75">serial · blocking</text>
      <text x="16" y="150" font-size="12" font-weight="600">Async + Dask</text>
      <text x="16" y="165" font-size="9" opacity="0.75">concurrent · lazy</text>
    </g>
    <!-- synchronous serial blocks (y 44..72) -->
    <g text-anchor="middle">
      <!-- tile 1 -->
      <rect x="150" y="44" width="62" height="28" rx="4" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3"/>
      <rect x="214" y="44" width="38" height="28" rx="4" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1"/>
      <rect x="254" y="44" width="54" height="28" rx="4" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1"/>
      <rect x="310" y="44" width="38" height="28" rx="4" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1"/>
      <text x="181" y="62" fill="currentColor" font-size="8.5">fetch ⏳</text>
      <text x="233" y="62" fill="currentColor" font-size="8.5">read</text>
      <text x="281" y="62" fill="currentColor" font-size="8.5">reproj</text>
      <text x="329" y="62" fill="currentColor" font-size="8.5">mask</text>
      <!-- tile 2 (faded) -->
      <g opacity="0.5">
        <rect x="352" y="44" width="62" height="28" rx="4" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3"/>
        <rect x="416" y="44" width="38" height="28" rx="4" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1"/>
        <rect x="456" y="44" width="54" height="28" rx="4" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1"/>
        <rect x="512" y="44" width="38" height="28" rx="4" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1"/>
      </g>
      <text x="575" y="62" fill="currentColor" font-size="13" opacity="0.7">…</text>
      <!-- OOM -->
      <rect x="630" y="44" width="58" height="28" rx="4" fill="currentColor" fill-opacity="0.14" stroke="currentColor" stroke-width="1.3"/>
      <text x="659" y="62" fill="currentColor" font-size="9" font-weight="600">✕ OOM</text>
    </g>
    <text x="150" y="92" fill="currentColor" font-size="9" opacity="0.78" text-anchor="start">network waits block the worker; RAM climbs until a scene is dropped</text>
    <!-- async parallel bars (y 120..174) -->
    <g text-anchor="middle" fill="currentColor" font-size="8.5">
      <text x="190" y="116">event-loop fetch</text>
      <text x="288" y="116">thread-pool reads</text>
      <text x="392" y="116">lazy masked compute</text>
    </g>
    <!-- stage 1: concurrent fetches -->
    <g fill="currentColor" fill-opacity="0.30" stroke="currentColor" stroke-width="0.8">
      <rect x="150" y="122" width="78" height="8" rx="2"/>
      <rect x="150" y="134" width="78" height="8" rx="2"/>
      <rect x="150" y="146" width="78" height="8" rx="2"/>
      <rect x="150" y="158" width="78" height="8" rx="2"/>
    </g>
    <!-- stage 2: parallel windowed reads -->
    <g fill="currentColor" fill-opacity="0.30" stroke="currentColor" stroke-width="0.8">
      <rect x="232" y="122" width="96" height="8" rx="2"/>
      <rect x="232" y="134" width="96" height="8" rx="2"/>
      <rect x="232" y="146" width="96" height="8" rx="2"/>
      <rect x="232" y="158" width="96" height="8" rx="2"/>
    </g>
    <!-- stage 3: single lazy compute -->
    <rect x="332" y="122" width="104" height="44" rx="4" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1"/>
    <text x="384" y="148" text-anchor="middle" fill="currentColor" font-size="8.5">.compute()</text>
    <text x="150" y="190" fill="currentColor" font-size="9" opacity="0.78" text-anchor="start">work overlaps; memory stays flat at chunk_size × n_bands × 4 bytes</text>
    <!-- wall-clock axis -->
    <path d="M148 214 H744" fill="none" stroke="currentColor" stroke-width="1.3" marker-end="url(#tl-arrow)"/>
    <text x="148" y="232" fill="currentColor" font-size="9" opacity="0.8" text-anchor="start">t₀</text>
    <text x="744" y="232" fill="currentColor" font-size="9.5" opacity="0.85" text-anchor="end">wall-clock time →</text>
  </g>
</svg>

<svg viewBox="0 -4 890 236" role="img" aria-labelledby="io-t io-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="io-t">Where the time actually goes in a tile-processing run</title>
  <desc id="io-d">A stacked breakdown of wall-clock time for one thousand tile-months. Object-store latency and transfer account for 62 percent. Decompression accounts for 18 percent. The actual computation accounts for 11 percent. Serialisation between tasks accounts for 6 percent. Scheduler overhead accounts for 3 percent. A panel notes that optimising the computation — the part engineers instinctively profile — addresses eleven percent of the run, while concurrency of requests, range-read alignment, and compression choice address eighty percent.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The computation is 11% of the run</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Wall-clock breakdown over 1 000 tile-months.</text>
  </g>
  <g>
    <rect x="12" y="56" width="537" height="42" rx="4" fill="#f3a712" opacity="0.38"/>
    <rect x="549" y="56" width="156" height="42" rx="4" fill="currentColor" opacity="0.28"/>
    <rect x="705" y="56" width="95" height="42" rx="4" fill="currentColor" opacity="0.2"/>
    <rect x="800" y="56" width="52" height="42" rx="4" fill="currentColor" opacity="0.13"/>
    <rect x="852" y="56" width="26" height="42" rx="4" fill="currentColor" opacity="0.08"/>
    <text x="280" y="82" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="currentColor">object-store latency &amp; transfer · 62%</text>
    <text x="627" y="82" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">decompress 18%</text>
    <text x="752" y="82" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">compute 11%</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">
    <text x="878" y="114" text-anchor="end">serialise 6%</text>
    <text x="878" y="128" text-anchor="end">scheduler 3%</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="142" width="856" height="76" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="142" width="856" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="28" y="166" fill="currentColor" font-size="10" font-weight="700">Profile the run, not the function.</text>
    <text x="28" y="190" fill="currentColor" font-size="9.5" opacity="0.85">Request concurrency, range-read alignment to internal blocks, and compression choice address 80% of the time.</text>
    <text x="28" y="208" fill="currentColor" font-size="9.5" opacity="0.85">Vectorising the inner loop addresses eleven percent of it, and is where most optimisation effort goes.</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

ISO 14064-2 and the GHG Protocol require verifiable lineage, deterministic processing parameters, and immutable audit trails. The pipeline serializes a SHA-256 digest of the Dask DAG topology, a parameter manifest (CRS, resolution, mask thresholds, resampling kernel), and asset provenance (STAC item IDs, acquisition and processing timestamps). A coverage gate then rejects any tile that falls below the MRV validity threshold:

```python
import json
import hashlib
import numpy as np
import xarray as xr
import structlog

log = structlog.get_logger()
TARGET_CRS = "EPSG:4326"
TARGET_RES = 10.0


def generate_audit_hash(task_graph: dict, tile_id: str, params: dict) -> str:
    """Deterministic lineage hash for ISO 14064-2 reproducibility."""
    payload = json.dumps(
        {
            "tile_id": tile_id,
            "graph": task_graph,
            "params": params,
            "crs": TARGET_CRS,
            "res": TARGET_RES,
        },
        sort_keys=True,
    ).encode()
    return hashlib.sha256(payload).hexdigest()


def enforce_compliance_gate(
    tile_id: str, aligned_da: xr.DataArray, params: dict
) -> xr.DataArray:
    # Topology of the lazy Dask graph backing this tile (JSON-safe keys)
    graph_topology = {
        "keys": sorted(str(k) for k in aligned_da.__dask_graph__().keys())
    }
    audit_hash = generate_audit_hash(graph_topology, tile_id, params)

    aligned_da.attrs.update(
        {
            "mrv_audit_hash": audit_hash,
            "ghg_protocol_scope": "3",
            "iso_14064_2_compliant": True,
            "processing_timestamp": str(np.datetime64("now", "s")),
            "cloud_mask_threshold": 0.15,
        }
    )

    # Fail-fast coverage gate — reject rather than emit an unverifiable artifact
    coverage = float(aligned_da.notnull().mean().compute())
    if coverage < 0.65:
        log.error("coverage_below_threshold", tile_id=tile_id, coverage=coverage)
        raise ValueError(
            f"Tile {tile_id} coverage {coverage:.2%} below MRV threshold (65%)"
        )

    log.info("compliance_gate_pass", tile_id=tile_id,
             coverage=coverage, audit_hash=audit_hash)
    return aligned_da
```

The coverage threshold is a hard gate: tiles failing validation are routed to a fallback queue for lower-resolution proxy substitution or manual QA review, ensuring no unverified data enters the emissions inventory. Embedding the hash and parameter manifest directly in `xarray` attributes lets a verifier reproduce the exact emission proxy from the serialized artifact alone, satisfying [MRV data lineage requirements](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) and the spatial-attribution rules of [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) without external documentation.

## Production Integration & Temporal Aggregation

In production, wrap validation, transformation, masking, and gating into a single Dask-orchestrated batch. Process tiles in bounded chunks so memory stays flat regardless of mosaic size — validate a batch asynchronously, submit the survivors to the Dask scheduler as delayed graphs, then `persist()` partition-by-partition rather than materializing the full continental array at once.

Once spatially aligned and masked, tiles feed temporal aggregation routines for land-use change detection. The pipeline chains `dask_geopandas` spatial joins with `xarray` temporal reductions (`resample("1MS").mean()`) to generate monthly emission proxies, as covered in [monthly temporal aggregation of NDVI for land-cover change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/). These outputs also drive [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/), maintaining strict CRS consistency and audit lineage throughout the stack.

Final pipeline execution pattern:

1. **Ingest** — STAC search resolves COG asset URLs and tile bounds for the AOI and date range.
2. **Diagnose** — `prevalidate_batch()` async-validates COG headers and routes malformed assets to the fallback queue.
3. **Transform** — `process_tile_sync()` performs windowed reads in the thread pool and reprojects to the target CRS.
4. **Validate** — `apply_cloud_mask_lazy()` and `enforce_compliance_gate()` mask contamination and reject sub-threshold coverage.
5. **Export** — attach the audit hash and lineage, then write masked tiles to the temporal-aggregation stage.
6. **Submit** — aggregate monthly proxies and forward the audit JSON to the MRV inventory for registry verification.

By decoupling async ingestion from lazy compute, enforcing deterministic spatial alignment, and embedding compliance gates at the tile level, this architecture delivers a production-ready MRV foundation. It eliminates blocking I/O, caps memory allocation, and guarantees reproducible, auditable outputs required for corporate carbon accounting and regulatory verification.

## Frequently Asked Questions

### How much request concurrency should a worker use against object storage?

More than feels comfortable, because the bottleneck is latency rather than bandwidth. A single sequential range read at 40 milliseconds per request spends almost all its time waiting; 16 to 64 concurrent requests per worker typically saturate the available throughput. Push it too far and you meet the provider's request-rate limits, which manifest as slow-down responses rather than errors — so back off adaptively and log the rate, because a silently throttled run just looks slow.

### Does asynchronous I/O help if the work is CPU-bound?

Only if it genuinely is CPU-bound, which is rarer than assumed — the breakdown above puts computation at roughly a tenth of the run. Measure before restructuring: if reads dominate, async concurrency is the highest-leverage change available; if decompression dominates, the answer is a cheaper codec or fewer bytes fetched; if computation genuinely dominates, async adds complexity for nothing and more workers is the simpler answer.

### How do I avoid re-fetching the same scene across overlapping tasks?

Align the task partition to the data layout so overlap is minimal, and cache at the worker rather than at the task. Tasks that each fetch a full scene to use a fraction of it will re-fetch the same bytes many times; tasks partitioned along the file's own tiling read disjoint ranges. Where overlap is unavoidable — a moving-window operation, for instance — a small per-worker LRU cache keyed on the byte range removes most of the duplication.

### Should compositing happen before or after masking?

Masking first, always. Compositing over unmasked data lets cloud and shadow contaminate the composite in a way no later step can remove, and the contamination is systematic rather than random because clouds are not randomly distributed in time. The cost is that masking first means carrying more arrays through the pipeline, which is a memory question with a straightforward answer — smaller chunks — rather than a correctness one.

### What does a stalled run usually turn out to be?

Throttling or a straggler, in roughly equal measure. Throttling shows as uniformly slow progress with no failed tasks and elevated retry counts; a straggler shows as a run that reaches 99% quickly and then sits. Both are visible in the operational signals if you record per-task duration and retry counts, and invisible if you only record run status — which is the argument for the data and operational signal classes described under [MRV pipeline observability and failure modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/).

### How do I keep a long run from losing its whole progress to one bad tile?

Isolate failures at the task boundary and let the run continue, then fail the run at the end on the completeness assertion rather than at the first exception. A single corrupt tile should produce one failed partition and a recorded reason, not an aborted run that discards several hours of completed work. The completeness check is what turns that tolerance into safety: the run still fails, but it fails after preserving everything that succeeded.

### Does an async client help when the bottleneck is the provider's rate limit?

No, and it can hurt. Once the limit is the constraint, additional concurrency produces throttling responses rather than throughput, and aggressive retries can escalate a throttle into a block. The productive responses are to reduce bytes fetched — better range alignment, fewer bands, a coarser overview where appropriate — and to spread the work over time rather than over more connections.

## Related guides

- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — the parent sub-system this recipe scales.
- [Automating Sentinel-2 Cloud Masking with STAC and Rasterio](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/automating-sentinel-2-cloud-masking-with-stac-and-rasterio/) — deterministic SCL masking applied before aggregation.
- [Monthly Temporal Aggregation of NDVI for Land-Cover Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/) — the downstream temporal reduction these tiles feed.
- [Building Real-Time Deforestation Alerts Using GEE and Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/building-real-time-deforestation-alerts-using-gee-and-python/) — alerting consumer of aligned, masked rasters.
- [Geospatial Coordinate Reference Systems (CRS) Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the ingestion-stage alignment contract this pipeline enforces.
