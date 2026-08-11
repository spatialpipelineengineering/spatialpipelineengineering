---
shortTitle: "OpenLineage Data Lineage for ESG & Carbon Audits"
---
# Tracking Data Lineage with OpenLineage for ESG Audits

This guide is the implementation reference for emitting verifiable, spatial-aware lineage events out of an MRV pipeline — the operational layer that turns the principles in [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) into machine-readable evidence inside the wider [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. Where the parent component frames *what* provenance must capture, this page walks the exact OpenLineage integration: how a raster clip, a vector re-projection, and an emission calculation each become a hashed, schema-enforced `RunEvent` that an auditor can replay byte-for-byte.

ESG verification bodies and voluntary carbon registries now mandate cryptographic-grade provenance for every emission factor, land-use polygon, and supplier activity record entering a carbon accounting pipeline. Traditional application logs and ad-hoc metadata tables collapse when spatial datasets undergo multi-stage transformations across distributed orchestration layers. The integration below depends on deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) at ingestion so that the coordinates it records are honest, and it feeds the audit trail that [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) submits — while threading through [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/), where supply-chain attribution is unverifiable unless each boundary intersection carries its own recorded origin.

<svg viewBox="0 0 1000 372" role="img" aria-labelledby="ol-t ol-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ol-t">OpenLineage emission and replay path for one MRV task</title>
  <desc id="ol-d">Spatial inputs (Sentinel-2 tiles and supplier polygons with a declared CRS) enter a pre-flight gate that checks CRS equality and bounding-box bounds. On pass, a transform clips, reprojects and runs the emission calculation, building a spatialProvenance custom facet (CRS, bounding box, temporal window, source registry id and a crsValidationHash) that is wrapped into a RunEvent emitted as a START then COMPLETE pair, or a FAIL event on exception, and sent over HTTP to a Marquez collector. A CRS mismatch instead routes the task to a BLOCKED state with no event emitted, into a remediation queue. At audit time the Marquez store is queried and the events are replayed into a reconstructed lineage graph. A dashed boundary separates pipeline runtime on the left from audit-time replay on the right.</desc>
  <defs>
    <marker id="ol-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- runtime / replay divider -->
    <line x1="848" y1="86" x2="848" y2="350" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" opacity="0.45"/>
    <text x="838" y="80" text-anchor="end" fill="currentColor" font-size="9" opacity="0.65">pipeline runtime · write</text>
    <text x="858" y="80" text-anchor="start" fill="currentColor" font-size="9" opacity="0.65">audit replay · read</text>
    <!-- boxes -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="16" y="112" width="126" height="86" rx="9"/>
      <rect x="176" y="112" width="140" height="86" rx="9"/>
      <rect x="350" y="112" width="132" height="86" rx="9"/>
      <rect x="516" y="96" width="160" height="118" rx="10"/>
      <rect x="710" y="112" width="120" height="86" rx="9"/>
      <rect x="864" y="96" width="122" height="118" rx="10"/>
      <rect x="176" y="262" width="140" height="80" rx="9" stroke-dasharray="5 4"/>
      <rect x="528" y="162" width="136" height="44" rx="6" opacity="0.85"/>
    </g>
    <!-- inputs -->
    <g fill="currentColor">
      <text x="79" y="140" font-size="11.5" font-weight="600">Spatial inputs</text>
      <text x="79" y="158" font-size="9.5" opacity="0.8">Sentinel-2 tiles</text>
      <text x="79" y="172" font-size="9.5" opacity="0.8">supplier polygons</text>
      <text x="79" y="186" font-size="9.5" opacity="0.8">+ declared CRS</text>
    </g>
    <!-- pre-flight gate -->
    <g fill="currentColor">
      <text x="246" y="138" font-size="11.5" font-weight="600">Pre-flight gate</text>
      <text x="246" y="156" font-size="9.5" opacity="0.8">CRS == EPSG?</text>
      <text x="246" y="170" font-size="9.5" opacity="0.8">bbox in bounds?</text>
      <text x="246" y="186" font-size="9.5" opacity="0.8">pass → emit</text>
    </g>
    <!-- transform -->
    <g fill="currentColor">
      <text x="416" y="138" font-size="11.5" font-weight="600">Transform</text>
      <text x="416" y="156" font-size="9.5" opacity="0.8">clip · reproject</text>
      <text x="416" y="170" font-size="9.5" opacity="0.8">· emission calc</text>
      <text x="416" y="186" font-size="9.5" opacity="0.8">builds facet</text>
    </g>
    <!-- RunEvent + facet -->
    <g fill="currentColor">
      <text x="596" y="120" font-size="11.5" font-weight="600">RunEvent</text>
      <text x="596" y="138" font-size="9.5" opacity="0.85">START → COMPLETE</text>
      <text x="596" y="152" font-size="9" opacity="0.7">└ FAIL on exception</text>
      <text x="596" y="178" font-size="9" font-weight="600">spatialProvenance facet</text>
      <text x="596" y="190" font-size="8" opacity="0.8">crs · bbox · window</text>
      <text x="596" y="201" font-size="8" opacity="0.8">registryId · crsValidationHash</text>
    </g>
    <!-- Marquez -->
    <g fill="currentColor">
      <text x="770" y="138" font-size="11.5" font-weight="600">Marquez</text>
      <text x="770" y="156" font-size="9.5" opacity="0.8">collector</text>
      <text x="770" y="170" font-size="9.5" opacity="0.8">OL backend</text>
      <text x="770" y="186" font-size="9.5" opacity="0.8">stores events</text>
    </g>
    <!-- auditor replay -->
    <g fill="currentColor">
      <text x="925" y="118" font-size="11" font-weight="600">Auditor replay</text>
      <text x="925" y="198" font-size="9" opacity="0.8">reconstructed</text>
      <text x="925" y="210" font-size="9" opacity="0.8">lineage graph</text>
    </g>
    <!-- mini lineage graph inside auditor -->
    <g stroke="currentColor" stroke-width="1.3" opacity="0.85">
      <line x1="895" y1="158" x2="925" y2="142"/>
      <line x1="925" y1="142" x2="955" y2="158"/>
      <line x1="895" y1="158" x2="955" y2="158"/>
    </g>
    <g fill="currentColor">
      <circle cx="895" cy="158" r="4.5"/>
      <circle cx="925" cy="142" r="4.5"/>
      <circle cx="955" cy="158" r="4.5"/>
    </g>
    <!-- BLOCKED branch -->
    <g fill="currentColor">
      <text x="246" y="288" font-size="11" font-weight="600">BLOCKED</text>
      <text x="246" y="304" font-size="9.5" opacity="0.8">CRS mismatch</text>
      <text x="246" y="318" font-size="9.5" opacity="0.8">no event emitted</text>
      <text x="246" y="332" font-size="9.5" opacity="0.8">→ remediation queue</text>
    </g>
    <!-- flow arrows -->
    <g fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#ol-arrow)">
      <path d="M142 155 L172 155"/>
      <path d="M316 155 L346 155"/>
      <path d="M482 155 L512 155"/>
      <path d="M676 155 L706 155"/>
      <path d="M830 155 L860 155"/>
      <path d="M246 198 L246 258"/>
    </g>
    <!-- arrow labels -->
    <g fill="currentColor" font-size="8.5" opacity="0.7">
      <text x="331" y="148">pass</text>
      <text x="691" y="148" text-anchor="middle" font-size="8">emit</text>
      <text x="845" y="148">query</text>
      <text x="266" y="232" text-anchor="start">fail</text>
    </g>
  </g>
