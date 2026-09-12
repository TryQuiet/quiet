#!/usr/bin/env python3
"""Drive a dedicated Android test installation through visible native UI."""
import argparse
import json
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET


class Android:
    def __init__(self, adb, serial, output):
        if not re.fullmatch(r'emulator-\d+', serial):
            raise ValueError('This runner requires an explicitly selected emulator')
        self.command = [adb, '-s', serial]
        self.output = Path(output)
        self.output.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.sequence = 0
        self.api = int(self.run('shell', 'getprop', 'ro.build.version.sdk').strip())

    def run(self, *args):
        return subprocess.check_output(self.command + list(args), timeout=30).decode()

    def dump(self):
        self.run('shell', 'uiautomator', 'dump', '/sdcard/connection-regression.xml')
        raw = self.run('exec-out', 'cat', '/sdcard/connection-regression.xml')
        self.sequence += 1
        (self.output / f'ui-{time.time_ns()}-{self.sequence}.xml').write_text(raw)
        return ET.fromstring(raw)

    @staticmethod
    def find(tree, value):
        for node in tree.iter('node'):
            if value in [node.get('text'), node.get('content-desc'), node.get('resource-id')]:
                return node
        return None

    def wait(self, value, timeout=120):
        end = time.monotonic() + timeout
        while time.monotonic() < end:
            tree = self.dump()
            node = self.find(tree, value)
            if node is not None:
                return node
            if self.find(tree, 'Allow') is not None:
                self.tap_node(self.find(tree, 'Allow'))
            time.sleep(.2)
        raise TimeoutError(f'Android did not display {value!r} within {timeout}s')

    def tap_node(self, node):
        x1, y1, x2, y2 = map(int, re.findall(r'\d+', node.get('bounds', '')))
        self.run('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))

    def tap(self, value, timeout=120):
        self.tap_node(self.wait(value, timeout))

    def type(self, text):
        # Invoke Android's shell with explicit quoting; invitation characters
        # must never be interpreted as shell operators.
        import shlex
        self.run('shell', 'input text ' + shlex.quote(text.replace(' ', '%s')))

    def input(self, text):
        tree = self.dump()
        nodes = [n for n in tree.iter('node') if n.get('class') == 'android.widget.EditText']
        if len(nodes) != 1:
            raise ValueError(f'Expected one visible text field, got {len(nodes)}')
        self.tap_node(nodes[0])
        # Wait for keyboard/focus layout before injecting native key events.
        self.dump()
        if self.api >= 31:
            self.run('shell', 'input', 'keycombination', '113', '29')
            self.run('shell', 'input', 'keyevent', '67')
        elif nodes[0].get('text') not in ['', 'Invite link', 'Enter a username', 'Message #general']:
            self.run('shell', 'input', 'keyevent', '123')
            self.run('shell', 'input', 'keyevent', *(['67'] * len(nodes[0].get('text', ''))))
        for offset in range(0, len(text), 24):
            self.type(text[offset:offset+24])
            time.sleep(.08)
        entered = [n.get('text') for n in self.dump().iter('node') if n.get('class') == 'android.widget.EditText']
        if entered != [text]:
            raise ValueError('Native keyboard did not enter the exact requested text')
        self.run('shell', 'input', 'keyevent', '4')

    def preflight(self, qss_port):
        if not isinstance(qss_port, int) or not 1024 <= qss_port <= 65535:
            raise ValueError('Expected a local fixture port')
        routes = self.run('shell', 'ip', 'route', 'show', 'table', 'all')
        if not re.search(r'^default .* dev (?!lo\b)', routes, re.MULTILINE):
            raise RuntimeError('Emulator has no external default route for Tor')
        response = self.run('shell', "{ printf 'GET /health HTTP/1.0\\r\\nHost: localhost\\r\\n\\r\\n'; sleep 2; } | nc -w 3 127.0.0.1 " + str(qss_port))
        if not response.startswith('HTTP/1.1 200') or '"status":"ok"' not in response:
            raise RuntimeError('QSS fixture is not healthy through the mobile route')
        package = self.run('shell', 'pm', 'path', 'com.quietmobile').strip()
        if not package.startswith('package:') or '\n' in package:
            raise RuntimeError('Expected one installed release APK')
        apk_hash = self.run('shell', 'sha256sum', package.removeprefix('package:')).split()[0]
        return {'api': self.api, 'installedApkSha256': apk_hash,
                'abi': self.run('shell', 'getprop', 'ro.product.cpu.abi').strip(),
                'nativeBridge': self.run('shell', 'getprop', 'ro.dalvik.vm.native.bridge').strip(),
                'externalRoutePresent': True, 'qssHealthFromAndroid': True}

    def join(self, invitation, username):
        self.wait('Join community')
        self.input(invitation)
        self.tap('Continue')
        self.wait('Register a username')
        self.input(username)
        start = time.monotonic()
        self.tap('Continue')
        self.wait('Agree & Continue')
        self.tap('Agree & Continue')
        self.wait('channels_list', 240)
        return {'joinSeconds': time.monotonic() - start}

    def general(self):
        self.tap('channel_tile_general')
        self.wait('chat_general')

    def send(self, message):
        self.input(message)
        self.tap('send_message_button')
        self.wait(message, 60)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--adb', required=True)
    p.add_argument('--serial', required=True)
    p.add_argument('--output', required=True)
    p.add_argument('--request', required=True, help='Private JSON request file')
    args = p.parse_args()
    request = json.loads(Path(args.request).read_text())
    phone = Android(args.adb, args.serial, args.output)
    action = request.pop('action')
    start = time.monotonic()
    result = getattr(phone, action)(**request)
    print(json.dumps({'action': action, 'elapsedSeconds': time.monotonic()-start, 'result': result}))
