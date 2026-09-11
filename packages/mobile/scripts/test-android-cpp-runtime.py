#!/usr/bin/env python3
"""Check the actual APK for a second C++ runtime in the JNI bridge.

Usage: test-android-cpp-runtime.py app.apk /path/to/llvm-nm /path/to/llvm-readelf
The Android restart E2E exercises the corresponding runtime/load-order failure.
"""

import pathlib
import subprocess
import sys
import tempfile
import zipfile


def check(apk_path, nm, readelf):
    with zipfile.ZipFile(apk_path) as apk, tempfile.TemporaryDirectory() as temporary:
        bridges = [name for name in apk.namelist() if name.endswith('/libown-native-lib.so')]
        assert bridges, 'APK must contain the production JNI bridge'
        for name in bridges:
            abi = name.split('/')[1]
            directory = pathlib.Path(temporary) / abi
            directory.mkdir()
            assert f'lib/{abi}/libc++_shared.so' in apk.namelist(), f'{abi}: missing shared C++ runtime'
            for library in ['libown-native-lib.so', 'libnode.so', 'libreactnative.so']:
                target = directory / library
                target.write_bytes(apk.read(f'lib/{abi}/{library}'))
                dynamic = subprocess.check_output([readelf, '-d', str(target)], text=True)
                assert any('NEEDED' in line and 'libc++_shared.so' in line for line in dynamic.splitlines()), (
                    f'{abi}/{library}: must use the shared C++ runtime'
                )
            symbols = subprocess.check_output(
                [nm, '-D', '--defined-only', '--demangle', str(directory / 'libown-native-lib.so')], text=True
            )
            # A static libc++ exported locale/iostream definitions that interposed
            # React Native's glog calls and freed an incompatible buffer on restart.
            for symbol in ['std::__ndk1::locale::~locale()', 'vtable for std::__ndk1::basic_ostringstream']:
                assert symbol not in symbols, f'{abi}: JNI bridge exports its own runtime: {symbol}'
            print(f'{abi}: Node, React Native and the JNI bridge share libc++')


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    check(*sys.argv[1:])
