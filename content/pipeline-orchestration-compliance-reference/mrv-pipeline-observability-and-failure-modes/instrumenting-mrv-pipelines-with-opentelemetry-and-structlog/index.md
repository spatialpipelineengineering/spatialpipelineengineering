---
shortTitle: "Instrumenting MRV Pipelines with OpenTelemetry and structlog"
title: "Instrumenting MRV Pipelines with OpenTelemetry and structlog"
description: "Wire a carbon pipeline for observability: a stable event schema, spans that survive distributed fan-out, one source of truth for operator dashboards and audit evidence, and retention split by horizon."
slug: instrumenting-mrv-pipelines-with-opentelemetry-and-structlog
type: guide
breadcrumb: "OpenTelemetry & structlog"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Instrumenting MRV Pipelines with OpenTelemetry and structlog

Instrumentation for a carbon pipeline has an unusual requirement: the same values must serve an operator staring at a dashboard tonight and a verifier reconstructing a figure in 2036. Those two consumers want different stores, different retention, and different query patterns — but if they are fed by different code paths they will eventually disagree, and an operator dashboard that contradicts the audit record is worse than either alone. This guide wires both from a single emission point, within [MRV pipeline observability and failure modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/) in the [pipeline orchestration and compliance reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack.

The design has three commitments. Events carry a **stable schema** with typed fields, so they can be aggregated across runs and years. Every event is emitted **once**, into a structured log and an OpenTelemetry span simultaneously, from the same dictionary. And the fields are **partitioned by retention horizon** at emission time, so the operational chatter can expire in thirty days while the provenance record survives the crediting period.

<svg viewBox="0 -4 940 288" role="img" aria-labelledby="in-t in-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="in-t">One emission point feeding three consumers with three retention horizons</title>
  <desc id="in-d">A pipeline stage produces a single signals dictionary. That dictionary is emitted once through a shared emitter, which fans it out to three destinations. The operator stream carries operational fields to a metrics backend with thirty-day retention. The analyst stream carries data and spatial fields to a run-comparison store with three-year retention. The evidence stream carries provenance and spatial fields to append-only durable storage retained for the full crediting period plus the post-crediting monitoring obligation, shown as thirty years or more. A note states that all three share the run identifier, input digest, and code version, which is what allows an operator investigating a spike and a verifier reconstructing a figure to join across them.</desc>
  <defs>
    <marker id="in-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="10" y="96" width="140" height="72" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="10" y="96" width="140" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="80" y="124" fill="currentColor" font-size="10.5" font-weight="700">Pipeline stage</text>
    <text x="80" y="144" fill="currentColor" font-size="9" opacity="0.78">one tile-month</text>
    <rect x="188" y="96" width="152" height="72" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="188" y="96" width="152" height="72" rx="9" fill="none" stroke="currentColor" stroke-width="1.9"/>
    <text x="264" y="120" fill="currentColor" font-size="10.5" font-weight="700">emit(signals)</text>
    <text x="264" y="140" fill="currentColor" font-size="9" opacity="0.78">one dict, one call</text>
    <text x="264" y="156" fill="currentColor" font-size="9" opacity="0.78">log + span together</text>
    <rect x="382" y="14" width="232" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="498" y="38" fill="currentColor" font-size="10" font-weight="700">Operator stream</text>
    <text x="498" y="56" fill="currentColor" font-size="9" opacity="0.78">status · duration · retries</text>
    <text x="498" y="72" fill="currentColor" font-size="9" opacity="0.78">→ metrics backend</text>
    <rect x="382" y="99" width="232" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="498" y="123" fill="currentColor" font-size="10" font-weight="700">Analyst stream</text>
    <text x="498" y="141" fill="currentColor" font-size="9" opacity="0.78">counts · distributions · bbox</text>
    <text x="498" y="157" fill="currentColor" font-size="9" opacity="0.78">→ run-comparison store</text>
    <rect x="382" y="184" width="232" height="66" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="382" y="184" width="232" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="498" y="208" fill="currentColor" font-size="10" font-weight="700">Evidence stream</text>
    <text x="498" y="226" fill="currentColor" font-size="9" opacity="0.78">digests · versions · CRS · area</text>
    <text x="498" y="242" fill="currentColor" font-size="9" opacity="0.78">→ append-only durable store</text>
    <rect x="652" y="14" width="130" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3"/>
    <text x="717" y="46" fill="currentColor" font-size="13" font-weight="700">30 days</text>
    <text x="717" y="66" fill="currentColor" font-size="9" opacity="0.75">ops horizon</text>
    <rect x="652" y="99" width="130" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3"/>
    <text x="717" y="131" fill="currentColor" font-size="13" font-weight="700">3 years</text>
    <text x="717" y="151" fill="currentColor" font-size="9" opacity="0.75">trend horizon</text>
    <rect x="652" y="184" width="130" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="717" y="216" fill="#f3a712" font-size="13" font-weight="700">30+ years</text>
    <text x="717" y="236" fill="currentColor" font-size="9" opacity="0.75">audit horizon</text>
    <rect x="806" y="88" width="126" height="88" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="806" y="88" width="126" height="88" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="869" y="112" fill="currentColor" font-size="9.5" font-weight="700">Shared keys</text>
    <text x="869" y="132" fill="currentColor" font-size="9" opacity="0.8">run_id</text>
    <text x="869" y="148" fill="currentColor" font-size="9" opacity="0.8">input_digest</text>
    <text x="869" y="164" fill="currentColor" font-size="9" opacity="0.8">code_version</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#in-arrow)">
    <line x1="150" y1="132" x2="186" y2="132"/>
    <path d="M340 116 C 360 96, 364 58, 380 47"/>
    <line x1="340" y1="132" x2="380" y2="132"/>
    <path d="M340 148 C 360 168, 364 206, 380 217"/>
    <line x1="614" y1="47" x2="650" y2="47"/>
    <line x1="614" y1="132" x2="650" y2="132"/>
    <line x1="614" y1="217" x2="650" y2="217"/>
  </g>
</svg>

## Root Cause Analysis

Instrumentation projects fail in three characteristic ways, and each is avoidable by a decision made early.

**Prose logs that cannot be aggregated.** A line reading `Finished tile N00E010 in 42s` is unusable at scale: it cannot be grouped, compared to last month, or joined to a lineage record. The fix is a typed event schema — the same keys, with the same types, in every emission — treated with the same care as a database schema, including a version field so a consumer can handle a change. Schema drift in logs is invisible until the day someone tries to compare across it.

**Spans that fragment under fan-out.** A carbon run fans out over thousands of tiles across a cluster, and the trace context does not propagate automatically across process boundaries in most distributed frameworks. Without explicit context propagation, each worker starts a fresh trace, and the run becomes ten thousand unrelated traces rather than one. The result is that per-tile latency is queryable but "which tiles did this run process" is not — precisely the question that matters. The fix is to serialise the trace context into the task payload and re-attach it in the worker.

**Two code paths for the same value.** The most damaging failure is subtle: a dashboard computes feature counts from one source and the audit record from another, and they drift. This usually starts innocently, when the evidence record is added later by a different person against the same underlying data. The cure is architectural — one function computes the signals, one emitter distributes them, and neither the dashboard nor the evidence store may compute anything itself.

## Diagnostic Pipeline / Pre-Flight Validation

Before instrumenting, validate that the emission contract holds: the schema is complete and typed, the trace context propagates across the fan-out boundary, and the retention routing sends each field where it belongs.

```python
from dataclasses import dataclass, fields as dataclass_fields

import structlog

log = structlog.get_logger()

SCHEMA_VERSION = "mrv-signals/2"

# Which retention horizon each field belongs to. Routing is a property of the
# SCHEMA, not of the call site — otherwise a new field silently lands in the
# 30-day store and is gone when a verifier asks for it.
HORIZONS = {
    "ops": {"status", "duration_s", "retries", "queue_depth", "worker"},
    "trend": {"feature_count", "null_rate", "value_p50", "value_p99", "bbox"},
    "evidence": {"run_id", "stage", "crs", "total_area_ha", "input_digest",
                 "code_version", "factor_set_version", "parameters",
                 "invalid_geometry_count", "schema_version"},
}


def validate_schema(signals: dict) -> list[str]:
    """Every field must be routed and typed. An unrouted field is a field that
    will be discovered missing years later, which is the expensive way."""
    routed = set().union(*HORIZONS.values())
    problems = []

    unrouted = set(signals) - routed
    if unrouted:
        problems.append(f"unrouted fields: {sorted(unrouted)}")

    missing = HORIZONS["evidence"] - set(signals)
    if missing:
        problems.append(f"missing evidence fields: {sorted(missing)}")

    for key, value in signals.items():
        if not isinstance(value, (str, int, float, bool, tuple, list, dict, type(None))):
            problems.append(f"field {key} has non-serialisable type {type(value).__name__}")

    if problems:
        log.error("obs.schema.invalid", problems=problems, schema=SCHEMA_VERSION)
    return problems


def check_context_propagation(worker_traces: list[str], expected_trace: str) -> dict:
    """A run that fanned out to N workers must produce ONE trace, not N.

    Run this once against a small fan-out in staging; it is the cheapest way to
    discover that context is not crossing the process boundary.
    """
    distinct = set(worker_traces)
    propagated = distinct == {expected_trace}

    if not propagated:
        log.error("obs.trace.fragmented", expected=expected_trace,
                  distinct_traces=len(distinct), workers=len(worker_traces),
                  hint="serialise the trace context into the task payload and re-attach it")
    return {"propagated": propagated, "distinct_traces": len(distinct),
            "workers": len(worker_traces)}
```

## Deterministic Transformation Logic

The emitter below is the single point through which every stage reports. It stamps the schema version, splits fields by horizon, writes one structured log line, sets span attributes, and returns the evidence subset for the caller to persist alongside the artefact.

```python
import json
from contextlib import contextmanager

import structlog
from opentelemetry import trace, context as otel_context
from opentelemetry.propagate import inject, extract

log = structlog.get_logger()
tracer = trace.get_tracer("mrv.pipeline")


def configure_logging() -> None:
    """Structured, typed, machine-readable. The renderer is JSON in production
    and a console renderer locally, but the EVENT is identical in both."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,   # run_id set once, on every event
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.EventRenamer("event"),
            structlog.processors.JSONRenderer(sort_keys=True),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(20),
        cache_logger_on_first_use=True,
    )


@contextmanager
def run_context(run_id: str, period: str):
    """Bind run-scoped keys once so every event inside carries them without the
    call sites having to remember."""
    structlog.contextvars.bind_contextvars(run_id=run_id, period=period,
                                           schema_version=SCHEMA_VERSION)
    try:
        with tracer.start_as_current_span("mrv.run") as span:
            span.set_attribute("mrv.run_id", run_id)
            span.set_attribute("mrv.period", period)
            yield span
    finally:
        structlog.contextvars.clear_contextvars()


def emit(event: str, signals: dict) -> dict:
    """Emit ONCE. Log line and span attributes come from the same dictionary, so
    the dashboard and the audit record cannot disagree — they are the same values.

    Returns the evidence subset for the caller to persist WITH the artefact,
    because log retention is not an audit strategy.
    """
    problems = validate_schema(signals)
    if problems:
        raise ValueError(f"signal schema invalid: {problems}")

    payload = {**signals, "schema_version": SCHEMA_VERSION}

    span = trace.get_current_span()
    for key, value in payload.items():
        span.set_attribute(
            f"mrv.{key}",
            json.dumps(value) if isinstance(value, (dict, list, tuple)) else value,
        )

    log.info(event, **payload)
    return {k: v for k, v in payload.items() if k in HORIZONS["evidence"]}


def task_payload(tile_id: str, period: str) -> dict:
    """Serialise the trace context INTO the task so the worker can rejoin the
    run's trace instead of starting its own."""
    carrier: dict[str, str] = {}
    inject(carrier)
    return {"tile_id": tile_id, "period": period, "otel_context": carrier}


def run_worker_task(payload: dict) -> dict:
    """Re-attach the context, then work. Without the attach, this run's ten
    thousand tiles become ten thousand unrelated traces."""
    token = otel_context.attach(extract(payload.get("otel_context", {})))
    try:
        with tracer.start_as_current_span("mrv.tile") as span:
            span.set_attribute("mrv.tile_id", payload["tile_id"])
            result = process_tile(payload["tile_id"], payload["period"])
            return emit("mrv.tile.complete", result)
    finally:
        otel_context.detach(token)
```

Note what `emit` returns. The evidence subset goes back to the caller so it can be written *beside the artefact* — in the Parquet footer, a sidecar JSON, or the schema's provenance columns. Relying on log retention for audit evidence is the most common instrumentation mistake in this domain, and it is discovered at exactly the wrong moment: a verifier asks for a 2027 bounding box in 2036, and the observability vendor's thirty-day tier expired it nine years ago.

<svg viewBox="0 -4 900 300" role="img" aria-labelledby="tr-t tr-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="tr-t">One run's trace with context propagated, against the same run without it</title>
  <desc id="tr-d">Two trace views of the same fan-out over six tiles. On the left, with context propagation, a single root span labelled mrv.run contains six child spans labelled mrv.tile, each nested and time-aligned, so a query for the run returns every tile. On the right, without propagation, the root span contains nothing and six unrelated root traces appear beside it, so a query for the run returns only the coordinator. An annotation states that per-tile latency is queryable in both, but the question that matters — which tiles this run processed — is answerable only on the left.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The context attach is four lines and decides whether the run is one thing</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Same six tiles, same duration, same log volume.</text>
    <text x="212" y="60" text-anchor="middle" fill="currentColor" font-size="10.5" font-weight="700">Context propagated</text>
    <text x="672" y="60" text-anchor="middle" fill="currentColor" font-size="10.5" font-weight="700">Context lost at the boundary</text>
  </g>
  <g>
    <rect x="24" y="76" width="392" height="26" rx="5" fill="currentColor" opacity="0.22"/>
    <text x="36" y="94" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">mrv.run · 6 tiles · 214 s</text>
    <rect x="52" y="110" width="120" height="20" rx="4" fill="currentColor" opacity="0.14"/>
    <text x="62" y="125" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor">mrv.tile N00E010</text>
    <rect x="52" y="136" width="148" height="20" rx="4" fill="currentColor" opacity="0.14"/>
    <text x="62" y="151" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor">mrv.tile N00E020</text>
    <rect x="140" y="162" width="132" height="20" rx="4" fill="currentColor" opacity="0.14"/>
    <text x="150" y="177" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor">mrv.tile N10E010</text>
    <rect x="176" y="188" width="160" height="20" rx="4" fill="currentColor" opacity="0.14"/>
    <text x="186" y="203" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor">mrv.tile N10E020</text>
    <rect x="228" y="214" width="118" height="20" rx="4" fill="currentColor" opacity="0.14"/>
    <text x="238" y="229" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor">mrv.tile N20E010</text>
    <rect x="268" y="240" width="140" height="20" rx="4" fill="currentColor" opacity="0.14"/>
    <text x="278" y="255" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor">mrv.tile N20E020</text>
    <text x="24" y="284" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">query "this run" → 6 tiles</text>
  </g>
  <g>
    <rect x="484" y="76" width="112" height="26" rx="5" fill="currentColor" opacity="0.22"/>
    <text x="496" y="94" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">mrv.run · empty</text>
    <rect x="484" y="118" width="120" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4,3"/>
    <text x="494" y="133" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" opacity="0.8">trace a1c… N00E010</text>
    <rect x="484" y="144" width="148" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4,3"/>
    <text x="494" y="159" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" opacity="0.8">trace 7f2… N00E020</text>
    <rect x="484" y="170" width="132" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4,3"/>
    <text x="494" y="185" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" opacity="0.8">trace 3b9… N10E010</text>
    <rect x="484" y="196" width="160" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4,3"/>
    <text x="494" y="211" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" opacity="0.8">trace c04… N10E020</text>
    <rect x="484" y="222" width="118" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4,3"/>
    <text x="494" y="237" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" opacity="0.8">trace 55e… N20E010</text>
    <rect x="484" y="248" width="140" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4,3"/>
    <text x="494" y="263" font-family="system-ui, sans-serif" font-size="8.5" fill="currentColor" opacity="0.8">trace 91d… N20E020</text>
    <text x="484" y="290" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">query "this run" → 0 tiles</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="676" y="118" width="212" height="112" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="676" y="118" width="212" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="692" y="142" fill="currentColor" font-size="10" font-weight="700">Both give per-tile latency.</text>
    <text x="692" y="166" fill="currentColor" font-size="9.5" opacity="0.82">Only the left answers "which tiles</text>
    <text x="692" y="182" fill="currentColor" font-size="9.5" opacity="0.82">did this run process" — the question</text>
    <text x="692" y="198" fill="currentColor" font-size="9.5" opacity="0.82">a completeness check depends on.</text>
    <text x="692" y="220" fill="currentColor" font-size="9" opacity="0.72">inject() on send, extract() on receive</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

The evidence stream is the compliance-bearing output, and three properties make it usable years later. It must be **append-only**, so a record cannot be quietly revised; **self-describing**, carrying its schema version so a future reader can interpret a field that has since changed meaning; and **co-located with the artefact**, so retrieving the data retrieves its provenance rather than requiring a join against a system that may not exist.

The shared keys deserve deliberate design. `run_id`, `input_digest`, and `code_version` appear in all three streams and are the only way an operator investigating a latency spike and a verifier reconstructing a tonnage can talk about the same event. Divergent identifiers between the ops stack and the evidence store are a common and painful defect, usually discovered mid-audit when nobody can map a dashboard incident to a data record.

Retention is a budgeting decision that is far cheaper made at design time. Operational telemetry at full granularity over thousands of tiles is expensive and worthless after a month; provenance records are tiny and must outlive the crediting period. Splitting them at emission — rather than retaining everything at the longest horizon, or worse, at the shortest — is what makes both affordable. Route the evidence stream into the same store that backs [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) and conform its fields to the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/).