</svg>

## Root Cause Analysis

The problem OpenLineage solves is structural: in a distributed orchestration layer, the relationship between a transformation and its inputs lives only in the runtime memory of the task that ran it. Once that task exits, the binding evaporates unless it was explicitly serialized. Application logs record *that* something happened, but not the addressable inputs, the active projection, or a content hash of the output — so they cannot reconstruct a chain of custody. When a reported `tCO₂e` figure is challenged, the team is left re-deriving provenance from filenames and commit history, which no verifier accepts.

Three failure mechanisms recur when teams attempt traceability without a schema-enforced lineage protocol:

1. **CRS decoupling across stages.** A raster layer in `EPSG:3857` clipped against a vector boundary in `EPSG:4326` introduces area distortion that compounds across aggregation stages. Without a spatial facet recorded per stage, downstream consumers cannot validate that the projection was consistent, and an area-based emission calculation is silently invalidated while the manifest still reports a clean datum tag.
2. **Temporal drift masking source substitution.** When a primary observation window is quietly swapped for a fallback epoch, the output dataset looks identical but the tonnage now derives from a different acquisition period. Unless the temporal window is bound into the lineage event, the substitution is invisible.
3. **Scope 3 aggregation flattening upstream origin.** Supplier activity data merged with regional grid factors loses the per-source registry identifier when intermediate tables are overwritten. The final figure is numerically plausible but untraceable to the verified project boundary it claims.

