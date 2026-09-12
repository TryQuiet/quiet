import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile
import unittest


class SshAdapterTest(unittest.TestCase):
    def test_arguments_pid_and_exit_status_survive_adapter(self):
        with tempfile.TemporaryDirectory() as root:
            root = Path(root)
            fake = root/'ssh'
            fake.write_text('#!'+sys.executable+'\n'
                            'import json,os,sys\n'
                            'print(json.dumps({"pid":os.getpid(),"args":sys.argv[1:]}),flush=True)\n'
                            'sys.exit(17)\n')
            fake.chmod(0o700)
            arguments = ['-s','emulator-5596','shell','input text "a;b $(private)"']
            env = {**os.environ,'PATH':str(root)+os.pathsep+os.environ['PATH'],
                   'REMOTE_HOST':'test@host','REMOTE_ADB_SOCKET':'tcp:5043',
                   'REMOTE_ADB':'/a path/adb'}
            process = subprocess.Popen([sys.executable,str(Path(__file__).with_name('adb_ssh.py')),*arguments],
                                       env=env,stdout=subprocess.PIPE,text=True)
            stdout, _ = process.communicate(timeout=10)
            result = json.loads(stdout)
            self.assertEqual(process.returncode,17)
            self.assertEqual(result['pid'],process.pid)
            self.assertEqual(result['args'][-2],'test@host')
            self.assertEqual(shlex.split(result['args'][-1]),
                             ['env','ADB_SERVER_SOCKET=tcp:5043','/a path/adb',*arguments])
