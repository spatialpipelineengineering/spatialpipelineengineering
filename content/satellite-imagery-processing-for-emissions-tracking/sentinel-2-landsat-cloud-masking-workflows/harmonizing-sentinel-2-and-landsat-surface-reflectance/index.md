---
shortTitle: "Harmonizing Sentinel-2 and Landsat Surface Reflectance"
title: "Harmonizing Sentinel-2 and Landsat Surface Reflectance"
description: "Combining Sentinel-2 and Landsat into one time series without inventing change: band pass differences, BRDF normalisation, spatial resampling, and the cross-sensor offsets that get mistaken for degradation."
slug: harmonizing-sentinel-2-and-landsat-surface-reflectance
type: guide
breadcrumb: "Harmonizing Sentinel-2 and Landsat"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Harmonizing Sentinel-2 and Landsat Surface Reflectance

Combining Sentinel-2 and Landsat into a single time series roughly doubles the observation density over a project area, which is the difference between a usable change signal and a cloud-shredded one in most tropical settings. It also introduces a systematic step in the data every time the series switches sensor, and that step has repeatedly been reported as forest degradation by pipelines that did not correct for it. This guide covers the corrections that make the combined series safe to difference, within [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) in the [satellite imagery processing for emissions tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack.

Both sensors deliver a product labelled surface reflectance, and the label conceals four separate differences: the wavelengths each band actually integrates, the viewing geometry at acquisition, the ground sample distance, and the atmospheric correction applied. Each contributes an offset of a few percent in reflectance units — small individually, and collectively large enough to swamp the signal a degradation monitor is looking for, since canopy thinning also moves reflectance by a few percent.

<svg viewBox="0 -4 940 266" role="img" aria-labelledby="hz-t hz-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="hz-t">A combined time series before and after harmonisation</title>
  <desc id="hz-d">Two stacked plots of a vegetation index over three years. The upper plot shows the raw combined series: Sentinel-2 observations sit consistently above Landsat observations by a small but visible offset, so the series appears to step up and down as the sensor alternates, and a change detection algorithm fits breakpoints at the sensor switches. The lower plot shows the same observations after band pass adjustment and BRDF normalisation: the two sensors now overlap within their noise, the series is smooth, and the only breakpoint left is a real disturbance in the second year. An annotation notes that the apparent breakpoints in the upper plot are entirely artefacts of sensor alternation, and that they cluster at whatever cadence the two revisit cycles happen to produce.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The same observations, before and after cross-sensor correction</text>
  </g>
  <g stroke="currentColor" stroke-width="1.2">
    <line x1="70" y1="34" x2="70" y2="118"/><line x1="70" y1="118" x2="700" y2="118"/>
    <line x1="70" y1="152" x2="70" y2="236"/><line x1="70" y1="236" x2="700" y2="236"/>
  </g>
  <g fill="currentColor">
    <circle cx="96" cy="52" r="3.6"/><circle cx="166" cy="50" r="3.6"/><circle cx="236" cy="54" r="3.6"/><circle cx="306" cy="51" r="3.6"/><circle cx="446" cy="76" r="3.6"/><circle cx="516" cy="74" r="3.6"/><circle cx="586" cy="72" r="3.6"/><circle cx="656" cy="70" r="3.6"/>
    <circle cx="96" cy="170" r="3.6"/><circle cx="166" cy="168" r="3.6"/><circle cx="236" cy="172" r="3.6"/><circle cx="306" cy="169" r="3.6"/><circle cx="446" cy="196" r="3.6"/><circle cx="516" cy="194" r="3.6"/><circle cx="586" cy="192" r="3.6"/><circle cx="656" cy="190" r="3.6"/>
  </g>
  <g fill="#f3a712">
    <circle cx="131" cy="70" r="3.6"/><circle cx="201" cy="68" r="3.6"/><circle cx="271" cy="72" r="3.6"/><circle cx="341" cy="69" r="3.6"/><circle cx="481" cy="94" r="3.6"/><circle cx="551" cy="92" r="3.6"/><circle cx="621" cy="90" r="3.6"/><circle cx="691" cy="88" r="3.6"/>
    <circle cx="131" cy="172" r="3.6"/><circle cx="201" cy="170" r="3.6"/><circle cx="271" cy="167" r="3.6"/><circle cx="341" cy="171" r="3.6"/><circle cx="481" cy="193" r="3.6"/><circle cx="551" cy="195" r="3.6"/><circle cx="621" cy="191" r="3.6"/><circle cx="691" cy="193" r="3.6"/>
  </g>
  <path d="M96 52 L131 70 L166 50 L201 68 L236 54 L271 72 L306 51 L341 69 L446 76 L481 94 L516 74 L551 92 L586 72 L621 90 L656 70 L691 88" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.45"/>
  <path d="M96 170 L131 172 L166 168 L201 170 L236 172 L271 167 L306 169 L341 171 L446 196 L481 193 L516 194 L551 195 L586 192 L621 191 L656 190 L691 193" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.45"/>
  <line x1="393" y1="34" x2="393" y2="118" stroke="#f3a712" stroke-width="1.4" stroke-dasharray="5,3"/>
  <line x1="393" y1="152" x2="393" y2="236" stroke="#f3a712" stroke-width="1.4" stroke-dasharray="5,3"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">
    <text x="62" y="42" text-anchor="end" opacity="0.8">high</text>
    <text x="62" y="122" text-anchor="end" opacity="0.8">low</text>
    <text x="62" y="160" text-anchor="end" opacity="0.8">high</text>
    <text x="62" y="240" text-anchor="end" opacity="0.8">low</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="716" y="52" fill="currentColor" font-weight="700">Raw combined</text>
    <text x="716" y="70" fill="currentColor" opacity="0.78">saw-tooth from sensor</text>
    <text x="716" y="86" fill="currentColor" opacity="0.78">alternation; breakpoints</text>
    <text x="716" y="102" fill="currentColor" opacity="0.78">fitted at every switch</text>
    <text x="716" y="170" fill="#f3a712" font-weight="700">Harmonised</text>
    <text x="716" y="188" fill="currentColor" opacity="0.78">sensors overlap within noise;</text>
    <text x="716" y="204" fill="currentColor" opacity="0.78">one real break remains</text>
    <text x="393" y="252" fill="#f3a712" font-size="9" font-weight="700" text-anchor="middle">the only real disturbance</text>
  </g>
</svg>

## Root Cause Analysis

Four independent mechanisms produce the offset, and they need separating because only two of them are correctable by a simple linear adjustment.

**Band pass mismatch.** Sentinel-2's red band spans a different wavelength interval from Landsat 8's, and its near-infrared band is markedly narrower. Because vegetation reflectance varies steeply across those intervals, the two instruments integrate different amounts of signal over what is nominally the same band. The resulting difference is systematic, depends on the surface being observed, and is largest exactly where the spectral response is steepest — the red edge, which is where vegetation monitoring lives. Published band pass adjustment coefficients handle the first-order part of this well; they are surface-type dependent, and applying coefficients derived over cropland to closed tropical forest leaves a residual.

**Viewing and illumination geometry.** Landsat views near-nadir; Sentinel-2 has a field of view of about twenty degrees, so an observation near the swath edge sees the canopy at a substantially different angle from one at the centre. Forest canopies are strongly anisotropic reflectors — they look brighter when viewed from the illumination direction and darker from the opposite side — so the same stand yields different reflectance depending on where in the swath it falls. This is a within-Sentinel-2 problem as well as a cross-sensor one, and it is the component most often left uncorrected.

**Spatial support.** Ten and twenty metre Sentinel-2 pixels against thirty metre Landsat pixels means each observation integrates a different mix of canopy, gap, and shadow. Resampling changes the numbers but not the underlying support mismatch, and in heterogeneous canopy the residual difference persists after every other correction. This one cannot be removed, only managed, by aggregating both to a common coarser grid where support genuinely matches.

**Atmospheric correction.** The two agencies' processors differ in their aerosol retrieval and their handling of adjacency effects, and the difference is largest under high aerosol loading — which in practice means the tropics in burning season, precisely when a deforestation monitor most wants data. Product version matters here too: reprocessing campaigns have shifted these offsets, so a series spanning a collection change contains a step even within a single sensor.

The pattern to internalise is that the first two are correctable with published coefficients and a BRDF model, the third is manageable by choice of grid, and the fourth is best handled by filtering rather than correcting — excluding observations under high aerosol loading rather than trying to fix them.

## Diagnostic Pipeline / Pre-Flight Validation

Before harmonising anything, measure the offset empirically on the project's own surfaces. Published coefficients are a starting point, not an answer, and the check that matters is whether same-day observations from the two sensors agree after correction.

```python
from dataclasses import dataclass
from datetime import date

import numpy as np
import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class CrossSensorPair:
    """Same location, same day, both sensors — the only clean comparison.

    Same-day pairs are rare (the orbits coincide occasionally) but they are
    the only observations where the surface is guaranteed identical, so
    every offset estimate should be built from them rather than from
    seasonal means that confound phenology with sensor difference.
    """
    lon: float
    lat: float
    acquired: date
    band: str
    s2_reflectance: float
    landsat_reflectance: float
    s2_view_zenith_deg: float
    solar_zenith_deg: float
    land_cover: str


@dataclass(frozen=True)
class BandOffset:
    band: str
    slope: float
    intercept: float
    residual_std: float
    n_pairs: int
    land_cover: str


MIN_PAIRS = 200
MAX_ACCEPTABLE_RESIDUAL = 0.015     # reflectance units


def fit_band_offset(pairs: list[CrossSensorPair], band: str, cover: str) -> BandOffset:
    """Ordinary least squares of Landsat on Sentinel-2 for one band and cover.

    Fitted per land cover deliberately. A single global adjustment fitted
    across forest, water, and bare soil is dominated by whichever class has
    the most pairs, and applies that class's correction everywhere.
    """
    sel = [p for p in pairs if p.band == band and p.land_cover == cover]
    if len(sel) < MIN_PAIRS:
        raise ValueError(
            f"{len(sel)} same-day pairs for band {band} over {cover}; "
            f"at least {MIN_PAIRS} are needed for a stable fit. Widen the "
            "date window to ±1 day before falling back to published "
            "coefficients, and record which was used."
        )

    x = np.array([p.s2_reflectance for p in sel])
    y = np.array([p.landsat_reflectance for p in sel])
    slope, intercept = np.polyfit(x, y, 1)
    residual = y - (slope * x + intercept)

    offset = BandOffset(
        band=band,
        slope=float(slope),
        intercept=float(intercept),
        residual_std=float(residual.std()),
        n_pairs=len(sel),
        land_cover=cover,
    )

    if offset.residual_std > MAX_ACCEPTABLE_RESIDUAL:
        log.warning(
            "harmonisation.residual_high",
            band=band, land_cover=cover,
            residual_std=round(offset.residual_std, 4),
            hint="check for view-angle spread — fit BRDF before band pass",
        )

    log.info(
        "harmonisation.offset_fitted",
        band=band, land_cover=cover,
        slope=round(offset.slope, 4), intercept=round(offset.intercept, 5),
        n_pairs=offset.n_pairs,
    )
    return offset


def assert_view_angle_spread(pairs: list[CrossSensorPair]) -> None:
    """Refuse to fit a band pass offset while view angle is uncorrected.

    If the Sentinel-2 pairs span a wide range of view zenith angles, the
    fitted 'band pass' offset silently absorbs the BRDF effect, and the
    resulting coefficients only work at the mean view angle of the fit set.
    """
    angles = np.array([p.s2_view_zenith_deg for p in pairs])
    spread = float(angles.max() - angles.min())
    if spread > 8.0:
        raise ValueError(
            f"view zenith spread is {spread:.1f}° across the fit set — apply "
            "BRDF normalisation to nadir first, then fit the band pass "
            "offset on normalised reflectance"
        )
```

The view-angle assertion is the one that catches the subtle version of this problem. A band pass correction fitted on an angle-diverse set looks excellent on its own fit data and then performs poorly on new observations acquired at a different position in the swath, which shows up months later as seasonal-looking drift.

<svg viewBox="0 -4 900 258" role="img" aria-labelledby="ord-t ord-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ord-t">The correction order, and what goes wrong when two steps are swapped</title>
  <desc id="ord-d">A pipeline in five ordered steps with a warning attached to one transition. First, mask cloud and cloud shadow, because contaminated pixels corrupt every subsequent fit. Second, filter on aerosol optical depth, discarding rather than correcting observations under heavy haze. Third, normalise for bidirectional reflectance to a common nadir view and fixed solar zenith, which removes the angular component. Fourth, apply band pass adjustment per land cover on the normalised reflectance. Fifth, aggregate both sensors to a common grid so spatial support matches. A red annotation between steps three and four notes that swapping them causes the band pass coefficients to absorb the angular effect, producing coefficients valid only at the mean view angle of the fitting set.</desc>
  <defs>
    <marker id="ord-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Order matters — steps 3 and 4 are not commutative</text>
    <rect x="12" y="40" width="164" height="82" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="40" width="164" height="82" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="94" y="66" fill="currentColor" font-size="10" font-weight="700">1 · Mask cloud</text>
    <text x="94" y="84" fill="currentColor" font-size="10" font-weight="700">and shadow</text>
    <text x="94" y="106" fill="currentColor" font-size="8.5" opacity="0.75">contamination breaks every fit</text>
    <rect x="192" y="40" width="164" height="82" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="192" y="40" width="164" height="82" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="274" y="66" fill="currentColor" font-size="10" font-weight="700">2 · Filter on</text>
    <text x="274" y="84" fill="currentColor" font-size="10" font-weight="700">aerosol depth</text>
    <text x="274" y="106" fill="currentColor" font-size="8.5" opacity="0.75">discard, do not correct</text>
    <rect x="372" y="40" width="164" height="82" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="372" y="40" width="164" height="82" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="454" y="66" fill="currentColor" font-size="10" font-weight="700">3 · BRDF to nadir</text>
    <text x="454" y="84" fill="currentColor" font-size="8.5" opacity="0.8">fixed solar zenith,</text>
    <text x="454" y="100" fill="currentColor" font-size="8.5" opacity="0.8">removes the angular term</text>
    <rect x="552" y="40" width="164" height="82" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="552" y="40" width="164" height="82" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="634" y="66" fill="currentColor" font-size="10" font-weight="700">4 · Band pass</text>
    <text x="634" y="84" fill="currentColor" font-size="8.5" opacity="0.8">per land cover,</text>
    <text x="634" y="100" fill="currentColor" font-size="8.5" opacity="0.8">on normalised reflectance</text>
    <rect x="732" y="40" width="156" height="82" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="732" y="40" width="156" height="82" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="810" y="66" fill="currentColor" font-size="10" font-weight="700">5 · Common grid</text>
    <text x="810" y="84" fill="currentColor" font-size="8.5" opacity="0.8">match spatial support,</text>
    <text x="810" y="100" fill="currentColor" font-size="8.5" opacity="0.8">not just resolution</text>
    <rect x="12" y="176" width="876" height="72" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="176" width="876" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="1.5"/>
    <text x="450" y="200" fill="#f3a712" font-size="10" font-weight="700">Swap 3 and 4 and the band pass coefficients absorb the angular effect.</text>
    <text x="450" y="222" fill="currentColor" font-size="9.5" opacity="0.85">They then fit their own training set beautifully and fail on any observation acquired elsewhere in the swath —</text>
    <text x="450" y="240" fill="currentColor" font-size="9.5" opacity="0.85">which surfaces later as a seasonal-looking drift with no physical explanation.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#ord-arrow)">
    <line x1="176" y1="81" x2="190" y2="81"/><line x1="356" y1="81" x2="370" y2="81"/>
    <line x1="536" y1="81" x2="550" y2="81"/><line x1="716" y1="81" x2="730" y2="81"/>
  </g>
  <text x="450" y="148" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">the two amber steps must run in this order</text>
</svg>

## Deterministic Transformation Logic

The harmonisation itself applies the corrections in the order established above and records what it did to each observation. The record matters as much as the correction, because a downstream analyst seeing an unexpected value needs to know which coefficients touched it.

```python
from dataclasses import dataclass, replace


@dataclass(frozen=True)
class Observation:
    obs_id: str
    sensor: str                 # S2A | S2B | L8 | L9
    band: str
    reflectance: float
    view_zenith_deg: float
    solar_zenith_deg: float
    relative_azimuth_deg: float
    land_cover: str
    aerosol_optical_depth: float
    harmonised: bool = False
    corrections: tuple[str, ...] = ()


# c-factor BRDF normalisation, RossThick-LiSparse kernel weights per band.
# These are the MODIS-derived constants in standard use for this correction.
BRDF_WEIGHTS = {
    "red":  (0.0409, 0.0071),
    "nir":  (0.1789, 0.0574),
    "swir": (0.2580, 0.0605),
}
AOD_LIMIT = 0.4
TARGET_SOLAR_ZENITH = 45.0


def _kernel_ratio(band: str, view_zenith: float, solar_zenith: float) -> float:
    """Ratio of the kernel-weighted BRDF at nadir to that at the observation.

    A simplified c-factor. In production this calls the full RossThick and
    LiSparse kernels; the structure is what matters here — the correction is
    a multiplicative ratio, so it is exactly reversible and can be logged as
    a single number per observation.
    """
    import math

    f_iso = 1.0
    f_vol, f_geo = BRDF_WEIGHTS[band]
    vz, sz = math.radians(view_zenith), math.radians(solar_zenith)
    tz = math.radians(TARGET_SOLAR_ZENITH)

    at_obs = f_iso + f_vol * (vz + sz) * 0.35 + f_geo * (vz * sz) * 0.2
    at_nadir = f_iso + f_vol * tz * 0.35
    return at_nadir / at_obs


def harmonise(obs: Observation, offsets: dict[tuple[str, str], BandOffset]) -> Observation | None:
    """Bring one observation onto the Landsat reference scale.

    Returns None for observations that must be discarded rather than
    corrected. Landsat is chosen as the reference because its archive is
    longer, so harmonising toward it keeps historical series intact rather
    than requiring the whole archive to be reprocessed.
    """
    if obs.harmonised:
        raise ValueError(f"observation {obs.obs_id} has already been harmonised")

    if obs.aerosol_optical_depth > AOD_LIMIT:
        log.info("harmonisation.discarded", obs_id=obs.obs_id,
                 reason="aod_above_limit", aod=obs.aerosol_optical_depth)
        return None

    value = obs.reflectance
    applied: list[str] = []

    ratio = _kernel_ratio(obs.band, obs.view_zenith_deg, obs.solar_zenith_deg)
    value *= ratio
    applied.append(f"brdf_cfactor={ratio:.5f}")

    if obs.sensor.startswith("S2"):
        key = (obs.band, obs.land_cover)
        if key not in offsets:
            log.warning("harmonisation.no_offset", obs_id=obs.obs_id,
                        band=obs.band, land_cover=obs.land_cover)
            return None
        off = offsets[key]
        value = off.slope * value + off.intercept
        applied.append(f"bandpass={off.slope:.4f}x+{off.intercept:.5f}")

    if not 0.0 <= value <= 1.0:
        log.warning("harmonisation.out_of_range", obs_id=obs.obs_id,
                    corrected=round(value, 4), original=obs.reflectance)
        return None

    return replace(obs, reflectance=value, harmonised=True,
                   corrections=tuple(applied))
```

Two details in that function carry more weight than their line count. Refusing to harmonise an already-harmonised observation prevents the double-correction that occurs whenever a backfill overlaps a completed range, and it fails loudly instead of producing a plausible wrong number. Returning `None` rather than a flagged value for discarded observations means a caller cannot accidentally include them, which a nullable field invites.

## Compliance Gating & Audit Trail Generation

A harmonised series carries an obligation that a single-sensor one does not: to show that any detected change is not a sensor artefact.

Per-observation correction records. The `corrections` tuple above is the audit unit — it states the exact multiplicative and linear factors applied, so any value can be reversed to its source.

The fitted offsets with their provenance. Which land covers were fitted, how many same-day pairs supported each, the residual standard deviation, and whether published coefficients were substituted for any band. A verifier comparing two monitoring periods will want to know whether the coefficients changed between them.

A sensor-composition summary per period. If one period is eighty percent Sentinel-2 and the next is forty percent, any residual harmonisation error appears as a change between the periods. Reporting the composition makes the risk visible and lets a reviewer weigh it.

Discard counts by reason. High aerosol, missing offset, out-of-range after correction — these should be counted and reported, because a period where a third of the observations were discarded for aerosol is a period with a thin, potentially biased sample, and the bias is toward clear days.

## Production Integration

In practice the harmonisation sits between cloud masking and any temporal compositing, and it must run before change detection rather than after. The clearest sign it has been placed wrongly is breakpoints clustering at intervals matching the sensors' combined revisit pattern, which the algorithms described in [CCDC vs LandTrendr vs BFAST for carbon monitoring](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/ccdc-vs-landtrendr-vs-bfast-for-carbon-monitoring/) will happily fit as real events.

Where a project already consumes a harmonised product — HLS being the widely used one — most of this work is done upstream, and the remaining job is to verify rather than repeat it. The verification is the same same-day pair analysis: pull the pairs, fit the residual offset, and confirm it is within noise. Harmonised products are generally good, and they are fitted globally, so a project over an unusual surface can still see a residual worth knowing about.

The masking that precedes all of this deserves its own attention, since a cloud-contaminated pixel entering an offset fit corrupts the coefficients for every observation afterwards — see [automating Sentinel-2 cloud masking with STAC and rasterio](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/automating-sentinel-2-cloud-masking-with-stac-and-rasterio/) for that layer, and [troubleshooting cloud shadow false positives in Sentinel-2](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/troubleshooting-cloud-shadow-false-positives-in-sentinel-2/) for the shadow cases that survive it.

<svg viewBox="0 -4 900 244" role="img" aria-labelledby="ang-t ang-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ang-t">Why the same canopy reflects differently across a Sentinel-2 swath</title>
  <desc id="ang-d">A cross-section of a forest canopy with the sun at a fixed position on the left and three viewing positions across the swath. Viewing from the western edge, close to the illumination direction, the sensor sees mostly sunlit crown and little shadow, so reflectance reads high. Viewing at nadir in the swath centre, the sensor sees a mixture of sunlit crown and shadow, so reflectance reads at the reference level. Viewing from the eastern edge, away from the illumination direction, the sensor sees proportionally more shadow between crowns, so reflectance reads low. A panel notes that this variation across a single scene is comparable in size to the cross-sensor offset, and that it is the component most often left uncorrected.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The same stand, three positions in the swath, three reflectances</text>
  </g>
  <circle cx="60" cy="48" r="14" fill="#f3a712" opacity="0.7"/>
  <text x="60" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.8">sun</text>
  <g stroke="#f3a712" stroke-width="1.1" opacity="0.55">
    <line x1="74" y1="56" x2="230" y2="150"/><line x1="74" y1="62" x2="330" y2="150"/><line x1="74" y1="68" x2="430" y2="150"/><line x1="74" y1="74" x2="530" y2="150"/><line x1="74" y1="80" x2="630" y2="150"/>
  </g>
  <g fill="currentColor" opacity="0.5">
    <ellipse cx="230" cy="150" rx="30" ry="16"/><ellipse cx="330" cy="150" rx="30" ry="16"/><ellipse cx="430" cy="150" rx="30" ry="16"/><ellipse cx="530" cy="150" rx="30" ry="16"/><ellipse cx="630" cy="150" rx="30" ry="16"/>
  </g>
  <g fill="currentColor" opacity="0.22">
    <rect x="258" y="150" width="44" height="14"/><rect x="358" y="150" width="44" height="14"/><rect x="458" y="150" width="44" height="14"/><rect x="558" y="150" width="44" height="14"/>
  </g>
  <line x1="180" y1="166" x2="690" y2="166" stroke="currentColor" stroke-width="1.4"/>
  <g stroke="currentColor" stroke-width="1.6" fill="none" stroke-dasharray="4,3">
    <line x1="230" y1="140" x2="196" y2="52"/><line x1="430" y1="140" x2="430" y2="52"/><line x1="630" y1="140" x2="664" y2="52"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5" text-anchor="middle">
    <text x="196" y="44" fill="currentColor" font-weight="700">west edge</text>
    <text x="196" y="200" fill="currentColor" opacity="0.85">mostly sunlit crown</text>
    <text x="196" y="216" fill="currentColor" font-weight="700">reflectance high</text>
    <text x="430" y="44" fill="currentColor" font-weight="700">nadir</text>
    <text x="430" y="200" fill="currentColor" opacity="0.85">crown and shadow mixed</text>
    <text x="430" y="216" fill="currentColor" font-weight="700">reference level</text>
    <text x="664" y="44" fill="currentColor" font-weight="700">east edge</text>
    <text x="664" y="200" fill="currentColor" opacity="0.85">more shadow between crowns</text>
    <text x="664" y="216" fill="currentColor" font-weight="700">reflectance low</text>
  </g>
  <text x="450" y="238" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="#f3a712" font-weight="700">This within-scene variation rivals the cross-sensor offset — and it is the one most pipelines never correct.</text>
</svg>

## Frequently Asked Questions

### Should the series be harmonised toward Sentinel-2 or toward Landsat?

Toward Landsat, in almost every case, because the Landsat archive extends back four decades and a baseline period nearly always draws on it. Harmonising toward Sentinel-2 means every historical observation needs adjusting, which is both more computation and more risk, and it makes the series depend on a mission that started in 2015. The exception is a project whose entire history is post-2017 and whose analysis is resolution-sensitive, where keeping the ten-metre detail may be worth more than the archive.

### Are published band pass coefficients good enough on their own?

For most land covers, close. They are fitted globally, so they carry a residual over any specific surface, and that residual is largest over surfaces poorly represented in the fitting set — dense tropical canopy, wetlands, and anything with strong understory contribution. The practical approach is to apply published coefficients as the default, fit local ones where enough same-day pairs exist, and record which was used per band and land cover. A project that never checks will not know which case it is in.

### How many same-day pairs realistically exist?

Fewer than intuition suggests, and heavily biased toward clear conditions. Landsat and Sentinel-2 orbits coincide at a given location only occasionally, and both must be cloud-free at that moment. Over a single project area a year of data might yield a few hundred usable pixel pairs, which is why widening to a one-day window is common. The widening is safe for reflectance over stable surfaces and unsafe during rapid phenological change, so it should be applied outside the green-up and senescence windows.

### Does harmonisation help or hurt a change detection algorithm's sensitivity?

It helps substantially, and the mechanism is worth understanding. Change detection algorithms estimate a noise level from the series and flag departures beyond it. An unharmonised series has an inflated noise level because of the sensor saw-tooth, so genuine small changes fall inside the noise and go undetected. Harmonising both removes the false breakpoints at sensor switches and lowers the noise floor, making real degradation detectable that previously was not.

### What about Landsat 7, and the scan line corrector gap?

Landsat 7 can be included, with two caveats. Its post-2003 imagery has systematic data gaps from the scan line corrector failure, which must be masked rather than interpolated for change work, and its radiometry differs enough from Landsat 8 that it needs its own offset rather than being pooled into a generic Landsat class. Many projects exclude it for the monitoring period and use it only for the historical baseline, where its lower quality is offset by there being no alternative.

### How should a collection or processing baseline change be handled mid-series?

As a new sensor. A reprocessing campaign that changes the atmospheric correction produces a step in the series exactly like a cross-sensor one, and treating collection version as part of the sensor identity handles it with machinery already present. This means the offset table is keyed on sensor, collection, band, and land cover — larger, but it makes a collection migration a matter of fitting one more set of coefficients rather than discovering a mysterious step months afterward.

### Is aggregating both sensors to a coarser common grid always necessary?

Not always, but it is the honest option when the analysis differences two dates. Resampling Sentinel-2 to thirty metres and calling the support matched is not quite true — a resampled ten-metre pixel and a native thirty-metre pixel integrate differently — though the residual is small relative to the other terms in closed canopy. In heterogeneous or fragmented landscapes the residual grows, and aggregating both to sixty metres or to a stand-level polygon removes it entirely at the cost of spatial detail. Which trade is right depends on whether the minimum mapping unit is closer to a pixel or a stand.

## Related guides

- [Sentinel-2 Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the parent topic and the masking that must precede harmonisation.
- [Automating Sentinel-2 Cloud Masking with STAC and Rasterio](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/automating-sentinel-2-cloud-masking-with-stac-and-rasterio/) — the masking step whose output feeds these offset fits.
- [Troubleshooting Cloud Shadow False Positives in Sentinel-2](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/troubleshooting-cloud-shadow-false-positives-in-sentinel-2/) — the contamination that most corrupts a cross-sensor fit.
- [CCDC vs LandTrendr vs BFAST for Carbon Monitoring](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/ccdc-vs-landtrendr-vs-bfast-for-carbon-monitoring/) — the algorithms that will fit breakpoints at sensor switches if this step is skipped.
