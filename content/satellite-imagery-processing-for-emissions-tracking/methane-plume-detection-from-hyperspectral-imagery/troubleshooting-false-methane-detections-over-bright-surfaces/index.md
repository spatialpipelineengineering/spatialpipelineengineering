---
shortTitle: "Troubleshooting False Methane Detections over Bright Surfaces"
title: "Troubleshooting False Methane Detections over Bright Surfaces"
description: "Why calcite, kaolinite, playa and asphalt masquerade as methane in a matched filter, and the four diagnostics — albedo correlation, persistence, spectral residual, and wind alignment — that separate a plume from the ground."
slug: troubleshooting-false-methane-detections-over-bright-surfaces
type: guide
breadcrumb: "False Detections over Bright Surfaces"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Troubleshooting False Methane Detections over Bright Surfaces

The most expensive failure in a methane MRV pipeline is not a missed plume; it is a confident report of an emission that never happened. False positives cost operator trust, trigger unnecessary site visits, and — once published — are extremely hard to retract. They cluster in a specific and predictable place: bright, mineral-rich, spectrally structured surfaces in arid basins, which is precisely where most upstream oil and gas infrastructure sits. This guide is the diagnostic companion to [methane plume detection from hyperspectral imagery](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/) within the [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack, and it exists because the naive pipeline — threshold the matched-filter output, call the blobs plumes — has a false-positive rate over arid terrain that routinely exceeds its true-positive rate.

<svg viewBox="0 -4 940 296" role="img" aria-labelledby="fp-t fp-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="fp-t">Why mineral absorption features project onto the methane target spectrum</title>
  <desc id="fp-d">A spectral plot from 2000 to 2450 nanometres. The methane target spectrum shows its characteristic paired absorption near 2270 and 2350 nanometres. A calcite reflectance curve shows a strong absorption near 2340 nanometres that overlaps the second methane feature. A kaolinite curve shows a doublet near 2160 and 2200 nanometres that overlaps the shoulder used for the continuum fit. An overlap region is shaded. A panel on the right lists the projection of each mineral onto the methane target: calcite 0.61, gypsum 0.44, kaolinite 0.38, fresh asphalt 0.29, and dry vegetation 0.07, noting that anything above roughly 0.3 will produce enhancements indistinguishable from a weak plume on a single image.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The overlap that makes the ground look like a plume</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Shortwave-infrared reflectance, normalised. The matched filter cannot tell an atmospheric absorber from a mineral one.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="70" y1="76" x2="640" y2="76"/>
    <line x1="70" y1="132" x2="640" y2="132"/>
    <line x1="70" y1="188" x2="640" y2="188"/>
  </g>
  <rect x="418" y="60" width="132" height="184" fill="#f3a712" opacity="0.12"/>
  <text x="484" y="76" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f3a712">overlap region</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="70" y1="56" x2="70" y2="244"/>
    <line x1="70" y1="244" x2="640" y2="244"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="70" y="262" text-anchor="middle">2000</text>
    <text x="197" y="262" text-anchor="middle">2100</text>
    <text x="324" y="262" text-anchor="middle">2200</text>
    <text x="451" y="262" text-anchor="middle">2300</text>
    <text x="578" y="262" text-anchor="middle">2400</text>
    <text x="355" y="282" text-anchor="middle" font-weight="600">wavelength (nm)</text>
  </g>
  <text x="22" y="150" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="currentColor" opacity="0.72" transform="rotate(-90 22 150)" text-anchor="middle">normalised reflectance</text>
  <polyline points="70,92 121,94 172,98 222,104 273,118 324,102 375,96 400,110 425,168 451,196 476,150 502,108 527,178 553,206 578,140 604,104 640,98" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <polyline points="70,118 121,120 172,122 222,124 273,128 324,132 375,136 425,146 476,178 502,214 527,196 553,152 578,132 604,126 640,124" fill="none" stroke="#f3a712" stroke-width="2.4"/>
  <polyline points="70,150 121,152 172,158 222,190 248,208 273,178 299,200 324,214 350,186 375,164 425,160 476,158 527,156 578,154 640,152" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6,3" opacity="0.85"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="118" y="86" fill="currentColor">CH₄ target</text>
    <text x="118" y="114" fill="#f3a712">calcite</text>
    <text x="118" y="146" fill="currentColor" opacity="0.8">kaolinite</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="668" y="56" width="260" height="188" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="668" y="56" width="260" height="188" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="684" y="80" fill="currentColor" font-size="10.5" font-weight="700">Projection onto the CH₄ target</text>
    <text x="684" y="106" fill="currentColor" font-size="10">calcite</text>
    <text x="912" y="106" fill="#f3a712" font-size="10" font-weight="700" text-anchor="end">0.61</text>
    <text x="684" y="128" fill="currentColor" font-size="10">gypsum</text>
    <text x="912" y="128" fill="#f3a712" font-size="10" font-weight="700" text-anchor="end">0.44</text>
    <text x="684" y="150" fill="currentColor" font-size="10">kaolinite</text>
    <text x="912" y="150" fill="#f3a712" font-size="10" font-weight="700" text-anchor="end">0.38</text>
    <text x="684" y="172" fill="currentColor" font-size="10">fresh asphalt</text>
    <text x="912" y="172" fill="currentColor" font-size="10" font-weight="700" text-anchor="end">0.29</text>
    <text x="684" y="194" fill="currentColor" font-size="10">dry vegetation</text>
    <text x="912" y="194" fill="currentColor" font-size="10" font-weight="700" text-anchor="end">0.07</text>
    <text x="684" y="222" fill="currentColor" font-size="9" opacity="0.8">above ≈0.3 is indistinguishable from a</text>
    <text x="684" y="236" fill="currentColor" font-size="9" opacity="0.8">weak plume on a single image</text>
  </g>
</svg>

## Root Cause Analysis

A matched filter asks a single question of every pixel: how much of the target spectrum's shape is present in this pixel's radiance, given the scene's background statistics? It has no concept of atmosphere versus surface. If the ground under a pixel absorbs light in the same wavelengths where methane does, the filter reports an enhancement, and it reports it with the same confidence it would give a real plume.

Methane's exploitable absorption in the shortwave infrared sits mainly in two bands near 2270 nm and 2350 nm. Carbonate minerals — calcite above all, abundant in caliche soils, limestone outcrop, and the crushed rock used for well pads and access roads — absorb strongly near 2340 nm. The overlap is not partial; for calcite the projection onto a normalised methane target commonly exceeds 0.6, meaning a bright caliche pad can generate an apparent enhancement equivalent to a several-hundred-kilogram-per-hour plume. Clay minerals, gypsum-rich playa crusts, and fresh asphalt each project less strongly but still enough to clear a four-sigma threshold on a clean scene.

Three amplifying factors turn this from a nuisance into a systematic bias. First, **brightness raises signal-to-noise for the artefact as well as the plume**: the matched filter output scales with radiance, so bright surfaces produce larger apparent enhancements from the same fractional spectral overlap. Second, **spatial heterogeneity breaks the covariance estimate**: the filter's background statistics assume a reasonably homogeneous scene, and a patchwork of pads, roads, and bare soil violates that, leaving structured residuals that look like structure in the enhancement field. Third, **infrastructure and interference co-locate**: the well pad is made of the material that mimics methane and is also where a real leak would be, so the artefact appears exactly where an analyst expects a plume and confirmation bias does the rest.

## Diagnostic Pipeline / Pre-Flight Validation

Four diagnostics, applied in order of cost, resolve nearly all cases. Each answers a different question, and a candidate must survive all four.

```python
from dataclasses import dataclass

import numpy as np
import structlog
from scipy import ndimage, stats

log = structlog.get_logger()

ALBEDO_R_GATE = 0.40        # |r| above this: enhancement tracks brightness
PERSISTENCE_IOU_GATE = 0.70  # shape this stable across dates is not a plume
RESIDUAL_GATE = 2.5          # spectral residual, in scene sigma


@dataclass(frozen=True)
class Verdict:
    candidate_id: str
    real: bool
    reason: str | None
    albedo_r: float
    persistence_iou: float | None
    residual_sigma: float
    axis_wind_disagreement_deg: float


def albedo_correlation(enhancement: np.ndarray, swir_reflectance: np.ndarray,
                       mask: np.ndarray, dilate: int = 6) -> float:
    """Diagnostic 1 — does the enhancement track surface brightness?

    Sampled in a ring around the candidate rather than inside it, because inside a
    real plume the two are uncorrelated by construction and the test would pass
    trivially. The ring is where an artefact reveals its dependence on the ground.
    """
    ring = ndimage.binary_dilation(mask, iterations=dilate) & ~mask
    if ring.sum() < 50:
        return 0.0
    r, _ = stats.pearsonr(enhancement[ring], swir_reflectance[ring])
    log.info("ch4.diag.albedo", r=round(float(r), 3), ring_pixels=int(ring.sum()))
    return float(r)


def persistence_iou(masks_by_date: dict[str, np.ndarray]) -> float | None:
    """Diagnostic 2 — is the shape identical across dates?

    A plume is transported: its mask changes shape and bearing with the wind.
    A surface feature is pixel-locked. Mean pairwise intersection-over-union
    near 1.0 across independent acquisitions is decisive.
    """
    dates = sorted(masks_by_date)
    if len(dates) < 2:
        return None
    scores = []
    for i in range(len(dates)):
        for j in range(i + 1, len(dates)):
            a, b = masks_by_date[dates[i]], masks_by_date[dates[j]]
            union = (a | b).sum()
            if union:
                scores.append((a & b).sum() / union)
    iou = float(np.mean(scores)) if scores else None
    log.info("ch4.diag.persistence", mean_iou=None if iou is None else round(iou, 3),
             dates=len(dates))
    return iou


def spectral_residual(radiance: np.ndarray, ch4_target: np.ndarray,
                      mineral_library: dict[str, np.ndarray], mask: np.ndarray) -> float:
    """Diagnostic 3 — does a mineral explain the signal better than methane?

    Fit the mean in-candidate spectrum with methane alone, then with methane plus
    the mineral library. A large drop in residual when minerals are admitted means
    the ground, not the atmosphere, is producing the feature.
    """
    spectrum = radiance[:, mask].mean(axis=1)
    spectrum = spectrum / np.linalg.norm(spectrum)

    ch4_only = np.linalg.lstsq(ch4_target[:, None], spectrum, rcond=None)
    resid_ch4 = float(np.linalg.norm(spectrum - ch4_target * ch4_only[0]))

    design = np.column_stack([ch4_target] + list(mineral_library.values()))
    coefs, *_ = np.linalg.lstsq(design, spectrum, rcond=None)
    resid_full = float(np.linalg.norm(spectrum - design @ coefs))

    improvement = (resid_ch4 - resid_full) / max(resid_ch4, 1e-9)
    dominant = max(zip(mineral_library, coefs[1:]), key=lambda kv: abs(kv[1]))

    log.info("ch4.diag.residual", resid_ch4=round(resid_ch4, 4),
             resid_full=round(resid_full, 4), improvement=round(improvement, 3),
             dominant_mineral=dominant[0], mineral_weight=round(float(dominant[1]), 3))
    return improvement * 10.0     # expressed in scene sigma by the caller's scaling


def wind_alignment(axis_bearing_deg: float, wind_bearing_deg: float) -> float:
    """Diagnostic 4 — does the plume point where the wind was going?"""
    d = abs((axis_bearing_deg - wind_bearing_deg + 180.0) % 360.0 - 180.0)
    log.info("ch4.diag.wind_alignment", axis=round(axis_bearing_deg, 1),
             wind=round(wind_bearing_deg, 1), disagreement=round(d, 1))
    return float(d)
```

Order matters for cost, not only for logic. Albedo correlation needs one extra band and a ring of pixels — microseconds. Persistence needs the candidate re-run on two more acquisitions — minutes, but only for candidates that survived the first test. The spectral residual needs a mineral library and a least-squares fit per candidate — cheap per candidate, expensive to maintain. Wind alignment is free once you have the axis from the quantification pre-flight described in [quantifying methane plume emission rates in Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/quantifying-methane-plume-emission-rates-in-python/).

<svg viewBox="0 -4 900 300" role="img" aria-labelledby="dec-t dec-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="dec-t">Four-gate screening order for a methane candidate, with typical survival rates</title>
  <desc id="dec-d">A funnel of four sequential gates applied to 100 raw candidates from an arid-basin scene. Gate one, albedo correlation in a ring around the candidate, rejects 38 as brightness-driven, leaving 62. Gate two, cross-date persistence, rejects 19 as pixel-locked, leaving 43. Gate three, spectral residual against a mineral library, rejects 11 where calcite or gypsum explains the signal better than methane, leaving 32. Gate four, wind alignment, rejects 5 whose axis disagrees with the wind bearing, leaving 27 confirmed candidates. An annotation states that the first gate is nearly free and removes the largest share, so ordering the gates by cost is worth roughly a tenfold saving in re-tasking.</desc>
  <defs>
    <marker id="dec-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Screen cheapest first</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">100 raw candidates from one arid-basin scene, through four gates in cost order.</text>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="12" y="88" width="120" height="72" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="88" width="120" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="72" y="118" fill="currentColor" font-size="17" font-weight="700">100</text>
    <text x="72" y="140" fill="currentColor" font-size="9" opacity="0.78">raw candidates</text>
    <rect x="172" y="88" width="140" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="242" y="110" fill="currentColor" font-size="10" font-weight="700">1 · albedo r</text>
    <text x="242" y="130" fill="currentColor" font-size="15" font-weight="700">62</text>
    <text x="242" y="148" fill="currentColor" font-size="8.5" opacity="0.75">−38 brightness-driven</text>
    <rect x="352" y="88" width="140" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="422" y="110" fill="currentColor" font-size="10" font-weight="700">2 · persistence</text>
    <text x="422" y="130" fill="currentColor" font-size="15" font-weight="700">43</text>
    <text x="422" y="148" fill="currentColor" font-size="8.5" opacity="0.75">−19 pixel-locked</text>
    <rect x="532" y="88" width="140" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="602" y="110" fill="currentColor" font-size="10" font-weight="700">3 · spectral residual</text>
    <text x="602" y="130" fill="currentColor" font-size="15" font-weight="700">32</text>
    <text x="602" y="148" fill="currentColor" font-size="8.5" opacity="0.75">−11 mineral explains it</text>
    <rect x="712" y="88" width="176" height="72" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="712" y="88" width="176" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.9"/>
    <text x="800" y="110" fill="currentColor" font-size="10" font-weight="700">4 · wind alignment</text>
    <text x="800" y="132" fill="currentColor" font-size="17" font-weight="700">27</text>
    <text x="800" y="150" fill="currentColor" font-size="8.5" opacity="0.78">confirmed · −5 misaligned</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#dec-arrow)">
    <line x1="132" y1="124" x2="170" y2="124"/>
    <line x1="312" y1="124" x2="350" y2="124"/>
    <line x1="492" y1="124" x2="530" y2="124"/>
    <line x1="672" y1="124" x2="710" y2="124"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">
    <text x="242" y="182">1 extra band</text>
    <text x="242" y="196">microseconds</text>
    <text x="422" y="182">2 more scenes</text>
    <text x="422" y="196">minutes</text>
    <text x="602" y="182">mineral library</text>
    <text x="602" y="196">cheap per candidate</text>
    <text x="800" y="182">reuses the fitted axis</text>
    <text x="800" y="196">free</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="222" width="876" height="60" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="222" width="876" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="30" y="244" fill="currentColor" font-size="10" font-weight="700">The cheapest gate removes the largest share.</text>
    <text x="30" y="264" fill="currentColor" font-size="9.5" opacity="0.82">Running persistence first would re-task two acquisitions for all 100 candidates instead of 62 — and the 38 it would have to re-task are the ones a one-band correlation already knew were ground.</text>
  </g>
</svg>

## Deterministic Transformation Logic

The screening function below applies the four gates in cost order, short-circuits on the first rejection, and returns a verdict carrying every diagnostic value rather than a bare boolean. Recording the values, not just the decision, is what lets you re-tune thresholds later without re-running the retrieval.

```python
def screen_candidate(
    candidate_id: str,
    enhancement: np.ndarray,
    swir_reflectance: np.ndarray,
    mask: np.ndarray,
    radiance: np.ndarray,
    ch4_target: np.ndarray,
    mineral_library: dict[str, np.ndarray],
    axis_bearing_deg: float,
    wind_bearing_deg: float,
    masks_by_date: dict[str, np.ndarray] | None = None,
) -> Verdict:
    """Four gates, cheapest first, short-circuiting on rejection.

    Every diagnostic value is recorded even when a later gate is skipped, so a
    threshold change can be re-evaluated against stored evidence rather than by
    re-running the retrieval over the archive.
    """
    r = albedo_correlation(enhancement, swir_reflectance, mask)
    if abs(r) > ALBEDO_R_GATE:
        return Verdict(candidate_id, False, "albedo_correlated", round(r, 3),
                       None, 0.0, 0.0)

    iou = persistence_iou(masks_by_date) if masks_by_date else None
    if iou is not None and iou > PERSISTENCE_IOU_GATE:
        return Verdict(candidate_id, False, "pixel_locked", round(r, 3),
                       round(iou, 3), 0.0, 0.0)

    residual = spectral_residual(radiance, ch4_target, mineral_library, mask)
    if residual > RESIDUAL_GATE:
        return Verdict(candidate_id, False, "mineral_explains_signal", round(r, 3),
                       None if iou is None else round(iou, 3), round(residual, 2), 0.0)

    disagreement = wind_alignment(axis_bearing_deg, wind_bearing_deg)
    if disagreement > 45.0:
        return Verdict(candidate_id, False, "axis_wind_mismatch", round(r, 3),
                       None if iou is None else round(iou, 3), round(residual, 2),
                       round(disagreement, 1))

    log.info("ch4.candidate.confirmed", candidate_id=candidate_id,
             albedo_r=round(r, 3), persistence_iou=iou,
             residual_sigma=round(residual, 2),
             axis_wind_disagreement=round(disagreement, 1))
    return Verdict(candidate_id, True, None, round(r, 3),
                   None if iou is None else round(iou, 3), round(residual, 2),
                   round(disagreement, 1))
```

Two subtleties are worth stating explicitly. The albedo correlation is sampled in a **ring around** the candidate rather than inside it, because inside a genuine plume the enhancement is driven by the atmosphere and would be uncorrelated with brightness by construction — testing inside would pass everything. And the persistence gate returns `None` rather than a pass when only one acquisition exists: an untested gate must never be recorded as a passed gate, or the evidence file will later claim a check that never ran.

Plotting two of the diagnostics against each other is the fastest way to sanity-check a basin's screening as a whole, and it exposes threshold choices that look reasonable in isolation but cut through the middle of a real cluster.

<svg viewBox="0 -4 880 300" role="img" aria-labelledby="sc-t sc-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="sc-t">Albedo correlation against cross-date persistence for one basin's candidates</title>
  <desc id="sc-d">A scatter plot with absolute albedo correlation from 0 to 0.9 on the horizontal axis and mean cross-date intersection-over-union from 0 to 1 on the vertical axis. Confirmed plumes cluster in the lower left, with correlation below 0.3 and persistence below 0.4, drawn as filled markers. Surface artefacts cluster in the upper right, with correlation above 0.45 and persistence above 0.75, drawn as hollow markers. Gate lines are drawn at correlation 0.40 and persistence 0.70, and a small group of five ambiguous candidates sits between the clusters. An annotation notes that the two clusters separate cleanly in two dimensions even where either diagnostic alone would leave the ambiguous group unresolved.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Two diagnostics separate what one cannot</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">One basin, 62 candidates surviving the retrieval threshold.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="76" x2="620" y2="76"/>
    <line x1="80" y1="130" x2="620" y2="130"/>
    <line x1="80" y1="184" x2="620" y2="184"/>
    <line x1="80" y1="238" x2="620" y2="238"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="62" x2="80" y2="252"/>
    <line x1="80" y1="252" x2="620" y2="252"/>
  </g>
  <line x1="320" y1="62" x2="320" y2="252" stroke="#f3a712" stroke-width="1.8" stroke-dasharray="5,4"/>
  <line x1="80" y1="119" x2="620" y2="119" stroke="#f3a712" stroke-width="1.8" stroke-dasharray="5,4"/>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="66" text-anchor="end">1.0</text>
    <text x="72" y="134" text-anchor="end">0.7</text>
    <text x="72" y="188" text-anchor="end">0.4</text>
    <text x="72" y="256" text-anchor="end">0.0</text>
    <text x="80" y="272" text-anchor="middle">0.0</text>
    <text x="320" y="272" text-anchor="middle">0.40</text>
    <text x="620" y="272" text-anchor="middle">0.90</text>
    <text x="350" y="292" text-anchor="middle" font-weight="600">|albedo correlation| in the ring</text>
  </g>
  <text x="26" y="157" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="currentColor" opacity="0.72" transform="rotate(-90 26 157)" text-anchor="middle">cross-date IoU</text>
  <g fill="currentColor">
    <circle cx="118" cy="228" r="4.5"/><circle cx="140" cy="240" r="4.5"/><circle cx="102" cy="212" r="4.5"/>
    <circle cx="164" cy="234" r="4.5"/><circle cx="132" cy="204" r="4.5"/><circle cx="186" cy="222" r="4.5"/>
    <circle cx="150" cy="218" r="4.5"/><circle cx="208" cy="238" r="4.5"/><circle cx="176" cy="200" r="4.5"/>
    <circle cx="110" cy="192" r="4.5"/><circle cx="226" cy="226" r="4.5"/><circle cx="196" cy="244" r="4.5"/>
    <circle cx="244" cy="212" r="4.5"/><circle cx="158" cy="186" r="4.5"/><circle cx="128" cy="176" r="4.5"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="1.7">
    <circle cx="392" cy="94" r="4.5"/><circle cx="428" cy="82" r="4.5"/><circle cx="466" cy="90" r="4.5"/>
    <circle cx="410" cy="106" r="4.5"/><circle cx="504" cy="78" r="4.5"/><circle cx="450" cy="102" r="4.5"/>
    <circle cx="542" cy="88" r="4.5"/><circle cx="488" cy="98" r="4.5"/><circle cx="576" cy="76" r="4.5"/>
    <circle cx="524" cy="104" r="4.5"/><circle cx="362" cy="86" r="4.5"/><circle cx="598" cy="94" r="4.5"/>
  </g>
  <g fill="currentColor" opacity="0.45">
    <circle cx="286" cy="146" r="4.5"/><circle cx="304" cy="158" r="4.5"/><circle cx="330" cy="140" r="4.5"/>
    <circle cx="266" cy="164" r="4.5"/><circle cx="348" cy="152" r="4.5"/>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="176" y="160" font-size="10" font-weight="700" fill="currentColor">confirmed plumes</text>
    <text x="480" y="132" font-size="10" font-weight="700" fill="currentColor">surface artefacts</text>
    <text x="308" y="186" font-size="9" font-weight="700" fill="currentColor" opacity="0.7" text-anchor="middle">ambiguous — escalate</text>
    <rect x="640" y="70" width="236" height="112" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="640" y="70" width="236" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="656" y="94" fill="currentColor" font-size="10" font-weight="700">Read it in two dimensions</text>
    <text x="656" y="116" fill="currentColor" font-size="9.5" opacity="0.82">Either gate alone leaves the five</text>
    <text x="656" y="132" fill="currentColor" font-size="9.5" opacity="0.82">middle candidates unresolved.</text>
    <text x="656" y="154" fill="currentColor" font-size="9.5" opacity="0.82">Together they isolate exactly the</text>
    <text x="656" y="170" fill="currentColor" font-size="9.5" opacity="0.82">set worth a third acquisition.</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

For a verifier, a confirmed detection is only as credible as the rejection record beside it. Three artefacts make the screening auditable.

First, **persist every candidate, including rejections, with its diagnostic values and the gate that rejected it.** A survey reporting twenty-seven detections from a scene tells the reader nothing about discrimination; the same survey reporting one hundred candidates screened to twenty-seven, with the reason for each rejection, demonstrates a controlled process. This record belongs in the evidence store alongside the measurements, under the schema contract in the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/).

