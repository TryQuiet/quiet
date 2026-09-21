#!/usr/bin/env python3
"""Exercise actual UIKit background/suspension on a connected physical iPhone."""
import argparse
import json
import pathlib
import subprocess
import time

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--device', required=True)
parser.add_argument('--bundle', default='org.tryquiet.tor-device-regression')
parser.add_argument('--network-probe', action='store_true')
parser.add_argument('--usb-udid')
parser.add_argument('--rapid-transitions', action='store_true')
parser.add_argument('--cycles', type=int, default=10)
parser.add_argument('--background-seconds', type=float, default=8)
parser.add_argument('--output', type=pathlib.Path, required=True)
args = parser.parse_args()
if args.network_probe and not args.usb_udid:
    parser.error('--network-probe requires --usb-udid')
args.output.mkdir(parents=True, exist_ok=False)


def device(*command):
    return subprocess.run(['xcrun', 'devicectl', 'device', *command],
                          check=True, capture_output=True, text=True, timeout=30)


def launch(bundle, cold=False):
    command = ['process', 'launch', '--device', args.device]
    if cold:
        command.append('--terminate-existing')
    arguments = ['rapid-transitions'] if bundle == args.bundle and args.rapid_transitions else []
    device(*command, bundle, *arguments)


def status():
    target = args.output / 'status.json'
    device('copy', 'from', '--device', args.device, '--source', 'Documents/status.json',
           '--destination', str(target), '--domain-type', 'appDataContainer',
           '--domain-identifier', args.bundle)
    return json.loads(target.read_text())


def wait_for(phase, ready_count=0, pid=None):
    deadline = time.monotonic() + 45
    last = {}
    while time.monotonic() < deadline:
        try:
            last = status()
        except subprocess.CalledProcessError:
            time.sleep(0.5)
            continue
        if last.get('phase') == 'failed':
            raise AssertionError(last)
        if last.get('phase') == phase and last.get('readyCount', 0) > ready_count:
            if pid is not None:
                assert last['pid'] == pid, 'App restarted instead of resuming'
            return last
        time.sleep(0.5)
    raise AssertionError(f'Timed out waiting for {phase}: {last}')


def probe_network(current, cycle):
    if not args.network_probe:
        return
    result = subprocess.run(['node', str(pathlib.Path(__file__).with_name('probe-network.cjs')),
                             args.usb_udid, str(current['httpPort'])],
                            capture_output=True, text=True, timeout=75)
    (args.output / f'network-{cycle}.log').write_text(result.stdout + result.stderr)
    assert result.returncode == 0, result.stderr
    print(result.stdout.strip(), flush=True)


launch(args.bundle, cold=True)
current = wait_for('ready')
assert current['passed'], current
pid = current['pid']
with (args.output / 'cycles.jsonl').open('w') as evidence:
    evidence.write(json.dumps({'cycle': 0, **current}) + '\n')
    evidence.flush()
    print('Cold start: control, SOCKS, HTTP listener, onion creation PASS', flush=True)
    probe_network(current, 0)
    for cycle in range(1, args.cycles + 1):
        previous_count = current['readyCount']
        launch('com.apple.Preferences')
        background = wait_for('background', pid=pid)
        assert background['backgroundAcknowledged'] and background['backgroundPortsClosed'], background
        time.sleep(args.background_seconds)
        launch(args.bundle)
        current = wait_for('ready', ready_count=previous_count, pid=pid)
        assert current['passed'] and current['onionCreated'] and current['onionRetained'], current
        evidence.write(json.dumps({'cycle': cycle, 'background': background, **current}) + '\n')
        evidence.flush()
        print(f'Cycle {cycle}: resume, onion creation, retained identity/thread PASS', flush=True)
        probe_network(current, cycle)
