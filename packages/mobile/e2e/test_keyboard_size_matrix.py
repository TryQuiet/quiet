import argparse
import importlib.util
import pathlib
import tempfile
import unittest

PATH = pathlib.Path(__file__).with_name('run-keyboard-size-matrix.py')
spec = importlib.util.spec_from_file_location('keyboard_matrix', PATH)
matrix = importlib.util.module_from_spec(spec)
spec.loader.exec_module(matrix)


class NativeGeometryTests(unittest.TestCase):
    def setUp(self):
        # Corrected physical Pixel measurements, with no personal chat content.
        self.bounds = {
            'chat_general': [0, 172, 1080, 2347],
            'chat-composer-controls': [0, 1143, 1080, 1464],
            'chat-composer-toolbar': [0, 1304, 1080, 1464],
            'input': [42, 1172, 1038, 1278],
            'send_message_button': [881, 1328, 1038, 1443],
        }
        self.ime = {'visible': True, 'top': 1464}

    def test_physical_pixel_clearance_is_eight_dp(self):
        result = matrix.check_geometry(self.bounds, self.ime, 2.625, True)
        self.assertEqual(result['send_clearance_dp'], 8)
        self.assertEqual(result['composer_gap_px'], 0)

    def test_rejected_candidate_missing_status_inset_is_detected(self):
        for key in self.bounds.keys() - {'chat_general'}:
            self.bounds[key][1] += 172
            self.bounds[key][3] += 172
        with self.assertRaisesRegex(AssertionError, 'boundary'):
            matrix.check_geometry(self.bounds, self.ime, 2.625, True)

    def test_closed_keyboard_residual_padding_is_detected(self):
        shift = 2347 - 1464
        for key in self.bounds.keys() - {'chat_general'}:
            self.bounds[key][1] += shift
            self.bounds[key][3] += shift
        self.ime['visible'] = False
        matrix.check_geometry(self.bounds, self.ime, 2.625, False)
        self.bounds['chat-composer-controls'][3] -= 172
        with self.assertRaisesRegex(AssertionError, 'boundary'):
            matrix.check_geometry(self.bounds, self.ime, 2.625, False)

    def test_short_or_clipped_send_control_is_rejected(self):
        self.bounds['send_message_button'][1] = 1420
        with self.assertRaisesRegex(AssertionError, '44dp'):
            matrix.check_geometry(self.bounds, self.ime, 2.625, True)

    def test_extra_attachment_margin_is_rejected(self):
        self.bounds['chat-composer-toolbar'][3] -= 39
        with self.assertRaisesRegex(AssertionError, 'attachment'):
            matrix.check_geometry(self.bounds, self.ime, 2.625, True)

    def test_parses_uiautomator_and_window_insets(self):
        xml = '<hierarchy><node resource-id="com.quietmobile.debug:id/input" bounds="[42,1172][1038,1278]" /></hierarchy>'
        self.assertEqual(matrix.parse_bounds(xml), {'input': [42, 1172, 1038, 1278]})
        window = 'InsetsSource id=3 type=ime frame=[0,1464][1080,2410] visibleFrame=[0,1464][1080,2410] visible=true flags= sideHint=BOTTOM'
        self.assertEqual(matrix.parse_ime(window), self.ime)
        with self.assertRaises(ValueError):
            matrix.parse_ime('IME unavailable')

    def test_override_restoration_preserves_prior_override(self):
        self.assertEqual(matrix.original_override('Physical size: 1080x2400\nOverride size: 720x1280\n'), '720x1280')
        self.assertEqual(matrix.original_override('Physical density: 420\n'), 'reset')


class RestoreTests(unittest.TestCase):
    def test_failed_matrix_restores_display_and_draft(self):
        class FixtureRunner(matrix.Runner):
            def __init__(self, args):
                super().__init__(args)
                self.commands = []
                self.texts = []

            def api(self, method, path, body=None):
                if path == '':
                    return {'udid': 'emulator-5590'}
                return 'original fixture draft' if path.endswith('/text') else 'Message #general'

            def adb(self, *args):
                self.commands.append(args)
                if args == ('shell', 'getprop', 'ro.kernel.qemu'):
                    return b'1\n'
                if args == ('shell', 'wm', 'size'):
                    return b'Physical size: 1080x2400\nOverride size: 900x1600\n'
                if args == ('shell', 'wm', 'density'):
                    return b'Physical density: 420\n'
                if args == ('shell', 'dumpsys', 'window'):
                    return b'type=ime frame=[0,1464][1080,2410] visible=false'
                return b''

            def ensure_general(self):
                pass

            def element(self, _):
                return 'input-id'

            def hide(self):
                pass

            def click(self, _):
                pass

            def replace_text(self, text):
                self.texts.append(text)

            def capture(self, *args):
                raise AssertionError('native send control clipped')

        with tempfile.TemporaryDirectory() as output:
            runner = FixtureRunner(argparse.Namespace(output=output, serial='emulator-5590'))
            with self.assertRaisesRegex(AssertionError, 'native send control clipped'):
                runner.run()
            self.assertIn(('shell', 'wm', 'size', '900x1600'), runner.commands)
            self.assertIn(('shell', 'wm', 'density', 'reset'), runner.commands)
            self.assertEqual(runner.texts[-1], 'original fixture draft')


if __name__ == '__main__':
    unittest.main()
