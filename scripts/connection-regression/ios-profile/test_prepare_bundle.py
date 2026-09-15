"""Run against the actual release payload via QUIET_PROFILE_ORIGINAL."""
import hashlib
import json
import os
from pathlib import Path
import unittest
from prepare_bundle import ALPHA_SHA256, EVAL, START, instrument


class InstrumentationTest(unittest.TestCase):
    def test_unknown_layout_is_rejected(self):
        with self.assertRaises(ValueError):
            instrument('console.log("not the released bundle")')

    @unittest.skipUnless(os.environ.get('QUIET_PROFILE_ORIGINAL'), 'requires the released iOS bundle')
    def test_only_selected_modules_and_startup_are_instrumented(self):
        raw = Path(os.environ['QUIET_PROFILE_ORIGINAL']).read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), ALPHA_SHA256)
        source = raw.decode()
        output, changed = instrument(source)
        self.assertEqual(len(changed), 5)
        original_modules = [json.loads(m.group(1)) for m in EVAL.finditer(source)]
        modified_modules = [json.loads(m.group(1)) for m in EVAL.finditer(output)]
        self.assertEqual(len(original_modules), len(modified_modules))
        different = [(a, b) for a, b in zip(original_modules, modified_modules) if a != b]
        self.assertEqual(len(different), 5)
        for original, modified in different:
            # The original body is preserved on both sides of the sole injected hook.
            before, after = original.split('__webpack_async_result__();')
            self.assertTrue(modified.startswith(before))
            self.assertTrue(modified.endswith('__webpack_async_result__();' + after))
        self.assertEqual(output.count(START), 1)
        with self.assertRaises(ValueError):
            instrument(source.replace(START, 'unexpected startup'))


if __name__ == '__main__':
    unittest.main()
