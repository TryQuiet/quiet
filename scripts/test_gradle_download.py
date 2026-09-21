"""Exercise the checked-in Java wrapper against a response slower than its old timeout."""
import http.server
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
import unittest

ROOT = Path(__file__).resolve().parents[1]


class GradleDownloadTest(unittest.TestCase):
    @unittest.skipUnless(shutil.which('java'), 'Java is required to exercise the real Gradle wrapper')
    def test_slow_server_response_reaches_the_wrapper(self):
        class DelayedServer(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                # The original 10-second timeout fails before this response.
                time.sleep(11)
                self.send_response(404)
                self.end_headers()

            def log_message(self, *_args):
                pass

        with tempfile.TemporaryDirectory(prefix='quiet-gradle-download-') as temporary:
            directory = Path(temporary)
            source = ROOT / 'packages/mobile/android/gradle/wrapper'
            shutil.copy(source / 'gradle-wrapper.jar', directory)
            with http.server.ThreadingHTTPServer(('127.0.0.1', 0), DelayedServer) as server:
                thread = threading.Thread(target=server.serve_forever, daemon=True)
                thread.start()
                properties = (source / 'gradle-wrapper.properties').read_text().splitlines()
                properties = [f'distributionUrl=http://127.0.0.1:{server.server_port}/gradle-8.13-all.zip'
                              if line.startswith('distributionUrl=') else line for line in properties]
                (directory / 'gradle-wrapper.properties').write_text('\n'.join(properties) + '\n')
                try:
                    result = subprocess.run(
                        ['java', '-classpath', str(directory / 'gradle-wrapper.jar'),
                         'org.gradle.wrapper.GradleWrapperMain', '--version'],
                        env={**os.environ, 'GRADLE_USER_HOME': str(directory / 'cache')},
                        capture_output=True, text=True, timeout=25,
                    )
                finally:
                    server.shutdown()
                    thread.join()
            self.assertNotEqual(result.returncode, 0)
            # A real response must reach Java's downloader; we deliberately serve
            # 404 instead of downloading a 200 MB distribution in this regression.
            self.assertIn('FileNotFoundException', result.stderr)
            self.assertNotIn('SocketTimeoutException', result.stderr)
            self.assertNotIn('failed: timeout', result.stderr)


if __name__ == '__main__':
    unittest.main()
