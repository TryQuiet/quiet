#!/usr/bin/env python3
"""Export only numeric/native-crypto validation evidence from private captures."""
import argparse
import hashlib
import json
from pathlib import Path
import statistics


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('private_directory', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    root = args.private_directory
    hashes = {}
    def read(relative):
        raw = (root / relative).read_bytes()
        hashes[relative] = hashlib.sha256(raw).hexdigest()
        return json.loads(raw)
    def sanitize(row):
        keep = {'phase', 'users', 'role', 'requested', 'completed', 'censored', 'count', 'ms', 'cpu', 'productionFix'}
        result = {key: value for key, value in row.items() if key in keep}
        if 'metrics' in row:
            result['metrics'] = {key: {k: v for k, v in value.items() if k in {'calls', 'totalMs', 'selfMs', 'maxMs', 'errors'}} for key, value in row['metrics'].items()}
        return result
    automatic = read('native-ios-automatic/complete.json')
    if automatic != {'passed': True, 'repeats': 3}:
        raise ValueError('Require all three automatic-startup repeats')
    repeats = []
    for number in range(1, 4):
        rows = read(f'native-ios-automatic/repeat-{number}/results.json')
        row = next(row for row in rows if row['phase'] == 'decryptAndVerify')
        if row['requested'] != 1000 or row['completed'] != 1000 or row['censored']:
            raise ValueError('Incomplete native message run')
        expected_calls = {'crypto_sign_verify_detached': 1000, 'crypto_sign_seed_keypair': 13000, 'crypto_scalarmult_base': 13000, 'crypto_box_open_easy': 3000}
        for primitive, calls in expected_calls.items():
            if row['metrics']['sodium.' + primitive]['calls'] != calls:
                raise ValueError('Unexpected crypto work count: ' + primitive)
        repeats.append(sanitize(row))
    checks = read('native-ios-security-proven/checks.json')
    if len(checks) != 9 or not all(item['passed'] for item in checks):
        raise ValueError('Require independent-reference security checks')
    activation = read('native-ios-automatic/activation.json')
    if activation['nativeCallsForPublicDerivation'] != 1 or activation['platform'] != 'ios':
        raise ValueError('Require automatic iOS activation proof')
    data = {
        'scope': 'Native primitives only; unchanged released LFA and ChannelStore algorithms',
        'runtime': activation,
        'automaticMessageRepeats': repeats,
        'automaticMessageMedianMs': statistics.median(row['ms'] for row in repeats),
        'prototypeScale': [sanitize(row) for row in read('native-ios-scale/results.json')],
        'securityChecks': checks,
        'buildReceipt': read('automatic/bundle.native-receipt.json'),
        'evidenceSha256': hashes,
    }
    args.output.write_text(json.dumps(data, indent=2) + '\n')


if __name__ == '__main__':
    main()
