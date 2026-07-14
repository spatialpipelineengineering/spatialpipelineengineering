---
shortTitle: "Mapping CSRD ESRS E1 to Spatial MRV Outputs"
title: "Mapping CSRD ESRS E1 Disclosures to Spatial MRV Outputs"
description: "Map spatial MRV pipeline outputs to CSRD ESRS E1 disclosures: trace parcel-level removals and Scope 3 activity data into E1-6/E1-7 line items with uncertainty rollup and audit-ready lineage."
slug: mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs
type: guide
breadcrumb: "CSRD ESRS E1 Mapping"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Mapping CSRD ESRS E1 Disclosures to Spatial MRV Outputs

A spatial MRV pipeline produces per-parcel removals, per-pixel activity data, and variance envelopes; a CSRD report demands a small set of aggregate figures — gross Scope 1, 2 and 3, total GHG, removals and carbon credits — each defensible under limited or reasonable assurance. Bridging the two is a distinct engineering problem, and it sits inside the [Carbon Registry Standards & Methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/) discipline alongside methodology-level work like the split between [Verra VM0047 and Gold Standard GIS requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/). The mapping is not a spreadsheet export: it is a lineage-preserving aggregation that must let an auditor trace any reported tonne back to the pixel or parcel that generated it.

The datapoints that matter here are ESRS E1-6 (gross Scopes 1, 2 and 3, plus total GHG emissions), E1-7 (GHG removals and carbon credits) and E1-4 (targets), each with its own granularity and disclosure-of-uncertainty expectations under the European Sustainability Reporting Standards. To satisfy them you draw on the canonical column contracts defined in the [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) and on upstream spatial products such as [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/), which supplies the geolocated activity data that E1-6 gross Scope 3 ultimately rolls up. The engineering objective is traceability: from a pixel or parcel to a reported figure, with no orphan tonnage and an evidence manifest an assurance engagement can reconstruct.

<svg viewBox="0 0 1000 300" role="img" aria-labelledby="e1map-t e1map-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="e1map-t">Mapping spatial MRV outputs to ESRS E1 disclosures through an assurance gate</title>
  <desc id="e1map-d">Two spatial MRV output streams enter on the left: parcel-level removals with per-parcel sigma, and geolocated Scope 3 activity data. Both flow into a lineage-preserving aggregation stage that sums CO2-equivalent tonnage and rolls up uncertainty. The aggregation feeds an assurance and evidence gate that checks every disclosed aggregate is fully backed by source records. Only figures that pass the gate become the ESRS E1-6 gross Scope emissions and total, and the ESRS E1-7 removals and carbon-credit line items, drawn as the amber assured-output block on the right.</desc>
  <defs>
    <marker id="e1-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- source boxes -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="14" y="40" width="184" height="70" rx="9"/>
      <rect x="14" y="188" width="184" height="70" rx="9"/>
      <rect x="266" y="114" width="176" height="72" rx="9"/>
    </g>
    <!-- assurance gate (teal) -->
    <polygon points="560,150 626,110 692,150 626,190" fill="none" stroke="#0f6e63" stroke-width="2"/>
    <!-- assured output (amber) -->
    <rect x="770" y="52" width="214" height="90" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <rect x="770" y="176" width="214" height="90" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <!-- titles -->
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="106" y="68">Parcel-level removals</text>
      <text x="106" y="216">Scope 3 activity data</text>
      <text x="354" y="142">Lineage-preserving</text>
      <text x="354" y="158">aggregation</text>
    </g>
    <!-- subtitles -->
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="106" y="86">t CO&#8322;e &#183; per-parcel &#963;</text>
      <text x="106" y="234">geolocated &#183; category-tagged</text>
      <text x="354" y="176">&#931; t CO&#8322;e &#183; &#963; rollup</text>
    </g>
    <!-- gate label -->
    <g fill="#0f6e63" font-size="9.5" font-weight="700">
      <text x="626" y="147">evidence</text>
      <text x="626" y="160">gate</text>
    </g>
    <!-- amber outputs -->
    <g fill="#f3a712" font-size="12" font-weight="700">
      <text x="877" y="90">ESRS E1-6</text>
      <text x="877" y="214">ESRS E1-7</text>
    </g>
    <g fill="currentColor" font-size="9.5" opacity="0.8">
      <text x="877" y="110">gross Scopes 1/2/3</text>
      <text x="877" y="124">+ total GHG</text>
      <text x="877" y="234">removals</text>
      <text x="877" y="248">+ carbon credits</text>
    </g>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#e1-arrow)">
    <path d="M198 75 C 236 80, 240 140, 264 145"/>
    <path d="M198 223 C 236 218, 240 158, 264 155"/>
    <line x1="442" y1="150" x2="556" y2="150"/>
  </g>
  <g stroke="#f3a712" stroke-width="1.8" fill="none" marker-end="url(#e1-arrow)">
    <path d="M692 140 C 730 120, 736 100, 768 97"/>
    <path d="M692 160 C 730 180, 736 205, 768 208"/>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Map spatial MRV outputs to CSRD ESRS E1 climate disclosures",
  "description": "Aggregate parcel-level removals and geolocated Scope 3 activity data into ESRS E1-6 and E1-7 line items with uncertainty rollup, lineage verification, and an audit-ready evidence manifest for a limited or reasonable assurance engagement.",
  "totalTime": "PT40M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "geopandas" },
    { "@type": "HowToTool", "name": "pyarrow" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest source records", "text": "Load the canonical parcel-level removal and Scope 3 activity Parquet with stable record identifiers, per-record CO2e, uncertainty and lineage keys." },
    { "@type": "HowToStep", "name": "Diagnose lineage completeness", "text": "Verify every candidate disclosed aggregate is fully backed by lineage-linked source records so no orphan tonnage enters a reported figure." },
    { "@type": "HowToStep", "name": "Transform into E1 line items", "text": "Aggregate per-record CO2e into ESRS E1-6 gross Scope and E1-7 removal line items, propagating variance into a combined uncertainty per figure." },
    { "@type": "HowToStep", "name": "Gate against assurance controls", "text": "Reject any figure whose backing coverage, uncertainty, or datum trail fails the disclosure gate before it is published." },
    { "@type": "HowToStep", "name": "Export the evidence manifest", "text": "Emit each disclosed figure with its contributing record set, aggregation method, and uncertainty so a verifier can reconstruct it." },
    { "@type": "HowToStep", "name": "Submit to the disclosure store", "text": "Forward the assured figures and manifest to the CSRD reporting layer keyed to the ESRS datapoint identifiers." }
  ]
}
</script>

