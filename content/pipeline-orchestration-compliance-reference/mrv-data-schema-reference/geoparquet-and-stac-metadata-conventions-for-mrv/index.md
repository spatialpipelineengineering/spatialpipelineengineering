---
shortTitle: "GeoParquet and STAC Metadata Conventions for MRV"
title: "GeoParquet and STAC Metadata Conventions for MRV"
description: "A concrete metadata convention for carbon MRV datasets: required GeoParquet column and file metadata, STAC item and collection fields, the extensions worth adopting, and the fields a verifier will look for."
slug: geoparquet-and-stac-metadata-conventions-for-mrv
type: guide
breadcrumb: "GeoParquet and STAC Conventions"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# GeoParquet and STAC Metadata Conventions for MRV

A carbon MRV dataset that outlives its authors is a metadata problem before it is a storage problem. The pixels and the rows are easy to keep; what disappears is the knowledge of which projection they are in, what version of which emission factor table produced them, whether a null means unobserved or zero, and which of three similarly named files was the one that fed the submitted report. This guide sets out a working convention for recording that, within the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) in the [pipeline orchestration and compliance reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack.

The division of labour between the two formats is the thing to get right first. GeoParquet metadata travels inside the file and answers questions about the data itself — geometry column, CRS, units, null semantics. STAC metadata lives outside the file and answers questions about the file's place in the world — what period it covers, what produced it, what it supersedes, where its siblings are. Trying to make either do the other's job produces either files nobody can search or catalogues that go stale the moment a file is copied.

<svg viewBox="0 -4 940 262" role="img" aria-labelledby="div-t div-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="div-t">Which questions each metadata layer answers</title>
  <desc id="div-d">Two columns dividing metadata responsibilities. The GeoParquet column, travelling inside the file, answers what the geometry column is called and how it is encoded, which coordinate reference system the coordinates are in, what unit each measure column carries, what a null means in each column, and what the valid range is. The STAC column, living outside the file in a catalogue, answers what temporal interval the file covers, what spatial extent it covers, which processing run produced it, which earlier file it supersedes, what its licence and provider are, and where related assets live. A shaded band between them lists three fields that must appear in both and agree — the coordinate reference system, the temporal extent, and the content checksum — with a note that a disagreement between the two copies is the single most common metadata defect and the easiest to detect automatically.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Inside the file, outside the file, and the three fields that must appear in both</text>
    <rect x="12" y="38" width="420" height="150" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="38" width="420" height="150" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="28" y="62" fill="currentColor" font-size="10.5" font-weight="700">GeoParquet — inside the file</text>
    <text x="28" y="86" fill="currentColor" font-size="9.5" opacity="0.85">which column is the geometry, how encoded</text>
    <text x="28" y="106" fill="currentColor" font-size="9.5" opacity="0.85">the CRS the coordinates are actually in</text>
    <text x="28" y="126" fill="currentColor" font-size="9.5" opacity="0.85">the unit carried by each measure column</text>
    <text x="28" y="146" fill="currentColor" font-size="9.5" opacity="0.85">what a null means, column by column</text>
    <text x="28" y="166" fill="currentColor" font-size="9.5" opacity="0.85">the valid range, so a bad value is detectable</text>
    <rect x="508" y="38" width="420" height="150" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="508" y="38" width="420" height="150" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="524" y="62" fill="currentColor" font-size="10.5" font-weight="700">STAC — outside the file</text>
    <text x="524" y="86" fill="currentColor" font-size="9.5" opacity="0.85">what temporal interval it covers</text>
    <text x="524" y="106" fill="currentColor" font-size="9.5" opacity="0.85">what spatial extent it covers</text>
    <text x="524" y="126" fill="currentColor" font-size="9.5" opacity="0.85">which processing run produced it</text>
    <text x="524" y="146" fill="currentColor" font-size="9.5" opacity="0.85">which earlier file it supersedes</text>
    <text x="524" y="166" fill="currentColor" font-size="9.5" opacity="0.85">licence, provider, and sibling assets</text>
    <rect x="12" y="204" width="916" height="52" rx="9" fill="#f3a712" opacity="0.14"/>
    <rect x="12" y="204" width="916" height="52" rx="9" fill="none" stroke="#f3a712" stroke-width="1.8"/>
    <text x="470" y="226" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">In both, and they must agree: CRS · temporal extent · content checksum</text>
    <text x="470" y="246" text-anchor="middle" fill="currentColor" font-size="9.5" opacity="0.85">A disagreement between the two copies is the most common metadata defect and the easiest to detect automatically.</text>
  </g>
  <g stroke="#f3a712" stroke-width="1.6" fill="none" stroke-dasharray="5,3">
    <path d="M222 188 L222 202"/><path d="M718 188 L718 202"/>
  </g>
</svg>

## Root Cause Analysis

Three recurring defects account for most of the metadata problems in carbon datasets, and each has a specific structural cause.

**Units live in column names or nowhere.** A column called `emissions` in a table produced by three different teams has been kilograms, tonnes, and tonnes of CO₂ equivalent in the same organisation. Encoding the unit in the name — `emissions_tco2e` — is a substantial improvement and still fails when a unit changes and the name does not, or when a consumer parses the name for something else. Recording the unit as structured column metadata makes it machine-checkable, which is what allows a validation gate to reject a mismatch rather than a human to notice one.

**Null carries three different meanings in one column.** Not measured, measured as zero, and not applicable are semantically distinct and are all stored as null by default. In carbon accounting the distinction is material: a parcel with null emissions because it was not surveyed is not a parcel with zero emissions, and summing a column that conflates them understates the total by exactly the unsurveyed portion. The convention that fixes this is to record the null semantics per column and, where more than one meaning is genuinely needed, to add an explicit status column rather than overloading null.

**Catalogue and file drift apart.** A STAC item is a copy of facts about a file, and copies go stale. A file reprojected, a column added, a period corrected — each changes the file without changing the catalogue, and the catalogue then describes something that no longer exists. This is why the small overlap set matters: CRS, temporal extent, and checksum are cheap to verify programmatically, and a periodic reconciliation over those three catches nearly every drift.

The pattern behind all three is that metadata which is not mechanically checked is metadata that is eventually wrong. The convention below is designed around what a validator can assert, not around what is nice to document.

## Diagnostic Pipeline / Pre-Flight Validation

Validate metadata at write time rather than at read time. A file written without its required metadata is cheap to fix in the minute after it was produced and expensive to fix once it has been copied into three downstream systems.

```python
import json
from dataclasses import dataclass, field

import pyarrow.parquet as pq
import structlog

log = structlog.get_logger()

REQUIRED_FILE_KEYS = frozenset({
    "mrv:schema_version",
    "mrv:producer_run_id",
    "mrv:emission_factor_version",
    "mrv:methodology",
    "mrv:period_start",
    "mrv:period_end",
})

NULL_SEMANTICS = frozenset({"not_measured", "not_applicable", "no_nulls"})


@dataclass(frozen=True)
class ColumnConvention:
    """The metadata every measure column must carry.

    `null_means` is mandatory and has no default. Requiring the author to
    state it is the whole point — a default of 'not_measured' would be
    guessed correctly most of the time and wrongly exactly where it matters.
    """
    name: str
    unit: str
    null_means: str
    valid_min: float | None = None
    valid_max: float | None = None
    definition: str = ""

    def to_metadata(self) -> dict[bytes, bytes]:
        payload = {
            "unit": self.unit,
            "null_means": self.null_means,
            "valid_min": self.valid_min,
            "valid_max": self.valid_max,
            "definition": self.definition,
        }
        return {b"mrv:column": json.dumps(payload, sort_keys=True).encode()}


class MetadataError(ValueError):
    """Raised when a file cannot be published as it stands."""


def validate_geoparquet(path: str, conventions: dict[str, ColumnConvention]) -> None:
    """Assert file- and column-level metadata before publication."""
    meta = pq.read_metadata(path)
    kv = {k.decode(): v.decode() for k, v in (meta.metadata or {}).items()}

    missing = REQUIRED_FILE_KEYS - kv.keys()
    if missing:
        raise MetadataError(
            f"{path}: missing required file metadata {sorted(missing)}"
        )

    if "geo" not in kv:
        raise MetadataError(
            f"{path}: no 'geo' key — this is not a valid GeoParquet file, "
            "whatever its extension says"
        )

    geo = json.loads(kv["geo"])
    primary = geo.get("primary_column")
    col_meta = geo.get("columns", {}).get(primary, {})

    if not col_meta.get("crs"):
        raise MetadataError(
            f"{path}: geometry column '{primary}' has no CRS. A missing CRS "
            "is not an assertion of WGS 84 — it is an assertion of nothing, "
            "and every consumer will guess differently"
        )

    schema = pq.read_schema(path)
    for name, conv in conventions.items():
        if name not in schema.names:
            raise MetadataError(f"{path}: expected column '{name}' is absent")

        field_meta = schema.field(name).metadata or {}
        raw = field_meta.get(b"mrv:column")
        if raw is None:
            raise MetadataError(
                f"{path}: column '{name}' carries no mrv:column metadata; "
                f"a bare column is a column whose unit is folklore"
            )

        declared = json.loads(raw.decode())
        if declared["unit"] != conv.unit:
            raise MetadataError(
                f"{path}: column '{name}' declares unit '{declared['unit']}' "
                f"but the convention requires '{conv.unit}'"
            )
        if declared["null_means"] not in NULL_SEMANTICS:
            raise MetadataError(
                f"{path}: column '{name}' declares null_means "
                f"'{declared['null_means']}', not one of {sorted(NULL_SEMANTICS)}"
            )

    log.info(
        "geoparquet.validated", path=path,
        columns=len(conventions), crs=col_meta["crs"].get("id", {}),
        schema_version=kv["mrv:schema_version"],
    )
```

The refusal to treat a missing CRS as WGS 84 is the assertion that saves the most trouble. Defaulting is convenient exactly once and then produces a dataset whose coordinates are silently in a local grid, which the consuming pipeline dutifully plots in the Gulf of Guinea.

<svg viewBox="0 -4 900 260" role="img" aria-labelledby="null-t null-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="null-t">Three meanings of null in one column, and what each does to a total</title>
  <desc id="null-d">A small table of five parcels with an emissions column. Two rows carry values. One row is null because the parcel was never surveyed. One row is null because the parcel genuinely emitted nothing. One row is null because the category does not apply to that land use. Below, three totals are computed. Treating all nulls as zero gives a total that understates by the unsurveyed parcel's true emissions. Dropping all nulls gives the same numeric total but a different denominator, so any per-hectare intensity is overstated. Recording the semantics per row lets the correct total be computed and the unsurveyed area to be reported as a completeness gap. A panel notes that all three totals look equally plausible and only one is defensible.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">One null column, three meanings, three different totals</text>
    <rect x="12" y="34" width="420" height="24" fill="currentColor" opacity="0.14"/>
    <text x="24" y="51" fill="currentColor" font-size="9.5" font-weight="700">parcel</text>
    <text x="150" y="51" fill="currentColor" font-size="9.5" font-weight="700">tCO₂e</text>
    <text x="250" y="51" fill="currentColor" font-size="9.5" font-weight="700">why null</text>
    <text x="24" y="76" fill="currentColor" font-size="9.5">A-101</text>
    <text x="150" y="76" fill="currentColor" font-size="9.5">1,240</text>
    <text x="250" y="76" fill="currentColor" font-size="9.5" opacity="0.6">—</text>
    <text x="24" y="98" fill="currentColor" font-size="9.5">A-102</text>
    <text x="150" y="98" fill="currentColor" font-size="9.5">880</text>
    <text x="250" y="98" fill="currentColor" font-size="9.5" opacity="0.6">—</text>
    <text x="24" y="120" fill="currentColor" font-size="9.5">A-103</text>
    <text x="150" y="120" fill="#f3a712" font-size="9.5" font-weight="700">null</text>
    <text x="250" y="120" fill="#f3a712" font-size="9.5" font-weight="700">never surveyed</text>
    <text x="24" y="142" fill="currentColor" font-size="9.5">A-104</text>
    <text x="150" y="142" fill="currentColor" font-size="9.5" font-weight="700">null</text>
    <text x="250" y="142" fill="currentColor" font-size="9.5" opacity="0.85">genuinely zero</text>
    <text x="24" y="164" fill="currentColor" font-size="9.5">A-105</text>
    <text x="150" y="164" fill="currentColor" font-size="9.5" font-weight="700">null</text>
    <text x="250" y="164" fill="currentColor" font-size="9.5" opacity="0.85">not applicable</text>
    <rect x="468" y="34" width="420" height="24" fill="currentColor" opacity="0.14"/>
    <text x="480" y="51" fill="currentColor" font-size="9.5" font-weight="700">treatment</text>
    <text x="700" y="51" fill="currentColor" font-size="9.5" font-weight="700">total</text>
    <text x="762" y="51" fill="currentColor" font-size="9.5" font-weight="700">defensible?</text>
    <text x="480" y="80" fill="currentColor" font-size="9.5">null → 0 everywhere</text>
    <text x="700" y="80" fill="currentColor" font-size="9.5">2,120</text>
    <text x="762" y="80" fill="#f3a712" font-size="9.5" font-weight="700">no — hides a gap</text>
    <text x="480" y="112" fill="currentColor" font-size="9.5">drop all nulls</text>
    <text x="700" y="112" fill="currentColor" font-size="9.5">2,120</text>
    <text x="762" y="112" fill="#f3a712" font-size="9.5" font-weight="700">no — wrong denominator</text>
    <text x="480" y="144" fill="currentColor" font-size="9.5">honour the semantics</text>
    <text x="700" y="144" fill="currentColor" font-size="9.5">2,120</text>
    <text x="762" y="144" fill="currentColor" font-size="9.5" font-weight="700">yes — plus a gap note</text>
    <text x="480" y="172" fill="currentColor" font-size="9" opacity="0.75">…and A-103 reported as unsurveyed area</text>
  </g>
  <rect x="12" y="192" width="876" height="60" rx="9" fill="currentColor" opacity="0.06"/>
  <rect x="12" y="192" width="876" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <text x="450" y="216" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="currentColor" font-weight="700">All three totals are the same number. Only one of them comes with a statement of what was not measured.</text>
  <text x="450" y="238" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.85">The number is not the deliverable — the number plus its completeness is.</text>
</svg>

## Deterministic Transformation Logic

The STAC side of the convention is a small set of required fields plus two extensions worth adopting wholesale. Building the item from the file rather than alongside it is what keeps the two consistent.

```python
import hashlib
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path


@dataclass(frozen=True)
class MrvStacItem:
    """A STAC item for one MRV output, with the fields a verifier looks for.

    The mrv: namespace fields are the project-specific additions. Everything
    else is standard STAC plus the processing and version extensions, which
    already model exactly what an audit needs — who produced it, with what
    software, and what it replaces.
    """
    item_id: str
    collection: str
    geometry: dict
    bbox: tuple[float, float, float, float]
    datetime_utc: datetime | None
    start_datetime: datetime
    end_datetime: datetime
    asset_href: str
    asset_checksum: str
    asset_bytes: int
    crs_code: str
    processing_run_id: str
    processing_software: dict[str, str]
    methodology: str
    emission_factor_version: str
    schema_version: str
    superseded_item: str | None
    deprecated: bool = False

    def to_dict(self) -> dict:
        return {
            "type": "Feature",
            "stac_version": "1.0.0",
            "stac_extensions": [
                "https://stac-extensions.github.io/processing/v1.1.0/schema.json",
                "https://stac-extensions.github.io/version/v1.2.0/schema.json",
                "https://stac-extensions.github.io/file/v2.1.0/schema.json",
                "https://stac-extensions.github.io/projection/v1.1.0/schema.json",
            ],
            "id": self.item_id,
            "collection": self.collection,
            "geometry": self.geometry,
            "bbox": list(self.bbox),
            "properties": {
                # A period product has no single instant. Null datetime with
                # a start/end pair is the correct STAC encoding, and picking
                # an arbitrary midpoint — the common shortcut — makes every
                # temporal search subtly wrong.
                "datetime": None,
                "start_datetime": self.start_datetime.isoformat(),
                "end_datetime": self.end_datetime.isoformat(),
                "proj:code": self.crs_code,
                "processing:lineage": (
                    f"run {self.processing_run_id} under {self.methodology}"
                ),
                "processing:software": self.processing_software,
                "version": self.schema_version,
                "deprecated": self.deprecated,
                "mrv:methodology": self.methodology,
                "mrv:emission_factor_version": self.emission_factor_version,
                "mrv:schema_version": self.schema_version,
                "mrv:run_id": self.processing_run_id,
            },
            "assets": {
                "data": {
                    "href": self.asset_href,
                    "type": "application/vnd.apache.parquet",
                    "roles": ["data"],
                    "file:checksum": self.asset_checksum,
                    "file:size": self.asset_bytes,
                }
            },
            "links": (
                [{"rel": "predecessor-version", "href": self.superseded_item}]
                if self.superseded_item else []
            ),
        }


def reconcile(item: MrvStacItem, parquet_path: Path) -> list[str]:
    """Check the catalogue against the file it describes.

    Runs periodically over the whole catalogue. Three comparisons catch
    almost every drift, and all three are cheap: checksum, CRS, and period.
    """
    problems: list[str] = []

    digest = hashlib.sha256()
    with parquet_path.open("rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            digest.update(block)
    actual = f"sha256:{digest.hexdigest()}"

    if actual != item.asset_checksum:
        problems.append(
            f"checksum drift: catalogue {item.asset_checksum[:20]}… "
            f"vs file {actual[:20]}…"
        )

    kv = {k.decode(): v.decode()
          for k, v in (pq.read_metadata(parquet_path).metadata or {}).items()}

    if kv.get("mrv:period_start") != item.start_datetime.date().isoformat():
        problems.append(
            f"period drift: catalogue {item.start_datetime.date()} "
            f"vs file {kv.get('mrv:period_start')}"
        )

    if kv.get("mrv:schema_version") != item.schema_version:
        problems.append(
            f"schema version drift: catalogue {item.schema_version} "
            f"vs file {kv.get('mrv:schema_version')}"
        )

    return problems
```

The `datetime: None` with a start and end pair is a small point that matters disproportionately. Almost every MRV output covers an interval rather than an instant, and setting `datetime` to the interval's midpoint — which many tools do by default — makes a search for items covering a given day return the wrong set, in a way that is very hard to notice.

## Compliance Gating & Audit Trail Generation

The gate is straightforward: no file publishes without passing metadata validation, and no catalogue entry publishes without reconciling against its file. Beyond that, three things belong in the record.

The schema version alongside every output, in both layers. A dataset spanning a schema change is normal; one where the version is inferable only from the column list is not, and inference goes wrong at exactly the transition.

The supersession link rather than an overwrite. STAC's version extension already models this — `deprecated` on the old item and a `predecessor-version` link on the new one — and using it means a verifier who has a reference to an older item finds it, marked, rather than finding nothing.

Reconciliation results with their date. A catalogue that has been reconciled monthly and has a clean record is materially more credible than one asserted to be consistent, and the record costs a log line.

## Production Integration

Write the metadata in the same function that writes the file, and build the STAC item from the file's own metadata rather than from the variables that produced both. This sounds like a small distinction and it is the one that keeps the two layers in agreement: deriving the item from the file means an error in the file surfaces as an obviously wrong item, whereas deriving both from the same in-memory variables means an error appears consistently in both and looks correct.

The column conventions themselves should live in one place shared by every producer, not repeated per pipeline. That shared definition is the natural companion to the [canonical Parquet schema data dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/), and the emission factor version referenced in the file metadata should be a key into the versioned table described in [versioning emission factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) rather than a free-text string.

<svg viewBox="0 -4 900 246" role="img" aria-labelledby="wf-t wf-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="wf-t">Write, validate, derive, reconcile — the order that keeps the layers agreeing</title>
  <desc id="wf-d">A four-step flow. The producing job writes the GeoParquet file with its file-level and column-level metadata in a single function, so a file can never exist without them. A validation step reads the written file back and asserts the required keys, the CRS presence, and the unit and null semantics of every measure column, blocking publication on any failure. A derivation step builds the STAC item by reading the file rather than the in-memory variables, so an error in the file produces a visibly wrong item instead of a consistently wrong pair. A reconciliation step runs periodically over the whole catalogue comparing checksum, period, and schema version. A note reads that deriving the item from the same variables that wrote the file is the shortcut that makes both layers wrong in agreement.</desc>
  <defs>
    <marker id="wf-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Derive the catalogue from the file, never from the variables that wrote it</text>
    <rect x="12" y="40" width="200" height="82" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="40" width="200" height="82" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="112" y="66" fill="currentColor" font-size="10" font-weight="700">1 · Write with metadata</text>
    <text x="112" y="88" fill="currentColor" font-size="8.5" opacity="0.8">one function writes data</text>
    <text x="112" y="104" fill="currentColor" font-size="8.5" opacity="0.8">and metadata together</text>
    <rect x="232" y="40" width="200" height="82" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="232" y="40" width="200" height="82" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="332" y="66" fill="currentColor" font-size="10" font-weight="700">2 · Validate on read-back</text>
    <text x="332" y="88" fill="currentColor" font-size="8.5" opacity="0.8">required keys, CRS, units,</text>
    <text x="332" y="104" fill="currentColor" font-size="8.5" opacity="0.8">null semantics — blocks</text>
    <rect x="452" y="40" width="200" height="82" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="452" y="40" width="200" height="82" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="552" y="66" fill="currentColor" font-size="10" font-weight="700">3 · Derive the STAC item</text>
    <text x="552" y="88" fill="#f3a712" font-size="8.5" font-weight="700">by reading the file,</text>
    <text x="552" y="104" fill="#f3a712" font-size="8.5" font-weight="700">not the variables</text>
    <rect x="672" y="40" width="216" height="82" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="672" y="40" width="216" height="82" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="780" y="66" fill="currentColor" font-size="10" font-weight="700">4 · Reconcile periodically</text>
    <text x="780" y="88" fill="currentColor" font-size="8.5" opacity="0.8">checksum · period ·</text>
    <text x="780" y="104" fill="currentColor" font-size="8.5" opacity="0.8">schema version</text>
    <rect x="12" y="176" width="876" height="64" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="176" width="876" height="64" rx="9" fill="none" stroke="#f3a712" stroke-width="1.4" stroke-dasharray="6,3"/>
    <text x="450" y="200" fill="#f3a712" font-size="10" font-weight="700">The shortcut to avoid: building both layers from the same in-memory variables.</text>
    <text x="450" y="222" fill="currentColor" font-size="9.5" opacity="0.85">An error then appears identically in both, agrees with itself perfectly, and passes every consistency check you have.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#wf-arrow)">
    <line x1="212" y1="81" x2="230" y2="81"/><line x1="432" y1="81" x2="450" y2="81"/>
    <line x1="652" y1="81" x2="670" y2="81"/>
  </g>
  <text x="450" y="152" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">each step reads what the previous one actually produced</text>
</svg>

## Frequently Asked Questions

### Which STAC extensions are worth adopting for MRV?

Four carry their weight. Projection supplies the CRS and transform fields, which every raster consumer needs. Processing records lineage and software versions, which is what an audit asks for first. Version models supersession, which is unavoidable once figures get restated. File carries checksums and sizes, which makes integrity checkable. Beyond those, extensions tend to describe sensor characteristics that matter for imagery and not for derived carbon products, so adopting them adds surface without adding answers.

### Should the geometry be stored as WKB or as GeoArrow encoding?

GeoArrow encoding is preferable where the toolchain supports it, because it avoids a serialisation round trip on read and enables columnar operations on coordinates directly. WKB remains the safer default for datasets that will be read by unknown tools, since support for it is universal. The important thing is that whichever is used is declared in the `geo` metadata — a file whose encoding must be inferred from the bytes is a file that will eventually be inferred wrongly.

### How should partitioning interact with the metadata?

Partition columns should be excluded from the file's own data but declared in the collection-level STAC metadata, so a consumer knows a partition key exists without reading a file to find out. A common and painful mistake is partitioning by a column that is then dropped from the files, which makes each individual file ambiguous about which partition it belongs to once it is moved. Keep the partition value in the file metadata even when the column itself is elided.

### Does a small project need a STAC catalogue at all?

The catalogue's value scales with the number of files and the number of years, and both grow faster than expected. A project with a dozen outputs can manage with directory conventions and a README, and the same project five years later has several hundred outputs across three schema versions and no way to find which one fed the 2027 submission. Adopting STAC early is cheap; retrofitting it across an archive whose provenance was never recorded is mostly archaeology.

### What belongs in the collection rather than the item?

Anything true of every item: the licence, the providers, the summary of available fields, the extents that bound all items, and the column conventions themselves. Repeating those per item makes them expensive to correct and lets them drift between items. The rule of thumb is that an item carries what distinguishes it from its siblings, and everything else belongs one level up.

### How should a schema change be handled in the catalogue?

As a new collection when the change is breaking, and as a version bump within the collection when it is additive. Adding an optional column is additive; changing a column's unit, its null semantics, or its meaning is breaking even if the column name is unchanged, and treating that as additive is how a consumer ends up summing two incompatible vintages. The version extension makes the distinction visible, and a validation gate keyed on schema version makes it enforceable.

### Is a checksum in the catalogue worth the cost of computing it?

Yes, and it is cheaper than it appears because it is computed once at write time when the bytes are already in memory. It buys two things: detection of silent corruption, which does happen in long-lived archives, and detection of an unrecorded rewrite, which happens rather more often. The second is the real value — a file that changed without its catalogue entry changing is a provenance break, and the checksum is the only cheap way to find it.

### Where should the convention itself be published?

Somewhere a consumer can reach without asking anyone — a schema document alongside the catalogue, versioned with the same identifier the files carry. The convention is part of the data's meaning, and a dataset whose column semantics are defined only in a wiki behind an organisation's login has the same long-term problem as one with no definitions at all. Publishing the convention with the collection costs a file and removes an entire class of question.

The convention document should also state which of its rules are enforced by a validator and which are advisory, because the two age differently: enforced rules stay true, and advisory ones quietly stop being followed.

The same logic applies to the vocabulary a column draws on. A land use class column whose permitted values are enumerated in the convention is checkable; one whose values are whatever the producing pipeline happened to emit will accumulate near-duplicates — "forest", "Forest", "forest_land" — that no aggregation will notice and every join will silently drop.

## Related guides

- [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) — the parent topic and the wider schema conventions.
- [Canonical Parquet Schema Data Dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) — the shared column definitions this convention validates against.
- [Versioning Emission Factor Databases for Reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/) — what the emission factor version field points at.
- [COG vs Zarr vs GeoParquet for MRV Workloads](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/cog-vs-zarr-vs-geoparquet-for-mrv-workloads/) — choosing the format this metadata describes.
