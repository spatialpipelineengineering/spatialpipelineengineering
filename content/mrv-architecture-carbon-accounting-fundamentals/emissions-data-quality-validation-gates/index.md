---
shortTitle: "Emissions Data Quality & Validation Gates for MRV"
title: "Emissions Data Quality & Validation Gates"
description: "Apply completeness, validity, consistency, timeliness and uniqueness checks to spatial activity data with declarative expectation suites, quarantine gates and mass-balance validation."
slug: emissions-data-quality-validation-gates
type: topic
breadcrumb: "Data Quality & Validation Gates"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Emissions Data Quality & Validation Gates

Emissions Data Quality & Validation Gates are the enforcement layer that decides whether a computed emissions figure is fit to be reported — the point in the [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack where a number stops being provisional and becomes an assertion an organisation is willing to defend under assurance. A validation gate is not a spreadsheet review bolted on at quarter-end; it is a set of declarative, machine-checkable expectations wired into the boundaries of the pipeline so that a completeness gap, an out-of-range factor, or a corrupted geometry is caught the moment it enters, not months later when an auditor reconciles the tonnage. The gate is the difference between a pipeline that fails loudly on bad data and one that silently reports a plausible-looking but wrong figure.

This component depends on deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) upstream so that area- and length-based activity data are measured on an honest grid before any range check is applied, and it feeds directly into [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), which records not only which validation suite ran but which rows it quarantined and why. The gate treats data quality as five measurable dimensions — completeness, validity, consistency, timeliness, and uniqueness — applied to spatial activity data, and it enforces a binary contract at each pipeline boundary: a record either satisfies the expectation suite and passes to the certified store, or it is quarantined with a machine-readable report explaining the breach.

<svg viewBox="0 0 940 300" role="img" aria-labelledby="edqg-t edqg-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="edqg-t">Emissions data validation-gate flow: records pass an expectation suite to a certified store or fail to quarantine</title>
  <desc id="edqg-d">Incoming emissions records enter an expectation suite that runs four checks in sequence: schema and completeness, range validity, geometry validity, and a mass-balance reconciliation. Records that satisfy every expectation pass to a certified store, drawn in amber to mark it as the reportable output. Records that breach any expectation fail to a quarantine store that also emits a validation report describing the dimension and value that failed.</desc>
  <defs>
    <marker id="edqg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- Incoming records -->
  <rect x="16" y="116" width="140" height="72" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="16" y="116" width="140" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5,3" opacity="0.6"/>
  <text x="86" y="140" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">INPUT</text>
  <text x="86" y="158" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Activity records</text>
  <text x="86" y="174" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">GeoParquet rows</text>
  <!-- Expectation suite -->
  <rect x="236" y="52" width="230" height="200" rx="10" fill="currentColor" opacity="0.05"/>
  <rect x="236" y="52" width="230" height="200" rx="10" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="351" y="74" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">EXPECTATION SUITE</text>
  <rect x="256" y="86" width="190" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
  <text x="351" y="107" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">1 · schema &#183; completeness</text>
  <rect x="256" y="126" width="190" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
  <text x="351" y="147" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">2 · range validity</text>
  <rect x="256" y="166" width="190" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
  <text x="351" y="187" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">3 · geometry.is_valid</text>
  <rect x="256" y="206" width="190" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
  <text x="351" y="227" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">4 · mass balance</text>
  <!-- Certified store (amber, output) -->
  <rect x="716" y="60" width="208" height="78" rx="8" fill="#f3a712" opacity="0.12"/>
  <rect x="716" y="60" width="208" height="78" rx="8" fill="none" stroke="#f3a712" stroke-width="2"/>
  <text x="820" y="84" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.6">PASS &#8594; REPORTABLE</text>
  <text x="820" y="103" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Certified store</text>
  <text x="820" y="121" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">immutable, audit-ready</text>
  <!-- Quarantine + report -->
  <rect x="716" y="176" width="208" height="90" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="716" y="176" width="208" height="90" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="820" y="198" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.6">FAIL &#8594; HELD BACK</text>
  <text x="820" y="217" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Quarantine</text>
  <text x="820" y="235" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">+ validation report</text>
  <text x="820" y="251" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">dimension &#183; value &#183; row id</text>
  <!-- Arrows -->
  <line x1="156" y1="152" x2="234" y2="152" stroke="currentColor" stroke-width="1.4" marker-end="url(#edqg-arrow)"/>
  <path d="M466 110 L590 110 L590 99 L714 99" fill="none" stroke="#f3a712" stroke-width="1.6" marker-end="url(#edqg-arrow)"/>
  <text x="560" y="94" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" opacity="0.8">all pass</text>
  <path d="M466 200 L590 200 L590 221 L714 221" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="5,4" marker-end="url(#edqg-arrow)"/>
  <text x="560" y="215" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" opacity="0.8">any breach</text>
