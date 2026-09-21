#!/usr/bin/env python3
"""Privileged integration tests: real namespaces/firewall rules and failure/cancellation."""
import json
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import unittest

SCRIPT = Path(__file__).with_name('run.py')


class Lifecycle(unittest.TestCase):
    def exercise(self, cancel):
        with tempfile.TemporaryDirectory() as directory:
            marker = Path(directory) / 'ready.json'
            # run.py separately measures bandwidth. Skip only that measurement,
            # exercising the real main/setup/cleanup paths here.
            bootstrap = f'''
import importlib.util, sys
spec = importlib.util.spec_from_file_location('network', {str(SCRIPT)!r})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.smoke = lambda players: None
sys.exit(module.main())
'''
            command = f'''
import json, os, pathlib, time
pathlib.Path({str(marker)!r}).write_text(json.dumps({{'players': json.loads(os.environ['QUIET_NETWORK_PLAYERS']), 'pid': os.getpid()}}))
{'time.sleep(120)' if cancel else 'raise SystemExit(23)'}
'''
            before = Path('/proc/sys/net/ipv4/ip_forward').read_text()
            child = subprocess.Popen([sys.executable, '-c', bootstrap, '--', sys.executable, '-c', command],
                                     stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            try:
                deadline = time.monotonic() + 20
                while not marker.exists() and child.poll() is None and time.monotonic() < deadline:
                    time.sleep(0.1)
                if not marker.exists():
                    child.terminate()
                    output = child.communicate(timeout=10)
                    self.fail(f'Test command never started: {output}')
                payload = json.loads(marker.read_text())
                players = payload['players']
                if cancel:
                    child.send_signal(signal.SIGTERM)
                stdout, stderr = child.communicate(timeout=15)
                self.assertEqual(child.returncode, 130 if cancel else 23, (stdout, stderr))
                proc = Path(f"/proc/{payload['pid']}/stat")
                self.assertTrue(not proc.exists() or proc.read_text().split()[2] == 'Z',
                                'Wrapped test command survived cleanup')
                namespaces = subprocess.check_output(['ip', 'netns', 'list'], text=True)
                rules = subprocess.check_output(['sudo', '-n', 'iptables-save'], text=True)
                links = subprocess.check_output(['ip', '-j', 'link'], text=True)
                for player in players:
                    self.assertNotIn(player['namespace'], namespaces)
                    self.assertNotIn(player['namespace'].rsplit('-', 1)[0], rules)
                    self.assertNotIn(player['dataHost'], links)
                    self.assertNotIn(player['controlDevice'], links)
                    self.assertFalse(Path('/etc/netns', player['namespace']).exists())
                self.assertEqual(Path('/proc/sys/net/ipv4/ip_forward').read_text(), before)
            finally:
                if child.poll() is None:
                    child.terminate()
                    child.communicate(timeout=15)

    def test_nonzero_test_result_is_preserved_and_network_is_removed(self):
        self.exercise(cancel=False)

    def test_sigterm_removes_network_and_terminates_test_command(self):
        self.exercise(cancel=True)


if __name__ == '__main__':
    unittest.main()
