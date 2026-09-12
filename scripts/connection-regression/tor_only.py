#!/usr/bin/env python3
"""Require bidirectional UI delivery while the owned QSS process is paused."""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
from android import Android
from scenarios import Peer, private_json, run


def load_fixture(directory):
    source = Path(__file__).resolve().parents[2] / 'packages/mobile/scripts/qss-e2e/fixture.py'
    spec = importlib.util.spec_from_file_location('qss_fixture', source)
    fixture = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(fixture)
    return fixture, fixture.load_manifest(Path(directory).resolve())


def paused(manifest):
    prefix = ['sudo', '-n'] if manifest['sudoDocker'] else []
    name = manifest['project'] + '-qss-1'
    value = subprocess.check_output(prefix + ['docker', 'inspect', '--format', '{{.State.Paused}}', name], timeout=15)
    return value.strip() == b'true'


def tor_only(phone, peer, username, fixture_directory, output, desktop_log=None):
    fixture, manifest = load_fixture(fixture_directory)
    if paused(manifest):
        raise RuntimeError('Fixture was already paused before this test')
    try:
        fixture.compose(manifest, 'pause', 'qss', timeout=30)
        if not paused(manifest):
            raise RuntimeError('QSS pause was not verified')
        result = run(phone, peer, username, 'live', output, live_timeout=600)
        # A fresh random token is generated after QSS stops. No client can have
        # fetched it from storage before isolation. Both UI directions must pass.
        if not paused(manifest):
            raise RuntimeError('QSS resumed before delivery completed')
        result.update(qssPausedThroughout=True, transport='tor', qssCommit=manifest['qssCommit'])
        private_json(output, result)
        return result
    except Exception as error:
        diagnostics = {}
        if desktop_log is not None:
            request = Path(output).with_suffix('.snapshot-request.json')
            private_json(request, {'action':'snapshot','launchLog':str(desktop_log),
                                   'outputPrefix':str(Path(output).with_suffix('.failure'))})
            try:
                with Path(output).with_suffix('.snapshot.log').open('w') as log:
                    subprocess.run(['node',str(Path(__file__).with_name('desktop_command.cjs')),str(request),
                                    str(Path(output).with_suffix('.snapshot-result.json'))],
                                   stdout=log,stderr=subprocess.STDOUT,timeout=45,check=True)
            except Exception as snapshot_error:
                diagnostics['snapshotError'] = str(snapshot_error)
        previous = json.loads(Path(output).read_text()) if Path(output).exists() else {}
        private_json(output, {**previous, **diagnostics, 'passed':False, 'transport':'tor',
                              'qssPausedAtFailure':paused(manifest), 'error':str(error)})
        raise
    finally:
        fixture.compose(manifest, 'unpause', 'qss', timeout=30)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    for name in ['adb', 'serial', 'peer', 'username', 'fixture', 'output']:
        p.add_argument('--' + name, required=True)
    p.add_argument('--desktop-log')
    args = p.parse_args()
    phone = Android(args.adb, args.serial, Path(args.output).with_suffix('.ui'))
    print(json.dumps(tor_only(phone, Peer(args.peer), args.username, args.fixture, args.output, args.desktop_log)))
