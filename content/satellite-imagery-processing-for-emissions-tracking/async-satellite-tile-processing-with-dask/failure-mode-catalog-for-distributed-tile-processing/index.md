---
shortTitle: "Failure Mode Catalog for Distributed Tile Processing"
title: "Failure Mode Catalog for Distributed Tile Processing"
description: "Ten ways a distributed raster job produces a complete-looking output that is wrong: silent tile drops, edge effects at chunk boundaries, worker memory pressure, retry non-determinism, and the partial write that nobody notices."
slug: failure-mode-catalog-for-distributed-tile-processing
type: guide
breadcrumb: "Tile Processing Failure Modes"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Failure Mode Catalog for Distributed Tile Processing

A distributed raster job that crashes is a good outcome. Someone reads the traceback, fixes the cause, and reruns. The failures that cost carbon projects are the ones where every worker returns successfully, the output mosaic covers the full extent, the file sizes look plausible, and the numbers are wrong. This catalogue collects those, within [async satellite tile processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) in the [satellite imagery processing for emissions tracking](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/) stack. It is the tile-processing counterpart to the cross-stage [failure mode catalog for spatial MRV pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/failure-mode-catalog-for-spatial-mrv-pipelines/).

The organising property is that a tiled computation has no natural completeness check. A scalar sum either ran or did not. A mosaic of forty thousand tiles can be missing two hundred of them and look entirely normal on a map, because the missing tiles either carry the nodata value that the rest of the pipeline treats as legitimately absent, or carry a stale value from a previous run. Every entry below is a variant of that.

<svg viewBox="0 -4 940 258" role="img" aria-labelledby="tf-t tf-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="tf-t">Ten distributed tile failures, grouped by where they originate</title>
  <desc id="tf-d">A grid of ten failure modes in three groups. The partition group covers a chunk boundary cutting through a moving-window operation, a reprojection whose chunks do not align with the target grid, and a tile index that silently omits tiles at the extent edge. The execution group covers a worker killed for memory whose task is retried on data already partly written, a retry producing a different result because the operation is not deterministic, a lazy graph that never materialised the write, and a task that raised and was swallowed by a broad exception handler. The output group covers a partial write left behind after a failure, a nodata value indistinguishable from an unwritten tile, and a mosaic whose overviews were built from the previous run. A panel notes that none of the ten raise at the point of failure.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Ten ways to finish successfully and be wrong</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">The job exits zero. The mosaic covers the extent. The numbers are not the numbers.</text>
    <rect x="12" y="52" width="298" height="184" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="298" height="184" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Partition — the split is wrong</text>
    <text x="28" y="102" fill="currentColor" font-size="9.5" opacity="0.85">1 · window spans a chunk edge</text>
    <text x="28" y="124" fill="currentColor" font-size="9.5" opacity="0.85">2 · chunks misaligned to target grid</text>
    <text x="28" y="146" fill="currentColor" font-size="9.5" opacity="0.85">3 · tile index omits edge tiles</text>
    <text x="28" y="178" fill="currentColor" font-size="9" opacity="0.72">every task succeeds; the seams</text>
    <text x="28" y="194" fill="currentColor" font-size="9" opacity="0.72">carry values that were never</text>
    <text x="28" y="210" fill="currentColor" font-size="9" opacity="0.72">computed from full neighbourhoods</text>
    <rect x="322" y="52" width="298" height="184" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="322" y="52" width="298" height="184" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="338" y="76" fill="currentColor" font-size="10.5" font-weight="700">Execution — it did not run</text>
    <text x="338" y="102" fill="currentColor" font-size="9.5" opacity="0.85">4 · OOM kill, retry over partial data</text>
    <text x="338" y="124" fill="currentColor" font-size="9.5" opacity="0.85">5 · retry gives a different answer</text>
    <text x="338" y="146" fill="currentColor" font-size="9.5" opacity="0.85">6 · lazy graph never materialised</text>
    <text x="338" y="168" fill="currentColor" font-size="9.5" opacity="0.85">7 · exception swallowed by except:</text>
    <text x="338" y="200" fill="currentColor" font-size="9" opacity="0.72">the scheduler reports done because</text>
    <text x="338" y="216" fill="currentColor" font-size="9" opacity="0.72">nothing told it otherwise</text>
    <rect x="632" y="52" width="296" height="184" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="648" y="76" fill="currentColor" font-size="10.5" font-weight="700">Output — it looks complete</text>
    <text x="648" y="102" fill="currentColor" font-size="9.5" opacity="0.85">8 · partial write left in place</text>
    <text x="648" y="124" fill="currentColor" font-size="9.5" opacity="0.85">9 · nodata == never written</text>
    <text x="648" y="146" fill="currentColor" font-size="9.5" opacity="0.85">10 · overviews from the last run</text>
    <text x="648" y="178" fill="#f3a712" font-size="9" font-weight="700">the map renders. the extent</text>
    <text x="648" y="194" fill="#f3a712" font-size="9" font-weight="700">is covered. the histogram is</text>
    <text x="648" y="210" fill="#f3a712" font-size="9" font-weight="700">plausible. nobody looks again.</text>
  </g>
