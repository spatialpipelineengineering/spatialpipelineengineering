---
shortTitle: "Modeling Soil Organic Carbon with Digital Soil Mapping"
title: "Modeling Soil Organic Carbon with Digital Soil Mapping"
description: "Build a defensible digital soil mapping pipeline for MRV: covariate stacks that respect the sampling window, quantile regression forests for per-pixel intervals, spatially blocked tuning, and prediction-interval calibration."
slug: modeling-soil-organic-carbon-with-digital-soil-mapping
type: guide
breadcrumb: "Digital Soil Mapping"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Modeling Soil Organic Carbon with Digital Soil Mapping

Digital soil mapping turns a few hundred laboratory measurements into a wall-to-wall soil carbon surface using environmental covariates as the interpolating structure. Done carefully it is the only affordable way to map soil carbon over a project area; done carelessly it produces a beautiful raster whose stated accuracy is a fiction. This guide implements the careful version, within [soil organic carbon modeling and validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/soil-organic-carbon-modeling-and-validation/) in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack.

The framing that keeps a pipeline honest is that the model is an interpolator over a covariate space, not a mechanistic account of soil formation. It can only be trusted where the covariate combinations it is asked to predict resemble those it was trained on. Most catastrophic digital soil maps are catastrophic in exactly those regions of covariate space where no core was ever collected — and nothing in a conventional accuracy report reveals this, which is why extrapolation detection is treated here as a first-class output rather than an optional extra.

<svg viewBox="0 -4 940 280" role="img" aria-labelledby="dsm-t dsm-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="dsm-t">Digital soil mapping pipeline with the two outputs that are usually missing</title>
  <desc id="dsm-d">A pipeline from a covariate stack and a core dataset through spatially blocked hyperparameter tuning to a fitted quantile regression forest. The model produces three outputs rather than one: a median prediction surface, a per-pixel prediction interval from the 5th and 95th quantiles, and an extrapolation mask marking pixels whose covariate combination lies outside the convex region the cores covered. A note states that the second and third outputs are usually absent from published maps and are the two a verifier asks for first.</desc>
  <defs>
    <marker id="dsm-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="10" y="34" width="164" height="66" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="10" y="34" width="164" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="92" y="58" fill="currentColor" font-size="10.5" font-weight="700">Covariate stack</text>
    <text x="92" y="76" fill="currentColor" font-size="9" opacity="0.78">terrain · climate · land use</text>
    <text x="92" y="92" fill="currentColor" font-size="9" opacity="0.78">bare-soil composite</text>
    <rect x="10" y="146" width="164" height="66" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="10" y="146" width="164" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="92" y="170" fill="currentColor" font-size="10.5" font-weight="700">Cores</text>
    <text x="92" y="188" fill="currentColor" font-size="9" opacity="0.78">SOC % · one lab method</text>
    <text x="92" y="204" fill="currentColor" font-size="9" opacity="0.78">georeferenced, dated</text>
    <rect x="212" y="90" width="164" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="294" y="114" fill="currentColor" font-size="10.5" font-weight="700">Blocked tuning</text>
    <text x="294" y="132" fill="currentColor" font-size="9" opacity="0.78">GroupKFold over blocks</text>
    <text x="294" y="148" fill="currentColor" font-size="9" opacity="0.78">never a random split</text>
    <rect x="414" y="90" width="164" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="496" y="114" fill="currentColor" font-size="10.5" font-weight="700">Quantile forest</text>
    <text x="496" y="132" fill="currentColor" font-size="9" opacity="0.78">full conditional</text>
    <text x="496" y="148" fill="currentColor" font-size="9" opacity="0.78">distribution per pixel</text>
    <rect x="620" y="18" width="180" height="60" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="620" y="18" width="180" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <text x="710" y="42" fill="currentColor" font-size="10.5" font-weight="700">Median surface</text>
    <text x="710" y="62" fill="currentColor" font-size="9" opacity="0.78">the map everyone ships</text>
    <rect x="620" y="94" width="180" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="710" y="118" fill="currentColor" font-size="10.5" font-weight="700">Prediction interval</text>
    <text x="710" y="138" fill="currentColor" font-size="9" opacity="0.78">q05 / q95 per pixel</text>
    <rect x="620" y="170" width="180" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="710" y="194" fill="currentColor" font-size="10.5" font-weight="700">Extrapolation mask</text>
    <text x="710" y="214" fill="currentColor" font-size="9" opacity="0.78">outside covariate hull</text>
    <rect x="828" y="94" width="104" height="136" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="828" y="94" width="104" height="136" rx="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3"/>
    <text x="880" y="130" fill="#f3a712" font-size="10" font-weight="700">usually</text>
    <text x="880" y="148" fill="#f3a712" font-size="10" font-weight="700">missing</text>
    <text x="880" y="172" fill="currentColor" font-size="8.5" opacity="0.8">the two a</text>
    <text x="880" y="188" fill="currentColor" font-size="8.5" opacity="0.8">verifier asks</text>
    <text x="880" y="204" fill="currentColor" font-size="8.5" opacity="0.8">for first</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#dsm-arrow)">
    <path d="M174 67 C 194 74, 194 110, 210 116"/>
    <path d="M174 179 C 194 172, 194 136, 210 130"/>
    <line x1="376" y1="123" x2="412" y2="123"/>
    <path d="M578 110 C 600 96, 604 60, 618 50"/>
    <line x1="578" y1="123" x2="618" y2="123"/>
    <path d="M578 136 C 600 150, 604 190, 618 198"/>
  </g>
