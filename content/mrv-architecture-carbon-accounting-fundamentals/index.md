# MRV Architecture & Carbon Accounting Fundamentals

Modern measurement, reporting, and verification (MRV) systems for greenhouse gas accounting have transitioned from static spreadsheet exercises into distributed, spatially explicit data pipelines. At enterprise scale, carbon accounting demands deterministic geospatial processing, rigorous uncertainty quantification, and cryptographically verifiable audit trails. The foundational architecture covered here bridges climate science, regulatory compliance, and modern software engineering to produce defensible emissions inventories — the same discipline that drives the [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) workflows that feed activity data into the system and the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) methods that turn that data into auditable tonnage. This section establishes the contracts every downstream component inherits: schema, coordinate handling, scoping rules, lineage, and the validation gates that decide whether a figure is reportable.

An MRV platform is not a single model; it is an accounting engine wrapped around a geospatial substrate. Activity data arrives from incompatible sources, in incompatible projections, at incompatible cadences, and must be reduced to a single number — tonnes of CO₂-equivalent — that an external auditor will attempt to break. Everything in this architecture exists to make that number reproducible: given the same inputs and the same factor versions, the pipeline must emit byte-identical results, with a recorded path explaining how each input contributed. The sections below walk the five deterministic stages, then drill into the four cross-cutting concerns — spatial alignment, compliance scoping, provenance, and production deployment — that separate a credible inventory from a rejected one.

<svg viewBox="-4 68 894 238" role="img" aria-label="Five-stage deterministic MRV pipeline. Heterogeneous source data feeds ingestion, spatial normalization, emission-factor application, and aggregation, then reaches the verification gates, which route passing records to the certified reporting dataset and flagged records to human auditor review." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:880px;display:block;margin:1.5rem auto;">
  <title>The five-stage MRV pipeline from heterogeneous inputs to certified tonnage</title>
  <desc>A source card feeds five sequential stage cards: 1 Ingestion (canonical Parquet schema), 2 Spatial normalization (unified topology and CRS), 3 Factor application (versioned factor database), 4 Aggregation (organizational-boundary consolidation), and 5 Verification gates (QA/QC and mass balance). The verification gate branches: passing records flow to the certified reporting dataset, flagged records flow to human auditor review.</desc>
  <defs>
    <marker id="mrv-pipe-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <!-- SOURCE -->
  <rect x="12" y="84" width="130" height="104" rx="9" fill="currentColor" opacity="0.06"/>
  <rect x="12" y="84" width="130" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3" opacity="0.6"/>
  <text x="77" y="104" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">SOURCE</text>
  <text x="77" y="126" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Heterogeneous</text>
  <text x="77" y="141" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">inputs</text>
  <text x="77" y="162" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">satellite · IoT</text>
  <text x="77" y="175" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">utility · supply chain</text>
  <!-- STAGE 1 -->
  <rect x="154" y="84" width="130" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.75"/>
  <text x="219" y="104" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">STAGE 1</text>
  <text x="219" y="126" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Ingestion</text>
  <text x="219" y="162" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">canonical</text>
  <text x="219" y="175" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">Parquet schema</text>
  <!-- STAGE 2 -->
  <rect x="296" y="84" width="130" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.75"/>
  <text x="361" y="104" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">STAGE 2</text>
  <text x="361" y="126" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Spatial</text>
  <text x="361" y="141" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">normalization</text>
  <text x="361" y="168" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">unified topology · CRS</text>
  <!-- STAGE 3 -->
  <rect x="438" y="84" width="130" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.75"/>
  <text x="503" y="104" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">STAGE 3</text>
  <text x="503" y="126" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Factor</text>
  <text x="503" y="141" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">application</text>
  <text x="503" y="168" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">versioned factor DB</text>
  <!-- STAGE 4 -->
  <rect x="580" y="84" width="130" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.75"/>
  <text x="645" y="104" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.55">STAGE 4</text>
  <text x="645" y="126" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Aggregation</text>
  <text x="645" y="162" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">org-boundary</text>
  <text x="645" y="175" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.7">consolidation</text>
  <!-- STAGE 5 — verification gate -->
  <rect x="722" y="84" width="130" height="104" rx="9" fill="currentColor" opacity="0.1"/>
  <rect x="722" y="84" width="130" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <text x="787" y="104" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" opacity="0.6">STAGE 5</text>
  <text x="787" y="126" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Verification</text>
  <text x="787" y="141" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">gates</text>
  <text x="787" y="162" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">QA/QC · mass</text>
  <text x="787" y="175" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.75">balance</text>
  <!-- inter-stage arrows -->
  <line x1="143" y1="136" x2="153" y2="136" stroke="currentColor" stroke-width="1.5" marker-end="url(#mrv-pipe-arrow)"/>
  <line x1="285" y1="136" x2="295" y2="136" stroke="currentColor" stroke-width="1.5" marker-end="url(#mrv-pipe-arrow)"/>
  <line x1="427" y1="136" x2="437" y2="136" stroke="currentColor" stroke-width="1.5" marker-end="url(#mrv-pipe-arrow)"/>
  <line x1="569" y1="136" x2="579" y2="136" stroke="currentColor" stroke-width="1.5" marker-end="url(#mrv-pipe-arrow)"/>
  <line x1="711" y1="136" x2="721" y2="136" stroke="currentColor" stroke-width="1.5" marker-end="url(#mrv-pipe-arrow)"/>
  <!-- outputs -->
  <rect x="540" y="212" width="300" height="34" rx="7" fill="currentColor" opacity="0.06"/>
  <rect x="540" y="212" width="300" height="34" rx="7" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.7"/>
  <text x="690" y="233" text-anchor="middle" font-size="11" font-weight="600" fill="currentColor">Certified reporting dataset</text>
  <rect x="540" y="256" width="300" height="34" rx="7" fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="5,3" opacity="0.6"/>
  <text x="690" y="277" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.85">Human auditor review</text>
  <!-- branch arrows from gate -->
  <path d="M787 188 L787 200 L760 200 L760 211" fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#mrv-pipe-arrow)"/>
  <path d="M787 188 L787 200 L862 200 L862 235 L843 235" fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#mrv-pipe-arrow)"/>
  <text x="744" y="208" text-anchor="end" font-size="9" font-weight="600" fill="currentColor" opacity="0.75">pass</text>
  <text x="874" y="200" text-anchor="end" font-size="9" font-weight="600" fill="currentColor" opacity="0.75">flagged</text>