</svg>

## Root Cause Analysis

The ten entries share three causes, and naming them shortens most diagnoses to a single question.

**A chunk is an implementation detail that leaks into the result.** Chunking is supposed to be invisible: the answer should not depend on how the array was split. It does depend on it whenever an operation has spatial extent — a focal filter, a segmentation, a connected-components labelling, a temporal gap-fill using neighbours. Dask will happily apply such an operation per chunk without overlap unless told otherwise, and the result is correct in the interior of every chunk and wrong along every boundary. On a map the errors form a visible grid; in a zonal statistic they are invisible and they bias the total.

**Absence and zero are the same byte.** A tile that was never written and a tile that was written with the nodata value are indistinguishable in the output. Because nodata is legitimately common in satellite products — cloud, scene edge, sensor gap — no downstream consumer can treat it as an error. This is the single property that makes silent tile loss undetectable without an explicit manifest, and it is why the completeness check has to be structural rather than statistical.

**Retries assume determinism that the code does not provide.** A retried task must produce the same result as the original for the job to be correct, and several common patterns break that: an unseeded random sample, a `datetime.now()` in an output path, a floating-point reduction whose order depends on arrival, an append to an existing file. When a retry produces a different result, the output depends on which workers happened to fail, which is not reproducible and cannot be audited.

The connective theme is that distributed frameworks provide task-level success and the pipeline needs data-level completeness, and nothing bridges the two automatically.

## Diagnostic Pipeline / Pre-Flight Validation

The check that catches the largest share of this catalogue is a manifest comparison: enumerate what should exist before the job, enumerate what does exist after, and refuse to publish on any difference. It is unglamorous and it is the difference between a mosaic you can defend and one you hope is right.

