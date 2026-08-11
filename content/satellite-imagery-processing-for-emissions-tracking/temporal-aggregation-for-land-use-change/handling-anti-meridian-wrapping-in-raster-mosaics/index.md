---
shortTitle: "Anti-Meridian Wrapping in Raster Mosaics"
title: "Handling Anti-Meridian Wrapping in Raster Mosaics"
description: "Diagnose and fix anti-meridian wrapping in MRV raster mosaics: detect bounding boxes exploding to global width, shift to 0-360 longitude, split geometries at ±180, and reproject before compositing."
slug: handling-anti-meridian-wrapping-in-raster-mosaics
type: guide
breadcrumb: "Anti-Meridian Wrapping"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Handling Anti-Meridian Wrapping in Raster Mosaics

Any MRV pipeline that composites satellite tiles over Fiji, the Aleutians, Chukotka, or the New Zealand EEZ eventually hits the anti-meridian: the ±180° seam where longitude discontinuously flips sign. This guide is the troubleshooting recipe under [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/), the compositing discipline within the [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack. It sits directly alongside [monthly temporal aggregation of NDVI for land cover change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/), because the same tile stack that feeds a monthly composite will silently produce a global-width mosaic the moment it straddles 180°.

The symptom is unmistakable once you know it: a project spanning a few hundred kilometres of Fijian coastline reports a bounding box nearly 360° wide, the mosaic renders as two thin slivers pinned to opposite edges of the map, and the reprojection step either explodes memory or returns an almost-entirely-empty raster. The root cause is not a corrupt tile — it is that `EPSG:4326` treats +179.9° and -179.9° as maximally distant when they are physically adjacent. Left unfixed, the defect propagates into area calculations that underpin credit issuance, so it must be caught before the composite reaches the wider [Cloud-Optimized Geospatial Formats](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/) export path.

<svg viewBox="0 0 1000 288" role="img" aria-labelledby="am-wrap-t am-wrap-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="am-wrap-t">Anti-meridian mosaic decision and correction flow</title>
  <desc id="am-wrap-d">Tile footprints enter a detection gate that asks whether the combined extent crosses plus or minus 180 degrees, tested by a bounding-box width greater than 180 or geometries carrying both positive and negative longitudes. If no, the tiles mosaic directly. If yes, one of three corrections applies: shift longitudes to a zero to three-hundred-sixty frame, split geometries at the anti-meridian with shapely, or project to a local UTM or equal-area CRS. All corrected paths converge on a mosaic step, then a validation gate that confirms the bounding-box width is sane before emitting an audited mosaic manifest.</desc>
  <defs>
    <marker id="am-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="12" y="118" width="120" height="60" rx="9"/>
      <rect x="470" y="24" width="180" height="52" rx="9"/>
      <rect x="470" y="116" width="180" height="52" rx="9"/>
      <rect x="470" y="208" width="180" height="52" rx="9"/>
      <rect x="700" y="116" width="112" height="60" rx="9"/>
    </g>
    <!-- detection diamond -->
    <polygon points="300,98 372,148 300,198 228,148" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <!-- validation diamond -->
    <polygon points="878,118 934,148 878,178 822,148" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <!-- audited mosaic (accent) -->
    <rect x="700" y="216" width="284" height="56" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="72" y="144">Tile footprints</text>
      <text x="560" y="46">0&#8211;360&#176; shift</text>
      <text x="560" y="138">Split at &#177;180&#176;</text>
      <text x="560" y="230">Project to local CRS</text>
      <text x="756" y="144">Mosaic</text>
    </g>
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="72" y="162">STAC bboxes</text>
      <text x="560" y="62">longitude re-frame</text>
      <text x="560" y="154">shapely MultiPolygon</text>
      <text x="560" y="246">UTM / EPSG:6933</text>
      <text x="756" y="162">merge tiles</text>
    </g>
    <g fill="currentColor" font-size="10" font-weight="600">
      <text x="300" y="144">crosses</text>
      <text x="300" y="158">&#177;180&#176;?</text>
    </g>
    <g fill="currentColor" font-size="9" font-weight="600">
      <text x="878" y="145">width</text>
      <text x="878" y="157">sane?</text>
    </g>
    <text x="842" y="245" fill="#f3a712" font-size="12" font-weight="700">Audited mosaic</text>
    <text x="842" y="262" fill="#f3a712" font-size="9.5">bbox &#183; CRS &#183; lineage</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#am-arrow)">
    <line x1="132" y1="148" x2="226" y2="148"/>
    <path d="M372 148 C 410 148, 430 50, 468 50"/>
    <line x1="372" y1="148" x2="468" y2="142"/>
    <path d="M372 148 C 410 148, 430 234, 468 234"/>
    <path d="M650 50 C 675 50, 678 130, 698 138"/>
    <line x1="650" y1="142" x2="698" y2="146"/>
    <path d="M650 234 C 675 234, 678 166, 698 158"/>
    <line x1="812" y1="148" x2="820" y2="148"/>
    <path d="M878 178 C 878 205, 842 210, 842 214"/>
  </g>
  <!-- direct-mosaic no branch -->
  <path d="M300 198 C 300 240, 600 250, 698 172" stroke="currentColor" stroke-width="1.5" fill="none" stroke-dasharray="4,3" marker-end="url(#am-arrow)"/>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="10" font-weight="600">
    <text x="410" y="120" fill="#f3a712">yes</text>
    <text x="330" y="230" fill="currentColor" opacity="0.8">no</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Handle anti-meridian wrapping when mosaicking raster tiles for MRV",
  "description": "Detect anti-meridian crossings from tile footprints, choose a 0-360 longitude shift, geometry split, or local reprojection, mosaic the corrected tiles, re-validate the extent, and export an audited mosaic with lineage.",
  "totalTime": "PT40M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "rasterio" },
    { "@type": "HowToTool", "name": "geopandas" },
    { "@type": "HowToTool", "name": "shapely" },
    { "@type": "HowToTool", "name": "pyproj" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest footprints", "text": "Collect the STAC item footprints and per-tile bounding boxes over the reporting extent, keeping explicit CRS tags." },
    { "@type": "HowToStep", "name": "Diagnose crossing", "text": "Flag an anti-meridian crossing when the combined bbox width exceeds 180 degrees or geometries carry both positive and negative longitudes." },
    { "@type": "HowToStep", "name": "Transform", "text": "Shift longitudes into a 0-360 frame or split geometries at plus-or-minus 180, then reproject to a suitable UTM or equal-area CRS." },
    { "@type": "HowToStep", "name": "Validate", "text": "Recompute the corrected extent and assert its width is physically plausible before compositing." },
    { "@type": "HowToStep", "name": "Export and submit", "text": "Mosaic the corrected tiles, embed the CRS and extent lineage into the manifest, and forward the audited mosaic to registry submission." }
  ]
}
</script>

