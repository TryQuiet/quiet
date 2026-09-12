#!/usr/bin/env python3
"""ADB executable adapter for a dedicated remote emulator (environment configured)."""
import os
import shlex
import sys

if __name__ == '__main__':
    command = ['env', 'ADB_SERVER_SOCKET=' + os.environ['REMOTE_ADB_SOCKET'],
               os.environ['REMOTE_ADB'], *sys.argv[1:]]
    # Replace the adapter so the caller's timeout terminates SSH itself rather
    # than leaving a grandchild holding the captured output pipe open.
    os.execvp('ssh', ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
                     '-o', 'ServerAliveInterval=10', '-o', 'ServerAliveCountMax=2',
                     os.environ['REMOTE_HOST'], shlex.join(command)])
