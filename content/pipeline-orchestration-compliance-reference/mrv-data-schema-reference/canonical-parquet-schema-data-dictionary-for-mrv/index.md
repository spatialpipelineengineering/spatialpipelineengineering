---
shortTitle: "Canonical Parquet Schema: MRV Data Dictionary"
title: "The Canonical Parquet Schema: A Data Dictionary for MRV"
description: "Column-by-column data dictionary for the canonical MRV GeoParquet dataset: Arrow dtypes, units, nullability, partition keys, GeoParquet metadata, a pyarrow validate() gate, and ISO 14064-3 / Verra / CSRD mappings."
slug: canonical-parquet-schema-data-dictionary-for-mrv
type: guide
breadcrumb: "Canonical Parquet Data Dictionary"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# The Canonical Parquet Schema: A Data Dictionary for MRV

Every measurement, reporting, and verification pipeline eventually converges on one physical artifact: the table an auditor actually reads. This page is the authoritative column-by-column dictionary for that table — the canonical GeoParquet dataset referenced across the [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) discipline within the wider [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack. It pins down the exact Arrow dtype, unit, nullability, and semantic contract for each field so that activity data, geometry, emission factors, computed CO2e, uncertainty, and lineage all survive a third-party verification without a single "what does this column mean?" clarifying email.

A schema is not documentation you write after the fact; it is a runtime contract you enforce on every write. The factors that populate `emission_factor` and `factor_version` are themselves versioned artifacts governed by [versioning emission factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/), and the identifiers that stitch this table back to its inputs are the raw material for [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/). Treating the schema as canonical means one physical layout, one set of units, and one validation gate stand between an upstream transform and the registry — no per-project dialects, no silently-coerced columns, no ambiguity about whether `co2e_tonnes` is metric tonnes or short tons.

<svg viewBox="0 0 960 452" role="img" aria-labelledby="mrv-schema-t mrv-schema-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="mrv-schema-t">Canonical MRV GeoParquet schema grouped by column family, mapped to Hive-style storage partitions</title>
  <desc id="mrv-schema-d">On the left, the canonical mrv_emissions table is drawn as seven stacked column families: identity (record_id, project_id), spatial in teal (geometry WKB, crs_epsg, area_ha), activity (period_start/end, activity_value, activity_unit), factor (factor_id, factor_version, emission_factor). The result, uncertainty and lineage families are drawn in amber to mark the audit-critical outputs: result (co2e_tonnes), uncertainty (uncertainty_pct, tier, method_id), and lineage (lineage_hash, ingested_at). An arrow labelled partitioned by links the table to a right-hand storage tree showing Hive-style directories keyed on country_iso, reporting_year and factor_version, terminating in Zstd-compressed part files that each carry file-level GeoParquet metadata.</desc>
  <defs>
    <marker id="mrv-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <!-- table title -->
    <rect x="28" y="34" width="372" height="34" rx="7" fill="currentColor" opacity="0.08"/>
    <rect x="28" y="34" width="372" height="34" rx="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="44" y="56" font-size="12" font-weight="700" fill="currentColor">mrv_emissions &#183; canonical GeoParquet</text>
    <!-- column family bands -->
    <g>
      <!-- identity -->
      <rect x="28" y="74" width="372" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <text x="44" y="92" font-size="11" font-weight="700" fill="currentColor">Identity</text>
      <text x="44" y="108" font-size="9" fill="currentColor" opacity="0.72">record_id &#183; project_id</text>
      <!-- spatial (teal) -->
      <rect x="28" y="122" width="372" height="44" rx="6" fill="none" stroke="#0f6e63" stroke-width="1.7"/>
      <text x="44" y="140" font-size="11" font-weight="700" fill="#0f6e63">Spatial</text>
      <text x="44" y="156" font-size="9" fill="currentColor" opacity="0.72">geometry (WKB) &#183; crs_epsg &#183; area_ha</text>
      <!-- activity -->
      <rect x="28" y="170" width="372" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <text x="44" y="188" font-size="11" font-weight="700" fill="currentColor">Activity</text>
      <text x="44" y="204" font-size="9" fill="currentColor" opacity="0.72">period_start / period_end &#183; activity_value &#183; activity_unit</text>
      <!-- factor -->
      <rect x="28" y="218" width="372" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <text x="44" y="236" font-size="11" font-weight="700" fill="currentColor">Factor</text>
      <text x="44" y="252" font-size="9" fill="currentColor" opacity="0.72">factor_id &#183; factor_version &#183; emission_factor</text>
      <!-- result (amber) -->
      <rect x="28" y="266" width="372" height="40" rx="6" fill="#f3a712" opacity="0.1"/>
      <rect x="28" y="266" width="372" height="40" rx="6" fill="none" stroke="#f3a712" stroke-width="2.2"/>
      <text x="44" y="284" font-size="11" font-weight="700" fill="#f3a712">Result</text>
      <text x="44" y="299" font-size="9" fill="currentColor" opacity="0.78">co2e_tonnes</text>
      <!-- uncertainty (amber) -->
      <rect x="28" y="310" width="372" height="40" rx="6" fill="#f3a712" opacity="0.1"/>
      <rect x="28" y="310" width="372" height="40" rx="6" fill="none" stroke="#f3a712" stroke-width="2.2"/>
      <text x="44" y="328" font-size="11" font-weight="700" fill="#f3a712">Uncertainty</text>
      <text x="44" y="343" font-size="9" fill="currentColor" opacity="0.78">uncertainty_pct &#183; tier &#183; method_id</text>
      <!-- lineage (amber) -->
      <rect x="28" y="354" width="372" height="40" rx="6" fill="#f3a712" opacity="0.1"/>
      <rect x="28" y="354" width="372" height="40" rx="6" fill="none" stroke="#f3a712" stroke-width="2.2"/>
      <text x="44" y="372" font-size="11" font-weight="700" fill="#f3a712">Lineage</text>
      <text x="44" y="387" font-size="9" fill="currentColor" opacity="0.78">lineage_hash &#183; ingested_at</text>
    </g>
    <!-- partition arrow -->
    <line x1="400" y1="232" x2="556" y2="232" stroke="currentColor" stroke-width="1.6" marker-end="url(#mrv-arrow)"/>
    <text x="478" y="224" font-size="9.5" font-weight="600" text-anchor="middle" fill="currentColor">partitioned by</text>
    <!-- storage tree -->
    <g>
      <rect x="560" y="74" width="372" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <text x="576" y="95" font-size="10.5" fill="currentColor">country_iso=BR/</text>
      <rect x="592" y="118" width="340" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <text x="608" y="139" font-size="10.5" fill="currentColor">reporting_year=2025/</text>
      <rect x="624" y="162" width="308" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <text x="640" y="183" font-size="10.5" fill="currentColor">factor_version=v3.2/</text>
      <!-- part files (amber file-level metadata) -->
      <rect x="656" y="212" width="276" height="88" rx="6" fill="#f3a712" opacity="0.08"/>
      <rect x="656" y="212" width="276" height="88" rx="6" fill="none" stroke="#f3a712" stroke-width="2"/>
      <text x="672" y="234" font-size="10.5" font-weight="700" fill="#f3a712">part-000.zstd.parquet</text>
      <text x="672" y="252" font-size="9" fill="currentColor" opacity="0.78">file-level GeoParquet metadata</text>
      <text x="672" y="268" font-size="9" fill="currentColor" opacity="0.78">geo: version 1.1.0 &#183; primary_column</text>
      <text x="672" y="284" font-size="9" fill="currentColor" opacity="0.78">bbox &#183; crs (PROJJSON) &#183; encoding WKB</text>
      <line x1="700" y1="196" x2="700" y2="210" stroke="currentColor" stroke-width="1.4" marker-end="url(#mrv-arrow)"/>
    </g>
    <!-- footnote -->
    <text x="560" y="336" font-size="9" fill="currentColor" opacity="0.7">Hive-style keys are folder-encoded, never stored in the row group &#8212;</text>
    <text x="560" y="350" font-size="9" fill="currentColor" opacity="0.7">predicate pushdown prunes whole directories before any read.</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Canonical MRV Emissions GeoParquet Schema",
  "description": "The canonical column-oriented GeoParquet dataset for spatial MRV: one row per activity-data record with geometry, emission factor, computed CO2e, quantified uncertainty, and full lineage. Fields carry explicit Arrow dtypes, units, and nullability enforced by a pyarrow validation gate at every write.",
  "keywords": ["MRV", "GeoParquet", "carbon accounting", "emission factors", "data dictionary", "ISO 14064-3", "Verra", "CSRD ESRS E1", "data lineage"],
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "creator": { "@type": "Organization", "name": "spatialpipelineengineering.org" },
  "variableMeasured": [
    { "@type": "PropertyValue", "name": "record_id", "description": "Stable UUIDv7 primary key for the activity-data record", "unitText": "UUID" },
    { "@type": "PropertyValue", "name": "geometry", "description": "Reporting-unit polygon serialized as WKB per the GeoParquet spec", "unitText": "WKB" },
    { "@type": "PropertyValue", "name": "crs_epsg", "description": "EPSG code of the geometry's coordinate reference system", "unitText": "EPSG code" },
    { "@type": "PropertyValue", "name": "area_ha", "description": "Equal-area planimetric area of the reporting unit", "unitText": "hectare" },
    { "@type": "PropertyValue", "name": "activity_value", "description": "Measured activity-data quantity for the reporting period", "unitText": "activity_unit" },
    { "@type": "PropertyValue", "name": "emission_factor", "description": "Emission or removal factor applied to the activity value", "unitText": "tCO2e per activity_unit" },
    { "@type": "PropertyValue", "name": "co2e_tonnes", "description": "Computed carbon dioxide equivalent for the record", "unitText": "tCO2e" },
    { "@type": "PropertyValue", "name": "uncertainty_pct", "description": "Relative 95% confidence half-width on co2e_tonnes", "unitText": "percent" },
    { "@type": "PropertyValue", "name": "tier", "description": "IPCC methodological tier (1, 2 or 3) of the estimate", "unitText": "ordinal" },
    { "@type": "PropertyValue", "name": "lineage_hash", "description": "Content hash binding the record to its input artifacts and code version", "unitText": "hex digest" }
  ],
  "distribution": [
    {
      "@type": "DataDownload",
      "encodingFormat": "application/vnd.apache.parquet",
      "contentUrl": "https://spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/"
    }
  ]
}
</script>

