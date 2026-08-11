---
shortTitle: "Permanence, Reversal & Leakage Monitoring"
title: "Permanence, Reversal & Leakage Monitoring"
description: "Engineering the monitoring layer that protects issued carbon credits: detecting reversals from satellite time series, quantifying activity-shifting leakage against spatial controls, and sizing buffer-pool contributions with defensible evidence."
slug: permanence-reversal-and-leakage-monitoring
type: topic
breadcrumb: "Permanence & Leakage"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Permanence, Reversal & Leakage Monitoring

Permanence, reversal, and leakage monitoring is the post-issuance discipline that keeps a carbon credit honest for the decades after it is sold — detecting when sequestered carbon returns to the atmosphere, measuring the emissions a project displaced rather than avoided, and converting both into buffer-pool obligations the registry can act on. It is the part of the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack that most projects treat as an annual reporting chore and that most reputational failures trace back to. A baseline can be conservative and a biomass model can be excellent, and the project still fails if a 2028 fire is discovered in 2031, or if the deforestation the project prevented simply moved five kilometres down the road.

<svg viewBox="0 -4 940 268" role="img" aria-labelledby="perm-t perm-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="perm-t">The three obligations that continue after a carbon credit is issued</title>
  <desc id="perm-d">A monitored project area feeds three parallel monitoring streams. Reversal detection watches the project area itself for stock loss from fire, harvest, or disease, and routes confirmed loss to a buffer-pool cancellation. Leakage monitoring compares activity inside a surrounding belt and matched control areas against the project, and routes displaced activity to a deduction from net issuance. Permanence assessment tracks risk-rating inputs over time and routes changes to a buffer contribution adjustment. All three write to a single monitoring-period report submitted to the registry.</desc>
  <defs>
    <marker id="perm-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="10" y="94" width="150" height="70" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="10" y="94" width="150" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="85" y="122" fill="currentColor" font-size="11.5" font-weight="700">Issued project</text>
    <text x="85" y="140" fill="currentColor" font-size="9.5" opacity="0.78">crediting period active</text>
    <rect x="248" y="6" width="252" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="374" y="30" fill="currentColor" font-size="11" font-weight="700">Reversal detection</text>
    <text x="374" y="48" fill="currentColor" font-size="9.5" opacity="0.78">stock loss inside the boundary</text>
    <text x="374" y="64" fill="currentColor" font-size="9.5" opacity="0.78">fire · harvest · disease · storm</text>
    <rect x="248" y="96" width="252" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="374" y="120" fill="currentColor" font-size="11" font-weight="700">Leakage monitoring</text>
    <text x="374" y="138" fill="currentColor" font-size="9.5" opacity="0.78">activity in belt vs matched controls</text>
    <text x="374" y="154" fill="currentColor" font-size="9.5" opacity="0.78">displacement, not avoidance</text>
    <rect x="248" y="186" width="252" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="374" y="210" fill="currentColor" font-size="11" font-weight="700">Permanence assessment</text>
    <text x="374" y="228" fill="currentColor" font-size="9.5" opacity="0.78">risk rating re-scored each period</text>
    <text x="374" y="244" fill="currentColor" font-size="9.5" opacity="0.78">tenure · fire · governance · market</text>
    <rect x="588" y="6" width="210" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="693" y="34" fill="currentColor" font-size="10.5" font-weight="700">Buffer cancellation</text>
    <text x="693" y="54" fill="currentColor" font-size="9.5" opacity="0.78">tCO₂e retired from pool</text>
    <rect x="588" y="96" width="210" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="693" y="124" fill="currentColor" font-size="10.5" font-weight="700">Issuance deduction</text>
    <text x="693" y="144" fill="currentColor" font-size="9.5" opacity="0.78">leakage subtracted from net</text>
    <rect x="588" y="186" width="210" height="66" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="693" y="214" fill="currentColor" font-size="10.5" font-weight="700">Buffer contribution</text>
    <text x="693" y="234" fill="currentColor" font-size="9.5" opacity="0.78">% withheld, re-set per period</text>
    <rect x="826" y="94" width="106" height="70" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="826" y="94" width="106" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <text x="879" y="120" fill="currentColor" font-size="10.5" font-weight="700">Monitoring</text>
    <text x="879" y="136" fill="currentColor" font-size="10.5" font-weight="700">report</text>
    <text x="879" y="152" fill="currentColor" font-size="9" opacity="0.75">to registry</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#perm-arrow)">
    <path d="M160 118 C 200 110, 210 44, 246 39"/>
    <line x1="160" y1="129" x2="246" y2="129"/>
    <path d="M160 140 C 200 148, 210 214, 246 219"/>
    <line x1="500" y1="39" x2="586" y2="39"/>
    <line x1="500" y1="129" x2="586" y2="129"/>
    <line x1="500" y1="219" x2="586" y2="219"/>
    <path d="M798 39 C 830 44, 838 108, 824 118"/>
    <line x1="798" y1="129" x2="824" y2="129"/>
    <path d="M798 219 C 830 214, 838 150, 824 140"/>
  </g>
