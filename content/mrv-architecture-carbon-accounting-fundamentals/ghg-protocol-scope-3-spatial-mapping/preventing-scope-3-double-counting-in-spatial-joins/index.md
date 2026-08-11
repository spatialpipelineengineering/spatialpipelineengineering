---
shortTitle: "Preventing Scope 3 Double-Counting in Spatial Joins"
title: "Preventing Scope 3 Double-Counting in Spatial Joins"
description: "Stop spatial joins silently double-counting Scope 3 emissions: detect many-to-many row fan-out, overlapping supplier catchments, and boundary parcels, then apportion by area so aggregated tonnage stays conserved."
slug: preventing-scope-3-double-counting-in-spatial-joins
type: guide
breadcrumb: "Preventing Scope 3 Double-Counting"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Preventing Scope 3 Double-Counting in Spatial Joins

A spatial join is the single most common place where a Scope 3 inventory silently inflates. This guide sits under [GHG Protocol Scope 3 Spatial Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/), the value-chain attribution discipline within the wider [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack, and it addresses the failure that turns a technically correct join into an indefensible tonnage figure. When a `geopandas.sjoin` returns more rows than it received, or when two overlapping supplier catchments both claim the same hectare of activity, the emissions attached to those geometries are counted more than once — and the error is additive, so it survives every downstream sum untouched.

The mechanics of the join itself are covered in the [step-by-step GHG Protocol Scope 3 geospatial calculation](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/step-by-step-ghg-protocol-scope-3-geospatial-calculation/); this page is the troubleshooting companion for when that calculation returns a number that is quietly too large. Double-counting is rarely a crash. It is a `left` join fanning out on a many-to-many predicate, a buffer overlap nobody reconciled, or a boundary parcel intersecting three facilities and being attributed to all three at full weight. Each produces a plausible-looking table that no exception ever flags, which is exactly why detection has to be an explicit gate rather than an assumption — and why the corrected total must be reconciled against a mass balance before it enters the inventory.

<svg viewBox="-4 28 1008 224" role="img" aria-labelledby="dc-t dc-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="dc-t">Spatial join with a fan-out detector and area-apportionment gate</title>
  <desc id="dc-d">Activity geometries and supplier catchments enter a spatial join. A fan-out detector compares row counts before and after the join and inspects per-key group sizes. If rows multiplied or geometries overlap, the flow routes to an area-apportionment gate that weights each match by intersection area over total area and runs a mass-balance check asserting that summed emissions before equal summed emissions after within tolerance. A clean one-to-one join bypasses apportionment. Both paths converge on a single deduplicated, audited emissions total.</desc>
  <defs>
    <marker id="dc-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="12" y="52" width="150" height="60" rx="9"/>
      <rect x="12" y="150" width="150" height="60" rx="9"/>
      <rect x="200" y="101" width="140" height="60" rx="9"/>
    </g>
    <!-- fan-out detector diamond -->
    <polygon points="452,131 520,101 588,131 520,161" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <!-- apportionment gate -->
    <rect x="648" y="44" width="180" height="70" rx="9" fill="none" stroke="#0f6e63" stroke-width="1.8"/>
    <!-- clean pass -->
    <rect x="648" y="176" width="180" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <!-- audited output (accent) -->
    <rect x="852" y="104" width="136" height="86" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="87" y="86">Activity geometries</text>
      <text x="87" y="184">Supplier catchments</text>
      <text x="270" y="136">Spatial join</text>
      <text x="738" y="74">Area apportionment</text>
      <text x="738" y="202">Clean 1:1 join</text>
    </g>
    <text x="920" y="140" fill="#f3a712" font-size="12" font-weight="700">Audited total</text>
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="270" y="153">sjoin &#183; predicate</text>
      <text x="738" y="92">w = A&#8745; / A_total</text>
      <text x="738" y="219">rows unchanged</text>
      <text x="920" y="160">deduplicated</text>
      <text x="920" y="176">mass-balanced</text>
    </g>
    <g fill="currentColor" font-size="10" font-weight="600">
      <text x="520" y="128">rows</text>
      <text x="520" y="142">multiplied?</text>
    </g>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#dc-arrow)">
    <path d="M162 82 C 185 90, 185 118, 198 122"/>
    <path d="M162 180 C 185 172, 185 145, 198 140"/>
    <line x1="340" y1="131" x2="450" y2="131"/>
    <path d="M520 101 C 520 70, 600 79, 646 79"/>
    <path d="M520 161 C 520 195, 600 200, 646 206"/>
    <path d="M828 79 C 858 79, 850 118, 850 128"/>
    <path d="M828 206 C 858 206, 850 172, 850 164"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="10" font-weight="600">
    <text x="560" y="72" fill="#0f6e63">yes / overlap</text>
    <text x="560" y="196" fill="currentColor" opacity="0.8">no</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Prevent Scope 3 double-counting in spatial joins",
  "description": "Detect row multiplication, overlapping catchments, and duplicate geometries after a spatial join, then apportion emissions by intersection area so the aggregated Scope 3 total is conserved and audit-ready.",
  "totalTime": "PT40M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "geopandas" },
    { "@type": "HowToTool", "name": "shapely" },
    { "@type": "HowToTool", "name": "pyproj" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest and set equal-area CRS", "text": "Load activity geometries and supplier catchments, validate CRS tags, and reproject both to an equal-area projection so intersection areas are metric-honest." },
    { "@type": "HowToStep", "name": "Diagnose fan-out and overlap", "text": "Run the spatial join, compare pre- and post-join row counts, inspect per-key group sizes, detect overlapping catchments with a unary union, and flag duplicate geometries and keys." },
    { "@type": "HowToStep", "name": "Apportion by area", "text": "Overlay the layers and weight each match by intersection area divided by the total activity area so shared hectares are split rather than duplicated." },
    { "@type": "HowToStep", "name": "Gate on mass balance", "text": "Assert that the sum of apportioned emissions equals the pre-join total within tolerance, raising if the conservation check fails." },
    { "@type": "HowToStep", "name": "Export with lineage", "text": "Serialize the deduplicated total with an audit manifest recording the CRS, apportionment method, and mass-balance residual." }
  ]
}
</script>