</svg>

## Core Pipeline Architecture

A production-grade MRV pipeline operates across five deterministic stages: ingestion, spatial normalization, emission factor application, aggregation, and verification. Each stage should be engineered as a stateless, containerized service instrumented with structured JSON logging and OpenTelemetry distributed tracing, so that any single record can be traced from raw byte to certified tonne. The boundaries between stages are not cosmetic — they are the seams along which the system is tested, replayed, and audited. A record that fails at stage four must be re-runnable from the stage-three output without re-ingesting raw telemetry, which means every stage commits an immutable, addressable artifact before the next stage reads it.

The **ingestion layer** accepts heterogeneous inputs — satellite telemetry (Sentinel-2, Landsat 9, and increasingly Sentinel-1 SAR), IoT sensor streams, facility-level utility meters, and supply chain disclosures — and normalizes them into a canonical Parquet schema with strict type enforcement. Strictness here is deliberate: ingestion is the only place where the pipeline tolerates messy reality, and it must fail loudly rather than coerce silently. A utility invoice that arrives in kilowatt-hours when the schema expects megajoules should be rejected at the door with a typed error, not rescaled by an implicit guess three stages later. The canonical schema pins units, value ranges, temporal granularity, a source identifier, and a CRS field for anything carrying geometry, and ingestion records the source checksum so the same file is never double-counted.

The **spatial normalization** stage resolves geometries to a unified topology, ensuring land-use boundaries, facility footprints, and jurisdictional polygons align without slivers, self-intersections, or invalid rings. This stage is critical for preventing geometric corruption that propagates through area-weighted emission calculations. It is also where the pipeline commits to a single, area-preserving target projection, because every tonne derived from an area — deforestation extent, restored wetland, irrigated cropland — inherits the distortion of whatever projection produced it. Normalization is treated as a hard gate rather than a transform: geometries that cannot be made valid are quarantined, not nudged into the calculation layer.

**Emission factor application** serves as the computational core. It requires a version-controlled factor database that maps normalized activity data to standardized coefficients — IPCC Tier 1–3 defaults, EPA eGRID subregion factors, DEFRA conversion factors, or time-resolved regional grid intensities. The non-negotiable property here is reproducibility: a factor is never read "as of now." Every multiplication binds an explicit factor version and an effective date, so that re-running the 2024 inventory in 2026 yields the 2024 numbers even though the factor table has since been revised. This makes the factor database an append-only, bitemporal store rather than a mutable lookup, and it is the single most common place where naive pipelines silently drift between an original submission and its later defense.

**Aggregation** rolls up emissions across organizational boundaries, applying equity-share or control-based consolidation rules per established corporate accounting standards. Consolidation is not a sum — it is a weighted reduction governed by ownership structure, and the same physical facility can contribute different tonnages to two different reporting entities depending on the consolidation approach each has declared. Aggregation must therefore carry the consolidation rule as data, validate that subsidiary boundaries tile the parent boundary without overlap or gap, and preserve the disaggregated breakdown so an auditor can re-derive any rolled-up figure.

Finally, **verification gates** enforce automated QA/QC checks — statistical outlier detection, mass-balance reconciliation, and temporal consistency validation — before routing flagged records to human auditors. The architecture must natively support both batch processing for annual inventories and near-real-time streaming for operational dashboards, maintaining strict separation between raw data lakes, curated feature stores, and certified reporting datasets. Only data that has cleared the gates is allowed to cross into the certified zone, and that crossing is itself a logged, signed event.

### Stage contracts and the canonical schema

