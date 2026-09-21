#!/usr/bin/env python3
"""Run the real Android Node/database fixture in two app processes; never read logcat."""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import re
import secrets
import signal
import subprocess
import sys

PACKAGE = "com.quietmobile.storybook.debug"
INSTRUMENTATION = PACKAGE + ".test/androidx.test.runner.AndroidJUnitRunner"
TEST = "com.quietmobile.EmbeddedNodeDatabaseTest"
MOBILE = Path(__file__).resolve().parents[1]
FIXTURES = MOBILE / "e2e/fixtures"
ADDON = MOBILE / "nodejs-assets/deps/android/arm64/classic-level/classic_level.node"


class SmokeFailure(Exception):
    """Messages are fixed public diagnostics, never command output."""


def require(condition, message):
    if not condition:
        raise SmokeFailure(message)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_verdict(value, run_id, launch, hashes, previous=None):
    require(isinstance(value, dict), "Invalid verdict object")
    expected = {
        "fixtureVersion": 1, "status": "pass", "stage": "complete",
        "runId": run_id, "launch": launch, "node": "24.18.0",
        "platform": "android", "architecture": "arm64", "modules": "137",
        "nativeBridge": True, "bridgeRoundTrip": True, **hashes,
    }
    for key, item in expected.items():
        require(type(value.get(key)) is type(item) and value[key] == item,
                "Unexpected verdict field: " + key)
    require(isinstance(value.get("napi"), str) and value["napi"].isdigit()
            and int(value["napi"]) >= 3, "Unsupported Node-API version")
    require(type(value.get("pid")) is int and value["pid"] > 0, "Invalid native PID")
    if previous is None:
        require(value.get("previousPid") is None, "First launch was not fresh")
    else:
        require(value.get("previousPid") == previous["pid"] and value["pid"] != previous["pid"],
                "Relaunch did not use a different process")
        require(value["napi"] == previous["napi"], "Node-API version changed between launches")
    database = value.get("database")
    require(isinstance(database, dict), "Missing database verdict")
    counts = {
        "created": launch == 1, "rowsWritten": 8 if launch == 1 else 0,
        "rowsRead": 16, "forwardRows": 8, "reverseRows": 8,
        "openCloseCycles": 2, "missingKeyCode": "LEVEL_NOT_FOUND",
    }
    for key, item in counts.items():
        require(type(database.get(key)) is type(item) and database[key] == item,
                "Unexpected database field: " + key)
    for key in ("tableFiles", "tableBytes"):
        require(type(database.get(key)) is int and database[key] > 0,
                "Missing persistent compressed tables")
    # Match the real fixture's compressible rows; do not accept only path/count evidence.
    uncompressed_bytes = sum(len(f"row-{index}:") + len("compressed-persistent-value") * 8192
                             for index in range(8))
    require(database["tableBytes"] < uncompressed_bytes / 4, "Persistent tables are not compressed")
    # Return only validated public fields. Unknown app fields never reach the summary.
    return {**expected, "napi": value["napi"], "pid": value["pid"],
            "previousPid": value.get("previousPid"),
            "database": {**counts, "tableFiles": database["tableFiles"],
                         "tableBytes": database["tableBytes"]}}