## Root Cause Analysis

Double-counting in a Scope 3 spatial join is a structural property of the join, not a data-entry mistake, and it arrives through four distinct mechanisms.

First, **many-to-many predicates fan rows out.** A `geopandas.sjoin` with `how="left"` and `predicate="intersects"` emits one output row for every left–right geometry pair that satisfies the predicate. If a single activity polygon intersects three supplier catchments, the activity's emission value is replicated across three rows. A later `groupby("supplier").sum()` then attributes the full activity emission to each of the three suppliers, and the inventory total is inflated by a factor equal to the average match multiplicity. The join never errors; it simply returns more rows than it received, and unless that count is checked the inflation is invisible.

Second, **overlapping catchments and buffers count the same activity twice.** Supplier sourcing regions are frequently modelled as buffers around facilities or as Voronoi-style catchments, and these overlap wherever two facilities compete for the same territory. An activity falling in the overlap is legitimately linked to both suppliers, but if each link carries the *full* activity emission rather than a share, the overlap is double-counted. On a dense logistics network, catchment overlaps of 15–30% of total sourced area are routine, and counting them at full weight can inflate the attributed Scope 3 category by a comparable fraction.

Third, **boundary parcels intersect multiple facilities.** A parcel straddling an administrative or catchment boundary intersects every facility whose region touches it. `intersects` is permissive: a shared edge or a one-metre sliver counts as a full match. Without an area-weighted rule, a parcel that is 95% inside facility A and 5% inside facility B is attributed in full to both. Fourth, **duplicate geometries** — the same activity ingested twice from overlapping data extracts, or a self-intersecting multipolygon — introduce duplication before the join even runs, so the fan-out detector must also fingerprint geometries and keys, not just count rows.

