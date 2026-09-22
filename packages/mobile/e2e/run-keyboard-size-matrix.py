#!/usr/bin/env python3
"""Exercise an existing joined chat through an existing Appium session on an emulator.

Does not create/delete sessions, communities, profiles, or messages. The fixture's
composer text and display overrides are restored. Screenshots/XML may contain chat
content: keep the output directory private.
"""
import argparse
import json
import pathlib
import re
import subprocess
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

SIZES = [('compact', '720x1280', '320'), ('tall', '1080x2400', '420'), ('tablet', '1600x2560', '320')]
ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'


def parse_bounds(source):
    result = {}
    for node in ET.fromstring(source).iter():
        key = node.get('resource-id', '').split(':id/')[-1]
        if key in {'chat_general', 'chat-composer-controls', 'chat-composer-toolbar', 'message-composer', 'input', 'send_message_button'}:
            result[key] = [int(x) for x in re.findall(r'-?\d+', node.get('bounds', ''))]
    return result


def parse_ime(window):
    match = re.search(r'type=ime\s+frame=\[\d+,(-?\d+)\]\[\d+,\d+\][^\n]*?visible=(true|false)', window)
    if not match:
        raise ValueError('No native IME inset source in dumpsys window')
    return {'visible': match[2] == 'true', 'top': int(match[1])}


def check_geometry(bounds, ime, density, opened):
    required = ['chat_general', 'chat-composer-controls', 'chat-composer-toolbar', 'input', 'send_message_button']
    for key in required:
        if len(bounds.get(key, [])) != 4:
            raise AssertionError(f'Missing native bounds for {key}')
    if ime['visible'] != opened:
        raise AssertionError(f'Keyboard visibility {ime["visible"]}, expected {opened}')
    root, controls, toolbar, field, send = [bounds[key] for key in required]
    if field[3] > toolbar[1] + 2 or field[1] < controls[1] - 2:
        raise AssertionError('Text field is outside its composer row')
    if send[3] - send[1] < 44 * density - 2:
        raise AssertionError('Send touch target is shorter than 44dp')
    edge = ime['top'] if opened else root[3]
    gap = edge - controls[3]
    if abs(gap) > 2:
        raise AssertionError(f'Composer boundary differs from keyboard/safe-area edge by {gap}px')
    if abs(toolbar[3] - controls[3]) > 2:
        raise AssertionError('Unexpected gap below toolbar (empty attachment strip?)')
    clearance = edge - send[3]
    if abs(clearance / density - 8) > 1:
        raise AssertionError(f'Send clearance {clearance / density:.2f}dp, expected 8dp')
    if send[1] < toolbar[1] or send[3] > edge:
        raise AssertionError('Send target clipped by toolbar or keyboard')
    return {'composer_gap_px': gap, 'send_clearance_dp': clearance / density,
            'field_height_dp': (field[3] - field[1]) / density,
            'toolbar_height_dp': (toolbar[3] - toolbar[1]) / density}


def original_override(text):
    match = re.search(r'^Override (?:size|density): (\S+)', text, re.M)
    return match[1] if match else 'reset'


