---
shortTitle: "Quantifying Methane Plume Emission Rates in Python"
title: "Quantifying Methane Plume Emission Rates in Python"
description: "Convert a methane enhancement map into a defensible kg/h flux: integrated mass enhancement, cross-sectional flux, effective wind, and the uncertainty budget that keeps the number reportable."
slug: quantifying-methane-plume-emission-rates-in-python
type: guide
breadcrumb: "Quantifying Plume Emission Rates"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Quantifying Methane Plume Emission Rates in Python

Detecting a methane plume is the easy half. Turning that plume into a number an auditor will accept — kilograms per hour, with an interval you can defend — is where most implementations quietly go wrong. This guide implements the two mainstream quantification methods end to end, and sits within [methane plume detection from hyperspectral imagery](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/), part of the [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack. It assumes you already have a per-pixel enhancement field in ppm·m and a plume mask; if you do not, start with the retrieval architecture in the parent topic.

The two methods answer the same question differently. **Integrated mass enhancement (IME)** measures how much excess methane is sitting in the plume right now and divides by how long it takes the wind to clear it. **Cross-sectional flux (CSF)** measures how much methane crosses a line drawn perpendicular to the plume axis per unit time. IME is robust for compact plumes and tolerant of a ragged mask edge; CSF is better for long, well-developed plumes and gives you several independent estimates from one image. Production pipelines compute both and reconcile them, because agreement between two structurally different estimators is much stronger evidence than either alone.

<svg viewBox="0 -4 940 288" role="img" aria-labelledby="q-t q-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="q-t">Integrated mass enhancement and cross-sectional flux measured on the same plume</title>
  <desc id="q-d">A single plume extending downwind from a point source. On the left, the integrated mass enhancement method shades the whole plume mask and labels it as total excess mass of 142 kilograms divided by a residence time derived from plume length and effective wind speed. On the right, the cross-sectional flux method draws four transects perpendicular to the plume axis at 120, 240, 360, and 480 metres downwind, each yielding an independent flux estimate of 611, 588, 634, and 602 kilograms per hour. A reconciliation panel notes that the integrated method gives 597 and the cross-sectional median gives 606, agreeing within 2 percent, and that a disagreement beyond about 30 percent indicates a mask or wind problem rather than a real difference.</desc>
  <defs>
    <marker id="q-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Two estimators, one plume</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Agreement between structurally different methods is the strongest single piece of evidence you can produce.</text>
    <text x="150" y="60" text-anchor="middle" fill="currentColor" font-size="10.5" font-weight="700">Integrated mass enhancement</text>
    <text x="560" y="60" text-anchor="middle" fill="currentColor" font-size="10.5" font-weight="700">Cross-sectional flux</text>
  </g>
  <g>
    <rect x="12" y="74" width="276" height="132" rx="8" fill="currentColor" opacity="0.04"/>
    <rect x="12" y="74" width="276" height="132" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M46 168 C 96 158, 150 128, 262 104" stroke="currentColor" stroke-width="26" stroke-linecap="round" fill="none" opacity="0.22"/>
    <circle cx="44" cy="170" r="5" fill="currentColor"/>
    <text x="44" y="190" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" text-anchor="middle" opacity="0.78">source</text>
    <text x="160" y="96" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="currentColor">IME = 142 kg</text>
    <text x="150" y="196" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78" text-anchor="middle">Q = IME × Uₑ ÷ L</text>
  </g>
  <g>
    <rect x="422" y="74" width="276" height="132" rx="8" fill="currentColor" opacity="0.04"/>
    <rect x="422" y="74" width="276" height="132" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M456 168 C 506 158, 560 128, 672 104" stroke="currentColor" stroke-width="26" stroke-linecap="round" fill="none" opacity="0.16"/>
    <circle cx="454" cy="170" r="5" fill="currentColor"/>
    <line x1="490" y1="182" x2="510" y2="136" stroke="#f3a712" stroke-width="2.2"/>
    <line x1="536" y1="172" x2="556" y2="122" stroke="#f3a712" stroke-width="2.2"/>
    <line x1="586" y1="160" x2="606" y2="110" stroke="#f3a712" stroke-width="2.2"/>
    <line x1="636" y1="148" x2="656" y2="98" stroke="#f3a712" stroke-width="2.2"/>
    <text x="498" y="196" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" text-anchor="middle" opacity="0.8">611</text>
    <text x="544" y="196" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" text-anchor="middle" opacity="0.8">588</text>
    <text x="594" y="196" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" text-anchor="middle" opacity="0.8">634</text>
    <text x="644" y="196" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" text-anchor="middle" opacity="0.8">602</text>
    <text x="560" y="212" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" text-anchor="middle" opacity="0.72">kg h⁻¹ per transect at 120 · 240 · 360 · 480 m</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="712" y="86" width="216" height="118" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="712" y="86" width="216" height="118" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="728" y="110" fill="currentColor" font-size="10.5" font-weight="700">Reconciliation</text>
    <text x="728" y="132" fill="currentColor" font-size="10">IME → 597 kg h⁻¹</text>
    <text x="728" y="150" fill="currentColor" font-size="10">CSF median → 606 kg h⁻¹</text>
    <text x="728" y="172" fill="currentColor" font-size="10" font-weight="700">agree within 2%</text>
    <text x="728" y="192" fill="currentColor" font-size="9" opacity="0.78">&gt; 30% apart → mask or wind fault</text>
    <text x="12" y="240" fill="currentColor" font-size="9.5" opacity="0.78">Both estimators consume the same enhancement field. They differ in what they assume about plume geometry, which is why their</text>
    <text x="12" y="256" fill="currentColor" font-size="9.5" opacity="0.78">disagreement is diagnostic: a ragged mask hurts IME, a bent plume axis hurts CSF, and a wrong wind speed hurts both equally.</text>
  </g>
</svg>

## Root Cause Analysis

Flux is not a measured quantity. What the instrument measures is a column enhancement — excess methane along the light path, in ppm·m — over a set of pixels at one instant. Converting that instantaneous, static picture into a rate requires a transport model, and every quantification error traces back to an assumption inside that model.

The first assumption is **steady state**: that the plume you see was produced by a source emitting at a constant rate for at least as long as the plume's transit time. For a plume 500 m long in a 3 m s⁻¹ wind, that is roughly three minutes — usually fine. For a kilometre-scale plume in light wind it can be fifteen minutes or more, during which a compressor blowdown may have started and stopped. When steady state is violated, IME reports a time-average weighted by an unknown history, and the honest response is to flag the estimate rather than to report it as an instantaneous rate.

The second assumption is the **effective wind speed**. The wind that transports the plume is not the wind reported at 10 m by a reanalysis product; it is a vertically integrated speed over the plume's actual depth, in a boundary layer whose shear depends on stability and roughness. The literature standard is an empirical scaling from the 10 m wind, of the form Uₑ = a·U₁₀ + b, fitted against large-eddy simulations of plumes with known source rates. The coefficients differ by instrument and pixel size because the fit absorbs the retrieval's own smoothing. Borrowing a scaling fitted for one instrument and applying it to another is a real and common error, worth 10–20% bias.

The third assumption is the **plume mask boundary**. IME sums enhancement over the mask, so any threshold choice trades a low bias against including noise. Set the threshold too high and you truncate the plume's diffuse tail, losing mass; too low and you sum noise that scales with the mask's area. The practical resolution is not to find the perfect threshold but to compute IME over a range of thresholds and report the plateau — a stable region where the estimate is insensitive to the choice. Absence of a plateau is itself diagnostic: it means the plume is not separable from the background.

## Diagnostic Pipeline / Pre-Flight Validation

Before quantifying, check that the plume is quantifiable. The pre-flight below rejects three conditions that make any flux estimate meaningless: an unresolved plume smaller than a few pixels, a mask touching the scene edge (so an unknown fraction is missing), and a plume whose principal axis disagrees with the wind bearing by more than a tolerance, which usually means the mask has merged two sources or captured an artefact.

```python
import numpy as np
import structlog
from scipy import ndimage

log = structlog.get_logger()

MIN_PIXELS = 9
MAX_AXIS_WIND_DISAGREEMENT_DEG = 45.0


def preflight(mask: np.ndarray, enhancement: np.ndarray, wind_bearing_deg: float,
              pixel_size_m: float) -> dict:
    """Decide whether this plume can be quantified at all. Returns a verdict dict;
    a False verdict is a legitimate output, not an error."""
    pixels = int(mask.sum())
    if pixels < MIN_PIXELS:
        return {"quantifiable": False, "reason": "unresolved", "pixels": pixels}

    ys, xs = np.nonzero(mask)
    if ys.min() == 0 or xs.min() == 0 or ys.max() == mask.shape[0] - 1 \
            or xs.max() == mask.shape[1] - 1:
        # Truncated plumes give a guaranteed low bias of unknown size.
        return {"quantifiable": False, "reason": "touches_scene_edge", "pixels": pixels}

    # Principal axis via the mass-weighted second moment of the enhancement.
    weights = enhancement[ys, xs]
    cy, cx = np.average(ys, weights=weights), np.average(xs, weights=weights)
    cov = np.cov(np.c_[xs - cx, ys - cy].T, aweights=weights)
    eigvals, eigvecs = np.linalg.eigh(cov)
    axis = eigvecs[:, np.argmax(eigvals)]
    axis_bearing = (np.degrees(np.arctan2(axis[0], -axis[1])) + 360.0) % 360.0

    disagreement = abs((axis_bearing - wind_bearing_deg + 180.0) % 360.0 - 180.0)
    elongation = float(np.sqrt(eigvals.max() / max(eigvals.min(), 1e-9)))

    verdict = {
        "quantifiable": disagreement <= MAX_AXIS_WIND_DISAGREEMENT_DEG,
        "reason": None if disagreement <= MAX_AXIS_WIND_DISAGREEMENT_DEG else "axis_wind_mismatch",
        "pixels": pixels,
        "axis_bearing_deg": round(float(axis_bearing), 1),
        "wind_bearing_deg": round(wind_bearing_deg, 1),
        "axis_disagreement_deg": round(float(disagreement), 1),
        "elongation": round(elongation, 2),
        "length_m": round(float(np.sqrt(eigvals.max()) * 4.0 * pixel_size_m), 1),
    }
    log.info("ch4.preflight", **verdict)
    return verdict


def ime_threshold_plateau(enhancement: np.ndarray, mask_seed: np.ndarray,
                          pixel_area_m2: float, sigma: float) -> dict:
    """Sweep the mask threshold and look for a plateau.

    A plume that is genuinely separable from the background shows an IME that is
    flat over a range of thresholds. No plateau means the mask boundary is doing
    the arithmetic, not the plume.
    """
    results = []
    for k in (2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 6.0):
        mask = ndimage.binary_dilation(mask_seed) & (enhancement > k * sigma)
        ime = float(enhancement[mask].sum()) * pixel_area_m2 * 16.04 * 1e-9 * 40.87
        results.append({"k_sigma": k, "ime_kg": round(ime, 2), "pixels": int(mask.sum())})

    values = np.array([r["ime_kg"] for r in results[1:-1]])   # ignore the extremes
    spread = float(values.ptp() / max(values.mean(), 1e-9))
    plateau = spread < 0.15

    log.info("ch4.ime.plateau", plateau=plateau, relative_spread=round(spread, 3),
             sweep=results)
    return {"plateau": plateau, "relative_spread": round(spread, 3),
            "ime_kg": round(float(values.mean()), 2), "sweep": results}
```

The plateau sweep is the single most informative diagnostic in the whole quantification chain, because it answers a question no single-threshold estimate can: is this number a property of the plume, or of the number I picked?

<svg viewBox="0 -4 880 292" role="img" aria-labelledby="pl-t pl-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="pl-t">Integrated mass enhancement swept across mask thresholds, for a separable and a non-separable plume</title>
  <desc id="pl-d">A line chart with the mask threshold in multiples of the scene noise sigma on the horizontal axis, from 2.5 to 6, and integrated mass enhancement in kilograms on the vertical axis from 0 to 260. The separable plume traces a curve that falls steeply from 232 at 2.5 sigma, flattens into a plateau near 142 kilograms between 3.5 and 5 sigma, then falls again at 6. The non-separable candidate falls monotonically from 210 to 34 across the same range with no flat region. A shaded band marks the plateau, and an annotation states that the plateau value is the reportable estimate while the absence of a plateau means the mask boundary, not the plume, is doing the arithmetic.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">A plume you can quantify has a plateau</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Integrated mass against mask threshold. Flatness means the estimate does not depend on the threshold you chose.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.25">
    <line x1="76" y1="70" x2="640" y2="70"/>
    <line x1="76" y1="122" x2="640" y2="122"/>
    <line x1="76" y1="174" x2="640" y2="174"/>
    <line x1="76" y1="226" x2="640" y2="226"/>
  </g>
  <rect x="217" y="60" width="235" height="204" fill="currentColor" opacity="0.07"/>
  <text x="334" y="76" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor" opacity="0.78">plateau · 3.5–5σ</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="76" y1="56" x2="76" y2="264"/>
    <line x1="76" y1="264" x2="640" y2="264"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="68" y="268" text-anchor="end">0</text>
    <text x="68" y="230" text-anchor="end">65</text>
    <text x="68" y="178" text-anchor="end">130</text>
    <text x="68" y="126" text-anchor="end">195</text>
    <text x="68" y="74" text-anchor="end">260</text>
    <text x="76" y="284" text-anchor="middle">2.5σ</text>
    <text x="217" y="284" text-anchor="middle">3.5σ</text>
    <text x="358" y="284" text-anchor="middle">4.5σ</text>
    <text x="499" y="284" text-anchor="middle">5.5σ</text>
    <text x="640" y="284" text-anchor="middle">6σ</text>
  </g>
  <text x="24" y="160" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="currentColor" opacity="0.72" transform="rotate(-90 24 160)" text-anchor="middle">IME (kg)</text>
  <polyline points="76,79 146,142 217,151 288,153 358,150 429,154 499,158 570,196 640,222" fill="none" stroke="currentColor" stroke-width="2.8"/>
  <polyline points="76,96 146,132 217,158 288,182 358,204 429,222 499,236 570,246 640,253" fill="none" stroke="#f3a712" stroke-width="2.4" stroke-dasharray="7,4"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="652" y="226" fill="currentColor">separable plume</text>
    <text x="652" y="240" fill="currentColor" font-size="8.5" opacity="0.72">plateau at 142 kg → report</text>
    <text x="652" y="150" fill="#f3a712">no plateau</text>
    <text x="652" y="164" fill="currentColor" font-size="8.5" opacity="0.72">detected, not quantifiable</text>
    <text x="652" y="100" fill="currentColor" font-size="8.5" opacity="0.72">threshold too low:</text>
    <text x="652" y="114" fill="currentColor" font-size="8.5" opacity="0.72">both curves sum noise</text>
  </g>
</svg>

## Deterministic Transformation Logic

With the plume cleared for quantification, both estimators run over the same enhancement field. The IME implementation uses the plateau-averaged mass and an effective wind from an instrument-specific scaling; the CSF implementation integrates across transects perpendicular to the fitted plume axis and reports the median of the per-transect estimates along with their spread.

```python
from dataclasses import dataclass

import numpy as np
import structlog

log = structlog.get_logger()

CH4_MOLAR_MASS = 16.04     # g mol-1
PPM_M_TO_KG_M2 = 1e-9 * 40.87 * CH4_MOLAR_MASS   # ppm-m -> kg m-2 at STP column


@dataclass(frozen=True)
class Flux:
    method: str
    q_kg_h: float
    q_sigma_kg_h: float
    u_eff_m_s: float
    detail: dict


def effective_wind(u10_m_s: float, instrument: str) -> tuple[float, float]:
    """Uэ = a*U10 + b, fitted per instrument against large-eddy simulations.

    The coefficients absorb each retrieval's spatial smoothing, so they are NOT
    transferable between instruments — using AVIRIS coefficients on Sentinel-2
    is a documented ~15% bias.
    """
    scalings = {
        "aviris-ng": (0.34, 0.44, 0.50),
        "emit": (0.33, 0.45, 0.55),
        "prisma": (0.30, 0.51, 0.60),
        "sentinel-2": (0.28, 0.60, 0.70),
    }
    if instrument not in scalings:
        raise ValueError(f"no effective-wind scaling for {instrument!r}; do not guess")
    a, b, rel_error = scalings[instrument]
    return a * u10_m_s + b, rel_error


def ime_flux(ime_kg: float, plume_length_m: float, u10_m_s: float,
             instrument: str, retrieval_rel_error: float = 0.20) -> Flux:
    """Q = IME * Ueff / L. The residence time L/Ueff is the transport model."""
    u_eff, wind_rel = effective_wind(u10_m_s, instrument)
    q = ime_kg * u_eff / plume_length_m * 3600.0

    # Wind dominates; combining in quadrature is the minimum honest treatment.
    rel = float(np.sqrt(retrieval_rel_error ** 2 + wind_rel ** 2))

    log.info("ch4.flux.ime", q_kg_h=round(q, 1), ime_kg=round(ime_kg, 2),
             length_m=round(plume_length_m, 1), u_eff=round(u_eff, 2),
             rel_uncertainty=round(rel, 3))
    return Flux("ime", round(q, 1), round(q * rel, 1), round(u_eff, 2),
                {"ime_kg": ime_kg, "plume_length_m": plume_length_m,
                 "retrieval_rel_error": retrieval_rel_error, "wind_rel_error": wind_rel})


def csf_flux(enhancement: np.ndarray, mask: np.ndarray, axis_bearing_deg: float,
             pixel_size_m: float, u10_m_s: float, instrument: str,
             transect_offsets_m: tuple[float, ...] = (120, 240, 360, 480)) -> Flux:
    """Integrate the column across transects perpendicular to the plume axis.

    Each transect is an independent estimate of the same source rate, so their
    spread is an empirical uncertainty that owes nothing to a stated error model.
    """
    u_eff, wind_rel = effective_wind(u10_m_s, instrument)

    ys, xs = np.nonzero(mask)
    weights = enhancement[ys, xs]
    cy, cx = np.average(ys, weights=weights), np.average(xs, weights=weights)

    theta = np.radians(axis_bearing_deg)
    along = np.array([np.sin(theta), -np.cos(theta)])     # unit vector down-plume
    across = np.array([along[1], -along[0]])

    estimates = []
    for offset in transect_offsets_m:
        step = offset / pixel_size_m
        centre = np.array([cx, cy]) + along * step
        # Sample the column along the perpendicular, half a pixel apart.
        samples = []
        for t in np.arange(-40.0, 40.0, 0.5):
            px, py = centre + across * t
            ix, iy = int(round(px)), int(round(py))
            if 0 <= iy < enhancement.shape[0] and 0 <= ix < enhancement.shape[1]:
                samples.append(enhancement[iy, ix])
        if len(samples) < 20:
            continue
        # Integrated column across the transect, in kg per metre of transect.
        line_density = float(np.sum(samples)) * PPM_M_TO_KG_M2 * (0.5 * pixel_size_m)
        estimates.append(line_density * u_eff * 3600.0)

    if not estimates:
        raise ValueError("no usable transects; plume too close to the scene edge")

    q = float(np.median(estimates))
    spread_rel = float(np.std(estimates, ddof=1) / max(q, 1e-9)) if len(estimates) > 1 else 0.3
    rel = float(np.sqrt(spread_rel ** 2 + wind_rel ** 2))

    log.info("ch4.flux.csf", q_kg_h=round(q, 1), transects=len(estimates),
             per_transect=[round(e, 1) for e in estimates],
             spread_rel=round(spread_rel, 3), rel_uncertainty=round(rel, 3))
    return Flux("csf", round(q, 1), round(q * rel, 1), round(u_eff, 2),
                {"per_transect_kg_h": [round(e, 1) for e in estimates],
                 "transect_spread_rel": round(spread_rel, 3), "wind_rel_error": wind_rel})


def reconcile(ime: Flux, csf: Flux, tolerance: float = 0.30) -> dict:
    """Report both, flag disagreement. Two structurally different estimators
    agreeing is stronger evidence than either one's stated interval."""
    mean = (ime.q_kg_h + csf.q_kg_h) / 2.0
    disagreement = abs(ime.q_kg_h - csf.q_kg_h) / max(mean, 1e-9)
    agreed = disagreement <= tolerance

    if not agreed:
        log.warning("ch4.flux.disagreement", ime_kg_h=ime.q_kg_h, csf_kg_h=csf.q_kg_h,
                    disagreement=round(disagreement, 3),
                    hint="ragged mask hurts IME; a bent axis hurts CSF")

    return {"q_kg_h": round(mean if agreed else min(ime.q_kg_h, csf.q_kg_h), 1),
            "q_sigma_kg_h": round(max(ime.q_sigma_kg_h, csf.q_sigma_kg_h), 1),
            "ime_kg_h": ime.q_kg_h, "csf_kg_h": csf.q_kg_h,
            "methods_agree": agreed, "disagreement": round(disagreement, 3),
            "u_eff_m_s": ime.u_eff_m_s, "reported": "mean" if agreed else "conservative_min"}
```

Note what `reconcile` does when the estimators disagree: it reports the *lower* of the two, not the mean, and marks the record. Conservativeness under uncertainty is a requirement of every carbon methodology, and it is far easier to defend a number chosen by a stated rule than one produced by averaging two figures you have just admitted are inconsistent.

<svg viewBox="0 -4 900 292" role="img" aria-labelledby="ub-t ub-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ub-t">Uncertainty budget for a single methane flux estimate</title>
  <desc id="ub-d">A stacked horizontal bar chart decomposing relative uncertainty on one flux estimate. Effective wind speed contributes 50 percent relative error and dominates the budget. Retrieval precision contributes 20 percent. Mask boundary and threshold choice contribute 12 percent. Plume-length estimation contributes 9 percent. Steady-state violation contributes 8 percent. The combined figure in quadrature is 56 percent. A second bar shows the same budget with an on-site anemometer replacing reanalysis wind: wind drops to 15 percent and the combined figure falls to 27 percent, less than half. An annotation states that no improvement in imagery moves the first bar.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The wind term is the budget</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Relative contributions to flux uncertainty, combined in quadrature.</text>
    <text x="12" y="74" fill="currentColor" font-size="10" font-weight="700">Reanalysis wind</text>
    <text x="12" y="90" fill="currentColor" font-size="9" opacity="0.7">0.25° product, interpolated</text>
  </g>
  <g>
    <rect x="196" y="60" width="330" height="34" rx="4" fill="#f3a712" opacity="0.45"/>
    <rect x="526" y="60" width="132" height="34" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="658" y="60" width="80" height="34" rx="4" fill="currentColor" opacity="0.2"/>
    <rect x="738" y="60" width="60" height="34" rx="4" fill="currentColor" opacity="0.13"/>
    <rect x="798" y="60" width="52" height="34" rx="4" fill="currentColor" opacity="0.08"/>
    <text x="361" y="82" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="currentColor">wind 50%</text>
    <text x="592" y="82" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">retrieval 20%</text>
    <text x="698" y="82" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor">mask 12%</text>
    <text x="768" y="82" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor">L 9%</text>
    <text x="824" y="82" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor">SS 8%</text>
    <text x="196" y="116" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="currentColor">combined 56% — a 600 kg h⁻¹ plume is 600 ± 336</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="176" fill="currentColor" font-size="10" font-weight="700">On-site anemometer</text>
    <text x="12" y="192" fill="currentColor" font-size="9" opacity="0.7">10 m mast at the facility</text>
  </g>
  <g>
    <rect x="196" y="162" width="99" height="34" rx="4" fill="#f3a712" opacity="0.45"/>
    <rect x="295" y="162" width="132" height="34" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="427" y="162" width="80" height="34" rx="4" fill="currentColor" opacity="0.2"/>
    <rect x="507" y="162" width="60" height="34" rx="4" fill="currentColor" opacity="0.13"/>
    <rect x="567" y="162" width="52" height="34" rx="4" fill="currentColor" opacity="0.08"/>
    <text x="245" y="184" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">15%</text>
    <text x="361" y="184" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">retrieval 20%</text>
    <text x="467" y="184" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor">mask 12%</text>
    <text x="537" y="184" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor">L 9%</text>
    <text x="593" y="184" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor">SS 8%</text>
    <text x="196" y="218" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="currentColor">combined 27% — the same plume is 600 ± 162</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="242" width="876" height="42" rx="8" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="242" width="876" height="42" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="28" y="260" fill="currentColor" font-size="9.5" font-weight="700">No improvement in imagery moves the first bar.</text>
    <text x="28" y="276" fill="currentColor" font-size="9.5" opacity="0.8">A sharper retrieval halves a 20% term inside a 50% budget — worth about 2 points. Better wind data is worth 29.</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

A flux estimate becomes reportable when it carries the evidence needed to re-derive it. Six fields are the minimum: the retrieval algorithm and version, the mask threshold and whether a plateau was found, the wind source with its timestamp and the effective-wind scaling used, both method estimates and their agreement flag, the uncertainty decomposition rather than a single combined number, and the steady-state verdict. Store them on the record, not only in the log, so a replay does not depend on log retention — the contract described in the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/).

