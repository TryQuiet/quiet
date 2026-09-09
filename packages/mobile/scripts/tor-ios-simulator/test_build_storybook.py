"""Real filesystem and child-process rollback tests; no Xcode or Mac required.

Only native inspection/signing, free-disk readings, and Xcode are substituted.
The wrapper still swaps/copies frameworks, terminates real children, receives real
signals, and verifies the resulting app's embedded framework and restored tree.
"""
import argparse
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import plistlib
import shlex
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import unittest
import xml.etree.ElementTree as ET
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('tor_wrapper', Path(__file__).with_name('build-storybook.py'))
wrapper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(wrapper)
REAL_POPEN = subprocess.Popen


class StorybookBuildTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='quiet-tor-test-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        self.checkout = self.root / 'a-different-quiet-checkout'
        self.mobile = self.checkout / 'packages/mobile'
        self.target = self.mobile / 'ios/Pods/Tor/Build/iOS/Tor.framework'
        self.target.mkdir(parents=True)
        # CocoaPods can hard-link cached files: replacement must not edit that inode.
        self.cached_binary = self.root / 'cached-device-binary'
        self.cached_binary.write_bytes(b'approved original device framework')
        os.link(self.cached_binary, self.target / 'Tor')
        (self.target / 'Headers').mkdir()
        (self.target / 'Headers/Tor.h').write_bytes(b'original header')
        (self.target / 'Headers/Tor.h').chmod(0o640)
        self.original = wrapper.snapshot(self.target)
        (self.mobile / 'ios/Podfile').write_text(f"pod 'Tor', podspec: '{wrapper.TOR_PODSPEC_URL}'\n")
        self.workspace = self.mobile / 'ios/Quiet.xcworkspace/contents.xcworkspacedata'
        self.workspace.parent.mkdir()
        self.workspace.write_text('<Workspace/>')
        self.podspec = self.mobile / 'ios/Pods/Local Podspecs/Tor.podspec.json'
        self.podspec.parent.mkdir()
        self.podspec.write_text('{"name":"Tor","version":"405.9.1"}')
        self.source = self.root / 'source/Tor.framework'
        self.source.mkdir(parents=True)
        (self.source / 'Tor').write_bytes(b'arm64 simulator framework')
        (self.source / 'Headers').mkdir()
        (self.source / 'Headers/Tor.h').write_bytes(b'simulator header')
        (self.source / 'HeaderLink').symlink_to('Headers/Tor.h')
        with (self.source / 'Info.plist').open('wb') as info:
            plistlib.dump({'CFBundleShortVersionString': '405.9.1', 'CFBundleExecutable': 'Tor',
                          'CFBundleSupportedPlatforms': ['iPhoneSimulator']}, info)
        self.output = self.root / 'result'
        for name in ['.env.storybook', '.env.staging', '.env.e2e', '.env.e2e.qss', '.env.production']:
            (self.mobile / name).write_text('TEST_ONLY=1\n')
        self.args = argparse.Namespace(checkout=str(self.checkout), framework=str(self.source), output=str(self.output),
                                       scheme='Storybook', configuration='Debug', env_file='.env.storybook')
        self.children = []
        self.commands = []
        self.environments = []
        self.signing_commands = []
        self.baseline_sha = wrapper.sha256(self.target / 'Tor')

    def assert_original_intact(self):
        self.assertEqual(wrapper.snapshot(self.target), self.original)
        self.assertEqual(self.cached_binary.read_bytes(), b'approved original device framework')
        self.assertEqual(self.cached_binary.stat().st_ino, (self.target / 'Tor').stat().st_ino)
        self.assertFalse(self.target.with_name('Tor.framework.quiet-original').exists())
        self.assertFalse(self.target.with_name('Tor.framework.quiet-arm64-staged').exists())
        self.assertFalse(self.target.with_name('.quiet-arm64-tor-build.lock').exists())
        self.assertTrue(all(child.poll() is not None for child in self.children))

    def run_build(self, *, failure=False, interrupt=None, low_disk=False, wrong_app=False,
                  platform='IOSSIMULATOR', prepare_error=None, baseline=None,
                  signing_failure=None, signing_changes_tor=False):
        marker = self.output / 'child-stopped'
        ready = self.output / 'child-ready'

        def validate(argv, env, failure_message='Framework validation command failed'):
            self.environments.append(env)
            if argv[0] == 'codesign':
                self.signing_commands.append(argv)
                app = Path(argv[-1])
                envelope = app / '_CodeSignature/CodeResources'
                operation = 'sign' if '--sign' in argv else 'verify'
                if signing_failure == operation:
                    raise wrapper.BuildFailure(failure_message)
                if operation == 'sign':
                    self.assertEqual(argv[argv.index('--sign') + 1], '-')
                    self.assertIn('--preserve-metadata=entitlements,identifier,flags', argv)
                    self.assertNotIn('--deep', argv)
                    envelope.parent.mkdir()
                    envelope.write_bytes(b'test resource envelope')
                    if signing_changes_tor:
                        (app / 'Frameworks/Tor.framework/Tor').write_bytes(b'changed during signing')
                else:
                    self.assertIn('--strict', argv)
                    self.assertEqual(envelope.read_bytes(), b'test resource envelope')
                return ''
            if 'lipo' in argv:
                return 'arm64'
            if 'vtool' in argv:
                return f'platform {platform}'
            return 'Tor:\n@rpath/Tor.framework/Tor'

        def spawn(argv, **kwargs):
            self.commands.append(argv)
            self.environments.append(kwargs['env'])
            derived = Path(argv[argv.index('-derivedDataPath') + 1])
            configuration = argv[argv.index('-configuration') + 1]
            app = derived / f'Build/Products/{configuration}-iphonesimulator/Quiet.app'
            # Observe termination before restoration, not merely a final stopped PID.
            if interrupt or low_disk:
                program = ('import signal,time; from pathlib import Path; '
                           f'target=Path({str(self.target / "Tor")!r}); '
                           f'marker=Path({str(marker)!r}); '
                           'signal.signal(signal.SIGTERM,lambda *_: '
                           '(marker.write_bytes(target.read_bytes()),exit(0))); '
                           f'Path({str(ready)!r}).write_text("ready"); time.sleep(60)')
            elif failure:
                program = 'raise SystemExit(9)'
            else:
                program = ('from pathlib import Path; import shutil; '
                           f'app=Path({str(app)!r}); app.mkdir(parents=True); '
                           '(app/"main.jsbundle").write_bytes(b"Hermes test payload"); '
                           f'shutil.copytree({str(self.target)!r},app/"Frameworks/Tor.framework",symlinks=True)')
                if wrong_app:
                    program += '; (app/"Frameworks/Tor.framework/Tor").write_bytes(b"wrong embedded framework")'
            child = REAL_POPEN([sys.executable, '-c', program], **kwargs)
            self.children.append(child)
            if interrupt or low_disk:
                deadline = time.monotonic() + 5
                while not ready.exists() and child.poll() is None and time.monotonic() < deadline:
                    time.sleep(0.01)
                self.assertTrue(ready.exists(), 'Disposable child did not install its termination handler')
            if interrupt:
                os.kill(os.getpid(), interrupt)
            return child

        disk_calls = 0

        def disk_usage(_path):
            nonlocal disk_calls
            disk_calls += 1
            # The first poll occurs after spawn observed the child's ready marker.
            free = 1024**3 if low_disk and disk_calls >= 5 else 10 * 1024**3
            return type('DiskUsage', (), {'free': free})()

        handlers = {sig: signal.getsignal(sig) for sig in [signal.SIGINT, signal.SIGTERM, signal.SIGHUP]}
        wrapper.stop_signal = None
        selected_path = '/caller/selected-node/bin:' + os.environ.get('PATH', os.defpath)
        try:
            for sig in handlers:
                signal.signal(sig, wrapper.request_stop)
            with patch.object(wrapper, 'ORIGINAL_SHA256', baseline or self.baseline_sha), \
                 patch.object(wrapper.sys, 'platform', 'darwin'), \
                 patch.object(wrapper, 'command', validate), \
                 patch.object(wrapper.shutil, 'disk_usage', disk_usage), \
                 patch.object(wrapper.subprocess, 'Popen', spawn), \
                 patch.dict(os.environ, {'UNRELATED_SECRET': 'private-test-only', 'PATH': selected_path,
                                         'DEVELOPER_DIR': '/caller/selected-Xcode.app/Contents/Developer'}), \
                 contextlib.redirect_stdout(io.StringIO()):
                if prepare_error:
                    with self.assertRaisesRegex(wrapper.BuildFailure, prepare_error):
                        wrapper.build(self.args)
                    self.assertEqual(self.children, [])
                else:
                    status = wrapper.build(self.args)
                    failed = failure or interrupt or low_disk or wrong_app or signing_failure or signing_changes_tor
                    self.assertEqual(status, 1 if failed else 0)
                    result = json.loads((self.output / 'result.json').read_text())
                    self.assertTrue(result['originalRestored'])
                    self.assertEqual(result['status'], 'failed' if failed else 'passed')
                    if not failed:
                        self.assertEqual(result['embeddedTorSHA256'], wrapper.sha256(self.source / 'Tor'))
                        self.assertEqual(result['appSignature'], {'identity': 'ad-hoc', 'strictVerification': True})
                        self.assertEqual(len(self.signing_commands), 2)
                        expected_app = self.output / f'DerivedData/Build/Products/{self.args.configuration}-iphonesimulator/Quiet.app'
                        self.assertEqual(result['app'], str(expected_app))
                        self.assertTrue((expected_app / '_CodeSignature/CodeResources').is_file())
                        self.assertEqual(result['scheme'], self.args.scheme)
                        self.assertEqual(result['configuration'], self.args.configuration)
                        self.assertEqual(result['envFile'], self.args.env_file)
                    elif signing_failure or signing_changes_tor:
                        self.assertNotIn('appSignature', result)
                    if interrupt or low_disk:
                        self.assertEqual(marker.read_bytes(), b'arm64 simulator framework')
            for env in self.environments:
                self.assertNotIn('UNRELATED_SECRET', env)
                self.assertEqual(env['PATH'], selected_path)
                self.assertEqual(env['DEVELOPER_DIR'], '/caller/selected-Xcode.app/Contents/Developer')
                self.assertEqual(env['ENVFILE'], self.args.env_file)
                self.assertEqual(env['FORCE_BUNDLING'], '1')
            if self.commands:
                command = self.commands[0]
                self.assertIn('ARCHS=arm64', command)
                self.assertIn('-hideShellScriptEnvironment', command)
                self.assertIn('-resultBundlePath', command)
                self.assertIn('CODE_SIGNING_ALLOWED=NO', command)
                self.assertEqual(command[command.index('-scheme') + 1], self.args.scheme)
                self.assertEqual(command[command.index('-configuration') + 1], self.args.configuration)
                self.assertIn(f'ENVFILE={self.args.env_file}', command)
            return
        finally:
            for sig, handler in handlers.items():
                signal.signal(sig, handler)
            wrapper.stop_signal = None
            for child in self.children:
                if child.poll() is None:
                    child.kill()
                    child.wait()

    def test_success_restores_original_hardlinked_device_tree(self):
        self.run_build()
        self.assert_original_intact()

    def test_standard_debug_selects_staging(self):
        self.args.scheme, self.args.env_file = 'Quiet', '.env.staging'
        self.run_build()
        self.assert_original_intact()

    def test_standard_e2e_selects_e2e(self):
        self.args.scheme, self.args.env_file = 'Quiet', '.env.e2e'
        self.run_build()
        self.assert_original_intact()

    def test_standard_qss_selects_qss(self):
        self.args.scheme, self.args.env_file = 'Quiet', '.env.e2e.qss'
        self.run_build()
        self.assert_original_intact()

    def test_release_signs_the_release_product(self):
        self.args.scheme, self.args.configuration, self.args.env_file = 'Quiet', 'Release', '.env.production'
        self.run_build()
        self.assertFalse((self.output / 'DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app').exists())
        self.assert_original_intact()

    def test_unsupported_selection_rejected_before_any_mutation(self):
        for selection in [('Quiet', 'Debug', '.env.storybook'), ('Storybook', 'Release', '.env.production'),
                          ('Quiet', 'Release', '.env.e2e'), ('Quiet', 'Debug', '../outside.env')]:
            with self.subTest(selection=selection):
                self.args.scheme, self.args.configuration, self.args.env_file = selection
                self.run_build(prepare_error='Unsupported scheme/configuration/environment')
                self.assertFalse(self.output.exists())
                self.assertEqual(self.environments, [])
                self.assert_original_intact()

    def test_missing_environment_rejected_before_any_mutation(self):
        (self.mobile / '.env.storybook').unlink()
        self.run_build(prepare_error='Selected environment file')
        self.assertFalse(self.output.exists())
        self.assertEqual(self.environments, [])
        self.assert_original_intact()

    def test_symlink_environment_rejected_before_any_mutation(self):
        env_file = self.mobile / '.env.storybook'
        env_file.unlink()
        env_file.symlink_to(self.mobile / '.env.staging')
        self.run_build(prepare_error='Selected environment file')
        self.assertFalse(self.output.exists())
        self.assert_original_intact()

    def test_failed_build_restores_original(self):
        self.run_build(failure=True)
        self.assert_original_intact()

    def test_sigint_stops_child_before_restore(self):
        self.run_build(interrupt=signal.SIGINT)
        self.assert_original_intact()

    def test_sigterm_stops_child_before_restore(self):
        self.run_build(interrupt=signal.SIGTERM)
        self.assert_original_intact()

    def test_sighup_stops_child_before_restore(self):
        self.run_build(interrupt=signal.SIGHUP)
        self.assert_original_intact()

    def test_low_disk_stops_child_before_restore(self):
        self.run_build(low_disk=True)
        self.assert_original_intact()

    def test_incorrect_app_framework_fails_and_restores_original(self):
        self.run_build(wrong_app=True)
        self.assert_original_intact()

    def test_signing_failure_rejects_app_and_restores_original(self):
        self.run_build(signing_failure='sign')
        self.assertEqual(len(self.signing_commands), 1)
        self.assert_original_intact()

    def test_signature_verification_failure_rejects_app_and_restores_original(self):
        self.run_build(signing_failure='verify')
        self.assertEqual(len(self.signing_commands), 2)
        self.assert_original_intact()

    def test_signing_cannot_change_embedded_tor(self):
        self.run_build(signing_changes_tor=True)
        self.assert_original_intact()

    def test_device_source_rejected_before_swap(self):
        self.run_build(platform='IOS', prepare_error='IOSSIMULATOR')
        self.assertFalse(self.output.exists())
        self.assert_original_intact()

    def test_baseline_mismatch_rejected_before_swap(self):
        self.run_build(baseline='0' * 64, prepare_error='approved baseline')
        self.assertFalse(self.output.exists())
        self.assert_original_intact()

    def test_non_quiet_directory_rejected(self):
        self.workspace.unlink()
        self.run_build(prepare_error='Quiet mobile Podfile')
        self.assert_original_intact()

    def test_unpinned_podfile_rejected(self):
        (self.mobile / 'ios/Podfile').write_text("pod 'Tor'\n")
        self.run_build(prepare_error='Podfile must pin')
        self.assert_original_intact()

    def test_incorrect_installed_podspec_rejected(self):
        self.podspec.write_text('{"name":"Tor","version":"other"}')
        self.run_build(prepare_error='Expected pinned Tor pod')
        self.assert_original_intact()

    def test_output_inside_checkout_rejected(self):
        self.args.output = str(self.checkout / 'new-output')
        self.run_build(prepare_error='outside both inputs')
        self.assert_original_intact()

    def test_existing_output_not_overwritten(self):
        self.output.mkdir()
        marker = self.output / 'keep'
        marker.write_text('original output')
        self.run_build(prepare_error='new directory')
        self.assertEqual(marker.read_text(), 'original output')
        self.assert_original_intact()

    def test_escaping_source_symlink_rejected(self):
        (self.source / 'escape').symlink_to(self.cached_binary)
        self.run_build(prepare_error='symlink escapes')
        self.assert_original_intact()

    def test_symlink_installed_target_rejected(self):
        moved = self.target.with_name('original')
        self.target.rename(moved)
        self.target.symlink_to(moved, target_is_directory=True)
        self.run_build(prepare_error='must not be symlinks')
        self.assertTrue(self.target.is_symlink())
        self.assertEqual(wrapper.snapshot(moved), self.original)

    def test_stale_backup_preserved_without_build(self):
        backup = self.target.with_name('Tor.framework.quiet-original')
        backup.mkdir()
        marker = backup / 'keep'
        marker.write_text('recover me')
        self.run_build(prepare_error='recover it first')
        self.assertEqual(marker.read_text(), 'recover me')
        self.assertEqual(wrapper.snapshot(self.target), self.original)


