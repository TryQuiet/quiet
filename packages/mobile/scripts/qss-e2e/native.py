"""Native QSS/Postgres/Redis startup for macOS runners; no service manager."""
import ctypes
import errno
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import signal
import socket
import subprocess
import sys
import time

from fixture import compose_config, health, private_json


def executable(value, name):
    resolved = str(value) if value else shutil.which(name)
    if not resolved or not Path(resolved).is_file() or not os.access(resolved, os.X_OK):
        raise ValueError(f"Native fixture requires {name}; pass its explicit tool path")
    return str(Path(resolved).resolve())


def prepare(manifest, node=None, corepack=None, postgres_bin=None, redis_server=None):
    output = Path(manifest["output"])
    node = executable(node, "node")
    corepack = executable(corepack, "corepack")
    redis_server = executable(redis_server, "redis-server")
    initdb = executable(Path(postgres_bin) / "initdb" if postgres_bin else None, "initdb")
    postgres_bin = Path(initdb).parent
    for name in ("pg_ctl", "psql", "createdb", "pg_config"):
        executable(postgres_bin / name, name)
    sharedir = Path(subprocess.check_output([str(postgres_bin / "pg_config"), "--sharedir"]).decode().strip())
    if not (sharedir / "postgres.bki").is_file():
        raise ValueError("Postgres installation is incomplete; finish its installer/postinstall before building QSS")
    version = subprocess.check_output([node, "--version"]).decode().strip()
    if version != "v22.14.0":
        raise ValueError(f"QSS fixture requires its pinned Node v22.14.0; found {version}")
    sockets = [socket.socket(), socket.socket()]
    try:
        for listener in sockets:
            listener.bind(("127.0.0.1", 0))
        postgres_port, redis_port = [listener.getsockname()[1] for listener in sockets]
    finally:
        for listener in sockets:
            listener.close()
    for name in ("bin", "tmp", "redis", "pg-socket", "config"):
        (output / name).mkdir(mode=0o700)
    for name in ("empty.npmrc", "empty-global.npmrc", "empty.pgpass", "empty.pg_service.conf", "empty.aws-credentials", "empty.aws-config"):
        (output / name).write_text("")
        (output / name).chmod(0o600)
    # A private shim makes pnpm available to package scripts without changing
    # the user's Node installation or activating a global package manager.
    shim = output / "bin/pnpm"
    shim.write_text("#!/bin/sh\nexec " + shlex.join([node, corepack, "pnpm"]) + ' "$@"\n')
    shim.chmod(0o700)
    environment = compose_config(manifest["project"], manifest["port"])["services"]["qss"]["environment"]
    environment.update({
        "PORT": str(manifest["port"]), "LISTEN_HOSTNAME": "127.0.0.1",
        "MIKRO_ORM_HOST": "127.0.0.1", "MIKRO_ORM_PORT": str(postgres_port),
        "REDIS_ENDPOINT": "127.0.0.1", "REDIS_PORT": str(redis_port),
        "LOG_DIR": str(output / "qss-logs"),
        "QSS_FIXTURE_ENDPOINT": f"http://127.0.0.1:{manifest['port']}",
        "PATH": os.pathsep.join([str(output / "bin"), str(Path(node).parent), os.environ.get("PATH", "/usr/bin:/bin")]),
        "TMPDIR": str(output / "tmp"), "COREPACK_HOME": str(output / "corepack"),
        # macOS Postgres can start locale helper threads unless LC_ALL is set.
        # Match the deterministic locale supplied to initdb below.
        "LC_ALL": "C", "LANG": "C",
        "COREPACK_ENABLE_DOWNLOAD_PROMPT": "0", "CI": "true",
        "NPM_CONFIG_USERCONFIG": str(output / "empty.npmrc"),
        "NPM_CONFIG_GLOBALCONFIG": str(output / "empty-global.npmrc"),
        # libpq otherwise looks up ~/.pgpass before the local trust handshake.
        # Local fixture clients also need no client certificates or GSS credentials.
        "PGPASSWORD": "postgres", "PGPASSFILE": str(output / "empty.pgpass"),
        "PGSERVICEFILE": str(output / "empty.pg_service.conf"),
        "PGSSLMODE": "disable", "PGGSSENCMODE": "disable",
        # Omitting AWS_PROFILE alone still allows the SDK's default ~/.aws files.
        # Explicit empty files isolate that provider without changing HOME.
        "AWS_SHARED_CREDENTIALS_FILE": str(output / "empty.aws-credentials"),
        "AWS_CONFIG_FILE": str(output / "empty.aws-config"),
        "npm_config_cache": str(output / "npm-cache"),
        "XDG_CONFIG_HOME": str(output / "config"),
    })
    manifest["runtime"] = "native"
    manifest["native"] = {
        "node": node, "corepack": corepack, "postgresBin": str(postgres_bin),
        "redisServer": redis_server, "postgresPort": postgres_port,
        "redisPort": redis_port, "environment": environment,
        "versions": {
            "node": version,
            "postgres": subprocess.check_output([str(postgres_bin / "psql"), "--version"]).decode().strip(),
            "redis": subprocess.check_output([redis_server, "--version"]).decode().strip(),
        },
    }
    private_json(output / "manifest.json", manifest)
    private_json(output / "native-processes.json", {})


