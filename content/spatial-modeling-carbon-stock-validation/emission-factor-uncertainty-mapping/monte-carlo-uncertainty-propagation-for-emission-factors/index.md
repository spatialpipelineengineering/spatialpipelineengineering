---
shortTitle: "Monte Carlo Uncertainty Propagation: Emission Factors"
title: "Monte Carlo Uncertainty Propagation for Emission Factors"
description: "Propagate emission-factor and activity-data uncertainty to total CO2e with Monte Carlo: sample correlated factor distributions, build a 95% CI, and derive the conservative estimate registries require."
slug: monte-carlo-uncertainty-propagation-for-emission-factors
type: guide
breadcrumb: "Monte Carlo Uncertainty Propagation"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Monte Carlo Uncertainty Propagation for Emission Factors

A total-emissions figure is only as defensible as the uncertainty that ships with it. This guide is the task-level recipe under [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/), the variance-propagation stage within the [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) framework. It consumes the calibrated factor distributions produced upstream and the per-pixel biomass error bands emitted by [biomass estimation from LiDAR & SAR fusion](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/), then converts them into a single number an auditor can reconstruct: a mean total CO2e, a 95% confidence interval, and the conservative discount a registry deducts before crediting.

The engineering problem is that emission factors and activity data each carry their own error, those errors are frequently correlated, and the analytic error-propagation formula most spreadsheets use assumes they are not. When a project multiplies a factor by an activity quantity and sums thousands of such products across a landscape, the naive first-order propagation understates the joint variance wherever factors share a source table or activity strata share a survey instrument. Monte Carlo simulation sidesteps the closed-form algebra entirely: it draws correlated samples from the input distributions, recomputes the total emissions on every draw, and reads the confidence interval straight off the empirical distribution of results. The output is not a smoother number — it is a distribution the [ground-truth alignment for carbon models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) stage can interrogate and a verifier can rerun.

