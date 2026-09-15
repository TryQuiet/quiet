import hashlib, json, os, subprocess, sys, tempfile, unittest
from pathlib import Path


class IntegratedPreparerTests(unittest.TestCase):
    def test_rejects_mismatched_reviewed_build_without_writing_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.cjs"; source.write_text("unexpected")
            output = Path(tmp) / "output.cjs"
            run = subprocess.run([sys.executable, str(Path(__file__).with_name("prepare_integrated_bundle.py")), str(source), str(output), "--sha256", "0" * 64, "--quiet-commit", "1" * 40, "--auth-commit", "2" * 40], capture_output=True, text=True)
            self.assertNotEqual(run.returncode, 0)
            self.assertIn("does not match reviewed", run.stderr)
            self.assertFalse(output.exists())


if __name__ == "__main__": unittest.main()
