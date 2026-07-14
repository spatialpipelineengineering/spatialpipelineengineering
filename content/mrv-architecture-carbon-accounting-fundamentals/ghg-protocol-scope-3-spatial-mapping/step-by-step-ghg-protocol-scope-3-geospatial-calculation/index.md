# Step-by-Step GHG Protocol Scope 3 Geospatial Calculation

This guide is the implementation reference for [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) — the parent component that turns procurement records and freight manifests into location-explicit emission allocations within the wider [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. Where that page frames *where* spatial mapping sits in the workflow, this one walks the exact per-record calculation: how a supplier geometry becomes a defensible tonne of CO₂-equivalent, gated, hashed, and ready for assurance.

The transition from spend-based allocation to facility- and route-level precision requires a deterministic spatial pipeline. Traditional implementations rely on macroeconomic averages that obscure regional grid intensities, transport modal splits, and localized land-use change signals. A geospatial calculation architecture resolves these blind spots but introduces strict engineering constraints: it depends on deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) at ingestion to keep areal math honest, and every transformation it performs must be recorded for [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) so an auditor can reconstruct any figure byte-for-byte. The sections below follow a single execution path — diagnose, transform, gate, audit, submit — that satisfies MRV verification requirements while staying computationally efficient at enterprise scale.

<svg viewBox="0 0 1000 384" role="img" aria-labelledby="ghg-t ghg-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ghg-t">Scope 3 geospatial calculation pipeline</title>
  <desc id="ghg-d">A five-stage execution path. Stage one normalizes supplier coordinates with fallback tiers; stage two runs a single-pass CRS alignment with drift control; stage three maps emission factors through route joins and modal splits; stage four runs the deterministic, vectorized calculation and writes an immutable audit hash. Stage five is a data-quality gate testing whether the record is at least DQ3 with sufficient precision: passing records flow to the corporate carbon ledger for assurance, failing records route to a remediation queue with supplier-outreach triggers.</desc>
  <defs>
    <marker id="ghg-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- stage boxes -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="14" y="36" width="216" height="78" rx="9"/>
      <rect x="262" y="36" width="216" height="78" rx="9"/>
      <rect x="510" y="36" width="216" height="78" rx="9"/>
      <rect x="758" y="36" width="216" height="78" rx="9"/>
    </g>
    <g fill="currentColor" font-size="12.5" font-weight="600">
      <text x="122" y="70">1 &#183; Spatial ingestion</text>
      <text x="370" y="70">2 &#183; CRS alignment</text>
      <text x="618" y="70">3 &#183; Emission factor map</text>
      <text x="866" y="70">4 &#183; Deterministic calc</text>
    </g>
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="122" y="92">coord normalize +</text>
      <text x="122" y="105">fallback tiers</text>
      <text x="370" y="92">single-pass projection</text>
      <text x="370" y="105">&#183; drift control</text>
      <text x="618" y="92">route joins &#183;</text>
      <text x="618" y="105">modal splits</text>
      <text x="866" y="92">vectorized core +</text>
      <text x="866" y="105">SHA-256 audit hash</text>
    </g>
    <!-- decision gate -->
    <polygon points="866,206 936,256 866,306 796,256" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor" font-weight="600">
      <text x="866" y="250" font-size="10.5">5 &#183; DQ gate</text>
      <text x="866" y="266" font-size="9.5" font-weight="400" opacity="0.82">&#8805; DQ3 &amp; prec?</text>
    </g>
    <!-- outcomes -->
    <rect x="380" y="224" width="300" height="60" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <text x="530" y="250" fill="#f3a712" font-size="12.5" font-weight="700">Corporate carbon ledger</text>
    <text x="530" y="270" fill="currentColor" font-size="9.5" opacity="0.82">compliant tier &#8594; third-party assurance</text>
    <rect x="380" y="308" width="300" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="530" y="334" fill="currentColor" font-size="12.5" font-weight="600">Remediation queue</text>
    <text x="530" y="354" fill="currentColor" font-size="9.5" opacity="0.82">supplier-outreach triggers</text>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#ghg-arrow)">
    <line x1="230" y1="75" x2="260" y2="75"/>
    <line x1="478" y1="75" x2="508" y2="75"/>
    <line x1="726" y1="75" x2="756" y2="75"/>
    <line x1="866" y1="114" x2="866" y2="204"/>
    <line x1="794" y1="256" x2="682" y2="255"/>
    <path d="M858 304 C 760 350, 720 338, 682 338"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="10" font-weight="600">
    <text x="740" y="245" fill="#f3a712">pass</text>
    <text x="744" y="326" fill="currentColor" opacity="0.85">fail</text>
  </g>