</svg>

## Root Cause Analysis

Three properties of soil data break the assumptions that make ordinary supervised learning trustworthy, and each needs an explicit countermeasure.

**Samples are clustered, so the effective sample size is far below the row count.** Four cores from one field corner are, for covariate purposes, close to one observation. A model trained on 400 such cores may have an effective sample size nearer 80, which changes both the achievable complexity and the honest error estimate. Random cross-validation hides this completely because it splits the cluster; blocked cross-validation exposes it, which is why the blocked score is often shocking on first sight and is nonetheless the true one.

**The covariate stack must be temporally coherent with the sampling.** A bare-soil composite built from acquisitions spanning three years, joined to cores collected in one autumn, embeds a mismatch between what the covariate describes and what the laboratory measured. Terrain is static and safe; climate normals are safe; anything derived from imagery must be windowed to the sampling campaign, and the window must be recorded. A model that appears to improve when you widen the imagery window is usually improving by fitting noise that happens to correlate with sampling location.

**Extrapolation is invisible in the accuracy report.** A random forest asked to predict at a covariate combination far outside its training data returns a confident value — the mean of whichever leaves it lands in — with no signal that it is guessing. Since project areas frequently include terrain, land-use, or climate combinations that no core sampled, a meaningful fraction of the map may be extrapolated. The dissimilarity index below makes that fraction explicit, and the honest treatment is to mask it or to widen the interval there rather than to present it as prediction.

## Diagnostic Pipeline / Pre-Flight Validation

The pre-flight checks covariate coherence, computes the block size from the data rather than assuming it, and measures how much of the prediction area is extrapolated.

