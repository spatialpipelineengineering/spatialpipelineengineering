---
shortTitle: "Cloud-Shadow False Positives in Sentinel-2 — Fix"
title: "Troubleshooting Cloud-Shadow False Positives in Sentinel-2"
description: "Diagnose and fix Sentinel-2 cloud-shadow over-masking: project shadows from solar geometry, combine SCL with s2cloudless, exclude terrain shadow via hillshade, and validate against clear dates."
slug: troubleshooting-cloud-shadow-false-positives-in-sentinel-2
type: guide
breadcrumb: "Cloud-Shadow False Positives"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Troubleshooting Cloud-Shadow False Positives in Sentinel-2

Cloud-shadow flagging is the noisiest step in any optical masking chain, and it fails in the direction that quietly destroys an MRV baseline: it over-flags. This guide sits under [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/), the clear-sky discipline within the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack, and it assumes you already have the STAC-driven masking scaffolding from [automating Sentinel-2 cloud masking with STAC and rasterio](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/automating-sentinel-2-cloud-masking-with-stac-and-rasterio/) in place. When that scaffolding marks half a scene as shadow, the fault is almost never the cloud detector — it is the shadow logic downstream of it.

The Scene Classification Layer (SCL) shipped with Sentinel-2 Level-2A flags class 3 as `CLOUD_SHADOWS`, but it derives that flag from a spectral darkness test that has no notion of where a shadow can physically fall. Any dark surface — open water, a recent burn scar, terrain in self-shadow on a north-facing slope at low sun elevation, or dark tilled soil after rain — reads as shadow-dark and gets masked. Over-masking is not a cosmetic problem: it thins the observation stack that feeds [monthly temporal aggregation of NDVI](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/), biases composites toward whatever survives the cull, and can starve a tile of the clear observations a verifier expects. The fix is to stop treating "dark" as "shadow" and instead confirm that each candidate pixel is geometrically consistent with a cast shadow from a detected cloud.

<svg viewBox="0 0 1000 250" role="img" aria-labelledby="csfp-t csfp-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="csfp-t">Cloud-shadow confirmation flow that suppresses false positives</title>
  <desc id="csfp-d">Candidate shadow pixels from the SCL darkness test enter a chain of confirmation gates. First the cloud mask is projected along the solar azimuth by a height-scaled distance to produce a predicted shadow footprint. Candidate pixels are intersected with that footprint and with a darkness and near-infrared / short-wave-infrared spectral test. A terrain-shadow exclusion step removes hillshade self-shadow using a digital elevation model and the solar geometry. Pixels that survive every gate become the confirmed cloud-shadow mask, shown in amber as the validated output; pixels that fail any gate are released back to clear-sky.</desc>
  <defs>
    <marker id="csfp-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="10" y="92" width="150" height="66" rx="9"/>
      <rect x="182" y="92" width="164" height="66" rx="9"/>
      <rect x="368" y="92" width="164" height="66" rx="9"/>
      <rect x="554" y="92" width="164" height="66" rx="9"/>
    </g>
    <rect x="812" y="86" width="178" height="80" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <!-- release-back node -->
    <rect x="368" y="188" width="164" height="46" rx="9" fill="none" stroke="#11839e" stroke-width="1.5"/>
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="85" y="120">Candidate pixels</text>
      <text x="264" y="120">Project shadow</text>
      <text x="450" y="120">Dark + NIR/SWIR</text>
      <text x="636" y="120">Exclude terrain</text>
    </g>
    <text x="901" y="120" fill="#f3a712" font-size="12" font-weight="700">Confirmed shadow</text>
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="85" y="138">SCL class 3</text>
      <text x="264" y="138">solar azimuth &#183; height</text>
      <text x="450" y="138">B08 / B11 test</text>
      <text x="636" y="138">hillshade &#183; DEM</text>
      <text x="901" y="140" fill="#f3a712" opacity="0.9">audited mask output</text>
    </g>
    <text x="901" y="156" fill="currentColor" font-size="9.5" opacity="0.72">masked_fraction logged</text>
    <text x="450" y="208" fill="#11839e" font-size="10.5" font-weight="600">Released to clear-sky</text>
    <text x="450" y="224" fill="currentColor" font-size="9.5" opacity="0.72">water &#183; burn scar &#183; dark soil</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#csfp-arrow)">
    <line x1="160" y1="125" x2="180" y2="125"/>
    <line x1="346" y1="125" x2="366" y2="125"/>
    <line x1="532" y1="125" x2="552" y2="125"/>
    <line x1="718" y1="125" x2="810" y2="125"/>
  </g>
  <g stroke="#11839e" stroke-width="1.4" fill="none" marker-end="url(#csfp-arrow)">
    <path d="M450 158 L450 186"/>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Suppress cloud-shadow false positives in Sentinel-2 masks",
  "description": "Diagnose per-scene shadow over-masking, then confirm each candidate shadow pixel with solar-geometry projection, a NIR/SWIR darkness test, and hillshade terrain-shadow exclusion before writing a validated mask.",
  "totalTime": "PT45M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "rasterio" },
    { "@type": "HowToTool", "name": "numpy" },
    { "@type": "HowToTool", "name": "scipy" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest", "text": "Read the SCL band, s2cloudless probability, the B08/B11 reflectance bands, and a co-registered DEM, all in the tile's UTM CRS." },
    { "@type": "HowToStep", "name": "Diagnose", "text": "Quantify the shadow-masked fraction and count false-positive candidates that coincide with water or dark soil; warn on over-masking." },
    { "@type": "HowToStep", "name": "Transform", "text": "Project the cloud mask along the solar azimuth by a height-scaled distance, intersect with the darkness test, and subtract hillshade terrain shadow." },
    { "@type": "HowToStep", "name": "Validate", "text": "Gate the refined masked fraction against a clear reference date and reject masks that still exceed the configured ceiling." },
    { "@type": "HowToStep", "name": "Export", "text": "Write the refined shadow mask with provenance attributes recording solar geometry, projection height, and false-positive reduction." },
    { "@type": "HowToStep", "name": "Submit", "text": "Feed the validated mask into the compositing stage so downstream carbon products inherit a defensible observation density." }
  ]
}
</script>

