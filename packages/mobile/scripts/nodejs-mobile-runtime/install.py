#!/usr/bin/env python3
"""Verify or restore Quiet's pinned embedded Node runtime (Python 3.9+)."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import tempfile
import urllib.request
import zipfile


HERE = Path(__file__).resolve().parent
MOBILE_ROOT = HERE.parent.parent
# Keep the install destinations in code: a manifest cannot select other files.
LAYOUT = {
    "android": {
        "bin/arm64-v8a": "android/app/libnode/bin/arm64-v8a",
        "include/node": "android/app/libnode/include/node",
    },
    "ios": {
        "NodeMobile.xcframework": "ios/NodeJsMobile/NodeMobile.xcframework",
        "include/node": "ios/NodeJsMobile/libnode/include/node",
    },
}


def digest(path):
    result = hashlib.sha256()
    with Path(path).open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def verify_archive(path, metadata):
    if Path(path).stat().st_size != metadata["size"]:
        raise ValueError("Archive size mismatch: " + metadata["name"])
    if digest(path) != metadata["sha256"]:
        raise ValueError("Archive SHA-256 mismatch: " + metadata["name"])


def download(metadata, cache):
    cache.mkdir(parents=True, exist_ok=True)
    name = metadata["name"]
    if Path(name).name != name or not metadata["url"].startswith("https://"):
        raise ValueError("Invalid archive location")
    destination = cache / name
    if destination.exists():
        verify_archive(destination, metadata)
        return destination
    handle, temporary = tempfile.mkstemp(prefix=name + ".", dir=cache)
    try:
        with os.fdopen(handle, "wb") as target:
            request = urllib.request.Request(metadata["url"], headers={"User-Agent": "Quiet-node-runtime"})
            with urllib.request.urlopen(request, timeout=60) as source:
                size = 0
                while True:
                    block = source.read(1024 * 1024)
                    if not block:
                        break
                    size += len(block)
                    if size > metadata["size"]:
                        raise ValueError("Download exceeds pinned archive size: " + name)
                    target.write(block)
        verify_archive(temporary, metadata)
        os.replace(temporary, destination)
    finally:
        Path(temporary).unlink(missing_ok=True)
    return destination


def installed_files(root):
    result = {}
    for mapping in LAYOUT.values():
        for relative in mapping.values():
            directory = root / relative
            if directory.is_symlink():
                raise ValueError("Runtime directory is a symlink: " + relative)
            if not directory.is_dir():
                continue
            for path in directory.rglob("*"):
                if path.is_symlink():
                    raise ValueError("Runtime file is a symlink: " + str(path.relative_to(root)))
                if path.is_file():
                    result[path.relative_to(root).as_posix()] = digest(path)
    return result


def check(root, manifest):
    actual = installed_files(root)
    expected = manifest["files"]
    differences = sorted(path for path in actual.keys() | expected.keys() if actual.get(path) != expected.get(path))
    if differences:
        raise ValueError("Vendored runtime differs from the manifest:\n" + "\n".join(differences[:20]))
    return len(actual)


def stage_archive(archive, platform, stage):
    with zipfile.ZipFile(archive) as source:
        seen = set()
        for entry in source.infolist():
            path = PurePosixPath(entry.filename)
            mode = entry.external_attr >> 16
            if path.is_absolute() or ".." in path.parts or "\\" in entry.filename:
                raise ValueError("Unsafe archive path")
            if stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR)):
                raise ValueError("Unsupported archive entry")
            if entry.is_dir():
                continue
            for prefix, relative in LAYOUT[platform].items():
                if path.parts[:len(PurePosixPath(prefix).parts)] != PurePosixPath(prefix).parts:
                    continue
                suffix = path.relative_to(prefix)
                if not suffix.parts:
                    raise ValueError("Archive file replaces a runtime directory")
                target = stage / relative / suffix
                if target in seen:
                    raise ValueError("Duplicate archive path")
                seen.add(target)
                target.parent.mkdir(parents=True, exist_ok=True)
                with source.open(entry) as reader, target.open("wb") as writer:
                    shutil.copyfileobj(reader, writer)
                target.chmod(0o644)


def install(root, manifest, archives):
    # Verify every archive before touching the installed runtime, including on
    # checksum/ZIP failure. Stage on the same filesystem for directory renames.
    for platform in LAYOUT:
        verify_archive(archives[platform], manifest["archives"][platform])
    with tempfile.TemporaryDirectory(prefix=".nodejs-mobile-", dir=root) as temporary:
        temporary = Path(temporary)
        stage = temporary / "stage"
        stage.mkdir()
        for platform in LAYOUT:
            stage_archive(archives[platform], platform, stage)
        check(stage, manifest)
        moved = []
        try:
            for mapping in LAYOUT.values():
                for relative in mapping.values():
                    destination = root / relative
                    # Refuse symlinked parents, even if the final path is absent.
                    for parent in (destination, *destination.parents):
                        if parent == root:
                            break
                        if parent.is_symlink():
                            raise ValueError("Runtime install path is a symlink: " + relative)
                    backup = temporary / "backup" / relative
                    existed = destination.exists()
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    if existed:
                        backup.parent.mkdir(parents=True, exist_ok=True)
                        os.replace(destination, backup)
                    moved.append((destination, backup, existed))
                    os.replace(stage / relative, destination)
            check(root, manifest)
        except BaseException:
            for destination, backup, existed in reversed(moved):
                if destination.exists():
                    shutil.rmtree(destination)
                if existed:
                    os.replace(backup, destination)
            raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--check", action="store_true", help="verify vendored files (the default)")
    action.add_argument("--install", action="store_true", help="download, verify, and replace only the pinned runtime files")
    parser.add_argument("--cache", type=Path, default=Path(tempfile.gettempdir()) / "quiet-nodejs-mobile-downloads")
    args = parser.parse_args()
    manifest = json.loads((HERE / "runtime.json").read_text())
    if args.install:
        archives = {platform: download(metadata, args.cache) for platform, metadata in manifest["archives"].items()}
        install(MOBILE_ROOT, manifest, archives)
    count = check(MOBILE_ROOT, manifest)
    print("Verified Node " + manifest["nodeVersion"] + " runtime: " + str(count) + " files")


if __name__ == "__main__":
    main()