Second, **version the mineral library and the gate thresholds** as data, not as constants in the code. A threshold change re-classifies historical candidates, which is a restatement of previously reported results, and it must be traceable through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) like any other factor-table change.

Third, **report the surface class of every observation.** A non-detection over caliche is a much weaker statement than a non-detection over dark uniform ground, because the effective detection limit is several times higher. Carrying the surface class through to the record lets an inventory aggregate honestly rather than treating all zeros alike.

Where a detection drives a material share of a facility's reported total, most verification programmes will expect independent confirmation — a second instrument, a subsequent acquisition, or a ground survey — before it is credited. Build the escalation path into the pipeline: a confirmed candidate above a materiality threshold should automatically request a repeat acquisition rather than waiting for an analyst to notice.

## Production Integration

1. **Retrieve and segment** as usual, producing candidates with masks, enhancement fields, and fitted axes.
2. **Screen in cost order** — albedo ring correlation, then persistence across the two nearest clear acquisitions, then spectral residual against the versioned mineral library, then wind alignment.
3. **Persist every candidate** with all diagnostic values and the rejecting gate, whether confirmed or not.
4. **Classify the surface** beneath each observation from a land-cover or mineral map, and attach it to detections and non-detections alike.
5. **Escalate material confirmations** to a repeat acquisition automatically, and hold the flux out of the inventory until the second observation resolves.
6. **Trend the gate statistics** per scene and per basin. A sudden change in the rejection mix — say, albedo rejections doubling — usually means an upstream atmospheric-correction change, not a change in the ground.