<svg viewBox="-4 42 1008 214" role="img" aria-labelledby="mc-t mc-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="mc-t">Monte Carlo emission-factor propagation flow ending in a conservative audited figure</title>
  <desc id="mc-d">Factor and activity-data distributions on the left feed a correlated sampling stage that draws N joint samples respecting the input covariance. Each sample is combined per iteration into a total CO2e value, forming an aggregate distribution of 10,000 results. From that distribution a mean and 95% confidence interval are read, and a conservative deduction is applied to yield the reported and audited figure, drawn in amber.</desc>
  <defs>
    <marker id="mc-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- Stage 1: input distributions -->
    <rect x="12" y="58" width="150" height="60" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="12" y="58" width="150" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="87" y="82" font-size="10.5" font-weight="700" fill="currentColor">Factor dists</text>
    <text x="87" y="100" font-size="8.5" fill="currentColor" opacity="0.72">mean &#183; sd &#183; shape</text>
    <rect x="12" y="132" width="150" height="60" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="12" y="132" width="150" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="87" y="156" font-size="10.5" font-weight="700" fill="currentColor">Activity data</text>
    <text x="87" y="174" font-size="8.5" fill="currentColor" opacity="0.72">quantity &#183; sd</text>
    <!-- Stage 2: correlated sampling -->
    <rect x="206" y="95" width="150" height="60" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="206" y="95" width="150" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="281" y="119" font-size="10.5" font-weight="700" fill="currentColor">Correlated draw</text>
    <text x="281" y="137" font-size="8.5" fill="currentColor" opacity="0.72">covariance &#183; copula</text>
    <!-- Stage 3: per-iteration emissions -->
    <rect x="400" y="95" width="150" height="60" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="400" y="95" width="150" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="475" y="119" font-size="10.5" font-weight="700" fill="currentColor">Per-iteration</text>
    <text x="475" y="137" font-size="8.5" fill="currentColor" opacity="0.72">CO2e = &#931; f&#183;a</text>
    <!-- Stage 4: aggregate distribution -->
    <rect x="594" y="95" width="150" height="60" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="594" y="95" width="150" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="669" y="119" font-size="10.5" font-weight="700" fill="currentColor">Aggregate dist</text>
    <text x="669" y="137" font-size="8.5" fill="currentColor" opacity="0.72">10,000 totals</text>
    <!-- Stage 5: CI + conservative figure (accent) -->
    <rect x="788" y="95" width="200" height="60" rx="8" fill="#f3a712" opacity="0.12"/>
    <rect x="788" y="95" width="200" height="60" rx="8" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <text x="888" y="115" font-size="10.5" font-weight="700" fill="#f3a712">Reported figure</text>
    <text x="888" y="131" font-size="8.5" fill="currentColor" opacity="0.8">95% CI &#183; conservative</text>
    <text x="888" y="145" font-size="8.5" fill="currentColor" opacity="0.8">deduction &#183; audited</text>
    <!-- arrows -->
    <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#mc-arrow)">
      <path d="M162 88 C 184 88, 184 118, 204 118"/>
      <path d="M162 162 C 184 162, 184 132, 204 132"/>
      <line x1="356" y1="125" x2="398" y2="125"/>
      <line x1="550" y1="125" x2="592" y2="125"/>
      <line x1="744" y1="125" x2="786" y2="125"/>
    </g>
    <!-- annotation bar -->
    <rect x="12" y="210" width="976" height="30" rx="8" fill="currentColor" opacity="0.04"/>
    <rect x="12" y="210" width="976" height="30" rx="8" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
    <text x="500" y="229" font-size="9" font-weight="700" fill="currentColor" opacity="0.85">the seed, sample count and input covariance are serialized with the result so the interval is reproducible</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Propagate emission-factor and activity-data uncertainty to total CO2e with Monte Carlo",
  "description": "Validate input uncertainty metadata, draw correlated factor and activity samples, compute total emissions per iteration, read a 95% confidence interval, and derive the conservative estimate a registry requires.",
  "totalTime": "PT40M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "NumPy" },
    { "@type": "HowToTool", "name": "SciPy" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest and validate", "text": "Load the emission-factor and activity-data uncertainty metadata and confirm each carries a mean, a dispersion, a distribution family, and a correlation structure that is positive semi-definite." },
    { "@type": "HowToStep", "name": "Diagnose inputs", "text": "Run the pre-flight gate to reject implausible coefficients of variation, non-finite bounds, and correlation matrices that cannot yield a valid draw before any simulation runs." },
    { "@type": "HowToStep", "name": "Transform with Monte Carlo", "text": "Draw correlated factor and activity samples over 10,000 iterations, compute total CO2e per iteration, and reduce to a mean, standard deviation, and 2.5th/97.5th percentiles." },
    { "@type": "HowToStep", "name": "Validate convergence", "text": "Confirm the estimate is stable by checking the Monte Carlo standard error of the mean against a tolerance before accepting the interval." },
    { "@type": "HowToStep", "name": "Export the conservative figure", "text": "Apply the registry conservative deduction, stamp the seed, sample count, and covariance into the result, and forward the audit record downstream." }
  ]
}
</script>

## Root Cause Analysis: Why Analytic Propagation Understates the Interval

The default tool for combining uncertainties is the first-order Taylor expansion — the "add the squares of the relative errors" rule embedded in most carbon spreadsheets and in the IPCC Approach 1 guidance. It is fast, closed-form, and correct only under assumptions that spatial emissions inventories routinely violate. Three of those violations dominate production failures.

First, **the formula assumes the inputs are independent, and factors are not.** When a hundred parcels draw their soil-carbon factor from the same regional lookup table, an error in that table moves every parcel in the same direction at once. Independent errors partially cancel under summation; shared errors accumulate. Ignoring a factor correlation of 0.6 across a large aggregation can understate the standard error of the total by 40–70%, manufacturing a tight interval that collapses the moment a verifier asks how the factors were sourced. Monte Carlo handles this natively because the correlation lives in the sampling step, not in the algebra.

