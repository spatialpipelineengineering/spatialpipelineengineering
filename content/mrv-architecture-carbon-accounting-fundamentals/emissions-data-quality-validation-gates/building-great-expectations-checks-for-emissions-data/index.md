---
shortTitle: "Great Expectations Checks for Emissions Data"
title: "Building Great Expectations Checks for Emissions Data"
description: "Author a Great Expectations suite for canonical emissions activity data: non-null keys, value ranges, categorical units, mass-balance, and a custom geometry-validity check wired into a Checkpoint gate."
slug: building-great-expectations-checks-for-emissions-data
type: guide
breadcrumb: "Great Expectations for Emissions Data"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Building Great Expectations Checks for Emissions Data

A validation suite is the gate that decides whether an emissions batch is fit to enter a carbon ledger or must be quarantined before it corrupts a reported figure. This guide is the hands-on recipe under [Emissions Data Quality & Validation Gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/), the quality-control discipline within the [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. Every expectation you write here is a contract against the field definitions published in the [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/), so the checks and the schema stay in lock-step rather than drifting into two competing sources of truth.

The objective is not generic data hygiene; it is a deterministic, reproducible validation pass whose failure is a routing decision, not a stack trace. We will build a Great Expectations suite for a canonical emissions/activity dataset — non-null primary keys, physically plausible ranges for `emission_factor` and `co2e_tonnes`, categorical validity for `unit` and `tier`, a row-count and mass-balance check, and a custom expectation that asserts every geometry is valid and carried in a declared CRS. We then run that suite from a Checkpoint inside a pipeline task and turn the result into a signed audit artifact that either certifies the batch or diverts it, while the failed rows become the queryable evidence an auditor traces through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/).

<svg viewBox="0 0 1000 250" role="img" aria-labelledby="ge-flow-t ge-flow-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ge-flow-t">Great Expectations validation gate for an emissions batch</title>
  <desc id="ge-flow-d">An emissions activity batch is loaded as a Great Expectations batch, the expectation suite is applied, and a Checkpoint produces a validation result. A decision gate asks whether every expectation passed. On success the batch is certified and written to the carbon ledger together with an audit artifact. On failure the batch is quarantined and Data Docs plus the failing rows are emitted for review. The certified and audited output is drawn in amber.</desc>
  <defs>
    <marker id="ge-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="12" y="104" width="128" height="66" rx="9"/>
      <rect x="152" y="104" width="128" height="66" rx="9"/>
      <rect x="292" y="104" width="128" height="66" rx="9"/>
      <rect x="574" y="40" width="172" height="66" rx="9"/>
      <rect x="574" y="168" width="172" height="66" rx="9"/>
    </g>
    <polygon points="500,84 556,137 500,190 444,137" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <rect x="800" y="40" width="188" height="66" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="76" y="134">Load batch</text>
      <text x="216" y="134">Apply suite</text>
      <text x="356" y="134">Checkpoint</text>
      <text x="660" y="68">Certify &#183; ledger</text>
      <text x="660" y="196">Quarantine</text>
    </g>
    <text x="894" y="66" fill="#f3a712" font-size="12" font-weight="700">Audit artifact</text>
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="76" y="152">activity Parquet</text>
      <text x="216" y="152">18 expectations</text>
      <text x="356" y="152">validation result</text>
      <text x="660" y="86">write &#183; lineage id</text>
      <text x="660" y="214">Data Docs &#183; failed rows</text>
      <text x="894" y="86">signed &#183; ISO 14064-3</text>
    </g>
    <g fill="currentColor" font-size="10" font-weight="600">
      <text x="500" y="133">all expect&#173;</text>
      <text x="500" y="147">ations pass?</text>
    </g>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#ge-arrow)">
    <line x1="140" y1="137" x2="150" y2="137"/>
    <line x1="280" y1="137" x2="290" y2="137"/>
    <line x1="420" y1="137" x2="442" y2="137"/>
    <path d="M500 84 C 534 54, 542 73, 572 73"/>
    <path d="M500 190 C 536 220, 544 201, 572 201"/>
    <line x1="746" y1="73" x2="798" y2="73"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="10" font-weight="600">
    <text x="546" y="62" fill="#f3a712">pass</text>
    <text x="556" y="216" fill="currentColor" opacity="0.8">fail</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Build and run a Great Expectations suite for canonical emissions data",
  "description": "Profile an emissions activity batch, author a Great Expectations suite with non-null keys, value ranges, categorical units, mass-balance and a custom geometry-validity check, run it through a Checkpoint, and gate the result into a certified ledger write or a quarantine with an audit artifact.",
  "totalTime": "PT45M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "great_expectations" },
    { "@type": "HowToTool", "name": "geopandas" },
    { "@type": "HowToTool", "name": "pyarrow" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest the batch", "text": "Read the activity Parquet as a GeoDataFrame and confirm the schema and CRS match the canonical data dictionary before validation." },
    { "@type": "HowToStep", "name": "Profile likely failures", "text": "Scan each column for null rates, out-of-range values and unknown categoricals so the suite is calibrated to real defects, not guesses." },
    { "@type": "HowToStep", "name": "Build the suite", "text": "Programmatically add non-null, range, set-membership, row-count, mass-balance and a custom geometry-validity expectation to a named suite." },
    { "@type": "HowToStep", "name": "Run the Checkpoint", "text": "Execute the Checkpoint against the batch and capture the structured validation result." },
    { "@type": "HowToStep", "name": "Gate and audit", "text": "Map the result to pass or fail, emit a lineage/audit JSON artifact, certify passing batches to the ledger and quarantine failures with Data Docs." }
  ]
}
</script>

