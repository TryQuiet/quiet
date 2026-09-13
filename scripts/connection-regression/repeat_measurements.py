#!/usr/bin/env python3
"""Summarize the fixed five-pair Android experiment without hiding failures."""
import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import statistics
import subprocess

LINE = re.compile(r'^\s*(\d+\.\d+)\s+(\d+)\s+\d+\s+[A-Z]\s+')
INIT = 'INFO backend:Tor Initializing tor...'
CONNECTION = 'DEBUG backend:Libp2pService Connection established with '
DRIVER_SHA = 'c2e1cb095cc0e836f79d848304d0fb74841d7cf8739bc1b48788916ab7a9b51b'
IDENTITIES = {
    '8': ('8.0.0', 'official',
          '2811e53e0911fba1932a18ce2108cc6a8f8965906c3b47ac20706af9254e9733',
          '8796ab4abdd4559d08bae85cdfd0e219f49b31a3c4902f1520ee98e50c771497'),
    '10': ('10.0.0-alpha.0', 'androidProcessQueryFix',
           'd8cfd9661607060f7fd041ae92b7a1349b412c924bfa7426f6fb3a6d80bb9dc6',
           'b25b33be701f21ad62becbad9d0c2d7b713d3fb72fd4df9d314bfe86f9256a47'),
}
METRICS = ['joinSeconds', 'torInitToReadySeconds', 'torInitToFirstPeerSeconds',
           'qssDownSeconds', 'qssUpSeconds', 'torDownSeconds', 'torUpSeconds']


def bootstrap_replies(decoded, start):
    """Extract complete visible status replies; do not infer missing TCP data."""
    timestamp, last = None, None
    changes, count = [], 0
    for line in decoded.splitlines():
        if match := re.match(r'^(\d+\.\d+) IP', line):
            timestamp = float(match[1])
        match = re.search(r'250[- ]status/bootstrap-phase=.*?BOOTSTRAP PROGRESS=(\d+) TAG=([a-z_]+) SUMMARY="[^"]*"', line)
        if not match or timestamp is None or timestamp < start:
            continue
        count += 1
        state = (int(match[1]), match[2])
        if state != last:
            changes.append({'sinceTorInitSeconds': timestamp-start, 'progress': state[0], 'tag': state[1]})
            last = state
    return {'completeStatusRepliesObserved': count, 'progressChanges': changes,
            'torInitToObserved100PercentSeconds': next((r['sinceTorInitSeconds'] for r in changes if r['progress'] == 100), None)}


def native_measurements(raw):
    rows = [(float(m[1]), int(m[2]), line) for line in raw.splitlines()
            if (m := LINE.match(line))]
    initial = next(((ts, pid) for ts, pid, line in rows if INIT in line), None)
    if initial is None:
        raise ValueError('Startup log is missing Tor initialization; measurement is incomplete')
    start, pid = initial
    rows = [(ts, line) for ts, p, line in rows if p == pid and ts >= start]
    result = {'torInitUnix': start,
              'torInitializationCount': sum(INIT in line for _, line in rows),
              'torExit143Count': sum('Tor exited with code 143' in line for _, line in rows),
              'falseMissingProcessCount': sum('Managed Tor process disappeared during bootstrap' in line for _, line in rows),
              'onionAddressCollisionCount': sum('550 Onion address collision' in line for _, line in rows),
              'unhandledRejectionShutdownCount': sum('unhandledRejection received, initiating shutdown' in line for _, line in rows)}
    for name, predicate in [
        ('torInitToReadySeconds', lambda s: 'INFO backend:Tor Bootstrapping finished!' in s),
        ('torInitToFirstPeerSeconds', lambda s: CONNECTION in s),
        ('torInitToOutgoingPeerSeconds', lambda s: CONNECTION in s and '.onion/' in s),
    ]:
        event = next((ts for ts, line in rows if predicate(line)), None)
        result[name] = event - start if event is not None else None
    return result


def distribution(values, planned):
    observed = [v for v in values if v is not None]
    return {'planned': planned, 'observed': len(observed), 'missing': planned-len(observed),
            'mean': statistics.mean(observed) if observed else None,
            'median': statistics.median(observed) if observed else None,
            'min': min(observed) if observed else None,
            'max': max(observed) if observed else None}


def summarize(trials):
    expected = [(v, n) for n in range(1, 6) for v in ['8', '10']]
    if [(r['build'], r['pair']) for r in trials] != expected:
        raise ValueError('Expected all five pairs, in the fixed alternating order')
    groups = {}
    for build in ['8', '10']:
        rows = [r for r in trials if r['build'] == build]
        groups[build] = {'trials': 5, 'passed': sum(r['passed'] for r in rows),
                         'failed': sum(not r['passed'] for r in rows),
                         'metrics': {m: distribution([r.get(m) for r in rows], 5) for m in METRICS}}
    pairs = []
    for i in range(0, 10, 2):
        a, b = trials[i:i+2]
        pairs.append({'pair': a['pair'], 'bothPassed': a['passed'] and b['passed'],
                      'tenMinusEightSeconds': {m: b[m]-a[m] if a.get(m) is not None and b.get(m) is not None else None
                                               for m in METRICS}})
    return {'builds': groups, 'pairs': pairs}


