---
shortTitle: "MRV Pipeline Observability & Failure Modes"
title: "MRV Pipeline Observability & Failure Modes"
description: "Instrumenting carbon pipelines so silent corruption is visible: the four signal classes an MRV run must emit, why traditional monitoring misses spatial failures, and a deterministic observability layer in Python."
slug: mrv-pipeline-observability-and-failure-modes
type: topic
breadcrumb: "Observability & Failure Modes"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# MRV Pipeline Observability & Failure Modes

Observability for MRV pipelines is the discipline of making silent corruption loud. It sits inside the [pipeline orchestration and compliance reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack alongside [orchestrating MRV data pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/), and it exists because carbon pipelines fail in a way ordinary data pipelines do not. A web service fails loudly: requests error, latency spikes, an alert fires. A carbon pipeline fails quietly — every task returns success, every partition is written, every dashboard is green, and the reported tonnage is thirty per cent wrong because a transformation grid went missing and PROJC silently fell back to a null transformation. Nothing crashed. The number is simply not true.

That asymmetry drives everything here. Standard observability watches whether the *machinery* ran. MRV observability must watch whether the *result is still the kind of thing it was yesterday* — the same geometry conventions, the same value distributions, the same relationship between inputs and outputs — and it must record enough to reconstruct the answer years later.

<svg viewBox="0 -4 940 276" role="img" aria-labelledby="obs-t obs-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="obs-t">Four signal classes an MRV run must emit, and what each one catches</title>
  <desc id="obs-d">A pipeline run emits four parallel signal classes. Operational signals — task status, duration, and retries — catch crashes and timeouts. Data signals — row counts, null rates, and value distributions — catch truncation and schema drift. Spatial signals — coordinate reference system, bounding box, geometry validity, and area totals — catch datum shifts, anti-meridian wrapping, and projection drift. Provenance signals — input digests, code version, factor-set version, and parameters — catch irreproducibility. A panel notes that only operational signals are emitted by a default orchestrator, and that the three silent failure classes live entirely in the other three.</desc>
  <defs>
    <marker id="obs-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="10" y="96" width="132" height="72" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="10" y="96" width="132" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <text x="76" y="126" fill="currentColor" font-size="11.5" font-weight="700">MRV run</text>
    <text x="76" y="146" fill="currentColor" font-size="9.5" opacity="0.78">one tile-month</text>
    <rect x="216" y="10" width="242" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="337" y="32" fill="currentColor" font-size="10.5" font-weight="700">Operational</text>
    <text x="337" y="50" fill="currentColor" font-size="9.5" opacity="0.78">status · duration · retries · queue depth</text>
    <rect x="216" y="78" width="242" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="337" y="100" fill="currentColor" font-size="10.5" font-weight="700">Data</text>
    <text x="337" y="118" fill="currentColor" font-size="9.5" opacity="0.78">row counts · null rate · distributions</text>
    <rect x="216" y="146" width="242" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="337" y="168" fill="currentColor" font-size="10.5" font-weight="700">Spatial</text>
    <text x="337" y="186" fill="currentColor" font-size="9.5" opacity="0.78">CRS · bbox · validity · area totals</text>
    <rect x="216" y="214" width="242" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="337" y="236" fill="currentColor" font-size="10.5" font-weight="700">Provenance</text>
    <text x="337" y="254" fill="currentColor" font-size="9.5" opacity="0.78">input digests · code &amp; factor versions</text>
    <rect x="514" y="10" width="196" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.85"/>
    <text x="612" y="32" fill="currentColor" font-size="9.5" font-weight="700">catches crashes, timeouts</text>
    <text x="612" y="50" fill="currentColor" font-size="9" opacity="0.72">the only class most tools ship</text>
    <rect x="514" y="78" width="196" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.85"/>
    <text x="612" y="100" fill="currentColor" font-size="9.5" font-weight="700">catches truncation, drift</text>
    <text x="612" y="118" fill="currentColor" font-size="9" opacity="0.72">half a tile is still a success</text>
    <rect x="514" y="146" width="196" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.85"/>
    <text x="612" y="168" fill="currentColor" font-size="9.5" font-weight="700">catches datum shifts</text>
    <text x="612" y="186" fill="currentColor" font-size="9" opacity="0.72">anti-meridian · projection drift</text>
    <rect x="514" y="214" width="196" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.85"/>
    <text x="612" y="236" fill="currentColor" font-size="9.5" font-weight="700">catches irreproducibility</text>
    <text x="612" y="254" fill="currentColor" font-size="9" opacity="0.72">the audit-time failure</text>
    <rect x="756" y="80" width="176" height="120" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="756" y="80" width="176" height="120" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="844" y="106" fill="currentColor" font-size="10.5" font-weight="700">Silent failures</text>
    <text x="844" y="128" fill="#f3a712" font-size="22" font-weight="700">3 of 4</text>
    <text x="844" y="150" fill="currentColor" font-size="9.5" opacity="0.8">classes are invisible to</text>
    <text x="844" y="166" fill="currentColor" font-size="9.5" opacity="0.8">a default orchestrator</text>
    <text x="844" y="188" fill="currentColor" font-size="9" opacity="0.7">green dashboard, wrong tonnage</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#obs-arrow)">
    <path d="M142 112 C 180 100, 182 42, 214 37"/>
    <path d="M142 124 C 180 118, 182 106, 214 105"/>
    <path d="M142 140 C 180 146, 182 168, 214 173"/>
    <path d="M142 152 C 180 164, 182 236, 214 241"/>
    <line x1="458" y1="37" x2="512" y2="37"/>
    <line x1="458" y1="105" x2="512" y2="105"/>
    <line x1="458" y1="173" x2="512" y2="173"/>
    <line x1="458" y1="241" x2="512" y2="241"/>
  </g>
</svg>

## Role in the MRV Workflow

Observability is not a stage in the pipeline; it is a cross-cutting layer that every stage writes to and that three different audiences read. Operators read it to know whether last night's run finished. Analysts read it to know whether this month's numbers are comparable to last month's. Verifiers read it — often years later — to reconstruct how a specific figure was produced. Those three audiences need different retention, different granularity, and different guarantees, and a design that serves only the first is the normal starting point and the normal cause of an unpleasant audit.

The layer's upstream dependency is that every stage emits structured events rather than prose logs. A line reading `Processed tile N00E010` is not observability; it cannot be aggregated, compared across runs, or queried by a verifier. An event carrying `tile_id`, `period`, `crs`, `feature_count`, `area_ha`, `input_digest`, and `code_version` can do all three. Its downstream consumers are the alerting path, the run-comparison dashboards, and — critically — the evidence store that feeds [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/).

The most useful mental model is that MRV observability watches four signal classes, of which a default orchestrator emits only the first. **Operational** signals say whether the machinery ran. **Data** signals say whether the output has the shape and distribution it should. **Spatial** signals say whether the geometry still means what it meant — the CRS, the bounding box, the validity rate, the total area. **Provenance** signals say whether the run can be reproduced. The three silent failure classes that damage carbon numbers live entirely in the last three, which is why bolting a generic monitoring stack onto an MRV pipeline produces confident, uninformative dashboards.

## Core Failure Modes

1. **Success-with-wrong-answer, caused by a silent fallback.** The archetype is a missing NTv2 or NADCON transformation grid: PROJ cannot find the grid, falls back to a null transformation, and returns coordinates that are systematically shifted by tens of metres. No exception is raised, no task fails, and downstream area calculations are wrong by whatever fraction of each parcel crossed a boundary. The same shape recurs elsewhere — a resampling algorithm silently defaulting to nearest-neighbour on continuous data, a timezone-naive timestamp assumed to be UTC, a join that matched on a truncated identifier. All are invisible to operational monitoring and all are caught by a spatial or distributional invariant. This is the failure documented in depth under [debugging silent datum shifts in carbon pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/debugging-silent-datum-shifts-in-carbon-pipelines/).

2. **Partial-output success.** A distributed tile job loses a worker; the framework retries, the retry succeeds, and the run reports completion — with 94% of the tiles. Row counts are down 6%, which nobody notices because nobody compares them to the previous period. Total reported sequestration falls proportionally and is interpreted as a real decline. The defence is an explicit completeness assertion: the expected tile set is computed *before* the run from the acquisition catalogue, and the run fails if the written set does not match it. Never infer completeness from the absence of errors.

3. **Alert fatigue collapsing into alert blindness.** The opposite failure, and the more common one after a team takes observability seriously. Every stage gains a threshold, every threshold fires occasionally, and within two months the channel is muted. The root cause is treating all deviations as equal. MRV signals divide cleanly into *invariants* that must never be violated and should page — CRS identity, geometry validity, completeness, monotonic lineage — and *indicators* that drift and should be trended rather than alerted, like mean cloud fraction or per-tile runtime. Mixing them destroys both.

<svg viewBox="0 -4 900 296" role="img" aria-labelledby="drift-t drift-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="drift-t">A silent datum shift as seen by operational monitoring and by a spatial invariant</title>
  <desc id="drift-d">Two stacked timelines over twelve monthly runs. The upper timeline, operational monitoring, shows twelve consecutive green success markers with steady runtimes — the failure is completely invisible. The lower timeline, a spatial invariant tracking total project area in hectares, is flat at 50120 hectares for seven runs, then steps to 48630 at run eight and stays there. The step of 1490 hectares, about 3 percent, coincides with a transformation-grid package upgrade marked on the axis. An annotation notes the shift was detected the same day by the area invariant and would otherwise have surfaced at the following year's verification.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The same twelve runs, seen two ways</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">A grid package upgrade at run 8 shifted every coordinate. Task status never noticed.</text>
    <text x="12" y="66" fill="currentColor" font-size="10" font-weight="700">Operational monitoring</text>
    <text x="12" y="82" fill="currentColor" font-size="9" opacity="0.7">task status · duration</text>
  </g>
  <g>
    <line x1="188" y1="74" x2="828" y2="74" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
    <circle cx="188" cy="74" r="6" fill="currentColor" opacity="0.55"/><circle cx="246" cy="74" r="6" fill="currentColor" opacity="0.55"/>
    <circle cx="304" cy="74" r="6" fill="currentColor" opacity="0.55"/><circle cx="362" cy="74" r="6" fill="currentColor" opacity="0.55"/>
    <circle cx="420" cy="74" r="6" fill="currentColor" opacity="0.55"/><circle cx="478" cy="74" r="6" fill="currentColor" opacity="0.55"/>
    <circle cx="536" cy="74" r="6" fill="currentColor" opacity="0.55"/><circle cx="594" cy="74" r="6" fill="currentColor" opacity="0.55"/>
    <circle cx="652" cy="74" r="6" fill="currentColor" opacity="0.55"/><circle cx="710" cy="74" r="6" fill="currentColor" opacity="0.55"/>
    <circle cx="768" cy="74" r="6" fill="currentColor" opacity="0.55"/><circle cx="826" cy="74" r="6" fill="currentColor" opacity="0.55"/>
    <text x="844" y="78" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.7">all green</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="150" fill="currentColor" font-size="10" font-weight="700">Spatial invariant</text>
    <text x="12" y="166" fill="currentColor" font-size="9" opacity="0.7">total project area, ha</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.25">
    <line x1="188" y1="130" x2="828" y2="130"/>
    <line x1="188" y1="190" x2="828" y2="190"/>
    <line x1="188" y1="250" x2="828" y2="250"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="188" y1="120" x2="188" y2="256"/>
    <line x1="188" y1="256" x2="828" y2="256"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="180" y="134" text-anchor="end">50 500</text>
    <text x="180" y="194" text-anchor="end">49 500</text>
    <text x="180" y="254" text-anchor="end">48 500</text>
    <text x="188" y="276" text-anchor="middle">r1</text>
    <text x="420" y="276" text-anchor="middle">r5</text>
    <text x="594" y="276" text-anchor="middle">r8</text>
    <text x="826" y="276" text-anchor="middle">r12</text>
  </g>
  <polyline points="188,152 246,152 304,152 362,152 420,152 478,152 536,152 594,241 652,241 710,241 768,241 826,241" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <line x1="594" y1="120" x2="594" y2="252" stroke="#f3a712" stroke-width="1.6" stroke-dasharray="4,3"/>
  <circle cx="594" cy="241" r="6" fill="none" stroke="#f3a712" stroke-width="2.4"/>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="606" y="140" fill="#f3a712" font-weight="700">grid package upgrade</text>
    <text x="606" y="156" fill="currentColor" opacity="0.78">−1 490 ha (−3.0%) in one step</text>
    <text x="606" y="172" fill="currentColor" opacity="0.78">paged the same day</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The module below is the observability layer as a reusable contract rather than scattered logging calls. It defines the invariants, computes the four signal classes from an output artefact, compares them against the previous run, and raises on invariant violation while merely trending indicators. It emits structured `structlog` events and OpenTelemetry span attributes from the same values, so the operator dashboard and the audit record cannot disagree.

```python
import hashlib
import json
from dataclasses import dataclass, asdict, field

import geopandas as gpd
import numpy as np
import structlog
from opentelemetry import trace

log = structlog.get_logger()
tracer = trace.get_tracer("mrv.pipeline")

CANONICAL_CRS = "EPSG:6933"
AREA_DRIFT_INVARIANT = 0.005     # 0.5% — a geometry change this large is never benign
NULL_RATE_INDICATOR = 0.02       # trended, not paged


class InvariantViolation(RuntimeError):
    """Raised when a signal that must NEVER move has moved. Always pages."""


@dataclass(frozen=True)
class RunSignals:
    """The four classes, computed from the artefact itself — never asserted by the
    stage that produced it. A stage cannot be its own witness."""
    # operational
    run_id: str
    stage: str
    duration_s: float
    retries: int
    # data
    feature_count: int
    null_rate: float
    value_p50: float
    value_p99: float
    # spatial
    crs: str
    bbox: tuple[float, float, float, float]
    invalid_geometry_count: int
    total_area_ha: float
    # provenance
    input_digest: str
    code_version: str
    factor_set_version: str
    parameters: dict = field(default_factory=dict)


def digest_inputs(paths: list[str]) -> str:
    """Content digest over the input set. Two runs with the same digest and the
    same code version must produce the same answer — that is the whole claim."""
    h = hashlib.sha256()
    for path in sorted(paths):
        with open(path, "rb") as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b""):
                h.update(chunk)
    return h.hexdigest()[:32]


def observe(
    gdf: gpd.GeoDataFrame, value_column: str, *, run_id: str, stage: str,
    duration_s: float, retries: int, input_paths: list[str],
    code_version: str, factor_set_version: str, parameters: dict,
) -> RunSignals:
    if gdf.crs is None:
        raise InvariantViolation(f"{stage}: output carries no CRS")

    # Area is computed in the canonical equal-area CRS regardless of the output's
    # own projection, so the invariant is comparable across runs and stages.
    equal_area = gdf.to_crs(CANONICAL_CRS)
    values = gdf[value_column].to_numpy(dtype="float64")

    signals = RunSignals(
        run_id=run_id, stage=stage, duration_s=round(duration_s, 2), retries=retries,
        feature_count=len(gdf),
        null_rate=float(np.isnan(values).mean()),
        value_p50=float(np.nanpercentile(values, 50)),
        value_p99=float(np.nanpercentile(values, 99)),
        crs=gdf.crs.to_string(),
        bbox=tuple(round(float(b), 3) for b in gdf.total_bounds),
        invalid_geometry_count=int((~gdf.geometry.is_valid).sum()),
        total_area_ha=round(float(equal_area.geometry.area.sum()) / 10_000.0, 3),
        input_digest=digest_inputs(input_paths), code_version=code_version,
        factor_set_version=factor_set_version, parameters=parameters,
    )

    with tracer.start_as_current_span(f"mrv.{stage}") as span:
        for key, value in asdict(signals).items():
            span.set_attribute(f"mrv.{key}",
                               json.dumps(value) if isinstance(value, (dict, tuple, list))
                               else value)
    log.info("mrv.signals", **asdict(signals))
    return signals


def compare_to_previous(current: RunSignals, previous: RunSignals | None) -> list[str]:
    """Invariants raise. Indicators are returned as trend notes for the dashboard.

    The split is the whole design: everything that pages must be something that
    is never allowed to move, or the channel gets muted within two months.
    """
    if previous is None:
        log.info("mrv.baseline.established", run_id=current.run_id, stage=current.stage)
        return []

    # --- invariants: violation is always a page -----------------------------
    if current.crs != previous.crs:
        raise InvariantViolation(
            f"{current.stage}: CRS changed {previous.crs} -> {current.crs}")
    if current.invalid_geometry_count > 0:
        raise InvariantViolation(
            f"{current.stage}: {current.invalid_geometry_count} invalid geometries")

    area_drift = abs(current.total_area_ha - previous.total_area_ha) / max(
        previous.total_area_ha, 1e-9)
    if area_drift > AREA_DRIFT_INVARIANT:
        # The datum-shift detector. Coordinates moved without the boundary changing.
        raise InvariantViolation(
            f"{current.stage}: total area drifted {area_drift:.3%} "
            f"({previous.total_area_ha} -> {current.total_area_ha} ha) — "
            "check transformation grids and the resampling algorithm")

    if current.input_digest == previous.input_digest and \
            current.code_version == previous.code_version and \
            current.value_p50 != previous.value_p50:
        raise InvariantViolation(
            f"{current.stage}: identical inputs and code produced a different result — "
            "the pipeline is not deterministic")

    # --- indicators: trended, never paged -----------------------------------
    notes = []
    if current.null_rate - previous.null_rate > NULL_RATE_INDICATOR:
        notes.append(f"null rate {previous.null_rate:.3f} -> {current.null_rate:.3f}")
    if current.duration_s > previous.duration_s * 1.5:
        notes.append(f"runtime {previous.duration_s}s -> {current.duration_s}s")
    if current.feature_count < previous.feature_count * 0.95:
        notes.append(f"feature count {previous.feature_count} -> {current.feature_count}")

    for note in notes:
        log.info("mrv.trend", stage=current.stage, run_id=current.run_id, note=note)
    return notes
```

Two design choices carry most of the value. **Signals are computed from the artefact, not asserted by the stage** — a task that reports its own row count reports what it believed it wrote, which is precisely the belief that is wrong in a partial-output failure. And **determinism is an invariant**: identical inputs plus identical code producing a different median is a hard failure, because it means some hidden state — a wall-clock timestamp, an unseeded random draw, an environment-dependent library default — has entered the computation and no reproduction claim can survive it.

Note the completeness check belongs alongside this, driven by the expected partition set rather than by the run's own output, in the pattern described under [building idempotent backfills for carbon pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/).

## Validation, Debugging & Compliance Mapping

- **Invariant events → ISO 14064-3 data-quality controls.** A verifier asking what controls prevent undetected data corruption wants a named, tested control with evidence that it fired. The invariant set above is that control, and the log of its violations — including the ones caught in staging — is the evidence. A pipeline with no recorded invariant violations in two years is either exceptionally disciplined or not actually checking.
- **Provenance signals → reproducibility claims.** The input digest, code version, and factor-set version together make the reproduction claim testable. Store them beside the output, not only in the log, so a replay does not depend on log retention. This is the same contract enforced by the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/).
- **Trend indicators → materiality assessment.** Drifting indicators feed the materiality discussion rather than the alerting channel. A slowly rising null rate is not an incident, but it changes the uncertainty attached to the period's figure, and that belongs in the disclosure narrative examined under [mapping CSRD ESRS E1 disclosures to spatial MRV outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/).
- **Retention → the audit horizon, not the ops horizon.** Operational telemetry can expire in 30 days. Provenance and spatial signals must outlive the crediting period, which for forestry means decades. Route them to durable, append-only storage rather than the observability vendor's default tier — this is a budgeting decision that is much cheaper made at design time than after a verifier asks for 2027's bounding boxes in 2036.

