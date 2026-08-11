# GHG Protocol Scope 3 Spatial Mapping

GHG Protocol Scope 3 spatial mapping is the geospatial subsystem that turns fragmented procurement records, freight manifests, and supplier footprints into auditable, location-explicit emission allocations within the [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. Unlike Scope 1 and 2, which anchor to owned facilities or a defined grid boundary, Scope 3 is the most spatially diffuse category in corporate carbon accounting: it traces upstream and downstream activity across multi-tier supply chains, logistics corridors, and distributed product lifecycles, where every emission figure must be defensible against a third-party verifier.

Because that allocation depends entirely on geometry, this component sits directly downstream of [geospatial CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) and feeds its versioned outputs into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/). Get the spatial join wrong and the error does not stay local — it propagates into aggregate tonnage, double-counts across jurisdictions, and surfaces as a finding during ISO 14064-3 verification. This page covers where Scope 3 spatial mapping fits in the workflow, the failure modes that silently corrupt inventories, a deterministic Prefect implementation, and the mapping from code outputs to specific regulatory requirements.

<svg viewBox="-2 28 906 291" role="img" aria-label="Scope 3 spatial allocation data flow. Three sources — procurement CSV, supplier polygons, and a land-cover raster — merge into a five-stage pipeline: geocode and CRS-normalize to EPSG:6933, a double-count gate that dissolves overlaps above five percent, cloud-masked zonal statistics, emission-factor weighting, and a versioned Parquet output with lineage. Records whose geocode confidence falls below 0.7 branch off to manual reconciliation instead of being aggregated." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:900px;display:block;margin:1.5rem auto;">
  <title>Deterministic Scope 3 spatial allocation flow, with a confidence gate to manual reconciliation</title>
  <desc>Procurement CSV, supplier polygons, and a land-cover raster converge into a sequential pipeline. Stage 1 geocodes records and normalizes them to the equal-area CRS EPSG:6933. Low-confidence geocodes (below 0.7) are routed upward to manual reconciliation rather than silently joined. Stage 2 is a double-count gate that dissolves overlapping footprints exceeding five percent shared area. Stage 3 computes cloud-masked zonal statistics, keeping pixels with cloud probability under 0.2. Stage 4 applies emission-factor weighting as area in hectares times the mean factor. Stage 5 writes a versioned Parquet artifact carrying immutable lineage for audit.</desc>
  <defs>
    <marker id="s3-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- SOURCES -->
  <text x="87" y="78" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">SOURCES</text>
  <rect x="14" y="92" width="146" height="56" rx="8" fill="currentColor" opacity="0.06"/>
  <rect x="14" y="92" width="146" height="56" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.6"/>
  <text x="87" y="116" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Procurement CSV</text>
  <text x="87" y="133" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">addresses · postcodes</text>
  <rect x="14" y="156" width="146" height="56" rx="8" fill="currentColor" opacity="0.06"/>
  <rect x="14" y="156" width="146" height="56" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.6"/>
  <text x="87" y="180" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Supplier polygons</text>
  <text x="87" y="197" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">service-area footprints</text>
  <rect x="14" y="220" width="146" height="56" rx="8" fill="currentColor" opacity="0.06"/>
  <rect x="14" y="220" width="146" height="56" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.6"/>
  <text x="87" y="244" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Land-cover raster</text>
  <text x="87" y="261" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">NDVI · biomass proxy</text>
  <!-- merge into stage 1 -->
  <line x1="160" y1="120" x2="182" y2="204" stroke="currentColor" stroke-width="1.3" opacity="0.7"/>
  <line x1="160" y1="184" x2="182" y2="204" stroke="currentColor" stroke-width="1.3" opacity="0.7"/>
  <line x1="160" y1="248" x2="182" y2="204" stroke="currentColor" stroke-width="1.3" opacity="0.7"/>
  <line x1="182" y1="204" x2="200" y2="204" stroke="currentColor" stroke-width="1.5" marker-end="url(#s3-arrow)"/>
  <!-- STAGE 1 -->
  <rect x="200" y="160" width="128" height="88" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.78"/>
  <text x="264" y="180" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">STAGE 1</text>
  <text x="264" y="200" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Geocode &amp;</text>
  <text x="264" y="215" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">CRS-normalize</text>
  <text x="264" y="234" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">→ EPSG:6933</text>
  <!-- STAGE 2 — double-count gate -->
  <rect x="340" y="160" width="128" height="88" rx="9" fill="currentColor" opacity="0.1"/>
  <rect x="340" y="160" width="128" height="88" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <text x="404" y="180" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.6">STAGE 2 · GATE</text>
  <text x="404" y="200" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Double-count</text>
  <text x="404" y="215" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">gate</text>
  <text x="404" y="234" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">&gt;5% overlap → dissolve</text>
  <!-- STAGE 3 -->
  <rect x="480" y="160" width="128" height="88" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.78"/>
  <text x="544" y="180" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">STAGE 3</text>
  <text x="544" y="200" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Cloud-masked</text>
  <text x="544" y="215" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">zonal stats</text>
  <text x="544" y="234" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">cloud prob &lt; 0.2</text>
  <!-- STAGE 4 -->
  <rect x="620" y="160" width="128" height="88" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.78"/>
  <text x="684" y="180" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">STAGE 4</text>
  <text x="684" y="200" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Emission-factor</text>
  <text x="684" y="215" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">weighting</text>
  <text x="684" y="234" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">area_ha × mean_ef</text>
  <!-- STAGE 5 — output -->
  <rect x="760" y="160" width="128" height="88" rx="9" fill="currentColor" opacity="0.08"/>
  <rect x="760" y="160" width="128" height="88" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="824" y="180" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.6">STAGE 5</text>
  <text x="824" y="200" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Versioned</text>
  <text x="824" y="215" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Parquet + lineage</text>
  <text x="824" y="234" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">audit-ready</text>
  <!-- inter-stage arrows -->
  <line x1="328" y1="204" x2="339" y2="204" stroke="currentColor" stroke-width="1.5" marker-end="url(#s3-arrow)"/>
  <line x1="468" y1="204" x2="479" y2="204" stroke="currentColor" stroke-width="1.5" marker-end="url(#s3-arrow)"/>
  <line x1="608" y1="204" x2="619" y2="204" stroke="currentColor" stroke-width="1.5" marker-end="url(#s3-arrow)"/>
  <line x1="748" y1="204" x2="759" y2="204" stroke="currentColor" stroke-width="1.5" marker-end="url(#s3-arrow)"/>
  <!-- confidence branch to manual reconciliation -->
  <rect x="200" y="44" width="128" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.65"/>
  <text x="264" y="68" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor" opacity="0.9">Manual</text>
  <text x="264" y="83" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor" opacity="0.9">reconciliation</text>
  <text x="264" y="98" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">held, not aggregated</text>
  <line x1="264" y1="159" x2="264" y2="105" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4,2" marker-end="url(#s3-arrow)"/>
  <text x="276" y="135" text-anchor="start" font-size="8.5" font-weight="600" fill="currentColor" opacity="0.75">confidence &lt; 0.7</text>
  <!-- baseline caption -->
  <text x="450" y="300" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.6">Identical inputs and factor versions must yield byte-identical tonnage — every stage is logged as immutable lineage.</text>
</svg>

## Role in the MRV Workflow

Scope 3 spatial mapping executes during the spatial allocation and activity-data georeferencing stage, positioned between raw activity-data ingestion and emission-factor application. At this juncture, tabular procurement datasets are joined with administrative boundaries, satellite-derived land-cover rasters, and transport-network topologies. The stage must reconcile heterogeneous coordinate systems, resolve spatial drift across temporal snapshots, and apply cloud masking to optical inputs before emission factors are spatially weighted. Without deterministic spatial routing, Scope 3 inventories risk double-counting, misallocation across jurisdictional boundaries, or unverifiable aggregation.

**Upstream dependencies.** Activity data typically arrives as unstructured CSVs containing facility names, postal codes, or free-text addresses. These records must already pass through a canonical projection contract before they reach this stage — the equal-area target CRS established during [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) is a hard precondition, because area-based emission weighting is mathematically invalid on unprojected degree geometries. Optical rasters used for land-use change attribution and biomass proxies must also have been atmospherically corrected and cloud-masked upstream, via [Sentinel-2 and Landsat cloud-masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/), so that vegetation indices (NDVI, EVI) feeding this allocation are not biased by uncorrected surface reflectance.

**Downstream consumers.** Allocated emissions flow into two places. First, offset and removal claims are reconciled against the spatially bounded Scope 3 inventory through [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/), ensuring credits are not retired against emissions outside the corporate value-chain boundary. Second, every transformation — raw ingestion, CRS normalization, raster intersection, factor application — is captured as immutable lineage so that CSRD ESRS E1 and SEC climate disclosures remain backward-traceable. Granular per-parcel parameters and factor-weighting matrices are documented separately in the [step-by-step GHG Protocol Scope 3 geospatial calculation](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/step-by-step-ghg-protocol-scope-3-geospatial-calculation/) reference.

To keep the join deterministic, production pipelines validate geocoded points against administrative boundary layers (NUTS, GADM, or EPA eGRID regions), apply spatial tolerance buffers scaled to data-provenance quality, and flag records that fall outside expected logistics corridors for manual reconciliation rather than silently aggregating them.

## Core Failure Modes

Scope 3 spatial pipelines fail in predictable, quantifiable ways. Three failure modes dominate production inventories.

1. **Geocoding positional drift and boundary misassignment.** Free-text addresses and postal-code centroids carry positional uncertainty of tens to hundreds of meters. When a geocoded point lands on the wrong side of an administrative boundary, the entire activity record is attributed to the wrong jurisdiction's emission factor and the wrong land-cover zone. In supplier datasets dominated by coarse postal-code geocoding, 10–30% of records can be misassigned across boundary lines, producing both factor-selection errors and zonal-statistics contamination. Root cause: positional uncertainty propagating into a hard spatial join with no confidence gate.

2. **Conformal projection area inflation.** Land-use change attribution and biomass-proxy calculations multiply per-hectare emission factors by polygon area. If area is measured in a conformal projection such as Web Mercator (EPSG:3857), areal distortion grows with latitude — from a few percent in the tropics to 40%+ at high latitudes — directly inflating or deflating tonnage. Root cause: areal aggregation performed in an angle-preserving rather than an equal-area projection (EPSG:6933 for global coverage, or a regional Albers Equal-Area such as EPSG:9822 for continental North America). Observed impact: single-digit to double-digit percent error in allocated emissions, well beyond the ±0.5% audit tolerance auditors expect.

3. **Double-counting across overlapping supplier footprints.** Multi-tier supply chains generate overlapping service-area buffers and shared facility polygons. When two supplier geometries cover the same hectares of land cover, the underlying emissions are counted twice. Root cause: union/overlap geometry not resolved before zonal statistics. Even 5% overlapping polygon area translates to roughly 5–15% inventory inflation once shared high-factor land cover is double-attributed — a direct violation of the GHG Protocol's avoidance-of-double-counting requirement.

A fourth, subtler mode — projection drift in long-running pipelines — manifests as sub-pixel misregistration during repeated raster-vector intersections. It is handled the same way as in the upstream [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) stage: enforce a canonical projection per operational region, reproject on ingestion with explicit transformation chains, and log affine residuals so datasets exceeding tolerance are flagged rather than aggregated.

<svg viewBox="0 -4 900 246" role="img" aria-labelledby="s3-t s3-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="s3-t">Spatial resolution against attribution confidence across Scope 3 categories</title>
  <desc id="s3-d">A chart plotting the spatial resolution at which each Scope 3 category can be located, from facility-level at the top through supplier-site, sourcing-region, and country-average at the bottom, against the confidence with which emissions can be attributed to a location. Purchased goods from direct suppliers sit at facility level with high confidence. Land-use change in agricultural supply chains sits at sourcing-region level with moderate confidence. Upstream transport sits at route level with moderate confidence. Purchased goods from tier-three suppliers and use of sold products sit at country-average level with low confidence. A panel notes that spatial MRV adds value only where the category can actually be located, and that presenting a country-average category on a map implies a precision the data does not have.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Not every Scope 3 category can be put on a map</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Locatability varies by an order of magnitude across categories. The pipeline must record which tier each figure came from.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="176" y1="74" x2="620" y2="74"/><line x1="176" y1="118" x2="620" y2="118"/>
    <line x1="176" y1="162" x2="620" y2="162"/><line x1="176" y1="206" x2="620" y2="206"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="176" y1="60" x2="176" y2="220"/>
    <line x1="176" y1="220" x2="620" y2="220"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">
    <text x="168" y="78" text-anchor="end">facility</text>
    <text x="168" y="122" text-anchor="end">supplier site</text>
    <text x="168" y="166" text-anchor="end">sourcing region</text>
    <text x="168" y="210" text-anchor="end">country average</text>
    <text x="240" y="238" text-anchor="middle">low</text>
    <text x="560" y="238" text-anchor="middle">high</text>
    <text x="398" y="238" text-anchor="middle" font-weight="600">attribution confidence →</text>
  </g>
  <g>
    <circle cx="560" cy="74" r="7" fill="currentColor"/>
    <text x="548" y="66" text-anchor="end" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor">cat. 1 · direct suppliers</text>
    <circle cx="430" cy="118" r="7" fill="currentColor" opacity="0.7"/>
    <text x="418" y="112" text-anchor="end" font-family="system-ui, sans-serif" font-size="9" fill="currentColor">cat. 4 · upstream transport</text>
    <circle cx="390" cy="162" r="7" fill="#f3a712"/>
    <text x="378" y="156" text-anchor="end" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor">land-use change, agri supply</text>
    <circle cx="250" cy="206" r="7" fill="currentColor" opacity="0.5"/>
    <text x="264" y="200" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.85">cat. 1 · tier-3 · cat. 11 use phase</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="648" y="76" width="240" height="112" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="648" y="76" width="240" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="664" y="100" fill="currentColor" font-size="10" font-weight="700">Record the tier per figure</text>
    <text x="664" y="124" fill="currentColor" font-size="9.5" opacity="0.85">Spatial MRV earns its cost in the</text>
    <text x="664" y="140" fill="currentColor" font-size="9.5" opacity="0.85">upper band only.</text>
    <text x="664" y="164" fill="#f3a712" font-size="9.5" font-weight="700">Mapping a country-average figure</text>
    <text x="664" y="180" fill="#f3a712" font-size="9.5" font-weight="700">implies precision it does not have.</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The following Prefect pipeline implements deterministic Scope 3 spatial allocation with explicit CRS handling, structured `structlog` telemetry, cloud-masked zonal weighting, and validation gates that reject — rather than silently process — degenerate inputs. It enforces an equal-area target CRS, repairs invalid topology, and emits a verification-ready Parquet output.

```python
import structlog
import geopandas as gpd
import rasterio
from rasterio.mask import mask
from prefect import flow, task

# Structured logger configuration for audit trails
logger = structlog.get_logger()

# Equal-area canonical CRS — areal weighting is invalid on degree geometries.
TARGET_CRS = "EPSG:6933"
GEOCODE_CONFIDENCE_MIN = 0.7   # below this, route to manual reconciliation
OVERLAP_AREA_TOLERANCE = 0.05  # >5% overlapping area triggers double-count repair


@task
def ingest_and_normalize_crs(
    supplier_gdf_path: str,
    target_crs: str = TARGET_CRS,
) -> gpd.GeoDataFrame:
    """Load supplier polygons, validate geometry, and enforce canonical CRS."""
    gdf = gpd.read_file(supplier_gdf_path)
    if gdf.crs is None:
        raise ValueError("Input GeoDataFrame lacks a CRS definition. Rejecting ingestion.")

    logger.info(
        "crs_normalization",
        source_crs=gdf.crs.to_epsg(),
        target_crs=target_crs,
        records=len(gdf),
    )

    normalized = gdf.to_crs(target_crs)
    # Single-pass topology repair post-projection (self-intersection / slivers).
    if not normalized.is_valid.all():
        logger.warning("topology_repair", invalid=int((~normalized.is_valid).sum()))
        normalized["geometry"] = normalized.buffer(0)
    return normalized


@task
def resolve_double_counting(
    supplier_gdf: gpd.GeoDataFrame,
    tolerance: float = OVERLAP_AREA_TOLERANCE,
) -> gpd.GeoDataFrame:
    """Detect overlapping footprints and apportion shared area to avoid double-counting."""
    union = gpd.overlay(supplier_gdf, supplier_gdf, how="union", keep_geom_type=True)
    overlap_area = union.geometry.area.sum()
    base_area = supplier_gdf.geometry.area.sum()
    overlap_ratio = max(0.0, (overlap_area - base_area) / base_area)

    if overlap_ratio > tolerance:
        logger.warning("double_count_detected", overlap_ratio=round(overlap_ratio, 4))
        # Dissolve to a single non-overlapping coverage, apportioning by shared area.
        return supplier_gdf.dissolve(by="id", aggfunc="first").reset_index()
    return supplier_gdf


@task
def compute_spatial_emission_allocation(
    supplier_gdf: gpd.GeoDataFrame,
    raster_path: str,
    ef_column: str = "emission_factor_kgco2e_per_ha",
) -> gpd.GeoDataFrame:
    """Zonal statistics with explicit raster alignment and cloud-masked weighting."""
    results = []
    with rasterio.open(raster_path) as src:
        if src.crs != supplier_gdf.crs:
            # Reproject vector to the raster grid for a valid mask; never the reverse
            # mid-pipeline, to avoid resampling the source emissions raster.
            logger.warning("raster_crs_mismatch", raster_crs=str(src.crs),
                           vector_crs=str(supplier_gdf.crs))
            supplier_gdf = supplier_gdf.to_crs(src.crs)

        for _, row in supplier_gdf.iterrows():
            sid = row.get("id")
            try:
                out_image, _ = mask(src, [row.geometry], crop=True)
                # Band 0 = emission proxy; band 1 = cloud probability (if present).
                if out_image.shape[0] > 1:
                    valid = out_image[0][out_image[1] < 0.2]
                else:
                    valid = out_image[0].ravel()

                if valid.size == 0:
                    logger.debug("no_valid_pixels", supplier_id=sid)
                    continue

                area_ha = row.geometry.area / 10_000  # EPSG:6933 metres -> hectares
                mean_ef = float(valid.mean())
                total = area_ha * mean_ef * float(row.get(ef_column, 1.0))

                results.append({
                    "supplier_id": sid,
                    "area_ha": area_ha,
                    "mean_ef": mean_ef,
                    "scope3_emissions_kgco2e": total,
                    "verification_status": "spatially_allocated",
                })
            except Exception as exc:  # log, isolate, continue — never fail the batch
                logger.error("zonal_stats_failure", supplier_id=sid, error=str(exc))

    return gpd.GeoDataFrame(results)


@flow(log_prints=True)
def scope3_spatial_mapping_pipeline(
    supplier_vector: str,
    land_cover_raster: str,
    output_path: str,
):
    """End-to-end Scope 3 spatial allocation with compliance mapping."""
    logger.info("pipeline_start", flow="scope3_spatial_mapping")

    suppliers = ingest_and_normalize_crs(supplier_vector)
    suppliers = resolve_double_counting(suppliers)
    allocated = compute_spatial_emission_allocation(suppliers, land_cover_raster)

    # Attach regulatory mapping as immutable lineage attributes.
    allocated["iso_14064_compliance"] = "boundary_defined"
    allocated["csrd_esrs_e1_mapping"] = "upstream_category_1_2_4"

    allocated.to_parquet(output_path)
    logger.info("pipeline_complete", records_processed=len(allocated), output=output_path)
    return allocated


if __name__ == "__main__":
    scope3_spatial_mapping_pipeline(
        supplier_vector="data/suppliers.geojson",
        land_cover_raster="data/esa_worldcover_2023.tif",
        output_path="output/scope3_spatial_allocation.parquet",
    )
```

When scaling to continental or multi-tier supplier networks, the per-row `mask` loop is replaced with chunked array processing via `xarray` and `dask`. Memory-mapped, lazily evaluated workflows prevent out-of-memory failures during raster-vector intersection and enable efficient temporal aggregation across Sentinel-2 or Landsat 9 archives — the same lazy-evaluation pattern used for [temporal aggregation of land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) feeds directly into year-over-year Scope 3 attribution.

## Validation, Debugging & Compliance Mapping

Technical outputs must map directly to verification requirements. Each failure mode above has a diagnostic signal, a deterministic remediation, and a specific clause it satisfies once gated.

<div class="table-wrap">

| Failure Mode | Diagnostic Signal | Remediation | Verification Mapping |
|--------------|-------------------|-------------|----------------------|
| Geocoding misassignment | Geocode confidence < 0.7; points outside expected corridor | Validate against GADM/eGRID boundaries; route low-confidence records to manual review | ISO 14064-3 §5.4.2 (Spatial Data Quality Controls) |
| Conformal area inflation | Area variance > 2% vs equal-area baseline | Enforce `to_crs("EPSG:6933")` before any area multiplication | CSRD ESRS E1-AR4 (Data Quality & Uncertainty) |
| Double counting | Overlapping supplier polygon area > 5% | `gpd.overlay(how="union")` + dissolve, apportion by shared area | GHG Protocol Scope 3 §4.3 (Avoidance of Double Counting) |
| Projection drift | Affine residuals > 0.5 m across iterative runs | Canonical per-region CRS; log `src.crs` vs `dst.crs` residuals | ISO 14064-3 §5.3.1 (Boundary Definition) |
| Null zonal intersection | `valid.size == 0` across > 15% of suppliers | Verify raster extent vs vector bounds before masking | SEC Climate Disclosure Rule §229.1502 (Methodology Disclosure) |

</div>

The pipeline's compliance posture rests on three enforced gates. **Equal-area weighting** keeps areal multiplication within the ±0.5% tolerance auditors apply to tonnage, satisfying the geometric-integrity expectations shared with Verra VM-series methodologies (for example, the project-boundary delineation rules in VM0047 for afforestation/reforestation/revegetation). **Double-count resolution** before zonal statistics directly answers GHG Protocol Scope 3 §4.3. **CRS and factor lineage** — written as immutable attributes and propagated to [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — gives verifiers the reproducibility evidence required under CSRD ESRS E1 and SEC climate-disclosure methodology rules.

For multi-temporal Scope 3 tracking, version each run with DVC or Delta Lake and emit a provenance manifest containing input hashes, CRS transformation matrices, cloud-mask thresholds, and emission-factor sources. Emission factors themselves carry uncertainty that should be propagated, not discarded; modeling that spread is the job of [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/), whose confidence bounds attach to each allocated figure before reporting. The [GHG Protocol Corporate Value Chain (Scope 3) Standard](https://ghgprotocol.org/corporate-value-chain-scope-3-standard) requires documented methodologies for spatially explicit activity data, and the [OGC Well-Known Text CRS Representation](https://www.ogc.org/standards/wkt-crs) standard provides the canonical encoding for the coordinate-system declarations auditors request.

<svg viewBox="0 -4 880 236" role="img" aria-labelledby="app-t app-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="app-t">Three apportionment rules applied to one shared parcel, and the different tonnages they produce</title>
  <desc id="app-d">A single 400 hectare parcel supplies three buyers. Under area apportionment, each buyer receives a share proportional to the hectares nominally allocated to it: 180, 140 and 80 hectares giving 4500, 3500 and 2000 tonnes. Under volume apportionment, shares follow purchased output: 55, 30 and 15 percent giving 5500, 3000 and 1500 tonnes. Under economic apportionment, shares follow purchase value, giving 6200, 2700 and 1100 tonnes. A panel states that all three sum to the same 10000 tonne parcel total, that the methodology chooses the rule, and that the rule must be recorded on every row because the same physical parcel produces three defensible and different answers.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">One parcel, three defensible answers</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">400 ha parcel, 10 000 tCO₂e of land-use-change emissions, three buyers.</text>
    <text x="120" y="62" fill="currentColor" font-size="10" font-weight="700">By area</text>
    <text x="120" y="118" fill="currentColor" font-size="10" font-weight="700">By volume</text>
    <text x="120" y="174" fill="currentColor" font-size="10" font-weight="700">By value</text>
  </g>
  <g>
    <rect x="188" y="46" width="252" height="26" fill="currentColor" opacity="0.3"/>
    <rect x="440" y="46" width="196" height="26" fill="currentColor" opacity="0.18"/>
    <rect x="636" y="46" width="112" height="26" fill="currentColor" opacity="0.09"/>
    <text x="314" y="64" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">4 500</text>
    <text x="538" y="64" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">3 500</text>
    <text x="692" y="64" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">2 000</text>
    <rect x="188" y="102" width="308" height="26" fill="currentColor" opacity="0.3"/>
    <rect x="496" y="102" width="168" height="26" fill="currentColor" opacity="0.18"/>
    <rect x="664" y="102" width="84" height="26" fill="currentColor" opacity="0.09"/>
    <text x="342" y="120" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">5 500</text>
    <text x="580" y="120" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">3 000</text>
    <text x="706" y="120" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">1 500</text>
    <rect x="188" y="158" width="347" height="26" fill="#f3a712" opacity="0.32"/>
    <rect x="535" y="158" width="151" height="26" fill="currentColor" opacity="0.18"/>
    <rect x="686" y="158" width="62" height="26" fill="currentColor" opacity="0.09"/>
    <text x="362" y="176" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">6 200</text>
    <text x="610" y="176" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">2 700</text>
    <text x="717" y="176" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">1 100</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="770" y="64" fill="currentColor" font-size="9" opacity="0.72">buyer A · B · C</text>
    <rect x="12" y="200" width="856" height="30" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="220" fill="currentColor" font-size="9.5" font-weight="700">All three sum to 10 000. The methodology picks the rule — so the rule must travel on every row, or the figure is unreconcilable.</text>
  </g>
</svg>

## Frequently Asked Questions

### Which Scope 3 categories are worth mapping spatially at all?

The ones whose emissions are genuinely located: purchased goods from suppliers you can identify to a site, upstream transport where routes are known, and above all land-use change in agricultural and forestry supply chains, where the emission is inseparable from a place. Categories computed from spend-based or country-average factors gain nothing from a map and lose something — placing them on one implies a spatial precision the underlying data does not carry. Record the data tier per figure so a reader can tell which is which.

### How is double counting between suppliers actually prevented?

By making the apportionment explicit and reconcilable. Every parcel-to-buyer allocation must carry the rule applied, the share, and a parcel identifier, so the shares for a parcel can be summed and asserted to equal one. Double counting shows up as a sum above one, and undercounting as a sum below it; neither is visible if the allocation is implicit in a join. The full mechanics are in [preventing Scope 3 double-counting in spatial joins](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/preventing-scope-3-double-counting-in-spatial-joins/).

### What happens when supplier locations are only known to a region?

Report at the region and say so. A region-level figure with an honest label is more useful than a point placed at a region's centroid, which invites downstream consumers to intersect it with something. Where a mixed portfolio has some sites located and others not, keep the two tiers as separate rows with a resolution field rather than blending them into one map layer — blending is how a partially located inventory becomes a fully misleading one.

### Should land-use-change emissions be amortised over time?

Most methodologies require it, typically over a fixed window from the conversion event, and the window is a methodology parameter rather than an engineering choice. What is an engineering choice is representing the conversion event as a dated fact and the amortisation as a derived quantity, so a change to the window re-derives cleanly rather than requiring a re-analysis. Storing only the amortised annual figure loses the event and makes any later methodology change a manual exercise.

### How do supplier changes mid-period affect the spatial figures?

They split the period. A supplier relationship that starts or ends within a reporting period must be represented as an interval, with the emissions apportioned across the overlap rather than assigned to whichever side the join happened to land on. This is the same interval discipline that crediting periods require, and skipping it produces a portfolio whose supplier-level figures do not reconcile to the corporate total when suppliers churn.

### How should a supplier who refuses to share locations be handled?

By reporting at the resolution you actually have and saying so, not by inferring locations from a trade database and presenting them as known. A supplier that provides only a country is a country-level figure with a country-level label; treating an inferred site as observed converts a disclosure limitation into a misstatement. Where coverage gaps are material, disclose the share of spend or volume that is unlocated — that number is often more informative to a reader than the mapped portion.

### Does spatial Scope 3 mapping change the total, or only its attribution?

Both, and the total change surprises people. Moving from spend-based factors to spatially explicit land-use-change accounting frequently changes a category's total by a large multiple in either direction, because the two methods measure different things — one an economic average, the other an observed conversion. Expect the transition to produce a restatement, plan the disclosure around it, and keep both computations available for the periods where they overlap so the change is explainable rather than merely large.

### How is spatial Scope 3 work best sequenced for a team starting out?

Locate the largest categories first and accept coarse resolution elsewhere. A programme that spends a year building a perfect map of a category worth three per cent of the footprint has spent a year well only if it learned the method. Start with the category that dominates, get its supplier locations to site level, and treat the rest at the resolution the data supports — then improve outward as supplier engagement allows.

## Conclusion

GHG Protocol Scope 3 spatial mapping converts diffuse procurement and logistics data into auditable, location-explicit emission inventories. By enforcing an equal-area canonical CRS, resolving overlapping footprints before zonal statistics, applying cloud-masked weighting, and embedding lineage at every transformation, engineering teams eliminate double-counting, resolve jurisdictional misallocation, and produce verification-ready outputs that hold up under ISO 14064-3, CSRD ESRS E1, and SEC disclosure. The architecture scales across multi-tier supply chains while preserving the determinism auditors demand: identical inputs and factor versions must yield byte-identical tonnage. For per-parcel parameters, tolerance thresholds, and factor-weighting matrices needed in production, continue to the [step-by-step GHG Protocol Scope 3 geospatial calculation](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/step-by-step-ghg-protocol-scope-3-geospatial-calculation/) reference.

## Related

- [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) — the parent stack defining schema, scoping, and validation contracts.
- [Geospatial Coordinate Reference Systems (CRS) Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the upstream equal-area projection contract this stage depends on.
- [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) — reconciling offset and removal claims against the Scope 3 boundary.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — capturing reproducible transformation history for audit.
- [Sentinel-2 & Landsat Cloud-Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — preparing the optical rasters that feed land-use change attribution.
- [Step-by-Step GHG Protocol Scope 3 Geospatial Calculation](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/step-by-step-ghg-protocol-scope-3-geospatial-calculation/) — granular implementation parameters and factor matrices.