## Root Cause Analysis

The anti-meridian defect is a consequence of representing a spherical coordinate as an unbounded scalar. In `EPSG:4326`, longitude is a wrapped quantity that discontinuously jumps from +180° to -180°, yet every downstream library — `rasterio`, `shapely`, `geopandas` — treats it as an ordinary real number on a flat plane. Three distinct failure modes follow.

First, **bounding boxes explode to near-global width.** When you take the union of a tile at +179.7° and a neighbouring tile at -179.6°, the naive extent runs from -179.6° to +179.7° — a reported span of 359.3° for two tiles that physically touch. Any mosaic driver handed that extent allocates a raster wide enough to cover the entire planet at native resolution, so a 10 m Sentinel-2 composite over a Fijian district demands tens of gigabytes of empty pixels and either exhausts memory or writes a mosaic that is 99% nodata with two thin data slivers pinned to the left and right edges.

Second, **geometries wrap the wrong way.** A project polygon drawn across the seam, if stored with un-normalised longitudes, becomes a shape whose vertices jump from +179° to -179°. `shapely` connects those vertices along the short numeric path, drawing an edge straight across the entire globe rather than across the narrow strait. Spatial joins against such a geometry match parcels on the wrong side of the planet, and area computations return absurd values — the exact silent corruption that [preventing Scope 3 double-counting in spatial joins](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/preventing-scope-3-double-counting-in-spatial-joins/) is designed to catch.