## Root Cause Analysis

The SCL cloud-shadow class and most naive shadow detectors are spectral thresholds. A pixel is called shadow when its near-infrared and short-wave-infrared reflectance drop below a cut-off, on the reasonable premise that cloud shadow darkens the surface across those bands. The premise is sound; the inverse is not. Darkness is not diagnostic of shadow, and treating it as if it were produces two opposite errors that a carbon pipeline must handle separately.

**Over-flagging (false positives)** is the dominant failure. Open water is intrinsically dark in B08 (NIR) and B11 (SWIR) and is misread as shadow along every coastline and lake margin. Recent burn scars share the same low-NIR signature and get masked wholesale, which is catastrophic for a deforestation or fire-emissions workflow that specifically needs those pixels. Dark tilled soil, wet peat, and basalt outcrops all cross the same threshold. Worst of all, terrain in self-shadow — north-facing slopes at low solar elevation — is genuinely dark because it receives no direct illumination, but it is not cloud shadow and it recurs in the same place on every acquisition, systematically biasing multi-date composites over mountainous terrain. In a single scene it is common to see the raw shadow class cover 25-40% of a coastal or montane tile when the true cast-shadow fraction is under 5%.

**Under-flagging (false negatives)** is subtler. A thin or broken cloud can cast a diffuse penumbra that never gets dark enough to trip the threshold, so real contaminated pixels leak into the composite. Both errors have the same cure: geometry. A true cloud shadow must fall at a predictable location — displaced from its parent cloud along the anti-solar direction by a distance set by cloud height and solar elevation. Confirming that a dark pixel lies inside the projected footprint of a detected cloud converts an indefensible spectral guess into a physically constrained decision, and it lets you release water, burn scars, and terrain shadow that no cloud could have produced. This is the same integrity discipline enforced upstream during [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/): the DEM, the reflectance bands, and the cloud mask must share one grid before any geometric reasoning is trustworthy.

## Diagnostic Pipeline: Quantifying Over-Masking

