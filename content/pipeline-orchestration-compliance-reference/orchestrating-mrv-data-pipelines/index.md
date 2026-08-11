---
shortTitle: "Orchestrating MRV Data Pipelines"
title: "Orchestrating MRV Data Pipelines"
description: "Engineer deterministic, auditable MRV pipelines: DAG design, idempotency keys, retry and backfill patterns, satellite-arrival sensors, and lineage-linked observability with Prefect and Airflow."
slug: orchestrating-mrv-data-pipelines
type: topic
breadcrumb: "Orchestrating MRV Pipelines"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Orchestrating MRV Data Pipelines

Orchestrating MRV data pipelines is the control-plane discipline that turns a collection of geospatial transforms into a reproducible, defensible accounting system — and it is the operational spine of the [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack. An orchestrator's job in Measurement, Reporting, and Verification (MRV) is narrow but unforgiving: it must guarantee that the same inputs produce the same tonnage every time, that a mid-flight failure never double-counts a reduction, and that every run leaves behind a lineage record an auditor can replay. This is a stricter contract than a typical analytics DAG, because the artifact at the end is not a dashboard but a claim of carbon removed from the atmosphere, and that claim is written against the [canonical Parquet schema](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) whose column semantics every task must honour.

The orchestration layer is also where regulatory intent becomes executable. Retry policy, idempotency, and run parameterization are not merely reliability features; they are the mechanisms that satisfy the reproducibility and conservativeness requirements the [carbon registry standards and methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/) impose, and the audit events the flow emits are what feed [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) downstream. Get the orchestration wrong and the failure is rarely a loud crash; it is a silently double-counted parcel, a backfill that quietly overwrote a certified reporting period, or a fan-out over satellite tiles that dropped a stratum without raising an alarm. This page sets out the DAG and flow patterns that make MRV pipelines deterministic under retry, idempotent under backfill, and observable enough to survive third-party verification.

<svg viewBox="0 0 980 390" role="img" aria-labelledby="omp-t omp-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="omp-t">MRV orchestration DAG with idempotency gate, retry policy, validation gate, and branches to a lineage output or a dead-letter review queue</title>
  <desc id="omp-d">A left-to-right flow. A satellite-arrival sensor triggers an ingest task configured with three retries and exponential backoff. The ingest feeds an idempotency decision diamond that asks whether the run key has already been processed; if yes, the run short-circuits to the audit and lineage output; if new, it proceeds to a fan-out transform over project-area tiles and then to a validation decision diamond. A passing validation writes the amber audit and lineage output; a failing validation routes the run to a dead-letter and manual-review queue that quarantines the batch and raises an alert.</desc>
  <defs>
    <marker id="omp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- A: trigger -->
  <rect x="14" y="54" width="130" height="72" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="14" y="54" width="130" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.65"/>
  <text x="79" y="74" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">TRIGGER</text>
  <text x="79" y="92" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Sensor / STAC</text>
  <text x="79" y="110" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">satellite arrival</text>
  <!-- B: ingest task -->
  <rect x="172" y="54" width="150" height="72" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="172" y="54" width="150" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="247" y="74" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">TASK &#183; retries=3</text>
  <text x="247" y="92" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Ingest scene</text>
  <text x="247" y="110" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">exponential backoff</text>
  <!-- retry loop under B -->
  <path d="M300,126 C300,168 210,168 210,126" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7" marker-end="url(#omp-arrow)"/>
  <text x="255" y="182" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">retry &#183; backoff</text>
  <!-- C: idempotency gate diamond -->
  <polygon points="346,90 392,50 438,90 392,130" fill="currentColor" opacity="0.05"/>
  <polygon points="346,90 392,50 438,90 392,130" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="392" y="86" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor">Idempotency</text>
  <text x="392" y="99" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.8">key seen?</text>
  <!-- D: fan-out transform -->
  <rect x="470" y="54" width="150" height="72" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="470" y="54" width="150" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="545" y="74" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">TASK &#183; fan-out</text>
  <text x="545" y="92" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Transform tiles</text>
  <text x="545" y="110" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">per project area</text>
  <!-- E: validation gate diamond -->
  <polygon points="644,90 690,50 736,90 690,130" fill="currentColor" opacity="0.05"/>
  <polygon points="644,90 690,50 736,90 690,130" fill="none" stroke="#0f6e63" stroke-width="1.8"/>
  <text x="690" y="86" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor">Validation</text>
  <text x="690" y="99" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.8">gate</text>
  <!-- F: audit / lineage output (amber) -->
  <rect x="770" y="54" width="196" height="72" rx="8" fill="#f3a712" opacity="0.12"/>
  <rect x="770" y="54" width="196" height="72" rx="8" fill="none" stroke="#f3a712" stroke-width="1.8"/>
  <text x="868" y="74" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" opacity="0.7">AUDIT / LINEAGE</text>
  <text x="868" y="92" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">OpenLineage event</text>
  <text x="868" y="110" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">content-hashed run</text>
  <!-- Dead-letter box -->
  <rect x="560" y="250" width="200" height="72" rx="8" fill="currentColor" opacity="0.04"/>
  <rect x="560" y="250" width="200" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5,4"/>
  <text x="660" y="272" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" opacity="0.7">DEAD-LETTER</text>
  <text x="660" y="290" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Manual review</text>
  <text x="660" y="308" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">quarantine + alert</text>
  <!-- main arrows -->
  <line x1="144" y1="90" x2="170" y2="90" stroke="currentColor" stroke-width="1.4" marker-end="url(#omp-arrow)"/>
  <line x1="322" y1="90" x2="344" y2="90" stroke="currentColor" stroke-width="1.4" marker-end="url(#omp-arrow)"/>
  <line x1="438" y1="90" x2="468" y2="90" stroke="currentColor" stroke-width="1.4" marker-end="url(#omp-arrow)"/>
  <text x="440" y="82" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.7">no &#183; new</text>
  <line x1="620" y1="90" x2="642" y2="90" stroke="currentColor" stroke-width="1.4" marker-end="url(#omp-arrow)"/>
  <line x1="736" y1="90" x2="768" y2="90" stroke="#0f6e63" stroke-width="1.6" marker-end="url(#omp-arrow)"/>
  <text x="752" y="82" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">pass</text>
  <!-- idempotency short-circuit branch (yes -> audit) -->
  <path d="M392,130 V352 H868 V128" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.8" marker-end="url(#omp-arrow)"/>
  <text x="404" y="208" text-anchor="start" font-size="8.5" fill="currentColor" opacity="0.75">yes &#183; skip (already processed)</text>
  <!-- validation fail branch -->
  <path d="M690,130 V250" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#omp-arrow)"/>
  <text x="700" y="200" text-anchor="start" font-size="8.5" fill="currentColor" opacity="0.75">fail</text>
</svg>

## Role in the MRV Workflow

Orchestration sits at the seam between raw Earth-observation ingestion and regulatory reporting, and its responsibility is coordination rather than computation. The actual carbon science — cloud masking, biomass estimation, uncertainty propagation — lives in the transform tasks; the orchestrator's contribution is to run those tasks in the right order, with the right parameters, exactly once per logical unit of work, and to record what it did in a form that can be replayed. In a mature MRV platform the orchestrator owns four concerns that no individual transform can guarantee on its own: the scheduling contract that decides when work runs, the idempotency contract that decides whether work runs at all, the retry contract that decides how failure is absorbed, and the observability contract that decides what evidence survives the run.

The scheduling contract in MRV is unusual because the arrival of input data is irregular and event-driven rather than clock-driven. A Sentinel-2 tile for a given project area may land hours late, out of order, or in duplicate, and a naive cron schedule that assumes the imagery is present at 02:00 will either process stale data or process nothing. The correct pattern is a sensor or trigger that watches a STAC catalogue or an object-storage prefix and fires a parameterized run only once the required scenes for a reporting epoch are actually present and quality-flagged. That sensor becomes the front door of the DAG, and every property downstream — determinism, idempotency, lineage — depends on it firing on a well-defined logical partition rather than on wall-clock time.

The parameterization contract is what lets one flow definition serve every project area and every reporting period without code changes. A single flow, parameterized by `project_area_id`, `reporting_period`, `emission_factor_version`, and a pinned `code_version`, is instantiated once per partition, and those parameters are precisely the inputs from which an idempotency key is derived. This is the mechanism that makes a fleet of hundreds of project areas tractable: the DAG topology is written once, and the orchestrator fans it out over parameters, each run isolated, individually addressable, and independently replayable. Because the same parameters always produce the same key, a re-run of an already-completed partition is recognized and short-circuited rather than repeated — the property the idempotency gate in the diagram above enforces before any transform executes.

Finally, orchestration is where the pipeline earns its audit trail. Every task boundary is an opportunity to emit a structured event — run key, input checksums, CRS transformations applied, validation outcomes, output hashes — and the orchestrator is the only component with the vantage point to stitch those events into a coherent lineage graph. When a verifier asks how a particular tonne of removal was produced, the answer is reconstructed from these orchestration events, not from the transform code. An MRV pipeline whose orchestration layer is silent about what it ran is, for compliance purposes, indistinguishable from one that ran nothing at all.

## Core Failure Modes

Three failure modes account for the overwhelming majority of production incidents in MRV orchestration. Each is rooted in a property the orchestrator is supposed to guarantee and fails to, and each carries a measurable impact on the credibility of the reported numbers.

1. **Non-idempotent tasks double-counting emissions on retry.** The root cause is a task that appends or accumulates rather than replacing, combined with a retry policy that re-executes it after a partial success. A task that writes a reduction record with `INSERT` semantics, or that adds tonnage to a running project total, will write the record twice if the worker dies after the write but before the orchestrator marks the task complete — and the retry then re-runs it. Because retries are the norm on flaky object storage and rate-limited registry APIs, this is not a rare edge case; on a pipeline processing thousands of tile-level records per run, an observed retry rate of even 1–2% can inflate a project's issued tonnage by a comparable fraction, and the error is systematically in the over-crediting direction, which is exactly the direction a verifier is trained to reject. The fix is idempotent writes keyed on a deterministic run key so that a re-execution overwrites its own prior output rather than adding to it.

2. **Hidden state and non-deterministic ordering breaking reproducibility.** The root cause is a task that reads from mutable shared state — a "latest" emission-factor table, an unpinned library version, a wall-clock timestamp, or an unseeded Monte Carlo draw — so that two runs over identical inputs produce different outputs. Fan-out ordering compounds this: if tiles are reduced in whatever order the workers happen to finish, and the reduction is not associative and commutative in floating point, the aggregate carbon figure drifts run to run. The impact is that a verifier who re-runs the pipeline to reproduce a claim gets a different number, which under ISO 14064-3 is grounds to withhold the verification opinion entirely. The magnitude is usually small in absolute terms — fractions of a percent — but the consequence is binary: reproducibility either holds or it does not, and a pipeline that cannot reproduce its own certified figure has no defensible claim regardless of how small the discrepancy is. The fix is to pin every input by version, seed every stochastic step, and make the fan-out reduction order-independent.

3. **Silent partial failures in fan-out over tiles.** The root cause is a mapped task whose individual failures are swallowed — caught and logged at `warning` level, or allowed to return `None` — so that the reduction proceeds over a subset of tiles while the orchestrator reports overall success. A project area covered by 400 tiles that quietly drops 12 to a transient read error produces a carbon total computed over 97% of the area but reported as if it covered 100%, understating or overstating the stock depending on where the missing strata sit. The failure is silent by construction: the run is green, the output exists, and nothing surfaces the gap until a verifier reconciles the covered area against the project boundary. On heterogeneous landscapes a 3% coverage gap concentrated in a high-biomass stratum can shift the reported stock by well over 3%, and because it hides inside a successful run it can persist across many reporting periods. The fix is a fan-out contract that treats any missing tile as a hard failure of the whole partition, routing the batch to the dead-letter queue rather than reducing over an incomplete set.

<svg viewBox="0 -4 900 232" role="img" aria-labelledby="fanout-t fanout-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="fanout-t">Why a satellite MRV run's task cardinality changes every period</title>
  <desc id="fanout-d">A chart of task count per monthly run across a year for a national programme. The count varies between 8 400 and 21 600 tasks because the number of usable scenes changes with cloud cover, orbit geometry, and sensor availability. Two annotations mark a dry-season peak at 21 600 and a monsoon trough at 8 400. A panel explains that a statically expanded task graph must be sized for the peak and wastes capacity for most of the year, while a runtime-mapped graph matches the actual work — which is why dynamic fan-out is a requirement rather than a convenience for this workload.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The unit of work is the tile-month, and there are never the same number</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Usable scenes per month for one national programme.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="66" x2="620" y2="66"/><line x1="80" y1="112" x2="620" y2="112"/><line x1="80" y1="158" x2="620" y2="158"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="56" x2="80" y2="186"/>
    <line x1="80" y1="186" x2="620" y2="186"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="70" text-anchor="end">24 000</text>
    <text x="72" y="116" text-anchor="end">16 000</text>
    <text x="72" y="162" text-anchor="end">8 000</text>
    <text x="80" y="204" text-anchor="middle">Jan</text>
    <text x="325" y="204" text-anchor="middle">Jun</text>
    <text x="620" y="204" text-anchor="middle">Dec</text>
  </g>
  <polyline points="80,110 129,96 178,80 227,72 276,88 325,132 374,168 423,174 472,150 521,118 570,98 620,104" fill="none" stroke="currentColor" stroke-width="2.8"/>
  <circle cx="227" cy="72" r="5.5" fill="none" stroke="#f3a712" stroke-width="2.4"/>
  <circle cx="423" cy="174" r="5.5" fill="none" stroke="#f3a712" stroke-width="2.4"/>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="238" y="64" fill="#f3a712" font-weight="700">21 600 · dry season</text>
    <text x="360" y="192" fill="#f3a712" font-weight="700">8 400 · monsoon</text>
    <rect x="644" y="62" width="244" height="118" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="644" y="62" width="244" height="118" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="660" y="86" fill="currentColor" font-size="10" font-weight="700">Static graphs pay for the peak</text>
    <text x="660" y="110" fill="currentColor" font-size="9.5" opacity="0.85">A graph expanded at parse time must be</text>
    <text x="660" y="126" fill="currentColor" font-size="9.5" opacity="0.85">sized for 21 600 and idles for most of</text>
    <text x="660" y="142" fill="currentColor" font-size="9.5" opacity="0.85">the year.</text>
    <text x="660" y="166" fill="currentColor" font-size="9.5" font-weight="700">Runtime mapping matches the work.</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The Prefect flow below encodes all three defences. It derives an idempotency key from the run's parameters and input checksums, short-circuits when that key has already produced a completed record, retries transient failures with backoff, refuses to reduce over an incomplete fan-out, and gates the aggregate behind an explicit validation check before any lineage event is emitted. Every task logs structured telemetry through `structlog`, and CRS handling is explicit so that area-weighted tonnage is computed on an equal-area grid rather than in degrees. The same shape ports directly to Airflow — the idempotency key becomes the task-instance `run_id` component, the fan-out becomes a dynamically mapped task, and the dead-letter branch becomes a `BranchPythonOperator` — but the invariants are identical regardless of engine.

```python
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import geopandas as gpd
import pyproj
import structlog
from prefect import flow, task
from prefect.tasks import exponential_backoff

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()

EQUAL_AREA_CRS = "EPSG:6933"     # World Cylindrical Equal Area — area-honest tonnage
MIN_TILE_COVERAGE = 1.0          # fan-out must be complete; no silent partial reduction
CARBON_FRACTION = 0.47           # IPCC default; pinned per emission-factor version


def idempotency_key(*, project_area_id: str, reporting_period: str,
                    ef_version: str, code_version: str,
                    input_checksums: list[str]) -> str:
    """Deterministic run key derived only from inputs — identical inputs, identical key."""
    payload = {
        "project_area_id": project_area_id,
        "reporting_period": reporting_period,
        "ef_version": ef_version,
        "code_version": code_version,
        "input_checksums": sorted(input_checksums),  # order-independent
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


@task(retries=3, retry_delay_seconds=exponential_backoff(backoff_factor=10),
      retry_jitter_factor=0.5)
def load_tile(tile_uri: str) -> gpd.GeoDataFrame:
    """Idempotent read of one tile's activity-data records, reprojected to equal area."""
    gdf = gpd.read_parquet(tile_uri)
    if gdf.crs is None:
        raise ValueError(f"{tile_uri}: untagged CRS; refusing to guess a datum.")
    # Explicit, always_xy reprojection so area weighting is honest.
    transformer_crs = pyproj.CRS.from_user_input(EQUAL_AREA_CRS)
    gdf = gdf.to_crs(transformer_crs)
    log.info("tile_loaded", tile=tile_uri, rows=len(gdf), crs=EQUAL_AREA_CRS)
    return gdf


@task
def check_completed(run_key: str, ledger_uri: str) -> Optional[Path]:
    """Return the existing completed artifact for this key, or None if unseen."""
    marker = Path(ledger_uri) / f"{run_key}.done"
    if marker.exists():
        log.info("idempotent_short_circuit", run_key=run_key, marker=str(marker))
        return marker
    return None


@task
def reduce_tiles(tiles: list[gpd.GeoDataFrame], expected: int) -> float:
    """Order-independent reduction; a missing tile fails the whole partition."""
    present = [t for t in tiles if t is not None]
    coverage = len(present) / expected if expected else 0.0
    if coverage < MIN_TILE_COVERAGE:
        log.error("fanout_incomplete", expected=expected, present=len(present),
                  coverage=round(coverage, 4))
        raise RuntimeError(
            f"fan-out incomplete: {len(present)}/{expected} tiles; "
            "refusing to reduce over a partial set.")
    # Deterministic sum: convert m^2 to hectares, apply pinned carbon fraction.
    total_tc = 0.0
    for gdf in present:
        area_ha = gdf.geometry.area / 10_000.0
        total_tc += float((gdf["biomass_t_ha"] * area_ha * CARBON_FRACTION).sum())
    log.info("tiles_reduced", tiles=len(present), total_tc=round(total_tc, 2))
    return total_tc


@task
def validate(total_tc: float, baseline_tc: float, tolerance: float = 0.30) -> None:
    """Validation gate — a swing beyond tolerance is quarantined, not reported."""
    if baseline_tc <= 0:
        raise ValueError("baseline tonnage must be positive for a relative gate.")
    swing = abs(total_tc - baseline_tc) / baseline_tc
    if swing > tolerance:
        log.warning("validation_failed", total_tc=round(total_tc, 2),
                    baseline_tc=round(baseline_tc, 2), swing=round(swing, 4))
        raise ValueError(
            f"period-over-period swing {swing:.1%} exceeds {tolerance:.0%}; "
            "routing batch to dead-letter for manual review.")
    log.info("validation_passed", total_tc=round(total_tc, 2), swing=round(swing, 4))


@task
def seal_lineage(run_key: str, total_tc: float, ledger_uri: str,
                 params: dict) -> Path:
    """Write the completion marker + content-hashed lineage event (idempotent)."""
    record = {
        "run_key": run_key,
        "total_tc": total_tc,
        "params": params,
        "sealed_at": datetime.now(timezone.utc).isoformat(),
    }
    canonical = json.dumps(record, sort_keys=True, separators=(",", ":")).encode("utf-8")
    record["content_hash"] = hashlib.sha256(canonical).hexdigest()
    marker = Path(ledger_uri) / f"{run_key}.done"
    marker.write_text(json.dumps(record))  # overwrite-safe: same key -> same file
    log.info("lineage_sealed", run_key=run_key, content_hash=record["content_hash"])
    return marker


@flow(name="mrv_reporting_flow")
def run_mrv_period(project_area_id: str, reporting_period: str,
                   tile_uris: list[str], input_checksums: list[str],
                   baseline_tc: float, ledger_uri: str = "s3://mrv/ledger",
                   ef_version: str = "ef-2026.1", code_version: str = "v3.2.0") -> Path:
    params = {
        "project_area_id": project_area_id, "reporting_period": reporting_period,
        "ef_version": ef_version, "code_version": code_version,
    }
    run_key = idempotency_key(input_checksums=input_checksums, **params)
    log.info("flow_started", run_key=run_key, tiles=len(tile_uris), **params)

    existing = check_completed(run_key, ledger_uri)
    if existing is not None:
        return existing  # short-circuit: certified period is never recomputed

    tiles = load_tile.map(tile_uris)            # fan-out over project-area tiles
    total_tc = reduce_tiles(tiles, expected=len(tile_uris))
    validate(total_tc, baseline_tc)             # raises -> Prefect marks failed -> dead-letter
    return seal_lineage(run_key, total_tc, ledger_uri, params)


if __name__ == "__main__":
    run_mrv_period(
        project_area_id="REDD-BR-0142", reporting_period="2026-Q2",
        tile_uris=["s3://mrv/tiles/REDD-BR-0142/2026-Q2/t0.parquet"],
        input_checksums=["sha256:9f2c…"], baseline_tc=184_500.0)
```

The design keeps every determinism-critical decision explicit and inspectable. The idempotency key is derived only from inputs — parameters and sorted checksums — so it is stable across re-runs and independent of wall-clock time or worker ordering. The `check_completed` short-circuit is what makes a backfill safe to run repeatedly: re-issuing a completed partition is a no-op, so an operator can replay a month of periods without fear of double-counting, which is the property explored in depth in the idempotent-backfills guide linked below. The fan-out reduction refuses any coverage below 100%, converting the silent-partial-failure mode into a loud, dead-lettered failure. And the validation gate raises rather than returns, so a batch that swings beyond tolerance never reaches `seal_lineage` and therefore never produces a lineage event that a verifier could mistake for a certified figure.

## Validation, Debugging & Compliance Mapping

Each orchestration guarantee maps to a specific control in the standards MRV pipelines are verified against, which is what elevates these patterns from engineering hygiene to compliance evidence. The table below ties the mechanisms in the flow to the requirements they satisfy and to the step a verifier uses to test them.


| Orchestration mechanism | Regulatory application | Verification step |
|-------------------------|------------------------|-------------------|
| Deterministic idempotency key + pinned versions | ISO 14064-3 reproducibility of the verification opinion | Verifier re-runs the flow and recomputes the identical run key and tonnage |
| Idempotent writes + completion short-circuit | Verra VM-series conservativeness — no double issuance on retry or backfill | Auditor replays a completed period and confirms zero net change |
| Complete-coverage fan-out gate | Verra VM-series stratification / full monitored-area coverage | Covered tile area reconciled against the project boundary polygon |
| Validation gate + dead-letter quarantine | ISO 14064-3 treatment of anomalies and material discrepancies | Dead-letter log inspected for quarantined periods and their disposition |
| Content-hashed lineage event per run | CSRD ESRS E1 data-quality and assurance traceability | Reported figure traced back to its run key and input checksums |


Map the mechanisms to controls as follows. The deterministic run key and version pinning answer **ISO 14064-3**, whose central demand is that an independent verifier can reproduce the reported result; a flow that computes the same key and the same tonnage on re-execution gives the verifier exactly that, and the reproduction step becomes a mechanical check rather than a forensic exercise. The idempotent writes and the completion short-circuit satisfy the conservativeness principle of the **Verra VM-series** methodologies, which will not tolerate a design in which a retry or a backfill can inflate issued tonnage — the short-circuit makes over-issuance structurally impossible rather than merely unlikely. The complete-coverage fan-out gate maps to the stratification and monitored-area requirements of those same methodologies, because a total computed over 97% of the area is not a conservative estimate of the whole; it is a different, unqualified quantity, and the gate refuses to emit it. Finally, the content-hashed lineage event feeds **CSRD ESRS E1** assurance, whose disclosures must be traceable to their source data with documented data quality — the hash chains the reported figure to the exact inputs and code version that produced it.

For debugging, treat the retry rate, the fan-out coverage fraction, and the count of dead-lettered partitions as first-class monitored signals on every run, including the ones that pass, so that a slowly rising retry rate or a coverage fraction that has quietly slipped below 100% on a subset of project areas surfaces as a trend long before it corrupts a reporting period. Three recurring silent conditions deserve dedicated alerts: an idempotency key that changes between two runs over ostensibly identical inputs, which almost always signals an unpinned dependency leaking into the key derivation; a completion marker written before validation passed, which indicates the seal step has been reordered ahead of the gate; and a dead-letter queue that fills faster than it drains, which means anomalies are being quarantined but never triaged, quietly excluding real area from the accounting. Comparing engines on exactly these observability and idempotency properties is the subject of the Prefect-versus-Airflow-versus-Dagster guide below.

<svg viewBox="0 -4 880 232" role="img" aria-labelledby="rec-t2 rec-d2" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rec-t2">Recovery paths after a partial failure, and what each costs</title>
  <desc id="rec-d2">Four recovery strategies for a run where 6 percent of tasks failed. Rerun everything costs a full recompute and is safe but wasteful. Rerun failed tasks only costs 6 percent of the compute and is safe if and only if tasks are idempotent and deterministically keyed. Resume from a checkpoint costs less but is unsafe when the checkpoint captured partial state. Accept the partial output costs nothing and silently understates the reported total by whatever the missing tasks contained. A panel notes that only the second is both cheap and safe, and that it is cheap and safe only because of a property designed in earlier — the deterministic partition key.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Four ways to recover a run that lost 6% of its tasks</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Only one is both cheap and safe — and only because of a decision made much earlier.</text>
    <rect x="12" y="52" width="424" height="70" rx="8" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="52" width="424" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="28" y="76" fill="currentColor" font-size="10" font-weight="700">Rerun everything</text>
    <text x="28" y="100" fill="currentColor" font-size="9.5" opacity="0.85">safe · costs a full recompute · the fallback that always works</text>
    <rect x="456" y="52" width="412" height="70" rx="8" fill="currentColor" opacity="0.13"/>
    <rect x="456" y="52" width="412" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="472" y="76" fill="currentColor" font-size="10" font-weight="700">Rerun only the failed tasks</text>
    <text x="472" y="100" fill="currentColor" font-size="9.5" opacity="0.85">safe IF idempotent and deterministically keyed · costs 6%</text>
    <rect x="12" y="134" width="424" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3"/>
    <text x="28" y="158" fill="currentColor" font-size="10" font-weight="700">Resume from a checkpoint</text>
    <text x="28" y="182" fill="#f3a712" font-size="9.5" font-weight="700">unsafe when the checkpoint captured partial state</text>
    <rect x="456" y="134" width="412" height="70" rx="8" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="472" y="158" fill="currentColor" font-size="10" font-weight="700">Accept the partial output</text>
    <text x="472" y="182" fill="#f3a712" font-size="9.5" font-weight="700">costs nothing · understates the total, invisibly</text>
  </g>
</svg>

## Frequently Asked Questions

### What makes a task idempotent in an MRV pipeline?

A deterministic output path derived from the inputs, and a write that replaces rather than appends. Given the same tile and period, the task must compute the same key, write to the same location, and leave the same bytes — so running it twice is indistinguishable from running it once. Appending, or keying on a run identifier or a timestamp, breaks both properties and turns every retry into a potential double count.

### How should a backfill differ from a scheduled run?

Only in which partitions it targets. If a backfill needs different code, different parameters, or a different write path from the scheduled run, then the scheduled run is not reproducible and the backfill is producing a different quantity. The healthy design has one execution path parameterised by partition, so replaying a historical window is the same operation as processing the current one — which is also what makes an audit replay possible.

### Where should the expected partition set come from?

From the acquisition catalogue and the period definition, computed independently of the run. Deriving it from what the run produced makes completeness unfalsifiable: a run that processed 94% of tiles reports that it processed 100% of the tiles it processed. Computing the expected set first, and asserting the written set against it, is what converts a partial failure from an invisible shortfall into a failed run.

### How much concurrency is useful over satellite tiles?

Enough to saturate the bottleneck, which is usually object-store throughput rather than CPU. Beyond that point additional workers increase contention, retry rates, and cost without reducing wall-clock time. Measure where the curve flattens for your storage and imagery source, cap concurrency there, and prefer larger per-task work units over more tasks — scheduler overhead per task is small but not free at tens of thousands of tasks.

### Should the orchestrator hold business logic?

As little as possible. An orchestrator that encodes methodology rules, thresholds, or factor selection becomes impossible to replace and hard to test, and it puts compliance-relevant logic in a layer optimised for scheduling. Keep the orchestrator responsible for when, where, and how often; keep what the computation does in ordinary, testable library code that can run without a scheduler at all.

## Conclusion

Orchestrating MRV data pipelines is the discipline that makes carbon accounting reproducible under retry, idempotent under backfill, and observable enough to verify. The patterns are consistent regardless of engine: derive a deterministic run key from inputs so identical work is recognized and never repeated, make every write idempotent so a retry overwrites rather than accumulates, treat any incomplete fan-out as a hard failure routed to a dead-letter queue, gate the aggregate behind an explicit validation check before any lineage event is sealed, and instrument every task boundary with structured telemetry that stitches into a queryable lineage graph. Each of these is simultaneously a reliability property and a compliance control, which is why orchestration belongs at the centre of an MRV platform rather than at its edges.

To choose the engine that best enforces these invariants for your team, continue with [Prefect vs Airflow vs Dagster for MRV Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/prefect-vs-airflow-vs-dagster-for-mrv-pipelines/), and to apply the idempotency key and short-circuit patterns to safely replay historical reporting periods, work through [Building Idempotent Backfills for Carbon Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/).

## Related guides

- [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) — the parent stack this orchestration layer operationalizes.
- [Prefect vs Airflow vs Dagster for MRV Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/prefect-vs-airflow-vs-dagster-for-mrv-pipelines/) — engine comparison against these idempotency and observability requirements.
- [Building Idempotent Backfills for Carbon Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/) — safely replaying historical periods with deterministic run keys.
- [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) — the canonical Parquet contract every orchestrated task reads and writes.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — the evidence layer the sealed lineage events feed.