## Production Integration

1. **Define the schema first**, with a version field and an explicit horizon for every key; treat adding a field as a schema change requiring review.
2. **Configure structlog once** at process start, with context variables bound for run-scoped keys so call sites cannot forget them.
3. **Propagate trace context** into every task payload and re-attach it in the worker; verify it in staging with the fan-out check above.
4. **Emit through one function**, never logging or setting span attributes directly from a stage.
5. **Persist the evidence subset with the artefact**, not only to the log pipeline.
6. **Route by horizon** at the collector, and test the audit-horizon store by retrieving a year-old record deliberately, on a schedule.

For orchestrator integration, bind the run identifier from the orchestrator's own run context so traces join to the scheduler's view — the mapping differs between Airflow, Prefect and Dagster and is worth getting right once, as discussed in [Prefect vs Airflow vs Dagster for MRV pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/prefect-vs-airflow-vs-dagster-for-mrv-pipelines/).

The retention split is the decision most teams get wrong in a way that only becomes visible years later, so it is worth making explicit at design time rather than inheriting from whatever the observability vendor's default tier happens to be.

<svg viewBox="0 -4 880 292" role="img" aria-labelledby="ret-t ret-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ret-t">Volume against required lifetime for the three signal streams</title>
  <desc id="ret-d">A chart plotting annual volume per project on a logarithmic vertical axis against required retention on the horizontal axis. The operator stream sits at high volume, roughly 40 gigabytes a year, and short retention of thirty days. The analyst stream sits at moderate volume, roughly 600 megabytes a year, and three-year retention. The evidence stream sits at very low volume, roughly 8 megabytes a year, and thirty-plus-year retention. A diagonal cost contour shows that retaining everything at the longest horizon costs about five hundred times the split arrangement, while retaining everything at the shortest horizon costs nothing and loses the audit record entirely. An annotation states that the evidence stream is small enough that its retention cost is negligible and its absence is fatal.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The stream you must keep longest is the one that costs least</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Annual volume per project against required lifetime. Note the logarithmic vertical scale.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="96" y1="80" x2="640" y2="80"/><line x1="96" y1="130" x2="640" y2="130"/>
    <line x1="96" y1="180" x2="640" y2="180"/><line x1="96" y1="230" x2="640" y2="230"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="96" y1="60" x2="96" y2="250"/>
    <line x1="96" y1="250" x2="640" y2="250"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="88" y="84" text-anchor="end">100 GB</text>
    <text x="88" y="134" text-anchor="end">1 GB</text>
    <text x="88" y="184" text-anchor="end">10 MB</text>
    <text x="88" y="234" text-anchor="end">100 KB</text>
    <text x="150" y="268" text-anchor="middle">30 days</text>
    <text x="368" y="268" text-anchor="middle">3 years</text>
    <text x="600" y="268" text-anchor="middle">30+ years</text>
    <text x="368" y="288" text-anchor="middle" font-weight="600">required retention</text>
  </g>
  <g>
    <circle cx="150" cy="92" r="9" fill="currentColor" opacity="0.55"/>
    <text x="166" y="88" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="currentColor">operator</text>
    <text x="166" y="104" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">≈40 GB yr⁻¹ · expires in a month</text>
    <circle cx="368" cy="142" r="9" fill="currentColor" opacity="0.55"/>
    <text x="384" y="138" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="currentColor">analyst</text>
    <text x="384" y="154" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">≈600 MB yr⁻¹ · run comparison</text>
    <circle cx="600" cy="192" r="10" fill="#f3a712"/>
    <text x="470" y="206" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="currentColor">evidence</text>
    <text x="470" y="222" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">≈8 MB yr⁻¹ · outlives the project</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="668" y="80" width="204" height="140" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="668" y="80" width="204" height="140" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="684" y="104" fill="currentColor" font-size="10.5" font-weight="700">Two wrong answers</text>
    <text x="684" y="128" fill="currentColor" font-size="9.5" opacity="0.82">Keep everything for 30 years:</text>
    <text x="684" y="144" fill="currentColor" font-size="9.5" opacity="0.82">≈500× the cost of the split.</text>
    <text x="684" y="168" fill="currentColor" font-size="9.5" opacity="0.82">Keep everything for 30 days:</text>
    <text x="684" y="184" fill="#f3a712" font-size="9.5" font-weight="700">free, and the audit record</text>
    <text x="684" y="200" fill="#f3a712" font-size="9.5" font-weight="700">is simply gone.</text>
  </g>
