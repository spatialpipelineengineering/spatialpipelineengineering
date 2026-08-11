---
shortTitle: "ISO 14064 vs GHG Protocol vs CSRD for Spatial MRV"
title: "ISO 14064 vs GHG Protocol vs CSRD for Spatial MRV"
description: "What three overlapping reporting frameworks actually demand of a spatial MRV pipeline: boundary definitions, materiality and uncertainty rules, assurance levels, and the fields each requires that the others do not."
slug: iso-14064-vs-ghg-protocol-vs-csrd-for-spatial-mrv
type: guide
breadcrumb: "ISO 14064 vs GHG Protocol vs CSRD"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# ISO 14064 vs GHG Protocol vs CSRD for Spatial MRV

Most organisations reporting land-related emissions end up subject to more than one of these frameworks at once, and the instinct is to pick the strictest and satisfy the others by implication. That works for the headline number and fails everywhere else, because the three differ less in stringency than in what they require to be *stated* — boundaries, materiality, uncertainty, assurance, and comparability across periods. This guide sets out what each demands of a pipeline, within [carbon registry standards and methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/) in the [pipeline orchestration and compliance reference](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/) stack.

The distinction that organises the comparison is what each framework is for. The GHG Protocol is an accounting standard: it says how to draw a boundary and what to count inside it. ISO 14064 is a specification with guidance for quantification and, in its later parts, for the verification of the resulting assertion. CSRD, through ESRS E1, is a disclosure regulation: it says what must be published, in what structure, with what assurance, alongside financial statements. A pipeline can satisfy the first and still be unable to produce what the third asks for, because the third asks for things the first never mentions.

<svg viewBox="0 -4 940 268" role="img" aria-labelledby="fw-t fw-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="fw-t">What each framework is for, and where their demands do not overlap</title>
  <desc id="fw-d">Three columns describing the three frameworks. The GHG Protocol is an accounting standard defining organisational and operational boundaries, the scope one two and three structure, and what to count; it demands a consistent boundary and a recalculation policy for base year changes. ISO 14064 is a specification for quantification and reporting with an emphasis on documented methodology, uncertainty assessment, and an assertion that can be verified to a stated level of assurance; it demands a quantification methodology document and an uncertainty statement. CSRD via ESRS E1 is a disclosure regulation requiring machine-readable tagged disclosure alongside financial statements, mandatory limited assurance rising over time, double materiality assessment, and comparability with the prior period including restatement disclosure. A band below lists what only one framework demands: base year recalculation policy from the Protocol, a formal uncertainty assessment from ISO, and digital tagging with restatement disclosure from CSRD.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Three frameworks, three different jobs — satisfying one does not imply the others</text>
    <rect x="12" y="38" width="298" height="164" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="12" y="38" width="298" height="164" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="28" y="62" fill="currentColor" font-size="10.5" font-weight="700">GHG Protocol</text>
    <text x="28" y="80" fill="currentColor" font-size="9" opacity="0.72">an accounting standard</text>
    <text x="28" y="106" fill="currentColor" font-size="9.5" opacity="0.85">organisational + operational boundary</text>
    <text x="28" y="126" fill="currentColor" font-size="9.5" opacity="0.85">scope 1 / 2 / 3 structure</text>
    <text x="28" y="146" fill="currentColor" font-size="9.5" opacity="0.85">what to count and where</text>
    <text x="28" y="172" fill="currentColor" font-size="9" opacity="0.72">demands: a consistent boundary and</text>
    <text x="28" y="188" fill="currentColor" font-size="9" opacity="0.72">a base-year recalculation policy</text>
    <rect x="322" y="38" width="298" height="164" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="322" y="38" width="298" height="164" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="338" y="62" fill="currentColor" font-size="10.5" font-weight="700">ISO 14064</text>
    <text x="338" y="80" fill="currentColor" font-size="9" opacity="0.72">a quantification specification</text>
    <text x="338" y="106" fill="currentColor" font-size="9.5" opacity="0.85">documented methodology</text>
    <text x="338" y="126" fill="currentColor" font-size="9.5" opacity="0.85">uncertainty assessment</text>
    <text x="338" y="146" fill="currentColor" font-size="9.5" opacity="0.85">a verifiable assertion</text>
    <text x="338" y="172" fill="currentColor" font-size="9" opacity="0.72">demands: a methodology document</text>
    <text x="338" y="188" fill="currentColor" font-size="9" opacity="0.72">and an uncertainty statement</text>
    <rect x="632" y="38" width="296" height="164" rx="9" fill="#f3a712" opacity="0.14"/>
    <rect x="632" y="38" width="296" height="164" rx="9" fill="none" stroke="#f3a712" stroke-width="1.8"/>
    <text x="648" y="62" fill="currentColor" font-size="10.5" font-weight="700">CSRD / ESRS E1</text>
    <text x="648" y="80" fill="currentColor" font-size="9" opacity="0.72">a disclosure regulation</text>
    <text x="648" y="106" fill="currentColor" font-size="9.5" opacity="0.85">machine-readable tagged disclosure</text>
    <text x="648" y="126" fill="currentColor" font-size="9.5" opacity="0.85">mandatory assurance, rising</text>
    <text x="648" y="146" fill="currentColor" font-size="9.5" opacity="0.85">double materiality assessment</text>
    <text x="648" y="172" fill="#f3a712" font-size="9" font-weight="700">demands: comparability with the</text>
    <text x="648" y="188" fill="#f3a712" font-size="9" font-weight="700">prior period and restatement notes</text>
    <rect x="12" y="218" width="916" height="44" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="218" width="916" height="44" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="470" y="238" text-anchor="middle" fill="currentColor" font-size="10" font-weight="700">Demanded by exactly one: base-year recalculation policy · formal uncertainty assessment · digital tagging with restatement disclosure</text>
    <text x="470" y="255" text-anchor="middle" fill="currentColor" font-size="9.5" opacity="0.85">These three are where a pipeline built for one framework discovers it cannot answer another.</text>
  </g>
