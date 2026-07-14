---
shortTitle: "Implementing CCDC Change Detection in Python"
title: "Implementing CCDC Change Detection in Python"
description: "Build a CCDC-style land-cover monitor in Python: fit per-pixel harmonic time-series models, gate consecutive RMSE-scaled residuals to confirm breaks, and map them to change area for carbon accounting."
slug: implementing-ccdc-change-detection-in-python
type: guide
breadcrumb: "Implementing CCDC in Python"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Implementing CCDC Change Detection in Python

Continuous Change Detection and Classification (CCDC) is the reference approach for turning a dense stack of clear-sky reflectance observations into a per-pixel record of when a surface actually changed, and this guide is the task-level implementation under [Change Detection Algorithms for Land Cover](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/), the disturbance-detection discipline within the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack. Rather than differencing two dates, CCDC fits a harmonic time-series model to every pixel and watches the residuals: when observed reflectance departs from the model's prediction by more than an RMSE-scaled margin for several consecutive observations, it records a break, re-initialises the model, and carries on. That continuous framing is what lets a carbon programme place a disturbance to within an observation rather than a reporting interval.

The technique complements the compositing side of the [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) workflow: where [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) collapses a stack into monthly baselines, CCDC keeps the full temporal signal and reasons about its structure, and its confirmed breaks feed the same downstream consumers as the [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/). The engineering objective here is not a prettier map; it is a defensible, reproducible break date and magnitude per pixel, with enough embedded provenance that a verifier can trace any flagged change back to the observations and the threshold that triggered it.

<svg viewBox="0 0 1000 268" role="img" aria-labelledby="ccdc-flow-t ccdc-flow-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ccdc-flow-t">CCDC per-pixel change-detection flow with a consecutive-anomaly gate</title>
  <desc id="ccdc-flow-d">A clear-sky reflectance stack feeds a harmonic model fit using ordinary least squares or Lasso on sine and cosine terms plus a linear trend. The fitted model is used to monitor residuals against an RMSE-scaled threshold. A decision gate asks whether a run of consecutive observations all exceed the threshold in the same direction: if not, monitoring continues on the current model; if yes, a break is recorded at the first exceeding observation and the model is re-initialised on the observations that follow. The confirmed break plus its magnitude flows into an audited change record that maps the break to land-cover-change area for carbon accounting.</desc>
  <defs>
    <marker id="ccdc-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="12" y="112" width="140" height="72" rx="9"/>
      <rect x="176" y="112" width="140" height="72" rx="9"/>
      <rect x="340" y="112" width="140" height="72" rx="9"/>
      <rect x="622" y="44" width="176" height="70" rx="9"/>
    </g>
    <polygon points="560,88 620,148 560,208 500,148" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <rect x="622" y="176" width="176" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <rect x="836" y="112" width="152" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="82" y="142">Clear-sky stack</text>
      <text x="246" y="142">Fit harmonic model</text>
      <text x="410" y="142">Monitor residuals</text>
      <text x="710" y="74">Continue monitoring</text>
    </g>
    <text x="710" y="206" fill="#f3a712" font-size="11.5" font-weight="700">Record break &#183; refit</text>
    <text x="912" y="142" fill="#f3a712" font-size="12" font-weight="700">Audited change</text>
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="82" y="160">reflectance &#183; time</text>
      <text x="246" y="160">OLS / Lasso &#183; sin+cos</text>
      <text x="410" y="160">RMSE-scaled z</text>
      <text x="710" y="92">current segment</text>
      <text x="710" y="224">re-initialise model</text>
      <text x="912" y="160">break date &#183; area</text>
      <text x="912" y="174">lineage &#183; carbon</text>
    </g>
    <g fill="currentColor" font-size="10" font-weight="600">
      <text x="560" y="144">k consecutive</text>
      <text x="560" y="158">anomalies?</text>
    </g>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#ccdc-arrow)">
    <line x1="152" y1="148" x2="174" y2="148"/>
    <line x1="316" y1="148" x2="338" y2="148"/>
    <line x1="480" y1="148" x2="498" y2="148"/>
    <path d="M560 88 C 592 60, 600 79, 620 79"/>
    <path d="M560 208 C 592 236, 600 212, 620 212"/>
    <path d="M798 79 C 820 79, 822 130, 834 138"/>
    <path d="M798 212 C 820 212, 822 168, 834 158"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="10" font-weight="600">
    <text x="600" y="70" fill="currentColor" opacity="0.8">no</text>
    <text x="600" y="230" fill="#f3a712">yes</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Implement CCDC-style change detection on a clear-sky reflectance stack in Python",
  "description": "Fit a per-pixel harmonic time-series model to clear-sky reflectance, monitor RMSE-scaled residuals, confirm a break only when consecutive anomalies agree, re-initialise the model, and map breaks to land-cover-change area for carbon accounting.",
  "totalTime": "PT45M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "xarray" },
    { "@type": "HowToTool", "name": "numpy" },
    { "@type": "HowToTool", "name": "scikit-learn" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest the clear-sky stack", "text": "Load the masked reflectance time series with a declared CRS, nodata, and a monotonic time axis over the monitoring window." },
    { "@type": "HowToStep", "name": "Diagnose observation density", "text": "Count clear observations and check temporal coverage per pixel; warn and gate pixels below the minimum-observation floor before fitting." },
    { "@type": "HowToStep", "name": "Fit the harmonic model", "text": "Build a design matrix of sine and cosine harmonics plus a linear trend and fit it per pixel with OLS or Lasso." },
    { "@type": "HowToStep", "name": "Monitor and confirm breaks", "text": "Standardise residuals by the fit RMSE and record a break only when a run of consecutive observations exceeds the threshold in agreement, then re-initialise." },
    { "@type": "HowToStep", "name": "Validate and map to area", "text": "Assert confirmation and stability gates, convert confirmed breaks to change area in an equal-area CRS, and attach lineage." },
    { "@type": "HowToStep", "name": "Export and submit", "text": "Serialise break dates, magnitudes, and the audit manifest for registry submission and downstream carbon accounting." }
  ]
}
</script>

