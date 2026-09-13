import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from repeat_measurements import native_measurements, distribution, summarize, bootstrap_replies, read_trial, IDENTITIES, DRIVER_SHA


class RepeatedMeasurementTest(unittest.TestCase):
    def test_failed_reply_retains_received_message_and_pause_evidence(self):
        # The runner's result omits a failed phase. The separate phase receipt
        # records its completed incoming message and QSS still paused at failure.
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            trial = root/'v8-trial1'
            trial.mkdir()
            release, artifact, apk, runtime = IDENTITIES['8']
            records = {
                'result.json': {'release': release, 'artifact': artifact, 'passed': False,
                                'startedAtUnix': 1000, 'phases': {'join': {'passed': True, 'joinSeconds': 4.5}}},
                'preflight.json': {'installedApkSha256': apk, 'instrumentationApkSha256': DRIVER_SHA,
                                   'api': 30, 'abi': 'arm64-v8a', 'nativeBridge': '0',
                                   'qssHealthFromAndroid': True, 'externalRoutePresent': True},
                'runtime-bundle.json': {'installedRuntimeSha256': runtime, 'matchesExpected': True},
                'tor.json': {'passed': False, 'desktopToMobileSeconds': 206.5,
                             'failedAfterSeconds': 181.9, 'qssPausedAtFailure': True},
            }
            for name, data in records.items():
                (trial/name).write_text(json.dumps(data))
            (trial/'final.private.log').write_text('1000.000 123 456 I nodejs: INFO backend:Tor Initializing tor...\n')
            (trial/'control.private.pcap').write_bytes(b'')
            peer = root/'v8-trial1-peer'
            peer.mkdir()
            (peer/'ready.json').write_text(json.dumps({'readyAt': '1970-01-01T00:15:00Z'}))
            (root/'v8-trial1-peer.log').write_text('1970-01-01T00:15:00Z backend:Tor Bootstrapping finished!\n')
            with patch('repeat_measurements.subprocess.run') as decode:
                decode.return_value.stdout = ''
                row = read_trial(trial, '8', 1)
                self.assertFalse(row['passed'])
                self.assertFalse(row['phasePassed']['tor'])
                self.assertEqual(row['torDownSeconds'], 206.5)
                self.assertIsNone(row['torUpSeconds'])
                self.assertIsNone(row['qssPausedThroughout'])
                self.assertTrue(row['qssPausedAtFailure'])
                self.assertIn('tor.json', row['evidenceSha256'])
                self.assertEqual(row['phaseFailedAfterSeconds']['tor'], 181.9)
                records['tor.json']['qssPausedAtFailure'] = False
                (trial/'tor.json').write_text(json.dumps(records['tor.json']))
                with self.assertRaisesRegex(ValueError, 'Tor delivery lacks verified QSS isolation'):
                    read_trial(trial, '8', 1)

    def test_bootstrap_replies_preserve_restart_and_ignore_truncated_response(self):
        decoded = '''1001.500 IP 127.0.0.1.4000 > 127.0.0.1.5000: Flags [P.], length 130
250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=59 TAG=loading_descriptors SUMMARY="Loading relay descriptors"
1002.500 IP 127.0.0.1.4000 > 127.0.0.1.5000: Flags [P.], length 130
250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=59 TAG=loading_descriptors SUMMARY="Loading relay descriptors"
1121.000 IP 127.0.0.1.4000 > 127.0.0.1.5000: Flags [P.], length 130
250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=5 TAG=conn SUMMARY="Connecting to a relay"
1122.000 IP 127.0.0.1.4000 > 127.0.0.1.5000: Flags [P.], length 60
250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=100 TAG=done SUMMARY="Do
1150.250 IP 127.0.0.1.4000 > 127.0.0.1.5000: Flags [P.], length 130
250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=100 TAG=done SUMMARY="Done"'''
        result = bootstrap_replies(decoded, 1000)
        self.assertEqual(result['completeStatusRepliesObserved'], 4)
        self.assertEqual([r['progress'] for r in result['progressChanges']], [59, 5, 100])
        self.assertEqual(result['torInitToObserved100PercentSeconds'], 150.25)

    def test_incoming_tor_connection_precedes_outgoing_and_missing_ready_is_not_failure(self):
        # Incoming libp2p connections appear as loopback addresses because Tor
        # forwards an onion service to localhost. The old outgoing-only metric
        # missed these successful connections.
        log = '''1000.000 123 456 I nodejs: INFO backend:Tor Initializing tor...
1001.000 999 456 D nodejs: DEBUG backend:Libp2pService Connection established with unrelated /onion3/other.onion/1
1002.000 123 456 D nodejs: DEBUG backend:QSS Connection established with server
1012.500 123 456 D nodejs: DEBUG backend:Libp2pService Connection established with peer /ip4/127.0.0.1/tcp/45000
1025.000 123 456 D nodejs: DEBUG backend:Libp2pService Connection established with peer /onion3/example.onion/80'''
        observed = native_measurements(log)
        self.assertEqual(observed['torInitToFirstPeerSeconds'], 12.5)
        self.assertEqual(observed['torInitToOutgoingPeerSeconds'], 25)
        self.assertIsNone(observed['torInitToReadySeconds'])

    def test_restart_keeps_original_start_instead_of_resetting_the_latency(self):
        log = '''1000.000 123 456 I nodejs: INFO backend:Tor Initializing tor...
1120.000 123 456 I nodejs: INFO backend:Tor Tor exited with code 143
1120.500 123 456 I nodejs: INFO backend:Tor Initializing tor...
1150.000 123 456 I nodejs: INFO backend:Tor Bootstrapping finished!'''
        observed = native_measurements(log)
        self.assertEqual(observed['torInitToReadySeconds'], 150)
        self.assertEqual(observed['torInitializationCount'], 2)
        self.assertEqual(observed['torExit143Count'], 1)

    def test_rotated_startup_log_cannot_be_summarized_as_zero_delay(self):
        with self.assertRaisesRegex(ValueError, 'missing Tor initialization'):
            native_measurements('1200.000 123 456 I nodejs: INFO backend:Tor Bootstrapping finished!')

    def test_missing_values_retain_denominator_and_do_not_become_zero(self):
        result = distribution([None, 2, 8, 20, None], 5)
        self.assertEqual(result, {'planned': 5, 'observed': 3, 'missing': 2,
                                  'mean': 10, 'median': 8, 'min': 2, 'max': 20})
        self.assertIsNone(distribution([None]*5, 5)['mean'])

    def test_failed_trial_is_retained_in_pair_and_success_counts(self):
        trials = [{'build': v, 'pair': n, 'passed': not (v == '10' and n == 3),
                   'torDownSeconds': None if v == '10' and n == 3 else n*(1 if v == '8' else 2)}
                  for n in range(1, 6) for v in ['8', '10']]
        result = summarize(trials)
        self.assertEqual(result['builds']['10']['passed'], 4)
        self.assertEqual(result['builds']['10']['failed'], 1)
        self.assertEqual(result['builds']['10']['metrics']['torDownSeconds']['missing'], 1)
        self.assertIsNone(result['pairs'][2]['tenMinusEightSeconds']['torDownSeconds'])
        self.assertEqual(result['pairs'][4]['tenMinusEightSeconds']['torDownSeconds'], 5)
        with self.assertRaisesRegex(ValueError, 'all five pairs'):
            summarize(trials[:-1])
