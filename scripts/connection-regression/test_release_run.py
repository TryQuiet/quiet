import json
from pathlib import Path
import unittest
import tempfile
from unittest.mock import patch
from release_run import validate, expected_artifact, main


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

    def test_diagnostic_control_cannot_substitute_a_different_release(self):
        with patch('release_run.verify_tor_control',return_value={'sourceApkSha256':'wrong-source'}):
            with self.assertRaisesRegex(ValueError,'different release'):
                expected_artifact({'controlApk':{'source':'source.apk','apk':'control.apk'}},self.release)

    def test_control_requires_verified_payload_and_is_labeled(self):
        receipt={'sourceApkSha256':self.release['apkSha256'],'controlApkSha256':'verified-control'}
        with patch('release_run.verify_tor_control',return_value=receipt) as verify:
            sha,metadata=expected_artifact({'controlApk':{'source':'source.apk','apk':'control.apk'}},self.release)
        verify.assert_called_once_with('source.apk','control.apk')
        self.assertEqual(sha,'verified-control')
        self.assertEqual(metadata['artifact'],'androidProcessQueryFix')

    def test_rejects_incompatible_drivers_before_touching_android(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            (root/'ready.json').write_text(json.dumps({'release':'9.0.2'}))
            config={'release':'9.0.2','peer':directory,'output':str(root/'output'),
                    'fixture':'fixture','driver':'instrumentation','remoteJoin':{'host':'mac'}}
            with patch('release_run.load_fixture',return_value=(None,self.release)):
                with patch('release_run.FastAndroid') as phone:
                    with self.assertRaisesRegex(ValueError,'cannot be combined'):
                        main(config)
                    phone.assert_not_called()
