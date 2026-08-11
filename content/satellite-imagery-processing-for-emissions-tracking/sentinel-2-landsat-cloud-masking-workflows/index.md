---
shortTitle: "Sentinel-2 & Landsat Cloud Masking Workflows for MRV"
---
# Sentinel-2 & Landsat Cloud Masking Workflows

Sentinel-2 and Landsat cloud masking workflows are the quality gate that turns raw optical acquisitions into the spectrally clean, artifact-free reflectance that every downstream carbon measurement depends on. This component is one stage of the broader [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) section, which specializes the [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack for the remote-sensing tier. Upstream, tiles arrive as URLs pulled by [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/); downstream, the masks produced here gate the composites consumed by [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) and the change models behind [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/).

Masking is not a uniform threshold operation. Atmospheric interference — opaque cloud, thin cirrus, and topographic shadow — introduces systematic, directional bias into spectral indices and temporal composites, and that bias propagates straight into reportable tonnage. A leaked cloud edge depresses near-infrared reflectance in exactly the way real canopy loss does, so a masking error is indistinguishable from a measurement an auditor will probe. The engineering problem is to decode each sensor's quality-assurance metadata exactly, align the resulting mask to a single canonical pixel grid, and emit a per-tile record of what was excluded and why — so that the carbon accounting built on top remains spectrally rigorous and audit-ready.

<svg viewBox="0 0 980 376" role="img" aria-labelledby="mask-t mask-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="mask-t">Sentinel-2 and Landsat cloud masking workflow</title>
  <desc id="mask-d">Raw Sentinel-2 Level-2A QA bands (SCL and QA60) and Landsat 8/9 Collection 2 QA_PIXEL bitmasks both enter a per-sensor bitwise decoder that maps SCL classes, QA bit positions and confidence tiers. The decoded boolean mask passes to a CRS alignment and nearest-neighbour resampling step that places it on a single declared target grid. A validity-fraction gate then asks whether the clear fraction meets the configured floor: tiles at or above the floor emit masked reflectance to temporal aggregation, while tiles below the floor route to reject or fallback. The decoder, alignment step and gate each write to an audit ledger recording cloud fraction, confidence tier, fallback status and source and target datum.</desc>
  <defs>
    <marker id="mask-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- inputs -->
    <g fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.9">
      <rect x="14" y="44" width="176" height="72" rx="9"/>
      <rect x="14" y="140" width="176" height="72" rx="9"/>
    </g>
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="102" y="74">Sentinel-2 L2A</text>
      <text x="102" y="90">SCL &#183; QA60</text>
      <text x="102" y="170">Landsat 8/9 C2</text>
      <text x="102" y="186">QA_PIXEL</text>
    </g>
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="102" y="107">20 m / 60 m QA</text>
      <text x="102" y="203">packed bitmask</text>
    </g>
    <!-- decoder -->
    <rect x="216" y="68" width="150" height="128" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="291" y="92" fill="currentColor" font-size="11.5" font-weight="600">Per-sensor</text>
    <text x="291" y="108" fill="currentColor" font-size="11.5" font-weight="600">bitwise decoder</text>
    <line x1="234" y1="120" x2="348" y2="120" stroke="currentColor" stroke-width="1" opacity="0.4"/>
    <g fill="currentColor" font-size="9.5" opacity="0.82">
      <text x="291" y="140">SCL class map</text>
      <text x="291" y="158">QA bit positions</text>
      <text x="291" y="176">confidence tiers</text>
    </g>
    <!-- crs alignment -->
    <rect x="394" y="68" width="150" height="128" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="469" y="92" fill="currentColor" font-size="11.5" font-weight="600">CRS alignment</text>
    <text x="469" y="108" fill="currentColor" font-size="11.5" font-weight="600">+ resample</text>
    <line x1="412" y1="120" x2="526" y2="120" stroke="currentColor" stroke-width="1" opacity="0.4"/>
    <g fill="currentColor" font-size="9.5" opacity="0.82">
      <text x="469" y="140">nearest-neighbour</text>
      <text x="469" y="158">single target grid</text>
      <text x="469" y="176">EPSG &#183; 10 m</text>
    </g>
    <!-- gate -->
    <rect x="572" y="82" width="148" height="100" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="646" y="118" fill="currentColor" font-size="11.5" font-weight="600">Validity-fraction</text>
    <text x="646" y="134" fill="currentColor" font-size="11.5" font-weight="600">gate</text>
    <text x="646" y="156" fill="currentColor" font-size="9.5" opacity="0.72">clear &#8805; floor?</text>
    <!-- outputs -->
    <rect x="748" y="22" width="216" height="86" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <text x="856" y="50" fill="currentColor" font-size="11.5" font-weight="600">Masked reflectance</text>
    <text x="856" y="68" fill="currentColor" font-size="10.5">&#8594; temporal aggregation</text>
    <text x="856" y="90" fill="#f3a712" font-size="9.5" font-weight="600">valid &#8805; floor</text>
    <rect x="748" y="158" width="216" height="86" rx="9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="856" y="194" fill="currentColor" font-size="11.5" font-weight="600">Reject / fallback route</text>
    <text x="856" y="214" fill="currentColor" font-size="9.5" opacity="0.72">flagged, never differenced</text>
    <text x="856" y="231" fill="currentColor" font-size="9.5" opacity="0.72">valid &lt; floor</text>
    <!-- audit ledger -->
    <rect x="216" y="296" width="504" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.85"/>
    <text x="468" y="322" fill="currentColor" font-size="11" font-weight="600">Audit ledger</text>
    <text x="468" y="340" fill="currentColor" font-size="9.5" opacity="0.78">cloud fraction &#183; confidence tier &#183; fallback status &#183; source / target datum</text>
    <!-- flow arrows -->
    <g fill="none" stroke="currentColor" stroke-width="1.6" marker-end="url(#mask-arrow)">
      <path d="M190 80 H203 V108 H214"/>
      <path d="M190 176 H203 V148 H214"/>
      <path d="M366 132 H392"/>
      <path d="M544 132 H570"/>
      <path d="M720 110 H734 V65 H746"/>
      <path d="M720 154 H734 V201 H746"/>
    </g>
    <!-- ledger taps -->
    <g fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.55" marker-end="url(#mask-arrow)">
      <path d="M291 196 V294"/>
      <path d="M469 196 V294"/>
      <path d="M646 182 V294"/>
    </g>
  </g>
</svg>

## Role in the MRV Workflow

Cloud masking executes during the Preprocessing stage, positioned strictly between ingestion and any analytical transform. Its upstream dependency is a stack of raw, sensor-native products: Sentinel-2 Level-2A surface reflectance with its Scene Classification Layer, and Landsat 8/9 Collection 2 surface reflectance with the `QA_PIXEL` bitmask. Each tile must carry an explicit, machine-readable coordinate reference system tag and acquisition timestamp before it enters the masking routine, because the mask is only meaningful when it is registered to the same grid as the reflectance it gates.

Its downstream consumers are unforgiving. The boolean validity mask is the multiplicand that produces clean composites for [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/), and those composites become the rolling baselines a new observation is differenced against in [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/). Errors here do not stay local — an under-masked acquisition manufactures false disturbance signals that no downstream threshold can recover, and an over-masked one starves the time series of valid observations and forces interpolation that smears genuine change. Masking is therefore the first hard quality gate, and the place where the pipeline's defensibility is either established or lost.

That position imposes two requirements that the rest of this page builds on. First, spatial fidelity: the mask must be reprojected onto the same canonical grid as the reflectance using deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/), because a sub-pixel offset between the 20 m SCL and the 10 m bands relocates the exclusion onto the wrong ground. Second, evidentiary completeness: every tile must emit its cloud fraction, the confidence tiers it applied, and any fallback it took, because those attributes flow directly into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/). A mask without that record is unverifiable even when it is correct.

