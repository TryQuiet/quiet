import json
import os
from pathlib import Path
import unittest
from summarize_cpu import summarize


class CpuSummaryTest(unittest.TestCase):
    @unittest.skipUnless(os.environ.get('QUIET_PROFILE_CPU'), 'requires an actual V8 profile')
    def test_real_phone_profile_retains_total_time_and_crypto_attribution(self):
        raw = json.loads(Path(os.environ['QUIET_PROFILE_CPU']).read_text())
        result = summarize(raw)
        self.assertAlmostEqual(sum(result['selfMsByCategory'].values()), sum(raw['timeDeltas']) / 1000)
        self.assertLess(abs(result['sampledMs'] - (raw['endTime'] - raw['startTime']) / 1000), 100)
        self.assertGreater(result['selfMsByCategory']['libsodium'], 1000)
        self.assertGreater(result['inclusiveLfaMs']['keyMap'], 1000)
        self.assertNotIn('/private/', json.dumps(result))


if __name__ == '__main__':
    unittest.main()