```python
from dataclasses import dataclass

import numpy as np
import structlog
from scipy.spatial import cKDTree

log = structlog.get_logger()

MAX_EXTRAPOLATION_FRACTION = 0.25   # above this, the map is mostly guesswork


@dataclass(frozen=True)
class StackHealth:
    n_cores: int
    n_covariates: int
    imagery_window_days: int
    sampling_span_days: int
    block_size_m: float
    extrapolated_fraction: float
    usable: bool
    reason: str | None


def empirical_block_size(xy: np.ndarray, residuals: np.ndarray,
                         max_lag_m: float = 20_000.0, bins: int = 20) -> float:
    """Block size from the residual semivariogram range, not a guess.

    Blocks smaller than the autocorrelation range still leak a neighbour's answer
    across the fold boundary, which is the whole failure blocking exists to stop.
    """
    tree = cKDTree(xy)
    pairs = tree.query_pairs(max_lag_m, output_type="ndarray")
    if len(pairs) < 100:
        log.warning("dsm.variogram.sparse", pairs=len(pairs))
        return max_lag_m / 4.0

    d = np.linalg.norm(xy[pairs[:, 0]] - xy[pairs[:, 1]], axis=1)
    gamma = 0.5 * (residuals[pairs[:, 0]] - residuals[pairs[:, 1]]) ** 2

    edges = np.linspace(0, max_lag_m, bins + 1)
    idx = np.digitize(d, edges) - 1
    means = np.array([gamma[idx == b].mean() if (idx == b).any() else np.nan
                      for b in range(bins)])
    sill = np.nanmean(means[-5:])
    reached = np.where(means >= 0.95 * sill)[0]
    rng = float(edges[reached[0] + 1]) if reached.size else max_lag_m / 4.0

    log.info("dsm.variogram", range_m=round(rng, 1), sill=round(float(sill), 4),
             pairs=len(pairs))
    return rng


def dissimilarity_index(train: np.ndarray, predict: np.ndarray) -> np.ndarray:
    """Per-pixel distance to the nearest training point in scaled covariate space,
    normalised by the mean nearest-neighbour distance WITHIN the training set.

    Values above 1 mean the pixel is further from any core than cores typically are
    from each other — the model is extrapolating, however confident it sounds.
    """
    mu, sd = train.mean(axis=0), train.std(axis=0) + 1e-9
    train_z, predict_z = (train - mu) / sd, (predict - mu) / sd

    tree = cKDTree(train_z)
    within, _ = tree.query(train_z, k=2)           # k=2: skip the point itself
    scale = float(within[:, 1].mean())

    distance, _ = tree.query(predict_z, k=1)
    return distance / max(scale, 1e-9)


def preflight(cores_xy: np.ndarray, core_values: np.ndarray, train_cov: np.ndarray,
              predict_cov: np.ndarray, imagery_window_days: int,
              sampling_span_days: int) -> StackHealth:
    block = empirical_block_size(cores_xy, core_values - core_values.mean())
    di = dissimilarity_index(train_cov, predict_cov)
    extrapolated = float((di > 1.0).mean())

    reason = None
    if imagery_window_days > sampling_span_days * 3:
        # A wide imagery window describes a different landscape from the one sampled.
        reason = "imagery_window_incoherent_with_sampling"
    elif extrapolated > MAX_EXTRAPOLATION_FRACTION:
        reason = "excessive_extrapolation"

    health = StackHealth(
        n_cores=len(cores_xy), n_covariates=train_cov.shape[1],
        imagery_window_days=imagery_window_days, sampling_span_days=sampling_span_days,
        block_size_m=round(block, 1), extrapolated_fraction=round(extrapolated, 3),
        usable=reason is None, reason=reason,
    )
    log.info("dsm.preflight", **health.__dict__)
    return health
```

