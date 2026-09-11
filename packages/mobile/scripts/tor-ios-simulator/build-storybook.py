#!/usr/bin/env python3
"""Opt-in arm64 iOS Simulator build; restores the checkout's Tor pod.

Never run alongside another app build or pod install in this checkout.
An uncatchable kill can leave Tor.framework.quiet-original or a stale lock;
the next invocation refuses to proceed until the original is recovered.
"""
import argparse
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import plistlib
import shutil
import signal
import stat
import subprocess
import sys
import time
import uuid

TOR_VERSION = '405.9.1'
TOR_PODSPEC_URL = 'https://raw.githubusercontent.com/iCepa/Tor.framework/v405.9.1/Tor.podspec'
ORIGINAL_SHA256 = '6cc459716e6ff20c75b653f6534b98d5b5d1cb488a447d77d077f5a06ba57cc5'
MIN_FREE_BYTES = 2 * 1024**3
WORKSPACE_MARKER = '.quiet-ios-simulator-workspace.json'
BUILD_SELECTIONS = {
    ('Storybook', 'Debug', '.env.storybook'),
    ('Quiet', 'Debug', '.env.staging'),
    ('Quiet', 'Debug', '.env.e2e'),
    ('Quiet', 'Debug', '.env.e2e.qss'),
    ('Quiet', 'Debug', '.env.e2e.qss.push'),
    ('Quiet', 'Release', '.env.production'),
}
stop_signal = None


class BuildFailure(Exception):
    pass


def require(condition, message):
    if not condition:
        raise BuildFailure(message)


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def snapshot(root):
    result = {}
    for path in [root, *sorted(root.rglob('*'))]:
        metadata = path.lstat()
        kind = stat.S_IFMT(metadata.st_mode)
        value = str(path.readlink()) if path.is_symlink() else sha256(path) if path.is_file() else ''
        result[str(path.relative_to(root))] = [kind, stat.S_IMODE(metadata.st_mode), value]
    return result


def command(args, env, failure_message='Framework validation command failed'):
    result = subprocess.run(args, env=env, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                            text=True, timeout=30)
    require(result.returncode == 0, failure_message)
    return result.stdout.strip()


def request_stop(signum, _frame):
    global stop_signal
    stop_signal = signum


def check_stop():
    require(stop_signal is None, 'Interrupted; build stopped before restoring Tor')


def check_disk(*paths):
    require(all(shutil.disk_usage(path).free >= MIN_FREE_BYTES for path in paths),
            'Free disk below 2 GiB; build stopped before restoring Tor')