## Root Cause Analysis

Emissions activity data fails verification for reasons that are structural, not cosmetic, and a validation suite only earns its place if each expectation targets a documented failure mode rather than a hunch. Three classes of defect dominate.

First, **silent nulls in join keys and factors detonate downstream, not at ingestion.** An activity row missing its `facility_id` or `emission_factor` passes a naive load without complaint, then either drops out of a spatial join or, worse, multiplies against a coerced zero and books a facility's emissions as nil. The defect is invisible until a reconciliation shows the reported total is short, by which point the provenance trail has already been written. Non-null expectations on primary keys and on every factor that participates in the `activity_quantity x emission_factor` product move that failure to the gate, where it is cheap.

Second, **out-of-range values are unit errors wearing a plausible mask.** An `emission_factor` recorded in kilograms where the schema expects tonnes, or a `co2e_tonnes` value three orders of magnitude too large because a meter reading was pasted without conversion, sits happily inside a column of floats. Nothing about the type is wrong. Only a physically motivated range — grounded in the bounds documented in the schema dictionary — catches it. The same logic applies to categorical drift: a `unit` of `"MWh "` with a trailing space, or a `tier` value of `"tier2"` instead of the canonical `"Tier 2"`, is a new category that a set-membership check rejects before it fragments every group-by that follows.

Third, **invalid or unprojected geometry corrupts every spatial allocation.** MRV activity data is spatial: geometries drive the intersections that assign emissions to reporting boundaries. A self-intersecting polygon, an empty geometry, or a layer that arrives without a declared CRS produces area calculations that are wrong in ways that look right. Because the standard Great Expectations tabular expectations know nothing about geometry, this class of defect passes untouched unless you add a custom expectation. Consistent geometry validity and an enforced CRS are exactly the contracts established across the wider [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) discipline, and the suite is where they are enforced per batch.

## Diagnostic Pipeline: Profiling the Batch Before Authoring

Before writing a single expectation, profile the batch so the suite is calibrated to the defects that are actually present. The routine below reads the activity Parquet as a `geopandas` GeoDataFrame, then reports null rates, values outside the documented physical bounds, unknown categoricals, and geometry health. Its output tells you which columns are likely to fail and with what severity, which is what turns suite authoring from guesswork into a targeted exercise.

