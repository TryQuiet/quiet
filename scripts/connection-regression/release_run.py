#!/usr/bin/env python3
"""Run an identified, untouched Android release against its dedicated UI peer."""
import argparse
import json
from pathlib import Path
import time
import subprocess
import shlex
from android import Android
from cold_tor import events
from scenarios import Peer, private_json, run, stop_phone
from tor_only import load_fixture, tor_only


def validate(config, peer, fixture):
    releases = json.loads(Path(__file__).with_name('releases.json').read_text())
    release = next(r for r in releases if r['version'] == config['release'])
    if peer['release'] != release['version']:
        raise ValueError('Desktop and mobile release do not match')
    if fixture['qssCommit'] != release['qssCommit']:
        raise ValueError('QSS does not match the release pin')
    if fixture['qssAuthCommit'] != release['qssAuthCommit']:
        raise ValueError('QSS auth does not match the release pin')
    return release


def join(phone, config, invitation, output):
    remote = config.get('remoteJoin')
    if remote is None:
        start=time.monotonic()
        result=phone.join(invitation,config['username'])
        return {**result,'wholeUiSeconds':time.monotonic()-start}
    # Keep native keyboard/dump pacing identical to running the driver on the
    # emulator host. A fresh SSH handshake per key event changes onboarding time.
    request_path=str(Path(remote['root'])/(output.name+'-join.json'))
    request=json.dumps({'action':'join','invitation':invitation,'username':config['username']}).encode()
    writer=[remote['python'],'-c',
            'import pathlib,sys,os;p=pathlib.Path(sys.argv[1]);p.write_bytes(sys.stdin.buffer.read());os.chmod(p,0o600)',request_path]
    subprocess.run(['ssh','-o','BatchMode=yes',remote['host'],shlex.join(writer)],input=request,check=True,timeout=30)
    command=['env','ADB_SERVER_SOCKET='+remote['adbSocket'],remote['python'],
             str(Path(remote['root'])/'android.py'),'--adb',remote['adb'],'--serial',config['serial'],
             '--output',str(Path(remote['root'])/(output.name+'-ui')),'--request',request_path]
    with (output/'join.private.log').open('w+') as log:
        subprocess.run(['ssh','-o','BatchMode=yes',remote['host'],shlex.join(command)],stdout=log,stderr=subprocess.STDOUT,check=True,timeout=480)
        log.seek(0);reply=json.loads(log.read().splitlines()[-1])
    return {**reply['result'],'wholeUiSeconds':reply['elapsedSeconds']}


def main(config):
    output = Path(config['output']).resolve()
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    ready = json.loads((Path(config['peer'])/'ready.json').read_text())
    _, fixture = load_fixture(config['fixture'])
    release = validate(config, ready, fixture)
    phone = Android(config['adb'], config['serial'], output/'ui')
    peer = Peer(config['peer'])
    installed = phone.run('shell','pm','list','packages','com.quietmobile').splitlines()
    if 'package:com.quietmobile' in installed:
        stop_phone(phone)
        phone.run('uninstall', 'com.quietmobile')
    # This runner is for a dedicated emulator and intentionally resets only its
    # Quiet test installation. Uninstall permits downgrading release APKs.
    phone.run('install', config['apk'])
    port = fixture['port']
    phone.run('reverse', f'tcp:{port}', f'tcp:{port}')
    preflight = phone.preflight(port)
    if preflight['installedApkSha256'] != release['apkSha256']:
        raise ValueError('Installed APK is not the pinned official release')
    private_json(output/'preflight.json', preflight)
    phone.run('logcat', '-c')
    result = {'release':config['release'], 'phases':{}, 'startedAtUnix':time.time()}
    phone.run('shell','am','start','-n','com.quietmobile/.MainActivity')

    def capture(name):
        raw = phone.run('logcat','-d','-v','epoch')
        (output/f'{name}.private.log').write_text(raw)
        pid = int(phone.run('shell','pidof','com.quietmobile').strip())
        private_json(output/f'{name}.events.json', events(raw,pid))

    try:
        result['phases']['join'] = {'passed':True, **join(phone,config,ready['invitation'],output)}
        capture('after-join')
        print(json.dumps({'release':config['release'],'join':result['phases']['join']}),flush=True)
        result['phases']['live'] = run(phone,peer,config['username'],'live',output/'live.json')
        capture('after-live')
        print(json.dumps({'release':config['release'],'live':result['phases']['live']}),flush=True)
        result['phases']['tor'] = tor_only(phone,peer,config['username'],config['fixture'],
                                          output/'tor.json',config.get('desktopLog'))
        result['passed'] = True
        print(json.dumps({'release':config['release'],'tor':result['phases']['tor']}),flush=True)
    except Exception as error:
        result.update(passed=False,error=str(error))
        raise
    finally:
        try:
            capture('final')
        except Exception as error:
            result.update(passed=False,captureError=str(error))
        private_json(output/'result.json',result)
    return result


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--config',required=True,help='Private run configuration JSON')
    args=p.parse_args()
    main(json.loads(Path(args.config).read_text()))
