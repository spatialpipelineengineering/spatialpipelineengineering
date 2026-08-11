---
shortTitle: "Detecting Carbon Reversals from Satellite Time Series"
title: "Detecting Carbon Reversals from Satellite Time Series"
description: "Build a reversal detector for issued carbon projects: sequential change detection on dense optical and radar series, two-stage confirmation, mechanism classification, and the buffer-pool notification record."
slug: detecting-carbon-reversals-from-satellite-time-series
type: guide
breadcrumb: "Detecting Carbon Reversals"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Detecting Carbon Reversals from Satellite Time Series

A reversal detector is a deforestation alert system pointed inward. It watches a boundary you already know, on a schedule that does not stop when the crediting period ends, and its output is not a map layer but a financial event: tonnes that must be cancelled from a buffer pool. This guide implements one, within [permanence, reversal and leakage monitoring](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/) in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack. It shares its statistical core with [implementing CCDC change detection in Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/implementing-ccdc-change-detection-in-python/) but inverts the design priorities: for landscape monitoring you tune for recall, for a reversal detector attached to a buffer pool you tune for a controlled false-positive rate and fast, staged confirmation.

The reason is economic. A false landscape alert costs an analyst ten minutes. A false reversal notification cancels credits, triggers a registry process, and is difficult to unwind. A missed reversal is equally expensive in the other direction, discovered at the next verification when the affected vintage has already been retired. The design that resolves this is two-stage: a sensitive first pass that raises provisional candidates within days, and a confirmation pass that only escalates what survives independent evidence.

<svg viewBox="0 -4 940 288" role="img" aria-labelledby="rd-t rd-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rd-t">Two-stage reversal detection from acquisition to buffer-pool notification</title>
  <desc id="rd-d">A pipeline in two stages. Stage one runs on every acquisition: a per-pixel sequential test against the pixel's own seasonal model raises a provisional candidate within days, tuned for sensitivity. Stage two confirms, requiring a second clear observation, a radar cross-check that is insensitive to cloud and haze, a minimum contiguous area, and a mechanism classification from burn index, parcel alignment, and decline duration. Confirmed events proceed to stock-loss quantification against the pinned issuance-era model and then to a buffer-pool notification. Unconfirmed candidates return to watch status with an expiry, and are neither reported nor discarded.</desc>
  <defs>
    <marker id="rd-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="10" y="86" width="140" height="70" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="10" y="86" width="140" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="80" y="112" fill="currentColor" font-size="10.5" font-weight="700">Every acquisition</text>
    <text x="80" y="130" fill="currentColor" font-size="9" opacity="0.78">S2 · Landsat · S1</text>
    <text x="80" y="146" fill="currentColor" font-size="9" opacity="0.78">over the boundary</text>
    <rect x="186" y="86" width="164" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="268" y="110" fill="currentColor" font-size="10.5" font-weight="700">Stage 1 · sequential test</text>
    <text x="268" y="128" fill="currentColor" font-size="9" opacity="0.78">per-pixel CUSUM vs its</text>
    <text x="268" y="144" fill="currentColor" font-size="9" opacity="0.78">own seasonal model</text>
    <rect x="386" y="20" width="196" height="86" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="484" y="44" fill="currentColor" font-size="10.5" font-weight="700">Stage 2 · confirmation</text>
    <text x="484" y="62" fill="currentColor" font-size="9" opacity="0.78">2nd clear obs · radar cross-check</text>
    <text x="484" y="78" fill="currentColor" font-size="9" opacity="0.78">min contiguous area</text>
    <text x="484" y="94" fill="currentColor" font-size="9" opacity="0.78">mechanism classification</text>
    <rect x="386" y="146" width="196" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3" opacity="0.85"/>
    <text x="484" y="170" fill="currentColor" font-size="10.5" font-weight="700">Watch list</text>
    <text x="484" y="188" fill="currentColor" font-size="9" opacity="0.78">unconfirmed · expires after N obs</text>
    <text x="484" y="204" fill="currentColor" font-size="9" opacity="0.78">neither reported nor discarded</text>
    <rect x="618" y="20" width="176" height="86" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="706" y="46" fill="currentColor" font-size="10.5" font-weight="700">Stock-loss quantification</text>
    <text x="706" y="66" fill="currentColor" font-size="9" opacity="0.78">against the PINNED</text>
    <text x="706" y="82" fill="currentColor" font-size="9" opacity="0.78">issuance-era model</text>
    <rect x="830" y="20" width="102" height="86" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="830" y="20" width="102" height="86" rx="9" fill="none" stroke="currentColor" stroke-width="1.9"/>
    <text x="881" y="50" fill="currentColor" font-size="10.5" font-weight="700">Buffer</text>
    <text x="881" y="68" fill="currentColor" font-size="10.5" font-weight="700">notification</text>
    <text x="881" y="88" fill="currentColor" font-size="9" opacity="0.75">tCO₂e cancelled</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#rd-arrow)">
    <line x1="150" y1="121" x2="184" y2="121"/>
    <path d="M350 108 C 366 100, 370 72, 384 66"/>
    <path d="M350 134 C 366 144, 370 172, 384 178"/>
    <line x1="582" y1="63" x2="616" y2="63"/>
    <line x1="794" y1="63" x2="828" y2="63"/>
    <path d="M484 146 C 448 138, 440 122, 440 108" stroke-dasharray="5,4"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.75">
    <text x="268" y="182">tuned for sensitivity</text>
    <text x="268" y="196">days, not months</text>
    <text x="700" y="130">tuned for specificity</text>
    <text x="700" y="144">a false cancellation is expensive to unwind</text>
    <text x="430" y="240">re-tested on each new observation</text>
  </g>