## Core Failure Modes

Three failure modes dominate production masking. Each has a distinct technical root cause and a measurable impact on carbon accounting integrity.

1. **Bitmask misinterpretation — silent under- or over-masking.** Sentinel-2 SCL, Sentinel-2 `QA60`, and Landsat `QA_PIXEL` each encode atmospheric classes with different bit structures, at different native resolutions, and with different confidence semantics. Treating `QA_PIXEL` as a simple value comparison rather than a packed bitmask, or reading the wrong bit position, silently inverts the result. Misreading the confidence bits (bits 8–9 on Landsat Collection 2) is the most common variant: drop the confidence tier and you retain medium-confidence cloud across a humid-tropics tile, inflating the false-positive disturbance rate; over-apply it and you discard usable pixels where cloud-free observations are already scarce. The fix is to decode every product with explicit bitwise operations against the published ESA/USGS bitmaps, never naive integer equality.

2. **Cirrus and shadow leakage misread as surface change.** Thin cirrus scatters near-infrared radiation without fully occluding the surface, and topographic shadow depresses reflectance across all bands — both produce spectral signatures that mimic canopy loss. SCL class `10` (thin cirrus) and class `3` (cloud shadow) are routinely under-weighted because they look like marginal pixels rather than hard rejections. An undilated cloud or shadow boundary leaves a one-to-two-pixel contaminated fringe around every masked feature, and in a short baseline window a single leaked acquisition can dominate the composite. Mitigation is to treat cirrus and shadow as first-class exclusion classes and to dilate the mask so adjacency contamination is removed rather than smeared into the result.

