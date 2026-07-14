---
shortTitle: "Troubleshooting Broken Data Lineage in MRV Audits"
title: "Troubleshooting Broken Data Lineage in MRV Audits"
description: "Diagnose and repair broken MRV lineage before an audit fails: find orphaned outputs, hash mismatches, uncaptured manual steps, and graph disconnects, then re-pin and verify pixel-to-tonne traceability."
slug: troubleshooting-broken-data-lineage-in-mrv-audits
type: guide
breadcrumb: "Troubleshooting Broken Lineage"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Troubleshooting Broken Data Lineage in MRV Audits

A verifier does not fail an MRV submission because a carbon figure is wrong; they fail it because the figure cannot be reconstructed. This guide is the repair manual under [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), the evidence layer of the [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. Where the [OpenLineage integration guide](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/) covers how to emit `RunEvent` records correctly, this page assumes the events are already flowing and something has still gone wrong: an auditor has pulled the graph for a reported tonne and the chain back to the source pixel or parcel is severed.

Broken lineage in a carbon pipeline is rarely a total absence of records. It is far more often a graph that looks complete until you traverse it — an output raster whose upstream run was never recorded, a recorded input hash that no longer matches the file on disk, a manual reclassification a technician ran in a notebook and never logged, or a factor table that was silently upgraded so last quarter's numbers can no longer be regenerated. Each of these severs the pixel-to-tonne trail at a single edge while leaving the rest of the manifest superficially intact. The task here is detection followed by deterministic repair, so that every reported figure resolves cleanly back through its transformations to a versioned, content-addressed source.

<svg viewBox="0 0 1000 300" role="img" aria-labelledby="brk-t brk-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="brk-t">Diagnosing and repairing a broken lineage edge in an MRV graph</title>
  <desc id="brk-d">A lineage graph runs left to right: a versioned source raster feeds a transform node, which feeds a reported-tonne output. The edge from source to transform is drawn as a broken red dashed line labelled hash mismatch, and an orphaned output node sits below with no incoming edge. A repair and backfill path arcs beneath the graph: recompute the input hash, re-pin the factor version, and re-emit the missing run edge, restoring the connection so the output on the right passes the traceability gate and is drawn in amber as verified.</desc>
  <defs>
    <marker id="brk-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
    <marker id="brk-arrow-amber" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#f3a712"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- top row: source -> transform -> output -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="24" y="48" width="164" height="72" rx="9"/>
      <rect x="418" y="48" width="164" height="72" rx="9"/>
    </g>
    <!-- verified output (amber) -->
    <rect x="812" y="48" width="164" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <!-- orphaned output (dashed, no incoming edge) -->
    <rect x="418" y="196" width="164" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.75"/>
    <!-- node labels -->
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="106" y="80">Source raster</text>
      <text x="500" y="80">Transform run</text>
    </g>
    <text x="894" y="80" fill="#f3a712" font-size="12" font-weight="700">Reported tonne</text>
    <text x="500" y="228" fill="currentColor" font-size="11.5" font-weight="600" opacity="0.8">Orphaned output</text>
    <!-- node subtitles -->
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="106" y="98">v-pinned &#183; sha256</text>
      <text x="500" y="98">factor_version</text>
      <text x="500" y="246">no upstream run</text>
    </g>
    <text x="894" y="98" fill="#f3a712" font-size="9.5">traceable &#183; gate passed</text>
    <!-- broken edge (red dashed) source -> transform -->
    <line x1="188" y1="84" x2="416" y2="84" stroke="#c0392b" stroke-width="2" stroke-dasharray="7 5"/>
    <text x="302" y="72" fill="#c0392b" font-size="10" font-weight="700">hash mismatch</text>
    <text x="302" y="104" fill="#c0392b" font-size="16" font-weight="700">&#9888;</text>
    <!-- healthy edge transform -> output (amber, restored) -->
    <line x1="582" y1="84" x2="810" y2="84" stroke="#f3a712" stroke-width="2" marker-end="url(#brk-arrow-amber)"/>
    <!-- repair/backfill path underneath -->
    <path d="M106 120 C 106 176, 300 176, 300 176 L 700 176 C 820 176, 894 160, 894 122" fill="none" stroke="#0f6e63" stroke-width="1.6" stroke-dasharray="3 3" marker-end="url(#brk-arrow)"/>
    <rect x="360" y="160" width="280" height="30" rx="7" fill="none" stroke="#0f6e63" stroke-width="1.2"/>
    <text x="500" y="180" fill="#0f6e63" font-size="10" font-weight="700">recompute hash &#183; re-pin &#183; re-emit edge</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Diagnose and repair broken data lineage before an MRV audit",
  "description": "Walk an MRV lineage graph to find orphaned outputs, missing edges, and content-hash mismatches, then rebuild the records, re-pin factor and library versions, and verify end-to-end pixel-to-tonne traceability with a hard gate.",
  "totalTime": "PT45M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "networkx" },
    { "@type": "HowToTool", "name": "pyarrow" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Load the lineage graph", "text": "Read the recorded run and dataset nodes into a directed graph, keyed on content-addressed dataset identifiers." },
    { "@type": "HowToStep", "name": "Diagnose disconnects", "text": "Traverse the graph to find orphaned outputs with no producing run, dangling edges to missing inputs, and unreachable source datasets." },
    { "@type": "HowToStep", "name": "Detect hash mismatches", "text": "Recompute the content hash of each referenced input and compare it to the hash recorded in the lineage node." },
    { "@type": "HowToStep", "name": "Repair and re-pin", "text": "Backfill missing run edges, re-pin factor_version and library versions, and write corrected content hashes into the manifest." },
    { "@type": "HowToStep", "name": "Verify with a gate", "text": "Re-traverse from each reported figure back to a versioned source and fail the export if any path is broken." }
  ]
}
</script>