<svg viewBox="0 -4 900 292" role="img" aria-labelledby="hull-t hull-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="hull-t">Where a soil model is interpolating and where it is guessing</title>
  <desc id="hull-d">A scatter of training cores in a two-dimensional covariate space defined by slope on the horizontal axis and mean annual rainfall on the vertical axis. The cores occupy a diagonal band. A shaded region marks the area within one nearest-neighbour distance of a core, labelled interpolation. Two clusters of prediction pixels lie outside it: a steep, dry corner and a flat, very wet corner, both labelled extrapolation. A side panel gives the arithmetic: 78 percent of the project area is inside the covered region with a prediction interval of plus or minus 6.4 tonnes of carbon dioxide equivalent per hectare, while 22 percent is outside with an interval of plus or minus 19.1, and notes that the accuracy statistic quoted for the map as a whole applies only to the first group.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The map's stated accuracy applies to part of the map</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Covariate space, two of nine dimensions shown. Cores define where prediction is interpolation.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="70" y1="56" x2="70" y2="250"/>
    <line x1="70" y1="250" x2="560" y2="250"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="315" y="272" text-anchor="middle" font-weight="600">slope (°) →</text>
    <text x="26" y="153" transform="rotate(-90 26 153)" text-anchor="middle" font-weight="600">rainfall (mm yr⁻¹) →</text>
  </g>
  <path d="M96 232 C 150 214, 210 190, 268 158 C 322 128, 400 100, 468 80 L 500 108 C 430 130, 356 158, 300 188 C 244 218, 178 244, 124 254 Z" fill="currentColor" opacity="0.11"/>
  <path d="M96 232 C 150 214, 210 190, 268 158 C 322 128, 400 100, 468 80 L 500 108 C 430 130, 356 158, 300 188 C 244 218, 178 244, 124 254 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="6,3"/>
  <g fill="currentColor">
    <circle cx="118" cy="234" r="3.6"/><circle cx="146" cy="222" r="3.6"/><circle cx="172" cy="212" r="3.6"/>
    <circle cx="198" cy="200" r="3.6"/><circle cx="226" cy="188" r="3.6"/><circle cx="252" cy="176" r="3.6"/>
    <circle cx="280" cy="160" r="3.6"/><circle cx="306" cy="148" r="3.6"/><circle cx="334" cy="136" r="3.6"/>
    <circle cx="360" cy="126" r="3.6"/><circle cx="388" cy="114" r="3.6"/><circle cx="414" cy="104" r="3.6"/>
    <circle cx="442" cy="94" r="3.6"/><circle cx="160" cy="240" r="3.6"/><circle cx="240" cy="204" r="3.6"/>
    <circle cx="320" cy="166" r="3.6"/><circle cx="400" cy="128" r="3.6"/><circle cx="466" cy="90" r="3.6"/>
  </g>
  <g fill="none" stroke="#f3a712" stroke-width="1.8">
    <circle cx="476" cy="212" r="4"/><circle cx="500" cy="222" r="4"/><circle cx="516" cy="200" r="4"/>
    <circle cx="492" cy="196" r="4"/><circle cx="524" cy="226" r="4"/>
    <circle cx="122" cy="88" r="4"/><circle cx="146" cy="76" r="4"/><circle cx="106" cy="106" r="4"/>
    <circle cx="160" cy="98" r="4"/><circle cx="132" cy="68" r="4"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="250" y="112" fill="currentColor" font-weight="700">interpolation</text>
    <text x="250" y="126" fill="currentColor" opacity="0.75" font-size="8.5">within one core-spacing</text>
    <text x="478" y="252" fill="#f3a712" font-weight="700">steep &amp; dry</text>
    <text x="100" y="130" fill="#f3a712" font-weight="700">flat &amp; very wet</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="596" y="66" width="292" height="164" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="596" y="66" width="292" height="164" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="614" y="92" fill="currentColor" font-size="10.5" font-weight="700">Project area, split honestly</text>
    <text x="614" y="120" fill="currentColor" font-size="10">inside covered region</text>
    <text x="870" y="120" fill="currentColor" font-size="12" font-weight="700" text-anchor="end">78%</text>
    <text x="614" y="138" fill="currentColor" font-size="9.5" opacity="0.78">prediction interval ±6.4 tCO₂e ha⁻¹</text>
    <text x="614" y="168" fill="currentColor" font-size="10">outside covered region</text>
    <text x="870" y="168" fill="#f3a712" font-size="12" font-weight="700" text-anchor="end">22%</text>
    <text x="614" y="186" fill="currentColor" font-size="9.5" opacity="0.78">prediction interval ±19.1 tCO₂e ha⁻¹</text>
    <text x="614" y="214" fill="currentColor" font-size="9.5" font-weight="700">The headline accuracy describes the first row only.</text>
  </g>
</svg>

## Deterministic Transformation Logic

A quantile regression forest is the workhorse here because it returns the full conditional distribution rather than a point estimate, which gives per-pixel prediction intervals at no extra fitting cost. The implementation tunes with blocked folds, calibrates the interval against held-out data, and emits three surfaces.

