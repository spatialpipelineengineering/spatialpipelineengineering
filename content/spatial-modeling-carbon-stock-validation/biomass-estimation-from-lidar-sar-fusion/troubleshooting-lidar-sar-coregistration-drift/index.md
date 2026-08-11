---
shortTitle: "Troubleshooting LiDAR-SAR Coregistration Drift"
title: "Troubleshooting LiDAR–SAR Coregistration Drift"
description: "Diagnose and correct sub-pixel to multi-pixel misregistration between LiDAR canopy height and SAR backscatter that inflates fused biomass RMSE, using phase cross-correlation shift estimation and audited affine correction."
slug: troubleshooting-lidar-sar-coregistration-drift
type: guide
breadcrumb: "Troubleshooting Coregistration Drift"
datePublished: 2026-07-14
dateModified: 2026-07-14
---
# Troubleshooting LiDAR–SAR Coregistration Drift

Coregistration drift is the quietest way to poison a fused biomass product. When LiDAR-derived canopy height and SAR backscatter no longer sit on the same physical footprint, the height-to-backscatter relationship the model was trained on decorrelates, and aboveground biomass (AGB) error inflates without any single pixel looking obviously wrong. This guide is the corrective procedure under [Biomass Estimation from LiDAR–SAR Fusion](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/), the multi-sensor synthesis stage of the [Spatial Modeling & Carbon Stock Validation](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/) framework. It exists because drift is not a modelling problem you can regularise away — it is a geometric fault that must be measured and reversed before any regression runs.

Left unaddressed, a half-pixel offset at 10 m resolution smears every canopy edge against radar texture, and a two-pixel offset can double the fused biomass RMSE across fragmented landscapes while summary statistics stay flat. The corrective loop below belongs upstream of [ground-truth alignment for carbon models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/), which cannot calibrate plot-to-pixel agreement on a stack that is still spatially inconsistent. The engineering objective is a validated, coregistered feature stack whose residual shift is provably within a declared tolerance and whose correction is recorded as an auditable transform, not an ad-hoc nudge.

<svg viewBox="0 0 1000 320" role="img" aria-labelledby="cd-t cd-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cd-t">LiDAR-SAR coregistration drift detection and correction flow</title>
  <desc id="cd-d">A LiDAR canopy height model and SAR backscatter, in mixed CRS and grids, are resampled onto a common equal-area grid. A phase cross-correlation step estimates the subpixel shift between them. A decision gate asks whether the shift magnitude is within tolerance: if yes, the pair passes straight to a validated, audited fused stack. If no, an affine correction is applied and the alignment is re-verified against a cross-correlation floor; a pass routes to the audited fused stack while a failure rejects the tile.</desc>
  <defs>
    <marker id="cd-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <!-- pipeline boxes -->
    <g fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="12" y="118" width="130" height="66" rx="9"/>
      <rect x="158" y="118" width="130" height="66" rx="9"/>
      <rect x="304" y="118" width="140" height="66" rx="9"/>
      <rect x="436" y="236" width="150" height="62" rx="9"/>
    </g>
    <!-- decision diamonds -->
    <polygon points="516,151 574,111 632,151 574,191" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <polygon points="700,267 748,231 796,267 748,303" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <!-- reject box (dashed) -->
    <rect x="836" y="236" width="152" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
    <!-- audited output (amber) -->
    <rect x="812" y="40" width="176" height="72" rx="9" fill="none" stroke="#f3a712" stroke-width="2.5"/>
    <!-- box titles -->
    <g fill="currentColor" font-size="11.5" font-weight="600">
      <text x="77" y="147">CHM &amp; SAR &#963;&#8304;</text>
      <text x="223" y="147">Resample to grid</text>
      <text x="374" y="147">Estimate shift</text>
      <text x="511" y="263">Apply correction</text>
      <text x="574" y="155">shift &#8804; tol?</text>
      <text x="748" y="271">corr &#8805; gate?</text>
    </g>
    <text x="900" y="72" fill="#f3a712" font-size="12" font-weight="700">Validated fused stack</text>
    <text x="912" y="271" fill="currentColor" font-size="11.5" font-weight="600">Reject tile</text>
    <!-- subtitles -->
    <g fill="currentColor" font-size="9.5" opacity="0.72">
      <text x="77" y="165">mixed CRS &#183; grids</text>
      <text x="223" y="165">equal-area &#183; 10 m</text>
      <text x="374" y="165">phase cross-corr</text>
      <text x="511" y="281">affine translation</text>
      <text x="900" y="90">coregistered &#183; audited</text>
      <text x="912" y="289">log + halt</text>
    </g>
  </g>
  <!-- connectors -->
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#cd-arrow)">
    <line x1="142" y1="151" x2="156" y2="151"/>
    <line x1="288" y1="151" x2="302" y2="151"/>
    <line x1="444" y1="151" x2="514" y2="151"/>
    <path d="M574 111 C 574 60, 700 76, 810 76"/>
    <path d="M574 191 C 574 236, 528 236, 511 234"/>
    <line x1="586" y1="267" x2="646" y2="267"/>
    <path d="M748 231 C 748 150, 812 90, 812 90"/>
    <line x1="796" y1="267" x2="834" y2="267"/>
  </g>
  <!-- branch labels -->
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="10" font-weight="600">
    <text x="628" y="70" fill="#f3a712">yes</text>
    <text x="548" y="222" fill="currentColor" opacity="0.8">no</text>
    <text x="770" y="180" fill="#f3a712">pass</text>
    <text x="815" y="255" fill="currentColor" opacity="0.8">fail</text>
  </g>