</svg>

## Root Cause Analysis

Three structural differences drive nearly all the integration work, and each one lands in a different part of the pipeline.

**Boundaries are defined by different logic.** The GHG Protocol draws its boundary around an organisation by control or equity share, then follows operational control outward through the value chain. CSRD's boundary follows the financial consolidation scope, so that the sustainability statement covers the same entities as the accounts. These are often the same set and sometimes are not, and when they differ the difference shows up as a set of land parcels included in one report and excluded from the other. A pipeline that hard-codes one boundary cannot produce the other without a reprocessing run.

**Materiality means two different things.** In the GHG Protocol tradition, materiality is largely about whether an omission would mislead — a quantitative judgement about size. Under CSRD, materiality is double: an impact is material if it matters to the environment *or* to the enterprise's financial position, assessed and documented separately. A land parcel with small absolute emissions can be material under the impact limb and immaterial under the financial one, and the assessment itself is a disclosure. Pipelines rarely model this at all, and it is the most common source of scrambling in the first CSRD cycle.

**Assurance changes what evidence must exist.** A voluntary report checked by a consultant and a limited-assurance opinion attached to a financial filing place different demands on the underlying records. Assurance providers test controls, sample transactions, and trace figures back to source; they need lineage they can follow without the pipeline's authors present. That requirement is a property of the evidence store rather than of the calculation, and it is where a scientifically excellent pipeline most often falls short.

The connecting theme is that these frameworks agree substantially on the arithmetic and diverge on the record. A pipeline designed around producing numbers will satisfy the arithmetic and struggle with everything else.

## Diagnostic Pipeline / Pre-Flight Validation

The most useful pre-flight check is a coverage matrix: for each framework in scope, does the pipeline produce every required field, at the required granularity, with the required supporting record? Running it before a reporting cycle is considerably cheaper than discovering the gaps during one.