Before altering the mask, measure it. The diagnostic below computes the shadow-masked fraction for a scene and, crucially, estimates how much of that fraction is likely spurious by intersecting the shadow class with spectral signatures that betray water and dark soil. It emits a structured warning when the masked fraction breaches a ceiling, so over-masking surfaces as a logged event rather than a silently thin composite.

```python
import numpy as np
import rasterio
import structlog

log = structlog.get_logger()

# Sentinel-2 SCL class codes (Level-2A)
SCL_CLOUD_SHADOW = 3
SCL_WATER = 6

# Reflectance thresholds (scaled 0-1) used only for diagnostics, not decisions.
NIR_DARK = 0.12      # B08 below this reads as "shadow-dark"
SWIR_WATER_MAX = 0.06  # B11 this low over dark pixels usually means water
NDWI_WATER_MIN = 0.20  # (B03 - B08) / (B03 + B08) positive => water-like


def diagnose_shadow_mask(
    scl_path: str,
    b03_path: str,
    b08_path: str,
    b11_path: str,
    max_shadow_fraction: float = 0.15,
    target_crs: str = "EPSG:32633",  # UTM zone of the tile; assert, never assume
) -> dict:
    """Quantify per-scene shadow masking and flag likely false positives.

    Returns a report with the raw shadow fraction and the fraction of shadow
    pixels that coincide with water/dark-soil signatures (probable over-flags).
    """
    with rasterio.open(scl_path) as scl_src:
        if scl_src.crs is None or scl_src.crs.to_string() != target_crs:
            raise ValueError(
                f"SCL CRS {scl_src.crs} != expected {target_crs}; "
                "reproject to the tile UTM grid before diagnosis.")
        scl = scl_src.read(1)

    def _read(path: str) -> np.ndarray:
        with rasterio.open(path) as src:
            # Level-2A reflectance is stored x10000; scale to 0-1 for the tests.
            return src.read(1).astype("float32") / 10000.0

    b03, b08, b11 = _read(b03_path), _read(b08_path), _read(b11_path)

    shadow = scl == SCL_CLOUD_SHADOW
    valid = np.isfinite(b08) & (b08 >= 0)
    n_valid = int(valid.sum())
    if n_valid == 0:
        raise ValueError("no valid pixels; scene is empty or unscaled.")

    shadow_fraction = float(shadow.sum() / n_valid)

    # Water/dark-soil signatures among the shadow-flagged pixels.
    ndwi = (b03 - b08) / np.where((b03 + b08) == 0, np.nan, b03 + b08)
    water_like = shadow & ((ndwi > NDWI_WATER_MIN) | (scl == SCL_WATER) |
                           (b11 < SWIR_WATER_MAX))
    dark_soil_like = shadow & (b08 < NIR_DARK) & (b11 > SWIR_WATER_MAX) & ~water_like

    n_shadow = max(int(shadow.sum()), 1)
    false_pos_fraction = float((water_like.sum() + dark_soil_like.sum()) / n_shadow)

    report = {
        "shadow_fraction": round(shadow_fraction, 4),
        "shadow_pixels": int(shadow.sum()),
        "likely_false_positive_fraction": round(false_pos_fraction, 4),
        "water_like_pixels": int(water_like.sum()),
        "dark_soil_like_pixels": int(dark_soil_like.sum()),
        "target_crs": target_crs,
        "over_masked": shadow_fraction > max_shadow_fraction,
    }
    if report["over_masked"]:
        log.warning("shadow.over_masked", **report)
    else:
        log.info("shadow.diagnosed", **report)
    return report
```

A scene where `likely_false_positive_fraction` runs high is telling you that the geometric confirmation step below will recover most of what the raw mask threw away. Treat both `shadow_fraction` and `likely_false_positive_fraction` as monitored signals on every run, including passes, so a coastline or a fresh burn does not quietly drain observation density before anyone notices.

## Deterministic Transformation Logic

The refinement replaces the spectral guess with a three-part confirmation. First, project the detected cloud mask along the anti-solar direction: a cloud at height `h` casts its shadow a horizontal distance `h / tan(elevation)` away, along the bearing opposite the solar azimuth. Shifting the cloud raster by that vector yields a predicted shadow footprint. Second, intersect that footprint with a darkness test on B08/B11 so only genuinely dark pixels inside the footprint survive. Third, subtract terrain self-shadow computed as a hillshade from the DEM under the same solar geometry, so north-facing slopes are never confused with cloud shadow. Sweeping a small range of candidate cloud heights and taking the union captures the fact that cloud-top height is unknown per pixel.

