---
shortTitle: "Choosing an Equal-Area Projection for Carbon Accounting"
title: "Choosing an Equal-Area Projection for Carbon Accounting"
description: "A decision procedure for picking the analysis projection in a carbon pipeline: measured distortion for EASE-Grid 2.0, Mollweide, Albers and local UTM, why Web Mercator is disqualifying, and how to document the choice."
slug: choosing-an-equal-area-projection-for-carbon-accounting
type: guide
breadcrumb: "Choosing an Equal-Area Projection"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Choosing an Equal-Area Projection for Carbon Accounting

Every tonne in a carbon inventory is an area multiplied by a density. If the area is wrong, the tonne is wrong, and the most common way an area goes wrong is a projection chosen for display and then used for analysis. This guide gives a decision procedure for the analysis projection, within [geospatial coordinate reference systems alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) in the [MRV architecture and carbon accounting fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack.

The decision is narrower than it first appears. Carbon accounting needs one property above all others — that a hectare is a hectare wherever it sits — and that requirement eliminates most of the projections a GIS offers by default. What remains is a short list, and choosing between its members is a trade between global comparability, local shape fidelity, and how much explaining you want to do in the methodology annex.

<svg viewBox="0 -4 940 276" role="img" aria-labelledby="proj-t proj-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="proj-t">Decision procedure for the analysis projection in a carbon pipeline</title>
  <desc id="proj-d">A decision tree starting from the question of what the projection is for. If it is for display only, Web Mercator is acceptable and the branch ends there with a warning never to compute area in it. If it is for analysis, the next question asks whether the project spans more than one UTM zone or crosses the equator. If it does not, a local equal-area projection such as an Albers or Lambert Azimuthal centred on the project is preferred for the best local shape fidelity. If it does, the next question asks whether results must be comparable with a global product or grid. If yes, EASE-Grid 2.0 Global, EPSG 6933, is chosen. If no, World Mollweide, EPSG 54009, or a continental Albers is chosen. Every analysis branch ends at a common requirement to record the projection, its authority code, and the measured distortion at the project centroid.</desc>
  <defs>
    <marker id="proj-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="10" y="102" width="132" height="56" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="10" y="102" width="132" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="76" y="126" fill="currentColor" font-size="10.5" font-weight="700">What is it for?</text>
    <text x="76" y="144" fill="currentColor" font-size="9" opacity="0.78">display or analysis</text>
    <rect x="186" y="14" width="180" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3"/>
    <text x="276" y="36" fill="currentColor" font-size="10" font-weight="700">Display → Web Mercator</text>
    <text x="276" y="56" fill="#f3a712" font-size="9" font-weight="700">never compute area in it</text>
    <polygon points="276,104 386,144 276,184 166,144" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="276" y="140" fill="currentColor" font-size="9" font-weight="600">Spans &gt;1 UTM zone</text>
    <text x="276" y="154" fill="currentColor" font-size="9" font-weight="600">or crosses equator?</text>
    <rect x="418" y="186" width="188" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="512" y="210" fill="currentColor" font-size="10" font-weight="700">Local equal-area</text>
    <text x="512" y="228" fill="currentColor" font-size="9" opacity="0.78">Albers or Lambert Azimuthal</text>
    <text x="512" y="244" fill="currentColor" font-size="9" opacity="0.78">centred on the project</text>
    <polygon points="512,66 622,106 512,146 402,106" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="512" y="102" fill="currentColor" font-size="9" font-weight="600">Comparable with a</text>
    <text x="512" y="116" fill="currentColor" font-size="9" font-weight="600">global product?</text>
    <rect x="654" y="14" width="180" height="66" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="654" y="14" width="180" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="744" y="38" fill="currentColor" font-size="10.5" font-weight="700">EASE-Grid 2.0</text>
    <text x="744" y="56" fill="currentColor" font-size="10">EPSG:6933</text>
    <text x="744" y="72" fill="currentColor" font-size="9" opacity="0.78">global, equal-area</text>
    <rect x="654" y="104" width="180" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="744" y="128" fill="currentColor" font-size="10.5" font-weight="700">Mollweide</text>
    <text x="744" y="146" fill="currentColor" font-size="10">EPSG:54009</text>
    <text x="744" y="162" fill="currentColor" font-size="9" opacity="0.78">or continental Albers</text>
    <rect x="654" y="194" width="278" height="58" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="654" y="194" width="278" height="58" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="793" y="216" fill="currentColor" font-size="9.5" font-weight="700">Whatever you choose: record the code,</text>
    <text x="793" y="234" fill="currentColor" font-size="9.5" font-weight="700">and the measured distortion at the centroid</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#proj-arrow)">
    <path d="M142 116 C 162 90, 166 50, 184 42"/>
    <path d="M142 142 C 158 142, 150 142, 164 143"/>
    <path d="M276 184 C 300 200, 360 200, 416 206"/>
    <path d="M330 122 C 360 108, 372 106, 400 106"/>
    <line x1="622" y1="88" x2="652" y2="60"/>
    <line x1="622" y1="120" x2="652" y2="132"/>
    <path d="M606 226 C 626 226, 634 224, 652 223"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.8">
    <text x="172" y="74">display</text>
    <text x="150" y="164">analysis</text>
    <text x="330" y="200">no</text>
    <text x="352" y="98">yes</text>
    <text x="640" y="56">yes</text>
    <text x="640" y="146">no</text>
  </g>
</svg>

## Root Cause Analysis

Projection distortion is not a rounding error; on a conformal projection it is a multiplicative factor that grows with latitude and can exceed the entire carbon signal being measured.

The mechanism is straightforward. A conformal projection preserves angles by stretching the map increasingly toward the poles, and area scales with the square of that stretch. In Web Mercator the areal scale factor is approximately 1/cos²(φ), so a parcel at 45° latitude appears twice its true area, at 55° roughly three times, and at 65° roughly six times. Nothing warns you. A polygon's `.area` attribute returns a number in projected square metres that looks entirely reasonable until it is divided by 10,000 and reported as hectares.

The failure persists because Web Mercator is the default in nearly every web map, many tile services, and a great deal of downloaded data. A pipeline that ingests a GeoJSON in EPSG:3857, computes area without reprojecting, and multiplies by an emission factor produces a figure that is wrong by a factor an auditor will spot immediately — and that is the good case. The dangerous case is a project at low latitude, where the error is only a few percent: large enough to matter to a tonnage claim, small enough to survive a sanity check.

Two subtler versions of the same problem catch more experienced teams. **UTM used outside its zone**: UTM is nearly area-preserving near its central meridian but distortion grows toward the zone edges, and a project spanning three zones processed entirely in one of them accumulates real error at the extremes. And **mixing projections between stages**: computing area in an equal-area CRS but performing the intersection in a conformal one changes which pixels fall inside a boundary, so the area is right and the selection is wrong.

## Diagnostic Pipeline / Pre-Flight Validation

The diagnostic below measures actual distortion rather than trusting a projection's reputation. It computes the area of a small test polygon at the project centroid on the ellipsoid — using geodesic calculation, which is projection-free — and compares it against the area the candidate projection reports.

```python
from dataclasses import dataclass

import geopandas as gpd
import numpy as np
import structlog
from pyproj import CRS, Geod
from shapely.geometry import Polygon

log = structlog.get_logger()

GEOD = Geod(ellps="WGS84")
ACCEPTABLE_DISTORTION = 0.005      # 0.5%: the tolerance auditors typically expect

CANDIDATES = {
    "EPSG:6933": "WGS 84 / NSIDC EASE-Grid 2.0 Global",
    "ESRI:54009": "World Mollweide",
    "EPSG:3857": "WGS 84 / Pseudo-Mercator (display only)",
    "EPSG:4326": "WGS 84 geographic (degrees, not a projection)",
}


@dataclass(frozen=True)
class DistortionResult:
    crs: str
    name: str
    geodesic_area_m2: float
    projected_area_m2: float
    relative_error: float
    acceptable: bool


def geodesic_area(polygon: Polygon) -> float:
    """Area on the WGS84 ellipsoid — the reference every projection is judged
    against, because it involves no projection at all."""
    lons, lats = polygon.exterior.coords.xy
    area, _ = GEOD.polygon_area_perimeter(list(lons), list(lats))
    return abs(area)


def probe_polygon(lon: float, lat: float, side_km: float = 10.0) -> Polygon:
    """A square of the given side at the given location, in geographic coordinates."""
    dlat = side_km / 111.32
    dlon = side_km / (111.32 * np.cos(np.radians(lat)))
    return Polygon([
        (lon - dlon / 2, lat - dlat / 2), (lon + dlon / 2, lat - dlat / 2),
        (lon + dlon / 2, lat + dlat / 2), (lon - dlon / 2, lat + dlat / 2),
        (lon - dlon / 2, lat - dlat / 2),
    ])


def measure_distortion(lon: float, lat: float,
                       candidates: dict[str, str] = CANDIDATES) -> list[DistortionResult]:
    """Measure, do not assume. A projection's areal fidelity at YOUR latitude is
    an empirical question with a two-line answer."""
    probe = probe_polygon(lon, lat)
    truth = geodesic_area(probe)
    results = []

    for code, name in candidates.items():
        crs = CRS.from_user_input(code)
        if crs.is_geographic:
            # Degrees are not metres; computing .area here yields square degrees,
            # a number with no physical meaning that nonetheless looks plausible.
            log.error("crs.geographic_area", crs=code,
                      hint="never compute area in a geographic CRS")
            results.append(DistortionResult(code, name, truth, float("nan"),
                                            float("nan"), False))
            continue

        projected = gpd.GeoSeries([probe], crs="EPSG:4326").to_crs(crs).area.iloc[0]
        error = float((projected - truth) / truth)
        acceptable = abs(error) <= ACCEPTABLE_DISTORTION

        log.info("crs.distortion", crs=code, name=name, latitude=lat,
                 relative_error=round(error, 5), acceptable=acceptable)
        results.append(DistortionResult(code, name, truth, float(projected),
                                        round(error, 5), acceptable))

    return results
```

<svg viewBox="0 -4 900 302" role="img" aria-labelledby="dist-t dist-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="dist-t">Measured areal error by latitude for four candidate projections</title>
  <desc id="dist-d">A chart of relative areal error against latitude from 0 to 70 degrees. Web Mercator rises steeply from zero error at the equator to plus 100 percent at 45 degrees and plus 460 percent at 65 degrees, drawn in amber and leaving the top of the chart. EASE-Grid 2.0 Global and World Mollweide both sit flat within plus or minus 0.05 percent across the whole range. A local Albers centred on the project sits flat within plus or minus 0.02 percent. A shaded band marks the plus or minus 0.5 percent audit tolerance, which Web Mercator leaves before 6 degrees of latitude. An annotation states that a 50 hectare parcel at 55 degrees measures 153 hectares in Web Mercator.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Measured, not assumed</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Relative areal error of a 10 km test square against its geodesic area on the WGS84 ellipsoid.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="86" y1="76" x2="640" y2="76"/><line x1="86" y1="126" x2="640" y2="126"/>
    <line x1="86" y1="176" x2="640" y2="176"/>
  </g>
  <rect x="86" y="214" width="554" height="26" fill="currentColor" opacity="0.09"/>
  <text x="634" y="232" text-anchor="end" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="currentColor" opacity="0.75">±0.5% audit tolerance</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="86" y1="60" x2="86" y2="254"/>
    <line x1="86" y1="227" x2="640" y2="227"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="78" y="80" text-anchor="end">+400%</text>
    <text x="78" y="130" text-anchor="end">+200%</text>
    <text x="78" y="180" text-anchor="end">+100%</text>
    <text x="78" y="231" text-anchor="end">0</text>
    <text x="86" y="272" text-anchor="middle">0°</text>
    <text x="244" y="272" text-anchor="middle">20°</text>
    <text x="402" y="272" text-anchor="middle">40°</text>
    <text x="561" y="272" text-anchor="middle">60°</text>
    <text x="363" y="290" text-anchor="middle" font-weight="600">latitude</text>
  </g>
  <polyline points="86,227 165,222 244,208 323,186 402,152 481,110 530,80 561,62" fill="none" stroke="#f3a712" stroke-width="3"/>
  <polyline points="86,227 165,227 244,227 323,227 402,227 481,227 561,227 640,227" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <polyline points="86,229 165,229 244,229 323,229 402,229 481,229 561,229 640,229" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="7,4" opacity="0.8"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="470" y="72" fill="#f3a712">Web Mercator (EPSG:3857)</text>
    <text x="470" y="88" fill="currentColor" font-size="8.5" opacity="0.75">leaves tolerance before 6° latitude</text>
    <text x="652" y="222" fill="currentColor">EASE-Grid 2.0 · Mollweide</text>
    <text x="652" y="238" fill="currentColor" opacity="0.8">local Albers</text>
    <text x="652" y="252" fill="currentColor" font-size="8.5" opacity="0.72">all within ±0.05%</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="652" y="120" fill="currentColor" font-size="9.5" font-weight="700">A 50 ha parcel at 55°</text>
    <text x="652" y="136" fill="currentColor" font-size="9.5" opacity="0.85">measures 153 ha here —</text>
    <text x="652" y="152" fill="currentColor" font-size="9.5" opacity="0.85">and nothing objects.</text>
  </g>
</svg>

## Deterministic Transformation Logic

With distortion measured, the selection function below applies the decision procedure and returns a choice together with the evidence that justified it. The evidence is the point: a projection chosen without a recorded distortion measurement is an assertion, and an assertion is what a verifier will challenge.

```python
import geopandas as gpd
import structlog
from pyproj import CRS

log = structlog.get_logger()


def select_analysis_crs(aoi: gpd.GeoDataFrame, *, needs_global_comparability: bool,
                        max_distortion: float = ACCEPTABLE_DISTORTION) -> dict:
    """Choose the analysis projection and return the evidence that justifies it.

    The ordering encodes the trade: a local equal-area projection fits a compact
    project best, but a project that must line up with a global grid pays a
    negligible distortion penalty to use one.
    """
    if aoi.crs is None:
        raise ValueError("area of interest has no CRS; the choice would be unverifiable")

    geographic = aoi.to_crs("EPSG:4326")
    minx, miny, maxx, maxy = geographic.total_bounds
    centroid = geographic.union_all().centroid
    lon, lat = float(centroid.x), float(centroid.y)

    utm_zones = int(maxx // 6) - int(minx // 6) + 1
    crosses_equator = miny < 0 < maxy
    compact = utm_zones == 1 and not crosses_equator

    if compact and not needs_global_comparability:
        # Lambert Azimuthal Equal-Area centred on the project: minimal shape
        # distortion locally, exactly area-preserving everywhere.
        chosen = CRS.from_proj4(
            f"+proj=laea +lat_0={lat:.4f} +lon_0={lon:.4f} "
            "+x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs")
        code, name = chosen.to_proj4(), "Lambert Azimuthal Equal-Area (project-centred)"
    elif needs_global_comparability:
        code, name = "EPSG:6933", "WGS 84 / NSIDC EASE-Grid 2.0 Global"
    else:
        code, name = "ESRI:54009", "World Mollweide"

    measured = measure_distortion(lon, lat, {code: name})[0]
    if not measured.acceptable:
        raise RuntimeError(
            f"{name} shows {measured.relative_error:.4%} areal error at the project "
            f"centroid, above the {max_distortion:.2%} tolerance")

    evidence = {
        "analysis_crs": code,
        "analysis_crs_name": name,
        "centroid_lon": round(lon, 5),
        "centroid_lat": round(lat, 5),
        "utm_zones_spanned": utm_zones,
        "crosses_equator": crosses_equator,
        "needs_global_comparability": needs_global_comparability,
        "measured_areal_error": measured.relative_error,
        "tolerance": max_distortion,
        "reference": "geodesic area on WGS84 ellipsoid",
    }
    log.info("crs.selected", **evidence)
    return evidence


def assert_analysis_crs(gdf: gpd.GeoDataFrame, expected: str, stage: str) -> None:
    """Assert at every stage boundary that geometry is still in the analysis CRS.

    Area computed in one projection and intersection performed in another is the
    quiet version of this bug: the number is right and the selection is wrong.
    """
    if gdf.crs is None or gdf.crs.to_string() != CRS.from_user_input(expected).to_string():
        raise RuntimeError(
            f"{stage}: geometry is in {gdf.crs} but the analysis CRS is {expected}")
```

## Compliance Gating & Audit Trail Generation

Three items belong in the record. The **authority code or full definition** of the analysis projection, not a friendly name — "Albers Equal Area" is ambiguous across a dozen parameterisations, and a proj4 string or WKT is unambiguous. The **measured areal error at the project centroid**, with the geodesic reference stated, which converts the choice from a preference into a measurement. And the **assertion points**, showing that geometry was checked to be in the analysis CRS at each stage boundary rather than assumed.

Verifiers under ISO 14064-3 examine spatial data quality controls, and the projection choice is the most consequential one in the pipeline. Registry methodologies vary in how prescriptive they are — some name an acceptable projection family, others require only that area calculations be demonstrably accurate — but all of them accept a measured distortion figure against a geodesic reference, which is why measuring is easier than arguing. Route the evidence through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) so a re-run years later resolves the same definition.

