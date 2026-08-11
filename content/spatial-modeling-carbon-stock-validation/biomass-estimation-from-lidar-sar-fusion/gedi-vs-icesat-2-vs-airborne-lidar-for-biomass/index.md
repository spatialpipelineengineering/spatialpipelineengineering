---
shortTitle: "GEDI vs ICESat-2 vs Airborne Lidar for Biomass"
title: "GEDI vs ICESat-2 vs Airborne Lidar for Biomass"
description: "A decision guide to the three lidar sources used in carbon MRV: what each actually measures, footprint geometry, sampling density, geolocation error, and which one a given crediting claim can defensibly rest on."
slug: gedi-vs-icesat-2-vs-airborne-lidar-for-biomass
type: guide
breadcrumb: "GEDI vs ICESat-2 vs Airborne"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# GEDI vs ICESat-2 vs Airborne Lidar for Biomass

The three lidar sources available for forest biomass are usually presented as a resolution-versus-cost trade, which is the least useful framing of the three differences that matter. They differ in what physical quantity they record, in how their samples are distributed in space, and in how well each sample is located on the ground — and those three properties, not resolution, decide whether a source can support a given claim. This guide compares them within [biomass estimation from lidar and SAR fusion](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/) in the [spatial modeling and carbon stock validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) stack.

None of the three measures biomass. All three measure something about the vertical arrangement of surfaces that intercept a laser pulse, and biomass is inferred from that by a model calibrated against destructive or allometric field data. The choice between them therefore determines the quality of the *predictor* going into that model, and a source that produces an excellent predictor in dense tropical forest can produce a nearly useless one in open woodland. Choosing on the basis of a published accuracy figure from a different biome is the most common error in this decision.

