#!/usr/bin/env python3
"""Run the native addon and production webpack loader in the pinned iOS Node runtime.

Uses a separate simulator app/container; does not modify or replace Quiet.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import time


def run(*args):
    return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT).strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node-framework', type=Path, required=True)
    parser.add_argument('--sodium-artifact', type=Path, required=True)
    parser.add_argument('--payload', type=Path, required=True)
    parser.add_argument('--simulator', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if output.exists():
        raise RuntimeError('Choose a new output directory')
    output.mkdir(parents=True)
    app = output / 'SodiumProbe.app'
    (app / 'Frameworks').mkdir(parents=True)
    shutil.copytree(args.node_framework, app / 'Frameworks/NodeMobile.framework')
    sodium = args.sodium_artifact / 'QuietSodium.xcframework/ios-arm64-simulator/QuietSodium.framework'
    shutil.copytree(sodium, app / 'Frameworks/QuietSodium.framework')
    shutil.copyfile(args.sodium_artifact / 'LICENSE.libsodium', app / 'Frameworks/QuietSodium.framework/LICENSE.libsodium')
    shutil.copytree(args.payload, app / 'nodejs-project')
    identifier = 'com.quiet.NativeSodiumProbe'
    info = {'CFBundleExecutable': 'SodiumProbe', 'CFBundleIdentifier': identifier,
            'CFBundleName': 'Native sodium probe', 'CFBundlePackageType': 'APPL',
            'CFBundleVersion': '1', 'CFBundleShortVersionString': '1.0',
            'MinimumOSVersion': '17.1', 'LSRequiresIPhoneOS': True,
            'UIDeviceFamily': [1, 2], 'UILaunchScreen': {}}
    (app / 'Info.plist').write_bytes(plistlib.dumps(info))
    sdk = run('xcrun', '--sdk', 'iphonesimulator', '--show-sdk-path')
    run('xcrun', '--sdk', 'iphonesimulator', 'clang++', '-target', 'arm64-apple-ios17.1-simulator',
        '-isysroot', sdk, '-fobjc-arc', str(Path(__file__).with_name('main.mm')),
        '-F', str(app / 'Frameworks'), '-framework', 'NodeMobile', '-framework', 'UIKit',
        '-framework', 'Foundation', '-Wl,-rpath,@executable_path/Frameworks', '-o', str(app / 'SodiumProbe'))
    for framework in ['NodeMobile', 'QuietSodium']:
        run('codesign', '--force', '--sign', '-', str(app / f'Frameworks/{framework}.framework'))
    run('codesign', '--force', '--sign', '-', str(app))
    run('codesign', '--verify', '--strict', str(app))
    run('xcrun', 'simctl', 'install', args.simulator, str(app))
    container = Path(run('xcrun', 'simctl', 'get_app_container', args.simulator, identifier, 'data'))
    result_path = container / 'Documents/sodium-result.json'
    # An old result in this probe's own container cannot count as a new pass.
    if result_path.exists():
        result_path.unlink()
    run('xcrun', 'simctl', 'launch', '--terminate-running-process', args.simulator, identifier)
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        if result_path.exists():
            try:
                result = json.loads(result_path.read_text())
                break
            except json.JSONDecodeError:
                pass
        time.sleep(1)
    else:
        raise RuntimeError('iOS probe did not produce a result within 10 minutes')
    result['nodeFrameworkSHA256'] = hashlib.sha256((args.node_framework / 'NodeMobile').read_bytes()).hexdigest()
    result['sodiumFrameworkSHA256'] = hashlib.sha256((sodium / 'QuietSodium').read_bytes()).hexdigest()
    result['payloadSHA256'] = hashlib.sha256((args.payload / 'bundled-sodium.cjs').read_bytes()).hexdigest()
    (output / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
    run('xcrun', 'simctl', 'terminate', args.simulator, identifier)
    if not result.get('passed'):
        raise RuntimeError('iOS native sodium checks failed')


if __name__ == '__main__':
    main()