</svg>

## Role in the MRV Workflow

Monitoring for permanence sits outside the main measurement pipeline in an important sense: it runs on a clock the project cannot stop. Measurement produces a credit once; permanence monitoring must produce evidence every period for the full crediting term and, under most methodologies, for a defined post-crediting monitoring obligation beyond it. Architecturally that means the monitoring stage cannot depend on the project team re-running an analysis by hand. It must be a scheduled, idempotent job over the same canonical stack — the same [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) composites, the same equal-area geometry, the same emission factors — so a run in 2034 reproduces a figure from 2027 without an archaeology project.

Upstream, the stage consumes three inputs: a dense observation record over the project boundary, a set of matched control areas established at project start, and the baseline and stock model whose outputs the credits were issued against, as set out under [forest carbon baseline and additionality modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/). Downstream it produces three distinct obligations, and conflating them is a common and expensive error. A **reversal** cancels credits already issued and is settled from the buffer pool. **Leakage** reduces net issuance in the current period. A change in the **permanence risk rating** changes the fraction of future issuance withheld into the buffer. They have different accounting treatments, different evidence requirements, and different deadlines.

The control areas deserve particular emphasis because they must be chosen *before* they are needed. Leakage is defined counterfactually — what would have happened without the project — and the only credible spatial estimator is a comparison against areas that were statistically similar to the project at baseline on the drivers of change: accessibility, slope, tenure class, distance to road and market, historical deforestation rate. Matching after a reversal has already occurred invites selection on the outcome, and a verifier will treat it that way. Establish the control set at validation, freeze it, version it in the schema described by the [MRV data schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/), and re-use it unchanged every period.

## Core Failure Modes

1. **Detecting reversals too late to be useful.** Annual monitoring with a single dry-season composite means a fire in month two is confirmed in month fourteen, after the affected vintage has been sold and possibly retired. The root cause is treating monitoring as a reporting deliverable rather than an alerting system. A reversal detector should run on every usable acquisition, escalate a candidate within days, and hold a provisional flag until confirmation — the same architecture used for [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/), pointed inward at the project rather than outward at a landscape. The measurable impact is not the tonnage; it is the fraction of a reversal that lands on already-retired credits, which the buffer pool must absorb with no recourse.

2. **Leakage estimated against unmatched or contaminated controls.** Two variants, both fatal. In the first, controls are chosen for convenience — an adjacent protected area, a district polygon — and differ systematically from the project on accessibility or tenure, so the difference in observed change measures the mismatch rather than the leakage. In the second, the control areas are themselves affected by the project: the belt immediately surrounding a project is where displaced activity lands, so using it as a *control* rather than a *leakage belt* subtracts the leakage from itself and reports approximately zero. Well-matched controls typically shift a leakage estimate by tens of percent of the gross reduction; badly matched ones can flip its sign.

3. **Silent drift between the monitoring model and the issuance model.** Credits were issued using a specific biomass model, emission factor set, and canopy threshold. Five years later the monitoring run uses an upgraded model, a revised factor table, and a re-tuned threshold, and the resulting stock estimate differs from the issuance estimate for reasons that have nothing to do with any physical change on the ground. The pipeline reports an apparent reversal — or, worse, hides a real one behind a model-driven gain. The defence is version pinning end to end, exactly as described in [versioning emission factor databases for reproducible MRV](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/versioning-emission-factor-databases-for-reproducible-mrv/): a monitoring run must be able to execute against the pinned issuance-era model and the current one, and report both.