<svg viewBox="0 -4 940 268" role="img" aria-labelledby="lid-t lid-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="lid-t">What each lidar source actually records, as a footprint and a returned profile</title>
  <desc id="lid-d">Three panels comparing the measurement geometry of the three sources. GEDI is a full-waveform instrument with a footprint of roughly twenty-five metres, returning a continuous energy profile through the canopy from which relative height metrics are derived; its samples fall along discontinuous orbital tracks between fifty-one point six degrees north and south. ICESat-2 is a photon-counting instrument with a footprint of roughly eleven to seventeen metres, returning individual photon events that must be aggregated along track into segments before a canopy height can be estimated; it reaches the poles and revisits on a ninety-one day cycle. Airborne lidar is discrete-return or full-waveform at sub-metre footprint with high pulse density, producing a point cloud dense enough to model individual crowns; it covers only what was flown, when it was flown. A panel notes that the first two sample, and the third maps.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Three instruments, three different measurements</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Two of them sample the landscape. One of them maps it.</text>
    <rect x="12" y="50" width="298" height="198" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="50" width="298" height="198" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="28" y="74" fill="currentColor" font-size="10.5" font-weight="700">GEDI — full waveform</text>
    <text x="28" y="96" fill="currentColor" font-size="9.5" opacity="0.85">~25 m footprint, energy profile</text>
    <text x="28" y="114" fill="currentColor" font-size="9.5" opacity="0.85">relative height metrics RH50–RH98</text>
    <text x="28" y="132" fill="currentColor" font-size="9.5" opacity="0.85">tracks, not wall-to-wall</text>
    <text x="28" y="150" fill="currentColor" font-size="9.5" opacity="0.85">51.6° N to 51.6° S only</text>
    <path d="M32 172 C60 172 62 200 96 200 C130 200 132 176 160 176 C190 176 196 210 226 210 C256 210 262 182 292 182" fill="none" stroke="currentColor" stroke-width="1.7" opacity="0.85"/>
    <text x="28" y="232" fill="currentColor" font-size="9" opacity="0.72">a continuous return through the canopy</text>
    <rect x="322" y="50" width="298" height="198" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="322" y="50" width="298" height="198" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="338" y="74" fill="currentColor" font-size="10.5" font-weight="700">ICESat-2 — photon counting</text>
    <text x="338" y="96" fill="currentColor" font-size="9.5" opacity="0.85">~11–17 m footprint, single photons</text>
    <text x="338" y="114" fill="currentColor" font-size="9.5" opacity="0.85">aggregate along track into segments</text>
    <text x="338" y="132" fill="currentColor" font-size="9.5" opacity="0.85">91-day repeat, pole to pole</text>
    <text x="338" y="150" fill="currentColor" font-size="9.5" opacity="0.85">strong and weak beam pairs differ</text>
    <g fill="currentColor" opacity="0.8">
      <circle cx="344" cy="178" r="2"/><circle cx="360" cy="192" r="2"/><circle cx="376" cy="174" r="2"/><circle cx="392" cy="206" r="2"/><circle cx="408" cy="180" r="2"/><circle cx="424" cy="200" r="2"/><circle cx="440" cy="172" r="2"/><circle cx="456" cy="208" r="2"/><circle cx="472" cy="186" r="2"/><circle cx="488" cy="176" r="2"/><circle cx="504" cy="204" r="2"/><circle cx="520" cy="182" r="2"/><circle cx="536" cy="198" r="2"/><circle cx="552" cy="174" r="2"/><circle cx="568" cy="206" r="2"/><circle cx="584" cy="188" r="2"/><circle cx="600" cy="196" r="2"/>
    </g>
    <text x="338" y="232" fill="currentColor" font-size="9" opacity="0.72">discrete events, noisy until aggregated</text>
    <rect x="632" y="50" width="296" height="198" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="648" y="74" fill="currentColor" font-size="10.5" font-weight="700">Airborne — discrete return</text>
    <text x="648" y="96" fill="currentColor" font-size="9.5" opacity="0.85">sub-metre footprint, 5–30 pts/m²</text>
    <text x="648" y="114" fill="currentColor" font-size="9.5" opacity="0.85">crown-level structure resolvable</text>
    <text x="648" y="132" fill="currentColor" font-size="9.5" opacity="0.85">covers only what was flown</text>
    <text x="648" y="150" fill="#f3a712" font-size="9.5" font-weight="700">one date, then it ages</text>
    <g fill="currentColor" opacity="0.75">
      <circle cx="656" cy="196" r="1.4"/><circle cx="664" cy="184" r="1.4"/><circle cx="672" cy="204" r="1.4"/><circle cx="680" cy="178" r="1.4"/><circle cx="688" cy="192" r="1.4"/><circle cx="696" cy="172" r="1.4"/><circle cx="704" cy="200" r="1.4"/><circle cx="712" cy="186" r="1.4"/><circle cx="720" cy="176" r="1.4"/><circle cx="728" cy="206" r="1.4"/><circle cx="736" cy="190" r="1.4"/><circle cx="744" cy="174" r="1.4"/><circle cx="752" cy="202" r="1.4"/><circle cx="760" cy="182" r="1.4"/><circle cx="768" cy="196" r="1.4"/><circle cx="776" cy="170" r="1.4"/><circle cx="784" cy="208" r="1.4"/><circle cx="792" cy="188" r="1.4"/><circle cx="800" cy="176" r="1.4"/><circle cx="808" cy="200" r="1.4"/><circle cx="816" cy="184" r="1.4"/><circle cx="824" cy="194" r="1.4"/><circle cx="832" cy="172" r="1.4"/><circle cx="840" cy="206" r="1.4"/><circle cx="848" cy="180" r="1.4"/><circle cx="856" cy="198" r="1.4"/><circle cx="864" cy="186" r="1.4"/><circle cx="872" cy="176" r="1.4"/><circle cx="880" cy="202" r="1.4"/><circle cx="888" cy="190" r="1.4"/><circle cx="896" cy="178" r="1.4"/><circle cx="904" cy="200" r="1.4"/><circle cx="912" cy="188" r="1.4"/>
    </g>
    <text x="648" y="232" fill="currentColor" font-size="9" opacity="0.72">a point cloud, not a sample</text>
  </g>
