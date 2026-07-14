---
shortTitle: "Versioning Emission Factor Databases for MRV"
title: "Versioning Emission Factor Databases for Reproducible MRV"
description: "Make emission-factor lookups reproducible: content-addressed factor tables, semantic versioning, and effective-dated bitemporal joins that pin factor_version into every MRV output and its lineage."
slug: versioning-emission-factor-databases-for-reproducible-mrv
type: guide
breadcrumb: "Versioning Emission Factor Databases"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Versioning Emission Factor Databases for Reproducible MRV

A carbon figure is only reproducible if the emission factor behind it is reproducible, and most pipelines fail that test the first time an upstream table is revised. This guide sits under the [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) section, where it complements the [canonical Parquet schema data dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) — the schema defines *what* a factor row looks like, and this page defines *which version of it* a computation is allowed to use. It is also a direct dependency of [orchestrating MRV data pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/), because a reproducible backfill is impossible if the factor lookup silently drifts between the original run and the re-run.

The core problem is temporal. When IPCC, DEFRA, or ecoinvent publish a revision, a naive pipeline that joins activity data against "the current factor table" will quietly change last year's already-reported numbers the next time it recomputes. Emission-factor versioning fixes this by making factor tables immutable and content-addressed, tagging each release with a semantic version, and joining on an *effective date* so that a 2021 activity always resolves to the 2021-era factor even when the pipeline is executed in 2026. Every output then carries the exact `factor_version` it consumed, and that value flows into the lineage record an auditor traces — the same provenance discipline described in [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/).

<svg viewBox="0 0 1000 268" role="img" aria-labelledby="efver-t efver-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="efver-t">Bitemporal emission-factor join pinning factor_version into an audited output</title>
  <desc id="efver-d">Activity records carrying an activity_date on the left, and an effective-dated emission-factor table keyed on factor_id and validity period below them, both feed an as-of join. The join resolves each activity to the single factor row whose validity interval contains the activity_date. Its result is written to an amber output box that pins factor_version and a content hash, which then flows into an audit and lineage record.</desc>
  <defs>
    <marker id="efver-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="14" y="30" width="196" height="70" rx="9"/>
      <rect x="14" y="150" width="196" height="82" rx="9"/>
      <rect x="470" y="86" width="150" height="82" rx="9"/>
    </g>
    <!-- as-of join diamond -->
    <polygon points="330,127 392,89 454,127 392,165" fill="none" stroke="#11839e" stroke-width="1.8"/>
    <!-- pinned output (accent) -->
    <rect x="686" y="80" width="182" height="94" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <!-- lineage record -->
    <rect x="686" y="204" width="182" height="52" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="112" y="60">Activity records</text>
      <text x="112" y="180">Effective-dated</text>
      <text x="112" y="196">factor table</text>
      <text x="545" y="120">As-of join</text>
    </g>
    <text x="777" y="118" fill="#f3a712" font-size="12" font-weight="700">Pinned output</text>
    <text x="777" y="230" fill="currentColor" font-size="11" font-weight="600">Audit &amp; lineage</text>
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="112" y="80">activity_date &#183; region</text>
      <text x="112" y="214">factor_id &#183; [valid_from, valid_to)</text>
      <text x="545" y="138">(factor_id, period)</text>
      <text x="777" y="138">factor_version</text>
      <text x="777" y="154">+ content hash</text>
      <text x="777" y="248">factor_version replayable</text>
    </g>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#efver-arrow)">
    <path d="M210 65 C 270 65, 300 100, 330 118"/>
    <path d="M210 191 C 270 191, 300 155, 330 136"/>
    <line x1="454" y1="127" x2="468" y2="127"/>
    <line x1="620" y1="127" x2="684" y2="127"/>
    <path d="M777 174 L 777 202"/>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Version emission-factor databases for reproducible MRV",
  "description": "Make emission-factor lookups reproducible by publishing immutable content-addressed factor tables, joining activity data on an effective date, and pinning factor_version and a content hash into every output and its lineage.",
  "totalTime": "PT45M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "pandas" },
    { "@type": "HowToTool", "name": "pyarrow" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest an immutable factor release", "text": "Load the emission-factor table, verify its semantic version and content hash, and confirm no prior release with that version already exists." },
    { "@type": "HowToStep", "name": "Diagnose drift and unpinned joins", "text": "Scan outputs for null factor_version and detect rows whose resolved factor changes across factor releases before recomputing." },
    { "@type": "HowToStep", "name": "Run the effective-dated join", "text": "As-of merge activity records against the factor table on factor_id and validity interval so each activity_date resolves to its era-correct factor." },
    { "@type": "HowToStep", "name": "Pin version and hash", "text": "Write factor_version and the factor-release content hash into every output row and validate that no row is left unpinned." },
    { "@type": "HowToStep", "name": "Export and record lineage", "text": "Serialize the pinned output to Parquet and emit the factor_version and hash into the lineage record for audit replay." }
  ]
}
</script>