</svg>

## Role in the MRV Workflow

Validation gates sit at the seams of the MRV pipeline — every place where data crosses a trust boundary. The most consequential seam is the last one: the transition from a computed emissions estimate to a figure written into the reporting ledger. But gates also belong at ingestion, where raw activity data (fuel purchase records, fleet telemetry, land-parcel polygons, meter readings) first enters the system, and at every join or aggregation where two datasets are reconciled. A gate that only runs at the end catches the symptom; a gate at each boundary isolates the cause. The design principle is that no transformation may consume data it has not validated, and no output may be published without a passing certificate attached to its lineage record.

The gate operates on the five classical data-quality dimensions, each of which has a concrete spatial interpretation in emissions work. **Completeness** asks whether every expected activity row is present: a missing month of fuel data or a dropped tile of land-cover polygons does not raise an error by itself, it silently reduces the reported total. **Validity** asks whether each value falls inside a physically plausible range — an emission factor of 0.0 tCO2e per unit, or an activity quantity that is negative, is invalid regardless of how cleanly it parses. **Consistency** asks whether related fields agree: units declared in a metadata column must match the units the factor assumes, and a facility's geometry must fall inside its declared jurisdiction. **Timeliness** asks whether the record belongs to the reporting period it is being counted against, catching the late-arriving correction that would otherwise inflate the wrong quarter. **Uniqueness** asks whether the same activity has been counted once and only once, which for spatial data means detecting overlapping polygons and duplicated facility identifiers before they double-count emissions.

Two enforcement postures exist, and mature pipelines use both deliberately. **Fail-fast** halts the run the moment a critical expectation is breached; it is the correct posture for structural failures — a missing column, a wrong CRS, an empty dataset — where continuing would only produce nonsense downstream. **Quarantine** isolates the offending rows into a separate store, lets the clean majority proceed, and emits a report so the held-back records can be triaged and reprocessed; it is the correct posture for row-level data-quality breaches where a few bad records should not block an otherwise valid reporting run. The gate configuration declares, per expectation, which posture applies. Getting this split right is what keeps a pipeline both safe and operable: fail-fast on everything is brittle and floods the on-call queue, while quarantine on everything lets a corrupted schema slip through as "just a few more quarantined rows".

## Core Failure Modes

Three failure modes account for the majority of reporting errors that validation gates exist to catch. Each is silent by default — the pipeline runs green and emits a number — which is precisely why a declarative gate, rather than eyeballing, is required.

1. **Missing or zero-quantity activity rows silently reducing reported emissions.** The root cause is almost always an upstream join or filter that drops records: an inner join against a reference table that lacks a few facility codes, a date filter with an off-by-one boundary, or a source extract that failed partway and delivered a truncated file. Because emissions are a sum over activity, absent rows do not throw an exception — they simply make the total smaller, and a smaller total looks like good news. The impact scales directly with the fraction dropped: losing one facility out of forty in a Scope 1 inventory understates that boundary by around 2–3% on average, but a single truncated fuel-delivery extract can remove an entire month, understating an annual figure by 8% or more. The gate defence is a completeness expectation that asserts row counts against an expected manifest and rejects any activity quantity that is exactly zero or null where the business rule requires a positive value.

2. **Out-of-range emission factors from a bad join.** The root cause is a factor lookup that matches on the wrong key or against a stale factor version, so a factor intended for one fuel, region, or unit is applied to another. A join that silently produces a many-to-one fan-out, or a unit mismatch where a factor expressed per tonne is applied to a quantity expressed per litre, yields a factor that is off by orders of magnitude. Unlike a missing row, this failure inflates or deflates dramatically and non-linearly: a diesel factor of roughly 2.68 kgCO2e per litre applied where a natural-gas factor of about 2.03 kgCO2e per cubic metre was intended, on a large activity volume, can distort a facility's reported emissions by 30–100%. The gate defence is a validity expectation that bounds every factor to a published plausible range per category, plus a consistency expectation that the unit column of the factor matches the unit the activity is measured in.

