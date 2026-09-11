#!/usr/bin/env python3
"""Embed simulator capabilities like Xcode, then seal the app without device entitlements."""
import argparse
import hashlib
import json
from pathlib import Path
import plistlib
import re
import struct
import subprocess
import sys


def run(args, data=None):
    return subprocess.check_output(args, input=data, stderr=subprocess.PIPE)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def prepare(checkout, output):
    mobile = checkout / 'packages/mobile/ios'
    local = mobile / 'LocalDev.xcconfig'
    require(not local.exists(), 'Keep existing local iOS configuration intact')
    settings = (mobile / 'Quiet.xcconfig').read_text()
    team = re.search(r'^DEVELOPMENT_TEAM = ([A-Z0-9]{10})$', settings, re.M)
    require(team is not None and '\nAPP_BUNDLE_ID = com.quietmobile\n' in settings,
            'Expected the checked-in Quiet development configuration')
    require(re.fullmatch(r'[/A-Za-z0-9_.-]+', str(output)) is not None,
            'Use a simple absolute CI output path for Xcode expansion')
    prefix = team[1] + '.'
    output.mkdir(mode=0o700, parents=False, exist_ok=False)
    for target, bundle_id, source in [
        ('Quiet', 'com.quietmobile', 'Quiet/QuietDebug.entitlements'),
        ('QuietNotificationServiceExtension', 'com.quietmobile.QuietNotificationServiceExtension',
         'QuietNotificationServiceExtension/QuietNotificationServiceExtension.entitlements'),
    ]:
        raw = (mobile / source).read_text().replace('$(AppIdentifierPrefix)', prefix)
        require('$(' not in raw and ('$' + '{') not in raw, 'Unresolved simulator entitlement variable')
        entitlements = plistlib.loads(raw.encode())
        entitlements['application-identifier'] = prefix + bundle_id
        filename = output / (target + '.xcent')
        filename.write_bytes(plistlib.dumps(entitlements))
        run(['/usr/bin/derq', 'query', '-f', 'xml', '-i', str(filename), '-o', str(filename) + '.der', '--raw'])
    # Quiet and its NSE include this ignored, optional config; Pods do not.
    # CODE_SIGNING_ALLOWED=NO suppresses Xcode's normal simulated-entitlement
    # linker inputs. Supply those same sections only to simulator builds.
    with local.open('x') as stream:
        stream.write(
            '// Task-owned simulator notification build configuration.\n'
            f'QUIET_SIMULATOR_ENTITLEMENTS = {output}/$(TARGET_NAME).xcent\n'
            'ENABLE_DEBUG_DYLIB[sdk=iphonesimulator*] = NO\n'
            'OTHER_LDFLAGS[sdk=iphonesimulator*] = $(inherited) '
            '-Xlinker -sectcreate -Xlinker __TEXT -Xlinker __entitlements '
            '-Xlinker $(QUIET_SIMULATOR_ENTITLEMENTS) '
            '-Xlinker -sectcreate -Xlinker __TEXT -Xlinker __ents_der '
            '-Xlinker $(QUIET_SIMULATOR_ENTITLEMENTS).der\n')
    return {'status': 'prepared', 'simulatorOnly': True}


def section(executable, name):
    data = executable.read_bytes()
    require(len(data) >= 32 and struct.unpack_from('<I', data)[0] == 0xfeedfacf,
            'Expected a thin 64-bit simulator executable')
    count, length = struct.unpack_from('<II', data, 16)
    offset, limit = 32, 32 + length
    require(limit <= len(data), 'Truncated Mach-O commands')
    for _ in range(count):
        require(offset + 8 <= limit, 'Truncated Mach-O command')
        command, command_size = struct.unpack_from('<II', data, offset)
        require(command_size >= 8 and offset + command_size <= limit, 'Invalid Mach-O command')
        if command == 0x19:
            require(command_size >= 72, 'Truncated Mach-O segment')
            sections = struct.unpack_from('<I', data, offset + 64)[0]
            require(72 + sections * 80 <= command_size, 'Truncated Mach-O sections')
            for index in range(sections):
                start = offset + 72 + index * 80
                if data[start:start + 16].split(b'\0')[0] == name.encode() and data[start + 16:start + 32].split(b'\0')[0] == b'__TEXT':
                    size = struct.unpack_from('<Q', data, start + 40)[0]
                    position = struct.unpack_from('<I', data, start + 48)[0]
                    require(position + size <= len(data), 'Truncated simulated entitlements')
                    return data[position:position + size]
        offset += command_size
    raise ValueError('Missing linked simulator entitlement section: ' + name)


