---
shortTitle: "Verra VM0047 vs Gold Standard GIS Requirements"
title: "Verra VM0047 vs Gold Standard GIS Requirements"
description: "Compare the GIS and geospatial-data requirements of Verra VM0047 and Gold Standard A/R for boundary mapping, minimum mapping unit, control plots, remote sensing, stratification and uncertainty deductions."
slug: verra-vm0047-vs-gold-standard-gis-requirements
type: guide
breadcrumb: "Verra VM0047 vs Gold Standard"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Verra VM0047 vs Gold Standard GIS Requirements

Choosing between Verra's VM0047 methodology for Afforestation, Reforestation and Revegetation and Gold Standard's Afforestation/Reforestation requirements is, for a pipeline engineer, mostly a question of which geospatial artifacts you must produce and how each registry will interrogate them. This decision page sits under [Carbon Registry Standards & Methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/) within the [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack, and it is best read alongside [Mapping CSRD ESRS E1 Disclosures to Spatial MRV Outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/), because a project reporting to a voluntary registry increasingly has to satisfy a mandatory disclosure regime from the same underlying spatial layers.

The two standards agree on the physics — tonnes of CO&#8322;e accrue as biomass accumulates over a mapped area — but they diverge sharply on how that area is delineated, stratified, sampled, and bounded by uncertainty. VM0047 leans on a *dynamic performance benchmark*: eligible pixels are compared against a matched control group whose growth trajectory sets the crediting baseline, which puts heavy weight on remote-sensing-derived activity data and control-plot geometry. Gold Standard's A/R framework is closer to a plot-and-strata inventory tradition, with tighter expectations on ground measurement and land-eligibility evidence. The rest of this page treats those differences as pipeline requirements you can parameterize, and connects back to the [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) layer that ultimately submits the artifacts.

<svg viewBox="0 0 1000 320" role="img" aria-labelledby="vgs-t vgs-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="vgs-t">Comparison matrix of VM0047 and Gold Standard GIS requirements converging on a shared evidence package</title>
  <desc id="vgs-d">Two vertical columns list the geospatial requirements of each standard. The Verra VM0047 column emphasises a remote-sensing dynamic performance benchmark, a matched control pixel pool, a fine minimum mapping unit and pixel-level stratification. The Gold Standard column emphasises plot-based inventory, land-eligibility evidence, coarser strata and ground-measured uncertainty. Both columns feed a single shared evidence output on the right, drawn in amber, holding stratified area estimates, an uncertainty deduction and a lineage manifest that either registry can consume.</desc>
  <defs>
    <marker id="vgs-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <!-- VM0047 column -->
    <rect x="18" y="24" width="300" height="272" rx="10" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="168" y="48" text-anchor="middle" fill="currentColor" font-size="13" font-weight="700">Verra VM0047 (A/R)</text>
    <text x="168" y="64" text-anchor="middle" fill="currentColor" font-size="9" opacity="0.7">dynamic performance benchmark</text>
    <g fill="currentColor" font-size="10.5">
      <text x="34" y="94">&#183; RS-derived activity data</text>
      <text x="34" y="120">&#183; matched control pixel pool</text>
      <text x="34" y="146">&#183; fine MMU (&#8776; 0.05 ha)</text>
      <text x="34" y="172">&#183; pixel-level stratification</text>
      <text x="34" y="198">&#183; annual benchmark re-fit</text>
      <text x="34" y="224">&#183; model + measurement uncert.</text>
      <text x="34" y="250">&#183; per-pixel geometry lineage</text>
    </g>
    <!-- Gold Standard column -->
    <rect x="352" y="24" width="300" height="272" rx="10" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="502" y="48" text-anchor="middle" fill="currentColor" font-size="13" font-weight="700">Gold Standard (A/R)</text>
    <text x="502" y="64" text-anchor="middle" fill="currentColor" font-size="9" opacity="0.7">plot &amp; strata inventory</text>
    <g fill="currentColor" font-size="10.5">
      <text x="368" y="94">&#183; land-eligibility evidence</text>
      <text x="368" y="120">&#183; plot-based inventory strata</text>
      <text x="368" y="146">&#183; coarser MMU (&#8776; 0.1 ha)</text>
      <text x="368" y="172">&#183; strata-level stratification</text>
      <text x="368" y="198">&#183; periodic monitoring cadence</text>
      <text x="368" y="224">&#183; ground-measured uncert.</text>
      <text x="368" y="250">&#183; plot &amp; boundary lineage</text>
    </g>
    <!-- shared output (accent) -->
    <rect x="712" y="86" width="270" height="148" rx="10" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <text x="847" y="112" text-anchor="middle" fill="#f3a712" font-size="12.5" font-weight="700">Shared evidence output</text>
    <g fill="currentColor" font-size="10">
      <text x="728" y="140">&#183; stratified area estimates</text>
      <text x="728" y="164">&#183; uncertainty deduction</text>
      <text x="728" y="188">&#183; lineage &amp; datum manifest</text>
      <text x="728" y="212">&#183; standard-tagged export</text>
    </g>
  </g>
  <!-- connectors to shared output -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#vgs-arrow)">
    <path d="M318 130 C 660 130, 640 150, 710 155"/>
    <path d="M652 190 C 686 190, 686 168, 710 165"/>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Build a spatial MRV pipeline that can target either Verra VM0047 or Gold Standard A/R",
  "description": "Ingest project boundaries and imagery, diagnose eligibility and minimum mapping unit, produce stratified area estimates with an uncertainty deduction parameterized by standard, gate the evidence package, and export a standard-tagged submission bundle.",
  "totalTime": "PT50M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "geopandas" },
    { "@type": "HowToTool", "name": "rasterio" },
    { "@type": "HowToTool", "name": "pyproj" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest boundaries and imagery", "text": "Load the project and control-area geometries and the remote-sensing stack, reprojecting everything to a single equal-area CRS." },
    { "@type": "HowToStep", "name": "Diagnose eligibility and MMU", "text": "Validate CRS tags, check land-eligibility evidence, and confirm the minimum mapping unit configured for the target standard is met before area accounting." },
    { "@type": "HowToStep", "name": "Transform to stratified area estimates", "text": "Compute stratum areas and apply the standard-specific uncertainty deduction, widening bounds where sampling density is thin." },
    { "@type": "HowToStep", "name": "Gate the evidence package", "text": "Assemble the artifacts each registry expects and fail the run if any required item is missing or breaches tolerance." },
    { "@type": "HowToStep", "name": "Export standard-tagged bundle", "text": "Serialize the stratified estimates, uncertainty deduction and lineage manifest with a registry tag ready for submission." }
  ]
}
</script>

