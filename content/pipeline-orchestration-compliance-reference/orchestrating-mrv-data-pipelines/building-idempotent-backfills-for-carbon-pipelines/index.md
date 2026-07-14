---
shortTitle: "Idempotent Backfills for Carbon Pipelines"
title: "Building Idempotent Backfills for Carbon Pipelines"
description: "Backfill historical carbon and emissions data without double-counting: deterministic partition keys, idempotency keys, content hashing, atomic partition swaps, and re-emitted lineage for audit-safe MRV."
slug: building-idempotent-backfills-for-carbon-pipelines
type: guide
breadcrumb: "Idempotent Backfills"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Building Idempotent Backfills for Carbon Pipelines

Reprocessing history is unavoidable in carbon accounting: an emission factor is revised, a boundary is corrected, or a methodology version supersedes the one a project was baselined against, and suddenly months of reported tonnage must be regenerated. Doing this safely is a hard requirement of any [Orchestrating MRV Data Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) practice, because the same run that recomputes a corrected figure can, if written naively, append a second copy of every row and silently inflate the reported total. Where the [choice of orchestrator](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/prefect-vs-airflow-vs-dagster-for-mrv-pipelines/) decides how a backfill is scheduled and retried, the write semantics decide whether that backfill is safe to run twice — and in production it will always run more than once.

An idempotent backfill is one where re-executing the same window over the same inputs leaves the reported ledger byte-for-byte identical, no matter how many times it fires. Achieving that means treating each unit of output as a deterministically addressed partition rather than a stream of inserts, so a re-run overwrites in place instead of accumulating. This guide builds that discipline against the field contracts defined in the [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/): deterministic partitioning by `(project_id, period, factor_version)`, a stable idempotency key, content hashing to skip unchanged work, an atomic write-temp-then-swap on object storage, and lineage that is re-emitted on every re-run so the audit trail records the correction rather than being corrupted by it.

<svg viewBox="0 0 1000 264" role="img" aria-labelledby="backfill-t backfill-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="backfill-t">Idempotent carbon backfill flow with a hash-compare skip branch</title>
  <desc id="backfill-d">A backfill request for a window enters, then partition keys are computed deterministically from project, period and factor version. A content-hash comparison decides whether the target partition is unchanged: if the hash matches, the work is skipped; if it differs, the partition is recomputed and written to a temporary object, then atomically swapped into place. Both the skip path and the recompute path converge on a single re-emit-lineage step, drawn in amber as the committed and audited partition, so every re-run leaves a provenance record without duplicating reported rows.</desc>
  <defs>
    <marker id="bf-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="12" y="100" width="132" height="64" rx="9"/>
      <rect x="160" y="100" width="140" height="64" rx="9"/>
      <rect x="470" y="40" width="150" height="58" rx="9"/>
      <rect x="470" y="166" width="150" height="58" rx="9"/>
      <rect x="648" y="100" width="140" height="64" rx="9"/>
    </g>
    <polygon points="378,92 430,132 378,172 326,132" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <rect x="812" y="94" width="176" height="80" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="78" y="130">Backfill window</text>
      <text x="230" y="130">Compute keys</text>
      <text x="545" y="66">Skip work</text>
      <text x="545" y="192">Recompute</text>
      <text x="718" y="130">Atomic swap</text>
    </g>
    <text x="900" y="128" fill="#f3a712" font-size="12" font-weight="700">Re-emit lineage</text>
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="78" y="148">request</text>
      <text x="230" y="148">project &#183; period &#183; factor</text>
      <text x="545" y="82">hash matches</text>
      <text x="545" y="208">write temp object</text>
      <text x="718" y="148">temp &#8594; live</text>
      <text x="900" y="150">committed &#183; audited</text>
      <text x="900" y="164">no duplicate rows</text>
    </g>
    <g fill="currentColor" font-size="10" font-weight="600">
      <text x="378" y="128">hash</text>
      <text x="378" y="142">changed?</text>
    </g>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#bf-arrow)">
    <line x1="144" y1="132" x2="158" y2="132"/>
    <line x1="300" y1="132" x2="324" y2="132"/>
    <path d="M378 92 C 400 60, 430 69, 468 69"/>
    <path d="M378 172 C 400 204, 430 195, 468 195"/>
    <line x1="620" y1="195" x2="646" y2="160"/>
    <path d="M620 69 C 720 69, 760 108, 810 120"/>
    <path d="M788 132 C 798 132, 800 138, 810 140"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="10" font-weight="600">
    <text x="452" y="60" fill="currentColor" opacity="0.8">no</text>
    <text x="452" y="214" fill="#f3a712">yes</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Build an idempotent backfill for a carbon MRV pipeline",
  "description": "Recompute historical emissions partitions without double-counting by deriving deterministic partition keys, comparing content hashes, atomically swapping temp objects into place, and re-emitting lineage on every re-run.",
  "totalTime": "PT45M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "pyarrow" },
    { "@type": "HowToTool", "name": "geopandas" },
    { "@type": "HowToTool", "name": "prefect" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Pre-flight validation", "text": "Enumerate existing partitions for the requested window and detect duplicate or overlapping partition keys and non-idempotent append writes before recomputing anything." },
    { "@type": "HowToStep", "name": "Compute deterministic keys", "text": "Derive an idempotency key from project_id, period, and factor_version so the same logical output always maps to the same partition path." },
    { "@type": "HowToStep", "name": "Hash-compare and decide", "text": "Content-hash the freshly computed partition and compare it to the committed hash; skip the write when nothing changed." },
    { "@type": "HowToStep", "name": "Atomic overwrite", "text": "Write the partition to a temporary object, validate it, then swap it into the live path so no reader ever sees a half-written partition." },
    { "@type": "HowToStep", "name": "Re-emit lineage and submit", "text": "Emit a lineage event recording inputs, hash, and factor version for every run, then forward the corrected partition for registry submission." }
  ]
}
</script>

