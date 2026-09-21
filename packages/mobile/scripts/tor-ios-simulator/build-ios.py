#!/usr/bin/env python3
"""Build Quiet with its installed Tor XCFramework, retaining bounded build receipts."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import uuid

# Reuse the existing tested workspace ownership, cancellation and disk guards.
spec = importlib.util.spec_from_file_location('build_guards', Path(__file__).with_name('build-storybook.py'))
guards = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guards)
TOR_VERSION = '409.11.2'
TOR_PODSPEC_URL = f'https://raw.githubusercontent.com/iCepa/Tor.framework/v{TOR_VERSION}/Tor.podspec'


def build(args):
    guards.require(sys.platform == 'darwin', 'This build requires macOS')
    guards.require((args.scheme, args.configuration, args.env_file) in guards.BUILD_SELECTIONS,
                   'Unsupported scheme/configuration/environment combination')
    checkout = Path(args.checkout).expanduser().resolve(strict=True)
    mobile = checkout / 'packages/mobile'
    ios = mobile / 'ios'
    guards.require((mobile / args.env_file).is_file(), 'Selected environment file is missing')
    guards.require(TOR_PODSPEC_URL in (ios / 'Podfile').read_text(), 'Unexpected Tor pod pin')
    guards.require((ios / 'Podfile.lock').read_bytes() == (ios / 'Pods/Manifest.lock').read_bytes(),
                   'Installed pods differ from Podfile.lock; run pod install')
    podspec = json.loads((ios / 'Pods/Local Podspecs/Tor.podspec.json').read_text())
    guards.require(podspec.get('version') == TOR_VERSION, 'Installed Tor version differs from pin')
    framework = ios / 'Pods/Tor/tor.xcframework'
    guards.require(framework.is_dir(), 'Installed Tor XCFramework is missing')
    original = guards.snapshot(framework)

    output_arg = Path(args.output).expanduser().absolute()
    guards.require(not output_arg.is_symlink(), 'Output must not be a symlink')
    output = output_arg.parent.resolve(strict=True) / output_arg.name
    guards.require(not output.is_relative_to(checkout), 'Output must be outside the checkout')
    owner = {'format': 'quiet-ios-simulator-workspace', 'version': 1, 'output': str(output),
             'checkout': str(checkout), 'scheme': args.scheme, 'configuration': args.configuration,
             'envFile': args.env_file, 'torVersion': TOR_VERSION}
    env = {key: os.environ[key] for key in
           ['HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL', 'PATH', 'DEVELOPER_DIR']
           if key in os.environ}
    env.update(ENVFILE=args.env_file, FORCE_BUNDLING='1', RCT_NO_LAUNCH_PACKAGER='1')
    guards.check_disk(checkout, output.parent)
    guards.check_stop()
    guards.prepare_workspace(output, owner)
    with guards.exclusive_workspace(output):
        guards.prepare_workspace(output, owner, inspect_cache=True)
        (output / 'runs').mkdir(exist_ok=True)
        run = output / 'runs' / uuid.uuid4().hex
        run.mkdir(mode=0o700)
        derived = output / 'DerivedData'
        app = derived / f'Build/Products/{args.configuration}-iphonesimulator/Quiet.app'
        result = dict(status='running', output=str(output), run=str(run), log=str(run / 'xcodebuild.log'),
                      xcresult=str(run / 'Quiet.xcresult'), torVersion=TOR_VERSION,
                      scheme=args.scheme, configuration=args.configuration, envFile=args.env_file)
        guards.write_result(output, run, result)
        child = None
        try:
            argv = ['xcodebuild', 'build', '-hideShellScriptEnvironment', '-workspace', 'ios/Quiet.xcworkspace',
                    '-scheme', args.scheme, '-configuration', args.configuration, '-sdk', 'iphonesimulator',
                    '-destination', 'generic/platform=iOS Simulator', '-derivedDataPath', str(derived),
                    '-resultBundlePath', result['xcresult'], '-jobs', '2', 'ARCHS=arm64', 'ONLY_ACTIVE_ARCH=YES',
                    'CODE_SIGNING_ALLOWED=NO', 'CODE_SIGNING_REQUIRED=NO', 'CODE_SIGN_IDENTITY=',
                    'ENABLE_BITCODE=NO', f'ENVFILE={args.env_file}', 'COMPILER_INDEX_STORE_ENABLE=NO',
                    'GCC_GENERATE_DEBUGGING_SYMBOLS=NO', 'DEBUG_INFORMATION_FORMAT=']
            with Path(result['log']).open('w') as log:
                child = subprocess.Popen(argv, cwd=mobile, env=env, stdout=log, stderr=subprocess.STDOUT,
                                         start_new_session=True)
                while child.poll() is None:
                    guards.check_stop()
                    guards.check_disk(checkout, output)
                    time.sleep(1)
            guards.require(child.returncode == 0, 'Simulator build failed; see xcodebuild.log')
            guards.check_stop()
            guards.require((app / 'main.jsbundle').is_file(), 'App is missing its bundled JavaScript')
            # CTor links into the dynamic Objective-C Tor wrapper. Check the
            # shipped wrapper too; native tests query its live GETINFO version.
            embedded = app / 'Frameworks/Tor.framework/Tor'
            strings = guards.command(['strings', str(embedded)], env)
            guards.require(any(line.split(' ')[0] == '0.4.9.11' for line in strings.splitlines()),
                           'Linked app is missing Tor 0.4.9.11')
            platform = guards.command(['xcrun', 'vtool', '-show-build', str(embedded)], env)
            guards.require('platform IOSSIMULATOR' in platform, 'App must target iOS Simulator')
            guards.command(['codesign', '--force', '--sign', '-',
                            '--preserve-metadata=entitlements,identifier,flags', str(app)], env)
            guards.command(['codesign', '--verify', '--strict', str(app)], env)
            result.update(status='passed', app=str(app), appJSBundleSHA256=guards.sha256(app / 'main.jsbundle'),
                          embeddedTorSHA256=guards.sha256(embedded),
                          appExecutableSHA256=guards.sha256(app / 'Quiet'))
        except Exception as error:
            result.update(status='failed', error=str(error))
        finally:
            guards.stop_child(child)
            result['torPodUnchanged'] = guards.snapshot(framework) == original
            if not result['torPodUnchanged']:
                result.update(status='failed', error='Installed Tor XCFramework changed during build')
            guards.write_result(output, run, result)
        print(json.dumps(result))
        return 0 if result['status'] == 'passed' else 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--checkout', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--scheme', default='Quiet', choices=['Quiet', 'Storybook'])
    parser.add_argument('--configuration', default='Debug', choices=['Debug', 'Release'])
    parser.add_argument('--env-file', default='.env.staging')
    for signum in [signal.SIGINT, signal.SIGTERM, signal.SIGHUP]:
        signal.signal(signum, guards.request_stop)
    try:
        sys.exit(build(parser.parse_args()))
    except (guards.BuildFailure, OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