Third, **UTM zone discontinuity and CRS ambiguity break area math.** The anti-meridian is the boundary between UTM zones 60 and 1, so tiles a few kilometres apart carry different projected CRS codes. A mosaic that assumes a single zone smears the far side by tens of metres, and because `EPSG:4326` degrees are not equal-area, any area-weighted carbon figure derived from an un-projected wrapped extent is quietly wrong. This is why disciplined [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) is a precondition, not an afterthought, for seam-crossing regions.

## Diagnostic Pipeline / Pre-Flight Validation

Before any merge runs, inspect the tile footprints and detect the crossing explicitly. The pre-flight gate confirms a machine-readable CRS on every input, then flags an anti-meridian crossing using two independent signals: a combined bounding-box width that exceeds 180° in geographic coordinates, or individual footprints that carry both positive and negative longitudes. Reporting both keeps the diagnosis robust when only some tiles straddle the seam.

```python
import geopandas as gpd
import numpy as np
import structlog
from shapely.geometry import box

log = structlog.get_logger()

GEOGRAPHIC_CRS = "EPSG:4326"
WIDTH_GATE_DEG = 180.0  # a real project rarely spans more than a hemisphere


def diagnose_antimeridian(footprints: gpd.GeoDataFrame) -> dict:
    """Inspect tile footprints for anti-meridian crossing before mosaicking.

    Detects: missing/mismatched CRS, a combined extent wider than 180 degrees,
    and individual footprints spanning both longitude signs.
    """
    issues: list[str] = []

    if footprints.crs is None:
        raise ValueError("untagged footprints; refusing to guess a datum.")
    if str(footprints.crs) != GEOGRAPHIC_CRS:
        # Detection logic below assumes geographic degrees.
        footprints = footprints.to_crs(GEOGRAPHIC_CRS)

    minx, miny, maxx, maxy = footprints.total_bounds
    combined_width = float(maxx - minx)

    # Signal 1: the union spans an implausible fraction of the globe.
    width_flag = combined_width > WIDTH_GATE_DEG

    # Signal 2: at least one footprint carries both signs of longitude.
    per_tile_span = footprints.geometry.bounds
    sign_flag = bool(
        ((per_tile_span["minx"] < -170) & (per_tile_span["maxx"] > 170)).any()
    )

    crosses = width_flag or sign_flag
    if width_flag:
        issues.append(f"bbox_width_exceeds_gate:{combined_width:.2f}deg")
    if sign_flag:
        issues.append("footprint_spans_both_longitude_signs")

    report = {
        "n_tiles": int(len(footprints)),
        "combined_bbox_width_deg": round(combined_width, 3),
        "crosses_antimeridian": crosses,
        "issues": issues,
    }
    log.warning("mosaic.antimeridian_preflight", **report) if crosses else \
        log.info("mosaic.antimeridian_preflight", **report)
    return report
```

A report with `crosses_antimeridian=True` does not abort the run — it routes the tiles to the correction path below and records why, so the seam handling is visible to a verifier rather than being an undocumented reprojection buried in the mosaic driver.

## Deterministic Transformation Logic

Two corrections resolve the wrap, and the right one depends on the downstream product. For a raster mosaic you normalise longitudes into a continuous 0–360° frame so the tiles become numerically contiguous; for vector geometries that must stay valid in `EPSG:4326` you split the shape at ±180° into a `MultiPolygon`. In both cases the final compositing and any area math happen in a projected, area-honest CRS — a local UTM zone for a compact project, or the global equal-area `EPSG:6933` for a wide EEZ — never in raw degrees.