</svg>

## Root Cause Analysis

Three properties explain nearly every disagreement between these sources when they are compared over the same forest.

**Footprint size interacts with canopy heterogeneity.** A 25 m GEDI footprint integrates whatever falls inside it — canopy, gap, understory, and terrain slope together. In closed tropical forest that averaging is benign, because the footprint is smaller than the scale over which structure varies. In fragmented or open canopy it is not: the same returned waveform can be produced by a uniformly medium-height stand and by a tall stand next to a clearing, and the biomass implied by those two is very different. This is why GEDI's published accuracy degrades sharply outside dense forest, and it is a property of the geometry rather than of the processing.

**Terrain slope contaminates the vertical profile.** A footprint on a slope receives ground returns spread over a vertical range equal to the footprint width times the tangent of the slope — on a 20-degree slope, a 25 m footprint smears the ground return across about nine metres. That smear is indistinguishable from low vegetation in the waveform, and it biases height metrics upward. Every serious GEDI workflow filters or corrects for slope, and workflows that do not produce a biomass map whose errors correlate with topography, which a verifier can and will see.

**Geolocation error moves the sample away from the thing it is supposed to describe.** GEDI footprint geolocation is accurate to roughly ten metres, ICESat-2 rather better, airborne lidar to well under a metre when the trajectory solution is good. Ten metres does not sound like much until the footprint is being matched to a field plot of similar size, at which point a substantial fraction of the calibration pairs describe partially different pieces of forest. The resulting model looks noisier than the instrument is, and the noise is attributed to the instrument rather than to the matching.

The practical consequence is that the three sources are not substitutes at all. Airborne lidar produces a map. GEDI and ICESat-2 produce samples that can calibrate or validate a map made from something else — usually SAR or optical imagery — and treating a spaceborne lidar product as if it were a map is the single most common structural error in this area.

## Diagnostic Pipeline / Pre-Flight Validation

Before selecting a source, establish whether the site's geometry and the claim's requirements are compatible with it. The checks below are the ones that reject a source outright, and running them takes minutes against a decision that costs a survey.

```python
from dataclasses import dataclass

import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class SiteProfile:
    """Physical properties of the project area that constrain source choice."""
    name: str
    centroid_lat: float
    area_ha: float
    mean_slope_deg: float
    canopy_closure: float        # 0–1, fraction of area with closed canopy
    mean_patch_ha: float         # mean contiguous forest patch size
    revisit_needed_days: int     # how often the claim must be refreshed


@dataclass(frozen=True)
class SourceVerdict:
    source: str
    usable: bool
    role: str                    # map | calibration | validation | none
    reasons: tuple[str, ...]


# Instrument geometry. These are structural properties, not tuning knobs.
GEDI_LAT_LIMIT = 51.6
GEDI_FOOTPRINT_M = 25.0
GEDI_GEOLOC_M = 10.0
ICESAT2_FOOTPRINT_M = 14.0
ICESAT2_REPEAT_DAYS = 91


def assess_gedi(site: SiteProfile) -> SourceVerdict:
    reasons: list[str] = []
    usable = True

    if abs(site.centroid_lat) > GEDI_LAT_LIMIT:
        return SourceVerdict(
            "gedi", False, "none",
            (f"site latitude {site.centroid_lat:.1f} is outside the "
             f"±{GEDI_LAT_LIMIT}° orbital coverage",),
        )

    if site.mean_slope_deg > 20.0:
        reasons.append(
            f"mean slope {site.mean_slope_deg:.0f}° smears the ground return "
            f"across ~{GEDI_FOOTPRINT_M * site.mean_slope_deg / 57.3:.0f} m; "
            "slope correction is mandatory, not optional"
        )

    if site.canopy_closure < 0.6:
        usable = False
        reasons.append(
            f"canopy closure {site.canopy_closure:.2f} is below 0.6 — the "
            "footprint averages canopy and gap, and height metrics stop "
            "discriminating biomass"
        )

    # A footprint that is large relative to the patch mostly measures the edge.
    footprint_ha = 3.14159 * (GEDI_FOOTPRINT_M / 2) ** 2 / 10_000
    if site.mean_patch_ha < footprint_ha * 20:
        usable = False
        reasons.append(
            f"mean patch {site.mean_patch_ha:.2f} ha is small relative to the "
            f"{footprint_ha:.3f} ha footprint; most shots straddle an edge"
        )

    return SourceVerdict(
        "gedi", usable, "calibration" if usable else "none", tuple(reasons)
    )


def assess_airborne(site: SiteProfile) -> SourceVerdict:
    reasons: list[str] = []

    # Airborne is always geometrically capable; the constraint is temporal.
    if site.revisit_needed_days < 365:
        reasons.append(
            f"claim needs refreshing every {site.revisit_needed_days} d; "
            "an airborne campaign is a single-date map and must be paired "
            "with a satellite source for change"
        )

    return SourceVerdict("airborne", True, "map", tuple(reasons))


def select_sources(site: SiteProfile) -> dict[str, SourceVerdict]:
    verdicts = {
        "gedi": assess_gedi(site),
        "airborne": assess_airborne(site),
    }
    for name, v in verdicts.items():
        log.info(
            "source.assessed", site=site.name, source=name,
            usable=v.usable, role=v.role, reasons=v.reasons,
        )
    return verdicts
```