</svg>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Diagnose and correct LiDAR-SAR coregistration drift for fused biomass",
  "description": "Resample LiDAR canopy height and SAR backscatter to a common equal-area grid, estimate the subpixel shift with phase cross-correlation, apply an audited affine correction when drift exceeds tolerance, gate on an improved cross-correlation, and record the transform for MRV verification.",
  "totalTime": "PT40M",
  "tool": [
    { "@type": "HowToTool", "name": "Python 3.11+" },
    { "@type": "HowToTool", "name": "rasterio" },
    { "@type": "HowToTool", "name": "scikit-image" },
    { "@type": "HowToTool", "name": "pyproj" },
    { "@type": "HowToTool", "name": "structlog" }
  ],
  "step": [
    { "@type": "HowToStep", "name": "Ingest", "text": "Pull the CHM and SAR products by identifier, verify checksums, and record the source CRS and grid geometry of each layer." },
    { "@type": "HowToStep", "name": "Diagnose", "text": "Confirm CRS and resolution parity, read the shared overlap window, and estimate the subpixel (dy, dx) shift with phase cross-correlation, flagging drift beyond tolerance." },
    { "@type": "HowToStep", "name": "Transform", "text": "Reproject both layers to a common equal-area grid and apply the estimated shift as an affine translation to the SAR layer." },
    { "@type": "HowToStep", "name": "Validate", "text": "Re-estimate cross-correlation after correction and gate on both a material improvement and an absolute alignment floor." },
    { "@type": "HowToStep", "name": "Export", "text": "Write the coregistered CHM and SAR bands to a versioned raster with the correction transform stamped into metadata." },
    { "@type": "HowToStep", "name": "Submit", "text": "Attach the signed coregistration audit record and forward the validated stack to the fusion regression and registry queue." }
  ]
}
</script>

## Root Cause Analysis

Drift is a symptom with several distinct causes, and treating them as one leads to over-correction that manufactures its own error. The most common source is geolocation and orbit error in the SAR product. Sentinel-1 and ALOS-2 geocoding relies on a precise orbit ephemeris and a reference DEM; when the orbit state vectors are predicted rather than restituted, or when the scene is processed against a coarse global DEM, the geocoded pixel can land tens of metres from its true ground position. That offset is spatially coherent, so it presents as a clean translational shift rather than random scatter — which is precisely why cross-correlation can recover it.