def run(manifest, command, timeout=1800, capture=False):
    output = Path(manifest["output"])
    kwargs = {
        "cwd": output / "context/app", "env": manifest["native"]["environment"],
        "start_new_session": True, "stdin": subprocess.DEVNULL,
    }
    with (output / "private.log").open("ab") as log:
        os.chmod(log.name, 0o600)
        process = subprocess.Popen(command, stdout=subprocess.PIPE if capture else log, stderr=log, **kwargs)
        try:
            stdout, _ = process.communicate(timeout=timeout)
            if process.returncode:
                raise subprocess.CalledProcessError(process.returncode, command)
        except BaseException:
            try:
                os.killpg(process.pid, signal.SIGTERM)
                process.communicate(timeout=10)
            except ProcessLookupError:
                pass
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.communicate()
            raise
    return stdout.decode() if capture else None


class _ProcBsdInfo(ctypes.Structure):
    # Public Darwin sys/proc_info.h ABI (PROC_PIDTBSDINFO). Names/titles are
    # deliberately not part of identity: Redis rewrites its process title.
    _fields_ = (
        [(name, ctypes.c_uint32) for name in (
            "flags", "status", "xstatus", "pid", "ppid", "uid", "gid",
            "ruid", "rgid", "svuid", "svgid", "reserved",
        )]
        + [("comm", ctypes.c_char * 16), ("name", ctypes.c_char * 32)]
        + [(name, ctypes.c_uint32) for name in ("nfiles", "pgid", "pjobc", "tdev", "tpgid")]
        + [("nice", ctypes.c_int32), ("start_seconds", ctypes.c_uint64), ("start_microseconds", ctypes.c_uint64)]
    )


def process_identity(pid):
    if not isinstance(pid, int) or isinstance(pid, bool) or pid <= 0:
        raise ValueError("Fixture process identity requires a positive PID")
    if sys.platform == "darwin":
        libproc = ctypes.CDLL("/usr/lib/libproc.dylib", use_errno=True)
        query = libproc.proc_pidinfo
        query.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_uint64, ctypes.c_void_p, ctypes.c_int]
        query.restype = ctypes.c_int
        info = _ProcBsdInfo()
        ctypes.set_errno(0)
        size = query(pid, 3, 0, ctypes.byref(info), ctypes.sizeof(info))
        if size == 0 and ctypes.get_errno() == errno.ESRCH:
            return None
        if size != ctypes.sizeof(info) or info.pid != pid:
            raise RuntimeError("Unable to verify fixture process identity")
        return {"pid": pid, "uid": info.uid, "start": [info.start_seconds, info.start_microseconds]}
    if sys.platform == "linux":
        try:
            directory = Path("/proc") / str(pid)
            # comm is parenthesized and may itself contain spaces or ')'.
            fields = (directory / "stat").read_text().rsplit(")", 1)[1].split()
            return {"pid": pid, "uid": directory.stat().st_uid, "start": [int(fields[19])]}
        except FileNotFoundError:
            return None
    raise RuntimeError("Native fixture process identity requires macOS or Linux")


def record_process(manifest, name, pid):
    path = Path(manifest["output"]) / "native-processes.json"
    state = json.loads(path.read_text())
    identity = process_identity(pid)
    if not identity:
        raise RuntimeError(f"Fixture {name} exited during startup")
    state[name] = {"pid": pid, "identity": identity}
    private_json(path, state)