```python
from dataclasses import dataclass
from enum import Enum

import structlog

log = structlog.get_logger()


class Framework(str, Enum):
    GHG_PROTOCOL = "ghg_protocol"
    ISO_14064 = "iso_14064"
    CSRD_E1 = "csrd_esrs_e1"


@dataclass(frozen=True)
class Requirement:
    """One thing a framework requires the pipeline to be able to produce."""
    req_id: str
    framework: Framework
    label: str
    granularity: str            # entity | site | parcel | category
    needs_prior_period: bool
    needs_assurance_trail: bool


REQUIREMENTS: tuple[Requirement, ...] = (
    Requirement("gp-boundary", Framework.GHG_PROTOCOL,
                "consolidation approach and entity list", "entity",
                False, False),
    Requirement("gp-basyear", Framework.GHG_PROTOCOL,
                "base year with recalculation policy and trigger log",
                "entity", True, False),
    Requirement("gp-scope3", Framework.GHG_PROTOCOL,
                "scope 3 category coverage with exclusions justified",
                "category", False, False),
    Requirement("iso-method", Framework.ISO_14064,
                "documented quantification methodology per source",
                "category", False, True),
    Requirement("iso-uncert", Framework.ISO_14064,
                "uncertainty assessment per significant source",
                "category", False, True),
    Requirement("iso-assert", Framework.ISO_14064,
                "a GHG assertion signed by a responsible party",
                "entity", False, True),
    Requirement("e1-dm", Framework.CSRD_E1,
                "double materiality assessment, impact and financial",
                "site", False, True),
    Requirement("e1-comparative", Framework.CSRD_E1,
                "prior period comparative on the same basis", "category",
                True, True),
    Requirement("e1-restatement", Framework.CSRD_E1,
                "restatement disclosure where prior figures moved",
                "category", True, True),
    Requirement("e1-tagging", Framework.CSRD_E1,
                "machine-readable tagged values", "category", False, False),
)


@dataclass(frozen=True)
class Capability:
    """What the pipeline can actually produce today."""
    req_id: str
    produced: bool
    granularity: str
    has_prior_period: bool
    has_lineage: bool
    note: str = ""


def assess_coverage(
    frameworks: frozenset[Framework], capabilities: dict[str, Capability]
) -> list[tuple[Requirement, str]]:
    """Gaps between what is required and what exists, before a cycle starts.

    Granularity is checked as well as presence, because 'we report this'
    frequently means 'we report this at entity level' when the framework
    asks for it per site — and aggregating up is easy while disaggregating
    after the fact is a reprocessing project.
    """
    order = ["entity", "site", "parcel", "category"]
    gaps: list[tuple[Requirement, str]] = []

    for req in REQUIREMENTS:
        if req.framework not in frameworks:
            continue

        cap = capabilities.get(req.req_id)
        if cap is None or not cap.produced:
            gaps.append((req, "not produced at all"))
            continue

        if order.index(cap.granularity) < order.index(req.granularity):
            gaps.append((
                req,
                f"produced at {cap.granularity} level, required at "
                f"{req.granularity} — disaggregation is a reprocessing job, "
                "not a query",
            ))

        if req.needs_prior_period and not cap.has_prior_period:
            gaps.append((req, "no comparable prior-period figure on this basis"))

        if req.needs_assurance_trail and not cap.has_lineage:
            gaps.append((
                req,
                "no lineage an assurance provider can follow unaided",
            ))

    for req, reason in gaps:
        log.warning("coverage.gap", requirement=req.req_id,
                    framework=req.framework.value, reason=reason)

    return gaps
```

The granularity comparison is the check that earns its place. Organisations routinely believe they report something because a number exists, and discover during assurance that the framework wanted it split by site or by category — a distinction that is trivial going up and expensive going down.