## Root Cause Analysis: Why Naive Backfills Inflate Tonnage

The defining hazard of a carbon backfill is not a crash — it is a run that completes cleanly and reports the wrong number. Three structural patterns drive that outcome.

First, **append-mode writes have no notion of identity.** A pipeline that computes a corrected month and calls `df.to_parquet(path)` in append mode, or issues an `INSERT` without a matching delete, treats the second run as new data. The rows are not wrong individually; there are simply twice as many of them. Because emissions are additive, a project that legitimately reported 12,400 tCO2e for a quarter now reports 24,800 after a single re-run, and every downstream aggregate — issuance volume, intensity metrics, disclosure figures — inherits the doubling. Nothing in the run signals failure, which is precisely why it survives to submission.

Second, **partition boundaries drift with wall-clock time instead of logical identity.** When output paths are keyed on ingestion date or run timestamp rather than the reporting period they represent, a backfill of March cannot find and replace the original March partition; it creates a second March living under a different path. The ledger now holds two authoritative-looking copies of the same period, and reconciliation becomes a manual forensic exercise. The fix is to make the partition address a pure function of the data's own identity — `(project_id, period, factor_version)` — so the target of a re-run is deterministic and the same every time.

Third, **re-runs sever the audit trail instead of extending it.** Even a pipeline that overwrites correctly can corrupt provenance if it fails to record that a correction happened. A verifier under ISO 14064-3 needs to see that the March figure was regenerated under `factor_version=2024.2`, what inputs fed it, and when — not merely that a March figure exists. A backfill that overwrites the data but not the lineage produces a number no one can defend, because the chain of custody points to a factor version that is no longer on disk. Idempotency and provenance are therefore a single requirement: the write must be replaceable and the replacement must be recorded.

## Diagnostic Pipeline: Detecting Non-Idempotent State Before You Run

Never launch a backfill against a table you have not first inspected. The pre-flight below enumerates the partitions already present for the requested window and detects the two conditions that make a re-run dangerous: duplicate or overlapping partition keys (evidence a previous run appended rather than replaced) and partitions written under append semantics without a recorded content hash. It refuses to proceed silently when either is present.

```python
from collections import Counter
from dataclasses import dataclass

import pyarrow.dataset as ds
import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class PartitionKey:
    project_id: str
    period: str        # ISO period, e.g. "2024-03"
    factor_version: str


def preflight_backfill(table_uri: str, window: list[str],
                       project_id: str) -> dict:
    """Inspect existing partitions before a backfill and flag non-idempotent state.

    Detects duplicate/overlapping keys (double-write evidence) and partitions
    lacking a recorded content hash (append-mode writes we cannot verify).
    """
    dataset = ds.dataset(table_uri, format="parquet", partitioning="hive")
    fragments = list(dataset.get_fragments())

    seen: Counter = Counter()
    unhashed: list[str] = []
    for frag in fragments:
        expr = frag.partition_expression
        key = _key_from_expression(expr)  # -> PartitionKey
        if key.project_id != project_id or key.period not in window:
            continue
        seen[key] += 1
        meta = frag.metadata.metadata or {}
        if b"content_hash" not in meta:
            unhashed.append(f"{key.period}/{key.factor_version}")

    duplicates = {f"{k.period}/{k.factor_version}": n
                  for k, n in seen.items() if n > 1}

    report = {
        "project_id": project_id,
        "window_periods": len(window),
        "partitions_found": int(sum(seen.values())),
        "duplicate_partitions": duplicates,
        "unhashed_partitions": unhashed,
        "idempotent_safe": not duplicates and not unhashed,
    }
    log.info("backfill.preflight", **report)

    if duplicates:
        log.warning("backfill.duplicate_partitions_detected",
                    detail=duplicates)
    if unhashed:
        log.warning("backfill.unhashed_partitions_detected",
                    count=len(unhashed))
    return report
```