<svg viewBox="0 -4 900 300" role="img" aria-labelledby="rev-t rev-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rev-t">A carbon stock time series showing a reversal, and how the three candidate causes are separated</title>
  <desc id="rev-d">A line chart of project carbon stock in tonnes CO2 equivalent per hectare from 2026 to 2032. The stock rises steadily from about 210 to 265, then drops sharply to 168 in mid-2030 before partially recovering to 195 by 2032. Three annotations mark the interpretation: an abrupt single-date drop with a burn-scar spectral signature indicates fire, a stepped drop aligned to parcel boundaries indicates harvest, and a slow multi-season decline indicates disease or drought. A shaded band marks the issued stock level, showing the portion of the drop that falls below it and must be settled from the buffer pool.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Reversal shape carries the diagnosis</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Project mean stock, tCO₂e ha⁻¹, from dense optical monitoring</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.25">
    <line x1="70" y1="66" x2="700" y2="66"/>
    <line x1="70" y1="122" x2="700" y2="122"/>
    <line x1="70" y1="178" x2="700" y2="178"/>
    <line x1="70" y1="234" x2="700" y2="234"/>
  </g>
  <rect x="70" y="80" width="630" height="42" fill="currentColor" opacity="0.07"/>
  <text x="694" y="94" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="currentColor" opacity="0.7" text-anchor="end">issued stock level</text>
  <g stroke="currentColor" stroke-width="1.4">
    <line x1="70" y1="56" x2="70" y2="252"/>
    <line x1="70" y1="252" x2="700" y2="252"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.75">
    <text x="62" y="256" text-anchor="end">150</text>
    <text x="62" y="238" text-anchor="end">160</text>
    <text x="62" y="182" text-anchor="end">200</text>
    <text x="62" y="126" text-anchor="end">240</text>
    <text x="62" y="70" text-anchor="end">280</text>
    <text x="70" y="270" text-anchor="middle">2026</text>
    <text x="228" y="270" text-anchor="middle">2028</text>
    <text x="385" y="270" text-anchor="middle">2030</text>
    <text x="543" y="270" text-anchor="middle">2031</text>
    <text x="700" y="270" text-anchor="middle">2032</text>
  </g>
  <polyline points="70,168 149,158 228,148 307,138 346,133 385,229 464,218 543,205 621,195 700,187" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <circle cx="385" cy="229" r="5" fill="none" stroke="#f3a712" stroke-width="2.4"/>
  <line x1="385" y1="133" x2="385" y2="222" stroke="#f3a712" stroke-width="1.6" stroke-dasharray="4,3"/>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="398" y="212" fill="#f3a712" font-weight="700">−97 tCO₂e ha⁻¹ in one acquisition</text>
    <text x="398" y="226" fill="currentColor" opacity="0.75">burn-scar NBR signature → fire</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <rect x="716" y="66" width="176" height="60" rx="7" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.8"/>
    <text x="728" y="86" fill="currentColor" font-weight="700">Stepped, parcel-aligned</text>
    <text x="728" y="102" fill="currentColor" opacity="0.75">→ harvest or clearing</text>
    <text x="728" y="118" fill="currentColor" opacity="0.75">check cadastral join</text>
    <rect x="716" y="138" width="176" height="60" rx="7" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.8"/>
    <text x="728" y="158" fill="currentColor" font-weight="700">Slow multi-season decline</text>
    <text x="728" y="174" fill="currentColor" opacity="0.75">→ drought or pest</text>
    <text x="728" y="190" fill="currentColor" opacity="0.75">check climate covariates</text>
    <rect x="716" y="210" width="176" height="60" rx="7" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.8"/>
    <text x="728" y="230" fill="currentColor" font-weight="700">Step at a model upgrade</text>
    <text x="728" y="246" fill="currentColor" opacity="0.75">→ not a reversal</text>
    <text x="728" y="262" fill="currentColor" opacity="0.75">re-run on pinned model</text>
  </g>
