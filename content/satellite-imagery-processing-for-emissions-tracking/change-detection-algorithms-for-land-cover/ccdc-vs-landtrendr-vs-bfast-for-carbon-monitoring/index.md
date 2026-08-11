---
shortTitle: "CCDC vs LandTrendr vs BFAST for Carbon Monitoring"
title: "CCDC vs LandTrendr vs BFAST for Carbon Monitoring"
description: "A decision guide to time-series change detection for carbon MRV: what each algorithm can and cannot see, observation requirements, latency, and which to run for alerting, baselines, and degradation."
slug: ccdc-vs-landtrendr-vs-bfast-for-carbon-monitoring
type: guide
breadcrumb: "CCDC vs LandTrendr vs BFAST"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# CCDC vs LandTrendr vs BFAST for Carbon Monitoring

Three time-series change-detection algorithms dominate forest carbon work, and choosing between them by published accuracy figures is the wrong method — the figures are computed on different landscapes, against different reference data, for different kinds of change. The useful comparison asks what each algorithm is structurally capable of seeing, what it demands of the observation record, and when in the monitoring cycle its answer arrives. This guide sits within [change detection algorithms for land cover](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/) in the [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack.

The short version is that they answer different questions. **CCDC** fits a continuous seasonal model per pixel and flags breaks as they occur, which makes it the natural alerting engine. **LandTrendr** segments an annual trajectory retrospectively into straight-line pieces, which makes it the natural tool for characterising historical disturbance and recovery. **BFAST** decomposes a series into trend and season and detects breaks in either, which makes it the tool that can see gradual degradation the other two under-report. A programme that runs one of them has a blind spot; a programme that runs all three without knowing why has three times the operational cost and no more coverage.

<svg viewBox="0 -4 940 266" role="img" aria-labelledby="alg3-t alg3-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="alg3-t">What each algorithm is structurally able to detect</title>
  <desc id="alg3-d">A grid of four change types against three algorithms. Abrupt clearing that persists is detected strongly by CCDC, strongly by LandTrendr but only at annual resolution, and strongly by BFAST. Gradual multi-year degradation is detected weakly by CCDC because the seasonal model absorbs it, strongly by LandTrendr through its segment slopes, and strongly by BFAST through its trend component. Post-disturbance recovery is detected adequately by CCDC through segment refitting, strongly by LandTrendr which was designed for it, and adequately by BFAST. A seasonal amplitude change with no level shift is detected adequately by CCDC through its harmonic coefficients, weakly by LandTrendr which uses annual composites, and strongly by BFAST through its seasonal component. A panel notes that no single column is strong everywhere.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">No column is strong everywhere</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Structural capability, not published accuracy on someone else's landscape.</text>
    <text x="558" y="60" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">CCDC</text>
    <text x="712" y="60" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">LandTrendr</text>
    <text x="858" y="60" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">BFAST</text>
    <rect x="12" y="70" width="916" height="42" rx="6" fill="currentColor" opacity="0.06"/>
    <text x="28" y="88" fill="currentColor" font-size="10" font-weight="700">Abrupt clearing, persistent</text>
    <text x="28" y="104" fill="currentColor" font-size="9" opacity="0.75">the case every method was built for</text>
    <text x="558" y="96" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700">strong</text>
    <text x="712" y="96" text-anchor="middle" fill="currentColor" font-size="9.5">strong, annual only</text>
    <text x="858" y="96" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700">strong</text>
    <rect x="12" y="118" width="916" height="42" rx="6" fill="currentColor" opacity="0.06"/>
    <text x="28" y="136" fill="currentColor" font-size="10" font-weight="700">Gradual degradation</text>
    <text x="28" y="152" fill="currentColor" font-size="9" opacity="0.75">the case that carries most under-reported emissions</text>
    <text x="558" y="144" text-anchor="middle" fill="#f3a712" font-size="9.5" font-weight="700">weak</text>
    <text x="712" y="144" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700">strong</text>
    <text x="858" y="144" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700">strong</text>
    <rect x="12" y="166" width="916" height="42" rx="6" fill="currentColor" opacity="0.06"/>
    <text x="28" y="184" fill="currentColor" font-size="10" font-weight="700">Recovery after disturbance</text>
    <text x="28" y="200" fill="currentColor" font-size="9" opacity="0.75">needed for permanence and regrowth crediting</text>
    <text x="558" y="192" text-anchor="middle" fill="currentColor" font-size="9.5">adequate</text>
    <text x="712" y="192" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700">strong</text>
    <text x="858" y="192" text-anchor="middle" fill="currentColor" font-size="9.5">adequate</text>
    <rect x="12" y="214" width="916" height="42" rx="6" fill="currentColor" opacity="0.06"/>
    <text x="28" y="232" fill="currentColor" font-size="10" font-weight="700">Seasonal amplitude change, no level shift</text>
    <text x="28" y="248" fill="currentColor" font-size="9" opacity="0.75">cropping and management change</text>
    <text x="558" y="240" text-anchor="middle" fill="currentColor" font-size="9.5">adequate</text>
    <text x="712" y="240" text-anchor="middle" fill="#f3a712" font-size="9.5" font-weight="700">weak</text>
    <text x="858" y="240" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700">strong</text>
  </g>
</svg>

## Root Cause Analysis

The capability differences follow directly from what each algorithm assumes about the series.

**CCDC models the seasonal cycle and asks whether the next observation fits.** Because the model is refitted after every confirmed break, it works on a dense sub-annual series and reports breaks days to weeks after they occur. The structural weakness is exactly its strength inverted: a change slow enough for the model to absorb into a drifting coefficient never produces a break. Degradation that removes five per cent of canopy a year is, to a continuously refitted seasonal model, indistinguishable from a slightly different forest.

**LandTrendr fits straight-line segments to an annual trajectory.** Segmentation is retrospective and global over the series, so it sees the whole history at once and can identify a multi-year decline as a single sloped segment — which is precisely the degradation case CCDC misses. The costs are latency and resolution: LandTrendr needs the years to have happened, and because it consumes annual composites it cannot say when within a year a disturbance occurred, nor detect a change that leaves the annual composite unmoved.

**BFAST decomposes the series into trend, season, and remainder, then tests each for breaks.** Because trend and season are separated, it can flag a change in seasonal amplitude with no level shift, and a trend break with no seasonal change — two things the other methods conflate. The cost is sensitivity to the decomposition's assumptions and a higher observation requirement, since fitting both components well needs a denser, longer record than fitting either alone.

The practical consequence is that the choice is driven by the change you are accountable for detecting, and most carbon programmes are accountable for more than one.

## Diagnostic Pipeline / Pre-Flight Validation

Whichever algorithm you choose, its observation requirement is the first thing to check — running a method on a series too thin for it produces confident output with no basis. The requirements differ by roughly a factor of five between the three.

```python
from dataclasses import dataclass

import numpy as np
import structlog

log = structlog.get_logger()

# Minimum usable series per method. These are structural, not conservative:
# below them the fit is under-constrained and reports artefacts as breaks.
REQUIREMENTS = {
    "ccdc":       {"min_obs_per_year": 12, "min_years": 2,  "cadence": "sub-annual"},
    "landtrendr": {"min_obs_per_year": 1,  "min_years": 8,  "cadence": "annual"},
    "bfast":      {"min_obs_per_year": 18, "min_years": 3,  "cadence": "sub-annual"},
}


@dataclass(frozen=True)
class Feasibility:
    method: str
    obs_per_year: float
    years: float
    feasible: bool
    limiting: str | None


def assess(dates: np.ndarray, clear: np.ndarray) -> list[Feasibility]:
    """Which methods can honestly run on this pixel's record?

    Reported per method rather than as one verdict, because a landscape often
    supports LandTrendr and not CCDC — thin annual coverage over many years.
    """
    clear_dates = np.sort(dates[clear])
    if clear_dates.size < 2:
        return [Feasibility(m, 0.0, 0.0, False, "no_observations") for m in REQUIREMENTS]

    span_years = float((clear_dates[-1] - clear_dates[0])
                       / np.timedelta64(365, "D"))
    per_year = float(clear_dates.size / max(span_years, 1e-6))

    out = []
    for method, req in REQUIREMENTS.items():
        limiting = None
        if per_year < req["min_obs_per_year"]:
            limiting = "observation_density"
        elif span_years < req["min_years"]:
            limiting = "record_length"
        out.append(Feasibility(method, round(per_year, 1), round(span_years, 1),
                               limiting is None, limiting))

    log.info("changedetect.feasibility",
             obs_per_year=round(per_year, 1), years=round(span_years, 1),
             feasible=[f.method for f in out if f.feasible])
    return out


def recommend(feasible: list[Feasibility], accountable_for: set[str]) -> dict:
    """Map what you must detect onto what the record can support.

    `accountable_for` is a set drawn from {abrupt, degradation, recovery,
    seasonal}. The recommendation is the smallest set of methods covering it.
    """
    covers = {
        "ccdc": {"abrupt", "recovery"},
        "landtrendr": {"abrupt", "degradation", "recovery"},
        "bfast": {"abrupt", "degradation", "seasonal"},
    }
    available = {f.method for f in feasible if f.feasible}

    chosen, remaining = set(), set(accountable_for)
    for method in sorted(available, key=lambda m: -len(covers[m] & remaining)):
        gain = covers[method] & remaining
        if gain:
            chosen.add(method)
            remaining -= gain

    result = {"chosen": sorted(chosen), "uncovered": sorted(remaining),
              "unavailable": sorted(set(covers) - available)}
    if remaining:
        log.warning("changedetect.uncovered", **result,
                    note="the record cannot support detection of these change types")
    else:
        log.info("changedetect.recommendation", **result)
    return result
```

The `uncovered` field is the important output. A programme accountable for degradation over a landscape whose optical record supports only two clear observations a year cannot detect degradation with any of these methods, and the honest response is to say so and to invest in radar or in a longer baseline rather than to run a method outside its envelope.

<svg viewBox="0 -4 900 246" role="img" aria-labelledby="lat2-t lat2-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="lat2-t">When each algorithm's answer arrives, relative to the event</title>
  <desc id="lat2-d">A timeline from an event on the ground to the moment each method reports it. CCDC reports after enough consecutive anomalous clear observations accumulate, typically two to six weeks in a moderately cloudy setting. BFAST reports on a similar cadence when run in monitoring mode, slightly later because its decomposition needs more observations to stabilise. LandTrendr reports after the year has closed and the annual composite is built, between three and fifteen months later depending where in the year the event fell. A panel notes that latency is not a tuning parameter for LandTrendr — it is inherent to consuming annual composites — and that this alone decides which method can serve an alerting obligation.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Latency is structural, not a setting</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Time from an event on the ground to the method reporting it.</text>
    <text x="12" y="76" fill="currentColor" font-size="10" font-weight="700">CCDC</text>
    <text x="12" y="126" fill="currentColor" font-size="10" font-weight="700">BFAST monitor</text>
    <text x="12" y="176" fill="currentColor" font-size="10" font-weight="700">LandTrendr</text>
  </g>
  <line x1="150" y1="52" x2="150" y2="200" stroke="#f3a712" stroke-width="2" stroke-dasharray="5,4"/>
  <text x="150" y="46" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f3a712">event</text>
  <g>
    <rect x="150" y="60" width="96" height="24" rx="4" fill="currentColor" opacity="0.28"/>
    <text x="256" y="78" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">2–6 weeks</text>
    <rect x="150" y="110" width="132" height="24" rx="4" fill="currentColor" opacity="0.24"/>
    <text x="292" y="128" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">4–10 weeks</text>
    <rect x="150" y="160" width="588" height="24" rx="4" fill="#f3a712" opacity="0.3"/>
    <text x="748" y="178" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">3–15 months</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="150" y="216" text-anchor="middle">0</text>
    <text x="346" y="216" text-anchor="middle">3 months</text>
    <text x="542" y="216" text-anchor="middle">9 months</text>
    <text x="738" y="216" text-anchor="middle">15 months</text>
  </g>
  <text x="12" y="240" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.85">LandTrendr's latency cannot be tuned away — it consumes annual composites, so it waits for the year. That alone rules it out of alerting.</text>
</svg>

## Deterministic Transformation Logic

The pragmatic architecture runs a fast method for alerting and a retrospective method for the annual figure, reconciling them at period end. The orchestration below does exactly that, and — importantly — records which method produced each detection so a downstream consumer never mistakes an alert for a measured area.

```python
from dataclasses import dataclass, asdict

import numpy as np
import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class Detection:
    pixel_id: str
    method: str
    event_date: str
    change_type: str        # abrupt | degradation | recovery | seasonal
    magnitude: float
    confidence: float
    purpose: str            # alerting | measurement — never interchangeable


def run_monitoring(pixel_id: str, series, feasibility, accountable_for: set[str]) -> list[Detection]:
    """Fast path: run only the methods the record supports, for alerting.

    Each detection carries its purpose, because an alert and a measured area are
    different quantities and mixing them is a category error downstream.
    """
    plan = recommend(feasibility, accountable_for)
    detections: list[Detection] = []

    for method in plan["chosen"]:
        if method == "landtrendr":
            continue                      # retrospective; belongs in the annual pass
        for event in _detect(method, series):
            detections.append(Detection(
                pixel_id=pixel_id, method=method, event_date=event["date"],
                change_type=event["type"], magnitude=round(event["magnitude"], 4),
                confidence=round(event["confidence"], 3), purpose="alerting"))

    log.info("changedetect.monitoring", pixel_id=pixel_id,
             methods=plan["chosen"], detections=len(detections),
             uncovered=plan["uncovered"])
    return detections


def run_annual(pixel_id: str, series, alerts: list[Detection]) -> dict:
    """Retrospective pass over the closed year, then reconciliation.

    The annual pass is the measurement; the alerts were early warning. A large
    divergence means one of the two is miscalibrated and is worth investigating
    before either number is published.
    """
    measured = [Detection(
        pixel_id=pixel_id, method="landtrendr", event_date=e["date"],
        change_type=e["type"], magnitude=round(e["magnitude"], 4),
        confidence=round(e["confidence"], 3), purpose="measurement")
        for e in _detect("landtrendr", series)]

    alert_dates = {d.event_date[:7] for d in alerts if d.change_type == "abrupt"}
    measured_dates = {d.event_date[:7] for d in measured if d.change_type == "abrupt"}

    only_alert = alert_dates - measured_dates      # alerted, not confirmed by the annual pass
    only_measured = measured_dates - alert_dates   # measured, never alerted — the worse case

    reconciliation = {
        "pixel_id": pixel_id,
        "alerted": len(alert_dates),
        "measured": len(measured_dates),
        "alert_only": sorted(only_alert),
        "measured_only": sorted(only_measured),
        "agreement": round(len(alert_dates & measured_dates)
                           / max(len(alert_dates | measured_dates), 1), 3),
    }
    if only_measured:
        log.warning("changedetect.missed_by_alerting", **reconciliation,
                    note="events the fast path did not catch — check thresholds and masking")
    log.info("changedetect.annual", **reconciliation)
    return {"measured": [asdict(d) for d in measured], "reconciliation": reconciliation}


def _detect(method: str, series) -> list[dict]:
    """Dispatch to the method implementation. Kept behind one interface so the
    orchestration above does not need to know how any of them work."""
    raise NotImplementedError("wire to your CCDC / BFAST / LandTrendr implementation")
```

The reconciliation output is the part worth keeping. `measured_only` — events the annual pass found that alerting missed — is a direct measurement of the alerting path's recall, computed for free from data you already have, and it is far more informative than any published accuracy figure for the algorithm in the abstract.

## Compliance Gating & Audit Trail Generation

Three compliance points follow from the comparison.

**Method choice is a methodology parameter, not an engineering preference.** Some frameworks name acceptable algorithms or, more often, name required properties — a stated minimum mapping unit, a demonstrated accuracy assessment, a documented sensitivity analysis. Record the method, its version, and its parameters on every detection, and treat a method change as a restatement, since the same landscape re-analysed with a different algorithm produces a different history.

**Alerts and measurements must be distinguishable in the record.** The `purpose` field above exists for that reason. An alert is tuned for latency and recall on a coarse unit; a measured area is tuned for accuracy with a stratified assessment. Publishing an alert count as an area is a category error that a verifier will catch, and carrying the distinction as data makes it impossible to make by accident.

**Detection of degradation must be claimed only where it is possible.** A programme running only CCDC over a landscape and reporting no degradation is reporting the algorithm's blind spot, not the forest. Where the observation record cannot support a degradation-capable method, disclose that limitation alongside the figure and route it into the [emissions data quality validation gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/) as a completeness note rather than leaving it implicit.

## Production Integration

1. **List what you are accountable for detecting** — abrupt loss, degradation, recovery, seasonal change — before looking at any algorithm.
2. **Assess feasibility per pixel** from the actual clear-observation record, and record where no method is supported.
3. **Run a monitoring-capable method continuously** for alerting, tuned for recall within the response team's triage capacity.
4. **Run a retrospective method once per period** for the measured figure, tuned for area accuracy with a stratified assessment.
5. **Reconcile the two at period end** and treat `measured_only` as the alerting path's recall estimate.
6. **Record method, version, parameters, and purpose** on every detection, and disclose any change type the record cannot support.

For cost, the retrospective pass dominates because it re-reads the whole series; the monitoring pass touches only new observations. That asymmetry is why the cube layout described in [COG vs Zarr vs GeoParquet for MRV workloads](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/cog-vs-zarr-vs-geoparquet-for-mrv-workloads/) matters most for the annual run.

<svg viewBox="0 -4 880 240" role="img" aria-labelledby="rec-t3 rec-d3" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rec-t3">Reading the reconciliation between the alerting and measurement passes</title>
  <desc id="rec-d3">Three reconciliation outcomes with their interpretation. High agreement, above about 0.8, means both passes are calibrated and the alerting recall is good. A large alert-only set, where the fast pass flagged events the annual pass did not confirm, points at a permissive alerting threshold or residual cloud leaking into the fast path, and costs field-team time. A large measured-only set, where the annual pass found events the alerting never flagged, points at a threshold that is too strict, insufficient observations, or a change type the monitoring method cannot see, and is the more serious of the two because those events went unresponded. A panel notes that the measured-only count is a direct, free measurement of alerting recall.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The reconciliation is free recall measurement</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Computed from data you already have, per period.</text>
    <rect x="12" y="52" width="280" height="150" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="12" y="52" width="280" height="150" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Agreement &gt; 0.8</text>
    <text x="28" y="102" fill="currentColor" font-size="9.5" opacity="0.85">both passes calibrated</text>
    <text x="28" y="122" fill="currentColor" font-size="9.5" opacity="0.85">alerting recall is good</text>
    <text x="28" y="150" fill="currentColor" font-size="9.5" font-weight="700">no action</text>
    <text x="28" y="176" fill="currentColor" font-size="9" opacity="0.75">record it and move on</text>
    <rect x="300" y="52" width="280" height="150" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="300" y="52" width="280" height="150" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="316" y="76" fill="currentColor" font-size="10.5" font-weight="700">Large alert-only set</text>
    <text x="316" y="102" fill="currentColor" font-size="9.5" opacity="0.85">flagged, not confirmed</text>
    <text x="316" y="122" fill="currentColor" font-size="9.5" opacity="0.85">permissive threshold or</text>
    <text x="316" y="142" fill="currentColor" font-size="9.5" opacity="0.85">residual cloud in the fast path</text>
    <text x="316" y="170" fill="currentColor" font-size="9.5" font-weight="700">costs field-team time</text>
    <rect x="588" y="52" width="280" height="150" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="604" y="76" fill="currentColor" font-size="10.5" font-weight="700">Large measured-only set</text>
    <text x="604" y="102" fill="currentColor" font-size="9.5" opacity="0.85">found late, never alerted</text>
    <text x="604" y="122" fill="currentColor" font-size="9.5" opacity="0.85">threshold too strict, too few</text>
    <text x="604" y="142" fill="currentColor" font-size="9.5" opacity="0.85">observations, or a blind spot</text>
    <text x="604" y="170" fill="#f3a712" font-size="9.5" font-weight="700">these events went unresponded</text>
    <text x="12" y="228" fill="currentColor" font-size="9.5" opacity="0.85">Track both sets per period. A rising measured-only count is the earliest signal that the monitoring pass has drifted out of calibration.</text>
  </g>
</svg>

### How do these methods behave on radar rather than optical series?

Reasonably, with adjusted expectations. Radar backscatter is noisier per observation and responds to moisture as well as structure, so all three methods need more consecutive anomalies before a break is credible, and seasonal components pick up rainfall patterns as well as phenology. The compensating advantage is enormous: radar's observation density is unaffected by cloud, which frequently moves a landscape from "no method is feasible" to "CCDC and BFAST are both feasible". Where a programme is blocked on optical observation density, porting the same detector to radar is usually a better investment than tuning thresholds.

### Should the same method run at every pixel in a landscape?

Not necessarily, and forcing it wastes coverage. Observation density varies substantially across a landscape — terrain shadow, persistent orographic cloud, and swath overlap all matter — so the feasible method set genuinely differs pixel to pixel. Running the best feasible method per pixel and recording which one ran gives more coverage than picking the lowest common denominator, at the cost of a map whose confidence is spatially heterogeneous. That heterogeneity is real either way; carrying the method as a band makes it visible rather than hidden.

### What is the cheapest way to improve detection without changing the algorithm?

Improve the mask. Every one of these methods consumes a masked series, and residual cloud is the dominant source of false breaks while over-masking is the dominant source of infeasibility. A masking improvement propagates to all three methods at once, needs no re-tuning of detection thresholds, and typically buys more than any parameter change available inside the detector. The corollary is that a detection problem should always prompt an inspection of the masked fraction before anyone touches a threshold.

## Frequently Asked Questions

### Can one algorithm cover a whole carbon programme?

Only if the programme is accountable for one kind of change, which is unusual. Avoided-deforestation projects must detect abrupt clearing and, under most modern methodologies, degradation as well — and those two requirements point at different algorithms. Running one and disclosing the blind spot is defensible; running one and reporting its output as complete coverage is not.

### Why does CCDC struggle with gradual degradation?

Because it refits its model after every confirmed break and continuously updates its coefficients, so a slow decline is absorbed into a drifting fit rather than accumulating into a break. The behaviour is correct for its purpose — it prevents seasonal drift from firing constantly — and it means the method cannot see change that is slower than its adaptation. Detecting degradation needs a method that fits a trend explicitly and tests it, which is what LandTrendr's segment slopes and BFAST's trend component do.

### Does BFAST need more data than the others?

Yes, meaningfully so, because it fits trend and seasonal components separately and both need to be well constrained. As a rough guide it wants half again to twice CCDC's observation density over a comparable period, which puts it out of reach in persistently cloudy landscapes unless radar is fused in. Where the record supports it, it is the most informative of the three about *what kind* of change occurred, which matters when the accounting treatment differs by mechanism.

### How should results from two methods be combined?

By purpose rather than by voting. Use the monitoring method for alerting and the retrospective method for the measured figure, reconcile them, and report the reconciliation. Averaging or voting between methods that answer different questions produces a number belonging to neither and destroys the ability to explain what it means — and the explanation is what a verifier is assessing.

### What about newer or proprietary detection products?

Judge them on the same three axes: what change types can they structurally see, what observation record do they need, and when does the answer arrive. A product that cannot answer those, or whose algorithm version changes without notice, is usable as a corroborating signal and unusable as a system of record — the same conclusion as for hosted platforms generally, and for the same reproducibility reasons.

### How should the accuracy assessment differ between the two passes?

They need separate assessments, because they make different claims. The monitoring pass is assessed on detection — what fraction of real events it caught, at what latency, with what false-alert rate against the response team's capacity. The measurement pass is assessed on area, with a stratified, area-weighted estimate per class and a confidence interval. Applying the measurement assessment to the alerting stream produces an unflattering and meaningless number, since alerts were never tuned for area accuracy; applying the detection assessment to the annual figure says nothing about whether the reported hectares are right.

Budget for both, and size the reference samples separately. The detection assessment needs events, so it is stratified toward areas where change occurred; the area assessment needs a probability sample over the whole landscape including the unchanged majority. Reusing one sample for both is the shortcut that quietly invalidates whichever assessment it was not designed for.

### What happens to the historical record when an algorithm is upgraded?

It changes, which is why an upgrade is a restatement. A new algorithm version re-analysing the same archive will move break dates, add events the old version missed, and drop others — all without any change on the ground. The workable process is to run both versions over an overlap period, quantify the difference in detected area, disclose it, and adopt the new version at a period boundary with the difference recorded in lineage. Silently upgrading mid-period produces a series with a discontinuity nobody can explain, and it is discovered at exactly the wrong moment.

## Related guides

- [Change Detection Algorithms for Land Cover](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/) — the parent topic and the change-signature taxonomy.
- [Implementing CCDC Change Detection in Python](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/change-detection-algorithms-for-land-cover/implementing-ccdc-change-detection-in-python/) — the segmented harmonic implementation in full.
- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — where the monitoring-capable method is deployed.
- [Detecting Carbon Reversals from Satellite Time Series](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/detecting-carbon-reversals-from-satellite-time-series/) — the same statistical core pointed inward at an issued project.
