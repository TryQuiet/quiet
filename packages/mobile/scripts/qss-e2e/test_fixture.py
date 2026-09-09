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
import unittest
from unittest.mock import patch

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
        with self.assertRaisesRegex(RuntimeError, "reused or unowned"):
            native.stop_process({"pid": target.pid, "identity": "wrong process"})
        self.assertIsNone(target.poll())
        native.stop_process({"pid": target.pid, "identity": identity})
        target.wait(timeout=5)
        self.assertIsNone(other.poll())
        other.terminate()
        other.wait(timeout=5)

    def test_native_prepare_rejects_incomplete_postgres_before_build(self):
        import native
        binaries = self.root / "bin"
        binaries.mkdir()
        for name in ("node", "corepack", "redis-server", "initdb", "pg_ctl", "psql", "createdb", "pg_config"):
            binary = binaries / name
            reply = "v22.14.0" if name == "node" else str(self.root / "missing-share")
            binary.write_text("#!/bin/sh\nprintf '%s\\n' " + shlex.quote(reply) + "\n")
            binary.chmod(0o700)
        with self.assertRaisesRegex(ValueError, "Postgres installation is incomplete"):
            native.prepare({"output": str(self.output)}, binaries / "node", binaries / "corepack", binaries, binaries / "redis-server")
        self.assertFalse(self.output.exists())

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