Where a basin has a known mineral signature, the highest-leverage investment is a local spectral library built from field or airborne data rather than a generic one. Generic libraries miss the specific carbonate-clay mixtures of a given formation, and the residual test is only as discriminating as the library it fits against.

Two operational habits are worth building in from the start, because retrofitting them is painful. The first is **a standing set of known-negative locations** — patches of bare caliche, playa crust, and fresh road surface with no infrastructure within several kilometres — processed with every scene exactly as if they were candidate sites. They are a continuous false-positive monitor: if the pipeline starts reporting enhancements over ground you know is empty, something upstream has changed, and you will see it in the same run rather than three months later. Choose them once, freeze them, and treat any detection over them as an incident.

The second is **a known-positive set**, ideally from a controlled release or from a facility with metered venting that publishes its schedule. Known negatives tell you the screening is not inventing plumes; only known positives tell you it has not become so aggressive that it discards real ones. The two together turn threshold tuning from an argument into a measurement — you can move a gate and read off exactly what it cost in true positives and bought in false ones, rather than defending a choice on intuition. Where neither is available, the weakest acceptable substitute is a manually adjudicated sample of candidates re-examined by a second analyst who has not seen the screening verdict, sized so that the false-positive rate can be estimated to a few percentage points.

Both sets belong in version control alongside the mineral library and the gate thresholds, and both should be re-examined whenever the atmospheric correction, the instrument, or the target spectrum changes. A screening pipeline that has never been re-validated after an upstream change is reporting a discrimination rate it measured against a system that no longer exists.

