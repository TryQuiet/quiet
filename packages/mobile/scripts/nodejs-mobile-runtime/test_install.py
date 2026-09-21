"""Real archive/filesystem checks; these do not prove native runtime behavior."""

import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile


SPEC = importlib.util.spec_from_file_location("runtime_installer", Path(__file__).with_name("install.py"))
installer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(installer)


class RuntimeInstallTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / "mobile"
        self.root.mkdir()
        self.manifest = {"archives": {}, "files": {}}
        self.archives = {}
        for platform, mapping in installer.LAYOUT.items():
            archive = Path(self.temporary.name) / (platform + ".zip")
            with zipfile.ZipFile(archive, "w") as source:
                for prefix, destination in mapping.items():
                    content = ("new runtime " + platform + prefix).encode()
                    source.writestr(prefix + "/runtime", content)
                    self.manifest["files"][destination + "/runtime"] = hashlib.sha256(content).hexdigest()
                    old = self.root / destination / "old-runtime"
                    old.parent.mkdir(parents=True)
                    old.write_bytes(b"preserve until installation succeeds")
            self.archives[platform] = archive
            self.manifest["archives"][platform] = {
                "name": archive.name, "size": archive.stat().st_size,
                "sha256": installer.digest(archive),
            }
        self.before = installer.installed_files(self.root)

    def test_verified_install_replaces_stale_headers_and_preserves_addons(self):
        addon = self.root / "ios/classic-level.framework/classic-level"
        addon.parent.mkdir()
        addon.write_bytes(b"original database addon")
        installer.install(self.root, self.manifest, self.archives)
        self.assertEqual(installer.check(self.root, self.manifest), 4)
        self.assertEqual(addon.read_bytes(), b"original database addon")
        self.assertFalse(any(self.root.rglob("old-runtime")))

    def test_corrupt_second_archive_leaves_both_platforms_untouched(self):
        archive = self.archives["ios"]
        data = bytearray(archive.read_bytes())
        data[-1] ^= 1  # Same size, so only the digest catches this corruption.
        archive.write_bytes(data)
        with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
            installer.install(self.root, self.manifest, self.archives)
        self.assertEqual(installer.installed_files(self.root), self.before)

    def test_unexpected_or_modified_installed_files_fail_check(self):
        installer.install(self.root, self.manifest, self.archives)
        target = self.root / next(iter(self.manifest["files"]))
        original = target.read_bytes()
        target.write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "differs from the manifest"):
            installer.check(self.root, self.manifest)
        target.write_bytes(original)
        target.with_name("stale-header.h").write_bytes(b"old header")
        with self.assertRaisesRegex(ValueError, "stale-header"):
            installer.check(self.root, self.manifest)

    def test_verified_archive_cannot_escape_staging_directory(self):
        archive = self.archives["ios"]
        with zipfile.ZipFile(archive, "a") as source:
            source.writestr("../outside", b"unexpected")
        self.manifest["archives"]["ios"].update(size=archive.stat().st_size, sha256=installer.digest(archive))
        with self.assertRaisesRegex(ValueError, "Unsafe archive path"):
            installer.install(self.root, self.manifest, self.archives)
        self.assertEqual(installer.installed_files(self.root), self.before)
        self.assertFalse((self.root / "outside").exists())

    def test_install_error_restores_already_replaced_directories(self):
        replace = installer.os.replace

        def fail_on_ios_stage(source, destination):
            if "/stage/ios/" in str(source):
                raise OSError("simulated filesystem failure")
            return replace(source, destination)

        with patch.object(installer.os, "replace", side_effect=fail_on_ios_stage):
            with self.assertRaisesRegex(OSError, "filesystem failure"):
                installer.install(self.root, self.manifest, self.archives)
        self.assertEqual(installer.installed_files(self.root), self.before)

    def test_symlinked_destination_cannot_modify_another_checkout(self):
        other = Path(self.temporary.name) / "other-checkout"
        (self.root / "android").rename(other)
        (self.root / "android").symlink_to(other, target_is_directory=True)
        before = {str(p.relative_to(other)): p.read_bytes() for p in other.rglob("*") if p.is_file()}
        with self.assertRaisesRegex(ValueError, "symlink"):
            installer.install(self.root, self.manifest, self.archives)
        after = {str(p.relative_to(other)): p.read_bytes() for p in other.rglob("*") if p.is_file()}
        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main()