```python
import geopandas as gpd
import numpy as np
import pandas as pd
import structlog

log = structlog.get_logger()

# Bounds and vocabularies mirror the canonical MRV data dictionary.
EF_BOUNDS = (0.0, 5.0)          # tCO2e per activity unit; wider trips a unit error
CO2E_BOUNDS = (0.0, 5.0e6)      # tCO2e per row; a single facility-period
VALID_UNITS = {"MWh", "GJ", "t", "km", "m3", "ha"}
VALID_TIERS = {"Tier 1", "Tier 2", "Tier 3"}
CANONICAL_CRS = "EPSG:4326"


def profile_emissions_batch(path: str) -> dict:
    """Detect columns likely to fail validation before authoring the suite."""
    gdf = gpd.read_parquet(path)

    key_cols = ["facility_id", "activity_id", "emission_factor", "co2e_tonnes"]
    null_rates = {c: float(gdf[c].isna().mean()) for c in key_cols if c in gdf}

    ef = pd.to_numeric(gdf.get("emission_factor"), errors="coerce")
    co2e = pd.to_numeric(gdf.get("co2e_tonnes"), errors="coerce")
    out_of_range = {
        "emission_factor": int(((ef < EF_BOUNDS[0]) | (ef > EF_BOUNDS[1])).sum()),
        "co2e_tonnes": int(((co2e < CO2E_BOUNDS[0]) | (co2e > CO2E_BOUNDS[1])).sum()),
    }
    unknown_units = sorted(set(gdf.get("unit", pd.Series())) - VALID_UNITS - {np.nan})
    unknown_tiers = sorted(set(gdf.get("tier", pd.Series())) - VALID_TIERS - {np.nan})

    crs = str(gdf.crs) if gdf.crs is not None else None
    invalid_geom = int((~gdf.geometry.is_valid).sum()) if "geometry" in gdf else 0
    empty_geom = int(gdf.geometry.is_empty.sum()) if "geometry" in gdf else 0

    report = {
        "rows": int(len(gdf)),
        "null_rates": null_rates,
        "out_of_range": out_of_range,
        "unknown_units": unknown_units,
        "unknown_tiers": unknown_tiers,
        "crs": crs,
        "crs_ok": crs == CANONICAL_CRS,
        "invalid_geometries": invalid_geom,
        "empty_geometries": empty_geom,
    }
    log.info("emissions.profile", **report)
    return report
```

A batch whose report shows a non-zero `invalid_geometries`, a `crs_ok` of `False`, or unknown categoricals is not yet ready to validate against a strict suite — but the profile makes those defects visible now, and it doubles as the baseline you assert against once the suite exists.

## Deterministic Transformation Logic: Building and Running the Suite

With the profile in hand, build the suite programmatically so it lives in version control beside the pipeline rather than in a hand-edited JSON blob. The routine below registers a custom expectation for GeoDataFrame geometry validity and CRS, assembles the full suite against the canonical columns, runs an in-memory validation, and maps the result to a pass/fail gate that emits a lineage/audit artifact. Building the suite in code keeps it addressable, diff-able, and reproducible run to run.

