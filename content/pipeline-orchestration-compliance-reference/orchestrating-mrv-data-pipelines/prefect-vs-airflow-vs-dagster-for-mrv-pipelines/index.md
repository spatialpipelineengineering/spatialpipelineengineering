---
shortTitle: "Prefect vs Airflow vs Dagster for MRV Pipelines"
title: "Prefect vs Airflow vs Dagster for MRV Pipelines"
description: "A decision guide to choosing Airflow, Prefect, or Dagster for MRV carbon pipelines: dynamic tile fan-out, software-defined assets, idempotent backfills, lineage, and a recommendation matrix by team profile."
slug: prefect-vs-airflow-vs-dagster-for-mrv-pipelines
type: guide
breadcrumb: "Prefect vs Airflow vs Dagster"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Prefect vs Airflow vs Dagster for MRV Pipelines

Choosing an orchestrator for measurement, reporting, and verification (MRV) work is not a question of which tool schedules DAGs most elegantly; it is a question of which one lets you regenerate a two-year emissions figure, prove where every number came from, and survive a verifier who asks to replay the pipeline from raw tiles. This decision guide sits within [Orchestrating MRV Data Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/), the coordination discipline inside the wider [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack, and it assumes you have already read why [building idempotent backfills for carbon pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/) is the property every candidate must support before it is even eligible.

The three mainstream Python orchestrators — Apache Airflow, Prefect, and Dagster — are not interchangeable for carbon work, and the honest answer is not "it depends". Each optimises for a different shape of problem: Airflow for scheduled, operationally hardened batch; Prefect for dynamic, Pythonic fan-out with minimal ceremony; and Dagster for data-asset lineage as a first-class runtime concern. MRV pipelines stress exactly the three axes on which they diverge most — dynamic fan-out over thousands of satellite tiles, machine-readable lineage for audit, and deterministic replay of historical windows — so the fit is decidable if you score the tools against those axes rather than against a generic feature list.

<svg viewBox="0 0 1000 440" role="img" aria-labelledby="orch-t orch-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="orch-t">Decision tree routing an MRV pipeline to Airflow, Prefect, or Dagster</title>
  <desc id="orch-d">Starting from an MRV pipeline, the first decision asks whether data-asset lineage must be a first-class runtime concern. If yes, a second decision asks whether the team is fluent in software-defined assets: yes routes to Dagster with audit-ready lineage (highlighted in amber), no routes to Airflow paired with OpenLineage. If lineage is not first-class, a third decision asks whether dynamic fan-out over satellite tiles dominates: yes routes to Prefect, no routes to Airflow. Airflow is reached from two paths.</desc>
  <defs>
    <marker id="orch-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- start box -->
    <rect x="420" y="10" width="160" height="44" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="500" y="30" fill="currentColor" font-size="11.5" font-weight="600">MRV pipeline</text>
    <text x="500" y="45" fill="currentColor" font-size="9" opacity="0.72">orchestrator choice</text>
    <!-- diamond 1: lineage -->
    <polygon points="500,78 632,120 500,162 368,120" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="500" y="115" fill="currentColor" font-size="10" font-weight="600">Lineage / data-assets</text>
    <text x="500" y="130" fill="currentColor" font-size="10" font-weight="600">first-class?</text>
    <!-- diamond 2: fan-out (left, from no) -->
    <polygon points="235,208 355,250 235,292 115,250" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="235" y="246" fill="currentColor" font-size="9.5" font-weight="600">Dynamic fan-out</text>
    <text x="235" y="260" fill="currentColor" font-size="9.5" font-weight="600">over tiles?</text>
    <!-- diamond 3: team maturity (right, from yes) -->
    <polygon points="770,208 895,250 770,292 645,250" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="770" y="246" fill="currentColor" font-size="9" font-weight="600">Team fluent in</text>
    <text x="770" y="260" fill="currentColor" font-size="9" font-weight="600">software-defined assets?</text>
    <!-- outcomes -->
    <rect x="40" y="360" width="180" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="130" y="386" fill="currentColor" font-size="12" font-weight="700">Prefect</text>
    <text x="130" y="404" fill="currentColor" font-size="9" opacity="0.72">Pythonic dynamic fan-out</text>
    <rect x="420" y="360" width="180" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="510" y="386" fill="currentColor" font-size="12" font-weight="700">Airflow</text>
    <text x="510" y="404" fill="currentColor" font-size="9" opacity="0.72">hardened batch &#183; OpenLineage</text>
    <rect x="790" y="360" width="180" height="60" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <text x="880" y="386" fill="#f3a712" font-size="12" font-weight="700">Dagster</text>
    <text x="880" y="404" fill="#f3a712" font-size="9" opacity="0.9">audit-ready lineage</text>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#orch-arrow)">
    <line x1="500" y1="54" x2="500" y2="76"/>
    <path d="M368 120 C 250 120, 235 170, 235 206"/>
    <path d="M632 120 C 770 120, 770 170, 770 206"/>
    <path d="M155 268 C 120 300, 128 330, 130 358"/>
    <path d="M300 275 C 430 320, 470 330, 495 358"/>
    <path d="M700 275 C 570 320, 545 330, 525 358"/>
    <path d="M840 268 C 880 300, 880 330, 880 358"/>
  </g>
  <!-- branch labels -->
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="10" font-weight="600">
    <text x="300" y="150" fill="currentColor" opacity="0.8">no</text>
    <text x="700" y="150" fill="#f3a712">yes</text>
    <text x="118" y="318" fill="currentColor" opacity="0.8">yes</text>
    <text x="400" y="316" fill="currentColor" opacity="0.8">no</text>
    <text x="600" y="316" fill="currentColor" opacity="0.8">no</text>
    <text x="882" y="318" fill="#f3a712">yes</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Choose Airflow, Prefect, or Dagster for an MRV carbon pipeline",
  "description": "A structured decision procedure that scores three orchestrators against MRV-specific criteria — dynamic tile fan-out, lineage, idempotent backfills, and audit evidence — and selects one by team profile.",
  "totalTime": "PT45M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "Prefect" },
    { "@type": "HowToTool", "name": "Dagster" },
    { "@type": "HowToTool", "name": "Apache Airflow" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Fix the non-negotiable criteria", "text": "Confirm every candidate can express idempotent, deterministically-keyed tasks and emit machine-readable lineage; eliminate any tool that cannot before comparing convenience features." },
    { "@type": "HowToStep", "name": "Test whether lineage must be first-class", "text": "If auditors require asset-level lineage and freshness as a runtime concern rather than a bolt-on, prefer Dagster; otherwise treat lineage as an integration you attach via OpenLineage." },
    { "@type": "HowToStep", "name": "Test the fan-out shape", "text": "If dynamic fan-out over thousands of tiles with variable cardinality dominates, favour Prefect's runtime task mapping over Airflow's more static task expansion." },
    { "@type": "HowToStep", "name": "Weigh team maturity", "text": "Match the tool to the team: Airflow for teams needing operational hardening, Prefect for Python-first teams, Dagster for teams ready to model software-defined assets and data contracts." },
    { "@type": "HowToStep", "name": "Prototype the backfill", "text": "Implement one idempotent tile-month task in the shortlisted tools and replay a historical window to confirm byte-identical output and clean partition semantics." },
    { "@type": "HowToStep", "name": "Wire audit evidence and commit", "text": "Serialise run metadata, partition keys, and lineage to the registry submission store, then standardise on the tool that produced the cleanest reproducible audit trail." }
  ]
}
</script>

