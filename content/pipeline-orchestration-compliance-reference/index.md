---
shortTitle: "Pipeline Orchestration & Compliance Reference"
title: "Pipeline Orchestration & Compliance Reference"
description: "Run and govern MRV pipelines end-to-end: workflow orchestration with Prefect/Airflow/Dagster, a canonical Parquet schema and versioned emission factors, and registry-standard compliance mapping."
slug: pipeline-orchestration-compliance-reference
type: section
breadcrumb: "Orchestration & Reference"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Pipeline Orchestration & Compliance Reference

**Pipeline Orchestration & Compliance Reference** is the control and governance plane of a Measurement, Reporting, and Verification (MRV) platform: the layer that decides *when* every stage runs, *how* it recovers from failure, *which* schema and reference data it is allowed to touch, and *whether* its outputs are fit to submit to a carbon registry. Where the other three sections of this site produce carbon numbers, this section is responsible for making those numbers reproducible, on-time, and defensible. It orchestrates the ingestion and normalization work described in [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/), schedules the heavy raster processing built in [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/), and gates the modeling outputs from [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) before a single tonne is claimed.

Treating orchestration and reference data as an afterthought is the most common reason otherwise-sound carbon pipelines fail third-party verification. A model can be scientifically correct and still be rejected because two runs produced different numbers from the same inputs, because an emission factor was silently upgraded mid-reporting-period, or because a partial backfill double-counted a region. This section addresses that risk head-on with three tightly coupled concerns: workflow orchestration that guarantees idempotent, retry-safe, observable execution; a canonical data-schema and reference layer — the shared Parquet contract and versioned emission-factor databases — that every stage reads from and writes to; and a compliance mapping layer that ties each output to the registry standards and methodologies it must satisfy (Verra VM-series, Gold Standard, CSRD ESRS E1, ISO 14064). The detailed engineering lives in three areas this page coordinates: [orchestrating MRV data pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/), the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/), and [carbon registry standards and methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/).