</svg>

## Root Cause Analysis

Scope 3 is the most spatially diffuse category in corporate carbon accounting, and the default reporting practice — multiplying spend by an industry-average emission factor — fails precisely because it discards geography. Two suppliers in the same NACE sector but on different electricity grids can differ by a factor of five in real carbon intensity; a spend-based figure averages that difference away and produces a number no verifier can defend against site-level evidence. The whole reason a geospatial calculation exists is to replace that averaging with measured, location-resolved attribution.

Three failure mechanisms recur when teams attempt that replacement without engineering discipline:

1. **Mixed CRS assumptions.** Supplier coordinates arrive in WGS84, NAD83, or an unstated local datum. Treated as interchangeable, a silent datum shift moves a point tens of meters — enough to land it in the wrong administrative polygon and pull the wrong grid factor. This is the same class of error addressed in [how to align WGS84 to a local CRS in Python](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/how-to-align-wgs84-to-local-crs-in-python-for-carbon-mapping/), and it must be neutralized before any spatial join.
2. **Projection drift in long-running pipelines.** Each repeated transform between geographic and projected systems applies rounding and datum-shift approximations. Across hundreds of iterations these compound into sub-meter then multi-meter error, invalidating route distances and facility buffers.
3. **Double counting across overlapping footprints.** When supplier service areas overlap, naive zonal statistics attribute the same activity twice, inflating aggregate tonnage and breaching GHG Protocol Scope 3 §4.3.

Each of these is deterministic and therefore preventable. The remaining sections install a gate against every one.

## Diagnostic Pipeline / Pre-Flight Validation

Before any geometry is transformed, the ingestion layer must standardize heterogeneous supplier location data and detect the failure conditions above. Raw inputs typically arrive as unstructured CSV exports, WKT strings, or GeoJSON payloads with inconsistent precision. The first engineering requirement is coordinate validation against known geodetic bounds and fallback routing for missing or invalid geometries.

When a supplier provides only a postal code or administrative boundary, the pipeline must resolve to a deterministic centroid. Fallback routing follows a strict hierarchy: verified facility coordinates → geocoded street address → NUTS-3/ISO 3166-2 centroid → national default. Each fallback tier is logged with a provenance flag to satisfy GHG Protocol data quality scoring (DQ1–DQ5), and that flag travels with the record into the lineage layer.

```python
import geopandas as gpd
import pandas as pd
import numpy as np
import structlog
from shapely.geometry import Point

log = structlog.get_logger()

def normalize_supplier_geometries(df: pd.DataFrame) -> gpd.GeoDataFrame:
    # Enforce WGS84 (EPSG:4326) as canonical ingestion CRS — never inferred
    gdf = gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df.longitude, df.latitude),
        crs="EPSG:4326"
    )

    # Pre-flight gate 1: flag coordinates outside terrestrial bounds
    valid_mask = (
        (gdf.geometry.y >= -90) & (gdf.geometry.y <= 90) &
        (gdf.geometry.x >= -180) & (gdf.geometry.x <= 180)
    )
    gdf.loc[~valid_mask, "geometry"] = None
    gdf.loc[~valid_mask, "fallback_tier"] = "invalid_coord"

    # Assign fallback tier metadata & DQ baseline (GHG Protocol DQ1–DQ5)
    gdf["fallback_tier"] = gdf["fallback_tier"].fillna("verified")
    gdf["dq_score"] = gdf["fallback_tier"].map(
        {"verified": 5, "geocoded": 4, "admin_centroid": 3,
         "national_default": 2, "invalid_coord": 1}
    )

    # Pre-flight gate 2: precision validation — reject < 5 decimals (~1.1 m)
    gdf["precision_flag"] = gdf.apply(
        lambda r: (len(str(r.geometry.y).split('.')[-1]) >= 5 and
                   len(str(r.geometry.x).split('.')[-1]) >= 5)
        if r.geometry is not None else False, axis=1
    )

    # Pre-flight gate 3: zero-variance detection (static template, not telemetry)
    zero_var = gdf.geometry.dropna().apply(lambda g: (g.x, g.y)).nunique() <= 1
    log.info("ingestion_validated",
             rows=len(gdf), invalid=int((~valid_mask).sum()),
             low_precision=int((~gdf["precision_flag"]).sum()),
             zero_variance=bool(zero_var))
    return gdf
```