## Why orchestrator choice matters for MRV

MRV pipelines fail verification for orchestration reasons far more often than for modelling reasons. Three structural pressures make the choice consequential rather than cosmetic.

First, **the unit of work is the tile-month, and there are a lot of them.** A national forest-carbon programme partitions its area of interest into thousands of Sentinel-2 tiles and processes each across many monthly windows, so a single reporting run fans out into tens of thousands of independent tasks whose cardinality changes every period as tiles enter and leave the acquisition schedule. An orchestrator that expands its task graph statically at parse time, or that struggles to map over a runtime-determined list, forces you to either over-provision the graph or fracture the pipeline into brittle sub-DAGs. This is where Prefect's runtime task mapping and Dagster's dynamic partitions pull ahead of a naive Airflow implementation.

Second, **replay is a compliance requirement, not an operational nicety.** When a verifier disputes a figure, or an upstream emission-factor table is revised, you must recompute a specific historical window and get an answer that is identical to — or transparently reconcilable with — the original. That demands idempotent, deterministically-keyed tasks and clean backfill semantics, the property examined in depth under [building idempotent backfills for carbon pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/). An orchestrator whose retry or backfill mechanics can silently double-write a partition is disqualifying, regardless of how good its UI looks.

Third, **lineage is evidence.** Under ISO 14064-3 and the major registry methodologies, the auditor traces each reported number back through every transformation to the raw observation. An orchestrator that treats data assets and their lineage as first-class runtime objects — as Dagster does with software-defined assets — hands you that trace for free, whereas a task-centric orchestrator makes you reconstruct it after the fact from logs and an external lineage collector. The gap between "lineage emitted by the runtime" and "lineage reassembled from logs" is precisely the gap a verifier probes.