```python
from dataclasses import dataclass

import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class TileKey:
    """Identity of one output tile. Deterministic from the input grid alone."""
    grid_id: str
    col: int
    row: int

    def path(self, root: str, run_id: str) -> str:
        return f"{root}/{run_id}/{self.grid_id}/{self.col:04d}_{self.row:04d}.tif"


@dataclass(frozen=True)
class TileResult:
    key: TileKey
    bytes_written: int
    checksum: str
    valid_pixel_count: int
    nodata_pixel_count: int
    worker: str
    attempt: int


class IncompleteMosaicError(RuntimeError):
    """Raised when the produced set differs from the expected set."""


def expected_tiles(grid_id: str, n_cols: int, n_rows: int) -> set[TileKey]:
    """The full expected set, computed from the grid, not from the outputs.

    Deriving the expectation from what was produced is the mistake this
    function exists to prevent — it makes any loss self-consistent.
    """
    return {
        TileKey(grid_id, c, r)
        for c in range(n_cols)
        for r in range(n_rows)
    }


def assert_mosaic_complete(
    expected: set[TileKey], produced: list[TileResult]
) -> None:
    """Structural completeness. No statistics, no thresholds, no tolerance."""
    produced_keys = {t.key for t in produced}

    missing = expected - produced_keys
    unexpected = produced_keys - expected

    duplicates = [
        k for k in produced_keys
        if sum(1 for t in produced if t.key == k) > 1
    ]

    if missing or unexpected or duplicates:
        raise IncompleteMosaicError(
            f"expected {len(expected)} tiles, produced {len(produced_keys)}; "
            f"missing {len(missing)}, unexpected {len(unexpected)}, "
            f"duplicated {len(duplicates)}. "
            f"first missing: {sorted(missing)[:5] if missing else '—'}"
        )

    empty = [t for t in produced if t.valid_pixel_count == 0]
    if empty:
        # Not necessarily an error — a tile can be legitimately all-cloud —
        # but it must be counted and reported rather than absorbed.
        log.warning(
            "mosaic.all_nodata_tiles",
            count=len(empty),
            fraction=round(len(empty) / len(produced), 4),
            sample=[f"{t.key.col}_{t.key.row}" for t in empty[:5]],
        )

    retried = [t for t in produced if t.attempt > 1]
    if retried:
        log.info(
            "mosaic.retried_tiles",
            count=len(retried),
            note="verify the operation is deterministic before trusting these",
        )

    log.info(
        "mosaic.complete",
        tiles=len(produced),
        valid_pixels=sum(t.valid_pixel_count for t in produced),
        nodata_pixels=sum(t.nodata_pixel_count for t in produced),
    )


def assert_overlap_sufficient(
    window_radius_px: int, chunk_overlap_px: int, operation: str
) -> None:
    """Chunk overlap must exceed the operation's spatial reach.

    Applies to focal filters, morphological operations, segmentation, and
    any temporal fill that reads spatial neighbours. The check is cheap and
    the failure it prevents is invisible.
    """
    if chunk_overlap_px < window_radius_px:
        raise ValueError(
            f"operation '{operation}' reaches {window_radius_px} px but chunks "
            f"overlap by only {chunk_overlap_px} px — every chunk boundary will "
            "carry values computed from a truncated neighbourhood. Use "
            "map_overlap with depth >= the window radius."
        )
```

The duplicate check in the middle catches a specific and nasty case: a retry that writes to a slightly different path, leaving both the failed partial and the successful complete tile in the output directory. The mosaic then contains two candidates for one position and whichever the reader picks first wins.