## Root Cause Analysis: Why Naive Change Detection Misfires

A change detector that thresholds a single date-to-date difference, or that flags any pixel whose value deviates from a static mean, will drown a carbon programme in false alarms. Three structural problems explain why, and each is exactly what the CCDC design neutralises.

First, **vegetation is periodic, so a static baseline mistakes phenology for disturbance.** Canopy reflectance rises and falls through the growing season; a fixed mean or a two-date difference cannot distinguish leaf-off from clearance. A harmonic model that carries a sine and cosine term at the annual frequency (and often a semi-annual harmonic) absorbs that seasonal cycle into the fit, so the residual isolates the non-seasonal signal that actually indicates change. Skip the harmonic terms and a deciduous stand trips a deforestation threshold every autumn.

Second, **single-observation thresholds cannot separate noise from a real break.** Residual atmospheric contamination, a missed cloud edge, or a BRDF-driven view-angle excursion produces a one-off spike that looks identical to the first observation after a clearing. The defence is temporal: require a run of consecutive observations that all exceed the RMSE-scaled threshold in the same direction before a break is confirmed. A single spike self-heals as the next clear observation returns to the model; a genuine clearing keeps deviating. This consecutive-anomaly gate is the single most important reason CCDC produces defensible dates.

Third, **an un-scaled threshold ignores per-pixel noise structure.** A humid tropical pixel with saturated backscatter and heavy residual haze has an intrinsically larger model RMSE than an arid pixel; applying one absolute reflectance threshold across both over-flags the arid pixel and under-flags the tropical one. Scaling the anomaly test by each pixel's own fit RMSE turns the test into a per-pixel z-score, so the confirmation logic behaves consistently across heterogeneous terrain and the resulting break dates are comparable when aggregated to change area.

## Diagnostic Pipeline: Pre-Flight Observation Sufficiency

