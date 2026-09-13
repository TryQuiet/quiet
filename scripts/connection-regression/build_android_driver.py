#!/usr/bin/env python3
"""Build a standalone Android UI driver; no Quiet APK is rewritten."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile


def build(sdk, output, build_tools='35.0.0', platform='35'):
    sdk, output = Path(sdk).resolve(), Path(output).resolve()
    output.mkdir(mode=0o700)
    source = Path(__file__).with_name('android-driver')
    tools = sdk/'build-tools'/build_tools
    android = sdk/'platforms'/('android-'+platform)/'android.jar'
    classes, dex = output/'classes', output/'dex'
    classes.mkdir(); dex.mkdir()
    sources = sorted(source.rglob('*.java'))
    with (output/'build.log').open('w') as log:
        def run(*command):
            subprocess.run([str(c) for c in command], check=True, timeout=120,
                           stdout=log, stderr=subprocess.STDOUT)
        run('javac','-source','8','-target','8','-cp',android,'-d',classes,*sources)
        run(tools/'d8','--lib',android,'--min-api','21','--output',dex,*sorted(classes.rglob('*.class')))
        unsigned, aligned, apk = [output/n for n in ['unsigned.apk','aligned.apk','driver.apk']]
        run(tools/'aapt2','link','-o',unsigned,'--manifest',source/'AndroidManifest.xml','-I',android)
        with zipfile.ZipFile(unsigned,'a') as archive:
            archive.write(dex/'classes.dex','classes.dex')
        run(tools/'zipalign','-f','4',unsigned,aligned)
        key = output/'driver.jks'
        run('keytool','-genkeypair','-keystore',key,'-storepass','android','-keypass','android',
            '-alias','driver','-keyalg','RSA','-keysize','2048','-validity','3650',
            '-dname','CN=Quiet connection test driver','-noprompt')
        run(tools/'apksigner','sign','--ks',key,'--ks-key-alias','driver','--ks-pass','pass:android',
            '--key-pass','pass:android','--out',apk,aligned)
        run(tools/'apksigner','verify',apk)
    digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    receipt={'apkSha256':digest(apk),'package':'org.quiet.connectiondriver',
             'instrumentationTarget':'org.quiet.connectiondriver',
             'sourceSha256':{str(p.relative_to(source)):digest(p) for p in [source/'AndroidManifest.xml',*sources]}}
    (output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    return receipt


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sdk',required=True)
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    print(json.dumps(build(args.sdk,args.output)))