One gate is worth enforcing in code: **reject geographic coordinate systems for area computation entirely**. Computing `.area` on a GeoDataFrame in EPSG:4326 returns square degrees, a quantity with no physical meaning that varies with latitude and looks entirely plausible in a dataframe. It is the single easiest way to produce a confidently wrong number, and a one-line assertion eliminates it.

The place this goes wrong in practice is not the initial choice but the stage boundaries afterwards, where a library, a file format, or a well-meaning colleague quietly returns geometry in a different space.

<svg viewBox="0 36 908 232" role="img" aria-labelledby="bnd-t bnd-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="bnd-t">Where the analysis projection leaks between pipeline stages</title>
  <desc id="bnd-d">A five-stage pipeline — ingest, harmonise, intersect, zonal statistics, and export — with an assertion gate drawn between each pair. Three leak points are marked. Between harmonise and intersect, a basemap joined in Web Mercator drags the intersection into a conformal space, so the selection of pixels is wrong even though the areas were computed correctly. Between intersect and zonal statistics, a raster read without its CRS written is assumed to be geographic. Between zonal statistics and export, a write to GeoJSON silently converts to WGS84 because the format mandates it, so a downstream consumer computing area gets square degrees. Each gate is labelled with the one-line assertion that catches it.</desc>
  <defs>
    <marker id="bnd-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="12" y="76" width="122" height="52" rx="8" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="76" width="122" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="73" y="107" fill="currentColor" font-size="10" font-weight="700">Ingest</text>
    <rect x="188" y="76" width="122" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="249" y="107" fill="currentColor" font-size="10" font-weight="700">Harmonise</text>
    <rect x="364" y="76" width="122" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="425" y="107" fill="currentColor" font-size="10" font-weight="700">Intersect</text>
    <rect x="540" y="76" width="122" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="601" y="107" fill="currentColor" font-size="10" font-weight="700">Zonal stats</text>
    <rect x="716" y="76" width="122" height="52" rx="8" fill="currentColor" opacity="0.1"/>
    <rect x="716" y="76" width="122" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="777" y="107" fill="currentColor" font-size="10" font-weight="700">Export</text>
    <text x="161" y="66" fill="currentColor" font-size="14" font-weight="700" opacity="0.55">✓</text>
    <text x="337" y="66" fill="#f3a712" font-size="14" font-weight="700">!</text>
    <text x="513" y="66" fill="#f3a712" font-size="14" font-weight="700">!</text>
    <text x="689" y="66" fill="#f3a712" font-size="14" font-weight="700">!</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#bnd-arrow)">
    <line x1="134" y1="102" x2="186" y2="102"/>
    <line x1="310" y1="102" x2="362" y2="102"/>
    <line x1="486" y1="102" x2="538" y2="102"/>
    <line x1="662" y1="102" x2="714" y2="102"/>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="260" y="150" width="196" height="96" rx="8" fill="currentColor" opacity="0.06"/>
    <rect x="260" y="150" width="196" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="274" y="172" fill="#f3a712" font-size="9.5" font-weight="700">basemap joined in 3857</text>
    <text x="274" y="190" fill="currentColor" font-size="9" opacity="0.8">areas right, selection wrong</text>
    <text x="274" y="214" fill="currentColor" font-size="9" font-weight="700">assert_analysis_crs(joined,</text>
    <text x="274" y="228" fill="currentColor" font-size="9" font-weight="700">expected, "intersect")</text>
    <rect x="474" y="150" width="196" height="96" rx="8" fill="currentColor" opacity="0.06"/>
    <rect x="474" y="150" width="196" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="488" y="172" fill="#f3a712" font-size="9.5" font-weight="700">raster CRS not written</text>
    <text x="488" y="190" fill="currentColor" font-size="9" opacity="0.8">reader assumes geographic</text>
    <text x="488" y="214" fill="currentColor" font-size="9" font-weight="700">if src.crs is None: raise</text>
    <text x="488" y="228" fill="currentColor" font-size="9" opacity="0.8">never default a datum</text>
    <rect x="688" y="150" width="200" height="96" rx="8" fill="currentColor" opacity="0.06"/>
    <rect x="688" y="150" width="200" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="702" y="172" fill="#f3a712" font-size="9.5" font-weight="700">GeoJSON forces WGS84</text>
    <text x="702" y="190" fill="currentColor" font-size="9" opacity="0.8">consumer gets square degrees</text>
    <text x="702" y="214" fill="currentColor" font-size="9" font-weight="700">write area_ha as a COLUMN</text>
    <text x="702" y="228" fill="currentColor" font-size="9" opacity="0.8">computed before export</text>
  </g>
