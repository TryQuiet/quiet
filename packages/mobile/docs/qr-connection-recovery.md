# QR invitation connection recovery (#3427)

The reported iPhone SE failure loses the local frontend connection during the
return from scanning an invitation. The backend continues running, but repeated
polling requests fail and the deep-link handler never reaches joining. The logs
also show Tor control refusing connections; they do not prove which native socket
or iOS subsystem first failed.

When disconnected, foreground/deep-link recovery asks the native bridge for its
current backend port and secret, and sends `_RECOVER_WEBSOCKET_`. iOS forwards
`recoverSocket` on `_SYSTEM_`; Android uses the equivalent `_EVENTS_` envelope.
The backend probes its local TCP listener and rebinds an unreachable listener,
retaining Socket.IO's authentication and application handlers. Recovery requests
coalesce and cannot reopen a backend explicitly being shut down. Native recovery
does not change Tor, keys, community data or the backend process.
An explicit reopen after leaving a community enables recovery for the new listener
lifetime; pending callbacks from the previous lifetime cannot reopen or replace it.

The frontend recreates an unhealthy Engine.IO session even when Socket.IO still
considers its automatic reconnect loop active. Fresh native connection details
supersede the old socket. Three attempts at four-second intervals are bounded;
healthy resumes preserve the existing socket and state-manager task. Actual
disconnect still cancels that task, so pending onboarding transaction recovery
is handled separately by #3426.

A valid deep link waits up to 15 seconds before showing an actionable error. Its
Continue callback retries the original invitation. Invite credentials stay in
memory, matching existing onboarding; they are not persisted across process exit.

## Verification

From `packages/mobile`:

```sh
node node_modules/jest/bin/jest.js src/tests/localConnection.recovery.test.ts src/store/init/startConnection/startConnection.saga.test.ts src/store/init/deepLink/deepLink.saga.test.ts src/store/nativeServices/events/nativeServicesCallbacks.test.ts --runInBand --silent
node node_modules/typescript/bin/tsc -p tsconfig.build.json --noEmit
```

From `packages/backend`:

```sh
node --experimental-vm-modules node_modules/jest/bin/jest.js src/nest/socket/socket.recovery.spec.ts src/nest/socket/socket.service.spec.ts src/rn-bridge.spec.ts --runInBand --silent
node node_modules/typescript/bin/tsc -p tsconfig.build.json --noEmit
```

The mobile transport tests use a real Socket.IO client and the backend's installed
Socket.IO server. They interrupt a working listener, recover the same port or
refresh a changed port and credential, then assert exactly one join action. They
also check healthy resumes and repeated native announcements. Backend tests
exercise the real bridge codecs and TCP listener, authentication after recovery,
a stale listening flag, coalescing, shutdown exclusion, explicit reopen after leave,
stale recovery callbacks across reopen, and a failed/retried bind.
The bounded UI test invokes the actual retry callback with its original invite,
including when native bridge calls throw.

These tests passed on Linux. The native iOS/Android bridge entry points were not
compiled or run on devices for this change. Before release, repeat cold and warm
QR return on the affected iPhone SE, including during Tor startup, then complete
username/terms/join. Confirm local socket recovery and collect native logs if Tor
continues failing. Repeat a healthy foreground/background cycle on iPhone 13 Pro
and Android. No claim is made that these host tests reproduce the exact iOS fault.