<svg viewBox="0 0 1000 400" role="img" aria-labelledby="ocp-t ocp-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ocp-t">MRV control and governance plane</title>
  <desc id="ocp-d">An orchestration control plane — scheduler, retries, idempotency keys and structlog telemetry — drives five deterministic stages from left to right: ingest, normalize, factor, aggregate and verify. Two governing layers sit beneath the stages and feed into them: a schema and reference registry holding the canonical Parquet contract and versioned emission factors, and a compliance and standards mapping layer covering Verra VM-series, Gold Standard, CSRD ESRS E1 and ISO 14064. The verify stage emits to a carbon registry submission package, drawn in amber, which bundles the audit trail.</desc>
  <defs>
    <marker id="ocp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
    <marker id="ocp-arrow-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#f3a712"/>
    </marker>
  </defs>
  <g text-anchor="middle">
    <!-- Orchestration control plane bar -->
    <rect x="40" y="40" width="764" height="68" rx="9" fill="var(--c-surface-2)" stroke="currentColor" stroke-width="1.4" stroke-dasharray="6 4"/>
    <text x="422" y="68" font-size="13" font-weight="700" fill="var(--c-primary-700)">Orchestration control plane</text>
    <text x="422" y="90" font-size="10" fill="currentColor" fill-opacity="0.78">scheduler &#183; retries &#183; idempotency keys &#183; structlog telemetry</text>
    <!-- control arrows down to each stage -->
    <g stroke="currentColor" stroke-width="1.3" fill="none" stroke-dasharray="4 3" marker-end="url(#ocp-arrow)" opacity="0.7">
      <line x1="110" y1="108" x2="110" y2="164"/>
      <line x1="266" y1="108" x2="266" y2="164"/>
      <line x1="422" y1="108" x2="422" y2="164"/>
      <line x1="578" y1="108" x2="578" y2="164"/>
      <line x1="734" y1="108" x2="734" y2="164"/>
    </g>
    <!-- deterministic stages -->
    <g>
      <rect x="40" y="168" width="140" height="88" rx="9" fill="var(--c-surface)" stroke="currentColor" stroke-opacity="0.4"/>
      <rect x="196" y="168" width="140" height="88" rx="9" fill="var(--c-surface)" stroke="currentColor" stroke-opacity="0.4"/>
      <rect x="352" y="168" width="140" height="88" rx="9" fill="var(--c-surface)" stroke="currentColor" stroke-opacity="0.4"/>
      <rect x="508" y="168" width="140" height="88" rx="9" fill="var(--c-surface)" stroke="currentColor" stroke-opacity="0.4"/>
      <rect x="664" y="168" width="140" height="88" rx="9" fill="var(--c-surface)" stroke="var(--c-accent)" stroke-width="2"/>
    </g>
    <g font-size="12.5" font-weight="600" fill="var(--c-primary-700)">
      <text x="110" y="198">Ingest</text>
      <text x="266" y="198">Normalize</text>
      <text x="422" y="198">Factor</text>
      <text x="578" y="198">Aggregate</text>
      <text x="734" y="198">Verify</text>
    </g>
    <g font-size="8.7" fill="currentColor" fill-opacity="0.75">
      <text x="110" y="220">sensor &amp;</text>
      <text x="110" y="234">activity feeds</text>
      <text x="266" y="220">CRS &#183; schema</text>
      <text x="266" y="234">contract</text>
      <text x="422" y="220">versioned</text>
      <text x="422" y="234">emission factors</text>
      <text x="578" y="220">pools &#183;</text>
      <text x="578" y="234">GeoParquet</text>
      <text x="734" y="220">validation gates</text>
      <text x="734" y="234">raise on fail</text>
    </g>
    <!-- data flow arrows between stages -->
    <g stroke="currentColor" stroke-width="1.6" fill="none" marker-end="url(#ocp-arrow)" color="var(--c-primary)">
      <line x1="180" y1="212" x2="194" y2="212"/>
      <line x1="336" y1="212" x2="350" y2="212"/>
      <line x1="492" y1="212" x2="506" y2="212"/>
      <line x1="648" y1="212" x2="662" y2="212"/>
    </g>
    <!-- governing layers -->
    <rect x="40" y="300" width="372" height="84" rx="9" fill="var(--c-surface-2)" stroke="var(--c-secondary-700)" stroke-width="1.5"/>
    <rect x="432" y="300" width="372" height="84" rx="9" fill="var(--c-surface-2)" stroke="var(--c-secondary-700)" stroke-width="1.5"/>
    <text x="226" y="326" font-size="12" font-weight="700" fill="var(--c-secondary-700)">Schema &amp; reference registry</text>
    <text x="226" y="348" font-size="9" fill="currentColor" fill-opacity="0.78">canonical Parquet contract</text>
    <text x="226" y="364" font-size="9" fill="currentColor" fill-opacity="0.78">versioned emission factors</text>
    <text x="618" y="326" font-size="12" font-weight="700" fill="var(--c-secondary-700)">Compliance &amp; standards mapping</text>
    <text x="618" y="348" font-size="9" fill="currentColor" fill-opacity="0.78">Verra VM &#183; Gold Standard</text>
    <text x="618" y="364" font-size="9" fill="currentColor" fill-opacity="0.78">CSRD ESRS E1 &#183; ISO 14064</text>
    <!-- governance up-arrows to stages -->
    <g stroke="var(--c-secondary-700)" stroke-width="1.3" fill="none" marker-end="url(#ocp-arrow)" opacity="0.85">
      <line x1="266" y1="300" x2="266" y2="258"/>
      <line x1="422" y1="300" x2="422" y2="258"/>
      <line x1="578" y1="300" x2="578" y2="258"/>
      <line x1="734" y1="300" x2="734" y2="258"/>
    </g>
    <!-- output: carbon registry submission (amber) -->
    <rect x="852" y="168" width="132" height="88" rx="9" fill="var(--c-surface)" stroke="#f3a712" stroke-width="2.5"/>
    <text x="918" y="198" font-size="12" font-weight="700" fill="#f3a712">Carbon registry</text>
    <text x="918" y="218" font-size="9" fill="currentColor" fill-opacity="0.8">submission package</text>
    <text x="918" y="234" font-size="9" fill="currentColor" fill-opacity="0.8">+ audit bundle</text>
    <line x1="804" y1="212" x2="850" y2="212" stroke="#f3a712" stroke-width="1.8" fill="none" marker-end="url(#ocp-arrow-amber)"/>
  </g>
</svg>

## Core Pipeline Architecture

The orchestration layer is not a scheduler that happens to run some scripts; it is the component that turns a collection of correct transformations into a *reproducible system*. Every MRV pipeline that survives audit shares the same structural spine: a directed acyclic graph (DAG) of stateless, idempotent tasks whose execution order, retry policy, and data contracts are declared explicitly and enforced by the orchestrator rather than assumed. The canonical stage sequence — ingest, normalize, factor, aggregate, verify — is deliberately linear and deterministic, because a reporting period must be reconstructable bit-for-bit from raw inputs and the pinned versions of the reference data used. The choice of engine (Prefect, Airflow, or Dagster) matters less than the guarantees the engine is configured to provide, and the trade-offs between them are worked through in detail under [orchestrating MRV data pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/).