class Runner:
    def __init__(self, args):
        self.args = args
        self.output = pathlib.Path(args.output)
        self.output.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.samples = []

    def adb(self, *args):
        return subprocess.check_output([self.args.adb, '-s', self.args.serial, *args], timeout=30)

    def api(self, method, path, body=None):
        url = self.args.server.rstrip('/') + '/session/' + self.args.session_id + path
        request = urllib.request.Request(url, method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=30) as response:
            value = json.load(response)['value']
        if isinstance(value, dict) and value.get('error'):
            raise RuntimeError(value['error'] + ': ' + value.get('message', ''))
        return value

    def source(self):
        return self.api('GET', '/source')

    def element(self, resource_id):
        element = self.api('POST', '/element', {'using': 'xpath', 'value': f'//*[@resource-id="{resource_id}" or @resource-id="com.quietmobile.debug:id/{resource_id}"]'})
        return element.get(ELEMENT_KEY) or element['ELEMENT']

    def click(self, resource_id):
        self.api('POST', '/element/' + self.element(resource_id) + '/click', {})

    def ensure_general(self):
        def ready():
            source = self.source()
            if 'chat_general' in parse_bounds(source):
                return True
            if 'channel_tile_general' in source:
                self.click('channel_tile_general')
            raise AssertionError('Waiting for joined general chat')
        self.poll(ready)

    def poll(self, function):
        deadline = time.monotonic() + self.args.timeout
        last = None
        while time.monotonic() < deadline:
            try:
                return function()
            except (AssertionError, ValueError, urllib.error.HTTPError) as error:
                last = error
                time.sleep(0.25)
        raise AssertionError(f'Timed out after {self.args.timeout}s: {last}')

    def hide(self):
        if parse_ime(self.adb('shell', 'dumpsys', 'window').decode())['visible']:
            self.api('POST', '/appium/device/hide_keyboard', {})
        def hidden():
            if parse_ime(self.adb('shell', 'dumpsys', 'window').decode())['visible']:
                raise AssertionError('Keyboard still visible')
        self.poll(hidden)

    def replace_text(self, text):
        element = self.element('input')
        self.api('POST', '/element/' + element + '/clear', {})
        if text:
            self.api('POST', '/element/' + element + '/value', {'text': text})
        def entered():
            actual = self.api('GET', '/element/' + element + '/attribute/text') or ''
            if text and actual != text:
                raise AssertionError('Waiting for exact fixture text, including native newlines')
        self.poll(entered)

    def capture(self, label, density, opened):
        previous = None
        def settled():
            nonlocal previous
            source = self.source()
            bounds = parse_bounds(source)
            ime = parse_ime(self.adb('shell', 'dumpsys', 'window').decode())
            metrics = check_geometry(bounds, ime, density, opened)
            state = (bounds, ime)
            if previous != state:
                previous = state
                raise AssertionError('Waiting for two matching native layouts')
            return source, bounds, ime, metrics
        try:
            source, bounds, ime, metrics = self.poll(settled)
        except Exception:
            (self.output / (label + '-failure.xml')).write_text(self.source())
            (self.output / (label + '-failure.png')).write_bytes(self.adb('exec-out', 'screencap', '-p'))
            (self.output / (label + '-failure-window.txt')).write_bytes(self.adb('shell', 'dumpsys', 'window'))
            raise
        (self.output / (label + '.xml')).write_text(source)
        (self.output / (label + '.png')).write_bytes(self.adb('exec-out', 'screencap', '-p'))
        sample = {'label': label, 'bounds_px': bounds, 'ime': ime, **metrics}
        self.samples.append(sample)
        (self.output / 'geometry.json').write_text(json.dumps(self.samples, indent=2) + '\n')
        print(json.dumps(sample), flush=True)

    def run(self):
        # Check both CLI serial and the existing session before any mutation.
        caps = self.api('GET', '')
        caps = caps.get('capabilities', caps)
        session_serial = caps.get('udid') or caps.get('appium:udid') or caps.get('deviceUDID')
        if session_serial != self.args.serial:
            raise ValueError(f'Appium session serial {session_serial!r} differs from requested emulator')
        if self.adb('shell', 'getprop', 'ro.kernel.qemu').strip() != b'1':
            raise ValueError('Device is not an Android emulator')
        size = original_override(self.adb('shell', 'wm', 'size').decode())
        density = original_override(self.adb('shell', 'wm', 'density').decode())
        self.ensure_general()
        draft = self.api('GET', '/element/' + self.element('input') + '/attribute/text') or ''
        # UiAutomator may report the placeholder as text for an empty field.
        hint = self.api('GET', '/element/' + self.element('input') + '/attribute/hint') or ''
        if draft == hint:
            draft = ''
        was_open = parse_ime(self.adb('shell', 'dumpsys', 'window').decode())['visible']
        try:
            for name, dimensions, dpi in SIZES:
                self.hide()
                self.adb('shell', 'wm', 'size', dimensions)
                self.adb('shell', 'wm', 'density', dpi)
                self.ensure_general()
                single_height = None
                for text_label, text in [('single', 'Keyboard geometry fixture'), ('multiline', 'Keyboard geometry fixture\nSecond line\nThird line')]:
                    self.click('input')
                    self.replace_text(text)
                    for cycle in range(2):
                        self.click('input')
                        self.capture(f'{name}-{text_label}-{cycle + 1}-open', int(dpi) / 160, True)
                        height = self.samples[-1]['field_height_dp']
                        if text_label == 'single':
                            single_height = height
                        elif height <= single_height + 5:
                            raise AssertionError('Multiline fixture did not grow the native text field')
                        self.hide()
                        self.capture(f'{name}-{text_label}-{cycle + 1}-closed', int(dpi) / 160, False)
            print('PASS: 24 native layout samples across three sizes; no messages sent.', flush=True)
        finally:
            # Restore display even if draft restoration/navigation fails.
            try:
                self.adb('shell', 'wm', 'size', size)
            finally:
                self.adb('shell', 'wm', 'density', density)
            self.ensure_general()
            self.click('input')
            self.replace_text(draft)
            if not was_open:
                self.hide()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--server', required=True)
    parser.add_argument('--session-id', required=True)
    parser.add_argument('--serial', required=True)
    parser.add_argument('--adb', default='adb')
    parser.add_argument('--output', required=True)
    parser.add_argument('--timeout', type=float, default=30)
    args = parser.parse_args()
    if not re.fullmatch(r'emulator-\d+', args.serial):
        parser.error('--serial must identify an emulator; physical devices are forbidden')
    Runner(args).run()


if __name__ == '__main__':
    main()
