#!/usr/bin/env python3
"""Measure released backend Tor readiness and peer connection on real restarts."""
import argparse
import json
from pathlib import Path
import re
import time
from android import Android
from scenarios import private_json, stop_phone

EVENTS = {
    'torInit': 'INFO backend:Tor Initializing tor...',
    'falseMissingProcess': 'WARN backend:Tor Managed Tor process disappeared during bootstrap; restarting Tor',
    'fallbackCheck': 'DEBUG backend:Tor Checking init timeout',
    'torReady': 'INFO backend:Tor Bootstrapping finished!',
    'peerConnected': 'DEBUG backend:Libp2pService Connection established with ',
}


def events(log, pid):
    result = {}
    for line in log.splitlines():
        match = re.match(r'^\s*(\d+\.\d+)\s+(\d+)\s+\d+\s+[A-Z]\s+', line)
        if not match or int(match[2]) != pid:
            continue
        for key, text in EVENTS.items():
            if text in line and key not in result and (key != 'peerConnected' or '.onion/' in line):
                result[key] = float(match[1])
    return result


def trial(phone, output, timeout=240):
    output = Path(output)
    stop_phone(phone)
    phone.run('logcat', '-c')
    started = time.time()
    phone.run('shell', 'am', 'start', '-n', 'com.quietmobile/.MainActivity')
    pid = int(phone.run('shell', 'pidof', 'com.quietmobile').strip())
    deadline = time.monotonic() + timeout
    result = {'startedAtUnix': started, 'pid':pid, 'timeoutSeconds':timeout}
    try:
        while time.monotonic() < deadline:
            raw = phone.run('logcat', '-d', '-v', 'epoch')
            output.with_suffix('.private.log').write_text(raw)
            observed = events(raw, pid)
            result['events'] = observed
            if 'torInit' in observed and 'torReady' in observed:
                result['torInitToReadySeconds'] = observed['torReady'] - observed['torInit']
            if 'peerConnected' in observed:
                result['launchToPeerSeconds'] = observed['peerConnected'] - started
                result['passed'] = True
                result['torReadyFlagSeen'] = 'torReady' in observed
                break
            time.sleep(2)
        else:
            result['passed'] = False
            result['error'] = 'No Tor peer connection before deadline'
    except Exception as error:
        result.update(passed=False, error=str(error))
        raise
    finally:
        private_json(output, result)
    return result


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    for name in ['adb', 'serial', 'output']:
        p.add_argument('--'+name, required=True)
    p.add_argument('--qss-port', type=int, required=True)
    p.add_argument('--trials', type=int, default=3)
    p.add_argument('--wait-connected-first', action='store_true')
    args = p.parse_args()
    output=Path(args.output);output.mkdir(parents=True, exist_ok=True, mode=0o700)
    phone=Android(args.adb, args.serial, output/'ui')
    private_json(output/'preflight.json', phone.preflight(args.qss_port))
    if args.wait_connected_first:
        pid=int(phone.run('shell','pidof','com.quietmobile').strip())
        deadline=time.monotonic()+240
        while time.monotonic()<deadline:
            raw=phone.run('logcat','-d','-v','epoch')
            observed=events(raw,pid)
            (output/'warmup.private.log').write_text(raw)
            if 'peerConnected' in observed:
                private_json(output/'warmup.json', {'passed':True,'pid':pid,'events':observed})
                print(json.dumps({'initialPeerConnected':True}),flush=True)
                break
            time.sleep(2)
        else:
            private_json(output/'warmup.json', {'passed':False,'pid':pid,'error':'No Tor peer connection before warm-up deadline'})
            raise TimeoutError('Warm-up never established a Tor peer connection')
    all_passed = True
    for index in range(args.trials):
        result=trial(phone, output/f'trial-{index+1}.json')
        print(json.dumps({'trial':index+1, **result}),flush=True)
        all_passed = all_passed and result.get('passed', False)
    if not all_passed:
        raise SystemExit(1)
