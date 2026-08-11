---
shortTitle: "Failure Mode Catalog for Spatial MRV Pipelines"
title: "Failure Mode Catalog for Spatial MRV Pipelines"
description: "Twelve silent failure modes that corrupt carbon numbers without failing a task — datum fallbacks, anti-meridian wrapping, categorical resampling, timezone drift — each with its signature, a Python diagnostic, and the invariant that catches it."
slug: failure-mode-catalog-for-spatial-mrv-pipelines
type: guide
breadcrumb: "Failure Mode Catalog"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Failure Mode Catalog for Spatial MRV Pipelines

This is a catalogue of the ways a carbon pipeline produces a wrong number while reporting success. It belongs to [MRV pipeline observability and failure modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/) within the [pipeline orchestration and compliance reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack, and it is deliberately organised the way an on-call engineer needs it: by the symptom you actually observe, not by the subsystem at fault.

Every entry has the same four parts — the signature you will see, the mechanism underneath, a diagnostic you can run, and the invariant that would have caught it before the number left the pipeline. The last part is the point of the catalogue. A failure you can only diagnose after a verifier questions a figure is a failure you will meet again; a failure encoded as an invariant is one you meet once.

<svg viewBox="0 -4 966 300" role="img" aria-labelledby="fc-t fc-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="fc-t">Twelve silent failure modes placed by pipeline stage and by the signal class that catches them</title>
  <desc id="fc-d">A grid mapping pipeline stages across the top — ingestion, reprojection, compositing, zonal statistics, and export — against three signal classes down the side: spatial, data, and provenance. Spatial catches missing transformation grids, anti-meridian wrapping, categorical bilinear resampling, and geometry validity loss. Data catches partial tile writes, nodata treated as zero, unit confusion between hectares and square metres, and silent dtype overflow. Provenance catches factor-table swaps, timezone-naive timestamps, unpinned dependency drift, and non-deterministic ordering. A footer notes that no entry in the grid is caught by task status, which is the only class most orchestrators report.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Where each failure hides, and which signal finds it</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Not one of these twelve fails a task. All twelve change a reported tonnage.</text>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">
    <text x="242" y="66">Ingestion</text>
    <text x="404" y="66">Reprojection</text>
    <text x="566" y="66">Compositing</text>
    <text x="728" y="66">Zonal stats</text>
    <text x="878" y="66">Export</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="currentColor">
    <text x="146" y="106" text-anchor="end">Spatial</text>
    <text x="146" y="176" text-anchor="end">Data</text>
    <text x="146" y="246" text-anchor="end">Provenance</text>
  </g>
  <g>
    <rect x="162" y="78" width="792" height="56" rx="8" fill="currentColor" opacity="0.07"/>
    <rect x="162" y="148" width="792" height="56" rx="8" fill="currentColor" opacity="0.05"/>
    <rect x="162" y="218" width="792" height="56" rx="8" fill="currentColor" opacity="0.07"/>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="8.5" fill="currentColor">
    <text x="242" y="102">missing NTv2 grid</text>
    <text x="242" y="118" opacity="0.72">→ null transform</text>
    <text x="404" y="102">anti-meridian wrap</text>
    <text x="404" y="118" opacity="0.72">→ inverted area</text>
    <text x="566" y="102">bilinear on classes</text>
    <text x="566" y="118" opacity="0.72">→ invented classes</text>
    <text x="728" y="102">validity loss</text>
    <text x="728" y="118" opacity="0.72">→ dropped slivers</text>
    <text x="878" y="102">CRS not written</text>
    <text x="878" y="118" opacity="0.72">→ consumer guesses</text>
    <text x="242" y="172">partial tile set</text>
    <text x="242" y="188" opacity="0.72">→ silent 6% loss</text>
    <text x="404" y="172">nodata as zero</text>
    <text x="404" y="188" opacity="0.72">→ diluted means</text>
    <text x="566" y="172">unit confusion</text>
    <text x="566" y="188" opacity="0.72">→ ha vs m² ×10⁴</text>
    <text x="728" y="172">dtype overflow</text>
    <text x="728" y="188" opacity="0.72">→ wrapped sums</text>
    <text x="878" y="172">rounding at write</text>
    <text x="878" y="188" opacity="0.72">→ lost precision</text>
    <text x="242" y="242">factor-table swap</text>
    <text x="242" y="258" opacity="0.72">→ restated history</text>
    <text x="404" y="242">timezone-naive time</text>
    <text x="404" y="258" opacity="0.72">→ wrong period</text>
    <text x="566" y="242">unpinned deps</text>
    <text x="566" y="258" opacity="0.72">→ irreproducible</text>
    <text x="728" y="242">non-deterministic order</text>
    <text x="728" y="258" opacity="0.72">→ unstable ties</text>
    <text x="878" y="242">digest not stored</text>
    <text x="878" y="258" opacity="0.72">→ unverifiable</text>
  </g>
  <text x="12" y="292" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">Task status catches none of them.</text>
</svg>

## Root Cause Analysis

The catalogue's twelve entries share three underlying causes, and recognising which one you are looking at shortens the diagnosis considerably.

**Defaults chosen for a different problem.** Geospatial libraries default to behaviour that is right for cartography and wrong for accounting: bilinear resampling because most rasters are continuous, Web Mercator because most maps are for display, silent grid fallback because a missing transformation should not crash an interactive session. Each default is defensible in its original context and produces a wrong tonnage in ours. The countermeasure is to state every parameter explicitly, never relying on a default, and to assert the stated value in the output.

**State that is not in the inputs.** A pipeline is reproducible when its output is a function of its declared inputs. Anything else that reaches the computation — the wall clock, an environment variable, the machine's locale, an unpinned dependency version, dictionary iteration order under a different interpreter — makes the same inputs produce different outputs, and no amount of provenance recording fixes it because the varying thing was never recorded. The countermeasure is the determinism invariant: same digest plus same code version must produce the same result, asserted rather than assumed.

**Silence where there should be a refusal.** Almost every entry below involves a library or a pipeline stage choosing to proceed with an assumption instead of failing. Untagged CRS assumed to be WGS84; nodata assumed to be zero; a missing tile assumed to be empty; an ambiguous timestamp assumed to be UTC. Each assumption is invisible in the output and material to the number. The countermeasure is uniform: reject rather than coerce, everywhere, and make the rejection loud.

## Diagnostic Pipeline / Pre-Flight Validation

The diagnostics below run over an output artefact and its inputs, and each corresponds to one or more catalogue entries. They are deliberately independent of the code that produced the artefact — a stage cannot be its own witness.

```python
import hashlib

import geopandas as gpd
import numpy as np
import rasterio
import structlog
from pyproj import CRS, Transformer

log = structlog.get_logger()

CANONICAL_CRS = CRS.from_epsg(6933)


def diagnose_null_transform(source_crs: str, target_crs: str,
                            probe_lonlat: tuple[float, float]) -> dict:
    """Entry 1 — missing transformation grid, silently ignored.

    PROJ falls back to a ballpark (grid-free) transformation when the NTv2 or
    NADCON file is absent. Nothing raises; coordinates shift by tens of metres.
    The tell is that the chosen pipeline description contains no grid name.
    """
    from pyproj.transformer import TransformerGroup

    group = TransformerGroup(source_crs, target_crs)
    best = group.transformers[0] if group.transformers else None
    uses_grid = bool(best and "grid" in best.description.lower())
    unavailable = [str(g) for g in getattr(group, "unavailable_operations", [])]

    t = Transformer.from_crs(source_crs, target_crs, always_xy=True)
    x, y = t.transform(*probe_lonlat)

    result = {"source": source_crs, "target": target_crs,
              "pipeline": best.description if best else None,
              "uses_grid": uses_grid, "unavailable_operations": len(unavailable),
              "probe_xy": (round(x, 3), round(y, 3))}
    if unavailable:
        log.warning("diag.null_transform.risk", **result,
                    hint="install the grid package or pin an explicit operation")
    return result


def diagnose_antimeridian(gdf: gpd.GeoDataFrame) -> dict:
    """Entry 2 — anti-meridian wrapping.

    A polygon crossing 180 degrees, expressed in geographic coordinates without
    splitting, spans nearly the whole globe in x. Its computed area is enormous
    and its intersections are nonsense — yet nothing errors.
    """
    geographic = gdf.to_crs("EPSG:4326")
    bounds = geographic.bounds
    suspicious = bounds[(bounds["maxx"] - bounds["minx"]) > 180.0]

    if len(suspicious):
        log.error("diag.antimeridian.detected", features=len(suspicious),
                  example_bbox=suspicious.iloc[0].to_dict(),
                  hint="split at 180 before reprojecting, or use a shifted CRS")
    return {"suspicious_features": int(len(suspicious)),
            "checked": int(len(geographic))}


def diagnose_categorical_resampling(path: str, expected_classes: set[int]) -> dict:
    """Entry 3 — a categorical layer resampled with a continuous method.

    Bilinear interpolation between class 2 and class 5 produces class 3 and 4 —
    land-cover categories that never existed, each carrying its own emission
    factor. The signature is unmistakable once you look: classes outside the set.
    """
    with rasterio.open(path) as src:
        data = src.read(1, masked=True)
    present = set(np.unique(data.compressed()).astype(int).tolist())
    invented = sorted(present - expected_classes)

    if invented:
        log.error("diag.categorical_resampling.detected", invented_classes=invented,
                  expected=sorted(expected_classes),
                  hint="use Resampling.nearest for categorical layers")
    return {"invented_classes": invented, "n_present": len(present)}


def diagnose_nodata_as_zero(path: str) -> dict:
    """Entry 4 — nodata read as a real value.

    A nodata sentinel of 0 (or an unset nodata tag) turns absent data into a
    measured zero, diluting every mean and understating every stock.
    """
    with rasterio.open(path) as src:
        nodata = src.nodata
        raw = src.read(1)
        masked = src.read(1, masked=True)

    zero_fraction = float((raw == 0).mean())
    result = {"nodata_tag": nodata, "zero_fraction": round(zero_fraction, 4),
              "masked_fraction": round(float(masked.mask.mean()), 4)
              if np.ma.is_masked(masked) else 0.0}

    if nodata is None and zero_fraction > 0.05:
        log.error("diag.nodata.untagged", **result,
                  hint="an untagged raster with 5%+ zeros is almost always nodata")
    elif nodata == 0:
        log.warning("diag.nodata.zero_sentinel", **result,
                    hint="zero is a legitimate measurement; choose a sentinel outside the range")
    return result


def diagnose_determinism(run_a: dict, run_b: dict) -> dict:
    """Entries 9-12 — hidden state.

    Two runs over identical inputs with identical code must agree exactly. When
    they do not, something outside the declared inputs entered the computation.
    """
    same_inputs = run_a["input_digest"] == run_b["input_digest"]
    same_code = run_a["code_version"] == run_b["code_version"]
    same_result = run_a["result_digest"] == run_b["result_digest"]

    if same_inputs and same_code and not same_result:
        log.error("diag.determinism.violated",
                  input_digest=run_a["input_digest"], code_version=run_a["code_version"],
                  result_a=run_a["result_digest"], result_b=run_b["result_digest"],
                  hint="check wall-clock use, unseeded RNG, set/dict ordering, thread reduction order")
    return {"same_inputs": same_inputs, "same_code": same_code,
            "same_result": same_result,
            "deterministic": not (same_inputs and same_code and not same_result)}
```

<svg viewBox="0 -4 900 302" role="img" aria-labelledby="sig-t sig-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="sig-t">Symptom-to-cause lookup for the four most common silent failures</title>
  <desc id="sig-d">A four-row lookup table rendered as panels. Row one: the symptom is a total area that stepped by one to five percent with no boundary edit, the likely cause is a missing transformation grid or a changed grid package, and the invariant is total area drift above 0.5 percent. Row two: the symptom is emission factors applied to land-cover classes that do not exist in the legend, the cause is bilinear resampling of a categorical layer, and the invariant is class-set membership. Row three: the symptom is a mean stock that fell while no pixel changed, the cause is nodata being counted as zero, and the invariant is a masked-fraction check against the previous run. Row four: the symptom is two runs of the same period disagreeing in the last digits, the cause is non-deterministic reduction order or an unseeded draw, and the invariant is determinism under identical digests.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Start from what you observed</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">The symptom is what you have at 2am. The invariant is what stops you having it again.</text>
    <text x="150" y="62" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700" opacity="0.75">SYMPTOM</text>
    <text x="464" y="62" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700" opacity="0.75">LIKELY CAUSE</text>
    <text x="762" y="62" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700" opacity="0.75">INVARIANT THAT CATCHES IT</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <rect x="12" y="74" width="876" height="48" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="94" fill="currentColor" font-weight="700">Total area stepped 1–5%</text>
    <text x="28" y="112" fill="currentColor" opacity="0.78">no boundary was edited</text>
    <text x="330" y="94" fill="currentColor">missing / changed transformation grid</text>
    <text x="330" y="112" fill="currentColor" opacity="0.78">PROJ fell back to a ballpark transform</text>
    <text x="644" y="94" fill="currentColor" font-weight="700">area drift &gt; 0.5% ⇒ raise</text>
    <text x="644" y="112" fill="currentColor" opacity="0.78">computed in the canonical equal-area CRS</text>
    <rect x="12" y="130" width="876" height="48" rx="7" fill="currentColor" opacity="0.04"/>
    <text x="28" y="150" fill="currentColor" font-weight="700">Factors applied to classes</text>
    <text x="28" y="168" fill="currentColor" opacity="0.78">that are not in the legend</text>
    <text x="330" y="150" fill="currentColor">bilinear resampling of a categorical layer</text>
    <text x="330" y="168" fill="currentColor" opacity="0.78">interpolation invented classes 3 and 4</text>
    <text x="644" y="150" fill="currentColor" font-weight="700">class set ⊆ legend ⇒ raise</text>
    <text x="644" y="168" fill="currentColor" opacity="0.78">asserted after every resample</text>
    <rect x="12" y="186" width="876" height="48" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="206" fill="currentColor" font-weight="700">Mean stock fell</text>
    <text x="28" y="224" fill="currentColor" opacity="0.78">no pixel actually changed</text>
    <text x="330" y="206" fill="currentColor">nodata counted as a measured zero</text>
    <text x="330" y="224" fill="currentColor" opacity="0.78">sentinel unset, or set to 0</text>
    <text x="644" y="206" fill="currentColor" font-weight="700">masked fraction stable ⇒ ok</text>
    <text x="644" y="224" fill="currentColor" opacity="0.78">compared against the previous run</text>
    <rect x="12" y="242" width="876" height="48" rx="7" fill="currentColor" opacity="0.04"/>
    <text x="28" y="262" fill="currentColor" font-weight="700">Two runs disagree</text>
    <text x="28" y="280" fill="currentColor" opacity="0.78">same period, same inputs</text>
    <text x="330" y="262" fill="currentColor">non-deterministic reduction or unseeded draw</text>
    <text x="330" y="280" fill="currentColor" opacity="0.78">thread order, set iteration, wall clock</text>
    <text x="644" y="262" fill="#f3a712" font-weight="700">same digest ⇒ same result</text>
    <text x="644" y="280" fill="currentColor" opacity="0.78">the invariant that makes replay possible</text>
  </g>
</svg>

## Deterministic Transformation Logic

The catalogue is only useful if its entries become executable checks. The function below assembles the invariant set that corresponds to the twelve entries and evaluates it against an artefact and the previous run's signals, raising on violation.

```python
class InvariantViolation(RuntimeError):
    """A signal that must never move has moved."""


def assert_mrv_invariants(
    gdf: gpd.GeoDataFrame, *, stage: str, expected_classes: set[int] | None,
    class_column: str | None, previous: dict | None, input_digest: str,
    code_version: str, factor_set_version: str, expected_partitions: set[str],
    written_partitions: set[str],
) -> dict:
    """Twelve catalogue entries, expressed as assertions over one artefact.

    Ordered so the cheapest and most diagnostic checks run first: a CRS failure
    makes every subsequent geometric check meaningless.
    """
    if gdf.crs is None:                                          # entry 5
        raise InvariantViolation(f"{stage}: output has no CRS")

    geographic = gdf.to_crs("EPSG:4326")
    spans = geographic.bounds["maxx"] - geographic.bounds["minx"]
    if (spans > 180.0).any():                                    # entry 2
        raise InvariantViolation(f"{stage}: geometry crosses the anti-meridian unsplit")

    invalid = int((~gdf.geometry.is_valid).sum())
    if invalid:                                                  # entry 4
        raise InvariantViolation(f"{stage}: {invalid} invalid geometries")

    missing = expected_partitions - written_partitions           # entry 6
    if missing:
        raise InvariantViolation(
            f"{stage}: {len(missing)} expected partitions not written "
            f"(e.g. {sorted(missing)[:3]}) — a retry succeeded on a subset")

    if expected_classes and class_column:                        # entry 3
        present = set(gdf[class_column].dropna().astype(int).unique().tolist())
        invented = present - expected_classes
        if invented:
            raise InvariantViolation(
                f"{stage}: classes {sorted(invented)} are not in the legend — "
                "a categorical layer was resampled with a continuous method")

    equal_area = gdf.to_crs(CANONICAL_CRS)
    area_ha = float(equal_area.geometry.area.sum()) / 10_000.0

    signals = {"stage": stage, "crs": gdf.crs.to_string(), "features": len(gdf),
               "total_area_ha": round(area_ha, 3), "input_digest": input_digest,
               "code_version": code_version, "factor_set_version": factor_set_version}

    if previous:
        drift = abs(area_ha - previous["total_area_ha"]) / max(previous["total_area_ha"], 1e-9)
        if drift > 0.005:                                        # entry 1
            raise InvariantViolation(
                f"{stage}: total area drifted {drift:.3%} — check transformation grids")
        if previous["crs"] != signals["crs"]:
            raise InvariantViolation(f"{stage}: CRS changed between runs")
        if (previous["input_digest"] == input_digest                     # entries 9-12
                and previous["code_version"] == code_version
                and previous["features"] != signals["features"]):
            raise InvariantViolation(
                f"{stage}: identical inputs and code produced a different feature count")

    log.info("mrv.invariants.passed", **signals)
    return signals
```

## Compliance Gating & Audit Trail Generation

Two things turn a catalogue into an audit artefact. The first is that **every invariant violation is logged, including the ones caught in staging** — the record of near-misses is what demonstrates to a verifier that the control is live rather than nominal. A pipeline with no recorded violations over two years is not necessarily clean; it may simply not be checking.

The second is that **each entry maps to a named data-quality control** in the terms a verification standard uses. ISO 14064-3 asks what controls prevent undetected data corruption; the answer is this list, with evidence of operation. Where a violation reached production and changed a reported figure, the correction is a restatement and follows the restatement path, with the corrected figure, the cause, and the newly added invariant recorded together through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/).