def inspect(app, verify_signatures=True):
    extension = app / 'PlugIns/QuietNotificationServiceExtension.appex'
    bundles = [(app, plistlib.loads((app / 'Info.plist').read_bytes())),
               (extension, plistlib.loads((extension / 'Info.plist').read_bytes()))]
    info, extension_info = [item[1] for item in bundles]
    simulator = info.get('CFBundleSupportedPlatforms') == ['iPhoneSimulator']
    require(simulator or info.get('CFBundleSupportedPlatforms') == ['iPhoneOS'], 'Expected an iOS app')
    require(info.get('CFBundleIdentifier') == 'com.quietmobile', 'Expected the Quiet application ID')
    require(extension_info.get('CFBundleIdentifier') == 'com.quietmobile.QuietNotificationServiceExtension', 'Unexpected notification extension identifier')
    access_group = info.get('QuietKeychainAccessGroup', '')
    require(re.fullmatch(r'[A-Z0-9]{10}\.com\.quietmobile', access_group), 'The built app must resolve its shared keychain group')
    require(extension_info.get('QuietKeychainAccessGroup') == access_group, 'App and NSE must use the same keychain group')
    prefix = access_group[:-len('com.quietmobile')]
    for bundle, bundle_info in bundles:
        executable = bundle / bundle_info['CFBundleExecutable']
        if simulator:
            entitlements = plistlib.loads(section(executable, '__entitlements').rstrip(b'\0'))
            encoded = run(['/usr/bin/derq', 'query', '-f', 'xml', '-i', '/dev/stdin', '-o', '/dev/stdout', '--raw'], plistlib.dumps(entitlements))
            require(section(executable, '__ents_der') == encoded, 'XML and DER simulator entitlements must match')
        else:
            entitlements = plistlib.loads(run(['codesign', '--display', '--entitlements', ':-', str(bundle)]))
        require(entitlements.get('application-identifier') == prefix + bundle_info['CFBundleIdentifier'], 'Simulated application identifier must match the native app')
        require(entitlements.get('com.apple.security.application-groups') == ['group.com.quietmobile'], 'Both native apps need the shared notification app group')
        require(entitlements.get('keychain-access-groups') == [access_group], 'Both native apps need the configured notification keychain group')
        if bundle == app:
            require(entitlements.get('aps-environment') == 'development', 'Simulator provider delivery requires development APNs')
        if verify_signatures:
            run(['codesign', '--verify', '--strict', str(bundle)])
            raw = run(['codesign', '--display', '--entitlements', ':-', str(bundle)])
            host = plistlib.loads(raw) if raw.strip() else {}
            require(not simulator or not any(key in host for key in ['aps-environment', 'application-identifier', 'keychain-access-groups', 'com.apple.security.application-groups']),
                    'iOS capabilities belong in simulator Mach-O sections, not the host code signature')
    return {'apsEnvironment': 'development', 'sharedGroupsMatch': True, 'entitlementLocation': '__TEXT' if simulator else 'code-signature'}


def sign(app, output):
    capabilities = inspect(app, verify_signatures=False)
    require(capabilities['entitlementLocation'] == '__TEXT', 'Only simulator apps may be ad-hoc signed')
    output.mkdir(mode=0o700, parents=False, exist_ok=False)
    tor = app / 'Frameworks/Tor.framework/Tor'
    before = hashlib.sha256(tor.read_bytes()).hexdigest()
    # The host signature must not carry device capabilities. Simulator APIs
    # read those from the linked sections, as in a normal Xcode build.
    empty = output / 'host-entitlements.plist'
    empty.write_bytes(plistlib.dumps({}))
    for bundle in [app / 'PlugIns/QuietNotificationServiceExtension.appex', app]:
        run(['codesign', '--force', '--sign', '-', '--entitlements', str(empty), str(bundle)])
    inspect(app)
    require(hashlib.sha256(tor.read_bytes()).hexdigest() == before, 'Signing changed the embedded Tor framework')
    result = {'status': 'passed', 'simulatorOnly': True, 'appAndExtensionVerified': True,
              'torUnchanged': True, **capabilities}
    (output / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--checkout', type=Path)
    parser.add_argument('--app', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--prepare', action='store_true')
    parser.add_argument('--verify', action='store_true')
    args = parser.parse_args()
    try:
        require(sys.platform == 'darwin', 'Simulator signing requires macOS')
        if args.prepare:
            require(args.checkout and args.output, 'Preparation requires checkout and output paths')
            result = prepare(args.checkout.resolve(), args.output.resolve())
        elif args.verify:
            require(args.app, 'Verification requires an application path')
            result = inspect(args.app.resolve())
        else:
            require(args.app and args.output, 'Signing requires application and output paths')
            result = sign(args.app.resolve(), args.output.resolve())
        print(json.dumps(result, indent=2))
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        raise SystemExit(str(error) if isinstance(error, ValueError) else 'Simulator entitlement preparation or verification failed') from None