<svg viewBox="0 -4 900 258" role="img" aria-labelledby="ass-t ass-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ass-t">What an assurance provider follows, and where spatial pipelines usually break the chain</title>
  <desc id="ass-d">A chain of six links an assurance provider traces from a published figure back to its source. The published tagged value links to the aggregated category total, which links to the site or parcel level figures, which link to the calculation inputs of activity data and emission factor, which link to the source datasets, which link to the acquisition record of the imagery or field survey. Two links are marked as the usual break points: between parcel figures and calculation inputs, where a pipeline that recomputes rather than storing intermediates cannot show what was used, and between source datasets and acquisition records, where a dataset overwritten in place has no record of the version that produced the figure. A note reads that the provider will not accept a rerun as evidence of what happened, because a rerun demonstrates the code works today.</desc>
  <defs>
    <marker id="ass-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">The provider traces backwards. Two links usually are not there.</text>
    <rect x="12" y="44" width="136" height="70" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="44" width="136" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="80" y="72" fill="currentColor" font-size="9.5" font-weight="700">Published</text>
    <text x="80" y="88" fill="currentColor" font-size="9.5" font-weight="700">tagged value</text>
    <rect x="168" y="44" width="136" height="70" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="168" y="44" width="136" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="236" y="72" fill="currentColor" font-size="9.5" font-weight="700">Category</text>
    <text x="236" y="88" fill="currentColor" font-size="9.5" font-weight="700">total</text>
    <rect x="324" y="44" width="136" height="70" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="324" y="44" width="136" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="392" y="72" fill="currentColor" font-size="9.5" font-weight="700">Site / parcel</text>
    <text x="392" y="88" fill="currentColor" font-size="9.5" font-weight="700">figures</text>
    <rect x="480" y="44" width="136" height="70" rx="9" fill="none" stroke="#f3a712" stroke-width="2" stroke-dasharray="6,3"/>
    <text x="548" y="72" fill="currentColor" font-size="9.5" font-weight="700">Calculation</text>
    <text x="548" y="88" fill="currentColor" font-size="9.5" font-weight="700">inputs</text>
    <rect x="636" y="44" width="136" height="70" rx="9" fill="none" stroke="#f3a712" stroke-width="2" stroke-dasharray="6,3"/>
    <text x="704" y="72" fill="currentColor" font-size="9.5" font-weight="700">Source</text>
    <text x="704" y="88" fill="currentColor" font-size="9.5" font-weight="700">datasets</text>
    <rect x="792" y="44" width="96" height="70" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="792" y="44" width="96" height="70" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="840" y="72" fill="currentColor" font-size="9.5" font-weight="700">Acquisition</text>
    <text x="840" y="88" fill="currentColor" font-size="9.5" font-weight="700">record</text>
    <text x="548" y="146" fill="#f3a712" font-size="9" font-weight="700">intermediates recomputed,</text>
    <text x="548" y="162" fill="#f3a712" font-size="9" font-weight="700">never stored</text>
    <text x="704" y="146" fill="#f3a712" font-size="9" font-weight="700">dataset overwritten</text>
    <text x="704" y="162" fill="#f3a712" font-size="9" font-weight="700">in place</text>
    <rect x="12" y="186" width="876" height="60" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="186" width="876" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="450" y="210" fill="currentColor" font-size="10" font-weight="700">“We can re-run it” is not evidence.</text>
    <text x="450" y="232" fill="currentColor" font-size="9.5" opacity="0.85">A rerun shows the code works today. The provider is testing whether the published figure came from what you say it came from.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#ass-arrow)">
    <line x1="166" y1="79" x2="150" y2="79"/><line x1="322" y1="79" x2="306" y2="79"/>
    <line x1="478" y1="79" x2="462" y2="79"/><line x1="634" y1="79" x2="618" y2="79"/>
    <line x1="790" y1="79" x2="774" y2="79"/>
  </g>
  <g stroke="#f3a712" stroke-width="1.4" fill="none" stroke-dasharray="4,3">
    <path d="M548 114 L548 132"/><path d="M704 114 L704 132"/>
  </g>
</svg>

## Deterministic Transformation Logic

Producing one set of figures that serves all three frameworks means computing at the finest granularity any of them requires and aggregating upward per framework, rather than computing per framework. The parcel-level figure is the shared substrate; each framework is a different projection of it.