Root-cause failures at this stage stem from mixed CRS assumptions or truncated decimal precision. Diagnostic validation enforces a minimum 5-decimal precision and rejects batches with zero coordinate variance, which signal static template exports rather than live facility telemetry.

## Deterministic Transformation Logic

With clean, CRS-declared inputs, the transformation stage projects geometries for distance and area work, then joins them to emission-factor surfaces. Two patterns make this deterministic: a single-pass projection with cached transformers, and explicit `always_xy=True` axis enforcement.

Long-running pipelines accumulate spatial distortion when repeatedly transforming between projected and geographic systems, because each `to_crs()` call applies rounding and datum-shift approximations. The mitigation is to transform once, with a cached `pyproj` transformer, and to choose an area-preserving target for any multi-region aggregation.

```python
from pyproj import Transformer
from shapely.ops import transform as shapely_transform

def project_for_calculation(gdf: gpd.GeoDataFrame,
                            target_crs: str = "EPSG:32633") -> gpd.GeoDataFrame:
    """
    Projects to a local UTM zone (or specified CRS) for distance/area work.
    Uses a cached transformer with explicit axis order to prevent drift.
    """
    if gdf.crs is None:
        raise ValueError("GeoDataFrame must declare a CRS before projection.")

    # always_xy=True prevents lat/lon axis swapping; cache prevents drift
    transformer = Transformer.from_crs(
        gdf.crs.to_epsg(), target_crs, always_xy=True
    )

    gdf_proj = gdf.copy()
    gdf_proj.geometry = gdf_proj.geometry.apply(
        lambda geom: shapely_transform(transformer.transform, geom)
        if geom is not None else None
    )
    gdf_proj = gdf_proj.set_crs(target_crs, allow_override=True)
    # Drift gate: round-trip residual must stay < 0.01 m for terrestrial points
    return gdf_proj
```

For deployments spanning multiple UTM zones, select the zone dynamically with `pyproj.aoi.AreaOfInterest`, or fall back to an equal-area projection (EPSG:6933) for cross-regional aggregation so that area multiplication stays within the ±0.5% tolerance auditors apply to tonnage. Never chain `.to_crs()` calls inside iterative loops.

Scope 3 categories 4 (Upstream Transportation), 9 (Downstream Transportation), and 11 (Use of Sold Products) then require route-level spatial joins against dynamic emission-factor grids. Macro-level national averages are replaced with localized grid-intensity surfaces, port-to-hub distance matrices, and regional deforestation-risk layers — the last of which can be sourced from the [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) tier.

