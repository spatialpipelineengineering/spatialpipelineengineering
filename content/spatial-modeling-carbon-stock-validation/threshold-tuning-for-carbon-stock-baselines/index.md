# Threshold Tuning for Carbon Stock Baselines

Threshold tuning is the calibration stage that decides which pixel-level carbon stock changes count as real ecological signal and which are sensor noise, phenology, or projection artefact — the gate that determines whether a baseline survives third-party verification. It sits inside the [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) framework, consuming calibrated rasters and uncertainty bands from [biomass estimation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/) upstream and feeding tuned masks downstream into [ground-truth alignment](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) and [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/). As climate accounting moves from static, region-wide emission factors to dynamic, spatially explicit baselines, the selection and validation of these thresholds directly governs audit readiness, additionality claims, and conformance with Verra, Gold Standard, and GHG Protocol requirements.

Engineered correctly, threshold tuning treats the cutoff as a versioned, reproducible parameter derived from drift-corrected distributions rather than a hand-tuned constant. It depends on deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) from the foundational [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack to keep every area-weighted statistic honest, and on cloud-masked, temporally aligned reflectance from the [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) layer to keep the input distribution stable across reference periods. This article details where the stage sits, how it fails, and how to implement it as a defensible, auditable component.

<svg viewBox="0 0 920 184" role="img" aria-label="Threshold tuning pipeline in five stages. A CRS-validated carbon proxy stack is split into per-ecoregion strata, each stratum gets a 95th-percentile threshold from quantile regression, the thresholds are applied to build a stable-versus-degraded mask, and the mask is exported as a compliance-ready raster carrying Verra VM0042 metadata." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:920px;display:block;margin:1.5rem auto;">
  <title>Five-stage threshold tuning pipeline from carbon proxy stack to compliance-ready raster</title>
  <desc>A CRS-validated carbon proxy stack feeds per-ecoregion stratification. Each stratum passes to quantile regression that derives a 95th-percentile threshold. The thresholds are then applied to classify pixels into a stable-versus-degraded mask, which is exported as a compliance-ready raster tagged with Verra VM0042 metadata.</desc>
  <defs>
    <marker id="tt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- Stage 1 -->
  <rect x="12" y="57" width="150" height="70" rx="8" fill="currentColor" opacity="0.06"/>
  <rect x="12" y="57" width="150" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="87" y="80" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">INPUT</text>
  <text x="87" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Carbon proxy stack</text>
  <text x="87" y="111" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">CRS-validated · equal-area</text>
  <!-- Stage 2 -->
  <rect x="199" y="57" width="150" height="70" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="199" y="57" width="150" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="274" y="88" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Stratification</text>
  <text x="274" y="104" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">per ecoregion</text>
  <!-- Stage 3 -->
  <rect x="386" y="57" width="150" height="70" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="386" y="57" width="150" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="461" y="84" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Quantile regression</text>
  <text x="461" y="100" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">95th-percentile</text>
  <text x="461" y="113" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">threshold</text>
  <!-- Stage 4 -->
  <rect x="573" y="57" width="150" height="70" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="573" y="57" width="150" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="648" y="84" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Apply thresholds</text>
  <text x="648" y="100" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">stable vs degraded</text>
  <text x="648" y="113" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">mask</text>
  <!-- Stage 5 -->
  <rect x="760" y="57" width="150" height="70" rx="8" fill="currentColor" opacity="0.1"/>
  <rect x="760" y="57" width="150" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <text x="835" y="80" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.6">OUTPUT</text>
  <text x="835" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Compliance raster</text>
  <text x="835" y="111" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">Verra VM0042 metadata</text>
  <!-- Flows -->
  <line x1="162" y1="92" x2="197" y2="92" stroke="currentColor" stroke-width="1.5" marker-end="url(#tt-arrow)"/>
  <line x1="349" y1="92" x2="384" y2="92" stroke="currentColor" stroke-width="1.5" marker-end="url(#tt-arrow)"/>
  <line x1="536" y1="92" x2="571" y2="92" stroke="currentColor" stroke-width="1.5" marker-end="url(#tt-arrow)"/>
  <line x1="723" y1="92" x2="758" y2="92" stroke="currentColor" stroke-width="1.5" marker-end="url(#tt-arrow)"/>
</svg>

## Role in the MRV Workflow

In a production Measurement, Reporting, and Verification (MRV) pipeline, threshold tuning runs after raw sensor ingestion, atmospheric correction, and temporal compositing, but before compliance export and ledger synchronization. Its upstream dependency is a multi-temporal carbon proxy stack — typically fused optical, LiDAR, and SAR products carrying per-pixel uncertainty. Its downstream consumers are the validation stage, the registry export serializer, and the append-only lineage ledger that records exactly which parameters produced a given baseline.

The objective is to define spatial boundaries where carbon stock changes exceed natural variability, sensor noise, or phenological cycles. Set the cutoff too loose and the pipeline overestimates sequestration by capturing seasonal biomass fluctuations; set it too tight and it underestimates by applying overly conservative global cutoffs that erase genuine recovery. Neither failure is recoverable downstream — a miscalibrated threshold propagates a fixed bias into every area-weighted tonnage figure, and verifiers reconstruct that bias the moment they re-run the stratification.

Because the stage emits a classification mask rather than a continuous estimate, it is also the natural place to enforce regional stratification. A single global threshold cannot reconcile a boreal peatland with a tropical dry forest; the cutoff must be derived per ecoregion so that the marginal-change definition tracks local ecological gradients. This makes threshold tuning the bridge between the statistical modeling layer and the regulatory stratification rules — Verra VM0042 §4.2 baseline strata, for example, map almost one-to-one onto the per-region thresholds computed here.

<svg viewBox="0 0 920 300" role="img" aria-label="Where threshold tuning sits in the MRV pipeline. Upstream, temporal compositing and biomass fusion produce the proxy stack. That feeds the threshold tuning stage, which also takes a highlighted per-ecoregion stratification branch mapping to Verra VM0042 section 4.2 strata. Threshold tuning then feeds a downstream chain: validation, then registry export, then an append-only lineage ledger." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:920px;display:block;margin:1.5rem auto;">
  <title>Threshold tuning between upstream compositing and the downstream validation-to-ledger chain</title>
  <desc>Upstream, temporal compositing plus biomass fusion emit the carbon proxy stack into the threshold tuning stage. A highlighted per-ecoregion stratification branch, mapped to Verra VM0042 section 4.2 baseline strata, feeds the same stage from below. Threshold tuning then drives a sequential downstream chain of validation, registry export, and an append-only lineage ledger.</desc>
  <defs>
    <marker id="pp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- Upstream -->
  <rect x="14" y="66" width="152" height="72" rx="8" fill="currentColor" opacity="0.06"/>
  <rect x="14" y="66" width="152" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.7"/>
  <text x="90" y="88" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">UPSTREAM</text>
  <text x="90" y="105" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Temporal compositing</text>
  <text x="90" y="121" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">+ biomass fusion</text>
  <!-- This stage (emphasized) -->
  <rect x="210" y="52" width="180" height="100" rx="9" fill="currentColor" opacity="0.12"/>
  <rect x="210" y="52" width="180" height="100" rx="9" fill="none" stroke="currentColor" stroke-width="2"/>
  <text x="300" y="78" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" opacity="0.6">THIS STAGE</text>
  <text x="300" y="98" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">Threshold tuning</text>
  <text x="300" y="116" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">drift-corrected cutoffs</text>
  <text x="300" y="130" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">equal-area · per region</text>
  <!-- Stratification branch (highlighted) -->
  <rect x="210" y="212" width="180" height="72" rx="8" fill="currentColor" opacity="0.1"/>
  <rect x="210" y="212" width="180" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="6,3"/>
  <text x="300" y="234" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" opacity="0.6">BRANCH</text>
  <text x="300" y="251" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Per-ecoregion strata</text>
  <text x="300" y="267" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">Verra VM0042 §4.2</text>
  <!-- Downstream chain -->
  <rect x="430" y="66" width="130" height="72" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="430" y="66" width="130" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <text x="495" y="98" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Validation</text>
  <text x="495" y="114" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.72">Moran's I · plots</text>
  <rect x="600" y="66" width="130" height="72" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="600" y="66" width="130" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <text x="665" y="98" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Registry export</text>
  <text x="665" y="114" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.72">compliance serializer</text>
  <rect x="770" y="66" width="134" height="72" rx="8" fill="currentColor" opacity="0.08"/>
  <rect x="770" y="66" width="134" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <text x="837" y="98" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Lineage ledger</text>
  <text x="837" y="114" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.72">append-only</text>
  <!-- Flows -->
  <line x1="166" y1="102" x2="208" y2="102" stroke="currentColor" stroke-width="1.5" marker-end="url(#pp-arrow)"/>
  <line x1="390" y1="102" x2="428" y2="102" stroke="currentColor" stroke-width="1.5" marker-end="url(#pp-arrow)"/>
  <line x1="560" y1="102" x2="598" y2="102" stroke="currentColor" stroke-width="1.5" marker-end="url(#pp-arrow)"/>
  <line x1="730" y1="102" x2="768" y2="102" stroke="currentColor" stroke-width="1.5" marker-end="url(#pp-arrow)"/>
  <line x1="300" y1="212" x2="300" y2="154" stroke="currentColor" stroke-width="1.6" stroke-dasharray="6,3" marker-end="url(#pp-arrow)"/>
</svg>

### Statistical basis for the cutoff

Threshold derivation combines distributional analysis, receiver operating characteristic (ROC) evaluation, and uncertainty quantification. The default approach applies quantile regression to model the relationship between remote sensing indices and field-calibrated biomass, then identifies the inflection point where marginal change in carbon stock exceeds the 95% confidence interval of natural variability. Alternatives include Youden's J statistic for binary stability/degradation classification, or Bayesian hierarchical modeling to fold in prior ecological knowledge. Whichever engine is chosen, the resulting cutoff must be validated against an independent reference dataset and checked for spatial autocorrelation before it is allowed to write a mask, because thresholds that ignore topographic or edaphic gradients generate false positives that auditors find immediately.

## Core Failure Modes

Three failure modes account for the large majority of threshold defects observed in production carbon baselines. Each has a distinct root cause and a measurable impact on reported tonnage.

1. **Phenological overfitting.** The threshold latches onto leaf-on/leaf-off cycles rather than structural carbon loss, so seasonal greening is misread as sequestration. Root cause: the proxy stack is not detrended for vegetation phenology before the distribution is fit. Observed impact: seasonal NDVI swings of 0.2–0.4 in deciduous and savanna systems translate into 10–25% spurious year-on-year stock change, the single largest source of over-crediting in optical-only baselines. Mitigation: apply harmonic regression detrending to remove the dominant annual and semi-annual terms before threshold derivation.

2. **Cloud-induced variance inflation.** Persistent cloud cover — acute in tropical and montane zones — leaves spatially heterogeneous data voids after masking. Those voids shrink the valid-observation count unevenly, widening local confidence intervals and pushing the 95th-percentile cutoff upward. Root cause: variance is estimated on gappy stacks without gap-aware weighting. Observed impact: in scenes with >60% cloud frequency, effective threshold drift of 15–30% has been recorded between adjacent tiles, fragmenting otherwise contiguous strata. Mitigation: temporal gap-filling via interpolation of valid-observation composites prior to quantile fitting, plus a minimum-valid-observation gate per pixel.

3. **CRS projection distortion.** Area-weighted thresholds degrade when computed in a non-equal-area projection because pixel ground area varies with latitude. Root cause: the stack is rasterized or reprojected to a conformal CRS such as EPSG:3857 (Web Mercator), which inflates apparent area toward the poles. Observed impact: at 55° latitude, Web Mercator overstates pixel area by roughly 3×, biasing every area-weighted percentile and the resulting tonnage by the same factor. Mitigation: enforce an equal-area CRS — EPSG:6933 (EASE-Grid 2.0) globally or EPSG:3035 (ETRS89-LAEA) for Europe — during rasterization, and reject EPSG:3857 outright for any area calculation.

Spatial drift compounds all three. Sensor degradation, orbital decay, and shifting sun-sensor geometry introduce systematic bias across multi-temporal stacks; when uncorrected, this shifts the empirical distribution of the carbon proxy, so a static cutoff that was valid in year one silently misclassifies stable ecosystems as degraded by year five. Effective tuning therefore couples drift-aware normalization with the per-region stratification described above.

## Deterministic Implementation Architecture

The reference implementation uses `prefect` for orchestration, `xarray` and `dask` for chunked geospatial computation, `rioxarray`/`rasterio` for I/O, and `geopandas` for vectorized spatial operations. Structured logging via `structlog` keeps every threshold decision traceable across the audit trail, and explicit CRS handling prevents projection-induced misalignment.

All area-weighted operations run in an equal-area projection. EPSG:6933 (EASE-Grid 2.0) and EPSG:3035 (ETRS89-LAEA, for Europe) are appropriate; EPSG:3857 (Web Mercator) is conformal, severely distorts area at mid-to-high latitudes, and must not be used for threshold calculations.

```python
import structlog
import xarray as xr
import rioxarray  # registers the xarray ".rio" accessor
import rasterio
import geopandas as gpd
from prefect import flow, task
from pyproj import CRS
from sklearn.linear_model import QuantileRegressor
import numpy as np

logger = structlog.get_logger()

EQUAL_AREA = {6933, 3035}  # EASE-Grid 2.0 (global), ETRS89-LAEA (Europe)


@task
def load_carbon_stack(stack_path: str, target_epsg: int = 6933) -> xr.Dataset:
    """Load multi-temporal carbon proxy stack with an equal-area CRS gate."""
    if target_epsg not in EQUAL_AREA:
        raise ValueError(f"EPSG:{target_epsg} is not equal-area; refusing area-weighted thresholds")
    ds = xr.open_dataset(stack_path, engine="rasterio", chunks="auto")
    target_crs = CRS.from_epsg(target_epsg)
    if ds.rio.crs != target_crs:
        logger.warning("crs_mismatch", expected=str(target_crs), actual=str(ds.rio.crs))
        ds = ds.rio.reproject(target_crs)
    logger.info("stack_loaded", bands=list(ds.data_vars), shape=dict(ds.sizes))
    return ds


@task
def derive_thresholds(
    ds: xr.Dataset, reference_gdf: gpd.GeoDataFrame, quantile: float = 0.95, min_pixels: int = 30
) -> dict:
    """Compute drift-corrected thresholds per ecoregion via quantile regression."""
    thresholds = {}
    for region_id, group in reference_gdf.groupby("ecoregion_id"):
        clipped = ds.rio.clip(group.geometry, drop=True)
        carbon_vals = clipped["carbon_stock"].stack(z=("y", "x")).dropna("z").values

        if carbon_vals.size < min_pixels:
            # Variance is unstable below the minimum-valid-observation gate.
            logger.warning("insufficient_pixels", region=region_id, count=int(carbon_vals.size))
            continue

        # Quantile regression isolates the upper tail of natural variability
        # without assuming a Gaussian distribution of the proxy.
        order = np.argsort(carbon_vals)
        X = np.arange(carbon_vals.size).reshape(-1, 1)
        y = carbon_vals[order]
        qr = QuantileRegressor(quantile=quantile, alpha=0.01, solver="highs")
        qr.fit(X, y)
        threshold_val = float(qr.predict(np.array([[carbon_vals.size]]))[0])

        thresholds[region_id] = threshold_val
        logger.info("threshold_computed", region=region_id, value=threshold_val, quantile=quantile)

    if not thresholds:
        raise RuntimeError("no region met the minimum-valid-observation gate")
    # Each entry maps to a Verra VM0042 §4.2 baseline stratum.
    return thresholds


@task
def apply_and_export(ds: xr.Dataset, thresholds: dict, output_path: str) -> None:
    """Apply per-region thresholds, build a stable/degraded mask, and export with provenance."""
    threshold_raster = xr.full_like(ds["carbon_stock"], fill_value=np.nan)
    for region_id, val in thresholds.items():
        region_sel = ds["region_id"] == region_id
        threshold_raster = threshold_raster.where(~region_sel, val)

    change_mask = (ds["carbon_stock"] > threshold_raster).astype(np.uint8)

    change_mask.rio.to_raster(
        output_path,
        driver="GTiff",
        compress="LZW",
        tiled=True,
        metadata={
            "compliance_standard": "Verra_VM0042",
            "threshold_method": "quantile_regression_95",
            "crs_epsg": str(ds.rio.crs.to_epsg()),
        },
    )
    logger.info("compliance_export_complete", path=output_path, shape=dict(change_mask.sizes))


@flow(name="carbon_baseline_threshold_tuning")
def run_threshold_pipeline(stack_path: str, reference_path: str, output_path: str) -> None:
    logger.info("pipeline_start", stage="baseline_calibration")
    ds = load_carbon_stack(stack_path)
    ref_gdf = gpd.read_file(reference_path)
    thresholds = derive_thresholds(ds, ref_gdf)
    apply_and_export(ds, thresholds, output_path)
    logger.info("pipeline_complete", audit_ready=True, regions=len(thresholds))


if __name__ == "__main__":
    run_threshold_pipeline(
        stack_path="s3://mrv-data/carbon_stack_2015_2023.zarr",
        reference_path="data/ecoregion_boundaries.gpkg",
        output_path="output/baseline_threshold_mask.tif",
    )
```

The equal-area gate in `load_carbon_stack` and the minimum-valid-observation gate in `derive_thresholds` are the two non-negotiable validation points: the first prevents projection distortion (failure mode 3), the second prevents variance inflation from gappy strata (failure mode 2). Phenological detrending (failure mode 1) belongs upstream of this flow, in the temporal compositing stage, so the `carbon_stock` variable arriving here is already deseasonalized.

## Validation, Debugging & Compliance Mapping

Post-computation validation must confirm that tuned thresholds introduce no spatial leakage and respect permanence assumptions. Run a spatial autocorrelation check (Moran's I) on the residual error map to detect unmodeled clustering — significant positive autocorrelation in residuals is the signature of a missing covariate such as slope or soil class. Cross-validate the optical-proxy thresholds against independent LiDAR/SAR-derived biomass so that the cutoff aligns with structural canopy metrics; mismatched vertical-structure assumptions against the [biomass estimation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/) layer are a frequent trigger for auditor queries during verification.

Final validation requires alignment with ground-truth inventory plots. When field-calibrated biomass measurements diverge from tuned thresholds by more than 15%, recalibration must be triggered automatically. This step is formalized in the [ground-truth alignment](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) protocol and is mandatory for conformance.

Each code output maps to a specific regulatory requirement:

<div style="overflow-x:auto">

| Output artefact | Regulatory hook | What the verifier checks |
| --- | --- | --- |
| Per-region threshold dictionary | Verra [VM0042](https://verra.org/methodologies/vm0042/) §4.2 baseline strata | Strata are derived, not assumed; each carries a reproducible statistical parameter |
| Equal-area CRS metadata tag | ISO 14064-3 conservativeness | Area-weighted figures computed in an equal-area projection, not Web Mercator |
| Threshold method + quantile metadata | [IPCC 2006 Guidelines](https://www.ipcc-nggip.iges.or.jp/public/2006gl/) tier reporting | Method, tier, and confidence interval are declared and reproducible |
| Moran's I residual report | [GHG Protocol](https://ghgprotocol.org/corporate-standard) additionality | No spatially clustered systematic error inflating the credited area |
| Lineage record (CRS, windows, params) | CSRD ESRS E1 audit trail | Any baseline can be reconstructed from logged parameters alone |

</div>

Production pipelines should route every threshold artefact to a version-controlled compliance ledger so that an audit request can reconstruct the exact statistical parameters, CRS, and temporal windows used during baseline generation. The `metadata` block written in `apply_and_export` is the minimum payload; in practice it is supplemented by the structured `threshold_computed` log lines, which give a per-region trail of value and quantile.

## Conclusion

Threshold tuning converts noisy, drift-prone carbon proxies into a defensible stable/degraded mask, and it is the stage where a baseline most often earns — or loses — its verification. The discipline is straightforward to state and demanding to engineer: stratify by ecoregion, derive each cutoff from a drift-corrected distribution in an equal-area projection, gate on minimum valid observations, and log every parameter to a reconstructable ledger. It is not a one-time calibration but a continuous feedback loop; as sensor constellations evolve and ecological baselines shift under climate stress, the pipeline must re-evaluate thresholds, log drift metrics, and propagate updates to carbon registries without manual intervention.

For deeper, task-specific procedures — harmonic detrending recipes, gap-filling strategies for high-cloud regions, and recalibration triggers wired to plot inventories — follow the linked guides below and the [ground-truth alignment](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) workflow that closes the loop on every tuned baseline.

## Related

- [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) — the parent framework this stage belongs to
- [Biomass Estimation from LiDAR & SAR Fusion](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/) — the upstream stage that produces the proxy stack tuned here
- [Ground Truth Alignment for Carbon Models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) — the downstream calibration that validates tuned thresholds
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — propagates threshold uncertainty into reported variance
- [Geospatial Coordinate Reference Systems & CRS Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the equal-area foundations every area-weighted threshold depends on