The routine below normalises footprint longitudes into the 0–360° frame, splits any seam-crossing geometry with `shapely`, reprojects to the chosen projected CRS, and re-validates the extent through a hard gate before returning the corrected frame.

```python
import geopandas as gpd
import numpy as np
import pyproj
import structlog
from datetime import datetime, timezone
from shapely.geometry import MultiPolygon, Polygon, box
from shapely.ops import split, transform

log = structlog.get_logger()

GEOGRAPHIC_CRS = "EPSG:4326"
EQUAL_AREA_CRS = "EPSG:6933"       # global equal-area fallback for wide extents
SANE_WIDTH_GATE_M = 5_000_000.0    # projected extents wider than this are rejected


def _shift_to_0_360(x: float, y: float, z=None):
    """Map longitudes from [-180, 180) into [0, 360) so the seam is contiguous."""
    return (x % 360.0), y


def _split_at_antimeridian(geom: Polygon) -> MultiPolygon:
    """Cut a seam-crossing polygon into east/west parts valid in EPSG:4326."""
    seam = box(180.0, -90.0, 180.0, 90.0)  # degenerate line at +180 in 0-360 frame
    shifted = transform(_shift_to_0_360, geom)
    pieces = split(shifted, seam.exterior)
    parts = []
    for part in pieces.geoms:
        # Return east-of-seam pieces to negative longitudes.
        parts.append(transform(lambda x, y, z=None:
                               (x - 360.0 if x > 180.0 else x, y), part))
    return MultiPolygon(parts) if len(parts) > 1 else MultiPolygon([parts[0]])


def correct_mosaic_extent(
    footprints: gpd.GeoDataFrame,
    strategy: str = "shift",
    projected_crs: str | None = None,
) -> tuple[gpd.GeoDataFrame, dict]:
    """Normalise seam-crossing footprints and reproject before mosaicking.

    strategy:
      - "shift":  re-frame longitudes to 0-360 (preferred for raster mosaics)
      - "split":  cut geometries at +/-180 into MultiPolygons (vector-safe)
    Returns: (corrected_footprints, audit_manifest)
    """
    if str(footprints.crs) != GEOGRAPHIC_CRS:
        footprints = footprints.to_crs(GEOGRAPHIC_CRS)

    if strategy == "shift":
        corrected = footprints.copy()
        corrected["geometry"] = corrected.geometry.apply(
            lambda g: transform(_shift_to_0_360, g))
    elif strategy == "split":
        corrected = footprints.copy()
        corrected["geometry"] = corrected.geometry.apply(_split_at_antimeridian)
    else:
        raise ValueError(f"Unknown strategy: {strategy}. Use 'shift' or 'split'.")

    # Choose an area-honest projected CRS before any width validation or merge.
    target = projected_crs or EQUAL_AREA_CRS
    corrected = corrected.set_crs(GEOGRAPHIC_CRS, allow_override=True).to_crs(target)

    minx, miny, maxx, maxy = corrected.total_bounds
    projected_width_m = float(maxx - minx)

    # Validation gate: a corrected extent must be physically plausible.
    if projected_width_m > SANE_WIDTH_GATE_M or projected_width_m <= 0:
        raise RuntimeError(
            f"corrected extent width {projected_width_m:.0f} m is implausible; "
            "anti-meridian correction did not resolve the wrap.")

    manifest = {
        "pipeline_version": "1.3.0-mrv",
        "strategy": strategy,
        "source_crs": GEOGRAPHIC_CRS,
        "projected_crs": target,
        "n_tiles": int(len(corrected)),
        "corrected_width_m": round(projected_width_m, 1),
        "crossed_antimeridian": True,
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "compliance_standard": "GHG Protocol LULUCF Activity Data",
    }
    log.info("mosaic.extent_corrected", **manifest)
    return corrected, manifest
```