3. **Mask–reflectance misregistration across resolutions.** The SCL ships at 20 m and `QA60` at 60 m, while the spectral bands used for vegetation and soil-carbon proxies are 10–30 m. Resampling the mask with an interpolating method (bilinear, cubic) invents fractional validity values that have no physical meaning and blur the cloud boundary; resampling reflectance and mask onto different grids breaks the pixel-level correspondence that masking assumes. A 0.5-pixel offset on a 10 m Sentinel-2 grid is enough to leave a rim of cloud along every masked edge. The resolution is strict nearest-neighbour resampling of the boolean mask onto a single declared target CRS and resolution, with the affine transform validated before the mask is ever applied.

<svg viewBox="0 -4 900 230" role="img" aria-labelledby="mask-t mask-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="mask-t">The two masking errors, and why they are not symmetric</title>
  <desc id="mask-d">Two failure directions compared. Under-masking leaks bright cloud and dark shadow into the composite, producing high-biased reflectance where cloud remains and low-biased where shadow remains, which manufactures false change at cloud edges. Over-masking discards valid observations, thinning the time series until seasonal models cannot be fitted and biasing composites toward the conditions that survived the mask — typically the clearest, driest days. A panel notes the asymmetry: under-masking creates visible artefacts that get investigated, while over-masking silently reduces sample size and biases the remaining sample, so it is the failure that survives review.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Only one of these gets noticed</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Both are systematic. One leaves artefacts; the other leaves a quietly biased sample.</text>
    <rect x="12" y="52" width="424" height="146" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="424" height="146" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Under-masking</text>
    <text x="28" y="100" fill="currentColor" font-size="9.5" opacity="0.85">residual cloud → reflectance biased high</text>
    <text x="28" y="120" fill="currentColor" font-size="9.5" opacity="0.85">residual shadow → biased low</text>
    <text x="28" y="146" fill="currentColor" font-size="9.5" font-weight="700">manufactures change at cloud edges</text>
    <text x="28" y="174" fill="currentColor" font-size="9.5" opacity="0.85">visible as speckle → someone investigates</text>
    <rect x="456" y="52" width="432" height="146" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="472" y="76" fill="currentColor" font-size="10.5" font-weight="700">Over-masking</text>
    <text x="472" y="100" fill="currentColor" font-size="9.5" opacity="0.85">valid observations discarded</text>
    <text x="472" y="120" fill="currentColor" font-size="9.5" opacity="0.85">series too thin to fit a seasonal model</text>
    <text x="472" y="146" fill="#f3a712" font-size="9.5" font-weight="700">composite biased toward clear, dry days</text>
    <text x="472" y="174" fill="#f3a712" font-size="9.5" font-weight="700">looks clean → nobody investigates</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The routine below decodes multi-sensor QA metadata with explicit bitwise operations, aligns the resulting mask to a declared target CRS with nearest-neighbour resampling, and emits structured telemetry for every tile. It uses `rasterio` for I/O and reprojection, `numpy` for vectorized bit parsing, `xarray`/`dask` for chunked memory management at continental scale, `prefect` for orchestration and retry, and `structlog` for the machine-readable audit record. The validity-fraction gate is explicit: a tile whose clear fraction falls below the configured floor is flagged rather than silently differenced through.