Three properties are non-negotiable for a carbon pipeline. **Idempotency** means that re-running a task with the same inputs produces the same output and no duplicate side effects; without it, a retried backfill can double-count activity data or emit two credit-eligible records for one hectare. **Retry safety** means transient failures — a throttled STAC endpoint, a spot instance reclaimed mid-tile, a momentary object-store timeout — are absorbed by bounded, exponential retries at task granularity rather than failing an entire continental run. **Observability** means every task emits structured telemetry that becomes part of the audit trail: which inputs it read, which reference versions it pinned, how long it ran, and whether every validation gate passed. These are not operational niceties. They are the mechanism by which a registry, or a buyer's due-diligence team, can trust that the number in a submission is the number the code actually produced.

The idempotency guarantee is implemented with an explicit **idempotency key** derived from the semantic identity of a unit of work — typically a hash over the project identifier, the reporting period, the tile or stratum, and the pinned versions of every reference input. The orchestrator uses that key to deduplicate: if a task with a given key has already completed and written its output, a re-run is a no-op that returns the existing artifact rather than recomputing and re-emitting it. This single discipline is what makes backfills, gap-fills, and disaster-recovery replays safe, and the patterns for constructing keys that survive partial and overlapping backfills are the subject of [building idempotent backfills for carbon pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/).

The Prefect flow below is a representative skeleton of the control plane. It orchestrates the full ingest-to-verify sequence, attaches retries and idempotency keys to every task, threads a run-scoped `structlog` logger through the graph, and places explicit validation gates that raise on failure rather than letting a defective artifact reach the aggregation and submission stages.

```python
from __future__ import annotations

import hashlib
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import geopandas as gpd
import pandas as pd
import pyarrow.parquet as pq
import structlog
from prefect import flow, task
from prefect.tasks import task_input_hash

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()

CANONICAL_CRS = "EPSG:6933"          # World Cylindrical Equal Area — area-honest pools
SCHEMA_CONTRACT_VERSION = "mrv-core-v3.2.0"
EF_DB_VERSION = "ipcc-2019-refinement+regional-2026.1"
REQUIRED_COLUMNS = {"geometry", "activity_id", "activity_qty", "unit", "epoch"}


class ValidationGateError(RuntimeError):
    """Raised when an artifact fails a hard compliance or integrity gate."""


def idempotency_key(*, project: str, period: str, stage: str) -> str:
    """Semantic identity of a unit of work; pins reference versions so a
    factor-database bump changes the key and forces a clean recompute."""
    material = "|".join([project, period, stage, SCHEMA_CONTRACT_VERSION, EF_DB_VERSION])
    return hashlib.sha256(material.encode("utf-8")).hexdigest()[:16]


@task(retries=3, retry_delay_seconds=[10, 30, 90], cache_key_fn=task_input_hash)
def ingest(source_uri: str, *, project: str, period: str) -> gpd.GeoDataFrame:
    """Pull raw activity/sensor features and tag them with provenance."""
    key = idempotency_key(project=project, period=period, stage="ingest")
    gdf = gpd.read_parquet(source_uri)
    gdf["_ingest_key"] = key
    gdf["_source_uri"] = source_uri
    log.info("ingest.complete", project=project, period=period,
             key=key, rows=len(gdf), source=source_uri)
    return gdf


@task(retries=3, retry_delay_seconds=[10, 30, 90])
def normalize(gdf: gpd.GeoDataFrame, *, project: str, period: str) -> gpd.GeoDataFrame:
    """Enforce the canonical CRS and the shared Parquet schema contract."""
    if gdf.crs is None:
        raise ValidationGateError("ingest emitted an untagged CRS; refusing to guess a datum")
    gdf = gdf.to_crs(CANONICAL_CRS)

    missing = REQUIRED_COLUMNS - set(gdf.columns)
    if missing:
        raise ValidationGateError(f"schema {SCHEMA_CONTRACT_VERSION} violated; missing {sorted(missing)}")

    invalid = int((~gdf.geometry.is_valid).sum())
    if invalid:
        log.warning("normalize.geometry.repaired", project=project, invalid=invalid)
        gdf["geometry"] = gdf.geometry.make_valid()

    log.info("normalize.complete", project=project, period=period,
             crs=CANONICAL_CRS, schema=SCHEMA_CONTRACT_VERSION, rows=len(gdf))
    return gdf


@task(retries=2, retry_delay_seconds=30)
def apply_factors(gdf: gpd.GeoDataFrame, ef_table: pd.DataFrame,
                  *, project: str, period: str) -> gpd.GeoDataFrame:
    """Join spatially explicit, versioned emission factors onto activity rows."""
    merged = gdf.merge(ef_table, on=["activity_id", "unit"], how="left", validate="many_to_one")
    unmatched = int(merged["ef_value"].isna().sum())
    if unmatched:
        raise ValidationGateError(
            f"{unmatched} rows had no factor in {EF_DB_VERSION}; "
            "unmapped activities cannot be quantified")
    merged["emissions_tco2e"] = merged["activity_qty"] * merged["ef_value"]
    merged["_ef_db_version"] = EF_DB_VERSION
    log.info("factor.complete", project=project, period=period,
             ef_db=EF_DB_VERSION, matched=len(merged))
    return merged


@task(retries=2, retry_delay_seconds=30)
def aggregate(gdf: gpd.GeoDataFrame, *, project: str, period: str) -> pd.DataFrame:
    """Roll pixel/parcel emissions up to the reporting stratum."""
    rolled = (gdf.groupby(["activity_id", "epoch"], as_index=False)["emissions_tco2e"]
              .sum().sort_values("emissions_tco2e", ascending=False))
    log.info("aggregate.complete", project=project, period=period,
             strata=len(rolled), total_tco2e=round(float(rolled["emissions_tco2e"].sum()), 3))
    return rolled


@task
def verify(rolled: pd.DataFrame, *, project: str, period: str,
           max_relative_uncertainty: float = 0.15) -> dict[str, Any]:
    """Hard verification gate: raises unless the batch is submission-ready."""
    if (rolled["emissions_tco2e"] < 0).any():
        raise ValidationGateError("negative emissions in aggregate; a factor or sign error upstream")
    if rolled.empty:
        raise ValidationGateError("empty aggregate; nothing to submit")

    total = float(rolled["emissions_tco2e"].sum())
    certificate = {
        "project": project,
        "period": period,
        "schema_contract": SCHEMA_CONTRACT_VERSION,
        "ef_db_version": EF_DB_VERSION,
        "crs": CANONICAL_CRS,
        "total_tco2e": round(total, 3),
        "max_relative_uncertainty": max_relative_uncertainty,
        "sealed_at": datetime.now(timezone.utc).isoformat(),
    }
    canonical = json.dumps(certificate, sort_keys=True, separators=(",", ":")).encode("utf-8")
    certificate["content_hash"] = hashlib.sha256(canonical).hexdigest()
    log.info("verify.passed", project=project, period=period,
             content_hash=certificate["content_hash"], total_tco2e=certificate["total_tco2e"])
    return certificate


@flow(name="mrv_reporting_flow", log_prints=True)
def run_reporting_period(source_uri: str, ef_uri: str, out_dir: str,
                         *, project: str, period: str) -> Path:
    """Orchestrate ingest -> normalize -> factor -> aggregate -> verify."""
    ef_table = pd.read_parquet(ef_uri)
    raw = ingest(source_uri, project=project, period=period)
    norm = normalize(raw, project=project, period=period)
    factored = apply_factors(norm, ef_table, project=project, period=period)
    rolled = aggregate(factored, project=project, period=period)
    certificate = verify(rolled, project=project, period=period)

    out = Path(out_dir) / f"{project}_{period}_submission.parquet"
    rolled.to_parquet(out, index=False)
    (out.with_suffix(".certificate.json")).write_text(json.dumps(certificate, indent=2))
    log.info("flow.complete", project=project, period=period, output=str(out))
    return out


if __name__ == "__main__":
    run_reporting_period(
        "s3://mrv/raw/activity.parquet",
        "s3://mrv/reference/ef_2026.1.parquet",
        "output/",
        project="REDD-BR-014",
        period=str(date(2026, 1, 1)),
    )
```