The `shift` strategy is the default for raster compositing: once longitudes live in a contiguous 0–360° frame, the mosaic driver sees one narrow extent and allocates a sensibly sized output. The `split` strategy is reserved for vector products that must round-trip through `EPSG:4326` — a GeoJSON or GeoParquet footprint that a verifier will open in a standards-compliant reader, which under RFC 7946 requires anti-meridian-crossing polygons to be split into a `MultiPolygon` rather than stored with wrapped coordinates.

<svg viewBox="0 -4 880 232" role="img" aria-labelledby="am-t am-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="am-t">What an unsplit anti-meridian polygon does to a bounding box and an area</title>
  <desc id="am-d">A polygon spanning the 180 degree meridian, with vertices at 178 degrees east and 179 degrees west. Interpreted naively, its longitude range runs from minus 179 to plus 178, giving a bounding box 357 degrees wide that spans almost the entire globe instead of the true 3 degrees. The computed area is roughly 119 times the true area, and any intersection test against it matches nearly every feature on Earth. A panel gives the three fixes: split the geometry at 180, shift to a 0 to 360 longitude convention for the computation, or work in a projected coordinate reference system centred on the region, and notes that the bounding-box width test catches the problem in one line.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">A 3° polygon that reports a 357° bounding box</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Vertices at 178°E and 179°W, interpreted as a range from −179 to +178.</text>
  </g>
  <g>
    <rect x="60" y="60" width="600" height="72" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
    <line x1="360" y1="52" x2="360" y2="140" stroke="#f3a712" stroke-width="2" stroke-dasharray="5,4"/>
    <text x="360" y="48" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f3a712">180°</text>
    <rect x="330" y="78" width="30" height="36" fill="currentColor" opacity="0.3"/>
    <rect x="360" y="78" width="30" height="36" fill="currentColor" opacity="0.3"/>
    <text x="360" y="156" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor">true extent: 3°</text>
    <rect x="60" y="60" width="600" height="72" rx="6" fill="#f3a712" opacity="0.1"/>
    <text x="150" y="102" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">computed bounding box: 357°</text>
    <text x="72" y="152" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">−179°</text>
    <text x="648" y="152" text-anchor="end" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">+178°</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="688" y="60" width="180" height="96" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="688" y="60" width="180" height="96" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="704" y="84" fill="currentColor" font-size="9.5" font-weight="700">Consequences</text>
    <text x="704" y="106" fill="currentColor" font-size="9" opacity="0.85">area ≈ 119× true</text>
    <text x="704" y="122" fill="currentColor" font-size="9" opacity="0.85">intersects nearly everything</text>
    <text x="704" y="144" fill="#f3a712" font-size="9" font-weight="700">and never raises an error</text>
    <rect x="12" y="176" width="856" height="52" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="176" width="856" height="52" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="28" y="196" fill="currentColor" font-size="9.5" font-weight="700">Three fixes: split at 180 · shift to a 0–360 convention for the computation · work in a projected CRS centred on the region.</text>
    <text x="28" y="216" fill="currentColor" font-size="9.5" opacity="0.85">One detector: assert that no feature's geographic bounding box is wider than 180°. It is a single line and it catches every case.</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

The correction routine embeds a machine-readable manifest recording the strategy applied, the source and projected CRS, and the corrected extent width. That record is what turns a reprojection from an invisible driver default into an auditable decision. The gates it enforces are:

1. **Extent-sanity gate.** A corrected projected width exceeding `SANE_WIDTH_GATE_M`, or collapsing to zero, raises rather than proceeding — a wrap that survives correction can never reach the composite.
2. **CRS declaration.** Every input is refused unless it carries a machine-readable datum, and the area-honest projected CRS is stamped into the manifest so an auditor can confirm areas were computed on an equal-area or UTM grid, not in degrees.
3. **Strategy transparency.** The `strategy` and `crossed_antimeridian` fields make the seam handling explicit, so a verifier can trace exactly which tiles were re-framed and how, satisfying the reproducibility expectation of ISO 14064-3.

