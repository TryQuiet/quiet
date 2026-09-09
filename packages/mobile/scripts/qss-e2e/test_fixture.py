import importlib.util
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import shutil
import shlex
import socket
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit

SPEC = importlib.util.spec_from_file_location("fixture", Path(__file__).with_name("fixture.py"))
fixture = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(fixture)


class FixtureTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.checkout = self.root / "checkout"
        self.qss = self.checkout / "3rd-party/qss"
        self.auth = self.qss / "3rd-party/auth"
        self.auth.mkdir(parents=True)
        for package in fixture.LFA_PACKAGES:
            target = self.auth / "packages" / package
            target.mkdir(parents=True)
            (target / "package.json").write_text(json.dumps({"name": package}))
        (self.auth / "tsconfig.json").write_text("{}")
        self.init(self.auth)
        (self.qss / "app").mkdir()
        (self.qss / "app/main.ts").write_text("// exact pinned source\n")
        (self.qss / ".env.local").write_text("EXAMPLE=do-not-inherit\n")
        (self.qss / ".dockerignore").write_text("auth-packages\n")
        self.init(self.qss, ("3rd-party/auth", self.auth))
        self.init(self.checkout, ("3rd-party/qss", self.qss))
        (self.qss / "app/.env.local.docker.private").write_text("PRIVATE=must-never-enter-context\n")
        self.output = self.root / "fixture"
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            self.port = listener.getsockname()[1]

    def init(self, path, submodule=None):
        def run(*args):
            subprocess.run(["git", "-C", str(path), *args], check=True, capture_output=True)
        run("init", "-q")
        if submodule:
            relative, child = submodule
            run("update-index", "--add", "--cacheinfo", f"160000,{fixture.git(child, 'rev-parse', 'HEAD')},{relative}")
        run("add", ".")
        run("-c", "user.name=Fixture Test", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture")

    def prepare(self):
        return fixture.prepare(self.checkout, self.output, self.port, False)

    def test_archives_pinned_sources_without_private_files_or_env(self):
        manifest = self.prepare()
        self.assertEqual(manifest["qssCommit"], fixture.git(self.qss, "rev-parse", "HEAD"))
        self.assertEqual(manifest["qssAuthCommit"], fixture.git(self.auth, "rev-parse", "HEAD"))
        self.assertEqual(manifest["endpoint"], f"ws://localhost:{self.port}")
        context = self.output / "context"
        self.assertEqual((context / "app/main.ts").read_text(), "// exact pinned source\n")
        self.assertEqual(list(context.rglob(".env*")), [])
        self.assertEqual(list(context.rglob(".git")), [])
        for package in fixture.LFA_PACKAGES:
            self.assertTrue((context / "auth-packages/lfa" / package / "package.json").is_file())
        self.assertNotIn("auth-packages", (context / ".dockerignore").read_text())
        self.assertEqual(self.output.stat().st_mode & 0o777, 0o700)

    def test_rejects_source_edits_and_wrong_gitlink(self):
        (self.qss / "app/main.ts").write_text("// modified\n")
        with self.assertRaisesRegex(ValueError, "modified source"):
            self.prepare()
        subprocess.run(["git", "-C", str(self.qss), "-c", "user.name=Fixture Test", "-c", "user.email=fixture@example.invalid", "commit", "-qam", "new revision"], check=True, capture_output=True)
        with self.assertRaisesRegex(ValueError, "pinned submodule"):
            self.prepare()
        self.assertFalse(self.output.exists())

    def test_refuses_existing_output_and_occupied_port(self):
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", self.port))
            with self.assertRaises(OSError):
                self.prepare()
        self.output.mkdir()
        with self.assertRaisesRegex(ValueError, "new task-owned"):
            self.prepare()

    def test_manifest_detects_changed_compose_and_unowned_project(self):
        manifest = self.prepare()
        self.assertEqual(fixture.load_manifest(self.output), manifest)
        path = self.output / "compose.json"
        path.write_text("{}")
        with self.assertRaisesRegex(ValueError, "configuration changed"):
            fixture.load_manifest(self.output)
        manifest["project"] = "existing-user-stack"
        fixture.private_json(self.output / "manifest.json", manifest)
        with self.assertRaisesRegex(ValueError, "owned QSS fixture"):
            fixture.load_manifest(self.output)

    @unittest.skipUnless(shutil.which("docker"), "Docker Compose CLI unavailable")
    def test_real_compose_parser_accepts_isolated_fixture(self):
        manifest = self.prepare()
        raw = subprocess.check_output(["docker", "compose", "-f", str(self.output / "compose.json"), "config", "--format", "json"])
        config = json.loads(raw)
        self.assertEqual(config["name"], manifest["project"])
        services = config["services"]
        self.assertNotIn("ports", services["postgres"])
        self.assertNotIn("ports", services["redis"])
        self.assertEqual(services["qss"]["ports"][0]["host_ip"], "127.0.0.1")
        self.assertEqual(services["qss"]["environment"]["ENV"], "local")
        self.assertEqual(services["qss"]["environment"]["QPS_ENABLED"], "false")
        self.assertEqual(services["qss"]["environment"]["QSS_HOSTNAME"], urlsplit(manifest["endpoint"]).hostname)
        self.assertNotIn("volumes", services["qss"])
        for volume in config["volumes"].values():
            self.assertTrue(volume["name"].startswith(manifest["project"] + "_"))

    def test_storage_proof_rejects_sql_and_missing_run_id_before_docker(self):
        proof = self.root / "proof.json"
        for payload in ({"teamId": "'; DELETE FROM communities;--", "runId": "test"}, {"teamId": "a" * 40}):
            fixture.private_json(proof, payload)
            with self.assertRaises(ValueError):
                fixture.storage_proof({}, proof)

    def test_storage_proof_binds_exact_team_and_run_for_both_runtimes(self):
        import native
        proof_path = self.root / "proof.json"
        proof = {"teamId": "2" * 44, "runId": "one-player-run"}
        fixture.private_json(proof_path, proof)
        counts = {"communityExists": False, "logEntryCount": 0, "maxSyncSeq": 0}
        for runtime in ("docker", "native"):
            with self.subTest(runtime=runtime):
                manifest = {"runtime": runtime, "project": "owned-project"}
                with patch.object(fixture, "compose", return_value=json.dumps(counts)) as docker_query, patch.object(native, "storage", return_value=counts) as native_query:
                    actual = fixture.storage_proof(manifest, proof_path)
                self.assertEqual(actual, {**counts, **proof, "project": "owned-project"})
                query = native_query.call_args.args[1] if runtime == "native" else docker_query.call_args.args[-1]
                self.assertTrue(query.startswith("BEGIN READ ONLY;"))
                self.assertIn("WHERE community_id = '" + proof["teamId"] + "'", query)
                self.assertEqual(docker_query.call_count, int(runtime == "docker"))
                self.assertEqual(native_query.call_count, int(runtime == "native"))

    def test_native_stop_only_signals_recorded_process(self):
        import native
        target = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"], start_new_session=True)
        other = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"], start_new_session=True)
        self.addCleanup(lambda: other.poll() is None and other.kill())
        self.addCleanup(lambda: target.poll() is None and target.kill())
        identity = native.process_identity(target.pid)
        self.assertEqual(identity, json.loads(json.dumps(identity)))
        # Same executable/owner and potentially the same ps lstart second must
        # not let one freshly launched child stand in for another.
        with self.assertRaisesRegex(RuntimeError, "reused or unowned"):
            native.stop_process({"pid": other.pid, "identity": identity})
        self.assertIsNone(other.poll())
        wrong_birth = {**identity, "start": [*identity["start"]]}
        wrong_birth["start"][-1] += 1
        with self.assertRaisesRegex(RuntimeError, "reused or unowned"):
            native.stop_process({"pid": target.pid, "identity": wrong_birth})
        with self.assertRaisesRegex(RuntimeError, "reused or unowned"):
            native.stop_process({"pid": target.pid, "identity": "wrong process"})
        self.assertIsNone(target.poll())
        native.stop_process({"pid": target.pid, "identity": identity})
        target.wait(timeout=5)
        self.assertIsNone(other.poll())
        other.terminate()
        other.wait(timeout=5)

    @unittest.skipUnless(shutil.which("redis-server"), "Redis binary unavailable")
    def test_native_identity_survives_real_redis_process_title_change(self):
        import native
        socket_path = self.root / "redis.sock"
        process = subprocess.Popen([
            shutil.which("redis-server"), "--port", "0", "--unixsocket", str(socket_path),
            "--unixsocketperm", "700", "--save", "", "--appendonly", "no", "--dir", str(self.root),
        ], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        def cleanup():
            if process.poll() is None:
                process.kill()
            process.wait(timeout=5)
        self.addCleanup(cleanup)
        deadline = time.monotonic() + 10
        with socket.socket(socket.AF_UNIX) as connection:
            connection.settimeout(2)
            while True:
                self.assertIsNone(process.poll(), "Owned Redis exited during startup")
                try:
                    connection.connect(str(socket_path))
                    break
                except (FileNotFoundError, ConnectionRefusedError):
                    if time.monotonic() >= deadline:
                        self.fail("Owned Redis Unix socket did not start")
                    time.sleep(0.05)
            identity = native.process_identity(process.pid)
            title = b"quiet-fixture-identity-regression"
            parts = [b"CONFIG", b"SET", b"proc-title-template", title]
            request = b"*4\r\n" + b"".join(b"$" + str(len(p)).encode() + b"\r\n" + p + b"\r\n" for p in parts)
            connection.sendall(request)
            self.assertEqual(connection.recv(1024), b"+OK\r\n")
            command = subprocess.check_output(["ps", "-p", str(process.pid), "-o", "command="])
            self.assertIn(title, command)
            self.assertEqual(native.process_identity(process.pid), identity)
        native.stop_process({"pid": process.pid, "identity": identity})
        process.wait(timeout=5)
        self.assertIsNone(native.process_identity(process.pid))

    def native_binaries(self, complete=True):
        binaries = self.root / "bin"
        binaries.mkdir()
        sharedir = self.root / "postgres-share"
        if complete:
            sharedir.mkdir()
            (sharedir / "postgres.bki").write_text("fixture installation")
        for name in ("node", "corepack", "redis-server", "initdb", "pg_ctl", "psql", "createdb", "pg_config"):
            binary = binaries / name
            reply = "v22.14.0" if name == "node" else str(sharedir)
            binary.write_text("#!/bin/sh\nprintf '%s\\n' " + shlex.quote(reply) + "\n")
            binary.chmod(0o700)
        return binaries

    def test_native_prepare_rejects_incomplete_postgres_before_build(self):
        import native
        binaries = self.native_binaries(complete=False)
        with self.assertRaisesRegex(ValueError, "Postgres installation is incomplete"):
            native.prepare({"output": str(self.output)}, binaries / "node", binaries / "corepack", binaries, binaries / "redis-server")
        self.assertFalse(self.output.exists())

    def test_native_prepare_isolates_client_credentials_from_host_defaults(self):
        import native
        manifest = self.prepare()
        binaries = self.native_binaries()
        ambient_credentials = self.root / "ambient-aws-credentials"
        ambient_config = self.root / "ambient-aws-config"
        ambient_credentials.write_text("[default]\naws_access_key_id = PUBLIC_TEST_ONLY\naws_secret_access_key = PUBLIC_TEST_ONLY\n")
        ambient_config.write_text("[default]\nregion = us-east-1\n")
        original_home = native.os.environ.get("HOME")
        with patch.dict(native.os.environ, {
            "PGPASSWORD": "ambient", "PGSERVICE": "ambient", "AWS_PROFILE": "ambient",
            "AWS_SHARED_CREDENTIALS_FILE": str(ambient_credentials), "AWS_CONFIG_FILE": str(ambient_config),
        }):
            native.prepare(manifest, binaries / "node", binaries / "corepack", binaries, binaries / "redis-server")
        environment = manifest["native"]["environment"]
        self.assertEqual(environment["QSS_HOSTNAME"], urlsplit(manifest["endpoint"]).hostname)
        self.assertEqual(environment["PGPASSWORD"], "postgres")
        self.assertNotIn("PGSERVICE", environment)
        self.assertNotIn("AWS_PROFILE", environment)
        self.assertNotIn("HOME", environment)
        self.assertEqual(native.os.environ.get("HOME"), original_home)
        self.assertIn("PUBLIC_TEST_ONLY", ambient_credentials.read_text())
        self.assertNotEqual(environment["AWS_SHARED_CREDENTIALS_FILE"], str(ambient_credentials))
        self.assertNotEqual(environment["AWS_CONFIG_FILE"], str(ambient_config))
        self.assertEqual(environment["PGSSLMODE"], "disable")
        self.assertEqual(environment["PGGSSENCMODE"], "disable")
        for key in ("PGPASSFILE", "PGSERVICEFILE", "NPM_CONFIG_USERCONFIG", "NPM_CONFIG_GLOBALCONFIG", "AWS_SHARED_CREDENTIALS_FILE", "AWS_CONFIG_FILE"):
            filename = Path(environment[key])
            self.assertEqual(filename.parent, self.output)
            self.assertEqual(filename.read_text(), "")
            self.assertEqual(filename.stat().st_mode & 0o777, 0o600)

    def test_prepare_run_requires_matching_success_and_live_health(self):
        manifest = self.prepare()
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"status":"ok","details":{"postgres":{"status":"up"}}}')

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", self.port), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        run_output = self.root / "test-run"
        result = {"status": "passed", "manifest": manifest, "probe": {
            "testSiteKey": True, "missingTokenRejected": True, "publicTestTokenVerified": True,
        }}
        fixture.private_json(self.output / "result.json", result)
        created = fixture.prepare_run(manifest, run_output)
        handoff = json.loads((run_output / "fixture.json").read_text())
        self.assertEqual(handoff["runId"], created["runId"])
        self.assertEqual(handoff["manifest"], manifest)
        self.assertEqual((run_output / "fixture.json").stat().st_mode & 0o777, 0o600)
        self.assertEqual(run_output.stat().st_mode & 0o777, 0o700)
        self.assertEqual(list((run_output / "requests").iterdir()), [])
        with self.assertRaisesRegex(ValueError, "new task-owned"):
            fixture.prepare_run(manifest, run_output)
        result["manifest"] = {**manifest, "project": "another-project"}
        fixture.private_json(self.output / "result.json", result)
        with self.assertRaisesRegex(ValueError, "exact fixture"):
            fixture.prepare_run(manifest, self.root / "wrong-result")
        self.assertFalse((self.root / "wrong-result").exists())

    def test_native_command_timeout_is_bounded_and_leaves_other_process(self):
        import native
        (self.output / "context/app").mkdir(parents=True)
        manifest = {"output": str(self.output), "native": {"environment": {"PATH": "/usr/bin:/bin"}}}
        other = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"], start_new_session=True)
        self.addCleanup(lambda: other.poll() is None and other.kill())
        with self.assertRaises(subprocess.TimeoutExpired):
            native.run(manifest, [sys.executable, "-c", "import time; time.sleep(60)"], timeout=0.1)
        self.assertIsNone(other.poll())
        other.terminate()
        other.wait(timeout=5)


if __name__ == "__main__":
    unittest.main()
