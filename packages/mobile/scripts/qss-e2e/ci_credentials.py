#!/usr/bin/env python3
"""Prepare CI's explicitly selected Firebase credentials without logging values."""
import argparse
import json
import os
from pathlib import Path
import plistlib
import re
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


def development_accounts(checkout, environment):
    """Use QSS's deployed DEV secret names and its pinned public project config.

    Only the two development Firebase keys are read. No AWS defaults, production
    secret fallback, secret enumeration, account changes or remote QSS are used.
    """
    accounts, results = {}, {}
    config = {}
    for line in (checkout / "3rd-party/qss/app/.env.dev").read_text().splitlines():
        key, separator, value = line.partition("=")
        if separator and (key.startswith("FIREBASE_") or key == "AWS_REGION"):
            config[key] = value.strip()
    if not environment.get("QSS_AWS_ACCESS_KEY_ID") or not environment.get("QSS_AWS_SECRET_ACCESS_KEY"):
        return {}, {platform: "aws-credentials-unavailable" for platform in ("android", "ios")}
    child_environment = {key: value for key, value in os.environ.items() if not key.startswith(("AWS_", "QSS_AWS_", "FIREBASE_")) and "FIREBASE" not in key}
    child_environment.update({
        "AWS_ACCESS_KEY_ID": environment["QSS_AWS_ACCESS_KEY_ID"],
        "AWS_SECRET_ACCESS_KEY": environment["QSS_AWS_SECRET_ACCESS_KEY"],
        "AWS_EC2_METADATA_DISABLED": "true", "AWS_CONFIG_FILE": "/dev/null",
        "AWS_SHARED_CREDENTIALS_FILE": "/dev/null", "AWS_MAX_ATTEMPTS": "3", "AWS_PAGER": "",
    })
    for platform in ("android", "ios"):
        prefix = f"FIREBASE_{platform.upper()}_"
        secret_name = "DEV_" + prefix + "PRIVATE_KEY"
        try:
            result = subprocess.run(
                ["aws", "secretsmanager", "get-secret-value", "--secret-id", secret_name,
                 "--region", config["AWS_REGION"], "--output", "json"],
                env=child_environment, capture_output=True, text=True, timeout=60,
            )
        except (OSError, subprocess.TimeoutExpired):
            results[platform] = "aws-request-unavailable"
            continue
        if result.returncode:
            # Fixed allowlist: AWS diagnostics may contain resource identifiers
            # or credential material, so never print the raw error.
            match = re.search(r"\((AccessDeniedException|ResourceNotFoundException|InvalidClientTokenId|UnrecognizedClientException|ExpiredTokenException|DecryptionFailure)\)", result.stderr)
            results[platform] = match[1] if match else "aws-request-failed"
            continue
        try:
            raw = json.loads(result.stdout)["SecretString"]
            try:
                parsed = json.loads(raw)
                private_key = parsed if isinstance(parsed, str) else parsed.get("secret") if isinstance(parsed, dict) else None
            except ValueError:
                private_key = raw
            if not isinstance(private_key, str) or not private_key.strip():
                raise ValueError()
            accounts[platform] = {
                "type": "service_account", "project_id": config[prefix + "PROJECT_ID"],
                "client_email": config[prefix + "CLIENT_EMAIL"], "private_key": private_key.replace("\\n", "\n"),
            }
            results[platform] = "retrieved"
        except (ValueError, KeyError, TypeError):
            results[platform] = "invalid-secret-format"
    return accounts, results


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


def prepare(checkout, output, environment, qss_development_aws=False):
    output.mkdir(mode=0o700, parents=True, exist_ok=False)
    accounts = accounts_from_environment(environment)
    aws_results = {}
    if qss_development_aws and not accounts:
        accounts, aws_results = development_accounts(checkout, environment)
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
        if qss_development_aws:
            status["developmentAwsSecret"] = aws_results.get(platform, "explicit-credentials-selected")
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
    parser.add_argument("--qss-development-aws", action="store_true", help="Read QSS's two DEV Firebase keys using the explicitly supplied QSS AWS CI credentials")
    args = parser.parse_args()
    # Remove selected secrets before GPG or any subsequent child processes.
    names = ["QSS_NOTIFICATION_FIREBASE_CREDENTIALS", "ANDROID_FIREBASE_KEY", "IOS_FIREBASE_KEY"]
    names += [f"FIREBASE_{platform}_{field}" for platform in ("ANDROID", "IOS") for field in ("PROJECT_ID", "CLIENT_EMAIL", "PRIVATE_KEY")]
    names += ["QSS_AWS_ACCESS_KEY_ID", "QSS_AWS_SECRET_ACCESS_KEY"]
    environment = {name: os.environ.pop(name, "") for name in names}
    try:
        report = prepare(args.checkout.resolve(), args.output.resolve(), environment, args.qss_development_aws)
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