## Why a Single Canonical Schema Exists

The alternative to a canonical schema is a proliferation of near-identical dialects, and every dialect is a place a verification stalls. Three failure patterns justify the discipline.

First, **unit ambiguity is silent and expensive.** A column named `emissions` with no declared unit is worthless to an auditor and dangerous to a downstream aggregation. Is it kilograms or tonnes? CO2 or CO2e? Per record or per hectare? When two feeds disagree by a factor of 1000 because one used kilograms, the error does not raise — it produces a plausible-looking total that fails reconciliation weeks later. The canonical schema fixes `co2e_tonnes` as metric tonnes of CO2 equivalent, full stop, and pairs `activity_value` with an explicit `activity_unit` string so the factor's denominator is never inferred.

Second, **nullability is a contract, not an accident.** If `lineage_hash` is nullable, a record can reach the registry with no traceable provenance, and no gate will have stopped it. Declaring `co2e_tonnes`, `crs_epsg`, and `lineage_hash` as non-nullable turns "we forgot to compute it" into a write-time failure rather than an audit-time finding. The dtype system does the enforcement the code review would otherwise have to.

Third, **schema drift breaks reproducibility.** Parquet stores its schema in the file footer, so a column that quietly changes from `int32` to `int64`, or a `factor_version` that migrates from string to dictionary encoding, produces files that a strict reader rejects and a lenient reader silently coerces. Both outcomes are unacceptable under ISO 14064-3, which requires that the same inputs regenerate the same outputs. Pinning the Arrow schema — dtypes, field order, and metadata — makes drift a caught exception.