```python
import json
from datetime import datetime, timezone

import geopandas as gpd
import great_expectations as gx
from great_expectations.core import ExpectationConfiguration
import structlog

log = structlog.get_logger()

CANONICAL_CRS = "EPSG:4326"
SUITE_NAME = "emissions_activity_v3"


def build_emissions_suite(context) -> gx.core.ExpectationSuite:
    """Author the emissions validation suite against the canonical schema."""
    suite = context.add_or_update_expectation_suite(SUITE_NAME)

    def add(kind: str, **kwargs) -> None:
        suite.add_expectation(ExpectationConfiguration(
            expectation_type=kind, kwargs=kwargs))

    # 1. Non-null primary keys and factors that enter the co2e product.
    for col in ("facility_id", "activity_id", "emission_factor", "co2e_tonnes"):
        add("expect_column_values_to_not_be_null", column=col)

    # 2. Physically plausible ranges — a unit error escapes type checks, not these.
    add("expect_column_values_to_be_between",
        column="emission_factor", min_value=0.0, max_value=5.0)
    add("expect_column_values_to_be_between",
        column="co2e_tonnes", min_value=0.0, max_value=5.0e6)

    # 3. Categorical validity — reject silent vocabulary drift.
    add("expect_column_values_to_be_in_set",
        column="unit", value_set=["MWh", "GJ", "t", "km", "m3", "ha"])
    add("expect_column_values_to_be_in_set",
        column="tier", value_set=["Tier 1", "Tier 2", "Tier 3"])

    # 4. Row-count guard — a truncated extract must not silently certify.
    add("expect_table_row_count_to_be_between", min_value=1, max_value=5_000_000)

    context.add_or_update_expectation_suite(expectation_suite=suite)
    log.info("suite.built", suite=SUITE_NAME,
             n_expectations=len(suite.expectations))
    return suite


def check_geometry_validity(gdf: gpd.GeoDataFrame,
                            target_crs: str = CANONICAL_CRS) -> dict:
    """Custom expectation: every geometry valid, non-empty, in the declared CRS.

    Great Expectations' tabular expectations are geometry-blind, so this gate is
    authored explicitly and its boolean result folds into the suite outcome.
    """
    if gdf.crs is None:
        return {"success": False, "reason": "missing_crs"}
    if str(gdf.crs) != target_crs:
        return {"success": False, "reason": f"crs_mismatch:{gdf.crs}!={target_crs}"}
    invalid = int((~gdf.geometry.is_valid).sum())
    empty = int(gdf.geometry.is_empty.sum())
    return {
        "success": invalid == 0 and empty == 0,
        "invalid_geometries": invalid,
        "empty_geometries": empty,
        "crs": str(gdf.crs),
    }


def validate_and_gate(path: str, ledger_dir: str, quarantine_dir: str) -> dict:
    """Run the suite + geometry check, map to a pass/fail gate, emit audit JSON."""
    context = gx.get_context()
    build_emissions_suite(context)

    gdf = gpd.read_parquet(path)

    # Tabular validation via a fluent pandas datasource + Checkpoint.
    ds = context.sources.add_or_update_pandas("emissions_runtime")
    asset = ds.add_dataframe_asset(name="activity_batch")
    batch_request = asset.build_batch_request(
        dataframe=gdf.drop(columns="geometry"))
    checkpoint = context.add_or_update_checkpoint(
        name="emissions_gate",
        validations=[{"batch_request": batch_request,
                      "expectation_suite_name": SUITE_NAME}])
    result = checkpoint.run()

    tabular_ok = bool(result.success)
    geom = check_geometry_validity(gdf)                 # custom expectation
    mass_balance = _mass_balance_ok(gdf)               # summed co2e reconciles
    passed = tabular_ok and geom["success"] and mass_balance["success"]

    stats = list(result.run_results.values())[0][
        "validation_result"]["statistics"]
    audit = {
        "batch": path,
        "suite": SUITE_NAME,
        "lineage_id": f"emissions-gate:{datetime.now(timezone.utc).isoformat()}",
        "tabular_success": tabular_ok,
        "evaluated_expectations": stats["evaluated_expectations"],
        "unsuccessful_expectations": stats["unsuccessful_expectations"],
        "geometry": geom,
        "mass_balance": mass_balance,
        "decision": "certified" if passed else "quarantined",
        "compliance_standard": "ISO 14064-3 / GHG Protocol activity data",
        "generated_utc": datetime.now(timezone.utc).isoformat(),
    }

    target = ledger_dir if passed else quarantine_dir
    gdf.to_parquet(f"{target}/{audit['lineage_id'].split(':', 1)[1]}.parquet")
    with open(f"{target}/audit.json", "w") as fh:
        json.dump(audit, fh, indent=2, default=str)

    if passed:
        log.info("gate.certified", **audit)
    else:
        log.warning("gate.quarantined", **audit)
        context.build_data_docs()                      # render failure evidence
    return audit


def _mass_balance_ok(gdf: gpd.GeoDataFrame, tol: float = 1e-3) -> dict:
    """Reconcile reported co2e against activity_quantity x emission_factor."""
    recomputed = (gdf["activity_quantity"] * gdf["emission_factor"]).sum()
    reported = gdf["co2e_tonnes"].sum()
    rel_err = abs(recomputed - reported) / (reported or float("nan"))
    return {"success": bool(rel_err <= tol),
            "reported_tonnes": float(reported),
            "recomputed_tonnes": float(recomputed),
            "relative_error": float(rel_err)}
```