## Root Cause Analysis: Why Spatial Outputs Rarely Slot into E1

A spatial MRV pipeline and a CSRD report speak different dialects, and three structural mismatches make a naive export fail assurance.

First, **granularity runs in opposite directions.** The pipeline produces millions of pixels and thousands of parcels, each with its own CO&#8322;e estimate and variance. ESRS E1-6 wants a single gross Scope 3 figure and a single total; E1-7 wants aggregate removals and a separate carbon-credit total. Collapsing a spatial surface into one number is the easy part — the hard part is doing it so the number remains decomposable. A figure that cannot be broken back down into its contributing parcels is unauditable, and an assurance provider treats an unauditable figure as unsupported regardless of how the arithmetic was performed.

Second, **uncertainty is discarded at exactly the wrong moment.** Spatial products carry per-parcel or per-pixel sigma as a first-class field, but a plain `groupby().sum()` throws it away and reports a bare total. ESRS E1 expects disclosure of estimation uncertainty for material figures, and removals in particular — where a project may be claiming avoided or sequestered tonnage — are scrutinised for how the uncertainty was quantified. Summing means without rolling up variance produces a number that looks precise and reads as overconfident to a reasonable-assurance engagement, which is the level CSRD phases in over time.

Third, **orphan tonnage accumulates silently.** When activity records are joined, reclassified, or filtered across pipeline stages, some tonnage ends up in a reported aggregate without a surviving link back to a source record — a parcel dropped by a spatial join, a category remapped without provenance, or a manual adjustment applied in a notebook. The total still balances, so nothing alarms. But an auditor sampling the disclosure will ask to see the source records behind a figure, and orphan tonnage is precisely what cannot be produced. The fix is to make backing completeness a gate, not a hope.

## Diagnostic Pipeline: Verifying Every Aggregate Is Fully Backed

