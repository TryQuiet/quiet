import json
from pathlib import Path
import unittest
from release_run import validate


class ReleasePairingTest(unittest.TestCase):
    def setUp(self):
        self.release=next(r for r in json.loads(Path(__file__).with_name('releases.json').read_text()) if r['version']=='9.0.2')

    def test_rejects_wrong_desktop_before_resetting_mobile(self):
        with self.assertRaisesRegex(ValueError,'Desktop and mobile'):
            validate({'release':'9.0.2'},{'release':'8.0.0'},{'qssCommit':self.release['qssCommit']})

    def test_rejects_current_server_when_historical_pin_was_requested(self):
        with self.assertRaisesRegex(ValueError,'QSS does not match'):
            validate({'release':'9.0.2'},{'release':'9.0.2'},{'qssCommit':'current-server'})

    def test_paired_release_requires_official_apk_digest(self):
        result=validate({'release':'9.0.2'},{'release':'9.0.2'},self.release)
        self.assertEqual(result['apkSha256'],'daaf58bea88efa9c5e7048afef1fe792000bedbe2e74bc4a958af38ccb74ca17')

    def test_rejects_auth_submodule_drift(self):
        fixture={**self.release,'qssAuthCommit':'current-auth'}
        with self.assertRaisesRegex(ValueError,'QSS auth does not match'):
            validate({'release':'9.0.2'},{'release':'9.0.2'},fixture)
