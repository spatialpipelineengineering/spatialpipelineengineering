---
shortTitle: "Signing MRV Artifacts for Tamper-Evident Audit Trails"
title: "Signing MRV Artifacts for Tamper-Evident Audit Trails"
description: "Make a carbon evidence chain tamper-evident: what to hash, how to build a signed manifest, key custody across a decades-long crediting period, and verification that still works when the signer is gone."
slug: signing-mrv-artifacts-for-tamper-evident-audit-trails
type: guide
breadcrumb: "Signing MRV Artifacts"
datePublished: 2026-08-11
dateModified: 2026-08-11
---
# Signing MRV Artifacts for Tamper-Evident Audit Trails

A lineage record says how a figure was produced. A signature says the record has not changed since it was written. Those are different claims, and carbon evidence needs both — because a provenance chain that any operator with write access could revise after the fact establishes sequence, not integrity. This guide adds the second claim, within [MRV data lineage and provenance tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) in the [MRV architecture and carbon accounting fundamentals](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack.

The design constraint that makes this harder than ordinary artifact signing is duration. A forestry crediting period plus its post-crediting monitoring obligation runs for decades, and over that span the signing key rotates, the team changes, the algorithm ages, and the verifier who needs to check the signature has never met anyone involved. A scheme that requires the original signer to still exist is not a scheme that survives an audit in year twenty-eight.

<svg viewBox="0 -4 940 258" role="img" aria-labelledby="sig-t sig-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="sig-t">What a hash proves, what a signature adds, and what a timestamp adds on top</title>
  <desc id="sig-d">Three layers of assurance shown as a stack. A content digest alone proves the bytes have not changed since the digest was computed, but anyone who can rewrite the artefact can also rewrite the digest, so it detects accident rather than tampering. A signature over a manifest of digests adds authorship and integrity: only the key holder could have produced it, and any change to any listed artefact invalidates it. A trusted timestamp over the signature adds existence at a point in time, which is what keeps the signature meaningful after the key has expired or been rotated. A panel notes that each layer answers a question the layer below cannot, and that the third is the one most often omitted and most needed at year twenty.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">Three layers, three different questions</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">Each answers something the layer below it cannot.</text>
    <rect x="12" y="52" width="600" height="58" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="52" width="600" height="58" rx="9" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <text x="28" y="76" fill="currentColor" font-size="10.5" font-weight="700">1 · Content digest</text>
    <text x="28" y="98" fill="currentColor" font-size="9.5" opacity="0.85">“these bytes are the bytes” — detects accident, not tampering</text>
    <text x="628" y="86" fill="currentColor" font-size="9.5" opacity="0.8">anyone who can rewrite the file can rewrite the digest</text>
    <rect x="12" y="118" width="600" height="58" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="12" y="118" width="600" height="58" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="28" y="142" fill="currentColor" font-size="10.5" font-weight="700">2 · Signature over a manifest</text>
    <text x="28" y="164" fill="currentColor" font-size="9.5" opacity="0.85">“the key holder attested to this exact set” — integrity plus authorship</text>
    <text x="628" y="152" fill="currentColor" font-size="9.5" opacity="0.8">one change to any listed artefact invalidates it</text>
    <rect x="12" y="184" width="600" height="58" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="12" y="184" width="600" height="58" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="28" y="208" fill="currentColor" font-size="10.5" font-weight="700">3 · Trusted timestamp over the signature</text>
    <text x="28" y="230" fill="currentColor" font-size="9.5" opacity="0.85">“it existed by this date” — survives key rotation and expiry</text>
    <text x="628" y="218" fill="#f3a712" font-size="9.5" font-weight="700">the layer omitted most often, and needed most at year 20</text>
  </g>
</svg>

## Root Cause Analysis

Three properties of carbon evidence determine what a signing scheme must do, and each rules out an approach that works fine elsewhere.

**The artefacts are large and numerous, but the claim is about a set.** A reporting period produces tens of thousands of partition files, and signing each individually is both expensive and the wrong shape — what a verifier wants to know is that *this specific collection* constituted the reported figure. Signing a manifest that lists every artefact with its digest gives one signature covering the whole set, makes an added or removed file detectable, and reduces the verification cost to one signature check plus a digest comparison per file the verifier chooses to examine.

**The verifier arrives long after the signer has gone.** Individual keys create a succession problem: the person who signed the 2027 submission may have left in 2029, and a scheme where their departure invalidates the evidence is unusable. Service keys with documented rotation and an archived public-key history solve it, but only if the archive itself outlives the infrastructure that produced it — which means publishing the key history somewhere durable rather than leaving it in the secret manager that issued it.

**Signatures expire; the obligation does not.** A signature verified against a certificate that expired in 2031 tells you nothing about whether it was valid when made, unless something independent records *when* it was made. That is what a trusted timestamp provides, and it is why the third layer matters: without it, key rotation quietly converts a decade of valid signatures into unverifiable ones.

The failure these produce together is subtle. Nothing breaks at the time. The evidence simply stops being checkable at some point years later, and nobody notices until a verifier tries.

## Diagnostic Pipeline / Pre-Flight Validation

Before signing anything, decide what the manifest covers and verify that the set is complete and stable. A manifest signed over a partially written output is worse than no manifest, because it attests to a state that was never correct.

```python
import hashlib
import json
from dataclasses import dataclass, asdict
from pathlib import Path

import structlog

log = structlog.get_logger()

CHUNK = 1 << 20


@dataclass(frozen=True)
class ArtifactEntry:
    """One artefact in the manifest: path, digest, size, and role.

    The role matters at verification time — a verifier checking a reported
    figure needs the primary outputs, not every intermediate.
    """
    path: str
    sha256: str
    bytes: int
    role: str          # primary | evidence | intermediate


def digest_file(path: Path) -> tuple[str, int]:
    h = hashlib.sha256()
    total = 0
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(CHUNK), b""):
            h.update(block)
            total += len(block)
    return h.hexdigest(), total


def build_entries(root: Path, roles: dict[str, str]) -> list[ArtifactEntry]:
    """Digest every artefact under root, in a deterministic order.

    Sorting matters: the manifest's own digest must be reproducible, and
    filesystem iteration order is not stable across systems.
    """
    entries = []
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        rel = str(path.relative_to(root))
        sha, size = digest_file(path)
        entries.append(ArtifactEntry(rel, sha, size, roles.get(rel, "intermediate")))
    log.info("manifest.digested", root=str(root), files=len(entries),
             total_mb=round(sum(e.bytes for e in entries) / 1e6, 1))
    return entries


def preflight(entries: list[ArtifactEntry], expected_partitions: set[str],
              run_completed: bool) -> dict:
    """Refuse to sign a set that is incomplete, unstable, or unfinished.

    A signature over a partial output attests to a state that was never a valid
    result, and it is indistinguishable from a valid signature afterwards.
    """
    problems = []
    if not run_completed:
        problems.append("run_not_completed")

    present = {e.path for e in entries}
    missing = expected_partitions - present
    if missing:
        problems.append(f"missing_partitions:{len(missing)}")

    if any(e.bytes == 0 for e in entries):
        problems.append("zero_byte_artifacts")

    if not any(e.role == "primary" for e in entries):
        problems.append("no_primary_artifact")

    result = {"files": len(entries), "missing": len(missing),
              "problems": problems, "signable": not problems}
    if problems:
        log.error("manifest.not_signable", **result)
    else:
        log.info("manifest.preflight_ok", **result)
    return result
```

The `run_completed` flag is the check that gets skipped and should not be. Signing is usually wired as the last step of a pipeline, and a pipeline that fails partway can still reach a cleanup handler that signs whatever exists. Requiring an explicit completion signal — not merely the absence of an exception — is what prevents a partial output acquiring a valid signature.

<svg viewBox="0 -4 900 250" role="img" aria-labelledby="mf-t mf-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="mf-t">Manifest structure and what each section lets a verifier check</title>
  <desc id="mf-d">A signed manifest shown as four sections. The header carries the manifest schema version, the run identifier, the reporting period and the UTC creation time. The inputs section lists source dataset identifiers with their content digests. The environment section carries the code version, container digest and factor-set version. The artefacts section lists every output file with its digest, size and role. Beneath all four sits one signature covering the canonical serialisation of the whole document, plus a trusted timestamp over that signature. A panel notes that a verifier can check any single artefact by digesting it and comparing, without needing to trust or even possess the rest of the set.</desc>
  <g font-family="system-ui, sans-serif">
    <text x="12" y="16" fill="currentColor" font-size="11.5" font-weight="700">One signature, four sections, independently checkable parts</text>
    <text x="12" y="34" fill="currentColor" font-size="9.5" opacity="0.72">A verifier can check one file without possessing the rest of the set.</text>
    <rect x="12" y="52" width="600" height="40" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="70" fill="currentColor" font-size="10" font-weight="700">header</text>
    <text x="150" y="70" fill="currentColor" font-size="9.5" opacity="0.85">schema version · run id · period · created_at (UTC)</text>
    <text x="150" y="86" fill="currentColor" font-size="9" opacity="0.7">what this manifest is, and for which run</text>
    <rect x="12" y="98" width="600" height="40" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="116" fill="currentColor" font-size="10" font-weight="700">inputs</text>
    <text x="150" y="116" fill="currentColor" font-size="9.5" opacity="0.85">source dataset ids + content digests</text>
    <text x="150" y="132" fill="currentColor" font-size="9" opacity="0.7">names alone are not enough — files change under stable names</text>
    <rect x="12" y="144" width="600" height="40" rx="7" fill="currentColor" opacity="0.06"/>
    <text x="28" y="162" fill="currentColor" font-size="10" font-weight="700">environment</text>
    <text x="150" y="162" fill="currentColor" font-size="9.5" opacity="0.85">code version · container digest · factor-set version</text>
    <text x="150" y="178" fill="currentColor" font-size="9" opacity="0.7">the environment is part of the computation</text>
    <rect x="12" y="190" width="600" height="40" rx="7" fill="currentColor" opacity="0.12"/>
    <text x="28" y="208" fill="currentColor" font-size="10" font-weight="700">artefacts</text>
    <text x="150" y="208" fill="currentColor" font-size="9.5" opacity="0.85">every output: path · digest · size · role</text>
    <text x="150" y="224" fill="currentColor" font-size="9" opacity="0.7">an added or removed file invalidates the signature</text>
    <rect x="632" y="52" width="256" height="178" rx="9" fill="currentColor" opacity="0.1"/>
    <rect x="632" y="52" width="256" height="178" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9"/>
    <text x="648" y="80" fill="currentColor" font-size="10.5" font-weight="700">signature</text>
    <text x="648" y="102" fill="currentColor" font-size="9.5" opacity="0.85">over the canonical serialisation</text>
    <text x="648" y="118" fill="currentColor" font-size="9.5" opacity="0.85">of all four sections</text>
    <text x="648" y="146" fill="currentColor" font-size="10.5" font-weight="700">+ trusted timestamp</text>
    <text x="648" y="168" fill="currentColor" font-size="9.5" opacity="0.85">proves the signature existed</text>
    <text x="648" y="184" fill="currentColor" font-size="9.5" opacity="0.85">before the key expired</text>
    <text x="648" y="212" fill="#f3a712" font-size="9.5" font-weight="700">this is what survives to year 28</text>
  </g>
</svg>

## Deterministic Transformation Logic

Canonical serialisation is the part that quietly breaks verification years later: a manifest re-serialised with different key ordering or float formatting produces a different digest and a signature that appears invalid. The implementation below fixes the serialisation, signs the canonical bytes, and verifies without needing the signer.

```python
import base64
import hashlib
import json
from dataclasses import dataclass, asdict
from datetime import datetime, timezone

import structlog
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ed25519

log = structlog.get_logger()

MANIFEST_SCHEMA = "mrv-manifest/1"


def canonical_bytes(document: dict) -> bytes:
    """One serialisation, forever.

    Sorted keys, no insignificant whitespace, explicit UTF-8. Without this, a
    manifest re-serialised by a different library version digests differently
    and its signature reads as invalid — indistinguishable from tampering.
    """
    return json.dumps(document, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False).encode("utf-8")


@dataclass(frozen=True)
class SignedManifest:
    document: dict
    signature_b64: str
    key_id: str
    algorithm: str
    timestamp_token_b64: str | None


def build_manifest(run_id: str, period: str, inputs: dict[str, str],
                   environment: dict[str, str],
                   entries: list[ArtifactEntry], created_at: datetime) -> dict:
    """The document that gets signed. Everything a replay needs, nothing volatile."""
    return {
        "schema": MANIFEST_SCHEMA,
        "run_id": run_id,
        "period": period,
        "created_at": created_at.astimezone(timezone.utc).isoformat(),
        "inputs": dict(sorted(inputs.items())),
        "environment": dict(sorted(environment.items())),
        "artifacts": [asdict(e) for e in sorted(entries, key=lambda e: e.path)],
    }


def sign_manifest(document: dict, private_key: ed25519.Ed25519PrivateKey,
                  key_id: str, timestamp_fn=None) -> SignedManifest:
    """Sign the canonical bytes, then timestamp the signature.

    The timestamp is what keeps the signature checkable after the key rotates;
    without it, expiry silently invalidates years of otherwise good evidence.
    """
    payload = canonical_bytes(document)
    signature = private_key.sign(payload)

    token = None
    if timestamp_fn is not None:
        token = timestamp_fn(hashlib.sha256(signature).digest())

    signed = SignedManifest(
        document=document,
        signature_b64=base64.b64encode(signature).decode(),
        key_id=key_id,
        algorithm="ed25519",
        timestamp_token_b64=base64.b64encode(token).decode() if token else None,
    )
    log.info("manifest.signed", run_id=document["run_id"], key_id=key_id,
             artifacts=len(document["artifacts"]),
             timestamped=token is not None)
    return signed


def verify_manifest(signed: SignedManifest, public_keys: dict[str, bytes]) -> dict:
    """Verify without the signer, using only an archived public-key history."""
    key_bytes = public_keys.get(signed.key_id)
    if key_bytes is None:
        return {"valid": False, "reason": "unknown_key_id", "key_id": signed.key_id}

    public_key = ed25519.Ed25519PublicKey.from_public_bytes(key_bytes)
    payload = canonical_bytes(signed.document)
    try:
        public_key.verify(base64.b64decode(signed.signature_b64), payload)
    except InvalidSignature:
        log.error("manifest.signature_invalid", run_id=signed.document.get("run_id"),
                  key_id=signed.key_id)
        return {"valid": False, "reason": "signature_mismatch"}

    result = {"valid": True, "run_id": signed.document["run_id"],
              "key_id": signed.key_id,
              "artifacts": len(signed.document["artifacts"]),
              "timestamped": signed.timestamp_token_b64 is not None}
    log.info("manifest.verified", **result)
    return result


def verify_artifact(signed: SignedManifest, path: str, actual_digest: str) -> dict:
    """Check ONE artefact against a verified manifest.

    This is the operation a verifier actually performs: they hold one file and
    want to know whether it is the one the signed set attested to.
    """
    entry = next((a for a in signed.document["artifacts"] if a["path"] == path), None)
    if entry is None:
        return {"path": path, "in_manifest": False, "matches": False}
    matches = entry["sha256"] == actual_digest
    if not matches:
        log.error("manifest.artifact_mismatch", path=path,
                  expected=entry["sha256"], actual=actual_digest)
    return {"path": path, "in_manifest": True, "matches": matches,
            "role": entry["role"]}
```

Two decisions are load-bearing. **Ed25519 over RSA** because the keys and signatures are small, verification is fast, and there are no parameter choices to get wrong — a scheme with fewer knobs ages better across a decades-long obligation. And **verification takes only an archived public-key map**, not a live key service, so a verifier in year twenty-eight needs the manifest, the artefacts, and a published key history, none of which depend on your infrastructure still running.

## Compliance Gating & Audit Trail Generation

Four practices turn signing from a technical gesture into evidence a verifier can rely on.

**Publish the public-key history somewhere durable and independent.** A key archive living only in the secret manager that issued the keys shares that system's fate. Publishing the key identifiers, public keys, validity periods, and rotation events to the same append-only store that holds the provenance records — and ideally to a location outside the operating team's control — is what makes verification survive an infrastructure migration.

**Sign at the certification boundary, not at every stage.** The signature attests that a set of artefacts constituted a reported figure, which is a statement about the certified zone described in the [MRV architecture](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/) stack. Signing intermediates adds cost and no assurance, because intermediates are re-derivable.

**Never re-sign in place.** A corrected figure produces a new manifest with a new run identifier, alongside the old one, exactly as a restatement produces a new certified artefact rather than mutating the old. Re-signing an existing manifest destroys the property the signature existed to provide.

**Record verification runs, not just signing runs.** A signature nobody has ever verified is a signature whose verification path is untested, and the failure — a lost key archive, a serialisation change, an expired certificate — surfaces only when someone tries. Scheduling a periodic verification of a deliberately old manifest is the same discipline as testing an old evidence retrieval, and it belongs in the observability layer described under [MRV pipeline observability and failure modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/).

<svg viewBox="0 -4 900 248" role="img" aria-labelledby="key-t key-d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:var(--c-text)">
  <title id="key-t">A verification attempt in year twenty-eight, and what it depends on</title>
  <desc id="key-d">A verifier in 2054 checking a manifest signed in 2026 needs four things, shown as a chain. The signed manifest, which travels with the artefacts and survives. The artefacts themselves, retained on the audit horizon. The published public-key history, which resolves the key identifier in the manifest to the public key valid at signing time. And the canonical serialisation rule, needed to reconstruct the exact bytes that were signed. Two of the four are commonly lost: the key history when the secret manager that issued it is decommissioned, and the serialisation rule when it lived only in code that no longer runs. A panel notes that neither loss is detectable at the time it happens.</desc>
  <defs>
    <marker id="key-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="system-ui, sans-serif" text-anchor="middle">
    <text x="450" y="16" fill="currentColor" font-size="11.5" font-weight="700">Signed 2026, verified 2054 — four dependencies, two commonly lost</text>
    <rect x="12" y="76" width="200" height="80" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="12" y="76" width="200" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="112" y="102" fill="currentColor" font-size="10.5" font-weight="700">Signed manifest</text>
    <text x="112" y="124" fill="currentColor" font-size="9.5" opacity="0.85">travels with the artefacts</text>
    <text x="112" y="142" fill="currentColor" font-size="9" opacity="0.75">survives</text>
    <rect x="232" y="76" width="200" height="80" rx="9" fill="currentColor" opacity="0.12"/>
    <rect x="232" y="76" width="200" height="80" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text x="332" y="102" fill="currentColor" font-size="10.5" font-weight="700">Artefacts</text>
    <text x="332" y="124" fill="currentColor" font-size="9.5" opacity="0.85">retained on the audit horizon</text>
    <text x="332" y="142" fill="currentColor" font-size="9" opacity="0.75">survives</text>
    <rect x="452" y="76" width="200" height="80" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="552" y="102" fill="currentColor" font-size="10.5" font-weight="700">Public-key history</text>
    <text x="552" y="124" fill="currentColor" font-size="9.5" opacity="0.85">resolves the key id</text>
    <text x="552" y="142" fill="#f3a712" font-size="9" font-weight="700">lost with the secret manager</text>
    <rect x="672" y="76" width="216" height="80" rx="9" fill="none" stroke="#f3a712" stroke-width="1.9" stroke-dasharray="6,3"/>
    <text x="780" y="102" fill="currentColor" font-size="10.5" font-weight="700">Serialisation rule</text>
    <text x="780" y="124" fill="currentColor" font-size="9.5" opacity="0.85">reconstructs the signed bytes</text>
    <text x="780" y="142" fill="#f3a712" font-size="9" font-weight="700">lost with the code</text>
    <rect x="12" y="180" width="876" height="60" rx="9" fill="currentColor" opacity="0.06"/>
    <rect x="12" y="180" width="876" height="60" rx="9" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <text x="450" y="204" fill="currentColor" font-size="10" font-weight="700">Neither loss is detectable when it happens.</text>
    <text x="450" y="226" fill="currentColor" font-size="9.5" opacity="0.85">Publish the key history durably and document the serialisation in prose, not only in code — then verification does not depend on you.</text>
  </g>
  <g stroke="currentColor" stroke-width="1.4" fill="none" marker-end="url(#key-arrow)">
    <line x1="212" y1="116" x2="230" y2="116"/><line x1="432" y1="116" x2="450" y2="116"/>
    <line x1="652" y1="116" x2="670" y2="116"/>
  </g>
</svg>

## Production Integration

1. **Define the certification boundary** and sign only there, covering the primary outputs and their evidence records.
2. **Require an explicit completion signal** before signing, never inferring completeness from the absence of an error.
3. **Fix the canonical serialisation** in one shared function and test that it round-trips across library versions.
4. **Use a service key with documented rotation**, and publish the public-key history to durable storage independent of the issuing system.
5. **Timestamp every signature**, so key expiry does not retroactively invalidate valid evidence.
6. **Verify an old manifest on a schedule** and alert on failure, so the verification path is exercised rather than assumed.

For cost, signing is negligible next to digesting: hashing a reporting period's artefacts is one full pass over the outputs, and the signature itself is microseconds. Cache digests by content-addressed path so unchanged partitions are not re-hashed each period, which turns the signing step from a full pass into an incremental one.

## Frequently Asked Questions

### Is a content digest enough on its own?

Only against accident. A digest detects corruption and unintentional change, which is genuinely useful, but anyone who can rewrite the artefact can also rewrite the stored digest — so it establishes nothing about tampering. The signature is what makes the claim asymmetric: producing a valid one requires the private key, while checking it requires only the public key, which is precisely the property an audit needs.

### Who should hold the signing key?

A service identity, not an individual, with the key held in a hardware-backed store and access mediated by the pipeline rather than by people. Individual keys create a succession problem across a decades-long obligation and tie the evidence's validity to an employment relationship. Where a framework requires an accountable individual, record the approver as data inside the signed document rather than as the key holder — that gives you both accountability and continuity.

### What happens when the key rotates?

Nothing, if the signatures were timestamped and the key history is published. A verifier resolves the key identifier in the manifest against the archived history, finds the public key that was valid when the timestamp says the signature was made, and verifies against it. Without timestamps, rotation is the event that quietly converts valid evidence into unverifiable evidence, which is the strongest argument for the third layer.

### Should the artefacts themselves be signed, or just the manifest?

The manifest, with digests of the artefacts inside it. One signature covering an indexed set is cheaper to produce, cheaper to verify, and detects additions and removals that per-file signatures cannot — a file quietly deleted from a set of individually signed files leaves every remaining signature valid. The manifest approach makes the set itself the signed object, which is what the claim is actually about.

### How does this interact with an append-only lineage store?

They complement each other and neither replaces the other. Append-only storage makes revision difficult operationally; signing makes it detectable cryptographically, including by someone who does not trust your storage. A verifier who is assessing whether your controls are adequate will note that the second does not depend on the first, which is exactly why both are worth having.

### Can a blockchain or public ledger replace this?

For the timestamping layer, sometimes — anchoring a manifest digest publicly is a legitimate way to prove existence at a time, and some registries accept it. It does not replace the signature, which establishes authorship, and it does not replace the manifest, which is where the actual content lives. Anchoring a digest is cheap and occasionally useful; moving the artefacts themselves on-chain is neither.

### What should a verifier be given?

The signed manifest, the artefacts they wish to check, the published public-key history, and a short verification procedure naming the canonical serialisation and the algorithm. That set lets them verify independently with standard tooling and without contacting you, which is the outcome to design for — a verification that requires your help is one you may not be able to provide in year twenty-eight.

### How should the signing step fail?

Loudly, and without producing a partial artefact. A signing step that cannot reach the key service should fail the run rather than emit an unsigned manifest, because an unsigned manifest sitting alongside signed ones is indistinguishable from one whose signature was stripped. Where signing genuinely must be deferred — an air-gapped key, a batch approval process — write the manifest with an explicit pending status and gate promotion to the certified zone on the signature arriving, so nothing unsigned can be cited.

The corresponding failure on the verification side is quieter and worth guarding against: a verification routine that treats a missing signature as a pass. Default the verifier to refusing anything it cannot positively verify, and make the absence of a signature a distinct, reported outcome rather than an empty result.

### Does signing replace an immutable store?

No — the two solve adjacent problems and the combination is cheaper than either alone. Object-lock or write-once storage prevents an artefact from being altered in place, but says nothing about whether the set is complete or which version was reported. A signed manifest establishes the set and its authorship, but cannot stop a determined operator from deleting a file. Run both: immutability protects the bytes, and the manifest proves which bytes constituted the claim.

Where only one is available, prefer the manifest. An immutable store you no longer pay for stops being immutable, whereas a signature travels with the evidence into whatever archive succeeds it.

## Related guides

- [MRV Data Lineage & Provenance Tracking](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/) — the parent topic and the four questions a lineage record must answer.
- [Tracking Data Lineage with OpenLineage for ESG Audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/tracking-data-lineage-with-openlineage-for-esg-audits/) — the lineage graph this signature attests to.
- [Troubleshooting Broken Data Lineage in MRV Audits](https://www.spatialpipelineengineering.org/mrv-architecture-carbon-accounting-fundamentals/mrv-data-lineage-provenance-tracking/troubleshooting-broken-data-lineage-in-mrv-audits/) — what to do when the chain does not resolve.
- [MRV Pipeline Observability & Failure Modes](https://www.spatialpipelineengineering.org/pipeline-orchestration-compliance-reference/mrv-pipeline-observability-and-failure-modes/) — where scheduled verification runs are recorded.