A window that reports `idempotent_safe=False` is not automatically blocked, but it must be remediated deliberately: duplicate partitions are consolidated to a single authoritative copy before recompute, and unhashed partitions are treated as unknown and always recomputed. The diagnostic makes the hidden state visible instead of letting the backfill inherit it.

## Deterministic Transformation Logic

The backfill itself is built around one invariant: the output path is a pure function of the data's identity, and the write is atomic. The idempotency key is derived from `(project_id, period, factor_version)`, so the same logical partition always resolves to the same object path. Before writing, the freshly computed frame is content-hashed and compared to the committed hash; if they match, the expensive write and swap are skipped entirely. When geometry is present — project boundaries, activity polygons — the CRS is asserted explicitly and normalised to the canonical equal-area grid so that any area-weighted quantity is reproducible across runs.

```python
import hashlib
import json
from datetime import datetime, timezone

import geopandas as gpd
import pyarrow as pa
import pyarrow.parquet as pq
import structlog

log = structlog.get_logger()

CANONICAL_CRS = "EPSG:6933"          # equal-area: area-weighted emissions stay honest
FSSPEC_OPTS = {"auto_mkdir": True}


def idempotency_key(project_id: str, period: str, factor_version: str) -> str:
    """Deterministic partition identity — stable across runs and machines."""
    raw = f"{project_id}|{period}|{factor_version}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]


def _content_hash(table: pa.Table) -> str:
    """Order-independent hash of partition content to detect real change."""
    sink = pa.BufferOutputStream()
    pq.write_table(table.sort_by([(c, "ascending") for c in table.column_names]),
                   sink, compression="zstd")
    return hashlib.sha256(sink.getvalue().to_pybytes()).hexdigest()


def backfill_partition(gdf: gpd.GeoDataFrame, project_id: str, period: str,
                       factor_version: str, base_uri: str, fs) -> dict:
    """Idempotently (re)write a single carbon partition via write-temp-then-swap."""
    # 1. Explicit CRS handling — refuse untagged geometry, normalise to equal-area.
    if gdf.crs is None:
        raise ValueError("untagged geometry; refusing to guess a datum.")
    if gdf.crs.to_epsg() != 6933:
        gdf = gdf.to_crs(CANONICAL_CRS)

    key = idempotency_key(project_id, period, factor_version)
    live_path = f"{base_uri}/project_id={project_id}/period={period}/{key}.parquet"
    tmp_path = f"{live_path}.tmp-{key}"

    # 2. Validation gate — a period must never emit negative or null tonnage.
    if gdf["tco2e"].isna().any() or (gdf["tco2e"] < 0).any():
        raise ValueError(f"invalid tonnage in {period}: null or negative rows")

    table = pa.Table.from_pandas(gdf.to_wkb(), preserve_index=False)
    new_hash = _content_hash(table)

    # 3. Hash-compare — skip the write when nothing actually changed.
    if fs.exists(live_path):
        existing = pq.read_metadata(live_path, filesystem=fs).metadata or {}
        if existing.get(b"content_hash") == new_hash.encode():
            log.info("backfill.skipped_unchanged", period=period,
                     factor_version=factor_version, key=key)
            return {"period": period, "action": "skipped", "hash": new_hash}

    # 4. Atomic overwrite — write temp, then swap into the live path.
    meta = {
        b"content_hash": new_hash.encode(),
        b"factor_version": factor_version.encode(),
        b"crs": CANONICAL_CRS.encode(),
        b"generated_utc": datetime.now(timezone.utc).isoformat().encode(),
    }
    table = table.replace_schema_metadata(meta)
    with fs.open(tmp_path, "wb") as f:
        pq.write_table(table, f, compression="zstd")
    fs.mv(tmp_path, live_path)  # single-object rename: readers never see a partial

    log.info("backfill.partition_written", period=period, key=key,
             rows=table.num_rows, factor_version=factor_version, hash=new_hash)
    return {"period": period, "action": "overwritten", "hash": new_hash,
            "path": live_path, "rows": table.num_rows}
```