</svg>

## Root Cause Analysis

Reversal detection is hard for reasons that have little to do with change detection and everything to do with what happens to the result. Three of them shape the design.

The first is that **the null hypothesis is a moving target**. A forest's reflectance varies seasonally, between years with different rainfall, and with sensor and atmospheric-correction changes. Testing this year's observation against a fixed threshold guarantees a wave of false alarms in a dry year. The detector must test each pixel against *its own* fitted seasonal model, so the question becomes "is this observation inconsistent with what this pixel has always done" rather than "is this observation low".

The second is that **a single observation is never sufficient evidence for a financial event**. Cloud shadow, sensor artefacts, a haze layer the mask missed, and geometric misregistration all produce single-date drops that look exactly like clearing. Requiring a second independent observation removes almost all of them, and requiring an observation from a different sensing modality — radar, which is insensitive to cloud and illumination — removes most of the rest. The cost is latency, which is why the two stages are separated rather than merged into one conservative test.

The third is that **the mechanism determines the accounting treatment**, so a detector that outputs only "loss here, this much" is incomplete. Fire, harvest, and slow decline have different signatures — an abrupt drop with a burn-scar index, a stepped drop aligned to cadastral boundaries, a multi-season monotone decline — and different consequences for the buffer and the risk rating. Classification belongs inside the detector, where the time series is still in memory, not in a downstream manual review.

## Diagnostic Pipeline / Pre-Flight Validation

Before running the detector, verify that the series can support it. Three conditions disqualify a pixel from detection in a given period: too few clear observations to fit a seasonal model, an observation gap long enough that a change could have occurred and recovered unseen, and a break in the input record — a sensor change, a processing baseline change — that will produce a step unrelated to the ground.

```python
from dataclasses import dataclass

import numpy as np
import structlog

log = structlog.get_logger()

MIN_CLEAR_OBS = 24          # ~2 years of usable observations to fit seasonality
MAX_GAP_DAYS = 120          # longer than this and a change could hide entirely
BASELINE_BREAKS = {         # processing-baseline changes that shift reflectance
    "sentinel-2": ("2022-01-25",),
}


@dataclass(frozen=True)
class SeriesHealth:
    pixel_id: str
    clear_obs: int
    max_gap_days: int
    crosses_baseline_break: bool
    detectable: bool
    reason: str | None


def series_health(pixel_id: str, dates: np.ndarray, clear: np.ndarray,
                  sensor: str) -> SeriesHealth:
    """A detector that runs on an inadequate series produces confident nonsense.
    Refusing to run is a legitimate, reportable outcome."""
    clear_dates = dates[clear]
    n = int(clear.sum())
    gaps = np.diff(clear_dates).astype("timedelta64[D]").astype(int) if n > 1 else np.array([0])
    max_gap = int(gaps.max()) if gaps.size else 0

    breaks = np.array([np.datetime64(b) for b in BASELINE_BREAKS.get(sensor, ())])
    crosses = bool(breaks.size and ((clear_dates.min() < breaks) & (breaks < clear_dates.max())).any())

    reason = None
    if n < MIN_CLEAR_OBS:
        reason = "insufficient_clear_observations"
    elif max_gap > MAX_GAP_DAYS:
        reason = "observation_gap_too_long"
    elif crosses:
        # Not fatal, but the model must be fitted per segment or the break reads
        # as a reversal on the day the processing baseline changed.
        reason = "crosses_processing_baseline_break"

    health = SeriesHealth(pixel_id, n, max_gap, crosses, reason is None, reason)
    if reason:
        log.warning("reversal.series.undetectable", **health.__dict__)
    return health
```

