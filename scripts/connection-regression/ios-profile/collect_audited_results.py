#!/usr/bin/env python3
"""Check final reviewed phone repetitions and independently sent editions."""
import argparse, hashlib, json, statistics
from pathlib import Path


def collect(root):
    hashes = {}
    def read(name):
        raw = (root / name).read_bytes(); hashes[name] = hashlib.sha256(raw).hexdigest()
        return json.loads(raw)
    def safe(row):
        fields = {"phase", "users", "role", "requested", "completed", "censored", "count", "ms", "cpu", "io", "consumeCalls", "edition"}
        return {**{k: v for k, v in row.items() if k in fields}, "metrics": {k: {f: v for f, v in values.items() if f in {"calls", "totalMs", "selfMs", "maxMs", "errors"}} for k, values in row.get("metrics", {}).items()}}
    complete = read("combined-audited-main/complete.json")
    assert complete["passed"] and complete["messageRepeats"] == 5
    assert complete["runtime"]["platform"] == "ios"
    messages = []
    for n in range(1, 6):
        rows = read(f"combined-audited-main/messages-repeat-{n}/results.json")
        r = next(x for x in rows if x["phase"] == "decryptAndVerify")
        assert r["requested"] == r["completed"] == 1000 and not r["censored"]
        assert r["metrics"]["sodium.crypto_sign_verify_detached"]["calls"] == 1000
        for name in ["crypto_sign_seed_keypair", "crypto_scalarmult_base", "crypto_box_open_easy"]:
            assert r["metrics"].get("sodium." + name, {}).get("calls", 0) == 0
        messages.append(safe(r))
    rows = read("combined-audited-main/combined-results.json")
    editions = [r for r in rows if r["phase"] == "separateSenderReceivedEdition"]
    assert [(r["users"], r["edition"]) for r in editions] == [(10, 1), (10, 2), (100, 1), (100, 2)]
    for row in editions:
        assert row["metrics"]["sodium.crypto_sign_verify_detached"]["calls"] == 1
        assert row["metrics"]["sodium.crypto_box_open_easy"]["calls"] == 7
    for row in rows:
        if row["phase"] == "serialArrivalAndFrontendFetch":
            assert row["consumeCalls"] == 2 * row["count"]
            assert row["io"] == {"gets": row["count"], "iterated": 0}
    allowed = {"freshTeamInstanceLoad", "firstMessageOnFreshTeamInstance", "coldHistoryIndex", "warmHistoryIndex", "singleMessageFetch", "serialArrivalAndFrontendFetch", "separateSenderReceivedEdition"}
    assert all(r["phase"] in allowed for r in rows)
    return {"scope": "Offline actual iPhone processing with final manifest, GC lifetime, and native atomic-fallback followups", "runtime": complete["runtime"], "buildReceipt": read("audited-integrated/bundle.integrated-receipt.json"), "messages": messages, "messageMedianMs": statistics.median(r["ms"] for r in messages), "cases": [safe(r) for r in rows], "evidenceSha256": hashes}


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__); p.add_argument("private_directory", type=Path); p.add_argument("output", type=Path)
    args = p.parse_args(); args.output.write_text(json.dumps(collect(args.private_directory), indent=2) + "\n")
