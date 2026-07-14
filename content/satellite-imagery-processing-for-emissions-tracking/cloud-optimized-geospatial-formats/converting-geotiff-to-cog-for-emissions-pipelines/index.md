---
shortTitle: "Convert GeoTIFF to COG for Emissions Pipelines"
title: "Converting GeoTIFF to Cloud-Optimized GeoTIFF for Emissions Pipelines"
description: "Convert striped GeoTIFFs into valid COGs for emissions MRV: pick 512-pixel internal tiling, resampling-correct overviews, DEFLATE/ZSTD/LERC compression, nodata handling, and rio-cogeo validation gates."
slug: converting-geotiff-to-cog-for-emissions-pipelines
type: guide
breadcrumb: "Converting GeoTIFF to COG"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Converting GeoTIFF to Cloud-Optimized GeoTIFF for Emissions Pipelines

A plain GeoTIFF dumped from a processing chain is, more often than not, a striped raster with no internal tiling and no overviews — a file that forces every reader to pull the whole thing over the wire just to sample one parcel. This guide is the task-level recipe under [Cloud-Optimized Geospatial Formats](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/), the storage-layer discipline within the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack. The COGs it produces are exactly what the range-request readers behind [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) expect: internally tiled, overview-backed, and streamable straight from object storage.

Converting a GeoTIFF to a Cloud-Optimized GeoTIFF (COG) is not a cosmetic reformat. The wrong internal block size doubles the read amplification of a Dask worker; the wrong overview resampling silently corrupts a categorical land-cover raster; a dropped nodata tag turns fill pixels into phantom emissions. This recipe walks the full conversion — inspect the input, choose parameters by data type, translate, build overviews, and validate with `rio-cogeo` before a single byte reaches the [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) that consume it downstream. The objective is a deterministic, self-describing artifact whose block layout, compression, and provenance all survive third-party MRV scrutiny.

<svg viewBox="0 0 1000 250" role="img" aria-labelledby="cog-conv-t cog-conv-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cog-conv-t">GeoTIFF to COG conversion step flow with data-type parameter branch</title>
  <desc id="cog-conv-d">A striped input GeoTIFF is inspected for tiling and overviews, then routed by data type: continuous rasters take average resampling with DEFLATE or ZSTD and a predictor, while categorical rasters take nearest-neighbour resampling with no predictor. Both paths translate to a 512-pixel internally tiled COG, build overviews, and pass through a rio-cogeo validation gate. A valid COG is then published to object storage; the validated output is highlighted in amber.</desc>
  <defs>
    <marker id="cog-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- pipeline boxes -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="12" y="98" width="128" height="66" rx="9"/>
      <rect x="516" y="42" width="150" height="60" rx="9"/>
      <rect x="516" y="160" width="150" height="60" rx="9"/>
      <rect x="690" y="98" width="120" height="66" rx="9"/>
    </g>
    <!-- decision diamond -->
    <polygon points="330,72 398,131 330,190 262,131" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <!-- validation gate -->
    <rect x="690" y="98" width="120" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <!-- validated COG output (accent) -->
    <rect x="850" y="98" width="138" height="66" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <!-- titles -->
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="76" y="126">Inspect input</text>
      <text x="591" y="66">Continuous</text>
      <text x="591" y="184">Categorical</text>
      <text x="750" y="126">Validate</text>
    </g>
    <text x="919" y="128" fill="#f3a712" font-size="12" font-weight="700">Valid COG</text>
    <!-- subtitles -->
    <g fill="currentColor" font-size="9" opacity="0.72">
      <text x="76" y="144">tiling &#183; overviews</text>
      <text x="591" y="82">average &#183; predictor</text>
      <text x="591" y="200">nearest &#183; no pred.</text>
      <text x="750" y="144">rio-cogeo</text>
      <text x="919" y="146">to object store</text>
    </g>
    <!-- decision label -->
    <g fill="currentColor" font-size="10" font-weight="600">
      <text x="330" y="127">data</text>
      <text x="330" y="141">type?</text>
    </g>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#cog-arrow)">
    <line x1="140" y1="131" x2="258" y2="131"/>
    <path d="M330 72 C 360 44, 470 42, 514 60"/>
    <path d="M330 190 C 360 218, 470 220, 514 202"/>
    <path d="M666 72 C 690 90, 680 100, 700 108"/>
    <path d="M666 190 C 690 172, 680 162, 700 154"/>
    <line x1="810" y1="131" x2="848" y2="131"/>
  </g>
  <!-- branch labels -->
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="9.5" font-weight="600">
    <text x="452" y="52" fill="currentColor" opacity="0.8">avg</text>
    <text x="452" y="216" fill="currentColor" opacity="0.8">nearest</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Convert a striped GeoTIFF into a valid Cloud-Optimized GeoTIFF for emissions pipelines",
  "description": "Inspect a plain GeoTIFF's block layout and overviews, select tiling, resampling, and compression by data type, translate to a 512-pixel internally tiled COG with overviews and nodata, and validate with rio-cogeo before publishing to object storage.",
  "totalTime": "PT35M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "rasterio" },
    { "@type": "HowToTool", "name": "rio-cogeo" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest and inspect", "text": "Open the source raster and read its block layout, overview levels, compression, and nodata tag to detect striping or missing overviews." },
    { "@type": "HowToStep", "name": "Choose parameters by data type", "text": "Select 512-pixel internal tiling, average resampling with a predictor for continuous data or nearest for categorical, and DEFLATE, ZSTD, or LERC compression." },
    { "@type": "HowToStep", "name": "Translate to COG", "text": "Run the COG translation with the explicit profile, preserving the source CRS and nodata, and building overviews in the same pass." },
    { "@type": "HowToStep", "name": "Validate", "text": "Run cog_validate and gate the result, rejecting any output that reports errors or missing overviews." },
    { "@type": "HowToStep", "name": "Publish", "text": "Upload the validated COG to object storage with its lineage metadata so range-request readers can stream it." }
  ]
}
</script>

