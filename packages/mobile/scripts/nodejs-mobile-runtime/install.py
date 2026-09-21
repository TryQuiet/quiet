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
# Extra Android ABIs for emulator builds. They are not vendored in git: install one
# with `--install --abi <abi>`; `--check` verifies it only while its directory exists.
OPTIONAL_ANDROID_ABIS = ("x86_64",)


def android_abi_layout(abi):
    if abi not in OPTIONAL_ANDROID_ABIS:
        raise ValueError("Unsupported optional Android ABI: " + abi)
    return {"bin/" + abi: "android/app/libnode/bin/" + abi}


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


def installed_files(root, mappings=None):
    result = {}
    for mapping in LAYOUT.values() if mappings is None else mappings:
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


def expected_layout(root, manifest):
    """The vendored runtime plus every optional ABI directory that is present."""
    mappings = list(LAYOUT.values())
    expected = dict(manifest["files"])
    for abi in OPTIONAL_ANDROID_ABIS:
        mapping = android_abi_layout(abi)
        if any((root / relative).exists() for relative in mapping.values()):
            mappings.append(mapping)
            expected.update(manifest.get("optionalAndroidAbis", {}).get(abi, {}))
    return mappings, expected


def compare(actual, expected):
    differences = sorted(path for path in actual.keys() | expected.keys() if actual.get(path) != expected.get(path))
    if differences:
        raise ValueError("Vendored runtime differs from the manifest:\n" + "\n".join(differences[:20]))
    return len(actual)


def check(root, manifest):
    mappings, expected = expected_layout(root, manifest)
    return compare(installed_files(root, mappings), expected)


def stage_archive(archive, platform, stage, mapping=None):
    mapping = LAYOUT[platform] if mapping is None else mapping
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
            for prefix, relative in mapping.items():
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
        relatives = [relative for mapping in LAYOUT.values() for relative in mapping.values()]
        replace_directories(root, temporary, stage, relatives, lambda: check(root, manifest))


def replace_directories(root, temporary, stage, relatives, verify):
    moved = []
    try:
        for relative in relatives:
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
        verify()
    except BaseException:
        for destination, backup, existed in reversed(moved):
            if destination.exists():
                shutil.rmtree(destination)
            if existed:
                os.replace(backup, destination)
        raise


def install_android_abi(root, manifest, archive, abi):
    """Add one optional Android ABI from the pinned Android archive; nothing else changes."""
    expected = manifest.get("optionalAndroidAbis", {}).get(abi)
    if not expected:
        raise ValueError("Manifest has no files for Android ABI " + abi)
    verify_archive(archive, manifest["archives"]["android"])
    mapping = android_abi_layout(abi)
    with tempfile.TemporaryDirectory(prefix=".nodejs-mobile-", dir=root) as temporary:
        temporary = Path(temporary)
        stage = temporary / "stage"
        stage.mkdir()
        stage_archive(archive, "android", stage, mapping)
        compare(installed_files(stage, [mapping]), expected)
        # Verify only the added directory: the vendored runtime (including iOS LFS
        # objects, which may not be fetched) is untouched and checked by --check.
        verify = lambda: compare(installed_files(root, [mapping]), expected)
        replace_directories(root, temporary, stage, list(mapping.values()), verify)
    return len(expected)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--check", action="store_true", help="verify vendored files (the default)")
    action.add_argument("--install", action="store_true", help="download, verify, and replace only the pinned runtime files")
    parser.add_argument("--cache", type=Path, default=Path(tempfile.gettempdir()) / "quiet-nodejs-mobile-downloads")
    parser.add_argument("--abi", action="append", choices=OPTIONAL_ANDROID_ABIS, default=[],
                        help="with --install: add only this optional Android ABI (emulator builds)")
    args = parser.parse_args()
    manifest = json.loads((HERE / "runtime.json").read_text())
    if args.install and args.abi:
        archive = download(manifest["archives"]["android"], args.cache)
        for abi in args.abi:
            count = install_android_abi(MOBILE_ROOT, manifest, archive, abi)
            print("Installed Node " + manifest["nodeVersion"] + " Android " + abi + " runtime: " + str(count) + " files")
        return
    if args.install:
        archives = {platform: download(metadata, args.cache) for platform, metadata in manifest["archives"].items()}
        install(MOBILE_ROOT, manifest, archives)
    count = check(MOBILE_ROOT, manifest)
    print("Verified Node " + manifest["nodeVersion"] + " runtime: " + str(count) + " files")


if __name__ == "__main__":
    main()