def spawn(manifest, name, command):
    output = Path(manifest["output"])
    environment = manifest["native"]["environment"]
    if name == "qss":
        environment = qss_environment(manifest)
    with (output / "private.log").open("ab") as log:
        process = subprocess.Popen(command, cwd=output / "context/app", env=environment, stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
    record_process(manifest, name, process.pid)
    return process


def qss_environment(manifest):
    """Only the QSS server receives provider secrets, never build tools/receipts."""
    environment = dict(manifest["native"]["environment"])
    if not manifest.get("pushNotifications"):
        return environment
    filename = Path(manifest["output"]) / "compose.json"
    if filename.is_symlink() or filename.stat().st_mode & 0o077:
        raise ValueError("Provider runtime configuration must remain private")
    data = filename.read_bytes()
    if hashlib.sha256(data).hexdigest() != manifest["composeSha256"]:
        raise ValueError("Provider runtime configuration changed")
    configured = json.loads(data)["services"]["qss"]["environment"]
    if configured.get("QPS_ENABLED") != "true":
        raise ValueError("Provider fixture requires QPS_ENABLED=true")
    for platform in manifest["pushPlatforms"]:
        for field in ("PROJECT_ID", "CLIENT_EMAIL", "PRIVATE_KEY"):
            key = f"FIREBASE_{platform.upper()}_{field}"
            environment[key] = configured[key]
    environment["QPS_ENABLED"] = "true"
    return environment


def start(manifest):
    output = Path(manifest["output"])
    native = manifest["native"]
    node, corepack = native["node"], native["corepack"]
    context = output / "context"
    pg = Path(native["postgresBin"])
    run(manifest, [node, corepack, "pnpm", "--dir", str(context), "install", "--frozen-lockfile", "--shamefully-hoist", "--ignore-scripts", "--store-dir", str(output / "pnpm-store")])
    run(manifest, [node, corepack, "pnpm", "--dir", str(context), "--stream", "-r", "build"])
    run(manifest, [str(pg / "initdb"), "-D", str(output / "postgres"), "-U", "postgres", "--auth-local=trust", "--auth-host=trust", "--encoding=UTF8", "--locale=C", "--no-instructions"], timeout=60)
    pg_options = shlex.join(["-h", "127.0.0.1", "-p", str(native["postgresPort"]), "-k", str(output / "pg-socket")])
    run(manifest, [str(pg / "pg_ctl"), "-D", str(output / "postgres"), "-l", str(output / "postgres.log"), "-o", pg_options, "-w", "-t", "30", "start"], timeout=45)
    record_process(manifest, "postgres", int((output / "postgres/postmaster.pid").read_text().splitlines()[0]))
    run(manifest, [str(pg / "createdb"), "-h", "127.0.0.1", "-p", str(native["postgresPort"]), "-U", "postgres", "qss"], timeout=15)
    redis = spawn(manifest, "redis", [native["redisServer"], "--bind", "127.0.0.1", "--port", str(native["redisPort"]), "--dir", str(output / "redis"), "--appendonly", "yes", "--daemonize", "no"])
    deadline = time.monotonic() + 15
    while True:
        if redis.poll() is not None:
            raise RuntimeError("Fixture Redis exited during startup")
        try:
            with socket.create_connection(("127.0.0.1", native["redisPort"]), timeout=1):
                break
        except OSError:
            if time.monotonic() > deadline:
                raise TimeoutError("Fixture Redis did not start")
            time.sleep(0.1)
    run(manifest, [str(context / "app/node_modules/.bin/mikro-orm-esm"), "migration:up", "--config", "src/nest/storage/postgres/mikro-orm.postgres.config.ts"], timeout=120)
    qss = spawn(manifest, "qss", [node, str(context / "app/dist/src/main.js")])
    healthy = health(manifest["port"])
    probe = json.loads(run(manifest, [node, "fixture-probe.mjs"], timeout=45, capture=True))
    if qss.poll() is not None:
        raise RuntimeError("Owned QSS process exited; refusing another service's health response")
    return {"status": "passed", "health": healthy, "probe": probe, "manifest": manifest}


def stop_process(record, timeout=15):
    pid = record["pid"]
    identity = process_identity(pid)
    if identity is None:
        return
    if identity != record["identity"]:
        raise RuntimeError(f"Refusing to signal reused or unowned PID {pid}")
    os.kill(pid, signal.SIGTERM)
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        current = process_identity(pid)
        if current is None:
            return
        if current != identity:
            return
        # Reap children when cleanup runs in the same process as startup.
        try:
            ended, _ = os.waitpid(pid, os.WNOHANG)
            if ended == pid:
                return
        except ChildProcessError:
            pass
        time.sleep(0.1)
    if process_identity(pid) == identity:
        os.kill(pid, signal.SIGKILL)


def stop(manifest):
    output = Path(manifest["output"])
    state_path = output / "native-processes.json"
    if not state_path.exists():
        return
    state = json.loads(state_path.read_text())
    failures = []
    for name in ("qss", "redis", "postgres"):
        record = state.get(name)
        if not record:
            continue
        try:
            if name == "postgres" and process_identity(record["pid"]) == record["identity"]:
                run(manifest, [str(Path(manifest["native"]["postgresBin"]) / "pg_ctl"), "-D", str(output / "postgres"), "-m", "fast", "-w", "-t", "30", "stop"], timeout=45)
            else:
                stop_process(record)
        except Exception as error:
            failures.append(str(error))
    if failures:
        raise RuntimeError("; ".join(failures))


def storage(manifest, query):
    native = manifest["native"]
    command = [str(Path(native["postgresBin"]) / "psql"), "-XqAt", "-v", "ON_ERROR_STOP=1", "-h", "127.0.0.1", "-p", str(native["postgresPort"]), "-U", "postgres", "-d", "qss", "-c", query]
    return json.loads(run(manifest, command, timeout=15, capture=True))
