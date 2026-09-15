import json, os, shutil, tempfile, unittest
from pathlib import Path
from collect_audited_results import collect


@unittest.skipUnless(os.environ.get("QUIET_PROFILE_CAPTURE"), "requires private actual phone capture")
class AuditedCollectorTests(unittest.TestCase):
    def test_complete_phone_capture(self):
        result = collect(Path(os.environ["QUIET_PROFILE_CAPTURE"]))
        self.assertEqual(len(result["messages"]), 5)
        self.assertEqual(len([r for r in result["cases"] if r["phase"] == "separateSenderReceivedEdition"]), 4)

    def test_rejects_gc_regression_and_sender_warmed_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); source = Path(os.environ["QUIET_PROFILE_CAPTURE"])
            shutil.copytree(source / "combined-audited-main", root / "combined-audited-main")
            p = root / "combined-audited-main/combined-results.json"; original = p.read_text()
            for mutation in ["oldChecks", "senderWarmed"]:
                rows = json.loads(original)
                row = next(r for r in rows if r["phase"] == "separateSenderReceivedEdition")
                if mutation == "oldChecks": row["metrics"]["sodium.crypto_sign_verify_detached"]["calls"] = 51
                else: row["phase"] = "sameProcessSenderEdition"
                p.write_text(json.dumps(rows))
                with self.assertRaises(AssertionError): collect(root)


if __name__ == "__main__": unittest.main()