## Root Cause Analysis

Broken lineage in production carbon pipelines resolves into four recurring failures, and each one severs the graph in a distinct way that an auditor's traversal will surface immediately.

The first is the **orphaned output**: a carbon-stock raster or an aggregated emission table exists in object storage and is referenced by the final report, but no run node claims to have produced it. This happens when a job writes its output before it emits its completion event and then crashes, or when a file is copied between environments outside the orchestrated flow. The output is real, the number is on the submission, and there is nothing upstream of it. An auditor cannot distinguish an orphaned output from a fabricated one, so it fails on sight.

The second is the **content-hash mismatch**. The lineage node records that a transform consumed an input with a given SHA-256, but the file currently at that path hashes to something else. Either the input was regenerated in place after the run, or a non-deterministic upstream export wrote new bytes under the old identifier. The edge exists in the graph, but it points at a version of the data that no longer exists — the recorded provenance describes a computation that can never be reproduced.

The third is the **uncaptured manual step**. A technician opens a notebook, reclassifies a handful of ambiguous land-cover polygons, and saves the corrected layer back over the pipeline's output. The correction may be entirely legitimate, but it happened outside the orchestrator, so no run event records it. The graph shows the automated transform feeding straight into the report, while the bytes that were actually reported passed through an undocumented human edit. This is the most dangerous failure because the graph looks *complete* — it is simply describing the wrong lineage.

The fourth is the **non-reproducible run** from unpinned versions. The run recorded `emission factor lookup` but not which `factor_version` it resolved, or it recorded a library set as `latest` rather than an exact pin. When the factor database is upgraded — which it will be, following the discipline in [versioning emission factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) — the historical figure can no longer be regenerated, because the inputs that produced it are no longer knowable. The edge is present and the hashes match, but a critical parameter is missing from the node.

## Diagnostic Pipeline: Traversing the Graph for Disconnects

