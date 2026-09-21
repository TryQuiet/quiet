#!/usr/bin/env python3
"""Two isolated Tor clients with independent data and WebDriver links (Linux only)."""
import argparse
import fcntl
import json
import ipaddress
import os
from pathlib import Path
import random
import signal
import subprocess
import sys
import time


def run(*args, check=True):
    try:
        return subprocess.run([str(a) for a in args], check=check, text=True, capture_output=True, timeout=60)
    except subprocess.CalledProcessError as error:
        print(error.stderr, file=sys.stderr)
        raise


def root(*args, check=True):
    return run('sudo', '-n', *args, check=check)


def profile(player, slow):
    print(json.dumps({'player': player['namespace'], 'profile': 'slow' if slow else 'fast'}), flush=True)
    # Data only. Egress on each end of the veth controls one direction.
    for prefix, device, rate in [
        ([], player['dataHost'], '1mbit'),
        (['ip', 'netns', 'exec', player['namespace']], 'data0', '256kbit'),
    ]:
        if slow:
            root(*prefix, 'tc', 'qdisc', 'replace', 'dev', device, 'root',
                 'netem', 'limit', '200', 'delay', '150ms', 'rate', rate)
        else:
            root(*prefix, 'tc', 'qdisc', 'del', 'dev', device, 'root', check=False)


class Network:
    def __init__(self):
        self.tag = f'qnet{os.getpid()}'
        self.players = []
        self.rules = []
        self.forwarding = None

    def setup(self):
        # Refuse overlapping host routes rather than accidentally modifying an existing network.
        routes = json.loads(run('ip', '-j', 'route', 'show', 'table', 'all').stdout)
        occupied = [ipaddress.ip_network(r['dst'], strict=False) for r in routes
                    if r.get('dst') not in (None, 'default') and ':' not in r['dst']]
        candidates = list(range(20, 240))
        random.shuffle(candidates)
        chosen = []
        for n in candidates:
            networks = [ipaddress.ip_network(f'10.{octet}.{n}.0/30') for octet in (203, 204)]
            if not any(a.overlaps(b) for a in networks for b in occupied):
                chosen.append(n)
            if len(chosen) == 2:
                break
        if len(chosen) != 2:
            raise RuntimeError('No unused test subnets')
        self.forwarding = Path('/proc/sys/net/ipv4/ip_forward').read_text().strip()
        root('sysctl', '-q', '-w', 'net.ipv4.ip_forward=1')
        for index, n in enumerate(chosen):
            ns = f'{self.tag}-{index}'
            player = dict(namespace=ns, host=f'10.204.{n}.2', controlHost=f'10.204.{n}.1',
                          dataHost=f'qd{os.getpid()}{index}', dataIP=f'10.203.{n}.2',
                          gateway=f'10.203.{n}.1', controlDevice=f'qc{os.getpid()}{index}')
            self.players.append(player)
            root('ip', 'netns', 'add', ns)
            root('ip', '-n', ns, 'link', 'set', 'lo', 'up')
            for hostdev, peer, hostip, clientip in [
                (player['dataHost'], 'data0', player['gateway'], player['dataIP']),
                (player['controlDevice'], 'control0', player['controlHost'], player['host']),
            ]:
                root('ip', 'link', 'add', hostdev, 'type', 'veth', 'peer', 'name', hostdev+'p')
                root('ip', 'link', 'set', hostdev+'p', 'netns', ns)
                root('ip', '-n', ns, 'link', 'set', hostdev+'p', 'name', peer)
                root('ip', 'addr', 'add', hostip+'/30', 'dev', hostdev)
                root('ip', 'link', 'set', hostdev, 'up')
                root('ip', '-n', ns, 'addr', 'add', clientip+'/30', 'dev', peer)
                root('ip', '-n', ns, 'link', 'set', peer, 'up')
            root('ip', '-n', ns, 'route', 'add', 'default', 'via', player['gateway'])
            # ip netns exec bind-mounts this resolver file; host stub resolvers are unreachable.
            root('mkdir', '-p', f'/etc/netns/{ns}')
            resolver = Path('/run/systemd/resolve/resolv.conf')
            text = resolver.read_text() if resolver.exists() else Path('/etc/resolv.conf').read_text()
            if any(line.startswith('nameserver 127.') for line in text.splitlines()):
                text = 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n'
            subprocess.run(['sudo', '-n', 'tee', f'/etc/netns/{ns}/resolv.conf'],
                           input=text, text=True, check=True, stdout=subprocess.DEVNULL)
            self.rule('nat', 'POSTROUTING', '-s', player['dataIP']+'/32', '-j', 'MASQUERADE')
            self.rule('filter', 'FORWARD', '-i', player['dataHost'], '-j', 'ACCEPT')
            self.rule('filter', 'FORWARD', '-o', player['dataHost'], '-m', 'conntrack',
                      '--ctstate', 'ESTABLISHED,RELATED', '-j', 'ACCEPT')
        return self.players

    def rule(self, table, chain, *args):
        rule = ['-t', table, chain, *args, '-m', 'comment', '--comment', self.tag]
        root('iptables', '-w', '-t', table, '-I', chain, *rule[3:])
        self.rules.append(rule)

    def close(self):
        for p in reversed(self.players):
            pids = root('ip', 'netns', 'pids', p['namespace'], check=False).stdout.split()
            if pids:
                root('kill', '-KILL', *pids, check=False)
            root('ip', 'netns', 'del', p['namespace'], check=False)
            for device in (p['dataHost'], p['controlDevice']):
                root('ip', 'link', 'del', device, check=False)
            root('rm', '-rf', f"/etc/netns/{p['namespace']}", check=False)
        for rule in reversed(self.rules):
            root('iptables', '-w', *rule[:2], '-D', *rule[2:], check=False)
        if self.forwarding is not None:
            root('sysctl', '-q', '-w', 'net.ipv4.ip_forward='+self.forwarding)