The swap in step 4 is the load-bearing detail. Writing to `tmp_path` and then issuing a single-object rename means a reader querying the live path either sees the previous committed partition or the new one — never a half-written file, and never two copies. Because the partition path is one object per `(project_id, period, factor_version)`, the rename replaces exactly the row set it is meant to, and no `DELETE` step can race the `INSERT`. The content hash stored in the file metadata is what lets the next run's hash-compare short-circuit unchanged periods, so a broad re-run over a year touches only the partitions that genuinely moved.

## Compliance Gating & Audit Trail Generation

A backfill is not finished when the data is correct; it is finished when the correction is recorded. Every run — including a skipped one — emits a lineage event so the audit trail extends rather than resets. The event captures the idempotency key, the content hash, the factor version, and the input references, giving a verifier the queryable chain of custody that [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) requires under ISO 14064-3.

```python
def emit_lineage(result: dict, project_id: str, factor_version: str,
                 input_refs: list[str]) -> dict:
    """Re-emit a lineage event on EVERY run, including skips, so history is complete."""
    event = {
        "run_utc": datetime.now(timezone.utc).isoformat(),
        "project_id": project_id,
        "period": result["period"],
        "factor_version": factor_version,
        "content_hash": result["hash"],
        "action": result["action"],          # overwritten | skipped
        "input_refs": input_refs,            # upstream object versions consumed
        "compliance_standard": "ISO 14064-3 / GHG Protocol",
    }
    log.info("backfill.lineage_emitted", **event)
    return event
```

Three compliance gates make the corrected figure defensible. The **tonnage validity gate** rejects any partition containing null or negative emissions before it can be swapped in, so a broken recompute never reaches the ledger. The **factor-version stamp** embedded in each partition ties the reported number to the exact methodology revision that produced it, which is what lets an auditor confirm that a Verra VM-series or CSRD ESRS E1 figure was regenerated under the correct factor set. And the **skip-with-lineage** rule ensures that even a no-op re-run leaves a timestamped record proving the period was reviewed and found unchanged — the difference between a silent gap and a demonstrable control. To keep corrected factors themselves reproducible across backfills, pair this with disciplined [emission factor database versioning](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/).

## Production Integration

Deploy the backfill as an orchestrated flow that follows a fixed ingest → diagnose → transform → validate → export → submit sequence, mirroring the HowTo steps above:

1. **Ingest.** Resolve the requested window to a list of reporting periods and pull the input activity data and the pinned emission-factor set for each `(project_id, period, factor_version)` triple, recording the input object versions for lineage.
2. **Diagnose.** Run `preflight_backfill` over the window and remediate any duplicate or unhashed partitions before recomputing; abort the run if the report cannot be brought to `idempotent_safe=True` under the operator's policy.
3. **Transform.** Call `backfill_partition` per period. Deterministic keys and the hash-compare mean a re-run over an unchanged year is nearly free, while genuinely revised periods are recomputed and atomically swapped.
4. **Validate.** Confirm each returned partition passed the tonnage gate and carries a factor-version stamp; assert that no `(project_id, period)` resolves to more than one live object, guaranteeing the double-counting hazard is closed.
5. **Export.** The atomic swap has already published each partition; publish a run manifest summarising overwritten versus skipped periods and the aggregate tonnage delta so a reviewer can see exactly what the correction moved.
6. **Submit.** Call `emit_lineage` for every period and forward the corrected partitions for registry submission. Where a backfill touches shared boundaries, reconcile it against the rules in [preventing Scope 3 double-counting in spatial joins](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/preventing-scope-3-double-counting-in-spatial-joins/) so no tonne is claimed twice across project edges.

Idempotency is what turns a backfill from a high-risk manual event into a routine, repeatable operation. By addressing every output as a deterministic partition, skipping unchanged work by content hash, swapping atomically so no reader ever sees a partial write, and re-emitting lineage on every run, the pipeline can reprocess an entire history as often as a correction demands without ever inflating a reported tonne or breaking the audit trail that defends it.

## Related guides

- [Orchestrating MRV Data Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) — the parent orchestration discipline this backfill pattern sits within.
- [Prefect vs Airflow vs Dagster for MRV Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/prefect-vs-airflow-vs-dagster-for-mrv-pipelines/) — how the orchestrator schedules and retries the runs this pattern must survive.
- [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) — the canonical partition keys and factor-version contracts these writes depend on.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — where the re-emitted lineage becomes the auditor's chain of custody.
- [Preventing Scope 3 Double-Counting in Spatial Joins](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/preventing-scope-3-double-counting-in-spatial-joins/) — the boundary-level double-counting control a cross-project backfill must respect.