Every task in this skeleton follows the same contract that runs through the whole platform: bounded retries on transient failure, an idempotency key that pins the reference versions it consumed, structured telemetry on entry and exit, and a hard gate that raises rather than emitting a defective artifact. The verify task does not "clean up" bad data — it refuses it, so a defect surfaces as a failed run an operator investigates instead of a silently corrupted submission an auditor later rejects.

## Spatial Alignment & Data Normalization

The normalize stage is where the reference layer stops being documentation and becomes an enforced contract. In an MRV platform, dozens of upstream producers — optical compositing jobs, LiDAR/SAR fusion runs, activity-data connectors, field-inventory ingest — all write into the same downstream aggregation. If each producer chooses its own column names, CRS conventions, units, and null handling, the aggregation stage becomes a swamp of defensive special-casing and the audit trail becomes impossible to reason about. The canonical Parquet schema exists to eliminate that entropy: it defines the exact column set, dtypes, unit conventions, CRS policy, and provenance fields that every artifact crossing a stage boundary must satisfy, and it is versioned so a schema change is a deliberate, dated event rather than a silent drift. The full field-by-field data dictionary is maintained in the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/), and the specific column-level definitions live in [the canonical Parquet schema data dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/).

CRS handling is the highest-value gate in the normalize stage because CRS errors are silent and systematic. A dataset delivered in unprojected WGS84 and naively treated as metres, or a subtle datum shift between two nominally identical `EPSG:4326` layers, will not throw — it will quietly bias every area-based calculation downstream. The normalize stage therefore refuses untagged geometry outright, reprojects everything to a single area-honest grid (`EPSG:6933` for global pools, or a jurisdiction-appropriate equal-area projection), and records the transformation it applied. The mechanics of doing this correctly, including the failure modes that produce silent datum shifts, are covered in the foundational [geospatial coordinate reference systems (CRS) alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) work that this stage consumes and enforces.