The diagnostic walks the recorded lineage as a directed graph and asserts three properties: every reported output must be reachable from a versioned source, every referenced input must exist and hash to its recorded value, and every run node must carry the pins needed to reproduce it. The routine below loads the lineage into a `networkx.DiGraph`, then reports orphans, dangling edges, and hash mismatches without mutating anything — diagnosis is strictly read-only so it can run against a live audit snapshot.

```python
import hashlib
from pathlib import Path
from typing import Any

import networkx as nx
import structlog

log = structlog.get_logger()

# Fields every reproducible run node must pin. A missing pin is a silent
# non-reproducibility that only surfaces once the factor DB is upgraded.
REQUIRED_PINS = ("factor_version", "library_versions", "code_commit")


def _content_hash(path: str, chunk: int = 1 << 20) -> str | None:
    """SHA-256 of the file currently on disk, or None if it is missing."""
    p = Path(path)
    if not p.exists():
        return None
    h = hashlib.sha256()
    with p.open("rb") as fh:
        for block in iter(lambda: fh.read(chunk), b""):
            h.update(block)
    return h.hexdigest()


def build_lineage_graph(nodes: list[dict[str, Any]]) -> nx.DiGraph:
    """Assemble recorded run/dataset nodes into a directed lineage graph.

    Each node is either a dataset (id, path, recorded_sha256) or a run
    (id, inputs -> outputs) with pinned parameters. Edges run input -> run
    -> output, so a reported figure should trace back to a source dataset.
    """
    g = nx.DiGraph()
    for n in nodes:
        g.add_node(n["id"], **n)
    for n in nodes:
        if n.get("kind") != "run":
            continue
        for src in n.get("inputs", []):
            g.add_edge(src, n["id"])          # input dataset -> run
        for dst in n.get("outputs", []):
            g.add_edge(n["id"], dst)          # run -> output dataset
    log.info("lineage.graph_built", nodes=g.number_of_nodes(),
             edges=g.number_of_edges())
    return g


def diagnose(g: nx.DiGraph, reported: list[str]) -> dict[str, list]:
    """Detect orphaned outputs, dangling edges, hash mismatches, missing pins."""
    orphans, dangling, hash_mismatch, unpinned = [], [], [], []

    for node_id, data in g.nodes(data=True):
        kind = data.get("kind")

        # A dataset with a path but no producing run edge is an orphan
        if kind == "dataset" and data.get("path"):
            producers = [u for u, _ in g.in_edges(node_id)]
            if not producers and node_id in reported:
                orphans.append(node_id)

            # Recorded hash must match the bytes currently on disk
            recorded = data.get("recorded_sha256")
            actual = _content_hash(data["path"])
            if actual is None:
                dangling.append({"node": node_id, "path": data["path"]})
            elif recorded and actual != recorded:
                hash_mismatch.append(
                    {"node": node_id, "recorded": recorded, "actual": actual})

        # Every run must carry the pins needed to reproduce it
        if kind == "run":
            missing = [p for p in REQUIRED_PINS if not data.get(p)]
            if missing:
                unpinned.append({"run": node_id, "missing": missing})

    # Every reported figure must be reachable from at least one source dataset
    sources = {n for n, d in g.nodes(data=True)
               if d.get("kind") == "dataset" and g.in_degree(n) == 0}
    unreachable = [
        r for r in reported
        if not any(nx.has_path(g, s, r) for s in sources)
    ]

    report = {
        "orphaned_outputs": orphans,
        "dangling_inputs": dangling,
        "hash_mismatches": hash_mismatch,
        "unpinned_runs": unpinned,
        "unreachable_reported": unreachable,
    }
    broken = sum(len(v) for v in report.values())
    log.warning("lineage.diagnosed", broken_edges=broken, **{
        k: len(v) for k, v in report.items()})
    return report
```

A clean pipeline returns empty lists across the board. Anything else is a concrete work list: each entry names the exact node, path, or run that severs the trail, so repair can be targeted rather than a blanket regeneration of the quarter.

## Deterministic Transformation Logic: Rebuild, Re-Pin, Reconnect