Deciding which bucket a new signal belongs in is the recurring judgement call, and it has a single test that resolves almost every case.

<svg viewBox="0 -4 880 262" role="img" aria-labelledby="inv-t inv-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="inv-t">Deciding whether a new signal is a hard invariant or a trended indicator</title>
  <desc id="inv-d">A decision tree. Starting from a candidate signal, the first question asks whether any legitimate operation could ever change it. If no, a second question asks whether a violation would change a reported figure. If yes, the signal is an invariant that raises and pages, with examples of coordinate reference system identity, geometry validity, partition completeness, and determinism under identical inputs. If a violation would not change a reported figure, it becomes a build-time assertion rather than a runtime page. If a legitimate operation could change the signal, it is a trended indicator with examples of cloud fraction, runtime, null rate, and feature count, reported to the dashboard and never paged.</desc>
  <defs>
    <marker id="inv-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="12" y="98" width="140" height="56" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="12" y="98" width="140" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="82" y="122" fill="currentColor" font-size="11" font-weight="700">Candidate signal</text>
    <text x="82" y="140" fill="currentColor" font-size="9" opacity="0.75">what should it do?</text>
    <polygon points="300,66 424,126 300,186 176,126" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="300" y="120" fill="currentColor" font-size="9.5" font-weight="600">Could a legitimate</text>
    <text x="300" y="134" fill="currentColor" font-size="9.5" font-weight="600">operation change it?</text>
    <polygon points="552,20 660,64 552,108 444,64" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="552" y="60" fill="currentColor" font-size="9" font-weight="600">Would a violation move</text>
    <text x="552" y="73" fill="currentColor" font-size="9" font-weight="600">a reported figure?</text>
    <rect x="694" y="6" width="180" height="66" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="694" y="6" width="180" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.9"/>
    <text x="784" y="28" fill="currentColor" font-size="11" font-weight="700">Invariant — page</text>
    <text x="784" y="46" fill="currentColor" font-size="8.5" opacity="0.8">CRS identity · geometry validity</text>
    <text x="784" y="61" fill="currentColor" font-size="8.5" opacity="0.8">completeness · determinism</text>
    <rect x="694" y="94" width="180" height="58" rx="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3"/>
    <text x="784" y="116" fill="currentColor" font-size="10.5" font-weight="700">Build-time assertion</text>
    <text x="784" y="134" fill="currentColor" font-size="8.5" opacity="0.8">test suite, not the pager</text>
    <rect x="694" y="178" width="180" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="784" y="200" fill="currentColor" font-size="11" font-weight="700">Indicator — trend</text>
    <text x="784" y="218" fill="currentColor" font-size="8.5" opacity="0.8">cloud fraction · runtime</text>
    <text x="784" y="233" fill="currentColor" font-size="8.5" opacity="0.8">null rate · feature count</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#inv-arrow)">
    <line x1="152" y1="126" x2="174" y2="126"/>
    <path d="M380 96 C 420 78, 424 66, 442 64"/>
    <path d="M380 156 C 500 186, 600 200, 692 208"/>
    <line x1="660" y1="42" x2="692" y2="38"/>
    <path d="M600 92 C 640 104, 660 118, 692 121"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="9.5" font-weight="600">
    <text x="404" y="82" fill="currentColor" opacity="0.85">no</text>
    <text x="452" y="176" fill="currentColor" opacity="0.85">yes</text>
    <text x="664" y="22" fill="currentColor" opacity="0.85">yes</text>
    <text x="616" y="112" fill="currentColor" opacity="0.85">no</text>
  </g>
