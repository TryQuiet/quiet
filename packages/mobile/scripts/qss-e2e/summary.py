#!/usr/bin/env python3
"""Export counts and booleans from private QSS test reports, never error bodies."""
import argparse
import json
import os
from pathlib import Path
import re


def read_json(path):
    try:
        value = json.loads(path.read_text())
        return value if isinstance(value, dict) else {}
    except (OSError, ValueError):
        return {}


def counts(value, keys):
    return {key: value[key] for key in keys if type(value.get(key)) is int and value[key] >= 0}


def suite(directory, outcome):
    report = read_json(directory / "jest-private.json")
    proof = read_json(directory / "ui.json")
    result = {"outcome": outcome, "reportPresent": bool(report)}
    result.update(counts(report, ("numPassedTests", "numFailedTests", "numPendingTests", "numTotalTests")))
    for key in ("messageStored", "restarted", "twoPlayerPassed"):
        if type(proof.get(key)) is bool:
            result[key] = proof[key]
    for key in ("serverBaseline", "serverActivityAfterSend"):
        if isinstance(proof.get(key), dict):
            result[key] = counts(proof[key], ("logEntryCount", "maxSyncSeq"))
    return result


def summarize(fixture, single, mixed, single_outcome, mixed_outcome):
    receipt = read_json(fixture / "result.json")
    manifest = receipt.get("manifest", {})
    result = {
        "fixturePassed": receipt.get("status") == "passed",
        "singlePlayer": suite(single, single_outcome),
        "mixed": suite(mixed, mixed_outcome),
    }
    for key in ("qssCommit", "qssAuthCommit"):
        value = manifest.get(key) if isinstance(manifest, dict) else None
        if isinstance(value, str) and re.fullmatch(r"[a-f0-9]{40}", value):
            result[key] = value
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("fixture", "single", "mixed", "output"):
        parser.add_argument("--" + name, type=Path, required=True)
    for name in ("single-outcome", "mixed-outcome"):
        parser.add_argument("--" + name, choices=("success", "failure", "cancelled", "skipped", "unknown"), default="unknown")
    args = parser.parse_args()
    result = summarize(args.fixture, args.single, args.mixed, args.single_outcome, args.mixed_outcome)
    os.umask(0o077)
    with args.output.open("x") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print(json.dumps(result))


if __name__ == "__main__":
    main()