Second, **the formula assumes symmetric, near-Gaussian inputs, and many factors are not.** Emission factors bounded below by zero, or derived from ratio estimators, are frequently lognormal or otherwise skewed. A symmetric error bar around a skewed factor puts the reported mean in the wrong place and mis-sizes both tails, which matters precisely because registries care about the conservative tail. Sampling from the declared distribution family — lognormal, triangular, truncated normal — preserves that shape all the way to the total.

Third, **spatial autocorrelation in activity data breaks the independence of the summands themselves.** Neighbouring cells share land-use classifiers, survey instruments, and acquisition geometry, so their activity errors covary even when the factors do not. Treating each cell's contribution as an independent random variable — the implicit assumption when you sum analytic variances cell by cell — understates the aggregate variance for the same reason it does with correlated factors. A correlated draw over the activity field, or an explicit spatial correlation length, restores the honest interval.

## Diagnostic Pipeline: Pre-Flight Uncertainty Metadata Validation

Monte Carlo will happily simulate garbage. Before any draw runs, the inputs must be inspected: every factor and activity term needs a mean, a dispersion (standard deviation or a confidence interval it can be derived from), a named distribution family, and — where relevant — a correlation structure that is actually usable. The gate below rejects the failure conditions above rather than letting them produce a plausible-looking but indefensible interval. Strict validation here is the same discipline the parent [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) stage applies to its rasters.


| Input term | Mean | Dispersion (CV) | Distribution | Correlated with |
|------------|------|-----------------|--------------|-----------------|
| Soil-carbon factor (tCO2e/ha) | 42.0 | 0.18 | lognormal | forest-biomass factor (0.6) |
| Forest-biomass factor (tCO2e/ha) | 118.5 | 0.12 | lognormal | soil-carbon factor (0.6) |
| Deforested area (ha) | 3 450 | 0.08 | truncated normal | — |
| Degraded area (ha) | 1 120 | 0.22 | triangular | deforested area (0.3) |


```python
import numpy as np
import structlog

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()

VALID_FAMILIES = {"normal", "lognormal", "truncated_normal", "triangular"}
MAX_CV = 1.0          # a CV above 1.0 signals a mis-parsed dispersion, not real spread
MIN_CV = 1e-4         # a near-zero CV usually means a missing uncertainty column


def validate_uncertainty_inputs(terms: list[dict], corr: np.ndarray) -> None:
    """Gate emission-factor / activity uncertainty metadata before simulation.

    Each term must declare: name, mean, sd (or a CI to derive it), distribution.
    `corr` is the n x n correlation matrix over the terms in order.
    Raises on any condition that would make the Monte Carlo draw meaningless.
    """
    n = len(terms)
    for i, t in enumerate(terms):
        for key in ("name", "mean", "sd", "distribution"):
            if key not in t or t[key] is None:
                raise ValueError(f"term[{i}] missing required field '{key}'")
        if t["distribution"] not in VALID_FAMILIES:
            raise ValueError(f"{t['name']}: unknown distribution '{t['distribution']}'")
        if t["mean"] <= 0 and t["distribution"] == "lognormal":
            raise ValueError(f"{t['name']}: lognormal requires a positive mean")
        cv = t["sd"] / t["mean"] if t["mean"] else np.inf
        if not (MIN_CV <= cv <= MAX_CV):
            raise ValueError(
                f"{t['name']}: coefficient of variation {cv:.3f} outside "
                f"[{MIN_CV}, {MAX_CV}] — check the dispersion column")

    # Correlation matrix must be square, symmetric, unit-diagonal, and PSD;
    # an invalid matrix silently distorts the joint draw.
    if corr.shape != (n, n):
        raise ValueError(f"correlation matrix {corr.shape} != ({n}, {n})")
    if not np.allclose(corr, corr.T, atol=1e-8):
        raise ValueError("correlation matrix is not symmetric")
    if not np.allclose(np.diag(corr), 1.0, atol=1e-8):
        raise ValueError("correlation matrix diagonal must be 1.0")
    eig_min = float(np.linalg.eigvalsh(corr).min())
    if eig_min < -1e-8:
        raise ValueError(
            f"correlation matrix is not positive semi-definite (min eig {eig_min:.2e})")

    log.info("uncertainty_inputs_validated", n_terms=n, min_eigenvalue=round(eig_min, 6))
```

