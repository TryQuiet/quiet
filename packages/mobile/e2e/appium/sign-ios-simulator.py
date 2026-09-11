#!/usr/bin/env python3
"""Apply the app's real notification entitlements to disposable simulator builds."""
import argparse
import hashlib
import json
from pathlib import Path
import plistlib
import re
import subprocess
import sys


def sign(checkout, app, output):
    if sys.platform != 'darwin':
        raise ValueError('Simulator signing requires macOS')
    extension = app / 'PlugIns/QuietNotificationServiceExtension.appex'
    info = plistlib.loads((app / 'Info.plist').read_bytes())
    extension_info = plistlib.loads((extension / 'Info.plist').read_bytes())
    if info.get('CFBundleSupportedPlatforms') != ['iPhoneSimulator']:
        raise ValueError('Only an iOS Simulator app may be ad-hoc signed')
    if info.get('CFBundleIdentifier') != 'com.quietmobile':
        raise ValueError('This fixture signs only the Quiet simulator application')
    if extension_info.get('CFBundleIdentifier') != 'com.quietmobile.QuietNotificationServiceExtension':
        raise ValueError('Unexpected notification extension identifier')
    access_group = info.get('QuietKeychainAccessGroup', '')
    if not re.fullmatch(r'[A-Z0-9]{10}\.com\.quietmobile', access_group):
        raise ValueError('The built app must resolve its development team keychain group')
    if extension_info.get('QuietKeychainAccessGroup') != access_group:
        raise ValueError('App and extension must resolve the same keychain group')
    prefix = access_group[:-len('com.quietmobile')]
    configurations = []
    for bundle, source in [
        (extension, 'QuietNotificationServiceExtension/QuietNotificationServiceExtension.entitlements'),
        (app, 'Quiet/QuietDebug.entitlements'),
    ]:
        raw = (checkout / 'packages/mobile/ios' / source).read_text()
        raw = raw.replace('$(AppIdentifierPrefix)', prefix)
        if '$(' in raw or '${' in raw:
            raise ValueError('Unresolved notification entitlement variable')
        entitlements = plistlib.loads(raw.encode())
        if entitlements.get('com.apple.security.application-groups') != ['group.com.quietmobile']:
            raise ValueError('The notification app group must match production storage')
        if entitlements.get('keychain-access-groups') != [access_group]:
            raise ValueError('The notification keychain entitlement must match native configuration')
        if bundle == app and entitlements.get('aps-environment') != 'development':
            raise ValueError('The simulator provider lane requires development APNs')
        configurations.append((bundle, entitlements))
    output.mkdir(mode=0o700, parents=False, exist_ok=False)
    tor = app / 'Frameworks/Tor.framework/Tor'
    before = hashlib.sha256(tor.read_bytes()).hexdigest()
    # Sign the extension before its containing app. Never use --deep or re-sign Tor.
    for index, (bundle, entitlements) in enumerate(configurations):
        filename = output / f'entitlements-{index}.plist'
        filename.write_bytes(plistlib.dumps(entitlements))
        subprocess.run(['codesign', '--force', '--sign', '-', '--entitlements', str(filename), str(bundle)], check=True, capture_output=True)
        subprocess.run(['codesign', '--verify', '--strict', str(bundle)], check=True, capture_output=True)
        signed = subprocess.check_output(['codesign', '--display', '--entitlements', ':-', str(bundle)], stderr=subprocess.DEVNULL)
        if plistlib.loads(signed) != entitlements:
            raise ValueError('Signed notification entitlements differ from the selected configuration')
    if hashlib.sha256(tor.read_bytes()).hexdigest() != before:
        raise ValueError('Notification signing changed the embedded Tor framework')
    result = {'status': 'passed', 'simulatorOnly': True, 'apsEnvironment': 'development',
              'appAndExtensionVerified': True, 'sharedGroupsMatch': True, 'torUnchanged': True}
    (output / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--checkout', required=True, type=Path)
    parser.add_argument('--app', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(sign(args.checkout.resolve(), args.app.resolve(), args.output.resolve()), indent=2))
    except (ValueError, OSError, subprocess.SubprocessError):
        raise SystemExit('Simulator notification signing or entitlement verification failed') from None
