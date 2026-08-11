---
shortTitle: "Change Detection Algorithms for Land Cover MRV"
title: "Change Detection Algorithms for Land Cover"
description: "Compare image differencing, BFAST, LandTrendr and CCDC for land-cover change detection in carbon MRV: latency vs stability, false-positive control, and audit-ready activity data in Python."
slug: change-detection-algorithms-for-land-cover
type: topic
breadcrumb: "Change Detection Algorithms"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Change Detection Algorithms for Land Cover

Change detection is the stage that turns a stack of co-registered reflectance observations into the single number carbon accounting actually needs: how many hectares of a given land-cover class converted, when, and with what confidence. As the analytical core of the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack, it consumes the QA-aware composites produced upstream by [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) and emits the disturbance events and dated activity data that feed [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) downstream. The distinction that matters for MRV is that a change map is not an image product — it is evidence, and every flagged pixel must survive a verifier who will ask why the algorithm decided a phenological dip was a clearing.

The field has converged on a small family of algorithms, and choosing between them is an engineering decision rather than a research preference. At one end sit bi-temporal image differencing and simple index thresholds — fast, cheap, and prone to firing on illumination and seasonal variation. At the other sit full time-series methods — BFAST breakpoint detection, LandTrendr temporal segmentation, and CCDC continuous monitoring — which model the expected trajectory of each pixel and flag departures from it, trading latency and compute for dramatically better false-positive control. This trade space maps directly onto the reporting cadence a project needs, and the same rolling composites and clear-sky masks that make [temporal aggregation](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) defensible are the inputs that make these time-series fits stable. This page surveys the family, then commits to a deterministic, per-pixel implementation you can run over an `xarray` stack.