</svg>

## Frequently Asked Questions

### Why isn't standard APM enough for a carbon pipeline?

Application performance monitoring answers "did the machinery run, and how fast". That is one of the four signal classes and it is the class in which MRV pipelines rarely fail. The failures that damage carbon numbers — a silent datum shift, a partial write, a factor-table swap — leave every operational metric untouched. You need the data, spatial, and provenance classes as well, and those must be computed from the output artefact rather than reported by the code that produced it.

### What belongs in an invariant, and what belongs in a trend?

Ask whether a violation could ever be legitimate. A CRS change on an established pipeline never is, so it is an invariant. Geometry validity never is. A 3% jump in total project area for a boundary nobody edited never is. By contrast, mean cloud fraction rises in a wet season, runtime grows as the archive grows, and the null rate moves with sensor availability — all legitimate, so all trends. If you find yourself adding an exception to an invariant, it was an indicator all along.

### How do I detect a partial-output failure if every task reported success?

Compare the written partition set against an expected set computed independently — from the acquisition catalogue, the tile grid, and the period definition — before the run starts. Completeness is an assertion about a set, and it cannot be derived from the absence of errors. The same principle applies within a partition: assert the expected feature count range from the input, not from what the task believes it emitted.

### Should observability events go to the same store as lineage records?