</svg>

## Frequently Asked Questions

### Should the evidence record live in the log pipeline or beside the data?

Beside the data, always, with the log pipeline as a convenience copy. Logs are operational infrastructure with operational retention and operational access controls, and none of those match an audit horizon measured in decades. Writing the provenance subset into the Parquet footer, a sidecar JSON, or dedicated provenance columns means the evidence travels with the artefact through every copy, migration, and handover — including the ones that happen after your observability vendor has been replaced.

### How much cardinality is safe in span attributes?

Less than you want. Per-tile identifiers on spans are usually fine because spans are sampled and stored differently from metrics, but the same identifiers as metric labels will produce a cardinality explosion that either costs a great deal or gets silently dropped. The workable split is: high-cardinality identifiers on spans and in the evidence record, low-cardinality dimensions — stage, status, sensor — on metrics. Aggregate per-tile counts into per-stage metrics rather than emitting a metric per tile.

### Do I need OpenTelemetry at all if I already have structured logs?

You need it for one thing structured logs cannot do: relate events across a distributed fan-out into a single causal structure. If your pipeline runs in one process, well-designed structured logs with a run identifier carry most of the value and tracing is optional. Once work fans out across workers and stages, the trace is what turns ten thousand independent events into one run you can ask questions about — including the completeness question that catches partial-output failures.