</svg>

The third leak deserves special mention because the format, not the code, causes it. GeoJSON mandates WGS84, so any pipeline exporting GeoJSON hands a downstream consumer geographic coordinates regardless of what the analysis used. If that consumer computes area, it gets square degrees. The fix is not to avoid GeoJSON but to compute every area-derived quantity *before* export and carry it as an attribute column, so the consumer never needs to compute geometry-derived values at all. GeoPackage, FlatGeobuf, and GeoParquet all preserve an arbitrary CRS and are better choices for intermediate artefacts, but the attribute-column discipline is worth applying regardless of format, because it removes a whole class of downstream error at the cost of one column.

## Production Integration

1. **Select once, at project setup**, using the decision procedure, and record the evidence dictionary with the project configuration rather than in code.
2. **Reproject once, from the authoritative source**, never from a previously reprojected derivative — chained warps accumulate drift independently of the projection choice.
3. **Assert the CRS at every stage boundary** so a downstream stage cannot silently work in a different space.
4. **Compute all areas, intersections, and zonal statistics in the analysis CRS**, and reproject to a display projection only at the final visualisation step.
5. **Re-measure distortion when the area of interest changes** — a project expansion can move the centroid enough to invalidate a project-centred projection.
6. **Store the definition, not the name**, in the output schema, per the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/).

