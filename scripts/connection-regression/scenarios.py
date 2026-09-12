#!/usr/bin/env python3
"""Real mobile/desktop delivery, resume and QSS-only offline catch-up scenarios."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import time
import uuid
from android import Android


def private_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with open(str(path) + '.tmp', 'w', opener=lambda p, f: os.open(p, f, 0o600)) as output:
        json.dump(value, output, indent=2)
    os.replace(str(path) + '.tmp', path)


class PeerFailure(RuntimeError):
    def __init__(self, result):
        self.result = result
        super().__init__(f'Desktop command failed: {result}')


class Peer:
    def __init__(self, directory):
        self.directory = Path(directory)

    def submit(self, action, **args):
        name = f'{time.time_ns()}-{uuid.uuid4().hex}.json'
        private_json(self.directory / 'requests' / name, {'action': action, **args})
        return name

    def result(self, name, timeout=90):
        deadline = time.monotonic() + timeout
        file = self.directory / 'responses' / name
        while time.monotonic() < deadline:
            if file.exists():
                result = json.loads(file.read_text())
                if not result.get('passed'):
                    raise PeerFailure(result)
                return result
            time.sleep(.1)
        raise TimeoutError('Desktop command did not finish')

    def wait_exact(self, message, username, timeout=180):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            name = self.submit('wait', message=message, username=username)
            try:
                return self.result(name, timeout=min(90, deadline-time.monotonic()))
            except PeerFailure as error:
                if not error.result.get('error', '').startswith('TimeoutError: Expected the exact message'):
                    raise
        raise TimeoutError('Desktop did not receive the exact reply before deadline')

    def call(self, action, **args):
        return self.result(self.submit(action, **args))


def stop_phone(phone):
    phone.run('shell', 'cmd', 'jobscheduler', 'cancel', 'com.quietmobile')
    phone.run('shell', 'am', 'force-stop', 'com.quietmobile')
    # pidof exits 1 when absent. Query through a shell to keep that expected result.
    pids = phone.run('shell', 'pidof com.quietmobile || true').strip()
    if pids:
        raise RuntimeError('Mobile app is still running after force-stop')


def channel(phone):
    tree = phone.dump()
    if phone.find(tree, 'chat_general') is None:
        phone.general()


def run(phone, peer, username, scenario, output, background_seconds=20, live_timeout=180, reply_timeout=180):
    token = uuid.uuid4().hex[:12]
    result = {'scenario': scenario, 'token': token, 'startedAtUnix': time.time()}
    start = None
    try:
        channel(phone)
        if scenario == 'live':
            incoming = 'Desktop live ' + token
            start = time.monotonic()
            sent = peer.submit('send', message=incoming)
            phone.wait(incoming, live_timeout)
            result['desktopToMobileSeconds'] = time.monotonic() - start
            peer.result(sent)
            reply = 'Mobile live ' + token
            phone.input(reply)
            button = phone.wait('send_message_button')
            start = time.monotonic()
            phone.tap_node(button)
            peer.wait_exact(reply, username, reply_timeout)
            result['mobileToDesktopSeconds'] = time.monotonic() - start
        elif scenario == 'resume':
            phone.run('shell', 'input', 'keyevent', '3')
            result['backgroundSeconds'] = background_seconds
            time.sleep(background_seconds)
            message = 'Background queued ' + token
            peer.call('send', message=message)
            start = time.monotonic()
            phone.run('shell', 'am', 'start', '-n', 'com.quietmobile/.MainActivity')
            phone.wait(message, 180)
            result['resumeToVisibleSeconds'] = time.monotonic() - start
        elif scenario == 'offline':
            stop_phone(phone)
            message = 'QSS offline ' + token
            peer.call('send', message=message)
            stopped = peer.call('stop')
            if not stopped.get('result', {}).get('processExitVerified'):
                raise RuntimeError('Desktop process exit was not verified')
            result['desktopExitVerified'] = True
            result['mobileExitVerified'] = True
            start = time.monotonic()
            phone.run('shell', 'am', 'start', '-n', 'com.quietmobile/.MainActivity')
            phone.wait('channel_tile_general', 180)
            phone.general()
            phone.wait(message, 180)
            result['coldStartToQssMessageSeconds'] = time.monotonic() - start
        else:
            raise ValueError('Unknown scenario')
        result['passed'] = True
    except Exception as error:
        result.update(passed=False, error=str(error))
        if start is not None:
            result['failedAfterSeconds'] = time.monotonic() - start
        raise
    finally:
        private_json(output, result)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adb', required=True)
    parser.add_argument('--serial', required=True)
    parser.add_argument('--peer', required=True)
    parser.add_argument('--username', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--scenario', choices=['live', 'resume', 'offline'], required=True)
    args = parser.parse_args()
    phone = Android(args.adb, args.serial, Path(args.output).with_suffix('.ui'))
    print(json.dumps(run(phone, Peer(args.peer), args.username, args.scenario, args.output)))
