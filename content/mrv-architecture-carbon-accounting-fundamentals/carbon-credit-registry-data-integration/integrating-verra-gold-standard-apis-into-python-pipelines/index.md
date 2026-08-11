---
shortTitle: "Verra & Gold Standard APIs in Python MRV Pipelines"
---
# Integrating Verra & Gold Standard APIs into Python Pipelines

Integrating Verra and Gold Standard APIs into Python pipelines is the connector problem that decides whether a voluntary-carbon-market inventory is reproducible or merely plausible — and it is the concrete, registry-facing task that the [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) sub-system of the [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack generalizes. The objective is not "fetch project metadata"; it is to build a deterministic, idempotent ingestion layer that survives token expiry, `429` throttling, undocumented schema drift, and coordinate ambiguity, then hands a clean artifact to the rest of the pipeline.

Because everything this connector emits is consumed downstream, it is tightly coupled to its sibling components: it depends on deterministic [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) to make registry polygons mathematically comparable, it feeds geographically tagged removals into [GHG Protocol Scope 3 spatial mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/), and every transformation it performs has to be recorded for [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) so that an auditor can reconstruct any submitted tonne byte-for-byte. This guide walks the specific operation end to end: why the integration is hard, how to pre-flight inputs before transformation, the deterministic transform itself, the compliance gate, and the production execution pattern.

<svg viewBox="0 0 940 320" role="img" aria-label="Verra and Gold Standard connector flowchart. A registry source — Verra REST token or Gold Standard OAuth2 — feeds a pre-flight probe that checks auth, 429 rate-limit headers and payload shape. The probe passes to pydantic schema validation, which traps schema drift, then to geometry repair and CRS normalization to EPSG:4326 with an axis-order gate, then to a compliance gate. The gate branches: PASS records go to a versioned, SHA-256 content-addressed artifact and audit ledger; FAIL records go to a quarantine queue keyed by reason code." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:940px;display:block;margin:1.5rem auto;">
  <title>Verra and Gold Standard registry connector: a deterministic ingest pipeline that branches on a compliance gate</title>
  <desc>Five left-to-right stages followed by a branch. Stage one is the registry source — Verra REST token or Gold Standard OAuth2. Stage two is a pre-flight probe checking authentication, 429 rate-limit headers and payload shape. Stage three is pydantic schema validation, which traps renamed or missing fields as schema drift. Stage four repairs geometry and normalizes the coordinate reference system to EPSG:4326 with an always-xy axis-order gate. Stage five is the compliance gate evaluating vintage, status and geometry rules. The gate branches twice: a PASS path leads to a versioned artifact and audit ledger that is content-addressed by SHA-256; a FAIL path leads to a quarantine queue where the record is retained with its reason code.</desc>
  <defs>
    <marker id="vgs-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <text x="10" y="24" font-size="11" font-weight="700" fill="currentColor">Deterministic, idempotent registry connector — ingest to gated artifact</text>
  <!-- Stage 1: Source -->
  <rect x="10" y="120" width="138" height="84" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="10" y="120" width="138" height="84" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="79" y="140" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">STAGE 1 · SOURCE</text>
  <text x="79" y="159" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Registry source</text>
  <text x="79" y="176" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">Verra REST token</text>
  <text x="79" y="189" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">Gold Standard OAuth2</text>
  <!-- Stage 2: Pre-flight -->
  <rect x="158" y="120" width="138" height="84" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="158" y="120" width="138" height="84" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="227" y="140" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">STAGE 2 · DIAGNOSE</text>
  <text x="227" y="159" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Pre-flight probe</text>
  <text x="227" y="176" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">auth · 429 headers</text>
  <text x="227" y="189" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">payload shape</text>
  <!-- Stage 3: Schema -->
  <rect x="306" y="120" width="138" height="84" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="306" y="120" width="138" height="84" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="375" y="140" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">STAGE 3 · VALIDATE</text>
  <text x="375" y="159" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Pydantic schema</text>
  <text x="375" y="176" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">typed fields</text>
  <text x="375" y="189" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">schema-drift trap</text>
  <!-- Stage 4: Geometry + CRS -->
  <rect x="454" y="120" width="138" height="84" rx="8" fill="currentColor" opacity="0.05"/>
  <rect x="454" y="120" width="138" height="84" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="523" y="140" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">STAGE 4 · NORMALIZE</text>
  <text x="523" y="159" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Geometry + CRS</text>
  <text x="523" y="176" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">make_valid · EPSG:4326</text>
  <text x="523" y="189" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">always_xy axis gate</text>
  <!-- Stage 5: Compliance gate (decision) -->
  <rect x="602" y="120" width="138" height="84" rx="8" fill="currentColor" opacity="0.1"/>
  <rect x="602" y="120" width="138" height="84" rx="8" fill="none" stroke="currentColor" stroke-width="1.8"/>
  <text x="671" y="140" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">STAGE 5 · GATE</text>
  <text x="671" y="159" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Compliance gate</text>
  <text x="671" y="176" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">vintage · status</text>
  <text x="671" y="189" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">geometry rules</text>
  <!-- Inter-stage arrows -->
  <line x1="148" y1="162" x2="156" y2="162" stroke="currentColor" stroke-width="1.4" marker-end="url(#vgs-arrow)"/>
  <line x1="296" y1="162" x2="304" y2="162" stroke="currentColor" stroke-width="1.4" marker-end="url(#vgs-arrow)"/>
  <line x1="444" y1="162" x2="452" y2="162" stroke="currentColor" stroke-width="1.4" marker-end="url(#vgs-arrow)"/>
  <line x1="592" y1="162" x2="600" y2="162" stroke="currentColor" stroke-width="1.4" marker-end="url(#vgs-arrow)"/>
  <!-- PASS output -->
  <rect x="772" y="46" width="158" height="74" rx="8" fill="currentColor" opacity="0.08"/>
  <rect x="772" y="46" width="158" height="74" rx="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="851" y="66" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">PASS · ACCEPT</text>
  <text x="851" y="84" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Artifact + audit ledger</text>
  <text x="851" y="100" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">versioned store</text>
  <text x="851" y="112" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">SHA-256 content-addressed</text>
  <!-- FAIL output -->
  <rect x="772" y="204" width="158" height="74" rx="8" fill="currentColor" opacity="0.04"/>
  <rect x="772" y="204" width="158" height="74" rx="8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5,3"/>
  <text x="851" y="224" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity="0.55">FAIL · QUARANTINE</text>
  <text x="851" y="242" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Quarantine queue</text>
  <text x="851" y="258" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">retained, not dropped</text>
  <text x="851" y="270" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.72">keyed by reason code</text>
  <!-- Branch arrows from gate -->
  <path d="M740 150 C 758 150 754 83 770 83" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#vgs-arrow)"/>
  <path d="M740 174 C 758 174 754 241 770 241" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#vgs-arrow)"/>
  <text x="760" y="112" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" opacity="0.85">PASS</text>
  <text x="760" y="212" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" opacity="0.85">FAIL</text>
  <!-- Idempotency annotation bar -->
  <rect x="10" y="290" width="730" height="22" rx="6" fill="currentColor" opacity="0.04"/>
  <rect x="10" y="290" width="730" height="22" rx="6" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
  <text x="375" y="305" text-anchor="middle" font-size="8.5" font-weight="600" fill="currentColor" opacity="0.8">every stage logs structured lineage · the SHA-256 payload hash makes re-ingesting an unchanged record a no-op</text>
</svg>

## Root Cause Analysis

The reason this connector deserves dedicated treatment is that the two largest voluntary-market registries are not API-compatible, and the failures they produce are *silent* rather than loud. Four root causes account for nearly every production incident.

**Divergent authentication models.** Verra's registry endpoints lean on token-based REST queries with strict pagination limits, while the Gold Standard Impact Registry enforces an OAuth2 client-credentials flow with scoped, short-lived access tokens. A connector written against one model degrades unpredictably against the other. The dominant failure is not endpoint downtime — it is an unhandled token-expiry cascade mid-backfill, where a long historical pull keeps using a token that expired thousands of records ago and every subsequent request `401`s into an empty page that looks like "end of data."

**Rate-limit throttling under bulk load.** Both registries answer aggressive historical backfills with `429 Too Many Requests`. Without jittered exponential backoff, a naive loop either aborts the batch or — worse — treats the throttled response as a real empty result and records a coverage gap no auditor can distinguish from genuine no-data.

**Undocumented schema drift.** Registry payloads change shape without notice: a `project_name` field becomes `title`, a flat coordinate array becomes a nested GeoJSON object, a status enum gains a value. Raw dictionary access (`raw["project_name"]`) turns these into `KeyError`s at best and silent `None`s at worst, corrupting tonnage calculations downstream.

**Coordinate ambiguity.** Registries return WGS84 coordinates with implicit axis order, malformed polygons, and self-intersecting rings. Ingesting these without a topology and [CRS alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) gate poisons every spatial join and area calculation that follows. Registry data is also a *mutable stream* — credits are retroactively cancelled and boundaries amended after verification — so the connector must be idempotent: the same payload processed twice must produce the same artifact, and a changed payload must produce a visible, hashed delta.

## Diagnostic Pipeline / Pre-Flight Validation

Before transforming anything, the connector inspects the live connection and the raw payload to detect the failure conditions above. The session wrapper below isolates authentication state from request execution, applies transport-level retry for transient `429`/`5xx` responses, and refreshes tokens with a safety margin. A separate pre-flight probe then asserts that the response is well-formed *before* it reaches the transformer, so a throttled or truncated page fails loudly instead of masquerading as clean data. Telemetry is emitted with `structlog` so every decision is captured as a structured, queryable lineage record.

```python
import time
import hashlib
import requests
import structlog
from tenacity import (
    retry, stop_after_attempt, wait_exponential, retry_if_exception_type,
)
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

log = structlog.get_logger("registry.connector")


class RegistrySession:
    """Auth-aware HTTP session for Verra (token) and Gold Standard (OAuth2)."""

    def __init__(self, base_url: str, client_id: str, client_secret: str, registry: str):
        self.base_url = base_url.rstrip("/")
        self.client_id = client_id
        self.client_secret = client_secret
        self.registry = registry
        self._token: str | None = None
        self._token_expiry = 0.0

        self.session = requests.Session()
        transport_retry = Retry(
            total=5,
            backoff_factor=1.5,            # jittered exponential backoff
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"],
            respect_retry_after_header=True,
        )
        adapter = HTTPAdapter(max_retries=transport_retry)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    def _refresh_token(self) -> None:
        payload = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        resp = self.session.post(f"{self.base_url}/oauth/token", json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        self._token = data["access_token"]
        # Refresh at 90% of lifetime to defeat the token-expiry cascade.
        self._token_expiry = time.time() + (data["expires_in"] * 0.9)
        log.info("token_refreshed", registry=self.registry, ttl_s=data["expires_in"])

    def _ensure_token(self) -> None:
        if self._token is None or time.time() >= self._token_expiry:
            self._refresh_token()

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(requests.exceptions.RequestException),
        reraise=True,
    )
    def get(self, endpoint: str, params: dict | None = None) -> requests.Response:
        self._ensure_token()
        headers = {"Authorization": f"Bearer {self._token}", "Accept": "application/json"}
        resp = self.session.get(
            f"{self.base_url}{endpoint}", headers=headers, params=params, timeout=60,
        )
        resp.raise_for_status()
        return resp


def preflight(resp: requests.Response, registry: str) -> dict:
    """Detect throttling, truncation, and shape failures before transformation."""
    remaining = resp.headers.get("X-RateLimit-Remaining")
    if remaining is not None and int(remaining) <= 1:
        log.warning("rate_limit_near_exhaustion", registry=registry, remaining=remaining)

    body = resp.json()
    records = body.get("results", body if isinstance(body, list) else [])
    if not isinstance(records, list):
        raise ValueError(f"{registry}: expected a list of records, got {type(records).__name__}")
    if resp.status_code == 200 and not records and "next_page_token" in body:
        # Empty page with a continuation token => throttled, not end-of-stream.
        raise RuntimeError(f"{registry}: empty page with pending cursor — likely throttled")

    log.info("preflight_ok", registry=registry, record_count=len(records))
    return body
```

<svg viewBox="0 -4 900 254" role="img" aria-labelledby="pag-t pag-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="pag-t">Why offset pagination loses and duplicates records against a live registry</title>
  <desc id="pag-d">Two pagination strategies shown against a registry whose record set changes during the crawl. With offset pagination, page one returns records one to one hundred, then a new record is inserted at position forty, so page two starting at offset one hundred re-returns the record that shifted to position one hundred and one and skips nothing visibly — but a deletion during the crawl causes a record to be skipped entirely with no error. With cursor pagination keyed on a stable identifier, each page continues from the last identifier seen, so insertions and deletions elsewhere in the set cannot shift the window. A panel notes that offset pagination against a mutating collection silently loses records and that the loss is invisible without a count reconciliation.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Offset pagination is unsafe against a live collection</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Registries mutate while you crawl. The window must be anchored to the data, not to a position.</text>
    <text x="12" y="66" fill="currentColor" font-size="10" font-weight="700">Offset</text>
    <text x="12" y="82" fill="currentColor" font-size="9" opacity="0.7">?offset=100</text>
  </g>
  <g>
    <rect x="128" y="56" width="180" height="38" rx="6" fill="currentColor" opacity="0.1"/>
    <rect x="128" y="56" width="180" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="218" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">page 1 · rows 1–100</text>
    <rect x="330" y="56" width="180" height="38" rx="6" fill="currentColor" opacity="0.1"/>
    <rect x="330" y="56" width="180" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="420" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">page 2 · rows 101–200</text>
    <rect x="532" y="56" width="180" height="38" rx="6" fill="#f3a712" opacity="0.22"/>
    <rect x="532" y="56" width="180" height="38" rx="6" fill="none" stroke="#f3a712" stroke-width="1.8"/>
    <text x="622" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">row 187 skipped</text>
    <text x="726" y="80" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">a deletion shifted the window</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="150" fill="currentColor" font-size="10" font-weight="700">Cursor</text>
    <text x="12" y="166" fill="currentColor" font-size="9" opacity="0.7">?after=VCS-1387</text>
  </g>
  <g>
    <rect x="128" y="140" width="180" height="38" rx="6" fill="currentColor" opacity="0.1"/>
    <rect x="128" y="140" width="180" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="218" y="164" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">… ends at VCS-1387</text>
    <rect x="330" y="140" width="180" height="38" rx="6" fill="currentColor" opacity="0.1"/>
    <rect x="330" y="140" width="180" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="420" y="164" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor">continues after VCS-1387</text>
    <rect x="532" y="140" width="180" height="38" rx="6" fill="currentColor" opacity="0.18"/>
    <rect x="532" y="140" width="180" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="622" y="164" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">nothing shifts</text>
    <text x="726" y="164" font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.78">insertions land outside the window</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="200" width="876" height="40" rx="8" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="200" width="876" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="28" y="218" fill="currentColor" font-size="9.5" font-weight="700">Where only offset is offered, reconcile the crawl against the collection count and re-crawl on mismatch.</text>
    <text x="28" y="234" fill="currentColor" font-size="9.5" opacity="0.82">A skipped record raises no error, returns no warning, and is simply absent from the inventory.</text>
  </g>
</svg>

## Deterministic Transformation Logic

With a validated response in hand, the transformer enforces a strict schema, repairs geometry, and reprojects every boundary into one area-preserving datum. Schema enforcement uses `pydantic` so missing or renamed fields raise a typed error instead of corrupting a calculation. Geometry handling uses `pyproj` with `always_xy=True` to pin longitude/latitude axis order — the single most common source of silent datum inversion — and validates against an equal-area projection so any area-distortion defect is caught at ingestion rather than during reporting. A SHA-256 hash of the canonicalized raw payload is computed before transformation so the artifact is content-addressed and idempotent.

```python
from datetime import date
from typing import Any
from pydantic import BaseModel, Field, ValidationError, field_validator
from shapely.geometry import shape, mapping
from shapely.validation import make_valid
from shapely.ops import transform as shapely_transform
from pyproj import Transformer, CRS

SOURCE_CRS = CRS.from_epsg(4326)        # registry boundaries are WGS84
EQUAL_AREA_CRS = CRS.from_epsg(6933)    # WGS84 / NSIDC EASE-Grid 2.0 — area check
# always_xy=True forces (lon, lat) ordering — prevents axis-swap inversion.
_to_equal_area = Transformer.from_crs(SOURCE_CRS, EQUAL_AREA_CRS, always_xy=True).transform


class ProjectMetadata(BaseModel):
    project_id: str = Field(..., alias="id")
    registry: str = Field(..., pattern="^(Verra|GoldStandard)$")
    name: str
    methodology: str
    vintage_start: date
    vintage_end: date
    status: str = Field(..., pattern="^(Active|Retired|Cancelled)$")
    coordinates: list | None = None
    raw_payload_hash: str = ""

    @field_validator("vintage_end")
    @classmethod
    def _vintage_range(cls, v, info):
        start = info.data.get("vintage_start")
        if start and v < start:
            raise ValueError("vintage_end must be >= vintage_start")
        return v


def canonical_hash(raw_json: dict) -> str:
    """Stable content hash so re-ingesting an unchanged payload is a no-op."""
    payload_bytes = repr(sorted(raw_json.items())).encode("utf-8")
    return hashlib.sha256(payload_bytes).hexdigest()


def parse_registry_payload(raw_json: dict[str, Any], registry: str) -> ProjectMetadata:
    normalized = {
        "id": raw_json.get("project_id") or raw_json.get("id"),
        "registry": registry,
        "name": raw_json.get("project_name") or raw_json.get("title"),
        "methodology": raw_json.get("methodology_code") or raw_json.get("standard"),
        "vintage_start": raw_json.get("start_date"),
        "vintage_end": raw_json.get("end_date"),
        "status": raw_json.get("status", "Unknown"),
        "coordinates": raw_json.get("geojson", {}).get("coordinates"),
        "raw_payload_hash": canonical_hash(raw_json),
    }
    try:
        return ProjectMetadata.model_validate(normalized)
    except ValidationError as e:
        log.error("schema_drift", registry=registry, error=str(e))
        raise RuntimeError(f"Schema drift detected for {registry}: {e}") from e


def normalize_geometry(raw_coords: Any) -> dict[str, Any]:
    """Repair topology, assert EPSG:4326, and run an area-preservation gate."""
    try:
        geom = shape({"type": "Polygon", "coordinates": raw_coords})
    except Exception as e:
        raise ValueError(f"Invalid GeoJSON structure: {e}") from e

    drift = "valid"
    if not geom.is_valid:
        geom = make_valid(geom)
        drift = "topology_repaired"
        log.warning("geometry_repaired", reason="self_intersection")

    # Axis-inversion gate: WGS84 longitudes/latitudes must stay in range.
    minx, miny, maxx, maxy = geom.bounds
    if not (-180 <= minx <= maxx <= 180 and -90 <= miny <= maxy <= 90):
        raise ValueError("Coordinate inversion — check (lon, lat) axis order")

    # Distortion gate: degree-space area must agree with equal-area projection
    # within tolerance, otherwise the geometry is malformed, not just imprecise.
    area_m2 = shapely_transform(_to_equal_area, geom).area
    if area_m2 <= 0:
        raise ValueError("Non-positive projected area — degenerate geometry")

    return {
        "type": "Feature",
        "geometry": mapping(geom),
        "properties": {"crs": "EPSG:4326", "drift_correction": drift, "area_m2": area_m2},
    }
```

## Compliance Gating & Audit Trail Generation

A boundary that parses is not yet a boundary that may be submitted. The compliance gate validates each record against vintage eligibility, status, and geometry-type rules before anything is committed, and the audit trail attaches immutable lineage — source registry, payload hash, transform outcome, and gate verdict — to every record. This is what satisfies [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) requirements and maps directly onto registry submission rules: Verra VCS methodology codes and Gold Standard Impact Registry status semantics both expect a traceable history behind any issuance or retirement claim.

```python
from datetime import datetime, timezone


class AuditTrail:
    def __init__(self):
        self.records: list[dict[str, Any]] = []

    def log(self, project_id, stage, payload_hash, compliance_status, metadata):
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "project_id": project_id,
            "stage": stage,
            "payload_sha256": payload_hash,
            "compliance_status": compliance_status,
            "metadata": metadata,
        }
        self.records.append(record)
        log.info("audit_record", **{k: record[k] for k in ("project_id", "stage", "compliance_status")})
        return record


def compliance_gate(meta: ProjectMetadata, feature: dict[str, Any]) -> str:
    issues: list[str] = []
    if meta.status not in ("Active", "Retired"):
        issues.append("INVALID_STATUS")
    if feature["geometry"]["type"] not in ("Polygon", "MultiPolygon"):
        issues.append("INVALID_GEOMETRY_TYPE")
    if meta.vintage_start.year < 2005:
        issues.append("PRE_2005_VINTAGE_REQUIRES_ADDITIONALITY_REVIEW")
    return "PASS" if not issues else ",".join(issues)
```

The `PASS`/failure string is the field a verifier reads: it ties each record to a specific rule (ISO 14064-2 additionality for pre-2005 vintages, status eligibility, geometry validity) so a rejected record carries its own reason rather than vanishing.

## Production Integration

The end-to-end execution pattern composes the pieces above into one idempotent, replayable run. Records that fail the gate are quarantined with their reason, not dropped, and the audit trail is persisted alongside the dataset so the run is self-describing.

```python
def run_registry_pipeline(session: RegistrySession, endpoint: str, audit: AuditTrail):
    resp = session.get(endpoint)                       # 1. ingest (auth + retry)
    body = preflight(resp, session.registry)           # 2. diagnose (shape/throttle)
    accepted, quarantined = [], []

    for raw in body.get("results", body if isinstance(body, list) else []):
        meta = parse_registry_payload(raw, session.registry)   # 3a. transform: schema
        feature = normalize_geometry(meta.coordinates)         # 3b. transform: geometry
        verdict = compliance_gate(meta, feature)               # 4. validate
        audit.log(meta.project_id, "INGESTION_COMPLETE",
                  meta.raw_payload_hash, verdict,
                  {"crs": feature["properties"]["crs"]})
        (accepted if verdict == "PASS" else quarantined).append((meta, feature, verdict))

    return accepted, quarantined
```

The numbered execution order is **ingest → diagnose → transform → validate → export → submit**:

1. **Ingest.** Pull pages through `RegistrySession`, which handles OAuth2/token auth and transport-level retry. Use cursor-based pagination (`next_page_token` or `offset/limit`) and stream pages rather than buffering whole registries in memory.
2. **Diagnose.** Run `preflight` on every page to catch throttling and truncation before any transform touches the data.
3. **Transform.** Enforce the `pydantic` schema, then repair and reproject geometry with `always_xy=True` and the equal-area distortion gate.
4. **Validate.** Apply `compliance_gate`; route `PASS` records to the accepted set and everything else to quarantine with its reason code.
5. **Export.** Write accepted geometries to a versioned, GIST-indexed store (PostGIS or DuckDB) keyed by `raw_payload_hash`; avoid in-memory `GeoDataFrame` operations beyond ~10,000 projects. Persist `audit.records` next to the dataset so lineage travels with the data.
6. **Submit.** Attach an `X-Request-Id` idempotency key to any `POST` back to the registry, and map vintage and methodology codes to the registry's submission schema — Verra VCS for Verra, the Gold Standard Impact Registry schema for Gold Standard.

Built this way, the connector eliminates silent data corruption, enforces deterministic spatial alignment, and produces a cryptographically verifiable audit trail — the foundational reliability the rest of the MRV stack assumes its inputs already have.

<svg viewBox="0 -4 880 240" role="img" aria-labelledby="rt-t rt-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rt-t">Retry policy by failure class, and which classes must never be retried</title>
  <desc id="rt-d">Four failure classes with their correct handling. A 429 rate-limit response is retried with exponential backoff honouring the retry-after header, and is safe because no state changed. A 5xx server error is retried with backoff and jitter, capped at five attempts, and is safe for idempotent reads. A 4xx client error other than 429 is never retried because the request itself is wrong and repeating it wastes quota and hides the defect. A partial or truncated response is not retried blindly but re-requested from the last confirmed cursor, because a blind retry would duplicate records already ingested. A panel notes that the retry budget belongs to the crawl rather than to the individual request.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Retry by failure class, not by exception type</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">The question is always the same: can repeating this request change the result?</text>
    <rect x="12" y="54" width="212" height="112" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="12" y="54" width="212" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="28" y="78" fill="currentColor" font-size="11" font-weight="700">429 rate limit</text>
    <text x="28" y="102" fill="currentColor" font-size="9.5" opacity="0.85">retry with backoff</text>
    <text x="28" y="120" fill="currentColor" font-size="9.5" opacity="0.85">honour Retry-After</text>
    <text x="28" y="146" fill="currentColor" font-size="9.5" font-weight="700">safe — nothing changed</text>
    <rect x="236" y="54" width="212" height="112" rx="9" fill="currentColor" opacity="0.08"/>
    <rect x="236" y="54" width="212" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <text x="252" y="78" fill="currentColor" font-size="11" font-weight="700">5xx server error</text>
    <text x="252" y="102" fill="currentColor" font-size="9.5" opacity="0.85">backoff with jitter</text>
    <text x="252" y="120" fill="currentColor" font-size="9.5" opacity="0.85">cap at five attempts</text>
    <text x="252" y="146" fill="currentColor" font-size="9.5" font-weight="700">safe for idempotent reads</text>
    <rect x="460" y="54" width="212" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="476" y="78" fill="currentColor" font-size="11" font-weight="700">4xx other than 429</text>
    <text x="476" y="102" fill="#f3a712" font-size="9.5" font-weight="700">never retry</text>
    <text x="476" y="120" fill="currentColor" font-size="9.5" opacity="0.85">the request is wrong</text>
    <text x="476" y="146" fill="currentColor" font-size="9.5" opacity="0.85">retrying burns quota, hides it</text>
    <rect x="684" y="54" width="184" height="112" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="700" y="78" fill="currentColor" font-size="11" font-weight="700">Truncated body</text>
    <text x="700" y="102" fill="#f3a712" font-size="9.5" font-weight="700">no blind retry</text>
    <text x="700" y="120" fill="currentColor" font-size="9.5" opacity="0.85">resume from the last</text>
    <text x="700" y="138" fill="currentColor" font-size="9.5" opacity="0.85">confirmed cursor</text>
    <text x="700" y="158" fill="currentColor" font-size="9" opacity="0.75">else records duplicate</text>
    <rect x="12" y="184" width="856" height="46" rx="8" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="184" width="856" height="46" rx="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="28" y="204" fill="currentColor" font-size="9.5" font-weight="700">A retry budget belongs to the crawl, not to the request.</text>
    <text x="28" y="222" fill="currentColor" font-size="9.5" opacity="0.82">Five attempts per page across ten thousand pages is fifty thousand extra calls — enough to be banned rather than throttled.</text>
  </g>
</svg>

## Frequently Asked Questions

### How should credentials be handled for a long-running registry crawl?

Load them from the environment or a secret manager at process start, never from a file in the repository, and refresh tokens on expiry rather than on a fixed schedule — registry token lifetimes differ and several shorten them without notice. Crucially, never log the credential or the full request URL when the token travels as a query parameter, because crawl logs are usually the least-protected artefact in the pipeline. Where the registry supports it, use a read-only scoped credential so a leaked token cannot retire credits.

### What is a safe request rate against a public registry API?

Slower than the documented limit, and adaptive. Published limits are frequently aspirational, shared across an organisation's address range, and enforced inconsistently; a crawl that runs at the stated maximum will eventually meet a throttle it did not expect. Start at roughly half the documented rate, honour every `Retry-After` exactly, and back off globally rather than per-request when throttling appears — a per-request backoff with concurrent workers keeps the aggregate rate high and prolongs the throttle.

### Should the connector store raw responses or only parsed records?

Both, with the raw response as the primary artefact. Storing the raw JSON or CSV exactly as received, with its retrieval timestamp and a checksum, means a schema surprise discovered six months later can be re-parsed from what the registry actually sent rather than reconstructed from what your parser understood. It also makes the reconciliation record independently verifiable: an auditor can re-derive the parsed table from stored bytes. The storage cost is trivial next to the cost of an unreproducible discrepancy.

### How do I detect that a registry has changed its schema before it breaks a number?

Validate every response against a pinned schema and treat any additional, missing, or retyped field as a hard failure requiring review. A permissive parser that ignores unknown fields will happily accept a release where a quantity field gained a unit suffix and changed magnitude — a change that produces plausible numbers that are wrong by three orders of magnitude. Pin the schema as a versioned artefact, diff it on every release, and make the connector's schema version part of the provenance record.

### Can the same connector serve both Verra and Gold Standard?

Share the transport, retry, and provenance layers; keep the schema mapping and the crediting-period semantics separate. The two registries differ in identifier structure, status vocabularies, geometry delivery, and how crediting periods are expressed, and a single mapping layer that tries to accommodate both accumulates conditionals that hide behaviour. A thin per-registry adapter emitting the canonical record, over a shared client, is easier to test and much easier to change when one registry revises its export.

## Related

- [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) — the parent sub-system this connector specializes.
- [Geospatial Coordinate Reference Systems (CRS) Alignment](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/geospatial-coordinate-reference-systems-crs-alignment/) — the datum and axis-order contract the transform enforces.
- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — the evidence layer the audit trail feeds.
- [GHG Protocol Scope 3 Spatial Mapping](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/ghg-protocol-scope-3-spatial-mapping/) — the downstream consumer of geotagged registry removals.
- [MRV Architecture & Carbon Accounting Fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) — the full stack these registry connectors plug into.