## Root Cause Analysis

Emission-factor drift is not a data-quality bug; it is a modelling omission. Three structural causes explain why an otherwise-correct pipeline produces irreproducible numbers.

First, **mutable "current-table" lookups conflate two different times.** A carbon computation has a *transaction time* (when the pipeline ran) and a *valid time* (the period the activity data describes). When a pipeline joins against whatever factor table is live at run time, it collapses those two axes: recomputing a 2021 emission in 2026 silently applies a 2024 factor revision to 2021 activity. IPCC AR revisions, annual DEFRA conversion-factor updates, and ecoinvent's periodic dataset releases each shift published factors by anywhere from a few percent to double digits, so a recompute can move a previously reported total by more than the uncertainty band the figure was certified against. The number changes, nobody edited any activity record, and no verifier can reconstruct the original.

Second, **factor tables are treated as configuration rather than versioned data.** A CSV dropped into a shared bucket and overwritten in place has no identity: two runs that both claim to use "the DEFRA factors" may have consumed byte-different files. Without a semantic version and a content hash, there is no way to assert that a re-run used the same inputs, and ISO 14064-3 reproducibility becomes unprovable. The fix is to make each release immutable and content-addressed — the hash *is* the identity — and to attach a semantic version whose major component signals a methodology-breaking change.

Third, **outputs do not record which factor they used.** Even a correct as-of join is worthless for audit if the resolved `factor_version` never lands in the output row. When that column is null, the lineage graph has a hole exactly where a verifier looks first, and the only way to answer "which factor produced this tonne" is to guess from run timestamps. Pinning the version into every row, and gating on the absence of a pin, closes that hole before export.

## Diagnostic Pipeline / Pre-Flight Validation

Before recomputing anything, inspect the existing outputs and the incoming factor release for the two failure signatures above: rows whose `factor_version` is null (an unpinned join) and rows whose resolved factor would change under a new release (drift). The diagnostic below flags both without mutating state, so a verifier or an orchestration gate can decide whether a recompute is safe.

```python
from __future__ import annotations

import hashlib

import pandas as pd
import pyarrow.parquet as pq
import structlog

log = structlog.get_logger()


def content_hash_parquet(path: str) -> str:
    """Deterministic content address for an immutable factor release."""
    with open(path, "rb") as fh:
        digest = hashlib.sha256(fh.read()).hexdigest()
    return f"sha256:{digest[:16]}"


def diagnose_factor_drift(
    outputs: pd.DataFrame,
    factors_old: pd.DataFrame,
    factors_new: pd.DataFrame,
    release_path: str,
) -> dict:
    """Detect unpinned joins and factor drift before any recompute.

    outputs must carry: factor_id, activity_date, factor_version.
    factor tables carry: factor_id, valid_from, valid_to, factor_value, factor_version.
    """
    issues: list[str] = []

    # 1. Unpinned joins: any output row without a resolved factor_version.
    unpinned = int(outputs["factor_version"].isna().sum())
    if unpinned:
        issues.append(f"unpinned_rows:{unpinned}")

    # 2. Drift: resolve each activity_date against old vs new release and compare.
    def _asof(factors: pd.DataFrame) -> pd.Series:
        merged = pd.merge_asof(
            outputs.sort_values("activity_date"),
            factors.sort_values("valid_from"),
            left_on="activity_date",
            right_on="valid_from",
            by="factor_id",
            direction="backward",
        )
        # A row is only valid if activity_date < valid_to for the matched interval.
        merged.loc[merged["activity_date"] >= merged["valid_to"], "factor_value"] = pd.NA
        return merged["factor_value"].reset_index(drop=True)

    old_vals, new_vals = _asof(factors_old), _asof(factors_new)
    drifted = int((old_vals.fillna(-1) != new_vals.fillna(-1)).sum())
    if drifted:
        issues.append(f"drifted_rows:{drifted}")

    report = {
        "release_hash": content_hash_parquet(release_path),
        "n_outputs": int(len(outputs)),
        "unpinned_rows": unpinned,
        "drifted_rows": drifted,
        "safe_to_recompute": not issues,
        "issues": issues,
    }
    log.info("efdb.preflight", **report)
    return report
```

