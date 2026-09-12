#!/usr/bin/env python3
"""Diagnostic control: backport only the existing Android Tor PID detector fix.

This intentionally changes release backend code and MUST NOT be called an
untouched release. All other APK payload entries remain byte-identical.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
import zipfile

OLD = r'''android: `pgrep -af \"${this.torDataDirectory}\" | grep -v pgrep | awk '{print $1}'`'''.encode()
NEW = r'''android: `pgrep -f \"${this.torDataDirectory}\" | awk -v detector=\"$$\" '$1 != detector'`'''.encode()
BUNDLE = 'assets/nodejs-project/bundle.cjs'
FIX_COMMIT = 'f314294f4ba2947717e8d577d51e5c11fea1c29a'


def patch(source, output):
    with zipfile.ZipFile(source) as before:
        bundle = before.read(BUNDLE)
        if bundle.count(OLD) != 1:
            raise ValueError('Expected exactly one original Android Tor detector')
        patched = bundle.replace(OLD, NEW)
        with zipfile.ZipFile(output, 'x') as after:
            for entry in before.infolist():
                signature = re.fullmatch(r'META-INF/(?:MANIFEST\.MF|[^/]+\.(?:SF|RSA|DSA|EC))', entry.filename)
                if not signature:
                    after.writestr(entry, patched if entry.filename == BUNDLE else before.read(entry))
    return verify(source, output)


def payload(name):
    return re.fullmatch(r'META-INF/(?:MANIFEST\.MF|[^/]+\.(?:SF|RSA|DSA|EC))', name) is None


def verify(source, output):
    with zipfile.ZipFile(source) as before, zipfile.ZipFile(output) as after:
        names = [n for n in before.namelist() if payload(n)]
        if len(after.namelist()) != len(set(after.namelist())):
            raise ValueError('Duplicate control APK entries')
        if set(names) != {n for n in after.namelist() if payload(n)}:
            raise ValueError('Unexpected control APK entries')
        bundle = before.read(BUNDLE)
        patched = after.read(BUNDLE)
        if bundle.count(OLD) != 1 or patched != bundle.replace(OLD, NEW):
            raise ValueError('Control backend differs from the single intended replacement')
        changed = [name for name in names if before.read(name) != after.read(name)]
        if changed != [BUNDLE]:
            raise ValueError('Unexpected control APK changes')
    sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
    return {'sourceApkSha256':sha(source), 'controlApkSha256':sha(output),
            'changedEntries':changed, 'backendBeforeSha256':hashlib.sha256(bundle).hexdigest(),
            'backendAfterSha256':hashlib.sha256(patched).hexdigest(),
            'diagnosticControl':True, 'backportedFixCommit':FIX_COMMIT}


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source', required=True)
    p.add_argument('--output', required=True)
    args=p.parse_args()
    result=patch(args.source,args.output)
    Path(args.output+'.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))