The baseline-break check deserves emphasis. When a data provider changes its processing baseline, surface reflectance shifts by a small but systematic amount across the entire archive from that date. A detector fitted across the break will see a step in every pixel simultaneously — which, helpfully, is also the signature that tells you it happened: a reversal affecting 100% of pixels on one date is never a physical event.

<svg viewBox="0 -4 900 300" role="img" aria-labelledby="cusum-t cusum-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cusum-t">Sequential detection: observed index, fitted seasonal model, and the cumulative-sum statistic that fires</title>
  <desc id="cusum-d">Two stacked charts sharing a time axis over three years. The upper chart shows an observed vegetation index oscillating seasonally between about 0.62 and 0.84, tracked closely by a fitted harmonic model, until an abrupt drop to 0.31 in the third year after which observations stay low. The lower chart shows the cumulative sum of standardised residuals, flat near zero while observations match the model, then rising steeply after the drop and crossing a decision threshold two observations later. Annotations mark the event date, the provisional flag raised at the first crossing, and confirmation at the second clear observation ten days afterwards.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Test each pixel against its own history, not a fixed threshold</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">A dry season and a clearing look identical to a fixed cut-off. They do not look alike to a fitted harmonic model.</text>
    <text x="12" y="60" fill="currentColor" font-size="10" font-weight="700">Observed index vs fitted model</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="70" y1="80" x2="700" y2="80"/>
    <line x1="70" y1="120" x2="700" y2="120"/>
    <line x1="70" y1="160" x2="700" y2="160"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="70" y1="70" x2="70" y2="170"/>
    <line x1="70" y1="170" x2="700" y2="170"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="62" y="84" text-anchor="end">0.9</text>
    <text x="62" y="124" text-anchor="end">0.6</text>
    <text x="62" y="164" text-anchor="end">0.3</text>
  </g>
  <polyline points="70,96 96,88 122,100 148,112 174,94 200,86 226,98 252,110 278,92 304,86 330,96 356,108 382,90 408,88 434,158 460,162 486,160 512,164 538,159 564,163 590,161 616,160 642,162 668,159 700,161" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <polyline points="70,94 96,89 122,99 148,110 174,95 200,88 226,97 252,109 278,93 304,87 330,95 356,107 382,91 408,89 434,96 460,107 486,92 512,88 538,96 564,108 590,92 616,88 642,96 668,107 700,93" fill="none" stroke="#f3a712" stroke-width="1.8" stroke-dasharray="6,3"/>
  <line x1="421" y1="70" x2="421" y2="170" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4,3" opacity="0.7"/>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="712" y="96" fill="currentColor" font-weight="600">observed</text>
    <text x="712" y="112" fill="#f3a712" font-weight="600">fitted model</text>
    <text x="712" y="132" fill="currentColor" opacity="0.72" font-size="8.5">the model keeps predicting</text>
    <text x="712" y="146" fill="currentColor" opacity="0.72" font-size="8.5">a forest that is no longer there</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="200" fill="currentColor" font-size="10" font-weight="700">CUSUM of standardised residuals</text>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="70" y1="210" x2="70" y2="276"/>
    <line x1="70" y1="276" x2="700" y2="276"/>
  </g>
  <line x1="70" y1="228" x2="700" y2="228" stroke="#f3a712" stroke-width="1.6" stroke-dasharray="5,4"/>
  <text x="704" y="232" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#f3a712">decision threshold</text>
  <polyline points="70,274 122,273 174,275 226,272 278,274 330,273 382,275 408,274 434,262 460,240 486,222 512,214 538,213 564,212 590,213 616,212 642,213 668,212 700,213" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <circle cx="460" cy="240" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="486" cy="222" r="5.5" fill="none" stroke="#f3a712" stroke-width="2.4"/>
  <g font-family="system-ui, sans-serif" font-size="9">
    <text x="424" y="292" fill="currentColor" opacity="0.8">event</text>
    <text x="450" y="258" fill="currentColor" opacity="0.8">provisional</text>
    <text x="498" y="252" fill="#f3a712" font-weight="700">confirmed · +10 days</text>
  </g>