## Diagnostic Pipeline: Detecting Silent Fan-Out

Before trusting any aggregated tonnage, run the join under instrumentation that compares pre- and post-join cardinality, inspects per-key group sizes, tests the catchment layer for self-overlap with a `unary_union`, and fingerprints duplicate geometries and keys. Every area comparison here is performed in an equal-area CRS, because `intersects` counts and overlap areas computed in a geographic CRS such as `EPSG:4326` are distorted by latitude and will misrank which overlaps matter. Getting that projection right is the same discipline enforced across the [Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) layer.

```python
import geopandas as gpd
import pandas as pd
import structlog

log = structlog.get_logger()

# Equal-area projection so intersection areas and overlap ratios are metric-honest.
EQUAL_AREA_CRS = "EPSG:6933"  # World Cylindrical Equal Area


def diagnose_join(
    activity: gpd.GeoDataFrame,
    catchments: gpd.GeoDataFrame,
    activity_key: str = "activity_id",
    predicate: str = "intersects",
) -> dict:
    """Run a spatial join under instrumentation and report double-counting risk.

    Detects: row multiplication (pre/post counts + group sizes), overlapping
    catchments (unary_union area vs summed area), duplicate geometries, and
    duplicate join keys — none of which raise on their own.
    """
    issues: list[str] = []

    if activity.crs is None or catchments.crs is None:
        raise ValueError("untagged CRS; refusing to compute areas on a guessed datum.")

    act = activity.to_crs(EQUAL_AREA_CRS)
    catch = catchments.to_crs(EQUAL_AREA_CRS)

    # 1. Duplicate geometries / keys present before the join
    dup_geoms = int(act.geometry.duplicated().sum())
    dup_keys = int(act[activity_key].duplicated().sum())
    if dup_geoms or dup_keys:
        issues.append(f"pre_join_duplicates:geoms={dup_geoms},keys={dup_keys}")

    # 2. Row multiplication: a left join must not add rows
    n_in = len(act)
    joined = gpd.sjoin(act, catch, how="left", predicate=predicate)
    n_out = len(joined)
    fan_out = n_out / n_in if n_in else 1.0
    if n_out > n_in:
        issues.append(f"row_fan_out:{n_in}->{n_out} (x{fan_out:.2f})")

    # 3. Worst-case multiplicity for any single activity
    max_multiplicity = int(joined.groupby(activity_key).size().max())

    # 4. Catchment self-overlap: summed area vs dissolved area
    summed_area = float(catch.geometry.area.sum())
    union_area = float(catch.geometry.unary_union.area)
    overlap_frac = (summed_area - union_area) / summed_area if summed_area else 0.0
    if overlap_frac > 0.001:
        issues.append(f"catchment_overlap:{overlap_frac:.3f}")

    report = {
        "rows_in": n_in,
        "rows_out": n_out,
        "fan_out_ratio": round(fan_out, 3),
        "max_activity_multiplicity": max_multiplicity,
        "catchment_overlap_fraction": round(overlap_frac, 4),
        "safe_to_sum": not issues,
        "issues": issues,
    }
    if issues:
        log.warning("scope3.join.double_count_risk", **report)
    else:
        log.info("scope3.join.clean", **report)
    return report
```

A report with `safe_to_sum=False` must not be aggregated with a plain `groupby().sum()`. A non-unit `fan_out_ratio` or any `catchment_overlap_fraction` above zero means the emissions have to be apportioned, not replicated — which is the job of the transformation step below.