<svg viewBox="-4 -12 722 278" role="img" aria-labelledby="ov-t ov-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ov-t">A focal operation across a chunk boundary, with and without overlap</title>
  <desc id="ov-d">Two panels showing a three by three moving window applied near a chunk boundary. On the left, chunks are processed independently with no overlap: the window at a pixel adjacent to the boundary reads only the pixels inside its own chunk, treating the missing neighbours as absent, so the computed value is derived from a truncated neighbourhood. A visible seam of wrong values runs the length of every boundary. On the right, chunks are expanded by a halo equal to the window radius before processing and trimmed afterwards: every window reads its full neighbourhood, and the result is identical to what a single-machine computation would produce. A panel notes that on a forty thousand tile mosaic the seams amount to a substantial fraction of the pixels, and that they bias any zonal total computed from the result.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">The seam is not cosmetic — it biases every zonal total downstream</text>
  </g>
  <g stroke="currentColor" stroke-width="0.9" opacity="0.4" fill="none">
    <rect x="30" y="44" width="24" height="24"/><rect x="54" y="44" width="24" height="24"/><rect x="78" y="44" width="24" height="24"/><rect x="102" y="44" width="24" height="24"/><rect x="126" y="44" width="24" height="24"/><rect x="150" y="44" width="24" height="24"/><rect x="174" y="44" width="24" height="24"/><rect x="198" y="44" width="24" height="24"/>
    <rect x="30" y="68" width="24" height="24"/><rect x="54" y="68" width="24" height="24"/><rect x="78" y="68" width="24" height="24"/><rect x="102" y="68" width="24" height="24"/><rect x="126" y="68" width="24" height="24"/><rect x="150" y="68" width="24" height="24"/><rect x="174" y="68" width="24" height="24"/><rect x="198" y="68" width="24" height="24"/>
    <rect x="30" y="92" width="24" height="24"/><rect x="54" y="92" width="24" height="24"/><rect x="78" y="92" width="24" height="24"/><rect x="102" y="92" width="24" height="24"/><rect x="126" y="92" width="24" height="24"/><rect x="150" y="92" width="24" height="24"/><rect x="174" y="92" width="24" height="24"/><rect x="198" y="92" width="24" height="24"/>
    <rect x="30" y="116" width="24" height="24"/><rect x="54" y="116" width="24" height="24"/><rect x="78" y="116" width="24" height="24"/><rect x="102" y="116" width="24" height="24"/><rect x="126" y="116" width="24" height="24"/><rect x="150" y="116" width="24" height="24"/><rect x="174" y="116" width="24" height="24"/><rect x="198" y="116" width="24" height="24"/>
  </g>
  <line x1="126" y1="40" x2="126" y2="144" stroke="currentColor" stroke-width="2.6"/>
  <rect x="102" y="68" width="72" height="72" fill="#f3a712" opacity="0.2"/>
  <rect x="102" y="68" width="24" height="72" fill="none" stroke="#f3a712" stroke-width="2"/>
  <text x="126" y="164" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="#f3a712" font-weight="700">window truncated at the boundary</text>
  <g font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">
    <text x="30" y="192" font-weight="700">No overlap</text>
    <text x="30" y="212" opacity="0.85">every task succeeds; a seam of wrong</text>
    <text x="30" y="228" opacity="0.85">values runs along every chunk edge</text>
    <text x="30" y="248" opacity="0.7">40,000 tiles × 4 edges = a lot of pixels</text>
  </g>
  <g stroke="currentColor" stroke-width="0.9" opacity="0.4" fill="none">
    <rect x="510" y="44" width="24" height="24"/><rect x="534" y="44" width="24" height="24"/><rect x="558" y="44" width="24" height="24"/><rect x="582" y="44" width="24" height="24"/><rect x="606" y="44" width="24" height="24"/><rect x="630" y="44" width="24" height="24"/><rect x="654" y="44" width="24" height="24"/><rect x="678" y="44" width="24" height="24"/>
    <rect x="510" y="68" width="24" height="24"/><rect x="534" y="68" width="24" height="24"/><rect x="558" y="68" width="24" height="24"/><rect x="582" y="68" width="24" height="24"/><rect x="606" y="68" width="24" height="24"/><rect x="630" y="68" width="24" height="24"/><rect x="654" y="68" width="24" height="24"/><rect x="678" y="68" width="24" height="24"/>
    <rect x="510" y="92" width="24" height="24"/><rect x="534" y="92" width="24" height="24"/><rect x="558" y="92" width="24" height="24"/><rect x="582" y="92" width="24" height="24"/><rect x="606" y="92" width="24" height="24"/><rect x="630" y="92" width="24" height="24"/><rect x="654" y="92" width="24" height="24"/><rect x="678" y="92" width="24" height="24"/>
    <rect x="510" y="116" width="24" height="24"/><rect x="534" y="116" width="24" height="24"/><rect x="558" y="116" width="24" height="24"/><rect x="582" y="116" width="24" height="24"/><rect x="606" y="116" width="24" height="24"/><rect x="630" y="116" width="24" height="24"/><rect x="654" y="116" width="24" height="24"/><rect x="678" y="116" width="24" height="24"/>
  </g>
  <rect x="582" y="40" width="48" height="104" fill="currentColor" opacity="0.14"/>
  <line x1="606" y1="40" x2="606" y2="144" stroke="currentColor" stroke-width="2.6" stroke-dasharray="5,4"/>
  <rect x="582" y="68" width="72" height="72" fill="currentColor" opacity="0.2"/>
  <rect x="582" y="68" width="72" height="72" fill="none" stroke="currentColor" stroke-width="2"/>
  <text x="606" y="164" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" font-weight="700">halo supplies the full neighbourhood</text>
  <g font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">
    <text x="510" y="192" font-weight="700">map_overlap, depth ≥ radius</text>
    <text x="510" y="212" opacity="0.85">chunks expand, compute, then trim</text>
    <text x="510" y="228" opacity="0.85">result matches single-machine exactly</text>
    <text x="510" y="248" opacity="0.7">costs memory, not correctness</text>
  </g>
</svg>

## Deterministic Transformation Logic

Making a tiled job safe to retry is largely a matter of two disciplines: every task writes to a path derived only from its inputs, and every write is atomic. Together they make a retry indistinguishable from a first attempt.