Before any figure is aggregated for disclosure, confirm that the candidate aggregate is fully reconstructable from lineage-linked source records. The check below reconciles the tonnage a naive sum would report against the tonnage that carries an intact lineage key, and flags any residual as orphan tonnage. This is the control that keeps the [MRV data lineage](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) contract intact through to the disclosed figure.

```python
import geopandas as gpd
import pandas as pd
import structlog

log = structlog.get_logger()

# Tonnage below this fraction of the aggregate is treated as a hard failure,
# not a rounding artefact: a reasonable-assurance engagement samples at the record level.
ORPHAN_TOLERANCE = 1e-6


def diagnose_backing_completeness(
    records: gpd.GeoDataFrame,
    esrs_datapoint: str,
    co2e_col: str = "co2e_tonnes",
    lineage_col: str = "lineage_id",
    record_id_col: str = "record_id",
) -> dict:
    """Confirm a disclosed aggregate is fully backed by lineage-linked source records.

    Detects orphan tonnage: CO2e that would enter the reported figure but has no
    surviving link back to a traceable source record.
    """
    issues: list[str] = []

    # 1. Every record contributing tonnage must carry a stable identifier and a lineage key.
    missing_id = int(records[record_id_col].isna().sum())
    missing_lineage = int(records[lineage_col].isna().sum())
    if missing_id:
        issues.append(f"records_without_id:{missing_id}")
    if missing_lineage:
        issues.append(f"records_without_lineage:{missing_lineage}")

    # 2. Reconcile total tonnage against tonnage that is lineage-linked.
    total_co2e = float(records[co2e_col].sum())
    backed = records[records[lineage_col].notna() & records[record_id_col].notna()]
    backed_co2e = float(backed[co2e_col].sum())
    orphan_co2e = total_co2e - backed_co2e
    orphan_fraction = orphan_co2e / total_co2e if total_co2e else 0.0

    if abs(orphan_fraction) > ORPHAN_TOLERANCE:
        issues.append(f"orphan_tonnage:{orphan_co2e:.4f}t")

    report = {
        "esrs_datapoint": esrs_datapoint,
        "n_records": int(len(records)),
        "total_co2e_t": round(total_co2e, 4),
        "backed_co2e_t": round(backed_co2e, 4),
        "orphan_co2e_t": round(orphan_co2e, 4),
        "orphan_fraction": round(orphan_fraction, 8),
        "fully_backed": not issues,
        "issues": issues,
    }
    if report["fully_backed"]:
        log.info("e1.backing_verified", **report)
    else:
        log.warning("e1.backing_failed", **report)
    return report
```

A datapoint that reports `fully_backed=False` never reaches the disclosure store. The orphan tonnage is surfaced with the offending record count so an engineer can repair the broken join or restore the missing lineage key before the figure is published, rather than an auditor discovering the gap during sampling.

## Deterministic Transformation Logic

With backing verified, the aggregation collapses per-record CO&#8322;e into ESRS E1 line items while propagating variance and emitting the evidence manifest in the same pass. Scope figures follow the GHG Protocol boundary definitions that E1-6 references, and removals are reported separately from credits so the E1-7 distinction between physically removed tonnes and purchased offsets is preserved. Uncertainty is combined in quadrature under an independence assumption where the schema records the contributions as independent, and additively where the source layer flags spatial correlation — the manifest records which was used so the rollup is reproducible.

