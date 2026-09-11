import json
import os
from pathlib import Path
import plistlib
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from ci_credentials import accounts_from_environment, development_accounts, prepare
from fixture import push_environment


class CiCredentialsTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / ".github/secrets").mkdir(parents=True)
        self.key = "fixture-passphrase-never-log"
        self.account = {"type": "service_account", "project_id": "fixture-project", "client_email": "fixture@fixture-project.iam.gserviceaccount.com", "private_key": "-----BEGIN PRIVATE KEY-----\nfixture-key-never-log\n-----END PRIVATE KEY-----\n"}

    def encrypt(self, platform, project="fixture-project", package="com.quietmobile.debug"):
        if platform == "android":
            data = json.dumps({"project_info": {"project_id": project}, "client": [{"client_info": {"android_client_info": {"package_name": package}}}]}).encode()
            name = "google-services.json"
        else:
            data = plistlib.dumps({"PROJECT_ID": project, "BUNDLE_ID": "com.quietmobile"})
            name = "GoogleService-Info.plist"
        plain = self.root / name
        plain.write_bytes(data)
        subprocess.run(["gpg", "--batch", "--quiet", "--pinentry-mode", "loopback", "--passphrase-fd", "0", "--symmetric", "--output", str(self.root / ".github/secrets" / (name + ".gpg")), str(plain)], input=self.key.encode(), check=True, capture_output=True)
        return data

    def test_real_gpg_clients_and_fixture_accounts_match_both_platforms(self):
        android = self.encrypt("android")
        ios = self.encrypt("ios")
        output = self.root / "private"
        report = prepare(self.root, output, {"ANDROID_FIREBASE_KEY": self.key, "IOS_FIREBASE_KEY": self.key, "QSS_NOTIFICATION_FIREBASE_CREDENTIALS": json.dumps({"android": self.account, "ios": self.account})})
        self.assertTrue(report["android"]["ready"])
        self.assertTrue(report["ios"]["ready"])
        environment, platforms = push_environment(output / "firebase-accounts.json")
        self.assertEqual(platforms, ["android", "ios"])
        self.assertEqual(environment["FIREBASE_ANDROID_PRIVATE_KEY"], self.account["private_key"])
        for relative, raw in [("packages/mobile/android/app/google-services.json", android), ("packages/mobile/ios/GoogleService-Info.plist", ios)]:
            self.assertEqual((self.root / relative).read_bytes(), raw)
            self.assertEqual((self.root / relative).stat().st_mode & 0o777, 0o600)
        public = (output / "availability.json").read_text()
        for secret in [self.key, self.account["project_id"], self.account["client_email"], "fixture-key-never-log"]:
            self.assertNotIn(secret, public)

    def test_client_configuration_alone_does_not_authorize_full_loop(self):
        self.encrypt("android")
        report = prepare(self.root, self.root / "private", {"ANDROID_FIREBASE_KEY": self.key})
        self.assertTrue(report["android"]["clientValid"])
        self.assertFalse(report["android"]["serverAccountAvailable"])
        self.assertFalse(report["android"]["ready"])

    def test_wrong_project_or_production_only_application_cannot_pass(self):
        for project, package in [("other-project", "com.quietmobile.debug"), ("fixture-project", "com.quietmobile")]:
            with self.subTest(project=project, package=package):
                case = self.root / project
                case.mkdir()
                previous = self.root
                self.root = case
                (case / ".github/secrets").mkdir(parents=True)
                self.encrypt("android", project, package)
                report = prepare(case, case / "private", {"ANDROID_FIREBASE_KEY": self.key, "QSS_NOTIFICATION_FIREBASE_CREDENTIALS": json.dumps({"android": self.account})})
                self.assertFalse(report["android"]["ready"])
                self.root = previous

    def test_split_qps_environment_normalizes_pem_and_rejects_partial_accounts(self):
        environment = {"FIREBASE_ANDROID_" + key.upper(): value.replace("\n", "\\n") for key, value in self.account.items() if key != "type"}
        self.assertEqual(accounts_from_environment(environment), {"android": self.account})
        del environment["FIREBASE_ANDROID_PRIVATE_KEY"]
        self.assertEqual(accounts_from_environment(environment), {})

    def test_bad_secret_fails_cli_without_leaking_secret_or_success(self):
        result = subprocess.run(["python3", str(Path(__file__).with_name("ci_credentials.py")), "--checkout", str(self.root), "--output", str(self.root / "private"), "--require", "android"], env={**os.environ, "QSS_NOTIFICATION_FIREBASE_CREDENTIALS": "secret-invalid-json-never-print"}, capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertNotIn("secret-invalid-json-never-print", result.stdout + result.stderr)
        self.assertIn("must be a JSON", result.stdout)

    def test_missing_credentials_produces_failing_preflight_with_no_test_claim(self):
        environment = {key: value for key, value in os.environ.items() if "FIREBASE" not in key}
        result = subprocess.run(["python3", str(Path(__file__).with_name("ci_credentials.py")), "--checkout", str(self.root), "--output", str(self.root / "private"), "--require", "android"], env=environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("No notification test has run", result.stdout)

    def aws_config(self):
        directory = self.root / "3rd-party/qss/app"
        directory.mkdir(parents=True)
        (directory / ".env.dev").write_text("AWS_REGION=us-east-1\n" + "\n".join(
            f"FIREBASE_{platform}_{field}={self.account[field.lower()]}"
            for platform in ("ANDROID", "IOS") for field in ("PROJECT_ID", "CLIENT_EMAIL")))
        return {"QSS_AWS_ACCESS_KEY_ID": "fixture-aws-id", "QSS_AWS_SECRET_ACCESS_KEY": "fixture-aws-secret"}

    def test_aws_uses_only_exact_development_names_and_handles_qss_secret_formats(self):
        environment = self.aws_config()
        for value in [self.account["private_key"], json.dumps(self.account["private_key"]), json.dumps({"secret": self.account["private_key"]})]:
            response = subprocess.CompletedProcess([], 0, json.dumps({"SecretString": value}), "")
            with self.subTest(format=value[:1]), patch("ci_credentials.subprocess.run", return_value=response) as execute:
                accounts, results = development_accounts(self.root, environment)
                self.assertEqual(accounts, {"android": self.account, "ios": self.account})
                self.assertEqual(results, {"android": "retrieved", "ios": "retrieved"})
                self.assertEqual([call.args[0][4] for call in execute.call_args_list], ["DEV_FIREBASE_ANDROID_PRIVATE_KEY", "DEV_FIREBASE_IOS_PRIVATE_KEY"])
                for call in execute.call_args_list:
                    self.assertEqual(call.kwargs["env"]["AWS_ACCESS_KEY_ID"], "fixture-aws-id")
                    self.assertEqual(call.kwargs["env"]["AWS_SHARED_CREDENTIALS_FILE"], "/dev/null")
                    self.assertNotIn("AWS_PROFILE", call.kwargs["env"])
                    self.assertTrue(call.kwargs["capture_output"])

    def test_aws_denial_has_no_production_fallback_or_raw_diagnostics(self):
        environment = self.aws_config()
        response = subprocess.CompletedProcess([], 1, "", "An error occurred (AccessDeniedException): fixture-secret-never-log")
        with patch("ci_credentials.subprocess.run", return_value=response) as execute:
            accounts, results = development_accounts(self.root, environment)
        self.assertEqual(accounts, {})
        self.assertEqual(set(results.values()), {"AccessDeniedException"})
        self.assertEqual(execute.call_count, 2)
        self.assertNotIn("fixture-secret-never-log", json.dumps(results))

    def test_aws_requires_explicit_ci_credentials_instead_of_host_defaults(self):
        self.aws_config()
        with patch("ci_credentials.subprocess.run") as execute:
            accounts, results = development_accounts(self.root, {})
        execute.assert_not_called()
        self.assertEqual(accounts, {})
        self.assertEqual(set(results.values()), {"aws-credentials-unavailable"})


if __name__ == "__main__":
    unittest.main()
