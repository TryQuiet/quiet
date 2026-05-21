# leaveCommunity teardown hang

Tracking issue: [#3243](https://github.com/TryQuiet/quiet/issues/3243)

This document records what was learned investigating an Android bug where Quiet
hangs on the **"Starting backend"** screen after leaving a community. It is
written for whoever picks up the real fix — the bug is **not fixed** by the PR
that adds this document; the PR only adds an `it.failing` (xfail) regression
test that reproduces it.

## Symptom

On Android, leaving a community — especially **soon after joining** — sometimes
strands the app on "Starting backend" forever. If you then try to rejoin, it
strands instead on "Connecting process started". Only force-stopping the app
recovers it.

## Root cause

`ConnectionsManagerService.leaveCommunity()` runs, in order:

```
closeAllServices()        // closes the backend socket, stops libp2p, closes localDb
storageService.clean()    // tears down OrbitDB stores + IPFS/helia
libp2pService.cleanDatastore() / closeDatastore()
storageService.purgeData()
tor.resetHiddenServices()
resetState()              // communityState -> DEFAULT
localDbService.open()
openSocket()              // reopens the backend socket
qssService.resume()
```

`storageService.clean()` **intermittently deadlocks** while cleaning a channel's
OrbitDB store. The last backend log line is:

```
INFO backend:storage:channels:channelStore:general Cleaning channel store general_<id> general
```

…and then the backend goes silent. Because `leaveCommunity()` `await`s
`clean()` directly and never returns:

- It never reaches `openSocket()`. The backend socket — already closed by
  `closeAllServices()` earlier in the same method — is **never reopened**, so the
  frontend can't reach the backend and shows "Starting backend" indefinitely.
- `communityState` is left stuck at `LAUNCHED`.

The same `storageService.clean()` is also called on the join path
(`joinCommunity()` → `erasePreviousCommunityArtifacts()`), so a rejoin after a
wedged leave hangs the same way ("Connecting process started").

The deadlock itself is **intermittent and timing-sensitive** — observed when
leaving a community shortly after joining it (tearing storage down before it has
settled). On the same device, one leave completes in ~2 s and the next one
deadlocks. The deadlock lives in OrbitDB / helia channel-store teardown; its
exact mechanism was not root-caused here.

## Why the obvious fix does not work

The tempting fix is to bound the teardown with a timeout and continue:

```ts
try {
  await withTimeout(teardown(), 30_000)
} finally {
  await restoreApp()   // resetState + localDbService.open + openSocket + qssService.resume
}
```

This was implemented and tested on device. It **does** un-stick the leave: after
the timeout the socket reopens and the app returns to the join screen. But it is
**not a real fix**:

- `withTimeout` does not cancel the underlying promise. The deadlocked
  `storageService.clean()` keeps running as a detached **zombie**, still holding
  OrbitDB / IPFS instances, file handles and LevelDB locks.
- The next `joinCommunity()` calls `storageService.clean()` again (via
  `erasePreviousCommunityArtifacts()`), on the same poisoned storage layer — and
  hangs again. On device this reproduced exactly: leave "recovered" after the
  timeout, then the rejoin stuck on "Connecting process started".
- The timeout value is a red herring. A genuine deadlock never completes, so
  **any** timeout abandons a poisoning zombie. (A short timeout is worse still:
  it also trips on merely-slow teardowns of large communities, where the
  abandoned teardown then races the next join over the same OrbitDB/IPFS/fs
  state.)

In other words: **you cannot recover from a deadlocked storage layer in-process.**
The deadlocked instances and locks survive the timeout. The only thing that
reliably clears them is a fresh process — which is exactly what force-stopping
the app did.

## Real fix directions

1. **Fix the deadlock at the source** — determine why OrbitDB / helia
   channel-store teardown in `storageService.clean()` deadlocks, and make it
   hang-proof. This is the proper fix.
2. **If teardown cannot be made hang-proof, restart the backend process.**
   Detect the hang and cleanly restart the nodejs-mobile backend (automating the
   force-stop). A fresh process has no zombie. This needs the mobile host to
   respawn the node process after exit.
3. **Decouple the backend socket lifecycle from community teardown**, so the UI
   is never stranded on "Starting backend" even when teardown is slow or stuck.

## Investigation notes / gotchas

- **Logcat filtering**: the first capture used `adb logcat | grep com.quietmobile`,
  which silently dropped every backend log line that did not contain a filesystem
  path — making the backend look like it had gone silent right after libp2p
  datastore init, and leading to an initial misdiagnosis. Always capture backend
  logs by tag: `adb logcat -s NODEJS-MOBILE`.
- **Swiping the app away does not restart the backend.** A foreground service
  keeps the nodejs-mobile process alive; reopening the app sends a `wake` that is
  a no-op when the backend was never hibernated. Only a real force-stop restarts
  the backend.
- Reproducing the deadlock deterministically in a test is not practical (it is a
  race in OrbitDB/helia). The xfail test instead injects the failure — a
  `storageService.clean()` that never resolves — and asserts `leaveCommunity()`
  still completes. See `connections-manager.service.spec.ts`
  ("leaveCommunity completes even when storage teardown hangs").