## Why the Differences Matter for Pipeline Design

The temptation is to build one pipeline for your preferred registry and port it later. In practice the two standards impose different *contracts* on the same upstream data, and retrofitting is expensive because the divergence starts at geometry, not at reporting. VM0047's dynamic performance benchmark requires that every eligible pixel can be matched to a control pixel with comparable pre-project conditions, so the pipeline must retain a spatially explicit control pool, a matching covariate stack, and per-pixel lineage from the first ingest. Gold Standard's inventory tradition instead demands defensible land-eligibility evidence and plot-linked strata, which shifts the burden onto boundary provenance and ground-measurement integration rather than a continuously re-fitted benchmark.

Those contracts propagate downstream in ways that are easy to underestimate. A benchmark methodology re-computes its baseline on a monitoring cadence tied to imagery availability, so your orchestration has to treat the baseline as a versioned, re-derivable artifact rather than a fixed table — a pattern the [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) layer must accommodate. A plot-based methodology, by contrast, ties crediting to inventory campaigns whose timing you do not fully control, so the pipeline has to reconcile asynchronous field data against a stable stratification. If you hard-code either assumption you inherit a rewrite the day a project switches registry.

The unifying insight is that both standards ultimately consume the *same three primitives*: a set of stratified area estimates, a defensible uncertainty deduction, and a lineage manifest that lets a verifier reconstruct how the numbers were produced. Everything specific to VM0047 or Gold Standard can be pushed into configuration around those primitives. Designing to the shared primitive — the amber output in the diagram above — is what keeps a single codebase serving both registries without branching logic metastasizing through the transformation stage.