## Pre-flight: selection criteria and a scoring table

Before comparing, fix the criteria and mark which are non-negotiable. Two are gating: every candidate must support **idempotent, deterministically-keyed tasks** and must be able to emit **machine-readable lineage** (natively or via OpenLineage). A tool that fails either is eliminated before convenience features are weighed. The remaining criteria are trade-offs you score by team profile: dynamic fan-out over tiles, data-asset/lineage awareness, retry and idempotency ergonomics, backfill semantics, typing and data contracts, local reproducibility, observability, and ecosystem breadth.

The table scores each orchestrator against those criteria on a compact scale — strong, adequate, or weak — with a one-clause justification. The scores reflect MRV fit specifically, not general-purpose merit.


| Criterion (MRV lens) | Airflow | Prefect | Dagster |
|----------------------|---------|---------|---------|
| Dynamic fan-out over tiles | Adequate — dynamic task mapping exists but leans on static structure | Strong — runtime `.map` over variable-length tile lists | Strong — dynamic partitions model the tile grid natively |
| Data-asset / lineage awareness | Weak — task-centric; lineage via external OpenLineage | Adequate — flows are task-centric; asset support is newer | Strong — software-defined assets make lineage first-class |
| Retry / idempotency ergonomics | Adequate — retries per task; idempotency is on you | Strong — `cache_key_fn` ties results to inputs | Strong — (asset, partition) identity is inherently idempotent |
| Backfill semantics | Strong — mature, explicit `catchup` and reruns | Adequate — deployment-driven, less opinionated | Strong — partition-aware backfills with clear status |
| Typing & data contracts | Weak — untyped XComs by default | Adequate — Pythonic types, Pydantic inputs | Strong — typed IO managers and asset checks |
| Local reproducibility | Adequate — needs a full scheduler/metadata DB | Strong — runs in-process, no server required | Strong — `dagster dev` reproduces the asset graph locally |
| Observability | Strong — mature UI, huge operational track record | Strong — clean run/task UI and event logs | Strong — asset catalogue, freshness, and lineage graph |
| Ecosystem & providers | Strong — vast provider/operator catalogue | Adequate — growing integration set | Adequate — integrations expanding, smaller than Airflow |


Read the table by column, not by counting ticks. Airflow's strengths cluster in operational maturity and backfill controls; its weaknesses are exactly the MRV-critical ones of native lineage and data contracts. Prefect trades some of Airflow's operational surface for markedly better dynamic fan-out and idempotency ergonomics. Dagster is the only column with "strong" against both lineage and data contracts, which is why it wins when audit evidence is the binding constraint — at the cost of a steeper conceptual model.