```python
import math
from datetime import datetime, timezone

import geopandas as gpd
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import structlog

log = structlog.get_logger()

# ESRS E1 line-item mapping: which source scope/flow feeds which datapoint.
E1_LINE_ITEMS = {
    "E1-6_scope_1": {"flow": "emission", "scope": 1},
    "E1-6_scope_2": {"flow": "emission", "scope": 2},
    "E1-6_scope_3": {"flow": "emission", "scope": 3},
    "E1-7_removals": {"flow": "removal", "scope": None},
    "E1-7_credits": {"flow": "credit", "scope": None},
}


def _rollup_sigma(sigmas: pd.Series, correlated: bool) -> float:
    """Combine per-record standard deviations into one figure-level sigma.

    Independent contributions add in quadrature; spatially correlated
    contributions add linearly (the conservative bound).
    """
    if correlated:
        return float(sigmas.sum())
    return float(math.sqrt((sigmas.astype("float64") ** 2).sum()))


def aggregate_to_esrs_e1(
    records: gpd.GeoDataFrame,
    reporting_year: int,
    manifest_path: str,
    co2e_col: str = "co2e_tonnes",
    sigma_col: str = "co2e_sigma_tonnes",
) -> tuple[pd.DataFrame, dict]:
    """Aggregate lineage-linked source records into ESRS E1-6 / E1-7 line items.

    Returns the disclosure table and an evidence manifest keyed by datapoint.
    Raises if any line item fails the uncertainty or backing gate.
    """
    rows: list[dict] = []
    manifest: dict = {"reporting_year": reporting_year, "line_items": {}}

    for datapoint, rule in E1_LINE_ITEMS.items():
        subset = records[records["flow"] == rule["flow"]]
        if rule["scope"] is not None:
            subset = subset[subset["scope"] == rule["scope"]]
        if subset.empty:
            continue

        correlated = bool(subset["spatially_correlated"].any())
        total = float(subset[co2e_col].sum())
        sigma = _rollup_sigma(subset[sigma_col], correlated)
        rel_uncertainty = (sigma / abs(total)) if total else float("inf")

        # Validation gate: a material figure must carry a quantified, disclosable
        # uncertainty. An undefined relative uncertainty is never published.
        if not math.isfinite(rel_uncertainty):
            log.warning("e1.uncertainty_undefined", datapoint=datapoint)
            raise ValueError(f"{datapoint}: undefined relative uncertainty")

        rows.append({
            "esrs_datapoint": datapoint,
            "gross_co2e_tonnes": round(total, 3),
            "uncertainty_sigma_tonnes": round(sigma, 3),
            "relative_uncertainty": round(rel_uncertainty, 4),
            "n_source_records": int(len(subset)),
        })

        # Evidence manifest: the contributing record set and the exact method,
        # so an assurance provider can reconstruct the figure from source.
        manifest["line_items"][datapoint] = {
            "contributing_record_ids": subset["record_id"].tolist(),
            "lineage_ids": subset["lineage_id"].unique().tolist(),
            "aggregation": "sum",
            "uncertainty_method": "linear" if correlated else "quadrature",
            "total_co2e_tonnes": round(total, 3),
            "sigma_tonnes": round(sigma, 3),
        }
        log.info("e1.line_item_built", datapoint=datapoint,
                 total_co2e_t=round(total, 3),
                 relative_uncertainty=round(rel_uncertainty, 4),
                 n_records=int(len(subset)))

    disclosure = pd.DataFrame(rows)

    # E1-6 total GHG = sum of gross Scopes 1+2+3 emission line items.
    scope_mask = disclosure["esrs_datapoint"].str.startswith("E1-6_scope_")
    total_ghg = float(disclosure.loc[scope_mask, "gross_co2e_tonnes"].sum())
    manifest["E1-6_total_gross_ghg_tonnes"] = round(total_ghg, 3)
    manifest["generated_utc"] = datetime.now(timezone.utc).isoformat()
    manifest["compliance_standard"] = "CSRD ESRS E1 (E1-6, E1-7, E1-4)"

    # Persist the manifest alongside the disclosure as an addressable artefact.
    table = pa.Table.from_pydict({"manifest_json": [str(manifest)]})
    pq.write_table(table, manifest_path)
    log.info("e1.disclosure_ready", total_ghg_t=round(total_ghg, 3),
             manifest=manifest_path, n_line_items=int(len(disclosure)))
    return disclosure, manifest


if __name__ == "__main__":
    src = gpd.read_parquet("data/mrv_source_records.parquet").set_crs("EPSG:4326")
    table, evidence = aggregate_to_esrs_e1(
        src, reporting_year=2025, manifest_path="output/e1_evidence_manifest.parquet")
```

The transformation never touches a figure it has not first reconciled: the E1-6 total GHG is derived from the same Scope line items the manifest records, so the disclosed total and its parts can never diverge. The `relative_uncertainty` field is what a reader of the CSRD report sees as the disclosed estimation uncertainty, and the manifest is what an auditor requests to confirm it.

## Compliance Gating & Audit Trail Generation

The mapping is only a submission artefact if each disclosed figure is tied to the ESRS datapoint it satisfies and to the source columns behind it. The table below is the contract an assurance engagement works from: it names the E1 datapoint, the MRV output that populates it, and the canonical source columns — the same fields defined in the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) — that must survive to the figure.