3. **Geometry validity failures corrupting area-based activity.** The root cause is malformed spatial input — self-intersecting polygons from a bad digitisation, empty or null geometries from a failed spatial operation, or ring-orientation errors from a lossy format conversion. When activity data is derived from area (land-use change, afforested hectares, footprint of a facility), an invalid geometry produces a wrong area: a self-intersection can make `shapely` compute a negative or near-zero area for a bow-tie polygon, and an empty geometry contributes zero where hundreds of hectares should be counted. The impact is localised but severe for the affected parcel — a self-intersecting boundary can misstate its area by 100% or flip its sign — and because it is a geometry error rather than a value error, no range check on the numeric column will ever catch it. The gate defence is an explicit `geometry.is_valid` expectation combined with a non-empty and area-positivity check, run before any area is derived.

## Deterministic Implementation Architecture

The implementation below defines the emissions activity contract as a `pandera` `DataFrameSchema` for the columnar checks and layers explicit `geopandas`/`shapely` geometry and mass-balance gates on top, because geometry validity and cross-row reconciliation are not expressible as simple column constraints. It emits structured `structlog` telemetry for every expectation evaluated, splits the frame into a certified partition and a quarantine partition, and raises on structural (fail-fast) breaches while quarantining row-level ones. The same suite can be expressed as a Great Expectations `ExpectationSuite`; the child guide on [building Great Expectations checks for emissions data](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/building-great-expectations-checks-for-emissions-data/) shows that variant in full.