## Deterministic transformation logic: the same MRV task in Prefect and Dagster

The clearest way to feel the difference is to implement one idempotent MRV task in two of the three tools. The task: derive land-use-change activity data for a single satellite tile and month, reproject to an equal-area grid so per-tile areas are honest, and write to a deterministically-keyed path so a replay never double-writes. Both implementations use `structlog` for audit-ready telemetry and refuse untagged geometry.

The Prefect version leans on runtime mapping for fan-out and `cache_key_fn` for idempotency — identical inputs return the cached result rather than recomputing.

```python
import hashlib
from datetime import timedelta

import geopandas as gpd
import structlog
from prefect import flow, task, unmapped
from prefect.tasks import task_input_hash

log = structlog.get_logger()

CANONICAL_CRS = "EPSG:6933"  # equal-area grid so per-tile areas are honest


def _partition_key(tile_id: str, period: str) -> str:
    # Deterministic key: same (tile, month) -> same output path, always.
    return hashlib.sha256(f"{tile_id}:{period}".encode()).hexdigest()[:16]


@task(
    retries=3,
    retry_delay_seconds=30,
    cache_key_fn=task_input_hash,          # identical inputs -> cache hit, no re-run
    cache_expiration=timedelta(days=7),
)
def compute_tile_activity(tile_id: str, period: str, src_crs: str) -> str:
    """Idempotent land-use-change activity for one tile-month.

    Re-running with the same (tile_id, period) writes to a deterministic path,
    so a backfill can replay any window without duplicating rows.
    """
    key = _partition_key(tile_id, period)
    out_path = f"s3://mrv-activity/{period}/{tile_id}/{key}.parquet"

    gdf = gpd.read_parquet(f"s3://mrv-tiles/{period}/{tile_id}.parquet")
    if gdf.crs is None:
        raise ValueError(f"{tile_id}: untagged geometry; refusing to guess a datum")
    # Enforce declared source CRS, then reproject to the equal-area canonical grid.
    gdf = gdf.set_crs(src_crs, allow_override=False).to_crs(CANONICAL_CRS)

    gdf["area_ha"] = gdf.geometry.area / 10_000.0
    activity = gdf.dissolve(by="lulc_class", aggfunc={"area_ha": "sum"}).reset_index()
    activity[["tile_id", "period", "partition_key"]] = tile_id, period, key

    activity.to_parquet(out_path, index=False)
    log.info("tile.activity.written", tile_id=tile_id, period=period,
             partition_key=key, crs=CANONICAL_CRS, classes=int(activity.shape[0]),
             out_path=out_path)
    return out_path


@flow(name="mrv_tile_activity")
def run(period: str, tile_ids: list[str], src_crs: str = "EPSG:4326") -> list[str]:
    # Dynamic fan-out: one mapped task per tile, cardinality decided at runtime.
    futures = compute_tile_activity.map(
        tile_ids, period=unmapped(period), src_crs=unmapped(src_crs))
    return [f.result() for f in futures]
```

The Dagster version models the same computation as a software-defined asset partitioned by tile. The `(asset, partition)` pair is the identity, so re-materialising is inherently idempotent, and the output metadata Dagster records becomes queryable lineage without a separate collector.