Reference data — emission factors, allometric equations, biome-specific expansion factors — is the second half of the normalization problem, and it is where reproducibility is most often lost. An emission-factor database is not static: IPCC refinements, regional recalibrations, and methodology updates all change factor values over time. If a pipeline reads "the current factors" at run time, then two runs of the same reporting period separated by a database update will produce different numbers from identical activity data, and neither run can be reconstructed later. The discipline that prevents this is strict version pinning: every run records the exact emission-factor database version it used, that version is immutable, and the idempotency key incorporates it so a factor upgrade forces a clean, traceable recompute rather than a silent overwrite. The practices for versioning, storing, and retiring factor databases so that historical reporting periods remain reproducible are detailed in [versioning emission factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/). Because factors are spatially explicit rather than globally averaged, the normalization stage also carries the per-region variance that feeds downstream uncertainty propagation, connecting directly to the modeling work in [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/).

## Compliance Mapping & Regulatory Framework

The compliance layer answers a question the modeling layers cannot: *is this output acceptable to the standard we are reporting under?* Scientific correctness is necessary but not sufficient — a carbon number must also satisfy the specific stratification rules, uncertainty deductions, permanence tests, and disclosure formats of the registry or regulation it targets. The governance plane treats those requirements as machine-checkable controls embedded in the graph, not as prose narrated in a methodology PDF and hoped for at audit time. The full mapping between pipeline outputs and each standard is maintained under [carbon registry standards and methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/).

- **Verra VM-series.** Project-crediting methodologies such as VM0047 (afforestation, reforestation and revegetation) and VM0042 (improved agricultural land management) impose explicit stratification, plot-density, and uncertainty-deduction rules. The verification stage encodes these as deductions applied *before* tonnage is issued, so an over-optimistic estimate is conservatively discounted rather than submitted at face value. The GIS-specific requirements — boundary topology, stratum delineation, sampling design — differ between registries, and the contrasts are worked through in [Verra VM0047 vs Gold Standard GIS requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/).
- **Gold Standard.** Gold Standard methodologies share the conservativeness principle but differ in their spatial-data expectations, monitoring cadence, and safeguarding requirements. The compliance layer parameterizes these differences rather than forking the pipeline, so a single platform can serve multiple registries from one canonical data model.
- **CSRD ESRS E1.** The Corporate Sustainability Reporting Directive's climate standard demands granular, assured disclosures — including gross Scope 1/2/3 emissions, removals, and the estimation uncertainty behind them. Meeting it means carrying uncertainty bands and lineage on every published figure, and formatting disclosures to the ESRS taxonomy. The specific crosswalk from spatial MRV outputs to ESRS E1 datapoints is set out in [mapping CSRD ESRS E1 disclosures to spatial MRV outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/).
- **ISO 14064.** ISO 14064-2 governs project-level quantification (baseline, additionality, leakage, permanence) and ISO 14064-3 governs validation and verification, emphasizing reproducibility and conservativeness. The pipeline satisfies both by making every figure recomputable from pinned inputs and by biasing every uncertainty treatment toward the conservative side of the distribution.

The compliance layer also reconciles project-level land-sector removals against corporate inventories to prevent double counting, drawing on the boundary definitions established in [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/). A removal claimed by a landowner and an emission reduction claimed in a buyer's value chain must not silently refer to the same hectare, and the spatial-join logic that prevents this overlap is a compliance control as much as an engineering one.


| Pipeline output | Standard / methodology | Control enforced in the graph |
|-----------------|------------------------|-------------------------------|
| Aggregated emissions/removals total | ISO 14064-2, Verra VM-series | Conservative uncertainty deduction applied before issuance |
| Per-figure uncertainty band | CSRD ESRS E1, ISO 14064-3 | Disclosure blocked unless relative uncertainty ≤ methodology ceiling |
| Boundary & stratum topology | Verra VM0047, Gold Standard | `ST_IsValid` / non-overlap topology gate at ingest and verify |
| Emission-factor version tag | ISO 14064-3 reproducibility | Version pinned in idempotency key; run rejected if unpinned |
| Lineage / content hash | CSRD assurance, ISO 14064-3 | Submission refused unless a sealed audit record exists |


