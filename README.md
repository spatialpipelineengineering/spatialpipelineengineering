<p align="center">
  <a href="https://www.spatialpipelineengineering.org">
    <img src="https://www.spatialpipelineengineering.org/og-image.png" alt="Spatial Pipeline Engineering — Climate & Carbon Accounting Spatial Pipelines (MRV Automation)" width="100%">
  </a>
</p>

<h1 align="center">Spatial Pipeline Engineering</h1>

<p align="center">
  <strong>Build, automate, and validate satellite-driven carbon accounting and<br>
  MRV (Measurement, Reporting, Verification) systems — from raw imagery to audit-ready inventories.</strong>
</p>

<p align="center">
  <a href="https://www.spatialpipelineengineering.org"><b>🌐 www.spatialpipelineengineering.org</b></a>
</p>

---

## What this is

**[Spatial Pipeline Engineering](https://www.spatialpipelineengineering.org)** is a practitioner-focused
technical library for the engineers who turn Earth observation into defensible carbon numbers. Modern
carbon accounting has moved out of spreadsheets and into distributed, spatially explicit data pipelines —
and treating that work as an afterthought is how an emissions inventory quietly becomes unreportable.

Every guide pairs production-ready Python with the compliance context behind it: deterministic geospatial
processing, rigorous uncertainty quantification, and cryptographically verifiable audit trails that stand
up to third-party verification. Examples favour real engineering over theory — `structlog` telemetry,
explicit coordinate-reference-system declarations, distortion and validation gates, and root-cause
troubleshooting you can apply directly to a running pipeline. External references are limited to primary
sources: the GHG Protocol, ISO 14064, CSRD ESRS E1, IPCC guidance, and the Verra and Gold Standard
methodologies.

The library spans **51 in-depth guides** across four connected areas of practice.

## What's inside

### 🧭 [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/)
The contracts every downstream component inherits — canonical schema design, deterministic
[coordinate-reference-system alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/),
[GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/),
[data lineage and provenance](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/),
registry integration, and the validation gates that decide whether a figure is reportable.

### 🛰️ [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/)
Turning Sentinel and Landsat archives into activity data —
[cloud masking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/),
[temporal aggregation](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/),
[distributed tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/),
cloud-optimized formats, change detection, and real-time deforestation alerts.

### 🌳 [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/)
Estimating how much carbon a landscape stores and proving it —
[LiDAR/SAR biomass fusion](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/),
[emission-factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/),
[ground-truth alignment](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/),
baseline threshold tuning, and forest-carbon baseline and additionality modeling.

### ⚙️ [Pipeline Orchestration & Compliance Reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/)
Running and governing the whole system —
[orchestrating MRV pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/)
with Airflow, Prefect, and Dagster, the
[canonical data-schema reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-data-schema-reference/),
and the
[registry standards and methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/)
that outputs must satisfy, including tooling decision guides and CSRD ESRS E1 mapping.

## Who it's for

ESG and climate data engineers, sustainability tech teams, and Python GIS developers who need to ship
carbon and emissions pipelines that are **reproducible, auditable, and compliant** — not just plausible.

## How it's built

A fast, offline-capable static site: hand-authored, theme-aware inline SVG diagrams, structured data on
every page, and a strict quality bar (accessibility, performance, link integrity, and structured-data
validity are all gated before release). No trackers, no third-party scripts.

## Explore

**→ [www.spatialpipelineengineering.org](https://www.spatialpipelineengineering.org)**

Start with the area that matches your problem, or read a section overview end-to-end — every page links
to its neighbours, so you are never more than a click or two from the context you need.