<svg viewBox="0 -4 880 232" role="img" aria-labelledby="fan-t fan-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="fan-t">How a one-to-many spatial join multiplies a single emission across overlapping supplier polygons</title>
  <desc id="fan-d">One parcel emitting 1000 tonnes is intersected with three overlapping supplier catchment polygons. A naive inner join emits one row per matching supplier, each carrying the full 1000 tonnes, so the total becomes 3000 — a three-fold overstatement with no error raised. An area-weighted apportionment instead splits by intersected area, giving 520, 310 and 170 tonnes, which sum back to 1000. A panel notes that the row count is the tell: a join that returns more rows than input parcels has fanned out, and asserting on that count is the cheapest control available.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The join multiplied the tonne, and nothing errored</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">One 1 000 tCO₂e parcel, three overlapping supplier catchments.</text>
    <text x="12" y="70" fill="currentColor" font-size="10" font-weight="700">Naive inner join</text>
  </g>
  <g>
    <rect x="180" y="52" width="180" height="28" rx="5" fill="#f3a712" opacity="0.3"/>
    <rect x="368" y="52" width="180" height="28" rx="5" fill="#f3a712" opacity="0.3"/>
    <rect x="556" y="52" width="180" height="28" rx="5" fill="#f3a712" opacity="0.3"/>
    <text x="270" y="71" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">supplier A · 1 000</text>
    <text x="458" y="71" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">supplier B · 1 000</text>
    <text x="646" y="71" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">supplier C · 1 000</text>
    <text x="752" y="71" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#f3a712">= 3 000 ✗</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="126" fill="currentColor" font-size="10" font-weight="700">Area-weighted</text>
  </g>
  <g>
    <rect x="180" y="108" width="289" height="28" rx="5" fill="currentColor" opacity="0.26"/>
    <rect x="477" y="108" width="172" height="28" rx="5" fill="currentColor" opacity="0.18"/>
    <rect x="657" y="108" width="94" height="28" rx="5" fill="currentColor" opacity="0.1"/>
    <text x="324" y="127" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">A · 520</text>
    <text x="563" y="127" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">B · 310</text>
    <text x="704" y="127" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">C · 170</text>
    <text x="762" y="127" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="currentColor">= 1 000 ✓</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="164" width="856" height="58" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="164" width="856" height="58" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="28" y="186" fill="currentColor" font-size="10" font-weight="700">The row count is the tell.</text>
    <text x="28" y="208" fill="currentColor" font-size="9.5" opacity="0.85">A join returning more rows than input parcels has fanned out. Assert output rows against input rows, and assert that each parcel's shares sum to one.</text>
  </g>
</svg>

## Deterministic Transformation Logic: Area-Weighted Apportionment

The fix is to replace the permissive `intersects` join with an `overlay` intersection that splits each activity across the catchments it touches, weighting every fragment by its share of the activity's total area. The weight for a match is the intersection area divided by the total activity area, so the weights for any single activity sum to one and its emission is partitioned rather than duplicated. This conserves the inventory total by construction; the mass-balance gate then proves it, refusing to emit a result whose apportioned sum drifts from the input sum beyond a tight tolerance.