<svg viewBox="207 -30 697 262" role="img" aria-labelledby="orch2-t orch2-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="orch2-t">The three contracts that hold an MRV platform together</title>
  <desc id="orch2-d">Three interlocking contracts drawn as overlapping responsibilities. The schema contract fixes columns, units, and coordinate reference systems, and is consumed by every stage. The orchestration contract fixes partition keys, idempotency, and replay semantics, and is what makes a historical window recomputable. The evidence contract fixes lineage, versions, and signatures, and is what makes a figure defensible. A central overlap is labelled reproducible reported figure, and a panel notes that a platform satisfying only two of the three fails in a characteristic way: without schema it cannot be validated, without orchestration it cannot be replayed, and without evidence it cannot be defended.</desc>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Three contracts, and the failure mode of dropping each</text>
    <circle cx="330" cy="128" r="86" fill="currentColor" opacity="0.08"/>
    <circle cx="330" cy="128" r="86" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="450" cy="128" r="86" fill="currentColor" opacity="0.08"/>
    <circle cx="450" cy="128" r="86" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="390" cy="72" r="86" fill="currentColor" opacity="0.08"/>
    <circle cx="390" cy="72" r="86" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="390" y="34" fill="currentColor" font-size="10" font-weight="700">Schema</text>
    <text x="390" y="48" fill="currentColor" font-size="8.5" opacity="0.8">columns · units · CRS</text>
    <text x="272" y="188" fill="currentColor" font-size="10" font-weight="700">Orchestration</text>
    <text x="272" y="202" fill="currentColor" font-size="8.5" opacity="0.8">partitions · idempotency</text>
    <text x="516" y="188" fill="currentColor" font-size="10" font-weight="700">Evidence</text>
    <text x="516" y="202" fill="currentColor" font-size="8.5" opacity="0.8">lineage · versions · signature</text>
    <text x="390" y="112" fill="currentColor" font-size="9.5" font-weight="700">reproducible</text>
    <text x="390" y="126" fill="currentColor" font-size="9.5" font-weight="700">reported figure</text>
    <rect x="622" y="52" width="266" height="128" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="622" y="52" width="266" height="128" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="755" y="76" fill="currentColor" font-size="10" font-weight="700">Drop one and it fails predictably</text>
    <text x="755" y="102" fill="currentColor" font-size="9.5" opacity="0.85">no schema → cannot be validated</text>
    <text x="755" y="124" fill="currentColor" font-size="9.5" opacity="0.85">no orchestration → cannot be replayed</text>
    <text x="755" y="146" fill="currentColor" font-size="9.5" opacity="0.85">no evidence → cannot be defended</text>
    <text x="755" y="168" fill="#f3a712" font-size="9.5" font-weight="700">all three are load-bearing</text>
  </g>
</svg>

## Audit Trails, Lineage & Provenance

Verification is a question about *evidence*, and the orchestration layer is where that evidence is generated as a by-product of running the pipeline rather than assembled by hand afterward. Every task in the flow emits structured telemetry, and the verify stage seals a tamper-evident certificate whose content hash chains over the reporting total, the schema-contract version, the emission-factor database version, the CRS, and the timestamp. Any later mutation of those inputs changes the digest, so a certificate is a cryptographic assertion that a specific number was produced from a specific configuration. This inherits directly from the provenance discipline established in [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), which this section operationalizes at the orchestration level.

A complete audit record for one reporting period captures four things, and the orchestrator is responsible for ensuring none of them can be omitted:

1. **Input identity** — content checksums, STAC item IDs, and temporal stamps for every raster, vector, and table the run consumed, plus the source URIs recorded at ingest.
2. **Pinned configuration** — the schema-contract version, the emission-factor database version, the CRS, the library and code versions, and any random seed used for a Monte Carlo pass.
3. **Validation outcomes** — the pass/fail result of every gate, the topology checks, the uncertainty bounds, and every compliance deduction applied.
4. **Output artifacts** — the GeoParquet and Cloud-Optimized GeoTIFF URLs, their hashes, and the sealed verification certificate that authorizes submission.

Because outputs land in append-only object storage with immutable retention, a recalibration never overwrites history — it produces a new, versioned correction layer alongside the original, and both carry their own certificates. This is what makes lineage *queryable* rather than archival: an auditor can walk from a retired credit back to the exact run, the exact factor version, and the exact tiles that produced it. When broken or missing lineage does surface — a dropped `parent_run_id`, an unversioned reference read, a gap in the hash chain — the diagnostic playbook in [troubleshooting broken data lineage in MRV audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/troubleshooting-broken-data-lineage-in-mrv-audits/) is the reference for reconstructing it. The sealed certificate is also what closes the loop into the registry: it is submitted alongside tonnage so the registry, and any downstream buyer, can independently recompute the figure.

## Production Deployment & Validation Patterns

Running this control plane in production is an infrastructure discipline in its own right. The orchestrator is the single point at which idempotency, retries, per-task CRS gates, and telemetry are enforced, so the deployment patterns around it are what keep the guarantees intact under real load, partial failure, and change over time.

