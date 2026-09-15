#!/usr/bin/env python3
"""Instrument a reviewed integrated development build with an explicit identity."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
from prepare_bundle import instrument


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--sha256', required=True)
    parser.add_argument('--quiet-commit', required=True)
    parser.add_argument('--auth-commit', required=True)
    args = parser.parse_args()
    if args.source.resolve() == args.output.resolve():
        raise ValueError('Output must differ from source')
    if not re.fullmatch('[0-9a-f]{64}', args.sha256):
        raise ValueError('Require full build SHA256')
    if any(not re.fullmatch('[0-9a-f]{40}', value) for value in [args.quiet_commit, args.auth_commit]):
        raise ValueError('Require full source commit IDs')
    raw = args.source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != args.sha256:
        raise ValueError('Build does not match reviewed SHA256')
    output, modules = instrument(raw.decode())
    # The production webpack loader must already be part of this build. Do not
    # inject the runtime fix from a separate file during combined validation.
    if './platform/sodium-native.cjs' not in output:
        raise ValueError('Integrated build is missing native sodium module')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output)
    shutil.copy2(Path(__file__).with_name('runtime.cjs'), args.output.with_name('quiet-profile-runtime.cjs'))
    receipt = {'sourceSha256': args.sha256, 'instrumentedSha256': hashlib.sha256(output.encode()).hexdigest(),
               'quietCommit': args.quiet_commit, 'authCommit': args.auth_commit, 'instrumentedModules': modules,
               'purpose': 'Instrument reviewed integrated runtime; no runtime fix injected by profiler'}
    args.output.with_suffix('.integrated-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
