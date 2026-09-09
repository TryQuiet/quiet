"""Host tests for rejecting false runtime verdicts; these do not execute Android Node."""
import importlib.util
from pathlib import Path
import unittest
import sys
import tempfile

spec = importlib.util.spec_from_file_location("android_smoke", Path(__file__).with_name("run-embedded-node-android.py"))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)

HASHES = {key: "a" * 64 for key in ("fixtureSha256", "databaseHelperSha256", "addonSha256")}


def verdict(launch=1):
    return {
        "fixtureVersion": 1, "status": "pass", "stage": "complete", "runId": "public-test",
        "launch": launch, "node": "24.18.0", "platform": "android", "architecture": "arm64",
        "modules": "137", "napi": "10", "nativeBridge": True, "bridgeRoundTrip": True,
        "pid": 100 + launch, "previousPid": 101 if launch == 2 else None, **HASHES,
        "database": {"created": launch == 1, "rowsWritten": 8 if launch == 1 else 0,
                     "rowsRead": 16, "forwardRows": 8, "reverseRows": 8, "openCloseCycles": 2,
                     "missingKeyCode": "LEVEL_NOT_FOUND", "tableFiles": 8, "tableBytes": 100000},
    }


class VerdictTests(unittest.TestCase):
    def validate(self, value, launch=1, previous=None):
        return runner.validate_verdict(value, "public-test", launch, HASHES, previous)

    def test_two_distinct_processes_preserve_data_without_new_writes(self):
        first = self.validate(verdict())
        second = self.validate(verdict(2), 2, first)
        self.assertNotEqual(first["pid"], second["pid"])
        self.assertEqual(second["database"]["rowsWritten"], 0)

    def test_rejects_stale_or_mismatched_runtime_and_artifacts(self):
        for key, value in {"runId": "old-run", "node": "18.20.4", "platform": "linux",
                           "architecture": "x64", "modules": "108", "fixtureSha256": "b" * 64,
                           "databaseHelperSha256": "b" * 64, "addonSha256": "b" * 64,
                           "bridgeRoundTrip": False, "nativeBridge": False}.items():
            with self.subTest(field=key):
                changed = verdict()
                changed[key] = value
                with self.assertRaises(runner.SmokeFailure):
                    self.validate(changed)

    def test_relaunch_requires_actual_new_process_and_no_new_writes(self):
        first = self.validate(verdict())
        for key, value in (("pid", 101), ("previousPid", 99), ("napi", "9")):
            changed = verdict(2)
            changed[key] = value
            with self.subTest(field=key), self.assertRaises(runner.SmokeFailure):
                self.validate(changed, 2, first)
        changed = verdict(2)
        changed["database"]["rowsWritten"] = 8
        with self.assertRaises(runner.SmokeFailure):
            self.validate(changed, 2, first)

    def test_rejects_uncompressed_or_missing_persistent_tables(self):
        for key, value in (("tableBytes", 2000000), ("tableBytes", 0), ("tableFiles", 0),
                           ("rowsRead", 8), ("reverseRows", 0), ("openCloseCycles", 1)):
            changed = verdict()
            changed["database"][key] = value
            with self.subTest(field=key, value=value), self.assertRaises(runner.SmokeFailure):
                self.validate(changed)

    def test_allowlists_public_summary_fields(self):
        changed = verdict()
        changed["unexpectedPrivateField"] = "must-not-appear"
        changed["database"]["unexpectedPrivateField"] = "must-not-appear"
        result = self.validate(changed)
        self.assertNotIn("unexpectedPrivateField", result)
        self.assertNotIn("unexpectedPrivateField", result["database"])
        self.assertNotIn("must-not-appear", str(result))

    def test_requires_typed_real_results(self):
        for key, value in (("napi", "2"), ("napi", "invalid"), ("pid", True),
                           ("nativeBridge", 1), ("status", "running")):
            changed = verdict()
            changed[key] = value
            with self.subTest(field=key), self.assertRaises(runner.SmokeFailure):
                self.validate(changed)


class CommandGuards(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.adb = Path(self.directory.name) / "adb"
        self.adb.write_text("#!" + sys.executable + "\n" + """
import sys
args = sys.argv[3:]
if args == ['get-state']:
    print('device')
elif args == ['emu', 'avd', 'name']:
    print('Owned_Test_AVD\\nOK')
elif args == ['shell', 'pm', 'list', 'instrumentation']:
    print('instrumentation:com.quietmobile.storybook.debug.test/androidx.test.runner.AndroidJUnitRunner (target=com.quietmobile.storybook.debug)')
elif args == ['shell', 'run-as', 'com.quietmobile.storybook.debug', 'pwd']:
    print('/data/user/0/com.quietmobile.storybook.debug')
else:
    print('unexpected-private-command-output', file=sys.stderr)
    sys.exit(9)
""")
        self.adb.chmod(0o700)
        self.android = runner.Android(str(self.adb), "emulator-5580")

    def test_preflight_does_not_require_files_directory_on_fresh_install(self):
        self.android.preflight("Owned_Test_AVD")
        with self.assertRaises(runner.SmokeFailure):
            self.android.preflight("Different_AVD")

    def test_failed_force_stop_cannot_pass_or_expose_command_output(self):
        with self.assertRaises(runner.SmokeFailure) as failure:
            self.android.stop()
        self.assertEqual(str(failure.exception), "Android command failed")


if __name__ == "__main__":
    unittest.main()