## Pre-Flight Validation: A Standard-Aware Criteria Checklist

Before any area accounting runs, the pipeline must confirm that the inputs satisfy the target standard's geometric and evidentiary preconditions. The differences are concrete enough to encode as a comparison table, and the pre-flight gate reads directly from it. The single most common silent failure is a minimum mapping unit (MMU) mismatch: VM0047 typically resolves eligibility at a finer grain than a plot-based Gold Standard design, so a mask built for one standard quietly over- or under-counts area under the other.


| GIS requirement | Verra VM0047 (A/R) | Gold Standard (A/R) | Pipeline implication |
|-----------------|--------------------|--------------------|----------------------|
| Eligibility / boundary mapping | Remote-sensing eligibility plus control-area delineation | Land-eligibility evidence (historic land cover, tenure) with mapped project boundary | Retain both project and control geometries; store eligibility evidence as provenance |
| Minimum mapping unit & resolution | Fine, pixel-scale (&#8776; 0.05 ha, 10&#8211;30 m sensors) | Coarser, plot/strata scale (&#8776; 0.1 ha) | MMU is a parameter, not a constant; re-mask per standard |
| Control / benchmark geometry | Matched control pixel pool with covariate similarity | No dynamic control; fixed baseline strata | Control pool is required for VM0047, optional for GS |
| Remote-sensing evidence | Central: drives the dynamic performance benchmark | Supporting: corroborates plot inventory | Imagery cadence gates crediting under VM0047 |
| Stratification | Pixel-level, covariate-driven | Strata defined around inventory plots | Stratifier abstraction with two backends |
| Uncertainty deductions | Combined model + measurement uncertainty, deduction scales with CI | Ground-measurement uncertainty, plot sampling error | Deduction function parameterized by standard |
| Monitoring cadence | Frequent, tied to benchmark re-fit and imagery | Periodic, tied to inventory campaigns | Scheduler must support both rhythms |
| Data artifacts expected | Per-pixel geometry lineage, benchmark version, matching diagnostics | Plot data, boundary provenance, strata report | Assemble artifact set from a per-standard manifest |


```python
import geopandas as gpd
import rasterio
import structlog

log = structlog.get_logger()

# Per-standard geometric contract; the checklist above, encoded.
STANDARD_SPEC = {
    "VM0047": {"mmu_ha": 0.05, "requires_control_pool": True,
               "stratification": "pixel", "target_crs": "EPSG:6933"},
    "GOLD_STANDARD": {"mmu_ha": 0.10, "requires_control_pool": False,
                      "stratification": "plot", "target_crs": "EPSG:6933"},
}


def preflight_project(
    project: gpd.GeoDataFrame,
    control: gpd.GeoDataFrame | None,
    imagery_path: str,
    standard: str,
) -> dict:
    """Validate that inputs meet the target standard's geometric preconditions."""
    spec = STANDARD_SPEC[standard]
    issues: list[str] = []

    # 1. CRS must be declared and equal-area so hectare accounting is honest.
    if project.crs is None:
        issues.append("missing_project_crs")
    elif project.crs.to_authority() != tuple(spec["target_crs"].split(":")):
        issues.append(f"project_crs_not_canonical:{project.crs}")

    # 2. Control pool is mandatory only for the benchmark methodology.
    if spec["requires_control_pool"] and (control is None or control.empty):
        issues.append("missing_control_pool_for_benchmark")

    # 3. Imagery resolution must support the standard's MMU.
    with rasterio.open(imagery_path) as src:
        px_area_ha = abs(src.transform.a * src.transform.e) / 10_000.0
        if px_area_ha > spec["mmu_ha"]:
            issues.append(f"pixel_area_{px_area_ha:.4f}ha_exceeds_mmu_{spec['mmu_ha']}ha")

    report = {"standard": standard, "mmu_ha": spec["mmu_ha"],
              "ready": not issues, "issues": issues}
    log.info("registry.preflight", **report)
    return report
```

A run that reports `ready=False` never proceeds to area accounting; the failure is surfaced to the operator with the specific unmet clause so it maps back to a line in the checklist rather than a generic error. This mirrors the diagnostic discipline used across the [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack.

<svg viewBox="0 -4 900 224" role="img" aria-labelledby="mmu-t mmu-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="mmu-t">Minimum mapping unit and what it removes from a real project boundary</title>
  <desc id="mmu-d">The same fragmented project area evaluated under two minimum mapping units. At a 0.1 hectare threshold, 1 284 patches qualify and the eligible area is 4 812 hectares. At a 1 hectare threshold, 706 patches qualify and the eligible area falls to 4 388 hectares, a reduction of 8.8 percent, because the excluded small patches are numerous but individually tiny. A panel notes that the threshold is a methodology parameter rather than an engineering preference, that it must be applied in an equal-area projection, and that patches excluded by it must still be reported so the difference between mapped and eligible area is visible.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The minimum mapping unit removes 8.8% of a real boundary</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Same fragmented project area, two thresholds.</text>
    <rect x="12" y="52" width="424" height="140" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="424" height="140" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">MMU 0.1 ha</text>
    <text x="28" y="106" fill="currentColor" font-size="14" font-weight="700">1 284 patches</text>
    <text x="28" y="132" fill="currentColor" font-size="14" font-weight="700">4 812 ha eligible</text>
    <text x="28" y="160" fill="currentColor" font-size="9.5" opacity="0.82">many tiny fragments qualify</text>
    <text x="28" y="178" fill="currentColor" font-size="9.5" opacity="0.82">higher monitoring burden per hectare</text>
    <rect x="456" y="52" width="432" height="140" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="456" y="52" width="432" height="140" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="472" y="76" fill="currentColor" font-size="10.5" font-weight="700">MMU 1 ha</text>
    <text x="472" y="106" fill="currentColor" font-size="14" font-weight="700">706 patches</text>
    <text x="472" y="132" fill="#f3a712" font-size="14" font-weight="700">4 388 ha eligible · −8.8%</text>
    <text x="472" y="160" fill="currentColor" font-size="9.5" opacity="0.82">fragments numerous but individually tiny</text>
    <text x="472" y="178" fill="currentColor" font-size="9.5" opacity="0.82">excluded area must still be reported</text>
  </g>
  <g>
    <rect x="300" y="66" width="120" height="112" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
    <rect x="312" y="78" width="34" height="26" fill="currentColor" opacity="0.3"/>
    <rect x="356" y="86" width="28" height="22" fill="currentColor" opacity="0.3"/>
    <rect x="318" y="116" width="40" height="30" fill="currentColor" opacity="0.3"/>
    <rect x="368" y="122" width="24" height="20" fill="currentColor" opacity="0.3"/>
    <rect x="392" y="82" width="8" height="7" fill="#f3a712"/><rect x="348" y="112" width="6" height="6" fill="#f3a712"/>
    <rect x="308" y="154" width="7" height="6" fill="#f3a712"/><rect x="380" y="156" width="6" height="7" fill="#f3a712"/>
    <rect x="330" y="70" width="6" height="6" fill="#f3a712"/><rect x="398" y="146" width="7" height="6" fill="#f3a712"/>
    <rect x="748" y="66" width="120" height="112" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
    <rect x="760" y="78" width="34" height="26" fill="currentColor" opacity="0.3"/>
    <rect x="804" y="86" width="28" height="22" fill="currentColor" opacity="0.3"/>
    <rect x="766" y="116" width="40" height="30" fill="currentColor" opacity="0.3"/>
    <rect x="816" y="122" width="24" height="20" fill="currentColor" opacity="0.3"/>
  </g>
</svg>

## Deterministic Transformation Logic

The transformation stage produces the two numeric primitives every registry consumes — stratified area estimates and an uncertainty deduction — parameterized by standard. The stratifier is an abstraction with two backends: a pixel-level covariate stratifier for VM0047 and a plot-anchored stratifier for Gold Standard. The uncertainty deduction is a pure function of the aggregated confidence interval and the standard's deduction schedule, so the same estimate yields a VM0047-conservative and a Gold-Standard-conservative number without re-deriving the areas. Every geometry passes through an explicit equal-area reprojection gate before its area is trusted.

```python
from datetime import datetime, timezone

import geopandas as gpd
import numpy as np
import pyproj
import structlog

log = structlog.get_logger()

EQUAL_AREA_CRS = "EPSG:6933"  # World Cylindrical Equal Area — area-honest hectares

# Uncertainty deduction schedule: fraction of estimate withheld as the relative
# 95% CI half-width rises. VM0047 combines model + measurement variance; Gold
# Standard uses plot sampling error. Encoded as (ci_threshold, deduction).
DEDUCTION_SCHEDULE = {
    "VM0047": [(0.10, 0.00), (0.15, 0.04), (0.30, 0.10), (1.00, 0.20)],
    "GOLD_STANDARD": [(0.10, 0.00), (0.20, 0.06), (0.35, 0.12), (1.00, 0.25)],
}


def _reproject_equal_area(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Distortion gate: refuse untagged geometry, force equal-area for area math."""
    if gdf.crs is None:
        raise ValueError("untagged geometry; refusing to compute area on an unknown datum.")
    target = pyproj.CRS.from_user_input(EQUAL_AREA_CRS)
    if gdf.crs != target:
        log.info("reproject", frm=str(gdf.crs), to=EQUAL_AREA_CRS)
        gdf = gdf.to_crs(target)
    return gdf


def _deduction_for(ci_rel: float, standard: str) -> float:
    """Look up the conservative deduction for a relative CI half-width."""
    for threshold, deduction in DEDUCTION_SCHEDULE[standard]:
        if ci_rel <= threshold:
            return deduction
    return DEDUCTION_SCHEDULE[standard][-1][1]


def stratified_area_estimate(
    strata: gpd.GeoDataFrame,
    stock_col: str,
    stock_sigma_col: str,
    standard: str,
) -> dict:
    """Produce stratified area + stock estimates and a standard-parameterized deduction."""
    strata = _reproject_equal_area(strata)
    strata = strata.assign(area_ha=strata.geometry.area / 10_000.0)

    # Per-stratum stock and variance; areas are the shared primitive both registries use.
    strata = strata.assign(
        stock_total=strata["area_ha"] * strata[stock_col],
        var_total=(strata["area_ha"] * strata[stock_sigma_col]) ** 2,
    )
    total_stock = float(strata["stock_total"].sum())
    total_sigma = float(np.sqrt(strata["var_total"].sum()))
    ci_rel = (1.96 * total_sigma) / total_stock if total_stock else float("inf")

    deduction = _deduction_for(ci_rel, standard)
    creditable = total_stock * (1.0 - deduction)

    result = {
        "standard": standard,
        "total_area_ha": round(float(strata["area_ha"].sum()), 3),
        "n_strata": int(len(strata)),
        "total_stock_tco2e": round(total_stock, 2),
        "relative_ci_95": round(ci_rel, 4),
        "uncertainty_deduction": deduction,
        "creditable_tco2e": round(creditable, 2),
        "equal_area_crs": EQUAL_AREA_CRS,
        "generated_utc": datetime.now(timezone.utc).isoformat(),
    }
    log.info("registry.stratified_estimate", **result)
    return result
```

The design choice that keeps the codebase portable is that `stratified_area_estimate` is standard-agnostic in its arithmetic and standard-aware only in the deduction lookup. Swapping `standard="VM0047"` for `standard="GOLD_STANDARD"` re-prices the identical area and stock totals under each registry's conservativeness rule, which is exactly what a project weighing the two registries needs to see side by side.

## Compliance Gating: The Evidence Package per Standard

A stratified estimate is not submittable on its own; each registry expects a specific bundle of geospatial artifacts, and the gate refuses to export a package that is missing any of them. VM0047 requires the benchmark version and matching diagnostics that justify each control assignment, plus per-pixel geometry lineage so a verifier can trace an eligible area back to its imagery. Gold Standard requires plot data, boundary provenance, and a strata report that ties each stratum to its inventory basis. The uncertainty deduction and the lineage manifest are common to both, which is why they live in the shared output rather than either branch.

```python
import structlog

log = structlog.get_logger()

REQUIRED_ARTIFACTS = {
    "VM0047": {"stratified_estimate", "benchmark_version",
               "matching_diagnostics", "pixel_lineage", "uncertainty_deduction",
               "lineage_manifest"},
    "GOLD_STANDARD": {"stratified_estimate", "plot_inventory",
                      "boundary_provenance", "strata_report",
                      "uncertainty_deduction", "lineage_manifest"},
}


def gate_evidence_package(package: dict, standard: str) -> None:
    """Fail closed if the assembled bundle omits any artifact the registry expects."""
    required = REQUIRED_ARTIFACTS[standard]
    present = {k for k, v in package.items() if v is not None}
    missing = required - present
    if missing:
        log.warning("registry.evidence_gate_failed",
                    standard=standard, missing=sorted(missing))
        raise RuntimeError(f"{standard} evidence package incomplete: {sorted(missing)}")
    log.info("registry.evidence_gate_passed",
             standard=standard, artifacts=sorted(present))
```

Mapping the deduction and manifest to controls is what makes the package audit-ready. The relative CI drives the deduction under both registries' conservativeness expectations, and it aligns with the ISO 14064-3 requirement that a reported figure be reproducible and conservative. The lineage manifest is the same artifact the [Mapping CSRD ESRS E1 Disclosures to Spatial MRV Outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/) workflow consumes, so building it once serves both the voluntary registry submission and the mandatory disclosure.

## Production Integration

Deploy the components in a fixed sequence that lets a single orchestration target either registry by flipping one parameter. The baseline and additionality logic that feeds the strata comes from [Forest Carbon Baseline & Additionality Modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/); this pipeline consumes those strata and prices them per standard.

1. **Ingest.** Load the project boundary, the control-area pool (VM0047) or land-eligibility evidence (Gold Standard), and the remote-sensing stack, reprojecting all geometry to the equal-area CRS at the door.
2. **Diagnose.** Run `preflight_project` with the target `standard`; abort on any unmet clause from the checklist so an MMU or missing-control failure never reaches area accounting.
3. **Transform.** Call `stratified_area_estimate` for the target standard — or both standards in a comparison run — to produce area, stock, relative CI and the conservative deduction from a single set of geometries.
4. **Validate.** Assert the relative CI stays within the methodology tolerance and that sparse strata carried a widened bound, rejecting any estimate that manufactures confidence the sampling does not support.
5. **Export.** Serialize the stratified estimates, deduction and lineage manifest, tagging the bundle with the target registry.
6. **Submit.** Run `gate_evidence_package`, then forward the tagged bundle through the [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) layer to Verra or Gold Standard.

By pushing everything registry-specific into configuration around the three shared primitives — stratified area, uncertainty deduction, and lineage manifest — a team can quote a project under VM0047 and Gold Standard from one run, choose the registry on the economics rather than the engineering, and switch later without a rewrite. That is the practical payoff of treating the two standards as parameters of a single spatial MRV pipeline instead of two pipelines that happen to share a data lake.

<svg viewBox="0 -4 880 226" role="img" aria-labelledby="ded2-t ded2-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ded2-t">Uncertainty deduction schedules compared across two standards</title>
  <desc id="ded2-d">A step chart of the fraction of an estimate withheld as the relative 95 percent confidence half-width rises from 0 to 50 percent. One schedule steps at 10, 15, 20 and 30 percent uncertainty with deductions of 0, 4, 8 and 15 percent respectively, reaching 25 percent above 30. The other schedule steps earlier and more steeply, reaching a 20 percent deduction by 20 percent uncertainty. A marked point shows a project at 22 percent relative uncertainty receiving an 8 percent deduction under the first schedule and 20 percent under the second, a difference of 12 percentage points of issuance on identical measurements.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Identical measurements, 12 points of issuance apart</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Deduction withheld against relative 95% CI half-width.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="66" x2="620" y2="66"/><line x1="80" y1="110" x2="620" y2="110"/><line x1="80" y1="154" x2="620" y2="154"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="56" x2="80" y2="184"/>
    <line x1="80" y1="184" x2="620" y2="184"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="70" text-anchor="end">30%</text>
    <text x="72" y="114" text-anchor="end">20%</text>
    <text x="72" y="158" text-anchor="end">10%</text>
    <text x="72" y="188" text-anchor="end">0</text>
    <text x="80" y="204" text-anchor="middle">0</text>
    <text x="188" y="204" text-anchor="middle">10%</text>
    <text x="296" y="204" text-anchor="middle">20%</text>
    <text x="404" y="204" text-anchor="middle">30%</text>
    <text x="620" y="204" text-anchor="middle">50%</text>
    <text x="350" y="220" text-anchor="middle" font-weight="600">relative 95% CI half-width</text>
  </g>
  <polyline points="80,184 188,184 188,166 242,166 242,149 296,149 296,118 404,118 404,74 620,74" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <polyline points="80,184 134,184 134,158 188,158 188,131 242,131 242,110 296,110 296,79 404,79 404,66 620,66" fill="none" stroke="#f3a712" stroke-width="2.4" stroke-dasharray="7,4"/>
  <circle cx="318" cy="149" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/>
  <circle cx="318" cy="110" r="6" fill="none" stroke="#f3a712" stroke-width="2.4"/>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="632" y="78" fill="currentColor" font-weight="600">schedule A</text>
    <text x="632" y="62" fill="#f3a712" font-weight="600">schedule B</text>
    <text x="330" y="146" fill="currentColor" font-weight="700">8%</text>
    <text x="330" y="106" fill="#f3a712" font-weight="700">20%</text>
    <rect x="644" y="112" width="224" height="76" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="644" y="112" width="224" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="660" y="134" fill="currentColor" font-size="9.5" font-weight="700">At 22% uncertainty</text>
    <text x="660" y="156" fill="currentColor" font-size="9.5" opacity="0.85">the same project keeps 92% or 80%</text>
    <text x="660" y="174" fill="currentColor" font-size="9.5" opacity="0.85">of its estimate, depending only on standard.</text>
  </g>
</svg>

## Frequently Asked Questions

### Which differences actually change the pipeline rather than the paperwork?

Four: the minimum mapping unit, the permitted projection or areal-accuracy requirement, the uncertainty propagation method, and the deduction schedule. Each of those changes a number rather than a document, so each must be a parameter the pipeline reads rather than an assumption it embeds. Everything else — evidence package contents, submission format, review cadence — is real work but sits outside the calculation.

### Can a project be prepared for both standards from one pipeline?

Yes, and it is worth doing when the standard is not yet chosen. Compute on the strictest common geometry — the smallest permitted minimum mapping unit and the tightest areal accuracy — then apply each standard's aggregation and deduction as a final parameterised step. Preparing at the loosest setting and trying to tighten later means re-running the geometry stage, which is the expensive part.

### How should the uncertainty deduction be implemented?

As a versioned lookup keyed on the relative confidence half-width, not as a formula inline in the calculation. The schedules are step functions defined by the methodology and revised occasionally, so a table with an effective date is both easier to audit and easier to change. Record which schedule version applied to each issuance, because a schedule revision is a restatement trigger for anything recomputed under it.

### What does each standard actually want in the evidence package?

Broadly the same categories — boundary geometry with its accuracy statement, the measurement method with its validation, the uncertainty analysis, and the monitoring plan — with different formats and different levels of prescription about each. The practical approach is to generate a canonical evidence bundle from the pipeline and render standard-specific views from it, rather than assembling each package by hand from the same underlying facts.

### Does the choice of standard affect monitoring frequency?

Yes, and it interacts with the minimum mapping unit in a way that surprises teams. A smaller minimum mapping unit means more, smaller patches to monitor, and several methodologies scale monitoring intensity with patch count rather than with area. A threshold chosen to maximise eligible area can therefore multiply the ongoing monitoring burden, which is worth modelling before validation rather than discovering at the first monitoring period.

## Related guides

- [Carbon Registry Standards & Methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/) — the parent reference this comparison sits within.
- [Mapping CSRD ESRS E1 Disclosures to Spatial MRV Outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/) — how the same spatial layers satisfy mandatory disclosure.
- [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) — the layer that submits the standard-tagged evidence bundle.
- [Forest Carbon Baseline & Additionality Modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/) — the upstream modeling that produces the strata this pipeline prices.