def stop_child(child):
    if child is None:
        return
    # xcodebuild and its directly spawned compilers use this task's process group.
    try:
        os.killpg(child.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        child.wait(timeout=20)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(child.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        child.wait()
    # A compiler may briefly outlive xcodebuild after cancellation.
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        try:
            os.killpg(child.pid, 0)
        except ProcessLookupError:
            return
        time.sleep(0.1)
    try:
        os.killpg(child.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass


def restore(target, backup, staged, original):
    if backup.exists():
        if target.exists():
            require(not staged.exists(), 'Unexpected staging directory; original backup retained')
            target.rename(staged)
        backup.rename(target)
    require(snapshot(target) == original, 'Original Tor tree was not restored exactly')
    if staged.exists():
        shutil.rmtree(staged)


def prepare_workspace(output, owner, inspect_cache=False):
    """Create a private build workspace or recognize this exact caller's workspace."""
    require(not output.is_symlink(), 'Output workspace must not be a symlink')
    if not output.exists():
        output.mkdir(mode=0o700)
        with (output / WORKSPACE_MARKER).open('x') as stream:
            json.dump(owner, stream, indent=2)
            stream.write('\n')
    require(output.is_dir(), 'Output workspace must be a directory')
    marker = output / WORKSPACE_MARKER
    require(marker.is_file() and not marker.is_symlink(), 'Existing output is not a builder-owned workspace')
    try:
        recorded = json.loads(marker.read_text())
    except (OSError, ValueError):
        raise BuildFailure('Invalid output workspace ownership marker') from None
    require(recorded == owner, 'Output workspace belongs to a different checkout or build selection')
    allowed = {WORKSPACE_MARKER, 'DerivedData', 'runs', 'result.json', '.build.lock'}
    require(all(path.name in allowed for path in output.iterdir()), 'Output workspace contains unknown entries')
    for name in ['DerivedData', 'runs', 'result.json', '.build.lock']:
        path = output / name
        require(not path.is_symlink(), 'Output workspace control paths must not be symlinks')
        if path.exists():
            require(path.is_dir() if name in ['DerivedData', 'runs'] else path.is_file(),
                    'Unexpected output workspace control path type')
    if inspect_cache:
        derived = output / 'DerivedData'
        for path in derived.rglob('*'):
            if path.is_symlink():
                require(path.resolve().is_relative_to(derived), 'DerivedData symlink escapes the owned workspace')


@contextmanager
def exclusive_workspace(output):
    lock = output / '.build.lock'
    try:
        descriptor = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        raise BuildFailure('Output workspace is locked; another build is active or needs recovery') from None
    os.close(descriptor)
    try:
        yield
    finally:
        lock.unlink()


def write_result(output, run, result):
    # Preserve every run and publish the latest status without following a replaced
    # result.json symlink or leaving a partially written status for readers.
    (run / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
    temporary = output / f'.result-{uuid.uuid4().hex}.tmp'
    try:
        with temporary.open('x') as stream:
            json.dump(result, stream, indent=2)
            stream.write('\n')
        temporary.replace(output / 'result.json')
    finally:
        if temporary.exists():
            temporary.unlink()


def build(args):
    require(sys.platform == 'darwin', 'This build wrapper requires macOS')
    selection = (args.scheme, args.configuration, args.env_file)
    require(selection in BUILD_SELECTIONS, 'Unsupported scheme/configuration/environment combination')
    checkout_arg = Path(args.checkout).expanduser().absolute()
    require(checkout_arg.is_dir() and not checkout_arg.is_symlink(), 'Checkout must be a real directory')
    checkout = checkout_arg.resolve()
    mobile = checkout / 'packages/mobile'
    env_file = mobile / args.env_file
    require(env_file.is_file() and not env_file.is_symlink(), 'Selected environment file must be a real file in packages/mobile')
    podfile = mobile / 'ios/Podfile'
    require(podfile.is_file() and (mobile / 'ios/Quiet.xcworkspace/contents.xcworkspacedata').is_file(),
            'Checkout must contain Quiet mobile Podfile and installed workspace')
    require(TOR_PODSPEC_URL in podfile.read_text(), 'Quiet Podfile must pin Tor podspec 405.9.1')
    target = mobile / 'ios/Pods/Tor/Build/iOS/Tor.framework'
    for parent in [target, *target.parents]:
        if parent == checkout.parent:
            break
        require(not parent.is_symlink(), 'Tor target and checkout parents must not be symlinks')
    require(target.is_dir(), 'Expected installed Tor framework is missing')
    require(sha256(target / 'Tor') == ORIGINAL_SHA256, 'Existing Tor binary does not match the approved baseline')
    spec = json.loads((mobile / 'ios/Pods/Local Podspecs/Tor.podspec.json').read_text())
    require(spec.get('version') == TOR_VERSION and spec.get('name') == 'Tor', 'Expected pinned Tor pod 405.9.1')

    source = Path(args.framework).expanduser().absolute()
    require(source.is_dir() and not source.is_symlink(), 'Source must be a real Tor.framework directory')
    source = source.resolve()
    require(source.name == 'Tor.framework' and not source.is_relative_to(target)
            and not target.is_relative_to(source), 'Use a separately built Tor.framework outside the installed framework')
    for path in source.rglob('*'):
        if path.is_symlink():
            require(path.resolve().is_relative_to(source), 'Source framework symlink escapes its bundle')
    info = plistlib.loads((source / 'Info.plist').read_bytes())
    require(info.get('CFBundleShortVersionString') == TOR_VERSION, 'Source framework must retain version 405.9.1')
    require(info.get('CFBundleExecutable') == 'Tor', 'Source framework executable must be Tor')
    require('iPhoneSimulator' in info.get('CFBundleSupportedPlatforms', []), 'Source plist must identify a simulator framework')

    # Keep inherited credentials and unrelated application configuration out of Xcode.
    env = {key: os.environ[key] for key in
           ['HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL', 'PATH', 'DEVELOPER_DIR']
           if key in os.environ}
    env.setdefault('PATH', os.defpath)
    env.update(ENVFILE=args.env_file, RCT_NO_LAUNCH_PACKAGER='1', FORCE_BUNDLING='1')
    require(shutil.which('node', path=env['PATH']) is not None, 'Select the supported host Node on PATH first')
    require(command(['xcrun', 'lipo', '-archs', str(source / 'Tor')], env) == 'arm64', 'Source must contain only arm64')
    platform = command(['xcrun', 'vtool', '-show-build', str(source / 'Tor')], env)
    require('platform IOSSIMULATOR' in platform, 'Source Mach-O must target IOSSIMULATOR')
    install_name = command(['xcrun', 'otool', '-D', str(source / 'Tor')], env).splitlines()[-1].strip()
    require(install_name == '@rpath/Tor.framework/Tor', 'Source framework has an unexpected install name')
    for dependency in command(['xcrun', 'otool', '-L', str(source / 'Tor')], env).splitlines()[1:]:
        name = dependency.strip().split(' (compatibility version')[0]
        require(name == install_name or name.startswith(('/usr/lib/', '/System/Library/')),
                'Source depends on a non-system external library')

    output_arg = Path(args.output).expanduser().absolute()
    require(not output_arg.is_symlink(), 'Output workspace must not be a symlink')
    output = output_arg.parent.resolve() / output_arg.name
    require(not output.is_relative_to(checkout) and not output.is_relative_to(source), 'Build output must be outside both inputs')
    owner = {'format': 'quiet-ios-simulator-workspace', 'version': 1, 'output': str(output),
             'checkout': str(checkout), 'scheme': args.scheme, 'configuration': args.configuration,
             'envFile': args.env_file, 'originalTorSHA256': ORIGINAL_SHA256,
             'simulatorTorSHA256': sha256(source / 'Tor')}
    check_disk(checkout, output.parent)
    check_stop()
    prepare_workspace(output, owner)
    with exclusive_workspace(output):
        prepare_workspace(output, owner, inspect_cache=True)
        return build_in_workspace(args, checkout, mobile, target, source, env, output)


def build_in_workspace(args, checkout, mobile, target, source, env, output):
    backup = target.with_name('Tor.framework.quiet-original')
    staged = target.with_name('Tor.framework.quiet-arm64-staged')
    lock = target.with_name('.quiet-arm64-tor-build.lock')
    require(not any(path.exists() or path.is_symlink() for path in [backup, staged, lock]),
            'Previous task backup, staging directory, or lock exists; recover it first')
    try:
        lock_fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        raise BuildFailure('Another build acquired the Tor pod lock; retry after it finishes') from None
    os.close(lock_fd)
    try:
        # Recheck after acquiring the pod lock: a different output workspace may
        # have completed a build since the initial framework inspection.
        require(sha256(target / 'Tor') == ORIGINAL_SHA256, 'Existing Tor binary changed before the pod lock was acquired')
        check_disk(checkout, output)
        check_stop()
        original = snapshot(target)
        source_snapshot = snapshot(source)
        (output / 'DerivedData').mkdir(exist_ok=True)
        (output / 'runs').mkdir(exist_ok=True)
        run = output / 'runs' / (time.strftime('%Y%m%dT%H%M%SZ', time.gmtime()) + '-' + uuid.uuid4().hex)
        run.mkdir(mode=0o700)
        log_path = run / 'xcodebuild.log'
        result = {'status': 'failed', 'originalRestored': False, 'output': str(output),
                  'run': str(run), 'log': str(log_path), 'xcresult': str(run / f'{args.scheme}.xcresult'),
                  'scheme': args.scheme, 'configuration': args.configuration, 'envFile': args.env_file,
                  'originalTorSHA256': ORIGINAL_SHA256,
                  'simulatorTorSHA256': sha256(source / 'Tor')}
        (run / 'original-tree.json').write_text(json.dumps(original, indent=2) + '\n')
        (run / 'source-tree.json').write_text(json.dumps(source_snapshot, indent=2) + '\n')
        write_result(output, run, {**result, 'status': 'running'})
    except Exception:
        lock.unlink()
        raise
    child = None
    try:
        shutil.copytree(source, staged, symlinks=True)
        require(snapshot(staged) == source_snapshot, 'Staged framework copy differs from source')
        check_stop()
        check_disk(checkout, output)
        target.rename(backup)
        staged.rename(target)
        derived = output / 'DerivedData'
        app = derived / f'Build/Products/{args.configuration}-iphonesimulator/Quiet.app'
        argv = ['xcodebuild', 'build', '-hideShellScriptEnvironment', '-workspace', 'ios/Quiet.xcworkspace',
                '-scheme', args.scheme, '-configuration', args.configuration, '-sdk', 'iphonesimulator',
                '-destination', 'generic/platform=iOS Simulator', '-derivedDataPath', str(derived),
                '-resultBundlePath', result['xcresult'],
                '-jobs', '2', 'ARCHS=arm64', 'ONLY_ACTIVE_ARCH=YES', 'CODE_SIGNING_ALLOWED=NO',
                'CODE_SIGNING_REQUIRED=NO', 'CODE_SIGN_IDENTITY=', 'ENABLE_BITCODE=NO',
                f'ENVFILE={args.env_file}',
                'COMPILER_INDEX_STORE_ENABLE=NO', 'GCC_GENERATE_DEBUGGING_SYMBOLS=NO', 'DEBUG_INFORMATION_FORMAT=']
        with log_path.open('w') as log:
            child = subprocess.Popen(argv, cwd=mobile, env=env, stdout=log, stderr=subprocess.STDOUT,
                                     start_new_session=True)
            while child.poll() is None:
                check_stop()
                check_disk(checkout, output)
                time.sleep(1)
        check_stop()
        result['exitCode'] = child.returncode
        require(child.returncode == 0, 'Simulator xcodebuild failed; see the task log')
        require((app / 'main.jsbundle').is_file(), 'Built app is missing its bundled JS payload')
        embedded = app / 'Frameworks/Tor.framework/Tor'
        require(sha256(embedded) == result['simulatorTorSHA256'], 'Built app did not embed the selected simulator Tor binary unchanged')
        # The linker's ad hoc executable signature has no app resource envelope.
        # Sign only the outer simulator app; never re-sign the embedded Tor binary.
        check_disk(checkout, output)
        command(['codesign', '--force', '--sign', '-',
                 '--preserve-metadata=entitlements,identifier,flags', str(app)], env,
                'Simulator app ad hoc signing failed')
        check_stop()
        command(['codesign', '--verify', '--strict', str(app)], env,
                'Simulator app strict signature verification failed')
        check_stop()
        require(sha256(embedded) == result['simulatorTorSHA256'], 'Simulator signing changed the embedded Tor binary')
        result.update(status='passed', app=str(app), appJSBundleSHA256=sha256(app / 'main.jsbundle'),
                      embeddedTorSHA256=sha256(embedded),
                      appSignature={'identity': 'ad-hoc', 'strictVerification': True})
    except Exception as error:
        result['error'] = str(error) if isinstance(error, BuildFailure) else type(error).__name__
    finally:
        stop_child(child)
        try:
            restore(target, backup, staged, original)
            result['originalRestored'] = True
            lock.unlink()
        except Exception as error:
            result.update(status='failed', error='Restore verification failed; retain backup and inspect task paths',
                          restoreError=type(error).__name__)
        if stop_signal is not None:
            result['signal'] = stop_signal
        write_result(output, run, result)
    print(json.dumps(result))
    return 0 if result['status'] == 'passed' and result['originalRestored'] else 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--checkout', required=True, help='Quiet repository root with installed iOS pods')
    parser.add_argument('--framework', required=True, help='Separately built arm64 simulator Tor.framework')
    parser.add_argument('--output', required=True, help='Builder-owned reusable workspace outside checkout and framework')
    parser.add_argument('--scheme', default='Storybook', choices=['Storybook', 'Quiet'])
    parser.add_argument('--configuration', default='Debug', choices=['Debug', 'Release'])
    parser.add_argument('--env-file', default='.env.storybook',
                        help='Supported environment file in packages/mobile; must match the scheme/configuration')
    args = parser.parse_args()
    for signum in [signal.SIGINT, signal.SIGTERM, signal.SIGHUP]:
        signal.signal(signum, request_stop)
    try:
        sys.exit(build(args))
    except Exception as error:
        print(json.dumps({'status': 'failed', 'stage': 'prepare',
                          'error': str(error) if isinstance(error, BuildFailure) else type(error).__name__}))
        sys.exit(1)
