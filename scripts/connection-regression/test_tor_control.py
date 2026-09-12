from pathlib import Path
import tempfile
import unittest
import zipfile
from patch_tor_control import patch, verify, OLD, NEW, BUNDLE


class ControlApkTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)

    def source(self, occurrences):
        p=self.root/'source.apk'
        with zipfile.ZipFile(p,'w') as z:
            z.writestr(BUNDLE,b'webpack eval module '+OLD*occurrences+b'; linux: `pgrep -af unchanged`')
            z.writestr('classes.dex',bytes(range(256)))
            z.writestr('META-INF/runtime.version',b'preserve original metadata')
            z.writestr('META-INF/CERT.RSA',b'obsolete signature')
            z.writestr('assets/index.android.bundle',b'unchanged release UI')
        return p

    def test_only_changes_android_tor_detector_inside_backend(self):
        source=self.source(1);output=self.root/'control.apk'
        receipt=patch(source,output)
        self.assertEqual(receipt['changedEntries'],[BUNDLE])
        with zipfile.ZipFile(output) as z:
            self.assertIn(NEW,z.read(BUNDLE))
            self.assertIn(b'linux: `pgrep -af unchanged`',z.read(BUNDLE))
            self.assertEqual(z.read('classes.dex'),bytes(range(256)))
            self.assertEqual(z.read('META-INF/runtime.version'),b'preserve original metadata')
            self.assertNotIn('META-INF/CERT.RSA',z.namelist())

    def test_rejects_ambiguous_or_different_release_before_output(self):
        for count in [0,2]:
            with self.subTest(count=count):
                output=self.root/f'control{count}.apk'
                with self.assertRaisesRegex(ValueError,'exactly one'):
                    patch(self.source(count),output)
                self.assertFalse(output.exists())

    def test_verification_rejects_other_patches_after_signing(self):
        source=self.source(1);output=self.root/'control.apk'
        patch(source,output)
        with zipfile.ZipFile(output) as z:
            entries={n:z.read(n) for n in z.namelist()}
        entries['classes.dex']=b'changed Java bytecode'
        with zipfile.ZipFile(output,'w') as z:
            for name,data in entries.items(): z.writestr(name,data)
        with self.assertRaisesRegex(ValueError,'Unexpected control APK changes'):
            verify(source,output)