```python
from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class ParcelFigure:
    """The atomic unit. Every framework's number is an aggregation of these.

    Computing at this level once and projecting upward is what keeps three
    reports consistent. Computing per framework guarantees they disagree,
    and the disagreement is discovered by whoever reconciles them last.
    """
    parcel_id: str
    period_start: date
    period_end: date
    tco2e: float
    uncertainty_rel: float
    activity_basis: str
    emission_factor_id: str
    emission_factor_version: str
    consolidation_entity: str
    financial_consolidation_entity: str | None
    ghg_scope: int
    ghg_scope3_category: int | None
    esrs_material_impact: bool
    esrs_material_financial: bool
    lineage_run_id: str


@dataclass(frozen=True)
class FrameworkTotal:
    framework: Framework
    grouping: str
    tco2e: float
    uncertainty_rel: float
    n_parcels: int
    excluded_parcels: tuple[str, ...]
    exclusion_reason: str


def project(
    figures: list[ParcelFigure], framework: Framework
) -> list[FrameworkTotal]:
    """Aggregate parcel figures according to one framework's rules.

    The exclusions are returned, not dropped. A framework total that omits
    parcels without saying which ones is a completeness claim nobody can
    check, and completeness is the first thing an assurance provider tests.
    """
    if framework is Framework.CSRD_E1:
        in_scope = [
            f for f in figures
            if f.financial_consolidation_entity is not None
            and (f.esrs_material_impact or f.esrs_material_financial)
        ]
        excluded = [
            f.parcel_id for f in figures if f not in in_scope
        ]
        reason = ("outside financial consolidation scope, or assessed "
                  "immaterial under both limbs")
        grouping_key = lambda f: f"scope{f.ghg_scope}"
    else:
        in_scope = [f for f in figures if f.consolidation_entity]
        excluded = [f.parcel_id for f in figures if not f.consolidation_entity]
        reason = "outside the organisational boundary"
        grouping_key = lambda f: (
            f"scope3.{f.ghg_scope3_category}" if f.ghg_scope == 3
            else f"scope{f.ghg_scope}"
        )

    groups: dict[str, list[ParcelFigure]] = {}
    for f in in_scope:
        groups.setdefault(grouping_key(f), []).append(f)

    totals: list[FrameworkTotal] = []
    for key, members in sorted(groups.items()):
        total = sum(m.tco2e for m in members)
        # Uncertainties combine in quadrature only for independent sources.
        # Parcels sharing an emission factor are not independent, so the
        # shared component is carried through unreduced.
        shared = {m.emission_factor_id for m in members}
        independent_share = 1.0 / max(len(shared), 1)
        combined = sum(
            (m.tco2e * m.uncertainty_rel) ** 2 for m in members
        ) ** 0.5
        correlated = sum(m.tco2e * m.uncertainty_rel for m in members) * (
            1 - independent_share
        )
        totals.append(
            FrameworkTotal(
                framework=framework,
                grouping=key,
                tco2e=round(total, 2),
                uncertainty_rel=round(
                    ((combined ** 2 + correlated ** 2) ** 0.5) / total, 4
                ) if total else 0.0,
                n_parcels=len(members),
                excluded_parcels=tuple(sorted(excluded)),
                exclusion_reason=reason,
            )
        )
    return totals
```

The uncertainty combination deserves a note. Parcels sharing an emission factor share that factor's error entirely, so combining every parcel's uncertainty in quadrature — the default in most implementations — understates the total by a wide margin in exactly the situation carbon reporting is usually in, which is many parcels and few factors.

## Compliance Gating & Audit Trail Generation

Four artefacts satisfy the overlapping demands, and producing them once serves all three frameworks.

The parcel-level figure store, immutable per reporting period, with the emission factor version and lineage run id on every row. This is the substrate every projection draws from and the thing an assurance provider samples.

A boundary register recording, per parcel and per period, which consolidation scopes include it and why. Boundaries change as entities are acquired and divested, and a register makes the change visible instead of appearing as an unexplained movement in a total.

The materiality assessment as data rather than as a document. Recording the impact and financial materiality determinations per site, with their basis and date, means the CSRD disclosure is generated rather than assembled, and it means a challenge to one determination is traceable.

A restatement log linking each restated figure to its prior value and the reason. This is required explicitly by CSRD, expected under ISO's consistency principle, and implied by the GHG Protocol's recalculation policy — one artefact, three uses.

## Production Integration