A non-empty `drifted_rows` count is not a failure to suppress — it is the signal that a new factor release genuinely changes historical results, which is exactly the condition an effective-dated join must prevent from leaking into already-reported periods. The diagnostic makes that decision explicit rather than discovering it after publication.

## Deterministic Transformation Logic

The transformation is an as-of (bitemporal) merge: each activity record is matched to the single factor row whose validity interval `[valid_from, valid_to)` contains the `activity_date`, keyed by `factor_id`. This guarantees era-correctness — a 2021 activity binds to the factor that was in force in 2021 regardless of later revisions. The routine below performs the interval join, pins both `factor_version` and the release content hash into every output row, emits a per-output content hash for downstream lineage, and refuses to return an unpinned frame.

```python
from __future__ import annotations

import hashlib

import pandas as pd
import pyarrow as pa
import structlog

log = structlog.get_logger()


def join_effective_dated_factors(
    activity: pd.DataFrame,
    factors: pd.DataFrame,
    release_hash: str,
) -> pd.DataFrame:
    """As-of join activity data to era-correct emission factors, pinning version.

    activity: activity_id, activity_date (datetime64), factor_id, activity_qty
    factors:  factor_id, valid_from, valid_to (datetime64), factor_value,
              factor_version, unit
    """
    if activity["activity_date"].isna().any():
        raise ValueError("activity_date contains nulls; cannot resolve era factor.")

    left = activity.sort_values("activity_date")
    right = factors.sort_values("valid_from")

    # merge_asof(direction="backward") picks the latest valid_from <= activity_date
    joined = pd.merge_asof(
        left, right,
        left_on="activity_date", right_on="valid_from",
        by="factor_id", direction="backward",
    )

    # Interval upper-bound check: reject matches where the interval has expired.
    expired = joined["activity_date"] >= joined["valid_to"]
    joined.loc[expired, ["factor_value", "factor_version"]] = pd.NA

    # Validation gate: every row must resolve to a pinned, in-force factor.
    unresolved = int(joined["factor_version"].isna().sum())
    if unresolved:
        raise ValueError(
            f"{unresolved} activity rows have no in-force factor; "
            "extend factor validity intervals or fix activity_date."
        )

    joined["emission"] = joined["activity_qty"] * joined["factor_value"]
    joined["factor_release_hash"] = release_hash

    # Content hash of the pinned result — the addressable identity of this output.
    canonical = joined[
        ["activity_id", "activity_date", "factor_id",
         "factor_version", "emission"]
    ].to_csv(index=False).encode("utf-8")
    joined.attrs["output_hash"] = f"sha256:{hashlib.sha256(canonical).hexdigest()[:16]}"

    log.info(
        "efdb.joined",
        n_rows=int(len(joined)),
        factor_versions=sorted(joined["factor_version"].dropna().unique().tolist()),
        factor_release_hash=release_hash,
        output_hash=joined.attrs["output_hash"],
    )
    return joined
```

The join is deterministic in both temporal axes: `direction="backward"` fixes the valid-time resolution, and the pinned `factor_release_hash` fixes the transaction-time inputs. Re-running the same activity data against the same release hash reproduces the same `output_hash` byte-for-byte, which is what makes the output replayable years later. A small effective-dated factor table makes the era resolution concrete:


