You are continuing implementation of iOS push notifications for the
  Quiet app (branch: fix/notification-mvp-tweaks in
  /Users/taea/dev/quiet).

  ## What this feature does
  When a Quiet community member sends a message, FCM fires a push
  notification to all iOS devices. The iOS Notification Service
  Extension (NSE) intercepts it, authenticates with QSS, fetches new
  OrbitDB log entries, and increments the badge count — all before the
   notification is displayed.

  ## Session 0

  ### QSS backend (3rd-party/qss/)
  - NEW: `app/src/nest/nse-auth/` module with three REST endpoints:
    - `POST /nse-auth/challenge` — issues LFA-style challenge
  `{type:'DEVICE', name:deviceId, nonce, timestamp}`
    - `POST /nse-auth/token` — verifies Ed25519 signature (libsodium +
   msgpackr) and returns 15-min JWT
    - `GET /nse-auth/logs/:teamId?since=<ms>` — JWT-guarded; returns
  log entries with Buffer serialized as `{type:'Buffer',data:[...]}`
  - TODO: Add `NSE_JWT_SECRET` env var to `.env.local.docker` and prod
   env

  ### iOS NSE (packages/mobile/ios/QuietNotificationServiceExtension/)
  - `NotificationService.swift` — full fetch/auth/badge flow (reads
  teamId+qssUrl from APNs payload)
  - `NSEAuthService.swift`, `NSENetworkClient.swift`,
  `NSECryptoService.swift`, `NSEKeychainHelper.swift`,
  `NSEModels.swift` — complete auth+fetch stack
  - `NSECryptoService` signs with CryptoKit Ed25519; `ProofPayload`
  now includes both `signature` and `publicKey`
  - `NSEKeychainHelper.getDevicePrivateKey` Base58-decodes the stored
  LFA key before returning raw bytes
  - All three entitlements files now declare `group.com.quietmobile`
  in `com.apple.security.application-groups`

  ### Device credentials pipeline (new end-to-end)
  - `@quiet/types`: `DeviceCredentialsUpdatedEvent` type +
  `SocketEvents.DEVICE_CREDENTIALS_UPDATED`
  - `sigchain.service.ts`: emits deviceId, teamId, signing private key
   on iOS on every chain update
  - Mobile state-manager: new `saveDeviceCredentials` action/saga
  wired to the socket event
  - `CommunicationModule.swift`:
  `saveDeviceCredentials(_:teamId:signingPrivateKey:)` writes to
  Keychain with `group.com.quietmobile` +
  `kSecAttrAccessibleAfterFirstUnlock`
  - `CommunicationBridge.m`: ObjC bridge registered

  ### FCM payload fix (packages/backend/)
  - `qps.service.ts` `sendBatchPush` now injects `teamId` and `qssUrl`
   into the FCM data payload so the NSE guard clauses pass

  ### LAN config (3rd-party/qss/app/)
  - `docker-compose.quiet.yml`: bridge binding changed from
  `127.0.0.1` → `0.0.0.0`
  - `.env.local.docker`: `QSS_HOSTNAME=192.168.1.175` (update if IP
  changes)
  - Quiet backend needs `QSS_ENDPOINT=http://192.168.1.175:3003` in
  its env at launch

  ## Known remaining gaps

  1. **Device registration with QSS NSE auth** — the
  `/nse-auth/challenge` endpoint currently issues a challenge to any
  deviceId without verifying the device is actually registered.
  There's a TODO comment in `nse-auth.service.ts` to add UCAN-level
  trust anchor verification (check that the public key in the proof
  belongs to a UCAN registered for that device+team).

  2. **`NSEKeychainHelper.lastSyncTimestamp` uses
  `UserDefaults.standard`** — this is NOT shared with the main app. If
   you want to seed an initial timestamp (to avoid fetching all
  history on first run), the main app should write it using
  `UserDefaults(suiteName: "group.com.quietmobile")` and the NSE
  should read from the same suite.

  3. **`UserDefaults` for lastSyncTimestamp not in app group** —
  `NSEKeychainHelper` uses `UserDefaults.standard` which is
  process-local. Update both writer (if any) and reader to use
  `UserDefaults(suiteName: "group.com.quietmobile")`.

  4. **Rebuild needed** — after the `qps.service.ts` and
  `sigchain.service.ts` changes, rebuild the backend bundle: `npx
  lerna run prepare --scope @quiet/backend`

  5. **QSS needs `NSE_JWT_SECRET`** — add to `.env.local.docker` for
  stable JWT signing across restarts.

  6. **Test flow** — once rebuilt and redeployed:
     - Confirm `quiet.device.id`, `quiet.device.privateKey.*`,
  `quiet.team.id` appear in Keychain (check Console.app for
  `saveDeviceCredentials: stored` logs)
     - Send a message; check Console.app filtered to
  `com.quietmobile.QuietNotificationServiceExtension`
     - Look for `fetchAndUpdate: fetching entries since=`, auth logs,
  and badge update

  ## Architecture reference
  - NSE files:
  `packages/mobile/ios/QuietNotificationServiceExtension/`
  - Main app bridge: `packages/mobile/ios/CommunicationModule.swift` +
   `CommunicationBridge.m`
  - Backend QPS: `packages/backend/src/nest/qps/qps.service.ts`
  - QSS NSE auth: `3rd-party/qss/app/src/nest/nse-auth/`
  - Types: `packages/types/src/keys.ts`,
  `packages/types/src/socket.ts`
  - Mobile sagas: `packages/mobile/src/store/keys/`

  Continue from here.