```python
import hashlib

import geopandas as gpd
import structlog
from dagster import (
    asset, AssetExecutionContext, StaticPartitionsDefinition,
    RetryPolicy, MetadataValue,
)

log = structlog.get_logger()
CANONICAL_CRS = "EPSG:6933"  # equal-area grid so per-tile areas are honest

tiles = StaticPartitionsDefinition(["N00E010", "N00E020", "N10E010"])


@asset(
    partitions_def=tiles,          # one materialisation per tile -> native fan-out
    retry_policy=RetryPolicy(max_retries=3, delay=30),
    code_version="1.3.0",          # bump invalidates stale materialisations on replay
    group_name="mrv_activity",
)
def tile_activity(context: AssetExecutionContext) -> None:
    """Land-use-change activity for one tile partition.

    Dagster tracks the (asset, partition) identity, so re-materialising a
    partition is idempotent and lineage is recorded by the runtime itself.
    """
    tile_id = context.partition_key
    period = context.run.tags.get("period", "unknown")
    key = hashlib.sha256(f"{tile_id}:{period}".encode()).hexdigest()[:16]

    gdf = gpd.read_parquet(f"s3://mrv-tiles/{period}/{tile_id}.parquet")
    if gdf.crs is None:
        raise ValueError(f"{tile_id}: untagged geometry; refusing to guess a datum")
    gdf = gdf.to_crs(CANONICAL_CRS)  # source CRS trusted from the tagged tile
    gdf["area_ha"] = gdf.geometry.area / 10_000.0
    activity = gdf.dissolve(by="lulc_class", aggfunc={"area_ha": "sum"}).reset_index()

    out_path = f"s3://mrv-activity/{period}/{tile_id}/{key}.parquet"
    activity.to_parquet(out_path, index=False)

    log.info("tile.activity.materialised", tile_id=tile_id, period=period,
             partition_key=key, crs=CANONICAL_CRS, classes=int(activity.shape[0]))
    # Materialisation metadata becomes queryable lineage / audit evidence.
    context.add_output_metadata({
        "partition_key": MetadataValue.text(key),
        "crs": MetadataValue.text(CANONICAL_CRS),
        "lulc_classes": MetadataValue.int(int(activity.shape[0])),
        "out_path": MetadataValue.path(out_path),
    })
```

The two are functionally equivalent, but the ergonomic difference is instructive. In Prefect you keep the deterministic key and idempotency logic in your own hands — flexible, and honest about what you are guaranteeing. In Dagster the partition *is* the key, the runtime records the materialisation, and the metadata you attach is lineage the moment it is written. An Airflow implementation would sit between them: a `PythonOperator` running the same body, idempotency entirely your responsibility, and lineage emitted through an OpenLineage integration configured alongside the DAG. All three write the same equal-area Parquet; they differ in how much audit infrastructure you get without building it.

<svg viewBox="0 -4 900 234" role="img" aria-labelledby="cost-t cost-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cost-t">What each orchestrator makes you build yourself for MRV</title>
  <desc id="cost-d">Three columns listing the MRV-specific machinery each orchestrator leaves to the team. With Airflow you build idempotency helpers, a lineage integration, and data contracts, while inheriting mature backfill controls and a large provider catalogue. With Prefect you build lineage capture and data contracts, while inheriting runtime mapping and input-hash caching. With Dagster you build comparatively little, inheriting partitions, asset checks, typed IO and native lineage, but you take on a heavier conceptual model and a smaller integration set. A panel notes that the correct comparison is not features but which column of remaining work your team can actually sustain for a decade.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Compare the work you keep, not the features you get</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Everything below has to be built and maintained for the life of the crediting period.</text>
    <rect x="12" y="52" width="284" height="152" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="284" height="152" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="11" font-weight="700">Airflow</text>
    <text x="28" y="100" fill="#f3a712" font-size="9.5" font-weight="700">you build: idempotency helpers,</text>
    <text x="28" y="116" fill="#f3a712" font-size="9.5" font-weight="700">lineage integration, data contracts</text>
    <text x="28" y="142" fill="currentColor" font-size="9.5" opacity="0.85">you inherit: mature backfills,</text>
    <text x="28" y="158" fill="currentColor" font-size="9.5" opacity="0.85">huge provider catalogue, ops depth</text>
    <text x="28" y="184" fill="currentColor" font-size="9" opacity="0.72">best when operations dominate</text>
    <rect x="308" y="52" width="284" height="152" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="308" y="52" width="284" height="152" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="324" y="76" fill="currentColor" font-size="11" font-weight="700">Prefect</text>
    <text x="324" y="100" fill="#f3a712" font-size="9.5" font-weight="700">you build: lineage capture,</text>
    <text x="324" y="116" fill="#f3a712" font-size="9.5" font-weight="700">data contracts</text>
    <text x="324" y="142" fill="currentColor" font-size="9.5" opacity="0.85">you inherit: runtime mapping,</text>
    <text x="324" y="158" fill="currentColor" font-size="9.5" opacity="0.85">input-hash caching, local runs</text>
    <text x="324" y="184" fill="currentColor" font-size="9" opacity="0.72">best when fan-out dominates</text>
    <rect x="604" y="52" width="284" height="152" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="604" y="52" width="284" height="152" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="620" y="76" fill="currentColor" font-size="11" font-weight="700">Dagster</text>
    <text x="620" y="100" fill="#f3a712" font-size="9.5" font-weight="700">you build: comparatively little</text>
    <text x="620" y="126" fill="currentColor" font-size="9.5" opacity="0.85">you inherit: partitions, asset checks,</text>
    <text x="620" y="142" fill="currentColor" font-size="9.5" opacity="0.85">typed IO, native lineage</text>
    <text x="620" y="168" fill="currentColor" font-size="9.5" opacity="0.85">you take on: heavier model,</text>
    <text x="620" y="184" fill="currentColor" font-size="9.5" opacity="0.85">smaller integration set</text>
  </g>
