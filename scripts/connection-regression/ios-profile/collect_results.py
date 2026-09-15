#!/usr/bin/env python3
"""Export only measurements and checksums from private profiling captures."""
import argparse
import hashlib
import json
from pathlib import Path
from summarize_cpu import summarize


METRICS = ['LFA.keyMap', 'LFA.assertValidKeyset', 'LFA.open',
           'sodium.crypto_sign_seed_keypair', 'sodium.crypto_scalarmult_base',
           'sodium.crypto_box_open_easy', 'sodium.crypto_sign_verify_detached',
           'crypto.symmetric.decryptBytes', 'CryptoService.decryptAndVerify',
           'PublicChannelMessagesService.onConsume.wall', 'ChannelStore.getEntries.wall']
FIELDS = ['phase', 'users', 'role', 'requested', 'completed', 'censored', 'count',
          'ms', 'cpu', 'consumeCalls', 'timingClaim', 'productionFix']


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def collect(phone, local):
    result = {'schema': 1, 'release': '10.0.0-alpha.0',
              'quietCommit': 'edd51028f3c66c30d0692e8833fa7d0a7266b242',
              'authCommit': '6f534c89bceb875e8c71997943e5e76e48ccbd88',
              'phone': {'model': 'iPhone 16e', 'os': 'iOS 18.5'},
              'runs': {}, 'cpuProfiles': {}, 'sourceChecksums': {}}
    result['instrumentation'] = json.loads((local / 'instrumented/bundle.profile-receipt.json').read_text())
    result['fixtureMessageCount'] = len(json.loads((local / 'fixtures/messages.json').read_text()))
    runtime = json.loads((phone / 'runtime.json').read_text())
    result['phone'].update({k: runtime[k] for k in ['versions', 'platform', 'arch', 'webAssemblyType']})
    runs = {name: phone / name for name in ['ios-smoke', 'ios-message-scale', 'ios-user-scale', 'ios-history-control']}
    runs.update({name: local / name for name in ['local-native', 'local-no-wasm', 'local-jitless']})
    for name, directory in runs.items():
        assert json.loads((directory / 'complete.json').read_text())['passed'] is True, name
        source = directory / 'results.json'
        result['sourceChecksums'][name + '/results.json'] = digest(source)
        rows = []
        for row in json.loads(source.read_text()):
            clean = {key: row[key] for key in FIELDS if key in row}
            clean['metrics'] = {key: row['metrics'][key] for key in METRICS if key in row.get('metrics', {})}
            rows.append(clean)
        result['runs'][name] = rows
    for source in sorted(phone.glob('*.cpuprofile')):
        result['sourceChecksums'][source.name] = digest(source)
        result['cpuProfiles'][source.stem] = summarize(json.loads(source.read_text()))
    receipt = local / 'fixtures/receipts.json'
    result['fixtures'] = [{k: v for k, v in r.items() if k != 'elapsedSeconds'} for r in json.loads(receipt.read_text())]
    for source in sorted((local / 'fixtures').glob('*.json')):
        result['sourceChecksums']['fixtures/' + source.name] = digest(source)
    assert any(r.get('completed') == 1000 and not r.get('censored') for r in result['runs']['ios-message-scale'])
    assert any(r['phase'] == 'load' and r['users'] == 100 for r in result['runs']['ios-user-scale'])
    assert any(r.get('consumeCalls') == 501500 for r in result['runs']['ios-history-control'])
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--phone', type=Path, required=True)
    parser.add_argument('--local', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.write_text(json.dumps(collect(args.phone, args.local), indent=2) + '\n')