The practical build order is worth stating because it is not obvious. Build the parcel-level store first, with lineage, before building any report. Reports are cheap to add once the substrate exists and impossible to retrofit consistency onto once three of them have been built separately.

The CSRD-specific mapping — which parcel-level fields land in which ESRS datapoint — is covered in [mapping CSRD ESRS E1 disclosures to spatial MRV outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/), and the lineage layer that makes the assurance chain traceable is in [tracking data lineage with OpenLineage for ESG audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/). For organisations also holding credits, the registry-side requirements sit alongside rather than inside these frameworks; [Verra VM0047 vs Gold Standard GIS requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/) covers that side.

One integration caution. Do not let a framework's reporting structure become the pipeline's internal data model. Reporting structures change — ESRS datapoints have already been revised, and the Protocol's land sector guidance is comparatively recent — and a pipeline whose tables mirror a disclosure template needs migrating each time. The parcel-level model changes far more slowly, because it describes physical reality rather than a reporting convention.

<svg viewBox="0 -4 900 244" role="img" aria-labelledby="proj-t proj-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="proj-t">One parcel-level store, three projections</title>
  <desc id="proj-d">A central store of parcel-level figures fans out to three framework projections. The GHG Protocol projection groups by scope and scope three category using the organisational consolidation boundary. The ISO 14064 projection groups by emission source with an uncertainty statement per significant source. The CSRD projection groups by scope using the financial consolidation boundary and filters on double materiality, then emits tagged datapoints with prior period comparatives. Each projection returns its excluded parcels and the reason. A panel below notes that the three totals legitimately differ, and that the difference is explainable line by line only because all three descend from the same rows.</desc>
  <defs>
    <marker id="proj-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">The three totals differ — and the difference is explainable line by line</text>
    <rect x="12" y="60" width="212" height="112" rx="9" fill="#f3a712" opacity="0.16"/>
    <rect x="12" y="60" width="212" height="112" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="118" y="88" fill="currentColor" font-size="10.5" font-weight="700">Parcel-level store</text>
    <text x="118" y="110" fill="currentColor" font-size="9" opacity="0.82">immutable per period</text>
    <text x="118" y="128" fill="currentColor" font-size="9" opacity="0.82">factor version per row</text>
    <text x="118" y="146" fill="currentColor" font-size="9" opacity="0.82">lineage run id per row</text>
    <text x="118" y="164" fill="#f3a712" font-size="9" font-weight="700">build this first</text>
    <rect x="356" y="34" width="256" height="62" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="356" y="34" width="256" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="484" y="58" fill="currentColor" font-size="10" font-weight="700">GHG Protocol projection</text>
    <text x="484" y="78" fill="currentColor" font-size="8.5" opacity="0.82">scope + category, organisational boundary</text>
    <rect x="356" y="104" width="256" height="62" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="356" y="104" width="256" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="484" y="128" fill="currentColor" font-size="10" font-weight="700">ISO 14064 projection</text>
    <text x="484" y="148" fill="currentColor" font-size="8.5" opacity="0.82">by source, with uncertainty per source</text>
    <rect x="356" y="174" width="256" height="62" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="356" y="174" width="256" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="484" y="198" fill="currentColor" font-size="10" font-weight="700">CSRD / ESRS E1 projection</text>
    <text x="484" y="218" fill="currentColor" font-size="8.5" opacity="0.82">financial scope + double materiality, tagged</text>
    <rect x="656" y="60" width="232" height="112" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="656" y="60" width="232" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="772" y="88" fill="currentColor" font-size="10" font-weight="700">Each returns</text>
    <text x="772" y="110" fill="currentColor" font-size="9" opacity="0.82">its excluded parcels</text>
    <text x="772" y="128" fill="currentColor" font-size="9" opacity="0.82">and the reason</text>
    <text x="772" y="152" fill="currentColor" font-size="9" opacity="0.82">— completeness is testable</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#proj-arrow)">
    <path d="M224 106 L290 106 L290 65 L354 65"/>
    <path d="M224 116 L290 116 L290 135 L354 135"/>
    <path d="M224 126 L290 126 L290 205 L354 205"/>
    <path d="M612 65 L634 65 L634 106 L654 106"/>
    <path d="M612 135 L634 135 L634 116 L654 116"/>
    <path d="M612 205 L634 205 L634 126 L654 126"/>
  </g>