```python
import numpy as np
import structlog
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GroupKFold, GridSearchCV

log = structlog.get_logger()


class QuantileForest(RandomForestRegressor):
    """Random forest that retains leaf memberships so arbitrary quantiles of the
    conditional distribution can be read off after fitting."""

    def fit(self, X, y, **kwargs):
        super().fit(X, y, **kwargs)
        self._y = np.asarray(y)
        self._leaf_index = [
            {leaf: np.where(tree.apply(X) == leaf)[0] for leaf in np.unique(tree.apply(X))}
            for tree in self.estimators_
        ]
        return self

    def predict_quantiles(self, X, quantiles=(0.05, 0.5, 0.95)) -> np.ndarray:
        out = np.empty((X.shape[0], len(quantiles)), dtype="float64")
        for i in range(X.shape[0]):
            pooled = []
            for tree, index in zip(self.estimators_, self._leaf_index):
                leaf = tree.apply(X[i:i + 1])[0]
                pooled.append(self._y[index[leaf]])
            pooled = np.concatenate(pooled)
            out[i] = np.quantile(pooled, quantiles)
        return out


def tune_blocked(X: np.ndarray, y: np.ndarray, groups: np.ndarray) -> dict:
    """Tune with GroupKFold over spatial blocks.

    Tuning with random folds selects the hyperparameters that memorise location
    best — usually deep trees with tiny leaves — and those are exactly the wrong
    ones for prediction at unsampled sites.
    """
    grid = {"n_estimators": [500], "min_samples_leaf": [2, 4, 8, 16],
            "max_features": ["sqrt", 0.3, 0.5]}
    search = GridSearchCV(
        RandomForestRegressor(random_state=0), grid,
        cv=GroupKFold(n_splits=min(5, len(set(groups)))), scoring="neg_root_mean_squared_error",
        n_jobs=-1,
    )
    search.fit(X, y, groups=groups)
    log.info("dsm.tuning", best=search.best_params_,
             blocked_rmse=round(-float(search.best_score_), 3))
    return search.best_params_


def calibrate_interval(model: QuantileForest, X_hold: np.ndarray, y_hold: np.ndarray,
                       target: float = 0.90) -> float:
    """Empirical coverage of the nominal interval, and the factor that fixes it.

    A quantile forest's nominal 90% interval routinely covers 70-80% on held-out
    soil data. Reporting the nominal figure without checking is the quiet way an
    uncertainty statement becomes untrue.
    """
    q = model.predict_quantiles(X_hold, quantiles=(0.05, 0.5, 0.95))
    covered = float(((y_hold >= q[:, 0]) & (y_hold <= q[:, 2])).mean())

    # Widen (or narrow) symmetrically about the median until coverage matches.
    factor = 1.0
    for _ in range(40):
        low = q[:, 1] - (q[:, 1] - q[:, 0]) * factor
        high = q[:, 1] + (q[:, 2] - q[:, 1]) * factor
        got = float(((y_hold >= low) & (y_hold <= high)).mean())
        if abs(got - target) < 0.01:
            break
        factor *= 1.05 if got < target else 0.97

    log.info("dsm.interval.calibration", nominal=target, raw_coverage=round(covered, 3),
             widening_factor=round(factor, 3))
    return factor


def fit_and_predict(
    X_train: np.ndarray, y_train: np.ndarray, groups: np.ndarray,
    X_hold: np.ndarray, y_hold: np.ndarray, X_predict: np.ndarray,
    dissimilarity: np.ndarray,
) -> dict:
    params = tune_blocked(X_train, y_train, groups)
    model = QuantileForest(random_state=0, **params).fit(X_train, y_train)
    factor = calibrate_interval(model, X_hold, y_hold)

    q = model.predict_quantiles(X_predict)
    median = q[:, 1]
    low = median - (median - q[:, 0]) * factor
    high = median + (q[:, 2] - median) * factor

    extrapolated = dissimilarity > 1.0
    # Outside the covered region the interval is not merely wide, it is unverified.
    # Mark it rather than pretending the calibration transfers.
    low[extrapolated] = np.nan
    high[extrapolated] = np.nan

    log.info("dsm.predict", pixels=len(median),
             extrapolated_fraction=round(float(extrapolated.mean()), 3),
             median_mean=round(float(np.nanmean(median)), 3),
             mean_interval_width=round(float(np.nanmean(high - low)), 3))
    return {"median": median, "low": low, "high": high,
            "extrapolated": extrapolated, "widening_factor": factor,
            "hyperparameters": params}
```

The interval calibration step is the one most pipelines omit and the one that most changes the reported figure. A quantile forest's nominal 90% interval commonly achieves 70–80% empirical coverage on soil data, because the forest underestimates variance at sparsely sampled covariate combinations. Measuring coverage on held-out data and widening until it matches turns an interval that sounds rigorous into one that is.