Terrain effects are the second cause and the hardest to fully reverse. In steep or mountainous terrain, SAR layover and foreshortening displace backscatter towards the sensor, and the magnitude of that displacement varies with local slope and aspect. Unlike a global orbit offset, terrain-induced drift is spatially variable: a single (dy, dx) translation will reduce the mean error but leave residual, slope-correlated misalignment along ridgelines. When the terrain component dominates, the correct response is to re-run range-Doppler terrain correction against a better DEM, not to force a global shift that trades ridge error for valley error.

The third cluster of causes is grid and datum handling inside the pipeline itself. A DEM error propagates directly into the SAR geocoding solution; a datum mismatch — for example treating an `EPSG:4326` product as if it were already on the LiDAR datum — introduces a systematic offset that looks like drift but is actually a silent transform bug, the same class of fault covered in [debugging silent datum shifts in carbon pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/debugging-silent-datum-shifts-in-carbon-pipelines/). Naive resampling adds a fourth: nearest-neighbour reprojection onto a mismatched grid origin can shear the two layers by up to half a pixel before any true drift is even considered. Diagnosis therefore has to separate a coherent translational offset (correctable by a shift) from a spatially variable geometric distortion (not correctable by a shift) before deciding what to do.

## Diagnostic Pipeline / Pre-Flight Validation

The diagnostic step measures drift as a signed, subpixel quantity rather than asserting alignment on faith. It first enforces CRS and resolution parity — cross-correlation is only meaningful when both rasters occupy the same projection and pixel size — then reads the shared overlap window and estimates the shift with `phase_cross_correlation`, which locates the correlation peak in the frequency domain and refines it to subpixel precision. The returned `(dy, dx)` is the translation that aligns the moving SAR layer onto the reference CHM; its magnitude, compared against tolerance, decides whether the tile is admitted, corrected, or escalated.