</svg>

## Frequently Asked Questions

### Can one pipeline genuinely serve all three, or is duplication inevitable?

One pipeline serves all three provided it computes at parcel level and projects upward. The duplication people experience comes from building each report as its own pipeline, which is the natural thing to do when the second framework arrives after the first is already in production. The refactor that pays for itself is extracting the parcel-level store from the first report before building the second — after the third, the extraction is a much larger job.

### Does CSRD require assurance over spatial data specifically?

It requires assurance over the sustainability statement, and where land-related emissions are material to that statement the spatial data is in scope by inclusion. In practice this means an assurance provider will test how areas were derived, what imagery was used, and whether the classification is reproducible — questions that are ordinary in a carbon crediting context and novel to organisations arriving from financial reporting. The evidence they need is the lineage, not the model's accuracy.

### How should immaterial parcels be handled — excluded or included at zero?

Included, with a materiality flag, and excluded at the projection step rather than at the data step. Excluding at the data step means the parcel does not exist in the store, so a later change in the materiality assessment requires reprocessing, and the count of parcels assessed cannot be stated. Keeping everything and filtering per framework also makes the exclusion list available, which is what supports the completeness assertion.

### What happens when the two consolidation boundaries genuinely differ?

They are recorded as separate fields on the parcel, as in the model above, and the difference is reported rather than reconciled away. A joint venture consolidated financially but not under operational control is a real situation with a real answer under each framework, and forcing them to agree misstates one of them. The important thing is that the difference is visible in the data model, so a reader comparing two totals can see why they differ.

### Is the GHG Protocol's Land Sector guidance a separate framework?

It functions as an extension rather than a replacement — it adds the land-specific accounting rules for removals, land use change, and biogenic carbon that the core standard leaves open. For a spatial MRV pipeline it is the more consequential document of the two, since it governs how a sequestration figure enters an inventory and how land use change emissions are attributed over time. Treat it as part of the Protocol requirement set rather than as a fourth framework.

### How far back does a comparative prior period have to be reproducible?

Under CSRD the immediately preceding period must be presented on a comparable basis, which means the pipeline must be able to produce a prior figure under current definitions — not merely retrieve what was published. That is a stronger requirement than it appears, because it means the prior period's inputs must still be reachable and reprocessable. Storing the parcel-level figures rather than only the totals satisfies most of it without a reprocessing run.

### Where do voluntary carbon credits sit relative to these frameworks?

Outside the inventory, and the separation is worth enforcing structurally. Credits purchased or retired are disclosed separately under ESRS E1 rather than netted against gross emissions, and the GHG Protocol has always required gross reporting. A pipeline that subtracts retired credits from a parcel-level emission figure has destroyed the gross number, which is the one every framework actually asks for. Keep credits in their own store and join them at reporting time.

### Which framework should a pipeline be built against first?

The one with the hardest evidence requirement, which is almost always CSRD where it applies and ISO 14064 where it does not. Building against the accounting standard alone produces correct numbers with an evidence trail that assurance will reject, and adding the trail afterwards means reprocessing every period that has already been reported. Building against the assurance requirement first produces a store that the accounting projections fall out of, at a cost concentrated in the first cycle rather than spread across three.

## Related guides

- [Carbon Registry Standards and Methodologies](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/) — the parent topic and the registry-side standards alongside these frameworks.
- [Mapping CSRD ESRS E1 Disclosures to Spatial MRV Outputs](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/mapping-csrd-esrs-e1-disclosures-to-spatial-mrv-outputs/) — the field-level mapping for the third framework.
- [Verra VM0047 vs Gold Standard GIS Requirements](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/carbon-registry-standards-and-methodologies/verra-vm0047-vs-gold-standard-gis-requirements/) — the crediting-side comparison that sits beside this one.
- [Tracking Data Lineage with OpenLineage for ESG Audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/) — the lineage layer the assurance chain depends on.