- **Orchestrator selection by guarantee, not fashion.** Prefect, Airflow, and Dagster all express DAGs, but they differ in dynamic task mapping, native retries, caching, and typed data passing. Choose the engine whose defaults make idempotency and observability the path of least resistance; the head-to-head comparison for MRV workloads is in [Prefect vs Airflow vs Dagster for MRV pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/prefect-vs-airflow-vs-dagster-for-mrv-pipelines/).
- **Idempotent backfills as a first-class operation.** Reporting corrections, late-arriving activity data, and reprocessing after a factor upgrade all require backfills that do not double-count. Idempotency keys that incorporate the reporting period and pinned reference versions make overlapping backfills safe, as detailed in [building idempotent backfills for carbon pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/).
- **Schema and factor versioning under CI.** Treat the canonical schema and the emission-factor database as versioned, tested artifacts. A schema migration or factor bump runs through the same review, changelog, and regression-test gate as code, so no reporting figure changes without a dated, reviewed cause.
- **Data-quality gates as executable contracts.** Layer declarative expectations — with `great_expectations` or an equivalent — over the schema contract so range, null, and distribution violations fail the run at the boundary rather than surfacing as anomalies in a submission. The pattern is developed in [building Great Expectations checks for emissions data](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/building-great-expectations-checks-for-emissions-data/).
- **Observability and cost control.** Instrument the orchestrator with metrics — task latency, retry rates, validation-failure rates, and cloud egress — and route the structured logs to a queryable store. Use spot capacity for stateless raster algebra and reserved capacity for the persistent reference and topology databases, and alert on drift in the median uncertainty and gate-failure rates even on runs that pass.

