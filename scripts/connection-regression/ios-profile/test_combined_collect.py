import json, os, shutil, tempfile, unittest
from pathlib import Path
from collect_combined_results import collect


@unittest.skipUnless(os.environ.get("QUIET_PROFILE_CAPTURE"), "requires private actual phone capture")
class CollectorTests(unittest.TestCase):
    def test_accepts_complete_verified_capture_and_excludes_sender_warmed_editions(self):
        result = collect(Path(os.environ["QUIET_PROFILE_CAPTURE"]))
        self.assertEqual(len(result["messages"]), 5)
        self.assertEqual(len(result["userScalePasses"]), 2)
        self.assertFalse(any(r["phase"] == "receivedSigchainEdition" for r in result["historyAndArrivals"]))
        self.assertTrue(all(r["completed"] == 1000 for r in result["messages"]))

    def test_rejects_partial_run_and_missing_message_signature(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            shutil.copytree(Path(os.environ["QUIET_PROFILE_CAPTURE"]) / "combined-final-main", root / "combined-final-main")
            p = root / "combined-final-main/messages-repeat-1/results.json"
            original = p.read_text()
            for mutation in ["partial", "signature"]:
                rows = json.loads(original)
                row = next(x for x in rows if x["phase"] == "decryptAndVerify")
                if mutation == "partial": row["completed"] = 999
                else: row["metrics"]["sodium.crypto_sign_verify_detached"]["calls"] = 999
                p.write_text(json.dumps(rows))
                with self.assertRaises(AssertionError): collect(root)

    def test_excludes_renamed_same_process_sender_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = Path(os.environ["QUIET_PROFILE_CAPTURE"])
            shutil.copytree(source / "combined-final-main", root / "combined-final-main")
            shutil.copytree(source / "final-integrated", root / "final-integrated", ignore=shutil.ignore_patterns("*.cjs"))
            p = root / "combined-final-main/combined-results.json"
            rows = json.loads(p.read_text())
            rows += [{"phase": "sameProcessSenderEdition", "ms": 1, "metrics": {}}]
            p.write_text(json.dumps(rows))
            result = collect(root)
            self.assertFalse(any(r["phase"] in {"receivedSigchainEdition", "sameProcessSenderEdition"} for r in result["historyAndArrivals"]))


if __name__ == "__main__": unittest.main()