The check that rejects most often is patch size relative to footprint. A project made of narrow riparian strips or smallholder mosaics will fail it, and no amount of processing recovers a signal the geometry never captured.

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="fit-t fit-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="fit-t">Which source fits which claim, by what the claim has to support</title>
  <desc id="fit-d">A matrix with four claim types down the left and the three sources across the top. A wall-to-wall stock map at project scale is supported by airborne lidar only; the two spaceborne sources can calibrate or validate such a map but cannot produce it. A national or jurisdictional stock estimate is well supported by GEDI within its latitude band and by ICESat-2 outside it, because a statistical sample is exactly what those instruments provide. Change detection between two dates is supported by neither spaceborne lidar on its own, because track geometry does not repeat over the same footprints, and by airborne only if flown twice. Validation of a SAR or optical biomass model is supported by all three, with airborne strongest. A note reads that a sample can calibrate a map but cannot replace one.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The choice is decided by the claim, not by the accuracy figure</text>
    <text x="300" y="46" fill="currentColor" font-size="10" font-weight="700" text-anchor="middle">GEDI</text>
    <text x="500" y="46" fill="currentColor" font-size="10" font-weight="700" text-anchor="middle">ICESat-2</text>
    <text x="700" y="46" fill="currentColor" font-size="10" font-weight="700" text-anchor="middle">Airborne</text>
    <text x="12" y="80" fill="currentColor" font-size="9.5" font-weight="600">Wall-to-wall map, project scale</text>
    <text x="12" y="122" fill="currentColor" font-size="9.5" font-weight="600">Jurisdictional stock estimate</text>
    <text x="12" y="164" fill="currentColor" font-size="9.5" font-weight="600">Change between two dates</text>
    <text x="12" y="206" fill="currentColor" font-size="9.5" font-weight="600">Validating a SAR/optical model</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">
    <rect x="216" y="60" width="168" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
    <text x="300" y="80" fill="currentColor" opacity="0.75">no — samples only</text>
    <rect x="416" y="60" width="168" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
    <text x="500" y="80" fill="currentColor" opacity="0.75">no — samples only</text>
    <rect x="616" y="60" width="168" height="30" rx="6" fill="#f3a712" opacity="0.18"/>
    <rect x="616" y="60" width="168" height="30" rx="6" fill="none" stroke="#f3a712" stroke-width="1.6"/>
    <text x="700" y="80" fill="currentColor" font-weight="700">yes</text>
    <rect x="216" y="102" width="168" height="30" rx="6" fill="currentColor" opacity="0.14"/>
    <text x="300" y="122" fill="currentColor" font-weight="700">yes, in band</text>
    <rect x="416" y="102" width="168" height="30" rx="6" fill="currentColor" opacity="0.14"/>
    <text x="500" y="122" fill="currentColor" font-weight="700">yes, incl. high lat</text>
    <rect x="616" y="102" width="168" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
    <text x="700" y="122" fill="currentColor" opacity="0.75">too costly at scale</text>
    <rect x="216" y="144" width="168" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
    <text x="300" y="164" fill="currentColor" opacity="0.75">tracks do not repeat</text>
    <rect x="416" y="144" width="168" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
    <text x="500" y="164" fill="currentColor" opacity="0.75">tracks do not repeat</text>
    <rect x="616" y="144" width="168" height="30" rx="6" fill="currentColor" opacity="0.14"/>
    <text x="700" y="164" fill="currentColor" font-weight="700">only if flown twice</text>
    <rect x="216" y="186" width="168" height="30" rx="6" fill="currentColor" opacity="0.14"/>
    <text x="300" y="206" fill="currentColor" font-weight="700">yes</text>
    <rect x="416" y="186" width="168" height="30" rx="6" fill="currentColor" opacity="0.14"/>
    <text x="500" y="206" fill="currentColor" font-weight="700">yes</text>
    <rect x="616" y="186" width="168" height="30" rx="6" fill="#f3a712" opacity="0.18"/>
    <rect x="616" y="186" width="168" height="30" rx="6" fill="none" stroke="#f3a712" stroke-width="1.6"/>
    <text x="700" y="206" fill="currentColor" font-weight="700">strongest</text>
  </g>
  <text x="12" y="238" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.8">A sample can calibrate a map. It cannot replace one — and a map made by interpolating between tracks is a model output, not a measurement.</text>