Each failure is deterministic, and therefore preventable, by attaching a typed spatial contract to every dataset a task emits. The remaining sections install that contract.

## Diagnostic Pipeline / Pre-Flight Validation

Before any lineage event is emitted, the task must inspect its inputs and detect the failure conditions above — emitting a `RunEvent` for a mathematically invalid spatial state pollutes the audit record with confident-looking garbage. The pre-flight gate validates that every input declares an explicit, machine-readable CRS, that bounding boxes fall within geodetic bounds, and that the projection matches the pipeline's canonical reference before transformation begins.

```python
import json
import structlog

log = structlog.get_logger("mrv.lineage.preflight")


def validate_crs_alignment(input_crs: str, expected_crs: str, dataset: str) -> None:
    """Halt the task before emission if CRS alignment fails GHG boundary rules."""
    if not input_crs or ":" not in input_crs:
        log.error("crs_missing", dataset=dataset, declared=input_crs)
        raise ValueError(f"Dataset '{dataset}' has no machine-readable CRS tag")
    if input_crs != expected_crs:
        rejection = {
            "status": "BLOCKED",
            "dataset": dataset,
            "reason": f"CRS mismatch: {input_crs} != {expected_crs}",
            "compliance_rule": "GHG Protocol Spatial Boundary Alignment",
        }
        log.error("crs_mismatch", **rejection)
        raise ValueError(json.dumps(rejection))


def validate_bbox(bbox: dict, dataset: str) -> None:
    """Reject geometries outside WGS84 geodetic bounds before any spatial join."""
    if not all(k in bbox for k in ("minx", "miny", "maxx", "maxy")):
        raise ValueError(f"Dataset '{dataset}' bbox incomplete: {bbox}")
    if not (-180 <= bbox["minx"] < bbox["maxx"] <= 180):
        raise ValueError(f"Dataset '{dataset}' longitude out of bounds: {bbox}")
    if not (-90 <= bbox["miny"] < bbox["maxy"] <= 90):
        raise ValueError(f"Dataset '{dataset}' latitude out of bounds: {bbox}")
    log.info("bbox_validated", dataset=dataset, bbox=bbox)
```

Wiring this gate into Airflow's `on_failure_callback` or a Prefect task guard ensures that lineage only records states that have already passed spatial validation. The CRS contract enforced here is the same one detailed in [how to align WGS84 to a local CRS in Python](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/how-to-align-wgs84-to-local-crs-in-python-for-carbon-mapping/), applied at the moment of emission rather than at ingestion.