### What belongs in a span event versus a log line?

With a single emitter the question mostly dissolves, which is the point. Practically: everything goes to the log line, and the span carries the same values as attributes so a trace-based query can filter on them. Where they diverge is volume — you may sample spans at a fraction of runs while keeping every log line, or the reverse for very high-frequency stages. Make that a sampling decision at the collector rather than a decision about which values to emit, so the two views never describe different things.

### How do I instrument a pipeline that already exists without rewriting it?

Work backwards from the evidence stream, which is both the most valuable and the least invasive. Start by wrapping the existing stage boundaries with a function that computes the signals from the output artefact — this requires no change to the stage's internals at all, because the signals are derived rather than reported. That single step gives you the provenance record, the spatial invariants, and a baseline for run comparison, and it can be added to a legacy pipeline in a day. Only then add the trace context propagation, which does require touching the task dispatch path, and finally migrate the existing prose logs to the structured schema stage by stage. Teams that attempt the migration in the opposite order — logs first — spend weeks on the least valuable part and often stall before reaching the evidence stream.

### Does the instrumentation itself need testing?

Yes, and the test that matters is a retrieval test rather than an emission test. It is easy to verify that a stage emits an event; it is the retrieval a year later that actually fails, because a retention policy changed, a field was renamed, an index was dropped, or the store was migrated. Schedule a recurring job that fetches a deliberately old evidence record, asserts every expected field is present and parseable under the current schema version, and fails loudly when it is not. That job is the difference between believing you have an audit trail and knowing it.