```python
import numpy as np
import rasterio
from rasterio.windows import from_bounds
from pyproj import CRS
from skimage.registration import phase_cross_correlation
import structlog

log = structlog.get_logger()

DRIFT_TOLERANCE_PX = 0.5      # max admissible residual coregistration shift
UPSAMPLE_FACTOR = 20          # subpixel resolution of the cross-correlation peak


def estimate_coregistration_drift(
    chm_path: str, sar_path: str, expected_res_m: float = 10.0
) -> dict:
    """Estimate the (dy, dx) pixel shift between a LiDAR CHM and SAR backscatter.

    Both rasters must already share a CRS and grid resolution. Returns a report
    carrying the subpixel offset in pixels and metres and a boolean flag when the
    shift magnitude exceeds the declared tolerance.
    """
    with rasterio.open(chm_path) as chm, rasterio.open(sar_path) as sar:
        # 1. CRS parity — a silent datum mismatch masquerades as physical drift.
        chm_crs, sar_crs = CRS.from_user_input(chm.crs), CRS.from_user_input(sar.crs)
        if chm_crs != sar_crs:
            log.error("crs_mismatch", chm=chm_crs.to_epsg(), sar=sar_crs.to_epsg())
            raise ValueError("Inputs must share a CRS before drift estimation")

        # 2. Resolution parity — a scale difference biases the peak location, so a
        #    shift measured on mismatched pixel sizes is not interpretable.
        if (abs(chm.res[0] - expected_res_m) > 1e-6
                or abs(chm.res[0] - sar.res[0]) > 1e-6):
            log.error("resolution_mismatch", chm_res=chm.res, sar_res=sar.res)
            raise ValueError("CHM and SAR must be resampled to a common resolution")

        # 3. Read the shared overlap window from both rasters.
        left = max(chm.bounds.left, sar.bounds.left)
        bottom = max(chm.bounds.bottom, sar.bounds.bottom)
        right = min(chm.bounds.right, sar.bounds.right)
        top = min(chm.bounds.top, sar.bounds.top)
        if right <= left or top <= bottom:
            raise ValueError("No spatial overlap between CHM and SAR")

        chm_win = chm.read(1, window=from_bounds(left, bottom, right, top, chm.transform))
        sar_win = sar.read(1, window=from_bounds(left, bottom, right, top, sar.transform))

    # 4. Trim to a common shape and standardise; NaNs corrupt the FFT peak.
    rows = min(chm_win.shape[0], sar_win.shape[0])
    cols = min(chm_win.shape[1], sar_win.shape[1])
    ref = np.nan_to_num(chm_win[:rows, :cols].astype("float64"))
    mov = np.nan_to_num(sar_win[:rows, :cols].astype("float64"))
    ref = (ref - ref.mean()) / (ref.std() + 1e-9)
    mov = (mov - mov.mean()) / (mov.std() + 1e-9)

    # 5. Subpixel phase cross-correlation: (dy, dx) aligns `mov` onto `ref`.
    shift, error, _ = phase_cross_correlation(ref, mov, upsample_factor=UPSAMPLE_FACTOR)
    dy, dx = float(shift[0]), float(shift[1])
    magnitude_px = float(np.hypot(dy, dx))
    drift_flagged = magnitude_px > DRIFT_TOLERANCE_PX

    report = {
        "shift_dy_px": round(dy, 3),
        "shift_dx_px": round(dx, 3),
        "shift_dy_m": round(dy * expected_res_m, 3),
        "shift_dx_m": round(dx * expected_res_m, 3),
        "magnitude_px": round(magnitude_px, 3),
        "phase_error": round(float(error), 4),
        "tolerance_px": DRIFT_TOLERANCE_PX,
        "drift_flagged": drift_flagged,
    }
    log.info("coregistration_drift_estimated", **report)
    return report
```

Two guards keep this diagnostic honest. A high `phase_error` — the normalised RMS of the correlation peak — signals that the two layers share little structure in this window (deep shadow, water, or genuine terrain distortion), so the shift estimate should not be trusted even if its magnitude looks small. And because the estimator can only recover a coherent translation, a tile that reports low drift here but still fuses poorly downstream is a strong indicator of the spatially variable terrain distortion described above, which must be routed back to geocoding rather than corrected with a shift.