These attributes flow downstream into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), where the corrected extent and its CRS become part of the queryable record an auditor traces. For the authoritative convention on encoding seam-crossing geometries, consult [RFC 7946 §3.1.9 (Antimeridian Cutting)](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.9).

## Production Integration

Deploy the correction within the tile-processing framework following a fixed ingest → diagnose → transform → validate → export → submit sequence:

1. **Ingest.** Query the STAC API for tile footprints over the reporting extent, keeping each item's declared CRS. For regions near the seam, request footprints in `EPSG:4326` so the diagnostic works in geographic degrees.
2. **Diagnose.** Run `diagnose_antimeridian` to test the combined bbox width and per-tile longitude signs; route any crossing to the correction path and log the report.
3. **Transform.** Call `correct_mosaic_extent` with `strategy="shift"` for a raster mosaic (or `"split"` for a vector product), passing a local UTM zone for compact projects or letting it fall back to `EPSG:6933`.
4. **Validate.** Let the extent-sanity gate assert the corrected width is plausible; reject any composite whose extent did not resolve.
5. **Export.** Merge the corrected tiles and serialize to a Cloud-Optimized GeoTIFF with the manifest attached, following the [Cloud-Optimized Geospatial Formats](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/) conventions so the audited extent survives downstream reads.
6. **Submit.** Forward the composite into the temporal aggregation stage — the same monthly reducers described in [monthly temporal aggregation of NDVI for land cover change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/) — and carry the lineage through to registry submission.

By detecting the crossing on two independent signals, choosing the correction that matches the product, and gating the corrected extent before any merge, anti-meridian handling turns a class of silent, area-corrupting mosaic failures into a documented, reproducible step. The Fijian district that once reported a 359° bounding box now composites into a compact, area-honest mosaic whose every hectare an auditor can recompute — the deterministic foundation automated MRV compliance depends on.

<svg viewBox="0 -4 880 208" role="img" aria-labelledby="cyc-t cyc-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cyc-t">Three cyclic quantities that break naive arithmetic the same way</title>
  <desc id="cyc-d">Three examples of the same class of bug. Longitude wraps at 180 degrees, so a mean of 179 and minus 179 gives zero instead of 180. Compass bearing wraps at 360 degrees, so a mean of 350 and 10 gives 180 instead of zero, which reverses a wind direction. Day of year wraps at 365, so a seasonal model fitted without a circular basis produces a discontinuity every January. A panel notes that all three produce plausible numbers, none raise an error, and all three are caught by asserting that a derived value is physically sensible rather than by inspecting the arithmetic.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The same bug, three coordinates</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Cyclic quantities averaged as if they were linear.</text>
    <rect x="12" y="52" width="280" height="112" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="280" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Longitude · wraps at 180°</text>
    <text x="28" y="100" fill="currentColor" font-size="9.5" opacity="0.85">mean(179, −179)</text>
    <text x="28" y="122" fill="#f3a712" font-size="10" font-weight="700">= 0°, should be 180°</text>
    <text x="28" y="146" fill="currentColor" font-size="9" opacity="0.75">a centroid in the wrong ocean</text>
    <rect x="300" y="52" width="280" height="112" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="300" y="52" width="280" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="316" y="76" fill="currentColor" font-size="10.5" font-weight="700">Bearing · wraps at 360°</text>
    <text x="316" y="100" fill="currentColor" font-size="9.5" opacity="0.85">mean(350, 10)</text>
    <text x="316" y="122" fill="#f3a712" font-size="10" font-weight="700">= 180°, should be 0°</text>
    <text x="316" y="146" fill="currentColor" font-size="9" opacity="0.75">a wind direction reversed</text>
    <rect x="588" y="52" width="280" height="112" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="588" y="52" width="280" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="604" y="76" fill="currentColor" font-size="10.5" font-weight="700">Day of year · wraps at 365</text>
    <text x="604" y="100" fill="currentColor" font-size="9.5" opacity="0.85">a non-circular seasonal basis</text>
    <text x="604" y="122" fill="#f3a712" font-size="10" font-weight="700">a step every January</text>
    <text x="604" y="146" fill="currentColor" font-size="9" opacity="0.75">read as annual change</text>
    <text x="12" y="192" fill="currentColor" font-size="9.5" opacity="0.85">All three produce plausible numbers and raise no error. Assert that the derived value is physically sensible; do not inspect the arithmetic.</text>
  </g>
