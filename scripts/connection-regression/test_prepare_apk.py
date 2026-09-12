import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('prepare_apk', Path(__file__).with_name('prepare_apk.py'))
apk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(apk)


class ApkProvenanceTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / 'release.apk'
        self.output = self.root / 'test.apk'
        self.libs = self.root / 'native'
        self.libs.mkdir()
        # Exercise real ZIP roundtrips including binary bytecode/resources,
        # native libraries, signatures and the asset loader's actual indexes.
        self.original = {
            'AndroidManifest.xml': b'\x03\x00\x08\x00binary-manifest',
            'classes.dex': b'dex\n035\x00real-bytecode-boundary',
            'resources.arsc': bytes(range(256)),
            'assets/index.android.bundle': b'frontend release code',
            'assets/nodejs-project/bundle.cjs': b'backend release code',
            'assets/dir.list': b'nodejs-project\n',
            'assets/file.list': b'nodejs-project/bundle.cjs\n',
            'lib/arm64-v8a/libnode.so': b'\x7fELFarm64-node',
            'lib/arm64-v8a/libtor.so': b'\x7fELFarm64-tor',
            'META-INF/RELEASE.SF': b'obsolete signature',
        }
        with zipfile.ZipFile(self.source, 'w') as z:
            for name, value in self.original.items():
                z.writestr(name, value)
        for name in ['libnode.so', 'libtor.so']:
            (self.libs / name).write_bytes(b'\x7fELFx86-' + name.encode())
        self.binding = self.root / 'classic_level.node'
        self.binding.write_bytes(b'\x7fELFx86-classic-level')

    def prepare(self):
        return apk.prepare(self.source, self.output, self.libs, self.binding, self.libs / 'libtor.so')

    def rewrite(self, replacements):
        with zipfile.ZipFile(self.output) as z:
            contents = {n: z.read(n) for n in z.namelist()}
        contents.update(replacements)
        with zipfile.ZipFile(self.output, 'w') as z:
            for n, data in contents.items():
                z.writestr(n, data)

    def test_preserves_release_code_and_makes_native_binding_extractable(self):
        receipt = self.prepare()
        with zipfile.ZipFile(self.output) as z:
            for name, value in self.original.items():
                if apk.protected(name):
                    self.assertEqual(z.read(name), value)
            for line in z.read('assets/file.list').decode().splitlines():
                self.assertIn('assets/' + line, z.namelist())
            self.assertIn('nodejs-project/x64/classic-level', z.read('assets/dir.list').decode().splitlines())
        self.assertEqual(receipt['backendSha256'], apk.digest(self.original['assets/nodejs-project/bundle.cjs']))

    def test_rejects_backend_patch_even_with_original_frontend(self):
        receipt = self.prepare()
        self.rewrite({'assets/nodejs-project/bundle.cjs': b'newer backend with a fix'})
        with self.assertRaisesRegex(ValueError, 'Release application content changed'):
            apk.verify(self.source, self.output, receipt['addedSha256'])

    def test_rejects_missing_native_asset_index(self):
        receipt = self.prepare()
        self.rewrite({'assets/file.list': self.original['assets/file.list']})
        with self.assertRaisesRegex(ValueError, 'native asset index'):
            apk.verify(self.source, self.output, receipt['addedSha256'])

    def test_rejects_replaced_native_dependency(self):
        receipt = self.prepare()
        self.rewrite({'lib/x86_64/libnode.so': b'different Node runtime'})
        with self.assertRaisesRegex(ValueError, 'Native dependency changed'):
            apk.verify(self.source, self.output, receipt['addedSha256'])

    def test_rejects_missing_library_before_writing_apk(self):
        (self.libs / 'libnode.so').unlink()
        with self.assertRaisesRegex(ValueError, 'Native library set differs'):
            self.prepare()
        self.assertFalse(self.output.exists())

    def test_rejects_unexpected_bytecode(self):
        receipt = self.prepare()
        self.rewrite({'classes2.dex': b'extra native test hook'})
        with self.assertRaisesRegex(ValueError, 'Unexpected application entries'):
            apk.verify(self.source, self.output, receipt['addedSha256'])


if __name__ == '__main__':
    unittest.main()