<svg viewBox="0 -4 880 216" role="img" aria-labelledby="dft-t dft-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="dft-t">Four drift patterns and the cause each one points to</title>
  <desc id="dft-d">Four spatial patterns of coregistration residual vectors across a scene. A uniform shift, where every vector points the same way with the same length, indicates a constant geolocation offset and is corrected by a translation. A rotational pattern, where vectors circle a centre, indicates an orbit or attitude error. A terrain-correlated pattern, where vector length scales with slope, indicates a wrong or misaligned elevation model in the terrain correction. A random pattern with no structure indicates matching noise rather than drift, and is not correctable by any transform. A panel notes that plotting the residual field before fitting any correction is the single most useful diagnostic, because the pattern names the cause.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Plot the residual field before fitting anything</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">The pattern names the cause; the magnitude does not.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.6">
    <g>
      <rect x="12" y="52" width="200" height="104" rx="8" fill="currentColor" opacity="0.04" stroke-width="1.1"/>
      <line x1="46" y1="86" x2="72" y2="98"/><line x1="106" y1="86" x2="132" y2="98"/><line x1="166" y1="86" x2="192" y2="98"/>
      <line x1="46" y1="122" x2="72" y2="134"/><line x1="106" y1="122" x2="132" y2="134"/><line x1="166" y1="122" x2="192" y2="134"/>
    </g>
    <g>
      <rect x="228" y="52" width="200" height="104" rx="8" fill="currentColor" opacity="0.04" stroke-width="1.1"/>
      <line x1="262" y1="80" x2="284" y2="70"/><line x1="322" y1="74" x2="348" y2="78"/><line x1="382" y1="82" x2="398" y2="102"/>
      <line x1="258" y1="128" x2="278" y2="140"/><line x1="322" y1="136" x2="348" y2="132"/><line x1="386" y1="128" x2="400" y2="112"/>
    </g>
    <g>
      <rect x="444" y="52" width="200" height="104" rx="8" fill="currentColor" opacity="0.04" stroke-width="1.1"/>
      <line x1="474" y1="86" x2="482" y2="90"/><line x1="534" y1="86" x2="556" y2="98"/><line x1="594" y1="86" x2="632" y2="108"/>
      <line x1="474" y1="126" x2="480" y2="129"/><line x1="534" y1="126" x2="552" y2="136"/><line x1="594" y1="126" x2="628" y2="146"/>
    </g>
    <g>
      <rect x="660" y="52" width="208" height="104" rx="8" fill="currentColor" opacity="0.04" stroke-width="1.1"/>
      <line x1="692" y1="82" x2="704" y2="94"/><line x1="756" y1="88" x2="742" y2="76"/><line x1="820" y1="80" x2="836" y2="92"/>
      <line x1="692" y1="130" x2="680" y2="120"/><line x1="756" y1="126" x2="770" y2="138"/><line x1="820" y1="132" x2="806" y2="122"/>
    </g>
  </g>
  <g font-family="system-ui, sans-serif" text-anchor="middle" font-size="9.5">
    <text x="112" y="176" fill="currentColor" font-weight="700">Uniform shift</text>
    <text x="112" y="194" fill="currentColor" opacity="0.85">geolocation offset → translate</text>
    <text x="328" y="176" fill="currentColor" font-weight="700">Rotational</text>
    <text x="328" y="194" fill="currentColor" opacity="0.85">orbit or attitude error</text>
    <text x="544" y="176" fill="currentColor" font-weight="700">Scales with slope</text>
    <text x="544" y="194" fill="currentColor" opacity="0.85">wrong elevation model</text>
    <text x="764" y="176" fill="#f3a712" font-weight="700">No structure</text>
    <text x="764" y="194" fill="currentColor" opacity="0.85">matching noise — not correctable</text>
  </g>
</svg>

## Deterministic Transformation Logic

Once drift is measured and attributed to a coherent offset, the correction is deterministic: reproject both layers onto a common equal-area grid so that later area-weighted biomass sums are honest, apply the estimated shift to the SAR layer as an affine translation, and re-verify that alignment actually improved. Using an equal-area CRS such as `EPSG:6933` rather than the native UTM keeps per-pixel area constant across the tile, which matters because the fused product is ultimately integrated to tonnes. The correction is gated: it must both raise the normalised cross-correlation and clear an absolute floor, otherwise the tile is rejected rather than silently shipped with a shift that did nothing.