<svg viewBox="0 -4 880 232" role="img" aria-labelledby="facet-t facet-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="facet-t">Standard OpenLineage facets against the spatial facet an MRV pipeline must add</title>
  <desc id="facet-d">Two groups. The standard facets that ship with OpenLineage cover schema, data source, column lineage, and data quality metrics — enough to answer which table fed which table. The custom spatial facet adds the coordinate reference system, the bounding box, the temporal window, the source registry identifier, and a coordinate-validation hash. A panel explains that without the spatial facet a lineage graph can prove a dataset was used without proving it was used in the right coordinate system, which is precisely the question a spatial audit asks.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Standard facets prove usage; the spatial facet proves correctness</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">A geospatial audit asks a question the base specification does not model.</text>
    <rect x="12" y="52" width="418" height="152" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="52" width="418" height="152" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Standard facets</text>
    <text x="28" y="100" fill="currentColor" font-size="9.5" opacity="0.85">schema · fields and types</text>
    <text x="28" y="120" fill="currentColor" font-size="9.5" opacity="0.85">dataSource · where it came from</text>
    <text x="28" y="140" fill="currentColor" font-size="9.5" opacity="0.85">columnLineage · field-level derivation</text>
    <text x="28" y="160" fill="currentColor" font-size="9.5" opacity="0.85">dataQualityMetrics · row counts, nulls</text>
    <text x="28" y="186" fill="currentColor" font-size="9.5" font-weight="700">answers: which dataset fed which</text>
    <rect x="450" y="52" width="418" height="152" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="450" y="52" width="418" height="152" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="466" y="76" fill="currentColor" font-size="10.5" font-weight="700">spatialProvenance facet</text>
    <text x="466" y="100" fill="currentColor" font-size="9.5" opacity="0.85">crs · the analysis projection used</text>
    <text x="466" y="120" fill="currentColor" font-size="9.5" opacity="0.85">bbox · extent after transformation</text>
    <text x="466" y="140" fill="currentColor" font-size="9.5" opacity="0.85">temporalWindow · period covered</text>
    <text x="466" y="160" fill="currentColor" font-size="9.5" opacity="0.85">crsValidationHash · the check that ran</text>
    <text x="466" y="186" fill="#f3a712" font-size="9.5" font-weight="700">answers: and was it geometrically correct</text>
  </g>
</svg>

## Deterministic Transformation Logic

OpenLineage's core `RunEvent` schema captures generic inputs and outputs, but ESG verification requires a domain-specific extension. Standard facets lack fields for coordinate reference systems, bounding-box extents, temporal resolution, and registry identifiers, so the integration injects a custom `spatialProvenance` facet onto every output dataset. The facet is the verifiable spatial contract — it binds the transformation to a projection and an observation window, and seals that binding with a `crsValidationHash` that an auditor recomputes to detect tampering or silent drift.

```json
{
  "spatialProvenance": {
    "_producer": "https://github.com/esg-mrv/lineage-facets",
    "_schemaURL": "https://openlineage.io/spec/facets/1-0-0/CustomFacet.json",
    "crs": "EPSG:4326",
    "boundingBox": {"minx": -122.5, "miny": 37.0, "maxx": -121.8, "maxy": 37.9},
    "temporalWindow": {"start": "2023-01-01T00:00:00Z", "end": "2023-12-31T23:59:59Z"},
    "sourceRegistryId": "VCS-1842",
    "scope3Category": "Category 11",
    "calculationMethodology": "IPCC 2006 Tier 2",
    "crsValidationHash": "sha256:a1b2c3d4..."
  }
}
```

The emitter below builds that facet inside a `START`/`COMPLETE` event pair so that a failure between the two is itself recorded. It uses the `openlineage-python` client to dispatch events over HTTP to a Marquez (or compatible) backend, runs the pre-flight gate first, and logs every boundary with `structlog` for an audit-ready JSON trail.

