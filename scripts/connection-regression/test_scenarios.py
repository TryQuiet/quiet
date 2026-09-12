import json
from pathlib import Path
import tempfile
import subprocess
import unittest
from unittest.mock import Mock, patch
import xml.etree.ElementTree as ET
from android import Android
from scenarios import Peer, PeerFailure, run, stop_phone
from tor_only import tor_only


class HarnessFailureTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def test_preflight_rejects_missing_external_route(self):
        phone = object.__new__(Android)
        phone.api = 30
        phone.run = Mock(return_value='127.0.0.0/8 dev lo table local')
        with self.assertRaisesRegex(RuntimeError, 'external default route'):
            phone.preflight(3309)

    def test_preflight_rejects_broken_adb_reverse(self):
        phone = object.__new__(Android)
        phone.api = 30
        phone.run = Mock(side_effect=['default via 10.0.2.2 dev wlan0 table 1012', ''])
        with self.assertRaisesRegex(RuntimeError, 'mobile route'):
            phone.preflight(3309)

    def test_native_selector_requires_exact_message(self):
        tree = ET.fromstring('<hierarchy><node text="QSS offline old-token"/><node text="QSS offline new-token" bounds="[5,10][105,60]"/></hierarchy>')
        self.assertIsNone(Android.find(tree, 'QSS offline'))
        self.assertEqual(Android.find(tree, 'QSS offline new-token').get('bounds'), '[5,10][105,60]')

    def test_peer_rejects_failure_and_does_not_reuse_stale_response(self):
        peer = Peer(self.root)
        first = peer.submit('wait', message='old token', username='mobile')
        (self.root/'responses').mkdir()
        (self.root/'responses'/first).write_text(json.dumps({'passed':False, 'error':'Exact message not found'}))
        with self.assertRaisesRegex(RuntimeError, 'Exact message not found'):
            peer.result(first)
        second = peer.submit('wait', message='new token', username='mobile')
        self.assertNotEqual(first, second)
        with self.assertRaises(TimeoutError):
            peer.result(second, timeout=.01)

    def test_long_reply_deadline_retries_only_exact_message_timeouts(self):
        peer = Peer(self.root)
        peer.submit = Mock(return_value='request.json')
        peer.result = Mock(side_effect=[PeerFailure({'error':'TimeoutError: Expected the exact message from its author'}), {'passed':True}])
        self.assertTrue(peer.wait_exact('fresh token', 'mobile', 180)['passed'])
        self.assertEqual(peer.result.call_count, 2)
        peer.result = Mock(side_effect=PeerFailure({'error':'WebDriver session is gone'}))
        with self.assertRaisesRegex(PeerFailure,'session is gone'):
            peer.wait_exact('fresh token', 'mobile', 180)
        self.assertEqual(peer.result.call_count, 1)

    def test_offline_test_rejects_resurrected_mobile(self):
        phone = Mock()
        phone.run.side_effect = ['', '', '3421']
        with self.assertRaisesRegex(RuntimeError, 'still running'):
            stop_phone(phone)

    def test_offline_test_requires_desktop_exit_proof_before_mobile_launch(self):
        phone, peer = Mock(), Mock()
        phone.run.return_value = ''
        peer.call.side_effect = [{'passed':True}, {'passed':True, 'result':{}}]
        output = self.root/'offline.json'
        with self.assertRaisesRegex(RuntimeError, 'exit was not verified'):
            run(phone, peer, 'mobile', 'offline', output)
        self.assertFalse(json.loads(output.read_text())['passed'])
        self.assertFalse(any('start' in call.args for call in phone.run.call_args_list))

    def test_tor_failure_restores_qss_and_stays_failed(self):
        fixture = Mock()
        output = self.root/'tor.json'
        with patch('tor_only.load_fixture', return_value=(fixture, {})), \
             patch('tor_only.paused', side_effect=[False, True, True]), \
             patch('tor_only.run', side_effect=TimeoutError('Message did not arrive')):
            with self.assertRaises(TimeoutError):
                tor_only(Mock(), Mock(), 'mobile', self.root, output)
        fixture.compose.assert_any_call({}, 'unpause', 'qss', timeout=30)
        self.assertFalse(json.loads(output.read_text())['passed'])

    def test_tor_test_rejects_qss_resuming_during_delivery(self):
        fixture = Mock()
        with patch('tor_only.load_fixture', return_value=(fixture, {})), \
             patch('tor_only.paused', side_effect=[False, True, False, False]), \
             patch('tor_only.run', return_value={'passed':True}):
            with self.assertRaisesRegex(RuntimeError, 'resumed'):
                tor_only(Mock(), Mock(), 'mobile', self.root, self.root/'tor.json')
        self.assertFalse(json.loads((self.root/'tor.json').read_text())['passed'])

    def test_snapshot_timeout_preserves_delivery_failure_and_restores_qss(self):
        fixture = Mock()
        output = self.root/'tor.json'
        with patch('tor_only.load_fixture', return_value=(fixture, {})), \
             patch('tor_only.paused', side_effect=[False, True, True]), \
             patch('tor_only.run', side_effect=TimeoutError('Message did not arrive')), \
             patch('tor_only.subprocess.run', side_effect=subprocess.TimeoutExpired('snapshot', 45)):
            with self.assertRaisesRegex(TimeoutError, 'Message did not arrive'):
                tor_only(Mock(), Mock(), 'mobile', self.root, output, 'desktop.log')
        result = json.loads(output.read_text())
        self.assertFalse(result['passed'])
        self.assertIn('snapshotError', result)
        self.assertEqual(result['error'], 'Message did not arrive')
        fixture.compose.assert_any_call({}, 'unpause', 'qss', timeout=30)


if __name__ == '__main__':
    unittest.main()