```python
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.transform import Affine
import structlog

log = structlog.get_logger()

EQUAL_AREA_CRS = "EPSG:6933"   # World Cylindrical Equal Area — area-true for AGB sums
CORR_GATE = 0.60               # minimum normalised cross-correlation after correction


def _reproject_to_grid(src_path: str, dst_crs: str, res_m: float):
    """Reproject band 1 of a raster onto a fresh grid at the target resolution."""
    with rasterio.open(src_path) as src:
        transform, width, height = calculate_default_transform(
            src.crs, dst_crs, src.width, src.height, *src.bounds, resolution=res_m)
        dst = np.empty((height, width), dtype="float32")
        reproject(source=rasterio.band(src, 1), destination=dst,
                  src_transform=src.transform, src_crs=src.crs,
                  dst_transform=transform, dst_crs=dst_crs,
                  resampling=Resampling.cubic)
    return dst, transform


def _ncc(a: np.ndarray, b: np.ndarray) -> float:
    """Normalised cross-correlation over the common footprint."""
    a = np.nan_to_num(a.astype("float64"))
    b = np.nan_to_num(b.astype("float64"))
    a = (a - a.mean()) / (a.std() + 1e-9)
    b = (b - b.mean()) / (b.std() + 1e-9)
    return float((a * b).mean())


def correct_coregistration(
    chm_path: str, sar_path: str, shift_dy_dx: tuple[float, float],
    out_path: str, dst_crs: str = EQUAL_AREA_CRS, res_m: float = 10.0,
) -> dict:
    """Reproject both layers to a common equal-area grid, apply the estimated
    affine translation to SAR, and gate on an improved cross-correlation."""
    chm, chm_tf = _reproject_to_grid(chm_path, dst_crs, res_m)
    sar, sar_tf = _reproject_to_grid(sar_path, dst_crs, res_m)
    log.info("reprojected_to_common_grid", crs=dst_crs, res_m=res_m,
             chm_shape=chm.shape, sar_shape=sar.shape)

    rows, cols = min(chm.shape[0], sar.shape[0]), min(chm.shape[1], sar.shape[1])
    chm, sar = chm[:rows, :cols], sar[:rows, :cols]
    ncc_before = _ncc(chm, sar)

    # Apply the (dy, dx) shift as an affine translation on the SAR grid, then
    # resample back onto the CHM grid so both bands share one transform.
    dy, dx = shift_dy_dx
    corrected_tf = sar_tf * Affine.translation(dx, dy)
    shifted = np.empty_like(sar)
    reproject(source=sar, destination=shifted,
              src_transform=corrected_tf, src_crs=dst_crs,
              dst_transform=chm_tf, dst_crs=dst_crs,
              resampling=Resampling.cubic)
    ncc_after = _ncc(chm, shifted)

    # Gate: the correction must materially improve alignment AND clear the floor.
    if ncc_after < ncc_before or ncc_after < CORR_GATE:
        log.error("coregistration_gate_failed", ncc_before=round(ncc_before, 4),
                  ncc_after=round(ncc_after, 4), gate=CORR_GATE)
        raise RuntimeError("Correction did not improve alignment past the gate")

    profile = {"driver": "GTiff", "height": rows, "width": cols, "count": 2,
               "dtype": "float32", "crs": dst_crs, "transform": chm_tf}
    with rasterio.open(out_path, "w", **profile) as dst:
        dst.write(chm.astype("float32"), 1)     # band 1: reference CHM
        dst.write(shifted.astype("float32"), 2)  # band 2: corrected SAR
    log.info("coregistration_corrected", out_path=out_path,
             shift_dy=dy, shift_dx=dx,
             ncc_before=round(ncc_before, 4), ncc_after=round(ncc_after, 4))
    return {"ncc_before": ncc_before, "ncc_after": ncc_after, "out_path": out_path}
```

The `Affine.translation(dx, dy)` step is where discipline pays off: applying the shift to the SAR transform and then resampling onto the CHM grid guarantees both bands end up on one identical geotransform, so the fused stack is self-consistent by construction. Cubic resampling preserves the backscatter gradients the regression reads; nearest-neighbour would reintroduce edge aliasing that mimics the very drift being corrected.

## Compliance Gating & Audit Trail Generation

A correction that is not recorded is indistinguishable from tampering under third-party review. Every coregistration run therefore emits an append-only record binding the measured shift, the before-and-after cross-correlation, and the resampling parameters to the input checksums, so a verifier can reconstruct exactly what was moved and by how much. Under ISO 14064-3 this is the geometric-consistency evidence that underpins any positional-accuracy claim; under Verra VM-series methodologies it substantiates that the AGB surface was built on spatially reconciled inputs; and where the shift is material it must be traceable so that its downstream effect on reported tonnage is auditable rather than hidden.