## The Core Column Dictionary

The table below is the authoritative definition of the canonical `mrv_emissions` dataset. Every field lists its Arrow (`pyarrow`) type, physical unit, whether nulls are permitted, and its semantic contract. Column families follow the SVG grouping: identity, spatial, activity, factor, result, uncertainty, and lineage.


| Column | Arrow dtype | Unit | Nullable | Description |
|--------|-------------|------|----------|-------------|
| `record_id` | `string` | UUIDv7 | no | Stable primary key; time-ordered UUID for deterministic sort and idempotent upserts. |
| `project_id` | `string` | registry ID | no | Registry project identifier (e.g. Verra VCS project number) this record rolls up to. |
| `geometry` | `binary` | WKB | no | Reporting-unit polygon as Well-Known Binary, per the GeoParquet 1.1 geometry encoding. |
| `crs_epsg` | `int32` | EPSG code | no | EPSG code of `geometry`; the file-level GeoParquet metadata carries the full PROJJSON. |
| `area_ha` | `float64` | hectare | no | Planimetric area computed in an equal-area CRS so downstream density arithmetic is honest. |
| `period_start` | `timestamp[us, tz=UTC]` | UTC instant | no | Inclusive start of the monitoring period the activity data covers. |
| `period_end` | `timestamp[us, tz=UTC]` | UTC instant | no | Exclusive end of the monitoring period; must be strictly greater than `period_start`. |
| `activity_value` | `float64` | see `activity_unit` | no | Measured activity-data quantity (e.g. hectares deforested, tonnes fuel combusted). |
| `activity_unit` | `string` | UCUM token | no | Unit of `activity_value` as a UCUM token (`ha`, `t`, `MWh`); the factor's denominator. |
| `factor_id` | `string` | factor DB key | no | Foreign key into the versioned emission-factor database. |
| `factor_version` | `string` | semver | no | Semantic version of the factor set applied; also a partition key (see below). |
| `emission_factor` | `float64` | tCO2e / activity_unit | no | Emission or removal factor; sign convention is negative for removals. |
| `co2e_tonnes` | `float64` | tCO2e | no | Computed result: `activity_value * emission_factor`, in metric tonnes CO2 equivalent. |
| `uncertainty_pct` | `float64` | percent | yes | Relative 95% confidence half-width on `co2e_tonnes`; null only for Tier 1 defaults. |
| `tier` | `int8` | ordinal (1&#8211;3) | no | IPCC methodological tier governing the estimate's rigour. |
| `method_id` | `string` | methodology key | no | Methodology identifier (e.g. `VM0047`) that authorised the calculation. |
| `lineage_hash` | `string` | hex digest | no | SHA-256 over input artifact hashes plus code version; the provenance anchor. |
| `ingested_at` | `timestamp[us, tz=UTC]` | UTC instant | no | Write-time stamp for temporal audit and idempotent backfill reconciliation. |


Two conventions in this table are load-bearing. Timestamps are always microsecond-precision UTC-tagged — a naive local timestamp is a rejection, because reporting-period boundaries decide which credits fall in which vintage. And the `emission_factor` sign convention (negative for removals, positive for emissions) means `co2e_tonnes` can be summed directly across a project without branching on sequestration versus emission.

<svg viewBox="0 -4 900 228" role="img" aria-labelledby="col-t col-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="col-t">Which columns are added by which stage, and which may never be overwritten</title>
  <desc id="col-d">A record accumulating columns as it moves through four stages. Ingestion writes the activity identifier, value, unit, period, geometry, coordinate reference system, source identifier and source checksum. Harmonisation adds the analysis coordinate reference system and the area in hectares. Factor application adds the factor identifier, factor version and carbon dioxide equivalent tonnes. Aggregation adds the consolidation rule and reporting entity. A rule is marked across the whole record: a stage may add columns and may never modify a column an earlier stage wrote, because doing so destroys the ability to re-derive the later value from the earlier one.</desc>
  <defs>
    <marker id="col-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">A record only ever grows</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Each stage appends its columns. None may modify what an earlier stage wrote.</text>
    <rect x="12" y="52" width="212" height="122" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="52" width="212" height="122" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="28" y="74" fill="currentColor" font-size="10" font-weight="700">Ingestion writes</text>
    <text x="28" y="94" fill="currentColor" font-size="9" opacity="0.85">activity_id · activity_value</text>
    <text x="28" y="110" fill="currentColor" font-size="9" opacity="0.85">unit · period_start/end</text>
    <text x="28" y="126" fill="currentColor" font-size="9" opacity="0.85">geometry · crs</text>
    <text x="28" y="142" fill="currentColor" font-size="9" opacity="0.85">source_id · source_checksum</text>
    <text x="28" y="164" fill="currentColor" font-size="9" opacity="0.7">the only stage that faces raw data</text>
    <rect x="236" y="52" width="196" height="122" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="236" y="52" width="196" height="122" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="252" y="74" fill="currentColor" font-size="10" font-weight="700">Harmonisation adds</text>
    <text x="252" y="94" fill="currentColor" font-size="9" opacity="0.85">analysis_crs</text>
    <text x="252" y="110" fill="currentColor" font-size="9" opacity="0.85">area_ha</text>
    <text x="252" y="132" fill="currentColor" font-size="9" opacity="0.7">computed once, in the</text>
    <text x="252" y="148" fill="currentColor" font-size="9" opacity="0.7">equal-area projection</text>
    <rect x="444" y="52" width="196" height="122" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="444" y="52" width="196" height="122" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="460" y="74" fill="currentColor" font-size="10" font-weight="700">Factor application adds</text>
    <text x="460" y="94" fill="currentColor" font-size="9" opacity="0.85">factor_id</text>
    <text x="460" y="110" fill="currentColor" font-size="9" opacity="0.85">factor_version</text>
    <text x="460" y="126" fill="currentColor" font-size="9" opacity="0.85">co2e_tonnes</text>
    <text x="460" y="148" fill="currentColor" font-size="9" opacity="0.7">version pinned, never “latest”</text>
    <rect x="652" y="52" width="236" height="122" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="652" y="52" width="236" height="122" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="668" y="74" fill="currentColor" font-size="10" font-weight="700">Aggregation adds</text>
    <text x="668" y="94" fill="currentColor" font-size="9" opacity="0.85">consolidation_rule</text>
    <text x="668" y="110" fill="currentColor" font-size="9" opacity="0.85">reporting_entity</text>
    <text x="668" y="132" fill="currentColor" font-size="9" opacity="0.7">so one dataset serves every</text>
    <text x="668" y="148" fill="currentColor" font-size="9" opacity="0.7">entity with a claim on it</text>
    <text x="12" y="206" fill="#f3a712" font-size="9.5" font-weight="700">Overwriting an earlier column destroys the ability to re-derive the later value from it — which is the whole point of carrying both.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#col-arrow)">
    <line x1="224" y1="112" x2="234" y2="112"/><line x1="432" y1="112" x2="442" y2="112"/><line x1="640" y1="112" x2="650" y2="112"/>
  </g>
</svg>

## Partitioning, Metadata & Storage Conventions

Physical layout is part of the schema. The dataset is partitioned Hive-style on three keys chosen to match the dominant query patterns — a verifier pulls one project's one reporting year under one factor version — so predicate pushdown prunes whole directories before a single row group is read. File-level GeoParquet metadata travels in each file's footer so any Parquet reader can recover the geometry column and CRS without an external sidecar.


| Convention | Value | Rationale |
|-----------|-------|-----------|
| Partition key 1 | `country_iso` (ISO 3166-1 alpha-2) | Aligns with jurisdictional reporting boundaries and NDC accounting. |
| Partition key 2 | `reporting_year` (`int16`) | Vintage isolation; a re-issued year rewrites one partition, not the dataset. |
| Partition key 3 | `factor_version` (semver) | Lets a factor re-baseline land as a new partition, preserving the prior version. |
| Row-group size | 128 MB target | Balances predicate pushdown granularity against per-group metadata overhead. |
| Compression | Zstd level 9 | Best ratio for the mixed string/float columns; splittable for parallel readers. |
| Geometry encoding | WKB, GeoParquet 1.1 | File metadata `geo` key records `version`, `primary_column`, `bbox`, and PROJJSON CRS. |
| Statistics | min/max per row group | Enables bbox and `period_start` pushdown without opening full column chunks. |
| Column ordering | identity &#8594; spatial &#8594; activity &#8594; factor &#8594; result &#8594; uncertainty &#8594; lineage | Stable field order so schema-diffs are readable and dictionary IDs are reproducible. |


Partition keys are folder-encoded and must **not** be duplicated as row columns — storing `factor_version` twice invites the folder and the column to disagree after a careless rewrite. The reader reconstructs them from the path.

## The pyarrow Schema and Validation Gate

The schema below is the executable form of the dictionary. `validate()` is the gate every write passes through: it checks field presence, exact dtype, unit metadata, CRS, and the non-null contract, logs a structured event, and raises on any mismatch rather than coercing. Units and semantics ride in per-field Arrow metadata so they are serialized into the Parquet footer and recoverable by any consumer.

```python
from __future__ import annotations

import pyarrow as pa
import pyarrow.parquet as pq
import structlog

log = structlog.get_logger()

# Per-field metadata carries the unit contract into the Parquet footer.
def _f(name: str, dtype: pa.DataType, unit: str, nullable: bool) -> pa.Field:
    return pa.field(name, dtype, nullable=nullable, metadata={b"unit": unit.encode()})

CANONICAL_MRV_SCHEMA = pa.schema([
    # identity
    _f("record_id", pa.string(), "uuidv7", False),
    _f("project_id", pa.string(), "registry_id", False),
    # spatial
    _f("geometry", pa.binary(), "wkb", False),
    _f("crs_epsg", pa.int32(), "epsg", False),
    _f("area_ha", pa.float64(), "ha", False),
    # activity
    _f("period_start", pa.timestamp("us", tz="UTC"), "utc", False),
    _f("period_end", pa.timestamp("us", tz="UTC"), "utc", False),
    _f("activity_value", pa.float64(), "activity_unit", False),
    _f("activity_unit", pa.string(), "ucum", False),
    # factor
    _f("factor_id", pa.string(), "factor_key", False),
    _f("factor_version", pa.string(), "semver", False),
    _f("emission_factor", pa.float64(), "tco2e_per_activity_unit", False),
    # result
    _f("co2e_tonnes", pa.float64(), "tco2e", False),
    # uncertainty
    _f("uncertainty_pct", pa.float64(), "percent", True),
    _f("tier", pa.int8(), "ipcc_tier", False),
    _f("method_id", pa.string(), "methodology_key", False),
    # lineage
    _f("lineage_hash", pa.string(), "sha256_hex", False),
    _f("ingested_at", pa.timestamp("us", tz="UTC"), "utc", False),
])

VALID_CRS_EPSG = {4326, 6933}  # WGS84 for storage, EQ-Earth (6933) for area math


class SchemaViolation(ValueError):
    """Raised when a table breaches the canonical MRV contract."""


def validate(table: pa.Table, *, strict_crs: bool = True) -> pa.Table:
    """Enforce the canonical MRV schema; raise on any structural mismatch."""
    issues: list[str] = []

    # 1. Field presence, order, dtype and nullability must match exactly.
    got = {f.name: f for f in table.schema}
    for expected in CANONICAL_MRV_SCHEMA:
        actual = got.get(expected.name)
        if actual is None:
            issues.append(f"missing_column:{expected.name}")
            continue
        if actual.type != expected.type:
            issues.append(f"dtype:{expected.name}:{actual.type}!={expected.type}")
        if actual.nullable and not expected.nullable:
            issues.append(f"nullability:{expected.name}:declared_nullable")

    # 2. Non-nullable columns must contain no nulls in the data itself.
    for expected in CANONICAL_MRV_SCHEMA:
        if not expected.nullable and expected.name in table.column_names:
            if table.column(expected.name).null_count > 0:
                issues.append(f"null_values:{expected.name}")

    # 3. CRS gate: every geometry must carry a whitelisted EPSG code.
    if strict_crs and "crs_epsg" in table.column_names:
        codes = set(table.column("crs_epsg").drop_null().unique().to_pylist())
        if not codes <= VALID_CRS_EPSG:
            issues.append(f"crs:{codes - VALID_CRS_EPSG}_not_in_{VALID_CRS_EPSG}")

    # 4. Unit contract: co2e_tonnes must be tagged tCO2e, never coerced.
    ef = table.schema.field("co2e_tonnes") if "co2e_tonnes" in table.column_names else None
    if ef is not None and (ef.metadata or {}).get(b"unit") != b"tco2e":
        issues.append("unit:co2e_tonnes_not_tagged_tco2e")

    if issues:
        log.error("mrv.schema.rejected", rows=table.num_rows, issues=issues)
        raise SchemaViolation("; ".join(issues))

    log.info("mrv.schema.validated", rows=table.num_rows,
             columns=table.num_columns, crs=sorted(codes) if strict_crs else None)
    return table.cast(CANONICAL_MRV_SCHEMA)


# GeoParquet file-level metadata written into the footer on export.
GEO_METADATA = {
    b"geo": (
        b'{"version":"1.1.0","primary_column":"geometry",'
        b'"columns":{"geometry":{"encoding":"WKB",'
        b'"geometry_types":["Polygon","MultiPolygon"],'
        b'"crs":"EPSG:4326","bbox":[-73.99,-33.75,-34.79,5.27]}}}'
    )
}


def write_partition(table: pa.Table, root: str) -> None:
    """Validate, then write a Zstd GeoParquet dataset partitioned Hive-style."""
    table = validate(table)
    table = table.replace_schema_metadata({**(table.schema.metadata or {}), **GEO_METADATA})
    pq.write_to_dataset(
        table, root_path=root,
        partition_cols=["country_iso", "reporting_year", "factor_version"],
        compression="zstd", compression_level=9,
        row_group_size=1_000_000,
    )
    log.info("mrv.partition.written", root=root, rows=table.num_rows)
```

The `cast` at the end of `validate()` is deliberate: once the structural checks pass, casting to the canonical schema pins dtypes and field order so no downstream writer can reintroduce drift. Note that `country_iso` and `reporting_year` are supplied as partition columns to `write_to_dataset` and encoded into the path — they are not part of the row-level schema above, which keeps the folder and the footer from ever disagreeing.

## Mapping Columns to Compliance Evidence

Each column family answers a specific evidentiary need. Verifiers under ISO 14064-3 do not read prose; they trace a reported figure back to the record that produced it, and the canonical schema is designed so that trace is a single query. The mapping below is what makes the dataset a submission artifact.


| Columns | Standard & requirement | Evidence provided |
|---------|------------------------|-------------------|
| `activity_value`, `activity_unit`, `period_start/end` | ISO 14064-3 &#167; verification of activity data | Quantified, unit-explicit, time-bounded activity record the auditor recomputes against. |
| `factor_id`, `factor_version`, `method_id` | Verra VM0047 / VM-series methodology conformance | Proof the applied factor and method are the registry-approved versioned artifacts. |
| `co2e_tonnes`, `tier` | ISO 14064-3 conservativeness & reproducibility | Deterministic result plus the IPCC tier declaring methodological rigour. |
| `uncertainty_pct` | Verra uncertainty deduction; CSRD ESRS E1 estimation transparency | Per-record confidence half-width feeding conservative deduction rules. |
| `lineage_hash`, `ingested_at` | ISO 14064-3 audit trail; CSRD ESRS E1 traceability | Content-addressable link from figure to inputs and code, with a write timestamp. |
| `geometry`, `crs_epsg`, `area_ha` | Verra VM0047 spatial integrity & no double-counting | Non-overlapping, area-honest reporting units in a declared CRS. |


The `uncertainty_pct` column deserves emphasis. CSRD ESRS E1 expects disclosures to state estimation uncertainty rather than a single unqualified number, and the Verra VM-series ties a quantified deduction to that same value — the confidence envelopes produced by [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) land in this column and flow straight into the deduction rule with no manual re-keying.

## Production Integration

The schema sits at the join between transformation and submission, enforced on write. In an orchestrated pipeline the canonical table is produced and validated in a fixed ingest &#8594; diagnose &#8594; transform &#8594; validate &#8594; export &#8594; submit sequence:

1. **Ingest.** Read upstream activity-data feeds and the resolved factor set, pinning the exact `factor_version` so the run is reproducible.
2. **Diagnose.** Confirm every input geometry carries a machine-readable CRS and that monitoring-period boundaries are UTC-tagged and non-overlapping before any arithmetic.
3. **Transform.** Compute `co2e_tonnes` and attach `uncertainty_pct`, `tier`, and `method_id`, then derive `lineage_hash` over the input artifact hashes and code version.
4. **Validate.** Call `validate()` — a `SchemaViolation` fails the task loudly rather than shipping a coerced table; the structured log event is the first artifact an auditor sees.
5. **Export.** Write with `write_partition()` so the Zstd GeoParquet lands under `country_iso/reporting_year/factor_version` with GeoParquet metadata in every footer.
6. **Submit.** Hand the partitioned dataset to registry integration, where `record_id` and `lineage_hash` become the queryable spine of the audit trail.

Enforced this way, the canonical schema stops being a document that drifts from reality and becomes the contract the pipeline cannot violate silently. Every figure that reaches a registry ships with its geometry, its factor version, its uncertainty, and a hash that reconstructs how it was produced — which is precisely what turns a Parquet file into admissible carbon accounting evidence.

<svg viewBox="0 -4 880 226" role="img" aria-labelledby="part-t part-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="part-t">Partition granularity against file count and query cost</title>
  <desc id="part-d">Three partition layouts for the same dataset of 40 million rows. Partitioning by period alone yields 24 files averaging 1.6 gigabytes, which is efficient to scan whole and expensive for a single-tile query. Partitioning by period and tile yields 28 800 files averaging 1.4 megabytes, which is efficient for tile queries and slow to list. Partitioning by period and region, with tile as a sort key inside each file, yields 480 files averaging 83 megabytes, which reads a single tile efficiently through row-group statistics while keeping listing cheap. The third is marked as the usual answer.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Sort inside the file instead of partitioning deeper</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Same 40 M rows, three layouts.</text>
    <rect x="12" y="52" width="280" height="150" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="52" width="280" height="150" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">period</text>
    <text x="28" y="102" fill="currentColor" font-size="13" font-weight="700">24 files · 1.6 GB each</text>
    <text x="28" y="128" fill="currentColor" font-size="9.5" opacity="0.85">full scan: fast</text>
    <text x="28" y="146" fill="#f3a712" font-size="9.5" font-weight="700">single tile: reads everything</text>
    <text x="28" y="176" fill="currentColor" font-size="9" opacity="0.72">good for annual roll-ups only</text>
    <rect x="300" y="52" width="280" height="150" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="300" y="52" width="280" height="150" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="316" y="76" fill="currentColor" font-size="10.5" font-weight="700">period / tile</text>
    <text x="316" y="102" fill="currentColor" font-size="13" font-weight="700">28 800 files · 1.4 MB each</text>
    <text x="316" y="128" fill="currentColor" font-size="9.5" opacity="0.85">single tile: fast</text>
    <text x="316" y="146" fill="#f3a712" font-size="9.5" font-weight="700">listing dominates every query</text>
    <text x="316" y="176" fill="currentColor" font-size="9" opacity="0.72">the classic small-file trap</text>
    <rect x="588" y="52" width="280" height="150" rx="9" fill="currentColor" opacity="0.13"/>
    <rect x="588" y="52" width="280" height="150" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="604" y="76" fill="currentColor" font-size="10.5" font-weight="700">period / region, tile sorted</text>
    <text x="604" y="102" fill="currentColor" font-size="13" font-weight="700">480 files · 83 MB each</text>
    <text x="604" y="128" fill="currentColor" font-size="9.5" opacity="0.85">single tile: row-group skipping</text>
    <text x="604" y="146" fill="currentColor" font-size="9.5" font-weight="700">listing stays cheap</text>
    <text x="604" y="176" fill="currentColor" font-size="9" opacity="0.78">the usual answer</text>
  </g>
</svg>

## Frequently Asked Questions

### Why must the derived tonnage and the raw activity value both be retained?

Because the second is the observation and the first is a derivation from it. Keeping both, together with `factor_id` and `factor_version`, lets a verifier re-derive the tonnage independently and lets you recompute the whole history when a factor set is revised. Storing only the derived tonnage means a factor revision requires re-running the entire upstream pipeline, and it removes the auditor's ability to check the multiplication at all.

### What goes in the Parquet footer versus a column?

Anything that is constant for the file goes in the footer — the schema version, the analysis CRS, the factor-set version, the code and container versions, the producing run identifier. Anything that varies per row goes in a column. The footer is where the file becomes self-describing, which is what makes it survive being copied out of your infrastructure into a partner's, and it is the natural home for the provenance subset of the observability signals.

### How large should a Parquet file be?

Large enough that listing and open costs are amortised, small enough that a partition can be rewritten cheaply — in practice tens to low hundreds of megabytes. Reaching that with a tile-partitioned carbon dataset usually means partitioning by period and region while sorting by tile within each file, so row-group statistics let a reader skip to the tile without a directory listing per tile.

### Should nulls be allowed in the canonical schema?

Sparingly and deliberately. A nullable column is a claim that absence is meaningful and distinct from zero, which is true for a measurement that was not taken and false for a quantity that was measured as zero. Every nullable column should have a documented meaning for its null, and columns where absence is not meaningful should be non-nullable so a missing value fails at write rather than propagating as a silent zero downstream.

### How does this schema relate to GeoParquet?

It is a GeoParquet dataset with additional required columns and footer metadata. Conforming to GeoParquet means standard tools can read the geometry and its CRS without bespoke handling, which matters when a partner or verifier opens the file. The MRV-specific additions — factor versioning, consolidation rule, source checksum, provenance footer — sit alongside the GeoParquet metadata rather than replacing it.

## Related guides

- [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) — the parent discipline defining the canonical data contracts this dictionary specifies.
- [Versioning Emission Factor Databases for Reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) — how the `factor_id` / `factor_version` fields stay reproducible across re-baselines.
- [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) — the wider stack that produces and submits this dataset.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — the provenance layer the `lineage_hash` column anchors.
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — the source of the `uncertainty_pct` envelopes this schema carries.
