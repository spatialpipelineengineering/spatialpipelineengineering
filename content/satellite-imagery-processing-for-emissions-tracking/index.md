# Satellite Imagery Processing for Emissions Tracking

Satellite imagery processing for emissions tracking is the computational backbone that turns raw Earth observation archives into defensible, spatially explicit greenhouse gas inventories. As regulatory frameworks and voluntary carbon markets move away from static, spreadsheet-driven accounting toward continuous Measurement, Reporting, and Verification (MRV), engineering teams must operate deterministic, cloud-native geospatial pipelines that reconcile petabyte-scale optical and radar archives with strict compliance boundaries. This domain sits inside the broader [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack: where that foundation defines the canonical schemas, scoping rules, and provenance contracts, this section specializes them for the remote-sensing tier — the place where activity data is actually measured rather than reported.

The discipline is not "remote sensing with extra steps." It is a software engineering problem in which every transformation must propagate measurement uncertainty, preserve immutable lineage, and survive third-party audit. A production pipeline here ingests through orchestration patterns like [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/), cleans observations using [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/), and emits activity metrics that feed land-based accounting and [spatial modeling for carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/). The remainder of this guide walks the full path — architecture, spatial normalization, compliance mapping, lineage, and production validation — at the engineering depth auditors and verification bodies now demand.

<svg viewBox="0 0 986 210" role="img" aria-labelledby="pipe-t pipe-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="pipe-t">Satellite imagery emissions-tracking pipeline</title>
  <desc id="pipe-d">A seven-stage linear pipeline: a STAC catalogue of Sentinel-2, Landsat and SAR feeds preprocessing (cloud masking and atmospheric correction), then equal-area CRS alignment and resampling, probabilistic change detection, temporal aggregation to reporting periods, emission-factor mapping by spatial join to IPCC tiers, and finally a compliance and uncertainty stage that emits a 95 percent confidence interval with cryptographic lineage into the certified zone.</desc>
  <defs>
    <marker id="pipe-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.85">
    <rect x="20" y="48" width="118" height="116" rx="9"/>
    <rect x="158" y="48" width="118" height="116" rx="9"/>
    <rect x="296" y="48" width="118" height="116" rx="9"/>
    <rect x="434" y="48" width="118" height="116" rx="9"/>
    <rect x="572" y="48" width="118" height="116" rx="9"/>
    <rect x="710" y="48" width="118" height="116" rx="9"/>
  </g>
  <rect x="848" y="48" width="118" height="116" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
  <g stroke="currentColor" stroke-width="1.5" marker-end="url(#pipe-arrow)" opacity="0.9">
    <line x1="140" y1="106" x2="156" y2="106"/>
    <line x1="278" y1="106" x2="294" y2="106"/>
    <line x1="416" y1="106" x2="432" y2="106"/>
    <line x1="554" y1="106" x2="570" y2="106"/>
    <line x1="692" y1="106" x2="708" y2="106"/>
    <line x1="830" y1="106" x2="846" y2="106"/>
  </g>
  <g fill="currentColor" font-family="system-ui, sans-serif" text-anchor="middle">
    <g font-size="11.5" font-weight="600">
      <text x="79" y="78">STAC catalog</text>
      <text x="217" y="78">Preprocess</text>
      <text x="355" y="78">CRS alignment</text>
      <text x="493" y="78">Change detect</text>
      <text x="631" y="78">Temporal aggr.</text>
      <text x="769" y="78">Emission factors</text>
      <text x="907" y="78">Compliance + UQ</text>
    </g>
    <g font-size="10" opacity="0.8">
      <text x="79" y="100">Sentinel-2</text><text x="79" y="115">Landsat · SAR</text>
      <text x="217" y="100">cloud mask ·</text><text x="217" y="115">atmos. corr.</text>
      <text x="355" y="100">equal-area grid</text><text x="355" y="115">· resampling</text>
      <text x="493" y="100">spectral indices</text><text x="493" y="115">· prob. masks</text>
      <text x="631" y="100">align to</text><text x="631" y="115">reporting periods</text>
      <text x="769" y="100">spatial join ·</text><text x="769" y="115">IPCC tiers</text>
      <text x="907" y="100">95% CI ·</text><text x="907" y="115">crypto lineage</text>
    </g>
  </g>
  <g font-family="system-ui, sans-serif" fill="currentColor" font-size="9.5" opacity="0.6" text-anchor="middle">
    <text x="79" y="145">raw zone</text>
    <text x="355" y="145">curated zone (ARD)</text>
    <text x="907" y="145" fill="currentColor" opacity="0.85" font-weight="600">certified zone</text>
  </g>
  <text x="493" y="192" font-family="system-ui, sans-serif" fill="currentColor" font-size="11" opacity="0.75" text-anchor="middle">Each stage stamps immutable lineage and quality metadata before one-directional promotion downstream.</text>
</svg>

## Core Pipeline Architecture

Legacy desktop GIS workflows cannot scale to the temporal cadence and spatial resolution demanded by contemporary carbon accounting. A single tropical jurisdiction monitored at Sentinel-2 resolution (10 m, 5-day revisit) generates tens of terabytes of new observations per reporting period; a continental program multiplies that by one to two orders of magnitude. Production-grade pipelines therefore decompose into event-driven, tile-based microservices with explicit boundaries between ingestion, preprocessing, analysis, aggregation, and verification. Each boundary is a contract: a typed, versioned interface that allows independent scaling, independent deployment, and — critically for audit — an independent point at which lineage and quality metadata are stamped onto the data.

The ingestion layer is built around the SpatioTemporal Asset Catalog (STAC) specification. Rather than copying imagery, the pipeline indexes Cloud-Optimized GeoTIFFs (COGs) in object storage and queries them by spatial footprint, acquisition datetime, cloud cover, and processing baseline. STAC's item/collection model gives lazy, range-request access so workers read only the byte ranges of the tiles and bands they need. This is what makes continental processing economically viable: the orchestrator partitions a region of interest into a fixed tile grid, fans out one task per tile-timestep, and never materializes the full archive on local disk. The `pystac-client` and `stackstac` libraries are the typical entry points, producing a labelled `xarray` datacube (dimensions: `time`, `band`, `y`, `x`) that downstream stages treat as the single source of truth.

The compute tier must be designed for idempotent, restartable execution. Because Earth observation jobs run for hours and touch failure-prone external services (catalog APIs, cloud object stores, rate-limited token endpoints), every task carries a deterministic identity derived from its inputs — tile ID, time window, processing graph hash — so that a retried task produces a byte-identical output and a checkpoint can be safely resumed. This is where [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) earns its place: partitioning raster workloads into memory-safe chunks, distributing them across worker nodes, applying backpressure when the scheduler saturates, and materializing results without intermediate disk thrash. Orchestration frameworks (Airflow, Prefect, or Dagster) sit above the compute tier, expressing the directed acyclic graph of stages, managing retry and timeout policy, and triggering historical backfills when an emission factor revision or a reprocessed satellite baseline invalidates a prior run.

Separation of storage tiers mirrors the separation of compute. A raw landing zone holds immutable source COGs and their STAC metadata exactly as received. A curated zone holds analysis-ready data (ARD): cloud-masked, atmospherically corrected, grid-aligned composites. A certified zone holds only outputs that have passed every validation gate and carry a complete provenance record. Promotion between zones is one-directional and gated — no process writes upstream — which is the architectural precondition for the append-only lineage discussed later. This staged design also lets the same codebase serve two cadences: batch processing for annual or quarterly inventories, and near-real-time streaming for operational dashboards and early-warning alerts, without forking the transformation logic.

## Spatial Alignment & Data Normalization

Spatial misalignment is the single largest source of *systematic* error in carbon accounting pipelines, and unlike random sensor noise it does not average out across pixels — it biases every area-weighted calculation in the same direction. Satellite imagery processing for emissions tracking therefore treats coordinate handling as a correctness requirement, not a convenience. The normalization stage enforces strict [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) across every input — optical imagery, synthetic aperture radar (SAR), digital elevation models, administrative and concession boundaries, and registry-defined project polygons — resolving them into a single area-preserving target before any spatial join, zonal statistic, or temporal differencing runs.

Projection choice is dictated by the operation, not by convention. Conformal projections such as Web Mercator (EPSG:3857) or raw UTM preserve angles but distort area severely away from their standard parallels, which is disqualifying for tonnage calculations. Carbon pipelines standardize on an equal-area projection appropriate to the region — EPSG:6933 (global cylindrical equal-area), a continental Albers Equal-Area, or a documented local equivalent — so that a hectare measured at the equator and a hectare measured at 60° latitude contribute identical area to the emission factor multiplication. All transformations are executed with explicit `always_xy=True` axis ordering through the PROJ library, and every reprojection is logged as an immutable lineage attribute: source authority code, target authority code, transformation pipeline, and the area-distortion check that gated it.

Resampling strategy must follow data semantics, because choosing the wrong kernel silently corrupts the activity data:

- **Nearest-neighbor** for categorical rasters — land cover classes, change masks, quality flags — where interpolation would invent classes that never existed.
- **Bilinear or cubic convolution** for continuous biophysical variables such as surface reflectance, NDVI, biomass proxies, or backscatter, where smooth interpolation is physically meaningful.
- **Area-weighted (majority or average) resampling** when downsampling to a coarser reporting grid, so that aggregated values conserve the integral of the source.

Grid alignment is then pinned to a fixed tiling schema — for example a 10 m or 100 m grid snapped to STAC grid definitions — guaranteeing pixel-perfect co-registration across multi-sensor stacks and across time. Without this, a one-pixel offset between two epochs manifests as spurious change along every boundary in the scene, inflating deforestation alerts and corrupting baselines. Co-registration is verified, not assumed: the pipeline computes sub-pixel offset between successive acquisitions and rejects or reregisters tiles that exceed a tolerance (commonly 0.5 px).

Topology validation closes the loop on the vector side. Jurisdictional polygons, concession boundaries, and ecological zones are validated for ring closure, self-intersection, and sliver artifacts (using GEOS-backed `ST_IsValid` / `make_valid` semantics) before they are rasterized into masks. Self-intersections and overlapping geometries are resolved through planar-graph cleaning so that two project boundaries cannot both claim the same pixel — a double-counting failure that registries treat as a material defect. These rules belong to the same harmonization discipline that the [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) reference page covers in depth, applied here at the moment imagery and boundaries first meet.

### Preprocessing and multi-sensor quality gates

Before alignment can mean anything, raw observations need radiometric and atmospheric correction. Top-of-atmosphere radiance is converted to surface reflectance, and cloud, cloud-shadow, cirrus, and snow are masked so that only valid observations enter the analytical datacube. Persistent cloud cover in tropical and high-latitude regions makes optical-only monitoring unreliable, which is why production pipelines fuse SAR backscatter (Sentinel-1) with optical time series. Fusion is non-trivial: differing spatial resolutions, incidence angles, and scattering mechanisms must be harmonized, speckle must be filtered, and geometric offsets between sensors must be measured. Every cross-sensor calibration coefficient and every fusion residual is logged and propagated into the uncertainty budget rather than discarded. The mechanics of the optical side are detailed in [Sentinel-2 and Landsat cloud masking workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/), which the normalization stage invokes as a gated step — a tile with a cloud-rejection rate above its threshold is held back rather than passed downstream with fabricated values.

## Compliance Mapping & Regulatory Framework

Activity data only becomes a carbon figure when it is joined to the right standard, at the right boundary, with the right spatial attribution. Compliance mapping is therefore a first-class pipeline stage, not a reporting afterthought. The dominant frameworks each impose distinct, machine-checkable constraints. The GHG Protocol Corporate Standard fixes organizational and operational boundaries and the Scope 1/2/3 taxonomy; the [GHG Protocol corporate standard](https://ghgprotocol.org/corporate-standard) and its land-sector guidance dictate how land-use change must be attributed. ISO 14064-2 and 14064-3 mandate explicit uncertainty reporting and independent verification readiness. The EU Corporate Sustainability Reporting Directive (CSRD), through ESRS E1, requires double-materiality assessment and granular spatial disclosure of land-related emissions. Voluntary methodologies — Verra's VM-series and Gold Standard — add minimum mapping units, baseline and monitoring period definitions, and additionality tests.

<svg viewBox="0 0 700 512" role="img" aria-labelledby="gate-t gate-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="gate-t">Compliance gating decision tree for a detected land-cover change</title>
  <desc id="gate-d">A detected land-cover change passes down a spine of policy-as-code gates. The GHG Protocol boundary check halts out-of-scope change; the minimum mapping unit gate (Verra VM0007 or VM0015) discards sub-threshold patches; the IPCC tier gate selects an emission factor, falling back from national to Tier 2 to Tier 1 when no local factor exists; the CSRD ESRS E1 gate flags material change for disclosure. Only change clearing every gate is promoted to the certified zone.</desc>
  <defs>
    <marker id="gate-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- input -->
    <rect x="125" y="14" width="250" height="48" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="250" y="34" fill="currentColor" font-size="11.5" font-weight="600">Detected land-cover change</text>
    <text x="250" y="50" fill="currentColor" font-size="10" opacity="0.8">&#916; pixels, epoch t &#8594; t+1</text>
    <!-- gates -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="125" y="92" width="250" height="58" rx="9"/>
      <rect x="125" y="176" width="250" height="58" rx="9"/>
      <rect x="125" y="260" width="250" height="58" rx="9"/>
      <rect x="125" y="344" width="250" height="58" rx="9"/>
    </g>
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="250" y="116">GHG Protocol</text>
      <text x="250" y="200">Min. mapping unit</text>
      <text x="250" y="284">IPCC tier / factor</text>
      <text x="250" y="368">CSRD ESRS E1</text>
    </g>
    <g fill="currentColor" font-size="10" opacity="0.8">
      <text x="250" y="133">boundary in scope?</text>
      <text x="250" y="217">area &#8805; MMU threshold?</text>
      <text x="250" y="301">local factor available?</text>
      <text x="250" y="385">materiality met?</text>
    </g>
    <!-- pass spine arrows -->
    <g stroke="currentColor" stroke-width="1.5" marker-end="url(#gate-arrow)">
      <line x1="250" y1="62" x2="250" y2="90"/>
      <line x1="250" y1="150" x2="250" y2="174"/>
      <line x1="250" y1="234" x2="250" y2="258"/>
      <line x1="250" y1="318" x2="250" y2="342"/>
      <line x1="250" y1="402" x2="250" y2="436"/>
    </g>
    <g fill="currentColor" font-size="9" opacity="0.65" text-anchor="start">
      <text x="256" y="167">pass</text>
      <text x="256" y="251">pass</text>
      <text x="256" y="335">assigned</text>
      <text x="256" y="425">flagged</text>
    </g>
    <!-- branch arrows to outcomes -->
    <g stroke="#c9820a" stroke-width="1.5" marker-end="url(#gate-arrow)">
      <line x1="375" y1="121" x2="473" y2="121"/>
      <line x1="375" y1="205" x2="473" y2="205"/>
      <line x1="375" y1="289" x2="473" y2="289"/>
      <line x1="375" y1="373" x2="473" y2="373"/>
    </g>
    <g fill="currentColor" font-size="9" font-weight="600" opacity="0.85">
      <text x="424" y="114">fail</text>
      <text x="424" y="198">fail</text>
      <text x="424" y="282">no local</text>
      <text x="424" y="366">material</text>
    </g>
    <!-- outcome boxes -->
    <g fill="none" stroke="#f3a712" stroke-width="2">
      <rect x="475" y="100" width="210" height="42" rx="8"/>
      <rect x="475" y="184" width="210" height="42" rx="8"/>
      <rect x="475" y="268" width="210" height="42" rx="8"/>
      <rect x="475" y="352" width="210" height="42" rx="8"/>
    </g>
    <g fill="currentColor" font-size="10">
      <text x="580" y="118" font-weight="600">HALT &#183; out of scope</text>
      <text x="580" y="133" opacity="0.8">exception report</text>
      <text x="580" y="202" font-weight="600">HALT &#183; sub-MMU</text>
      <text x="580" y="217" opacity="0.8">discard (VM0007 / VM0015)</text>
      <text x="580" y="286" font-weight="600">Fallback chain</text>
      <text x="580" y="301" opacity="0.8">national &#8594; Tier 2 &#8594; Tier 1</text>
      <text x="580" y="370" font-weight="600">Flag for disclosure</text>
      <text x="580" y="385" opacity="0.8">ESRS E1 land emissions</text>
    </g>
    <!-- certified pass -->
    <rect x="115" y="438" width="270" height="56" rx="10" fill="none" stroke="#0f6e63" stroke-width="2.5"/>
    <text x="250" y="462" fill="#0d5a47" font-size="12" font-weight="700">Promote to certified zone</text>
    <text x="250" y="480" fill="currentColor" font-size="10" opacity="0.8">attributed factor + 95% CI + lineage</text>
  </g>
</svg>

The engineering pattern that makes these frameworks operable is policy-as-code. Each rule is expressed as an executable validation test that gates pipeline progression rather than as prose in a methodology PDF. Minimum mapping units become a connected-component area filter; temporal baselines become a date-window assertion on the input STAC items; exclusion zones (protected areas, prior-claimed project boundaries) become spatial-difference masks; spatial-resolution and revisit-frequency requirements become assertions on the datacube's `x`/`y` step and `time` spacing. A failed assertion halts execution and emits a structured exception report for auditor review — non-compliant data is never allowed to propagate to the certified zone. This mirrors the scoping discipline established for supply-chain emissions in [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/), extended to the land-use change boundaries that satellite monitoring measures directly.

Emission factor mapping is the join where activity metrics — hectares converted, biomass-loss proxies, methane plume concentrations — meet region-specific coefficients. This join must be deterministic and fully attributed: a versioned factor database, an explicit fallback hierarchy when a local factor is missing (national inventory → IPCC Tier 2 → IPCC Tier 1), and a recorded provenance string for every coefficient applied. The factor database itself is version-pinned per run, so that reprocessing a historical period uses the factors that were authoritative at the time, and a later factor revision triggers an auditable, intentional backfill rather than a silent change. Where outputs eventually flow into issued credits, the mapping must reconcile against [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) to prevent double issuance and to tie claims back to a spatial baseline.

## Audit Trails, Lineage & Provenance

Verification bodies do not accept a final tonnage; they require the ability to reconstruct exactly how it was produced. Satellite pipelines therefore generate provenance as a byproduct of every transformation, satisfying the same [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) contract that governs the rest of the stack. Concretely, each stage emits a signed artifact record containing: the cryptographic hash (SHA-256 or stronger) of every input, the content hash of the code and processing-graph version, the full set of configuration parameters and random seeds, the CRS and resampling decisions applied, and the hash of the produced output. These records form a directed lineage graph in which any certified figure can be traced back, edge by edge, to the specific COGs and factors that produced it.

The lineage store is append-only and tamper-evident. Practical implementations use a versioned table format (Delta Lake or Apache Iceberg with time travel), an object-storage bucket under write-once-read-many (WORM) retention, or a hash-chained ledger where each record commits to its predecessor. The store is exposed through a queryable lineage API so an auditor can ask "show every transformation and input behind this 2025 sub-national deforestation total" and receive a complete, navigable answer without pipeline operators reconstructing it by hand. Because storage promotion is one-directional, the lineage graph is monotonic — records are only ever added — which is what allows verification to be repeated months later and yield the identical result.

Reproducibility is the hard guarantee that lineage rests on. Identical inputs must yield byte-identical outputs across machines and across time, which requires containerized execution environments, fully pinned dependency manifests (including the PROJ and GDAL versions, since transformation grids change between releases), deterministic random seeds for any stochastic step, and elimination of nondeterministic parallelism in reductions. Uncertainty quantification is carried alongside the point estimate at every step: variance from sensor noise, classification confidence, CRS distortion, and emission-factor ranges is propagated either analytically or by Monte Carlo simulation, and the final estimate reports a 95% confidence interval rather than a bare number. An emission figure without its uncertainty band is, under ISO 14064-3, incomplete.

## Production Deployment & Validation Patterns

Running this at scale is an operations problem as much as a science problem, and the pipeline is treated as mission-critical infrastructure rather than an analytical prototype. The full deployment is described as infrastructure-as-code — compute clusters, object-storage buckets and lifecycle rules, IAM boundaries, and orchestration DAGs — so that environments are reproducible and changes are reviewed. CI/CD validates spatial logic against synthetic fixtures (hand-built scenes with known answers), runs topology and CRS checks, and enforces schema compliance on the canonical Parquet/COG interfaces before any change merges. A change that would shift a historical result fails the regression suite, forcing an explicit, documented decision rather than a silent drift.

The orchestration layer (Airflow, Prefect, or Dagster) manages DAG dependencies, retry and timeout policy, and historical backfills. Backfill is a routine event here: a reprocessed satellite baseline, a corrected cloud-mask model, or a revised emission factor invalidates a date range, and the orchestrator replays exactly the affected tiles and periods, writing new certified outputs with new lineage rather than mutating the old ones. The downstream stages that consume these activity metrics — including [temporal aggregation for land-use change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/), which aligns detected change to reporting periods, and [deforestation alert generation pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/), which balance sensitivity against specificity to avoid over-reporting transient disturbance — are wired into the same orchestration graph so that a backfill propagates coherently end to end.

Observability is engineered to surface *spatial* integrity, not just generic system health. Dashboards expose CRS-alignment scores, sub-pixel co-registration offsets, cloud-rejection rates per tile, edge-artifact frequency, classification drift against a stable reference, and cost-per-hectare. Structured telemetry (JSON logs with a `structlog`-style processor chain, plus OpenTelemetry traces) tags every record with tile ID, time window, and processing-graph hash, so a latency spike or a quality regression is attributable to a specific stage and input rather than a black box. Automated alerts fire when uncertainty bounds exceed a regulatory threshold, when a temporal gap would violate a required revisit frequency, or when co-registration tolerance is breached. Output serialization is standardized for downstream interoperability: certified results are written as cloud-native rasters and tabular Parquet, with regulatory submissions emitted in the formats the receiving body expects (ISO 14064-compliant JSON-LD, or XBRL for CSRD). The result is continuous, auditable emissions accounting that a regulator, investor, or verification body can interrogate at any point in its history.

## Conclusion

Satellite imagery processing for emissions tracking succeeds or fails on defensibility. The same observation can support a credible inventory or an indefensible one depending entirely on whether the pipeline enforced equal-area CRS alignment, gated non-compliant data with policy-as-code, propagated uncertainty through every step, and recorded immutable lineage that an auditor can replay. Treating each of those as a non-negotiable engineering contract — rather than a best-effort post-processing step — is what separates a research notebook from a production MRV system. The deeper mechanics of each stage are developed in the connected guides below, and all of them inherit their schema, scoping, and provenance contracts from the [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) foundation.

## Related

- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — memory-safe, idempotent distributed ingestion for continental-scale tile grids.
- [Sentinel-2 & Landsat Cloud Masking Workflows](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/sentinel-2-landsat-cloud-masking-workflows/) — atmospheric correction and cloud/shadow gating that protect activity data quality.
- [Deforestation Alert Generation Pipelines](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) — probabilistic change detection tuned for sensitivity versus specificity.
- [Temporal Aggregation for Land-Use Change](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/temporal-aggregation-for-land-use-change/) — aligning detected change to mandated reporting periods.
- [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) — the parent stack defining canonical schemas, scoping, and provenance contracts.
- [Spatial Modeling for Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) — converting activity data into validated stock and flux estimates.