</svg>

## Compliance gating: lineage and audit evidence per orchestrator

The audit question is always the same — can you reconstruct, for any reported figure, the exact inputs, code version, and transformations that produced it? The orchestrators answer it with different amounts of built-in support, and the difference decides how much bespoke lineage plumbing your team maintains.

- **Airflow** is task-centric and emits no data lineage natively. In practice you attach the [OpenLineage](https://openlineage.io/) integration, which captures input/output datasets and job facets per task run, and you feed those facets into your evidence store. This is a well-trodden path that connects cleanly to [tracking data lineage with OpenLineage for ESG audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), but the lineage graph lives outside Airflow and its completeness depends on disciplined instrumentation of every operator.
- **Prefect** records structured run and task events with input hashes, and its caching keys already tie a result to its inputs, which gives you a strong reproducibility signal. Asset-level lineage is newer and less central than in Dagster, so for audit you typically serialise the run metadata and partition keys yourself — the `structlog` events in the code above are designed for exactly that hand-off.
- **Dagster** treats the data asset, its code version, its partitions, and its upstream/downstream edges as runtime objects. The materialisation event, the metadata you attach, and asset checks form a lineage graph the platform maintains for you. When a verifier asks which raw tiles fed a disputed tile-month, the answer is a query against the asset catalogue rather than a log-scraping exercise.

Whichever orchestrator you pick, the outputs must land in the shape the rest of the compliance stack expects. That contract is defined by the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/): the canonical Parquet columns, the partition layout, and the metadata keys an auditor traces. The orchestrator choice changes how lineage is produced; it does not change the schema the evidence must conform to.

## Production integration: a decision procedure and recommendation by team

Turn the analysis into a repeatable choice with a fixed procedure, then read off the recommendation for your team profile.

1. **Fix the non-negotiables.** Confirm each candidate can express idempotent, deterministically-keyed tasks and emit machine-readable lineage. Eliminate anything that fails a gate before weighing convenience.
2. **Diagnose the lineage requirement.** If auditors demand asset-level lineage and freshness as a runtime property, weight Dagster heavily. If lineage can be an attached integration, keep all three in play.
3. **Diagnose the fan-out shape.** If dynamic fan-out over thousands of tiles with variable cardinality dominates, favour Prefect's runtime mapping or Dagster's dynamic partitions over a static Airflow graph.
4. **Weigh team maturity and operations.** Score each team against operational hardening (Airflow), Python-first velocity (Prefect), and readiness to model software-defined assets and data contracts (Dagster).
5. **Prototype the backfill.** Implement one idempotent tile-month task in the shortlist and replay a historical window; confirm byte-identical output and clean partition semantics — the fan-out that makes this tractable is the same [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) that sits under the compute layer.
6. **Wire audit evidence and commit.** Serialise run metadata, partition keys, and lineage to the submission store, then standardise on whichever tool produced the cleanest reproducible trail.