For raster work the same rules apply with one addition: choose the target resolution explicitly rather than letting the warp infer it, and use nearest-neighbour resampling for categorical layers. An equal-area reprojection with an inferred resolution can change effective pixel area between runs, which shows up as area drift and triggers the invariant described in the [failure mode catalog for spatial MRV pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/failure-mode-catalog-for-spatial-mrv-pipelines/).

## Frequently Asked Questions

### Is UTM good enough if my project is small?

Usually yes, and it has real advantages: familiar units, minimal shape distortion, and universal tool support. UTM's areal error is under about 0.1% within roughly 200 km of the central meridian, comfortably inside audit tolerance. The failure comes at the edges and across zones — a project spanning two or three zones processed in one of them accumulates error that grows toward the far edge. Measure it with the diagnostic above rather than reasoning about it; if the project fits one zone and the measured error is small, UTM is defensible and easy to explain.

### Why EASE-Grid 2.0 rather than Mollweide?

Both are equal-area and both are fine on the criterion that matters. EASE-Grid 2.0 Global (EPSG:6933) has a practical advantage: it is a cylindrical equal-area grid used by several global land-cover and biomass products, so working in it means your project geometry lines up with those products without an extra reprojection of the raster — which is the step where categorical layers get damaged. Mollweide has better global shape properties and looks better on a world map. If you consume global gridded products, prefer EASE-Grid; otherwise the choice is aesthetic.

