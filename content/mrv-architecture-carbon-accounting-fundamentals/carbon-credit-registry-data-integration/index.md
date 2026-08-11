# Carbon Credit Registry Data Integration

Carbon Credit Registry Data Integration is the ingestion and harmonization sub-system that turns raw registry exports — project boundaries, vintage issuance records, methodology metadata, and retirement logs — into spatially aligned, audit-ready inputs for the rest of the [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. As sustainability engineering teams move from manual spreadsheet reconciliation to programmatic geospatial pipelines, the work shifts from simple extraction to deterministic spatial harmonization, temporal drift correction, and cryptographically verifiable provenance. Registry datasets are rarely delivered analysis-ready, so this component carries the burden of schema validation and topological repair before any tonnage is computed.

Because registry geometries are consumed by every downstream calculation, this stage is tightly coupled to its sibling sub-systems: it depends on deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) to make project polygons mathematically comparable, and it feeds geographically tagged removals and avoidances into [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) so that credits land in the correct value-chain category. Every transformation it performs must be recorded for [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), because a registry record with no traceable spatial history is a record an auditor can reject.

<svg viewBox="-2 34 884 142" role="img" aria-label="Five-stage registry integration pipeline. Heterogeneous registry sources feed an ingest-and-hash stage, then spatial harmonization, then temporal reconciliation, producing a verification-ready dataset carrying compliance metadata and lineage." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:880px;display:block;margin:1.5rem auto;">
  <title>Carbon registry integration pipeline</title>
  <desc>A left-to-right pipeline of five stages: registry sources, ingest and hash, spatial harmonization, temporal reconciliation, and a verification-ready output dataset.</desc>
  <defs>
    <marker id="ccr-pipe-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <rect x="14" y="50" width="150" height="110" rx="9" fill="currentColor" opacity="0.06"/>
  <rect x="14" y="50" width="150" height="110" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3" opacity="0.6"/>
  <text x="89" y="72" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">SOURCE</text>
  <text x="89" y="96" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Registry</text>
  <text x="89" y="111" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">sources</text>
  <text x="89" y="133" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">REST · bulk GeoJSON</text>
  <text x="89" y="146" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">CSV exports</text>
  <rect x="188" y="50" width="150" height="110" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.75"/>
  <text x="263" y="72" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">STAGE 1</text>
  <text x="263" y="96" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Ingest &amp; hash</text>
  <text x="263" y="126" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">SHA-256 canonical</text>
  <text x="263" y="139" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">schema validation</text>
  <rect x="362" y="50" width="150" height="110" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.75"/>
  <text x="437" y="72" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">STAGE 2</text>
  <text x="437" y="96" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Spatial</text>
  <text x="437" y="111" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">harmonization</text>
  <text x="437" y="133" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">CRS align · repair</text>
  <text x="437" y="146" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">sliver filter</text>
  <rect x="536" y="50" width="150" height="110" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.75"/>
  <text x="611" y="72" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">STAGE 3</text>
  <text x="611" y="96" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Temporal</text>
  <text x="611" y="111" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">reconciliation</text>
  <text x="611" y="133" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">vintage &amp; crediting</text>
  <text x="611" y="146" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">periods · UTC</text>
  <rect x="710" y="50" width="156" height="110" rx="9" fill="currentColor" opacity="0.1"/>
  <rect x="710" y="50" width="156" height="110" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <text x="788" y="72" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.6">OUTPUT</text>
  <text x="788" y="96" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Verification</text>
  <text x="788" y="111" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">ready dataset</text>
  <text x="788" y="133" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">compliance metadata</text>
  <text x="788" y="146" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">+ lineage</text>
  <line x1="165" y1="105" x2="187" y2="105" stroke="currentColor" stroke-width="1.5" marker-end="url(#ccr-pipe-arrow)"/>
  <line x1="339" y1="105" x2="361" y2="105" stroke="currentColor" stroke-width="1.5" marker-end="url(#ccr-pipe-arrow)"/>
  <line x1="513" y1="105" x2="535" y2="105" stroke="currentColor" stroke-width="1.5" marker-end="url(#ccr-pipe-arrow)"/>
  <line x1="687" y1="105" x2="709" y2="105" stroke="currentColor" stroke-width="1.5" marker-end="url(#ccr-pipe-arrow)"/>
