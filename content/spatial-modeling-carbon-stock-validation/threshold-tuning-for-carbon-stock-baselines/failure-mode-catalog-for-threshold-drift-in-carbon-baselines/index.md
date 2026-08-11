---
shortTitle: "Failure Mode Catalog for Threshold Drift in Carbon Baselines"
title: "Failure Mode Catalog for Threshold Drift in Carbon Baselines"
description: "Ten ways a fixed threshold stops meaning what it meant: sensor changes, index recalibration, retuning against outcomes, and the silent redefinition of forest that moves a baseline without anyone changing a number."
slug: failure-mode-catalog-for-threshold-drift-in-carbon-baselines
type: guide
breadcrumb: "Threshold Drift Failure Modes"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Failure Mode Catalog for Threshold Drift in Carbon Baselines

A threshold is the most innocuous-looking number in a carbon pipeline and the one with the most leverage. A canopy cover cut-off decides what counts as forest, which decides the baseline area, which multiplies through every subsequent figure. Because the number itself rarely changes, threshold problems are almost never detected as changes to a threshold — they are detected, if at all, as an unexplained movement in a total. This catalogue collects those cases, within [threshold tuning for carbon stock baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack.

The organising observation is that a threshold is a boundary drawn on a distribution, and it is the distribution that moves. Nobody edits the number; the imagery changes collection, the index gets recalibrated, a new sensor joins the input mix, the atmospheric correction improves — and the same numeric cut-off now falls at a different point in the data. The threshold has drifted without being touched, which is why version control on the configuration file does not detect it.

<svg viewBox="0 -4 940 260" role="img" aria-labelledby="dr-t dr-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="dr-t">Ten threshold drift modes, grouped by what moved</title>
  <desc id="dr-d">A grid of ten failure modes in three groups. The input group covers a collection or processing baseline change shifting the index distribution, a new sensor joining the mix with a different band response, an atmospheric correction improvement altering reflectance systematically, and a resampling change altering the pixel support. The definition group covers a threshold fitted once on one biome then applied everywhere, a cut-off calibrated against a reference dataset that was itself later revised, and a minimum mapping unit changed independently of the cover threshold. The governance group covers a threshold retuned until the credited area reached a target, a threshold changed without restating prior periods, and a threshold whose original justification nobody can locate. A panel notes that in nine of the ten the numeric threshold never changed.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Ten ways a threshold moves without being edited</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">In nine of the ten, the number in the config file is unchanged.</text>
    <rect x="12" y="52" width="298" height="186" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="298" height="186" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Input — the distribution moved</text>
    <text x="28" y="102" fill="currentColor" font-size="9.5" opacity="0.85">1 · collection / baseline change</text>
    <text x="28" y="124" fill="currentColor" font-size="9.5" opacity="0.85">2 · new sensor in the mix</text>
    <text x="28" y="146" fill="currentColor" font-size="9.5" opacity="0.85">3 · atmospheric correction improved</text>
    <text x="28" y="168" fill="currentColor" font-size="9.5" opacity="0.85">4 · resampling changed the support</text>
    <text x="28" y="200" fill="currentColor" font-size="9" opacity="0.72">the cut-off is where it always was;</text>
    <text x="28" y="216" fill="currentColor" font-size="9" opacity="0.72">the data slid underneath it</text>
    <rect x="322" y="52" width="298" height="186" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="322" y="52" width="298" height="186" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="338" y="76" fill="currentColor" font-size="10.5" font-weight="700">Definition — it never fitted</text>
    <text x="338" y="102" fill="currentColor" font-size="9.5" opacity="0.85">5 · fitted on one biome, used on all</text>
    <text x="338" y="124" fill="currentColor" font-size="9.5" opacity="0.85">6 · reference data later revised</text>
    <text x="338" y="146" fill="currentColor" font-size="9.5" opacity="0.85">7 · MMU changed independently</text>
    <text x="338" y="184" fill="currentColor" font-size="9" opacity="0.72">correct where it was fitted and</text>
    <text x="338" y="200" fill="currentColor" font-size="9" opacity="0.72">wrong everywhere else, from</text>
    <text x="338" y="216" fill="currentColor" font-size="9" opacity="0.72">the first day it was applied</text>
    <rect x="632" y="52" width="296" height="186" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="648" y="76" fill="currentColor" font-size="10.5" font-weight="700">Governance — it was moved</text>
    <text x="648" y="102" fill="currentColor" font-size="9.5" opacity="0.85">8 · retuned until the area fitted</text>
    <text x="648" y="124" fill="currentColor" font-size="9.5" opacity="0.85">9 · changed without restating priors</text>
    <text x="648" y="146" fill="currentColor" font-size="9.5" opacity="0.85">10 · original justification lost</text>
    <text x="648" y="184" fill="#f3a712" font-size="9" font-weight="700">the only group a verifier can</text>
    <text x="648" y="200" fill="#f3a712" font-size="9" font-weight="700">see directly — and the one</text>
    <text x="648" y="216" fill="#f3a712" font-size="9" font-weight="700">that ends a validation</text>
  </g>
</svg>

## Root Cause Analysis

The ten entries reduce to three causes, and separating them decides who has to fix what.

**A threshold is meaningful only relative to the distribution it was fitted on.** A canopy cover cut-off of thirty percent expresses a judgement about where forest begins, but the pipeline implements it as a numeric comparison against a modelled cover value, and that model's output distribution depends on the imagery, the algorithm, and the processing chain. Change any of those and the same numeric comparison implements a different judgement. The threshold that survives is one recorded alongside the distribution it was calibrated against, so a shift in the distribution is detectable as a shift.

**Thresholds interact, and are usually tuned in isolation.** Canopy cover, minimum mapping unit, and minimum width jointly define forest, and moving any one changes what the others exclude. Raising the cover threshold shrinks patches, which pushes more of them under the minimum mapping unit, which removes more area than the cover change alone accounts for. Teams tune one at a time, measure the effect of each, and are then surprised by the combined result — which is not the sum of the parts.

**Tuning against the outcome is nearly irresistible and completely fatal.** Every threshold has a range of defensible values, and within that range the credited area varies substantially. A team that tries several values and selects the one producing the expected area has performed a legitimate-looking sensitivity analysis and arrived at a number chosen by its result. This is the failure that ends validations, and it is detectable in the record: a threshold whose selection log shows the credited area computed before the choice was made is very hard to defend afterwards.

The thread running through all three is that the threshold's value is not the artefact — the justification is. A number without a recorded basis cannot be assessed, defended, or safely changed.

## Diagnostic Pipeline / Pre-Flight Validation

The most effective detector is a distribution monitor: record the distribution of the thresholded variable each period, and alert when it moves relative to the period the threshold was calibrated on. This catches every entry in the input group before it reaches a reported figure.

```python
from dataclasses import dataclass
from datetime import date

import numpy as np
import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class ThresholdSpec:
    """A threshold plus everything needed to tell whether it still applies."""
    threshold_id: str
    variable: str
    value: float
    calibrated_on: date
    calibration_source: str          # imagery collection + version
    calibration_biome: str
    reference_dataset: str
    reference_version: str
    justification: str
    # The calibration-period distribution, as percentiles. This is what
    # makes drift detectable — the number alone cannot move, so it cannot
    # be monitored; the distribution beneath it can.
    calib_percentiles: tuple[float, ...]   # p05..p95 in steps of 5


@dataclass(frozen=True)
class DriftReport:
    threshold_id: str
    period: str
    percentile_at_threshold_then: float
    percentile_at_threshold_now: float
    shift_pp: float
    area_change_pct: float
    verdict: str                     # stable | review | blocked


DRIFT_REVIEW_PP = 2.0
DRIFT_BLOCK_PP = 5.0


def percentile_of(value: float, percentiles: tuple[float, ...]) -> float:
    """Where a fixed value sits in a distribution given as p05..p95."""
    levels = np.arange(5, 100, 5)
    return float(np.interp(value, np.array(percentiles), levels))


def detect_drift(
    spec: ThresholdSpec, current_percentiles: tuple[float, ...],
    period: str, area_change_pct: float,
) -> DriftReport:
    """Has the distribution moved under a fixed threshold?

    The question is not whether the threshold value changed — it has not.
    It is whether the same value now separates a different share of the
    landscape, which is the operative definition of drift.
    """
    then = percentile_of(spec.value, spec.calib_percentiles)
    now = percentile_of(spec.value, current_percentiles)
    shift = abs(now - then)

    if shift >= DRIFT_BLOCK_PP:
        verdict = "blocked"
        log.error(
            "threshold.drift_blocked",
            threshold=spec.threshold_id, period=period,
            percentile_then=round(then, 1), percentile_now=round(now, 1),
            shift_pp=round(shift, 1),
            note="the same cut-off now classifies a materially different "
                 "share of the landscape; recalibrate or restate, do not "
                 "publish against a threshold that has silently moved",
        )
    elif shift >= DRIFT_REVIEW_PP:
        verdict = "review"
        log.warning(
            "threshold.drift_review", threshold=spec.threshold_id,
            period=period, shift_pp=round(shift, 1),
        )
    else:
        verdict = "stable"

    return DriftReport(
        spec.threshold_id, period, round(then, 2), round(now, 2),
        round(shift, 2), area_change_pct, verdict,
    )


def assert_applicable(spec: ThresholdSpec, biome: str, source: str) -> None:
    """Refuse to apply a threshold outside the conditions it was fitted for."""
    if spec.calibration_biome != biome:
        raise ValueError(
            f"threshold {spec.threshold_id} was calibrated on "
            f"'{spec.calibration_biome}' and is being applied to '{biome}'. "
            "Fit a threshold per biome or state the transfer explicitly — a "
            "cover cut-off from closed tropical forest classifies open "
            "woodland almost arbitrarily."
        )
    if spec.calibration_source != source:
        log.warning(
            "threshold.source_mismatch",
            threshold=spec.threshold_id,
            calibrated_on=spec.calibration_source, applied_to=source,
            note="run drift detection before trusting this period",
        )
```

The percentile framing is what makes this monitorable. A threshold of 0.30 is unchanged every period by construction; the share of the landscape it separates is a number that moves, and moving numbers can be alerted on.

<svg viewBox="0 -4 900 258" role="img" aria-labelledby="dist-t dist-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="dist-t">A fixed threshold over two distributions after a collection change</title>
  <desc id="dist-d">Two overlapping distributions of a canopy cover index across a landscape. The calibration-period distribution is drawn solid, with a vertical threshold line at the fitted value falling at the twenty-eighth percentile, so twenty-eight percent of the landscape falls below the cut-off and is classified as non-forest. The current-period distribution, produced after a collection change that shifted the index slightly upward, is drawn dashed and displaced to the right. The same vertical threshold line now falls at the twenty-first percentile of the new distribution, so only twenty-one percent falls below it and seven percent of the landscape has changed class without anything changing on the ground. A panel notes that the threshold value is identical in both cases, so a diff of the configuration shows nothing.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The line did not move. The landscape underneath it did.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="70" y1="42" x2="70" y2="200"/><line x1="70" y1="200" x2="640" y2="200"/>
  </g>
  <path d="M80 198 C160 194 200 120 260 88 C310 62 360 60 410 82 C470 108 520 176 600 196 L640 199" fill="currentColor" opacity="0.16"/>
  <path d="M80 198 C160 194 200 120 260 88 C310 62 360 60 410 82 C470 108 520 176 600 196" fill="none" stroke="currentColor" stroke-width="2.2"/>
  <path d="M136 198 C216 194 256 120 316 88 C366 62 416 60 466 82 C526 108 576 176 640 196" fill="none" stroke="#f3a712" stroke-width="2.2" stroke-dasharray="7,4"/>
  <line x1="212" y1="42" x2="212" y2="212" stroke="currentColor" stroke-width="2.6"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">
    <text x="212" y="232" text-anchor="middle" font-weight="700">threshold = 0.30, unchanged</text>
    <text x="355" y="252" text-anchor="middle" opacity="0.72">modelled canopy cover →</text>
    <text x="62" y="46" text-anchor="end" opacity="0.8">density</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="660" y="70" fill="currentColor" font-weight="700">Calibration period</text>
    <text x="660" y="88" fill="currentColor" opacity="0.8">28% of the landscape</text>
    <text x="660" y="104" fill="currentColor" opacity="0.8">falls below the cut-off</text>
    <text x="660" y="140" fill="#f3a712" font-weight="700">After a collection change</text>
    <text x="660" y="158" fill="currentColor" opacity="0.8">21% falls below it</text>
    <text x="660" y="174" fill="#f3a712" font-weight="700">7% of the landscape</text>
    <text x="660" y="190" fill="#f3a712" font-weight="700">changed class for free</text>
    <text x="660" y="220" fill="currentColor" opacity="0.75">a config diff shows</text>
    <text x="660" y="236" fill="currentColor" opacity="0.75">absolutely nothing</text>
  </g>
</svg>

## Deterministic Transformation Logic

Once a threshold is treated as a versioned object rather than a constant, the pipeline can apply the right one to each period and produce a comparable series. Two rules make that work: a threshold change creates a new version rather than editing the old one, and every classified output records which version produced it.

```python
from dataclasses import dataclass, replace
from datetime import date


@dataclass(frozen=True)
class ThresholdVersion:
    spec: ThresholdSpec
    version: int
    effective_from: date
    effective_to: date | None
    supersedes: int | None
    change_reason: str


class ThresholdRegistry:
    """Append-only store of threshold versions with as-of resolution.

    Editing a threshold in place is the single change that makes a carbon
    time series non-comparable and non-auditable at once, so this class has
    no update method at all.
    """

    def __init__(self) -> None:
        self._versions: dict[str, list[ThresholdVersion]] = {}

    def add(self, tv: ThresholdVersion) -> None:
        chain = self._versions.setdefault(tv.spec.threshold_id, [])
        if chain and chain[-1].effective_to is None:
            chain[-1] = replace(chain[-1], effective_to=tv.effective_from)
        if not tv.change_reason.strip():
            raise ValueError(
                "a threshold version with no stated reason is a threshold "
                "nobody can defend later; state why it changed"
            )
        chain.append(tv)

    def resolve(self, threshold_id: str, on: date) -> ThresholdVersion:
        for tv in self._versions.get(threshold_id, []):
            if tv.effective_from <= on and (
                tv.effective_to is None or on < tv.effective_to
            ):
                return tv
        raise KeyError(
            f"no version of threshold '{threshold_id}' is effective on {on}"
        )

    def restatement_impact(
        self, threshold_id: str, from_version: int, to_version: int
    ) -> str:
        """What changing versions means for periods already reported.

        Called before a threshold change is committed, not after. A change
        that would alter a previously reported area is a restatement, and
        deciding that consciously beats discovering it in a verification.
        """
        chain = self._versions[threshold_id]
        old = next(v for v in chain if v.version == from_version)
        new = next(v for v in chain if v.version == to_version)
        return (
            f"threshold {threshold_id}: {old.spec.value} → {new.spec.value} "
            f"effective {new.effective_from}. Periods before that date keep "
            f"version {from_version}; recomputing them under {to_version} is "
            "a restatement and must be reported as one."
        )


def classify_with_provenance(
    values: list[float], tv: ThresholdVersion
) -> list[tuple[bool, str]]:
    """Classify and stamp. The stamp is not optional overhead.

    Without it, a mixed-vintage dataset — some periods classified under one
    version, some under another — is indistinguishable from a consistent one,
    and any trend computed across the boundary is partly an artefact of the
    threshold change.
    """
    stamp = f"{tv.spec.threshold_id}@v{tv.version}"
    return [(v >= tv.spec.value, stamp) for v in values]
```

The refusal to accept an empty change reason is a small guard with an outsized return. Threshold changes are usually made under time pressure and their reasons are obvious at the moment they are made and irrecoverable eighteen months later, when a verifier asks why the forest definition tightened between two periods.

## Compliance Gating & Audit Trail Generation

Four records make thresholds defensible, and they are all cheap relative to the consequence of not having them.

The threshold's calibration basis: the reference dataset and version, the biome, the imagery collection, and the distribution it was fitted against. This is the artefact that answers "why this value" without recourse to memory.

The drift report per period. A stable verdict every period is a strong statement; the absence of any drift monitoring is what invites the question of whether the threshold still means anything.

The version stamp on every classified output. This is what allows a multi-year series to be checked for consistency mechanically, and what makes a mixed-vintage comparison visible rather than silent.

The selection record, showing what was considered and in what order. This is the defence against the accusation of outcome tuning, and it works only if the record shows the sensitivity analysis was run and the choice justified on grounds other than the resulting area. A record that shows credited area computed for each candidate before the selection is worse than no record at all.

## Production Integration

The registry belongs alongside the emission factor tables rather than in a pipeline configuration file, because the two have identical requirements: append-only versions, validity intervals, mandatory as-of resolution, and a refusal to interpolate. A project that has implemented [versioning emission factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) already has the machinery and needs only to register thresholds in it.

The drift monitor should run on every period regardless of whether anything is expected to have changed, since the whole point is that changes arrive from upstream without announcement. Where it fires, the response is a choice between recalibrating the threshold — which creates a version and a restatement question — and rejecting the upstream change, which is occasionally the right answer when a collection update is known to be problematic. The tuning mechanics themselves are covered in [tuning canopy cover thresholds for forest baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/tuning-canopy-cover-thresholds-for-forest-baselines/), and the same precision-omission trade appears in alerting, described in [reducing false positive deforestation alerts](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/reducing-false-positive-deforestation-alerts/).

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="int-t int-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="int-t">Three thresholds interacting, and why tuning them one at a time misleads</title>
  <desc id="int-d">A diagram showing three interacting definitions of forest applied in sequence to the same landscape. A canopy cover cut-off removes the sparsest areas. A minimum mapping unit then removes patches below a size, and because the cover cut-off has already fragmented some patches, it removes more area than it would have on the unfiltered landscape. A minimum width rule then removes narrow strips, which the previous two steps have also made more numerous. Three bars show the area removed by each rule measured in isolation, and a fourth bar shows the area removed when all three are applied together, which is substantially larger than their sum would suggest. A panel notes that the interaction is why a sensitivity analysis must vary the rules jointly rather than one at a time.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The three rules are not independent — and the combined effect exceeds the sum</text>
    <text x="12" y="56" fill="currentColor" font-size="9.5" font-weight="600">canopy cover ≥ 30%</text>
    <text x="12" y="96" fill="currentColor" font-size="9.5" font-weight="600">patch ≥ 0.5 ha</text>
    <text x="12" y="136" fill="currentColor" font-size="9.5" font-weight="600">width ≥ 20 m</text>
    <text x="12" y="182" fill="#f3a712" font-size="9.5" font-weight="700">all three together</text>
    <text x="200" y="34" fill="currentColor" font-size="9" opacity="0.72">area removed from the forest baseline</text>
  </g>
  <g>
    <rect x="200" y="42" width="188" height="20" rx="4" fill="currentColor" opacity="0.35"/>
    <rect x="200" y="82" width="96" height="20" rx="4" fill="currentColor" opacity="0.35"/>
    <rect x="200" y="122" width="62" height="20" rx="4" fill="currentColor" opacity="0.35"/>
    <rect x="200" y="168" width="486" height="22" rx="4" fill="#f3a712" opacity="0.4"/>
    <rect x="200" y="168" width="346" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5,3"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor">
    <text x="398" y="57">4.1% measured alone</text>
    <text x="306" y="97">2.1% measured alone</text>
    <text x="272" y="137">1.4% measured alone</text>
    <text x="556" y="164" opacity="0.75">sum of the three: 7.6%</text>
    <text x="696" y="184" fill="#f3a712" font-weight="700">actual: 10.7%</text>
  </g>
  <rect x="12" y="206" width="876" height="38" rx="9" fill="currentColor" opacity="0.06"/>
  <rect x="12" y="206" width="876" height="38" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <text x="450" y="230" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.85">A cover cut-off fragments patches, which pushes more of them under the size and width rules. Vary the three jointly, or the analysis understates by a third.</text>
</svg>

## Frequently Asked Questions

### How large a distribution shift should block publication?

The percentile framing gives a natural scale, and a shift of about five percentage points in where the threshold sits is a reasonable blocking level for a forest cover definition — at that magnitude the classified area has moved enough to be visible in a reported total. Two percentage points is a sensible review level. Those figures are starting points rather than standards; the right number for a given project follows from how much area movement its methodology tolerates before a restatement is required.

### Is recalibrating a threshold after a collection change a restatement?

Recalibrating so that the new imagery classifies the landscape as the old imagery did is a continuity measure and is generally the right response. It becomes a restatement when prior periods are recomputed under the new value. The clean approach is to version the threshold with an effective date matching the collection change, leave prior periods on the prior version, and state in the monitoring report that the definition was held constant in substance while its numeric expression changed.

### How should a threshold be chosen without tuning to the outcome?

Choose it against an independent reference — a set of interpreted points, a field-verified sample, a national forest definition — and select the value that best matches that reference, with the credited area computed only afterwards. The sequencing is the control. Where the resulting area is uncomfortable, the honest move is to note the discomfort and keep the value, since the alternative leaves a record showing the area was known before the choice was made.

### Do these problems apply to continuous outputs, or only to classifications?

Mostly to classifications, because a threshold is what creates a class. Continuous outputs suffer a related but milder version: a distribution shift moves the values without creating a discontinuity, so the effect appears as a gradual trend rather than an abrupt area change. That is arguably worse, since a trend looks like a finding. The same drift monitor detects it, and comparing the current distribution against the calibration one is the check in both cases.

### What if the calibration-period distribution was never recorded?

Reconstruct it if the imagery is still available, which it usually is — reprocessing a sample of the calibration-period scenes under the original collection gives a workable approximation. Where reconstruction is impossible, the honest position is that drift cannot be detected for that threshold and the next recalibration establishes a new baseline going forward. Recording that limitation is better than asserting stability that has not been checked.

### Should thresholds ever differ between the baseline and monitoring periods?

No, and this is one of the few genuinely absolute rules here. The baseline and the monitoring period are compared to each other, and a definition that differs between them makes the comparison meaningless — any change measured is partly a change in the definition. Where a threshold must change mid-project because of an upstream change, both the baseline and the monitoring period should be reprocessed under the new version, and the resulting restatement reported.

### How does the minimum mapping unit interact with pixel size?

Directly, and it is a common source of unnoticed drift. A minimum mapping unit expressed in pixels rather than in hectares changes meaning the moment the pixel size changes — a five-pixel minimum is 0.45 ha at thirty metres and 0.05 ha at ten. Adding Sentinel-2 to a Landsat-based pipeline therefore loosens the rule by an order of magnitude without anyone editing it. Express every spatial rule in ground units, and let the pipeline convert to pixels at the point of use.

### Can a threshold be avoided altogether?

Sometimes, and where it can be it usually should be. Reporting a continuous carbon density surface and integrating it over the project area needs no forest definition at all, because nothing is being classified — every hectare contributes what it holds. Thresholds become unavoidable when the methodology's unit of account is an area of forest rather than a quantity of carbon, which is the case for most deforestation-based crediting and for most regulatory land cover reporting.

Where a threshold is unavoidable, the next best mitigation is to report the sensitivity alongside the figure: the credited area at the chosen value and at the two neighbouring defensible values. That converts a single number resting on a judgement into a range with the judgement visible, and it removes most of the force of a challenge to the specific value, because the answer to "why 30 rather than 25?" is already on the page.

## Related guides

- [Threshold Tuning for Carbon Stock Baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) — the parent topic and the tuning process these failures affect.
- [Tuning Canopy Cover Thresholds for Forest Baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/tuning-canopy-cover-thresholds-for-forest-baselines/) — how the value is chosen in the first place.
- [Versioning Emission Factor Databases for Reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) — the versioning machinery this registry shares.
- [Harmonizing Sentinel-2 and Landsat Surface Reflectance](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/harmonizing-sentinel-2-and-landsat-surface-reflectance/) — removing the upstream shift that causes most drift.
