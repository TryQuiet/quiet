"""Exercise real files, build children and receipts; substitute Apple-only tools."""
import argparse
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('current_builder', Path(__file__).with_name('build-ios.py'))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
REAL_POPEN = subprocess.Popen


class CurrentTorBuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.checkout = self.root / 'checkout'
        self.ios = self.checkout / 'packages/mobile/ios'
        self.framework = self.ios / 'Pods/Tor/tor.xcframework'
        self.framework.mkdir(parents=True)
        (self.framework / 'binary').write_bytes(b'unchanged upstream binary')
        (self.ios / 'Pods/Local Podspecs').mkdir()
        self.podspec = self.ios / 'Pods/Local Podspecs/Tor.podspec.json'
        self.podspec.write_text(json.dumps({'version': builder.TOR_VERSION}))
        (self.ios / 'Podfile').write_text(builder.TOR_PODSPEC_URL)
        (self.ios / 'Podfile.lock').write_text('locked pods')
        (self.ios / 'Pods/Manifest.lock').write_text('locked pods')
        (self.ios.parent / '.env.staging').write_text('TEST_ONLY=1')
        self.output = self.root / 'build-output'
        self.args = argparse.Namespace(checkout=str(self.checkout), output=str(self.output),
                                       scheme='Quiet', configuration='Debug', env_file='.env.staging')
        self.children = []
        self.commands = []
        builder.guards.stop_signal = None

    def run_build(self, *, fail=False, version='0.4.9.11', signing_failure=False,
                  mutate_pod=False, interrupt=False):
        def popen(argv, **kwargs):
            self.commands.append(argv)
            self.assertEqual(kwargs['env']['ENVFILE'], self.args.env_file)
            self.assertEqual(kwargs['env']['FORCE_BUNDLING'], '1')
            self.assertNotIn('AWS_SECRET_ACCESS_KEY', kwargs['env'])
            app = self.output / 'DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app'
            code = 'from pathlib import Path; import sys; '
            code += f'app=Path({str(app)!r}); (app/"Frameworks/Tor.framework").mkdir(parents=True,exist_ok=True); '
            code += '(app/"Quiet").write_bytes(b"app"); (app/"main.jsbundle").write_bytes(b"js"); '
            code += '(app/"Frameworks/Tor.framework/Tor").write_bytes(b"linked tor"); '
            if mutate_pod:
                code += f'Path({str(self.framework / "binary")!r}).write_bytes(b"changed"); '
            code += f'sys.exit({1 if fail else 0})'
            child = REAL_POPEN([sys.executable, '-c', code], **kwargs)
            self.children.append(child)
            if interrupt:
                builder.guards.request_stop(15, None)
            return child

        def native(argv, env):
            self.commands.append(argv)
            if argv[0] == 'strings':
                return 'some other constant\n' + version
            if argv[0] == 'xcrun':
                return 'platform IOSSIMULATOR'
            if signing_failure:
                raise builder.guards.BuildFailure('Signing failed')
            return ''

        with patch.object(builder.sys, 'platform', 'darwin'), \
                patch.object(builder.guards, 'check_disk'), \
                patch.object(builder.guards, 'command', side_effect=native), \
                patch.object(builder.subprocess, 'Popen', side_effect=popen), \
                patch.dict(os.environ, {'AWS_SECRET_ACCESS_KEY': 'must-not-reach-build'}), \
                contextlib.redirect_stdout(io.StringIO()):
            return builder.build(self.args)

    def test_builds_installed_framework_and_reuses_output_with_separate_receipts(self):
        self.assertEqual(self.run_build(), 0)
        self.assertEqual(self.run_build(), 0)
        runs = list((self.output / 'runs').iterdir())
        self.assertEqual(len(runs), 2)
        for run in runs:
            receipt = json.loads((run / 'result.json').read_text())
            self.assertEqual(receipt['status'], 'passed')
            self.assertTrue(receipt['torPodUnchanged'])
            self.assertIn('embeddedTorSHA256', receipt)
        self.assertEqual((self.framework / 'binary').read_bytes(), b'unchanged upstream binary')
        self.assertFalse((self.output / '.build.lock').exists())

    def test_notification_provider_build_uses_current_framework_and_receipt(self):
        self.args.env_file = '.env.e2e.qss.push'
        (self.ios.parent / self.args.env_file).write_text('QSS_ALLOWED=true\n')
        self.assertEqual(self.run_build(), 0)
        receipt = json.loads((self.output / 'result.json').read_text())
        self.assertEqual(receipt['envFile'], '.env.e2e.qss.push')
        self.assertEqual(receipt['torVersion'], '409.11.2')
        self.assertTrue(receipt['torPodUnchanged'])
        build = next(command for command in self.commands if command[0] == 'xcodebuild')
        self.assertIn('ENVFILE=.env.e2e.qss.push', build)

    def test_old_installed_pod_is_rejected_before_build(self):
        self.podspec.write_text('{"version":"405.9.1"}')
        with self.assertRaisesRegex(builder.guards.BuildFailure, 'version differs'):
            self.run_build()
        self.assertEqual(self.children, [])

    def test_stale_pod_install_is_rejected_before_build(self):
        (self.ios / 'Pods/Manifest.lock').write_text('old lock')
        with self.assertRaisesRegex(builder.guards.BuildFailure, 'Installed pods differ'):
            self.run_build()
        self.assertEqual(self.children, [])

    def test_failed_xcode_child_persists_failure_and_releases_lock(self):
        self.assertEqual(self.run_build(fail=True), 1)
        self.assertTrue(all(child.poll() is not None for child in self.children))
        self.assertFalse((self.output / '.build.lock').exists())
        self.assertEqual(json.loads((self.output / 'result.json').read_text())['status'], 'failed')

    def test_linked_old_tor_fails_even_with_current_pod_metadata(self):
        self.assertEqual(self.run_build(version='0.4.5.9'), 1)

    def test_failed_signing_does_not_report_success(self):
        self.assertEqual(self.run_build(signing_failure=True), 1)

    def test_changed_pod_fails_receipt(self):
        self.assertEqual(self.run_build(mutate_pod=True), 1)
        self.assertFalse(json.loads((self.output / 'result.json').read_text())['torPodUnchanged'])

    def test_cancellation_stops_child_and_releases_lock(self):
        self.assertEqual(self.run_build(interrupt=True), 1)
        self.assertTrue(all(child.poll() is not None for child in self.children))
        self.assertFalse((self.output / '.build.lock').exists())


if __name__ == '__main__':
    unittest.main()
