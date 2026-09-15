#!/usr/bin/env python3
"""Apply the native sodium adapter to the exact alpha payload for iPhone validation."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from prepare_bundle import ALPHA_SHA256, EVAL, instrument


def prepare(raw, adapter):
    if hashlib.sha256(raw).hexdigest() != ALPHA_SHA256:
        raise ValueError('Source does not match the published iOS alpha payload')
    output, modules = instrument(raw.decode())
    changes = 0

    def patch(match):
        nonlocal changes
        body = json.loads(match.group(1))
        if '/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js?' not in body:
            return match.group(0)
        body += '\nmodule.exports = require("./quiet-native-sodium.cjs").enable(module.exports);\n'
        changes += 1
        return 'eval(' + json.dumps(body, ensure_ascii=True) + ');'

    output = EVAL.sub(patch, output)
    if changes != 1:
        raise ValueError(f'Expected exactly one sodium module, found {changes}')
    return output, {
        'originalSha256': ALPHA_SHA256,
        'instrumentedSha256': hashlib.sha256(output.encode()).hexdigest(),
        'adapterSha256': hashlib.sha256(adapter).hexdigest(),
        'instrumentedModules': modules,
        'purpose': 'Native sodium runtime fix with profiling; unchanged LFA and message history logic',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--adapter', type=Path, default=Path(__file__).resolve().parents[3] / 'packages/backend/platform/sodium-native.cjs')
    args = parser.parse_args()
    if args.source.resolve() == args.output.resolve():
        raise ValueError('Output must differ from the source')
    raw_adapter = args.adapter.read_bytes()
    output, receipt = prepare(args.source.read_bytes(), raw_adapter)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output)
    args.output.with_name('quiet-native-sodium.cjs').write_bytes(raw_adapter)
    shutil.copy2(Path(__file__).with_name('runtime.cjs'), args.output.with_name('quiet-profile-runtime.cjs'))
    args.output.with_suffix('.native-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
