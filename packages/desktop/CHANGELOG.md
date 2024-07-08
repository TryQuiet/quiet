# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.2.1-alpha.0](https://github.com/TryQuiet/quiet/compare/@quiet/desktop@2.0.3-alpha.15...@quiet/desktop@2.2.1-alpha.0) (2024-07-08)


### Bug Fixes

* "Invite A Friend" tab now reads "Add Members" ([#2234](https://github.com/TryQuiet/quiet/issues/2234)) ([049cd56](https://github.com/TryQuiet/quiet/commit/049cd560b7fbdd31353f3565ab0498b60fddefa2))
* Add `patch` to requirements documentation ([#1766](https://github.com/TryQuiet/quiet/issues/1766)) ([8eb6fcc](https://github.com/TryQuiet/quiet/commit/8eb6fccae2a894af395826f8043b35cfdd9bf3b5))
* Allow JPEG and GIF images as profile photos [#2332](https://github.com/TryQuiet/quiet/issues/2332) ([#2353](https://github.com/TryQuiet/quiet/issues/2353)) ([233725f](https://github.com/TryQuiet/quiet/commit/233725f6872c0a2dceb5eab02622c529ee64b152))
* Clean up desktop UI console errors/warnings ([#2226](https://github.com/TryQuiet/quiet/issues/2226)) ([570a7a9](https://github.com/TryQuiet/quiet/commit/570a7a9ce61ce52fb05b86e84c91c4a5110e2f7b))
* cleanup username creation component ([#2216](https://github.com/TryQuiet/quiet/issues/2216)) ([1d03995](https://github.com/TryQuiet/quiet/commit/1d039952cf84e94fdcf8b66c395f634094ea3a6b))
* create jdenticon from pubKey, not username - to distinguish user… ([#2207](https://github.com/TryQuiet/quiet/issues/2207)) ([fd8bd06](https://github.com/TryQuiet/quiet/commit/fd8bd06a5f226e0da8189581c076ba9976633e7d))
* Enable channel context menu for all users ([#2206](https://github.com/TryQuiet/quiet/issues/2206)) ([02f6809](https://github.com/TryQuiet/quiet/commit/02f680903bb66faf52c007f66523096e449d6d31))
* Make community name field text visible on create community page ([#2233](https://github.com/TryQuiet/quiet/issues/2233)) ([0f4a33f](https://github.com/TryQuiet/quiet/commit/0f4a33f231797d2ee94fdafbbb7917c640556a6d))
* make sure local peer's address in in invitation link ([#2268](https://github.com/TryQuiet/quiet/issues/2268)) ([53f1ec9](https://github.com/TryQuiet/quiet/commit/53f1ec91da07efeb7861e504c4936728ff01062c))
* pasting multiple files [#1987](https://github.com/TryQuiet/quiet/issues/1987) ([#2306](https://github.com/TryQuiet/quiet/issues/2306)) ([7c6b669](https://github.com/TryQuiet/quiet/commit/7c6b6693bb05e83632dbf452761345524cc4e310))
* Quick fix for intro message race condition ([#2376](https://github.com/TryQuiet/quiet/issues/2376)) ([d4f7449](https://github.com/TryQuiet/quiet/commit/d4f744941db33cfc1aa0f519a0d90378ba90f574))
* Remove duplicate introduction messages once again ([#2296](https://github.com/TryQuiet/quiet/issues/2296)) ([655a812](https://github.com/TryQuiet/quiet/commit/655a8124e177dae57a67e60367d6afdb73e0cb1a))
* Remove unused dmPublicKey to prevent UI delay during joining ([#2392](https://github.com/TryQuiet/quiet/issues/2392)) ([3ba5b9a](https://github.com/TryQuiet/quiet/commit/3ba5b9a94501620777b4cf766506763abdc140f1))
* Updating channel naming logic ([#2307](https://github.com/TryQuiet/quiet/issues/2307)) ([38b007e](https://github.com/TryQuiet/quiet/commit/38b007e9319855afdb9b2150a3fbb782b9a688c3))
* Various fixes related to peers, CSRs and backend startup ([#2455](https://github.com/TryQuiet/quiet/issues/2455)) ([abd9101](https://github.com/TryQuiet/quiet/commit/abd9101f84149ae4ec1db3038fca31880334cdf3))


### Features

* [#1502](https://github.com/TryQuiet/quiet/issues/1502) get light/dark from native theme and access it through DRY function ([4d80746](https://github.com/TryQuiet/quiet/commit/4d8074674e324389a747d5a864b0efe96c282ee6))
* [#1502](https://github.com/TryQuiet/quiet/issues/1502) Implement dark mode, tidy up loose styles and unused classes. ([84bf50a](https://github.com/TryQuiet/quiet/commit/84bf50a3e4018530e077b04f1d63c4202792dd50))
* [#1502](https://github.com/TryQuiet/quiet/issues/1502) Let's do the Emoji picker too! ([17c1c67](https://github.com/TryQuiet/quiet/commit/17c1c67d829e5b78b169e3515095e95dabf595c0))
* [#1502](https://github.com/TryQuiet/quiet/issues/1502) make backgrounds on channel input and settings tabs the default ([1fb3969](https://github.com/TryQuiet/quiet/commit/1fb396900adcc1a1c27d671ace7e0be8cf50c55b))
* [#1502](https://github.com/TryQuiet/quiet/issues/1502) Remove hardcoded color and ensure contrast in tabs, more icon replacement ([cf106e0](https://github.com/TryQuiet/quiet/commit/cf106e08ae5b32d75b794b656fddc7e1fe1652ff))
* [#1502](https://github.com/TryQuiet/quiet/issues/1502) Replace hard-coded icons that weren't visible in dark mode ([1a1ce11](https://github.com/TryQuiet/quiet/commit/1a1ce116348acc341c327a5819fb6517c68c72a5))
* [#1502](https://github.com/TryQuiet/quiet/issues/1502) respect browser night-mode, fix sidebar and message highlight colors ([ecd239a](https://github.com/TryQuiet/quiet/commit/ecd239add006bca03519bb8d79ef1bc05db42928))
* [#1502](https://github.com/TryQuiet/quiet/issues/1502) tweak light-mode sidebar background ([663afcd](https://github.com/TryQuiet/quiet/commit/663afcd42976f161392e768032a605a7fb342a6d))
* [#1502](https://github.com/TryQuiet/quiet/issues/1502) Tweak more backgrounds in sidebar, Jdenticons, etc. ([d3fabeb](https://github.com/TryQuiet/quiet/commit/d3fabeb3ed8d08e6d3d1eafc308be806a2181159))
* [#1502](https://github.com/TryQuiet/quiet/issues/1502) update sidebar's selected item background to match Figmas ([3d50808](https://github.com/TryQuiet/quiet/commit/3d508086e778a61bdeefbd3417acad5220572562))
* 2312 pass invitation data to createNetwork saga and LAUNCH_COMMUNITY… ([#2438](https://github.com/TryQuiet/quiet/issues/2438)) ([de6f0cd](https://github.com/TryQuiet/quiet/commit/de6f0cda1b07ba7715cfb4876e51e423c5e9b9d0))
* Add user profile feature for desktop ([#1923](https://github.com/TryQuiet/quiet/issues/1923)) ([d016be5](https://github.com/TryQuiet/quiet/commit/d016be5a162560962c6059d73db6ab005fb023e8))
* Feat/519 big emoji messages ([#2389](https://github.com/TryQuiet/quiet/issues/2389)) ([71c8b22](https://github.com/TryQuiet/quiet/commit/71c8b226c81430c4eb741ca0903b8a27f67e259b))





[unreleased]

# New features:

* Update settings to match designs([#2537](https://github.com/TryQuiet/quiet/issues/2537))

# Refactorings:

# Fixes:

* Update github workflows for PR gating ([#2487](https://github.com/TryQuiet/quiet/issues/2487))
* Don't create duplicate CSRs when joining a community under certain circumstances ([#2321](https://github.com/TryQuiet/quiet/issues/2321))

[2.2.0]

# New features:

* Add utilities for emoji detection in messages and make all-emoji message larger font size ([#519](https://github.com/TryQuiet/quiet/issues/519))

# Refactorings:

* Use ack for CREATE_NETWORK and simplify
* Move Community model to the backend

# Fixes:

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