def throughput(player, reverse=False, control=False):
    address = player['host'] if control else player['dataIP']
    server = subprocess.Popen(['sudo', '-n', 'ip', 'netns', 'exec', player['namespace'],
                               'iperf3', '-s', '-1', '-B', address],
                              stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    try:
        time.sleep(0.3)
        result = run('iperf3', '-c', address, '-t', '5', '-J', *(['-R'] if reverse else []))
        data = json.loads(result.stdout)
        if 'error' in data:
            raise RuntimeError(data['error'])
        return data['end']['sum_received']['bits_per_second']
    finally:
        server.terminate()
        server.wait(timeout=5)


def smoke(players):
    # These are actual TCP measurements, not assertions about generated commands.
    p, other = players
    profile(p, True)
    down = throughput(p)
    up = throughput(p, reverse=True)
    control = throughput(p, control=True)
    fast = throughput(other)
    print(json.dumps(dict(download_bps=down, upload_bps=up,
                          control_bps=control, other_player_bps=fast)), flush=True)
    assert 300_000 < down < 1_400_000, f'Download shaping ineffective: {down}'
    assert 70_000 < up < 400_000, f'Upload shaping ineffective: {up}'
    assert control > 5_000_000, f'WebDriver link was throttled: {control}'
    assert fast > 5_000_000, f'Other player was throttled: {fast}'
    profile(p, False)
    recovered = throughput(p)
    assert recovered > 5_000_000, f'Fast profile did not recover: {recovered}'
    # Repeat with roles reversed to prove both sets of interfaces are wired correctly.
    profile(other, True)
    assert 70_000 < throughput(other, reverse=True) < 400_000
    profile(other, False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    parser.add_argument('--profile', choices=['slow', 'fast'])
    parser.add_argument('--player', type=int, choices=[0, 1])
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.profile:
        if args.player is None:
            parser.error('--profile requires --player')
        profile(json.loads(os.environ['QUIET_NETWORK_PLAYERS'])[args.player], args.profile == 'slow')
        return 0
    if sys.platform != 'linux' or os.getuid() == 0:
        parser.error('Run as a normal Linux user with passwordless sudo')
    for name in ('SIGTERM', 'SIGINT'):
        signal.signal(getattr(signal, name), lambda *_: sys.exit(130))
    lock = open('/tmp/quiet-network-tests.lock', 'w')
    fcntl.flock(lock, fcntl.LOCK_EX)
    network = Network()
    try:
        players = network.setup()
        smoke(players)
        if not args.self_test:
            command = args.command
            if command[:1] == ['--']:
                command = command[1:]
            if not command:
                parser.error('Supply --self-test or -- COMMAND')
            child = subprocess.Popen(command, start_new_session=True,
                                     env={**os.environ, 'QUIET_NETWORK_PLAYERS': json.dumps(players),
                                          'LOCAL_TRANSPORT': 'false'})
            try:
                return child.wait()
            finally:
                # Also reap the test runner on cancellation, not just its namespace children.
                try:
                    os.killpg(child.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
                try:
                    child.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    os.killpg(child.pid, signal.SIGKILL)
                    child.wait()
        return 0
    finally:
        network.close()


if __name__ == '__main__':
    sys.exit(main())