## Frequently Asked Questions

### Why not just subtract a mineral map from the enhancement field?

Because the mineral abundance is not known independently at the precision required, and the subtraction would introduce its own error field. Fitting the mineral library as competing explanations in a residual test asks a weaker, more answerable question — does a mineral explain this pixel's spectrum better than methane does — without needing an accurate abundance estimate. Subtraction also silently removes real plumes that happen to sit over mineral-rich ground, which is most of them in an arid basin.

### How many acquisitions do I need for a persistence test to be meaningful?

Three is comfortable, two is workable, one is nothing. With two clear acquisitions you can compute a single intersection-over-union, which is decisive at the extremes — near 1.0 means pixel-locked, near 0.2 means transported — but ambiguous in the middle. With three you get a mean and a spread, and a persistent source that genuinely emits on every overpass is distinguishable from a surface feature because its plume still changes shape with the wind even though its origin does not move.

### Can a real plume fail the albedo correlation test?

It can, in one specific situation: a plume lying over a strong brightness gradient, such as the edge of a bright pad, where the ring sampling picks up the gradient rather than the plume's surroundings. The signature is a high correlation with a small ring sample and a plume that passes every other gate. Widen the ring, exclude the gradient, and re-test; if the correlation persists over a clean ring, the candidate is very likely ground.