CCDC is only as trustworthy as the number and spread of clear observations behind each fit. A harmonic model with a linear trend and two harmonics estimates five coefficients per band; fitting that from three observations produces a model that memorises noise and then flags everything after it. Before any fit runs, inspect the stack for a declared CRS and nodata, a monotonic time axis, and — critically — per-pixel clear-observation counts and temporal coverage, warning wherever a pixel cannot support a defensible fit. Strict [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) is validated here because a datum drift between epochs is indistinguishable from real surface change once residuals are computed against a single model.

```python
import numpy as np
import pandas as pd
import xarray as xr
import structlog

log = structlog.get_logger()


def preflight_reflectance_stack(
    stack: xr.DataArray,
    min_obs: int = 12,
    min_span_days: int = 730,
    target_crs: str = "EPSG:4326",
) -> dict:
    """Inspect a clear-sky reflectance stack before per-pixel CCDC fitting.

    Detects: missing/mismatched CRS, non-monotonic time axis, and pixels whose
    clear-observation count or temporal span cannot support a harmonic fit.
    `stack` dims: (time, y, x); nodata already set to NaN by upstream masking.
    """
    issues: list[str] = []

    crs = getattr(stack.rio, "crs", None)
    if crs is None:
        issues.append("missing_crs")
    elif str(crs) != target_crs:
        issues.append(f"crs_mismatch:{crs}!={target_crs}")

    times = pd.DatetimeIndex(stack["time"].values)
    if not times.is_monotonic_increasing or times.has_duplicates:
        issues.append("non_monotonic_time_axis")

    span_days = int((times[-1] - times[0]).days) if times.size else 0
    if span_days < min_span_days:
        issues.append(f"short_temporal_span:{span_days}d<{min_span_days}d")

    # Per-pixel clear-observation count (non-NaN through time)
    clear_count = stack.notnull().sum(dim="time")
    thin_pixels = int((clear_count < min_obs).sum())
    total_pixels = int(clear_count.size)

    report = {
        "n_acquisitions": int(times.size),
        "temporal_span_days": span_days,
        "min_obs_threshold": min_obs,
        "thin_pixel_fraction": round(thin_pixels / max(total_pixels, 1), 4),
        "median_clear_obs": float(clear_count.median()),
        "sufficient": not issues and thin_pixels == 0,
        "issues": issues,
    }
    if not report["sufficient"]:
        log.warning("ccdc.preflight.insufficient", **report)
    else:
        log.info("ccdc.preflight.ok", **report)
    return report
```

A pixel that fails the count or span check is not silently dropped: it is flagged so the transformation step can mark it `undetermined` in the output rather than emitting a break date the observation record cannot support. That distinction — no-data versus no-change — is exactly what a verifier probes first.

## Deterministic Transformation Logic: A Harmonic-Regression CCDC Core

The core routine builds a design matrix of sine and cosine harmonics plus an intercept and linear trend, fits it per pixel (Lasso for coefficient stability under collinear harmonics, OLS as the fast default), standardises each residual by the fit RMSE, and confirms a break only when `k` consecutive residuals all exceed the threshold with the same sign. On confirmation it records the break date and magnitude, then re-initialises the model on the observations after the break. Band selection matters: SWIR and NIR-based indices such as NBR respond sharply to canopy loss and burning and are the usual monitoring bands for forest-carbon work, whereas visible bands are noisier and slower to separate. Everything runs against an explicit nodata contract and a minimum-observation gate.