```python
import numpy as np
import rasterio
import structlog
from datetime import datetime, timezone
from scipy.ndimage import shift as ndi_shift

log = structlog.get_logger()

NIR_DARK = 0.12
SWIR_DARK = 0.10
TERRAIN_SHADOW_MAX = 0.25  # normalised hillshade below this = self-shadowed slope


def _hillshade(dem: np.ndarray, azimuth_deg: float, elevation_deg: float,
               pixel_size: float) -> np.ndarray:
    """Normalised hillshade (0-1) for terrain-shadow exclusion."""
    az = np.deg2rad(360.0 - azimuth_deg + 90.0)
    zen = np.deg2rad(90.0 - elevation_deg)
    dy, dx = np.gradient(dem, pixel_size)
    slope = np.arctan(np.hypot(dx, dy))
    aspect = np.arctan2(-dx, dy)
    hs = (np.cos(zen) * np.cos(slope) +
          np.sin(zen) * np.sin(slope) * np.cos(az - aspect))
    return np.clip(hs, 0.0, 1.0)


def refine_cloud_shadow(
    cloud_mask: np.ndarray,
    b08: np.ndarray,
    b11: np.ndarray,
    dem: np.ndarray,
    solar_azimuth_deg: float,
    solar_elevation_deg: float,
    pixel_size: float = 20.0,       # metres; Sentinel-2 SCL/20m bands
    cloud_heights_m=(500, 1000, 2000, 4000),
    target_crs: str = "EPSG:32633",
    max_shadow_fraction: float = 0.15,
) -> tuple[np.ndarray, dict]:
    """Confirm cloud-shadow pixels by solar-geometry projection.

    Projects clouds along the anti-solar bearing over a range of heights,
    intersects with a NIR/SWIR darkness test, and excludes terrain self-shadow.
    Returns (refined_shadow_mask, provenance) and gates on masked fraction.
    """
    if not (0.0 < solar_elevation_deg < 90.0):
        raise ValueError(f"implausible solar elevation {solar_elevation_deg}")

    # Anti-solar bearing: shadow falls opposite the sun's azimuth.
    shadow_bearing = np.deg2rad((solar_azimuth_deg + 180.0) % 360.0)
    projected = np.zeros_like(cloud_mask, dtype=bool)
    for h in cloud_heights_m:
        dist_px = (h / np.tan(np.deg2rad(solar_elevation_deg))) / pixel_size
        # Row shift is negative for northward displacement (image y grows south).
        row_shift = -dist_px * np.cos(shadow_bearing)
        col_shift = dist_px * np.sin(shadow_bearing)
        shifted = ndi_shift(cloud_mask.astype("float32"),
                            shift=(row_shift, col_shift), order=0,
                            mode="constant", cval=0.0)
        projected |= shifted > 0.5

    # Darkness test: only genuinely dark pixels can be cloud shadow.
    dark = (b08 < NIR_DARK) & (b11 < SWIR_DARK)

    # Terrain self-shadow from hillshade under the same geometry — never cloud.
    hs = _hillshade(dem, solar_azimuth_deg, solar_elevation_deg, pixel_size)
    terrain_shadow = hs < TERRAIN_SHADOW_MAX

    # Confirmed cloud shadow: dark AND inside a projected footprint AND not terrain.
    refined = projected & dark & ~terrain_shadow

    n_valid = max(int(np.isfinite(b08).sum()), 1)
    refined_fraction = float(refined.sum() / n_valid)

    provenance = {
        "solar_azimuth_deg": round(solar_azimuth_deg, 3),
        "solar_elevation_deg": round(solar_elevation_deg, 3),
        "cloud_heights_m": list(cloud_heights_m),
        "pixel_size_m": pixel_size,
        "refined_shadow_fraction": round(refined_fraction, 4),
        "terrain_shadow_excluded_px": int(terrain_shadow.sum()),
        "target_crs": target_crs,
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "method": "solar_geometry_projection + nir_swir_dark + hillshade_exclusion",
    }

    # Validation gate: a refined mask that still over-masks is rejected.
    if refined_fraction > max_shadow_fraction:
        log.warning("shadow.refined_still_over_masked", **provenance)
        raise ValueError(
            f"refined shadow fraction {refined_fraction:.3f} exceeds "
            f"ceiling {max_shadow_fraction}; inspect cloud detector inputs.")

    log.info("shadow.refined", **provenance)
    return refined, provenance
```