</svg>

## Deterministic Transformation Logic

Where two sources are combined — the usual arrangement, with spaceborne lidar calibrating a wall-to-wall SAR or optical predictor — the joining step is where most of the recoverable error lives. Two rules make that step defensible.

The first is that a lidar shot and a field plot may only be paired when their geolocation uncertainties overlap by less than a stated fraction of the footprint. Pairing everything within some generous radius inflates the apparent model error and, worse, biases it: mismatched pairs are more likely in heterogeneous forest, so the model is systematically less well constrained exactly where biomass varies most.

The second is that aggregation to the reporting unit happens after prediction, never before. Averaging height metrics across a stand and then applying an allometric relationship is not the same as applying the relationship per shot and then averaging, because the relationship is non-linear. The difference is a real bias with a predictable sign, and it is trivially avoided.

```python
import math
from dataclasses import dataclass


@dataclass(frozen=True)
class Shot:
    """One spaceborne lidar footprint with its geolocation uncertainty."""
    shot_id: str
    lon: float
    lat: float
    geoloc_sigma_m: float
    rh98_m: float
    quality_flag: int
    slope_deg: float


@dataclass(frozen=True)
class Plot:
    """One field inventory plot with a measured biomass density."""
    plot_id: str
    lon: float
    lat: float
    radius_m: float
    agb_mg_ha: float
    survey_year: int


def metres_between(a_lon: float, a_lat: float, b_lon: float, b_lat: float) -> float:
    """Local planar distance. Adequate at plot separations; do not use at scale."""
    mean_lat = math.radians((a_lat + b_lat) / 2)
    dx = (b_lon - a_lon) * 111_320 * math.cos(mean_lat)
    dy = (b_lat - a_lat) * 110_540
    return math.hypot(dx, dy)


def pair_shots_to_plots(
    shots: list[Shot],
    plots: list[Plot],
    *,
    max_slope_deg: float = 20.0,
    overlap_fraction: float = 0.5,
) -> list[tuple[Shot, Plot, float]]:
    """Pair each shot with at most one plot, refusing marginal geometry.

    A pair is admitted only when the centre separation leaves the footprint
    and the plot overlapping by more than `overlap_fraction`, allowing for
    the shot's own geolocation sigma. Unpaired shots are dropped, not
    relaxed into the set with a wider radius.
    """
    pairs: list[tuple[Shot, Plot, float]] = []

    for shot in shots:
        if shot.quality_flag != 1:
            continue
        if shot.slope_deg > max_slope_deg:
            continue

        best: tuple[Plot, float] | None = None
        for plot in plots:
            d = metres_between(shot.lon, shot.lat, plot.lon, plot.lat)
            # Effective tolerance: how far centres may be and still overlap.
            tolerance = (
                (GEDI_FOOTPRINT_M / 2 + plot.radius_m) * (1 - overlap_fraction)
                - shot.geoloc_sigma_m
            )
            if tolerance <= 0:
                continue
            if d <= tolerance and (best is None or d < best[1]):
                best = (plot, d)

        if best is not None:
            pairs.append((shot, best[0], best[1]))

    return pairs


def predict_then_aggregate(
    shots: list[Shot], coef_a: float, coef_b: float
) -> dict[str, float]:
    """Apply the allometry per shot, then aggregate. Never the reverse.

    agb = a * rh98 ** b is non-linear, so mean(f(x)) != f(mean(x)). Averaging
    height first understates biomass in a stand with mixed heights, by an
    amount that grows with the variance of the heights.
    """
    if not shots:
        return {"n": 0, "agb_mean_mg_ha": 0.0, "agb_naive_mg_ha": 0.0}

    per_shot = [coef_a * (s.rh98_m ** coef_b) for s in shots]
    mean_height = sum(s.rh98_m for s in shots) / len(shots)

    return {
        "n": float(len(shots)),
        "agb_mean_mg_ha": sum(per_shot) / len(per_shot),
        # Reported only so the bias is visible in the log, never used.
        "agb_naive_mg_ha": coef_a * (mean_height ** coef_b),
    }
```