Two gates then apply before the number reaches an inventory. First, **conservativeness**: where methods disagree beyond tolerance, or steady state is doubtful, report the lower estimate and mark the record, exactly as `reconcile` does. Second, **materiality-scaled scrutiny**: where a single plume contributes more than a few per cent of a facility's reported total, the wind term should be replaced by an on-site measurement or the estimate should be repeated on a second acquisition before it is used. The uncertainty budget above shows why — the difference between a reanalysis wind and a mast is the difference between ±56% and ±27% on the same observation.

The annualisation step deserves its own record. Converting instantaneous fluxes to an annual mass requires a stated temporal model, and its assumptions belong in lineage alongside the measurements, wired through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/). An auditor who can see three observations and the persistence assumption can reconstruct the annual figure; one who sees only the annual figure cannot check anything.

## Production Integration

1. **Ingest** the enhancement field, plume mask, scene metadata, and wind record, refusing any scene whose CRS is missing — plume geometry drives the facility attribution and a wrong datum reassigns the emission.
2. **Pre-flight** with the checks above: reject unresolved plumes, plumes touching the scene edge, and masks whose principal axis disagrees with the wind bearing.
3. **Sweep the threshold** and take the plateau-averaged IME. If no plateau exists, record the plume as detected but unquantifiable rather than picking a threshold that produces a comfortable number.
4. **Quantify twice** — IME and CSF — using the instrument-specific effective-wind scaling, and reconcile with the conservative rule.
5. **Decompose the uncertainty** into wind, retrieval, mask, length, and steady-state terms, storing the decomposition rather than only its quadrature sum.
6. **Emit one record per scene-facility pair**, including non-detections with their detection limits, and hand it to the validation gates described under [emissions data quality validation gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/).