## Root Cause Analysis: Why a Plain GeoTIFF Breaks the Pipeline

A GeoTIFF that has never been optimized carries three structural defects, and each one surfaces as a distinct, expensive failure once the file lands in an emissions pipeline.

First, **striped storage forces whole-file reads.** Most tools write GeoTIFFs in horizontal strips — rows of pixels stored contiguously — because that is the historical default. A COG-aware reader that wants a single 512×512 window over one project parcel cannot fetch it; it must pull every strip that intersects that window, which on a striped file means the full width of the raster for every affected row. At continental extent the read amplification is brutal: a worker that needed 1 MB pulls 400 MB, and the object-store egress bill and the wall-clock latency both scale with the mistake, not with the data actually used.

Second, **missing overviews make zoomed-out reads pathological.** Without internal overviews (reduced-resolution copies of the raster), any consumer rendering a national mosaic or computing a coarse statistic must decode the full-resolution array and downsample on the fly, every time. For an interactive verifier dashboard or a Dask reduction that only needs a coarse pass, this is orders of magnitude more I/O than a pre-built overview pyramid would cost. Overviews are not optional polish for MRV workloads — they are the mechanism that makes multi-scale reads tractable.

Third, **untyped conversion silently corrupts categorical data and fill pixels.** This is the failure that survives QA and reaches an auditor. Building overviews with `average` resampling on a categorical raster — a land-cover class map, a forest/non-forest mask — invents class values that never existed: averaging class 3 and class 7 yields class 5, a category the classifier never assigned. Likewise, a conversion that drops or misreports the `nodata` tag lets fill pixels enter downstream sums as if they were real measurements, injecting phantom area or phantom emissions. Both defects are invisible in a thumbnail and only manifest as a discrepancy the verifier cannot reconcile.

## Diagnostic Pipeline: Inspecting Block Layout and Overviews

Before converting anything, inspect the source to confirm which of the defects above actually apply — many rasters are already partially optimized, and re-tiling a good file wastes cycles. The diagnostic below opens the raster, reads its internal block layout, overview decimation levels, compression, and nodata tag, and warns when it finds striping or an absent overview pyramid. It treats a block size that will not align with the downstream Dask chunk grid as a first-class warning, because a block/chunk mismatch is one of the quietest performance regressions in a tiled pipeline.

