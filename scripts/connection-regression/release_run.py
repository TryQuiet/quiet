#!/usr/bin/env python3
"""Run a verified Android release or labeled control against its dedicated UI peer."""
import argparse
import json
from pathlib import Path
import time
import subprocess
import shlex
from android import Android
from fast_android import FastAndroid
from patch_tor_control import verify as verify_tor_control
from cold_tor import events, app_pid
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
        elapsed=time.monotonic()-start
        return {**result,'wholeUiSeconds':result.get('wholeUiSeconds',elapsed),'controllerSeconds':elapsed}
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


def expected_artifact(config, release):
    control=config.get('controlApk')
    if control is None:
        return release['apkSha256'], {'artifact':'official'}
    receipt=verify_tor_control(control['source'],control['apk'])
    if receipt['sourceApkSha256'] != release['apkSha256']:
        raise ValueError('Diagnostic control is based on a different release')
    return receipt['controlApkSha256'], {'artifact':'androidProcessQueryFix','controlReceipt':receipt}


def main(config):
    output = Path(config['output']).resolve()
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    ready = json.loads((Path(config['peer'])/'ready.json').read_text())
    _, fixture = load_fixture(config['fixture'])
    release = validate(config, ready, fixture)
    expected_sha,artifact=expected_artifact(config,release)
    phases=config.get('transportOrder',['live','tor'])
    if phases not in [['live','tor'],['tor','live']]:
        raise ValueError('Expected each bidirectional transport phase exactly once')
    driver=config.get('driver','uiautomator-cli')
    if driver not in ['uiautomator-cli','instrumentation']:
        raise ValueError('Unknown Android UI driver')
    if driver=='instrumentation' and config.get('remoteJoin') is not None:
        raise ValueError('The instrumentation driver cannot be combined with remoteJoin')
    phone_type=FastAndroid if driver=='instrumentation' else Android
    phone = phone_type(config['adb'], config['serial'], output/'ui')
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
    if preflight['installedApkSha256'] != expected_sha:
        raise ValueError('Installed APK does not match the verified release artifact')
    if driver=='instrumentation':
        driver_package=phone.run('shell','pm','path','org.quiet.connectiondriver').strip()
        if not driver_package.startswith('package:') or '\n' in driver_package:
            raise ValueError('Expected the standalone UI driver to be installed')
        preflight['instrumentationApkSha256']=phone.run('shell','sha256sum',driver_package.removeprefix('package:')).split()[0]
    private_json(output/'preflight.json', preflight)
    phone.run('logcat', '-c')
    result = {'release':config['release'], **artifact,'driver':driver,'transportOrder':phases,
              'phases':{}, 'startedAtUnix':time.time()}
    phone.run('shell','am','start','-n','com.quietmobile/.MainActivity')

    def capture(name):
        raw = phone.run('logcat','-d','-v','epoch')
        (output/f'{name}.private.log').write_text(raw)
        pid = app_pid(phone)
        private_json(output/f'{name}.events.json', events(raw,pid))

    try:
        result['phases']['join'] = {'passed':True, **join(phone,config,ready['invitation'],output)}
        capture('after-join')
        print(json.dumps({'release':config['release'],'join':result['phases']['join']}),flush=True)
        for phase in phases:
            if phase=='live':
                measured=run(phone,peer,config['username'],'live',output/'live.json')
            else:
                measured=tor_only(phone,peer,config['username'],config['fixture'],
                                  output/'tor.json',config.get('desktopLog'))
            result['phases'][phase]=measured
            capture('after-'+phase)
            print(json.dumps({'release':config['release'],phase:measured}),flush=True)
        result['passed'] = True
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