Logging both the correct aggregate and the naive one during development is worth the two extra lines: on a stand with mixed heights the gap is often several percent, which is the same order as the effect a project is trying to detect.

## Compliance Gating & Audit Trail Generation

A verifier assessing a biomass figure derived from lidar will ask four questions, and a pipeline that cannot answer them from its own records will be asked to answer them from memory.

Which source produced each prediction, and at what date. A biomass map calibrated with 2021 airborne lidar and reported as a 2026 stock is making an unstated persistence assumption; recording the acquisition date per contributing observation makes the assumption explicit and the gap auditable.

How many calibration pairs survived the geometry filter, and how many were rejected. A model fitted on 40 admitted pairs out of 900 candidate shots is a different object from one fitted on 700, and the rejection rate is the single most informative number about whether the site suits the source.

What the slope and quality filters removed. Filters that remove a large, spatially clustered fraction of the shots leave a calibration set that is unrepresentative of the project area, and the resulting model is being extrapolated to terrain it never saw.

Whether any reporting unit received a prediction with no supporting observation within a stated distance. Interpolating across a gap is legitimate; doing so without recording it is not, and the gap map is what turns an interpolated figure into a stated assumption.

## Production Integration

In production the arrangement that survives audit is almost always the same shape: airborne lidar over a modest calibration area, a wall-to-wall predictor from SAR or optical imagery, and spaceborne lidar as an independent check on the predictor across the rest of the project. That configuration gives a map with a defensible error estimate, a change signal that refreshes at the satellite cadence, and a validation source that was not used in fitting — which is the property verifiers actually care about.