### How do I keep the schema stable while the pipeline evolves?

Version it, add rather than repurpose, and never change a field's meaning under a stable name. Adding `null_rate_after_mask` alongside `null_rate` is cheap; redefining `null_rate` to mean something else silently invalidates every historical comparison and every trend a verifier might reconstruct. Where a field genuinely must change semantics, bump the schema version and keep readers that understand both. The discipline is the same one you would apply to a database schema, and for the same reason: consumers you cannot see depend on it.

### What sampling rate is appropriate for traces in a large fan-out?

Sample by run rather than by span, and keep every span within a sampled run. Sampling individual spans in a ten-thousand-tile fan-out produces partial traces that cannot answer completeness questions, which is most of the reason to have traces at all. Sampling whole runs at, say, one in ten during steady operation and one hundred per cent for any run that will produce a reported figure keeps cost bounded without fragmenting the runs that matter.

### How should sensitive values be kept out of the signal streams?

By allow-listing the fields that may be emitted rather than deny-listing the ones that may not. A schema that enumerates permitted keys cannot leak a credential added to a parameters dictionary six months later, whereas a redaction filter will miss exactly that case. Where a value must be recorded but not exposed — a supplier identifier under a confidentiality agreement, say — record a stable hash in the observability stream and keep the mapping in the restricted evidence store.

## Related guides

- [MRV Pipeline Observability & Failure Modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/) — the parent topic and the four signal classes.
- [Failure Mode Catalog for Spatial MRV Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/failure-mode-catalog-for-spatial-mrv-pipelines/) — the invariants this instrumentation carries.
- [Tracking Data Lineage with OpenLineage for ESG Audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/) — where the evidence stream becomes a lineage graph.
- [Prefect vs Airflow vs Dagster for MRV Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/prefect-vs-airflow-vs-dagster-for-mrv-pipelines/) — how each orchestrator exposes the run context to bind against.