| Gate | Measured quantity | Pass condition | Compliance mapping |
|---|---|---|---|
| Drift tolerance | `magnitude_px` | &#8804; 0.5 px residual | ISO 14064-3 positional accuracy |
| Alignment floor | `ncc_after` | &#8805; 0.60 and &gt; `ncc_before` | Verra VM-series input reconciliation |
| Attribution | `phase_error` | below noise threshold | terrain-distortion escalation record |
| Provenance | input SHA-256 + transform | recorded to audit log | CSRD ESRS E1 data lineage |


The gate must fail loudly. A tile whose corrected cross-correlation clears the floor is written with its transform stamped into metadata and forwarded; a tile that cannot be aligned by translation is rejected and escalated to terrain re-correction, never coerced. That escalation flag, and the residual shift on accepted tiles, both feed the uncertainty budget consumed by [emission factor uncertainty mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/), so that residual misregistration is propagated as variance rather than pretended away.

## Production Integration

In production the corrective loop runs as a fixed, containerised sequence with pinned dependencies, so every coregistration decision is reproducible byte-for-byte. Each tile follows the same six-step contract:

1. **Ingest** — pull the CHM and SAR products by identifier, verify SHA-256 checksums, and record the native CRS, grid origin, and resolution of each layer as source provenance.
2. **Diagnose** — enforce CRS and resolution parity, read the shared overlap window, and run `estimate_coregistration_drift`; admit tiles within tolerance directly and flag the rest for correction.
3. **Transform** — for flagged tiles, run `correct_coregistration` to reproject both layers onto the common equal-area grid and apply the estimated affine translation to the SAR band.
4. **Validate** — re-estimate cross-correlation after the shift and gate on both a material improvement and the absolute floor; reject and escalate any tile that fails, routing suspected terrain distortion back to range-Doppler geocoding.
5. **Export** — write the coregistered two-band stack to versioned, immutable object storage with the correction transform, tolerance, and gate metrics stamped into metadata.
6. **Submit** — attach the signed coregistration audit record and forward the validated stack to the fusion regression and the registry submission queue.

Batch execution chunks tiles through a scheduler, but the contract is per-tile so that a single drifted scene can never contaminate a neighbour. Read SAR windowed to the LiDAR footprint rather than whole-scene to keep memory bounded across thousands of tiles, and cache the measured shift alongside the tile identifier so re-runs skip re-estimation when inputs are unchanged. With this loop in place, coregistration drift stops being an invisible tax on biomass RMSE and becomes a measured, corrected, and audited property of every fused surface.

<svg viewBox="0 -4 880 212" role="img" aria-labelledby="cost-t2 cost-d2" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cost-t2">Coregistration offset against biomass model bias, by landscape heterogeneity</title>
  <desc id="cost-d2">A chart of resulting biomass bias against coregistration offset from 0 to 30 metres, for three landscape types. In a homogeneous plantation the bias stays under 1 percent even at 30 metres, because neighbouring pixels are similar. In a mixed natural forest the bias reaches 6 percent at 20 metres. In a fragmented mosaic with small patches the bias reaches 17 percent at 20 metres and 24 percent at 30. A threshold line marks a 5 percent materiality level. A panel notes that the same offset is harmless in one landscape and disqualifying in another, so an acceptable offset must be derived from the landscape rather than adopted as a constant.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The same offset is harmless or disqualifying, depending on the landscape</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Resulting biomass bias against coregistration offset.</text>
  </g>
  <g stroke="currentColor" stroke-width="1" opacity="0.22">
    <line x1="80" y1="60" x2="560" y2="60"/><line x1="80" y1="102" x2="560" y2="102"/>
  </g>
  <line x1="80" y1="144" x2="560" y2="144" stroke="#f3a712" stroke-width="1.8" stroke-dasharray="5,4"/>
  <text x="566" y="148" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f3a712">5% materiality</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="50" x2="80" y2="174"/>
    <line x1="80" y1="174" x2="560" y2="174"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="64" text-anchor="end">25%</text>
    <text x="72" y="106" text-anchor="end">15%</text>
    <text x="72" y="148" text-anchor="end">5%</text>
    <text x="80" y="192" text-anchor="middle">0 m</text>
    <text x="240" y="192" text-anchor="middle">10 m</text>
    <text x="400" y="192" text-anchor="middle">20 m</text>
    <text x="560" y="192" text-anchor="middle">30 m</text>
  </g>
  <polyline points="80,174 240,171 400,169 560,168" fill="none" stroke="currentColor" stroke-width="2.6" stroke-dasharray="7,4"/>
  <polyline points="80,174 240,158 400,138 560,124" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <polyline points="80,174 240,132 400,102 560,72" fill="none" stroke="#f3a712" stroke-width="2.8"/>
  <g font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">
    <text x="640" y="76" fill="#f3a712">fragmented mosaic</text>
    <text x="640" y="128" fill="currentColor">mixed natural forest</text>
    <text x="640" y="172" fill="currentColor" opacity="0.85">homogeneous plantation</text>
    <text x="12" y="206" font-weight="400" fill="currentColor" opacity="0.82">Derive the acceptable offset from the landscape's structural autocorrelation length — do not adopt a constant from a paper about a different forest.</text>
  </g>