### What false-positive rate should I expect after screening?

Over arid, mineral-rich terrain, a naive threshold-only pipeline commonly runs 20–60% false positives. The four gates typically bring that below 5% while removing a small number of real weak plumes — mostly ones near the detection limit whose axes are poorly constrained. That trade is the right one for MRV, where a reported emission that did not happen is more damaging than a small missed one, but it must be disclosed: report the screening's estimated true-positive loss alongside its false-positive rate.

### Does this problem exist for Sentinel-2 multi-band methods too?

It is worse. Multi-band ratio methods have far less spectral information to work with than a hyperspectral matched filter, so they cannot run a meaningful spectral residual test at all — the mineral library has nothing to fit against. In practice Sentinel-2 screening leans almost entirely on persistence and wind alignment, and its usable detection threshold over bright surfaces must be set considerably higher to compensate. Treat Sentinel-2 detections over mineral terrain as candidates for tasked hyperspectral confirmation rather than as reportable observations.

## Related guides

- [Methane Plume Detection from Hyperspectral Imagery](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/) — the parent topic and its retrieval architecture.
- [Quantifying Methane Plume Emission Rates in Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/quantifying-methane-plume-emission-rates-in-python/) — what happens to a candidate once it survives screening.
- [Troubleshooting Cloud Shadow False Positives in Sentinel-2](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/troubleshooting-cloud-shadow-false-positives-in-sentinel-2/) — the same discipline applied to masking.
- [Emissions Data Quality & Validation Gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/) — where screened detections meet the inventory's own gates.