## Session 1

### Fixed: UserDefaults → shared app group suite
- `NSEKeychainHelper.getLastSyncTimestamp` and `saveLastSyncTimestamp` now use
  `UserDefaults(suiteName: "group.com.quietmobile")` instead of `UserDefaults.standard`.
- This allows the main app to seed an initial timestamp, and the NSE to read
  the same value — both run in the same App Group.

### Fixed: NSE_JWT_SECRET added to .env.local.docker
- Added `NSE_JWT_SECRET=change-me-in-production` to
  `3rd-party/qss/app/.env.local.docker`.
- Without this, QSS generates a random per-process fallback secret so tokens
  become invalid across restarts.

## Session 2

### Fixed: NSEMsgpack encoding mismatch (critical — signatures always failed)

`msgpackr.pack()` uses two non-obvious encodings that the hand-rolled Swift
encoder was getting wrong, causing signature verification to always fail:

1. **Map header**: msgpackr uses `map16` (`0xde 0x00 0x04`) for ALL object
   sizes, never `fixmap`. The Swift encoder was emitting `0x84` (fixmap).

2. **Timestamp encoding**: JavaScript's `Date.now()` returns ~1.7e12, which
   exceeds 2^32. msgpackr encodes values > 2^32 as `float64` (`0xcb` + 8-byte
   IEEE 754), not `uint64`. The Swift encoder was emitting `uint64` (`0xcf`).

Verification (msgpackr output):
```
de0004 a474797065 a644455649...  a974696d657374616d70 cb4278e5f8c1600000
^^^                                                    ^^ float64, not 0xcf
map16
```

Fix: updated `NSEMsgpack.encode()` in `NSECryptoService.swift` to emit
`map16` header and `appendFloat64()` instead of `appendUInt64()` for the
timestamp field.

## Session 3

### Fixed: kSecAttrAccessible removed from Keychain read query
`NSEKeychainHelper.readData` was including `kSecAttrAccessible` in
`SecItemCopyMatching`. Apple's docs list it as a write attribute only;
including it in a search query can silently prevent matches on some iOS
versions. Removed from all read queries (accessibility is enforced at
write time in `CommunicationModule.swift`).

### Fixed: qssUrl scheme mismatch (ws:// → http://)
`qps.service.ts` was sending `qssEndpoint` directly in the FCM data
payload. `qssEndpoint` is a WebSocket URL (`ws://host:port`). The NSE
uses this URL for HTTP REST calls via `URLSession.data(for:)`, which
does not support the `ws://` scheme and would throw
"unsupported URL scheme". Fix: replace `ws://` → `http://` and
`wss://` → `https://` before putting the URL in the FCM payload.

## Session 4

### Fixed: ISO8601DateFormatter missing .withFractionalSeconds
`NotificationService.swift` used `ISO8601DateFormatter()` with default
options to parse `receivedAt` timestamps from QSS log entries. Luxon's
`DateTime.toISO()` always includes milliseconds (`"...T10:00:00.000Z"`),
which the default formatter cannot parse — `compactMap` would return `[]`
for all entries, making `newTs` nil and triggering the "advancing sync
pointer by 1ms" fallback. Badge would always be wrong.
Fixed by configuring formatter with `[.withInternetDateTime, .withFractionalSeconds]`.

### Verified clean: end-to-end flow audit
Full trace reviewed — no additional blocking issues found:
- `communityId` in QSS log entries = `sigchain.team.id` = `teamId` in FCM payload ✓
- `LogEntriesResponse { entries: [...] }` matches Swift `LogEntriesResponse.entries` decoder ✓
- `entry` NodeBuffer `{type:"Buffer",data:[...]}` decodes correctly to `Data` in Swift ✓
- `kSecAttrAccessGroup: "group.com.quietmobile"` with App Group entitlement is valid
  for cross-process Keychain sharing (NSE + main app, no keychain-access-groups needed) ✓
- `KeychainHelper.swift` in NSE folder is unrelated dead code; NSE uses `NSEKeychainHelper` ✓
- `process.platform === 'ios'` in nodejs-mobile confirmed by existing codebase patterns ✓

## Feature status: READY FOR TESTING

All known blocking code bugs fixed across 4 sessions. Remaining items
require user action:

1. **Backend rebuild** — `npx lerna run prepare --scope @quiet/backend`
2. **QSS redeploy** — `docker compose -f docker-compose.quiet.yml up -d` in `3rd-party/qss/app/`
3. **Test on device**:
   - Launch app → join community → watch Console.app for `saveDeviceCredentials: stored`
   - From another device, send a message
   - Watch NSE Console.app for `fetchAndUpdate: teamId=`, `authenticate:`, `fetched X entries`, badge update
4. **UCAN trust** (post-MVP) — `/nse-auth/challenge` should verify the device public key
   is registered in the @localfirst/auth sigchain for the teamId (TODO comment in `nse-auth.service.ts`)

## Session 5

### Loop terminating — feature complete

No remaining blocking code bugs. All 4 sessions of fixes are committed. Remaining items
are all user-action (rebuild, redeploy, device test) or post-MVP (UCAN trust).
Recurring cron job f1f8b51a deleted.
