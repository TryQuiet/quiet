#!/usr/bin/env python3
"""Build an isolated QSS fixture from the checkout's exact gitlinks.

`up` creates services; `prepare-run` creates a private test handoff.
`stop` retains owned service data. Existing host credentials and app data are unused.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import tarfile
import time
import urllib.request
import uuid

HERE = Path(__file__).resolve().parent
LFA_PACKAGES = ("auth", "auth-provider-automerge-repo", "crdx", "crypto", "shared")
POSTGRES = "postgres@sha256:78481659c47e862334611ccdaf7c369c986b3046da9857112f3b309114a65fb4"
REDIS = "redis/redis-stack@sha256:5d5154123426693540ea6c1d9e638eae2bf2024879c839db6fcfdd7717e817c7"


def git(checkout, *args):
    return subprocess.check_output(["git", "-C", str(checkout), *args]).decode().strip()


def checked_submodule(parent, relative):
    tree = git(parent, "ls-tree", "HEAD", relative).split()
    if len(tree) != 4 or tree[0:2] != ["160000", "commit"]:
        raise ValueError(f"Not a pinned submodule: {relative}")
    source = parent / relative
    if git(source, "rev-parse", "HEAD") != tree[2]:
        raise ValueError(f"Initialize exactly the pinned submodule: {source}")
    if git(source, "status", "--porcelain", "--untracked-files=no"):
        raise ValueError(f"Refusing modified source: {source}")
    return source, tree[2]


def archive(source, destination):
    data = subprocess.check_output(["git", "-C", str(source), "archive", "HEAD"])
    with tarfile.open(fileobj=io.BytesIO(data)) as entries:
        entries.extractall(destination, filter="data")


def compose_config(project, port):
    environment = {
        "ENV": "local", "PORT": "3003", "QSS_HOSTNAME": "localhost",
        "LISTEN_HOSTNAME": "0.0.0.0", "POSTGRES_SOURCE": "local",
        "MIKRO_ORM_HOST": "postgres", "MIKRO_ORM_PORT": "5432",
        "MIKRO_ORM_USER": "postgres", "MIKRO_ORM_PASSWORD": "postgres",
        "MIKRO_ORM_DB_NAME": "qss", "MIKRO_ORM_PREFER_TS": "false",
        "REDIS_ENABLED": "true", "REDIS_ENDPOINT": "redis", "REDIS_PORT": "6379",
        "HCAPTCHA_SITE_KEY": "10000000-ffff-ffff-ffff-000000000001",
        "HCAPTCHA_SECRET_KEY": "0x0000000000000000000000000000000000000000",
        "QPS_ENABLED": "false", "NSE_JWT_SECRET": "local-e2e-fixture-only",
        "AWS_EC2_METADATA_DISABLED": "true", "CLOUDWATCH_LOGS_ENABLED": "false",
        "LOG_LEVEL": "info", "USE_WINSTON_LOGGER": "true", "LOG_DIR": "/tmp/qss-logs",
        "LOG_SANITIZATION_ENABLED": "true", "LOG_BINARY_SUMMARY_ENABLED": "true",
        "LOCALFIRST_DEBUG_LOGGING_ENABLED": "false",
    }
    return {
        "name": project,
        "services": {
            "postgres": {
                "image": POSTGRES,
                "environment": {"POSTGRES_USER": "postgres", "POSTGRES_PASSWORD": "postgres", "POSTGRES_DB": "qss"},
                "volumes": ["postgres-data:/var/lib/postgresql"],
                "healthcheck": {"test": ["CMD-SHELL", "pg_isready -U postgres -d qss"], "interval": "2s", "timeout": "3s", "retries": 30},
            },
            "redis": {
                # QSS connects across the private Compose network. Redis has no
                # published ports; access stays on the private Compose network.
                "image": REDIS, "entrypoint": ["redis-server"], "command": ["--appendonly", "yes", "--protected-mode", "no"],
                "volumes": ["redis-data:/data"],
                "healthcheck": {"test": ["CMD", "redis-cli", "ping"], "interval": "2s", "timeout": "3s", "retries": 30},
            },
            "qss": {
                "image": f"{project}:fixture", "build": {"context": "./context"},
                "environment": environment,
                "ports": [{"target": 3003, "published": str(port), "host_ip": "127.0.0.1", "protocol": "tcp"}],
                "depends_on": {name: {"condition": "service_healthy"} for name in ("postgres", "redis")},
            },
        },
        "volumes": {"postgres-data": {}, "redis-data": {}},
    }


def private_json(path, value):
    with path.open("w", encoding="utf-8") as stream:
        json.dump(value, stream, indent=2)
        stream.write("\n")
    path.chmod(0o600)


def push_environment(credentials_path):
    """Read explicitly supplied Firebase service accounts; never host defaults."""
    if credentials_path is None:
        return {}, []
    metadata = credentials_path.lstat()
    if credentials_path.is_symlink() or not credentials_path.is_file() or metadata.st_mode & 0o077:
        raise ValueError("Push credentials must be a private regular file (mode 0600)")
    accounts = json.loads(credentials_path.read_text())
    if not isinstance(accounts, dict) or not accounts or set(accounts) - {"android", "ios"}:
        raise ValueError("Push credentials require android and/or ios service-account objects")
    environment = {"QPS_ENABLED": "true"}
    for platform, account in accounts.items():
        if not isinstance(account, dict) or account.get("type") != "service_account":
            raise ValueError("Expected Firebase service-account JSON for each selected platform")
        for source, field in (("project_id", "PROJECT_ID"), ("client_email", "CLIENT_EMAIL"), ("private_key", "PRIVATE_KEY")):
            value = account.get(source)
            if not isinstance(value, str) or not value.strip() or "\x00" in value or "$" in value:
                raise ValueError(f"Missing Firebase {source} for {platform}")
            # Firebase project IDs, service-account addresses, and PEM keys do
            # not contain dollars. Reject them instead of Compose interpolation.
            environment[f"FIREBASE_{platform.upper()}_{field}"] = value
    return environment, sorted(accounts)


def prepare(checkout, output, port, sudo_docker, push_credentials=None):
    if output.exists() or output.is_symlink():
        raise ValueError("Output must be a new task-owned directory")
    if not 1024 <= port <= 65535:
        raise ValueError("Port must be between 1024 and 65535")
    push_env, push_platforms = push_environment(push_credentials)
    qss, qss_sha = checked_submodule(checkout, "3rd-party/qss")
    auth, auth_sha = checked_submodule(qss, "3rd-party/auth")
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", port))
    output.mkdir(parents=True, mode=0o700)
    project = f"quiet-qss-e2e-{uuid.uuid4().hex[:12]}"
    context = output / "context"
    archive(qss, context)
    auth_copy = context / "3rd-party/auth"
    archive(auth, auth_copy)
    packages = context / "auth-packages/lfa"
    packages.mkdir(parents=True)
    for package in LFA_PACKAGES:
        shutil.copytree(auth_copy / "packages" / package, packages / package)
    shutil.copyfile(auth_copy / "tsconfig.json", context / "auth-packages/tsconfig.json")
    # Runtime receives only the explicit local fixture environment below.
    for env_file in context.rglob(".env*"):
        if env_file.is_file():
            env_file.unlink()
    shutil.copyfile(HERE / "Dockerfile", context / "Dockerfile")
    # Upstream excludes auth-packages because its Dockerfile bootstraps them.
    # This context already contains the exact pinned copies; never fetch --remote.
    (context / ".dockerignore").write_text(".git\nnode_modules\n3rd-party\n")
    shutil.copyfile(HERE / "probe.mjs", context / "app/fixture-probe.mjs")
    config = compose_config(project, port)
    config["services"]["qss"]["environment"].update(push_env)
    compose_path = output / "compose.json"
    private_json(compose_path, config)
    manifest = {
        "version": 1, "runtime": "docker", "output": str(output), "project": project, "port": port,
        "sudoDocker": sudo_docker, "qssCommit": qss_sha, "qssAuthCommit": auth_sha,
        "composeSha256": hashlib.sha256(compose_path.read_bytes()).hexdigest(),
        "endpoint": f"ws://localhost:{port}", "productionQss": False, "pushNotifications": bool(push_platforms),
        "pushPlatforms": push_platforms,
    }
    private_json(output / "manifest.json", manifest)
    return manifest


def load_manifest(output):
    manifest = json.loads((output / "manifest.json").read_text())
    if manifest.get("output") != str(output) or not re.fullmatch(r"quiet-qss-e2e-[a-f0-9]{12}", manifest.get("project", "")):
        raise ValueError("Not an owned QSS fixture manifest")
    digest = hashlib.sha256((output / "compose.json").read_bytes()).hexdigest()
    if digest != manifest["composeSha256"]:
        raise ValueError("Fixture compose configuration changed")
    return manifest


def compose(manifest, *args, timeout=1800, capture=False):
    output = Path(manifest["output"])
    command = (["sudo", "-n"] if manifest["sudoDocker"] else []) + [
        "docker", "compose", "-p", manifest["project"], "-f", str(output / "compose.json"), *args,
    ]
    if capture:
        return subprocess.check_output(command, timeout=timeout).decode()
    with (output / "private.log").open("ab") as log:
        os.chmod(log.name, 0o600)
        subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, check=True, timeout=timeout)


def health(port, timeout=120):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=3) as response:
                result = json.load(response)
            if result.get("status") == "ok" and result.get("details", {}).get("postgres", {}).get("status") == "up":
                return result
        except (OSError, ValueError):
            pass
        time.sleep(1)
    raise TimeoutError("QSS did not report a healthy Postgres connection")


def storage_proof(manifest, proof_path):
    proof = json.loads(proof_path.read_text())
    team_id = proof.get("teamId", "")
    run_id = proof.get("runId", "")
    if not isinstance(team_id, str) or not re.fullmatch(r"[1-9A-HJ-NP-Za-km-z]{16,128}", team_id):
        raise ValueError("UI proof must contain a base58 teamId")
    if not isinstance(run_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", run_id):
        raise ValueError("UI proof must contain a simple runId")
    # The strict base58 validation above excludes SQL syntax. Read only aggregate
    # metadata; never select the community sigchain or encrypted log payloads.
    query = (
        "BEGIN READ ONLY; SELECT json_build_object("
        f"'communityExists', EXISTS(SELECT 1 FROM communities WHERE id = '{team_id}'),"
        f"'logEntryCount', (SELECT count(*) FROM log_entry_sync WHERE community_id = '{team_id}'),"
        f"'maxSyncSeq', (SELECT coalesce(max(sync_seq), 0) FROM log_entry_sync WHERE community_id = '{team_id}')"
        "); COMMIT;"
    )
    if manifest.get("runtime") == "native":
        from native import storage
        result = storage(manifest, query)
    else:
        result = json.loads(compose(manifest, "exec", "-T", "postgres", "psql", "-XqAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "qss", "-c", query, timeout=15, capture=True))
    return {**result, "runId": run_id, "teamId": team_id, "project": manifest["project"]}


def prepare_run(manifest, run_output):
    if run_output.exists() or run_output.is_symlink():
        raise ValueError("Run output must be a new task-owned directory")
    result = json.loads((Path(manifest["output"]) / "result.json").read_text())
    if result.get("manifest") != manifest or result.get("status") != "passed":
        raise ValueError("Require the successful result for this exact fixture")
    probe = result.get("probe", {})
    if not all(probe.get(key) is True for key in ("testSiteKey", "missingTokenRejected", "publicTestTokenVerified")):
        raise ValueError("Fixture captcha protocol probe must pass before preparing a test run")
    health(manifest["port"], timeout=5)
    run_output.mkdir(parents=True, mode=0o700)
    run = {"version": 1, "runId": uuid.uuid4().hex, "manifest": manifest, "result": result}
    private_json(run_output / "fixture.json", run)
    for name in ("requests", "responses"):
        (run_output / name).mkdir(mode=0o700)
    return {"runId": run["runId"], "runOutput": str(run_output), "project": manifest["project"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("up", "status", "storage", "stop", "prepare-run"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--checkout", type=Path, default=HERE.parents[3])
    parser.add_argument("--port", type=int, default=3003)
    parser.add_argument("--sudo-docker", action="store_true")
    parser.add_argument("--push-credentials", type=Path, help="Private JSON mapping android/ios to test Firebase service accounts (Docker only)")
    parser.add_argument("--runtime", choices=("docker", "native"), default="docker")
    parser.add_argument("--node", type=Path, help="Native mode Node 22.14.0 executable")
    parser.add_argument("--corepack", type=Path, help="Native mode Corepack executable")
    parser.add_argument("--postgres-bin", type=Path, help="Native mode Postgres bin directory")
    parser.add_argument("--redis-server", type=Path, help="Native mode redis-server executable")
    parser.add_argument("--ui-proof", type=Path, help="Private JSON containing teamId and runId, for storage")
    parser.add_argument("--run-output", type=Path, help="New private test run directory, for prepare-run")
    args = parser.parse_args()
    os.umask(0o077)
    output = args.output.resolve()
    if args.action == "up":
        if args.push_credentials and args.runtime != "docker":
            parser.error("Provider fixtures currently require Docker; native fixtures disable push")
        manifest = prepare(args.checkout.resolve(), output, args.port, args.sudo_docker, args.push_credentials)
        if args.runtime == "native":
            import native
            native.prepare(manifest, args.node, args.corepack, args.postgres_bin, args.redis_server)
            print(f"Starting native pinned QSS fixture {manifest['project']}; private log: {output / 'private.log'}", flush=True)
            try:
                result = native.start(manifest)
                private_json(output / "result.json", result)
                print(json.dumps({"status": result["status"], "output": str(output), "project": manifest["project"], "health": result["health"], "probe": result["probe"]}), flush=True)
            except BaseException as error:
                try:
                    native.stop(manifest)
                except Exception as cleanup_error:
                    error.add_note(f"Native fixture cleanup also failed: {cleanup_error}")
                raise
            return
        print(f"Building pinned QSS fixture {manifest['project']}; private log: {output / 'private.log'}", flush=True)
        try:
            compose(manifest, "build", "qss")
            compose(manifest, "up", "-d", "--wait", "--wait-timeout", "90", "postgres", "redis")
            compose(manifest, "run", "--rm", "--no-deps", "qss", "./node_modules/.bin/mikro-orm-esm", "migration:up", "--config", "src/nest/storage/postgres/mikro-orm.postgres.config.ts")
            compose(manifest, "up", "-d", "--no-deps", "qss")
            healthy = health(args.port)
            probe = json.loads(compose(manifest, "exec", "-T", "qss", "node", "fixture-probe.mjs", timeout=45, capture=True))
            result = {"status": "passed", "health": healthy, "probe": probe, "manifest": manifest}
            private_json(output / "result.json", result)
            print(json.dumps(result), flush=True)
        except BaseException:
            for command in (("logs", "--no-color"), ("stop", "--timeout", "15")):
                try:
                    compose(manifest, *command, timeout=60)
                except Exception:
                    pass
            raise
    else:
        manifest = load_manifest(output)
        if args.action == "stop":
            if manifest.get("runtime") == "native":
                from native import stop
                stop(manifest)
            else:
                compose(manifest, "stop", "--timeout", "15", timeout=60)
            print("Owned fixture stopped; data and evidence retained.")
        elif args.action == "prepare-run":
            if args.run_output is None:
                parser.error("prepare-run requires --run-output")
            print(json.dumps(prepare_run(manifest, args.run_output.absolute())))
        elif args.action == "storage":
            if args.ui_proof is None:
                parser.error("storage requires --ui-proof")
            print(json.dumps(storage_proof(manifest, args.ui_proof)))
        else:
            print(json.dumps({"health": health(manifest["port"], timeout=5), "manifest": manifest}))


if __name__ == "__main__":
    main()
