import unittest
from cold_tor import events


class NativeLogTest(unittest.TestCase):
    def test_uses_actual_backend_events_from_only_selected_process(self):
        log = '''         1789242889.350 13995 14104 I NODEJS-MOBILE: 2026-09-12T19:54:49.350Z INFO backend:Tor Initializing tor...
         1789242896.915 13995 14105 E NODEJS-MOBILE: 2026-09-12T19:54:56.914Z WARN backend:Tor Managed Tor process disappeared during bootstrap; restarting Tor {
         1789242897.100 13995 14104 I NODEJS-MOBILE: INFO backend:Tor Initializing tor...
         1789242898.000 12000 12001 I NODEJS-MOBILE: INFO backend:Tor Bootstrapping finished!
         1789243016.928 13995 14104 I NODEJS-MOBILE: DEBUG backend:Tor Checking init timeout
         1789243017.027 13995 14104 I NODEJS-MOBILE: INFO backend:Tor Bootstrapping finished!
         1789243056.695 13995 14104 I NODEJS-MOBILE: DEBUG backend:Libp2pService Connection established with redacted-peer [{"remoteAddr":"/dns4/redacted.onion/tcp/80/ws"}]'''
        parsed=events(log,13995)
        self.assertEqual(parsed['torInit'],1789242889.350)
        self.assertEqual(parsed['torReady'],1789243017.027)
        self.assertEqual(parsed['peerConnected'],1789243056.695)
        self.assertIn('fallbackCheck', parsed)

    def test_process_exists_or_other_peer_is_not_connection_evidence(self):
        self.assertEqual(events('1789243056.695 12000 12001 I NODEJS-MOBILE: DEBUG backend:Libp2pService Connection established with redacted-peer [{"remoteAddr":"/dns4/redacted.onion/tcp/80/ws"}]',13995),{})


if __name__ == '__main__':
    unittest.main()