The temptation to skip the airborne leg is strong because it is the expensive one, and it is sometimes right to skip it: for a jurisdictional estimate where the claim is a population total rather than a map, a well-designed GEDI sample is both cheaper and statistically cleaner than a map of unknown local accuracy. The mistake is skipping it for a project-scale claim and then presenting an interpolated surface as though it were measured. See [fusing lidar point clouds with SAR for biomass estimation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/fusing-lidar-point-clouds-with-sar-for-biomass-estimation/) for the fusion mechanics, and [troubleshooting lidar-SAR coregistration drift](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/troubleshooting-lidar-sar-coregistration-drift/) for what goes wrong when the two layers are not aligned as well as the metadata claims.

<svg viewBox="0 -4 900 236" role="img" aria-labelledby="arch-t arch-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="arch-t">The production arrangement: calibrate, extend, and check independently</title>
  <desc id="arch-d">A flow in three columns. On the left, airborne lidar over a calibration subset plus field plots produces a fitted local allometry. In the centre, that allometry is transferred to a wall-to-wall SAR and optical predictor covering the whole project, producing the biomass map that is reported. On the right, spaceborne lidar shots that were withheld from fitting act as an independent check on the map, producing a residual distribution and a coverage statement. An arrow returns from the check to the map, labelled refit only when the check fails, with a note that reusing the check data in fitting destroys its value.</desc>
  <defs>
    <marker id="arch-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Calibrate on a subset, extend with a predictor, check with data you did not fit</text>
    <rect x="12" y="40" width="256" height="126" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="40" width="256" height="126" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="28" y="64" fill="currentColor" font-size="10.5" font-weight="700">Calibration subset</text>
    <text x="28" y="88" fill="currentColor" font-size="9.5" opacity="0.85">airborne lidar, one campaign</text>
    <text x="28" y="108" fill="currentColor" font-size="9.5" opacity="0.85">field plots, co-located</text>
    <text x="28" y="128" fill="currentColor" font-size="9.5" opacity="0.85">→ fitted local allometry</text>
    <text x="28" y="152" fill="currentColor" font-size="9" opacity="0.7">5–15% of project area</text>
    <rect x="322" y="40" width="256" height="126" rx="9" fill="currentColor" opacity="0.14"/>
    <rect x="322" y="40" width="256" height="126" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <text x="338" y="64" fill="currentColor" font-size="10.5" font-weight="700">Wall-to-wall predictor</text>
    <text x="338" y="88" fill="currentColor" font-size="9.5" opacity="0.85">SAR backscatter + optical</text>
    <text x="338" y="108" fill="currentColor" font-size="9.5" opacity="0.85">refreshes at satellite cadence</text>
    <text x="338" y="128" fill="currentColor" font-size="9.5" opacity="0.85">→ the reported biomass map</text>
    <text x="338" y="152" fill="currentColor" font-size="9" opacity="0.7">100% of project area</text>
    <rect x="632" y="40" width="256" height="126" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="648" y="64" fill="currentColor" font-size="10.5" font-weight="700">Independent check</text>
    <text x="648" y="88" fill="currentColor" font-size="9.5" opacity="0.85">withheld spaceborne shots</text>
    <text x="648" y="108" fill="currentColor" font-size="9.5" opacity="0.85">→ residual distribution</text>
    <text x="648" y="128" fill="currentColor" font-size="9.5" opacity="0.85">→ coverage statement</text>
    <text x="648" y="152" fill="#f3a712" font-size="9" font-weight="700">never used in fitting</text>
    <rect x="12" y="182" width="876" height="46" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="182" width="876" height="46" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="450" y="210" text-anchor="middle" fill="currentColor" font-size="9.5" opacity="0.85">Refit only when the check fails — and if the check data enters the fit, the project no longer has a check.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#arch-arrow)">
    <line x1="268" y1="103" x2="320" y2="103"/><line x1="578" y1="103" x2="630" y2="103"/>
  </g>
</svg>

## Frequently Asked Questions

### Can GEDI be used to make a biomass map directly?