```python
import geopandas as gpd
import numpy as np
import pandas as pd
import structlog
from datetime import datetime, timezone

log = structlog.get_logger()

EQUAL_AREA_CRS = "EPSG:6933"
MASS_BALANCE_TOL = 1e-6  # relative tolerance on conserved total emissions


def apportion_emissions(
    activity: gpd.GeoDataFrame,
    catchments: gpd.GeoDataFrame,
    emission_col: str = "emissions_tco2e",
    activity_key: str = "activity_id",
    supplier_key: str = "supplier_id",
) -> tuple[pd.DataFrame, dict]:
    """Area-weight Scope 3 emissions across overlapping catchments.

    Each activity's emission is split by (intersection area / total activity
    area), so shared hectares are partitioned, never counted twice. A mass-
    balance gate asserts the apportioned total equals the input total.
    """
    if activity.crs is None or catchments.crs is None:
        raise ValueError("untagged CRS; cannot apportion on a guessed datum.")

    act = activity.to_crs(EQUAL_AREA_CRS).copy()
    catch = catchments.to_crs(EQUAL_AREA_CRS).copy()

    total_before = float(act[emission_col].sum())
    act["_activity_area"] = act.geometry.area

    # Geometric intersection: one row per (activity, catchment) overlap fragment.
    parts = gpd.overlay(
        act[[activity_key, emission_col, "_activity_area", "geometry"]],
        catch[[supplier_key, "geometry"]],
        how="intersection",
        keep_geom_type=True,
    )

    # Weight = fragment area / whole-activity area  ->  weights per activity sum to 1.
    parts["_frag_area"] = parts.geometry.area
    parts["_weight"] = parts["_frag_area"] / parts["_activity_area"]
    parts["apportioned_tco2e"] = parts[emission_col] * parts["_weight"]

    # Activities that fall entirely outside every catchment lose emission mass;
    # recover the residual so the mass balance holds and the gap is auditable.
    attributed = parts.groupby(activity_key)["apportioned_tco2e"].sum()
    orig = act.set_index(activity_key)[emission_col]
    unattributed = float((orig - attributed.reindex(orig.index).fillna(0.0)).clip(lower=0).sum())

    result = (
        parts.groupby(supplier_key)["apportioned_tco2e"].sum().reset_index()
    )

    total_after = float(result["apportioned_tco2e"].sum()) + unattributed
    residual = abs(total_after - total_before) / total_before if total_before else 0.0

    # Mass-balance gate: apportionment must conserve total emissions.
    if residual > MASS_BALANCE_TOL:
        log.error("scope3.apportion.mass_balance_fail",
                  before=total_before, after=total_after, residual=residual)
        raise RuntimeError(
            f"mass balance broken: {total_before:.6f} -> {total_after:.6f} "
            f"(residual {residual:.2e} > tol {MASS_BALANCE_TOL:.0e})")

    manifest = {
        "method": "area_weighted_intersection_apportionment",
        "equal_area_crs": EQUAL_AREA_CRS,
        "total_before_tco2e": round(total_before, 6),
        "total_after_tco2e": round(total_after, 6),
        "unattributed_tco2e": round(unattributed, 6),
        "mass_balance_residual": residual,
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "compliance_standard": "GHG Protocol Scope 3 Category Attribution",
    }
    log.info("scope3.apportion.conserved", **manifest)
    return result, manifest
```

The `unattributed_tco2e` term is deliberate. Activities that overlap no catchment would otherwise vanish from the supplier rollup and silently break the balance; carrying them as an explicit residual keeps the total conserved and makes the coverage gap visible to a verifier rather than hiding it. The weight computation uses `always_xy`-consistent equal-area geometry throughout, so the fragment areas that drive the split are true metric areas and not longitude-stretched approximations.

## Compliance Gating & Audit Trail Generation

Under the GHG Protocol, an emission source must be attributed once and only once across the value chain, and third-party assurance under ISO 14064-3 tests exactly this — the assessor recomputes totals and checks that boundary-straddling sources were not claimed twice. The mass-balance gate is the machine-checkable expression of that requirement: `total_after` equals `total_before` within tolerance, or the pipeline refuses to emit a figure. The manifest records the residual on every run, including the passing ones, so a slowly drifting upstream extract surfaces as a trend before it breaches tolerance.

The apportionment weights are themselves an audit artifact. Because each supplier's share derives from a recorded intersection-area ratio in a named equal-area CRS, an auditor can reconstruct the split for any contested parcel without rerunning the whole pipeline. These outputs should be validated by the same automated checks that guard the rest of the inventory — the [emissions data quality and validation gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/) that assert no supplier total exceeds its plausible sourced volume — and the fan-out ratio, catchment overlap fraction, and mass-balance residual all belong in that gate suite. When the corrected totals flow into disclosure, they must satisfy the traceability expectations set out in [mapping CSRD ESRS E1 disclosures to spatial MRV outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/), which scrutinises value-chain figures for exactly this class of aggregation error.

## Production Integration

Wire the diagnostic and apportionment routines into the Scope 3 pipeline as a fixed ingest → diagnose → transform → validate → export → submit sequence, so double-count prevention is a gate rather than a manual review step:

1. **Ingest.** Load activity geometries and supplier catchments, confirm both carry machine-readable CRS tags, and reproject both to `EPSG:6933` so every area and overlap is metric-honest.
2. **Diagnose.** Run `diagnose_join` and read `safe_to_sum`. A clean one-to-one join with no catchment overlap may be summed directly; anything else routes to apportionment and logs a `structlog` warning with the fan-out ratio and overlap fraction.
3. **Transform.** Call `apportion_emissions` to split each activity across the catchments it intersects by area weight, replacing any `groupby().sum()` on a fanned-out join.
4. **Validate.** The mass-balance gate raises if the apportioned total drifts from the input total; treat the residual, fan-out ratio, and overlap fraction as monitored signals feeding the inventory-wide validation gates.
5. **Export.** Serialize the deduplicated supplier totals with the audit manifest — CRS, method, before/after totals, unattributed residual — intact.
6. **Submit.** Forward the conserved totals and their manifest to the value-chain rollup and, ultimately, disclosure. The end-to-end calculation that consumes these deduplicated figures is detailed in the [step-by-step GHG Protocol Scope 3 geospatial calculation](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/step-by-step-ghg-protocol-scope-3-geospatial-calculation/).

Treated this way, double-counting stops being a subtle statistical inflation discovered during assurance and becomes an assertion the pipeline enforces on every run: emissions are attributed by area, conserved by mass balance, and traceable to a recorded intersection weight.

<svg viewBox="0 -4 880 220" role="img" aria-labelledby="sliv-t sliv-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="sliv-t">Sliver intersections and the minimum-overlap rule that removes them</title>
  <desc id="sliv-d">A histogram of intersection areas produced by joining parcels to supplier catchments. A very large spike sits at areas below 0.01 hectares, containing 1 840 intersections that together account for 0.003 percent of total area — these are slivers caused by boundary digitisation differences, not real overlaps. A second, broad distribution sits between 1 and 400 hectares containing 612 genuine intersections. A threshold line at 0.05 hectares separates them. A panel warns that slivers are individually negligible and collectively expensive, because each one creates a row, an apportionment share, and a supplier attribution that a reviewer must eventually explain.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Most intersections are not overlaps</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Intersection-area histogram from one portfolio join. Note the spike at the left.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="70" y1="52" x2="70" y2="176"/>
    <line x1="70" y1="176" x2="620" y2="176"/>
  </g>
  <g>
    <rect x="76" y="58" width="26" height="118" fill="#f3a712" opacity="0.4"/>
    <rect x="104" y="140" width="26" height="36" fill="currentColor" opacity="0.2"/>
    <rect x="132" y="158" width="26" height="18" fill="currentColor" opacity="0.2"/>
    <rect x="200" y="132" width="26" height="44" fill="currentColor" opacity="0.28"/>
    <rect x="228" y="118" width="26" height="58" fill="currentColor" opacity="0.28"/>
    <rect x="256" y="108" width="26" height="68" fill="currentColor" opacity="0.28"/>
    <rect x="284" y="116" width="26" height="60" fill="currentColor" opacity="0.28"/>
    <rect x="312" y="128" width="26" height="48" fill="currentColor" opacity="0.28"/>
    <rect x="340" y="140" width="26" height="36" fill="currentColor" opacity="0.28"/>
    <rect x="368" y="150" width="26" height="26" fill="currentColor" opacity="0.28"/>
    <rect x="396" y="160" width="26" height="16" fill="currentColor" opacity="0.28"/>
    <rect x="424" y="166" width="26" height="10" fill="currentColor" opacity="0.28"/>
  </g>
  <line x1="172" y1="46" x2="172" y2="182" stroke="currentColor" stroke-width="1.8" stroke-dasharray="5,4"/>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.75">
    <text x="70" y="196" text-anchor="middle">0.001 ha</text>
    <text x="172" y="196" text-anchor="middle">0.05 ha</text>
    <text x="340" y="196" text-anchor="middle">10 ha</text>
    <text x="560" y="196" text-anchor="middle">400 ha</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="94" y="50" font-size="9.5" font-weight="700" fill="#f3a712">1 840 slivers</text>
    <text x="94" y="212" font-size="9" fill="currentColor" opacity="0.8">0.003% of area</text>
    <text x="300" y="98" font-size="9.5" font-weight="700" fill="currentColor">612 real intersections</text>
    <rect x="644" y="52" width="224" height="112" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="644" y="52" width="224" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="660" y="76" fill="currentColor" font-size="10" font-weight="700">Individually negligible,</text>
    <text x="660" y="94" fill="currentColor" font-size="10" font-weight="700">collectively expensive</text>
    <text x="660" y="118" fill="currentColor" font-size="9.5" opacity="0.85">Each sliver creates a row, a share,</text>
    <text x="660" y="134" fill="currentColor" font-size="9.5" opacity="0.85">and a supplier attribution someone</text>
    <text x="660" y="150" fill="currentColor" font-size="9.5" opacity="0.85">will eventually have to explain.</text>
  </g>