```python
import uuid
import datetime
import hashlib
import structlog
from openlineage.client import OpenLineageClient
from openlineage.client.run import (
    RunEvent, RunState, Run, Job, InputDataset, OutputDataset,
)
from openlineage.client.facet import DocumentationJobFacet

log = structlog.get_logger("mrv.lineage.emitter")


class SpatialLineageEmitter:
    """Emits CRS-aware OpenLineage events for one MRV transformation."""

    def __init__(self, namespace: str, expected_crs: str = "EPSG:4326"):
        self.namespace = namespace
        self.expected_crs = expected_crs
        # Reads OPENLINEAGE_URL / API key from the environment.
        self.client = OpenLineageClient.from_environment()

    def _crs_hash(self, crs_epsg: int, bbox: dict) -> str:
        """Immutable checksum binding projection to extent for replay validation."""
        payload = (
            f"EPSG:{crs_epsg}|{bbox.get('minx','')}|{bbox.get('miny','')}"
            f"|{bbox.get('maxx','')}|{bbox.get('maxy','')}"
        )
        return "sha256:" + hashlib.sha256(payload.encode()).hexdigest()

    def emit(self, task_id, inputs, outputs, crs_epsg, registry_id,
             scope3_cat, methodology, temporal_window):
        run_id = str(uuid.uuid4())
        now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Validate every input BEFORE recording a START event.
        for i in inputs:
            validate_crs_alignment(i["crs"], self.expected_crs, i["name"])
            validate_bbox(i["bbox"], i["name"])

        bbox = inputs[0]["bbox"]
        spatial_facet = {
            "_producer": "https://github.com/esg-mrv/lineage-facets",
            "_schemaURL": "https://openlineage.io/spec/facets/1-0-0/CustomFacet.json",
            "crs": f"EPSG:{crs_epsg}",
            "boundingBox": bbox,
            "temporalWindow": temporal_window,
            "sourceRegistryId": registry_id,
            "scope3Category": scope3_cat,
            "calculationMethodology": methodology,
            "crsValidationHash": self._crs_hash(crs_epsg, bbox),
        }

        job = Job(
            namespace=self.namespace, name=task_id,
            facets={"documentation": DocumentationJobFacet(
                description=f"ESG spatial transform: {task_id}")},
        )
        run = Run(runId=run_id, facets={})
        in_ds = [InputDataset(namespace=i["namespace"], name=i["name"]) for i in inputs]
        out_ds = [OutputDataset(
            namespace=o["namespace"], name=o["name"],
            facets={"spatialProvenance": spatial_facet}) for o in outputs]

        # START → COMPLETE pair: an exception between them leaves a FAIL event.
        self.client.emit(RunEvent(
            eventType=RunState.START, eventTime=now(), run=run, job=job,
            inputs=in_ds, producer=spatial_facet["_producer"]))
        try:
            self.client.emit(RunEvent(
                eventType=RunState.COMPLETE, eventTime=now(), run=run, job=job,
                inputs=in_ds, outputs=out_ds, producer=spatial_facet["_producer"]))
            log.info("lineage_emitted", task=task_id, run_id=run_id,
                     crs=spatial_facet["crs"], registry=registry_id)
        except Exception as exc:
            self.client.emit(RunEvent(
                eventType=RunState.FAIL, eventTime=now(), run=run, job=job,
                producer=spatial_facet["_producer"]))
            log.error("lineage_failed", task=task_id, run_id=run_id, error=str(exc))
            raise
```

The `crsValidationHash` acts as an immutable checksum for spatial alignment: when an auditor recomputes it from the recorded CRS and bounding box, any divergence proves the output was reprojected or substituted without re-emitting lineage. Downstream consumers reject any payload where the hash fails to match, preventing silent area-calculation errors from propagating into aggregation.

## Compliance Gating & Audit Trail Generation

Carbon credit registries (Verra, Gold Standard, ART) and GHG Protocol Scope 3 categories require explicit mapping between spatial boundaries and emission methodologies, and the `spatialProvenance` facet is what carries that mapping through every aggregation step. When supplier activity data merges with regional grid emission factors, the lineage event preserves the exact upstream registry ID, temporal coverage, and calculation tier so the final figure remains traceable to a verified project boundary — the same submission contract handled in [integrating Verra and Gold Standard APIs into Python pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/integrating-verra-gold-standard-apis-into-python-pipelines/).

A compliance-ready aggregation facet carries four load-bearing fields:

- `sourceRegistryId` — links spatial polygons to verified carbon project boundaries (e.g. `VCS-1842`).
- `scope3Category` — maps to GHG Protocol categories such as `Category 4` or `Category 11`, mirroring the attribution logic in the [step-by-step Scope 3 geospatial calculation](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/step-by-step-ghg-protocol-scope-3-geospatial-calculation/).
- `calculationMethodology` — specifies the IPCC tier, registry methodology ID, or custom emission-factor derivation.
- `aggregationLogic` — documents whether spatial weighting is area-proportional, population-weighted, or uniform.

During third-party verification, auditors query the lineage backend to reconstruct the exact execution graph for a reporting period. A compliant reconstruction workflow runs five steps:

1. **Event retrieval.** Fetch all `RunEvent` payloads matching the reporting namespace and temporal window from the backend (e.g. Marquez).
2. **Facet extraction.** Parse the `spatialProvenance` facet from each output dataset.
3. **Chain validation.** Recompute and compare `crsValidationHash` across sequential tasks, rejecting any event whose projection drift exceeds the tolerance defined in the [GHG Protocol Corporate Standard](https://ghgprotocol.org/corporate-standard).
4. **Registry cross-reference.** Match `sourceRegistryId` against official registry databases to confirm project validity and vintage alignment.
5. **Methodology trace.** Confirm `calculationMethodology` aligns with the disclosed framework (ISO 14064-3, SBTi FLAG, or CSRD ESRS E1).

This sequence eliminates manual spreadsheet reconciliation and yields a machine-readable trail from raw Sentinel-2 tiles to the final inventory total — the evidentiary completeness ISO 14064-3 §5.4 and CSRD ESRS E1 disclosures are scrutinized for.

## Production Integration

In production the emitter wraps each orchestration task so lineage is committed as a first-class output, not a side effect. The end-to-end execution pattern for a single MRV transformation follows six ordered stages:

1. **Ingest** — load source rasters and supplier geometries with their declared CRS and acquisition window attached as task parameters.
2. **Diagnose** — run `validate_crs_alignment` and `validate_bbox` over every input; route any `BLOCKED` record to a remediation queue before emission.
3. **Transform** — perform the raster clip, re-projection, or emission calculation on a single canonical pixel grid.
4. **Validate** — recompute `crsValidationHash` on the output and assert it against the expected projection.
5. **Export** — serialize the result as GeoParquet or a registry-ready GeoTIFF with the `spatialProvenance` facet embedded alongside.
6. **Submit** — emit the `START`/`COMPLETE` event pair to the collector and forward the registry payload downstream.

For continental-scale runs, emit one event per chunk rather than per scene: align lineage emission to the same tiling the pipeline already uses for out-of-core I/O, so each Dask partition produces an addressable, hashed artifact with its own facet. Batch the HTTP dispatch behind a buffered transport (the client's `async` or `kafka` transport) to keep emission off the critical path, and back-pressure on collector failure rather than dropping events — a lost lineage record is an unverifiable artifact. Embedding this discipline at the orchestration layer is now a baseline control for enterprise MRV systems: it guarantees cryptographic traceability, prevents projection-induced calculation errors, and satisfies increasingly stringent ESG verification mandates.

<svg viewBox="0 -4 880 224" role="img" aria-labelledby="ev-t ev-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ev-t">Run event sequences and what an incomplete pair leaves in the lineage graph</title>
  <desc id="ev-d">Three sequences. A successful run emits START then COMPLETE, producing a closed node with inputs, outputs, and facets. A failed run emits START then FAIL, producing a node marked failed with inputs recorded and no outputs, which is a complete and useful record. A crashed process emits START only, leaving a node permanently in the running state with inputs but neither outputs nor a terminal status — an orphan that makes the graph look incomplete forever. A panel states that emitting a terminal event from a finally block, and reaping stale running nodes on a schedule, are the two things that keep the graph honest.</desc>
  <defs>
    <marker id="ev-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Every START needs a terminal partner</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">An orphaned START is worse than no event: it makes the graph permanently incomplete.</text>
    <text x="12" y="72" fill="currentColor" font-size="10" font-weight="700">Success</text>
    <text x="12" y="122" fill="currentColor" font-size="10" font-weight="700">Failure</text>
    <text x="12" y="172" fill="currentColor" font-size="10" font-weight="700">Crash</text>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="120" y="52" width="112" height="30" rx="6" fill="currentColor" opacity="0.12"/>
    <rect x="120" y="52" width="112" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="176" y="72" fill="currentColor" font-size="9.5" font-weight="700">START</text>
    <rect x="272" y="52" width="112" height="30" rx="6" fill="currentColor" opacity="0.12"/>
    <rect x="272" y="52" width="112" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="328" y="72" fill="currentColor" font-size="9.5" font-weight="700">COMPLETE</text>
    <text x="560" y="72" fill="currentColor" font-size="9.5">closed node · inputs, outputs, facets</text>
    <rect x="120" y="102" width="112" height="30" rx="6" fill="currentColor" opacity="0.12"/>
    <rect x="120" y="102" width="112" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="176" y="122" fill="currentColor" font-size="9.5" font-weight="700">START</text>
    <rect x="272" y="102" width="112" height="30" rx="6" fill="currentColor" opacity="0.12"/>
    <rect x="272" y="102" width="112" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="328" y="122" fill="currentColor" font-size="9.5" font-weight="700">FAIL</text>
    <text x="560" y="122" fill="currentColor" font-size="9.5">failed node · inputs recorded, no outputs — useful</text>
    <rect x="120" y="152" width="112" height="30" rx="6" fill="currentColor" opacity="0.12"/>
    <rect x="120" y="152" width="112" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="176" y="172" fill="currentColor" font-size="9.5" font-weight="700">START</text>
    <rect x="272" y="152" width="112" height="30" rx="6" fill="none" stroke="#f3a712" stroke-width="1.8" stroke-dasharray="5,3"/>
    <text x="328" y="172" fill="#f3a712" font-size="9.5" font-weight="700">nothing</text>
    <text x="566" y="172" fill="#f3a712" font-size="9.5" font-weight="700">orphan · running forever, graph never closes</text>
  </g>
  <g stroke="currentColor" stroke-width="1.3" fill="none" marker-end="url(#ev-arrow)">
    <line x1="232" y1="67" x2="270" y2="67"/><line x1="232" y1="117" x2="270" y2="117"/>
    <line x1="232" y1="167" x2="270" y2="167" stroke-dasharray="4,3" opacity="0.6"/>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="196" width="856" height="24" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="213" fill="currentColor" font-size="9.5" font-weight="700">Emit the terminal event from a finally block, and reap stale running nodes on a schedule. Those two habits keep the graph honest.</text>
  </g>
</svg>

## Frequently Asked Questions

### Why does OpenLineage need a custom facet for spatial work?

Because the base specification models datasets, jobs, and runs, not geometry. It can prove that a supplier table fed an emissions table; it cannot prove that the join happened in an equal-area projection, that the geometries were valid, or that the extent matched the declared project boundary. Those are the questions a spatial audit asks, so the pipeline must carry them as a custom facet. The facet is cheap to add and is what turns a general lineage graph into evidence for a geospatial claim.

### Should lineage events be emitted synchronously or asynchronously?

Asynchronously for throughput, but with a durable local buffer and a terminal event emitted from a `finally` block. Synchronous emission couples pipeline latency to the collector's availability, and a collector outage then either stalls the run or — worse — causes events to be dropped silently. Buffer locally, flush in the background, and treat a persistent flush failure as a pipeline failure rather than a warning, because a run whose lineage was never recorded is a run that cannot be defended.

### What happens to the graph when a job crashes without emitting a terminal event?

The run node stays in the running state indefinitely and the graph never closes around it, which makes every completeness query unreliable. Emit FAIL from a `finally` block so an exception still produces a terminal event, and run a scheduled reaper that marks runs stale after a bounded interval with an explicit `ABORTED` status. An orphaned node is materially worse than no node, because it looks like work in progress rather than work that never finished.

### How much of the graph should be retained, and for how long?

The nodes and facets for anything that contributed to a published figure must survive the full audit horizon; development and backfill experiments do not. Tag runs by purpose at emission and apply retention by tag, rather than retaining everything at the longest horizon or purging by age alone. Also store the facets beside the artefacts, since a lineage server is infrastructure that will be replaced at least once during a crediting period.

### Can the lineage graph itself be the audit evidence?

It is a large part of it, but not all. The graph proves which inputs produced which outputs through which code; it does not prove the outputs were correct, that the validation gates ran, or that a human authorised a documented exception. Pair the graph with the validation results and the signed manifest, and cross-reference them by run identifier so a verifier can move between the three without reconciling identifiers by hand.

## Related

- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — the parent component this OpenLineage integration implements.
- [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) — the wider pipeline stack these lineage events feed.
- [Geospatial Coordinate Reference Systems (CRS) Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the ingestion-stage projection discipline the spatial facet records.
- [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) — the downstream consumer that submits the traced figures.
- [Step-by-Step GHG Protocol Scope 3 Geospatial Calculation](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/step-by-step-ghg-protocol-scope-3-geospatial-calculation/) — the per-record attribution logic these events make auditable.