</svg>

## Role in the MRV Workflow

Registry integration sits at the boundary between the outside world and the deterministic core of the pipeline. Upstream are the registries themselves — Verra's Registry, the Gold Standard Impact Registry, the American Carbon Registry, the Climate Action Reserve — each exposing project metadata through heterogeneous delivery mechanisms: RESTful endpoints with OAuth2 token rotation, bulk GeoJSON/Shapefile dumps, and legacy CSV exports carrying coordinate strings packed into text columns. Downstream are the spatial harmonization, emission-factor, and aggregation stages that assume their inputs are valid, projected, and de-duplicated. This component's contract is to absorb registry messiness so that nothing further down has to.

The defining property of registry data is that it is a *mutable stream*, not a static truth. Credits are retroactively cancelled, vintages are re-issued, project boundaries are amended after verification, and methodology versions are superseded. Treating a nightly export as authoritative invites silent divergence: a project counted as active in your inventory may have been quarantined by the registry hours earlier. The integration layer therefore implements versioned snapshotting and idempotent re-ingestion — the same payload processed twice must produce the same artifact, and a changed payload must produce a visible, hashed delta. The concrete connector patterns for the two largest voluntary-market bodies are documented in [Integrating Verra & Gold Standard APIs into Python Pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/integrating-verra-gold-standard-apis-into-python-pipelines/), which this page generalizes.

Its immediate downstream dependency is [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/): a registry polygon that has not been reprojected into a known, area-preserving frame cannot be intersected, buffered, or measured without introducing material error. Its immediate downstream consumer is the carbon-accounting engine, which applies vintage-specific emission factors and additionality checks to the harmonized features. Everything the integration layer emits is therefore tagged with the metadata those consumers need — methodology version, crediting-period bounds, issuance timestamp, and a spatial-validation flag.

## Core Failure Modes

Three failure modes dominate production registry integration. Each has a concrete root cause and a measurable impact on reported tonnage or audit defensibility.

1. **Silent schema drift and retroactive cancellation.** Registries change export schemas without versioned notice — a renamed `vintage_year` field, a nested `project.location` object flattened in a new release, or a retirement column that appears only when records exist. Pipelines that parse positionally or trust column names absorb the change without error, dropping or misreading whole attribute columns. The same class of failure hides retroactive credit cancellations: a project marked `active` in last week's snapshot is `cancelled` today, but a pipeline that only ingests *new* records never revisits it. Observed impact is direct double-counting — credits retired or cancelled at the registry remain countable in the inventory, inflating claimed reductions by the full volume of the affected vintage (often thousands to hundreds of thousands of tCO₂e per project).

2. **Coordinate ambiguity and geometry corruption.** Registry boundaries arrive with undeclared or wrong CRS, axis-order confusion (lat/lon versus lon/lat), self-intersecting rings, and sliver polygons created by lossy simplification. An undeclared datum treated as WGS84 when it is actually a national grid shifts boundaries by 10–200 m; self-intersections cause area and intersection operations to return garbage or raise mid-batch. Because area drives crediting volume, a 2–5 % boundary-area error propagates linearly into a 2–5 % error in issued credits — large enough to fail a third-party materiality threshold.

3. **Temporal misalignment of vintages and crediting periods.** Issuance dates, crediting-period windows, and retirement timestamps are reported in mixed time zones and mixed granularity (some registries give a year, others a full ISO-8601 instant). Naive joins on vintage year collapse overlapping crediting periods, attribute removals to the wrong reporting year, or double-count credits that span a period boundary. The impact is misallocation across reporting years and, in the worst case, the same physical removal claimed in two consecutive inventories.