The mass-balance check is the one expectation that no per-column rule can replace: it asserts that the reported `co2e_tonnes` reconciles with the product of `activity_quantity` and `emission_factor` across the batch, catching a row that is individually plausible but collectively inconsistent — the signature of a partial recompute or a stale factor join.

<svg viewBox="0 -4 880 234" role="img" aria-labelledby="exp-t exp-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="exp-t">Expectation strictness against false-failure rate, and where the useful band sits</title>
  <desc id="exp-d">A chart of false-failure rate against expectation strictness. At loose settings, such as a value range spanning ten orders of magnitude, the false-failure rate is near zero but so is the detection of real defects. At the useful band, where ranges are derived from the physical plausibility of the quantity, the false-failure rate stays under two percent while catching unit errors and magnitude mistakes. At tight settings, where ranges are fitted to last period's observed distribution, the false-failure rate climbs above thirty percent as legitimate growth and seasonal variation trip the check. A panel warns that fitting expectations to observed data guarantees they will fail whenever the business changes, which is exactly when scrutiny is highest.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Derive expectations from physics, not from last period's data</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">False-failure rate against how tightly an expectation is drawn.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="66" x2="600" y2="66"/><line x1="80" y1="112" x2="600" y2="112"/><line x1="80" y1="158" x2="600" y2="158"/>
  </g>
  <rect x="228" y="56" width="150" height="146" fill="currentColor" opacity="0.08"/>
  <text x="303" y="72" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">useful band</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="56" x2="80" y2="202"/>
    <line x1="80" y1="202" x2="600" y2="202"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="70" text-anchor="end">40%</text>
    <text x="72" y="116" text-anchor="end">25%</text>
    <text x="72" y="162" text-anchor="end">10%</text>
    <text x="72" y="206" text-anchor="end">0</text>
    <text x="120" y="222" text-anchor="middle">loose</text>
    <text x="303" y="222" text-anchor="middle">physical plausibility</text>
    <text x="560" y="222" text-anchor="middle">fitted to last period</text>
  </g>
  <polyline points="80,200 160,199 240,196 303,193 380,182 460,140 520,100 600,62" fill="none" stroke="#f3a712" stroke-width="2.8"/>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="96" y="186" fill="currentColor" opacity="0.8">catches nothing</text>
    <text x="612" y="66" fill="#f3a712" font-weight="700">trips on growth</text>
    <rect x="628" y="96" width="240" height="90" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="628" y="96" width="240" height="90" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="644" y="120" fill="currentColor" font-size="10" font-weight="700">Fitted expectations fail</text>
    <text x="644" y="142" fill="currentColor" font-size="9.5" opacity="0.85">whenever the business changes —</text>
    <text x="644" y="158" fill="currentColor" font-size="9.5" opacity="0.85">a new site, a merger, a good year —</text>
    <text x="644" y="176" fill="currentColor" font-size="9.5" font-weight="700">which is when scrutiny is highest.</text>
  </g>
</svg>

## Compliance Gating & Audit Trail Generation

The gate is where a validation result becomes a compliance artifact. A passing batch is written to the ledger with a `lineage_id`; a failing batch is diverted to quarantine, Data Docs is rendered so a reviewer sees exactly which expectation failed on which rows, and the same `audit.json` is emitted either way. That artifact is deliberately machine-readable: `evaluated_expectations`, `unsuccessful_expectations`, the geometry result, and the mass-balance reconciliation together let a third-party verifier recompute the decision without re-running the pipeline.