Two entries deserve specific compliance treatment. A **factor-table swap** restates every figure computed against the old table, so it must be versioned and pinned as described in [versioning emission factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/). And **timezone-naive timestamps** move observations between reporting periods at the boundary, which is a disclosure error rather than a data error — store everything in UTC with an explicit offset, and derive period membership from a stated rule.

## Production Integration

1. **Encode every entry as an invariant** in the shared observability module, not as a per-pipeline check that drifts between stages.
2. **Run the invariant set after every stage**, computed from the artefact rather than reported by the producer.
3. **Compare against the previous run's signals**, since several entries are only visible as a change rather than as an absolute value.
4. **Fail the run on violation** rather than logging and continuing — a pipeline that proceeds past a violated invariant has taught its operators to ignore the log.
5. **Add an entry after every incident.** The catalogue should grow from your own failure history, which is what makes it worth more than a generic checklist.
6. **Review the set when providers change.** A new processing baseline, a new grid package, or a new library major version invalidates assumptions the invariants were tuned against.

A useful way to prioritise the catalogue is by expected cost rather than by frequency, because the two are almost uncorrelated. The entries that fire most often are cheap to recover from; the entries that fire rarely are the ones that reach a published figure.

<svg viewBox="0 -4 880 300" role="img" aria-labelledby="risk-t risk-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="risk-t">Catalogue entries plotted by how often they occur against how far they travel before discovery</title>
  <desc id="risk-d">A scatter plot with frequency per project-year on the horizontal axis and distance travelled before discovery on the vertical axis, where the vertical scale runs from caught in the same run at the bottom, through caught at the next comparison, caught at verification, and reaching a published figure at the top. Partial tile writes and nodata handling appear at high frequency but low travel. Missing transformation grids and factor-table swaps appear at low frequency and high travel, sitting in a highlighted upper-left quadrant labelled instrument these first. Categorical resampling sits in the middle on both axes. An annotation states that the entries worth instrumenting first are the rare ones that travel far, not the common ones an operator already notices.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Prioritise by travel distance, not by frequency</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">A failure that is caught in the same run costs an hour. One that reaches a published figure costs a restatement.</text>
  </g>
  <rect x="96" y="60" width="230" height="90" fill="#f3a712" opacity="0.12"/>
  <text x="211" y="78" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">instrument these first</text>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="96" y1="150" x2="640" y2="150"/><line x1="96" y1="200" x2="640" y2="200"/>
  </g>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="96" y1="56" x2="96" y2="250"/>
    <line x1="96" y1="250" x2="640" y2="250"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="88" y="80" text-anchor="end">published</text>
    <text x="88" y="130" text-anchor="end">verification</text>
    <text x="88" y="180" text-anchor="end">next run</text>
    <text x="88" y="230" text-anchor="end">same run</text>
    <text x="150" y="268" text-anchor="middle">rare</text>
    <text x="368" y="268" text-anchor="middle">occasional</text>
    <text x="600" y="268" text-anchor="middle">frequent</text>
    <text x="368" y="288" text-anchor="middle" font-weight="600">frequency per project-year</text>
  </g>
  <g>
    <circle cx="146" cy="96" r="6" fill="#f3a712"/>
    <text x="158" y="92" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">missing NTv2 grid</text>
    <circle cx="192" cy="118" r="6" fill="#f3a712"/>
    <text x="204" y="122" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">factor-table swap</text>
    <circle cx="170" cy="142" r="6" fill="#f3a712"/>
    <text x="182" y="146" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">timezone-naive time</text>
    <circle cx="352" cy="164" r="6" fill="currentColor"/>
    <text x="364" y="168" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">categorical resampling</text>
    <circle cx="284" cy="106" r="6" fill="#f3a712"/>
    <text x="296" y="102" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">anti-meridian wrap</text>
    <circle cx="540" cy="222" r="6" fill="currentColor" opacity="0.6"/>
    <text x="470" y="240" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.8">partial tile writes</text>
    <circle cx="486" cy="196" r="6" fill="currentColor" opacity="0.6"/>
    <text x="426" y="192" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.8">nodata handling</text>
    <circle cx="580" cy="234" r="6" fill="currentColor" opacity="0.6"/>
    <text x="510" y="256" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.8">dtype overflow</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="668" y="86" width="204" height="128" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="668" y="86" width="204" height="128" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="684" y="110" fill="currentColor" font-size="10.5" font-weight="700">Read the upper-left first</text>
    <text x="684" y="134" fill="currentColor" font-size="9.5" opacity="0.82">Frequent failures are already</text>
    <text x="684" y="150" fill="currentColor" font-size="9.5" opacity="0.82">visible — someone notices.</text>
    <text x="684" y="174" fill="currentColor" font-size="9.5" opacity="0.82">Rare failures that travel to a</text>
    <text x="684" y="190" fill="currentColor" font-size="9.5" opacity="0.82">published figure are the ones</text>
    <text x="684" y="206" fill="currentColor" font-size="9.5" opacity="0.82">only an invariant will catch.</text>
  </g>
