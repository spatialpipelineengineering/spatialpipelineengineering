---
shortTitle: "Cloud-Optimized Geospatial Formats for MRV Pipelines"
title: "Cloud-Optimized Geospatial Formats"
description: "How COG, Zarr, STAC and GeoParquet enable partial reads and scalable, reproducible emissions processing over object storage — with a COG-vs-Zarr decision guide and failure modes."
slug: cloud-optimized-geospatial-formats
type: topic
breadcrumb: "Cloud-Optimized Formats"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Cloud-Optimized Geospatial Formats

Cloud-optimized geospatial formats are the storage-layer contract that lets an emissions pipeline read only the bytes it needs, when it needs them, directly from object storage — and they are the substrate the entire [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack is built on. The distinction is not cosmetic. A plain raster forces a consumer to download an entire file before it can inspect a single pixel; a cloud-optimized layout exposes internal structure — tiles, overviews, chunk indices — over HTTP range requests so a worker can fetch a 512×512 window from a continental mosaic without ever touching the other several gigabytes. For pipelines that fan a single reporting period across thousands of scenes, that difference decides whether a run costs cents or hundreds of dollars in egress, and whether it finishes in minutes or hours.

This format layer sits directly beneath the compute patterns documented in [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/), which relies on tile-aligned reads to keep workers busy rather than blocked on I/O, and it consumes the per-pixel quality masks produced by [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/), which must themselves be persisted in a range-readable form or the masking gains are lost at the next stage. Getting the format right is what makes a carbon pipeline reproducible over object storage: the same STAC item, addressed by the same URL and checksum, yields the same window on every re-run, so an auditor can reconstruct a figure years later without a bespoke extract.

<svg viewBox="0 0 960 360" role="img" aria-labelledby="cog-t cog-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cog-t">Monolithic GeoTIFF read versus a COG range-read with overviews feeding a tiled processor</title>
  <desc id="cog-d">Two paths read the same scene from object storage. The upper path opens a plain striped GeoTIFF and must transfer the entire multi-gigabyte object before any pixel is usable, so the processor stalls on I/O and egress. The lower path opens a Cloud-Optimized GeoTIFF whose internal tiles and overview pyramid let an HTTP range request fetch only the needed window or a decimated overview; those small reads flow into a tiled, parallel processor and produce an analysis-ready output shown in amber.</desc>
  <defs>
    <marker id="cog-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- object storage source -->
    <rect x="16" y="140" width="132" height="80" rx="10" fill="currentColor" opacity="0.06"/>
    <rect x="16" y="140" width="132" height="80" rx="10" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="82" y="172" font-size="11.5" font-weight="700" fill="currentColor">Object store</text>
    <text x="82" y="190" font-size="8.5" fill="currentColor" opacity="0.72">S3 / GCS / Azure</text>
    <text x="82" y="204" font-size="8.5" fill="currentColor" opacity="0.72">one scene &#183; 4 GB</text>
    <!-- TOP PATH: monolithic -->
    <text x="300" y="40" font-size="9" font-weight="600" fill="currentColor" opacity="0.55" text-anchor="start">A &#183; PLAIN STRIPED GeoTIFF</text>
    <rect x="196" y="52" width="200" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5,3" opacity="0.7"/>
    <text x="296" y="80" font-size="10.5" font-weight="700" fill="currentColor">Full-file GET</text>
    <text x="296" y="97" font-size="8.5" fill="currentColor" opacity="0.72">whole 4 GB transferred</text>
    <text x="296" y="110" font-size="8.5" fill="currentColor" opacity="0.72">before first pixel</text>
    <rect x="452" y="52" width="200" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="552" y="80" font-size="10.5" font-weight="700" fill="currentColor">Processor stalls</text>
    <text x="552" y="97" font-size="8.5" fill="currentColor" opacity="0.72">I/O-bound &#183; high egress</text>
    <text x="552" y="110" font-size="8.5" fill="currentColor" opacity="0.72">high latency</text>
    <!-- BOTTOM PATH: COG -->
    <text x="196" y="252" font-size="9" font-weight="600" fill="currentColor" opacity="0.55" text-anchor="start">B &#183; CLOUD-OPTIMIZED GeoTIFF</text>
    <rect x="196" y="262" width="200" height="82" rx="9" fill="currentColor" opacity="0.05"/>
    <rect x="196" y="262" width="200" height="82" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="296" y="286" font-size="10.5" font-weight="700" fill="currentColor">Range-read</text>
    <text x="296" y="303" font-size="8.5" fill="currentColor" opacity="0.72">internal tiles + overviews</text>
    <text x="296" y="317" font-size="8.5" fill="currentColor" opacity="0.72">HTTP Range: bytes=&#8230;</text>
    <text x="296" y="331" font-size="8.5" fill="currentColor" opacity="0.72">one window &#183; ~2 MB</text>
    <rect x="452" y="262" width="200" height="82" rx="9" fill="currentColor" opacity="0.05"/>
    <rect x="452" y="262" width="200" height="82" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="552" y="290" font-size="10.5" font-weight="700" fill="currentColor">Tiled processor</text>
    <text x="552" y="307" font-size="8.5" fill="currentColor" opacity="0.72">parallel workers</text>
    <text x="552" y="321" font-size="8.5" fill="currentColor" opacity="0.72">read-aligned to tiles</text>
    <!-- amber analysis-ready output -->
    <rect x="716" y="262" width="212" height="82" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="716" y="262" width="212" height="82" rx="9" fill="none" stroke="#f3a712" stroke-width="2"/>
    <text x="822" y="290" font-size="10.5" font-weight="700" fill="currentColor">Analysis-ready output</text>
    <text x="822" y="307" font-size="8.5" fill="currentColor" opacity="0.78">emissions raster + STAC</text>
    <text x="822" y="321" font-size="8.5" fill="currentColor" opacity="0.78">reproducible lineage</text>
    <!-- arrows: source to both paths -->
    <path d="M120,150 L120,87 L194,87" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#cog-arrow)"/>
    <path d="M120,210 L120,303 L194,303" fill="none" stroke="currentColor" stroke-width="1.6" marker-end="url(#cog-arrow)"/>
    <!-- top path arrow -->
    <line x1="396" y1="87" x2="450" y2="87" stroke="currentColor" stroke-width="1.4" marker-end="url(#cog-arrow)"/>
    <!-- bottom path arrows -->
    <line x1="396" y1="303" x2="450" y2="303" stroke="currentColor" stroke-width="1.6" marker-end="url(#cog-arrow)"/>
    <line x1="652" y1="303" x2="714" y2="303" stroke="#f3a712" stroke-width="2" marker-end="url(#cog-arrow)"/>
    <!-- contrast annotation -->
    <text x="552" y="140" font-size="8.5" font-style="italic" fill="currentColor" opacity="0.6">~2000&#215; more bytes moved for the same window</text>
  </g>
</svg>

## Role in the MRV Workflow

In an MRV pipeline the format layer is not a passive detail of where files land; it is an active performance and reproducibility contract that every other stage depends on. Ingestion writes cloud-optimized artefacts, orchestration addresses them by stable URL, and compute reads windows lazily. When that contract holds, the pipeline scales horizontally over object storage: a Dask worker assigned tile `(row, col)` issues a single ranged read for exactly that tile at exactly the resolution it needs, and the object store bills for exactly those bytes. When the contract is broken — a striped GeoTIFF, a missing overview pyramid, a chunk grid that fights the read pattern — the same DAG still runs, but every task silently over-reads, and the cost surfaces only in the egress line item and the wall-clock at continental scale.

Four format families carry the load, each fitting a distinct shape of data. Cloud-Optimized GeoTIFF (COG) is the workhorse for single-band and few-band 2D rasters — a masked reflectance scene, a carbon-density surface, a deforestation-alert layer — because it embeds internal tiling and an overview pyramid inside an ordinary GeoTIFF that any GDAL-based reader already understands. Zarr and its geospatial profile GeoZarr are the datacube format: when a variable has time, band, and two spatial dimensions and must be sliced along any axis, a chunked N-dimensional array beats a stack of thousands of individual GeoTIFFs. STAC (SpatioTemporal Asset Catalog) is the discovery and addressing layer that sits above both, turning an object store full of assets into a queryable index keyed on geometry, datetime, and collection, so a stage asks "give me every clear Sentinel-2 tile over this AOI in Q1" rather than parsing filenames. GeoParquet carries the vector side — project boundaries, plot inventories, aggregated statistics — as a columnar, predicate-pushdown-friendly table that a query engine can filter without materialising the whole file.

The engineering choice that recurs most often is COG versus Zarr, and it is decided by access pattern rather than data volume. If consumers read 2D spatial windows of a small number of bands and the natural addressing unit is "one scene, one band," COG wins: it is directly viewable by tile servers and web maps, needs no runtime metadata service, and every raster tool reads it. If consumers slice a multi-dimensional cube along time or band — computing a per-pixel trend across sixty monthly composites, for instance — Zarr wins, because a COG stack would force one HTTP round-trip per timestep while a time-chunked Zarr array serves the whole pixel-history in a handful of reads. The table below makes the trade-off explicit; the same reasoning drives the concrete conversion recipe in [converting GeoTIFF to Cloud-Optimized GeoTIFF for emissions pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/converting-geotiff-to-cog-for-emissions-pipelines/).

The two formats also differ in operational maturity, and that difference is often the deciding factor once correctness is settled. A COG is a single self-describing file: it needs no consolidated metadata object, no directory of thousands of chunk keys, and no reader-side configuration to open, which is precisely why it is the safe default for anything that must be handed to a web map, a partner, or a verifier who will open it with unknown tooling. Zarr trades that simplicity for dimensional power — but a Zarr store is a tree of many small objects, and on object storage the cost of listing and opening that tree (the consolidated-metadata read, the per-chunk request overhead) is real and grows with chunk count, so a poorly chunked cube can be slower than the COG stack it replaced. The practical rule for MRV work is to keep published, externally consumed products as COGs, and reserve Zarr for the internal analytical cube where time-axis slicing is the dominant operation and the store is read by pipeline code that can be configured for it.

Vector data follows the same partial-read logic through GeoParquet. Where a legacy pipeline would open an entire shapefile or GeoPackage to filter a handful of project boundaries, GeoParquet lets a query engine push the spatial and attribute predicates down to the file's row groups and column statistics, reading only the columns and row groups that can satisfy the query. For MRV that matters most for the large joined tables — plot inventories, per-stratum aggregated statistics, retired-credit registers — where a reporting query touches a narrow slice of a wide table. STAC ties the raster and vector sides together: a single catalogue query returns the COG assets, the GeoParquet tables, and the Zarr cube roots that answer a question, each addressed by a URL and a checksum, so the discovery layer never depends on filename parsing or a directory walk.


| Property | Plain GeoTIFF | Cloud-Optimized GeoTIFF (COG) | Zarr / GeoZarr |
|----------|---------------|-------------------------------|----------------|
| Access pattern | Full-file download before use | HTTP range read of any tile or overview | Range read of any chunk across N dimensions |
| Internal layout | Often striped (row blocks) | Internal tiles (e.g. 512×512), IFD offsets first | Chunk grid over dims (time, band, y, x) |
| Overviews | Usually absent or in a sidecar | Embedded pyramid, decimated levels | Per-resolution groups (pyramid) or on-the-fly |
| Dimensionality | 2D raster, band stack | 2D raster, few bands | Native N-D datacube (time × band × y × x) |
| Discovery | Filename convention | STAC item, one asset per band | STAC item pointing at the store root |
| Partial read cost | Whole object | One window / overview | One chunk per requested slice |
| Best-fit workload | Archival, single-machine open | Web tiling, per-scene raster algebra, previews | Time-series slicing, multi-band cubes, xarray+Dask |


## Core Failure Modes

Three format-layer failures dominate production emissions pipelines. Each looks like a functioning file — it opens, it displays, tests that check pixel values pass — while quietly inflating cost and latency at scale. The root cause is always a mismatch between how the bytes are laid out on storage and how the pipeline reads them.

1. **Non-tiled (striped) GeoTIFF forcing full-object reads.** A GeoTIFF written with the default strip layout stores pixels in contiguous row blocks with no internal tile index, so a reader cannot fetch a rectangular window without pulling every strip that intersects it — in practice, for a windowed read near the bottom of the image, almost the whole file. Over object storage there is no operating-system page cache to soften this: each task issues a fresh GET, and a pipeline fanning 3,000 scenes across workers that each need one 512×512 AOI window ends up transferring the full multi-gigabyte scene 3,000 times instead of a few megabytes each. The observed impact is egress and transfer volume inflated by roughly two to three orders of magnitude versus a tiled COG for the identical analytical result, turning a sub-dollar run into a cost line that dominates the compute bill and a wall-clock that is entirely I/O-bound.

2. **Missing overviews making every preview scan full resolution.** Overviews are the embedded, progressively decimated copies of the raster (1/2, 1/4, 1/8 resolution and so on). Without them, any consumer that only needs a coarse view — a QA thumbnail, a continental zoom level in a tile server, a low-resolution pass to locate candidate change regions before a full-resolution read — has no choice but to read the full-resolution pixels and downsample on the fly. A 20,000×20,000 scene rendered as a 256-pixel preview reads on the order of 6 billion pixels to produce 65,000, wasting on the order of 10,000× the bytes and CPU that the appropriate overview level would have cost. At interactive scale this makes map browsing unusable and makes any "scan coarse, then zoom" pipeline pattern impossible, because the coarse pass is as expensive as the fine one.

3. **Mismatched chunk sizes causing read amplification under Dask.** When a Zarr array's on-disk chunk grid, or a COG's internal tile size, does not align with the block size a Dask task requests, every logical read spans multiple physical chunks and every physical chunk is fetched by multiple tasks. A 256-pixel COG tile read by workers expecting 512-pixel blocks means each Dask partition triggers four ranged reads that partly overlap its neighbours; a Zarr cube chunked `(1, 1, 4096, 4096)` but sliced per-timestep re-reads the full spatial plane for every timestep it touches. The root cause is a chunk shape chosen for writing rather than for the dominant read pattern. The observed impact is read amplification of typically 4× to 16× — more bytes fetched, more decompression, more object-store request charges — and a Dask graph whose task-stream is dominated by redundant I/O rather than computation, so adding workers stops helping.

## Deterministic Implementation Architecture

The conversion below is the enforcement point for the whole format contract: it rewrites an arbitrary input raster into a valid COG with internal tiling, an overview pyramid, an appropriate compression and horizontal predictor, and an explicit CRS, then refuses to publish anything that does not pass `rio-cogeo`'s `cog_validate`. It uses `rasterio` and `rio-cogeo` for the translation and validation, `pyproj` to assert a real CRS, and `structlog` for audit-ready JSON telemetry. There is no silent pass-through — an input without a CRS, or an output the validator rejects, raises before the artefact reaches object storage. The deeper walkthrough, including profile tuning per band type, lives in [converting GeoTIFF to Cloud-Optimized GeoTIFF for emissions pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/converting-geotiff-to-cog-for-emissions-pipelines/).

```python
from __future__ import annotations

from pathlib import Path

import numpy as np
import rasterio
import structlog
from pyproj import CRS
from rasterio.enums import Resampling
from rio_cogeo.cogeo import cog_translate, cog_validate
from rio_cogeo.profiles import cog_profiles

# Structured, audit-ready JSON telemetry — one event per conversion boundary.
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()

# Read-pattern tuned defaults. Tiles align to the block size the tiled
# processor requests so a Dask window maps to whole tiles, not fractions.
INTERNAL_BLOCK = 512
OVERVIEW_RESAMPLING = "average"   # reflectance/continuous data; use "nearest" for classes
MIN_OVERVIEW_DIM = 512            # stop the pyramid once the top level fits one tile


def _overview_levels(width: int, height: int, floor: int = MIN_OVERVIEW_DIM) -> list[int]:
    """Powers-of-two decimation factors until the largest side falls below `floor`."""
    levels, factor = [], 2
    while max(width, height) / factor >= floor:
        levels.append(factor)
        factor *= 2
    return levels


def convert_to_cog(
    src_path: str,
    dst_path: str,
    *,
    expected_epsg: int | None = None,
    predictor: int = 2,          # 2 = horizontal differencing for integer reflectance
    compression: str = "deflate",
    run_id: str = "adhoc",
) -> Path:
    """Convert an input raster to a validated COG with tiling + overviews.

    Enforces an explicit CRS, embeds an overview pyramid sized to the data,
    and gates on rio-cogeo's cog_validate so an invalid artefact never ships.
    """
    src = Path(src_path)
    with rasterio.open(src) as ds:
        if ds.crs is None:
            log.error("cog.crs.missing", run_id=run_id, src=str(src))
            raise ValueError(f"{src} has no CRS; refusing to guess a datum.")

        crs = CRS.from_user_input(ds.crs)  # always resolve to a canonical CRS object
        epsg = crs.to_epsg()
        if expected_epsg is not None and epsg != expected_epsg:
            log.error("cog.crs.mismatch", run_id=run_id,
                      expected=expected_epsg, got=epsg)
            raise ValueError(f"expected EPSG:{expected_epsg}, got EPSG:{epsg}")

        levels = _overview_levels(ds.width, ds.height)
        dtype = ds.dtypes[0]

    # Integer predictor 2 corrupts floats; float data needs predictor 3.
    if np.issubdtype(np.dtype(dtype), np.floating) and predictor == 2:
        predictor = 3
        log.info("cog.predictor.coerced", run_id=run_id, dtype=dtype, predictor=3)

    profile = cog_profiles.get(compression)
    profile.update(
        blockxsize=INTERNAL_BLOCK,
        blockysize=INTERNAL_BLOCK,
        predictor=predictor,
    )

    cog_translate(
        src,
        dst_path,
        profile,
        overview_level=len(levels),
        overview_resampling=Resampling[OVERVIEW_RESAMPLING].name,
        web_optimized=False,
        in_memory=False,
        quiet=True,
    )
    log.info("cog.translated", run_id=run_id, dst=dst_path,
             epsg=epsg, block=INTERNAL_BLOCK, overviews=len(levels),
             predictor=predictor, compression=compression)

    # Hard gate: rio-cogeo confirms IFD ordering, tiling and overviews.
    is_valid, errors, warnings = cog_validate(dst_path, strict=True)
    if warnings:
        log.warning("cog.validate.warnings", run_id=run_id, warnings=warnings)
    if not is_valid:
        log.error("cog.validate.failed", run_id=run_id, errors=errors)
        Path(dst_path).unlink(missing_ok=True)   # never leave an invalid artefact
        raise RuntimeError(f"COG validation failed for {dst_path}: {errors}")

    log.info("cog.sealed", run_id=run_id, dst=dst_path, valid=True)
    return Path(dst_path)


if __name__ == "__main__":
    convert_to_cog(
        "data/scene_reflectance.tif",
        "output/scene_reflectance_cog.tif",
        expected_epsg=6933,      # equal-area grid for downstream carbon algebra
        run_id="20260714T0000Z",
    )
```

The two subtle correctness gates are worth calling out because they are the ones most often skipped. First, the predictor is coerced to 3 for floating-point data: applying the integer horizontal-differencing predictor (2) to floats silently corrupts the compressed stream on some GDAL builds, so the type check is a guard against a data-integrity bug, not a performance nicety. Second, `cog_validate` runs with `strict=True` and the artefact is deleted on failure — the pipeline treats an unvalidated COG the same way it treats a raise, because a file that opens locally but violates the COG layout (wrong IFD order, no overviews) will re-introduce the full-file-read failure mode the moment a range-reading consumer touches it over the network.

## Validation, Debugging & Compliance Mapping

Validation at this layer is cheap and non-negotiable: `cog_validate` in the conversion path, and a STAC item that records the asset's checksum, CRS, spatial footprint and overview count as machine-readable evidence. Those metadata fields are exactly what a downstream stage — or a third-party verifier — needs to prove that the raster a figure was computed from is the raster on record. Because the addressing is stable (a STAC item ID plus a content hash resolves to a specific byte range in a specific object), the format layer is what makes a reported emissions figure reproducible: re-running the pipeline against the catalogued asset yields the identical window. That reproducibility contract is inherited by, and formalised in, the [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/), which pins the canonical asset and lineage fields the whole platform agrees on.


| Technical output | Regulatory application | Verification step |
|------------------|------------------------|-------------------|
| `cog_validate` pass + embedded overviews | ISO 14064-3 reproducibility: the exact raster a claim rests on is re-readable byte-for-byte | Auditor re-opens the STAC-catalogued COG and confirms validity and checksum |
| STAC item (geometry, datetime, checksum, CRS) | Verra VM-series stratification and monitoring-period traceability of the source imagery | Verifier queries the catalogue for the AOI/period and matches item IDs to the claim |
| Explicit EPSG + equal-area gate on the asset | Area-honest activity data required for tonnage consistency across reporting periods | Reproject metadata checked against the canonical project grid |
| Chunk/tile size recorded in asset metadata | CSRD ESRS E1 data-quality disclosure: transparent, cost-bounded reprocessing | Reprocessing cost and read pattern are reconstructable from the recorded layout |


Map the outputs to controls as follows. A COG that passes `cog_validate` and carries an overview pyramid answers **ISO 14064-3**, whose reproducibility and conservativeness expectations require that a reported figure be recomputable from a preserved, re-readable source — a striped or overview-less raster technically holds the pixels but fails the practical test because no verifier can efficiently re-derive a windowed result from it at scale. The STAC item feeds **Verra VM-series** traceability directly: methodologies such as VM0047 require the monitored imagery to be attributable to a stratum and a monitoring period, and a catalogue keyed on geometry and datetime makes that attribution a query rather than a manual reconciliation. The explicit EPSG gate protects the area-honesty that every tonnage calculation depends on, and the recorded chunk and tile geometry satisfies the **CSRD ESRS E1** expectation of transparent, auditable data quality — because the layout metadata makes the cost and correctness of any reprocessing reconstructable rather than opaque.

A useful discipline is to keep the format contract itself under test rather than trusting it once at conversion time. A cheap regression suite opens each published asset over the network (not from a local copy), asserts `cog_validate` passes, asserts the overview count matches the level the writer intended, and reads a small off-centre window while measuring bytes transferred — a window read that transfers megabytes when it should transfer kilobytes is the unambiguous signature of a striped file that slipped through. Running that suite in CI against a sample of the previous release's outputs catches the two changes that most often break the contract silently: a GDAL or `rio-cogeo` version bump that alters default profiles, and an upstream provider that quietly switches its own delivery format from tiled to striped. Because the checks are pure metadata and single-window reads, they cost almost nothing and can gate every deployment.

For debugging, treat three signals as monitored on every conversion, including successful ones. Track the `cog_validate` warning stream (not just pass/fail) so a slow drift toward marginal tiling surfaces before it becomes a failure; track the ratio of bytes requested to bytes used per read at the consumer, because a rising ratio is the early signature of a chunk-size mismatch inflating read amplification; and track overview presence and depth per published asset, because a batch job that quietly stops writing overviews will not fail any pixel test but will make every downstream preview scan full resolution. When a run's egress spikes without a corresponding rise in output volume, the first suspect is always a striped input that slipped past ingestion into a full-file read.

## Conclusion

Cloud-optimized geospatial formats are the difference between an emissions pipeline that scales over object storage and one that merely runs on it. COG for 2D rasters, Zarr and GeoZarr for multi-dimensional datacubes, STAC for discovery, and GeoParquet for vector are not interchangeable — each fits a distinct access pattern, and choosing by access pattern rather than data volume is what keeps reads cheap, partial, and reproducible. Get the layout wrong and the DAG still produces numbers, but it produces them at a hundred times the egress and with an audit trail no verifier can efficiently replay; get it right and every stage reads exactly the bytes it needs, addressed by a stable URL that makes any reported figure reconstructable years later. The next step is the concrete recipe: continue with [Converting GeoTIFF to Cloud-Optimized GeoTIFF for Emissions Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/converting-geotiff-to-cog-for-emissions-pipelines/) to apply this contract to your own scenes.

## Related guides

- [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) — the parent stack this format layer underpins.
- [Converting GeoTIFF to Cloud-Optimized GeoTIFF for Emissions Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/converting-geotiff-to-cog-for-emissions-pipelines/) — the task-level conversion and profile-tuning recipe.
- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — the compute layer that depends on tile-aligned range reads.
- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the upstream masks that must be persisted in a range-readable form.
- [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) — the canonical asset and lineage fields that formalise this reproducibility contract.