</svg>

## Deterministic Transformation Logic

The detector fits a harmonic seasonal model to each pixel's stable history, then runs a one-sided cumulative-sum test on standardised residuals. CUSUM is the right statistic here because it accumulates evidence: a single large residual is not enough, but three moderate ones in the same direction are, which is exactly the behaviour a financial trigger wants.

```python
import numpy as np
import structlog

log = structlog.get_logger()

CUSUM_K = 0.5        # slack: residuals within 0.5 sigma contribute nothing
CUSUM_H = 5.0        # decision interval, in sigma-units of accumulated evidence
MIN_EVENT_PIXELS = 12


def fit_harmonic(dates_doy: np.ndarray, values: np.ndarray, order: int = 2
                 ) -> tuple[np.ndarray, float]:
    """Fit intercept + `order` harmonics to the pixel's stable history.

    The seasonal model IS the null hypothesis. Fitting it per pixel is what makes
    a dry season distinguishable from a clearing.
    """
    t = 2.0 * np.pi * dates_doy / 365.25
    design = [np.ones_like(t)]
    for k in range(1, order + 1):
        design += [np.cos(k * t), np.sin(k * t)]
    design = np.column_stack(design)

    coefs, *_ = np.linalg.lstsq(design, values, rcond=None)
    resid = values - design @ coefs
    sigma = float(np.std(resid, ddof=design.shape[1]))
    return coefs, max(sigma, 1e-4)


def predict_harmonic(coefs: np.ndarray, dates_doy: np.ndarray, order: int = 2) -> np.ndarray:
    t = 2.0 * np.pi * dates_doy / 365.25
    design = [np.ones_like(t)]
    for k in range(1, order + 1):
        design += [np.cos(k * t), np.sin(k * t)]
    return np.column_stack(design) @ coefs


def cusum_scan(values: np.ndarray, predicted: np.ndarray, sigma: float
               ) -> tuple[int | None, np.ndarray]:
    """One-sided CUSUM on standardised residuals. Returns the index at which the
    statistic first crosses the decision interval, or None."""
    z = (values - predicted) / sigma
    s = 0.0
    trace = np.zeros_like(z)
    fired = None
    for i, zi in enumerate(z):
        s = max(0.0, s - zi - CUSUM_K)      # one-sided: we only care about drops
        trace[i] = s
        if fired is None and s > CUSUM_H:
            fired = i
    return fired, trace


def classify_mechanism(dnbr: float, parcel_aligned: bool, declining_seasons: int,
                       drop_fraction: float) -> str:
    """Mechanism drives the accounting treatment, so it is computed here — while
    the series is still in memory — rather than in a downstream manual review."""
    if dnbr > 0.27:
        return "fire"
    if parcel_aligned and drop_fraction > 0.4:
        return "harvest_or_clearing"
    if declining_seasons >= 3 and drop_fraction < 0.35:
        return "drought_or_pest"
    return "unattributed"


def detect_reversal(
    pixel_id: str, dates_doy: np.ndarray, values: np.ndarray, stable_mask: np.ndarray,
    dnbr: float, parcel_aligned: bool, declining_seasons: int,
) -> dict | None:
    """Stage 1: raise a provisional candidate. Never a confirmation on its own."""
    coefs, sigma = fit_harmonic(dates_doy[stable_mask], values[stable_mask])
    predicted = predict_harmonic(coefs, dates_doy)
    fired, trace = cusum_scan(values, predicted, sigma)
    if fired is None:
        return None

    pre = float(np.mean(predicted[max(0, fired - 6):fired]))
    post = float(np.mean(values[fired:fired + 3]))
    drop_fraction = max(0.0, (pre - post) / max(pre, 1e-6))

    candidate = {
        "pixel_id": pixel_id,
        "event_index": int(fired),
        "sigma": round(sigma, 4),
        "cusum_at_fire": round(float(trace[fired]), 2),
        "pre_event_mean": round(pre, 4),
        "post_event_mean": round(post, 4),
        "drop_fraction": round(drop_fraction, 3),
        "mechanism": classify_mechanism(dnbr, parcel_aligned, declining_seasons,
                                        drop_fraction),
        "status": "provisional",
    }
    log.info("reversal.candidate", **candidate)
    return candidate


def confirm(candidate: dict, second_clear_obs: bool, radar_agrees: bool,
            contiguous_pixels: int) -> dict:
    """Stage 2: three independent conditions, all required.

    Optical-only confirmation lets a missed haze layer cancel credits; the radar
    cross-check is the single most valuable addition because it fails in
    completely different weather from the optical sensor.
    """
    checks = {
        "second_clear_observation": second_clear_obs,
        "radar_cross_check": radar_agrees,
        "minimum_area": contiguous_pixels >= MIN_EVENT_PIXELS,
    }
    confirmed = all(checks.values())
    candidate = {**candidate, "status": "confirmed" if confirmed else "watch",
                 "checks": checks, "contiguous_pixels": contiguous_pixels}

    if confirmed:
        log.info("reversal.confirmed", pixel_id=candidate["pixel_id"],
                 mechanism=candidate["mechanism"], pixels=contiguous_pixels)
    else:
        failed = [name for name, ok in checks.items() if not ok]
        log.info("reversal.watch", pixel_id=candidate["pixel_id"], failed=failed)
    return candidate
```