<svg viewBox="0 0 1000 300" role="img" aria-labelledby="cd-t cd-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cd-t">Time-series change detection: fitted model and breakpoint feeding a change map and a validated area summary</title>
  <desc id="cd-d">Three linked panels. On the left, a per-pixel reflectance time series: scattered clear-sky observations with a fitted harmonic-plus-trend model. A vertical dashed line marks a detected breakpoint where the series steps down, with the drop annotated as change magnitude. An arrow carries the per-pixel decision into the middle panel, a raster change map whose shaded cells are pixels flagged as converted. A second arrow carries the map into the right panel, an amber-outlined summary box reporting the validated changed area in hectares with a confidence interval and a per-event date. The amber box is the audited output that enters the carbon ledger.</desc>
  <defs>
    <marker id="cd-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <!-- PANEL 1: time series -->
    <text x="185" y="30" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Per-pixel reflectance time series</text>
    <!-- axes -->
    <line x1="46" y1="58" x2="46" y2="228" stroke="currentColor" stroke-width="1.2" opacity="0.7"/>
    <line x1="46" y1="228" x2="340" y2="228" stroke="currentColor" stroke-width="1.2" opacity="0.7"/>
    <text x="24" y="150" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.7" transform="rotate(-90 24 150)">index</text>
    <text x="193" y="246" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.7">time &#8594;</text>
    <!-- fitted model, stable segment (seasonal harmonic) -->
    <path d="M52,110 C74,86 90,86 112,108 C134,130 150,130 172,108 C194,86 210,86 228,104" fill="none" stroke="currentColor" stroke-width="2"/>
    <!-- breakpoint -->
    <line x1="236" y1="62" x2="236" y2="228" stroke="#f3a712" stroke-width="1.6" stroke-dasharray="5,3"/>
    <text x="236" y="74" text-anchor="middle" font-size="9" font-weight="700" fill="#f3a712">breakpoint</text>
    <!-- fitted model, post-change segment (lower, damped) -->
    <path d="M244,176 C266,166 284,166 304,176 C318,183 328,181 336,180" fill="none" stroke="currentColor" stroke-width="2"/>
    <!-- change magnitude bracket -->
    <line x1="236" y1="104" x2="236" y2="176" stroke="#11839e" stroke-width="1.3"/>
    <text x="250" y="144" font-size="8.5" fill="#11839e">&#916; magnitude</text>
    <!-- observations -->
    <g fill="currentColor" opacity="0.85">
      <circle cx="58" cy="112" r="2.4"/><circle cx="82" cy="92" r="2.4"/><circle cx="104" cy="100" r="2.4"/>
      <circle cx="126" cy="126" r="2.4"/><circle cx="150" cy="132" r="2.4"/><circle cx="176" cy="106" r="2.4"/>
      <circle cx="200" cy="94" r="2.4"/><circle cx="224" cy="108" r="2.4"/>
      <circle cx="252" cy="172" r="2.4"/><circle cx="278" cy="168" r="2.4"/><circle cx="302" cy="178" r="2.4"/><circle cx="328" cy="176" r="2.4"/>
    </g>
    <!-- arrow to map -->
    <line x1="340" y1="176" x2="398" y2="150" stroke="currentColor" stroke-width="1.5" marker-end="url(#cd-arrow)"/>
    <!-- PANEL 2: change map -->
    <text x="500" y="30" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Raster change map</text>
    <g stroke="currentColor" stroke-width="1" opacity="0.5" fill="none">
      <rect x="404" y="70" width="192" height="160" rx="4"/>
    </g>
    <!-- grid cells -->
    <g>
      <!-- flagged (changed) cells shaded -->
      <rect x="404" y="70" width="48" height="40" fill="currentColor" opacity="0.30"/>
      <rect x="452" y="70" width="48" height="40" fill="currentColor" opacity="0.30"/>
      <rect x="452" y="110" width="48" height="40" fill="currentColor" opacity="0.30"/>
      <rect x="500" y="110" width="48" height="40" fill="currentColor" opacity="0.30"/>
      <rect x="500" y="150" width="48" height="40" fill="currentColor" opacity="0.30"/>
      <rect x="548" y="150" width="48" height="40" fill="currentColor" opacity="0.30"/>
    </g>
    <!-- grid lines -->
    <g stroke="currentColor" stroke-width="0.7" opacity="0.35">
      <line x1="452" y1="70" x2="452" y2="230"/><line x1="500" y1="70" x2="500" y2="230"/><line x1="548" y1="70" x2="548" y2="230"/>
      <line x1="404" y1="110" x2="596" y2="110"/><line x1="404" y1="150" x2="596" y2="150"/><line x1="404" y1="190" x2="596" y2="190"/>
    </g>
    <text x="500" y="248" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.75">shaded = pixels flagged converted</text>
    <!-- arrow to summary -->
    <line x1="608" y1="150" x2="648" y2="150" stroke="currentColor" stroke-width="1.5" marker-end="url(#cd-arrow)"/>
    <!-- PANEL 3: validated summary (amber) -->
    <text x="820" y="30" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Validated change output</text>
    <rect x="664" y="86" width="312" height="128" rx="9" fill="#f3a712" opacity="0.07"/>
    <rect x="664" y="86" width="312" height="128" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <text x="820" y="112" text-anchor="middle" font-size="10.5" font-weight="700" fill="#f3a712">Activity data &#183; carbon ledger</text>
    <g font-size="9.5" fill="currentColor">
      <text x="684" y="138">Converted area: 41.6 ha</text>
      <text x="684" y="158">90% CI: 38.2 &#8211; 45.1 ha</text>
      <text x="684" y="178">Event date: 2025-08 (&#177;1 mo)</text>
      <text x="684" y="198">Method &#183; obs count &#183; lineage hash</text>
    </g>
  </g>
</svg>

## Role in the MRV Workflow

Change detection sits at the hinge between remote-sensing engineering and carbon accounting. Everything upstream of it — orthorectification, cloud masking, index computation, temporal compositing — exists to hand this stage a clean, gap-characterized signal per pixel. Everything downstream — area estimation, emission-factor application, uncertainty deduction, credit issuance — treats its output as fact. That asymmetry is the whole design constraint: a false positive here does not merely add noise, it manufactures an emission or a removal that a project may claim or a regulator may penalize. The stage therefore has to produce not just a binary change mask but a dated, magnitude-quantified, method-attributed event record that a third party can audit without re-running the model.

The choice of algorithm is governed by three axes. The first is latency: does the project need a break flagged within days of acquisition (near-real-time alerting) or is it enough to segment a full historical archive once a year (retrospective activity-data generation)? The second is stability: how aggressively does the method suppress seasonal and illumination variation before it will call a change? The third is the analytical unit: does the method operate per-pixel, or does it aggregate to objects or strata that better match how land actually converts? Bi-temporal differencing optimizes latency at the cost of stability; CCDC optimizes stability and dating precision at the cost of latency and a demanding clear-observation budget. Most production MRV systems run two tracks — a fast alerting method for responsiveness and a stable time-series method for the figures that enter the ledger — and reconcile them at the compliance gate.

The table below compares the four algorithm families a carbon MRV team will realistically evaluate. Latency is expressed relative to acquisition; data needs describe the minimum observation history the method assumes; failure modes are the ones that surface in production rather than in a paper's validation set.


| Method | Latency | Data needs | Core strengths | Failure modes |
|--------|---------|-----------|----------------|---------------|
| Image differencing / index threshold | Immediate (bi-temporal) | Two clear scenes | Trivial to implement; interpretable; low compute | Fires on phenology, illumination, BRDF and residual cloud; threshold not transferable across biomes |
| BFAST / breakpoint detection | Days to weeks | ~1&#8211;2 years history to fit season + trend | Separates trend, season and remainder; strong single-break detection; monitoring variant for NRT | Sensitive to history length; unstable with sparse clear obs; struggles with rapid successive changes |
| LandTrendr temporal segmentation | Retrospective (annual) | Dense annual archive (Landsat-era depth) | Excellent for slow, monotonic change; denoises inter-annual variation; captures magnitude and duration | Annual granularity misses sub-year events; vertex fitting can smooth abrupt disturbance |
| CCDC continuous monitoring | Near-real-time per pixel | Dense multi-year, multi-band time series | Continuous model per pixel; precise dating; classifies change type; handles regrowth | Highest compute and clear-obs demand; model instability where observations are thin |


Read across the rows, the pattern is consistent: capability costs observations. Differencing needs almost nothing and delivers almost no robustness; CCDC needs a dense, multi-band history and delivers dated, typed, per-pixel events. The engineering implication is that the algorithm cannot be chosen independently of the input pipeline. If a region's clear-observation density — the very quantity enforced by the observation-density thresholds in the temporal-aggregation stage — cannot support a stable per-pixel fit, then selecting CCDC guarantees the third failure mode below rather than better science. Suitability for activity-data generation is ultimately a question of whether the input archive can pay the algorithm's cost.

## Core Failure Modes

Three failure modes account for the overwhelming majority of rejected change products in spatial carbon MRV. Each has a distinct root cause and a quantifiable impact on the reported figure.

1. **Seasonal phenology mistaken for change.** The root cause is a model that lacks — or under-parameterizes — a seasonal term, so the natural intra-annual swing of a deciduous canopy, a cropping cycle, or a wet-dry savanna is read as a structural transition. A bi-temporal difference between a leaf-on and a leaf-off scene can show an index drop indistinguishable from a real clearing, and even a harmonic model with too few terms will leave phenological residual that a naive threshold trips on. The impact is large and systematically biased: in seasonally deciduous landscapes, phenology-driven false positives routinely inflate detected change area by 30&#8211;70% relative to a ground-referenced audit, and because the errors concentrate in specific land-cover classes they do not average out — they distort the class-specific activity data that emission factors are applied to, propagating directly into over- or under-crediting.

2. **Sensor and BRDF differences creating spurious breaks.** The root cause is comparing observations that differ in acquisition geometry, sensor, or atmospheric correction without normalizing them: a Sentinel-2 and a Landsat measurement of the same pixel, or two Sentinel-2 observations at different view and solar angles, carry a bidirectional reflectance (BRDF) offset that a time-series model interprets as a step. Cross-sensor harmonization gaps and un-corrected view-angle effects introduce breaks that are pure instrument artifact. The impact is a spatially structured error: because BRDF and sensor offsets vary with terrain and orbit, the spurious breaks concentrate along swath edges and on slopes, and in mixed-sensor archives they can constitute 15&#8211;40% of all flagged breakpoints — a contamination rate high enough that a verifier sampling flagged pixels will find the artifact and reject the entire product's credibility, not just the affected pixels.

3. **Insufficient clear observations destabilizing time-series fits.** The root cause is fitting a harmonic-plus-trend or CCDC model to a pixel whose clear-observation count is too low to constrain the parameters, so the model overfits the few points it has and reports breaks driven by noise rather than signal. Persistent cloud, seasonal haze, or a short archive starves the fit. The impact is both a precision collapse and a silent bias: in pixels below roughly 12&#8211;16 clear observations per fitting window, false-break rates rise sharply and detected-change dates scatter by months, while the pixels most affected — persistently cloudy tropical forest, exactly the highest-carbon biomes — are the ones where accuracy matters most. Unlike the first two modes, this one is invisible without an explicit observation-count gate, because the model returns a confident-looking result regardless of how little it had to work with.

<svg viewBox="0 -4 900 232" role="img" aria-labelledby="cd-t cd-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cd-t">Change signatures and the algorithm family each one needs</title>
  <desc id="cd-d">Four change signatures drawn as index-over-time sketches. An abrupt single-date drop that persists, typical of clearing or fire, is detected by bi-temporal differencing or a sequential test. A gradual multi-year decline, typical of degradation or drought, requires a trend-fitting method such as a segmented trajectory. A seasonal amplitude change with no level shift, typical of a cropping change, requires a harmonic model that separates phase from level. A recovery after disturbance requires a segmentation method that can fit multiple segments rather than a single break. A panel notes that a pipeline using one algorithm sees only the change it was built for, and that the others do not appear as weak detections — they do not appear at all.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Four change shapes; one algorithm sees one of them</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">The others do not appear weakly — they do not appear.</text>
  </g>
  <g>
    <rect x="12" y="52" width="212" height="106" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="12" y="52" width="212" height="106" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <polyline points="28,88 62,84 96,90 118,86 118,138 152,140 186,136 208,139" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <rect x="236" y="52" width="212" height="106" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="236" y="52" width="212" height="106" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <polyline points="252,84 286,90 320,98 354,110 388,122 422,132 432,138" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <rect x="460" y="52" width="212" height="106" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="460" y="52" width="212" height="106" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <polyline points="476,110 494,86 512,110 530,86 548,110 566,96 584,116 602,96 620,116 638,100 656,112" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <rect x="684" y="52" width="204" height="106" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="684" y="52" width="204" height="106" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <polyline points="700,86 730,84 748,84 748,140 776,132 806,118 836,104 872,94" fill="none" stroke="currentColor" stroke-width="2.4"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="118" y="180" fill="currentColor" font-size="10" font-weight="700">Abrupt, persistent</text>
    <text x="118" y="198" fill="currentColor" font-size="9" opacity="0.8">clearing · fire</text>
    <text x="118" y="216" fill="currentColor" font-size="9" opacity="0.85">bi-temporal or sequential test</text>
    <text x="342" y="180" fill="currentColor" font-size="10" font-weight="700">Gradual decline</text>
    <text x="342" y="198" fill="currentColor" font-size="9" opacity="0.8">degradation · drought</text>
    <text x="342" y="216" fill="currentColor" font-size="9" opacity="0.85">segmented trajectory fit</text>
    <text x="566" y="180" fill="currentColor" font-size="10" font-weight="700">Amplitude change only</text>
    <text x="566" y="198" fill="currentColor" font-size="9" opacity="0.8">cropping change</text>
    <text x="566" y="216" fill="currentColor" font-size="9" opacity="0.85">harmonic model, phase vs level</text>
    <text x="786" y="180" fill="currentColor" font-size="10" font-weight="700">Disturb then recover</text>
    <text x="786" y="198" fill="currentColor" font-size="9" opacity="0.8">salvage · regrowth</text>
    <text x="786" y="216" fill="#f3a712" font-size="9" font-weight="700">multi-segment, not one break</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The reference implementation below detects change per pixel over an `xarray` time series of a spectral index (NDVI or NBR). It fits a robust harmonic-plus-trend model to a stable history window, then tests the standardized residuals of the monitoring period against a control limit to flag a breakpoint — the deterministic core shared, in richer form, by BFAST and CCDC. The function refuses untagged geometry, honours nodata, enforces a minimum clear-observation gate before any fit, and emits structured telemetry so every decision is reconstructable. It does not attempt a full continuous model; the dedicated per-pixel continuous implementation is the subject of the child guide linked in the conclusion.

```python
from __future__ import annotations

import numpy as np
import xarray as xr
import structlog

log = structlog.get_logger()

# --- deterministic gates: breaches flag or refuse rather than guessing ---
MIN_CLEAR_OBS = 16          # per-pixel clear observations required to fit (failure mode 3)
HARMONIC_TERMS = 2          # seasonal terms; too few leaves phenological residual (failure mode 1)
CONTROL_LIMIT = 4.0         # residual sigma threshold for a confirmed break
CONSECUTIVE = 3             # consecutive exceedances required to confirm (suppresses noise)
DEFAULT_NODATA = np.nan


def _design_matrix(t_years: np.ndarray, terms: int) -> np.ndarray:
    """Trend + `terms` seasonal harmonics on time expressed in decimal years."""
    cols = [np.ones_like(t_years), t_years]
    for k in range(1, terms + 1):
        w = 2.0 * np.pi * k
        cols.append(np.sin(w * t_years))
        cols.append(np.cos(w * t_years))
    return np.column_stack(cols)


def _robust_fit(X: np.ndarray, y: np.ndarray, n_iter: int = 3) -> np.ndarray:
    """IRLS with a Huber-style weight so single outliers do not drag the fit."""
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    for _ in range(n_iter):
        resid = y - X @ beta
        scale = 1.4826 * np.median(np.abs(resid - np.median(resid))) or 1.0
        u = np.abs(resid) / (1.345 * scale)
        w = np.where(u <= 1.0, 1.0, 1.0 / np.maximum(u, 1e-6))
        Xw, yw = X * w[:, None], y * w
        beta, *_ = np.linalg.lstsq(Xw, yw, rcond=None)
    return beta


def _detect_pixel(t_years: np.ndarray, y: np.ndarray, history_frac: float = 0.6
                  ) -> tuple[int, float, float, int]:
    """Return (break_index, magnitude, residual_sigma, n_clear) for one pixel.

    break_index is -1 when no change is confirmed. The stable history segment
    trains the model; the monitoring segment is scored against it.
    """
    finite = np.isfinite(y)
    n_clear = int(finite.sum())
    if n_clear < MIN_CLEAR_OBS:
        return -1, np.nan, np.nan, n_clear  # gated: do not fit an unconstrained model

    tt, yy = t_years[finite], y[finite]
    split = int(len(yy) * history_frac)
    Xh, yh = _design_matrix(tt[:split], HARMONIC_TERMS), yy[:split]
    beta = _robust_fit(Xh, yh)

    resid_hist = yh - Xh @ beta
    sigma = 1.4826 * np.median(np.abs(resid_hist - np.median(resid_hist))) or 1e-6

    Xm = _design_matrix(tt[split:], HARMONIC_TERMS)
    resid_mon = (yy[split:] - Xm @ beta) / sigma  # standardized monitoring residuals

    run, break_local = 0, -1
    for i, r in enumerate(resid_mon):
        run = run + 1 if abs(r) > CONTROL_LIMIT else 0
        if run >= CONSECUTIVE:
            break_local = i - CONSECUTIVE + 1
            break
    if break_local < 0:
        return -1, np.nan, float(sigma), n_clear

    mag = float(np.mean(resid_mon[break_local:break_local + CONSECUTIVE]) * sigma)
    global_idx = split + break_local
    return int(global_idx), mag, float(sigma), n_clear


def detect_change(index_da: xr.DataArray, *, time_dim: str = "time") -> xr.Dataset:
    """Per-pixel harmonic breakpoint detection over an index time series.

    `index_da` must carry a CRS (rioxarray accessor) and dimensions
    (time, y, x). Emits break date, magnitude, residual sigma and the clear
    observation count so downstream area estimation can weight or exclude
    thinly observed pixels.
    """
    crs = index_da.rio.crs if hasattr(index_da, "rio") else None
    if crs is None:
        raise ValueError("input index has no CRS; refusing to detect change on ungeoreferenced data")

    nodata = index_da.rio.nodata if hasattr(index_da, "rio") else None
    da = index_da.where(index_da != nodata) if nodata is not None else index_da

    times = da[time_dim].values.astype("datetime64[D]").astype("datetime64[s]")
    t_years = (times - times[0]) / np.timedelta64(365, "D").astype("timedelta64[s]")
    t_years = t_years.astype("float64")

    ny, nx = da.sizes["y"], da.sizes["x"]
    break_idx = np.full((ny, nx), -1, dtype="int32")
    magnitude = np.full((ny, nx), np.nan, dtype="float32")
    n_clear = np.zeros((ny, nx), dtype="int32")

    values = da.transpose(time_dim, "y", "x").values
    for j in range(ny):
        for i in range(nx):
            bi, mag, _, nc = _detect_pixel(t_years, values[:, j, i])
            break_idx[j, i], magnitude[j, i], n_clear[j, i] = bi, mag, nc

    changed = int((break_idx >= 0).sum())
    gated = int((n_clear < MIN_CLEAR_OBS).sum())
    log.info(
        "change_detection.complete",
        crs=str(crs), pixels=ny * nx, changed=changed,
        gated_insufficient_obs=gated, min_clear_obs=MIN_CLEAR_OBS,
        harmonic_terms=HARMONIC_TERMS, control_limit=CONTROL_LIMIT,
    )
    if gated / max(ny * nx, 1) > 0.25:
        log.warning("change_detection.sparse_history",
                    gated_fraction=round(gated / (ny * nx), 3),
                    note="area estimate will exclude gated pixels; densify archive")

    coords = {"y": da["y"], "x": da["x"]}
    break_date = np.where(break_idx >= 0,
                          times[np.clip(break_idx, 0, len(times) - 1)].astype("int64"),
                          -1)
    out = xr.Dataset(
        {
            "break_index": (("y", "x"), break_idx),
            "break_date_s": (("y", "x"), break_date.astype("int64")),
            "magnitude": (("y", "x"), magnitude),
            "n_clear_obs": (("y", "x"), n_clear),
        },
        coords=coords,
    )
    out = out.rio.write_crs(crs)
    out.attrs.update({
        "method": "robust_harmonic_residual_breakpoint",
        "harmonic_terms": HARMONIC_TERMS,
        "min_clear_obs": MIN_CLEAR_OBS,
        "control_limit_sigma": CONTROL_LIMIT,
    })
    return out
```

The design encodes the three failure modes as controls rather than as commentary. The seasonal harmonic term directly counters phenology-driven false positives; raising `HARMONIC_TERMS` for strongly bimodal cropping systems is the correct response when validation shows residual seasonal structure. The consecutive-exceedance requirement suppresses the isolated spikes that BRDF and residual cloud produce, though it does not substitute for cross-sensor normalization upstream — that correction belongs in the compositing stage, and this function assumes it has already happened. The `MIN_CLEAR_OBS` gate is the non-negotiable one: a pixel below the floor returns `break_index = -1` and a recorded `n_clear_obs`, so it is explicitly excluded from area estimation rather than silently contributing a noise-driven break. The double `for` loop is written for clarity; in production the pixel kernel is vectorized or dispatched through `xarray.apply_ufunc` with Dask so a continental tile stays within memory. What must not change is the contract that every pixel carries its observation count and method attribution forward.

## Validation, Debugging & Compliance Mapping

A change product becomes a submission artifact only when its outputs map to named regulatory controls, so a verifier can recompute the claim from the raster rather than trust a narrative. The magnitude and break-date rasters feed the activity-data term of the emission calculation, and their credibility rests on a validation regime that is itself auditable.

Validation follows the good-practice guidance codified in the IPCC approach to land-representation and the accuracy-assessment literature: draw a probability sample of the change and no-change strata, collect reference labels independent of the algorithm, and report area with a confidence interval derived from the sample rather than from a pixel count. Pixel-counted area is biased whenever map accuracy is imperfect, and the bias is exactly what an auditor will test; the sample-based estimator with its variance is the defensible figure, which is why the implementation carries `n_clear_obs` and `magnitude` forward — they stratify the sample and weight the estimate. For debugging, treat the gated-pixel fraction, the changed-pixel fraction, and the distribution of break magnitudes as monitored signals on every run, including the passing ones, so a drifting cross-sensor offset or a thinning archive shows up as a trend long before it breaches a single-run tolerance.

The compliance mapping is concrete. Under **ISO 14064-3**, the change product must be reproducible and its uncertainty quantified; the method attribution, control-limit parameters, and sample-based area confidence interval together satisfy the verifier's reproducibility and conservativeness tests, and the recorded observation count documents the fitness of the underlying data. Under the **Verra VM-series** — VM0047 for afforestation, reforestation and revegetation, VM0048 and the REDD framework for avoided conversion — detected change is the activity data to which stratified emission factors are applied, and the methodologies require explicit uncertainty deductions when detection or area accuracy falls below threshold; exporting the confidence interval and the gated fraction lets the platform apply those deductions per stratum. Under **CSRD ESRS E1**, land-use-change disclosures must be traceable and their estimation uncertainty transparent, which the dated, method-attributed, uncertainty-bounded event record delivers directly. Each of these controls is a downstream consumer of a field the function already emits, which is what keeps the change map inside the audit boundary rather than adjacent to it.

<svg viewBox="0 -4 880 224" role="img" aria-labelledby="acc-t acc-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="acc-t">Why an accuracy assessment must be area-weighted for a rare class</title>
  <desc id="acc-d">A comparison for a landscape where change affects 2 percent of pixels. A simple-random accuracy assessment reports 97.6 percent overall accuracy, which is achievable by predicting no change everywhere and says almost nothing about the class of interest. A stratified estimator with area weights reports the change class user's accuracy at 71 percent and producer's accuracy at 64 percent, with an area estimate and a confidence interval. A panel notes that overall accuracy is dominated by the majority class, that registries and methodologies require the stratified area estimate, and that reporting overall accuracy for a rare class is at best uninformative.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Overall accuracy is the wrong number for a 2% class</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Same map, two assessment designs.</text>
    <rect x="12" y="52" width="424" height="140" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Simple random sample</text>
    <text x="28" y="108" fill="currentColor" font-size="20" font-weight="700">97.6%</text>
    <text x="28" y="130" fill="currentColor" font-size="9.5" opacity="0.85">overall accuracy</text>
    <text x="28" y="158" fill="#f3a712" font-size="9.5" font-weight="700">achievable by predicting “no change” everywhere</text>
    <text x="28" y="178" fill="currentColor" font-size="9.5" opacity="0.85">says nothing about the class you care about</text>
    <rect x="456" y="52" width="412" height="140" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="456" y="52" width="412" height="140" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="472" y="76" fill="currentColor" font-size="10.5" font-weight="700">Stratified, area-weighted</text>
    <text x="472" y="104" fill="currentColor" font-size="13" font-weight="700">user's 71% · producer's 64%</text>
    <text x="472" y="130" fill="currentColor" font-size="13" font-weight="700">area 41 200 ± 6 900 ha</text>
    <text x="472" y="158" fill="currentColor" font-size="9.5" opacity="0.85">an estimate with an interval, per class</text>
    <text x="472" y="178" fill="currentColor" font-size="9.5" font-weight="700">what methodologies actually require</text>
  </g>
</svg>

## Frequently Asked Questions

### How do I choose a change-detection algorithm?

By the shape of the change you need to detect and the density of observations you have. Abrupt, persistent clearing is detectable with a sequential test on a modest series; gradual degradation needs a trajectory fit and several years of data; a cropping change with no level shift needs a harmonic model. Running one algorithm and calling the result "change" means the other shapes are absent from your output entirely, which is a coverage gap rather than a sensitivity setting.

### What accuracy metric should be reported?

A stratified, area-weighted estimate per class with a confidence interval, not overall accuracy. When change affects a few per cent of the landscape, overall accuracy is dominated by the unchanged majority and is achievable by predicting nothing at all. Report user's and producer's accuracy for the change class and an area estimate with its interval; that is what methodologies require and what a verifier can actually use.

### How many observations does a per-pixel time-series method need?

Enough to fit its model plus enough to detect a break against it — in practice at least two dozen clear observations per year for a harmonic fit with two harmonics, and more where seasonality is strong. Below that the fit becomes unstable and the method reports breaks that are artefacts of an under-constrained model. Compute the clear-observation count per pixel and record where the method could not run, rather than letting it produce confident output on insufficient data.

### Should change detection run on indices or on reflectance?

Indices for interpretability and robustness, reflectance where the method genuinely needs the spectral detail. Indices like NBR and NDVI compress the signal into something with a physical reading and are less sensitive to residual atmospheric effects; multi-band methods can detect changes that no single index captures, at the cost of more parameters and more sensitivity to calibration differences. Many production pipelines run an index-based detector and use a multi-band check only on candidates.

### How do I stop a sensor change from being reported as land-cover change?

Harmonise before detecting, and segment the model at known breaks. A new sensor, a new processing baseline, or a change in atmospheric correction shifts the index distribution across the whole scene on one date — which is also the signature that identifies it, since real change never affects every pixel simultaneously. Keep a list of known break dates as configuration, refit segments across them, and assert that no detection date coincides with one.

## Conclusion

Change detection is where remote sensing becomes carbon accounting, and the algorithm you choose is really a choice about how much observation density your archive can afford and how much false-positive risk your ledger can tolerate. Bi-temporal differencing buys latency and pays in stability; BFAST and LandTrendr buy robustness over a history window; CCDC buys per-pixel continuous monitoring at the cost of a demanding clear-observation budget. Across all of them the discipline is identical: model the expected trajectory, flag departures with a defensible control limit, gate against thin observation counts, and carry method attribution and uncertainty forward so a verifier can recompute the claim. The reference implementation here delivers that discipline in a portable harmonic-residual form; to build the full continuous per-pixel model with change classification and regrowth handling, continue with [Implementing CCDC Change Detection in Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/implementing-ccdc-change-detection-in-python/).

## Related guides

- [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) — the parent stack this change-detection stage sits inside.
- [Implementing CCDC Change Detection in Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/implementing-ccdc-change-detection-in-python/) — the continuous per-pixel implementation of the method surveyed here.
- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — the near-real-time consumer of the change events this stage emits.
- [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — the upstream compositing that supplies the clear-sky observation density these fits depend on.
- [Threshold Tuning for Carbon Stock Baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) — where detected change is reconciled against the baseline thresholds that govern additionality.