def read_trial(directory, build, pair):
    def read(name): return json.loads((directory/name).read_text())
    result, preflight, runtime = read('result.json'), read('preflight.json'), read('runtime-bundle.json')
    identity = (result['release'], result['artifact'], preflight['installedApkSha256'], runtime['installedRuntimeSha256'])
    if identity != IDENTITIES[build]:
        raise ValueError('Measured artifact does not match the requested build')
    if not runtime['matchesExpected']:
        raise ValueError('Runtime bundle verification failed')
    if preflight['instrumentationApkSha256'] != DRIVER_SHA:
        raise ValueError('UI driver changed during the comparison')
    if not (preflight['api'] == 30 and preflight['abi'] == 'arm64-v8a' and preflight['nativeBridge'] == '0'
            and preflight['qssHealthFromAndroid'] and preflight['externalRoutePresent']):
        raise ValueError('Android environment or network preflight differs')
    native = native_measurements((directory/'final.private.log').read_text(errors='replace'))
    decoded = subprocess.run(['tcpdump', '-nn', '-tt', '-A', '-r', str(directory/'control.private.pcap')],
                             capture_output=True, text=True, check=True).stdout
    control = bootstrap_replies(decoded, native['torInitUnix'])
    complete = control['torInitToObserved100PercentSeconds']
    ready = native['torInitToReadySeconds']
    control['observed100PercentToReadySeconds'] = ready-complete if ready is not None and complete is not None else None
    peer = directory.with_name(directory.name+'-peer')
    desktop_ready = json.loads((peer/'ready.json').read_text())['readyAt']
    desktop_log = re.sub(r'\x1b\[[0-9;]*m', '', directory.with_name(directory.name+'-peer.log').read_text(errors='replace'))
    tor_ready_line = next(line for line in desktop_log.splitlines() if 'backend:Tor Bootstrapping finished!' in line)
    tor_ready = re.search(r'\d{4}-\d{2}-\d{2}T[\d:.]+Z', tor_ready_line)[0]
    epoch = lambda iso: datetime.fromisoformat(iso.replace('Z', '+00:00')).timestamp()
    phases = {**result['phases']}
    # A failing phase is saved separately before the runner raises. Preserve its
    # completed direction and failure status rather than silently dropping it.
    for name in ['live', 'tor']:
        if (directory/(name+'.json')).exists(): phases[name] = read(name+'.json')
    row = {'id': directory.name, 'build': build, 'pair': pair, 'release': result['release'],
           'artifact': result['artifact'], 'passed': result['passed'], 'native': native,
           'torControl': control,
           'desktopCommunityReadyBeforeMobileLaunchSeconds': result['startedAtUnix']-epoch(desktop_ready),
           'desktopTorReadyBeforeMobileLaunchSeconds': result['startedAtUnix']-epoch(tor_ready),
           'apkSha256': preflight['installedApkSha256'], 'runtimeSha256': runtime['installedRuntimeSha256'],
           'driverSha256': preflight['instrumentationApkSha256'],
           'joinSeconds': phases.get('join', {}).get('joinSeconds'),
           'torInitToReadySeconds': native['torInitToReadySeconds'],
           'torInitToFirstPeerSeconds': native['torInitToFirstPeerSeconds'],
           'phasePassed': {p: phases.get(p, {}).get('passed', False) for p in ['join', 'live', 'tor']},
           'phaseFailedAfterSeconds': {p: phases[p]['failedAfterSeconds'] for p in phases
                                       if 'failedAfterSeconds' in phases[p]},
           'qssPausedThroughout': phases.get('tor', {}).get('qssPausedThroughout'),
           'qssPausedAtFailure': phases.get('tor', {}).get('qssPausedAtFailure'),
           'evidenceSha256': {}}
    for phase, prefix in [('live', 'qss'), ('tor', 'tor')]:
        for field, suffix in [('desktopToMobileSeconds', 'DownSeconds'), ('mobileToDesktopSeconds', 'UpSeconds')]:
            row[prefix+suffix] = phases.get(phase, {}).get(field)
    if row['phasePassed']['tor'] and not row['qssPausedThroughout']:
        raise ValueError('Tor success lacks verified QSS isolation')
    if any(row[m] is not None for m in ['torDownSeconds', 'torUpSeconds']):
        if not (row['qssPausedThroughout'] or row['qssPausedAtFailure']):
            raise ValueError('Tor delivery lacks verified QSS isolation')
    evidence = ['result.json', 'preflight.json', 'runtime-bundle.json', 'final.private.log', 'control.private.pcap']
    evidence += [name for name in ['live.json', 'tor.json'] if (directory/name).exists()]
    for name in evidence:
        with (directory/name).open('rb') as f: row['evidenceSha256'][name] = hashlib.file_digest(f, 'sha256').hexdigest()
    return row


def main(base, output):
    trials = [read_trial(base/f'v{v}-trial{n}', v, n) for n in range(1, 6) for v in ['8', '10']]
    result = {'protocol': 'REPEAT5-PROTOCOL.md', 'date': '2026-09-13',
              'branch': 'fix/mobile-connection-regressions-8-9-10',
              'runtimeFixCommit': '3f8e4ac5e28476e9da15894574149b22f95f140e',
              'androidEnvironment': json.loads((base/'android-environment.json').read_text()),
              'systemImageVerification': json.loads((base/'system-image-verification.json').read_text()),
              'linuxDesktopProcessQuery': json.loads((base/'desktop-process-query.json').read_text()),
              'units': 'seconds', 'trials': trials, **summarize(trials)}
    output.write_text(json.dumps(result, indent=2)+'\n')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--runs', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    a = p.parse_args()
    main(a.runs, a.output)