The `confirm` step returns the candidate to a watch list rather than discarding it when a check fails, and this is deliberate. A candidate that failed only on cloud cover will very likely confirm on the next clear pass; discarding it means starting the evidence accumulation over. A watch list with an explicit expiry — after which an unconfirmed candidate is closed and recorded as such — keeps the pipeline honest in both directions.

## Compliance Gating & Audit Trail Generation

A confirmed reversal becomes a notification only after the loss is quantified, and the quantification must run against the **pinned issuance-era stock model**, not the current one. This is the drift failure described in the parent topic, and it is the single most common way a monitoring pipeline reports a reversal that is really a software upgrade. Compute both figures, report the pinned one, and record the difference.

The notification record needs six fields to survive review: the event date bracketed by the last clear pre-event and first clear post-event observations; the affected area in an equal-area projection; the classified mechanism with the evidence that supported it; the stock loss against the pinned model; the confirmation checks that passed; and the model, factor-set, and code versions used. That record joins the evidence chain through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) and is submitted under the registry's reversal process.

<svg viewBox="0 -4 900 276" role="img" aria-labelledby="rec-t rec-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rec-t">Anatomy of a reversal notification record and where each field comes from</title>
  <desc id="rec-d">A record laid out as six labelled fields. Event window is bracketed by the last clear pre-event observation on 2030-05-18 and the first clear post-event observation on 2030-05-28, sourced from the acquisition catalogue. Affected area of 412 hectares is computed in the equal-area projection EPSG 6933. Mechanism is fire, evidenced by a delta normalised burn ratio of 0.41 with no parcel alignment. Stock loss of 39840 tonnes of carbon dioxide equivalent is computed against the pinned issuance-era model version 2.1.0, with the current model version 3.4.0 shown alongside at 41210 for transparency. Confirmation lists three passed checks: second clear observation, radar cross-check, and minimum area. Versions record the code, factor set, and container digest. A footer notes that the pinned figure is the one submitted.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">What the registry actually receives</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Six fields. Every one of them has to be re-derivable years later from stored evidence.</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="52" width="286" height="96" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="12" y="52" width="286" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="74" fill="currentColor" font-size="9" font-weight="700" opacity="0.7">EVENT WINDOW</text>
    <text x="28" y="96" fill="currentColor" font-size="10.5">last clear pre-event 2030-05-18</text>
    <text x="28" y="116" fill="currentColor" font-size="10.5">first clear post-event 2030-05-28</text>
    <text x="28" y="138" fill="currentColor" font-size="9" opacity="0.72">source: acquisition catalogue</text>
    <rect x="308" y="52" width="286" height="96" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="308" y="52" width="286" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="324" y="74" fill="currentColor" font-size="9" font-weight="700" opacity="0.7">AFFECTED AREA</text>
    <text x="324" y="100" fill="currentColor" font-size="15" font-weight="700">412 ha</text>
    <text x="324" y="122" fill="currentColor" font-size="10.5">contiguous, 8-connected</text>
    <text x="324" y="138" fill="currentColor" font-size="9" opacity="0.72">computed in EPSG:6933 equal-area</text>
    <rect x="604" y="52" width="284" height="96" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="604" y="52" width="284" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="620" y="74" fill="currentColor" font-size="9" font-weight="700" opacity="0.7">MECHANISM</text>
    <text x="620" y="100" fill="currentColor" font-size="15" font-weight="700">fire</text>
    <text x="620" y="122" fill="currentColor" font-size="10.5">dNBR 0.41 · not parcel-aligned</text>
    <text x="620" y="138" fill="currentColor" font-size="9" opacity="0.72">evidence stored with the record</text>
    <rect x="12" y="158" width="286" height="96" rx="8" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="158" width="286" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="28" y="180" fill="currentColor" font-size="9" font-weight="700" opacity="0.7">STOCK LOSS</text>
    <text x="28" y="206" fill="currentColor" font-size="15" font-weight="700">39 840 tCO₂e</text>
    <text x="28" y="226" fill="currentColor" font-size="10">pinned issuance model v2.1.0</text>
    <text x="28" y="244" fill="#f3a712" font-size="9.5" font-weight="700">current model v3.4.0 → 41 210 (not submitted)</text>
    <rect x="308" y="158" width="286" height="96" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="308" y="158" width="286" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="324" y="180" fill="currentColor" font-size="9" font-weight="700" opacity="0.7">CONFIRMATION</text>
    <text x="324" y="202" fill="currentColor" font-size="10.5">✓ second clear observation</text>
    <text x="324" y="222" fill="currentColor" font-size="10.5">✓ radar cross-check</text>
    <text x="324" y="242" fill="currentColor" font-size="10.5">✓ minimum contiguous area</text>
    <rect x="604" y="158" width="284" height="96" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="604" y="158" width="284" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="620" y="180" fill="currentColor" font-size="9" font-weight="700" opacity="0.7">VERSIONS</text>
    <text x="620" y="202" fill="currentColor" font-size="10.5">detector 4.2.1 · factors ef-2029.3</text>
    <text x="620" y="222" fill="currentColor" font-size="10.5">container sha256:9f31c8…</text>
    <text x="620" y="242" fill="currentColor" font-size="9" opacity="0.72">replayable for the full obligation</text>
  </g>