The recommendation matrix by team profile:

- **Established data-platform team with strong ops and a large provider surface, lineage acceptable as an integration:** choose **Airflow** with OpenLineage. Its backfill maturity and operator ecosystem are unmatched, and the lineage gap is closable with disciplined instrumentation.
- **Small-to-mid Python-first team, tile fan-out heavy, wants velocity and clean idempotency without running a heavy scheduler:** choose **Prefect**. Runtime mapping and `cache_key_fn` fit MRV fan-out and replay with minimal ceremony.
- **Team where audit lineage is the binding constraint and members are ready to model data assets and contracts:** choose **Dagster**. Software-defined assets, typed IO, and asset checks make the audit trace a runtime artifact rather than a reconstruction — the amber path in the diagram, chosen precisely because it ships audit-ready lineage.

There is no universally correct orchestrator, but for a given MRV team there is a defensible one. Score the tools against dynamic fan-out, lineage, and idempotent replay; prototype a single tile-month backfill in the shortlist; and let the cleanest reproducible audit trail — not the prettiest UI — decide.

<svg viewBox="0 -4 880 226" role="img" aria-labelledby="proto-t proto-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="proto-t">The one-week prototype that settles the choice</title>
  <desc id="proto-d">A five-step evaluation running the same tile-month task in each shortlisted orchestrator. Step one, implement one idempotent task. Step two, fan out over a thousand tiles with a cardinality that changes between runs. Step three, replay a historical window and compare output digests against the first run. Step four, kill a worker mid-run and recover. Step five, produce the audit evidence a verifier would ask for and count how much of it the tool produced unaided. A panel notes that step five is the discriminating one, that steps two to four rarely separate the candidates, and that a week of prototyping is cheap against a decade of maintenance.</desc>
  <defs>
    <marker id="proto-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="440" y="16" fill="currentColor" font-size="11.5" font-weight="700">Prototype for a week; you will maintain the answer for a decade</text>
    <rect x="12" y="52" width="160" height="76" rx="8" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="160" height="76" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="92" y="76" fill="currentColor" font-size="9.5" font-weight="700">1 · one idempotent</text>
    <text x="92" y="92" fill="currentColor" font-size="9.5" font-weight="700">tile-month task</text>
    <text x="92" y="114" fill="currentColor" font-size="9" opacity="0.75">the unit of everything</text>
    <rect x="188" y="52" width="160" height="76" rx="8" fill="currentColor" opacity="0.07"/>
    <rect x="188" y="52" width="160" height="76" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="268" y="76" fill="currentColor" font-size="9.5" font-weight="700">2 · fan out over 1 000</text>
    <text x="268" y="92" fill="currentColor" font-size="9.5" font-weight="700">with varying cardinality</text>
    <text x="268" y="114" fill="currentColor" font-size="9" opacity="0.75">rarely separates them</text>
    <rect x="364" y="52" width="160" height="76" rx="8" fill="currentColor" opacity="0.07"/>
    <rect x="364" y="52" width="160" height="76" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="444" y="76" fill="currentColor" font-size="9.5" font-weight="700">3 · replay, compare</text>
    <text x="444" y="92" fill="currentColor" font-size="9.5" font-weight="700">output digests</text>
    <text x="444" y="114" fill="currentColor" font-size="9" opacity="0.75">must be byte-identical</text>
    <rect x="540" y="52" width="160" height="76" rx="8" fill="currentColor" opacity="0.07"/>
    <rect x="540" y="52" width="160" height="76" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="620" y="76" fill="currentColor" font-size="9.5" font-weight="700">4 · kill a worker,</text>
    <text x="620" y="92" fill="currentColor" font-size="9.5" font-weight="700">recover</text>
    <text x="620" y="114" fill="currentColor" font-size="9" opacity="0.75">check for partial writes</text>
    <rect x="716" y="52" width="152" height="76" rx="8" fill="currentColor" opacity="0.13"/>
    <rect x="716" y="52" width="152" height="76" rx="8" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="792" y="76" fill="currentColor" font-size="9.5" font-weight="700">5 · produce the</text>
    <text x="792" y="92" fill="currentColor" font-size="9.5" font-weight="700">audit evidence</text>
    <text x="792" y="114" fill="#f3a712" font-size="9" font-weight="700">the discriminating step</text>
    <text x="440" y="182" fill="currentColor" font-size="9.5" opacity="0.85">Count how much of the evidence package each tool produced without bespoke code. That number is the answer.</text>
    <text x="440" y="204" fill="currentColor" font-size="9.5" opacity="0.85">Steps 2 to 4 usually tie; teams that stop there choose on taste and rebuild the evidence layer twice.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#proto-arrow)">
    <line x1="172" y1="90" x2="186" y2="90"/><line x1="348" y1="90" x2="362" y2="90"/>
    <line x1="524" y1="90" x2="538" y2="90"/><line x1="700" y1="90" x2="714" y2="90"/>
  </g>
