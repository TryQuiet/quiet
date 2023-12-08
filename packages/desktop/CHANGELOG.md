# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.3-alpha.14](https://github.com/TryQuiet/quiet/compare/@quiet/desktop@2.0.3-alpha.13...@quiet/desktop@2.0.3-alpha.14) (2023-12-08)


### Features

* Add community metadata validation ([#2073](https://github.com/TryQuiet/quiet/issues/2073)) ([5780574](https://github.com/TryQuiet/quiet/commit/57805747f08261d0709554266e36fd0005eca839))





## [2.0.3-alpha.13](https://github.com/TryQuiet/quiet/compare/@quiet/desktop@2.0.3-alpha.12...@quiet/desktop@2.0.3-alpha.13) (2023-12-07)


### Bug Fixes

* initialize electron store after setting new appData, otherwise i… ([#2150](https://github.com/TryQuiet/quiet/issues/2150)) ([ed9eb26](https://github.com/TryQuiet/quiet/commit/ed9eb266dae0a41531bb048d4a997e870c6c92c2))
* send csr if local and stored ones differs ([#2147](https://github.com/TryQuiet/quiet/issues/2147)) ([b640d16](https://github.com/TryQuiet/quiet/commit/b640d1617ec58bb93129adaf8dfebe09c8de625c))


### Features

* fixed UI for modal ([#2151](https://github.com/TryQuiet/quiet/issues/2151)) ([cf899d5](https://github.com/TryQuiet/quiet/commit/cf899d5983dd1f69605bbf622770a23884ad6f9f))





## [2.0.3-alpha.12](https://github.com/TryQuiet/quiet/compare/@quiet/desktop@2.0.3-alpha.11...@quiet/desktop@2.0.3-alpha.12) (2023-12-04)

**Note:** Version bump only for package @quiet/desktop





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