<svg viewBox="0 -4 880 292" role="img" aria-labelledby="cal-t cal-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cal-t">Nominal against achieved coverage for an uncalibrated and a calibrated prediction interval</title>
  <desc id="cal-d">A calibration plot with nominal interval coverage from 0.5 to 0.95 on the horizontal axis and achieved coverage measured on held-out cores on the vertical axis. A diagonal line marks perfect calibration. The uncalibrated quantile forest sits well below the diagonal throughout, achieving 0.38 at a nominal 0.50 and only 0.76 at a nominal 0.95. After widening by a factor of 1.34 the calibrated curve tracks the diagonal within two percentage points across the range. An annotation states that the uncalibrated 90 percent interval delivers 72 percent coverage, so roughly one core in four falls outside an interval described to the reader as containing nine in ten.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">An interval is a claim — measure whether it is true</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Achieved coverage on 84 held-out cores that took no part in fitting or tuning.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="88" y1="82" x2="512" y2="82"/><line x1="88" y1="130" x2="512" y2="130"/>
    <line x1="88" y1="178" x2="512" y2="178"/><line x1="88" y1="226" x2="512" y2="226"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="88" y1="62" x2="88" y2="254"/>
    <line x1="88" y1="254" x2="512" y2="254"/>
  </g>
  <line x1="88" y1="254" x2="512" y2="66" stroke="currentColor" stroke-width="1.6" stroke-dasharray="6,4" opacity="0.7"/>
  <text x="452" y="96" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="currentColor" opacity="0.7">perfect</text>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="80" y="86" text-anchor="end">1.0</text>
    <text x="80" y="134" text-anchor="end">0.8</text>
    <text x="80" y="182" text-anchor="end">0.6</text>
    <text x="80" y="230" text-anchor="end">0.4</text>
    <text x="88" y="272" text-anchor="middle">0.50</text>
    <text x="229" y="272" text-anchor="middle">0.65</text>
    <text x="371" y="272" text-anchor="middle">0.80</text>
    <text x="512" y="272" text-anchor="middle">0.95</text>
    <text x="300" y="288" text-anchor="middle" font-weight="600">nominal coverage</text>
  </g>
  <text x="34" y="158" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="currentColor" opacity="0.72" transform="rotate(-90 34 158)" text-anchor="middle">achieved coverage</text>
  <polyline points="88,235 182,214 276,192 371,168 465,146 512,140" fill="none" stroke="#f3a712" stroke-width="2.6"/>
  <polyline points="88,251 182,207 276,163 371,120 465,80 512,70" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <circle cx="437" cy="150" r="5.5" fill="none" stroke="#f3a712" stroke-width="2.4"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="524" y="144" fill="#f3a712">uncalibrated</text>
    <text x="524" y="74" fill="currentColor">calibrated ×1.34</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="596" y="120" width="276" height="110" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="596" y="120" width="276" height="110" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="614" y="146" fill="currentColor" font-size="10.5" font-weight="700">At the nominal 90% interval</text>
    <text x="614" y="172" fill="#f3a712" font-size="15" font-weight="700">72% achieved</text>
    <text x="614" y="194" fill="currentColor" font-size="9.5" opacity="0.82">roughly one core in four falls outside</text>
    <text x="614" y="210" fill="currentColor" font-size="9.5" opacity="0.82">an interval described as holding nine in ten</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

Four artefacts make the map auditable. The **blocked cross-validation score with its block size and the rationale for that size**, alongside the random-fold score so the optimism gap is visible rather than hidden. The **calibrated coverage** of the reported interval, measured on held-out data. The **extrapolation mask** and the fraction of the project area it covers. And the **covariate manifest**: every layer, its source, its temporal window, and its resolution, versioned so a re-run resolves the same inputs.

Where the extrapolated fraction is material, the honest treatments are, in order of preference: collect additional cores targeting the uncovered covariate space — a small, well-targeted campaign often removes most of the extrapolation; restrict the crediting area to the covered region; or apply a conservativeness deduction sized to the wider interval. What is not defensible is reporting one accuracy figure over a map of which a fifth is extrapolated.

The stock conversion and reporting basis are handled separately, and the equivalent-soil-mass requirement described in the parent topic applies to whatever this model predicts. Route the outputs through the schema contract in the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/), and chain the covariate manifest into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) so a re-run five years later resolves the same imagery.

## Production Integration

1. **Build the covariate stack** on the canonical equal-area grid, windowing every imagery-derived layer to the sampling campaign and recording the window.
2. **Join cores** to covariates with an explicit CRS on both sides, rejecting any core lacking a recorded laboratory method.
3. **Pre-flight**: derive the block size from the residual variogram, compute the dissimilarity index, and fail on incoherent windows or excessive extrapolation.
4. **Tune and fit** with blocked folds, then calibrate the interval against a held-out set that took no part in tuning.
5. **Predict three surfaces** — median, calibrated interval, extrapolation mask — and mask the interval where the model extrapolates.
6. **Emit the manifest** with both cross-validation scores, the block size, coverage, and the extrapolated fraction, and hand off to the design-based validation step.