</svg>

## Frequently Asked Questions

### Does the orchestrator choice really matter if the tasks are well written?

Less than vendors suggest and more than engineers hope. Well-written tasks — idempotent, deterministically keyed, side-effect free — port between all three with modest effort, which is the argument for keeping business logic out of the orchestrator. What does not port is the evidence layer: lineage, asset metadata, and replay semantics differ enough that rebuilding them is a project. That is why the prototype should be scored on evidence rather than on ergonomics.

### Can I migrate later if I choose wrong?

Migrating the execution is feasible; migrating the history is not. Tasks move with modest rework, but the lineage and run metadata accumulated under the old tool generally stay there, and a crediting period that spans the migration then has its evidence split across two systems. If migration is plausible, keep the evidence record in your own store from the start — emitted from your code rather than read out of the orchestrator — and the migration becomes an operational change rather than a compliance one.

### What about running more than one orchestrator?

Common in practice and usually accidental — a legacy Airflow deployment plus a newer Prefect or Dagster footprint. It is survivable if both emit into one evidence store with consistent identifiers, and painful otherwise, because a verifier asking for a complete trace gets two partial answers. If you find yourself here, unify the evidence layer first and treat consolidating the schedulers as a separate, lower-priority project.

### How much does managed hosting change the comparison?

It changes the operational column substantially and the evidence column not at all. Managed control planes remove most of the reason Airflow's operational maturity was decisive, which shifts weight toward fan-out ergonomics and lineage. It also introduces a retention question: a managed service's run history is subject to its own retention policy, which will not match a decades-long audit horizon, reinforcing the case for owning the evidence record.

### Which one would you start with today for a new MRV platform?

If audit lineage is the binding constraint and the team can absorb the asset model, Dagster — because the evidence layer is the expensive thing to build and it is the one Dagster gives you. If the team is small and Python-first with heavy tile fan-out, Prefect, and plan to build the evidence layer yourself from the start. Airflow remains the right answer where an organisation already operates it well and the provider catalogue is doing real work; the lineage gap is closable with disciplined instrumentation.

## Related guides

- [Orchestrating MRV Data Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) — the parent coordination discipline this decision sits within.
- [Building Idempotent Backfills for Carbon Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/) — the replay property every candidate orchestrator must support.
- [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) — the canonical output contract every orchestrator's tasks must conform to.
- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — the tile-partitioned compute layer the orchestrator fans out over.
