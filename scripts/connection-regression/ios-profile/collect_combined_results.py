#!/usr/bin/env python3
"""Export measured integrated phone results without fixtures, keys, or plaintext."""
import argparse, hashlib, json, statistics
from pathlib import Path


def collect(root):
    hashes = {}
    def read(name):
        raw = (root / name).read_bytes()
        hashes[name] = hashlib.sha256(raw).hexdigest()
        return json.loads(raw)
    def safe(row):
        fields = {"phase", "users", "role", "requested", "completed", "censored", "count", "ms", "cpu", "io", "consumeCalls", "edition"}
        result = {k: v for k, v in row.items() if k in fields}
        result["metrics"] = {k: {field: value for field, value in v.items() if field in {"calls", "totalMs", "selfMs", "maxMs", "errors"}} for k, v in row.get("metrics", {}).items()}
        return result
    complete = read("combined-final-main/complete.json")
    assert complete["passed"] and complete["messageRepeats"] == 5
    messages = []
    for n in range(1, 6):
        rows = read(f"combined-final-main/messages-repeat-{n}/results.json")
        r = next(x for x in rows if x["phase"] == "decryptAndVerify")
        assert r["requested"] == r["completed"] == 1000 and not r["censored"]
        assert r["metrics"]["sodium.crypto_sign_verify_detached"]["calls"] == 1000
        for name in ["crypto_sign_seed_keypair", "crypto_scalarmult_base", "crypto_box_open_easy"]:
            assert r["metrics"].get("sodium." + name, {}).get("calls", 0) == 0
        messages.append(safe(r))
    main = read("combined-final-main/combined-results.json")
    # Sender created in receiver process warms process-global signature facts;
    # these rows cannot substantiate incremental network validation claims.
    main = [r for r in main if r["phase"] not in {"receivedSigchainEdition", "sameProcessSenderEdition"}]
    for r in main:
        if r["phase"] == "serialArrivalAndFrontendFetch":
            assert r["consumeCalls"] == 2 * r["count"]
            assert r["io"] == {"gets": r["count"], "iterated": 0}
    users = [[safe(r) for r in read(f"combined-final-main/users-repeat-{n}/results.json")] for n in [1, 2]]
    data = {"scope": "Offline actual iPhone backend processing; transport and rendering excluded", "messageCacheState": "Fresh Team instance each repeat; role key primed before timed messages", "userScaleCacheState": "Shared-process graph prefixes and validation facts may remain warm", "buildReceipt": read("final-integrated/bundle.integrated-receipt.json"), "messages": messages, "messageMedianMs": statistics.median(r["ms"] for r in messages), "historyAndArrivals": [safe(r) for r in main], "userScalePasses": users, "evidenceSha256": hashes}
    cold = []
    for n in [1, 2, 3]:
        name = f"combined-final-cold{n}/combined-results.json"
        if (root / name).exists(): cold.append([safe(r) for r in read(name)])
    if cold: data["freshProcess100UserRepeatsWithTwoUserPrefixPrimed"] = cold
    wire = "combined-final-wire-gc-diagnostic/combined-results.json"
    if (root / wire).exists(): data["separateSenderReceivedEditionsBeforeGcFix"] = [safe(r) for r in read(wire)]
    unprimed = []
    for n in [1, 2, 3]:
        name = f"combined-final-unprimed{n}/combined-results.json"
        if (root / name).exists(): unprimed.append([safe(r) for r in read(name)])
    if unprimed: data["freshProcess100UserRepeatsWithoutFixturePriming"] = unprimed
    return data


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("private_directory", type=Path); p.add_argument("output", type=Path)
    args = p.parse_args()
    args.output.write_text(json.dumps(collect(args.private_directory), indent=2) + "\n")


if __name__ == "__main__": main()
