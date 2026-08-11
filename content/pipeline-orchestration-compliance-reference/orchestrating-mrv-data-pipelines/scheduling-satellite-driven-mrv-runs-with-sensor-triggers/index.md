---
shortTitle: "Scheduling Satellite-Driven MRV Runs with Sensor Triggers"
title: "Scheduling Satellite-Driven MRV Runs with Sensor Triggers"
description: "Replacing cron with data-arrival triggers in a satellite MRV pipeline: STAC-based sensing, late and reprocessed scenes, per-tile readiness conditions, and keeping a triggered pipeline reproducible."
slug: scheduling-satellite-driven-mrv-runs-with-sensor-triggers
type: guide
breadcrumb: "Sensor-Triggered Scheduling"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Scheduling Satellite-Driven MRV Runs with Sensor Triggers

A satellite MRV pipeline scheduled on a calendar spends most of its runs discovering that nothing new arrived, and occasionally discovers that something arrived and was missed. Neither outcome is expensive on its own; together they push teams toward running more often, which multiplies the wasted runs without closing the gap, because the underlying problem is that the pipeline's clock and the satellite's are unrelated. This guide covers replacing the clock with the data, within [orchestrating MRV data pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) in the [pipeline orchestration and compliance reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack.

The complication that makes satellite triggering different from ordinary event-driven work is that arrival is not a single event. A scene appears in a catalogue, then appears again reprocessed under a new baseline, then appears a third time when the provider reissues the collection. Meanwhile the pipeline's unit of work is usually a tile or a project area rather than a scene, and a tile is ready only when several scenes covering it have all arrived. A trigger design that fires per scene either runs the same tile repeatedly or runs it before its inputs are complete.

<svg viewBox="0 -4 940 262" role="img" aria-labelledby="trg-t trg-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="trg-t">Calendar scheduling against sensor triggering over one month</title>
  <desc id="trg-d">Two timelines over the same month. The upper timeline shows a daily cron schedule: thirty runs, of which twenty-four find no new data and exit immediately, four process data that arrived hours earlier, and two miss a scene that arrived just after the run started and will not be picked up until the following day. The lower timeline shows sensor triggering: six runs, each starting when a tile's inputs become complete, with no empty runs and no missed arrivals. A late reprocessed scene arriving three weeks after acquisition triggers a seventh run that reprocesses only the affected tile. A panel notes that the triggered pipeline does a fifth of the runs and has no window in which an arrival can be missed.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Thirty runs against six, and the six miss nothing</text>
    <text x="12" y="40" fill="currentColor" font-size="10" font-weight="700">Daily cron</text>
  </g>
  <line x1="120" y1="58" x2="900" y2="58" stroke="currentColor" stroke-width="1.4"/>
  <g fill="currentColor" opacity="0.35">
    <rect x="126" y="50" width="6" height="16"/><rect x="152" y="50" width="6" height="16"/><rect x="178" y="50" width="6" height="16"/><rect x="204" y="50" width="6" height="16"/><rect x="230" y="50" width="6" height="16"/><rect x="256" y="50" width="6" height="16"/><rect x="308" y="50" width="6" height="16"/><rect x="334" y="50" width="6" height="16"/><rect x="360" y="50" width="6" height="16"/><rect x="386" y="50" width="6" height="16"/><rect x="412" y="50" width="6" height="16"/><rect x="464" y="50" width="6" height="16"/><rect x="490" y="50" width="6" height="16"/><rect x="516" y="50" width="6" height="16"/><rect x="542" y="50" width="6" height="16"/><rect x="568" y="50" width="6" height="16"/><rect x="620" y="50" width="6" height="16"/><rect x="646" y="50" width="6" height="16"/><rect x="672" y="50" width="6" height="16"/><rect x="698" y="50" width="6" height="16"/><rect x="750" y="50" width="6" height="16"/><rect x="776" y="50" width="6" height="16"/><rect x="828" y="50" width="6" height="16"/><rect x="854" y="50" width="6" height="16"/>
  </g>
  <g fill="currentColor">
    <rect x="282" y="46" width="8" height="24"/><rect x="438" y="46" width="8" height="24"/><rect x="594" y="46" width="8" height="24"/><rect x="724" y="46" width="8" height="24"/>
  </g>
  <g fill="#f3a712">
    <rect x="802" y="46" width="8" height="24"/><rect x="880" y="46" width="8" height="24"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor">
    <text x="12" y="62" opacity="0.75">30 runs</text>
    <text x="12" y="80" opacity="0.75">24 empty</text>
    <text x="12" y="96" fill="#f3a712" font-weight="700">2 missed</text>
  </g>
  <text x="12" y="140" font-family="system-ui, sans-serif" font-size="10" fill="currentColor" font-weight="700">Sensor triggers</text>
  <line x1="120" y1="158" x2="900" y2="158" stroke="currentColor" stroke-width="1.4"/>
  <g fill="currentColor">
    <rect x="286" y="146" width="9" height="24"/><rect x="442" y="146" width="9" height="24"/><rect x="598" y="146" width="9" height="24"/><rect x="728" y="146" width="9" height="24"/><rect x="806" y="146" width="9" height="24"/><rect x="884" y="146" width="9" height="24"/>
  </g>
  <rect x="640" y="188" width="9" height="24" fill="#f3a712"/>
  <line x1="644" y1="188" x2="644" y2="172" stroke="#f3a712" stroke-width="1.4" stroke-dasharray="4,3"/>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor">
    <text x="12" y="162" opacity="0.75">6 runs</text>
    <text x="12" y="180" opacity="0.75">0 empty</text>
    <text x="12" y="196" opacity="0.75">0 missed</text>
    <text x="664" y="205" fill="#f3a712" font-weight="700">reprocessed scene arrives 3 weeks late —</text>
    <text x="664" y="220" fill="#f3a712" font-weight="700">re-runs one tile, not the month</text>
  </g>
  <text x="12" y="248" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.85">The cron pipeline cannot close the miss window by running more often — the window is created by the gap between arrival and the next tick, whatever its size.</text>
</svg>

## Root Cause Analysis

Three properties of satellite data delivery drive the design, and each one breaks a naive trigger.

**Arrival is asynchronous and repeated.** A Sentinel-2 tile is typically available a few hours after acquisition, but the interval varies with ground station scheduling and processing load, and the same tile reappears when the processing baseline changes. A trigger that fires on first appearance and never again misses every reprocessing; one that fires on every appearance reprocesses the whole archive after a collection-wide reissue. The resolution is to trigger on a change in the tile's *content identity* — its processing baseline plus its checksum — rather than on its appearance.

**The unit of work is not the unit of arrival.** A project area is covered by several scenes, possibly from several sensors, and a monthly composite needs all of them. Triggering per scene means either running the composite repeatedly as scenes trickle in or running it once and getting whichever scenes happened to have arrived. The fix is a readiness predicate: a work unit becomes eligible when a stated condition over its inputs is satisfied, and the trigger evaluates that predicate rather than counting arrivals.

**Waiting forever is not an option, and neither is not waiting.** Some scenes never arrive — a downlink failure, a sensor outage, an acquisition that was simply not scheduled. A readiness predicate demanding all expected inputs blocks indefinitely; one demanding none produces partial results. Every readiness condition therefore needs a deadline and a defined behaviour at that deadline, and the defined behaviour must be visible in the output rather than silently applied.

The common failure this produces is the pipeline that appears to work for months and then quietly stops producing for one tile, because a scene that never arrived left its readiness predicate permanently unsatisfied and nothing was watching for a work unit that had been waiting too long.

## Diagnostic Pipeline / Pre-Flight Validation

The sensing layer polls a catalogue and decides what is new. Getting that decision right — new versus already seen versus changed — is most of the work, and it depends on recording identity rather than timestamps.

```python
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class SceneIdentity:
    """What makes two catalogue entries the same scene or different ones.

    Deliberately excludes the catalogue's own updated timestamp, which
    changes for reasons unrelated to content — a metadata correction, a
    reindex — and would otherwise trigger a reprocess of everything.
    """
    collection: str
    scene_id: str
    processing_baseline: str
    checksum: str

    def key(self) -> str:
        return f"{self.collection}/{self.scene_id}"

    def content_id(self) -> str:
        return f"{self.key()}@{self.processing_baseline}:{self.checksum[:12]}"


@dataclass(frozen=True)
class Arrival:
    identity: SceneIdentity
    acquired_on: date
    available_at: datetime
    tiles_covered: frozenset[str]


@dataclass(frozen=True)
class WorkUnit:
    """A tile-period that the pipeline produces as one output."""
    tile_id: str
    period_start: date
    period_end: date
    expected_scenes: int
    deadline: datetime


def classify_arrival(
    arrival: Arrival, seen: dict[str, str]
) -> str:
    """new | reprocessed | duplicate — the only three outcomes that matter."""
    key = arrival.identity.key()
    if key not in seen:
        return "new"
    if seen[key] == arrival.identity.content_id():
        return "duplicate"
    return "reprocessed"


def readiness(
    unit: WorkUnit,
    arrivals: list[Arrival],
    *,
    now: datetime,
    min_fraction: float = 0.8,
) -> tuple[bool, str]:
    """Is this work unit eligible to run, and on what basis?

    Returns the basis alongside the decision because the basis belongs in
    the output. A composite built from 80% of its expected scenes at the
    deadline is a legitimate product and a different product from one built
    from 100%, and only the recorded basis distinguishes them afterwards.
    """
    covering = [
        a for a in arrivals
        if unit.tile_id in a.tiles_covered
        and unit.period_start <= a.acquired_on <= unit.period_end
    ]
    have = len({a.identity.key() for a in covering})

    if have >= unit.expected_scenes:
        return True, f"complete:{have}/{unit.expected_scenes}"

    if now >= unit.deadline:
        fraction = have / unit.expected_scenes if unit.expected_scenes else 0.0
        if fraction >= min_fraction:
            log.warning(
                "readiness.deadline_partial",
                tile=unit.tile_id, have=have,
                expected=unit.expected_scenes, fraction=round(fraction, 2),
            )
            return True, f"deadline_partial:{have}/{unit.expected_scenes}"

        log.error(
            "readiness.deadline_insufficient",
            tile=unit.tile_id, have=have,
            expected=unit.expected_scenes,
            note="not run — a composite from under the minimum fraction is "
                 "not a composite, it is a sample of clear days",
        )
        return False, f"deadline_insufficient:{have}/{unit.expected_scenes}"

    return False, f"waiting:{have}/{unit.expected_scenes}"


def find_stalled_units(
    units: list[WorkUnit], arrivals: list[Arrival], *, now: datetime
) -> list[tuple[WorkUnit, str]]:
    """Work units past their deadline that still have not run.

    This is the monitor that catches the silent stop. A triggered pipeline
    has no natural heartbeat — an absence of runs looks exactly like an
    absence of data — so something must actively look for units that should
    have fired and did not.
    """
    stalled = []
    for unit in units:
        if now < unit.deadline:
            continue
        ready, basis = readiness(unit, arrivals, now=now)
        if not ready:
            stalled.append((unit, basis))
    return stalled
```

The stalled-unit monitor is the piece most often missing. A cron pipeline announces its own health by running; a triggered one is silent by design, and the silence when a tile's inputs stopped arriving is indistinguishable from the silence of a quiet week.

<svg viewBox="0 -4 900 258" role="img" aria-labelledby="rdy-t rdy-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rdy-t">The readiness state machine for one work unit</title>
  <desc id="rdy-d">A state machine with four states. A work unit starts in waiting, accumulating arrivals. When all expected scenes have arrived it moves to ready with basis complete, and runs. If the deadline passes with at least the minimum fraction of scenes, it moves to ready with basis deadline partial, runs, and the partial basis is stamped on the output. If the deadline passes below the minimum fraction, it moves to stalled, does not run, and raises for human attention. A reprocessed scene arriving for a unit that has already run returns it to waiting with a supersede flag, so the output is regenerated rather than left stale. A panel notes that the stalled state is the one that needs an active monitor, because a triggered pipeline that stops firing looks exactly like a quiet period.</desc>
  <defs>
    <marker id="rdy-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Four states, and the basis travels onto the output</text>
    <rect x="20" y="86" width="180" height="72" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="20" y="86" width="180" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="110" y="114" fill="currentColor" font-size="10.5" font-weight="700">Waiting</text>
    <text x="110" y="134" fill="currentColor" font-size="8.5" opacity="0.8">accumulating arrivals</text>
    <text x="110" y="150" fill="currentColor" font-size="8.5" opacity="0.8">against the expectation</text>
    <rect x="330" y="40" width="200" height="72" rx="9" fill="currentColor" opacity="0.14"/>
    <rect x="330" y="40" width="200" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <text x="430" y="68" fill="currentColor" font-size="10.5" font-weight="700">Ready · complete</text>
    <text x="430" y="88" fill="currentColor" font-size="8.5" opacity="0.8">all expected scenes present</text>
    <text x="430" y="104" fill="currentColor" font-size="8.5" opacity="0.8">basis stamped on output</text>
    <rect x="330" y="134" width="200" height="72" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="330" y="134" width="200" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="430" y="162" fill="currentColor" font-size="10.5" font-weight="700">Ready · deadline partial</text>
    <text x="430" y="182" fill="currentColor" font-size="8.5" opacity="0.8">≥ min fraction at deadline</text>
    <text x="430" y="198" fill="currentColor" font-size="8.5" opacity="0.8">a different product — say so</text>
    <rect x="660" y="134" width="220" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="2" stroke-dasharray="6,3"/>
    <text x="770" y="162" fill="currentColor" font-size="10.5" font-weight="700">Stalled</text>
    <text x="770" y="182" fill="#f3a712" font-size="8.5" font-weight="700">below min fraction at deadline</text>
    <text x="770" y="198" fill="currentColor" font-size="8.5" opacity="0.8">does not run — raise it</text>
    <rect x="660" y="40" width="220" height="72" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="660" y="40" width="220" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="770" y="68" fill="currentColor" font-size="10.5" font-weight="700">Superseded</text>
    <text x="770" y="88" fill="currentColor" font-size="8.5" opacity="0.8">a reprocessed scene arrived</text>
    <text x="770" y="104" fill="currentColor" font-size="8.5" opacity="0.8">for a unit that already ran</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#rdy-arrow)">
    <path d="M200 110 L328 82"/>
    <path d="M200 134 L328 164"/>
    <path d="M530 170 L658 170"/>
    <path d="M530 76 L658 76"/>
    <path d="M770 112 L770 230 L110 230 L110 160"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" opacity="0.78">
    <text x="238" y="86">all arrived</text>
    <text x="222" y="158">deadline</text>
    <text x="560" y="164" fill="#f3a712" font-weight="700">below minimum</text>
    <text x="560" y="70">reprocess</text>
    <text x="440" y="224">regenerate the output rather than leave it stale</text>
  </g>
</svg>

## Deterministic Transformation Logic

A triggered pipeline is harder to reproduce than a scheduled one, because the set of inputs a run consumed depends on what had arrived at the moment it fired. The remedy is to freeze that set into an explicit, stored input manifest at trigger time, and to make the run consume the manifest rather than the catalogue.

```python
import hashlib
import json
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass(frozen=True)
class RunManifest:
    """The frozen input set for one triggered run.

    A run consumes this, never the live catalogue. That single rule is what
    makes a triggered pipeline reproducible: rerunning the manifest a year
    later gives the same answer even though the catalogue has moved on.
    """
    run_id: str
    tile_id: str
    period_start: str
    period_end: str
    triggered_at: str
    readiness_basis: str
    inputs: tuple[str, ...]          # content_id per scene, sorted
    supersedes: str | None

    def fingerprint(self) -> str:
        payload = json.dumps(
            {
                "tile": self.tile_id,
                "period": [self.period_start, self.period_end],
                "inputs": sorted(self.inputs),
            },
            sort_keys=True, separators=(",", ":"),
        ).encode()
        return hashlib.sha256(payload).hexdigest()[:16]


def build_manifest(
    unit: WorkUnit,
    arrivals: list[Arrival],
    basis: str,
    *,
    now: datetime,
    prior: RunManifest | None,
) -> RunManifest | None:
    """Freeze the input set, or decline if nothing has changed.

    Returning None when the fingerprint matches the prior run is what stops
    a reprocessed-scene notification from regenerating an identical output.
    The check is on content, not on the notification.
    """
    covering = sorted(
        {
            a.identity.content_id()
            for a in arrivals
            if unit.tile_id in a.tiles_covered
            and unit.period_start <= a.acquired_on <= unit.period_end
        }
    )

    candidate = RunManifest(
        run_id=f"{unit.tile_id}-{unit.period_start:%Y%m%d}-{now:%Y%m%dT%H%M%S}",
        tile_id=unit.tile_id,
        period_start=unit.period_start.isoformat(),
        period_end=unit.period_end.isoformat(),
        triggered_at=now.isoformat(),
        readiness_basis=basis,
        inputs=tuple(covering),
        supersedes=prior.run_id if prior else None,
    )

    if prior is not None and candidate.fingerprint() == prior.fingerprint():
        log.info(
            "trigger.skipped_identical",
            tile=unit.tile_id, prior_run=prior.run_id,
            fingerprint=candidate.fingerprint(),
        )
        return None

    log.info(
        "trigger.fired",
        run_id=candidate.run_id, tile=unit.tile_id,
        basis=basis, n_inputs=len(covering),
        fingerprint=candidate.fingerprint(),
        supersedes=candidate.supersedes,
    )
    return candidate


def debounce(
    pending: dict[str, datetime], unit_key: str, *, now: datetime, window_s: int
) -> bool:
    """Collapse a burst of arrivals into one trigger.

    A collection reissue delivers hundreds of scenes within minutes. Without
    a debounce window each one fires the tiles it touches, and the pipeline
    runs the same tile repeatedly on progressively larger input sets, of
    which only the last is wanted.
    """
    first_seen = pending.get(unit_key)
    if first_seen is None:
        pending[unit_key] = now
        return False
    return (now - first_seen).total_seconds() >= window_s
```

The fingerprint comparison earns its place during collection reissues, which are the single most disruptive event for a triggered pipeline. A provider republishing a year of scenes generates a flood of notifications, and without content-based deduplication the pipeline reprocesses everything — including the tiles whose actual pixel content did not change.

## Compliance Gating & Audit Trail Generation

Four records make a triggered pipeline auditable, and the first is the one that makes the rest possible.

The run manifest, stored immutably per run. It states exactly which scene versions produced an output, which converts "why does this month's composite differ from the one we saw in March?" into a manifest diff.

The readiness basis on every output. An output built at a deadline from 80% of its expected inputs is not the same product as a complete one, and downstream consumers — particularly anything feeding a reported figure — need to be able to filter on it.

The supersession chain. When a reprocessed scene regenerates an output, both the old and new run ids must remain, linked. This is the trigger-side equivalent of the restatement history that any recalculated figure needs.

Stalled-unit alerts and their resolution. A tile that stopped producing and was noticed six weeks later is an incident whose record matters, because the gap it leaves in the time series is a gap a verifier will find.

## Production Integration

The practical architecture is a small, boring sensing service and an ordinary orchestrator. The sensor polls the STAC catalogue on a short interval, classifies arrivals, updates the readiness state per work unit, and emits a manifest when a unit becomes ready. The orchestrator — Prefect, Airflow, or Dagster, as compared in [Prefect vs Airflow vs Dagster for MRV pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/prefect-vs-airflow-vs-dagster-for-mrv-pipelines/) — consumes manifests and knows nothing about catalogues. Keeping that boundary sharp is what stops the sensing logic from ending up smeared across every task.

Two notes on operating one. Keep a low-frequency calendar sweep alongside the triggers, not to do work but to look for stalled units and manifests that never completed; it is the heartbeat a triggered pipeline otherwise lacks. And make the trigger path share code with the backfill path, since a manifest-driven run is exactly what [building idempotent backfills for carbon pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/) needs — a backfill becomes the act of generating manifests for a past interval rather than a separate mechanism with its own bugs.

<svg viewBox="0 -4 900 246" role="img" aria-labelledby="arch-t arch-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="arch-t">Sensing service, manifest, orchestrator — and where the boundary sits</title>
  <desc id="arch-d">A three-part architecture. On the left, a sensing service polls the STAC catalogue, classifies each entry as new, reprocessed, or duplicate against a seen-store, and maintains readiness state per work unit. In the centre, a manifest store holds the frozen input set for each triggered run, immutable and content-fingerprinted. On the right, the orchestrator consumes manifests and executes runs; it never queries the catalogue. Below, a low-frequency calendar sweep reads the readiness state looking for stalled units, and a backfill path generates manifests for past intervals using the same code. A panel notes that the orchestrator knowing nothing about catalogues is the boundary that keeps sensing logic from spreading into every task.</desc>
  <defs>
    <marker id="arch2-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">The orchestrator never sees a catalogue — it sees manifests</text>
    <rect x="12" y="40" width="256" height="106" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="40" width="256" height="106" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="140" y="66" fill="currentColor" font-size="10.5" font-weight="700">Sensing service</text>
    <text x="140" y="88" fill="currentColor" font-size="9" opacity="0.82">polls STAC on a short interval</text>
    <text x="140" y="106" fill="currentColor" font-size="9" opacity="0.82">new / reprocessed / duplicate</text>
    <text x="140" y="124" fill="currentColor" font-size="9" opacity="0.82">readiness state per work unit</text>
    <rect x="322" y="40" width="256" height="106" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="322" y="40" width="256" height="106" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="450" y="66" fill="currentColor" font-size="10.5" font-weight="700">Manifest store</text>
    <text x="450" y="88" fill="currentColor" font-size="9" opacity="0.82">frozen input set per run</text>
    <text x="450" y="106" fill="currentColor" font-size="9" opacity="0.82">immutable, fingerprinted</text>
    <text x="450" y="124" fill="currentColor" font-size="9" opacity="0.82">supersession chain kept</text>
    <rect x="632" y="40" width="256" height="106" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="632" y="40" width="256" height="106" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="760" y="66" fill="currentColor" font-size="10.5" font-weight="700">Orchestrator</text>
    <text x="760" y="88" fill="currentColor" font-size="9" opacity="0.82">consumes manifests only</text>
    <text x="760" y="106" fill="currentColor" font-size="9" opacity="0.82">knows nothing of catalogues</text>
    <text x="760" y="124" fill="currentColor" font-size="9" opacity="0.82">reruns reproduce exactly</text>
    <rect x="12" y="176" width="424" height="62" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="176" width="424" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="6,3"/>
    <text x="224" y="200" fill="currentColor" font-size="10" font-weight="700">Calendar sweep — the heartbeat</text>
    <text x="224" y="222" fill="currentColor" font-size="9" opacity="0.85">looks for stalled units; does no work itself</text>
    <rect x="464" y="176" width="424" height="62" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="464" y="176" width="424" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="6,3"/>
    <text x="676" y="200" fill="currentColor" font-size="10" font-weight="700">Backfill — the same code path</text>
    <text x="676" y="222" fill="currentColor" font-size="9" opacity="0.85">generates manifests for a past interval</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#arch2-arrow)">
    <line x1="268" y1="92" x2="320" y2="92"/><line x1="578" y1="92" x2="630" y2="92"/>
    <path d="M140 146 L140 174"/><path d="M676 174 L676 148"/>
  </g>
</svg>

## Frequently Asked Questions

### Is polling a catalogue acceptable, or should notifications be used?

Polling is entirely acceptable and often preferable. A poll every few minutes against a STAC search is cheap, and it is self-healing in a way notifications are not: a missed notification is lost forever, while a missed poll is corrected by the next one. Where a provider offers a notification stream it is worth consuming as a latency optimisation, but the poll should remain as the source of truth rather than being switched off. Systems that rely solely on notifications discover their gaps months later.

### How should the expected scene count per work unit be determined?

From the orbital geometry rather than from experience. The set of scenes covering a tile in a period is calculable from the sensor's tiling grid and revisit cycle, and computing it gives an expectation that is correct from day one and that adapts when a new sensor is added. Deriving it from historical arrival counts bakes in whatever outages the history contained, which sets the expectation too low and makes the readiness predicate permanently satisfiable with incomplete input.

### What is a sensible deadline for a work unit?

Long enough to absorb normal delivery variation and short enough that a report is not held hostage to one missing scene — commonly a few days past the end of the period for near-real-time work, and a couple of weeks for monthly products where completeness matters more than latency. The deadline should be a property of the work unit rather than a global setting, because a triage alert and a monitoring composite have genuinely different tolerances.

### Should a reprocessed scene always regenerate downstream outputs?

Only when it changes them, which the fingerprint check determines. Reprocessing frequently changes metadata without changing pixel content, and regenerating on every reprocess makes a collection reissue an expensive event for no benefit. Where the content genuinely changed, regeneration should be automatic and should preserve the superseded output rather than overwriting it, since anything already reported was reported against the old version.

### How does this interact with a pipeline that also has non-satellite inputs?

The readiness predicate generalises cleanly. A work unit needing satellite scenes, a field data upload, and a current emission factor table becomes ready when all three conditions hold, and the manifest freezes all three. The main practical difference is that non-satellite inputs often have no natural expectation count, so their readiness condition is usually a version or validity check rather than a count — present and valid for the period, rather than N of M arrived.

### Does triggering complicate testing?

It simplifies it, once the manifest boundary is in place. A run is a pure function of its manifest, so testing the processing path needs no catalogue, no clock, and no network — just a manifest fixture. The sensing service is then tested separately against recorded catalogue responses. The pipelines that are hard to test are the ones where each task queries the catalogue itself, which is precisely what the boundary exists to prevent.

### What happens when the catalogue itself is unavailable?

The sensing service stops advancing readiness state and nothing fires, which is correct — but it must be visible. An outage in the catalogue and a genuinely quiet period look identical from the outside, so the sensing service should track its own last successful poll and alert on staleness independently of whether any work unit became ready. This is the same silence problem as the stalled unit, one level up, and it needs its own monitor for the same reason.

### Can two work units for the same tile be in flight at once?

They should not be, and preventing it is worth an explicit lock keyed on the work unit rather than on the run. The situation arises when a reprocessed scene triggers a regeneration while the original run is still executing, and the two then race to write the same output. Whichever finishes last wins, which is not necessarily the one with the more complete input set. Serialising per work unit costs a little throughput and removes an outcome that is both wrong and extremely hard to reproduce afterwards.

Where the throughput cost is genuinely unacceptable — a very large tile grid with slow runs — the alternative is to let both proceed and resolve on write by comparing manifests, publishing whichever has the superset of inputs. That is more code and it fails safe, which the naive race does not.

## Related guides

- [Orchestrating MRV Data Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) — the parent topic and the orchestration patterns this scheduling sits inside.
- [Prefect vs Airflow vs Dagster for MRV Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/prefect-vs-airflow-vs-dagster-for-mrv-pipelines/) — choosing the orchestrator that consumes these manifests.
- [Building Idempotent Backfills for Carbon Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/) — the same manifest mechanism applied backwards in time.
- [Failure Mode Catalog for Distributed Tile Processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/failure-mode-catalog-for-distributed-tile-processing/) — what happens inside a run once a manifest triggers it.