</svg>

## Deterministic Implementation Architecture

The monitoring task below runs one period. It computes project stock change against the pinned issuance-era model, classifies any loss, estimates leakage against the frozen matched-control set using a difference-in-differences estimator, and emits a single record carrying every input needed to reproduce it. It refuses to report a reversal when the model version has changed without a paired pinned-model run — the drift failure mode above, made structurally impossible.

```python
from dataclasses import dataclass, asdict

import geopandas as gpd
import numpy as np
import structlog
from prefect import flow, task

log = structlog.get_logger()

CANONICAL_CRS = "EPSG:6933"     # equal-area: every hectare below is a real hectare
REVERSAL_GATE_TCO2E = 500.0     # material-loss threshold for registry notification
CONFIRM_OBSERVATIONS = 2        # a loss is provisional until a second clear scene


@dataclass(frozen=True)
class MonitoringRecord:
    project_id: str
    period: str
    stock_now_tco2e: float
    stock_prior_tco2e: float
    net_change_tco2e: float
    reversal_tco2e: float
    reversal_class: str | None
    leakage_tco2e: float
    leakage_method: str
    control_ids: tuple[str, ...]
    model_version: str
    issuance_model_version: str
    factor_set_version: str
    confirmed: bool


@task
def project_stock(boundary: gpd.GeoDataFrame, stock_raster: str, model_version: str) -> float:
    """Area-weighted stock over the project boundary, in an equal-area CRS."""
    import rioxarray

    if boundary.crs is None:
        raise ValueError("project boundary has no CRS; a monitored area must be unambiguous")
    boundary = boundary.to_crs(CANONICAL_CRS)

    stock = rioxarray.open_rasterio(stock_raster, chunks={"x": 1024, "y": 1024})
    stock = stock.rio.reproject(CANONICAL_CRS).rio.clip(boundary.geometry, boundary.crs)

    pixel_ha = abs(float(stock.rio.resolution()[0])) ** 2 / 10_000.0
    total = float(np.nansum(stock.values) * pixel_ha)

    log.info("permanence.stock.computed", total_tco2e=round(total, 1),
             model_version=model_version, crs=CANONICAL_CRS, pixel_ha=round(pixel_ha, 4))
    return total


@task
def leakage_did(
    belt_change: dict[str, float], control_change: dict[str, float], belt_area_ha: float
) -> tuple[float, str]:
    """Difference-in-differences leakage against the FROZEN matched-control set.

    Leakage is the excess loss in the belt over the matched controls across the
    same interval. A negative result is reported as zero: a project does not earn
    credit because its neighbours happened to deforest less than the controls.
    """
    belt_rate = belt_change["after"] - belt_change["before"]
    ctrl_rate = control_change["after"] - control_change["before"]
    excess = max(0.0, belt_rate - ctrl_rate)
    leakage = excess * belt_area_ha

    log.info("permanence.leakage.did", belt_rate=round(belt_rate, 4),
             control_rate=round(ctrl_rate, 4), excess=round(excess, 4),
             leakage_tco2e=round(leakage, 1))
    return leakage, "difference-in-differences/matched-controls/v1"


@task
def classify_loss(loss_tco2e: float, spectral: dict[str, float], parcel_aligned: bool,
                  seasons_declining: int) -> str | None:
    """Name the mechanism. The registry treats fire, harvest, and decline differently,
    and an unclassified loss cannot be settled against the right buffer category."""
    if loss_tco2e <= 0:
        return None
    if spectral.get("dnbr", 0.0) > 0.27:      # burn severity threshold
        return "fire"
    if parcel_aligned:
        return "harvest_or_clearing"
    if seasons_declining >= 3:
        return "drought_or_pest"
    return "unattributed"


@flow(name="permanence_monitoring")
def run_period(
    project_id: str,
    period: str,
    boundary_path: str,
    stock_raster_current: str,
    stock_raster_pinned: str,
    prior_stock_tco2e: float,
    model_version: str,
    issuance_model_version: str,
    factor_set_version: str,
    belt_change: dict[str, float],
    control_change: dict[str, float],
    control_ids: tuple[str, ...],
    belt_area_ha: float,
    spectral: dict[str, float],
    parcel_aligned: bool,
    seasons_declining: int,
    clear_observations: int,
) -> dict:
    boundary = gpd.read_file(boundary_path)

    # Drift guard: when the model has moved on, the comparable number is the one
    # produced by the model the credits were issued against. Compute both.
    current = project_stock(boundary, stock_raster_current, model_version)
    if model_version != issuance_model_version:
        pinned = project_stock(boundary, stock_raster_pinned, issuance_model_version)
        log.warning("permanence.model.drift", current_model=model_version,
                    issuance_model=issuance_model_version,
                    delta_tco2e=round(current - pinned, 1))
    else:
        pinned = current

    net_change = pinned - prior_stock_tco2e
    reversal = max(0.0, -net_change)
    reversal_class = classify_loss(reversal, spectral, parcel_aligned, seasons_declining)
    leakage, method = leakage_did(belt_change, control_change, belt_area_ha)

    confirmed = clear_observations >= CONFIRM_OBSERVATIONS
    if reversal >= REVERSAL_GATE_TCO2E and not confirmed:
        log.warning("permanence.reversal.provisional", project_id=project_id,
                    reversal_tco2e=round(reversal, 1), observations=clear_observations)

    record = MonitoringRecord(
        project_id=project_id, period=period,
        stock_now_tco2e=round(current, 1), stock_prior_tco2e=round(prior_stock_tco2e, 1),
        net_change_tco2e=round(net_change, 1), reversal_tco2e=round(reversal, 1),
        reversal_class=reversal_class, leakage_tco2e=round(leakage, 1),
        leakage_method=method, control_ids=control_ids, model_version=model_version,
        issuance_model_version=issuance_model_version,
        factor_set_version=factor_set_version, confirmed=confirmed,
    )
    log.info("permanence.period.complete", **{k: v for k, v in asdict(record).items()
                                              if k != "control_ids"})
    return asdict(record)
```