</svg>

Two gates apply before submission. **Materiality**: registries define a threshold below which a loss is recorded but not separately notified; apply it as a stated rule, not by judgement. **Conservativeness under ambiguity**: where the mechanism is unattributed or the pre-event stock is uncertain, report the larger loss, since understating a reversal is the error the whole buffer mechanism exists to prevent.

## Production Integration

1. **Schedule per acquisition**, not per reporting period — the detector runs whenever a new scene covering the boundary lands.
2. **Check series health** per pixel and record undetectable pixels explicitly; a period in which 30% of the project was undetectable is a material limitation on the monitoring claim.
3. **Fit the seasonal model on stable history only**, excluding any previously confirmed event window, and refit per segment across known processing-baseline breaks.
4. **Run stage one** and write every provisional candidate to the watch list with its CUSUM trace.
5. **Run stage two** on each new observation over watch-list candidates, closing those that expire and escalating those that confirm.
6. **Quantify against the pinned model**, assemble the notification record, and submit — then feed the confirmed event back as an exclusion for future seasonal fits, so the detector does not keep re-firing on the same clearing.

Two operational notes. Radar is the highest-value addition to an optical-only detector, because it observes through cloud and its failure modes are uncorrelated with the optical sensor's — the cross-check is genuinely independent rather than a second opinion from the same source. And the fleet-wide false-positive rate should be monitored as a signal in its own right, in the manner set out under [MRV pipeline observability and failure modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/): a sudden rise usually means an upstream change, not a landscape on fire.

