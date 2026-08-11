---
shortTitle: "Reducing False Positive Deforestation Alerts"
title: "Reducing False Positive Deforestation Alerts"
description: "Cutting the false alarm rate in a deforestation alert pipeline without losing real detections: confirmation logic, seasonal and flooding exclusions, minimum mapping units, and measuring precision against a reference sample."
slug: reducing-false-positive-deforestation-alerts
type: guide
breadcrumb: "Reducing False Positives"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Reducing False Positive Deforestation Alerts

An alert system that cries wolf gets muted, and a muted alert system is worse than none because the organisation believes it is covered. Most deforestation alert pipelines start with an unacceptable false positive rate — commonly a majority of alerts — and the work of making one operational is largely the work of getting that rate down without discarding the detections that matter. This guide covers how, within [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) in the [satellite imagery processing for emissions tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack.

The framing that makes this tractable is that a false positive is not a single phenomenon. Cloud shadow, seasonal leaf drop, flooding, harvest of a planted stand, terrain shadow, and a genuine but tiny clearing are six different things that all produce the same signal — a sudden drop in a vegetation index — and each needs a different control. Tuning one global threshold trades all six against each other simultaneously, which is why threshold tuning alone plateaus at a disappointing precision.

<svg viewBox="0 -4 940 264" role="img" aria-labelledby="fp-t fp-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="fp-t">Six causes of a spectral drop, and the control that separates each from real clearing</title>
  <desc id="fp-d">Six rows, each pairing a cause of a false alert with its distinguishing signature and the control that removes it. Cloud shadow is transient and moves between acquisitions, removed by requiring confirmation across independent observations. Seasonal leaf drop recurs on an annual cycle at the same locations, removed by comparing against the pixel's own seasonal expectation rather than a fixed threshold. Flooding raises shortwave infrared absorption while leaving canopy structure intact, removed by a water index test. Planted stand harvest occurs on managed parcels with a known rotation, removed by a land use mask. Terrain shadow varies with solar geometry and recurs at the same locations near the solstice, removed by an illumination correction or a slope and aspect exclusion. A genuine clearing below the minimum mapping unit is real but not reportable, removed by a patch size filter. A panel notes that a single global threshold trades all six against one another at once.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Six causes, one signal, six different controls</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Every row produces the same sudden drop in the index. None of them is fixed by moving the threshold.</text>
    <text x="16" y="60" fill="currentColor" font-size="9.5" font-weight="700">cause</text>
    <text x="286" y="60" fill="currentColor" font-size="9.5" font-weight="700">signature that separates it</text>
    <text x="646" y="60" fill="currentColor" font-size="9.5" font-weight="700">control</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <rect x="12" y="68" width="916" height="30" fill="currentColor" opacity="0.06"/>
    <text x="16" y="88" fill="currentColor" font-weight="600">cloud shadow</text>
    <text x="286" y="88" fill="currentColor" opacity="0.85">transient; moves between acquisitions</text>
    <text x="646" y="88" fill="currentColor" font-weight="700">confirmation across observations</text>
    <rect x="12" y="100" width="916" height="30" fill="currentColor" opacity="0.11"/>
    <text x="16" y="120" fill="currentColor" font-weight="600">seasonal leaf drop</text>
    <text x="286" y="120" fill="currentColor" opacity="0.85">recurs annually at the same pixels</text>
    <text x="646" y="120" fill="currentColor" font-weight="700">per-pixel seasonal expectation</text>
    <rect x="12" y="132" width="916" height="30" fill="currentColor" opacity="0.06"/>
    <text x="16" y="152" fill="currentColor" font-weight="600">flooding</text>
    <text x="286" y="152" fill="currentColor" opacity="0.85">SWIR absorption up, structure intact</text>
    <text x="646" y="152" fill="currentColor" font-weight="700">water index test</text>
    <rect x="12" y="164" width="916" height="30" fill="currentColor" opacity="0.11"/>
    <text x="16" y="184" fill="currentColor" font-weight="600">plantation harvest</text>
    <text x="286" y="184" fill="currentColor" opacity="0.85">managed parcel, known rotation</text>
    <text x="646" y="184" fill="currentColor" font-weight="700">land use mask</text>
    <rect x="12" y="196" width="916" height="30" fill="currentColor" opacity="0.06"/>
    <text x="16" y="216" fill="currentColor" font-weight="600">terrain shadow</text>
    <text x="286" y="216" fill="currentColor" opacity="0.85">tracks solar geometry, recurs at solstice</text>
    <text x="646" y="216" fill="currentColor" font-weight="700">illumination correction</text>
    <rect x="12" y="228" width="916" height="30" fill="#f3a712" opacity="0.14"/>
    <text x="16" y="248" fill="currentColor" font-weight="600">sub-MMU clearing</text>
    <text x="286" y="248" fill="currentColor" opacity="0.85">real, but below the reportable unit</text>
    <text x="646" y="248" fill="#f3a712" font-weight="700">patch size filter</text>
  </g>
</svg>

## Root Cause Analysis

Three properties of the alerting problem explain why naive tuning fails and what actually works.

**The base rate is brutal.** Deforestation affects a tiny fraction of a forest landscape in any given period — often well under one percent of pixels per year. Even a detector with a very low false positive rate per pixel produces more false alerts than true ones, simply because there are so many more intact pixels to be wrong about. A detector with 99% specificity over a million intact pixels generates ten thousand false alerts, against perhaps a few hundred real events. This is not a defect in the detector; it is arithmetic, and it means precision must be bought with confirmation logic rather than with a better single-observation test.

**Confirmation costs latency, and latency is the product.** The obvious remedy — require the change to persist across several observations before alerting — works extremely well and directly undermines the reason the system exists. An alert delivered six weeks after the chainsaws arrive is a historical record. The design space is therefore a curve rather than a point, and the useful move is to publish alerts at multiple confidence levels rather than to pick one place on the curve: a low-confidence alert for immediate triage and a high-confidence one for enforcement or reporting.

**Most false positives are spatially and temporally clustered, not random.** Terrain shadow recurs on the same north-facing slopes each winter. Flooding follows the same floodplains each wet season. Seasonal drop affects the same deciduous stands. This clustering is what makes targeted exclusions so much more effective than threshold tuning: a mask derived from a few years of history removes a large share of the false alerts at almost no cost to true detections, because clearing does not preferentially occur where the artefacts do.

The failure this analysis prevents is the one where a team spends months tuning a detection threshold and moves precision from thirty percent to thirty-five, when a floodplain mask would have taken it to sixty in an afternoon.

## Diagnostic Pipeline / Pre-Flight Validation

Before tuning anything, characterise the false positives that already exist. The single most valuable artefact in this work is a labelled sample of current alerts, and it is worth the interpretation effort because it directs every subsequent decision.

```python
from collections import Counter
from dataclasses import dataclass
from datetime import date

import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class AlertRecord:
    """One raw alert with the context needed to explain it."""
    alert_id: str
    lon: float
    lat: float
    detected_on: date
    index_drop: float
    n_confirming_obs: int
    patch_px: int
    slope_deg: float
    aspect_deg: float
    water_index: float
    land_use_class: str
    days_since_prior_clear_obs: int


@dataclass(frozen=True)
class LabelledAlert:
    alert: AlertRecord
    truth: str          # real | shadow | seasonal | flood | harvest | terrain | sub_mmu


def diagnose_precision(labelled: list[LabelledAlert]) -> dict[str, object]:
    """Where the false positives actually come from, in order.

    The output of this function is a work plan. A pipeline whose false
    positives are 60% flooding does not need a better change detector; it
    needs a water mask, and it needs it before anything else is attempted.
    """
    if len(labelled) < 150:
        raise ValueError(
            f"{len(labelled)} labelled alerts is too few to apportion causes; "
            "interpret at least 150, sampled across seasons — a sample drawn "
            "from one month attributes everything to that month's artefact"
        )

    counts = Counter(l.truth for l in labelled)
    total = len(labelled)
    real = counts.get("real", 0)

    breakdown = {
        cause: {"n": n, "share_of_all": round(n / total, 3)}
        for cause, n in counts.most_common()
    }

    log.info(
        "alerts.diagnosed",
        n_labelled=total,
        precision=round(real / total, 3),
        leading_false_cause=next(
            (c for c, _ in counts.most_common() if c != "real"), None
        ),
    )

    return {
        "precision": real / total,
        "breakdown": breakdown,
        "recommended_order": [
            c for c, _ in counts.most_common() if c != "real"
        ],
    }


def estimate_control_impact(
    labelled: list[LabelledAlert], predicate, control_name: str
) -> dict[str, float]:
    """What a proposed control would remove, in both directions.

    `predicate` returns True for alerts the control would suppress. Both
    numbers matter: a control removing 70% of floods while also removing 15%
    of real detections is usually a bad trade, and reporting only the first
    number is how such controls get adopted.
    """
    suppressed = [l for l in labelled if predicate(l.alert)]
    real_lost = sum(1 for l in suppressed if l.truth == "real")
    false_removed = len(suppressed) - real_lost

    total_real = sum(1 for l in labelled if l.truth == "real")
    total_false = len(labelled) - total_real

    impact = {
        "false_removed_share": false_removed / total_false if total_false else 0.0,
        "real_lost_share": real_lost / total_real if total_real else 0.0,
        "n_suppressed": float(len(suppressed)),
    }

    log.info("control.evaluated", control=control_name, **impact)

    if impact["real_lost_share"] > 0.05:
        log.warning(
            "control.costly",
            control=control_name,
            real_lost_share=round(impact["real_lost_share"], 3),
            hint="a control removing >5% of true detections needs justifying "
                 "against what it buys",
        )

    return impact
```

Requiring both numbers from `estimate_control_impact` is the discipline that keeps this work honest. Every control removes some real detections, and a pipeline that reports only the reduction in alert volume will accumulate controls until it detects nothing and reports excellent precision.

<svg viewBox="0 -4 900 256" role="img" aria-labelledby="conf-t conf-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="conf-t">Confirmation count against precision and latency</title>
  <desc id="conf-d">A curve showing how requiring more confirming observations affects two quantities that move in opposite directions. With one observation, precision is low, around thirty percent, and median latency is short, a few days. With two observations precision rises sharply to around sixty percent and latency roughly doubles. With three observations precision reaches around eighty-five percent and latency reaches two to three weeks. With four, precision gains little more while latency continues to grow. Two operating points are marked: a low-confidence tier at one observation used for immediate triage, and a high-confidence tier at three observations used for reporting and enforcement. A panel notes that publishing both tiers is better than choosing one point on the curve, because the two uses have genuinely different requirements.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Precision and latency move in opposite directions — so publish two tiers</text>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="78" y1="44" x2="78" y2="196"/>
    <line x1="78" y1="196" x2="600" y2="196"/>
  </g>
  <path d="M130 172 L250 108 L370 66 L490 56 L580 52" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <path d="M130 184 L250 168 L370 140 L490 100 L580 62" fill="none" stroke="#f3a712" stroke-width="2.6" stroke-dasharray="7,4"/>
  <g fill="currentColor">
    <circle cx="130" cy="172" r="5"/><circle cx="370" cy="66" r="5"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">
    <text x="70" y="50" text-anchor="end" opacity="0.8">high</text>
    <text x="70" y="200" text-anchor="end" opacity="0.8">low</text>
    <text x="130" y="216" text-anchor="middle" opacity="0.8">1 obs</text>
    <text x="250" y="216" text-anchor="middle" opacity="0.8">2 obs</text>
    <text x="370" y="216" text-anchor="middle" opacity="0.8">3 obs</text>
    <text x="490" y="216" text-anchor="middle" opacity="0.8">4 obs</text>
    <text x="580" y="216" text-anchor="middle" opacity="0.8">5</text>
    <text x="339" y="238" text-anchor="middle" opacity="0.72">confirming observations required</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="616" y="56" fill="currentColor" font-weight="700">precision</text>
    <text x="616" y="72" fill="#f3a712" font-weight="700">latency</text>
    <text x="616" y="106" fill="currentColor" font-weight="700">Tier 1 — triage</text>
    <text x="616" y="122" fill="currentColor" opacity="0.78">1 obs, ~30% precision,</text>
    <text x="616" y="138" fill="currentColor" opacity="0.78">days — a patrol prompt</text>
    <text x="616" y="168" fill="currentColor" font-weight="700">Tier 2 — reporting</text>
    <text x="616" y="184" fill="currentColor" opacity="0.78">3 obs, ~85% precision,</text>
    <text x="616" y="200" fill="currentColor" opacity="0.78">2–3 weeks — defensible</text>
    <text x="616" y="230" fill="currentColor" opacity="0.72">one number cannot serve both</text>
  </g>
</svg>

## Deterministic Transformation Logic

The confirmation and exclusion logic is where the precision is actually won. Two design choices matter more than the specific thresholds: state is carried per pixel across observations rather than recomputed, and every suppression is recorded with its reason rather than silently dropped.

```python
from dataclasses import dataclass, replace
from datetime import date, timedelta


@dataclass(frozen=True)
class PixelState:
    """Running detection state for one pixel across observations.

    Carrying state rather than recomputing over a window makes the pipeline
    incremental, and it makes the confirmation count exactly reproducible:
    the same observations arriving in the same order always give the same
    state, regardless of how the run was batched.
    """
    lon: float
    lat: float
    candidate_since: date | None
    confirming_obs: int
    contradicting_obs: int
    last_obs: date | None


@dataclass(frozen=True)
class Suppression:
    alert_id: str
    control: str
    detail: str


CONTRADICTION_LIMIT = 2
CANDIDATE_EXPIRY_DAYS = 120


def update_state(
    state: PixelState,
    *,
    observed_on: date,
    index_value: float,
    seasonal_expectation: float,
    seasonal_tolerance: float,
) -> PixelState:
    """Advance one pixel's state by one clear observation.

    The comparison is against the pixel's own seasonal expectation, not a
    global threshold. A deciduous stand whose index legitimately halves each
    dry season has an expectation that halves with it, so the drop does not
    register as a candidate — while an evergreen neighbour's identical drop
    does.
    """
    departed = index_value < seasonal_expectation - seasonal_tolerance

    if state.candidate_since is not None:
        age = (observed_on - state.candidate_since).days
        if age > CANDIDATE_EXPIRY_DAYS:
            # A candidate that never confirmed within four months was noise.
            state = replace(
                state, candidate_since=None, confirming_obs=0, contradicting_obs=0
            )

    if departed:
        return replace(
            state,
            candidate_since=state.candidate_since or observed_on,
            confirming_obs=state.confirming_obs + 1,
            last_obs=observed_on,
        )

    if state.candidate_since is None:
        return replace(state, last_obs=observed_on)

    contradicting = state.contradicting_obs + 1
    if contradicting >= CONTRADICTION_LIMIT:
        # Recovered. Cloud shadow and transient haze end up here.
        return PixelState(state.lon, state.lat, None, 0, 0, observed_on)

    return replace(state, contradicting_obs=contradicting, last_obs=observed_on)


def apply_controls(
    alert: AlertRecord,
    *,
    min_patch_px: int,
    water_index_limit: float,
    excluded_land_use: frozenset[str],
    terrain_shadow_mask: bool,
) -> Suppression | None:
    """Return a suppression reason, or None if the alert survives.

    Returning the reason rather than a boolean is the point. A suppressed
    alert that is later found to have been real is traceable to the exact
    control that removed it, which is how controls get corrected instead of
    quietly accumulating.
    """
    if alert.patch_px < min_patch_px:
        return Suppression(
            alert.alert_id, "min_mapping_unit",
            f"{alert.patch_px} px below the {min_patch_px} px reportable unit",
        )

    if alert.water_index > water_index_limit:
        return Suppression(
            alert.alert_id, "flooding",
            f"water index {alert.water_index:.3f} above {water_index_limit}",
        )

    if alert.land_use_class in excluded_land_use:
        return Suppression(
            alert.alert_id, "land_use",
            f"class '{alert.land_use_class}' is excluded from alerting",
        )

    if terrain_shadow_mask:
        return Suppression(
            alert.alert_id, "terrain_shadow",
            f"slope {alert.slope_deg:.0f}° aspect {alert.aspect_deg:.0f}° "
            "in the seasonal shadow mask",
        )

    return None
```

The `CONTRADICTION_LIMIT` of two rather than one is deliberate and worth noting. A single clear observation showing recovery is often itself contaminated — thin cirrus that the mask missed reads as recovery — and cancelling a candidate on one contradicting observation loses real detections in cloudy regions. Requiring two makes cancellation as evidence-based as confirmation.

## Compliance Gating & Audit Trail Generation

An alert system used for enforcement or reporting needs to be able to state its own performance, and that means four records.

A precision estimate from a probability sample, refreshed periodically. Precision computed on the alerts a team happened to investigate is biased upward, because teams investigate the convincing ones. A random sample of alerts, interpreted blind, is the only estimate that survives scrutiny.

An omission estimate, which is harder and more important. Precision says how many alerts were right; it says nothing about how much clearing was missed. Estimating omission requires a reference sample drawn from the forest area rather than from the alerts, and it is the number that tells whether the controls have gone too far.

Every suppression with its control and reason. This is the record that lets an omission finding be traced to a cause — an over-aggressive floodplain mask shows up as a cluster of suppressed alerts that later proved real.

The mask and threshold versions in force for each alert. Controls change over time, and an alert generated under one configuration is not comparable to one generated under another. Stamping the configuration onto the alert makes a time series of alert counts interpretable, which it otherwise is not.

## Production Integration

The operating pattern that works is a two-tier publication with a shared pipeline: one detection engine, one state store, and two thresholds on the confirmation count. Tier one goes to field teams for triage and is understood to be noisy. Tier two goes into reporting, feeds the change layers described in [building real-time deforestation alerts using GEE and Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/building-real-time-deforestation-alerts-using-gee-and-python/), and is expected to be defensible.

Field verification of tier-one alerts is not merely an operational cost — it is the label source that keeps the whole system calibrated. A team that records outcomes against alert ids produces exactly the labelled sample the diagnostic above needs, at no extra cost, and a pipeline that does not close that loop is tuning blind after its first evaluation.

One caution about the seasonal expectation. It must be fitted on a period that contains no clearing at the pixel in question, or the expectation absorbs the clearing and the pixel stops alerting on similar events. In practice this means fitting on a historical window, checking that window against a change layer, and refitting only for pixels confirmed stable — which is the same discipline as [threshold tuning for carbon stock baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/) applies to its own thresholds.

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="loop-t loop-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="loop-t">The calibration loop that keeps precision from drifting</title>
  <desc id="loop-d">A cycle in four stages. The detection engine produces candidate alerts. Controls suppress some with recorded reasons, and the survivors publish at two confidence tiers. Field teams investigate tier one alerts and record outcomes against alert identifiers. Those outcomes become the labelled sample that re-estimates precision and re-evaluates every control, feeding back into the control configuration. A separate branch shows a reference sample drawn from the forest area rather than from the alerts, feeding an omission estimate that checks whether the controls have become too aggressive. A panel notes that a pipeline without the field feedback arrow is tuning blind after its first evaluation.</desc>
  <defs>
    <marker id="loop-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Field outcomes are the label source — close the loop or tune blind</text>
    <rect x="12" y="42" width="196" height="78" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="42" width="196" height="78" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="110" y="70" fill="currentColor" font-size="10" font-weight="700">Detection engine</text>
    <text x="110" y="90" fill="currentColor" font-size="8.5" opacity="0.8">per-pixel state,</text>
    <text x="110" y="106" fill="currentColor" font-size="8.5" opacity="0.8">seasonal expectation</text>
    <rect x="232" y="42" width="196" height="78" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="232" y="42" width="196" height="78" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="330" y="70" fill="currentColor" font-size="10" font-weight="700">Controls</text>
    <text x="330" y="90" fill="currentColor" font-size="8.5" opacity="0.8">every suppression keeps</text>
    <text x="330" y="106" fill="currentColor" font-size="8.5" opacity="0.8">its reason</text>
    <rect x="452" y="42" width="196" height="78" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="452" y="42" width="196" height="78" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="550" y="70" fill="currentColor" font-size="10" font-weight="700">Two tiers published</text>
    <text x="550" y="90" fill="currentColor" font-size="8.5" opacity="0.8">tier 1 → patrols</text>
    <text x="550" y="106" fill="currentColor" font-size="8.5" opacity="0.8">tier 2 → reporting</text>
    <rect x="672" y="42" width="216" height="78" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="672" y="42" width="216" height="78" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="780" y="70" fill="currentColor" font-size="10" font-weight="700">Field outcomes</text>
    <text x="780" y="90" fill="currentColor" font-size="8.5" opacity="0.8">recorded against alert ids —</text>
    <text x="780" y="106" fill="currentColor" font-size="8.5" opacity="0.8">the labelled sample, free</text>
    <rect x="232" y="182" width="416" height="62" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="232" y="182" width="416" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="440" y="206" fill="currentColor" font-size="10" font-weight="700">Reference sample from the forest area</text>
    <text x="440" y="228" fill="currentColor" font-size="9" opacity="0.85">not from the alerts — the only way to see what the controls removed</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#loop-arrow)">
    <line x1="208" y1="81" x2="230" y2="81"/><line x1="428" y1="81" x2="450" y2="81"/>
    <line x1="648" y1="81" x2="670" y2="81"/>
    <path d="M780 120 L780 156 L330 156 L330 122"/>
    <path d="M440 180 L440 158"/>
  </g>
  <text x="556" y="174" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">re-evaluate every control against the new labels</text>
</svg>

## Frequently Asked Questions

### What precision should an operational alert system reach?

For a high-confidence tier intended for reporting, above eighty percent is a reasonable expectation in most forest types and above ninety is achievable where the artefact mix is favourable. For a triage tier the useful target is different — it is not precision but the rate at which field teams find the effort worthwhile, which in practice bottoms out around one useful alert in three or four. Below that, teams stop responding, and the system's effective precision becomes zero regardless of what the metric says.

### Does a minimum mapping unit filter discard real deforestation?

Yes, by construction, and that is usually correct. A single-pixel clearing is below the reliable detection limit of the imagery, so most single-pixel detections are noise even though some are real. The important thing is that the choice is explicit and its cost is quantified: report the estimated area lost to the filter, from the labelled sample, rather than leaving it as an unstated omission. Where small clearings genuinely matter — smallholder mosaics, selective logging — the answer is higher-resolution imagery rather than a lower filter on coarse imagery.

### How should the seasonal expectation be built for a pixel with a short history?

Borrow from a similar pixel rather than falling back to a global threshold. Pixels sharing forest type, elevation band, and aspect have similar seasonal behaviour, so a class-level expectation is a reasonable stand-in until the pixel accumulates its own history. Mark alerts generated against a borrowed expectation as lower confidence, because the borrowing is a modelling assumption and it is the assumption most likely to be wrong in a transitional stand.

### Is combining radar and optical detections worth the complexity?

In persistently cloudy regions it is the difference between a working system and a seasonal one, and the combination is more than additive: an event detected independently by two sensors with unrelated failure modes is far more likely to be real than one detected twice by the same sensor. The complexity is real — radar change detection has its own artefacts, particularly around soil moisture — but combining them as independent confirming evidence rather than merging them into one index keeps the logic simple and the confirmation semantics clear.

### What causes a sudden jump in the alert rate that is not deforestation?

Most commonly an upstream change: a new collection version with different atmospheric correction, a cloud mask update, or a sensor added to the input mix. All three shift the index distribution slightly, and a fixed threshold sitting near the middle of that shift converts a small change in reflectance into a large change in alert count. This is why configuration and input versions should be stamped on each alert — the diagnostic becomes a one-line query instead of a week.

### Should suppressed alerts be stored or discarded?

Stored, indefinitely, with their suppression reason. They are small, and they are the only evidence available when someone asks whether a clearing the system missed was ever detected. A suppressed alert that turns out to have been real is also the most valuable single piece of tuning information available, because it identifies a control that is too aggressive at a specific location, which no aggregate metric will reveal.

### How often should the controls be re-evaluated?

At least annually, and after any upstream change. Land use masks go stale as plantations are established and parcels change hands, floodplain extents shift, and the mix of clearing types in a landscape evolves. A control set that was correct three years ago and has not been checked since is a plausible explanation for an unexplained drop in detections, and re-running the impact estimate against a fresh labelled sample is a day's work.

## Related guides

- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — the parent topic and the detection engine this tuning wraps.
- [Building Real-Time Deforestation Alerts Using GEE and Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/building-real-time-deforestation-alerts-using-gee-and-python/) — the pipeline these controls attach to.
- [Troubleshooting Cloud Shadow False Positives in Sentinel-2](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/troubleshooting-cloud-shadow-false-positives-in-sentinel-2/) — the masking layer that removes the largest single false-positive cause.
- [Tuning Canopy Cover Thresholds for Forest Baselines](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/threshold-tuning-for-carbon-stock-baselines/tuning-canopy-cover-thresholds-for-forest-baselines/) — the same precision-omission trade applied to the forest definition itself.