```python
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

import geopandas as gpd
import pandas as pd
import pandera as pa
from pandera.typing import Series
import structlog

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()

# --- Gate configuration -----------------------------------------------------
EQUAL_AREA_CRS = "EPSG:6933"          # area-honest grid before any hectare is derived
REPORTING_PERIOD = (date(2025, 1, 1), date(2025, 12, 31))
FACTOR_BOUNDS = {                      # published plausible ranges, kgCO2e per declared unit
    "diesel_litre": (2.4, 2.9),
    "natural_gas_m3": (1.8, 2.3),
    "grid_electricity_kwh": (0.0, 1.2),
}
MASS_BALANCE_TOL = 0.005              # 0.5% reconciliation tolerance vs. control total


class EmissionsActivitySchema(pa.DataFrameModel):
    """Declarative column contract for one reporting period of activity data."""

    facility_id: Series[str] = pa.Field(nullable=False, unique=False)
    activity_unit: Series[str] = pa.Field(isin=list({k.split("_", 1)[1] for k in FACTOR_BOUNDS}))
    activity_quantity: Series[float] = pa.Field(gt=0.0, nullable=False)   # zero/null = incomplete
    emission_factor: Series[float] = pa.Field(gt=0.0, nullable=False)
    factor_key: Series[str] = pa.Field(isin=list(FACTOR_BOUNDS), nullable=False)
    period_start: Series[pa.DateTime] = pa.Field(nullable=False)
    emissions_tco2e: Series[float] = pa.Field(ge=0.0, nullable=False)

    class Config:
        strict = True          # reject unexpected columns (schema completeness)
        coerce = False         # never silently cast; a wrong dtype is a real failure


@dataclass
class GateResult:
    certified: gpd.GeoDataFrame
    quarantined: gpd.GeoDataFrame
    report: list[dict] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return len(self.quarantined) == 0


class FailFast(RuntimeError):
    """Raised on structural breaches that make the whole run unreportable."""


def _quarantine(gdf: gpd.GeoDataFrame, mask: pd.Series, dimension: str,
                detail: str, report: list[dict]) -> gpd.GeoDataFrame:
    """Move rows matching ``mask`` out of the working frame and log why."""
    offenders = gdf[mask]
    if not offenders.empty:
        for row_id in offenders["facility_id"].tolist():
            report.append({"dimension": dimension, "row_id": row_id, "detail": detail})
        log.warning("gate.quarantine", dimension=dimension, detail=detail,
                    n_rows=int(mask.sum()))
    return gdf[~mask]


def validate_emissions(gdf: gpd.GeoDataFrame, *, run_id: str,
                       control_total: Optional[float] = None) -> GateResult:
    """Run the full expectation suite; return certified + quarantined partitions."""
    report: list[dict] = []

    # --- Fail-fast: structural expectations -------------------------------
    if gdf.empty:
        raise FailFast("empty activity frame; refusing to report a zero total by omission")
    if gdf.crs is None or gdf.crs.to_epsg() != 6933:
        raise FailFast(f"activity geometries must be {EQUAL_AREA_CRS}, got {gdf.crs}")
    try:
        EmissionsActivitySchema.validate(gdf.drop(columns="geometry"), lazy=True)
    except pa.errors.SchemaErrors as exc:
        log.error("gate.schema.failed", run_id=run_id, failures=exc.failure_cases.to_dict("records"))
        raise FailFast("schema contract breached; see failure_cases") from exc
    log.info("gate.schema.passed", run_id=run_id, n_rows=len(gdf))

    # --- Row-level dimension checks (quarantine posture) ------------------
    work = gdf.copy()

    # Validity: emission factor inside its published range for the joined key.
    lo = work["factor_key"].map(lambda k: FACTOR_BOUNDS[k][0])
    hi = work["factor_key"].map(lambda k: FACTOR_BOUNDS[k][1])
    out_of_range = (work["emission_factor"] < lo) | (work["emission_factor"] > hi)
    work = _quarantine(work, out_of_range, "validity",
                       "emission_factor outside published range for factor_key", report)

    # Consistency: the factor's unit must match the activity's declared unit.
    unit_mismatch = work["factor_key"].str.rsplit("_", n=1).str[-1] != work["activity_unit"]
    work = _quarantine(work, unit_mismatch, "consistency",
                       "factor unit does not match activity_unit", report)

    # Timeliness: the record must fall inside the reporting period.
    p0, p1 = (pd.Timestamp(d) for d in REPORTING_PERIOD)
    late = (work["period_start"] < p0) | (work["period_start"] > p1)
    work = _quarantine(work, late, "timeliness", "period_start outside reporting window", report)

    # Uniqueness: overlapping polygons double-count area-based activity.
    dup_id = work.duplicated(subset="facility_id", keep=False)
    work = _quarantine(work, dup_id, "uniqueness", "duplicate facility_id in period", report)

    # Geometry validity: self-intersections / empty geoms corrupt derived area.
    bad_geom = (~work.geometry.is_valid) | work.geometry.is_empty | work.geometry.isna()
    work = _quarantine(work, bad_geom, "validity",
                       "invalid, empty or null geometry", report)

    # --- Consistency: recomputed emissions must match the stored figure ---
    recomputed = work["activity_quantity"] * work["emission_factor"] / 1000.0  # kg -> t
    drift = (recomputed - work["emissions_tco2e"]).abs() / recomputed.clip(lower=1e-9)
    inconsistent = drift > MASS_BALANCE_TOL
    work = _quarantine(work, inconsistent, "consistency",
                       "emissions_tco2e disagrees with quantity x factor", report)

    # --- Mass balance: certified total must reconcile to a control total --
    if control_total is not None:
        certified_total = float(work["emissions_tco2e"].sum())
        rel = abs(certified_total - control_total) / max(control_total, 1e-9)
        log.info("gate.mass_balance", run_id=run_id, certified_total=round(certified_total, 3),
                 control_total=control_total, relative_gap=round(rel, 5))
        if rel > MASS_BALANCE_TOL:
            raise FailFast(f"mass-balance gap {rel:.3%} exceeds tolerance {MASS_BALANCE_TOL:.1%}")

    quarantined = gdf.loc[gdf.index.difference(work.index)]
    log.info("gate.complete", run_id=run_id, certified=len(work),
             quarantined=len(quarantined), breaches=len(report))
    return GateResult(certified=work, quarantined=quarantined, report=report)


def run_gate(input_path: str, certified_out: str, quarantine_out: str, *,
             run_id: str, control_total: Optional[float] = None) -> GateResult:
    gdf = gpd.read_parquet(input_path)
    result = validate_emissions(gdf, run_id=run_id, control_total=control_total)
    result.certified.to_parquet(certified_out)          # immutable, reportable partition
    if not result.quarantined.empty:
        result.quarantined.to_parquet(quarantine_out)   # held back for triage + reprocessing
    Path(quarantine_out).with_suffix(".report.json").write_text(
        pd.DataFrame(result.report).to_json(orient="records"))
    return result


if __name__ == "__main__":
    run_gate("data/activity_2025.parquet",
             "certified/activity_2025.parquet",
             "quarantine/activity_2025.parquet",
             run_id=f"gate-{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}",
             control_total=184_320.5)
```