</svg>

That ordering also explains why the catalogue is worth maintaining even when the pipeline appears stable. The upper-left entries fire so rarely that a team can run for two years without meeting one, conclude the invariants are dead weight, and remove them — shortly before a grid package upgrade, a factor-table revision, or a first project crossing 180° longitude produces exactly the failure the invariant existed to catch. Treat the low-frequency checks as insurance whose premium is a few milliseconds per run, and record the near-misses so their value is visible in the incident log rather than only in the incidents that did not happen.

## Frequently Asked Questions

### How do I catch a missing transformation grid before it costs me a run?

Resolve the transformation through an explicit `TransformerGroup` and inspect what it chose, as the first diagnostic above does. If the selected operation's description contains no grid name, or if the group reports unavailable operations, PROJ is about to use a ballpark transformation that will silently shift coordinates. Better still, pin the operation explicitly and fail when it cannot be constructed, so the environment must be correct rather than merely functional. Containerise the grid package alongside the code — a grid that exists on the developer's machine and not in production is the classic version of this incident.

### Why is bilinear resampling of land cover so damaging when the classes look close?

Because class identifiers are labels, not quantities. Interpolating between class 2 (grassland) and class 5 (wetland) produces 3 and 4, which are forest and cropland in most legends, each carrying a completely different emission factor. The error is not a small numerical inaccuracy; it is the application of the wrong factor to real area. The check is trivial — assert that the set of classes present is a subset of the legend — and it should run after every resample, warp, or mosaic operation on a categorical layer.