```python
def map_emission_factors(route_gdf: gpd.GeoDataFrame,
                         ef_grid: gpd.GeoDataFrame,
                         transport_mode: str,
                         ef_column: str = "kgCO2e_per_tkm") -> gpd.GeoDataFrame:
    """
    Spatially joins route segments to regional emission-factor grids.
    Falls back to sector defaults where no spatial overlap exists.
    """
    # Both layers must share a CRS before the join — assert, do not assume
    if route_gdf.crs != ef_grid.crs:
        ef_grid = ef_grid.to_crs(route_gdf.crs)

    # Cache the spatial index to keep the join near O(n log n)
    _ = ef_grid.sindex
    joined = gpd.sjoin(route_gdf, ef_grid, how="left", predicate="intersects")

    # Mode-specific multiplier (rail/maritime far below road; air far above)
    mode_multipliers = {"road": 1.0, "rail": 0.25, "maritime": 0.15, "air": 4.5}
    multiplier = mode_multipliers.get(transport_mode, 1.0)

    # Vectorized EF assignment with explicit fallback to sector default
    joined["applied_ef"] = np.where(
        joined[ef_column].notna(),
        joined[ef_column] * multiplier,
        joined[f"default_{transport_mode}_ef"]
    )
    return joined
```

Always build `gdf.sindex` before large-scale joins to avoid O(n²) intersection cost. Emission factors themselves carry uncertainty that should be propagated rather than discarded — that confidence interval is the domain of [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/), and its bounds attach to each allocated figure before reporting.

## Compliance Gating & Audit Trail Generation

A reportable figure is one that is both reproducible and traceable. Every emission calculation is therefore paired with an immutable audit record capturing input state, transformation logic, and an output hash. Partitioned Parquet with embedded metadata columns satisfies both computational efficiency and regulatory traceability.

```python
import hashlib
import json
from datetime import datetime, timezone

def calculate_emissions_and_audit(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Computes Scope 3 emissions and generates cryptographic lineage."""
    # Vectorized core: mass (t) * distance (km) * EF (kgCO2e/tkm)
    gdf["emissions_kgCO2e"] = (
        gdf["mass_t"] * gdf["distance_km"] * gdf["applied_ef"]
    )

    def compute_lineage_hash(row):
        payload = {
            "supplier_id": row.get("supplier_id"),
            "geometry_wkt": row.geometry.wkt if row.geometry else None,
            "ef_source": row.get("ef_source", "default"),
            "dq_score": row.get("dq_score", 0),
            "calc_timestamp": datetime.now(timezone.utc).isoformat(),
        }
        return hashlib.sha256(
            json.dumps(payload, sort_keys=True).encode()
        ).hexdigest()

    gdf["audit_hash"] = gdf.apply(compute_lineage_hash, axis=1)
    gdf["pipeline_version"] = "v2.4.1-mrv"
    gdf["calc_timestamp_utc"] = datetime.now(timezone.utc)
    return gdf
```

The GHG Protocol mandates explicit data-quality thresholds, so automated gates reject or flag records below DQ3 for material categories. The gating layer evaluates spatial precision, fallback tier, EF vintage, and calculation confidence in one composite test, then splits the dataset into ledger-bound and remediation-bound tiers.

```python
def enforce_compliance_gates(gdf: gpd.GeoDataFrame,
                             min_dq: int = 3
                             ) -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    """Splits the dataset on the GHG Protocol DQ matrix."""
    gdf["is_compliant"] = (
        (gdf["dq_score"] >= min_dq) &
        (gdf["precision_flag"] == True) &
        (gdf["emissions_kgCO2e"].notna())
    )
    compliant = gdf[gdf["is_compliant"]].copy()
    non_compliant = gdf[~gdf["is_compliant"]].copy()

    # Tag rejection reasons for remediation routing
    non_compliant["rejection_reason"] = np.select(
        [
            non_compliant["dq_score"] < min_dq,
            non_compliant["precision_flag"] == False,
            non_compliant["emissions_kgCO2e"].isna(),
        ],
        ["DQ_below_threshold", "insufficient_precision", "calculation_failure"],
        default="unknown",
    )
    return compliant, non_compliant
```

Store the resulting GeoDataFrame as partitioned Parquet with `_metadata` files tracking schema evolution and CRS provenance, so auditors can reconstruct any historical calculation without re-running the pipeline. The table below maps each enforced gate to the clause it satisfies.

<div class="table-wrap">