At scale the quantile prediction dominates runtime because it pools leaf memberships per pixel. Chunk the prediction grid and process chunks in parallel with the same fitted model, and precompute the leaf index once rather than per chunk — the same tile-partitioned pattern used for [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/).

## Frequently Asked Questions

### Which covariates actually matter for soil carbon?

Terrain derivatives — elevation, slope, curvature, and a wetness index — are consistently the strongest, because they control water movement and deposition. Climate normals matter at regional scale but are nearly constant within a single project and can then contribute little. Land-use history is often the single most informative layer where it exists at adequate quality, since management dominates soil carbon at field scale. Bare-soil spectral composites help on exposed soil and contribute nothing under permanent cover. Start with terrain plus land-use history, add the rest, and let the blocked score decide — a covariate that improves the random score but not the blocked score is adding location, not information.

### How many cores do I need for a usable model?

Fewer than most people expect for a rough map, far more than most expect for a defensible one. A hundred well-spread cores can produce a model with genuine skill; the constraint is usually coverage of covariate space rather than raw count. Judge sufficiency by the extrapolated fraction rather than by a number: if 20% of your project sits outside the covered region, twenty well-targeted cores in that region are worth more than two hundred more in the middle of the existing cluster.

### Is kriging or machine learning better here?

They answer slightly different questions and the modern default combines them. Kriging exploits spatial autocorrelation directly and gives principled uncertainty, but it struggles with many covariates. Tree ensembles exploit covariates well and handle non-linearity, but ignore residual spatial structure. Regression kriging — a machine-learning trend plus kriged residuals — usually beats either alone where the residuals still carry spatial structure. Check for that structure explicitly with a residual variogram; if the residuals are spatially uncorrelated, the tree model has already captured what there was.

### Why calibrate the prediction interval instead of trusting the quantiles?

Because the quantiles are computed from the training distribution within leaves, which understates variance where the training data is sparse — exactly where the interval matters most. Empirical coverage on held-out data is the only way to know what your nominal 90% interval actually delivers. Report both the nominal and the achieved coverage, and the widening factor you applied. Verifiers respond well to this because it is visibly a check rather than a claim.

### How should the model handle depth?

Two approaches work and they are not equivalent. The simplest is to model each standard depth increment separately — 0–5, 5–15, 15–30 cm — which is easy to implement and lets each increment have its own covariate relationships, since surface carbon responds to management while deeper carbon responds to texture and drainage. The alternative is to fit a depth function, typically a spline, to each profile and then model the spline coefficients spatially, which enforces a physically sensible continuity with depth and handles cores sampled at inconsistent increments. Depth functions are preferable when your cores come from mixed campaigns with different sampling protocols, which is the common case for projects that inherit legacy data. Whichever you choose, model concentration by increment and convert to stock afterwards, so the equivalent-soil-mass correction remains available.

### What should I do when the model performs poorly no matter what I try?

Accept it and change the claim, rather than searching for a configuration that scores well by accident. A blocked R² near 0.2 usually means one of three things: the covariates genuinely do not carry the signal at this scale, which is common in flat, uniform landscapes where terrain explains nothing; the sample is too small or too clustered to support any model; or the dominant driver is management history you do not have. All three are diagnosable. If terrain and climate are near-constant across the area, look for management data. If the effective sample size is small, target new cores at the covariate gaps rather than adding more of the same. And if the signal simply is not there, a design-based estimate of the area mean — no map at all — is a legitimate and defensible output that many methodologies accept, and it is far better than a map with an invented accuracy.

### Should I predict the whole project area or only the covered region?

Predict everywhere, then mask. The full surface is useful for planning and for identifying where to sample next, while the mask is what governs what may be credited. Shipping only the covered region loses information that helps target the next campaign; shipping the full surface without the mask invites a downstream consumer to credit the extrapolated part. Both layers, clearly labelled, is the arrangement that survives review.

## Related guides

- [Soil Organic Carbon Modeling & Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/soil-organic-carbon-modeling-and-validation/) — the parent topic and the equivalent-soil-mass requirement.
- [Validating Soil Carbon Models Against Core Samples](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/soil-organic-carbon-modeling-and-validation/validating-soil-carbon-models-against-core-samples/) — the design-based validation this model must face.
- [Ground-Truth Alignment for Carbon Models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) — joining field measurements to raster covariates without introducing offsets.
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — carrying these intervals into a reported total.