</svg>

## Frequently Asked Questions

### What coregistration offset is acceptable?

It depends entirely on how heterogeneous the landscape is at the pixel scale, so it must be derived rather than adopted. In a uniform plantation a twenty-metre offset barely changes the fitted relationship, because the neighbouring pixel looks like the intended one. In a fragmented mosaic the same offset pairs a canopy measurement with a clearing and biases the model by double digits. Estimate the structural autocorrelation length for your landscape and set the tolerance from it.

### How do I distinguish drift from matching noise?

By the spatial structure of the residual field. Drift is structured — uniform, rotational, or correlated with terrain — and is correctable by a transform of the corresponding form. Noise has no structure and no transform will remove it; attempting to fit one produces a correction that fits the noise and makes the next scene worse. Plot the residual vectors before fitting anything, and only fit the model the pattern suggests.

### Should the correction be applied to the LiDAR or the SAR?

To whichever has the weaker geolocation, which is usually the SAR after terrain correction, and always to a copy rather than in place. The important discipline is to apply exactly one correction, derived once and recorded, rather than accumulating small adjustments per scene — chained corrections drift in the same way chained reprojections do, and they destroy the ability to state what transform produced a given artefact.

### Does drift change over time?

Often, and monitoring it is worth more than correcting it once. Orbit maintenance, processing baseline changes, and elevation model updates all shift the relationship, so a correction fitted in 2027 may be wrong in 2029. Compute the residual field on every acquisition against a stable reference and trend the fitted offset; a step in that series is a provider-side change worth knowing about before it reaches a reported figure.

### What if the two sensors were acquired years apart?

Then the mismatch includes real change as well as geometric offset, and separating them requires care. Restrict the coregistration fit to areas known to be stable over the interval — rock, water margins, mature undisturbed stands — and exclude anything that may have changed. Fitting on the whole scene lets genuine forest change pull the estimated offset, which then propagates a spurious geometric correction into every subsequent pairing.

## Related guides

- [Biomass Estimation from LiDAR–SAR Fusion](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/biomass-estimation-from-lidar-sar-fusion/) — the parent stage whose fused stack this correction feeds.
- [Ground-Truth Alignment for Carbon Models](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/ground-truth-alignment-for-carbon-models/) — plot-to-pixel calibration that requires a coregistered stack first.
- [Debugging Silent Datum Shifts in Carbon Pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/debugging-silent-datum-shifts-in-carbon-pipelines/) — distinguishing a transform bug from physical drift.
- [Emission Factor Uncertainty Mapping](https://www.spatialpipelineengineering.org/spatial-modeling-carbon-stock-validation/emission-factor-uncertainty-mapping/) — where residual misregistration is propagated as variance.