### Can I compute area in a geographic CRS if I use a geodesic library?

Yes, and it is often the best answer for irregular or very large areas. Geodesic area calculation on the ellipsoid, as `pyproj.Geod` provides, is projection-free and exact to the ellipsoid model — it is the reference the diagnostic above uses. What you cannot do is call `.area` on geographic geometry and get anything meaningful. The practical arrangement is to use a projected equal-area CRS for intersections and zonal work, where a planar computation is needed, and geodesic calculation as an independent cross-check on the totals.

### What if a methodology mandates a specific projection I think is worse?

Follow the methodology and record the measured distortion anyway. Where a prescribed projection produces material error at your latitude, most frameworks allow a justified alternative if the justification is quantitative — a measured comparison against geodesic area is exactly the evidence that supports such a request. What does not work is silently substituting a better projection: the mismatch between your stated method and your actual computation is the kind of discrepancy that turns a technical discussion into a credibility problem.

### How do I handle a project that spans a hemisphere?

Use a global equal-area projection and accept the shape distortion, which does not affect areas. For very large or discontinuous areas, compute per-component areas geodesically and sum them, rather than relying on a single planar computation across a distorted map — and split any geometry crossing the anti-meridian first, or the area computation will be nonsense regardless of the projection. Continental-scale portfolios usually work best with a fixed global grid for comparability plus per-project local projections for detailed work, with the global figure treated as the reported one.