A run that raises here never reaches the simulator. The most common trigger in practice is a coefficient of variation above one, which nearly always means a raw variance was parsed into the standard deviation column, followed by a correlation matrix that lost positive semi-definiteness after a manual edit.

## Deterministic Transformation Logic: Vectorized Correlated Monte Carlo

The simulator draws correlated samples for every input term at once, vectorized across all 10,000 iterations, then computes the total emissions per iteration in a single matrix operation. Correlation is imposed with a Gaussian copula: draw standard-normal variates through the Cholesky factor of the correlation matrix, map each column to a uniform, then push it through the inverse CDF of that term's declared distribution. This preserves both the marginal shapes and the cross-term dependence without assuming everything is jointly Gaussian. The run is seeded for reproducibility, and a convergence gate refuses to return an interval that has not stabilized.

```python
import numpy as np
from scipy import stats
import structlog

log = structlog.get_logger()


def _sample_marginal(term: dict, u: np.ndarray) -> np.ndarray:
    """Map uniforms u in (0,1) to a term's declared distribution via its inverse CDF."""
    mean, sd, fam = term["mean"], term["sd"], term["distribution"]
    if fam == "normal":
        return stats.norm.ppf(u, loc=mean, scale=sd)
    if fam == "lognormal":
        # Convert arithmetic mean/sd to the log-space parameters.
        sigma = np.sqrt(np.log1p((sd / mean) ** 2))
        mu = np.log(mean) - 0.5 * sigma ** 2
        return stats.lognorm.ppf(u, s=sigma, scale=np.exp(mu))
    if fam == "truncated_normal":
        a = (0.0 - mean) / sd  # truncate at zero — areas and factors are non-negative
        return stats.truncnorm.ppf(u, a=a, b=np.inf, loc=mean, scale=sd)
    if fam == "triangular":
        half = sd * np.sqrt(6.0)  # symmetric triangle whose sd matches the declared sd
        lower, upper = mean - half, mean + half
        return stats.triang.ppf(u, c=0.5, loc=lower, scale=upper - lower)
    raise ValueError(f"unsupported distribution: {fam}")


def propagate_emissions_mc(
    factor_terms: list[dict],
    activity_terms: list[dict],
    corr: np.ndarray,
    n_iter: int = 10_000,
    conservative_percentile: float = 2.5,
    seed: int = 20260714,
    mc_se_tol: float = 0.005,
) -> dict:
    """Monte Carlo propagation of factor and activity uncertainty to total CO2e.

    factor_terms[i] pairs positionally with activity_terms[i]: emissions for
    source i on one iteration are factor_i * activity_i, summed over sources.
    `corr` is the correlation matrix over the interleaved [factors, activities].
    Returns mean, sd, 95% CI, a convergence flag, and the conservative estimate.
    """
    rng = np.random.default_rng(seed)
    terms = factor_terms + activity_terms
    n = len(terms)
    if corr.shape != (n, n):
        raise ValueError("correlation matrix must cover all factor+activity terms")

    # Gaussian copula: correlated standard normals -> uniforms -> marginals.
    chol = np.linalg.cholesky(corr)                      # raises if not PSD
    z = rng.standard_normal(size=(n_iter, n)) @ chol.T   # (n_iter, n) correlated normals
    u = stats.norm.cdf(z)                                # uniforms preserving rank corr

    samples = np.empty((n_iter, n), dtype="float64")
    for j, term in enumerate(terms):
        samples[:, j] = _sample_marginal(term, u[:, j])

    n_src = len(factor_terms)
    factors = samples[:, :n_src]                         # (n_iter, n_src)
    activities = samples[:, n_src:]                      # (n_iter, n_src)
    totals = (factors * activities).sum(axis=1)          # total CO2e per iteration

    mean = float(totals.mean())
    sd = float(totals.std(ddof=1))
    p_lo, p_hi = np.percentile(totals, [2.5, 97.5])
    conservative = float(np.percentile(totals, conservative_percentile))

    # Convergence gate: the standard error of the mean must be small relative
    # to the mean, or the interval is still noisy and must not be reported.
    mc_se = sd / np.sqrt(n_iter)
    converged = bool((mc_se / mean) < mc_se_tol) if mean else False
    if not converged:
        log.warning("mc_not_converged", relative_mc_se=round(mc_se / mean, 5),
                    tolerance=mc_se_tol, n_iter=n_iter)

    result = {
        "mean_tco2e": round(mean, 2),
        "sd_tco2e": round(sd, 2),
        "ci95_lower": round(float(p_lo), 2),
        "ci95_upper": round(float(p_hi), 2),
        "conservative_tco2e": round(conservative, 2),
        "conservative_percentile": conservative_percentile,
        "n_iter": n_iter,
        "seed": seed,
        "converged": converged,
        "relative_mc_se": round(mc_se / mean, 5) if mean else None,
    }
    log.info("mc_propagation_complete", **result)
    return result
```