They serve different queries and have different retention, so usually not the same store — but they must share identifiers. The run identifier, input digest, and code version should appear in both, so an operator investigating a spike and a verifier reconstructing a figure can join across them. Divergent identifiers between the ops stack and the evidence store are a surprisingly common and painful defect, usually discovered mid-audit.

### Who should own the invariant set?

The team that owns the numbers, not the team that owns the platform. Invariants encode domain knowledge — that a project boundary does not change area, that a categorical layer is never bilinearly resampled, that an emission factor table is monotonic in its version — and a platform team has no way to know which of those are true. In practice the healthy arrangement is that the pipeline authors define and own the invariants as code reviewed alongside the transformation logic, while the platform team owns the delivery: routing, retention, dashboards, and paging. When ownership is inverted, the invariant set drifts toward whatever is easy to measure rather than whatever matters, and you end up with excellent monitoring of disk usage and none of geometry.

A useful forcing function is to require a new invariant with every post-incident review. Each silent failure that reached production is, by definition, a failure the invariant set did not cover, and the fix is not only to correct the bug but to add the assertion that would have caught it. Over a couple of years this converges on a set that is specific to your data, your providers, and your failure history — which is far more valuable than any generic checklist, and considerably harder for a successor team to reconstruct from scratch.

### How much instrumentation overhead is acceptable?