### Does the ellipsoid matter as well as the projection?

Yes, though far less than the projection. An equal-area projection defined on a sphere rather than the WGS84 ellipsoid introduces an areal error of a few tenths of a percent, which is inside most audit tolerances but not negligible if you are already close to one. Use the ellipsoidal definition where the tooling offers it, and record which you used — the distinction is invisible in a friendly projection name and shows up immediately in a geodesic comparison.

### How should the choice be revisited as a portfolio grows?

At the point where a new project would fall outside the current projection's comfortable zone, which for a project-centred equal-area projection is roughly a thousand kilometres from its centre. Rather than stretching one projection across a growing portfolio, keep a per-project analysis projection and a single portfolio-level equal-area grid for aggregation. Areas computed in either are honest; what matters is that each artefact declares which it used, and that the aggregation reprojects geometry rather than summing areas computed under different projections.

### Does the choice affect raster storage as well as analysis?

It does, and the two decisions are worth separating. Storing imagery in its native projection avoids a resampling step at ingestion and preserves the original pixel values; reprojecting at analysis time costs compute but keeps the archive faithful. Where the analysis projection is a global equal-area grid used by other products, storing on that grid saves a reprojection per read and is usually worth the one-time resampling — provided the resampling method is recorded and appropriate to the data type.

## Related guides

- [Geospatial Coordinate Reference Systems (CRS) Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the parent topic and its harmonisation gate.
- [How to Align WGS84 to Local CRS in Python for Carbon Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/how-to-align-wgs84-to-local-crs-in-python-for-carbon-mapping/) — the reprojection walkthrough this choice feeds.
- [Debugging Silent Datum Shifts in Carbon Pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/debugging-silent-datum-shifts-in-carbon-pipelines/) — the other half of getting coordinates right.
- [Failure Mode Catalog for Spatial MRV Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/failure-mode-catalog-for-spatial-mrv-pipelines/) — the invariants that catch a projection mistake in production.
