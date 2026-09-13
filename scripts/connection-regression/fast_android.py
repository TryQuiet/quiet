"""Visible Android UI driven by a standalone, separately installed instrumentor."""
import json
import shlex
import subprocess
import time
import xml.etree.ElementTree as ET
from android import Android


def parse_result(output):
    lines=[line.removeprefix('INSTRUMENTATION_RESULT: result=') for line in output.splitlines()
           if line.startswith('INSTRUMENTATION_RESULT: result=')]
    if len(lines)!=1:
        raise RuntimeError('Android UI driver returned no unique result')
    result=json.loads(lines[0])
    if not result.get('passed') or 'INSTRUMENTATION_CODE: -1' not in output.splitlines():
        raise RuntimeError('Android UI driver failed: '+str(result.get('error','missing success status')))
    return result


class FastAndroid(Android):
    def instrument(self, action, **values):
        request={'action':action,**values}
        command=['am','instrument','-w','-r','-e','request',json.dumps(request),
                 'org.quiet.connectiondriver/.Driver']
        output=self.output/f'instrument-{time.time_ns()}.private.log'
        try:
            with output.open('w+') as log:
                subprocess.run([*self.command,'shell',shlex.join(command)],check=True,
                               timeout=max(300,values.get('timeoutSeconds',0)+30),
                               stdout=log,stderr=subprocess.STDOUT)
                log.seek(0)
                return parse_result(log.read())
        except subprocess.TimeoutExpired:
            # Retire only our driver so a failed UI wait cannot hold Android's
            # UiAutomation session and block the next test.
            self.run('shell','am','force-stop','org.quiet.connectiondriver')
            raise

    def join(self, invitation, username):
        return self.instrument('join',invitation=invitation,username=username)

    def input(self, text):
        self.instrument('input',text=text)

    def general(self):
        self.instrument('general')

    def wait(self, value, timeout=120):
        result=self.instrument('wait',value=value,timeoutSeconds=timeout)
        return ET.Element('node',{'bounds':result['bounds'],'text':value})