For MRV work, more than teams expect. Computing the four signal classes costs one extra pass over the output plus one equal-area reprojection — typically low single-digit percentages of stage runtime, and negligible against the cost of the imagery processing itself. Digesting large inputs is the expensive part; cache digests by content-addressed path so an unchanged input is not re-hashed each run.

## Conclusion

MRV pipelines fail politely. They return success, write their partitions, and hand you a number that is wrong for a reason no operational dashboard can show. The remedy is to instrument the four signal classes, compute them from the artefact rather than trusting the producer, split hard invariants from soft indicators so the alerting channel stays credible, and retain the provenance signals for the audit horizon rather than the operations horizon. Continue with [instrumenting MRV pipelines with OpenTelemetry and structlog](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/instrumenting-mrv-pipelines-with-opentelemetry-and-structlog/) and the consolidated [failure mode catalog for spatial MRV pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/failure-mode-catalog-for-spatial-mrv-pipelines/).

## Related

- [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) — the parent section this layer belongs to.
- [Instrumenting MRV Pipelines with OpenTelemetry and structlog](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/instrumenting-mrv-pipelines-with-opentelemetry-and-structlog/) — the wiring, span design, and log schema in code.
- [Failure Mode Catalog for Spatial MRV Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/failure-mode-catalog-for-spatial-mrv-pipelines/) — the cross-stage catalogue with diagnostics for each entry.
- [Orchestrating MRV Data Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) — the coordination layer these signals are emitted from.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — where provenance signals become audit evidence.
