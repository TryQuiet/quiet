[2.1.0] - unreleased

* Fix for multiplicating "welcome" messages when joining a community

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
