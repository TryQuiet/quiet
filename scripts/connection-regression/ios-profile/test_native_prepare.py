import hashlib
import json
import os
from pathlib import Path
import unittest
from prepare_native_bundle import prepare


class NativePreparerTests(unittest.TestCase):
    def test_rejects_unrecognized_payload(self):
        with self.assertRaisesRegex(ValueError, 'published iOS alpha'):
            prepare(b'not the released bundle', b'adapter')

    @unittest.skipUnless(os.environ.get('QUIET_PROFILE_ORIGINAL'), 'requires published alpha payload')
    def test_patches_one_original_sodium_module_and_records_exact_adapter(self):
        raw = Path(os.environ['QUIET_PROFILE_ORIGINAL']).read_bytes()
        adapter = b'test adapter contents'
        output, receipt = prepare(raw, adapter)
        hook = 'module.exports = require(\\"./quiet-native-sodium.cjs\\").enable(module.exports);'
        self.assertEqual(output.count(hook), 1)
        self.assertEqual(receipt['adapterSha256'], hashlib.sha256(adapter).hexdigest())
        self.assertEqual(receipt['instrumentedSha256'], hashlib.sha256(output.encode()).hexdigest())
        self.assertEqual(len(receipt['instrumentedModules']), 5)
        self.assertIn('unchanged LFA', receipt['purpose'])


if __name__ == '__main__':
    unittest.main()