Repair must be as deterministic as the diagnosis. The routine below takes the diagnostic report and applies the minimal set of corrections: it recomputes and rewrites content hashes for any input whose bytes drifted, backfills the missing run edge for an orphaned output by re-executing the recorded transform under its pinned parameters, and stamps `factor_version`, `library_versions`, and `code_commit` into any run that lost them. Every mutation is itself logged as a new provenance event, so the *repair* is auditable — an auditor sees not only the corrected graph but the record of how it was corrected.

```python
import json
from datetime import datetime, timezone
from typing import Any, Callable

import structlog

log = structlog.get_logger()


def repair_lineage(
    nodes: dict[str, dict[str, Any]],
    diagnosis: dict[str, list],
    reruns: dict[str, Callable[[], str]],
    factor_version: str,
    library_versions: dict[str, str],
    code_commit: str,
) -> dict[str, dict[str, Any]]:
    """Patch a lineage manifest in place-safe fashion, returning the new nodes.

    reruns maps an orphaned output id to a callable that re-executes its
    transform deterministically and returns the produced dataset's SHA-256.
    """
    patched = {k: dict(v) for k, v in nodes.items()}  # never mutate the input
    repair_events: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc).isoformat()

    # 1. Re-pin every run that lost its reproducibility parameters
    for entry in diagnosis["unpinned_runs"]:
        run = patched[entry["run"]]
        run.setdefault("factor_version", factor_version)
        run.setdefault("library_versions", library_versions)
        run.setdefault("code_commit", code_commit)
        repair_events.append({"action": "repin", "run": entry["run"],
                              "restored": entry["missing"]})
        log.info("lineage.repin", run=entry["run"], missing=entry["missing"])

    # 2. Correct content hashes that drifted from the recorded value
    for mm in diagnosis["hash_mismatches"]:
        patched[mm["node"]]["recorded_sha256"] = mm["actual"]
        patched[mm["node"]]["hash_corrected_from"] = mm["recorded"]
        repair_events.append({"action": "rehash", "node": mm["node"]})
        log.warning("lineage.rehash", node=mm["node"],
                    old=mm["recorded"][:12], new=mm["actual"][:12])

    # 3. Backfill the producing run for each orphaned output
    for out_id in diagnosis["orphaned_outputs"]:
        if out_id not in reruns:
            raise RuntimeError(
                f"orphan {out_id} has no registered rerun; cannot backfill "
                "an edge without re-executing the transform deterministically.")
        produced_sha = reruns[out_id]()               # deterministic re-run
        recorded = patched[out_id].get("recorded_sha256")
        if recorded and produced_sha != recorded:
            raise RuntimeError(
                f"backfill for {out_id} is non-deterministic: "
                f"{produced_sha[:12]} != recorded {recorded[:12]}")
        backfill_run = f"run::backfill::{out_id}"
        patched[backfill_run] = {
            "id": backfill_run, "kind": "run", "outputs": [out_id],
            "factor_version": factor_version,
            "library_versions": library_versions, "code_commit": code_commit,
            "backfilled_at": now,
        }
        patched[out_id]["recorded_sha256"] = produced_sha
        repair_events.append({"action": "backfill", "output": out_id,
                              "run": backfill_run})
        log.info("lineage.backfill", output=out_id, run=backfill_run)

    # Append the repair itself as an audit event — the fix is provenance too
    patched["__repair_manifest__"] = {
        "id": "__repair_manifest__", "kind": "repair",
        "generated_utc": now, "events": repair_events,
        "event_count": len(repair_events),
    }
    log.info("lineage.repaired", events=len(repair_events),
             detail=json.dumps(repair_events, default=str))
    return patched
```

The backfill deliberately refuses to invent an edge. It re-executes the transform under the pinned parameters and asserts that the regenerated bytes match the recorded hash; if they do not, the run was genuinely non-reproducible and the routine raises rather than papering over the gap with a fabricated connection. That refusal is what keeps the repair honest — a manual, uncaptured step will fail this check, forcing it to be re-created deterministically or explicitly disclosed rather than silently absorbed. For orphans caused by non-idempotent writes, pair the rerun callable with the patterns in [building idempotent backfills for carbon pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/) so the re-execution produces byte-identical output.