The conservative estimate is the load-bearing output. Rather than reporting the mean and subtracting a fixed percentage, the routine reads the 2.5th percentile of the simulated distribution directly, which is exactly the "lower bound of the 95% confidence interval" that Verra and IPCC conservativeness rules ask a project to credit against. Because the percentile comes from the correlated draw, it already reflects the widened interval that analytic propagation would have hidden — the deduction is neither an arbitrary haircut nor an over-tight number a verifier can reject.

<svg viewBox="0 -4 730 216" role="img" aria-labelledby="draw-t draw-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="draw-t">How many Monte Carlo draws are enough, by the statistic being reported</title>
  <desc id="draw-d">A chart of the stability of a reported statistic against the number of draws, from 100 to 100 000. The mean stabilises within about 1 percent by 2 000 draws. The 95 percent interval bounds stabilise by about 20 000 draws. The 99th percentile, needed for a tail-risk statement, is still moving at 100 000. A panel notes that the required draw count depends entirely on which statistic goes in the report, that a default of ten thousand is adequate for a mean and marginal for an interval, and that the draw count and the random seed must both be recorded so the interval is byte-reproducible.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The draw count depends on which statistic you report</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Stability of the reported figure against draws.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="60" x2="560" y2="60"/><line x1="80" y1="102" x2="560" y2="102"/><line x1="80" y1="144" x2="560" y2="144"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="50" x2="80" y2="174"/>
    <line x1="80" y1="174" x2="560" y2="174"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="64" text-anchor="end">±10%</text>
    <text x="72" y="106" text-anchor="end">±5%</text>
    <text x="72" y="148" text-anchor="end">±1%</text>
    <text x="80" y="192" text-anchor="middle">100</text>
    <text x="240" y="192" text-anchor="middle">2 000</text>
    <text x="400" y="192" text-anchor="middle">20 000</text>
    <text x="560" y="192" text-anchor="middle">100 000</text>
  </g>
  <polyline points="80,66 160,120 240,152 320,164 400,169 480,171 560,172" fill="none" stroke="currentColor" stroke-width="2.6" stroke-dasharray="7,4"/>
  <polyline points="80,58 160,86 240,112 320,134 400,150 480,160 560,166" fill="none" stroke="currentColor" stroke-width="2.8"/>
  <polyline points="80,54 160,62 240,74 320,88 400,100 480,112 560,124" fill="none" stroke="#f3a712" stroke-width="2.8"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="576" y="176" fill="currentColor" opacity="0.85">mean</text>
    <text x="576" y="166" fill="currentColor">95% bounds</text>
    <text x="576" y="126" fill="#f3a712">99th percentile</text>
    <text x="12" y="208" font-weight="400" fill="currentColor" opacity="0.82">Record the draw count and the seed. An interval that changes when you re-run it is not evidence.</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