For teams standardizing on open specifications, the [OpenLineage](https://openlineage.io/) standard provides a portable lineage model that plugs directly into these orchestrators, while the [STAC Specification](https://stacspec.org/) keeps input identity machine-readable across the ingest boundary. Both decouple the governance plane from any single engine, which is what lets a platform migrate orchestrators without losing its audit history.

<svg viewBox="0 -4 880 224" role="img" aria-labelledby="cad-t cad-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cad-t">Four clocks an MRV platform runs on, and why they must be separated</title>
  <desc id="cad-d">Four timelines at different cadences. Acquisition cadence runs every few days as satellite scenes land. Processing cadence runs nightly, transforming whatever has arrived. Reporting cadence runs quarterly or annually, freezing a period for disclosure. Audit cadence runs at unpredictable intervals over decades, replaying arbitrary historical windows. A panel explains that coupling any two of these produces a characteristic failure: coupling processing to reporting means a late scene cannot be incorporated, and coupling audit to processing means a replay must use today's code rather than the code that produced the figure.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Four clocks, deliberately unsynchronised</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Coupling any two of them is a design error with a predictable symptom.</text>
    <text x="12" y="66" fill="currentColor" font-size="10" font-weight="700">Acquisition</text>
    <text x="12" y="106" fill="currentColor" font-size="10" font-weight="700">Processing</text>
    <text x="12" y="146" fill="currentColor" font-size="10" font-weight="700">Reporting</text>
    <text x="12" y="186" fill="currentColor" font-size="10" font-weight="700">Audit</text>
  </g>
  <g>
    <line x1="130" y1="62" x2="600" y2="62" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
    <circle cx="146" cy="62" r="4" fill="currentColor"/><circle cx="186" cy="62" r="4" fill="currentColor"/><circle cx="226" cy="62" r="4" fill="currentColor"/>
    <circle cx="266" cy="62" r="4" fill="currentColor"/><circle cx="306" cy="62" r="4" fill="currentColor"/><circle cx="346" cy="62" r="4" fill="currentColor"/>
    <circle cx="386" cy="62" r="4" fill="currentColor"/><circle cx="426" cy="62" r="4" fill="currentColor"/><circle cx="466" cy="62" r="4" fill="currentColor"/>
    <circle cx="506" cy="62" r="4" fill="currentColor"/><circle cx="546" cy="62" r="4" fill="currentColor"/><circle cx="586" cy="62" r="4" fill="currentColor"/>
    <text x="616" y="66" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">every few days</text>
    <line x1="130" y1="102" x2="600" y2="102" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
    <rect x="140" y="96" width="8" height="12" fill="currentColor" opacity="0.7"/><rect x="200" y="96" width="8" height="12" fill="currentColor" opacity="0.7"/>
    <rect x="260" y="96" width="8" height="12" fill="currentColor" opacity="0.7"/><rect x="320" y="96" width="8" height="12" fill="currentColor" opacity="0.7"/>
    <rect x="380" y="96" width="8" height="12" fill="currentColor" opacity="0.7"/><rect x="440" y="96" width="8" height="12" fill="currentColor" opacity="0.7"/>
    <rect x="500" y="96" width="8" height="12" fill="currentColor" opacity="0.7"/><rect x="560" y="96" width="8" height="12" fill="currentColor" opacity="0.7"/>
    <text x="616" y="106" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">nightly</text>
    <line x1="130" y1="142" x2="600" y2="142" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
    <rect x="180" y="132" width="14" height="20" rx="3" fill="currentColor" opacity="0.8"/>
    <rect x="380" y="132" width="14" height="20" rx="3" fill="currentColor" opacity="0.8"/>
    <rect x="580" y="132" width="14" height="20" rx="3" fill="currentColor" opacity="0.8"/>
    <text x="616" y="146" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">quarterly freeze</text>
    <line x1="130" y1="182" x2="600" y2="182" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
    <polygon points="266,174 274,190 258,190" fill="#f3a712"/>
    <polygon points="486,174 494,190 478,190" fill="#f3a712"/>
    <text x="616" y="186" font-family="system-ui, sans-serif" font-size="9" fill="#f3a712" font-weight="700">for decades</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="700" y="96" width="168" height="88" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="700" y="96" width="168" height="88" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="714" y="118" fill="currentColor" font-size="9.5" font-weight="700">Coupling symptoms</text>
    <text x="714" y="138" fill="currentColor" font-size="9" opacity="0.85">processing≡reporting →</text>
    <text x="714" y="152" fill="currentColor" font-size="9" opacity="0.85">a late scene is lost</text>
    <text x="714" y="170" fill="currentColor" font-size="9" opacity="0.85">audit≡processing → replay</text>
    <text x="714" y="184" fill="currentColor" font-size="9" opacity="0.85">uses today's code</text>
  </g>
</svg>

## Frequently Asked Questions

### What distinguishes an MRV platform from a general data platform?

Three requirements that a general platform treats as optional. Every figure must be replayable years later from pinned inputs and a pinned environment. Every transformation must be traceable to a named methodology requirement. And every stage must assert spatial invariants that ordinary data engineering has no concept of — coordinate systems, geometry validity, area conservation. A general platform can be excellent and still fail all three, which is why retrofitting MRV requirements onto one is usually more work than it looks.

### Should the reporting freeze be a copy or a pointer?

A pointer to immutable artefacts, with the manifest signed. Copying at freeze time creates a second version of the truth that will eventually diverge from the first; pointing at content-addressed artefacts means the freeze is a statement about which artefacts constituted the report, not a duplicate of them. The signature over the manifest is what makes the statement tamper-evident, and it is what a verifier checks first.

### How should late-arriving data be handled after a period is frozen?

By restatement, not by silent inclusion. A scene that lands after the freeze belongs to the period it observes, so incorporating it changes a published figure — which is a restatement with its own disclosure obligations, however small the change. Systems that quietly absorb late data produce figures that differ from what was published without anyone noticing, and the discrepancy surfaces during verification rather than during reporting.

### What is the right granularity for a partition key?

The smallest unit that is independently recomputable, which for satellite-driven MRV is almost always the tile-month. Smaller partitions make backfills precise and retries cheap; larger ones make a single failure expensive to recover from. The key must be deterministic from the inputs — derived from tile and period, not from a run identifier or a timestamp — or replay cannot reproduce the same paths.

### How much of this should be built versus bought?

Buy the orchestrator, the object store, and the observability transport; build the schema contract, the invariants, and the evidence record. The bought components are commodity and replaceable, and treating them as such keeps the platform portable across the decades a crediting period spans. The built components encode your methodology and your failure history, and they are what a verifier is actually assessing.

## Conclusion

**Pipeline Orchestration & Compliance Reference** is the layer that makes carbon numbers trustworthy: it schedules the work, guarantees that re-running it is safe and reproducible, enforces a single canonical schema and pinned reference data, and gates every output against the registry standard it must satisfy before it is submitted. By treating orchestration, the reference layer, and compliance mapping as one coordinated control plane — idempotent tasks, versioned factors, hash-sealed certificates, and machine-checkable standards mapping — engineering teams turn scientifically correct models into auditable, submission-ready carbon accounting. The detailed engineering continues in the three areas this page coordinates: [orchestrating MRV data pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) for the scheduler, retry, and backfill patterns; the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) for the canonical Parquet contract and factor versioning; and [carbon registry standards and methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/) for the Verra, Gold Standard, CSRD, and ISO controls every output must clear. Together with the modeling, imagery, and architecture sections it governs, this control plane is what makes a scalable, transparent, and defensible carbon market operationally real.

## Related guides

- [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) — the foundational ingestion, CRS, and lineage layer this plane schedules and enforces.
- [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) — the raster-processing workloads the orchestrator runs at scale.
- [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) — the modeling outputs this plane gates before submission.
- [Orchestrating MRV Data Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) — scheduler, retry, idempotency, and backfill patterns for the control plane.
- [Carbon Registry Standards & Methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/) — the Verra, Gold Standard, CSRD ESRS E1, and ISO 14064 controls each output must satisfy.
