---
shortTitle: "Failure Mode Catalog for Emissions Validation Gates"
title: "Failure Mode Catalog for Emissions Validation Gates"
description: "Ten ways a validation gate fails while reporting success: coercion, sampled checks, muted alerts, quarantine leaks and threshold rot — each with its signature, a diagnostic, and the control that closes it."
slug: failure-mode-catalog-for-emissions-validation-gates
type: guide
breadcrumb: "Validation Gate Failure Modes"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Failure Mode Catalog for Emissions Validation Gates

A validation gate that has never blocked anything is not a clean pipeline; it is an untested control. This catalogue collects the ways a gate fails while continuing to report success, within [emissions data quality and validation gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/) in the [MRV architecture and carbon accounting fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. It is the companion to the cross-stage [failure mode catalog for spatial MRV pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/failure-mode-catalog-for-spatial-mrv-pipelines/), narrowed to the validation layer itself.

The organising insight is that a gate has two ways to be wrong and only one of them is visible. It can block something it should have passed, which produces an incident, a conversation, and a fix. Or it can pass something it should have blocked, which produces nothing at all — no error, no alert, no signal — until a verifier finds the record months later. Every entry below is a variant of the second.

<svg viewBox="0 -4 940 256" role="img" aria-labelledby="gf-t gf-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="gf-t">Ten gate failure modes grouped by where the gate breaks</title>
  <desc id="gf-d">A grid of ten failure modes in three groups. The definition group covers a check that coerces instead of rejecting, a threshold fitted to observed data rather than physics, and a check whose classification as blocking or advisory is wrong. The coverage group covers a suite that runs only at ingestion, a check sampled rather than applied to every row, a gate skipped when a downstream job is behind, and a schema check that permits unexpected columns. The response group covers alerts muted after fatigue, quarantined records with no exit path, and a documented exception that outlives its justification. A panel notes that none of the ten produce an error, and that all ten leave the pipeline reporting success.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Ten ways to pass something you should have blocked</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">None of them raise. All of them leave the run green.</text>
    <rect x="12" y="52" width="298" height="182" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="12" y="52" width="298" height="182" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">Definition — the check is wrong</text>
    <text x="28" y="102" fill="currentColor" font-size="9.5" opacity="0.85">1 · coerces instead of rejecting</text>
    <text x="28" y="124" fill="currentColor" font-size="9.5" opacity="0.85">2 · threshold fitted to observed data</text>
    <text x="28" y="146" fill="currentColor" font-size="9.5" opacity="0.85">3 · blocking/advisory misclassified</text>
    <text x="28" y="176" fill="currentColor" font-size="9" opacity="0.72">the gate does what it was told,</text>
    <text x="28" y="192" fill="currentColor" font-size="9" opacity="0.72">and what it was told is wrong</text>
    <rect x="322" y="52" width="298" height="182" rx="9" fill="currentColor" opacity="0.07"/>
    <rect x="322" y="52" width="298" height="182" rx="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="338" y="76" fill="currentColor" font-size="10.5" font-weight="700">Coverage — it never ran</text>
    <text x="338" y="102" fill="currentColor" font-size="9.5" opacity="0.85">4 · suite only at ingestion</text>
    <text x="338" y="124" fill="currentColor" font-size="9.5" opacity="0.85">5 · sampled, not applied to all rows</text>
    <text x="338" y="146" fill="currentColor" font-size="9.5" opacity="0.85">6 · skipped when the queue is behind</text>
    <text x="338" y="168" fill="currentColor" font-size="9.5" opacity="0.85">7 · schema permits extra columns</text>
    <text x="338" y="196" fill="currentColor" font-size="9" opacity="0.72">the data never met the check</text>
    <rect x="632" y="52" width="296" height="182" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="648" y="76" fill="currentColor" font-size="10.5" font-weight="700">Response — nobody acted</text>
    <text x="648" y="102" fill="currentColor" font-size="9.5" opacity="0.85">8 · alerts muted after fatigue</text>
    <text x="648" y="124" fill="currentColor" font-size="9.5" opacity="0.85">9 · quarantine with no exit path</text>
    <text x="648" y="146" fill="currentColor" font-size="9.5" opacity="0.85">10 · exception outliving its reason</text>
    <text x="648" y="176" fill="#f3a712" font-size="9" font-weight="700">the check worked and fired,</text>
    <text x="648" y="192" fill="#f3a712" font-size="9" font-weight="700">and the finding went nowhere</text>
  </g>
</svg>

## Root Cause Analysis

The ten entries share three underlying causes, and naming the cause shortens the diagnosis considerably.

**A gate that can adjust rather than refuse will eventually adjust.** Coercion is the archetype: a schema that casts a string to a float, a unit converter that guesses when the unit is absent, a geometry repair that runs automatically on invalid input. Each is a small convenience that turns a detectable defect into an undocumented assumption, and the assumption then propagates silently. The rule that closes the whole class is that a gate has exactly two outcomes — pass, or refuse and quarantine — and no third option that quietly fixes things.

**Coverage decays faster than definitions.** Check definitions are reviewed; where and when they run rarely is. A suite attached to the ingestion stage stays attached while three new stages appear downstream of it, a sampling rate introduced for a performance problem outlives the problem, and a "skip validation when behind" switch added during an incident becomes permanent. None of these change any check's logic, and all of them reduce what the checks see.

**A finding with no owner is not a control.** Gates 8 through 10 all have working checks that fired correctly. What failed was the response path — an alert channel nobody reads, a quarantine queue nobody drains, an exception granted for one period that nobody revisits. From a verifier's standpoint these are indistinguishable from having no check at all, and they are more expensive because the organisation believed it was covered.

## Diagnostic Pipeline / Pre-Flight Validation

Most of the catalogue is detectable by auditing the gate layer itself rather than the data. The checks below answer three questions: does every check actually run on everything, has any check ever fired, and is every finding resolved.

```python
from dataclasses import dataclass
from datetime import date, timedelta

import structlog

log = structlog.get_logger()


@dataclass(frozen=True)
class GateHealth:
    check_id: str
    blocking: bool
    runs_in_period: int
    rows_evaluated: int
    rows_in_scope: int
    fired_ever: bool
    days_since_last_fire: int | None
    verdict: str


def audit_checks(stats: list[dict], expected_runs: int,
                 today: date) -> list[GateHealth]:
    """Audit the gates, not the data.

    Three questions per check: did it run everywhere it should have, did it see
    every row, and has it ever fired. A check that has never fired in two years
    is either describing something impossible or is miscalibrated — and both
    deserve investigation rather than comfort.
    """
    out = []
    for s in stats:
        coverage = s["rows_evaluated"] / max(s["rows_in_scope"], 1)
        last_fire = s.get("last_fired")
        days_since = (today - last_fire).days if last_fire else None

        verdict = "healthy"
        if s["runs_in_period"] < expected_runs:
            verdict = "under_run"
        elif coverage < 0.999:
            verdict = "sampled_or_partial"
        elif not s["fired_ever"] and s.get("age_days", 0) > 730:
            verdict = "never_fired_in_two_years"
        elif s["blocking"] and days_since is not None and days_since > 365:
            verdict = "dormant_blocking_check"

        health = GateHealth(
            check_id=s["check_id"], blocking=s["blocking"],
            runs_in_period=s["runs_in_period"], rows_evaluated=s["rows_evaluated"],
            rows_in_scope=s["rows_in_scope"], fired_ever=s["fired_ever"],
            days_since_last_fire=days_since, verdict=verdict,
        )
        if verdict != "healthy":
            log.warning("gate.audit", **health.__dict__)
        out.append(health)

    return out


def audit_dispositions(quarantine: list[dict], today: date,
                       max_age_days: int = 45) -> dict:
    """Every quarantined record must exit through a door.

    Corrected, excepted with an owner, or formally excluded and disclosed. A
    record with no disposition is an undisclosed omission from the total, and a
    growing queue is a shrinking reported figure.
    """
    stale, unowned = [], []
    for record in quarantine:
        age = (today - record["quarantined_on"]).days
        if record.get("disposition") is None:
            if age > max_age_days:
                stale.append(record["record_id"])
            if record.get("owner") is None:
                unowned.append(record["record_id"])

    result = {
        "queue_depth": len(quarantine),
        "unresolved": sum(1 for r in quarantine if r.get("disposition") is None),
        "stale": len(stale), "unowned": len(unowned),
        "oldest_days": max(((today - r["quarantined_on"]).days for r in quarantine),
                           default=0),
    }
    if stale or unowned:
        log.error("gate.quarantine_unresolved", **result,
                  example_stale=stale[:3], example_unowned=unowned[:3])
    return result


def audit_exceptions(exceptions: list[dict], today: date) -> dict:
    """A documented exception is a control weakening with an expiry date.

    One without an expiry is permanent by accident, which is how a temporary
    workaround becomes the reason a figure could not be substantiated.
    """
    expired = [e for e in exceptions
               if e.get("expires_on") and e["expires_on"] < today]
    perpetual = [e for e in exceptions if not e.get("expires_on")]

    result = {"active": len(exceptions), "expired_still_active": len(expired),
              "no_expiry": len(perpetual)}
    if expired or perpetual:
        log.error("gate.exceptions_unbounded", **result,
                  example=[e["exception_id"] for e in (expired + perpetual)[:3]])
    return result
```

The `never_fired_in_two_years` verdict is the one teams resist and should not. A check that has never fired is describing either something that genuinely cannot happen — in which case it is documentation rather than a control, and its cost is misleading confidence — or something it is failing to detect. Both readings warrant a deliberate test: feed the check a record you know should fail and confirm it does.

<svg viewBox="0 -4 900 254" role="img" aria-labelledby="cov-t cov-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="cov-t">Where the suite runs against where the defects are introduced</title>
  <desc id="cov-d">A four-stage pipeline with two overlays. The first overlay shows a validation suite attached only at ingestion, covering the first stage. The second overlay shows where defects are actually introduced, with a small share at ingestion and the majority spread across harmonisation, factor application and aggregation — a wrong reprojection, a stale factor version, a partial write. The uncovered region spanning the last three stages is highlighted. A panel notes that a suite attached at ingestion tests the source rather than the pipeline, and that the defects most damaging to a carbon figure are all introduced downstream of it.</desc>
  <defs>
    <marker id="cov-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">A suite at ingestion tests the source, not the pipeline</text>
    <rect x="12" y="86" width="200" height="62" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="12" y="86" width="200" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="112" y="112" fill="currentColor" font-size="10.5" font-weight="700">Ingestion</text>
    <text x="112" y="132" fill="currentColor" font-size="9" opacity="0.78">suite attached here</text>
    <rect x="232" y="86" width="200" height="62" rx="9" fill="currentColor" opacity="0.05"/>
    <rect x="232" y="86" width="200" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="332" y="112" fill="currentColor" font-size="10.5" font-weight="700">Harmonisation</text>
    <text x="332" y="132" fill="#f3a712" font-size="9" font-weight="700">wrong reprojection</text>
    <rect x="452" y="86" width="200" height="62" rx="9" fill="currentColor" opacity="0.05"/>
    <rect x="452" y="86" width="200" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="552" y="112" fill="currentColor" font-size="10.5" font-weight="700">Factor application</text>
    <text x="552" y="132" fill="#f3a712" font-size="9" font-weight="700">stale factor version</text>
    <rect x="672" y="86" width="216" height="62" rx="9" fill="currentColor" opacity="0.05"/>
    <rect x="672" y="86" width="216" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5,3"/>
    <text x="780" y="112" fill="currentColor" font-size="10.5" font-weight="700">Aggregation</text>
    <text x="780" y="132" fill="#f3a712" font-size="9" font-weight="700">partial write</text>
    <text x="112" y="66" fill="currentColor" font-size="9.5" font-weight="700">covered</text>
    <text x="560" y="66" fill="#f3a712" font-size="9.5" font-weight="700">uncovered — and where the damage happens</text>
    <rect x="232" y="72" width="656" height="84" rx="9" fill="#f3a712" opacity="0.08"/>
    <rect x="12" y="176" width="876" height="62" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="176" width="876" height="62" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="450" y="200" fill="currentColor" font-size="10" font-weight="700">Coverage decays without anyone changing a check.</text>
    <text x="450" y="222" fill="currentColor" font-size="9.5" opacity="0.85">New stages are added downstream of an existing suite far more often than suites are extended to cover them.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#cov-arrow)">
    <line x1="212" y1="117" x2="230" y2="117"/><line x1="432" y1="117" x2="450" y2="117"/>
    <line x1="652" y1="117" x2="670" y2="117"/>
  </g>
</svg>

## Deterministic Transformation Logic

The controls that close the catalogue are mostly structural rather than clever. The gate runner below makes coercion impossible, records coverage per check, and refuses to report success when any blocking check was skipped.

```python
from dataclasses import dataclass, asdict, field

import structlog

log = structlog.get_logger()


class GateSkipped(RuntimeError):
    """A blocking check did not run. Never a warning."""


@dataclass
class CheckOutcome:
    check_id: str
    blocking: bool
    ran: bool
    rows_evaluated: int
    rows_failed: int
    observed_examples: list = field(default_factory=list)
    skip_reason: str | None = None


def run_gate(records, checks, suite_version: str, run_id: str) -> dict:
    """Run every check on every row, or fail. No sampling, no skipping.

    Three properties close most of the catalogue:
      * a check either runs on the full scope or the run fails,
      * a failure quarantines rather than adjusts,
      * observed values are captured, because 'check failed' is not evidence.
    """
    outcomes: list[CheckOutcome] = []
    quarantined: list[dict] = []
    passed: list[dict] = []

    for record in records:
        record_failures = []
        for check in checks:
            if not check.applies_to(record):
                continue
            ok, observed = check.evaluate(record)
            if not ok:
                record_failures.append((check, observed))

        blocking_failures = [(c, o) for c, o in record_failures if c.blocking]
        if blocking_failures:
            quarantined.append({
                "record_id": record["record_id"],
                "failed_checks": [c.check_id for c, _ in blocking_failures],
                # Observed values, not just the check name — 'expectation failed'
                # is not something a reviewer can act on.
                "observed": {c.check_id: o for c, o in blocking_failures},
                "disposition": None, "owner": None,
            })
        else:
            if record_failures:
                record = {**record,
                          "advisory_flags": [c.check_id for c, _ in record_failures]}
            passed.append(record)

    for check in checks:
        scope = sum(1 for r in records if check.applies_to(r))
        evaluated = scope                     # no sampling: scope == evaluated
        failed = sum(1 for q in quarantined if check.check_id in q["failed_checks"])
        outcomes.append(CheckOutcome(
            check_id=check.check_id, blocking=check.blocking, ran=True,
            rows_evaluated=evaluated, rows_failed=failed,
            observed_examples=[q["observed"][check.check_id]
                               for q in quarantined
                               if check.check_id in q["observed"]][:3],
        ))

    skipped_blocking = [o.check_id for o in outcomes if o.blocking and not o.ran]
    if skipped_blocking:
        raise GateSkipped(f"blocking checks did not run: {skipped_blocking}")

    result = {
        "run_id": run_id, "suite_version": suite_version,
        "records_in": len(records), "records_passed": len(passed),
        "records_quarantined": len(quarantined),
        "checks": [asdict(o) for o in outcomes],
    }
    log.info("gate.complete", run_id=run_id, suite_version=suite_version,
             passed=len(passed), quarantined=len(quarantined),
             checks_run=len(outcomes))
    return {"passed": passed, "quarantined": quarantined, "report": result}


def assert_response_health(quarantine_audit: dict, exception_audit: dict,
                           max_queue: int = 500) -> None:
    """The response path is part of the control. Fail the period if it has rotted."""
    problems = []
    if quarantine_audit["stale"] > 0:
        problems.append(f"stale_quarantine:{quarantine_audit['stale']}")
    if quarantine_audit["unowned"] > 0:
        problems.append(f"unowned_quarantine:{quarantine_audit['unowned']}")
    if quarantine_audit["queue_depth"] > max_queue:
        problems.append(f"queue_depth:{quarantine_audit['queue_depth']}")
    if exception_audit["expired_still_active"] or exception_audit["no_expiry"]:
        problems.append("unbounded_exceptions")

    if problems:
        log.error("gate.response_path_degraded", problems=problems)
        raise RuntimeError(f"validation response path degraded: {problems}")
```

Two choices in that code do most of the work. There is **no sampling parameter** — the runner cannot be configured to check a subset, so the sampling failure mode is unreachable rather than merely discouraged. And **response health is asserted as part of the period**, which turns a growing quarantine queue and an expired exception from operational debt into something that fails the run, at the point where it is still cheap to fix.

## Compliance Gating & Audit Trail Generation

The catalogue maps onto what a verifier asks about controls, and four artefacts answer it.

**The suite version and its change history.** A check-set change alters what "passed" means, so it is a control change requiring review, and the version must be recorded on every run. A figure produced under suite version 4 is not comparable to one produced under version 3 without knowing what changed.

**Per-check coverage and fire counts.** These are what distinguish a live control from a nominal one. A check that ran on every row and has fired eleven times this year is evidence; the same check with no coverage record is an assertion. Include the never-fired checks explicitly rather than omitting them.

**The quarantine register with dispositions.** Every record must exit through one of three doors — corrected, excepted with a named owner, or formally excluded and disclosed — and the register is where a verifier checks that the omissions in a reported total were deliberate and disclosed rather than accidental.

**The exception log with expiries.** An exception is a documented weakening of a control, and one without an expiry is a permanent weakening nobody decided on. Route all four into the evidence stream described under [MRV pipeline observability and failure modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/), keyed on the run identifier so they join to the figures they gated.

<svg viewBox="0 -4 880 246" role="img" aria-labelledby="fat-t fat-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="fat-t">Fire rate against action rate, and the quadrant where a check is already ignored</title>
  <desc id="fat-d">A scatter of validation checks with fire rate per period on the horizontal axis and the fraction of fires that led to a recorded action on the vertical axis. Checks in the upper left fire rarely and are always acted on, which is the healthy blocking pattern. Checks in the upper right fire often and are acted on, which usually means a genuine upstream problem worth fixing at source. Checks in the lower right fire often and are almost never acted on, marked as the fatigue quadrant where a check is being ignored whether or not anyone has muted it. Checks in the lower left fire rarely and were not acted on when they did, which points at an unclear runbook. A panel notes that the lower-right quadrant is measurable long before a channel is formally muted.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Fatigue is measurable before anyone mutes anything</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Fire rate against the fraction of fires that produced a recorded action.</text>
  </g>
  <rect x="330" y="140" width="290" height="76" fill="#f3a712" opacity="0.12"/>
  <text x="475" y="158" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#f3a712">fatigue quadrant</text>
  <g stroke="currentColor" stroke-width="1.3">
    <line x1="80" y1="52" x2="80" y2="216"/>
    <line x1="80" y1="216" x2="620" y2="216"/>
  </g>
  <line x1="80" y1="140" x2="620" y2="140" stroke="currentColor" stroke-width="1" opacity="0.3" stroke-dasharray="4,3"/>
  <line x1="330" y1="52" x2="330" y2="216" stroke="currentColor" stroke-width="1" opacity="0.3" stroke-dasharray="4,3"/>
  <g font-family="system-ui, sans-serif" font-size="9" fill="currentColor" opacity="0.72">
    <text x="72" y="60" text-anchor="end">100%</text>
    <text x="72" y="144" text-anchor="end">50%</text>
    <text x="72" y="220" text-anchor="end">0</text>
    <text x="140" y="236" text-anchor="middle">rare</text>
    <text x="500" y="236" text-anchor="middle">frequent</text>
    <text x="30" y="134" transform="rotate(-90 30 134)" text-anchor="middle" font-weight="600">action rate</text>
  </g>
  <g fill="currentColor">
    <circle cx="128" cy="70" r="6"/><circle cx="176" cy="80" r="6"/><circle cx="150" cy="62" r="6"/>
    <circle cx="420" cy="76" r="6" opacity="0.7"/><circle cx="510" cy="90" r="6" opacity="0.7"/>
  </g>
  <g fill="#f3a712">
    <circle cx="418" cy="196" r="6.5"/><circle cx="492" cy="186" r="6.5"/><circle cx="560" cy="202" r="6.5"/>
  </g>
  <g fill="currentColor" opacity="0.55">
    <circle cx="140" cy="190" r="6"/><circle cx="198" cy="200" r="6"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="9.5">
    <text x="140" y="46" fill="currentColor" font-weight="700">healthy blocking</text>
    <text x="440" y="52" fill="currentColor" font-weight="700">fix the source</text>
    <text x="120" y="168" fill="currentColor" opacity="0.8">unclear runbook</text>
    <text x="640" y="196" fill="#f3a712" font-weight="700">already ignored</text>
    <text x="640" y="212" fill="currentColor" font-size="8.5" opacity="0.72">demote or delete</text>
  </g>
</svg>

## Production Integration

1. **Remove every coercion path** from the gate layer, so a check can only pass or quarantine.
2. **Attach the suite at every stage boundary**, not only at ingestion, and add coverage of a new stage to that stage's definition of done.
3. **Forbid sampling in the runner** rather than configuring it off, so the option cannot be re-enabled during an incident and forgotten.
4. **Fail the run when a blocking check did not execute**, treating a skip exactly as severely as a failure.
5. **Audit the gates quarterly** for coverage, fire rate, and dormancy, and deliberately test any check that has never fired.
6. **Assert response health as part of the period close** — stale quarantine, unowned records, and unbounded exceptions all fail the period.

The cheapest high-value addition for a team retrofitting this is the coverage record. Knowing which checks ran on what fraction of which stages, per run, exposes most of the coverage group immediately and costs one counter per check.

## Frequently Asked Questions

### Is a check that has never fired a problem?

It is a question that deserves an answer rather than an assumption. A check may never have fired because the defect it guards against genuinely cannot occur in your pipeline — in which case it is documentation and its value is misleading confidence — or because it is miscalibrated and silently passing everything. The distinguishing test is cheap: construct a record you know should fail and confirm the check catches it. Do this once for every never-fired blocking check, and record the result as evidence the control is live.

### How do I stop a validation suite from decaying as the pipeline grows?

Make suite coverage part of the definition of done for any new stage, and audit coverage on a schedule rather than trusting it. Decay happens because adding a stage is a visible task while extending the suite to cover it is not, so the fix is to make the second part of the first. A quarterly audit that reports checks-per-stage and rows-evaluated-versus-in-scope catches whatever slips through.

### What is wrong with sampling validation for performance?

The sample is not where the defect is. Data defects in carbon pipelines cluster — one bad source file, one tile, one supplier — so a uniform sample of five per cent has a good chance of missing a cluster entirely while reporting a clean result. Where validation genuinely costs too much, the answer is to make the check cheaper or move it to a stage boundary rather than to look at fewer rows, because a partial check produces a confident statement about data it never saw.

### How long should a record sit in quarantine?

Long enough to correct at source and no longer — typically a few weeks, with an explicit escalation when it ages past that. What matters more than the number is that every record exits through a recorded door. A record still in quarantine at period close is an omission from the reported total, and it must appear in the completeness statement whether or not anyone has looked at it.

### Should exceptions ever be permanent?

No. Some will be long-lived — a data source that genuinely cannot supply a field, a legacy system that will be replaced eventually — but even those should carry an expiry that forces a periodic re-decision. An exception without an expiry stops being a decision and becomes a property of the system, and the reason it was granted is usually forgotten within a year, which is exactly when a verifier asks about it.

### How should alert fatigue be measured before it causes damage?

By tracking the fire rate and the action rate per check, and comparing them. A check firing weekly with no recorded action is already being ignored regardless of whether anyone has muted the channel, and that gap is measurable long before the mute happens. Checks whose action rate is near zero should be demoted to trends or removed, since a channel containing anything unactionable degrades the credibility of everything else in it.

### Does this catalogue apply to the geospatial invariants too?

Yes, and the response group especially. A CRS assertion or an area-drift invariant is subject to exactly the same decay — it can be skipped when a job is behind, its finding can land in an unread channel, and an exception granted for one odd dataset can outlive it. The cross-stage catalogue covers the geospatial checks themselves; the failure modes here are about the layer that runs them, and both sets are needed.

### What is the right size for the blocking set?

Small enough that every member describes something never legitimate, which in practice means single digits per stage. The temptation is to promote checks to blocking as confidence in them grows, and the result is a gate that stops the pipeline for judgement calls at inconvenient hours. Keep blocking for absolutes — a missing unit, an absent coordinate reference system, a mass balance that does not close, a partition set that is incomplete — and leave everything with a legitimate exception to the advisory set where it can be trended.

A useful discipline when adding a check is to ask what the on-call response would be at three in the morning. If the answer is "look at it and probably override", the check is advisory; if the answer is "stop, because this record cannot be interpreted", it is blocking. Checks whose answer is unclear are the ones that later become the muted channel.

## Related guides

- [Emissions Data Quality & Validation Gates](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/) — the parent topic and the blocking-versus-advisory taxonomy.
- [Building Great Expectations Checks for Emissions Data](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/building-great-expectations-checks-for-emissions-data/) — authoring the checks this catalogue audits.
- [Great Expectations vs Pandera vs Soda for MRV Validation](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/emissions-data-quality-validation-gates/great-expectations-vs-pandera-vs-soda-for-mrv-validation/) — where the blocking layer lives and what it produces.
- [Failure Mode Catalog for Spatial MRV Pipelines](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/failure-mode-catalog-for-spatial-mrv-pipelines/) — the cross-stage catalogue this narrows.