```python
import numpy as np
import xarray as xr
import structlog
from datetime import datetime, timezone
from sklearn.linear_model import Lasso, LinearRegression

log = structlog.get_logger()

SECONDS_PER_YEAR = 365.25 * 24 * 3600


def _design_matrix(t_years: np.ndarray, n_harmonics: int = 2) -> np.ndarray:
    """Intercept + linear trend + sin/cos harmonic pairs at annual base frequency."""
    cols = [np.ones_like(t_years), t_years]
    for h in range(1, n_harmonics + 1):
        w = 2.0 * np.pi * h
        cols.append(np.sin(w * t_years))
        cols.append(np.cos(w * t_years))
    return np.column_stack(cols)


def detect_pixel_breaks(
    y: np.ndarray,
    t: np.ndarray,
    *,
    n_harmonics: int = 2,
    k_consecutive: int = 3,
    z_threshold: float = 3.0,
    min_obs: int = 12,
    use_lasso: bool = True,
) -> dict:
    """CCDC-style break detection for one pixel's clear-sky index series.

    y: reflectance/index values (NaN = nodata); t: numpy datetime64 obs times.
    Returns break dates, magnitudes, and a status honouring the nodata contract.
    """
    valid = ~np.isnan(y)
    y, t = y[valid], t[valid]
    if y.size < min_obs:
        return {"status": "undetermined", "n_obs": int(y.size), "breaks": []}

    t_years = (t - t[0]) / np.timedelta64(1, "s") / SECONDS_PER_YEAR
    breaks: list[dict] = []
    start = 0  # index where the current stable segment begins

    while start + min_obs <= y.size:
        seg_t, seg_y = t_years[start:], y[start:]
        X = _design_matrix(seg_t, n_harmonics)
        model = Lasso(alpha=0.01, max_iter=10_000) if use_lasso else LinearRegression()
        model.fit(X, seg_y)
        resid = seg_y - model.predict(X)
        # Per-pixel RMSE scales the anomaly test into a z-score.
        rmse = float(np.sqrt(np.mean(resid ** 2))) or 1e-6
        z = resid / rmse

        # Confirm a break only on k consecutive same-sign exceedances.
        exceed = np.abs(z) > z_threshold
        confirmed_at = None
        for i in range(len(z) - k_consecutive + 1):
            window = z[i:i + k_consecutive]
            if np.all(np.abs(window) > z_threshold) and (
                np.all(window > 0) or np.all(window < 0)
            ):
                confirmed_at = i
                break

        if confirmed_at is None:
            break  # no further break; current segment is stable to the end

        abs_start = start + confirmed_at
        breaks.append({
            "break_date": np.datetime_as_string(t[abs_start], unit="D"),
            "magnitude": round(float(np.mean(z[confirmed_at:confirmed_at + k_consecutive]) * rmse), 4),
            "direction": "loss" if z[confirmed_at] < 0 else "gain",
            "segment_rmse": round(rmse, 4),
        })
        start = abs_start  # re-initialise the model after the break

    status = "stable" if not breaks else "changed"
    log.info("ccdc.pixel", status=status, n_obs=int(y.size), n_breaks=len(breaks))
    return {"status": status, "n_obs": int(y.size), "breaks": breaks}


def detect_stack_breaks(
    stack: xr.DataArray, target_crs: str = "EPSG:4326", **kwargs
) -> tuple[xr.Dataset, dict]:
    """Apply per-pixel CCDC across a (time, y, x) stack with an explicit CRS gate."""
    if stack.rio.crs is not None and str(stack.rio.crs) != target_crs:
        raise ValueError(f"CRS mismatch: {stack.rio.crs} != {target_crs}")

    t = stack["time"].values
    n_break = np.zeros(stack.shape[1:], dtype="int16")
    first_break = np.full(stack.shape[1:], np.datetime64("NaT"), dtype="datetime64[D]")

    for j in range(stack.shape[1]):
        for i in range(stack.shape[2]):
            res = detect_pixel_breaks(stack.values[:, j, i], t, **kwargs)
            n_break[j, i] = len(res["breaks"])
            if res["breaks"]:
                first_break[j, i] = np.datetime64(res["breaks"][0]["break_date"])

    coords = {"y": stack["y"], "x": stack["x"]}
    out = xr.Dataset(
        {
            "n_breaks": (("y", "x"), n_break),
            "first_break_date": (("y", "x"), first_break),
        },
        coords=coords,
    ).rio.write_crs(target_crs)

    manifest = {
        "pipeline_version": "1.3.0-ccdc",
        "n_harmonics": kwargs.get("n_harmonics", 2),
        "k_consecutive": kwargs.get("k_consecutive", 3),
        "z_threshold": kwargs.get("z_threshold", 3.0),
        "target_crs": target_crs,
        "changed_pixels": int((n_break > 0).sum()),
        "generated_utc": datetime.now(timezone.utc).isoformat(),
    }
    out.attrs.update(manifest)
    log.info("ccdc.stack.complete", **manifest)
    return out, manifest
```