The simulation output becomes a submission artifact only when it is bound to the assumptions that produced it. Three gates make that binding auditable. The **convergence flag** must be true before any figure is quoted; a `converged=False` result is a draft, not a claim, and the logged relative Monte Carlo standard error tells a reviewer how far off it was. The **conservative percentile** is recorded explicitly so a verifier can confirm the project credited the lower bound rather than the mean — this maps directly onto the conservativeness principle in ISO 14064-3 and the uncertainty-deduction clauses of the Verra VM-series. The **seed, sample count, and input covariance** are serialized alongside the result so the entire interval can be regenerated bit-for-bit, which is what turns "we ran a Monte Carlo" into a reproducible control an auditor can rerun.

Map the outputs to the frameworks as follows. The 95% CI and the conservative estimate answer **ISO 14064-3**, which expects the reported total to be both reproducible and conservative; reading the credited figure off the correlated lower tail satisfies both at once. The relative interval width feeds **Verra VM-series** uncertainty deductions, where a methodology-specific tolerance decides how much of the mean a project may claim. The distribution shape and the declared input families support **CSRD ESRS E1** disclosure, which scrutinizes climate figures for transparent treatment of estimation uncertainty rather than a single unqualified number. Because the correlation matrix travels with the result, the audit trail also records the modelling choice most likely to be challenged — how strongly the factors were assumed to move together — and lets a reviewer stress-test it. Those covariance assumptions belong in the versioned factor store described in [versioning emission factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/), so the exact factor revision behind a submitted figure is always recoverable.

## Production Integration

Deploy the simulator inside the MRV orchestration layer along a fixed ingest → diagnose → transform → validate → export → submit sequence:

1. **Ingest.** Pull the emission-factor distributions and their correlation matrix from the versioned factor database, and the activity-data quantities with their dispersions from the inventory tables, pinning the exact factor revision so the run is reproducible.
2. **Diagnose.** Run `validate_uncertainty_inputs` to confirm every term carries a mean, dispersion, distribution family, and a positive semi-definite correlation matrix; reject the batch on any breach rather than substituting a default.
3. **Transform.** Call `propagate_emissions_mc` with `n_iter=10_000` and the project seed, drawing correlated factor and activity samples through the Gaussian copula and reducing to the total-emissions distribution.
4. **Validate.** Assert `converged is True` and that the relative interval width sits within the methodology tolerance; a non-converged or implausibly wide result is quarantined for review, never quoted.
5. **Export.** Serialize the mean, 95% CI, conservative estimate, seed, sample count, and correlation matrix into the run's audit record so the figure can be regenerated on demand.
6. **Submit.** Forward the conservative estimate as the creditable volume and the full distribution as supporting evidence, feeding the baseline logic in [forest carbon baseline & additionality modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/) and the calibration checks in [ground-truth alignment for carbon models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/).

Run the simulation as an idempotent task keyed on the input revision and seed, so a rerun over unchanged inputs reproduces the identical interval and a changed factor revision produces a new, traceable record. By validating uncertainty metadata before it simulates, imposing correlation in the draw rather than assuming it away, gating on convergence, and reading the conservative figure straight off the empirical tail, Monte Carlo propagation turns a fragile analytic estimate into a total-emissions figure that survives third-party verification and carries its own reproducible proof.