class Android:
    def __init__(self, adb, serial):
        self.adb = adb
        self.serial = serial

    def command(self, *arguments, timeout=20, check=True):
        try:
            result = subprocess.run([self.adb, "-s", self.serial, *arguments],
                                    capture_output=True, timeout=timeout, check=False)
        except subprocess.TimeoutExpired:
            raise SmokeFailure("Android command exceeded its timeout") from None
        except OSError:
            raise SmokeFailure("Unable to invoke adb") from None
        if check:
            require(result.returncode == 0, "Android command failed")
        require(len(result.stdout) <= 1024 * 1024 and len(result.stderr) <= 1024 * 1024,
                "Android command output exceeded its limit")
        return result

    def stop(self):
        self.command("shell", "am", "force-stop", PACKAGE)

    def preflight(self, expected_avd):
        require(self.command("get-state").stdout.strip() == b"device", "Emulator is not connected")
        name = self.command("emu", "avd", "name").stdout.decode("utf-8").splitlines()[0].strip()
        require(name == expected_avd, "Emulator AVD does not match the explicitly owned AVD")
        instrumentation = self.command("shell", "pm", "list", "instrumentation").stdout.decode("utf-8")
        require(f"instrumentation:{INSTRUMENTATION} (target={PACKAGE})" in instrumentation.splitlines(),
                "Install the matching Storybook debug app and instrumentation APK first")
        self.command("shell", "run-as", PACKAGE, "pwd")

    def launch(self, run_id, launch):
        self.stop()
        result = self.command("shell", "am", "instrument", "-w", "-r",
                              "-e", "class", TEST,
                              "-e", "quietEmbeddedNodeRunId", run_id,
                              "-e", "quietEmbeddedNodeLaunch", str(launch),
                              INSTRUMENTATION, timeout=120)
        # ADB often returns zero even if instrumentation failed. Require a real
        # one-test JUnit success and reject instrumentation status failures.
        output = result.stdout.decode("utf-8", errors="replace")
        require(re.search(r"(?m)^OK \(1 test\)\s*$", output) is not None
                and not re.search(r"INSTRUMENTATION_STATUS_CODE: -[1-9]", output),
                "Native instrumentation did not report one passing test")
        raw = self.command("exec-out", "run-as", PACKAGE, "cat",
                           f"files/quiet-embedded-node-smoke/{run_id}/result.json").stdout
        require(len(raw) < 16384, "Verdict exceeded its size limit")
        try:
            return json.loads(raw)
        except (ValueError, UnicodeError):
            raise SmokeFailure("Native fixture did not write a JSON verdict") from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--serial", required=True, help="Explicit owned emulator serial, e.g. emulator-5580")
    parser.add_argument("--avd-name", required=True, help="Exact name of the owned emulator AVD")
    parser.add_argument("--adb", default="adb")
    parser.add_argument("--output", required=True, type=Path, help="New sanitized JSON summary file")
    args = parser.parse_args()
    require(re.fullmatch(r"emulator-[0-9]+", args.serial) is not None, "This runner requires an owned emulator")
    require(re.fullmatch(r"[A-Za-z0-9_.-]+", args.avd_name) is not None, "Invalid AVD name")
    require(not args.output.exists(), "Summary output must be a new file")
    run_id = datetime.datetime.now(datetime.timezone.utc).strftime("android-node-%Y%m%dt%H%M%Sz-") + secrets.token_hex(4)
    hashes = {
        "fixtureSha256": sha256(FIXTURES / "embedded-node-database-android.cjs"),
        "databaseHelperSha256": sha256(FIXTURES / "embedded-node-database.cjs"),
        "addonSha256": sha256(ADDON),
    }
    summary = {"status": "running", "runId": run_id, "serial": args.serial,
               "avd": args.avd_name, "launches": []}
    android = Android(args.adb, args.serial)
    owned = False

    def interrupted(_signum, _frame):
        raise SmokeFailure("Runner interrupted")

    for signum in (signal.SIGTERM, signal.SIGHUP):
        signal.signal(signum, interrupted)
    try:
        android.preflight(args.avd_name)
        owned = True
        previous = None
        for launch in (1, 2):
            verdict = validate_verdict(android.launch(run_id, launch), run_id, launch, hashes, previous)
            summary["launches"].append(verdict)
            previous = verdict
        summary["status"] = "pass"
    except (SmokeFailure, KeyboardInterrupt) as error:
        summary["status"] = "fail"
        summary["error"] = str(error) if isinstance(error, SmokeFailure) else "Runner interrupted"
    finally:
        if owned:
            try:
                android.stop()
            except SmokeFailure:
                summary["status"] = "fail"
                summary["error"] = "Could not stop the owned Storybook app"
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("x") as output:
            json.dump(summary, output, indent=2)
            output.write("\n")
    print("Android embedded Node database smoke: " + summary["status"])
    return 0 if summary["status"] == "pass" else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (SmokeFailure, OSError) as error:
        print(str(error) if isinstance(error, SmokeFailure) else "Runner file operation failed", file=sys.stderr)
        sys.exit(1)