| ESRS E1 datapoint | Required MRV output | Source columns |
|-------------------|---------------------|----------------|
| E1-6 gross Scope 1 | Direct on-site combustion / land-management emissions per parcel | `flow=emission`, `scope=1`, `co2e_tonnes`, `co2e_sigma_tonnes`, `lineage_id` |
| E1-6 gross Scope 2 | Purchased-energy emissions allocated to facilities | `flow=emission`, `scope=2`, `co2e_tonnes`, `grid_factor_version`, `lineage_id` |
| E1-6 gross Scope 3 | Geolocated value-chain activity data | `flow=emission`, `scope=3`, `category`, `activity_geom`, `co2e_tonnes`, `lineage_id` |
| E1-6 total GHG | Sum of gross Scopes 1+2+3 | derived from the three scope line items above |
| E1-7 removals | Parcel-level sequestered / removed CO&#8322;e | `flow=removal`, `co2e_tonnes`, `co2e_sigma_tonnes`, `spatially_correlated`, `parcel_id` |
| E1-7 carbon credits | Retired / purchased credit volume | `flow=credit`, `co2e_tonnes`, `registry_id`, `serial_range`, `lineage_id` |
| E1-4 targets | Baseline and target-year modelled trajectory | `baseline_year`, `target_year`, `target_co2e_tonnes`, `scenario_id` |


The gate that publishes a figure enforces three controls that map directly onto assurance procedures. Backing completeness — verified by the diagnostic above — answers the auditor's record-sampling test, because every disclosed tonne resolves to a `record_id` and a `lineage_id`. Disclosed relative uncertainty answers the ESRS expectation that material figures carry a quantified estimation uncertainty, with removals held to the tighter scrutiny E1-7 attracts. Method transparency — the `uncertainty_method` and `aggregation` fields in the manifest — lets a reasonable-assurance engagement recompute the figure independently rather than accept it on trust. Together these move the disclosure from limited-assurance plausibility toward the reasonable-assurance reconstructability that CSRD escalates to over time.

## Production Integration

Deploy the mapping as a fixed ingest &#8594; diagnose &#8594; transform &#8594; validate &#8594; export &#8594; submit sequence, orchestrated so each stage fails closed:

1. **Ingest.** Read the canonical parcel-level removal and Scope 3 activity Parquet, confirming each record carries `record_id`, `lineage_id`, `co2e_tonnes`, `co2e_sigma_tonnes` and a declared datum. The geolocated Scope 3 stream is the output of [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/).
2. **Diagnose.** Run `diagnose_backing_completeness` per candidate datapoint; halt on any orphan tonnage and route the offending records back for repair rather than aggregating over the gap.
3. **Transform.** Call `aggregate_to_esrs_e1` to build the E1-6 and E1-7 line items, propagating variance in quadrature or linearly according to the source correlation flag.
4. **Validate.** Assert that every line item carries a finite relative uncertainty and that the derived E1-6 total equals the sum of its Scope parts; reject the disclosure batch on any breach.
5. **Export.** Serialise the disclosure table and the evidence manifest as addressable Parquet artefacts, keyed to the ESRS datapoint identifiers so a verifier can pull the contributing record set for any figure.
6. **Submit.** Forward the assured figures and manifest to the CSRD reporting layer, tagging each with its reporting year and the assurance level targeted.

By making backing completeness a gate, carrying uncertainty as a first-class rollup, and emitting an evidence manifest in the same pass as the aggregation, the mapping turns a spatial MRV surface into ESRS E1 figures that survive assurance. The disclosed number is never more than a query away from the pixels and parcels that produced it — which is exactly what a limited or reasonable assurance engagement is there to confirm.

## Related guides

- [Carbon Registry Standards & Methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/) — the parent discipline this disclosure mapping sits within.
- [Verra VM0047 vs Gold Standard GIS Requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/) — methodology-level GIS contracts that shape the removal records feeding E1-7.
- [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) — the canonical column contracts the source records must satisfy.
- [GHG Protocol Scope 3 Spatial Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) — the geolocated activity data that E1-6 gross Scope 3 rolls up.
- [The Canonical Parquet Schema: A Data Dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) — the field-level definitions behind every source column in the mapping table.
