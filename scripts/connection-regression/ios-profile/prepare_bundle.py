#!/usr/bin/env python3
"""Instrument the exact released iOS webpack bundle; never edit the input."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil

ALPHA_SHA256 = 'f7c59197a41334684c0ee56439400653ce30823c11390c51fbbb87e96f5cde81'
EVAL = re.compile(r'^eval\(("(?:[^"\\]|\\.)*")\);', re.M)
START = 'var __webpack_exports__ = __webpack_require__(__webpack_require__.s = "./src/backendManager.ts");'


def instrument(source):
    changed = []

    def patch(match):
        body = json.loads(match.group(1))
        origin = re.search(r'//# sourceURL=webpack://@quiet/backend/(.*?)\?', body)
        name = origin.group(1) if origin else ''
        hooks = []
        if name == '../../3rd-party/auth/packages/auth/dist/index.js':
            for symbol in ['keyMap', 'visibleKeys', 'collectVisibleKeys', 'open', 'assertValidKeyset', 'keysetCommitment', 'decryptTeamGraph']:
                if not re.search(r'\b(?:var|function) ' + symbol + r'\b', body):
                    raise ValueError('Missing LFA symbol: ' + symbol)
                hooks.append(f'{symbol} = globalThis.__quietProfiler.sync("LFA.{symbol}", {symbol});')
        elif name == '../../3rd-party/auth/packages/crypto/dist/index.js':
            hooks.append('globalThis.__quietProfiler.sodium(libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_0__);')
            for obj in ['symmetric', 'asymmetric', 'signatures']:
                hooks.append(f'globalThis.__quietProfiler.object("crypto.{obj}", {obj});')
        else:
            classes = {
                './src/nest/auth/services/crypto/crypto.service.ts': 'CryptoService',
                './src/nest/storage/channels/messages/public-channel-messages.service.ts': 'PublicChannelMessagesService',
                './src/nest/storage/channels/channel.store.ts': 'ChannelStore',
            }
            cls = classes.get(name)
            if cls:
                hooks.append(f'globalThis.__quietProfiler.prototype("{cls}", {cls});')
        if not hooks:
            return match.group(0)
        if body.count('__webpack_async_result__();') != 1:
            raise ValueError('Unexpected async module boundary: ' + name)
        body = body.replace('__webpack_async_result__();', '\n'.join(hooks) + '\n__webpack_async_result__();')
        changed.append(name)
        return 'eval(' + json.dumps(body, ensure_ascii=True) + ');'

    output = EVAL.sub(patch, source)
    if len(changed) != 5 or source.count(START) != 1:
        raise ValueError(f'Unexpected bundle layout: {changed}')
    output = output.replace(START, '''globalThis.__quietProfiler = require("./quiet-profile-runtime.cjs");
globalThis.__quietProfiler.boot(__webpack_require__);
if (process.env.QUIET_PROFILE_EXPORT_ONLY === "1") {
  module.exports = { webpack: __webpack_require__, profiler: globalThis.__quietProfiler };
} else {
  ''' + START + '\n}')
    return output, changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    raw = args.source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != ALPHA_SHA256:
        raise ValueError('Source does not match the published iOS alpha payload')
    if args.source.resolve() == args.output.resolve():
        raise ValueError('Output must differ from the source')
    output, changed = instrument(raw.decode())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output)
    shutil.copy2(Path(__file__).with_name('runtime.cjs'), args.output.with_name('quiet-profile-runtime.cjs'))
    receipt = {'originalSha256': ALPHA_SHA256, 'instrumentedSha256': hashlib.sha256(output.encode()).hexdigest(), 'instrumentedModules': changed, 'purpose': 'Profiling only; modified backend payload, unchanged algorithms'}
    args.output.with_suffix('.profile-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