class SchemeEnvironmentTests(unittest.TestCase):
    def test_actual_preactions_honor_selected_environment_and_keep_defaults(self):
        mobile = Path(__file__).resolve().parents[2]
        with tempfile.TemporaryDirectory(prefix='quiet-scheme-env-') as temporary:
            output = Path(temporary) / 'envfile'
            for scheme, default in [('Quiet', '.env.staging'), ('Storybook', '.env.storybook')]:
                project = mobile / f'ios/Quiet.xcodeproj/xcshareddata/xcschemes/{scheme}.xcscheme'
                action = ET.parse(project).find('./BuildAction/PreActions/ExecutionAction/ActionContent')
                # Execute the actual checked-in shell command, redirecting only its
                # global /tmp output into the disposable test directory.
                script = action.attrib['scriptText'].replace('/tmp/envfile', shlex.quote(str(output)))
                for selected in [None, '', '.env.storybook', '.env.staging', '.env.e2e', '.env.e2e.qss', '.env.production']:
                    with self.subTest(scheme=scheme, selected=selected):
                        output.write_text('stale environment\n')
                        env = {'PATH': os.defpath}
                        if selected is not None:
                            env['ENVFILE'] = selected
                        subprocess.run(['/bin/sh', '-c', script], env=env, check=True, capture_output=True)
                        self.assertEqual(output.read_text(), (selected or default) + '\n')