### Is a determinism invariant realistic for a distributed pipeline?

Yes, with two constraints. Floating-point reductions over a variable number of workers are order-dependent, so either fix the reduction order, use a compensated summation, or compare to a stated tolerance rather than exact equality — a tolerance of a few units in the last place is honest and still catches real non-determinism. And any deliberate randomness must be seeded from a recorded value, not from entropy. With those in place, a same-digest same-result assertion holds in practice across Dask and Spark workloads, and it is the invariant that makes the replay claim testable rather than aspirational.

### How should nodata be chosen so it cannot be mistaken for a measurement?

Pick a sentinel outside the physically possible range of the variable and tag it in the file metadata. For a carbon density raster in tonnes per hectare, a value of −9999 is safe and zero is not, because zero is a legitimate measurement over bare ground. Then read with masking enabled and assert the masked fraction against the previous run: a jump in the masked fraction is either a genuine data-availability change worth knowing about or a sentinel mishandled upstream, and both are worth an alert.

### What about failures that are not in the catalogue?

Every mature catalogue is a record of one team's incidents, so yours will diverge from this one — and that divergence is the point rather than a gap. Three families recur enough to be worth watching for even though their specifics vary by stack: **provider-side changes**, where a data source revises its processing baseline, changes a nodata convention, or reprocesses an archive in place; **join-key erosion**, where an identifier that was unique becomes non-unique after a source merges datasets, silently multiplying rows; and **boundary-condition arithmetic**, where a period, a tile edge, or a class boundary is included by one stage and excluded by the next, producing small double counts or gaps that are individually immaterial and collectively not.