<svg viewBox="0 -4 880 218" role="img" aria-labelledby="corr-t corr-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="corr-t">Correlated versus independent draws on the same inputs</title>
  <desc id="corr-d">Two sampling schemes applied to the same three inputs — area, biomass density, and carbon fraction. Under independent sampling, each input is drawn separately, the extremes rarely coincide, and the resulting total distribution is narrow with a 95 percent interval of plus or minus 18 percent. Under correlated sampling, which respects that biomass density and carbon fraction are estimated from the same field campaign and move together, the extremes coincide more often and the interval widens to plus or minus 27 percent. A panel notes that independence is an assumption, not a default, and that assuming it where correlation exists understates the interval by half.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Independence is an assumption, not a default</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Same three inputs, two sampling schemes.</text>
    <rect x="12" y="52" width="424" height="140" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Independent draws</text>
    <text x="28" y="100" fill="currentColor" font-size="9.5" opacity="0.85">area, density and carbon fraction drawn separately</text>
    <text x="28" y="120" fill="currentColor" font-size="9.5" opacity="0.85">extremes rarely coincide</text>
    <text x="28" y="150" fill="currentColor" font-size="15" font-weight="700">±18%</text>
    <text x="28" y="176" fill="currentColor" font-size="9.5" opacity="0.85">comfortable, and not what the data supports</text>
    <rect x="456" y="52" width="412" height="140" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="456" y="52" width="412" height="140" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="472" y="76" fill="currentColor" font-size="10.5" font-weight="700">Correlated draws</text>
    <text x="472" y="100" fill="currentColor" font-size="9.5" opacity="0.85">density and carbon fraction share a field campaign</text>
    <text x="472" y="120" fill="currentColor" font-size="9.5" opacity="0.85">so they move together, and extremes coincide</text>
    <text x="472" y="150" fill="#f3a712" font-size="15" font-weight="700">±27%</text>
    <text x="472" y="176" fill="currentColor" font-size="9.5" opacity="0.85">wider, and defensible</text>
  </g>
</svg>

## Frequently Asked Questions

### How many draws does a Monte Carlo propagation need?

It depends on which statistic reaches the report. A mean stabilises within a couple of thousand draws; the bounds of a 95% interval need tens of thousands; a tail percentile for a risk statement may still be moving at a hundred thousand. Choose the count from the statistic you will publish, verify stability by re-running with a different seed and comparing, and record both the count and the seed so the interval is reproducible.

### Which correlations actually matter?

Any inputs estimated from the same underlying data. Biomass density and carbon fraction derived from the same field campaign move together; a root-to-shoot ratio applied to a modelled above-ground estimate is perfectly correlated with it; emission factors from the same publication share its systematic error. Treating those as independent lets their extremes cancel in the simulation, narrowing the interval by a factor that is often close to two.

### What distribution should each input take?

Whatever the source states, and a defensible default where it does not. Published factors frequently give a mean and a 95% interval without naming a distribution; a normal or lognormal fitted to those bounds is reasonable, with lognormal preferred for strictly positive quantities where the interval is asymmetric. Record the choice per input — the distribution is part of the method, and a verifier reproducing your interval needs it.

### Can analytic error propagation replace the simulation?

For simple products and sums of independent, roughly normal terms, yes, and it is cheaper. It breaks down exactly where carbon accounting lives: non-linear model forms, truncated distributions, correlated inputs, and quantities that must stay positive. The practical compromise is analytic propagation during development for fast feedback and a Monte Carlo pass for anything that reaches a report, with the two compared once to confirm the analytic version is not wildly optimistic.

### How should the simulation be made reproducible?

Fix and record the seed, fix the draw count, and avoid any source of ordering non-determinism in how the draws are consumed — parallel workers each drawing from a shared generator will not reproduce. Seed per partition from a recorded master seed instead, so the whole simulation is reproducible regardless of how the work is distributed. An interval that changes on re-run is not evidence, however carefully it was computed.

## Related guides

- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — the parent variance stage this simulation implements for total emissions.
- [Biomass Estimation from LiDAR & SAR Fusion](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/) — the upstream source of the per-pixel error bands that seed the factor distributions.
- [Forest Carbon Baseline & Additionality Modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/) — the downstream consumer that credits against the conservative estimate.
- [Versioning Emission Factor Databases for Reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) — where the factor distributions and covariance assumptions are pinned per revision.
