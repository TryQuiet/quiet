#!/usr/bin/env python3
"""Add an emulator ABI to a release APK without rewriting application code.

The output must be zipaligned and signed with a disposable test key. Native
libraries are explicit inputs; this is a synthetic architecture experiment.
"""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

INDEX_ADDITIONS = {
    'assets/dir.list': b'nodejs-project/x64\nnodejs-project/x64/classic-level\n',
    'assets/file.list': b'nodejs-project/x64/classic-level/classic_level.node\n',
}

def digest(data):
    return hashlib.sha256(data).hexdigest()


def protected(name):
    return not name.startswith('META-INF/') and name not in INDEX_ADDITIONS


def prepare(source, destination, libraries, binding, tor):
    source, destination, libraries = map(Path, (source, destination, libraries))
    with zipfile.ZipFile(source) as original:
        expected = {Path(n).name for n in original.namelist() if n.startswith('lib/arm64-v8a/')}
        actual = {p.name for p in libraries.glob('*.so') if p.name != 'libtor8.so'}
        if actual != expected:
            raise ValueError(f'Native library set differs: missing={expected-actual}, extra={actual-expected}')
        additions = {f'lib/x86_64/{name}': (libraries / name).read_bytes() for name in expected}
        additions['lib/x86_64/libtor.so'] = Path(tor).read_bytes()
        additions['assets/nodejs-project/x64/classic-level/classic_level.node'] = Path(binding).read_bytes()
        if set(original.namelist()) & additions.keys():
            raise ValueError('Input already contains emulator assets')
        with zipfile.ZipFile(destination, 'x', compression=zipfile.ZIP_DEFLATED) as result:
            for entry in original.infolist():
                if protected(entry.filename):
                    result.writestr(entry, original.read(entry))
            for name, data in additions.items():
                result.writestr(name, data)
            for name, data in INDEX_ADDITIONS.items():
                result.writestr(name, original.read(name) + data)
    hashes = {name: digest(data) for name, data in additions.items()}
    receipt = verify(source, destination, hashes)
    receipt['addedSha256'] = hashes
    return receipt


def verify(source, result, additions):
    with zipfile.ZipFile(source) as before, zipfile.ZipFile(result) as after:
        names = [n for n in before.namelist() if protected(n)]
        if len(after.namelist()) != len(set(after.namelist())):
            raise ValueError('Duplicate APK entries')
        if {n for n in after.namelist() if protected(n)} != set(names) | set(additions):
            raise ValueError('Unexpected application entries added or removed')
        changed = [n for n in names if before.read(n) != after.read(n)]
        for name, extra in INDEX_ADDITIONS.items():
            if after.read(name) != before.read(name) + extra:
                raise ValueError(f'Unexpected native asset index change: {name}')
        if changed:
            raise ValueError(f'Release application content changed: {changed}')
        if not isinstance(additions, dict):
            raise ValueError('Expected native entry SHA-256 manifest')
        for name, expected_hash in additions.items():
            if digest(after.read(name)) != expected_hash:
                raise ValueError(f'Native dependency changed: {name}')
        return {
            'sourceApkSha256': digest(Path(source).read_bytes()),
            'resultApkSha256': digest(Path(result).read_bytes()),
            'unchangedReleaseEntries': len(names),
            'frontendSha256': digest(before.read('assets/index.android.bundle')),
            'backendSha256': digest(before.read('assets/nodejs-project/bundle.cjs')),
            'syntheticArchitecture': 'x86_64',
        }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ['source', 'destination', 'libraries', 'binding', 'tor']:
        parser.add_argument('--' + key, required=True)
    args = parser.parse_args()
    receipt = prepare(**vars(args))
    Path(args.destination + '.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2))