<svg viewBox="0 0 720 500" role="img" aria-label="Decision tree routing an incoming registry record through three sequential gates. Gate one checks schema validity and retroactive cancellation; gate two checks geometry validity and declared CRS; gate three checks vintage and crediting-period monotonicity. A record that fails any gate is sent to a repair-or-quarantine lane on the right; a record that passes all three becomes a verification-ready record." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:560px;display:block;margin:1.5rem auto;">
  <title>Three-gate failure-mode decision tree for registry records</title>
  <desc>An incoming registry record passes top to bottom through a schema and cancellation gate, a geometry and CRS validity gate, and a temporal monotonicity gate. Each gate routes failing records sideways to a repair or quarantine lane and passing records down to the next gate, converging on a verification-ready record.</desc>
  <defs>
    <marker id="ccr-tree-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- incoming record -->
  <rect x="130" y="10" width="200" height="40" rx="8" fill="currentColor" opacity="0.08"/>
  <rect x="130" y="10" width="200" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <text x="230" y="35" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Incoming registry record</text>
  <!-- gate 1 -->
  <polygon points="230,76 330,124 230,172 130,124" fill="currentColor" opacity="0.05"/>
  <polygon points="230,76 330,124 230,172 130,124" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <text x="230" y="115" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">GATE 1</text>
  <text x="230" y="131" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Schema valid?</text>
  <text x="230" y="146" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.8">not cancelled?</text>
  <!-- gate 2 -->
  <polygon points="230,200 330,248 230,296 130,248" fill="currentColor" opacity="0.05"/>
  <polygon points="230,200 330,248 230,296 130,248" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <text x="230" y="239" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">GATE 2</text>
  <text x="230" y="255" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Geometry valid?</text>
  <text x="230" y="270" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.8">CRS declared?</text>
  <!-- gate 3 -->
  <polygon points="230,324 330,372 230,420 130,372" fill="currentColor" opacity="0.05"/>
  <polygon points="230,324 330,372 230,420 130,372" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <text x="230" y="363" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">GATE 3</text>
  <text x="230" y="379" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Vintages</text>
  <text x="230" y="394" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.8">monotonic?</text>
  <!-- verification-ready -->
  <rect x="120" y="450" width="220" height="42" rx="8" fill="currentColor" opacity="0.12"/>
  <rect x="120" y="450" width="220" height="42" rx="8" fill="none" stroke="currentColor" stroke-width="1.8"/>
  <text x="230" y="476" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Verification-ready record</text>
  <!-- pass arrows down -->
  <line x1="230" y1="50" x2="230" y2="75" stroke="currentColor" stroke-width="1.5" marker-end="url(#ccr-tree-arrow)"/>
  <line x1="230" y1="172" x2="230" y2="199" stroke="currentColor" stroke-width="1.5" marker-end="url(#ccr-tree-arrow)"/>
  <text x="240" y="190" text-anchor="start" font-size="8.5" font-weight="600" fill="currentColor" opacity="0.7">pass</text>
  <line x1="230" y1="296" x2="230" y2="323" stroke="currentColor" stroke-width="1.5" marker-end="url(#ccr-tree-arrow)"/>
  <text x="240" y="314" text-anchor="start" font-size="8.5" font-weight="600" fill="currentColor" opacity="0.7">pass</text>
  <line x1="230" y1="420" x2="230" y2="449" stroke="currentColor" stroke-width="1.5" marker-end="url(#ccr-tree-arrow)"/>
  <text x="240" y="440" text-anchor="start" font-size="8.5" font-weight="600" fill="currentColor" opacity="0.7">pass</text>
  <!-- repair / quarantine lane -->
  <rect x="430" y="98" width="276" height="52" rx="7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.7"/>
  <text x="568" y="120" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">Quarantine</text>
  <text x="568" y="136" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.8">schema drift · retroactive cancel</text>
  <rect x="430" y="222" width="276" height="52" rx="7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.7"/>
  <text x="568" y="244" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">Repair / quarantine</text>
  <text x="568" y="260" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.8">make_valid · reproject · drop sliver</text>
  <rect x="430" y="346" width="276" height="52" rx="7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.7"/>
  <text x="568" y="368" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">Quarantine</text>
  <text x="568" y="384" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.8">non-monotonic lifecycle · split period</text>
  <!-- fail arrows to the right -->
  <line x1="330" y1="124" x2="429" y2="124" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4,3" marker-end="url(#ccr-tree-arrow)"/>
  <text x="380" y="116" text-anchor="middle" font-size="8.5" font-weight="600" fill="currentColor" opacity="0.7">fail</text>
  <line x1="330" y1="248" x2="429" y2="248" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4,3" marker-end="url(#ccr-tree-arrow)"/>
  <text x="380" y="240" text-anchor="middle" font-size="8.5" font-weight="600" fill="currentColor" opacity="0.7">fail</text>
  <line x1="330" y1="372" x2="429" y2="372" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4,3" marker-end="url(#ccr-tree-arrow)"/>
  <text x="380" y="364" text-anchor="middle" font-size="8.5" font-weight="600" fill="currentColor" opacity="0.7">fail</text>
</svg>

<svg viewBox="0 -4 900 258" role="img" aria-labelledby="reg-t reg-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="reg-t">Why a snapshot-only ingest keeps counting credits the registry has already cancelled</title>
  <desc id="reg-d">Two timelines over four monthly registry pulls. The upper timeline, incremental ingest, fetches only records created since the last pull, so a project whose status changed from active to cancelled in month three is never revisited and remains countable, leaving 84 thousand tonnes of carbon dioxide equivalent wrongly in the inventory. The lower timeline, full reconciliation, re-reads the complete project set each pull and diffs it against the local state, detecting the status change in month three and retiring the affected volume the same day. An annotation states that the cost difference is one extra full pull per period and the correctness difference is the entire cancelled volume.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">A cancellation is a change to an OLD record</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Incremental ingest asks "what is new". Registries also change what is old.</text>
    <text x="12" y="66" fill="currentColor" font-size="10" font-weight="700">Incremental ingest</text>
    <text x="12" y="82" fill="currentColor" font-size="9" opacity="0.7">new records only</text>
  </g>
  <g>
    <line x1="196" y1="76" x2="700" y2="76" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
    <circle cx="196" cy="76" r="6" fill="currentColor" opacity="0.5"/><circle cx="364" cy="76" r="6" fill="currentColor" opacity="0.5"/>
    <circle cx="532" cy="76" r="6" fill="currentColor" opacity="0.5"/><circle cx="700" cy="76" r="6" fill="currentColor" opacity="0.5"/>
    <line x1="532" y1="52" x2="532" y2="96" stroke="#f3a712" stroke-width="1.6" stroke-dasharray="4,3"/>
    <text x="544" y="58" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f3a712">status → cancelled</text>
    <text x="716" y="80" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">never seen</text>
    <text x="716" y="96" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">84 ktCO₂e still counted</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="160" fill="currentColor" font-size="10" font-weight="700">Full reconciliation</text>
    <text x="12" y="176" fill="currentColor" font-size="9" opacity="0.7">re-read + diff each pull</text>
  </g>
  <g>
    <line x1="196" y1="170" x2="700" y2="170" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
    <circle cx="196" cy="170" r="7" fill="currentColor"/><circle cx="364" cy="170" r="7" fill="currentColor"/>
    <circle cx="532" cy="170" r="8" fill="none" stroke="#f3a712" stroke-width="2.6"/><circle cx="700" cy="170" r="7" fill="currentColor"/>
    <text x="544" y="192" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f3a712">diff detects it</text>
    <text x="716" y="174" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">retired same day</text>
    <text x="716" y="190" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">inventory stays true</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="212" width="876" height="42" rx="8" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="212" width="876" height="42" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="28" y="230" fill="currentColor" font-size="9.5" font-weight="700">Cost difference: one extra full pull per period.</text>
    <text x="28" y="246" fill="currentColor" font-size="9.5" opacity="0.82">Correctness difference: the entire cancelled volume, for as long as nobody checks.</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The integration layer is built as discrete, individually retryable tasks orchestrated by Prefect (Airflow or Dagster work equally well). Each task is instrumented with `structlog` so that input and output hashes, CRS transformations, and repair counts land in the structured log as first-class fields rather than free-text messages. Ingestion is idempotent: every payload is canonicalized and hashed with SHA-256 before anything else happens, so a re-run on identical input is a no-op and a changed input produces a visible delta.

```python
import hashlib
import json

import geopandas as gpd
import structlog
from prefect import flow, task
from shapely.validation import make_valid

logger = structlog.get_logger()


@task(retries=3, retry_delay_seconds=30)
def ingest_registry_payload(raw_json: dict) -> dict:
    """Canonicalize and hash a raw registry payload for idempotent ingestion."""
    payload_hash = hashlib.sha256(
        json.dumps(raw_json, sort_keys=True).encode()
    ).hexdigest()
    logger.info(
        "registry_payload_ingested",
        payload_hash=payload_hash,
        record_count=len(raw_json.get("features", [])),
    )
    return {"payload_hash": payload_hash, "data": raw_json}


@task
def validate_schema(payload: dict) -> dict:
    """Validate against a registry-specific JSON Schema before parsing geometry.

    Guards Failure Mode 1 (silent schema drift). In production this calls a
    pinned, versioned schema; a validation failure quarantines the payload
    instead of letting a renamed or dropped field propagate downstream.
    """
    features = payload["data"].get("features", [])
    required = {"vintage_year", "project_id", "status", "methodology"}
    missing = [
        i for i, f in enumerate(features)
        if not required.issubset(f.get("properties", {}))
    ]
    if missing:
        logger.error(
            "schema_validation_failed",
            payload_hash=payload["payload_hash"],
            offending_records=len(missing),
            action="quarantine",
        )
        raise ValueError(f"{len(missing)} records failed schema validation")
    logger.info("schema_validation_passed", record_count=len(features))
    return payload
```

Spatial harmonization is the heart of the component. It explicitly reprojects into an analysis CRS, repairs invalid geometry deterministically, and filters slivers below a documented area threshold — logging a before/after area delta so an auditor can reconstruct exactly what changed. Area is measured in an equal-area projection (`EPSG:6933`) rather than in degrees, because area computed in `EPSG:4326` is meaningless.

```python
@task
def harmonize_geometry(
    gdf: gpd.GeoDataFrame, target_crs: str = "EPSG:4326"
) -> gpd.GeoDataFrame:
    """Align CRS, repair invalid geometries, and drop sub-threshold slivers.

    Guards Failure Mode 2 (coordinate ambiguity / geometry corruption).
    Compliance mapping: Verra VM0042 boundary integrity; ISO 14064-2 spatial QA/QC.
    """
    source_crs = gdf.crs.to_string() if gdf.crs is not None else "undefined"
    logger.info("spatial_harmonization_start", source_crs=source_crs, target_crs=target_crs)

    # An undeclared CRS is a hard failure, not a default: assuming WGS84 on a
    # national-grid dataset silently shifts boundaries by tens of metres.
    if gdf.crs is None:
        logger.error("missing_crs", action="quarantine")
        raise ValueError("Registry geometry arrived without a declared CRS")

    area_before = gdf.to_crs("EPSG:6933").area.sum() / 1_000_000  # km^2
    gdf = gdf.to_crs(target_crs)

    # Deterministic repair: make_valid is order-independent and reproducible.
    invalid = ~gdf.geometry.is_valid
    gdf.loc[invalid, "geometry"] = gdf.loc[invalid, "geometry"].apply(make_valid)

    gdf["area_km2"] = gdf.to_crs("EPSG:6933").area / 1_000_000
    keep = gdf["area_km2"] >= 0.001  # drop slivers < 0.001 km^2 (1000 m^2)
    cleaned = gdf[keep].copy()
    area_after = cleaned["area_km2"].sum()

    logger.info(
        "spatial_harmonization_complete",
        valid_polygons=int(len(cleaned)),
        geometries_repaired=int(invalid.sum()),
        slivers_removed=int((~keep).sum()),
        area_delta_km2=round(area_after - area_before, 6),
    )
    return cleaned
```

Temporal reconciliation normalizes every timestamp to a single time zone and granularity, then resolves overlapping crediting periods before vintages are joined to anything else. The rule is monotonicity: issuance must precede retirement, and a crediting period must not straddle a reporting-year boundary without being split. This is what keeps a single physical removal from being claimed twice.

```python
import pandas as pd


@task
def reconcile_vintages(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Normalize temporal fields and reject non-monotonic credit lifecycles.

    Guards Failure Mode 3 (temporal misalignment). All timestamps are coerced
    to UTC; records whose retirement precedes issuance are quarantined.
    """
    for col in ("issuance_ts", "retirement_ts"):
        if col in gdf.columns:
            gdf[col] = pd.to_datetime(gdf[col], utc=True, errors="coerce")

    if {"issuance_ts", "retirement_ts"}.issubset(gdf.columns):
        retired = gdf["retirement_ts"].notna()
        non_monotonic = retired & (gdf["retirement_ts"] < gdf["issuance_ts"])
        if non_monotonic.any():
            logger.error(
                "non_monotonic_lifecycle",
                offending_records=int(non_monotonic.sum()),
                action="quarantine",
            )
            gdf = gdf[~non_monotonic].copy()

    logger.info("vintage_reconciliation_complete", record_count=int(len(gdf)))
    return gdf


@flow(name="carbon_registry_integration", log_prints=True)
def run_registry_pipeline(raw_registry_data: dict) -> gpd.GeoDataFrame:
    """End-to-end registry ingestion, harmonization, and compliance tagging."""
    payload = ingest_registry_payload(raw_registry_data)
    validated = validate_schema(payload)

    gdf = gpd.GeoDataFrame.from_features(validated["data"].get("features", []))
    harmonized = harmonize_geometry(gdf)
    reconciled = reconcile_vintages(harmonized)

    reconciled["source_payload_hash"] = payload["payload_hash"]
    reconciled["compliance_status"] = "VERIFICATION_READY"
    logger.info(
        "pipeline_complete",
        final_record_count=int(len(reconciled)),
        source_payload_hash=payload["payload_hash"],
    )
    return reconciled


if __name__ == "__main__":
    run_registry_pipeline({"features": []})
```

## Validation, Debugging & Compliance Mapping

Each structured log field the pipeline emits maps to a specific clause an auditor will test. The `source_payload_hash` and the `area_delta_km2` together form a reproducibility proof: re-running the flow on the same hash must yield the same delta, satisfying the data-integrity expectations of ISO 14064-3 verification. The `geometries_repaired` and `slivers_removed` counters give an auditor the before/after boundary record that Verra's VM-series methodologies require to confirm that boundary editing did not inflate crediting area. The `non_monotonic_lifecycle` quarantine is the control that prevents the double-counting that CSRD ESRS E1 disclosures are most often challenged on.

<div style="overflow-x:auto">

| Pipeline output | Failure mode guarded | Regulatory clause | Auditor question answered |
| --- | --- | --- | --- |
| `source_payload_hash` + idempotent re-run | Schema drift / retroactive cancellation | ISO 14064-3 (data integrity, reproducibility) | "Can you reproduce this figure from the same inputs?" |
| `geometries_repaired`, `slivers_removed`, `area_delta_km2` | Coordinate ambiguity / geometry corruption | Verra VM0042; ISO 14064-2 (spatial QA/QC) | "Did boundary repair change the credited area?" |
| `non_monotonic_lifecycle` quarantine, UTC-normalized vintages | Temporal misalignment | CSRD ESRS E1; GHG Protocol | "Is any removal claimed in two reporting periods?" |
| `compliance_status`, methodology/vintage tags | Downstream misallocation | GHG Protocol Scope 3 attribution | "Which value-chain category and year does this credit belong to?" |

</div>

When debugging, the first move is always to diff two payload hashes rather than two record sets — a changed hash with an unchanged record count points at silent schema drift, while an unchanged hash with diverging downstream numbers points at non-determinism in a later stage. A negative `area_delta_km2` larger than the sliver budget signals that geometry repair removed real area, which usually means an upstream CRS mistake rather than a genuine sliver. Persisting these fields to the lineage store closes the loop with [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), so the integration layer's decisions remain queryable long after the run completes.

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="ser-t ser-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ser-t">Serial-number ranges as the unit of reconciliation between a registry and an inventory</title>
  <desc id="ser-d">A horizontal band representing a project's issued serial-number range from 1 to 250000. Sub-ranges are marked: 1 to 90000 retired by a third party, 90001 to 140000 held by the reporting entity and claimed, 140001 to 180000 cancelled by the registry after a reversal, 180001 to 220000 held but not yet claimed, and 220001 to 250000 transferred to another account. A panel states that only the claimed sub-range may appear in the inventory, that the cancelled sub-range must be removed even if it was previously claimed, and that reconciling on project totals rather than serial ranges cannot distinguish these five states.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Reconcile on serial ranges, not project totals</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">One project's issued range, 1–250 000. Five states live inside it, and a total cannot see any of them.</text>
  </g>
  <g>
    <rect x="12" y="60" width="312" height="46" fill="currentColor" opacity="0.12"/>
    <rect x="12" y="60" width="312" height="46" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="168" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">retired by a third party</text>
    <text x="168" y="96" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">1 – 90 000</text>
    <rect x="324" y="60" width="174" height="46" fill="currentColor" opacity="0.28"/>
    <rect x="324" y="60" width="174" height="46" fill="none" stroke="currentColor" stroke-width="2"/>
    <text x="411" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">claimed by us</text>
    <text x="411" y="96" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.85">90 001 – 140 000</text>
    <rect x="498" y="60" width="139" height="46" fill="#f3a712" opacity="0.3"/>
    <rect x="498" y="60" width="139" height="46" fill="none" stroke="#f3a712" stroke-width="2"/>
    <text x="567" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">cancelled</text>
    <text x="567" y="96" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.85">140 001 – 180 000</text>
    <rect x="637" y="60" width="139" height="46" fill="currentColor" opacity="0.07"/>
    <rect x="637" y="60" width="139" height="46" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="706" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">held, unclaimed</text>
    <text x="706" y="96" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">180 001 – 220 000</text>
    <rect x="776" y="60" width="112" height="46" fill="currentColor" opacity="0.07"/>
    <rect x="776" y="60" width="112" height="46" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="832" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">transferred</text>
    <text x="832" y="96" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">220 001 – 250 000</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="132" width="876" height="104" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="132" width="876" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="30" y="156" fill="currentColor" font-size="10" font-weight="700">Only the claimed sub-range may appear in the inventory.</text>
    <text x="30" y="180" fill="#f3a712" font-size="10" font-weight="700">The cancelled sub-range must be removed even if it was claimed in a prior period — that is a restatement.</text>
    <text x="30" y="204" fill="currentColor" font-size="9.5" opacity="0.85">A project-total reconciliation sees one number, 250 000, and cannot distinguish any of these five states.</text>
    <text x="30" y="224" fill="currentColor" font-size="9.5" opacity="0.85">Serial ranges are the only unit at which retirement, cancellation and transfer are separable.</text>
  </g>
</svg>

## Frequently Asked Questions

### How often should a registry connector re-read the full project set?

At least once per reporting period, and in practice monthly for portfolios of any size. Incremental ingest is an optimisation for volume, not a substitute for reconciliation: cancellations, retirements by other parties, and status corrections all modify records the incremental query will never return. The workable arrangement is a frequent incremental pull for new issuances plus a scheduled full reconciliation that diffs the complete state against the local store and raises on every unexpected transition.

### What should happen when a registry changes its export schema mid-period?

The pipeline should fail, loudly, on the first record that does not match the pinned schema — and it should be able to say which field changed. Positional parsing and permissive column-name matching are what let a renamed or flattened field pass silently, dropping an entire attribute. Pin the expected schema as a versioned artefact, validate every batch against it, and treat a change as a code change requiring review rather than a runtime adaptation.

### Can I trust the coordinate reference system declared in a registry export?

Trust it, but verify it geometrically. A declared CRS that is wrong is more dangerous than a missing one, because a missing CRS causes a rejection while a wrong one causes a plausible-looking shift of tens to hundreds of metres. The cheap check is a plausibility test: reproject the boundary to geographic coordinates and confirm it falls within the country or region the registry record names. A boundary that lands in the sea, or in the wrong hemisphere from an axis-order swap, is caught immediately by that one assertion.

### How should overlapping crediting periods be handled in a join?

Never join on vintage year alone. Model the crediting period as an explicit interval with timezone-aware endpoints and perform an interval overlap rather than an equality join, allocating volume across reporting years by the rule the methodology specifies. Mixed granularity — some registries publishing a year, others a full timestamp — must be normalised at ingestion into intervals, with the coarser records widened to their full implied span and that widening recorded, so the resulting allocation is visibly an approximation rather than a false precision.

### What belongs in the reconciliation record that an auditor will ask for?

The registry snapshot identifier and its retrieval timestamp, the serial ranges by state, the diff against the previous snapshot with every transition classified, the geometry validity and CRS check results, and the interval allocation applied to each crediting period. Together these let a verifier reproduce the claimed volume from the registry's own published state at a point in time, which is the question the reconciliation exists to answer.

### How should a project that appears in two registries be handled?

As two records with an explicit link, never merged into one. Dual listing is rare but real, usually during a methodology transition or a registry migration, and merging the two loses the ability to reconcile either against its source. Keep a record per registry with its own serial ranges and status, plus a relationship field naming the counterpart, and assert that no credit volume is claimed from both. That assertion is the one control that prevents the most consequential double count available to a portfolio.

### What is the right cadence for registry reconciliation in a fast-moving portfolio?

Weekly for issuance and retirement, monthly for the full state diff, and immediately before any figure is published. The asymmetry reflects what changes: new issuances arrive continuously and are additive, while status corrections and cancellations arrive unpredictably and are subtractive. A publication-time reconciliation is the one that matters most, because it is the last moment a cancellation can be caught before it becomes a restatement.

### Should retired credits stay in the dataset?

Yes, permanently. A retirement is a state change, not a deletion, and the retired volume is exactly what an auditor checks a claim against. Removing retired rows makes the ledger unreconcilable against the registry's own published state and destroys the ability to answer who retired what and when — which is the question a double-counting investigation starts with.

## Conclusion

Registry integration earns its place in the pipeline by absorbing the disorder of external registries — drifting schemas, ambiguous coordinates, and inconsistent timestamps — and emitting a clean, hashed, spatially and temporally reconciled dataset that every downstream stage can trust. Doing it deterministically, with structured telemetry mapped directly to ISO 14064, Verra VM-series, and CSRD ESRS E1 requirements, is what makes the eventual tonnage defensible under third-party verification. For a concrete, registry-specific implementation of the connector layer described here — authentication, pagination, and schema enforcement against the two largest voluntary-market bodies — continue to [Integrating Verra & Gold Standard APIs into Python Pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/integrating-verra-gold-standard-apis-into-python-pipelines/).

## Related

- [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) — the parent architecture this component plugs into.
- [Geospatial Coordinate Reference Systems (CRS) Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the reprojection contract registry geometries must satisfy.
- [GHG Protocol Scope 3 Spatial Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) — where harmonized removals are attributed to value-chain categories.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — where this stage's transformations are recorded for audit.
- [Integrating Verra & Gold Standard APIs into Python Pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/integrating-verra-gold-standard-apis-into-python-pipelines/) — registry-specific connector implementation.