```python
import numpy as np
import rasterio
import structlog
import xarray as xr
import dask.array as da
from rasterio.enums import Resampling
from rasterio.warp import calculate_default_transform, reproject
from prefect import flow, task
from dataclasses import dataclass, field
from typing import Tuple, Dict
from pathlib import Path

log = structlog.get_logger("mrv.cloud_masking")

# Single declared target grid — every mask is resampled onto this before use.
TARGET_CRS = "EPSG:4326"
TARGET_RES = 10.0  # metres, nearest-neighbour only for boolean masks


@dataclass
class MaskConfig:
    valid_fraction_floor: float = 0.70   # reject below this clear fraction
    shadow_include: bool = True
    fallback_skip: bool = False
    target_crs: str = TARGET_CRS
    target_res: float = TARGET_RES
    # Landsat C2 cloud-confidence tiers to exclude: 2=medium, 3=high
    confidence_tiers: Tuple[int, ...] = (2, 3)
    # Sentinel-2 SCL classes treated as invalid: 3=shadow, 8/9=cloud, 10=cirrus
    scl_invalid: Tuple[int, ...] = field(default_factory=lambda: (3, 8, 9, 10))


def _parse_sentinel2_scl(scl_path: Path, config: MaskConfig) -> np.ndarray:
    """Boolean mask from Sentinel-2 L2A SCL. True = valid surface."""
    with rasterio.open(scl_path) as src:
        scl = src.read(1)
    invalid = np.isin(scl, config.scl_invalid)
    return ~invalid


def _parse_landsat_qa(qa_path: Path, config: MaskConfig) -> np.ndarray:
    """Parse Landsat Collection 2 QA_PIXEL with explicit bit positions (USGS).

    Bit 2    = cirrus (Landsat 8/9)
    Bit 3    = cloud shadow
    Bit 6    = cloud
    Bits 8-9 = cloud confidence (00=none, 01=low, 10=med, 11=high)
    """
    with rasterio.open(qa_path) as src:
        qa = src.read(1).astype(np.uint16)

    cirrus     = (qa >> 2) & 0b1
    shadow     = (qa >> 3) & 0b1
    cloud_bit  = (qa >> 6) & 0b1
    cloud_conf = (qa >> 8) & 0b11

    cloud_mask  = cloud_bit == 1
    conf_mask   = np.isin(cloud_conf, config.confidence_tiers)
    cirrus_mask = cirrus == 1
    shadow_mask = (shadow == 1) if config.shadow_include else np.zeros_like(qa, dtype=bool)

    return ~(cloud_mask | conf_mask | cirrus_mask | shadow_mask)


def _align_mask(mask: np.ndarray, profile: Dict, config: MaskConfig) -> np.ndarray:
    """Reproject the boolean mask onto the canonical grid. Nearest only —
    interpolating a validity mask invents fractional, physically meaningless values."""
    transform, width, height = calculate_default_transform(
        profile["crs"], config.target_crs,
        profile["width"], profile["height"],
        *profile["bounds"], resolution=config.target_res,
    )
    out = np.empty((height, width), dtype=np.uint8)
    reproject(
        source=mask.astype(np.uint8),
        destination=out,
        src_transform=profile["transform"],
        src_crs=profile["crs"],
        dst_transform=transform,
        dst_crs=config.target_crs,
        resampling=Resampling.nearest,
    )
    return out.astype(bool)


@task(retries=2, retry_delay_seconds=10)
def generate_cloud_mask(qa_path: Path, sensor: str, config: MaskConfig) -> xr.DataArray:
    """Decode QA metadata, align to the canonical grid, return a chunked mask."""
    try:
        with rasterio.open(qa_path) as src:
            if src.crs is None:
                # Reject, never assume-good: an untagged CRS is what an auditor exploits.
                raise ValueError(f"Missing CRS on QA band {qa_path.name}")
            profile = {
                "crs": src.crs, "transform": src.transform,
                "width": src.width, "height": src.height, "bounds": src.bounds,
            }

        s = sensor.lower()
        if s == "sentinel2":
            mask = _parse_sentinel2_scl(qa_path, config)
        elif s in ("landsat8", "landsat9"):
            mask = _parse_landsat_qa(qa_path, config)
        else:
            raise ValueError(f"Unsupported sensor: {sensor}")

        aligned = _align_mask(mask, profile, config)
        log.info("mask.generated", tile=qa_path.stem, sensor=s,
                 crs=str(profile["crs"]), target_crs=config.target_crs)
        return xr.DataArray(
            da.from_array(aligned, chunks=(1024, 1024)),
            dims=["y", "x"],
            attrs={"sensor": s, "source_crs": str(profile["crs"]),
                   "target_crs": config.target_crs},
        )
    except Exception as exc:
        log.error("mask.failed", tile=qa_path.stem, error=str(exc))
        if config.fallback_skip:
            # Conservative fallback: mask everything out rather than pass contamination.
            log.warning("mask.fallback", tile=qa_path.stem, strategy="reject_all")
            return xr.DataArray(
                da.zeros((1024, 1024), dtype=bool, chunks=(1024, 1024)),
                dims=["y", "x"], attrs={"fallback": "reject_all"},
            )
        raise


@flow(name="mrv_cloud_masking_pipeline")
def run_cloud_masking_pipeline(
    qa_paths: list[Path], sensors: list[str], config: MaskConfig
) -> Dict[str, xr.DataArray]:
    """Multi-sensor masking with an explicit validity-fraction gate per tile."""
    masks: Dict[str, xr.DataArray] = {}
    for qa_path, sensor in zip(qa_paths, sensors):
        mask = generate_cloud_mask(qa_path, sensor, config)
        valid_fraction = float(mask.mean().compute())
        cloud_fraction = 1.0 - valid_fraction

        if valid_fraction < config.valid_fraction_floor:
            # Hard gate: cloud-starved tiles are flagged, never differenced through.
            log.warning("mask.rejected", tile=qa_path.stem,
                        valid_fraction=round(valid_fraction, 4),
                        floor=config.valid_fraction_floor,
                        cloud_fraction=round(cloud_fraction, 4))
        else:
            log.info("mask.accepted", tile=qa_path.stem,
                     cloud_fraction=round(cloud_fraction, 4))
        masks[qa_path.stem] = mask

    log.info("pipeline.complete", tiles=len(masks))
    return masks
```

