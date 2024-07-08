# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.2.1-alpha.0](https://github.com/TryQuiet/quiet/compare/@quiet/mobile@2.0.3-alpha.17...@quiet/mobile@2.2.1-alpha.0) (2024-07-08)


### Bug Fixes

* Add `patch` to requirements documentation ([#1766](https://github.com/TryQuiet/quiet/issues/1766)) ([8eb6fcc](https://github.com/TryQuiet/quiet/commit/8eb6fccae2a894af395826f8043b35cfdd9bf3b5))
* Add retry ability to tor-control and update Tor port on resume ([#2360](https://github.com/TryQuiet/quiet/issues/2360)) ([9517f08](https://github.com/TryQuiet/quiet/commit/9517f0876be58c00f745c6c514778e657590a99e))
* Adds a quick fix for the iOS sync issue after suspend ([#2414](https://github.com/TryQuiet/quiet/issues/2414)) ([151895d](https://github.com/TryQuiet/quiet/commit/151895db4a74290c010ed1edf87f540c092de673))
* ask push notification runtime permission on Android ([#2213](https://github.com/TryQuiet/quiet/issues/2213)) ([2f92e88](https://github.com/TryQuiet/quiet/commit/2f92e88d488a5a98eae5bf6d42a5485b98c6be99))
* calling init websocket connection ([#2261](https://github.com/TryQuiet/quiet/issues/2261)) ([fe1d9dd](https://github.com/TryQuiet/quiet/commit/fe1d9dda73ffaad585c87701bcb9658af0389362))
* cleanup username creation component ([#2216](https://github.com/TryQuiet/quiet/issues/2216)) ([1d03995](https://github.com/TryQuiet/quiet/commit/1d039952cf84e94fdcf8b66c395f634094ea3a6b))
* create jdenticon from pubKey, not username - to distinguish user… ([#2207](https://github.com/TryQuiet/quiet/issues/2207)) ([fd8bd06](https://github.com/TryQuiet/quiet/commit/fd8bd06a5f226e0da8189581c076ba9976633e7d))
* deep linking issues ([#2154](https://github.com/TryQuiet/quiet/issues/2154)) ([2867264](https://github.com/TryQuiet/quiet/commit/28672643b4e91d4782cbd3b7aae04b769000d4c7)), closes [#1970](https://github.com/TryQuiet/quiet/issues/1970)
* delay node start ([#2300](https://github.com/TryQuiet/quiet/issues/2300)) ([810f7c3](https://github.com/TryQuiet/quiet/commit/810f7c39a9b33952aa8316873a6c0d053c3e41a5))
* make sure local peer's address in in invitation link ([#2268](https://github.com/TryQuiet/quiet/issues/2268)) ([53f1ec9](https://github.com/TryQuiet/quiet/commit/53f1ec91da07efeb7861e504c4936728ff01062c))
* postpone restore connection saga ([#2462](https://github.com/TryQuiet/quiet/issues/2462)) ([b8ef745](https://github.com/TryQuiet/quiet/commit/b8ef7450c8a3364ed99e6240e2add0c7a73ea271))
* Reduce max random port on iOS ([#2402](https://github.com/TryQuiet/quiet/issues/2402)) ([2c783aa](https://github.com/TryQuiet/quiet/commit/2c783aa69b8d3e3214baf8f75aabd77dfbc9aa3e))
* Remove unused dmPublicKey to prevent UI delay during joining ([#2392](https://github.com/TryQuiet/quiet/issues/2392)) ([3ba5b9a](https://github.com/TryQuiet/quiet/commit/3ba5b9a94501620777b4cf766506763abdc140f1))
* Reorder the closing of services, prevent sagas running multiple times and close backend server properly ([#2499](https://github.com/TryQuiet/quiet/issues/2499)) ([1eef06c](https://github.com/TryQuiet/quiet/commit/1eef06cd0c113e58509bc39ba99b5b9140647ecb))
* start websocket connection on react init ([#2481](https://github.com/TryQuiet/quiet/issues/2481)) ([611af21](https://github.com/TryQuiet/quiet/commit/611af21d316b80767190df5bda498ed2a810a058))
* Updating channel naming logic ([#2307](https://github.com/TryQuiet/quiet/issues/2307)) ([38b007e](https://github.com/TryQuiet/quiet/commit/38b007e9319855afdb9b2150a3fbb782b9a688c3))
* Use useLegacyPackaging feature in Gradle ([#2384](https://github.com/TryQuiet/quiet/issues/2384)) ([125ec4e](https://github.com/TryQuiet/quiet/commit/125ec4e96f81cdeb9c6df44fa2a0ae281bc0e064))
* Various fixes related to peers, CSRs and backend startup ([#2455](https://github.com/TryQuiet/quiet/issues/2455)) ([abd9101](https://github.com/TryQuiet/quiet/commit/abd9101f84149ae4ec1db3038fca31880334cdf3))


### Features

* 2312 pass invitation data to createNetwork saga and LAUNCH_COMMUNITY… ([#2438](https://github.com/TryQuiet/quiet/issues/2438)) ([de6f0cd](https://github.com/TryQuiet/quiet/commit/de6f0cda1b07ba7715cfb4876e51e423c5e9b9d0))
* Add user profile feature for desktop ([#1923](https://github.com/TryQuiet/quiet/issues/1923)) ([d016be5](https://github.com/TryQuiet/quiet/commit/d016be5a162560962c6059d73db6ab005fb023e8))





[unreleased]

# New features:

# Refactorings:

# Fixes:

* Fixes issue with reconnecting to peers on resume on iOS ([#2424](https://github.com/TryQuiet/quiet/issues/2424))
* Update github workflows for PR gating ([#2487](https://github.com/TryQuiet/quiet/issues/2487))
* Don't create duplicate CSRs when joining a community under certain circumstances ([#2321](https://github.com/TryQuiet/quiet/issues/2321))

[2.2.0]

# New features:

* Add utilities for emoji detection in messages and make all-emoji message larger font size ([#519](https://github.com/TryQuiet/quiet/issues/519))

# Refactorings:

* Use ack for CREATE_NETWORK and simplify
* Move Community model to the backend

# Fixes:

* Allow JPEG and GIF files as profile photos ([#2332](https://github.com/TryQuiet/quiet/issues/2332))
* Fix issues with recreating general channel when deleted while offline ([#2334](https://github.com/TryQuiet/quiet/issues/2334))
* Fix package.json license inconsistency
* Fixes issue with reconnecting to peers on resume on iOS ([#2424](https://github.com/TryQuiet/quiet/issues/2424))
* Reorder the closing of services, prevent sagas running multiple times and close backend server properly
* Fixes issue with image messages not displaying/throwing errors on iOS ([#2526](https://github.com/TryQuiet/quiet/issues/2526))

[2.1.2]

# Refactorings:

* Rename and reorganize frontend/backend events API
* Rename message retrieval events/sagas and use ack feature
* Rename LOAD_MESSAGES event and incomingMessages reducer
* Use socket.io ack for CREATE_CHANNEL event
* Introduce socket.io acknowledgements

# Fixes:

* Fixes channel name creation logic
* Remove duplicate introduction messages once again
* Prevent channel creation with names that start with special character, then a hyphen
* Choose random ports for Tor services (iOS)
* Use consistent identicons for messages and profile
* Add retry ability to tor-control and misc tor-control fixes

# Other:

* Upgraded React-Native to 0.73.2

[2.1.1]

# Fixes:

* Make sure address of the inviting peer is in the invitation link
* Opening the mobile app with joining links has been corrected.

# Refactorings:

* Remove unused backend events and state-manager event types

[2.1.0]

# New features:

* Added user profile feature.
* Updated old logo of Linux and Windows with rounded ones.

# Fixes:

* Handle spaces in tor process path.
* Run tor process in shell.

# Refactorings:

* Refactor registration service, replace promise waiting mechanism around certificate requests and help prevent duplicate username registration
* Removed SAVE_OWNER_CERTIFICATE event.
* Removed registrar reminders and rename LAUNCH_REGISTRAR.
* Removed unused SEND_USER_CERTIFICATE event.
* Removed unused SUBSCRIBE_FOR events.

[2.0.1]

# Fixes:

 * Desktop UI console errors/warnings have been cleaned up.
 * The channel context menu is now enabled for all users.
 * A bug that impersonated the channel creation message due to the removal of the username has been fixed.
 * Large file downloads are now slower but steadier.
 * The username changing form has been fixed.
 * Push notifications runtime permission is now requested on Android.
 * Users joining a community will no longer receive multiple "welcome" messages.
 * Users sharing the same nickname now have different profile images.

[2.0.0]

# Breaking changes:

* To let users join when the owner is offline we made changes that broke backwards compatibility, so you will need to create a new community and re-invite members. Need help migrating? [help@quiet.chat](mailto:help@quiet.chat)

# New Features:

* Users can join a community when its owner is offline. This was a big one!
* Desktop and mobile users can send markdown messages. (Thanks again @josephlacey!)
* Desktop users can now export chats to a text file. (Thanks @rajdip-b!)

# Improvements:

* Prettier message loading indicator on mobile
* Better descriptions of the joining process
* Validation of community metadata and certificates
* A real iOS launch screen (so long, "Powered by React Native"!)
* A nice splash screen on mobile until the joining/creating screens are ready
* Clearer autoupdate language in the update modal, so users know that the app will update on restart

# Fixes:

* Mobile apps should no longer crash on restart.
* Joining community no longer gets stuck on "initiating backend modules."
* Invalid peer addresses in peer list are now filtered out, and peer list is updated in localdb.
* Peers now dial new users without having to restart.
* Up/down arrows are now working properly inside channel input. (Thanks @josephlacey!)
* Long messages are no longer truncated in channelInput component.
* Users can change between "join community" and "create community" screens without errors about a missing required field.
* On iOS, there's more weird empty space between the input field and the soft keyboard.
* The UI for users already in a community joining a new community is no longer misleading, so users will not accidentally leave a community by opening a new invite link.
* Desktop settings now open the "invite" tab by default, as they were meant to.
* We now initialize electron-store after setting appData to prevent creating an empty "Quiet" data directory.

# Notes

* Quiet now labels duplicate unregistered usernames
* Quiet shows an full-screen warning for duplicate registered usernames, since these should never happen and indicate a potential compromise.
* For authenticating connections, Quiet now uses libp2p's [Pre-shared Key Based Private Networks](https://github.com/libp2p/specs/blob/master/pnet/Private-Networks-PSK-V1.md) instead of X.509 certificates so peers can connect before registering.

[2.0.3-alpha.16]

* Fix: mobile app crashing on restart

* Refactor: backend, storage module - extracting OrbitDB as another provider, refactor of  CertificatesRequestsStore, CommunityMetadataStore, CertificatesStore as Nest providers, store tests adjustments,  file structure

[2.0.3-alpha.15]

* Fix: construct all stores before initializing them - initializing community metadata store sets metadata in certificates store

* Fix: joining community stuck on "initiation backend modules"

* Add debug logs.

[2.0.3-alpha.14]

* Add community metadata validation.

* Move community metadata to separate store.

[2.0.3-alpha.13]

* Initialize electron-store after setting appData to prevent creating empty "Quiet" data directory

* Fixed UI for Update Modal

* Fixed username taken logic

* Add test-case in e2e multiple test for using username taken modal

[2.0.3-alpha.12]

* Better descriptions of the joining process

* Update custom deps repositiries (upload-s3-action, ipfs-pubsub-peer-monitor)

* Add certificates validation.

* Move certificates to separate store.

* Move csrs to separate store.

* Fix saveUserCsr saga to trigger only if user csr is absent in user slice.

* Send an info message immediately after a user joins the community

* Feature: add functionality to export chat to text document in desktop version

[2.0.3-alpha.6]

* Fix: filter out invalid peer addresses in peer list. Update peer list in localdb.

* Fix: dial new peers on CSRs replication

[2.0.3-alpha.5]

* Fix network data proceeding when using custom protocol multiple times #1847

* Backward incompatible change: use pre shared key as connection protector in libp2p. Add libp2p psk to invitation link

* Removed code responsible for data translation from channel address to channel id from state manager transforms and storage service

[2.0.3-alpha.1]

* Temporarily hiding leave community button from Possible impersonation attack

[2.0.3-alpha.0]

* Filter CSRs - remove old csrs and replace with new for each pubkey

* Fixed mobile bugs - joining by QR code and not showing username taken screen for user who has unique name

* Use context menu for information about unregistered username instead screen

* Shorter dots-placeholder for invite link

* Display a shorter invite link on a mobile

* Removed registration attempts selector and corresponding usage.

* Revert adjusting bootstrap scripts for developing on Windows

* Channel input - replaced ContentEditable with textarea

* Fix - up/down arrows now work properly inside channel input (textarea)

[2.0.1-alpha.2]

* UI layer for taken usernames for desktop and mobile

* Change nickname for taken username

* Map messages sent before changing username

* Update registrar service to match new registration flow.

* Add possible impersonation attack UI for desktop and mobile

* Fix truncated long messages in channelInput component

* Unblock mobile e2e tests

* Prettify loading component on Chat screen (mobile)

* Running Chromatic tests for forked PRs

* Added e2e test for user joining community when owner is offline. Improved e2e tests

* Bump github actions/* to versions using node16

* Project can now be bootstraped on Windows (powershell)

* Placeholder(...) for community name

* No unregistered/duplicated label for system messages

[2.0.0-alpha.11]

* Customize Launch Screen on iOS

* Suspends certain websocket events until backend becomes fully operative (faster and dumber frontend).

* Replaced greying out inputs with splash screen on joining/creating screens.

* Fixes empty space between chat's input and a soft keyboard on iOS devices.

* Changed registration process - user connects to the libp2p network directly instead of using registrar. Invitation link format changed. User csr is now saved to database.

* Fixed android stucking on username registration screen introduced in previous alpha.

* Added creator username to initial channel message.

* Fixed bug with changing joining community/create community screens with required field.

* Fixed bug with displaying incorrect default settings tab.

* Replaced source of publicKey in sendMessage saga to CSR

* Labels for unregistered and duplicate usernames with modals

* Fixed LoadingPanel useEffect bug.

* Use csrs instead of certificates as a source of user data

* Integration state manager layer with UI layer(desktop and mobile)

* Clarify autoupdate language in update modal to let users know that the app will update on restart.

* C4 for Quiet architecture. Context and Container diagrams.

* Invite tab as default in settings