```python
import rasterio
from rasterio.enums import ColorInterp
import structlog

log = structlog.get_logger()


def inspect_raster(path: str, dask_chunk: int = 512) -> dict:
    """Inspect a GeoTIFF's COG-readiness before conversion.

    Reports internal block layout, overview levels, compression, nodata, and
    CRS. Warns on striped storage, absent overviews, and block sizes that will
    not tile evenly against the downstream Dask chunk grid.
    """
    with rasterio.open(path) as src:
        block = src.block_shapes[0]  # (rows, cols) of band 1's internal blocks
        blk_rows, blk_cols = block
        overviews = src.overviews(1)  # decimation factors, e.g. [2, 4, 8, 16]
        is_tiled = blk_rows == blk_cols and blk_cols in (256, 512, 1024)
        is_striped = blk_rows == 1 or blk_cols == src.width

        report = {
            "path": path,
            "crs": str(src.crs) if src.crs else None,
            "dtype": src.dtypes[0],
            "shape": [src.height, src.width],
            "block_shape": [int(blk_rows), int(blk_cols)],
            "overviews": [int(o) for o in overviews],
            "compression": src.compression.value if src.compression else None,
            "nodata": src.nodata,
            "is_tiled": bool(is_tiled),
            "is_striped": bool(is_striped),
            "cog_ready": bool(is_tiled and overviews),
        }

        # Categorical rasters are commonly single-band paletted or thematic.
        report["likely_categorical"] = (
            src.colorinterp[0] == ColorInterp.palette
            or src.dtypes[0] in ("uint8", "int8")
        )

        if src.crs is None:
            log.warning("raster.no_crs", path=path)
        if is_striped:
            log.warning("raster.striped", path=path, block_shape=report["block_shape"])
        if not overviews:
            log.warning("raster.no_overviews", path=path)
        if is_tiled and (blk_cols % dask_chunk) and (dask_chunk % blk_cols):
            # Block size and Dask chunk are not integer multiples of each other.
            log.warning("raster.block_chunk_mismatch",
                        block=blk_cols, dask_chunk=dask_chunk)

        log.info("raster.inspected", **report)
        return report
```

A raster reporting `cog_ready=True` with a 512 block and a full overview list needs no conversion. Everything else routes into the transformation step, and the `likely_categorical` flag is what decides the resampling method there — get that flag wrong and the overviews will be built with the wrong reducer.

## Deterministic Transformation Logic

The conversion itself is a single translation pass that pins every parameter explicitly rather than trusting a library default. Internal tiling is fixed at 512×512: it is large enough to amortize per-block overhead on object storage yet small enough that a typical parcel window touches only a handful of blocks, and it aligns cleanly with the 512-pixel Dask chunk convention used across the tile-processing layer. Overview resampling is chosen by data type — `average` for continuous reflectance, NDVI, or biomass surfaces, and `nearest` for any categorical or class raster so no invented class values appear at coarse zoom. Compression pairs `DEFLATE` or `ZSTD` with a predictor (`2` for integer data, `3` for floating point) to exploit spatial autocorrelation losslessly; `LERC` is offered for surfaces where a bounded, controlled loss is acceptable in exchange for a much smaller file.

The routine below reads the source, builds an explicit COG profile, translates with `rio-cogeo`, preserves the CRS and nodata, and refuses to return a file that does not pass `cog_validate`.

```python
from datetime import datetime, timezone

import rasterio
from rasterio.enums import Resampling
from rio_cogeo.cogeo import cog_translate, cog_validate
from rio_cogeo.profiles import cog_profiles
import structlog

log = structlog.get_logger()


def convert_to_cog(
    src_path: str,
    dst_path: str,
    categorical: bool = False,
    compression: str = "deflate",   # "deflate" | "zstd" | "lerc"
    blocksize: int = 512,
    lerc_max_z_error: float = 0.001,
) -> dict:
    """Convert a plain/striped GeoTIFF into a validated COG for MRV pipelines.

    Continuous data uses average-resampled overviews with a predictor; categorical
    data uses nearest-neighbour overviews and no predictor. CRS and nodata are
    preserved from the source. The output is validated before the path is returned.
    """
    with rasterio.open(src_path) as src:
        src_crs = src.crs
        src_nodata = src.nodata
        dtype = src.dtypes[0]
        if src_crs is None:
            raise ValueError(f"{src_path}: untagged CRS; refusing to guess a datum.")

    # Resampling: averaging a class map invents categories that never existed.
    overview_resampling = "nearest" if categorical else "average"

    # Predictor: 2 for integers, 3 for floats; never a predictor for LERC.
    is_float = dtype in ("float32", "float64")
    predictor = "3" if is_float else "2"

    profile = cog_profiles.get(compression)
    profile.update(
        blockxsize=blocksize,
        blockysize=blocksize,
        overview_resampling=overview_resampling,
    )
    if compression in ("deflate", "zstd") and not categorical:
        profile["predictor"] = predictor
    else:
        profile.pop("predictor", None)  # categorical + LERC: no predictor
    if compression == "lerc":
        profile["max_z_error"] = lerc_max_z_error

    log.info("cog.translate.start", src=src_path, dst=dst_path,
             compression=compression, blocksize=blocksize,
             overview_resampling=overview_resampling,
             predictor=profile.get("predictor"), dtype=dtype)

    cog_translate(
        src_path,
        dst_path,
        profile,
        nodata=src_nodata,               # carry fill value forward explicitly
        overview_resampling=overview_resampling,
        web_optimized=False,             # preserve native CRS, do not reproject
        in_memory=False,
        quiet=True,
    )

    # Gate: a COG that does not validate must never leave this function.
    is_valid, errors, warnings = cog_validate(dst_path, quiet=True)
    if not is_valid:
        log.error("cog.validate.failed", dst=dst_path, errors=errors)
        raise RuntimeError(f"COG validation failed for {dst_path}: {errors}")

    with rasterio.open(dst_path) as chk:
        manifest = {
            "src_path": src_path,
            "dst_path": dst_path,
            "crs": str(chk.crs),
            "nodata": chk.nodata,
            "blocksize": blocksize,
            "overviews": [int(o) for o in chk.overviews(1)],
            "compression": compression,
            "predictor": profile.get("predictor"),
            "overview_resampling": overview_resampling,
            "categorical": categorical,
            "cog_valid": True,
            "validation_warnings": list(warnings),
            "generated_utc": datetime.now(timezone.utc).isoformat(),
        }

    # Assert overviews were actually written — an empty pyramid is a silent failure.
    if not manifest["overviews"]:
        raise RuntimeError(f"{dst_path}: no overviews written; conversion incomplete.")

    log.info("cog.translate.done", **manifest)
    return manifest
```