For batch operation, quantification is cheap relative to retrieval — the transects and threshold sweep are small array operations — so the sensible partition is per scene, with plumes processed in-process rather than fanned out. Cache the effective-wind scaling table as a versioned artefact, because changing a coefficient changes every historical flux and that is a restatement, not a bug fix.

## Frequently Asked Questions

### Which method should I report if I can only report one?

Report IME for compact plumes and CSF for long, well-developed ones — but the better answer is to compute both always and report the reconciled value with the agreement flag. The marginal cost is a few milliseconds; the marginal evidence is substantial. When forced to a single number by a submission template, use IME with the plateau check, since it degrades more gracefully at the small plume sizes that dominate most surveys.

### Can I use the 10 m reanalysis wind directly instead of an effective-wind scaling?

Only if you want a biased estimate. The 10 m wind is not the wind that transports a plume occupying the lowest tens of metres of a sheared boundary layer, and using it directly typically overestimates flux because Uₑ is usually below U₁₀ in the relevant range. The scaling coefficients are instrument-specific because they absorb the retrieval's spatial smoothing; take them from a published fit for your instrument, record which fit you used, and never transfer coefficients between sensors.

### What does it mean when IME and CSF disagree by a factor of two?

Almost always a geometry problem rather than a physics one. A ragged or over-grown mask inflates IME because it sums noise over a larger area, while CSF is comparatively insensitive to the mask edge. A bent plume axis — common in shifting wind — breaks CSF because the transects are no longer perpendicular to the flow, while IME does not care about the axis. Check the elongation and axis-disagreement diagnostics first; if both look healthy, suspect the plume length used in IME.