</svg>

## Frequently Asked Questions

### How do I know a spatial join has double counted rather than legitimately fanned out?

Compare the summed shares per source feature against one. Legitimate fan-out — a parcel genuinely supplying three buyers — produces shares that sum to exactly one. Double counting produces shares that sum to the number of matches, because each row carried the full quantity. That single assertion catches the failure regardless of how the join was written, and it is cheaper and more reliable than reasoning about join semantics.

### What minimum-overlap threshold should I use?

Set it from the digitisation precision of the least precise input, not from a round number. If supplier catchments were digitised at 1:50,000, boundary disagreement of tens of metres is expected and intersections below roughly a tenth of a hectare are artefacts. Record the threshold and the count of intersections it removed, and check that removed area is a negligible fraction of the total — if it is not, the threshold is too aggressive and is discarding real overlaps.

### Should apportionment use area, volume, or economic value?

Whichever the methodology specifies — and the pipeline's job is to carry the rule as data rather than to choose. Area is defensible for land-use-change emissions where the emission is genuinely spatial. Volume is more appropriate where the parcel's output is the traded quantity. Economic value is used where a methodology allocates by revenue share. Because the same parcel produces materially different tonnages under each, the rule must appear on every row or the figure cannot be reconciled.

### How do I handle a parcel that overlaps two reporting entities in the same group?

Apportion first, consolidate second, and keep both steps visible. Apportioning to the legal entities that hold the relationship gives you rows that reconcile against supplier records; consolidating those rows to the reporting entity applies the equity-share or control rule on top. Collapsing the two steps into one join produces a number that is right for one consolidation approach and silently wrong for any other, and it cannot be re-derived when the group structure changes.

### Does the join need to run in an equal-area projection?

Yes, if apportionment is by area — which it usually is. Intersection areas computed in a conformal projection carry that projection's distortion into the shares, so a supplier whose catchment sits at higher latitude receives a systematically larger share than it should. Compute the intersection geometry and its area in the analysis projection, and assert the CRS at the join boundary so a differently projected input cannot enter unnoticed.

## Related guides

- [GHG Protocol Scope 3 Spatial Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) — the parent value-chain attribution discipline this troubleshooting page sits within.
- [Step-by-Step GHG Protocol Scope 3 Geospatial Calculation](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/step-by-step-ghg-protocol-scope-3-geospatial-calculation/) — the end-to-end calculation these deduplicated totals feed.
- [Emissions Data Quality & Validation Gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/) — where the fan-out and mass-balance checks belong in the inventory gate suite.
- [Mapping CSRD ESRS E1 Disclosures to Spatial MRV Outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/) — the disclosure traceability the corrected totals must satisfy.
- [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) — the foundational stack these Scope 3 attribution rules belong to.