Two guards in this routine catch the failures that QA otherwise misses. The CRS check refuses an untagged source outright, because a COG published without a datum relocates every parcel it feeds. The overview assertion after translation catches the case where `cog_translate` succeeds but writes an empty pyramid — a file that validates structurally yet still forces full-resolution reads on every zoomed-out request.

## Compliance Gating & Audit Trail Generation

The manifest returned by the conversion is the audit record. Every field an auditor would ask about — the CRS carried forward from the source, the nodata value, the block size, the exact overview decimation levels, the compression and predictor, and the resampling method — is captured at the moment of writing and travels with the artifact. Because the function raises on a failed `cog_validate` or an empty overview list, an invalid COG can never be published; the gate is structural, not advisory.

Three gates enforce MRV integrity on every conversion:

1. **Validation gate.** `cog_validate` must return no errors. A file that fails the COG structural specification is rejected before upload, so downstream range-request readers never encounter a malformed pyramid or a mis-ordered IFD.
2. **Resampling-correctness gate.** The `categorical` flag forces `nearest` overviews for class rasters. This prevents invented class values at coarse zoom — the single most consequential silent corruption in thematic MRV data, and one a thumbnail will never reveal.
3. **Nodata and CRS integrity.** The source nodata and datum are asserted and carried forward, so fill pixels cannot enter downstream area or emissions sums and no parcel is silently relocated.

These manifests are the raw material for [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), and the block-layout and compression fields map directly onto the storage-format expectations documented in the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/). For the authoritative structural definition, consult the [Cloud Optimized GeoTIFF specification](https://cogeo.org/) and the [GDAL COG driver documentation](https://gdal.org/drivers/raster/cog.html).

## Production Integration

Deploy the conversion inside the tile-processing framework, following a fixed ingest → diagnose → transform → validate → export → submit sequence:

1. **Ingest.** Pull the source GeoTIFF from the processing chain or a staging bucket, reading its header without loading the full array so the inspection step stays cheap even on large rasters.
2. **Diagnose.** Run `inspect_raster` to read block layout, overviews, compression, and nodata; skip any file already reporting `cog_ready=True` and route the rest forward with the `likely_categorical` flag resolved.
3. **Transform.** Call `convert_to_cog` with `categorical=True` for class rasters and masks, `compression="zstd"` for high-throughput lossless output, or `compression="lerc"` where a bounded loss is acceptable on a continuous surface.
4. **Validate.** The function's built-in `cog_validate` gate rejects any structurally invalid output and the overview assertion rejects an empty pyramid; treat either as a hard pipeline failure, not a warning.
5. **Export.** Upload the validated COG to object storage alongside its manifest, so the readers behind [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) can stream 512-pixel windows by range request without re-reading whole files.
6. **Submit.** Register the manifest with the lineage store and hand the COG to the [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) and the compositing stages that consume it as verified activity data.

Run the conversions as a fan-out across a `dask.distributed` pool, one task per source raster, and align the conversion `blocksize` with the reader's chunk size so the block/chunk mismatch the diagnostic warns about never reaches production. By pinning tiling, choosing resampling by data type, preserving nodata and CRS, and gating on `cog_validate`, the conversion turns an unstreamable striped GeoTIFF into a self-describing, auditable COG — the storage primitive every scalable emissions pipeline is built on.

## Related guides

- [Cloud-Optimized Geospatial Formats](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/) — the parent storage discipline this conversion recipe sits within.
- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — the range-request readers that consume the COGs this step produces.
- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the downstream stage that reads these COGs as activity data.
- [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) — the schema the block-layout and compression fields map onto.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — where each conversion manifest becomes queryable provenance.
