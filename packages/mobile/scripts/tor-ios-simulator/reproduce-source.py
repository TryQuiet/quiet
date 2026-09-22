#!/usr/bin/env python3
"""Prepare the pinned Tor sources in a new directory without starting a build."""

import sys

if sys.version_info < (3, 12):
    raise SystemExit("Source preparation requires Python 3.12 or newer.")

import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tarfile
import urllib.request


def read_archive(recipe, source):
    """Verify cached or downloaded bytes before extracting any archive."""
    cached = recipe / "downloads" / f"{source['name']}.tar.gz"
    if cached.exists():
        data = cached.read_bytes()
    else:
        with urllib.request.urlopen(source["url"], timeout=120) as response:
            data = response.read()

    if (
        len(data) != source["archiveBytes"]
        or hashlib.sha256(data).hexdigest() != source["archiveSHA256"]
    ):
        raise ValueError(f"Source archive failed verification: {source['name']}")
    return data


def extract_archive(data, target):
    """Strip the archive's root directory and apply Python's safe data filter."""
    target.mkdir(parents=True, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as archive:
        for member in archive:
            path = PurePosixPath(member.name)
            if path.is_absolute() or ".." in path.parts:
                raise ValueError(f"Unsafe archive path: {member.name}")

            # The pinned archives use regular files, directories, and contained
            # symbolic links. Reject hard links, devices, and other member types.
            if not (member.isfile() or member.isdir() or member.issym()):
                raise ValueError(f"Unsupported archive member: {member.name}")

            if len(path.parts) < 2:
                if not member.isdir():
                    raise ValueError(f"Expected an archive root directory: {member.name}")
                continue

            relative = PurePosixPath(*path.parts[1:])
            stripped = member.replace(name=str(relative))
            archive.extract(stripped, target, filter="data")


def prepare(recipe, requested_destination):
    destination = requested_destination.resolve()
    if requested_destination.is_symlink() or destination.exists():
        raise ValueError("Destination must not exist; preparation never overwrites a checkout.")
    if shutil.which("patch") is None:
        raise ValueError("Source preparation requires the patch command.")

    manifest = json.loads((recipe / "source-manifest.json").read_text())
    patch = recipe / "patches" / "quiet-arm64-simulator.patch"
    if hashlib.sha256(patch.read_bytes()).hexdigest() != manifest["patchSHA256"]:
        raise ValueError("Patch digest does not match the source manifest.")

    # Verify all downloads before creating the output directory. A failed download
    # or unsupported Python version therefore leaves no partial source checkout.
    sources = [(source, read_archive(recipe, source)) for source in manifest["sources"]]
    destination.mkdir(parents=True)
    for source, data in sources:
        target = destination / source["destination"]
        if not target.resolve().is_relative_to(destination):
            raise ValueError(f"Unsafe manifest destination: {source['destination']}")
        extract_archive(data, target)
        print(f"Verified {source['name']} @ {source['commit']}", flush=True)

    subprocess.run(
        ["patch", "-p1", "--batch", "--forward", "-i", str(patch)],
        cwd=destination / "Tor.framework",
        check=True,
    )

    for name in (
        "build-arm64-simulator.sh",
        "source-manifest.json",
        "README.md",
        "reproduce-source.py",
    ):
        shutil.copy2(recipe / name, destination / name)
    shutil.copytree(recipe / "patches", destination / "patches")
    print(f"Prepared: {destination}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path, help="new source directory to create")
    arguments = parser.parse_args()
    recipe = Path(__file__).resolve().parent
    try:
        prepare(recipe, arguments.destination.expanduser())
    except (OSError, ValueError, tarfile.TarError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