```python
import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class TaskSpec:
    """Everything that determines a tile's content, and nothing else.

    Notably absent: timestamps, hostnames, attempt numbers, and run ids used
    for anything other than directory placement. If any of those enter the
    computation, a retry can produce a different tile and the job stops being
    reproducible.
    """
    key: TileKey
    source_uris: tuple[str, ...]
    algorithm: str
    algorithm_version: str
    parameters: tuple[tuple[str, str], ...]

    def fingerprint(self) -> str:
        payload = json.dumps(
            {
                "key": [self.key.grid_id, self.key.col, self.key.row],
                "sources": sorted(self.source_uris),
                "algorithm": self.algorithm,
                "version": self.algorithm_version,
                "parameters": sorted(self.parameters),
            },
            sort_keys=True,
            separators=(",", ":"),
        ).encode()
        return hashlib.sha256(payload).hexdigest()[:16]


def write_tile_atomically(dest: Path, payload: bytes) -> None:
    """Write to a temporary name in the same directory, then rename.

    Rename within a filesystem is atomic, so a reader either sees the whole
    tile or no tile at all — never a truncated one. The temporary name must
    share the destination directory, or the rename becomes a copy and loses
    atomicity. On object storage the equivalent is a single-part put or a
    completed multipart upload; never an appended stream.
    """
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(f".{dest.name}.partial")
    try:
        with open(tmp, "wb") as fh:
            fh.write(payload)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, dest)
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise


def process_tile(spec: TaskSpec, root: str, run_id: str) -> TileResult:
    """Idempotent tile production: skip if the fingerprint already exists.

    The fingerprint in the filename is what makes the skip safe. A tile whose
    inputs or parameters changed produces a different fingerprint and is
    therefore recomputed, while an identical rerun costs a stat() call.
    """
    fp = spec.fingerprint()
    dest = Path(f"{root}/{run_id}/{spec.key.grid_id}/"
                f"{spec.key.col:04d}_{spec.key.row:04d}.{fp}.tif")

    if dest.exists():
        log.info("tile.skipped_existing", tile=str(dest.name), fingerprint=fp)
        return _describe(dest, spec, attempt=0)

    payload, stats = _compute(spec)
    write_tile_atomically(dest, payload)

    return TileResult(
        key=spec.key,
        bytes_written=len(payload),
        checksum=hashlib.sha256(payload).hexdigest(),
        valid_pixel_count=stats["valid"],
        nodata_pixel_count=stats["nodata"],
        worker=os.environ.get("DASK_WORKER_NAME", "local"),
        attempt=1,
    )
```

Putting the fingerprint in the filename does double duty. It makes reruns cheap, and it makes a parameter change visible in the filesystem — a directory containing two fingerprints for the same tile position is the immediate, obvious signal that something about the computation changed mid-run, which is otherwise one of the hardest states to detect.

## Compliance Gating & Audit Trail Generation

The gate before publication is the manifest comparison, and it should block rather than warn. Beyond it, four records make a tiled output auditable.

The expected tile set and its derivation. A verifier needs to see that completeness was checked against the grid definition rather than against whatever was produced.

Per-tile checksums and fingerprints. These allow any single tile to be re-derived and compared, which is the practical form of reproducibility for a dataset too large to regenerate wholesale.

Retry counts and their outcomes. A run with three hundred retries is not necessarily wrong, but it is a run whose determinism claim is load-bearing, and the count is what prompts anyone to check it.

The chunking and overlap parameters used. These are part of the computation's definition even though they feel like infrastructure, because an operation with spatial reach produces a different answer under different chunking. Recording them turns "why does the 2027 mosaic differ slightly from the 2026 one?" into a diff rather than an investigation.

## Production Integration

Most of this catalogue is prevented by three habits rather than by tooling. Derive the expected output set from the input grid before the job starts and store it. Make every write atomic and every path a pure function of the task's inputs. Refuse to publish on any manifest mismatch, without a threshold, because a tolerance for missing tiles is a tolerance for a wrong answer of unknown size.

