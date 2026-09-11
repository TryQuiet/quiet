# Direct messages on the v10 release branch

This work is based on Quiet's `10.0.0` release branch. The desktop and Android UI builds on the existing DM work in Quiet #3263 and the mobile DM branch. It retains the v10 fixes for sigchain authorship, account/device admission, invitation replay, OrbitDB writer binding, native notification authentication, and attachment metadata validation.

## Security boundary

A DM has an immutable list of participant accounts. Its random 256-bit encryption key is delivered in authenticated asymmetric boxes to those accounts' USER encryption keys. There is no LFA role for a DM: community administrators can obtain role keys and therefore cannot be excluded by a conventional private-channel role. A participant can always disclose a message or key they possess.

The creator signs a versioned manifest binding the team, creator, random nonce, creation time, sorted participants, key commitment and recipient boxes. Its hash defines the `dm_` conversation ID. Each recipient box also binds the manifest core, recipient, key generation and key commitment. Replicas verify creator/device authorship before storing metadata; only participants can open a box. Metadata replacement and deletion are rejected. Participant IDs and other manifest metadata are visible to community replicas and the server; this protocol protects content, not the social graph or traffic timing.

Every message binds its team, conversation, author, ID, timestamp, key scope and ciphertext in the USER signature. The authenticated OrbitDB device writer must belong to that same author. Decryption and schema validation precede UI, unread and notification events. Author-prefixed IDs prevent another participant from overwriting a victim's message in shared state; duplicate IDs do not generate duplicate delivery effects, including after reload.

Attachments use the DM key with secretstream encryption. Signed metadata binds the file to its parent message and DM scope. A complete authenticated FINAL marker is mandatory, including for empty streams. Failed, aborted, truncated, reordered or corrupted downloads do not publish a media update and remove any partial plaintext file. Missing DM keys never fall back to community encryption.

Account USER keys allow a legitimately admitted linked device to open earlier descriptors and history. Tests exercise the real device invitation, possession proof and starter-lockbox key recovery. V10 has no complete device-linking UI. V10 protocol 4 disables removal and key rotation; this change does not claim revocation, forward secrecy, or post-compromise recovery.

Android and iOS background notification readers suppress DM previews because they do not implement this DM transcript verifier. Active backend notifications use the verified message path. iOS cannot be built or run on this Linux host; native execution coverage is Android.

## Local validation

Focused tests cover raw outsider/admin decryption attempts, real signed OrbitDB entries, metadata mutation, participant-signed attachment redirection, cross-conversation replay, author-ID collisions, linked-device history, notification suppression, and real filesystem cleanup. UI/state tests cover acknowledged DM creation and binding the first message to the returned conversation ID.

The opt-in `multipleClients.secureDms.crossPlatform.test.ts` launches desktop admin and participant clients plus Detox on an explicitly selected Android device. It joins through real invitations, exchanges text and a file, compares downloaded file contents, restarts participants, and checks QSS catch-up while the admin's DM list remains empty. `QUIET_DM_ANDROID_DEVICE` must name a dedicated test device; the suite clears that app's data. Set `ADB_PATH`, `ANDROID_HOME`, `FILE_NAME`, and `QSS_ENDPOINT` for the local fixtures. The existing desktop DM suites cover additional individual/group/self conversations.

On a Linux x86_64 emulator, ARM translation can deadlock while the bundled Node runtime forks Tor. `packages/mobile/scripts/prepare-android-emulator.sh` prepares pinned x86_64 Node.js Mobile 18.20.4, signed Tor 0.4.9.11 from Tor Browser 15.0.21, and cross-compiles the installed classic-level binding. Then build Android with `-PquietNativeAbi=x86_64 -PreactNativeArchitectures=x86_64`; default builds retain ARM64. The generated binaries are ignored. This changes the native architecture, not the JS application or DM protocol.

Final commands, results and the Daybreak Blue review disposition will be recorded in the PR after the local execution and review complete.