Not without an interpolation step that changes what the product is. GEDI samples along orbital tracks with large unsampled gaps between them, so any wall-to-wall surface derived from GEDI alone is the output of a spatial model fitted to those samples, and its accuracy away from the tracks is governed by that model rather than by the instrument. This is legitimate when it is labelled as such and its interpolation error is reported. It becomes a problem when the resulting raster is described as a lidar biomass map, because a reader reasonably assumes lidar measured the pixels.

### Why does ICESat-2 need along-track aggregation when GEDI does not?

Because they measure differently. GEDI records the full returned waveform for each footprint, so a single shot already contains a complete vertical profile. ICESat-2 detects individual photons, and a single photon carries almost no information — canopy height only emerges once enough photons are aggregated along track to separate the canopy surface from the ground surface statistically. That aggregation length, typically tens to a hundred metres, becomes the effective resolution, and it is longer for the weak beams than the strong ones.

### How much does terrain slope actually cost?

Enough to dominate the error budget in hilly terrain. The ground return spreads vertically by roughly the footprint width times the tangent of the slope, so a 25 m footprint on a 25-degree slope smears ground echoes across about twelve metres — comparable to the canopy height being measured. Height metrics inflate, biomass inflates with them, and the inflation correlates with topography, which makes it visible as a pattern rather than as noise. Filtering above about 20 degrees is common; correcting rather than filtering preserves more shots but requires a terrain model good enough to trust.

### Is airborne lidar from five years ago still usable?

For structure that has not changed, yes; the difficulty is knowing which parts have not. Airborne lidar ages in an uneven way: undisturbed stands grow slowly and predictably, while disturbed areas change completely. The workable approach is to pair the old lidar with a satellite change layer covering the interval, treat unchanged areas as still described by the lidar, and exclude changed areas from calibration entirely. Applying a blanket growth increment across the whole survey is the approach that fails review, because it assumes exactly the thing the change layer was there to establish.

### Which source is best for detecting degradation rather than deforestation?

Airborne lidar, by a wide margin, and it is one of the few things only lidar can do well. Degradation removes biomass without removing canopy cover, so optical change detection sees little and SAR sees an ambiguous signal. A repeat airborne survey measures the vertical structure directly and shows the loss unambiguously. Spaceborne lidar cannot substitute here because its tracks do not repeat over the same footprints, so there is no before-and-after pair at a given location — only two samples of a population, which detects landscape-scale change but not stand-scale degradation.

### Does combining GEDI and ICESat-2 improve a calibration set?

It increases the sample size, and it adds a subtlety that has to be handled: the two instruments produce height metrics that are not interchangeable. A GEDI RH98 and an ICESat-2 canopy height from photon aggregation are different quantities derived by different means, and pooling them without a cross-calibration term treats a systematic offset as random scatter. Fit an instrument term, or fit separate models and compare — but do not concatenate the two into one column and proceed.

### What sample size makes a spaceborne lidar calibration defensible?

Fewer than a hundred admitted pairs is difficult to defend for anything other than a coarse stratum estimate, and the number matters less than its spatial and structural spread. A thousand pairs all drawn from mature closed canopy constrain the model only over mature closed canopy, and the biomass classes that matter most for a crediting claim — regrowth, degraded stands, the low end — are usually the least represented. Report the distribution of the calibration set across biomass classes alongside the count, and expect a verifier to look at the sparse end.

## Related guides

- [Biomass Estimation from Lidar SAR Fusion](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/) — the parent topic and the fusion architecture this decision feeds.
- [Fusing Lidar Point Clouds with SAR for Biomass Estimation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/fusing-lidar-point-clouds-with-sar-for-biomass-estimation/) — the mechanics of extending a lidar calibration wall-to-wall.
- [Troubleshooting Lidar SAR Coregistration Drift](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/troubleshooting-lidar-sar-coregistration-drift/) — what the geolocation tolerances in this guide are protecting against.
- [Designing Field Plot Sampling for Model Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/designing-field-plot-sampling-for-model-validation/) — how to build the plot set the calibration pairs come from.
