#!/usr/bin/env python3
"""Free unused Xcode bundles only on an ephemeral GitHub-hosted macOS runner."""
import os
import json
from pathlib import Path
import re
import shutil
import subprocess

MINIMUM_FREE_BYTES = 25 * 1024**3


def require_hosted():
    if os.environ.get("RUNNER_ENVIRONMENT") != "github-hosted":
        raise RuntimeError("Xcode cleanup is restricted to ephemeral GitHub-hosted runners")


def prepare(applications, developer, workspace):
    require_hosted()
    selected = developer.resolve().parents[1]
    if selected.parent != applications.resolve() or not developer.is_dir():
        raise ValueError("Selected Xcode must exist directly inside the applications directory")
    removed = []
    for candidate in sorted(applications.iterdir()):
        if candidate.is_symlink() or not candidate.is_dir():
            continue
        if not re.fullmatch(r"Xcode_[0-9][0-9.]*\.app", candidate.name) or candidate.resolve() == selected:
            continue
        subprocess.run(["sudo", "rm", "-rf", "--", str(candidate)], check=True)
        removed.append(candidate.name)
    free = shutil.disk_usage(workspace).free
    if free < MINIMUM_FREE_BYTES:
        raise RuntimeError(f"Need at least 25 GiB free for the sequential iOS/desktop/QSS build; available {free // 1024**3} GiB")
    return {"removedXcodeBundles": removed, "freeGiB": free // 1024**3}


def retire_baseline(output, checkout, runner_temp):
    """Release the completed staging cache, preserving its marker and all evidence."""
    require_hosted()
    if output.is_symlink() or output.parent.resolve() != runner_temp.resolve():
        raise ValueError("Baseline workspace must be directly inside RUNNER_TEMP")
    marker = output / ".quiet-ios-simulator-workspace.json"
    if marker.is_symlink():
        raise ValueError("Baseline marker must not be a symlink")
    owner = json.loads(marker.read_text())
    expected = {
        "format": "quiet-ios-simulator-workspace", "version": 1,
        "output": str(output.resolve()), "checkout": str(checkout.resolve()),
        "scheme": "Quiet", "configuration": "Debug", "envFile": ".env.staging",
    }
    if any(owner.get(key) != value for key, value in expected.items()):
        raise ValueError("Baseline workspace ownership does not match this staging build")
    derived = output / "DerivedData"
    if derived.is_symlink() or not derived.is_dir():
        raise ValueError("Baseline DerivedData must be an owned directory")
    shutil.rmtree(derived)
    return {"baselineDerivedDataRemoved": True}


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--retire-baseline", type=Path)
    parser.add_argument("--checkout", type=Path)
    args = parser.parse_args()
    if args.retire_baseline:
        if not args.checkout:
            parser.error("--retire-baseline requires --checkout")
        result = retire_baseline(args.retire_baseline, args.checkout, Path(os.environ["RUNNER_TEMP"]))
    else:
        result = prepare(Path("/Applications"), Path(os.environ["DEVELOPER_DIR"]), Path(os.environ["RUNNER_TEMP"]))
    print(json.dumps(result))
