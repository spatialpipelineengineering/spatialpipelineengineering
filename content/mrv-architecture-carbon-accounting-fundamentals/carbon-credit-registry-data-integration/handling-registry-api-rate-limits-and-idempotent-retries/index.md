---
shortTitle: "Handling Registry API Rate Limits and Idempotent Retries"
title: "Handling Registry API Rate Limits and Idempotent Retries"
description: "Build a registry connector that survives throttling without losing or duplicating records: adaptive global backoff, cursor checkpoints, retry classification by failure type, and a crawl-completeness assertion."
slug: handling-registry-api-rate-limits-and-idempotent-retries
type: guide
breadcrumb: "Rate Limits & Idempotent Retries"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Handling Registry API Rate Limits and Idempotent Retries

A registry crawl that runs for six hours and finishes with 94% of the records is worse than one that fails at the first throttle, because the first produces a plausible dataset and the second produces an obvious problem. This guide builds a connector that cannot do the former, within [carbon credit registry data integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) in the [MRV architecture and carbon accounting fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. It assumes the pagination and schema-pinning discipline from [integrating Verra and Gold Standard APIs into Python pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/integrating-verra-gold-standard-apis-into-python-pipelines/), and adds the operational layer that keeps a long crawl honest.

Three properties do the work. The crawl must **back off globally rather than per request**, because concurrent workers each backing off independently keep the aggregate rate high and prolong the throttle. It must **checkpoint its cursor durably**, so an interrupted crawl resumes rather than restarts. And it must **assert completeness against an independently known total**, because the one thing a partial crawl never does is announce itself.

<svg viewBox="0 -4 940 262" role="img" aria-labelledby="rl-t rl-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="rl-t">Per-request backoff against global backoff under throttling</title>
  <desc id="rl-d">Two timelines of eight concurrent workers meeting a rate limit. With per-request backoff, each worker sleeps independently after its own 429 response, so the workers desynchronise and the aggregate request rate stays near the limit; the throttle persists for the whole window and the crawl takes 41 minutes. With a shared global backoff, the first 429 pauses every worker together, the aggregate rate drops below the limit immediately, the throttle clears after one interval, and the crawl takes 12 minutes. A panel notes that the second arrangement issues far fewer requests overall and finishes more than three times faster, and that a per-request backoff can escalate a throttle into an outright block.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Back off together, not individually</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Eight concurrent workers meeting the same rate limit.</text>
    <text x="12" y="70" fill="currentColor" font-size="10" font-weight="700">Per-request backoff</text>
    <text x="12" y="86" fill="currentColor" font-size="9" opacity="0.7">each worker sleeps alone</text>
  </g>
  <g>
    <rect x="196" y="56" width="560" height="20" rx="4" fill="#f3a712" opacity="0.34"/>
    <rect x="196" y="80" width="560" height="20" rx="4" fill="#f3a712" opacity="0.22"/>
    <text x="766" y="72" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">throttled throughout</text>
    <text x="766" y="94" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.8">41 min · 18 400 requests</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="150" fill="currentColor" font-size="10" font-weight="700">Global backoff</text>
    <text x="12" y="166" fill="currentColor" font-size="9" opacity="0.7">first 429 pauses everyone</text>
  </g>
  <g>
    <rect x="196" y="136" width="84" height="20" rx="4" fill="#f3a712" opacity="0.34"/>
    <rect x="284" y="136" width="180" height="20" rx="4" fill="currentColor" opacity="0.26"/>
    <rect x="196" y="160" width="84" height="20" rx="4" fill="currentColor" opacity="0.14"/>
    <rect x="284" y="160" width="180" height="20" rx="4" fill="currentColor" opacity="0.26"/>
    <text x="474" y="152" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">throttle clears after one interval</text>
    <text x="474" y="174" font-family="system-ui, sans-serif" font-size="9.5" fill="currentColor" opacity="0.8">12 min · 5 100 requests</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="200" width="916" height="52" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="200" width="916" height="52" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="28" y="222" fill="currentColor" font-size="10" font-weight="700">Fewer requests, less wall clock, and no escalation.</text>
    <text x="28" y="242" fill="currentColor" font-size="9.5" opacity="0.85">Independent backoff keeps the aggregate rate at the limit, which is what turns a throttle into a block on some registries.</text>
  </g>
</svg>

## Root Cause Analysis

Three properties of registry APIs make naive retry logic actively harmful rather than merely inefficient.

**Rate limits are usually shared and usually undocumented in their real form.** A published limit of, say, sixty requests a minute is often enforced against an organisation or an address range rather than a token, applied over a sliding window rather than a fixed one, and accompanied by burst allowances that are not described anywhere. The practical consequence is that a crawl tuned to the documented number will meet a throttle it did not expect, at an unpredictable moment, usually deep into a long run.

**A throttle response is not an error, and treating it as one causes damage.** A `429` means the request was refused before doing anything, so the safe response is to wait exactly as long as the server asked and try again. A `500` means the server failed while possibly doing something, so the safe response depends on whether the operation is idempotent. A `400` means the request itself is wrong, so retrying is pure waste that consumes quota and hides the defect. Collapsing these into one retry policy — the default in most HTTP client wrappers — produces a connector that hammers a broken request sixty times and gives up on a recoverable throttle.

**Interruption is normal at this duration.** A full portfolio reconciliation across several registries takes hours, and over that window a token expires, a deploy restarts the worker, or the network blips. A crawl that holds its progress only in memory turns every interruption into a restart, and a restart against a rate-limited API is exactly the expensive operation you are trying to avoid. Durable cursor checkpoints turn a six-hour restart into a two-minute resume.

The failure that follows from all three is the same one: a crawl that ends early, reports success because no exception escaped, and hands downstream a dataset missing an unknown fraction of its records.

## Diagnostic Pipeline / Pre-Flight Validation

Before the crawl, establish what "complete" means. A registry that publishes a result count, a total-pages header, or a stable identifier range gives you an independent expectation; without one, completeness cannot be asserted and the crawl's own output becomes its only witness, which is exactly the circularity to avoid.

```python
from dataclasses import dataclass

import httpx
import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class CrawlExpectation:
    """What the crawl must produce, established BEFORE it starts.

    Derived from the registry rather than from the crawl, because a crawl that
    defines its own success criterion cannot fail a completeness check.
    """
    source: str
    expected_total: int | None
    counting_method: str
    snapshot_token: str | None


def establish_expectation(client: httpx.Client, base_url: str,
                          query: dict) -> CrawlExpectation:
    """Ask the registry how many records the query matches, before fetching any.

    Three mechanisms in decreasing order of reliability: an explicit count
    endpoint, a total header on the first page, and a stable identifier range.
    """
    try:
        head = client.get(f"{base_url}/projects/count", params=query, timeout=30)
        if head.status_code == 200:
            payload = head.json()
            total = int(payload["count"])
            return CrawlExpectation("count_endpoint", total, "explicit count",
                                    payload.get("snapshot"))
    except (httpx.HTTPError, KeyError, ValueError):
        pass

    first = client.get(f"{base_url}/projects", params={**query, "limit": 1}, timeout=30)
    first.raise_for_status()
    header_total = first.headers.get("x-total-count")
    if header_total and header_total.isdigit():
        return CrawlExpectation("total_header", int(header_total), "response header",
                                first.headers.get("x-snapshot"))

    # No independent expectation available: record that fact rather than
    # inventing one, so the completeness assertion downstream is honest.
    log.warning("crawl.no_expectation", base_url=base_url,
                note="completeness cannot be asserted; crawl output is its own witness")
    return CrawlExpectation("none", None, "unavailable", None)


def probe_rate_limit(client: httpx.Client, base_url: str) -> dict:
    """Read whatever the registry advertises, then plan for it being wrong.

    Published limits are frequently aspirational and often shared across an
    organisation, so the probe informs the starting rate, not the ceiling.
    """
    response = client.get(f"{base_url}/projects", params={"limit": 1}, timeout=30)
    advertised = {
        "limit": response.headers.get("x-ratelimit-limit"),
        "remaining": response.headers.get("x-ratelimit-remaining"),
        "reset": response.headers.get("x-ratelimit-reset"),
        "retry_after_supported": "retry-after" in {k.lower() for k in response.headers},
    }
    log.info("crawl.rate_limit_probe", **advertised)
    return advertised
```

The `establish_expectation` function's least useful branch is the important one. Recording that no independent count was available is what stops a later reader assuming the crawl was verified — the difference between "we checked and it was complete" and "we could not check", which matters a great deal to a verifier and not at all to the code.

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="cls-t cls-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cls-t">Response classification and the action each class requires</title>
  <desc id="cls-d">Five response classes with their correct handling. A 429 rate limit triggers a global pause honouring the retry-after header, and is always safe to repeat because nothing happened. A 503 or 502 gateway error triggers a global pause with jitter, safe for idempotent reads. A 500 internal error retries the individual request up to a small cap, safe only for reads. A 401 or 403 triggers a token refresh and one retry, then stops, because repeating an authentication failure never succeeds. A 400 or 404 stops immediately and records the request, because the request itself is malformed and repeating it consumes quota while hiding the defect. A panel notes that only the first two justify pausing the whole crawl.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Classify before retrying</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">One retry policy for five different situations is how a connector gets blocked.</text>
    <rect x="12" y="50" width="876" height="34" rx="6" fill="currentColor" opacity="0.12"/>
    <text x="28" y="72" fill="currentColor" font-size="10" font-weight="700">429 rate limit</text>
    <text x="240" y="72" fill="currentColor" font-size="9.5">global pause, honour Retry-After exactly</text>
    <text x="874" y="72" text-anchor="end" fill="currentColor" font-size="9.5" font-weight="700">always safe</text>
    <rect x="12" y="88" width="876" height="34" rx="6" fill="currentColor" opacity="0.12"/>
    <text x="28" y="110" fill="currentColor" font-size="10" font-weight="700">502 / 503 gateway</text>
    <text x="240" y="110" fill="currentColor" font-size="9.5">global pause with jitter, capped attempts</text>
    <text x="874" y="110" text-anchor="end" fill="currentColor" font-size="9.5" font-weight="700">safe for reads</text>
    <rect x="12" y="126" width="876" height="34" rx="6" fill="currentColor" opacity="0.06"/>
    <text x="28" y="148" fill="currentColor" font-size="10" font-weight="700">500 internal</text>
    <text x="240" y="148" fill="currentColor" font-size="9.5">retry this request only, small cap</text>
    <text x="874" y="148" text-anchor="end" fill="currentColor" font-size="9.5">safe for reads</text>
    <rect x="12" y="164" width="876" height="34" rx="6" fill="none" stroke="#f3a712" stroke-width="1.6" stroke-dasharray="5,3"/>
    <text x="28" y="186" fill="currentColor" font-size="10" font-weight="700">401 / 403 auth</text>
    <text x="240" y="186" fill="currentColor" font-size="9.5">refresh the token, retry once, then stop</text>
    <text x="874" y="186" text-anchor="end" fill="#f3a712" font-size="9.5" font-weight="700">never loop</text>
    <rect x="12" y="202" width="876" height="34" rx="6" fill="none" stroke="#f3a712" stroke-width="1.6" stroke-dasharray="5,3"/>
    <text x="28" y="224" fill="currentColor" font-size="10" font-weight="700">400 / 404 client</text>
    <text x="240" y="224" fill="currentColor" font-size="9.5">stop and record the request that failed</text>
    <text x="874" y="224" text-anchor="end" fill="#f3a712" font-size="9.5" font-weight="700">never retry</text>
  </g>
</svg>

## Deterministic Transformation Logic

The crawler below implements the three properties. A shared limiter that every worker consults before sending, a durable cursor checkpoint written after each page, and a completeness assertion that runs before the crawl is allowed to report success.

```python
import asyncio
import json
import time
from dataclasses import dataclass, asdict
from pathlib import Path

import httpx
import structlog

log = structlog.get_logger()

MAX_ATTEMPTS = 5
BASE_DELAY_S = 2.0


class GlobalLimiter:
    """A pause every worker respects.

    The critical property is that a 429 seen by ONE worker stops ALL of them.
    Per-worker backoff keeps the aggregate rate at the limit, which prolongs the
    throttle and, on some registries, escalates it to a block.
    """

    def __init__(self) -> None:
        self._resume_at = 0.0
        self._lock = asyncio.Lock()

    async def wait(self) -> None:
        while True:
            async with self._lock:
                delay = self._resume_at - time.monotonic()
            if delay <= 0:
                return
            await asyncio.sleep(min(delay, 5.0))

    async def pause(self, seconds: float, reason: str) -> None:
        async with self._lock:
            resume = time.monotonic() + seconds
            if resume > self._resume_at:          # never shorten an existing pause
                self._resume_at = resume
                log.warning("crawl.global_pause", seconds=round(seconds, 1), reason=reason)


@dataclass
class Checkpoint:
    """Durable crawl position. Written after every page, read on start."""
    source: str
    cursor: str | None
    pages_done: int
    records_seen: int
    snapshot_token: str | None

    def save(self, path: Path) -> None:
        path.write_text(json.dumps(asdict(self)))

    @classmethod
    def load(cls, path: Path, source: str) -> "Checkpoint":
        if path.exists():
            data = json.loads(path.read_text())
            if data.get("source") == source:
                log.info("crawl.resume", **data)
                return cls(**data)
        return cls(source=source, cursor=None, pages_done=0, records_seen=0,
                   snapshot_token=None)


def classify(status: int) -> str:
    """Five classes, five actions. Never one policy."""
    if status == 429:
        return "global_pause"
    if status in (502, 503, 504):
        return "global_pause"
    if status >= 500:
        return "retry_request"
    if status in (401, 403):
        return "refresh_once"
    return "stop"


async def fetch_page(client: httpx.AsyncClient, url: str, params: dict,
                     limiter: GlobalLimiter, refresh_token) -> httpx.Response:
    """One page, with classification-driven retry. Never blind."""
    refreshed = False
    for attempt in range(1, MAX_ATTEMPTS + 1):
        await limiter.wait()
        response = await client.get(url, params=params, timeout=60)

        if response.status_code == 200:
            return response

        action = classify(response.status_code)
        if action == "stop":
            log.error("crawl.request_rejected", status=response.status_code,
                      url=url, params=params,
                      note="the request is wrong; retrying would burn quota and hide it")
            response.raise_for_status()

        if action == "refresh_once":
            if refreshed:
                response.raise_for_status()
            await refresh_token()
            refreshed = True
            continue

        if action == "global_pause":
            # Honour Retry-After exactly when given; the server knows its window.
            retry_after = response.headers.get("retry-after")
            delay = float(retry_after) if (retry_after or "").replace(".", "").isdigit() \
                else BASE_DELAY_S * (2 ** (attempt - 1))
            await limiter.pause(delay, reason=f"status_{response.status_code}")
            continue

        await asyncio.sleep(BASE_DELAY_S * (2 ** (attempt - 1)))

    raise RuntimeError(f"exhausted {MAX_ATTEMPTS} attempts for {url}")


async def crawl(base_url: str, query: dict, expectation: CrawlExpectation,
                checkpoint_path: Path, client: httpx.AsyncClient,
                refresh_token) -> dict:
    """Resume-capable crawl with a completeness assertion at the end."""
    limiter = GlobalLimiter()
    state = Checkpoint.load(checkpoint_path, base_url)
    records: list[dict] = []

    while True:
        params = {**query, "limit": 200}
        if state.cursor:
            params["after"] = state.cursor

        response = await fetch_page(client, f"{base_url}/projects", params,
                                    limiter, refresh_token)
        payload = response.json()
        page = payload.get("items", [])
        if not page:
            break

        # A snapshot token changing mid-crawl means the collection moved under
        # us; the pages already fetched no longer describe one consistent state.
        token = payload.get("snapshot")
        if state.snapshot_token and token and token != state.snapshot_token:
            raise RuntimeError(
                f"snapshot changed mid-crawl ({state.snapshot_token} -> {token}); restart")
        state.snapshot_token = state.snapshot_token or token

        records.extend(page)
        state.cursor = page[-1]["id"]
        state.pages_done += 1
        state.records_seen += len(page)
        state.save(checkpoint_path)             # durable, after every page

        log.info("crawl.page", pages=state.pages_done, records=state.records_seen,
                 cursor=state.cursor)

    result = {"source": base_url, "records": len(records),
              "pages": state.pages_done, "expected": expectation.expected_total,
              "counting_method": expectation.counting_method}

    if expectation.expected_total is not None:
        if len(records) != expectation.expected_total:
            log.error("crawl.incomplete", **result,
                      shortfall=expectation.expected_total - len(records))
            raise RuntimeError(
                f"crawl returned {len(records)} of {expectation.expected_total} records")
        result["completeness_verified"] = True
    else:
        result["completeness_verified"] = False

    checkpoint_path.unlink(missing_ok=True)     # only on verified success
    log.info("crawl.complete", **result)
    return result
```

Three details carry the weight. The limiter **never shortens an existing pause**, so a worker that sees a shorter `Retry-After` cannot undo a longer one. The snapshot check **fails the crawl when the collection changes mid-run**, because pages fetched before and after a change do not describe one consistent state and silently mixing them produces a dataset that matches no moment in the registry's history. And the checkpoint is **deleted only after verified success**, so a crashed crawl always resumes rather than starting over.

## Compliance Gating & Audit Trail Generation

A crawl is an evidence-gathering operation, and its record needs four things a normal ETL job does not.

**The snapshot identity.** A reconciliation asserts something about the registry's state at a point in time, so the record must name that point — a snapshot token where the registry provides one, and the crawl's start and end timestamps in UTC where it does not. Without it, a discrepancy between your ledger and the registry cannot be attributed to timing versus error.

**The completeness verdict, including when it could not be established.** `completeness_verified: false` is a legitimate and important value. A downstream consumer treating an unverified crawl as authoritative is making an assumption the crawl explicitly declined to make, and recording the distinction is what lets a verifier see which claims rest on a checked total.

**The rejected requests.** Anything classified as `stop` — a malformed query, a 404 on an identifier you believed existed — is a finding rather than noise, and it belongs in the record with the request that produced it. A 404 on a project you hold credits from is a materially different event from a 404 on a typo.

**The retry and pause history**, aggregated. A crawl that spent forty minutes throttled is telling you the schedule is too aggressive; one that suddenly starts throttling where it did not before is telling you the registry changed something. Route these into the observability streams described under [MRV pipeline observability and failure modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/), and keep the completeness verdict and snapshot identity in the durable evidence stream alongside the reconciliation output.

<svg viewBox="0 -4 880 236" role="img" aria-labelledby="ckp-t ckp-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="ckp-t">Cost of an interruption, with and without a durable cursor checkpoint</title>
  <desc id="ckp-d">Two crawls of the same 9 400 record collection interrupted at 78 percent by a worker restart. Without a checkpoint, the crawl restarts from the beginning, re-issues every request already made, and takes a further 34 minutes against a rate-limited API, for a total of 61 minutes and 12 200 requests. With a durable cursor checkpoint written after every page, the crawl resumes at the last confirmed cursor, issues only the remaining requests, and completes in a further 6 minutes, for a total of 33 minutes and 5 300 requests. A panel notes that the checkpoint costs one small write per page and that the interruption rate over a multi-hour crawl is high enough that resume should be treated as the normal path rather than the exception.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Resume is the normal path, not the exception</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Same 9 400-record collection, interrupted at 78% by a worker restart.</text>
    <text x="12" y="74" fill="currentColor" font-size="10" font-weight="700">No checkpoint</text>
    <text x="12" y="90" fill="currentColor" font-size="9" opacity="0.7">restarts from zero</text>
    <text x="12" y="150" fill="currentColor" font-size="10" font-weight="700">Cursor checkpoint</text>
    <text x="12" y="166" fill="currentColor" font-size="9" opacity="0.7">written after every page</text>
  </g>
  <g>
    <rect x="180" y="58" width="382" height="22" rx="4" fill="currentColor" opacity="0.26"/>
    <text x="371" y="74" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">27 min to 78%</text>
    <rect x="180" y="84" width="480" height="22" rx="4" fill="#f3a712" opacity="0.34"/>
    <text x="420" y="100" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">34 min re-crawling what it already had</text>
    <text x="672" y="92" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">61 min · 12 200 requests</text>
    <rect x="180" y="134" width="382" height="22" rx="4" fill="currentColor" opacity="0.26"/>
    <text x="371" y="150" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">27 min to 78%</text>
    <rect x="180" y="160" width="86" height="22" rx="4" fill="currentColor" opacity="0.3"/>
    <text x="223" y="176" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">6 min</text>
    <text x="280" y="176" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="currentColor">33 min · 5 300 requests</text>
  </g>
  <g font-family="system-ui, sans-serif">
    <rect x="12" y="196" width="856" height="30" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="216" fill="currentColor" font-size="9.5" font-weight="700">The checkpoint costs one small write per page. Over a multi-hour crawl against a rate-limited API, it pays for itself the first time anything restarts.</text>
  </g>
</svg>

## Production Integration

1. **Establish the expectation first** from a count endpoint, a total header, or a stable identifier range, and record when none is available.
2. **Probe the advertised limits** to set a starting rate, then run at roughly half of it and let the adaptive pause find the real ceiling.
3. **Share one limiter across all workers** for a given registry, and key it on the registry rather than the process, so several concurrent jobs do not each discover the throttle independently.
4. **Checkpoint the cursor after every page** to durable storage, and treat resume as the normal path rather than the exception.
5. **Classify every non-200 response** before deciding what to do with it, and never retry a `4xx` other than 429.
6. **Assert completeness before reporting success**, and fail the run on a shortfall rather than logging it.

Two operational notes. Schedule full reconciliations off-peak for the registry's own timezone where you can infer it — throttling is frequently a function of overall load rather than your own rate. And keep the raw responses, as recommended in the parent guide: a crawl that verified its completeness and stored its bytes can be re-parsed after a schema surprise without touching the registry again, which is worth a great deal when the registry is the rate-limited resource.

## Frequently Asked Questions

### Should the connector run concurrently at all?

Yes, but with the concurrency bounded by the shared limiter rather than by the worker count. Concurrency helps because most of the time is latency rather than transfer, and four to eight in-flight requests typically saturate what a registry will allow. Beyond that you are queueing at the server rather than at your own client, which converts throughput into throttling. The limiter makes the concurrency safe; without it, adding workers reliably makes a crawl slower.

### What if a registry offers no way to know the expected total?

Record that fact and use the weaker checks available. Page-count monotonicity, an identifier range with no gaps, and comparison against the previous period's record count all give partial assurance, and a large unexplained drop against last period is a strong signal even without an authoritative total. What matters is that the resulting record says the completeness check was partial, so nobody downstream treats it as verified.

### How should token expiry mid-crawl be handled?

Refresh once on a 401 and retry the same request; if the retry also fails, stop. A refresh loop is one of the classic ways to get an account blocked, because a genuinely invalid credential produces an infinite sequence of refresh-and-retry that looks exactly like an attack. Refresh proactively on a timer set well inside the token lifetime as well, so mid-crawl expiry is rare rather than routine.

### Is it safe to run two crawls of the same registry at once?

Only if they share a limiter and target disjoint queries, and it is rarely worth it. Two concurrent crawls double the request rate against a limit that is usually shared, so each becomes more than twice as slow. Where a portfolio spans several registries, run those in parallel with a limiter per registry — that genuinely parallelises, because the limits are independent.

### What should happen when the snapshot changes mid-crawl?

Fail and restart. Pages fetched before and after a change describe two different states of the collection, and stitching them together produces a dataset that never existed — with records that may be duplicated, missing, or internally inconsistent. Restarting is expensive against a rate-limited API, which is the argument for keeping crawls short enough to complete inside a stable window rather than for tolerating the inconsistency.

### How do retries interact with the idempotency of the wider pipeline?

Reads are naturally idempotent, so retrying a page fetch is safe; the risk lives in what you do with the result. Writing crawled records with an append rather than a deterministic upsert means a resumed crawl duplicates whatever the interrupted one had already written. Key the write on the registry's own record identifier and the snapshot, so a re-fetched page overwrites rather than accumulates — the same deterministic-key discipline that makes [building idempotent backfills for carbon pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/orchestrating-mrv-data-pipelines/building-idempotent-backfills-for-carbon-pipelines/) safe.

### How aggressive should the retry cap be?

Low, and paired with a crawl-level budget. Five attempts per request is generous for a read; what matters more is a cap on total retries across the crawl, because five attempts on each of ten thousand pages is fifty thousand extra requests against a limit you are already exceeding. A crawl that has spent more than a stated fraction of its requests on retries should stop and raise, since it is no longer making progress and is actively making the throttle worse.

## Related guides

- [Carbon Credit Registry Data Integration](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/) — the parent topic and the reconciliation model this crawl feeds.
- [Integrating Verra & Gold Standard APIs into Python Pipelines](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/integrating-verra-gold-standard-apis-into-python-pipelines/) — pagination, schema pinning, and the connector layer this builds on.
- [Reconciling Credit Serial Numbers Across Registries](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/carbon-credit-registry-data-integration/reconciling-credit-serial-numbers-across-registries/) — what the crawled records are reconciled against.
- [MRV Pipeline Observability & Failure Modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/) — where the completeness verdict and throttle history are recorded.
