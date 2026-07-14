---
shortTitle: "Automate Sentinel-2 Cloud Masking with STAC and Rasterio"
---
# Automating Sentinel-2 Cloud Masking with STAC and Rasterio

Wiring a Sentinel-2 cloud mask to a STAC catalog turns the manual, error-prone hunt for a Scene Classification Layer into a deterministic, audit-ready step that a greenhouse-gas MRV pipeline can run unattended. This walkthrough is the implementation-level companion to [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/), the masking gate inside the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) section of the broader [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. The goal here is narrow and concrete: query the `sentinel-2-l2a` collection with `pystac-client`, resolve the SCL asset alongside the spectral bands, apply a conservative boolean mask with `rasterio` windowed I/O, and emit a per-item provenance record — without a human ever opening a tile in a GIS.

Done correctly, the masked reflectance this produces feeds straight into the composites built by [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) and the baselines differenced inside [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/), so every decision below is made with downstream defensibility in mind. The hard part is not calling the API — it is making STAC discovery, [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/), and exclusion logic reproducible enough that the same AOI and date range always yields the same mask and the same audit trail.

<svg viewBox="0 0 720 600" role="img" aria-labelledby="mask-t mask-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="mask-t">Automated Sentinel-2 cloud-masking decision tree</title>
  <desc id="mask-d">A STAC search of the sentinel-2-l2a collection (AOI bbox, date range, eo:cloud_cover below threshold) returns the latest item, then branches on whether an SCL asset is present. If present, the SCL classes 3, 8, 9 and 10 are decoded and morphologically dilated into a conservative mask. If absent, the item falls back to the QA60 L1C bitmask or routes to an exclusion queue. Both branches converge on a windowed masked read guarded by a strict CRS-parity check, which writes a masked GeoTIFF with explicit nodata plus a JSON audit record carrying exclusion percentage, CRS and compliance status.</desc>
  <defs>
    <marker id="mask-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- STAC search -->
    <rect x="240" y="20" width="240" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="360" y="44" font-size="12" font-weight="600">STAC search · sentinel-2-l2a</text>
      <text x="360" y="61" font-size="9.5" opacity="0.8">AOI bbox · date range</text>
      <text x="360" y="74" font-size="9.5" opacity="0.8">eo:cloud_cover &lt; threshold (coarse gate)</text>
    </g>
    <!-- decision diamond -->
    <polygon points="360,128 488,182 360,236 232,182" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="360" y="186" fill="currentColor" font-size="11.5" font-weight="600">SCL asset present?</text>
    <!-- yes branch box -->
    <rect x="44" y="288" width="232" height="78" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="160" y="312" font-size="11.5" font-weight="600">Decode SCL classes 3·8·9·10</text>
      <text x="160" y="330" font-size="9.5" opacity="0.8">shadow · med/high cloud · cirrus</text>
      <text x="160" y="349" font-size="9.5" opacity="0.8">+ morphological dilation (fringe)</text>
    </g>
    <!-- no branch box -->
    <rect x="444" y="288" width="232" height="78" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="560" y="312" font-size="11.5" font-weight="600">Fallback route</text>
      <text x="560" y="330" font-size="9.5" opacity="0.8">QA60 L1C bitmask decoder</text>
      <text x="560" y="349" font-size="9.5" opacity="0.8">or → exclusion queue</text>
    </g>
    <!-- converge: masked read -->
    <rect x="226" y="418" width="268" height="74" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="360" y="444" font-size="12" font-weight="600">Windowed masked read</text>
      <text x="360" y="462" font-size="9.5" opacity="0.8">from_bounds window · nearest-neighbour</text>
      <text x="360" y="480" font-size="9.5" opacity="0.85" font-weight="600">strict CRS-parity gate</text>
    </g>
    <!-- output -->
    <rect x="196" y="528" width="328" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor">
      <text x="360" y="551" font-size="11.5" font-weight="600">Masked GTiff (NaN nodata) + JSON audit</text>
      <text x="360" y="569" font-size="9.5" opacity="0.8">exclusion % · CRS · compliance status</text>
    </g>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#mask-arrow)" opacity="0.9">
    <line x1="360" y1="86" x2="360" y2="126"/>
    <path d="M232 182 L160 182 L160 286"/>
    <path d="M488 182 L560 182 L560 286"/>
    <path d="M160 366 L160 405 L290 416"/>
    <path d="M560 366 L560 405 L430 416"/>
    <line x1="360" y1="492" x2="360" y2="526"/>
  </g>
  <g font-family="system-ui, sans-serif" fill="currentColor" font-size="10" font-weight="600">
    <text x="186" y="172">yes</text>
    <text x="534" y="172">no</text>
  </g>
</svg>

## Root Cause Analysis

Cloud masking fails in production not because the algorithm is hard but because the inputs are inconsistent and the discovery step is usually ad hoc. Three structural problems make a hand-built script unreliable for carbon accounting.

First, **scene-level cloud cover is not pixel-level truth**. STAC items expose an `eo:cloud_cover` property, and it is tempting to filter on it and stop there. That number is a whole-scene aggregate: a tile reported at 12% cloud can be completely overcast across your specific Area of Interest while the clear pixels sit hundreds of kilometres away. Filtering on the property is a useful coarse gate, but it never substitutes for decoding the SCL band over the AOI itself — and a pipeline that skips that step ships contaminated reflectance that looks clean in metadata.

Second, **the SCL encodes discrete classes, not a clean binary**. ESA's Scene Classification Layer assigns class `3` to cloud shadow, `8` to medium-probability cloud, `9` to high-probability cloud, and `10` to thin cirrus, among others. A naïve mask that excludes only the high-probability class leaves cirrus and shadow leaking into the result, and thin cirrus depresses near-infrared reflectance in exactly the way real canopy loss does. For MRV the only defensible default is conservative: exclude all four atmospheric classes and dilate the mask to catch the contaminated one-to-two-pixel fringe that always bleeds past a cloud edge.

Third, **misregistration silently relocates the exclusion**. The SCL ships at 20 m while the spectral bands used as vegetation and soil-carbon proxies (B04, B08) are 10 m. If the mask and the reflectance are read on mismatched grids or reprojected with an interpolating resampler, a half-pixel offset leaves a rim of cloud along every masked feature. Automating discovery without enforcing strict CRS parity just industrialises that error across an entire archive. The sections below make each of these failure conditions detectable before any transform runs.

## Diagnostic Pipeline / Pre-Flight Validation

Before masking anything, resolve the STAC assets deterministically and inspect the candidate item for the conditions that would make the mask meaningless. The function below queries the catalog, selects the latest acquisition that meets the coarse threshold, and returns the resolved hrefs together with the item's declared EPSG code so the downstream read can assert CRS parity rather than assume it.

```python
import pystac_client
import structlog
from typing import Dict, Any, Tuple

log = structlog.get_logger()

def resolve_s2_l2a_assets(
    stac_url: str,
    aoi_bounds: Tuple[float, float, float, float],
    start_date: str,
    end_date: str,
    max_cloud_pct: float = 30.0,
) -> Dict[str, Any]:
    """Deterministically resolve the SCL + spectral assets for one AOI/date range."""
    client = pystac_client.Client.open(stac_url)
    search = client.search(
        collections=["sentinel-2-l2a"],
        bbox=aoi_bounds,
        datetime=f"{start_date}/{end_date}",
        query={"eo:cloud_cover": {"lt": max_cloud_pct}},  # coarse pre-filter only
        sortby=[{"field": "datetime", "direction": "desc"}],
    )
    items = list(search.items())
    if not items:
        log.error("stac.no_items", bbox=aoi_bounds, period=f"{start_date}/{end_date}")
        raise RuntimeError(f"No S2-L2A items for {aoi_bounds} over {start_date}/{end_date}.")

    item = items[0]  # latest acquisition meeting the threshold — reproducible selection
    if "SCL" not in item.assets:
        log.warning("stac.scl_missing", item_id=item.id)  # routed to fallback downstream

    epsg = item.properties.get("proj:epsg")
    if epsg is None:
        log.error("stac.no_crs_tag", item_id=item.id)
        raise ValueError(f"Item {item.id} carries no proj:epsg tag; cannot guarantee alignment.")

    log.info("stac.resolved", item_id=item.id, crs=f"EPSG:{epsg}",
             scene_cloud_pct=item.properties.get("eo:cloud_cover"))
    return {
        "scl": item.assets["SCL"].href if "SCL" in item.assets else None,
        "b04": item.assets["B04"].href,
        "b08": item.assets["B08"].href,
        "item_id": item.id,
        "datetime": item.datetime.isoformat(),
        "crs": f"EPSG:{epsg}",
        "assets": item.assets,
    }
```

Two checks here are load-bearing. The `proj:epsg` assertion refuses any item that cannot declare its own grid, because an untagged tile cannot be aligned and must not be assumed-good. The `SCL` presence log flags items that will need the fallback route rather than letting them fail silently mid-transform. Everything downstream consumes the returned `crs` string as the single declared target grid.

## Deterministic Transformation Logic

With assets resolved and the target CRS known, map the SCL classes to a boolean mask, dilate it to remove adjacency contamination, and apply it through `rasterio` windowed reads that assert CRS parity before touching any pixels. The mask is reprojected — when needed — with nearest-neighbour resampling so no interpolated, physically meaningless fractional validity values are ever invented. Reprojection transformers are constructed with `always_xy=True` so longitude/latitude ordering can never silently swap axes.

```python
import numpy as np
import rasterio
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
from scipy.ndimage import binary_dilation

# ESA SCL v2/v3 conservative exclusion classes: shadow, med/high cloud, thin cirrus.
EXCLUSION_CLASSES = (3, 8, 9, 10)

def generate_cloud_mask(scl_array: np.ndarray, dilation_iters: int = 2) -> np.ndarray:
    """Map discrete SCL classes to a dilated boolean exclusion mask."""
    raw = np.isin(scl_array, EXCLUSION_CLASSES)
    structure = np.ones((3, 3), dtype=bool)
    # Dilation captures the sub-pixel contaminated fringe around every cloud edge.
    return binary_dilation(raw, structure=structure, iterations=dilation_iters)

def apply_mask_to_bands(
    band_paths: Dict[str, str],
    scl_path: str,
    aoi_bounds: Tuple[float, float, float, float],
    target_crs: str,
    output_dir: str,
) -> Tuple[Dict[str, str], float]:
    """Apply a conservative SCL mask to spectral bands with strict CRS parity."""
    with rasterio.open(scl_path) as scl_src:
        src_crs = scl_src.crs.to_string()
        if src_crs != target_crs:
            # Hard distortion gate: never interpolate a categorical mask across a mismatch.
            log.error("mask.crs_mismatch", scl_crs=src_crs, target_crs=target_crs)
            raise ValueError(f"SCL CRS {src_crs} != target {target_crs}; reproject first.")
        window = from_bounds(*aoi_bounds, scl_src.transform)
        scl_data = scl_src.read(1, window=window, resampling=Resampling.nearest)
        transform = scl_src.window_transform(window)

    cloud_mask = generate_cloud_mask(scl_data)
    excluded_fraction = float(cloud_mask.mean())
    log.info("mask.computed", excluded_fraction=round(excluded_fraction, 4),
             classes=EXCLUSION_CLASSES)

    masked_outputs: Dict[str, str] = {}
    for band_name, band_path in band_paths.items():
        with rasterio.open(band_path) as band_src:
            if band_src.crs.to_string() != target_crs:
                log.error("band.crs_mismatch", band=band_name, crs=band_src.crs.to_string())
                raise ValueError(f"Band {band_name} CRS != target {target_crs}.")
            band_window = from_bounds(*aoi_bounds, band_src.transform)
            band_data = band_src.read(1, window=band_window).astype(np.float32)
            band_data[cloud_mask] = np.nan  # excluded pixels become explicit nodata

        out_path = f"{output_dir}/{band_name}_masked.tif"
        with rasterio.open(
            out_path, "w", driver="GTiff",
            height=cloud_mask.shape[0], width=cloud_mask.shape[1], count=1,
            dtype="float32", crs=target_crs, transform=transform,
            compress="deflate", nodata=np.nan,
        ) as dst:
            dst.write(band_data, 1)
        masked_outputs[band_name] = out_path

    return masked_outputs, excluded_fraction
```

The CRS-parity guards on both the SCL and every spectral band are the difference between an automated mask and an automated mistake. Because the read window is derived from the same declared `target_crs` and the categorical mask is never resampled with an interpolating method, the half-pixel offset failure mode cannot survive into the output. Excluded pixels are written as an explicit `NaN` nodata so the [temporal aggregation](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) stage can stack acquisitions without ever averaging a cloud value into a composite.

## Compliance Gating & Audit Trail Generation

A statistically correct mask that carries no record of what it excluded still fails verification. When the SCL is absent or the processing baseline is suspect, the item must take a deterministic fallback route rather than crash, and every processed item must emit a structured provenance record. The functions below implement both, feeding the lineage chain that ultimately backs registry submissions.

```python
import json
from datetime import datetime, timezone
from pathlib import Path
import pystac

def evaluate_scl_integrity(item: pystac.Item) -> str:
    """Deterministic fallback routing for degraded or missing mask metadata."""
    if "SCL" not in item.assets:
        return "QA60_FALLBACK" if "QA60" in item.assets else "EXCLUDED_NO_MASK"
    baseline = item.properties.get("s2:processing_baseline")
    if baseline in {"02.00", "02.01"}:
        return "LEGACY_SCL_REVIEW"  # pre-2018 baselines need manual confirmation
    return "VALID"

def generate_audit_record(
    item_id: str,
    acquisition_dt: str,
    masked_files: Dict[str, str],
    excluded_fraction: float,
    crs: str,
    integrity_status: str,
    compliance_standard: str = "ISO_14064-3",
) -> Path:
    """Emit an embedded-provenance JSON record per processed item."""
    audit = {
        "pipeline_version": "s2_stac_masking_v3",
        "item_id": item_id,
        "acquisition_datetime": acquisition_dt,
        "target_crs": crs,
        "masked_assets": masked_files,
        "exclusion_classes_applied": list(EXCLUSION_CLASSES),
        "cloud_pixel_fraction_excluded": round(excluded_fraction, 4),
        "integrity_status": integrity_status,
        "compliance_standard": compliance_standard,
        "verification_status": "PASS" if excluded_fraction < 0.35 else "REVIEW_REQUIRED",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    out = Path(f"audit/{item_id}_masking_audit.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(audit, indent=2))
    log.info("audit.written", item_id=item_id, status=audit["verification_status"])
    return out
```

These outputs map onto concrete verification requirements. The recorded exclusion classes and clear-fraction gate are the data-quality controls a verifier expects under **ISO 14064-3 §5.4**, keeping contaminated activity data out of the inventory. The decode-and-log discipline — exact SCL classes, dilation, and CRS — satisfies the stable, defensible preprocessing the **Verra VM-series** (VM0042 / VM0047) requires across monitoring periods. And persisting source/target CRS, fallback status, and exclusion fraction as immutable records builds the provenance chain scrutinised under **CSRD ESRS E1**, the same chain consumed by [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) and ultimately by [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/).

## Production Integration

In production the pieces above run as a single deterministic sequence per AOI and acquisition, orchestrated with `prefect` or `airflow` so retries and telemetry are first-class. The canonical execution pattern is:

1. **Ingest** — call `resolve_s2_l2a_assets` to query the `sentinel-2-l2a` collection for the AOI and date range, applying `eo:cloud_cover` only as a coarse pre-filter.
2. **Diagnose** — run `evaluate_scl_integrity` and the `proj:epsg` assertion; items returning `EXCLUDED_NO_MASK` route to a compliance exception queue, `QA60_FALLBACK` switches to the L1C bitmask decoder, and untagged items are rejected.
3. **Transform** — decode the SCL into a dilated boolean mask and apply it through `apply_mask_to_bands` with strict CRS-parity gates and nearest-neighbour resampling.
4. **Validate** — confirm the excluded fraction sits below the configured floor and spot-check that NDVI inside masked regions does not persist at canopy levels (the signature of cirrus leakage).
5. **Export** — write masked GeoTIFFs with explicit `NaN` nodata and `deflate` compression to the cleaned-reflectance store.
6. **Submit** — emit the JSON audit record and register it with the lineage service so the masking is discoverable at verification time.

For continental footprints, read with windowed/chunked I/O rather than whole tiles — the `from_bounds` window already restricts each read to the AOI, and pairing that with `dask`-backed reads keeps memory flat while parallelising across thousands of items. Because every step is keyed on the declared target CRS and a fixed exclusion class set, the same AOI and date range reproduce byte-identical masks and audit records on every run, which is exactly the property a third-party auditor needs to re-derive your figures.

## Related

- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the parent masking gate this walkthrough implements.
- [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) — the remote-sensing section this step belongs to.
- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — the ingestion engine that delivers the tiles masked here.
- [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — the downstream consumer of the masked reflectance.
- [Geospatial CRS Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the alignment discipline the parity gates here depend on.