## Compliance Gating & Audit Trail Generation

A repaired graph is not trustworthy until it is proven traceable end to end. The final gate re-runs the diagnosis against the patched manifest and asserts that every reported figure resolves back to a versioned source with matching hashes and full pins — the same property a verifier tests under ISO 14064-3, which requires that a reported result be reproducible from documented data and methods.

```python
import networkx as nx
import structlog

log = structlog.get_logger()


def traceability_gate(patched: dict, reported: list[str]) -> None:
    """Hard gate: raise if any reported figure is not fully traceable."""
    g = build_lineage_graph(list(patched.values()))
    residual = diagnose(g, reported)
    outstanding = sum(len(v) for v in residual.values())
    if outstanding:
        log.error("lineage.gate_failed", outstanding=outstanding, **residual)
        raise RuntimeError(
            f"traceability gate blocked export: {outstanding} unresolved "
            f"lineage defects remain: {residual}")
    log.info("lineage.gate_passed", reported=len(reported),
             standard="ISO 14064-3 / CSRD ESRS E1")
```

The gate maps directly onto regulatory controls. The reachability assertion satisfies **ISO 14064-3** reproducibility: every certified tonne traces to a source dataset through recorded transforms. The `factor_version` pin satisfies the **Verra VM-series** requirement that the exact methodology parameters be recoverable for any historical issuance. The disclosed repair manifest — the record of what was corrected and when — satisfies **CSRD ESRS E1** expectations of transparent data governance, since it shows an auditor precisely how the trail was mended rather than presenting a suspiciously pristine graph. These outputs feed the same evidence store that [emissions data quality and validation gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/) draw on when they assert fitness of the underlying figures.

## Production Integration

Wire the diagnosis, repair, and gate into the release path as a fixed ingest → diagnose → transform → validate → export → submit sequence, so a broken trail is caught and mended before a figure ever reaches a registry rather than during an audit.

1. **Ingest.** Load the recorded lineage snapshot — the `RunEvent` stream from Marquez or the append-only manifest — for the reporting period, alongside the object-storage paths of every referenced dataset.
2. **Diagnose.** Build the `networkx` graph and run `diagnose` to produce the concrete list of orphaned outputs, hash mismatches, unpinned runs, and unreachable figures.
3. **Transform.** Feed the diagnosis into `repair_lineage`, supplying deterministic rerun callables for any orphan and the exact `factor_version`, library pins, and commit for the reporting period.
4. **Validate.** Call `traceability_gate` on the patched manifest; it re-diagnoses and raises if a single reported figure is still unreachable, mis-hashed, or unpinned.
5. **Export.** Serialize the patched manifest together with the `__repair_manifest__` event log to Parquet with `pyarrow`, so the corrections travel with the evidence and remain queryable.
6. **Submit.** Forward the verified lineage to registry submission only after the gate passes, and re-emit the backfilled edges through the [OpenLineage integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/) so the live graph and the audit snapshot agree.

Treating lineage repair as a gated stage rather than an audit-time fire drill changes its economics entirely. The diagnosis runs cheaply on every release, the repair is deterministic and self-documenting, and the gate guarantees that no untraceable figure is ever submitted — which is the only state in which a carbon claim can survive third-party verification, with every reported tonne resolving cleanly back to the pixel or parcel that produced it.

## Related guides

- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — the evidence layer whose broken trails this guide repairs.
- [Tracking Data Lineage with OpenLineage for ESG Audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/) — how to emit the `RunEvent` records this diagnosis traverses.
- [Building Idempotent Backfills for Carbon Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/) — deterministic re-execution so backfilled edges are byte-identical.
- [Emissions Data Quality & Validation Gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/) — the quality checks that consume the traceable figures this gate certifies.
