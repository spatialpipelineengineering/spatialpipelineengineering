---
shortTitle: "MRV Data Schema Reference: Canonical Parquet Contracts"
title: "MRV Data Schema Reference"
description: "A reference for the canonical Parquet data contract in an MRV platform: schema-on-write, GeoParquet CRS metadata, unit typing, schema versioning, and contract tests."
slug: mrv-data-schema-reference
type: topic
breadcrumb: "Data Schema Reference"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# MRV Data Schema Reference

The MRV Data Schema Reference defines the shared data-contract layer that every stage of a measurement, reporting, and verification platform reads from and writes to — the single canonical Parquet schema that turns a loose collection of rasters, plot tables, and emission-factor lookups into an addressable, typed, versioned data product. It is the connective tissue of the [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack: where [orchestrating MRV data pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) decides *when* a task runs and in what order, the schema decides *what shape* the data crossing every task boundary must take, and it does so with the same rigour the platform applies when it maps outputs to [carbon registry standards and methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/). Without an enforced contract, an orchestration DAG is just a way to move malformed data around faster.

This reference treats the schema as the primary compliance artifact it is. A carbon figure that reaches a registry carries an implicit claim: that every tonne was measured in known units, projected in a declared coordinate reference system, and joined against a named version of an emission-factor table. The schema is where those claims become machine-checkable rather than narrated in a methodology PDF. The two child guides below drill into the specifics — the full column-by-column [canonical Parquet schema data dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) and the discipline of [versioning emission-factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) — while this page establishes the contract model, the enforcement pattern, and the failure modes that make an unenforced schema so dangerous.

<svg viewBox="0 0 960 340" role="img" aria-labelledby="mds-t mds-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="mds-t">Schema-contract enforcement gate between producers and the canonical MRV store</title>
  <desc id="mds-d">Three producers on the left — Earth-observation ingest, field-inventory tables, and emission-factor databases — feed a central contract-validation gate that checks column types, physical units, and the coordinate reference system. Conformant records pass to the canonical GeoParquet store, drawn in amber as the audited system of record. Non-conformant records are diverted to a quarantine store with a rejection reason, and never reach downstream compliance reporting.</desc>
  <defs>
    <marker id="mds-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- Producers -->
  <text x="105" y="28" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" opacity="0.55">PRODUCERS</text>
  <rect x="20" y="42" width="170" height="62" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="20" y="42" width="170" height="62" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
  <text x="105" y="68" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">EO / raster ingest</text>
  <text x="105" y="86" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">biomass &#183; SOC tiles</text>
  <rect x="20" y="139" width="170" height="62" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="20" y="139" width="170" height="62" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
  <text x="105" y="165" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Field inventory</text>
  <text x="105" y="183" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">plot &#183; sample tables</text>
  <rect x="20" y="236" width="170" height="62" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="20" y="236" width="170" height="62" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
  <text x="105" y="262" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Emission factors</text>
  <text x="105" y="280" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">versioned EF tables</text>
  <!-- Gate -->
  <rect x="340" y="96" width="200" height="148" rx="10" fill="#11839e" opacity="0.08"/>
  <rect x="340" y="96" width="200" height="148" rx="10" fill="none" stroke="#11839e" stroke-width="2"/>
  <text x="440" y="122" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" opacity="0.6">CONTRACT-VALIDATION GATE</text>
  <text x="440" y="150" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Schema on write</text>
  <line x1="366" y1="164" x2="514" y2="164" stroke="currentColor" stroke-width="1" opacity="0.35"/>
  <text x="440" y="184" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.82">&#183; column types &amp; nullability</text>
  <text x="440" y="204" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.82">&#183; physical units (tCO2e)</text>
  <text x="440" y="224" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.82">&#183; declared CRS / EPSG</text>
  <!-- Producer -> gate arrows -->
  <line x1="190" y1="73" x2="338" y2="140" stroke="currentColor" stroke-width="1.4" marker-end="url(#mds-arrow)"/>
  <line x1="190" y1="170" x2="338" y2="170" stroke="currentColor" stroke-width="1.4" marker-end="url(#mds-arrow)"/>
  <line x1="190" y1="267" x2="338" y2="200" stroke="currentColor" stroke-width="1.4" marker-end="url(#mds-arrow)"/>
  <!-- Canonical store (amber, audited) -->
  <rect x="720" y="60" width="216" height="96" rx="10" fill="#f3a712" opacity="0.16"/>
  <rect x="720" y="60" width="216" height="96" rx="10" fill="none" stroke="#f3a712" stroke-width="2.2"/>
  <text x="828" y="86" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" opacity="0.6">SYSTEM OF RECORD</text>
  <text x="828" y="110" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Canonical GeoParquet</text>
  <text x="828" y="130" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.78">conformant &#183; audited</text>
  <text x="828" y="146" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.78">schema v-tagged</text>
  <!-- Quarantine -->
  <rect x="720" y="200" width="216" height="86" rx="10" fill="currentColor" opacity="0.05"/>
  <rect x="720" y="200" width="216" height="86" rx="10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="6,4"/>
  <text x="828" y="226" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" opacity="0.55">DEAD-LETTER</text>
  <text x="828" y="248" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Quarantine</text>
  <text x="828" y="268" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.72">rejection reason logged</text>
  <!-- Gate -> outputs -->
  <path d="M540 140 L630 108 L718 108" fill="none" stroke="#f3a712" stroke-width="2" marker-end="url(#mds-arrow)"/>
  <text x="628" y="98" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor">conformant</text>
  <path d="M540 200 L630 240 L718 240" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="5,3" marker-end="url(#mds-arrow)"/>
  <text x="628" y="232" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" opacity="0.75">non-conformant</text>
  <!-- Footer note -->
  <text x="478" y="322" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.65">every write is validated against a semantically versioned contract before it becomes part of the audit record</text>
</svg>

## Role in the MRV Workflow

The schema reference sits at the boundary between every producing stage and the canonical store that the rest of the platform reads. In an MRV pipeline, data arrives from radically different worlds: reflectance and backscatter rasters reduced to per-parcel carbon-density tables, field crews uploading plot inventories, and third-party emission-factor databases published on their own release cadence. Left unmediated, each producer imposes its own column names, its own units, its own idea of what a coordinate means. The contract layer collapses that heterogeneity into one shape, so that a downstream consumer — an uncertainty pass, a registry submission builder, an auditor's query — never has to ask which flavour of `emissions` column it is looking at.

Two enforcement philosophies compete here, and the choice is load-bearing. **Schema-on-read** defers validation to query time: data is written in whatever shape it arrives, and each consumer interprets it. That is expedient for exploratory analytics but corrosive for MRV, because it means the same raw file can yield two different tonnage figures depending on who reads it and with what assumptions. **Schema-on-write** — the model this reference mandates — validates at ingestion, refuses non-conformant records at the gate, and guarantees that anything in the canonical store already satisfies the contract. The cost is a stricter ingestion path; the payoff is that the system of record is trustworthy by construction, and an auditor can reason about a single, enforced shape rather than a distribution of possible interpretations.

The physical substrate for that contract is columnar Parquet, extended with GeoParquet for the spatial columns. Parquet earns its place because its footer carries a typed schema that travels with the data: dtypes, nullability, and arbitrary key–value metadata are embedded in every file, so the contract is not a separate document that can drift out of sync with the bytes it describes. GeoParquet adds the piece MRV cannot live without — a standardized `geo` metadata block that records the geometry encoding and, critically, the [coordinate reference system](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) as embedded PROJJSON. A geometry column without a declared CRS is not data, it is a guess; the schema forbids that guess from ever entering the store.

Every column in the canonical schema carries three things beyond its name: a physical dtype, a declared unit, and a human-readable description. Units in particular are promoted from convention to contract, because in carbon accounting a silent factor-of-a-thousand error between kilogrammes and tonnes is not a rounding problem — it is a credit-issuance problem. The table below sketches the core columns at the level a reference resource should; the exhaustive dictionary, including nullability rules, enumerations, and per-column validation predicates, lives in the [canonical Parquet schema data dictionary](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/).


| Column | dtype | Unit | Description |
|--------|-------|------|-------------|
| `parcel_id` | `string` | — | Stable identifier for the reporting unit; primary join key across all tables. |
| `geometry` | `binary` (WKB) | GeoParquet CRS | Parcel boundary polygon; CRS declared in the file `geo` metadata (equal-area for area maths). |
| `reporting_period` | `date32` | ISO date | Start of the accounting epoch the record belongs to. |
| `carbon_stock` | `double` | tC | Modelled carbon stock for the parcel and period. |
| `emissions` | `double` | tCO2e | Net emissions or removals, always expressed in tonnes CO&#8322;-equivalent. |
| `emission_factor_id` | `string` | — | Foreign key into a *versioned* emission-factor table (see child guide). |
| `ef_version` | `string` | semver | Semantic version of the emission-factor release used in the join. |
| `uncertainty_rel` | `double` | fraction | Relative uncertainty (0&#8211;1) attached to the figure for conservative deduction. |
| `crs_epsg` | `int32` | EPSG code | Redundant, queryable copy of the working CRS for fast filtering. |
| `schema_version` | `string` | semver | Semantic version of the canonical schema this row was written against. |


Two design decisions in that table deserve emphasis. First, `emissions` is contractually `tCO2e` — the unit is part of the column's identity, not a note in a spreadsheet — so any producer emitting kilogrammes must convert before the gate, and the gate is entitled to range-check magnitudes accordingly. Second, both `ef_version` and `schema_version` are first-class columns rather than pipeline-run metadata, because reproducibility demands that a row remember not just its values but the *contracts* it was computed under. A figure without those two versions is unauditable no matter how precise it looks.

## Core Failure Modes

Three failure modes dominate production MRV schema management. Each is silent by default — the pipeline keeps running and the numbers keep flowing — which is exactly what makes them dangerous. Each has a distinct root cause and a measurable impact on the credibility of the reported figures.

1. **Schema drift silently dropping columns.** The root cause is permissive I/O: a `pandas.read_parquet` followed by a `to_parquet` will happily round-trip whatever columns happen to be present, and a producer that stops emitting `uncertainty_rel` — because an upstream library changed a default, or a join quietly failed — produces a file that is *structurally valid Parquet* but *semantically incomplete*. Under schema-on-read, nothing complains; the column simply vanishes, and every downstream consumer treats its absence as "no uncertainty" rather than "uncertainty unknown". Observed impact: in a portfolio where the uncertainty column drives conservative deductions, a dropped column removes the deduction entirely, inflating claimable tonnage by the full deduction margin — routinely 8&#8211;15% of issuance — until a verifier notices the figures are suspiciously tight. The fix is schema-on-write with an explicit required-column set; drift becomes a hard rejection at the gate rather than a discovery in an audit.

2. **Unit ambiguity between tCO2e and kgCO2e.** The root cause is treating units as documentation instead of contract. A `double` column named `emissions` carries no intrinsic unit, so a producer that switches from tonnes to kilogrammes — or a data source that was always in kilogrammes and was assumed to be in tonnes — introduces a factor-of-1000 error that passes every type check because the dtype never changed. Observed impact is catastrophic and asymmetric: a kg-as-tonnes error overstates emissions by 1000×, which in a removals project could zero out an entire vintage; the reverse understates by 1000×, quietly under-reporting a facility's footprint against [CSRD ESRS E1](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/) disclosure. The fix is to bind the unit to the column in schema metadata and enforce a plausibility range at the gate, so a value three orders of magnitude outside the expected envelope raises rather than reconciles.

3. **Unversioned emission-factor joins making runs irreproducible.** The root cause is joining against a *mutable* emission-factor table — a database view, a "latest" CSV, an API endpoint that returns whatever is current — without recording which release was used. The run succeeds, the numbers look fine, and six months later the same pipeline over the same inputs produces different figures because the factor table was revised in the interim. Observed impact: the reporting period can no longer be reconstructed bit-for-bit, which fails the reproducibility requirement of ISO 14064-3 outright; a verifier who reruns the pipeline gets a number that disagrees with the submitted one and has no way to tell whether the discrepancy is an error or an unrecorded factor update. The fix is to pin every join to an immutable, semantically versioned factor release and to persist that `ef_version` in the row itself — the discipline detailed in [versioning emission-factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/).

<svg viewBox="0 -4 900 230" role="img" aria-labelledby="sch-t sch-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="sch-t">Schema change classes and what each one costs</title>
  <desc id="sch-d">Four change classes with their compatibility and cost. Adding an optional column is backward compatible and costs nothing to existing readers. Adding a required column is forward-incompatible for writers but readable by old consumers, and requires a backfill. Widening a type, such as integer to double, is readable by new consumers only and requires coordinated deployment. Changing a column's meaning under a stable name is compatible at the type level and silently invalidates every historical comparison, marked as the one to never do. A panel states that the fourth is the only class that produces no error anywhere and is therefore the only one that needs a policy rather than a migration.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Only one schema change is genuinely dangerous</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Three cause errors you can fix. The fourth causes none.</text>
    <rect x="12" y="52" width="212" height="152" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="212" height="152" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Add optional column</text>
    <text x="28" y="102" fill="currentColor" font-size="9.5" opacity="0.85">backward compatible</text>
    <text x="28" y="122" fill="currentColor" font-size="9.5" opacity="0.85">old readers unaffected</text>
    <text x="28" y="152" fill="currentColor" font-size="9.5" font-weight="700">cost: none</text>
    <rect x="236" y="52" width="212" height="152" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="236" y="52" width="212" height="152" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="252" y="76" fill="currentColor" font-size="10.5" font-weight="700">Add required column</text>
    <text x="252" y="102" fill="currentColor" font-size="9.5" opacity="0.85">writers must change first</text>
    <text x="252" y="122" fill="currentColor" font-size="9.5" opacity="0.85">old data lacks it</text>
    <text x="252" y="152" fill="currentColor" font-size="9.5" font-weight="700">cost: a backfill</text>
    <rect x="460" y="52" width="212" height="152" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="460" y="52" width="212" height="152" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="476" y="76" fill="currentColor" font-size="10.5" font-weight="700">Widen a type</text>
    <text x="476" y="102" fill="currentColor" font-size="9.5" opacity="0.85">int32 → float64</text>
    <text x="476" y="122" fill="currentColor" font-size="9.5" opacity="0.85">new readers only</text>
    <text x="476" y="152" fill="currentColor" font-size="9.5" font-weight="700">cost: coordinated deploy</text>
    <rect x="684" y="52" width="204" height="152" rx="9" fill="none" stroke="#f3a712" stroke-width="2" stroke-dasharray="6,3"/>
    <text x="700" y="76" fill="currentColor" font-size="10.5" font-weight="700">Redefine a meaning</text>
    <text x="700" y="102" fill="currentColor" font-size="9.5" opacity="0.85">same name, same type,</text>
    <text x="700" y="122" fill="currentColor" font-size="9.5" opacity="0.85">different quantity</text>
    <text x="700" y="146" fill="#f3a712" font-size="9.5" font-weight="700">no error, anywhere</text>
    <text x="700" y="166" fill="#f3a712" font-size="9.5" font-weight="700">every history invalidated</text>
    <text x="700" y="186" fill="currentColor" font-size="9" opacity="0.78">policy, not migration: never do it</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The enforcement point is a single contract-validation function invoked at every pipeline boundary that writes to the canonical store. It validates dtypes against an explicit `pyarrow` schema, asserts the declared CRS on the GeoParquet metadata, range-checks the unit-bearing columns to catch magnitude errors, and requires the version columns to be present and non-null. Anything that fails is raised — never coerced, never silently dropped — and the rejection is logged as a structured event so the quarantine record carries a machine-readable reason. The function below uses `pyarrow` for the authoritative type check and `pandera` for the column-level predicate layer, with `structlog` emitting audit-ready JSON telemetry on every decision.

```python
from __future__ import annotations

import re
from datetime import datetime, timezone

import pyarrow as pa
import pyarrow.parquet as pq
import pandera.pandas as pandera
from pandera import Column, Check
import structlog

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()


class SchemaContractError(Exception):
    """Raised when a record violates the canonical MRV data contract."""


# Authoritative physical schema — the Parquet footer must match this exactly.
CANONICAL_ARROW_SCHEMA = pa.schema([
    ("parcel_id", pa.string()),
    ("geometry", pa.binary()),
    ("reporting_period", pa.date32()),
    ("carbon_stock", pa.float64()),      # unit: tC
    ("emissions", pa.float64()),         # unit: tCO2e — NOT kgCO2e
    ("emission_factor_id", pa.string()),
    ("ef_version", pa.string()),
    ("uncertainty_rel", pa.float64()),
    ("crs_epsg", pa.int32()),
    ("schema_version", pa.string()),
])

# Equal-area CRS is mandatory so area-weighted carbon maths stays honest.
ALLOWED_EPSG = {6933, 3035}          # global equal-area, EU equal-area
SEMVER = re.compile(r"^\d+\.\d+\.\d+$")
# Plausibility envelope for tonnes CO2e per parcel-period; a kg value would blow past it.
MAX_PLAUSIBLE_TCO2E = 5_000_000.0

# Column-level predicate layer: units, ranges, versions, nullability.
CONTRACT = pandera.DataFrameSchema(
    {
        "parcel_id": Column(str, nullable=False, unique=False),
        "carbon_stock": Column(float, Check.ge(0), nullable=False),
        "emissions": Column(
            float,
            Check.in_range(-MAX_PLAUSIBLE_TCO2E, MAX_PLAUSIBLE_TCO2E),
            nullable=False,
        ),
        "emission_factor_id": Column(str, nullable=False),
        "ef_version": Column(str, Check.str_matches(SEMVER), nullable=False),
        "uncertainty_rel": Column(float, Check.in_range(0.0, 1.0), nullable=False),
        "crs_epsg": Column(int, Check.isin(sorted(ALLOWED_EPSG)), nullable=False),
        "schema_version": Column(str, Check.str_matches(SEMVER), nullable=False),
    },
    strict=True,   # reject any unexpected OR missing column — this catches schema drift
    coerce=False,  # never silently cast; a wrong dtype is a violation, not a fixup
)


def _assert_arrow_types(table: pa.Table, run_id: str) -> None:
    """Fail if the Parquet footer schema deviates from the canonical contract."""
    got = {f.name: str(f.type) for f in table.schema}
    want = {f.name: str(f.type) for f in CANONICAL_ARROW_SCHEMA}
    missing = set(want) - set(got)
    extra = set(got) - set(want)
    mistyped = {n: (got[n], want[n]) for n in want & got.keys() if got[n] != want[n]}
    if missing or extra or mistyped:
        log.error("schema.contract.type_mismatch", run_id=run_id,
                  missing=sorted(missing), extra=sorted(extra), mistyped=mistyped)
        raise SchemaContractError(
            f"type contract violated: missing={missing} extra={extra} mistyped={mistyped}")


def _assert_crs(table: pa.Table, run_id: str) -> int:
    """Assert the GeoParquet 'geo' metadata declares an allowed equal-area CRS."""
    import json
    meta = table.schema.metadata or {}
    geo_raw = meta.get(b"geo")
    if geo_raw is None:
        log.error("schema.contract.crs_missing", run_id=run_id)
        raise SchemaContractError("GeoParquet 'geo' metadata absent; CRS undeclared.")
    geo = json.loads(geo_raw.decode("utf-8"))
    primary = geo["primary_column"]
    projjson = geo["columns"][primary].get("crs")
    epsg = None
    if isinstance(projjson, dict):
        epsg = projjson.get("id", {}).get("code")
    if epsg not in ALLOWED_EPSG:
        log.error("schema.contract.crs_rejected", run_id=run_id, epsg=epsg,
                  allowed=sorted(ALLOWED_EPSG))
        raise SchemaContractError(f"CRS EPSG:{epsg} not in equal-area allow-list.")
    return int(epsg)


def validate_canonical_write(path: str, *, run_id: str) -> pa.Table:
    """Contract gate: validate a Parquet file before it enters the canonical store.

    Raises SchemaContractError on any dtype, unit, CRS, or version violation so a
    non-conformant record is quarantined rather than written to the system of record.
    """
    table = pq.read_table(path)
    _assert_arrow_types(table, run_id)
    epsg = _assert_crs(table, run_id)

    df = table.drop(["geometry"]).to_pandas()
    # Cross-check the redundant queryable CRS column against the geo metadata.
    if not (df["crs_epsg"] == epsg).all():
        log.error("schema.contract.crs_column_mismatch", run_id=run_id, geo_epsg=epsg)
        raise SchemaContractError("crs_epsg column disagrees with GeoParquet metadata.")

    try:
        CONTRACT.validate(df, lazy=True)
    except pandera.errors.SchemaErrors as exc:
        failures = exc.failure_cases[["column", "check", "failure_case"]].to_dict("records")
        log.error("schema.contract.predicate_failed", run_id=run_id, failures=failures[:20])
        raise SchemaContractError(f"{len(failures)} predicate violation(s) at the gate.")

    log.info("schema.contract.passed", run_id=run_id, rows=table.num_rows,
             crs_epsg=epsg, schema_version=str(df["schema_version"].iloc[0]),
             validated_at=datetime.now(timezone.utc).isoformat())
    return table
```

Two properties of this gate are non-negotiable. First, `strict=True` combined with `coerce=False` means the contract catches drift in *both* directions — a dropped required column and an unexpected extra column both raise, and no value is ever silently cast to make a bad file pass. That single pair of flags neutralises the first failure mode. Second, the unit check on `emissions` is a plausibility envelope, not a mere non-null test: a value that has been mistakenly multiplied by 1000 will breach `MAX_PLAUSIBLE_TCO2E` and raise, converting the second failure mode from a silent thousand-fold error into a loud rejection. The version columns are validated as strict semver, so a run that failed to pin its `ef_version` cannot reach the store at all.

## Validation, Debugging & Compliance Mapping

Each design decision in the gate maps to a specific regulatory control, which is what makes the schema a submission artifact rather than an engineering convenience. The dtype contract and required-column set answer **ISO 14064-3**, whose validation and verification clauses expect the reported data to be complete and consistent across the reporting boundary; a strict schema is the mechanism by which "complete" becomes machine-checkable rather than asserted. The version columns answer the same standard's reproducibility expectation directly — a verifier who reruns the pipeline against the pinned `ef_version` and `schema_version` must obtain the identical figure, and the persisted versions are what make that rerun deterministic. The unit contract feeds the conservativeness principle running through the **Verra VM-series** methodologies: a magnitude gate that refuses implausible tonnage prevents both the overstatement that would inflate issuance and the understatement that would strand legitimate credit. The declared-CRS assertion underwrites every area-weighted figure, because a tonne-per-hectare number computed in a non-equal-area projection is quantitatively wrong before any accounting rule is applied.

Mapping the gate to disclosure obligations is equally direct. **CSRD ESRS E1** demands auditable, traceable climate metrics with explicit data-quality treatment; a canonical store where every row carries its schema version, its emission-factor version, and its declared uncertainty is precisely the traceable substrate an assurance provider needs, and the quarantine stream provides the documented evidence that non-conformant data was excluded rather than quietly absorbed. The dead-letter records themselves are a compliance asset: each carries a structured rejection reason, so an auditor can see not only what entered the store but what was kept out and why.

For debugging, treat three signals as monitored on every run, including the runs that pass. The **quarantine rate** is the leading indicator of upstream drift — a producer that begins emitting a renamed or retyped column shows up as a sudden spike in gate rejections long before any figure is wrong downstream. The **distribution of `emissions` magnitudes** surfaces creeping unit errors that stay just inside the plausibility envelope; a producer that switches units on a low-emissions parcel may not breach the hard gate, but the distribution will shift by orders of magnitude and a percentile monitor will catch it. The **set of distinct `ef_version` values** per reporting period reveals unpinned joins: a period that should reference a single frozen factor release but shows several versions is evidence that some path bypassed the pin. Contract tests belong in continuous integration as well as at runtime — a `pytest` suite that writes deliberately malformed fixtures (a dropped column, a kg-scaled value, an undeclared CRS, an unpinned version) and asserts that `validate_canonical_write` raises on each is what stops a refactor from silently loosening the contract. That test suite is the schema's own regression harness, and it is inseparable from the [data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) layer that records which contract version every archived figure was validated against.

<svg viewBox="0 -4 880 224" role="img" aria-labelledby="unit-t unit-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="unit-t">Where the unit contract has to be written so it survives every hop</title>
  <desc id="unit-d">A dataset travelling through four hops, with the places a unit declaration can live. In the column name only, the unit survives the Parquet write but is lost on any rename or projection. In a sidecar document, it survives locally but is lost when the file is copied. In the Parquet field metadata, it travels inside the file and survives copies, renames, and format-preserving transfers. In a validation gate that asserts the metadata on read, it also survives a producer that forgets to write it. A panel notes that only the last two combinations survive a file arriving from a partner with no context at all.</desc>
  <defs>
    <marker id="unit-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Where you write the unit decides whether it survives</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Four hops: write, copy, rename, hand to a partner.</text>
    <rect x="12" y="52" width="424" height="70" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="12" y="52" width="424" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="28" y="74" fill="currentColor" font-size="10" font-weight="700">In the column name</text>
    <text x="28" y="94" fill="currentColor" font-size="9.5" opacity="0.85">co2e_tonnes</text>
    <text x="28" y="112" fill="#f3a712" font-size="9.5" font-weight="700">lost on any rename or projection</text>
    <rect x="456" y="52" width="412" height="70" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="456" y="52" width="412" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="472" y="74" fill="currentColor" font-size="10" font-weight="700">In a sidecar document</text>
    <text x="472" y="94" fill="currentColor" font-size="9.5" opacity="0.85">schema.md next to the file</text>
    <text x="472" y="112" fill="#f3a712" font-size="9.5" font-weight="700">lost the first time the file is copied</text>
    <rect x="12" y="134" width="424" height="70" rx="8" fill="currentColor" opacity="0.12"/>
    <rect x="12" y="134" width="424" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="28" y="156" fill="currentColor" font-size="10" font-weight="700">In the Parquet field metadata</text>
    <text x="28" y="176" fill="currentColor" font-size="9.5" opacity="0.85">travels inside the file itself</text>
    <text x="28" y="194" fill="currentColor" font-size="9.5" font-weight="700">survives copy, rename, transfer</text>
    <rect x="456" y="134" width="412" height="70" rx="8" fill="currentColor" opacity="0.12"/>
    <rect x="456" y="134" width="412" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="472" y="156" fill="currentColor" font-size="10" font-weight="700">…and asserted on read</text>
    <text x="472" y="176" fill="currentColor" font-size="9.5" opacity="0.85">a gate that refuses an undeclared unit</text>
    <text x="472" y="194" fill="currentColor" font-size="9.5" font-weight="700">survives a producer who forgets</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#unit-arrow)" opacity="0.6">
    <line x1="224" y1="126" x2="224" y2="132"/>
    <line x1="662" y1="126" x2="662" y2="132"/>
  </g>
</svg>

## Frequently Asked Questions

### Why is the schema published as an artefact rather than defined in code?

Because every stage and every consumer needs to validate against the same definition, including consumers you do not control. A schema living inside one repository becomes that repository's private convention, and other stages drift from it in ways nobody notices until a downstream join silently drops rows. Publishing it as a versioned artefact — with types, units, nullability, and the CRS constraint — lets each stage assert against an external truth and lets an auditor read the data dictionary without reading the implementation.

### How should units be attached to columns?

In the Parquet field metadata, and asserted on read. Encoding units in the column name is better than nothing but is lost on any rename or projection; a sidecar document is lost the first time the file is copied. Field metadata travels inside the file, survives copies and transfers, and can be checked by a gate that refuses an undeclared unit. That combination is the only one that still works when a file arrives from a partner with no accompanying context.

### What belongs in the partition key?

Only fields that are deterministic from the inputs and are used in nearly every query — typically period and a spatial tile or region. Adding a field that changes between runs, such as a run identifier, breaks idempotent overwrite because a replay writes to a new path instead of replacing the old one. Adding a high-cardinality field creates small-file problems that dominate read cost. Partitioning is a query-shape decision that is expensive to change later, so it is worth modelling before the first large write.

### Should geometry live in the same file as the attributes?

Yes, in a GeoParquet-conformant layout, unless the geometry is very large relative to the attributes. Splitting geometry into a separate file introduces a join on every read and, more importantly, an opportunity for the two to drift apart — a boundary revised in one file and not the other is a defect no schema check will catch. Where geometry genuinely must be separate, key it on a content digest rather than an identifier so a mismatch is detectable.

### How do I evolve the schema without breaking historical reads?

Add rather than change, version the schema itself, and keep readers that understand both versions during any transition. Adding an optional column is free; adding a required column costs a backfill; widening a type costs a coordinated deployment. What is never acceptable is redefining an existing column's meaning under a stable name, because it produces no error anywhere and silently invalidates every historical comparison a verifier might reconstruct.

## Conclusion

The MRV Data Schema Reference is the contract that makes an orchestrated carbon pipeline auditable rather than merely automated. By committing to a single canonical Parquet schema, validating on write instead of on read, embedding CRS and units as enforced metadata rather than convention, and versioning both the schema and the emission-factor tables it joins against, an engineering team converts three of the most common silent MRV failures — dropped columns, unit ambiguity, and irreproducible joins — into loud, quarantined rejections that never reach a registry. The gate shown here is deliberately unforgiving because the alternative is a system of record whose figures cannot be defended under third-party verification. From here, the two child guides go deeper: the full [canonical Parquet schema data dictionary](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) specifies every column and its predicates, and [versioning emission-factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) makes the pinned-join discipline concrete.

## Related guides

- [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) — the parent stack this data-contract layer anchors.
- [The Canonical Parquet Schema: A Data Dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) — the exhaustive column-by-column dictionary this reference summarizes.
- [Versioning Emission Factor Databases for Reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) — pinning factor releases so runs reproduce bit-for-bit.
- [Orchestrating MRV Data Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) — the scheduling layer that invokes the contract gate at every boundary.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — the evidence layer that records which contract version every figure was validated against.