Three properties make this record auditable rather than merely correct. It computes the comparison on the **pinned issuance-era model** whenever the current model has moved, so a model upgrade can never masquerade as a physical change. It marks a large loss **provisional** until a second clear observation confirms it, which stops single-scene artefacts from triggering a buffer cancellation. And it carries the **control set identifiers and the leakage method string** into the output, so a verifier re-running the estimate five years later uses the same counterfactual rather than a fresh, conveniently chosen one.

## Validation, Debugging & Compliance Mapping

- **Reversal evidence → buffer-pool settlement.** Registry buffer mechanisms require a classified, quantified, and dated loss. The `reversal_class` field maps directly onto the categories registries distinguish, and the `confirmed` flag is the difference between a notification and an alert. Verra's AFOLU non-permanence risk framework and equivalent Gold Standard provisions both key their treatment to whether the loss was avoidable, which in practice means whether your evidence can separate fire from harvest.
- **Leakage estimate → net issuance.** The difference-in-differences estimator, the frozen control identifiers, and the belt definition together constitute the leakage evidence package. Under most methodologies the belt must be defined at validation and its width justified by the local displacement distance for the drivers in play. Report the estimator, not only the number: an auditor checks the method's assumptions, and an unstated method reads as an unstated assumption.
- **Permanence risk re-scoring → buffer contribution.** Risk ratings are re-scored each monitoring period from tenure, governance, fire, and market factors. Because the score sets the withheld fraction of future issuance, its inputs and their sources belong in the same lineage chain as the measurements, wired through [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/).
- **Cross-cutting → CSRD and ISO alignment.** Where credits are used against a corporate target, the reversal and leakage record becomes part of the disclosure trail examined under [mapping CSRD ESRS E1 disclosures to spatial MRV outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/). A reversal that changes a retired credit's standing is a restatement, and restatements have their own disclosure obligations.

The three geometries and what each one measures are worth fixing in the mind before any of that, because almost every leakage dispute is really a dispute about which polygon was playing which role.