The contract between stages is enforced by the canonical Parquet schema, which functions as the pipeline's lingua franca. Treating the schema as a versioned, independently published artifact — rather than an implicit convention baked into code — lets each stage validate its inputs against an external truth and lets auditors read the data dictionary without reading the implementation. A minimal record carries an `activity_id`, a typed `activity_value` with explicit `unit`, a `period_start`/`period_end` pair, a `geometry` column with a mandatory `crs` (always declared, never inferred), a `source_id`, and a `source_checksum`. Downstream, factor application appends `factor_id`, `factor_version`, and `co2e_tonnes`; aggregation appends `consolidation_rule` and `reporting_entity`. Because every column that influences the final number is named, versioned, and carried forward, the certified dataset is self-describing: it is its own audit trail.

## Spatial Alignment & Data Normalization

Geospatial precision is non-negotiable in carbon accounting. Misaligned coordinate systems introduce systematic bias into area-based calculations such as deforestation tracking, renewable energy siting, or agricultural methane flux estimation. Engineers must implement rigorous [Geospatial Coordinate Reference Systems (CRS) Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) during the normalization phase, leveraging authoritative transformation libraries like the [PROJ Coordinate Transformation Library](https://proj.org/) to ensure that metric-area calculations use equal-area projections — EPSG:6933 for global grids, or a local Albers/UTM zone where the project footprint justifies it. A tonne derived from an area measured in Web Mercator is not a defensible tonne; conformal projections preserve angles and distort area severely with latitude, and that distortion is the difference between an inventory that passes and one that an auditor rejects on methodology alone.

Topology validation rules should run as pre-commit gates on spatial datasets before they enter the emission calculation layer — PostGIS `ST_IsValid`, `ST_MakeValid`, and `ST_CoverageUnion`, or equivalent GEOS-based checks in the application layer. The practical failure mode is the sliver polygon: when two supposedly coincident boundaries (a cadastral parcel and a remotely sensed land-cover patch, say) differ by centimeters, their overlay produces thin spurious polygons that either inflate or erase area depending on how the overlay resolves them. At continental scale these slivers accumulate into material error, so normalization snaps geometries to a shared topology and rejects rings that cannot be made valid rather than silently repairing them into a different shape.

Long-running pipelines must also detect and correct silent datum shifts, reprojection artifacts, and precision loss from repeated coordinate transformations before those errors compound through iterative change-detection cycles. Each reprojection of an already-reprojected geometry bleeds floating-point precision; over many monitoring epochs this drift produces phantom change — a deforestation alert where no trees were lost, or a sequestration credit for land that never changed. The discipline is single-pass transformation from the original source CRS to the canonical target, with the source CRS retained as immutable lineage so the transform can always be re-derived rather than re-applied. This same equal-area, single-pass rigor governs the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stage, where biomass densities are multiplied by area and any latent distortion is laundered straight into the credited tonnage.

<svg viewBox="0 0 720 320" role="img" aria-label="Side-by-side comparison of the same forest polygon under an equal-area projection and under Web Mercator. The equal-area panel preserves true area at every latitude; the Web Mercator panel inflates area with latitude. A lower chart shows the area-scale error by latitude band: about zero percent at the equator, plus thirty-three percent near thirty degrees, and roughly plus three hundred percent near sixty degrees." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:720px;display:block;margin:1.5rem auto;">
  <title>Why a tonne measured in Web Mercator is not a defensible tonne</title>
  <desc>The left panel renders a forest polygon in EPSG:6933 equal-area, where measured area equals true area regardless of latitude. The right panel renders the identical polygon in Web Mercator (EPSG:3857), where the conformal projection stretches the polygon vertically and inflates its measured area as latitude increases. The bar chart at the bottom plots the resulting area-scale error by latitude band: roughly 0 percent at 0 degrees, about plus 33 percent at 30 degrees, and roughly plus 300 percent at 60 degrees — the bias that flows straight into area-weighted emission tonnage.</desc>
  <!-- LEFT panel: equal-area -->
  <rect x="8" y="8" width="340" height="190" rx="8" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.6"/>
  <text x="178" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">Equal-area · EPSG:6933</text>
  <text x="178" y="46" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.7">area preserved at every latitude</text>
  <!-- forest polygon (true shape) -->
  <path d="M70 110 L110 80 L165 75 L210 95 L235 130 L200 165 L140 170 L90 150 Z" fill="currentColor" opacity="0.16" stroke="currentColor" stroke-width="1.4"/>
  <text x="152" y="128" text-anchor="middle" font-size="10" font-weight="600" fill="currentColor">true area</text>
  <text x="262" y="120" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">A</text>
  <text x="178" y="186" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.65">bias = 0 % · reportable tonnage</text>
  <!-- RIGHT panel: Web Mercator -->
  <rect x="372" y="8" width="340" height="190" rx="8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3" opacity="0.55"/>
  <text x="542" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">Web Mercator · EPSG:3857</text>
  <text x="542" y="46" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.7">area inflates with latitude</text>
  <!-- same polygon, vertically stretched -->
  <path d="M434 118 L474 70 L529 62 L574 94 L599 150 L564 188 L504 192 L454 165 Z" fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4,2"/>
  <!-- ghost of true area for reference -->
  <path d="M464 118 L504 96 L559 91 L584 118 L568 150 L514 153 L484 142 Z" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"/>
  <text x="516" y="132" text-anchor="middle" font-size="10" font-weight="600" fill="currentColor">stretched area</text>
  <text x="626" y="120" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">A′ &gt; A</text>
  <text x="542" y="186" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.65">latent bias laundered into credited tonnage</text>
  <!-- area-scale error by latitude band -->
  <text x="20" y="232" text-anchor="start" font-size="10.5" font-weight="700" fill="currentColor">Web Mercator area-scale error by latitude band</text>
  <!-- baseline -->
  <line x1="120" y1="298" x2="700" y2="298" stroke="currentColor" stroke-width="1" opacity="0.5"/>
  <!-- 0 deg -->
  <rect x="150" y="296" width="120" height="2" fill="currentColor" opacity="0.55"/>
  <text x="210" y="290" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">+0 %</text>
  <text x="210" y="314" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.7">0° equator</text>
  <!-- 30 deg -->
  <rect x="330" y="276" width="120" height="22" fill="currentColor" opacity="0.3"/>
  <text x="390" y="270" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">+33 %</text>
  <text x="390" y="314" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.7">30° mid-lat</text>
  <!-- 60 deg -->
  <rect x="510" y="250" width="120" height="48" fill="currentColor" opacity="0.5"/>
  <text x="570" y="244" text-anchor="middle" font-size="9.5" font-weight="600" fill="currentColor">+300 %</text>
  <text x="570" y="314" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.7">60° high-lat</text>
</svg>

Raster inputs demand the same care as vectors. Resampling a land-cover raster during reprojection must preserve class semantics — nearest-neighbor for categorical land cover, never bilinear, which would invent fractional classes that map to no emission factor. Alignment of raster grids to the target CRS and a shared origin lets zonal statistics over project polygons be computed deterministically, so that the area of "forest converted to cropland" inside a registry boundary is the same number on every run. Normalization is the stage that earns the pipeline its determinism; everything downstream assumes it.

## Compliance Mapping & Regulatory Framework

Regulatory frameworks dictate how emissions are categorized, attributed, and reported, and the architecture must encode those rules as data rather than burying them in conditional logic. The GHG Protocol establishes Scope 1, Scope 2, and Scope 3 boundaries, but translating these into spatially explicit inventories requires granular mapping of supply chain nodes, transportation corridors, and land-use changes. When modeling upstream and downstream emissions, engineers implement [GHG Protocol Scope 3 Spatial Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) to resolve supplier locations, freight routes, and product lifecycle stages into georeferenced emission hotspots. This spatial attribution is what prevents double counting across reporting entities and enables hotspot prioritization for mitigation, because a Scope 3 figure that cannot be tied to a place cannot be reconciled against the Scope 1 figure of the supplier who actually emitted it.

Compliance mapping extends well beyond the GHG Protocol. [ISO 14064-1:2018](https://www.iso.org/standard/66453.html) governs organization-level quantification and the structure of the inventory report; ISO 14064-3 governs the verification and validation process itself, defining the level of assurance and the materiality threshold against which an auditor judges the figure. The EU Corporate Sustainability Reporting Directive (CSRD) layers the European Sustainability Reporting Standards on top, with ESRS E1 prescribing the climate disclosures — gross Scope 1/2/3, the consolidation approach, and the methodologies and assumptions behind every estimate. For project-based crediting, the Verra VM-series methodologies (for example VM0047 for afforestation, reforestation, and revegetation) and Gold Standard impose their own GIS and additionality requirements, including spatial baselines and leakage belts that the pipeline must compute explicitly.

The architectural consequence is that every certified figure must be tagged with the regulatory metadata that lets an auditor reconstruct its basis: the framework and version, the consolidation approach, the materiality threshold applied, and an uncertainty band. Spatial outputs carry the same tags at feature granularity, so that a single converted parcel can be traced to the methodology that credited it. Encoding scoping rules as versioned, queryable metadata — rather than as hard-coded branches — means a change in CSRD interpretation is a data update with its own effective date, not a code deploy that silently rewrites history. The uncertainty band is itself a compliance artifact: ISO 14064-3 and the Verra methodologies require that estimates be reported with their uncertainty, and where the uncertainty is derived from [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) the propagation path must be auditable end to end.

<svg viewBox="0 -4 900 268" role="img" aria-labelledby="scope-t scope-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="scope-t">How one physical facility produces different reported tonnages under different scoping and consolidation rules</title>
  <desc id="scope-d">A single facility emitting 120 kilotonnes of carbon dioxide equivalent is shown feeding three reporting entities. The operator, holding a 100 percent operational control interest, reports the full 120 as Scope 1. A joint-venture partner holding a 40 percent equity share reports 48 under the equity-share approach and nothing under operational control. A downstream customer purchasing 30 percent of the output reports 36 as Scope 3 category 1. A panel notes that the total reported across entities exceeds the physical emission, which is expected and correct, and that the pipeline must therefore carry the consolidation rule as data on every record rather than assuming one.</desc>
  <defs>
    <marker id="scope-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="12" y="94" width="164" height="76" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="94" width="164" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <text x="94" y="120" fill="currentColor" font-size="10.5" font-weight="700">One facility</text>
    <text x="94" y="144" fill="currentColor" font-size="15" font-weight="700">120 ktCO₂e</text>
    <text x="94" y="160" fill="currentColor" font-size="9" opacity="0.78">physically emitted</text>
    <rect x="266" y="14" width="286" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="409" y="38" fill="currentColor" font-size="10.5" font-weight="700">Operator · 100% operational control</text>
    <text x="409" y="60" fill="currentColor" font-size="10">reports 120 as Scope 1</text>
    <rect x="266" y="100" width="286" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="409" y="124" fill="currentColor" font-size="10.5" font-weight="700">JV partner · 40% equity share</text>
    <text x="409" y="146" fill="currentColor" font-size="10">reports 48 under equity share · 0 under control</text>
    <rect x="266" y="186" width="286" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="409" y="210" fill="currentColor" font-size="10.5" font-weight="700">Customer · buys 30% of output</text>
    <text x="409" y="232" fill="currentColor" font-size="10">reports 36 as Scope 3 category 1</text>
    <rect x="596" y="80" width="292" height="104" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="596" y="80" width="292" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="742" y="106" fill="currentColor" font-size="10.5" font-weight="700">Sum across entities &gt; 120</text>
    <text x="742" y="130" fill="currentColor" font-size="9.5" opacity="0.85">This is correct, not a double count —</text>
    <text x="742" y="146" fill="currentColor" font-size="9.5" opacity="0.85">each entity reports its own boundary.</text>
    <text x="742" y="170" fill="#f3a712" font-size="9.5" font-weight="700">So the rule must travel on the record.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#scope-arrow)">
    <path d="M176 116 C 214 104, 224 54, 264 45"/>
    <line x1="176" y1="132" x2="264" y2="131"/>
    <path d="M176 148 C 214 160, 224 208, 264 217"/>
  </g>
</svg>

The diagram makes concrete why consolidation cannot be a pipeline default. The same physical tonne legitimately appears in three different inventories under three different rules, and a pipeline that hard-codes one of them produces figures that are correct for one reporting entity and silently wrong for the others. Carrying `consolidation_rule` and `reporting_entity` as columns — rather than as configuration — is what lets a single certified dataset serve every entity that has a claim on it, and lets an auditor re-derive any one of them.

## Audit Trails, Lineage & Provenance

Institutional audits demand more than final emission totals; they require complete, immutable data lineage. Every transformation — from raw telemetry ingestion through CRS transformation, factor multiplication, and spatial aggregation — must generate a cryptographically signed provenance record. Implementing [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) lets auditors reconstruct the exact computational path that produced a figure, including the factor versions, CRS transformations, and consolidation rules applied at runtime. The defensibility test is concrete: an auditor points at a single tonne in the certified report and asks which inputs, which factors, and which code produced it. A pipeline that cannot answer that question line by line has not produced an inventory; it has produced an assertion.

Lineage should be stored in an append-only ledger — Delta Lake with time-travel, an immutable object store with content-addressed artifacts, or a tamper-evident log — and exposed through a queryable API so that reconstruction is a query, not an archaeology project. Each stage signs the artifact it commits, hashing the input artifact, the code version, the configuration, and the output so that any post-hoc alteration is detectable. Because the factor database is bitemporal, the ledger records both the value time (the period the data describes) and the transaction time (when it was written), which is what makes a 2024 figure reproducible from a 2026 query. Re-running the pipeline against the recorded artifact hashes must reproduce the certified output exactly; if it does not, the discrepancy is itself a logged event for investigation.

<svg viewBox="0 0 820 290" role="img" aria-label="An append-only provenance ledger as a signed artifact chain. Four blocks — raw ingest, normalized, factored, and aggregated — each carry an artifact hash, the code version, a config hash, and a signature, and each block references the hash of the prior block so any post-hoc alteration breaks the chain." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:820px;display:block;margin:1.5rem auto;">
  <title>Append-only signed artifact chain linking each MRV stage to the next</title>
  <desc>Four ledger blocks are chained left to right: raw ingest, normalized, factored, and aggregated. Each block records its artifact SHA-256 hash, the code version that produced it, a config hash, and a cryptographic signature, plus a pointer to the previous block's hash. Because each link binds the input hash, code, and config, re-running the pipeline must reproduce the recorded hashes exactly; any tampering breaks the signature chain and is logged for investigation.</desc>
  <defs>
    <marker id="mrv-led-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <text x="410" y="22" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Append-only ledger · each block signs the prior block's hash</text>
  <!-- four blocks -->
  <!-- block template: x positions 12, 214, 416, 618 ; width 190 -->
  <!-- BLOCK 1 -->
  <rect x="12" y="46" width="190" height="170" rx="9" fill="currentColor" opacity="0.06"/>
  <rect x="12" y="46" width="190" height="170" rx="9" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.75"/>
  <text x="107" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Raw ingest</text>
  <line x1="28" y1="80" x2="186" y2="80" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
  <text x="28" y="100" font-size="8.5" fill="currentColor" opacity="0.85">hash  sha256:9f3a…1c</text>
  <text x="28" y="121" font-size="8.5" fill="currentColor" opacity="0.85">code  ingest v4.2.0</text>
  <text x="28" y="142" font-size="8.5" fill="currentColor" opacity="0.85">cfg   c1a0…7b</text>
  <text x="28" y="163" font-size="8.5" fill="currentColor" opacity="0.85">sig   ✔ ed25519</text>
  <text x="28" y="194" font-size="8" fill="currentColor" opacity="0.55">prev  ∅ genesis</text>
  <!-- BLOCK 2 -->
  <rect x="214" y="46" width="190" height="170" rx="9" fill="currentColor" opacity="0.06"/>
  <rect x="214" y="46" width="190" height="170" rx="9" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.75"/>
  <text x="309" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Normalized</text>
  <line x1="230" y1="80" x2="388" y2="80" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
  <text x="230" y="100" font-size="8.5" fill="currentColor" opacity="0.85">hash  sha256:b72e…44</text>
  <text x="230" y="121" font-size="8.5" fill="currentColor" opacity="0.85">code  normalize v3.8</text>
  <text x="230" y="142" font-size="8.5" fill="currentColor" opacity="0.85">cfg   crs=6933 · topo</text>
  <text x="230" y="163" font-size="8.5" fill="currentColor" opacity="0.85">sig   ✔ ed25519</text>
  <text x="230" y="194" font-size="8" fill="currentColor" opacity="0.6">prev  9f3a…1c</text>
  <!-- BLOCK 3 -->
  <rect x="416" y="46" width="190" height="170" rx="9" fill="currentColor" opacity="0.06"/>
  <rect x="416" y="46" width="190" height="170" rx="9" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.75"/>
  <text x="511" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Factored</text>
  <line x1="432" y1="80" x2="590" y2="80" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
  <text x="432" y="100" font-size="8.5" fill="currentColor" opacity="0.85">hash  sha256:e08c…d9</text>
  <text x="432" y="121" font-size="8.5" fill="currentColor" opacity="0.85">code  factor v2.1.3</text>
  <text x="432" y="142" font-size="8.5" fill="currentColor" opacity="0.85">cfg   factor@2024-12</text>
  <text x="432" y="163" font-size="8.5" fill="currentColor" opacity="0.85">sig   ✔ ed25519</text>
  <text x="432" y="194" font-size="8" fill="currentColor" opacity="0.6">prev  b72e…44</text>
  <!-- BLOCK 4 -->
  <rect x="618" y="46" width="190" height="170" rx="9" fill="currentColor" opacity="0.12"/>
  <rect x="618" y="46" width="190" height="170" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <text x="713" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Aggregated</text>
  <line x1="634" y1="80" x2="792" y2="80" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
  <text x="634" y="100" font-size="8.5" fill="currentColor" opacity="0.9">hash  sha256:5af1…0e</text>
  <text x="634" y="121" font-size="8.5" fill="currentColor" opacity="0.9">code  aggregate v5.0</text>
  <text x="634" y="142" font-size="8.5" fill="currentColor" opacity="0.9">cfg   rule=control</text>
  <text x="634" y="163" font-size="8.5" fill="currentColor" opacity="0.9">sig   ✔ ed25519</text>
  <text x="634" y="194" font-size="8" fill="currentColor" opacity="0.65">prev  e08c…d9</text>
  <!-- chain arrows linking prev-hash references -->
  <line x1="202" y1="131" x2="213" y2="131" stroke="currentColor" stroke-width="1.6" marker-end="url(#mrv-led-arrow)"/>
  <line x1="404" y1="131" x2="415" y2="131" stroke="currentColor" stroke-width="1.6" marker-end="url(#mrv-led-arrow)"/>
  <line x1="606" y1="131" x2="617" y2="131" stroke="currentColor" stroke-width="1.6" marker-end="url(#mrv-led-arrow)"/>
  <text x="410" y="252" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.7">re-run from any prior hash must reproduce the next hash exactly — a mismatch is itself a logged event</text>
</svg>

Verification frameworks must cross-reference this lineage against [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) to reconcile retired offsets, prevent double issuance, and validate additionality claims against spatial baselines. A credit is only real if exactly one registry has issued it and no second entity is claiming the same physical reduction, so the pipeline reconciles its computed reductions against registry serial-number ranges and retirement records as a closing gate. Where the underlying reductions derive from remotely sensed change — for example a [deforestation alert generation pipeline](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/deforestation-alert-generation-pipelines/) feeding a forest-protection project — the lineage must chain all the way back to the source scene IDs and the cloud-mask decisions that produced the alert, so the registry's spatial baseline can be independently re-derived.

## Production Deployment & Validation Patterns

Deploying MRV pipelines requires infrastructure-as-code (IaC), automated testing, and continuous compliance monitoring. Orchestration should run on Apache Airflow, Prefect, or Dagster to manage DAG dependencies, retry logic, idempotent re-runs, and historical backfill — the choice among them is a real engineering decision driven by whether the workload is schedule-heavy (Airflow's strength), dynamically parameterized (Prefect's), or asset-and-lineage-centric (Dagster's). Whichever is chosen, the orchestrator must guarantee that re-running a task with the same inputs produces the same artifact, because backfilling a corrected factor across three prior reporting periods is a routine operation, not an emergency.

Validation is layered. Geometry integrity is covered by automated unit tests asserting validity, area conservation within tolerance, and correct CRS on every emitted feature. Statistical tests guard the factor distributions and flag outliers against historical baselines, catching the meter that suddenly reports ten times its usual load. Regression tests pin the certified outputs of prior periods so that a code change which would silently move a published number fails CI rather than reaching production. These tests are the executable form of the verification gates: the same checks that route a flagged record to a human in production also run against fixtures in the build.

Uncertainty quantification follows Monte Carlo simulation or analytical error propagation, with confidence intervals reported alongside every point estimate rather than appended as a footnote. Where activity data carries measurement error and factors carry their own published uncertainty, the pipeline propagates both to a 95% interval on the final tonnage, and that interval — not just the point estimate — is what the compliance layer tags and the auditor evaluates against the materiality threshold. Inputs sourced from [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) arrive with their own uncertainty surfaces, which must be combined rather than discarded.

All outputs are serialized into standardized formats — XBRL for CSRD digital tagging, ISO 14064-compliant JSON-LD, or registry-specific submission packages — so that the certified dataset is machine-ingestible by regulatory portals and third-party verification bodies without manual re-keying. Containerized deployments enforce resource quotas, implement circuit breakers around external dependencies such as grid-factor APIs (so a stale upstream factor degrades gracefully rather than poisoning a run), and maintain read-only replicas for audit access so that an auditor can query the certified zone without any path to mutate it. The deployment posture, in short, mirrors the accounting posture: every figure is reproducible, every change is logged, and the certified record is immutable by construction.

<svg viewBox="-4 44 908 226" role="img" aria-labelledby="zone-t zone-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="zone-t">Three storage zones and the gates that separate them</title>
  <desc id="zone-d">Three storage zones drawn left to right. The raw zone holds immutable source files with their checksums and is append-only with no deletions. A promotion gate between raw and curated enforces schema conformance, unit declaration, and coordinate reference system presence. The curated zone holds the canonical Parquet with typed columns and equal-area geometry, and is re-derivable from raw. A certification gate between curated and certified enforces validation gates, reconciliation, uncertainty bounds, and a signed manifest. The certified zone holds reportable figures, is immutable and signed, and is the only zone a disclosure may cite. Arrows show that promotion is one-directional and that a correction re-enters at raw rather than editing a certified record.</desc>
  <defs>
    <marker id="zone-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <rect x="12" y="60" width="212" height="104" rx="9" fill="currentColor" opacity="0.05"/>
    <rect x="12" y="60" width="212" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="118" y="86" fill="currentColor" font-size="11" font-weight="700">Raw zone</text>
    <text x="118" y="108" fill="currentColor" font-size="9.5" opacity="0.8">source files + checksums</text>
    <text x="118" y="126" fill="currentColor" font-size="9.5" opacity="0.8">append-only, never deleted</text>
    <text x="118" y="148" fill="currentColor" font-size="9" opacity="0.7">the only place messy reality lives</text>
    <rect x="264" y="60" width="212" height="104" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="264" y="60" width="212" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="370" y="86" fill="currentColor" font-size="11" font-weight="700">Curated zone</text>
    <text x="370" y="108" fill="currentColor" font-size="9.5" opacity="0.8">canonical Parquet, typed</text>
    <text x="370" y="126" fill="currentColor" font-size="9.5" opacity="0.8">equal-area geometry</text>
    <text x="370" y="148" fill="currentColor" font-size="9" opacity="0.7">fully re-derivable from raw</text>
    <rect x="516" y="60" width="212" height="104" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="516" y="60" width="212" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.9"/>
    <text x="622" y="86" fill="currentColor" font-size="11" font-weight="700">Certified zone</text>
    <text x="622" y="108" fill="currentColor" font-size="9.5" opacity="0.8">reportable figures, signed</text>
    <text x="622" y="126" fill="currentColor" font-size="9.5" opacity="0.8">immutable</text>
    <text x="622" y="148" fill="currentColor" font-size="9" opacity="0.7">the only zone a disclosure cites</text>
    <rect x="248" y="182" width="196" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3"/>
    <text x="346" y="202" fill="currentColor" font-size="9.5" font-weight="700">Promotion gate</text>
    <text x="346" y="220" fill="currentColor" font-size="9" opacity="0.8">schema · units · CRS present</text>
    <text x="346" y="238" fill="currentColor" font-size="9" opacity="0.8">reject, never coerce</text>
    <rect x="500" y="182" width="196" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5,3"/>
    <text x="598" y="202" fill="currentColor" font-size="9.5" font-weight="700">Certification gate</text>
    <text x="598" y="220" fill="currentColor" font-size="9" opacity="0.8">validation · reconciliation</text>
    <text x="598" y="238" fill="currentColor" font-size="9" opacity="0.8">uncertainty · signed manifest</text>
    <rect x="748" y="60" width="140" height="104" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="748" y="60" width="140" height="104" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="818" y="88" fill="currentColor" font-size="9.5" font-weight="700">A correction</text>
    <text x="818" y="108" fill="currentColor" font-size="9" opacity="0.82">re-enters at raw</text>
    <text x="818" y="126" fill="#f3a712" font-size="9" font-weight="700">never edits a</text>
    <text x="818" y="142" fill="#f3a712" font-size="9" font-weight="700">certified record</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#zone-arrow)">
    <line x1="224" y1="112" x2="262" y2="112"/>
    <line x1="476" y1="112" x2="514" y2="112"/>
    <line x1="346" y1="180" x2="346" y2="166" stroke-dasharray="4,3"/>
    <line x1="598" y1="180" x2="598" y2="166" stroke-dasharray="4,3"/>
    <path d="M780 164 C 700 250, 240 250, 118 168" stroke-dasharray="6,4"/>
  </g>
</svg>

The zone separation is what makes a restatement survivable. When a figure has to change — a revised factor table, a corrected boundary, a discovered defect — the correction enters at the raw zone and flows forward through both gates, producing a new certified artefact alongside the old one rather than mutating it. The previously published figure remains retrievable, which is exactly what a verifier needs in order to understand what changed and why, and exactly what an in-place edit destroys.

## Frequently Asked Questions

### How strictly should ingestion reject malformed input?

Completely, and with a typed error naming the field. Ingestion is the only stage that faces messy reality, and every coercion it performs becomes an undocumented assumption that a verifier will eventually find. A utility invoice arriving in kilowatt-hours where the schema declares megajoules should fail at the door, not be rescaled by an implicit guess three stages later. The operational cost is real — someone has to fix the source — but it is paid once, at ingestion, rather than repeatedly during verification when nobody can reconstruct which records were silently adjusted.

### Why must the emission factor be bound by version rather than looked up at run time?

Because re-running the 2024 inventory in 2026 must yield the 2024 numbers. Factor databases are revised as science and grid mixes change, and a pipeline that reads "the current factor" produces a different answer every time it runs, which makes both replay and defence impossible. Binding an explicit `factor_id`, `factor_version`, and effective date on every multiplication turns the factor store into an append-only bitemporal record and turns the calculation into a reproducible function of its declared inputs.

### What does "single-pass reprojection" actually protect against?

Cumulative coordinate drift. Every reprojection resamples and re-snaps geometry, and floating-point error accumulates across a chain of them; a dozen warps across iterative change-detection cycles move vertices by amounts that eventually break topology and trigger false change. Reprojecting exactly once from the authoritative source — never from a previously reprojected derivative — removes the accumulation entirely, at the cost of keeping the authoritative source addressable, which the raw zone already guarantees.

### How do the five stages map onto an orchestrator's tasks?

Not one-to-one, and forcing them to is a common early mistake. A stage is a contract boundary — an immutable, addressable artefact that the next stage reads — while an orchestrator task is a unit of scheduling, and a single stage typically fans out over thousands of tile-month tasks. Keep the stage boundaries as the places where artefacts are committed and invariants asserted, and let the orchestrator partition work within a stage however suits its execution model.

### Where should uncertainty be attached — to the record or to the report?

Both, and they are different quantities. Per-record uncertainty travels with the measurement and is what allows a downstream aggregation to propagate error correctly rather than treating every input as exact. Report-level uncertainty is the propagated result plus the model and methodological terms that only exist at the aggregate. A pipeline that carries only the second cannot re-aggregate to a different boundary; one that carries only the first cannot state a defensible figure. Carry per-record intervals as columns and compute the report-level figure from them at aggregation time.

## Conclusion

The transition to automated, spatially explicit MRV systems is not merely a technical upgrade — it is a compliance imperative. By engineering deterministic five-stage pipelines, enforcing single-pass equal-area spatial alignment, encoding regulatory scoping rules as versioned data, and maintaining a cryptographically signed, append-only audit trail, organizations produce carbon inventories that withstand institutional scrutiny. The four cross-cutting disciplines covered here — CRS alignment, Scope 3 spatial attribution, lineage and provenance, and registry reconciliation — are the load-bearing components every downstream model depends on, and each is detailed in its own guide below. Together with the [satellite imagery processing](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) front end and the [carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) back end, they form a reference architecture for scalable, defensible, and auditable emissions accounting in an era of tightening climate-disclosure mandates.

## Related

- [Geospatial Coordinate Reference Systems (CRS) Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — single-pass, equal-area reprojection and topology validation at the ingestion stage.
- [GHG Protocol Scope 3 Spatial Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) — resolving supply-chain emissions into georeferenced hotspots without double counting.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — append-only ledgers, signed artifact chains, and queryable reconstruction.
- [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) — reconciling retirements, preventing double issuance, and validating additionality.
- [Satellite Imagery Processing for Emissions Tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) — the cloud-native front end that produces activity data for this stack.