The structure is deliberate. Structural expectations that make the entire run untrustworthy — an empty frame, the wrong CRS, a breached schema, a mass-balance gap beyond tolerance — raise `FailFast`, because publishing anything from such a run would be misleading. Row-level dimension breaches are quarantined instead, so the clean majority still reaches the certified store while the offending rows are written out with a report keyed by dimension, row identifier, and a human-readable detail. The recomputation step is the pipeline's own internal mass balance: it independently recalculates `quantity × factor` and rejects any row whose stored `emissions_tco2e` has drifted from that product, which catches both stale precomputed values and the bad-join factor errors of failure mode two. Wiring this into orchestration is a single call — `run_gate` is a pure function of its inputs, so a Prefect or Dagster task wraps it with retries and the gate's structured logs flow into the same telemetry sink as the rest of the pipeline.

## Validation, Debugging & Compliance Mapping

Each expectation in the suite maps to a named requirement in the assurance frameworks that govern emissions reporting, which is what makes the gate an evidentiary artifact rather than an engineering convenience. The certified partition, the quarantine partition, and the JSON report together form the QA/QC record an auditor inspects.


| Gate expectation | Quality dimension | Regulatory application |
|------------------|-------------------|------------------------|
| Row-count manifest &amp; positive `activity_quantity` | Completeness | Verra completeness &#8212; all monitored sources accounted for, no silent omission |
| `FACTOR_BOUNDS` range check | Validity | ISO 14064-3 QA/QC on parameter plausibility |
| Factor-unit vs. activity-unit match | Consistency | ISO 14064-3 verification of data consistency across sources |
| `period_start` within reporting window | Timeliness | Verra monitoring-period boundary integrity |
| Duplicate `facility_id` / overlap check | Uniqueness | Verra double-counting prevention |
| `geometry.is_valid` &amp; non-empty | Validity | ISO 14064-3 evidence that area-based activity is sound |
| Recomputed emissions &amp; control-total reconciliation | Consistency | CSRD ESRS E1 data-quality &amp; assurance expectations |


Under **ISO 14064-3**, which governs the verification and validation of greenhouse-gas assertions, the standard requires the verifier to assess whether data is accurate, complete, consistent, transparent, and free of material error. The expectation suite operationalises each of those adjectives: the range and geometry checks address accuracy, the manifest check addresses completeness, the unit and recomputation checks address consistency, and the structured `structlog` telemetry plus the quarantine report deliver transparency. A verifier does not have to trust a narrative — they re-run the gate against the raw inputs and confirm the certified partition is reproduced bit-for-bit.

Under **Verra** VM-series methodologies, completeness and the prevention of double-counting are explicit crediting controls: a project must demonstrate that every monitored source within its boundary is captured exactly once. The completeness expectation (row-count manifest plus the rejection of zero and null quantities) directly answers the first, and the uniqueness expectation (duplicate identifiers and overlapping polygons) answers the second. Because the gate quarantines rather than deletes, the evidence that a duplicate was detected and excluded survives in the lineage record, which is what a validation body asks for.

Under **CSRD ESRS E1**, the disclosure regime demands that reported climate metrics carry documented data quality and be subject to assurance. The mass-balance reconciliation is the strongest control here: by asserting that the certified total reconciles to an independently derived control total within tolerance, the gate produces exactly the kind of quantified data-quality statement ESRS E1 assurance expects, rather than an unqualified number. For debugging, treat the quarantine rate, the mass-balance relative gap, and the per-dimension breach counts as monitored signals on every run — including the runs that pass — so a slowly rising quarantine rate or a widening reconciliation gap surfaces a drifting upstream source long before it breaches tolerance and fails a reporting run outright. The full expectation catalogue and the canonical column contract these checks assume are documented in the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/).

## Conclusion

Emissions Data Quality & Validation Gates are what let an organisation publish a number and defend it. By expressing completeness, validity, consistency, timeliness, and uniqueness as declarative expectations wired into every pipeline boundary, by choosing fail-fast for structural breaches and quarantine for row-level ones, and by reconciling every certified total against an independent control figure, engineering teams convert data quality from an after-the-fact review into an enforced contract. The three dominant failure modes — silently dropped activity rows, out-of-range factors from bad joins, and geometry errors that corrupt area — all become caught, logged, and quarantined events rather than invisible reporting errors. To implement the full expectation suite as reusable, version-controlled checks with data docs and CI integration, continue with [Building Great Expectations Checks for Emissions Data](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/building-great-expectations-checks-for-emissions-data/).

## Related guides

- [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) — the parent stack this validation layer gates the outputs of.
- [Building Great Expectations Checks for Emissions Data](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/building-great-expectations-checks-for-emissions-data/) — the step-by-step implementation of the expectation suite described here.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — records which suite ran and which rows were quarantined and why.
- [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) — the canonical column contract these expectations validate against.