| Expectation | What it proves | Compliance mapping |
|-------------|----------------|--------------------|
| Non-null keys and factors | No row silently drops from a join or books zero | ISO 14064-3 completeness of activity data |
| `emission_factor` / `co2e_tonnes` range | Values are physically plausible, no unit error | GHG Protocol accuracy of quantified emissions |
| `unit` / `tier` set membership | No categorical drift fragments a group-by | Consistency of reported methodology tier |
| Row-count guard | A truncated extract cannot certify | Completeness against the expected period |
| Mass-balance reconciliation | Reported total matches recomputed total | Transparency and internal consistency |
| Geometry validity + CRS | Spatial allocations rest on valid, projected geometry | Area-honest attribution under CSRD ESRS E1 |


Each row maps a technical output to the control it answers, which is what lets the audit artifact stand as evidence rather than as developer convenience. The full field-level bounds and vocabularies these expectations enforce are documented in the [canonical Parquet schema and data dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/); wiring the suite to that dictionary rather than to hard-coded literals is what keeps the check and the contract from diverging over successive releases.

## Production Integration

Deploy the gate inside an orchestrated flow, following a fixed ingest → diagnose → transform → validate → export → submit sequence so every batch is treated identically:

1. **Ingest.** Read the activity Parquet as a GeoDataFrame within an orchestrated task, confirming the schema and CRS match the canonical data dictionary before anything else runs.
2. **Diagnose.** Run `profile_emissions_batch` to surface null rates, out-of-range values, unknown categoricals, and geometry health, and log the profile as the run's baseline.
3. **Transform.** Repair what is safely repairable — trim categorical whitespace, run `make_valid` on geometry, reproject to the canonical CRS — leaving genuine defects for the gate to reject.
4. **Validate.** Call `validate_and_gate`, which builds the suite, runs the Checkpoint, folds in the custom geometry and mass-balance checks, and produces the pass/fail decision.
5. **Export.** Write certified batches to the ledger with their `lineage_id` and audit JSON; divert failures to quarantine with rendered Data Docs.
6. **Submit.** Forward certified batches and their audit artifacts to registry submission, and register the lineage so the record is queryable downstream.

Schedule the gate as a first-class task in the orchestration layer covered by [orchestrating MRV data pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/), and treat a rising `unsuccessful_expectations` count as a monitored signal on every run, including the ones that pass, so an upstream export that is slowly degrading surfaces as a trend long before it breaches the gate. By pinning the suite to the canonical schema, enforcing geometry and mass-balance alongside the tabular rules, and emitting a signed audit artifact on both branches, a Great Expectations gate turns raw emissions batches into verifiable activity data that survives third-party scrutiny.