class DetoxConfigurationTests(unittest.TestCase):
    def setUp(self):
        self.mobile = Path(__file__).resolve().parents[2]
        self.node = shutil.which('node')
        if not self.node or not (self.mobile / 'node_modules/detox/internals.js').is_file():
            self.skipTest('Detox resolution checks require installed mobile dependencies and Node on PATH')

    def resolve(self, configuration, overrides=None):
        env = {key: value for key, value in os.environ.items() if not key.startswith('DETOX_IOS_')}
        env.update(overrides or {})
        script = """require('detox/internals').resolveConfig({argv: {configuration: process.argv[1]}})
          .then(({apps, device}) => process.stdout.write(JSON.stringify({apps, device})))
          .catch(error => { process.stderr.write(error.message); process.exitCode = 1 })"""
        result = subprocess.run([self.node, '-e', script, configuration], cwd=self.mobile,
                                env=env, check=True, capture_output=True, text=True, timeout=30)
        return json.loads(result.stdout)

    def test_actual_standard_arm_routes_resolve_with_distinct_products(self):
        selections = [
            ('ios.sim.debug', 'debug', '.env.staging', 'Debug'),
            ('ios.sim.debug.ci', 'debug', '.env.staging', 'Debug'),
            ('ios.sim.e2e', 'e2e', '.env.e2e', 'Debug'),
            ('ios.sim.e2e.qss', 'e2e.qss', '.env.e2e.qss', 'Debug'),
            ('ios.sim.release', 'release', '.env.production', 'Release'),
        ]
        for route, name, env_file, configuration in selections:
            with self.subTest(route=route):
                resolved = self.resolve(route)
                self.assertEqual(resolved['device']['type'], 'ios.simulator')
                self.assertEqual(resolved['device']['bootArgs'], '--arch=arm64')
                app = resolved['apps']['default']
                argv = shlex.split(app['build'])
                output = f'/tmp/quiet-{name}-arm64-validation'
                self.assertEqual(argv[argv.index('--output') + 1], output)
                self.assertEqual(argv[argv.index('--scheme') + 1], 'Quiet')
                self.assertEqual(argv[argv.index('--configuration') + 1], configuration)
                self.assertEqual(argv[argv.index('--env-file') + 1], env_file)
                self.assertEqual(app['binaryPath'], f'{output}/DerivedData/Build/Products/{configuration}-iphonesimulator/Quiet.app')

    def test_storybook_alias_and_android_routes_remain_compatible(self):
        storybook = self.resolve('ios.sim.storybook')
        self.assertEqual(storybook, self.resolve('ios.sim.storybook.arm64'))
        self.assertNotIn('build', storybook['apps']['default'])
        for route, device in [('android.att.storybook', 'android.attached'),
                              ('android.emu.storybook', 'android.emulator')]:
            with self.subTest(route=route):
                resolved = self.resolve(route)
                self.assertEqual(resolved['device']['type'], device)
                self.assertEqual(resolved['apps']['default']['type'], 'android.apk')
                self.assertIn('assembleStorybookDebug', resolved['apps']['default']['build'])

    def test_overrides_reach_real_shell_as_literal_arguments(self):
        with tempfile.TemporaryDirectory(prefix='quiet-detox-command-') as temporary:
            root = Path(temporary)
            marker = root / 'must-not-execute'
            framework = str(root / f"Tor's $(touch {marker}).framework")
            output = str(root / "output's directory")
            resolved = self.resolve('ios.sim.e2e', {
                'DETOX_IOS_ARM64_TOR_FRAMEWORK': framework,
                'DETOX_IOS_ARM64_E2E_OUTPUT': output,
                'DETOX_IOS_SIMULATOR_ID': 'owned-simulator-id',
            })
            self.assertEqual(resolved['device']['device'], {'id': 'owned-simulator-id'})
            app = resolved['apps']['default']
            self.assertEqual(app['binaryPath'], f'{output}/DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app')
            fake_python = root / 'python3'
            recorded = root / 'argv.json'
            fake_python.write_text(f'#!{sys.executable}\nimport json,os,sys\n'
                                   'with open(os.environ["TEST_ARGV"], "w") as stream: json.dump(sys.argv[1:], stream)\n')
            fake_python.chmod(0o700)
            subprocess.run(['/bin/sh', '-c', app['build']], cwd=root, check=True, capture_output=True,
                           env={'PATH': str(root) + os.pathsep + os.defpath, 'TEST_ARGV': str(recorded)})
            argv = json.loads(recorded.read_text())
            self.assertEqual(argv[argv.index('--framework') + 1], framework)
            self.assertEqual(argv[argv.index('--output') + 1], output)
            self.assertEqual(argv[argv.index('--env-file') + 1], '.env.e2e')
            self.assertFalse(marker.exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