| Gate | Diagnostic Signal | Verification Mapping |
|------|-------------------|----------------------|
| Equal-area weighting | Area variance > 2% vs EPSG:6933 baseline | CSRD ESRS E1-AR4 (Data Quality & Uncertainty) |
| Double-count resolution | Overlapping supplier area > 5% | GHG Protocol Scope 3 §4.3 (Avoidance of Double Counting) |
| Precision / DQ floor | `dq_score < 3` or `precision_flag == False` | GHG Protocol Scope 3 §7.3 (Data Quality) |
| CRS & factor lineage | Missing transformer matrix or EF vintage | ISO 14064-3 §5.3 + CSRD ESRS E1 reproducibility |
| Audit hash present | Null `audit_hash` on a ledger row | SEC Climate Disclosure §229.1502 (Methodology) |

</div>

These mappings align directly with GHG Protocol Scope 3 Corporate Value Chain Standard §5.3, and the lineage written here feeds [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) and, where credits offset value-chain emissions, [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/).

## Production Integration

In production the five functions above run as a single ordered execution pattern. Each stage hands a validated, CRS-declared GeoDataFrame to the next, and nothing reaches the ledger that has not passed every gate.

1. **Ingest** — read supplier records and call `normalize_supplier_geometries()`; declare `crs="EPSG:4326"` explicitly rather than trusting the file reader's default.
2. **Diagnose** — apply the pre-flight gates (bounds, precision, zero-variance) and route invalid records out before any transform; failing loud here is cheaper than failing silent downstream.
3. **Transform** — project once with `project_for_calculation()` using a cached, `always_xy=True` transformer, then run `map_emission_factors()` over a pre-built spatial index.
4. **Validate** — compute emissions and hashes with `calculate_emissions_and_audit()`, then split the dataset with `enforce_compliance_gates()`.
5. **Export** — write the compliant tier to partitioned Parquet with embedded CRS and factor-vintage metadata; version each run with DVC or Delta Lake.
6. **Submit** — deploy the compliant dataset to the corporate carbon ledger and route non-compliant records to a remediation queue with supplier-outreach triggers, holding a rolling 30-day reconciliation window to align with ISO 14064-1 verification cycles.

For batch and chunked I/O at scale, keep these constraints in view:

- **CRS discipline.** Never assume a default CRS from file readers. Declare `crs="EPSG:4326"` on ingestion and assert with `gdf.crs.to_epsg()` before any join.
- **Projection drift.** Cache `pyproj.Transformer` objects across the batch; avoid iterative `.to_crs()` calls inside loops.
- **Auditability.** Embed a SHA-256 hash per record and store pipeline version, transformer parameters, and EF vintage alongside the emissions value.
- **Performance.** Use `geopandas.sjoin` with a pre-built spatial index. Beyond ~10M records, migrate to `dask-geopandas` or a `polars` spatial extension and process in partitioned chunks rather than one in-memory frame.
- **Compliance mapping.** Align DQ scoring directly to GHG Protocol Scope 3 §5.3 and document every fallback assumption in the MRV methodology statement.

The [GHG Protocol Corporate Value Chain (Scope 3) Standard](https://ghgprotocol.org/corporate-value-chain-scope-3-standard) requires a documented methodology for spatially explicit activity data, and the [OGC Well-Known Text CRS Representation](https://www.ogc.org/standards/wkt-crs) standard provides the canonical encoding for the coordinate-system declarations auditors request. This architecture eliminates macroeconomic averaging artifacts, enforces spatial determinism, and produces verifiable audit trails suitable for third-party assurance — provided CRS transformations and EF grid updates are themselves CI/CD-validated.

## Related

- [GHG Protocol Scope 3 Spatial Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) — the parent component this calculation implements.
- [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) — the foundational stack defining schema, scoping, and validation contracts.
- [Geospatial CRS Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the upstream equal-area projection contract this calculation depends on.
- [How to Align WGS84 to a Local CRS in Python for Carbon Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/how-to-align-wgs84-to-local-crs-in-python-for-carbon-mapping/) — the reprojection recipe behind the transformation step.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — where the audit hashes and CRS metadata are persisted for verification.
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — propagating confidence bounds onto each allocated figure.