<svg viewBox="0 -4 880 284" role="img" aria-labelledby="geo-t geo-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="geo-t">Project boundary, leakage belt, and matched control areas — three geometries with three jobs</title>
  <desc id="geo-d">A schematic map. In the centre, a solid project boundary polygon labelled treatment, where reversals are measured. Around it, a concentric ring labelled leakage belt, ten kilometres wide, where displaced activity is measured. Away to the right, three separate small polygons labelled matched controls, chosen at baseline on slope, accessibility, tenure, and historical change rate, which supply the counterfactual rate. An annotation panel states the estimator: leakage equals belt change minus control change, multiplied by belt area, floored at zero, and warns that using the belt as a control cancels the effect being measured.</desc>
  <g font-family="system-ui, sans-serif">
    <circle cx="200" cy="140" r="128" fill="currentColor" opacity="0.05"/>
    <circle cx="200" cy="140" r="128" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="7,4"/>
    <path d="M132 92 L268 84 L282 152 L226 206 L142 190 Z" fill="currentColor" opacity="0.14"/>
    <path d="M132 92 L268 84 L282 152 L226 206 L142 190 Z" fill="none" stroke="currentColor" stroke-width="2.2"/>
    <text x="204" y="138" text-anchor="middle" fill="currentColor" font-size="11.5" font-weight="700">Project</text>
    <text x="204" y="156" text-anchor="middle" fill="currentColor" font-size="9" opacity="0.8">reversals measured here</text>
    <text x="200" y="42" text-anchor="middle" fill="currentColor" font-size="10.5" font-weight="700">Leakage belt · 10 km</text>
    <text x="200" y="58" text-anchor="middle" fill="currentColor" font-size="9" opacity="0.75">displaced activity measured here</text>
    <path d="M452 74 L520 66 L534 116 L474 128 Z" fill="currentColor" opacity="0.1"/>
    <path d="M452 74 L520 66 L534 116 L474 128 Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="493" y="102" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700">C-01</text>
    <path d="M446 156 L516 150 L526 202 L458 208 Z" fill="currentColor" opacity="0.1"/>
    <path d="M446 156 L516 150 L526 202 L458 208 Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="486" y="184" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700">C-02</text>
    <path d="M552 134 L616 128 L624 178 L560 186 Z" fill="currentColor" opacity="0.1"/>
    <path d="M552 134 L616 128 L624 178 L560 186 Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="588" y="162" text-anchor="middle" fill="currentColor" font-size="9.5" font-weight="700">C-03</text>
    <text x="536" y="42" text-anchor="middle" fill="currentColor" font-size="10.5" font-weight="700">Matched controls</text>
    <text x="536" y="58" text-anchor="middle" fill="currentColor" font-size="9" opacity="0.75">frozen at validation · counterfactual rate</text>
    <text x="536" y="238" text-anchor="middle" fill="currentColor" font-size="9" opacity="0.75">matched on slope · road distance · tenure · prior change rate</text>
    <rect x="654" y="72" width="222" height="138" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="654" y="72" width="222" height="138" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="670" y="96" fill="currentColor" font-size="10.5" font-weight="700">Estimator</text>
    <text x="670" y="116" fill="currentColor" font-size="9.5" opacity="0.82">leakage = (belt Δ − control Δ)</text>
    <text x="670" y="132" fill="currentColor" font-size="9.5" opacity="0.82">× belt area, floored at 0</text>
    <text x="670" y="158" fill="#f3a712" font-size="10" font-weight="700">Never use the belt</text>
    <text x="670" y="174" fill="#f3a712" font-size="10" font-weight="700">as a control</text>
    <text x="670" y="192" fill="currentColor" font-size="9" opacity="0.78">it cancels the effect measured</text>
  </g>
</svg>

For debugging, the highest-yield check is to plot project, belt, and control trajectories on one axis for the full history. Real leakage shows the belt diverging from the controls after project start while the project itself diverges downward-in-loss. If belt and controls track each other and both diverge from the project, you are measuring a genuine avoided-loss effect with little displacement. If all three move together, the project's effect is not detectable at this scale and the honest report says so.

## Frequently Asked Questions