</svg>

## Frequently Asked Questions

### How do I detect anti-meridian wrapping in one check?

Assert that no feature's bounding box in geographic coordinates is wider than 180 degrees. A genuine feature spanning more than half the globe is essentially unheard of in carbon work, while a wrapped feature almost always reports a width near 360. The check is a single comparison, costs nothing, and belongs in the ingestion gate alongside the CRS assertion — it is the cheapest high-value spatial invariant available.

### Should I split the geometry or shift the longitudes?

Split for anything that will be stored or exchanged, shift for a local computation. A split geometry is valid in every tool and every format, which matters when a partner or verifier opens the file. A longitude shift to a 0–360 convention is simpler for an internal calculation but produces coordinates that other tools will misinterpret, so it must never leak into a stored artefact without being documented.

### Does the problem exist in projected coordinate systems too?

It disappears for a projection centred near the region, which is the cleanest fix when the area of interest is compact — a local equal-area projection centred on the Pacific has no discontinuity at 180. It reappears for global projections, whose own discontinuity simply sits somewhere else, usually at the projection's central meridian's antipode. The general rule is that every global projection has a seam, and geometry crossing it needs the same treatment.

### What about rasters rather than vectors?

The same problem in a different form: a mosaic spanning 180 built naively either produces a global-width grid mostly full of nodata or silently reorders the tiles. Build the mosaic in a projected CRS centred on the region, or mosaic the two sides separately and keep them as separate artefacts with a documented relationship. Reprojecting a wrapped mosaic afterwards does not fix it, because the damage happened when the extent was computed.

### Where else does this class of bug appear?

Anywhere a coordinate is cyclic. Longitude at 180 is the common case; the others are compass bearings wrapping at 360, which break naive averaging of wind or aspect direction, and day-of-year wrapping at 365, which breaks a seasonal model fitted without a circular basis. All three produce plausible numbers, none raise errors, and all three are caught by asserting that a derived range is physically sensible rather than by inspecting the arithmetic.

### Does the problem affect tiling schemes and STAC queries too?

Yes, and often before it affects the data. A bounding-box query spanning 180 degrees returns either nothing or everything depending on how the catalogue interprets it, so the failure appears as a mysteriously empty or absurdly large scene list rather than as bad geometry. Split the query at the anti-meridian, issue two requests, and merge the results — the same treatment the geometry needs, applied one stage earlier.

## Related guides

- [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — the parent compositing discipline this fix sits within.
- [Monthly Temporal Aggregation of NDVI for Land Cover Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/monthly-temporal-aggregation-of-ndvi-for-land-cover-change/) — the reducer stage that consumes the corrected mosaic.
- [Cloud-Optimized Geospatial Formats](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/cloud-optimized-geospatial-formats/) — the export layer that carries the audited extent forward.
- [Geospatial Coordinate Reference Systems (CRS) Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the CRS discipline that keeps area math honest across the seam.
- [Preventing Scope 3 Double-Counting in Spatial Joins](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/preventing-scope-3-double-counting-in-spatial-joins/) — the join-integrity check a wrapped geometry silently defeats.
