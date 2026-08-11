---
shortTitle: "Methane Plume Detection from Hyperspectral Imagery"
title: "Methane Plume Detection from Hyperspectral Imagery"
description: "How hyperspectral and multispectral satellites detect methane plumes for MRV: matched-filter retrieval, the three failure modes that produce phantom plumes, a deterministic Python detection stage, and the evidence auditors require."
slug: methane-plume-detection-from-hyperspectral-imagery
type: topic
breadcrumb: "Methane Plume Detection"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Methane Plume Detection from Hyperspectral Imagery

Methane plume detection is the retrieval discipline that turns shortwave-infrared radiance into a per-pixel methane enhancement map, isolates coherent plumes from instrument and surface noise, and attributes each one to a facility — and it is the highest-leverage, highest-risk component of the [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack. Highest-leverage because a single unlit flare or compressor blowdown can dominate a site's annual inventory; highest-risk because the same spectral absorption feature that reveals methane is mimicked by bright bare soil, calcite, and paved surfaces, so a careless pipeline reports emissions where none exist. Everything here builds on the same discipline that governs [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — a mask that is wrong in one direction invents signal, and wrong in the other destroys it.

<svg viewBox="0 74 940 240" role="img" aria-labelledby="ch4-t ch4-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ch4-t">Methane retrieval chain from shortwave-infrared radiance to an attributed, quantified plume</title>
  <desc id="ch4-d">Five sequential stages. Stage one, SWIR radiance from the 2100 to 2400 nanometre window. Stage two, a matched filter against the methane absorption spectrum producing a per-pixel enhancement in parts per million metre. Stage three, plume segmentation that keeps only coherent connected components above the scene noise floor. Stage four, wind-informed quantification converting the integrated mass enhancement to a kilograms per hour flux. Stage five, facility attribution and lineage. Two rejection paths leave the chain: surface-albedo false positives are discarded at segmentation, and plumes without a wind field are held rather than quantified.</desc>
  <defs>
    <marker id="ch4-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="14" y="86" width="158" height="76" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="14" y="86" width="158" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="93" y="110" fill="currentColor" font-size="11.5" font-weight="700">SWIR radiance</text>
    <text x="93" y="128" fill="currentColor" font-size="9.5" opacity="0.78">2100–2400 nm window</text>
    <text x="93" y="145" fill="currentColor" font-size="9.5" opacity="0.78">EMIT · PRISMA · S2 B11/B12</text>
    <rect x="196" y="86" width="158" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="275" y="110" fill="currentColor" font-size="11.5" font-weight="700">Matched filter</text>
    <text x="275" y="128" fill="currentColor" font-size="9.5" opacity="0.78">scene covariance +</text>
    <text x="275" y="145" fill="currentColor" font-size="9.5" opacity="0.78">CH₄ target spectrum</text>
    <rect x="378" y="86" width="158" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="457" y="110" fill="currentColor" font-size="11.5" font-weight="700">Segmentation</text>
    <text x="457" y="128" fill="currentColor" font-size="9.5" opacity="0.78">connected components</text>
    <text x="457" y="145" fill="currentColor" font-size="9.5" opacity="0.78">above scene noise floor</text>
    <rect x="560" y="86" width="158" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="639" y="110" fill="currentColor" font-size="11.5" font-weight="700">Quantification</text>
    <text x="639" y="128" fill="currentColor" font-size="9.5" opacity="0.78">integrated mass ÷ wind</text>
    <text x="639" y="145" fill="currentColor" font-size="9.5" opacity="0.78">→ kg h⁻¹ flux</text>
    <rect x="742" y="86" width="176" height="76" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="742" y="86" width="176" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <text x="830" y="110" fill="currentColor" font-size="11.5" font-weight="700">Attribution</text>
    <text x="830" y="128" fill="currentColor" font-size="9.5" opacity="0.78">facility polygon join</text>
    <text x="830" y="145" fill="currentColor" font-size="9.5" opacity="0.78">+ retrieval lineage</text>
    <rect x="378" y="240" width="158" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3" opacity="0.75"/>
    <text x="457" y="264" fill="currentColor" font-size="10.5" font-weight="700" opacity="0.9">Discarded</text>
    <text x="457" y="282" fill="currentColor" font-size="9.5" opacity="0.72">albedo artefacts</text>
    <rect x="560" y="240" width="158" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3" opacity="0.75"/>
    <text x="639" y="264" fill="currentColor" font-size="10.5" font-weight="700" opacity="0.9">Held, not quantified</text>
    <text x="639" y="282" fill="currentColor" font-size="9.5" opacity="0.72">no wind field</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#ch4-arrow)">
    <line x1="172" y1="124" x2="194" y2="124"/>
    <line x1="354" y1="124" x2="376" y2="124"/>
    <line x1="536" y1="124" x2="558" y2="124"/>
    <line x1="718" y1="124" x2="740" y2="124"/>
    <line x1="457" y1="162" x2="457" y2="238" stroke-dasharray="5,4"/>
    <line x1="639" y1="162" x2="639" y2="238" stroke-dasharray="5,4"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="9.5" font-weight="600">
    <text x="93" y="196" fill="currentColor" opacity="0.62">radiance cube</text>
    <text x="275" y="196" fill="currentColor" opacity="0.62">ppm·m enhancement</text>
    <text x="457" y="196" fill="currentColor" opacity="0.62">plume mask</text>
    <text x="639" y="196" fill="currentColor" opacity="0.62">flux estimate</text>
    <text x="830" y="196" fill="currentColor" opacity="0.62">reportable record</text>
  </g>
</svg>

## Role in the MRV Workflow

Methane retrieval sits in the observation layer, immediately after atmospheric correction and immediately before emissions attribution. Its upstream dependency is a radiometrically calibrated, geometrically registered scene: an EMIT or PRISMA hyperspectral cube, an EnMAP acquisition, or — for coarse screening at scale — the Sentinel-2 SWIR band pair. Its downstream consumer is the facility-level inventory, where a plume flux in kilograms per hour becomes an annualised tonnage that flows into corporate reporting through the same channels as any other activity datum, subject to the same [emissions data quality validation gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/).

What makes methane structurally different from land-carbon work is the time base. A forest-carbon pipeline aggregates observations over months and tolerates missing scenes because the underlying stock changes slowly. A methane plume is an instantaneous snapshot of a process that may have started forty minutes before overpass and stopped an hour after. The retrieval measures a *rate*, not a *stock*, and converting a handful of instantaneous rates into an annual mass requires an explicit, documented temporal model — persistence assumptions, detection-limit-aware upper bounds for non-detections, and a duty-cycle estimate for intermittent sources. Pipelines that skip that step produce annual figures whose uncertainty is unbounded, and verifiers reject them.

The second structural difference is the detection limit. Every retrieval has a minimum detectable enhancement set by instrument noise, surface heterogeneity, and plume geometry, and that limit varies pixel-by-pixel across a single scene. A non-detection over dark, spectrally uniform water means something very different from a non-detection over a heterogeneous industrial yard, where the limit may be five times higher. Reporting "no emissions observed" without reporting the scene-specific detection limit alongside it is the single most common way a methane inventory becomes indefensible, and it is why the implementation below carries the per-scene noise floor through to the output record rather than discarding it after thresholding.

Finally, methane retrieval is unusually dependent on geometry that must be exactly right. The plume mask is intersected with facility polygons to assign the emission to an operator, and that join inherits every risk documented under [geospatial CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/). A thirty-metre georegistration error is irrelevant when mapping a ten-thousand-hectare forest parcel; it reassigns a plume from one wellpad operator to their neighbour.

## Core Failure Modes

Three failure modes account for most bad methane records reaching an inventory. Each has a distinct spectral or geometric root cause and a characteristic signature you can test for.

1. **Albedo-driven false enhancements over bright, mineral-rich surfaces.** The matched filter looks for a specific absorption shape in the 2200–2400 nm region, and several common surface materials — calcite, kaolinite, gypsum-rich playa, fresh asphalt, some painted metal roofs — carry absorption features that partially project onto the methane target spectrum. The retrieval reports a positive enhancement that is a property of the ground, not the atmosphere. The signature is diagnostic: a real plume is a coherent, wind-aligned structure anchored to a point source and it *moves between overpasses*, while an albedo artefact is pixel-locked, repeats in identical shape on every clear acquisition, and correlates with the scene's broadband reflectance. Pipelines that threshold the enhancement map without a persistence test and an albedo correlation test typically carry 20–60% false positives over arid basins.

2. **Wind-field error dominating the flux uncertainty budget.** The integrated mass enhancement (IME) method converts a plume's total mass to a flux by dividing by an effective length and multiplying by an effective wind speed. The retrieval itself may be good to 15–25%, but a reanalysis wind product at 0.25° resolution, interpolated to an overpass time, routinely carries 40–60% error at the ten-metre level that actually transports the plume. Wind error therefore dominates the total budget, and — critically — it is not reduced by better imagery. Teams that report a flux with a tight uncertainty derived only from retrieval precision are understating their true error by a factor of two or more, which is precisely the misstatement that [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) exists to prevent.

3. **Detection-limit blindness turned into a false zero.** Non-detections are data, but only if the detection limit is recorded. A pipeline that emits rows only for detected plumes silently converts "we could not have seen anything below 400 kg h⁻¹ here" into "there was nothing here", and an annual inventory built from those rows understates emissions by whatever fraction of sources sit below the limit — typically the long tail of small, chronic leaks that dominate site-level totals at many upstream assets. The fix is architectural rather than algorithmic: every scene-facility pair must produce a row, detection or not, carrying the computed limit.

<svg viewBox="0 0 900 300" role="img" aria-labelledby="ch4f-t ch4f-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ch4f-t">Separating a real plume from an albedo artefact using persistence across three overpasses</title>
  <defs>
    <marker id="ch4f-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <desc id="ch4f-d">Two rows of three small scene panels each. The top row, labelled real plume, shows an enhancement blob that changes shape and direction with the wind arrow on each of three dates, and is anchored to a fixed source marker. The bottom row, labelled albedo artefact, shows an identical pixel-locked patch in the same position and shape on all three dates, unrelated to the wind arrows. A verdict column on the right states the test: shape correlation across dates above 0.9 with no wind alignment indicates a surface artefact and is rejected.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="14" y="22" fill="currentColor" font-size="11.5" font-weight="700">Persistence test — the cheapest false-positive filter you can run</text>
    <text x="14" y="40" fill="currentColor" font-size="9.5" opacity="0.72">Same facility, three clear overpasses. A plume is transported by wind; a surface feature is not.</text>
    <text x="76" y="70" fill="currentColor" font-size="10" font-weight="600" opacity="0.72">2026-03-04</text>
    <text x="256" y="70" fill="currentColor" font-size="10" font-weight="600" opacity="0.72">2026-03-19</text>
    <text x="436" y="70" fill="currentColor" font-size="10" font-weight="600" opacity="0.72">2026-04-02</text>
    <text x="620" y="70" fill="currentColor" font-size="10" font-weight="600" opacity="0.72">Verdict</text>
  </g>
  <g>
    <text x="14" y="112" font-family="system-ui, sans-serif" font-size="10.5" font-weight="700" fill="currentColor">Real plume</text>
    <rect x="14" y="120" width="124" height="70" rx="6" fill="currentColor" opacity="0.05"/>
    <rect x="14" y="120" width="124" height="70" rx="6" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.7"/>
    <path d="M40 172 C 62 168, 84 152, 108 138" stroke="#f3a712" stroke-width="9" stroke-linecap="round" fill="none" opacity="0.55"/>
    <circle cx="38" cy="174" r="4" fill="currentColor"/>
    <path d="M96 182 L124 168" stroke="currentColor" stroke-width="1.2" opacity="0.65" marker-end="url(#ch4f-arrow)"/>
    <rect x="194" y="120" width="124" height="70" rx="6" fill="currentColor" opacity="0.05"/>
    <rect x="194" y="120" width="124" height="70" rx="6" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.7"/>
    <path d="M220 172 C 234 154, 244 142, 250 128" stroke="#f3a712" stroke-width="9" stroke-linecap="round" fill="none" opacity="0.55"/>
    <circle cx="218" cy="174" r="4" fill="currentColor"/>
    <path d="M282 186 L292 158" stroke="currentColor" stroke-width="1.2" opacity="0.65" marker-end="url(#ch4f-arrow)"/>
    <rect x="374" y="120" width="124" height="70" rx="6" fill="currentColor" opacity="0.05"/>
    <rect x="374" y="120" width="124" height="70" rx="6" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.7"/>
    <path d="M400 172 C 420 176, 444 178, 470 176" stroke="#f3a712" stroke-width="9" stroke-linecap="round" fill="none" opacity="0.55"/>
    <circle cx="398" cy="174" r="4" fill="currentColor"/>
    <path d="M452 148 L482 150" stroke="currentColor" stroke-width="1.2" opacity="0.65" marker-end="url(#ch4f-arrow)"/>
  </g>
  <g>
    <text x="14" y="232" font-family="system-ui, sans-serif" font-size="10.5" font-weight="700" fill="currentColor">Albedo artefact</text>
    <rect x="14" y="240" width="124" height="52" rx="6" fill="currentColor" opacity="0.05"/>
    <rect x="14" y="240" width="124" height="52" rx="6" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.7"/>
    <ellipse cx="76" cy="266" rx="26" ry="12" fill="currentColor" opacity="0.3"/>
    <rect x="194" y="240" width="124" height="52" rx="6" fill="currentColor" opacity="0.05"/>
    <rect x="194" y="240" width="124" height="52" rx="6" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.7"/>
    <ellipse cx="256" cy="266" rx="26" ry="12" fill="currentColor" opacity="0.3"/>
    <rect x="374" y="240" width="124" height="52" rx="6" fill="currentColor" opacity="0.05"/>
    <rect x="374" y="240" width="124" height="52" rx="6" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.7"/>
    <ellipse cx="436" cy="266" rx="26" ry="12" fill="currentColor" opacity="0.3"/>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="540" y="112" width="346" height="78" rx="8" fill="currentColor" opacity="0.07"/>
    <rect x="540" y="112" width="346" height="78" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="556" y="134" fill="currentColor" font-size="10.5" font-weight="700">Shape varies · aligns with wind</text>
    <text x="556" y="154" fill="currentColor" font-size="9.5" opacity="0.78">Cross-date mask IoU 0.21 · bearing tracks the wind vector</text>
    <text x="556" y="174" fill="currentColor" font-size="10" font-weight="700">→ keep, quantify</text>
    <rect x="540" y="232" width="346" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3" opacity="0.8"/>
    <text x="556" y="254" fill="currentColor" font-size="10.5" font-weight="700">Pixel-locked · identical every date</text>
    <text x="556" y="274" fill="currentColor" font-size="10" font-weight="700">→ reject: cross-date IoU 0.94, no wind alignment</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The detection stage below implements the matched-filter retrieval, the noise-floor threshold, the persistence test, and — most importantly — the rule that every scene-facility pair emits a row whether or not a plume was found. It is written as a Prefect task with `structlog` telemetry, explicit CRS declaration, and a hard refusal to quantify when the wind field is missing.

```python
from dataclasses import dataclass, asdict

import geopandas as gpd
import numpy as np
import rioxarray
import structlog
import xarray as xr
from prefect import flow, task
from scipy import ndimage

log = structlog.get_logger()

CANONICAL_CRS = "EPSG:6933"      # equal-area: plume areas and IME must be honest
CH4_MOLAR_MASS = 16.04           # g mol-1
NOISE_SIGMA_GATE = 4.0           # keep pixels >= 4 sigma of the scene noise floor
MIN_PLUME_PIXELS = 9             # a coherent plume, not a speckle


@dataclass(frozen=True)
class PlumeRecord:
    """One scene x facility observation. Emitted for NON-detections too — the
    detection limit is the evidence that a zero is a real zero."""
    facility_id: str
    scene_id: str
    acquired: str
    detected: bool
    ime_kg: float | None
    flux_kg_h: float | None
    flux_uncertainty_kg_h: float | None
    detection_limit_kg_h: float
    wind_speed_m_s: float | None
    wind_source: str | None
    retrieval: str


def matched_filter(cube: xr.DataArray, target: np.ndarray) -> xr.DataArray:
    """Column-wise matched filter: enhancement in ppm-m per pixel.

    Covariance is estimated per across-track column, not per scene, because
    push-broom detectors carry column-dependent noise; a scene-wide covariance
    smears that structure into the retrieval and inflates false positives.
    """
    data = cube.values.reshape(cube.sizes["band"], -1)
    out = np.zeros(data.shape[1], dtype="float32")

    for col in range(cube.sizes["x"]):
        idx = np.arange(col, data.shape[1], cube.sizes["x"])
        block = data[:, idx]
        mu = block.mean(axis=1, keepdims=True)
        resid = block - mu
        cov = np.cov(resid) + np.eye(resid.shape[0]) * 1e-6   # ridge: keep it invertible
        inv = np.linalg.inv(cov)
        t = (target * mu.ravel())[:, None]                    # radiance-scaled target
        denom = float(t.T @ inv @ t)
        out[idx] = ((t.T @ inv @ resid) / denom).ravel()

    return xr.DataArray(
        out.reshape(cube.sizes["y"], cube.sizes["x"]),
        coords={"y": cube.y, "x": cube.x}, dims=("y", "x"), name="ch4_ppm_m",
    )


@task(retries=2, retry_delay_seconds=20)
def detect_plumes(
    scene_path: str,
    scene_id: str,
    acquired: str,
    facilities: gpd.GeoDataFrame,
    target_spectrum: np.ndarray,
    wind: dict[str, float] | None,
) -> list[dict]:
    cube = rioxarray.open_rasterio(scene_path, chunks={"x": 512, "y": 512})
    if cube.rio.crs is None:
        raise ValueError(f"{scene_id}: scene carries no CRS; refusing to geolocate a plume")

    enhancement = matched_filter(cube, target_spectrum)
    enhancement = enhancement.rio.write_crs(cube.rio.crs).rio.reproject(CANONICAL_CRS)

    # Scene noise floor from the robust spread of the enhancement field. MAD, not
    # std: a few real plumes must not raise the threshold that finds them.
    mad = float(np.nanmedian(np.abs(enhancement - np.nanmedian(enhancement))))
    sigma = 1.4826 * mad
    threshold = NOISE_SIGMA_GATE * sigma

    mask = (enhancement.values > threshold).astype("uint8")
    labels, n = ndimage.label(mask, structure=np.ones((3, 3)))
    pixel_area_m2 = abs(float(enhancement.rio.resolution()[0])) ** 2

    facilities = facilities.to_crs(CANONICAL_CRS)
    detection_limit = _detection_limit_kg_h(sigma, pixel_area_m2, wind)

    log.info("ch4.scene.retrieved", scene_id=scene_id, sigma_ppm_m=round(sigma, 2),
             threshold_ppm_m=round(threshold, 2), candidates=int(n),
             detection_limit_kg_h=round(detection_limit, 1), crs=CANONICAL_CRS)

    records: list[PlumeRecord] = []
    for _, facility in facilities.iterrows():
        plume = _largest_plume_within(labels, enhancement, facility.geometry, n)

        if plume is None or plume["pixels"] < MIN_PLUME_PIXELS:
            # A non-detection is a row. Without the limit it is an unusable zero.
            records.append(PlumeRecord(
                facility_id=facility.facility_id, scene_id=scene_id, acquired=acquired,
                detected=False, ime_kg=None, flux_kg_h=None, flux_uncertainty_kg_h=None,
                detection_limit_kg_h=detection_limit,
                wind_speed_m_s=(wind or {}).get("speed_m_s"),
                wind_source=(wind or {}).get("source"), retrieval="matched-filter/v2",
            ))
            continue

        ime_kg = plume["sum_ppm_m"] * pixel_area_m2 * CH4_MOLAR_MASS * 1e-9 * 40.87

        if wind is None:
            # Hold, never guess. An unquantified detection is honest; an invented
            # wind speed is a number an auditor cannot trace to an observation.
            log.warning("ch4.flux.withheld", facility_id=facility.facility_id,
                        scene_id=scene_id, reason="no_wind_field", ime_kg=round(ime_kg, 1))
            records.append(PlumeRecord(
                facility_id=facility.facility_id, scene_id=scene_id, acquired=acquired,
                detected=True, ime_kg=round(ime_kg, 1), flux_kg_h=None,
                flux_uncertainty_kg_h=None, detection_limit_kg_h=detection_limit,
                wind_speed_m_s=None, wind_source=None, retrieval="matched-filter/v2",
            ))
            continue

        length_m = np.sqrt(plume["pixels"] * pixel_area_m2)
        u_eff = 0.34 * wind["speed_m_s"] + 0.44          # IME effective-wind scaling
        flux = ime_kg * u_eff / length_m * 3600.0

        # Wind dominates: combine retrieval and wind error in quadrature.
        rel = np.sqrt(0.20 ** 2 + wind.get("rel_error", 0.5) ** 2)

        log.info("ch4.plume.quantified", facility_id=facility.facility_id,
                 scene_id=scene_id, flux_kg_h=round(flux, 1),
                 rel_uncertainty=round(rel, 2), pixels=plume["pixels"])

        records.append(PlumeRecord(
            facility_id=facility.facility_id, scene_id=scene_id, acquired=acquired,
            detected=True, ime_kg=round(ime_kg, 1), flux_kg_h=round(flux, 1),
            flux_uncertainty_kg_h=round(flux * rel, 1),
            detection_limit_kg_h=detection_limit, wind_speed_m_s=wind["speed_m_s"],
            wind_source=wind["source"], retrieval="matched-filter/v2",
        ))

    return [asdict(r) for r in records]


@flow(name="ch4_plume_detection")
def run(scenes: list[dict], facility_path: str, target_spectrum_path: str) -> list[dict]:
    facilities = gpd.read_file(facility_path)
    if facilities.crs is None:
        raise ValueError("facility layer has no CRS; attribution would be unverifiable")
    target = np.load(target_spectrum_path)

    rows: list[dict] = []
    for scene in scenes:
        rows.extend(detect_plumes(
            scene["path"], scene["scene_id"], scene["acquired"],
            facilities, target, scene.get("wind"),
        ))
    log.info("ch4.run.complete", scenes=len(scenes), rows=len(rows),
             detections=sum(1 for r in rows if r["detected"]))
    return rows
```

Four decisions in that code are the ones worth defending in a design review. **Column-wise covariance** rather than scene-wide, because push-broom instruments carry per-column noise structure that a scene covariance smears into apparent enhancement. **MAD-based noise estimation** rather than standard deviation, so a scene containing several genuine plumes does not raise the threshold that would find them. **Withholding rather than guessing** when the wind field is absent — an unquantified detection is a defensible record, an invented wind speed is not. And **a row for every scene-facility pair**, which is what turns non-detections from silence into evidence.

## Validation, Debugging & Compliance Mapping

Methane records enter the inventory as activity data and are scrutinised on three axes: whether the detection is real, whether the flux is defensible, and whether the annualisation from instantaneous rates is documented.

- **Detection validity → controlled-release calibration.** The standard evidence is performance against a blind controlled-release experiment, in which known volumes are released and the pipeline's detection rate and quantification bias are measured without the operator knowing the true values. Record the resulting detection-limit curve and quantification bias per instrument and surface class, and cite it in the methodology annex. A retrieval with no controlled-release provenance is, to a verifier, an unvalidated model.
- **Flux uncertainty → honest error propagation.** The uncertainty attached to each flux must include wind error, not just retrieval precision. The quadrature combination above is the minimum; where a site drives a material fraction of a reported inventory, propagate the wind distribution through a Monte Carlo pass in the manner set out under [Monte Carlo uncertainty propagation for emission factors](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/monte-carlo-uncertainty-propagation-for-emission-factors/).
- **Annualisation → an explicit temporal model.** Converting N instantaneous observations into an annual mass requires a stated model: persistent-source assumption, duty-cycle estimate, or a survival-analysis treatment of intermittent sources. Whichever you choose, the assumption belongs in the record's lineage, wired through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), so an auditor can re-derive the annual figure from the same observations.
- **Attribution → geometry you can defend.** The facility join must record the buffer distance used, the CRS, and the tie-break rule when two facilities are within the plume's uncertainty ellipse. Undocumented attribution is where methane inventories most often become contested rather than merely uncertain.

The detection limit is not one number per instrument — it is a curve that varies with surface heterogeneity and wind. Reporting a single headline sensitivity flatters the pipeline and misleads the reader; reporting the curve, and the surface class each observation fell into, is what makes a non-detection quantitative.

<svg viewBox="0 0 880 330" role="img" aria-labelledby="ch4l-t ch4l-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ch4l-t">Minimum detectable methane flux against wind speed, for three surface classes</title>
  <desc id="ch4l-d">A line chart with wind speed from 1 to 9 metres per second on the horizontal axis and minimum detectable flux from 0 to 900 kilograms per hour on the vertical axis. Three rising curves: uniform dark surfaces such as water and dense canopy stay lowest, from about 60 to 300 kilograms per hour; moderate surfaces such as grassland and cropland run from about 120 to 520; heterogeneous bright surfaces such as an industrial yard or arid playa run highest, from about 240 to 860. A shaded band marks the region below 200 kilograms per hour where most chronic leaks sit, showing that only dark uniform surfaces resolve them at moderate wind.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="14" y="20" fill="currentColor" font-size="11.5" font-weight="700">Minimum detectable flux is a curve, not a constant</text>
    <text x="14" y="38" fill="currentColor" font-size="9.5" opacity="0.72">Representative hyperspectral retrieval at 30 m ground sampling; higher wind disperses the plume and raises the floor.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.28">
    <line x1="78" y1="70" x2="700" y2="70"/>
    <line x1="78" y1="128" x2="700" y2="128"/>
    <line x1="78" y1="186" x2="700" y2="186"/>
    <line x1="78" y1="244" x2="700" y2="244"/>
  </g>
  <g stroke="currentColor" stroke-width="1.4">
    <line x1="78" y1="60" x2="78" y2="282"/>
    <line x1="78" y1="282" x2="700" y2="282"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.75">
    <text x="70" y="286" text-anchor="end">0</text>
    <text x="70" y="248" text-anchor="end">200</text>
    <text x="70" y="190" text-anchor="end">400</text>
    <text x="70" y="132" text-anchor="end">600</text>
    <text x="70" y="74" text-anchor="end">800</text>
    <text x="78" y="300" text-anchor="middle">1</text>
    <text x="233" y="300" text-anchor="middle">3</text>
    <text x="389" y="300" text-anchor="middle">5</text>
    <text x="544" y="300" text-anchor="middle">7</text>
    <text x="700" y="300" text-anchor="middle">9</text>
    <text x="389" y="320" text-anchor="middle" font-weight="600">wind speed (m s⁻¹)</text>
  </g>
  <text x="20" y="176" font-family="system-ui, sans-serif" font-size="9.5" font-weight="600" fill="currentColor" opacity="0.75" transform="rotate(-90 20 176)" text-anchor="middle">min. detectable flux (kg h⁻¹)</text>
  <rect x="78" y="224" width="622" height="58" fill="currentColor" opacity="0.07"/>
  <text x="690" y="240" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="currentColor" opacity="0.72" text-anchor="end">chronic-leak band (&lt; 200 kg h⁻¹)</text>
  <polyline points="78,265 233,254 389,240 544,226 700,215" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <polyline points="78,247 233,229 389,208 544,186 700,131" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="7,4" opacity="0.8"/>
  <polyline points="78,212 233,182 389,150 544,116 700,33" fill="none" stroke="#f3a712" stroke-width="2.6"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="712" y="218" fill="currentColor">dark, uniform</text>
    <text x="712" y="232" fill="currentColor" font-size="8.5" opacity="0.7">water · dense canopy</text>
    <text x="712" y="134" fill="currentColor">moderate</text>
    <text x="712" y="148" fill="currentColor" font-size="8.5" opacity="0.7">grassland · cropland</text>
    <text x="712" y="40" fill="#f3a712">bright, heterogeneous</text>
    <text x="712" y="54" fill="currentColor" font-size="8.5" opacity="0.7">industrial yard · playa</text>
  </g>
</svg>

For debugging, three diagnostics resolve most incidents. Plot the enhancement field against broadband SWIR reflectance for the scene: a correlation above roughly 0.4 signals albedo contamination rather than atmosphere. Compute cross-date mask intersection-over-union for repeat detections at a fixed location, as in the persistence figure above; values near 1.0 with no wind alignment mean a surface feature. And re-run one scene with the wind speed perturbed by ±50% — if the reported flux moves less than the stated uncertainty, the uncertainty is understated.

## Frequently Asked Questions

### Can Sentinel-2 detect methane, or do I need a hyperspectral instrument?

Sentinel-2's B11/B12 SWIR band pair can detect large plumes — typically above roughly 1–3 tonnes per hour depending on surface and wind — using multi-band or multi-temporal ratio methods. That is enough to catch major blowouts and unlit flares over spectrally uniform bright surfaces, and its five-day revisit is a real advantage for persistence testing. It is not enough for routine site-level MRV of chronic small leaks, where you need EMIT, PRISMA, EnMAP, or a commercial targeted-observation instrument. The practical architecture uses Sentinel-2 as a wide-area screening tier that triggers a tasked hyperspectral acquisition.

### Why does the wind speed dominate the uncertainty, and can I fix it with better imagery?

No — and that is the point. The IME method converts mass to flux by multiplying by an effective wind speed, so relative wind error passes into relative flux error essentially one-for-one. A retrieval precise to 15% divided by a wind field uncertain to 50% yields a flux uncertain to about 52%. Better imagery improves the numerator only. The fixes are meteorological: use the highest-resolution wind product available for the overpass time, prefer on-site anemometry where a facility provides it, and record which source was used so the uncertainty can be re-derived if a better reanalysis is published later.

### How should non-detections be represented in the inventory?

As rows, with the scene-specific detection limit attached. A non-detection means "no source above L kg h⁻¹ was present at overpass", and L varies by an order of magnitude across surfaces within a single scene. Storing only detections converts a bounded statement into an unbounded one and biases the annual total low. When the inventory is aggregated, the non-detection rows let you compute a defensible upper bound on the unobserved tail instead of implicitly assuming it is zero.

### What causes a plume to appear at a facility that had no activity that day?

Three causes, in rough order of frequency. First, an albedo artefact — run the persistence and reflectance-correlation tests. Second, misattribution from georegistration error or an over-generous facility buffer, which reassigns a neighbour's plume; check the join distance and the CRS on both layers. Third, genuine transport from an off-frame source upwind, which the wind-alignment test will reveal because the plume's upwind extent leaves the facility polygon. Only the third is a real emission, and it belongs to someone else.

### Does a methane plume record need different lineage from a land-carbon record?

It needs the same lineage plus three fields that land-carbon work does not have: the retrieval algorithm and version, the wind product and its timestamp, and the detection limit. Those three are what make the record reproducible, because the same radiance cube processed with a different target spectrum or a different wind source yields a materially different flux. Everything else — source scene identifiers, CRS, transformation chain, code version — follows the standard provenance contract.

## Conclusion

Methane plume detection rewards engineering discipline more than algorithmic novelty. The matched filter is well understood and widely implemented; what separates a defensible inventory from a contested one is whether the pipeline tests for albedo artefacts before believing an enhancement, whether it carries wind error into the uncertainty it reports, whether it withholds a flux instead of inventing a wind speed, and whether it emits non-detections with their limits attached. Build those four behaviours into the stage and the retrieval becomes an evidence generator rather than a source of numbers that cannot survive review. For the quantification mathematics in full, work through [quantifying methane plume emission rates in Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/quantifying-methane-plume-emission-rates-in-python/); for the false-positive problem in depth, see [troubleshooting false methane detections over bright surfaces](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/troubleshooting-false-methane-detections-over-bright-surfaces/).

## Related

- [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) — the parent section this retrieval stage belongs to.
- [Quantifying Methane Plume Emission Rates in Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/quantifying-methane-plume-emission-rates-in-python/) — the IME and cross-sectional flux methods implemented end to end.
- [Troubleshooting False Methane Detections over Bright Surfaces](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/troubleshooting-false-methane-detections-over-bright-surfaces/) — the albedo artefact problem and its diagnostics.
- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — the masking discipline every retrieval depends on.
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — how the flux uncertainty here is propagated into a reported total.