Three choices here are load-bearing. First, **rejection over coercion**: a tile with no CRS tag or a clear fraction below the floor is dropped or flagged, never assumed-good. Second, **a single declared target grid**: both the mask and the reflectance it gates are resampled onto `TARGET_CRS`/`TARGET_RES` with nearest-neighbour so the misregistration failure mode cannot survive into the composite. Third, **explicit bitwise decoding**: every confidence tier and cirrus/shadow class is parsed against the published bitmap, and the exclusion is recorded in the telemetry rather than hidden in a threshold. The authoritative bit definitions live in the [Sentinel-2 MSI processing-level documentation](https://documentation.dataspace.copernicus.eu/Data/SentinelMissions/Sentinel2.html) and the [Landsat Collection 2 Quality Assessment bands reference](https://www.usgs.gov/landsat-missions/landsat-collection-2-quality-assessment-bands).

## Validation, Debugging & Compliance Mapping

A mask that is statistically sound but undocumented still fails an audit; technical outputs must map directly to regulatory verification steps. Validation operates at three levels. **Statistical QA** computes per-tile cloud-fraction histograms — a sudden spike in tiles breaching the `valid_fraction_floor` usually signals misaligned QA bands or corrupted metadata, and those tiles should route to a manual review queue. **Spectral cross-check** applies the mask to reflectance and confirms NDVI/EVI distributions shift toward expected biome baselines; persistent high NDVI inside a masked region is the signature of cirrus leakage. **Lineage persistence** records each tile's cloud fraction, applied confidence tiers, and fallback status alongside the processed imagery, feeding [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/).

The pipeline's gates map onto specific frameworks:

- **Valid-fraction gating and confidence-tier application → reportable-figure accuracy (ISO 14064-3 §5.4).** The hard rejection of cloud-starved composites and the documented confidence tiers constitute the data-quality controls a verifier requires, keeping contaminated activity data out of the inventory rather than discovering it at audit.
- **Per-sensor bitmask decoding and dilation → geometric and temporal integrity (Verra VM-series).** Decoding SCL and `QA_PIXEL` against the published specifications, with the exclusion logic logged, satisfies Verra VM0042 / VM0047 expectations for stable, defensible preprocessing across monitoring periods and prevents the directional bias that under- or over-masking introduces.
- **Telemetry and fallback records → auditable provenance (CSRD ESRS E1).** Emitting cloud fraction, confidence tiers, source and target CRS, and fallback status as structured records creates the immutable provenance chain that CSRD ESRS E1 disclosures are scrutinized for, and that ultimately backs [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) submissions.

For debugging, three silent failures deserve dedicated diagnostics. Phantom contamination that traces tile seams indicates mask–reflectance misregistration — validate that mask and reflectance share an identical affine transform after alignment before trusting any composite. High NDVI persisting inside masked regions reveals cirrus leakage — confirm SCL class `10` and the Landsat cirrus bit are both excluded and that the mask is dilated. And a clear-fraction distribution that collapses toward the floor across a whole archive signals a decoding regression — trend the per-tile cloud fraction over time so a quietly changed QA product surfaces as a regression long before it crosses an audit tolerance.

<svg viewBox="0 -4 900 232" role="img" aria-labelledby="mc-t mc-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="mc-t">Mask sources and what each one can and cannot see</title>
  <desc id="mc-d">Four mask sources compared. The provider quality band is free, always available, and conservative, but misses thin cirrus and often mislabels bright surfaces. A physical rule-based mask adds thin-cirrus and shadow geometry using the sun and view angles, and is interpretable and tunable. A learned mask trained on labelled scenes performs best overall and is opaque, version-sensitive, and can fail unpredictably on surfaces absent from its training set. A temporal-consistency mask compares a pixel against its own recent history and catches what all three miss, at the cost of needing a time series. A panel recommends combining a physical or learned mask with a temporal check, and notes that no single source is adequate for MRV.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">No single mask source is adequate</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Each misses a different thing, and the misses are systematic.</text>
    <rect x="12" y="52" width="212" height="148" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="212" height="148" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Provider QA band</text>
    <text x="28" y="100" fill="currentColor" font-size="9.5" opacity="0.85">free, always present</text>
    <text x="28" y="120" fill="currentColor" font-size="9.5" opacity="0.85">conservative</text>
    <text x="28" y="146" fill="#f3a712" font-size="9.5" font-weight="700">misses thin cirrus</text>
    <text x="28" y="166" fill="#f3a712" font-size="9.5" font-weight="700">mislabels bright ground</text>
    <text x="28" y="188" fill="currentColor" font-size="9" opacity="0.75">a floor, not a solution</text>
    <rect x="236" y="52" width="212" height="148" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="236" y="52" width="212" height="148" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="252" y="76" fill="currentColor" font-size="10.5" font-weight="700">Physical rules</text>
    <text x="252" y="100" fill="currentColor" font-size="9.5" opacity="0.85">cirrus band + shadow geometry</text>
    <text x="252" y="120" fill="currentColor" font-size="9.5" opacity="0.85">uses sun and view angles</text>
    <text x="252" y="146" fill="currentColor" font-size="9.5" font-weight="700">interpretable, tunable</text>
    <text x="252" y="166" fill="currentColor" font-size="9.5" opacity="0.85">you can explain a decision</text>
    <text x="252" y="188" fill="currentColor" font-size="9" opacity="0.75">the auditable choice</text>
    <rect x="460" y="52" width="212" height="148" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="460" y="52" width="212" height="148" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="476" y="76" fill="currentColor" font-size="10.5" font-weight="700">Learned mask</text>
    <text x="476" y="100" fill="currentColor" font-size="9.5" opacity="0.85">best overall accuracy</text>
    <text x="476" y="120" fill="currentColor" font-size="9.5" opacity="0.85">opaque, version-sensitive</text>
    <text x="476" y="146" fill="#f3a712" font-size="9.5" font-weight="700">fails oddly on unseen surfaces</text>
    <text x="476" y="166" fill="currentColor" font-size="9.5" opacity="0.85">pin the model version</text>
    <text x="476" y="188" fill="currentColor" font-size="9" opacity="0.75">strong, needs governance</text>
    <rect x="684" y="52" width="204" height="148" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="684" y="52" width="204" height="148" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="700" y="76" fill="currentColor" font-size="10.5" font-weight="700">Temporal consistency</text>
    <text x="700" y="100" fill="currentColor" font-size="9.5" opacity="0.85">pixel vs its own history</text>
    <text x="700" y="120" fill="currentColor" font-size="9.5" opacity="0.85">catches what all three miss</text>
    <text x="700" y="146" fill="currentColor" font-size="9.5" font-weight="700">needs a time series</text>
    <text x="700" y="166" fill="currentColor" font-size="9.5" opacity="0.85">cheap once you have one</text>
    <text x="700" y="188" fill="currentColor" font-size="9" opacity="0.78">combine with one of the others</text>
  </g>
</svg>

## Frequently Asked Questions

### Is the provider's quality band good enough on its own?

No, though it is the right floor. Provider masks are tuned to be broadly conservative across every landscape on Earth, which means they miss thin cirrus that materially depresses reflectance and they over-flag bright surfaces such as sand, salt flats, and rooftops. For MRV, combine it with either physical cirrus and shadow tests or a learned mask, and add a temporal-consistency check — that combination catches the three failure classes that any single source leaves.

### How do I detect over-masking?

Trend the masked fraction per tile and per period, and compare it against the local cloud climatology. A masked fraction well above the expected cloud cover is over-masking, and it is invisible in the output because the surviving pixels look fine. A second check is the composite's bias: if compositing from a heavily masked stack produces systematically different values from a lightly masked one over the same period, the mask is selecting rather than filtering.

### Should shadow be masked geometrically or spectrally?

Both, intersected. Geometric projection from cloud objects using the solar and view angles predicts where a shadow must fall and is unambiguous about direction; a spectral test identifies dark, low-NIR pixels but cannot distinguish shadow from water or burnt ground. Requiring both — a dark pixel in the geometrically predicted location — cuts false shadow flags over water bodies dramatically, which is where most shadow over-masking comes from.

### What should happen to a pixel with no valid observation in a period?

It should be recorded as unobserved, never gap-filled silently into a composite that is presented as measured. Gap-filling is legitimate and often necessary, but the filled values must be flagged so downstream aggregation can weight or exclude them and so an auditor can see what fraction of a reported figure rests on interpolation rather than observation.

### Does mask choice need to be versioned?

Yes, exactly like a factor table. A mask change alters which observations enter every composite and therefore alters every derived figure, so it is a restatement trigger rather than a maintenance detail. Pin the mask algorithm and, for learned masks, the model weights; record both in the provenance footer; and prefer to change masks at a period boundary rather than mid-period.

## Conclusion

Sentinel-2 and Landsat cloud masking workflows are the first hard quality gate in a Measurement, Reporting, and Verification pipeline, and their reliability rests on a short list of non-negotiables: explicit per-sensor bitwise decoding so confidence tiers and cirrus/shadow classes are never misread, nearest-neighbour alignment onto a single declared grid so mask and reflectance stay registered, a validity-fraction gate so cloud-starved tiles are rejected rather than differenced through, and structured telemetry on every tile so the masking survives third-party verification under ISO 14064-3, the Verra VM-series, and CSRD ESRS E1. Embed those gates with `structlog` and distributed orchestration and the masking layer can cover continental footprints while remaining audit-ready. To wire this routine to a STAC catalog so QA-band discovery and CRS inference happen automatically, work through [Automating Sentinel-2 Cloud Masking with STAC and Rasterio](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/automating-sentinel-2-cloud-masking-with-stac-and-rasterio/).

## Related

- [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) — the parent stack this masking gate sits inside.
- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — the ingestion engine that delivers the tiles this stage masks.
- [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — the downstream consumer that builds composites from the masked reflectance.
- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — the change-detection layer whose accuracy depends on this gate.
- [Automating Sentinel-2 Cloud Masking with STAC and Rasterio](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/automating-sentinel-2-cloud-masking-with-stac-and-rasterio/) — the step-by-step implementation walkthrough for this topic.