### How do I turn several instantaneous fluxes into an annual figure?

With an explicit, stated temporal model. For a source known to be continuous, a mean of observations with an interval reflecting both measurement and temporal sampling error is defensible. For intermittent sources, model the duty cycle — from operational records where available, or from the detection frequency across observations, treating non-detections as censored observations below their detection limits. What is never defensible is multiplying one observed rate by 8760 hours without stating that you assumed persistence.

### Does the plume mask threshold need to be the same across a survey?

The sigma multiple should be consistent, but the absolute threshold will differ per scene because the noise floor differs. Fix the rule — for example, four times the scene's robust noise estimate, with a plateau check — and apply it uniformly. Fixing the absolute ppm·m value instead makes your effective detection sensitivity vary with scene quality in a way that is invisible in the output and biases the survey towards clean scenes.

## Related guides

- [Methane Plume Detection from Hyperspectral Imagery](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/) — the parent topic: retrieval, segmentation, and attribution.
- [Troubleshooting False Methane Detections over Bright Surfaces](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/methane-plume-detection-from-hyperspectral-imagery/troubleshooting-false-methane-detections-over-bright-surfaces/) — making sure the plume you are quantifying is real.
- [Monte Carlo Uncertainty Propagation for Emission Factors](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/monte-carlo-uncertainty-propagation-for-emission-factors/) — propagating this budget into a reported total.
- [Emissions Data Quality & Validation Gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/) — the gates a flux record must pass to enter an inventory.