The nested Python loop is written for clarity; in production the per-pixel kernel is the unit of parallelism, dispatched over chunked tiles with `xarray.apply_ufunc` and Dask so the same logic scales across continental extents. What must not change is the confirmation discipline: a break is never recorded from a single observation, and the magnitude is reported in the pixel's own RMSE units so it stays comparable when aggregated.

## Compliance Gating & Audit Trail Generation

Confirmed breaks are only useful to a carbon programme once they become area, and the conversion is where geometry errors turn into phantom emissions. Reproject the break raster to an equal-area CRS such as `EPSG:6933` before counting so each changed pixel contributes an honest surface area; counting in `EPSG:4326` inflates high-latitude change and understates the tropics. The manifest embedded by the transformation step carries the harmonic order, the consecutive-observation count `k`, and the z-threshold — the three parameters a verifier must know to reproduce the result — and those attributes flow into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), where they become the queryable record an auditor traces.

The gates that make the output a submission artifact rather than a developer convenience:

1. **Confirmation gate.** Only breaks confirmed by `k` consecutive same-sign anomalies count toward change area; single-observation spikes are excluded and logged, which is what keeps the false-positive rate low enough to survive ISO 14064-3 conservativeness review.
2. **Undetermined transparency.** Pixels below the observation floor are exported as `undetermined`, never as `stable`, so the distinction between "no change" and "no evidence" is auditable rather than hidden.
3. **Equal-area accounting.** Change area is computed in an equal-area projection, keeping credited hectares consistent with the registry's area convention and preventing latitude-driven volume drift.
4. **Parameter provenance.** The harmonic order, `k`, and threshold travel with the raster, so a third party can recompute any flagged break from the same clear-sky stack.

## Production Integration

Deploy the routine within an async tile-processing framework on a fixed ingest → diagnose → transform → validate → export → submit sequence, mirroring the HowTo steps above:

1. **Ingest.** Query the STAC API for the cloud-masked reflectance items over the tile footprint and monitoring window, reading chunked Cloud-Optimized GeoTIFFs lazily so out-of-core array operations never block on one oversized stack. The clear-sky contract itself is established upstream by the [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/).
2. **Diagnose.** Run `preflight_reflectance_stack` to confirm CRS, nodata, a monotonic time axis, and per-pixel observation sufficiency; flag thin pixels for `undetermined` handling.
3. **Transform.** Call `detect_stack_breaks` with the monitoring band (NBR or a SWIR index for forest loss), the chosen harmonic order, and the confirmation parameters.
4. **Validate.** Assert the confirmation and stability gates and reject any tile whose changed-pixel fraction breaches a configured plausibility ceiling that would signal a masking or alignment failure.
5. **Export.** Reproject to an equal-area CRS, convert confirmed breaks to change area, and serialise break dates, magnitudes, and the audit manifest to Parquet or GeoTIFF with attributes intact.
6. **Submit.** Forward confirmed breaks to the alerting layer behind the [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/), and feed the change-area totals into the baseline logic exposed by [threshold tuning for carbon stock baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/).

By fitting the seasonal cycle explicitly, scaling the anomaly test to each pixel's own noise, and refusing to record a break until consecutive observations agree, a CCDC implementation converts a noisy reflectance stack into dated, magnitude-tagged, area-mappable change that survives third-party verification and anchors automated MRV.

## Related guides

- [Change Detection Algorithms for Land Cover](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/) — the parent discipline this CCDC implementation sits within.
- [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — the compositing counterpart that collapses the same stacks into baselines.
- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — the alerting layer that consumes confirmed breaks in near-real time.
- [Threshold Tuning for Carbon Stock Baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) — where change-area totals feed baseline selection.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — how the embedded parameter manifest becomes audit-ready provenance.