| factor_id | valid_from | valid_to | factor_value | unit | factor_version |
|-----------|-----------|----------|--------------|------|----------------|
| defra_grid_uk | 2021-01-01 | 2022-01-01 | 0.21233 | kgCO2e/kWh | defra-2021.1.0 |
| defra_grid_uk | 2022-01-01 | 2023-01-01 | 0.19338 | kgCO2e/kWh | defra-2022.1.0 |
| defra_grid_uk | 2023-01-01 | 9999-12-31 | 0.20707 | kgCO2e/kWh | defra-2023.1.0 |
| ipcc_forest_trop | 2019-05-01 | 2024-03-01 | 120.0 | tC/ha | ipcc-2019.2.0 |
| ipcc_forest_trop | 2024-03-01 | 9999-12-31 | 132.5 | tC/ha | ipcc-2024.1.0 |


An activity dated `2021-06-14` against `defra_grid_uk` resolves to `defra-2021.1.0` (0.21233) every time, even when the join is executed in 2026 with three later releases loaded.

## Compliance Gating & Audit Trail Generation

The pinned columns are the audit artifact. `factor_version`, `factor_release_hash`, and the per-output `output_hash` together let a third-party verifier answer the two questions ISO 14064-3 reproducibility turns on: *which factor produced this figure*, and *can the figure be regenerated identically*. Because the factor table is immutable and content-addressed, the verifier can fetch the exact release by hash, re-run the effective-dated join, and confirm the `output_hash` matches — no timestamp guesswork.

Key gates to enforce on every run, including passing ones:

1. **No unpinned rows.** The join raises if any `factor_version` is null; a downstream schema check on the Parquet output should re-assert non-null on that column so an unpinned frame can never be published.
2. **Immutable release identity.** Reject any factor load whose content hash matches an existing version tag but whose bytes differ, or whose bytes match a version already published under a different tag — either is a versioning error, not a data update.
3. **Semantic version discipline.** A major-version bump (e.g. `ipcc-2019.x` to `ipcc-2024.1.0`) signals a methodology change and must open a *new* validity interval rather than overwriting an existing one, so historical periods keep resolving to their era factor. This is the boundary that stops IPCC and DEFRA revisions from silently rewriting the past.
4. **Drift disclosure.** When `diagnose_factor_drift` reports a non-zero `drifted_rows`, the count and the two release hashes are recorded, evidencing that the new factor was applied only to periods it is in force for — the transparency CSRD ESRS E1 expects around restated figures.

These records flow into the lineage graph exactly as the [canonical Parquet schema](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) prescribes, where `factor_version` becomes a queryable provenance edge rather than a buried attribute.

## Production Integration

Deploy the routine inside the orchestrator described in [orchestrating MRV data pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/), following a fixed ingest → diagnose → transform → validate → export → submit sequence:

1. **Ingest.** Load the incoming factor release as an immutable Parquet object, compute its content hash with `content_hash_parquet`, and register it under its semantic version — refusing the load if that version already exists with different bytes.
2. **Diagnose.** Run `diagnose_factor_drift` against the live outputs to surface any unpinned rows and to quantify how many historical results a new release would move, so the orchestrator can decide whether a recompute touches only in-force periods.
3. **Transform.** Call `join_effective_dated_factors` with the release hash, resolving each activity to its era-correct factor and pinning `factor_version`, `factor_release_hash`, and the per-output `output_hash`.
4. **Validate.** Re-assert non-null `factor_version` on the output frame and confirm the recomputed `output_hash` matches the prior run for any unchanged period — the reproducibility check an idempotent backfill depends on.
5. **Export.** Serialize to Parquet with the pinned columns intact, so the addressable factor identity travels with the emission figures.
6. **Submit.** Forward `factor_version` and both hashes into the lineage record consumed by [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/), and feed the resolved factor values into downstream stages such as [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/), which propagates each pinned factor's variance.

By making factor tables immutable and content-addressed, joining on effective date, and pinning the resolved version into every output and its lineage, the pipeline guarantees that a figure reported in 2021 stays byte-identical when regenerated in 2026 — the reproducibility contract that lets automated MRV survive third-party verification.

## Related guides

- [MRV Data Schema Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/) — the parent section defining the schema these pinned factors populate.
- [The Canonical Parquet Schema: A Data Dictionary for MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/canonical-parquet-schema-data-dictionary-for-mrv/) — the field-level contract for the `factor_version` and hash columns.
- [Orchestrating MRV Data Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/) — the orchestration layer whose idempotent recomputes rely on pinned factors.
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — the downstream stage that propagates the variance of each resolved factor.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — where the pinned `factor_version` becomes an auditable provenance edge.