## Frequently Asked Questions

### Why CUSUM rather than a simple threshold on the residual?

Because a threshold on a single residual forces an impossible trade. Set it low and cloud artefacts fire constantly; set it high and you miss partial clearing that takes an index from 0.8 to 0.55. CUSUM accumulates evidence across observations, so three consecutive moderate drops trigger where one large drop might not — which matches the physical reality that a clearing stays cleared while an artefact does not. It also gives you a natural latency control through the decision interval.

### How long should a candidate stay on the watch list?

Long enough for two clear observations at the local cloud climatology, and no longer. In a persistently cloudy tropical setting that may be ninety days; in a dry basin it may be fifteen. Set the expiry from the observed clear-observation interval for that pixel rather than a global constant, and record the expiry that applied. A candidate that expires unconfirmed is a reportable outcome — it says the monitoring could not resolve the event — not a silent deletion.

### Does the detector need to run after the crediting period ends?

Yes, for as long as the methodology's post-crediting monitoring obligation runs, which for forestry is typically decades. This is the main architectural constraint on the whole design: the pipeline must still execute, on the pinned model, long after the project team has moved on. Containerise it, pin every dependency, store the container digest with the project record, and test the replay annually. A monitoring obligation you cannot execute is a monitoring obligation you have already failed.

### What if the reversal is only partial — thinning rather than clearing?

Partial loss is the common case and the detector handles it through `drop_fraction` rather than a binary change flag. The stock loss is computed from the modelled stock before and after, not from an assumed complete loss, so a 30% canopy reduction produces roughly a 30% stock reduction where the model supports that relationship. What partial loss does complicate is mechanism classification, since thinning and drought stress look similar; the `declining_seasons` term exists to separate them, and where it cannot the mechanism is recorded as unattributed and treated conservatively.

### How do I stop the detector from re-firing on a clearing it already reported?

Feed confirmed events back as exclusions on the seasonal fit. Once an event is confirmed, the pixel's pre-event history no longer describes its current state, so refitting across the break produces a model that keeps predicting the forest that used to be there — and a CUSUM statistic that stays above threshold indefinitely. The correct behaviour is to close the event, start a new segment at the post-event observations, and refit once the new segment has enough clear observations to support a model. Until then the pixel is legitimately undetectable and should be recorded as such rather than silently re-alerting. This segmented treatment is the same structure that makes continuous change detection work over long archives, and skipping it is the most common reason a reversal detector becomes noisy after its first real event.

### Can I reuse a landscape deforestation alert product instead of building this?

As an input, yes; as the whole detector, no. Public alert products are tuned for landscape recall with thresholds you do not control, they rarely classify mechanism, and their versions change without regard to your crediting period. Use them as an additional confirmation signal — an independent third opinion alongside your optical and radar checks — while keeping the pinned, versioned detector as the system of record for buffer notifications.

### What false-positive rate should the detector be tuned to?

Tune stage one for recall and stage two for precision, and measure the combined rate against a labelled sample rather than guessing. In practice a stage-one design that raises three or four provisional candidates for every real event is comfortable, because the confirmation stage is cheap and automated; pushing stage one to be precise on its own costs real events near the detection limit. What must be controlled tightly is the rate that survives stage two, since that is what reaches the registry — a target below one false confirmation per project-decade is a reasonable planning figure, and it is achievable mainly through the radar cross-check and the minimum-area requirement rather than through a higher optical threshold.

## Related guides

- [Permanence, Reversal & Leakage Monitoring](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/) — the parent topic and the three post-issuance obligations.
- [Quantifying Leakage with Spatial Control Areas](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/quantifying-leakage-with-spatial-control-areas/) — the sibling obligation and its estimator.
- [Implementing CCDC Change Detection in Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/implementing-ccdc-change-detection-in-python/) — the change-detection core, tuned for landscape recall instead.
- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — the outward-facing sibling of this architecture.
