import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("prepare_runner", HERE / "prepare-runner.py")
runner = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(runner)
GUARD_SPEC = importlib.util.spec_from_file_location("guarded_builder", HERE.parent / "tor-ios-simulator/build-storybook.py")
guard = importlib.util.module_from_spec(GUARD_SPEC)
GUARD_SPEC.loader.exec_module(guard)


class CIHelperTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def test_runner_cleanup_preserves_selected_xcode_links_and_other_apps(self):
        applications = self.root / "Applications"
        developer = applications / "Xcode_26.3.app/Contents/Developer"
        developer.mkdir(parents=True)
        old = applications / "Xcode_16.4.app"
        old.mkdir()
        (old / "sentinel").write_text("old Xcode")
        (applications / "Other.app").mkdir()
        (applications / "Xcode.app").symlink_to(developer.parents[1], target_is_directory=True)
        with patch.dict(os.environ, {"RUNNER_ENVIRONMENT": "self-hosted"}):
            with self.assertRaisesRegex(RuntimeError, "ephemeral"):
                runner.prepare(applications, developer, self.root)
        self.assertTrue(old.exists())
        commands = []
        def remove(command, **kwargs):
            commands.append(command)
            self.assertEqual(command[:4], ["sudo", "rm", "-rf", "--"])
            shutil.rmtree(command[4])
        disk = shutil.disk_usage(self.root)._replace(free=runner.MINIMUM_FREE_BYTES)
        with patch.dict(os.environ, {"RUNNER_ENVIRONMENT": "github-hosted"}), patch.object(runner.subprocess, "run", side_effect=remove), patch.object(runner.shutil, "disk_usage", return_value=disk):
            result = runner.prepare(applications, developer, self.root)
        self.assertEqual(commands, [["sudo", "rm", "-rf", "--", str(old)]])
        self.assertEqual(result["removedXcodeBundles"], [old.name])
        self.assertTrue(developer.is_dir())
        self.assertTrue((applications / "Xcode.app").is_symlink())
        self.assertTrue((applications / "Other.app").is_dir())

    def test_runner_cleanup_rejects_unknown_toolchain_and_insufficient_space(self):
        applications = self.root / "Applications"
        developer = applications / "Xcode_26.3.app/Contents/Developer"
        developer.mkdir(parents=True)
        with patch.dict(os.environ, {"RUNNER_ENVIRONMENT": "github-hosted"}):
            with self.assertRaises(ValueError):
                runner.prepare(applications, self.root / "missing/Contents/Developer", self.root)
            disk = shutil.disk_usage(self.root)._replace(free=runner.MINIMUM_FREE_BYTES - 1)
            with patch.object(runner.shutil, "disk_usage", return_value=disk):
                with self.assertRaisesRegex(RuntimeError, "25 GiB"):
                    runner.prepare(applications, developer, self.root)

    def test_summary_exports_only_counts_booleans_and_pinned_revisions(self):
        secret = "PRIVATE-INVITATION-CANARY"
        for name in ("fixture", "single", "mixed"):
            (self.root / name).mkdir()
        (self.root / "fixture/result.json").write_text(json.dumps({"status": "passed", "manifest": {"qssCommit": "a" * 40, "environment": {"SECRET": secret}}}))
        (self.root / "single/jest-private.json").write_text(json.dumps({"numPassedTests": 1, "numFailedTests": 0, "numTotalTests": 1, "failureMessage": secret, "testResults": [secret]}))
        (self.root / "single/ui.json").write_text(json.dumps({"messageStored": True, "restarted": True, "invitation": secret, "serverBaseline": {"maxSyncSeq": 3, "teamId": secret}, "serverActivityAfterSend": {"maxSyncSeq": 4}}))
        (self.root / "mixed/jest-private.json").write_text("invalid JSON " + secret)
        output = self.root / "summary.json"
        command = [sys.executable, str(HERE / "summary.py"), "--fixture", str(self.root / "fixture"), "--single", str(self.root / "single"), "--mixed", str(self.root / "mixed"), "--output", str(output), "--single-outcome", "success", "--mixed-outcome", "failure"]
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        self.assertNotIn(secret, result.stdout + output.read_text())
        summary = json.loads(output.read_text())
        self.assertEqual(summary["singlePlayer"]["numPassedTests"], 1)
        self.assertEqual(summary["singlePlayer"]["serverActivityAfterSend"], {"maxSyncSeq": 4})
        self.assertEqual(summary["mixed"], {"outcome": "failure", "reportPresent": False})
        self.assertEqual(output.stat().st_mode & 0o777, 0o600)
        original = output.read_bytes()
        self.assertNotEqual(subprocess.run(command, capture_output=True).returncode, 0)
        self.assertEqual(output.read_bytes(), original)

    def test_baseline_cache_retirement_preserves_evidence_and_respects_real_guard_marker(self):
        output = self.root / "baseline"
        checkout = self.root / "checkout"
        owner = {"format": "quiet-ios-simulator-workspace", "version": 1, "output": str(output.resolve()), "checkout": str(checkout.resolve()), "scheme": "Quiet", "configuration": "Debug", "envFile": ".env.staging"}
        guard.prepare_workspace(output, owner)
        derived = output / "DerivedData"
        derived.mkdir()
        (derived / "cache").write_text("build cache")
        (output / "runs").mkdir()
        (output / "runs/receipt.json").write_text("baseline evidence")
        with self.assertRaisesRegex(guard.BuildFailure, "different checkout or build selection"):
            guard.prepare_workspace(output, {**owner, "envFile": ".env.e2e.qss"})
        with patch.dict(os.environ, {"RUNNER_ENVIRONMENT": "github-hosted"}):
            with self.assertRaisesRegex(ValueError, "ownership"):
                runner.retire_baseline(output, self.root / "wrong-checkout", self.root)
            self.assertTrue((derived / "cache").exists())
            self.assertEqual(runner.retire_baseline(output, checkout, self.root), {"baselineDerivedDataRemoved": True})
        self.assertFalse(derived.exists())
        self.assertEqual((output / "runs/receipt.json").read_text(), "baseline evidence")
        guard.prepare_workspace(output, owner)
        outside = self.root / "outside"
        outside.mkdir()
        (outside / "sentinel").write_text("keep")
        derived.symlink_to(outside, target_is_directory=True)
        with patch.dict(os.environ, {"RUNNER_ENVIRONMENT": "github-hosted"}):
            with self.assertRaisesRegex(ValueError, "owned directory"):
                runner.retire_baseline(output, checkout, self.root)
        self.assertTrue((outside / "sentinel").exists())


if __name__ == "__main__":
    unittest.main()