### How often should reversal monitoring actually run?

Run detection on every usable acquisition and report on the registry's schedule. Those are different clocks and conflating them is the mistake. Detection at acquisition cadence — every five days for Sentinel-2, faster where you fuse radar — means a fire is a provisional flag within a week. Reporting stays annual or per the methodology. The cost of continuous detection is small because the analysis is confined to one boundary; the cost of annual-only detection is that reversals surface after the affected vintage has been sold.

### Can I use the surrounding belt as my leakage control?

No — the belt is where leakage lands, so using it as a control subtracts the effect you are trying to measure. The belt is the *treatment* area for leakage; the controls are separate areas, matched at baseline on the drivers of change and far enough away that project activity does not reach them. Keep three distinct geometries: project, leakage belt, matched controls. Every credible spatial leakage estimator needs all three.

### What if a reversal is caused by something outside the project's control, like a wildfire?

Classification still matters, because registries treat unavoidable and avoidable reversals differently in how the buffer is replenished and whether future issuance is affected — but in most frameworks the tonnes are cancelled either way. The atmosphere does not distinguish. What the classification changes is the project's obligations going forward: an unavoidable loss typically draws on the pooled buffer, while a pattern of avoidable losses raises the risk rating and therefore the withheld fraction on every subsequent issuance.

### How do I stop a model upgrade from being reported as a reversal?

Structurally, not procedurally. Keep the issuance-era model runnable — pinned container image, pinned factor set, pinned thresholds — and make the monitoring flow compute the comparison on that pinned model whenever the current version differs, exactly as the flow above does. Report the current-model figure alongside it as supplementary information. A team that relies on remembering to check will eventually forget, and the resulting false reversal costs more than maintaining the pinned environment.

### Who runs the monitoring when the project developer has moved on?

This is a governance question with an engineering answer. Monitoring obligations outlive teams, funding rounds, and sometimes the developer itself, so the pipeline must be executable by someone who has never seen it. In practice that means three things: the whole monitoring stack pinned as a container image whose digest is recorded with the project, the frozen control set and boundaries stored in a durable repository independent of the developer's own infrastructure, and an annual replay test that re-runs a historical period and confirms the figure still reproduces. Projects that skip the replay test discover at year seven that a dependency has vanished from its index and the pinned environment no longer builds — which is the same as having no monitoring at all, discovered at the worst moment.

### Does leakage ever come out negative, and what should I do with it?

Yes, sampling noise and genuine positive spillover both produce negative estimates. Report the raw estimate with its confidence interval for transparency, but floor the deduction at zero: a project does not earn additional credits because its neighbours happened to clear less land than the matched controls in a given period. Most methodologies are explicit about this asymmetry, and applying it silently — without publishing the raw estimate — is what makes an auditor suspicious of the whole leakage analysis.

## Conclusion

Permanence monitoring is where a carbon project's engineering discipline is tested longest. The credits are already sold, the model is years old, and the only thing standing between a quiet reversal and a public failure is a scheduled job that still runs, still uses the frozen controls, and still compares against the model the credits were issued under. Build the three obligations — reversal, leakage, risk rating — as separate, individually reproducible outputs; classify every loss by mechanism; and pin the issuance-era model so a software upgrade can never be mistaken for a change in the forest. Continue with [detecting carbon reversals from satellite time series](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/detecting-carbon-reversals-from-satellite-time-series/) and [quantifying leakage with spatial control areas](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/quantifying-leakage-with-spatial-control-areas/).

## Related

- [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) — the parent section this monitoring layer belongs to.
- [Detecting Carbon Reversals from Satellite Time Series](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/detecting-carbon-reversals-from-satellite-time-series/) — the detection algorithm and its confirmation logic.
- [Quantifying Leakage with Spatial Control Areas](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/permanence-reversal-and-leakage-monitoring/quantifying-leakage-with-spatial-control-areas/) — matching, belts, and difference-in-differences in practice.
- [Forest Carbon Baseline & Additionality Modeling](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/forest-carbon-baseline-and-additionality-modeling/) — the baseline these monitoring runs are measured against.
- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — the alerting architecture reversal detection reuses.