Each of the three is caught by the same discipline the twelve entries use: an assertion over the artefact rather than trust in the producer. Row-count-per-key invariants catch join erosion; digest comparison against the provider's published checksums catches in-place reprocessing; and reconciling the sum of parts against an independently computed total catches boundary arithmetic. When a new failure reaches production, the review should end with the assertion that would have stopped it, added to the shared module rather than to the pipeline where it happened to occur.

### Which entries should a small team implement first?

The three that change numbers most and cost least to check: total area drift, class-set membership, and partition completeness. Together they cover the datum fallback, the categorical resampling, and the partial-write failures, which in practice account for the majority of silent corruption in spatial carbon pipelines. Determinism is the next most valuable but takes more work to make reliable; the provenance entries follow naturally once you are already computing digests for it.

## Related guides

- [MRV Pipeline Observability & Failure Modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/) — the parent topic and the four signal classes.
- [Instrumenting MRV Pipelines with OpenTelemetry and structlog](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/instrumenting-mrv-pipelines-with-opentelemetry-and-structlog/) — where these invariants are emitted from.
- [Debugging Silent Datum Shifts in Carbon Pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/debugging-silent-datum-shifts-in-carbon-pipelines/) — entry one, in full depth.
- [Handling Anti-Meridian Wrapping in Raster Mosaics](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/handling-anti-meridian-wrapping-in-raster-mosaics/) — entry two, in full depth.