The scaling patterns themselves are covered in [scaling async satellite processing with Dask geospatial](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/scaling-async-satellite-processing-with-dask-geospatial/), and the instrumentation that makes the failures above visible in flight rather than at publication is in [instrumenting MRV pipelines with OpenTelemetry and structlog](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/instrumenting-mrv-pipelines-with-opentelemetry-and-structlog/). The two combine usefully: a span per tile with the fingerprint as an attribute turns the retry-determinism question into a query.

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="gate-t gate-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="gate-t">Where the completeness gate sits, and what it stops</title>
  <desc id="gate-d">A flow from left to right. A grid definition produces an expected tile manifest before any work starts. Workers produce tiles in parallel, each writing atomically to a fingerprinted path. A completeness gate compares produced against expected and blocks on any difference — missing, unexpected, or duplicated. Only after the gate passes does the mosaic get assembled, overviews built, and the output promoted to the certified zone. A red branch from the gate shows the blocked path, annotated that a blocked run leaves the previous certified output in place rather than replacing it with a partial one, so a consumer reading the certified zone never sees an incomplete mosaic.</desc>
  <defs>
    <marker id="gate-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Expect first, produce second, compare third — publish only on an exact match</text>
    <rect x="12" y="42" width="186" height="80" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="42" width="186" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="105" y="70" fill="currentColor" font-size="10" font-weight="700">Expected manifest</text>
    <text x="105" y="90" fill="currentColor" font-size="8.5" opacity="0.8">from the grid definition,</text>
    <text x="105" y="106" fill="currentColor" font-size="8.5" opacity="0.8">before any work starts</text>
    <rect x="222" y="42" width="186" height="80" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="222" y="42" width="186" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="315" y="70" fill="currentColor" font-size="10" font-weight="700">Workers</text>
    <text x="315" y="90" fill="currentColor" font-size="8.5" opacity="0.8">atomic writes to</text>
    <text x="315" y="106" fill="currentColor" font-size="8.5" opacity="0.8">fingerprinted paths</text>
    <rect x="432" y="42" width="186" height="80" rx="9" fill="#f3a712" opacity="0.18"/>
    <rect x="432" y="42" width="186" height="80" rx="9" fill="none" stroke="#f3a712" stroke-width="2"/>
    <text x="525" y="70" fill="currentColor" font-size="10" font-weight="700">Completeness gate</text>
    <text x="525" y="90" fill="currentColor" font-size="8.5" opacity="0.8">missing / unexpected /</text>
    <text x="525" y="106" fill="currentColor" font-size="8.5" opacity="0.8">duplicated → block</text>
    <rect x="642" y="42" width="186" height="80" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="642" y="42" width="186" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="735" y="70" fill="currentColor" font-size="10" font-weight="700">Publish</text>
    <text x="735" y="90" fill="currentColor" font-size="8.5" opacity="0.8">mosaic, overviews,</text>
    <text x="735" y="106" fill="currentColor" font-size="8.5" opacity="0.8">promote to certified</text>
    <rect x="252" y="176" width="546" height="66" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="252" y="176" width="546" height="66" rx="9" fill="none" stroke="#f3a712" stroke-width="1.5" stroke-dasharray="6,3"/>
    <text x="525" y="200" fill="#f3a712" font-size="10" font-weight="700">Blocked: the previous certified mosaic stays in place.</text>
    <text x="525" y="222" fill="currentColor" font-size="9.5" opacity="0.85">Consumers never see a partial mosaic — which is why the gate precedes promotion.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.5" fill="none" marker-end="url(#gate-arrow)">
    <line x1="198" y1="82" x2="220" y2="82"/><line x1="408" y1="82" x2="430" y2="82"/>
    <line x1="618" y1="82" x2="640" y2="82"/>
    <path d="M525 122 L525 174"/>
  </g>
  <text x="558" y="152" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#f3a712" font-weight="700">on mismatch</text>
</svg>

## Frequently Asked Questions

### How large should chunks be?

Large enough that per-task overhead is negligible and small enough that several fit in a worker's memory alongside their halos — in practice a few hundred megabytes of uncompressed array per chunk suits most raster work. The consideration people miss is the halo: a chunk with a fifty-pixel overlap on each side carries substantially more data than its nominal size, and a chunking that fits comfortably without overlap can trigger memory pressure once the halo is added. Size the chunk for the halo it will actually carry.

### Is it safe to let the framework retry failed tasks automatically?

Only if the task is genuinely deterministic and its write is atomic. With those two properties, automatic retry is exactly right and removes a large class of transient failures. Without them, retry converts a transient failure into a silent corruption, because the second attempt may leave different bytes on disk from the first and nothing compares them. The honest position is that automatic retry is a property you earn by making tasks pure, not a setting you enable.

### Why does a mosaic sometimes differ between runs with identical inputs?

Usually one of three things: a reduction whose floating-point order varies with task arrival, an operation reading a mutable external resource such as a "latest" pointer, or an unseeded sampling step. Floating-point non-associativity is the subtlest — summing the same values in a different order gives results that differ in the last bits, which is harmless for most purposes and fatal for a checksum comparison. Where bitwise reproducibility is needed, sum in a fixed order or use a compensated summation.

### Should nodata and never-written be distinguished in the output format?

Ideally yes, and there are two workable approaches. A separate validity mask band records whether each pixel was computed, independently of what value it holds. Or a distinct sentinel is used for never-written, though this requires every consumer to know about it and is easily lost in a format conversion. Where neither is practical, the tile manifest carries the burden: if the manifest is complete and each tile records its valid pixel count, absence at pixel level can be attributed correctly.

### What is the right response to a worker being killed for memory?

Investigate before increasing the limit, because an out-of-memory kill in a tiled job usually means a task is loading more than its chunk. Common causes are a `compute()` inside a task pulling the whole array, an unexpected broadcast, or a halo larger than intended. Raising the memory limit makes the symptom go away and leaves a job that will fail again at the next scale increase. Where the memory use is genuinely necessary, reduce the chunk size rather than raising the limit — it scales further.

### How should partial writes from a killed worker be cleaned up?

They should not need cleaning up, because the temporary-then-rename pattern leaves only a dot-prefixed partial file that no reader will match. That said, a periodic sweep removing stale partials is worth having, since they accumulate and consume storage. What must never happen is a cleanup that removes files matching the real output pattern, since a concurrent run's legitimate tiles look identical to a stale one from the outside.

### Does this catalogue apply to Spark and Ray as well as Dask?

Almost entirely. The specific APIs differ — `map_overlap` has counterparts elsewhere, and the atomic-write pattern is universal — but the three root causes are properties of distributing spatial computation rather than of any framework. The one framework-specific entry is the lazy-graph failure, which affects Dask and Spark in the same way and does not arise in eagerly evaluated systems. Everything about manifests, determinism, and atomicity transfers unchanged.

### Does a completeness gate slow the pipeline down noticeably?

Not measurably, because it operates on metadata rather than on pixels. Comparing two sets of a few tens of thousands of keys is microseconds of work, and the per-tile records it consumes are produced by the tasks anyway. The cost that people actually feel is the blocked run: a gate that refuses to publish forces someone to investigate a mismatch that a permissive pipeline would have shipped. That is the gate working, and the time it takes is time that would otherwise have been spent months later reconstructing why a total moved.

The one real cost is at very large tile counts, where holding the produced set in memory on the coordinating process becomes awkward. At that scale, compare sorted key streams rather than sets, or partition the comparison by grid row — both preserve the exactness of the check, which is the property that must not be traded away.

### Should the expected manifest include tiles that fall entirely outside the area of interest?

Yes, and mark them expected-empty rather than excluding them. Excluding them means the expected set depends on a geometry intersection, which is itself a computation that can go wrong, and a bug there quietly shrinks the expectation to match whatever was produced. Including every tile in the grid rectangle and recording which are expected to contain no valid pixels keeps the expectation derived from something structural — the grid — while still letting the gate distinguish a legitimately empty tile from a lost one.

## Related guides

- [Async Satellite Tile Processing with Dask](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/) — the parent topic and the execution model these failures occur in.
- [Scaling Async Satellite Processing with Dask Geospatial](https://www.spatialpipelineengineering.org/satellite-imagery-processing-for-emissions-tracking/async-satellite-tile-processing-with-dask/scaling-async-satellite-processing-with-dask-geospatial/) — the patterns this catalogue assumes are in place.
- [Failure Mode Catalog for Spatial MRV Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/failure-mode-catalog-for-spatial-mrv-pipelines/) — the cross-stage catalogue this one narrows.
- [Instrumenting MRV Pipelines with OpenTelemetry and Structlog](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/instrumenting-mrv-pipelines-with-opentelemetry-and-structlog/) — making these failures visible in flight rather than at publication.
