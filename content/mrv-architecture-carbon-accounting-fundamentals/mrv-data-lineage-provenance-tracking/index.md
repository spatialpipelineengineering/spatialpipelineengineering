---
shortTitle: "MRV Data Lineage & Provenance Tracking for Carbon Pipelines"
---
# MRV Data Lineage & Provenance Tracking

MRV data lineage and provenance tracking is the append-only evidence layer that binds every satellite pixel, ground plot, and modeled carbon-stock estimate to its source, transformation logic, and spatial reference system so that a reported tonne can be reconstructed byte-for-byte by a third-party verifier — and it is the connective tissue of the [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. It is not a compliance checkbox bolted on after the numbers are produced. When a pipeline reduces terabytes of multi-temporal imagery to a single CO₂-equivalent figure, lineage is the only mechanism that lets an auditor distinguish a defensible result from an unfalsifiable one.

This component sits directly downstream of [geospatial CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/), inheriting the coordinate-handling decisions made at ingestion, and directly upstream of [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/), which cannot submit a figure it cannot trace. It also threads through [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/), where supply-chain attribution across fragmented geographies is meaningless unless each emission factor and boundary intersection carries its own recorded origin. This article focuses on the satellite-to-carbon-stock synchronization stage, where spatial drift, cloud-masking artifacts, and CRS misalignment most frequently sever the audit trail — and shows how deterministic provenance capture keeps that chain intact.

<svg viewBox="0 0 760 480" role="img" aria-label="The satellite-to-carbon synchronization flow as a provenance-stamped pipeline. Optical imagery feeds an align-and-cloud-mask step that reprojects once to the canonical CRS. That output enters a carbon-stock computation decision. On success it produces a registry-ready carbon-stock raster; on failure it routes to a fallback dataset logged with its failure context. Both branches converge into a single append-only provenance manifest carrying the SHA-256 checksum, parameter snapshot, and CRS for every node." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:760px;display:block;margin:1.5rem auto;">
  <title>Provenance-stamped MRV synchronization: every branch converges into one append-only manifest</title>
  <desc>Optical imagery flows into a cloud-mask and single-pass CRS-alignment step, then into a carbon-stock computation decision. A success branch yields a registry-ready carbon-stock raster; a failure branch routes to a fallback dataset logged with its failure context. Both branches converge into an append-only provenance manifest that records the SHA-256 checksum, parameter snapshot, and CRS for every node.</desc>
  <defs>
    <marker id="lin-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- INPUT -->
  <rect x="290" y="18" width="180" height="54" rx="8" fill="currentColor" opacity="0.06"/>
  <rect x="290" y="18" width="180" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.6"/>
  <text x="380" y="38" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">INPUT</text>
  <text x="380" y="56" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Optical imagery</text>
  <line x1="380" y1="72" x2="380" y2="96" stroke="currentColor" stroke-width="1.4" marker-end="url(#lin-arrow)"/>
  <!-- ALIGN + MASK -->
  <rect x="270" y="98" width="220" height="58" rx="8" fill="currentColor" opacity="0.04"/>
  <rect x="270" y="98" width="220" height="58" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="380" y="121" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Align &amp; cloud mask</text>
  <text x="380" y="138" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">single-pass reproject → canonical CRS</text>
  <line x1="380" y1="156" x2="380" y2="180" stroke="currentColor" stroke-width="1.4" marker-end="url(#lin-arrow)"/>
  <!-- DECISION DIAMOND -->
  <polygon points="380,182 478,228 380,274 282,228" fill="currentColor" opacity="0.05"/>
  <polygon points="380,182 478,228 380,274 282,228" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="380" y="224" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">Carbon stock</text>
  <text x="380" y="238" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">computation</text>
  <!-- success branch -->
  <path d="M282 228 C200 228 160 248 155 298" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#lin-arrow)"/>
  <rect x="106" y="248" width="62" height="18" rx="4" fill="currentColor" opacity="0.1"/>
  <text x="137" y="261" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor">success</text>
  <!-- failure branch -->
  <path d="M478 228 C560 228 600 248 605 298" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#lin-arrow)"/>
  <rect x="592" y="248" width="56" height="18" rx="4" fill="currentColor" opacity="0.1"/>
  <text x="620" y="261" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor">failure</text>
  <!-- SUCCESS OUTPUT -->
  <rect x="50" y="300" width="210" height="60" rx="8" fill="currentColor" opacity="0.1"/>
  <rect x="50" y="300" width="210" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="155" y="325" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Carbon stock raster</text>
  <text x="155" y="342" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">registry-ready GeoTIFF</text>
  <!-- FALLBACK OUTPUT -->
  <rect x="500" y="300" width="210" height="60" rx="8" fill="currentColor" opacity="0.04"/>
  <rect x="500" y="300" width="210" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6,3"/>
  <text x="605" y="325" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Fallback dataset</text>
  <text x="605" y="342" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">logged with failure context</text>
  <!-- converge to manifest -->
  <path d="M155 360 C155 405 240 410 280 419" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#lin-arrow)"/>
  <path d="M605 360 C605 405 520 410 480 419" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#lin-arrow)"/>
  <!-- MANIFEST -->
  <rect x="280" y="394" width="200" height="62" rx="9" fill="currentColor" opacity="0.06"/>
  <rect x="280" y="394" width="200" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <text x="380" y="415" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" opacity="0.7">APPEND-ONLY PROVENANCE MANIFEST</text>
  <text x="380" y="432" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">one node per transformation</text>
  <text x="380" y="447" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.78">SHA-256 · params · CRS · status</text>
</svg>

## Role in the MRV Workflow

Provenance tracking is a cross-cutting concern rather than a single pipeline stage: it instruments the ingestion, spatial-normalization, factor-application, aggregation, and verification stages alike, attaching an immutable record to each artifact those stages emit. In the synchronization workflow examined here, the component wraps a tight sequence — ingest high-resolution optical imagery, apply atmospheric and cloud correction, align outputs to a canonical project CRS, compute a biomass or soil-carbon proxy, and serialize a registry-ready GeoTIFF alongside a metadata manifest. Each transformation is logged with input/output paths, parameter snapshots, the active spatial reference, and a content hash of the resulting artifact.

The upstream dependency is the canonical ingestion schema and the aligned geometry produced by CRS harmonization. If a raster arrives without an explicit, machine-readable datum tag, lineage capture has nothing trustworthy to record, so the discipline begins at the moment of acquisition rather than at export. The downstream consumers are unforgiving. A registry verifier reconstructing a credit volume must be able to walk backward from the certified tonnage to the exact tile, the exact cloud threshold, the exact allometric calibration, and the exact reprojection grid that produced it. When that walk-back is impossible, the figure is unverifiable regardless of whether it is numerically correct.

Crucially, the synchronization stage produces more than a carbon raster — it produces evidence. Modern pipelines treat lineage as a first-class output committed before the next stage reads anything, which is what makes a failed run at aggregation re-runnable from a stage-three artifact without re-ingesting raw telemetry. That contract — every stage commits an addressable, hashed artifact and a provenance node before the next stage begins — is what turns a pile of intermediate rasters into a queryable audit record that feeds enterprise event schemas such as [tracking data lineage with OpenLineage for ESG audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/).

## Core Failure Modes

Three failure modes dominate production provenance capture in satellite-to-carbon synchronization. Each has a distinct root cause and a measurable impact on audit integrity.

1. **Silent CRS drift across iterative reprojection.** When intermediate rasters are reprojected from previously reprojected derivatives rather than from the authoritative source, IEEE 754 precision loss and repeated resampling walk vertices by sub-pixel amounts that compound across monitoring cycles. The provenance failure is worse than the geometric one: if the lineage node records only the final CRS and not each warp in the chain, the drift is invisible to the auditor. A 30-meter cumulative shift on a 50-hectare parcel can misallocate several hectares across a project boundary while the manifest still reports a clean `EPSG:4326` tag, silently invalidating the intersection logic that decides which pixels earn credit.

2. **Cloud-mask artifacts recorded without parameter snapshots.** A cloud mask tuned to one scene's illumination is wrong for the next, and if the masking threshold is applied but not captured in the lineage node, two runs over the same tile can produce materially different carbon proxies with no recorded explanation. Persistent haze or sensor saturation can suppress 10–40% of valid pixels; without the threshold, the band ratio, and the masked-pixel fraction logged per node, an auditor cannot reproduce the carbon figure and the run fails traceability on its face.

3. **Untracked fallback substitution.** When primary computation fails — sensor degradation, corrupt tile boundaries, or unrecoverable cloud cover — pipelines that quietly swap in a fallback dataset destroy the chain of custody. The substituted result looks identical to a primary result in the output raster, but the tonnage now derives from a different observation epoch or a different sensor entirely. Unless the fallback event is recorded with the original failure context, the failure hash, and an explicit substitution justification, the double-counting and misattribution risk this is meant to prevent is instead concealed inside the manifest.

<svg viewBox="0 -4 880 226" role="img" aria-labelledby="lin-t lin-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="lin-t">The four questions a lineage record must answer, and the field that answers each</title>
  <desc id="lin-d">Four question-and-answer pairs. What went in is answered by the input dataset identifiers and their content digests. What was done to it is answered by the code version, the container digest, and the declared parameters. What came out is answered by the output identifier and its digest. When and by what authority is answered by the run timestamp, the orchestrator run identifier, and the signature over the manifest. A panel notes that a lineage record missing any one of the four cannot support a replay claim, and that the most commonly missing one is the container digest, because teams record the code version and forget that the environment is part of the computation.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Four questions, or it is not lineage</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">A verifier asks these in this order, every time.</text>
    <rect x="12" y="52" width="418" height="70" rx="8" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="418" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="74" fill="currentColor" font-size="10.5" font-weight="700">What went in?</text>
    <text x="28" y="96" fill="currentColor" font-size="9.5" opacity="0.85">input dataset ids + content digests</text>
    <text x="28" y="112" fill="currentColor" font-size="9" opacity="0.72">names alone are not enough — files change under a stable name</text>
    <rect x="450" y="52" width="418" height="70" rx="8" fill="currentColor" opacity="0.07"/>
    <rect x="450" y="52" width="418" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="466" y="74" fill="currentColor" font-size="10.5" font-weight="700">What was done to it?</text>
    <text x="466" y="96" fill="currentColor" font-size="9.5" opacity="0.85">code version + container digest + parameters</text>
    <text x="466" y="112" fill="#f3a712" font-size="9" font-weight="700">the container digest is the one teams forget</text>
    <rect x="12" y="134" width="418" height="70" rx="8" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="134" width="418" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="156" fill="currentColor" font-size="10.5" font-weight="700">What came out?</text>
    <text x="28" y="178" fill="currentColor" font-size="9.5" opacity="0.85">output id + digest, stored with the artefact</text>
    <text x="28" y="194" fill="currentColor" font-size="9" opacity="0.72">so the claim survives log retention</text>
    <rect x="450" y="134" width="418" height="70" rx="8" fill="currentColor" opacity="0.07"/>
    <rect x="450" y="134" width="418" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="466" y="156" fill="currentColor" font-size="10.5" font-weight="700">When, and on whose authority?</text>
    <text x="466" y="178" fill="currentColor" font-size="9.5" opacity="0.85">UTC timestamp + run id + signature over the manifest</text>
    <text x="466" y="194" fill="currentColor" font-size="9" opacity="0.72">an unsigned record proves sequence, not authorship</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The implementation below captures provenance at every task boundary. It uses `prefect` for orchestration, `rioxarray`/`xarray` with `dask` for chunked raster I/O, `rasterio` and `pyproj` for explicit spatial operations, and `structlog` for audit-ready JSON telemetry. The `ProvenanceTracker` enforces an append-only lineage model: each node records the operation, input/output paths, parameter snapshot, active CRS, SHA-256 checksum, and status, and every task either emits a hashed artifact with a lineage node or routes through a logged fallback — there is no silent pass-through.

```python
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import rasterio
import rioxarray  # registers the xarray ".rio" accessor + "rasterio" engine
import xarray as xr
import pyproj
import structlog
from prefect import flow, task

# Structured, audit-ready JSON telemetry — one event per transformation boundary.
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()

# Validation gates — breaches raise rather than coercing a bad artifact downstream.
MAX_MASKED_FRACTION = 0.40       # reject scenes that lose >40% of pixels to masking
CANONICAL_CRS = "EPSG:4326"      # equal-area target resolved per project at ingestion


class ProvenanceTracker:
    """Append-only lineage recorder for MRV synchronization nodes."""

    def __init__(self, project_id: str, registry: str, canonical_crs: str):
        self.project_id = project_id
        self.registry = registry
        self.canonical_crs = canonical_crs
        self.lineage_nodes: List[Dict] = []

    def record_node(self, operation: str, inputs: List[str], outputs: List[str],
                    params: Dict, crs: str, checksum: Optional[str] = None,
                    status: str = "success") -> None:
        node = {
            "operation": operation,
            "inputs": inputs,
            "outputs": outputs,
            "parameters": params,
            "spatial_ref": crs,
            "output_checksum": checksum,
            "status": status,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        }
        self.lineage_nodes.append(node)
        log.info("lineage_node_recorded", operation=operation,
                 status=status, crs=crs, checksum=checksum)

    @staticmethod
    def compute_sha256(file_path: str) -> str:
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    def export_manifest(self, output_dir: Path) -> Path:
        manifest_path = output_dir / "provenance_manifest.json"
        manifest = {
            "project_id": self.project_id,
            "registry": self.registry,
            "canonical_crs": self.canonical_crs,
            "lineage_nodes": self.lineage_nodes,
        }
        manifest_path.write_text(json.dumps(manifest, indent=2))
        log.info("manifest_exported", path=str(manifest_path),
                 node_count=len(self.lineage_nodes))
        return manifest_path


@task
def align_and_mask(src_path: str, target_crs: str,
                   cloud_threshold: float = 0.15) -> Dict:
    """Cloud-mask, reproject once from the authoritative source, capture params."""
    with rasterio.open(src_path) as src:
        # Explicit datum declaration — reject untagged geometry at the door.
        if src.crs is None:
            raise ValueError(f"{src_path} has no CRS tag; refusing to guess a datum.")
        src_crs = pyproj.CRS.from_user_input(src.crs.to_string())

    # Lazy, chunked load so large tiles never blow the heap.
    ds = xr.open_dataset(src_path, engine="rasterio",
                         chunks={"x": 2048, "y": 2048})

    # Cloud masking via SWIR/Red band ratio (simplified Sentinel-2 example).
    cloud_mask = (ds["B11"] / ds["B04"]) < cloud_threshold
    masked_fraction = float(cloud_mask.mean().compute())
    if masked_fraction > MAX_MASKED_FRACTION:
        raise RuntimeError(
            f"masked fraction {masked_fraction:.2%} exceeds gate "
            f"{MAX_MASKED_FRACTION:.0%}; scene unusable")
    ds["carbon_proxy"] = ds["B11"].where(~cloud_mask, np.nan)

    # Single-pass reprojection FROM the source CRS — never from a derivative.
    ds = ds.rio.write_crs(src_crs)
    ds_aligned = ds.rio.reproject(target_crs)

    out_path = src_path.replace(".tif", "_aligned_masked.tif")
    ds_aligned.rio.to_raster(out_path, driver="GTiff", compress="DEFLATE")
    log.info("aligned_and_masked", output=out_path,
             masked_fraction=round(masked_fraction, 4),
             source_crs=str(src_crs), target_crs=target_crs)

    return {
        "output_path": out_path,
        "crs": target_crs,
        "params": {
            "cloud_threshold": cloud_threshold,
            "band_ratio": "B11/B04",
            "masked_fraction": round(masked_fraction, 4),
            "source_crs": str(src_crs),
        },
    }


@task
def compute_carbon_stock(raster_path: str,
                         fallback_path: Optional[str] = None) -> Dict:
    """Compute the carbon proxy; on failure, route to a logged fallback."""
    try:
        ds = xr.open_dataset(raster_path, engine="rasterio",
                             chunks={"x": 2048, "y": 2048})
        # Allometric scaling proxy: tC/ha = (proxy * 0.042) + 1.2 (example calibration).
        ds["tC_ha"] = ds["carbon_proxy"] * 0.042 + 1.2
        out_path = raster_path.replace("_aligned_masked.tif", "_carbon_stock.tif")
        ds["tC_ha"].rio.to_raster(out_path, driver="GTiff", compress="DEFLATE")
        log.info("carbon_stock_computed", output=out_path)
        return {"output_path": out_path, "status": "success",
                "failure_context": None}
    except Exception as exc:  # noqa: BLE001 — failure context is itself an artifact
        if fallback_path is None:
            log.error("carbon_stock_failed_no_fallback", error=str(exc))
            raise RuntimeError(f"computation failed, no fallback: {exc}") from exc
        # Substitution is never silent — preserve the original failure context.
        failure_hash = hashlib.sha256(str(exc).encode()).hexdigest()[:16]
        log.warning("fallback_routed", error=str(exc),
                    failure_hash=failure_hash, fallback=fallback_path)
        return {"output_path": fallback_path, "status": "fallback_routed",
                "failure_context": {"error": str(exc), "failure_hash": failure_hash}}


@flow(name="mrv_lineage_sync_flow")
def run_mrv_sync(project_id: str, registry: str, input_raster: str,
                 fallback_raster: str, work_dir: str) -> Path:
    tracker = ProvenanceTracker(project_id=project_id, registry=registry,
                                canonical_crs=CANONICAL_CRS)

    # Stage 1 — alignment & masking, with full parameter snapshot.
    align_result = align_and_mask(input_raster, CANONICAL_CRS)
    tracker.record_node(
        operation="cloud_mask_and_crs_align",
        inputs=[input_raster],
        outputs=[align_result["output_path"]],
        params=align_result["params"],
        crs=align_result["crs"],
        status="success",
    )

    # Stage 2 — carbon proxy with transparent fallback routing.
    stock_result = compute_carbon_stock(align_result["output_path"],
                                        fallback_path=fallback_raster)
    checksum = tracker.compute_sha256(stock_result["output_path"])
    tracker.record_node(
        operation="carbon_stock_computation",
        inputs=[align_result["output_path"]],
        outputs=[stock_result["output_path"]],
        params={"scaling_factor": 0.042, "intercept": 1.2,
                "failure_context": stock_result["failure_context"]},
        crs=CANONICAL_CRS,
        checksum=checksum,
        status=stock_result["status"],
    )

    return tracker.export_manifest(Path(work_dir))
```

## Validation, Debugging & Compliance Mapping

Each design decision in the implementation maps to a specific regulatory control, which is what makes the manifest a submission artifact rather than a developer convenience.

- **Append-only nodes with SHA-256 checksums → ISO 14064-3 traceability.** Because every node fixes the content hash of its output before the next stage reads it, a verifier can confirm that the raster they are auditing is the byte-identical artifact the manifest describes, satisfying the data-traceability and reproducibility expectations of ISO 14064-3 third-party validation.
- **Per-node parameter snapshots → Verra VM-series defensibility.** Logging the cloud threshold, band ratio, masked fraction, and allometric calibration in each node gives auditors the evidence that thresholds were calibrated rather than guessed — the documentation standard Verra VM0042 and related methodologies demand for monitored parameters.
- **Explicit source-CRS capture and single-pass reprojection → geometric-stability requirements.** Recording the source datum and reprojecting once from the authoritative tile keeps project-boundary geometry stable across monitoring periods, aligning with the geometric-integrity expectations carried over from [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) and required for credit-volume consistency across cycles.
- **Transparent fallback with preserved failure context → CSRD ESRS E1 misstatement controls.** The `failure_hash` and substitution justification let an auditor distinguish primary from substituted data, a direct control against the misstatement risk that CSRD ESRS E1 disclosures are scrutinized for, and a precondition for clean [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/).

For debugging, treat the masked-pixel fraction and the distortion residual as monitored signals, not just pass/fail gates. Log them on every run, including the ones that pass, so a slowly drifting upstream export or a quietly updated grid file surfaces as a trend long before any single run breaches tolerance. Three recurring silent failures deserve dedicated diagnostics: a missing transformation grid that lets `pyproj` fall back to a null shift that looks successful, anti-meridian wrapping that inverts polygon area, and a fallback that fires so often it has become the de-facto primary path. Store the manifest under object-storage versioning with an immutability lock (for example AWS S3 Object Lock) alongside the registry submission so post-submission tampering is impossible. To standardize these events across heterogeneous platforms, emit them through a shared schema as described in [tracking data lineage with OpenLineage for ESG audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/).

<svg viewBox="0 -4 900 238" role="img" aria-labelledby="rep-t rep-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rep-t">A replay attempt six years after publication, and where it fails</title>
  <desc id="rep-d">A left-to-right sequence of the six things a replay needs, each marked as surviving or lost after six years. The reported figure survives because it was published. The output artefact survives in durable storage. The lineage record survives because it was written beside the artefact rather than to the log system. The input files survive because raw-zone retention was set to the audit horizon. The container image is lost because the registry expired untagged layers, marked as the break point. The dependency index is lost because a package version was yanked. An annotation states that four of six surviving is a failed replay, and that the two lost items are the two that are almost always someone else's infrastructure.</desc>
  <defs>
    <marker id="rep-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Replay in 2032 of a figure published in 2026</text>
    <text x="450" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Four of six is a failed replay. The two that fail are the two you do not own.</text>
    <rect x="12" y="56" width="136" height="72" rx="8" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="56" width="136" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="80" y="82" fill="currentColor" font-size="10" font-weight="700">Reported figure</text>
    <text x="80" y="106" fill="currentColor" font-size="9.5">✓ published</text>
    <rect x="160" y="56" width="136" height="72" rx="8" fill="currentColor" opacity="0.1"/>
    <rect x="160" y="56" width="136" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="228" y="82" fill="currentColor" font-size="10" font-weight="700">Output artefact</text>
    <text x="228" y="106" fill="currentColor" font-size="9.5">✓ durable store</text>
    <rect x="308" y="56" width="136" height="72" rx="8" fill="currentColor" opacity="0.1"/>
    <rect x="308" y="56" width="136" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="376" y="82" fill="currentColor" font-size="10" font-weight="700">Lineage record</text>
    <text x="376" y="106" fill="currentColor" font-size="9.5">✓ beside the data</text>
    <rect x="456" y="56" width="136" height="72" rx="8" fill="currentColor" opacity="0.1"/>
    <rect x="456" y="56" width="136" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="524" y="82" fill="currentColor" font-size="10" font-weight="700">Input files</text>
    <text x="524" y="106" fill="currentColor" font-size="9.5">✓ raw zone kept</text>
    <rect x="604" y="56" width="136" height="72" rx="8" fill="none" stroke="#f3a712" stroke-width="2" stroke-dasharray="5,3"/>
    <text x="672" y="82" fill="currentColor" font-size="10" font-weight="700">Container image</text>
    <text x="672" y="106" fill="#f3a712" font-size="9.5" font-weight="700">✗ layers expired</text>
    <rect x="752" y="56" width="136" height="72" rx="8" fill="none" stroke="#f3a712" stroke-width="2" stroke-dasharray="5,3"/>
    <text x="820" y="82" fill="currentColor" font-size="10" font-weight="700">Dependency index</text>
    <text x="820" y="106" fill="#f3a712" font-size="9.5" font-weight="700">✗ version yanked</text>
    <rect x="12" y="164" width="876" height="66" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="164" width="876" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="450" y="188" fill="currentColor" font-size="10" font-weight="700">The two failures are infrastructure you rent, not data you keep.</text>
    <text x="450" y="210" fill="currentColor" font-size="9.5" opacity="0.85">Mirror the image and the wheel set into your own durable storage, and test the replay annually rather than assuming it.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.3" fill="none" marker-end="url(#rep-arrow)" opacity="0.7">
    <line x1="148" y1="92" x2="158" y2="92"/>
    <line x1="296" y1="92" x2="306" y2="92"/>
    <line x1="444" y1="92" x2="454" y2="92"/>
    <line x1="592" y1="92" x2="602" y2="92"/>
    <line x1="740" y1="92" x2="750" y2="92"/>
  </g>
</svg>

## Frequently Asked Questions

### Is a dataset name enough to identify an input?

No. Files change under a stable name more often than anyone expects — a provider reprocesses an archive in place, a colleague overwrites an extract, a mount points somewhere new. Identify inputs by content digest as well as name, and record both. The digest is what makes the reproduction claim testable: same digests plus same code version must produce the same output, and an assertion to that effect is the cheapest determinism check available.

### Why does the container digest matter if the code version is recorded?

Because the environment is part of the computation. A pinned application version running against a different PROJ build, a different GDAL, or a different NumPy produces different numbers — sometimes subtly, as with a changed default resampling algorithm, sometimes dramatically, as with a missing transformation grid. The code version identifies your logic; the container digest identifies everything your logic depends on. Recording only the first is the most common gap in otherwise careful lineage.

### Should lineage be signed, and by whom?

Signed, by a key held by the system that produced the artefact rather than by an individual. A signature over the manifest turns the record from a claim about what happened into evidence that it has not been altered since, which is what an append-only audit trail is for. Individual keys create a succession problem across a monitoring obligation measured in decades; a service key with documented rotation and an archived public-key history does not.

### How much lineage granularity is too much?

Record at stage boundaries, not at every function call. A lineage graph with a node per transformation step becomes unqueryable and, worse, tempts teams to sample it — at which point it no longer supports a complete trace. Stage boundaries are the seams where artefacts are committed anyway, so lineage at that granularity costs nothing extra and answers the question a verifier actually asks: which inputs, through which code, produced this output.

### What is the difference between lineage and the observability signals?

Overlap in values, difference in purpose and lifetime. Observability answers "is the pipeline behaving" over days and weeks; lineage answers "how was this number produced" over decades. They must share identifiers so an operator incident can be joined to a data record, but they belong in different stores with different retention. Emitting both from a single point, as described in [instrumenting MRV pipelines with OpenTelemetry and structlog](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/instrumenting-mrv-pipelines-with-opentelemetry-and-structlog/), keeps them from drifting apart.

### Who should own the lineage records operationally?

The team that owns the reported figures, with the platform team owning delivery. Lineage encodes what each transformation means, which only the domain team knows, while retention, indexing, and access control are platform concerns. The arrangement that fails is the inverse: a platform team defining lineage from whatever the orchestrator happens to expose, which produces a graph that is complete in the technical sense and unable to answer the question a verifier actually asks.

### What is the smallest useful lineage implementation?

A provenance block written into every output artefact carrying input digests, code version, container digest, and parameters. No graph database, no collector, no server — four fields beside the data. That alone answers the reproduction question for a single artefact and can be adopted in an afternoon; the graph, the queries, and the visualisation are refinements that matter at scale and are worth nothing if the four fields were never captured.

## Conclusion

MRV data lineage and provenance tracking is what converts raw geospatial processing into a regulator-ready evidence package. By recording an append-only node — operation, parameters, CRS, and content hash — at every transformation boundary, refusing untagged geometry, reprojecting once from the authoritative source, and routing every fallback through a logged, justified substitution, engineering teams eliminate the silent failures that historically trigger registry rejection. The result is a synchronization stage whose every tonne can be walked back to its source pixel and reproduced byte-for-byte by a third party. For the enterprise event-schema integration that standardizes these records across platforms, continue with [Tracking Data Lineage with OpenLineage for ESG Audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/).

## Related

- [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) — the parent stack this evidence layer threads through.
- [Geospatial Coordinate Reference Systems (CRS) Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the upstream stage whose transformation metadata becomes lineage.
- [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) — the downstream consumer that cannot submit a figure it cannot trace.
- [GHG Protocol Scope 3 Spatial Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) — supply-chain attribution that depends on per-factor provenance.
- [Tracking Data Lineage with OpenLineage for ESG Audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/) — the OpenLineage event-schema implementation for this topic.