The geometric intersection is what recovers the observation density that a spectral-only mask destroys. Water outside any projected footprint is released; a burn scar with no cloud overhead is released; north-facing terrain shadow is removed explicitly. Only pixels that are dark, geometrically consistent with a real cloud, and not self-shadowed terrain remain flagged.

## Compliance Gating & Audit Trail Generation

Every mask that reaches a composite carries the `provenance` dictionary above, and those attributes travel with the raster into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/). A verifier auditing a suppressed alert needs to reconstruct exactly why a pixel was or was not masked, and the solar geometry, projection heights, and terrain-exclusion count make that reconstruction deterministic. Three gates are load-bearing:

1. **Masked-fraction ceiling.** The refined mask is rejected if it still exceeds the configured shadow fraction, forcing an inspection of the upstream cloud detector rather than shipping a thin composite. Over-masking is a compliance risk, not just a data-quality nuisance, because it biases the surviving observations.
2. **False-positive reduction record.** Logging the raw versus refined fraction documents how much water, burn scar, and terrain shadow were recovered, which is the evidence that the mask is neither over- nor under-flagging.
3. **CRS and DEM co-registration.** The DEM, reflectance bands, and cloud mask are asserted onto one UTM grid; a misaligned DEM would place terrain shadow in the wrong location and reintroduce false positives. This ties directly to the alignment guarantees the wider stack depends on.

Validate against a **clear reference date**: pick a near-cloud-free acquisition over the same footprint, run the refiner, and confirm the refined shadow fraction falls to near zero. Any residual flagging on a clear date is, by definition, a false positive and calibrates your darkness and terrain thresholds.

## Production Integration

Deploy the refiner inside the STAC masking flow, following a fixed ingest → diagnose → transform → validate → export → submit sequence:

1. **Ingest.** Read SCL, the s2cloudless probability, B03/B08/B11, and a co-registered DEM for the tile footprint, all reprojected to the tile UTM CRS, reading the cloud probability alongside SCL so the projection input is the more reliable detector.
2. **Diagnose.** Run `diagnose_shadow_mask` to quantify the raw shadow fraction and the likely false-positive share; warn and record when the ceiling is breached.
3. **Transform.** Call `refine_cloud_shadow` with the scene's solar azimuth and elevation from the granule metadata, sweeping candidate cloud heights and excluding hillshade terrain shadow.
4. **Validate.** Assert the refined masked fraction against the ceiling and against a clear reference date; reject masks that still over-flag.
5. **Export.** Write the refined mask as a Cloud-Optimized GeoTIFF with the `provenance` attributes intact so lineage survives serialization.
6. **Submit.** Feed the validated mask into [monthly temporal aggregation of NDVI](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/) and the change models behind the [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/), where the recovered observation density directly improves composite quality.

By replacing "dark equals shadow" with a geometry-confirmed decision — project from solar angles, intersect with a NIR/SWIR darkness test, and subtract terrain self-shadow — the mask stops mistaking water, burn scars, and hillslopes for cloud shadow. The result is a shadow mask that preserves the observation density carbon composites depend on while remaining fully auditable under third-party verification.

## Related guides

- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the parent masking discipline this troubleshooting recipe sits within.
- [Automating Sentinel-2 Cloud Masking with STAC and rasterio](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/automating-sentinel-2-cloud-masking-with-stac-and-rasterio/) — the STAC scaffolding this refiner plugs into.
- [Monthly Temporal Aggregation of NDVI for Land Cover Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/) — the compositing stage that inherits the recovered observation density.
- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — the change-detection layer where burn scars must never be masked as shadow.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — where the mask provenance becomes audit-ready evidence.