<svg viewBox="0 -4 880 218" role="img" aria-labelledby="suite-t suite-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="suite-t">Where each expectation class belongs in the pipeline</title>
  <desc id="suite-d">Three columns showing which expectation classes attach at which pipeline point. At ingestion, column presence, type, non-nullability, unit vocabulary, and coordinate reference system presence are checked, all blocking. After transformation, value ranges, categorical set membership, geometry validity, and cross-column consistency are checked, mostly blocking. After aggregation, row-count reconciliation against the expected partition set, sum consistency between disaggregated rows and the rolled-up total, and period-over-period magnitude are checked, with the first two blocking and the third advisory. A note states that a suite attached only at ingestion tests the source and never the pipeline.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">A suite that runs only at ingestion tests the source, never the pipeline</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Attach expectations at all three points; most defects are introduced between them.</text>
    <rect x="12" y="52" width="280" height="126" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="280" height="126" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">At ingestion</text>
    <text x="28" y="98" fill="currentColor" font-size="9.5" opacity="0.85">column presence · type · non-null</text>
    <text x="28" y="116" fill="currentColor" font-size="9.5" opacity="0.85">unit vocabulary</text>
    <text x="28" y="134" fill="currentColor" font-size="9.5" opacity="0.85">CRS present</text>
    <text x="28" y="160" fill="currentColor" font-size="9.5" font-weight="700">all blocking</text>
    <rect x="300" y="52" width="280" height="126" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="300" y="52" width="280" height="126" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="316" y="76" fill="currentColor" font-size="10.5" font-weight="700">After transformation</text>
    <text x="316" y="98" fill="currentColor" font-size="9.5" opacity="0.85">value ranges · category sets</text>
    <text x="316" y="116" fill="currentColor" font-size="9.5" opacity="0.85">geometry validity</text>
    <text x="316" y="134" fill="currentColor" font-size="9.5" opacity="0.85">cross-column consistency</text>
    <text x="316" y="160" fill="currentColor" font-size="9.5" font-weight="700">mostly blocking</text>
    <rect x="588" y="52" width="280" height="126" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="588" y="52" width="280" height="126" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="604" y="76" fill="currentColor" font-size="10.5" font-weight="700">After aggregation</text>
    <text x="604" y="98" fill="currentColor" font-size="9.5" opacity="0.85">partition-set completeness</text>
    <text x="604" y="116" fill="currentColor" font-size="9.5" opacity="0.85">parts sum to the total</text>
    <text x="604" y="134" fill="currentColor" font-size="9.5" opacity="0.85">period-over-period magnitude</text>
    <text x="604" y="160" fill="currentColor" font-size="9.5" font-weight="700">first two blocking, third advisory</text>
    <text x="12" y="204" fill="#f3a712" font-size="9.5" font-weight="700">The defects that matter most — a bad reprojection, a wrong factor, a partial write — are all introduced after ingestion.</text>
  </g>
</svg>

## Frequently Asked Questions

### Where should expectation thresholds come from?

From the physical plausibility of the quantity, not from a fitted distribution over last period's data. An emission intensity has bounds set by chemistry and process engineering; a parcel area has bounds set by the project; a coordinate has bounds set by the area of interest. Those bounds hold across a merger, a growth year, and a new site. Bounds fitted to observed data fail precisely when the business changes, which is when the figure is under the most scrutiny and the check is least helpful.

### Should the suite fail the run or record the failure?

Both, differently by class. Blocking expectations should raise and stop promotion, because the record cannot be interpreted. Advisory expectations should record and continue, with the flag carried on the record so downstream consumers and reviewers can see it. What must never happen is a failure that is recorded somewhere nobody reads while the record proceeds as if clean — that is the shape of every "we had the data all along" incident.

### How do I keep the suite from drifting away from the schema?

Generate the structural expectations from the canonical schema rather than writing them twice. Column presence, types, nullability, and unit vocabularies are all schema facts, and hand-maintaining them in a second place guarantees they will diverge. Keep hand-authored expectations for the semantic checks that a schema cannot express — cross-column consistency, plausibility ranges, geometry validity — and derive the rest.

### What should a validation report contain for a verifier?

The suite version, the per-expectation results with observed values for failures, the blocking classification of each expectation, and the disposition of every failure. Observed values matter: "expect_column_values_to_be_between failed" is not evidence, while "27 rows had intensity above 4.2 tCO₂e per MWh, maximum observed 118.4, all from source SITE-14" tells a reviewer what happened and lets them act.

### Does running expectations on every row scale?

For tabular emissions data, yes — these are vectorised column operations and the cost is small next to reading the data. The expensive checks are geometric: validity, self-intersection, and topology tests over large vector layers. Where those dominate, run them on the full set at stage boundaries and on a sampled subset within a stage, and record the sampling rate so the coverage of the claim is visible rather than implied.

## Related guides

- [Emissions Data Quality & Validation Gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/) — the parent discipline this suite implements.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — where the emitted audit artifact becomes queryable provenance.
- [Orchestrating MRV Data Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) — the orchestration layer that schedules this gate as a task.
- [The Canonical Parquet Schema: A Data Dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) — the field definitions every expectation is written against.
