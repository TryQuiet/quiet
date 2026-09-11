#!/usr/bin/env python3
"""Prepare CI's explicitly selected Firebase credentials without logging values."""
import argparse
import json
import os
from pathlib import Path
import plistlib
import subprocess

from fixture import private_json, push_environment


def accounts_from_environment(environment):
    bundled = environment.get("QSS_NOTIFICATION_FIREBASE_CREDENTIALS", "")
    if bundled:
        try:
            accounts = json.loads(bundled)
        except (ValueError, TypeError):
            raise ValueError("QSS_NOTIFICATION_FIREBASE_CREDENTIALS must be a JSON platform-to-service-account map") from None
        if not isinstance(accounts, dict) or set(accounts) - {"android", "ios"}:
            raise ValueError("QSS_NOTIFICATION_FIREBASE_CREDENTIALS requires android and/or ios entries")
        return accounts
    accounts = {}
    for platform in ("android", "ios"):
        prefix = f"FIREBASE_{platform.upper()}_"
        fields = {key.lower(): environment.get(prefix + key, "") for key in ("PROJECT_ID", "CLIENT_EMAIL", "PRIVATE_KEY")}
        if all(fields.values()):
            fields["private_key"] = fields["private_key"].replace("\\n", "\n")
            accounts[platform] = {"type": "service_account", **fields}
    return accounts


def decrypt_client(checkout, platform, passphrase):
    source = "google-services.json" if platform == "android" else "GoogleService-Info.plist"
    # Passphrase goes through stdin, never argv. Suppress GPG diagnostics because
    # this is a public CI log; report a fixed error instead of raw input/output.
    result = subprocess.run(
        ["gpg", "--batch", "--quiet", "--pinentry-mode", "loopback", "--passphrase-fd", "0",
         "--decrypt", str(checkout / ".github/secrets" / (source + ".gpg"))],
        input=passphrase.encode(), capture_output=True,
    )
    if result.returncode:
        raise ValueError(f"{platform} Firebase client decryption failed")
    try:
        client = json.loads(result.stdout) if platform == "android" else plistlib.loads(result.stdout)
    except (ValueError, plistlib.InvalidFileException):
        raise ValueError(f"{platform} Firebase client configuration is invalid") from None
    return client, result.stdout


def prepare(checkout, output, environment):
    output.mkdir(mode=0o700, parents=True, exist_ok=False)
    accounts = accounts_from_environment(environment)
    credentials = output / "firebase-accounts.json"
    if accounts:
        private_json(credentials, accounts)
        push_environment(credentials)  # Use the exact fixture validation rules.
    report = {}
    for platform in ("android", "ios"):
        key = f"{platform.upper()}_FIREBASE_KEY"
        prefix = f"FIREBASE_{platform.upper()}_"
        status = {
            "clientSecretAvailable": bool(environment.get(key)),
            "serverAccountAvailable": platform in accounts,
            "serverFieldsAvailable": {field: bool(environment.get(prefix + field)) for field in ("PROJECT_ID", "CLIENT_EMAIL", "PRIVATE_KEY")},
            "clientValid": False, "projectMatches": False, "applicationMatches": False, "ready": False,
        }
        report[platform] = status
        if not status["clientSecretAvailable"]:
            continue
        client, raw = decrypt_client(checkout, platform, environment[key])
        status["clientValid"] = True
        if platform == "android":
            project = client.get("project_info", {}).get("project_id")
            packages = [entry.get("client_info", {}).get("android_client_info", {}).get("package_name") for entry in client.get("client", [])]
            status["applicationMatches"] = "com.quietmobile.debug" in packages
            destination = checkout / "packages/mobile/android/app/google-services.json"
        else:
            project = client.get("PROJECT_ID")
            status["applicationMatches"] = client.get("BUNDLE_ID") == "com.quietmobile"
            destination = checkout / "packages/mobile/ios/GoogleService-Info.plist"
        status["projectMatches"] = bool(project) and project == accounts.get(platform, {}).get("project_id")
        status["ready"] = status["projectMatches"] and status["applicationMatches"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        with os.fdopen(os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "wb") as stream:
            stream.write(raw)
    private_json(output / "availability.json", report)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkout", type=Path, default=Path(__file__).resolve().parents[4])
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--require", choices=("android", "ios"))
    args = parser.parse_args()
    # Remove selected secrets before GPG or any subsequent child processes.
    names = ["QSS_NOTIFICATION_FIREBASE_CREDENTIALS", "ANDROID_FIREBASE_KEY", "IOS_FIREBASE_KEY"]
    names += [f"FIREBASE_{platform}_{field}" for platform in ("ANDROID", "IOS") for field in ("PROJECT_ID", "CLIENT_EMAIL", "PRIVATE_KEY")]
    environment = {name: os.environ.pop(name, "") for name in names}
    try:
        report = prepare(args.checkout.resolve(), args.output.resolve(), environment)
    except ValueError as error:
        # All errors here have fixed messages; never include parsed credentials.
        print(str(error))
        return 1
    print(json.dumps(report, indent=2))
    if args.require and not report[args.require]["ready"]:
        print(f"{args.require} full-loop prerequisites are unavailable or mismatched. "
              "Supply the native Firebase decryption key and a matching Firebase server account "
              "via QSS_NOTIFICATION_FIREBASE_CREDENTIALS or FIREBASE_<PLATFORM>_{PROJECT_ID,CLIENT_EMAIL,PRIVATE_KEY}. "
              "Client configuration alone cannot send pushes. No notification test has run.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
