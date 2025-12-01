# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.4.0-alpha.4](https://github.com/TryQuiet/quiet/compare/@quiet/desktop@6.4.0-alpha.3...@quiet/desktop@6.4.0-alpha.4) (2025-12-01)

**Note:** Version bump only for package @quiet/desktop





# Changelog

[unreleased]

### Features

* Adds hcaptcha verification for protected QSS actions [#2908](https://github.com/TryQuiet/quiet/issues/2908)
* Add ability to adjust image/file auto-download size threshold [#3019](https://github.com/TryQuiet/quiet/pull/3019)

### Fixes

* DisableWebDrag added to links listed in an issue [#481] (https://github.com/TryQuiet/quiet/issues/481)
 
### Chores

* Change autoupdater text [#2971](https://github.com/TryQuiet/quiet/issues/2971)
* Fixed issues with testing workflows [#3030] (https://github.com/TryQuiet/quiet/issues/3030)

### Fixes

* Handle AWS QSS endpoints in invite links [#3024](https://github.com/TryQuiet/quiet/issues/3024)
* Fixes dialing on join when using AWS QSS [#3025](https://github.com/TryQuiet/quiet/issues/3025)

## [6.3.0]

### Features

* Adds support for syncing OrbitDB entries to QSS [#2803](https://github.com/TryQuiet/quiet/issues/2803)
* Persist SkinTone choices and use in emoji shortcodes [#2794](https://github.com/TryQuiet/quiet/issues/2794)
* Adds UI for assist server opt in [#2910](https://github.com/TryQuiet/quiet/issues/2910)
* Adds UI for terms of service [#2911](https://github.com/TryQuiet/quiet/issues/2911)

### Fixes

* Minor design fixes on the left side panel [#2948](https://github.com/TryQuiet/quiet/issues/2948)
* Warning modal background color is now reactive to theme selection [#2958](https://github.com/TryQuiet/quiet/issues/2958)
* Fixes crashes on QSS disconnects [#2803](https://github.com/TryQuiet/quiet/issues/2803)
* Users can now abort joining and creating communities halfway without issue [#3001](https://github.com/TryQuiet/quiet/issues/3001)

### Chores

* Update QSS flag to QSS_ALLOWED and reconfigure enabled setting/checking [#2912](https://github.com/TryQuiet/quiet/issues/2912)
* Update libraries to comply with 16kB page size for Android native code [#2905](https://github.com/TryQuiet/quiet/issues/2905)

## [6.2.0]

### Fixes

* Fix newline formatting in messages on mobile
* Fix issue with keyboard hiding message input on Android
* Fix issue with message send button not displaying correctly on mobile

### Chores

* Bump Android SDK to 35, NDK to 28.2.13676358, and Gradle plugin to 8.5.1 [see Google Play deadline](https://developer.android.com/google/play/requirements/target-sdk)

## [6.1.0]

### Fixes

* Leaving a community on android and then immediately creating/joining a new one no longer fails to reinitialize [#2940](https://github.com/TryQuiet/quiet/issues/2940)
* Abrupt closes properly clean up resources and save data [#2921](https://github.com/TryQuiet/quiet/issues/2921)
* User Profile photo size limits now more strictly enforced [#2892](https://github.com/TryQuiet/quiet/issues/2892)
* Fixed some race conditions with user profiles and message verification that could cause some messages to never display [#2847](https://github.com/TryQuiet/quiet/issues/2847)
* Fixed automatic updates on mac [#2965](https://github.com/TryQuiet/quiet/issues/2965)
* Fixed tor binary path detection on locally distributables [#2964](https://github.com/TryQuiet/quiet/issues/2964)
* Fixed channel metadata syncing [#2968](https://github.com/TryQuiet/quiet/issues/2968)

### Features

* Adds new debugging tools in development mode [#2956](https://github.com/TryQuiet/quiet/issues/2956)
* User profiles and their connection status now appear in the sidebar [#2920](https://github.com/TryQuiet/quiet/issues/2920)
* In development mode, a debug panel now exposes some state parameters to assist debugging [#2924](https://github.com/TryQuiet/quiet/issues/2924)

### Security

* More secure socketIOSecret sharing [#2931](https://github.com/TryQuiet/quiet/issues/2931)

## [6.0.1]

### Security

* Use libsodium for socketIOSecret comparison and migrate logic from common to backend [#2820](https://github.com/TryQuiet/quiet/issues/2820)
* Use libsodium for socketIOSecret generation in desktop and android [#2820](https://github.com/TryQuiet/quiet/issues/2820)
* Simplify/standardize socketIOSecret generation on IOS (no libsodium) [#2820](https://github.com/TryQuiet/quiet/issues/2820)

## [6.0.0]

### Features

* Adds a hook for Quiet Storage Service (QSS) to inject entries into OrbitDB [#2807](https://github.com/TryQuiet/quiet/issues/2807)
* Adds an event for when a local put occurs [#2802](https://github.com/TryQuiet/quiet/issues/2802)
* Adds support for QSS auth syncing [#2760](https://github.com/TryQuiet/quiet/issues/2760)

### Fixes

* Fixes race condition with initial user profile entry on joining [#2887](https://github.com/TryQuiet/quiet/issues/2887)
* Changing the text on the loading screen when the user creates a community [#2248] (https://github.com/TryQuiet/quiet/issues/2248)

### Breaking

* Adds key commitment scheme to address the "invisible salamanders" attack [#2711](https://github.com/TryQuiet/quiet/issues/2711)
* Adds team ID to encrypted OrbitDB entries

## [5.1.2]

### Chores

* Quiet Desktop now uses Tor 0.4.8.16
* The process for updating Tor on desktop is now mostly automated and part of our release checklist (thanks @bitmold!)
* Quiet Android now uses Tor 0.4.8.16 [#2861](https://github.com/TryQuiet/quiet/issues/2861)
* The process for updating Tor on Android is now also mostly automated and part of our release checklist
* Stops duplicating Tor binaries on MacOS (we were just duplicating the same Universal Binary for both x64 and arm64, which did not make sense.)

## [5.1.0]

### Chores

* Rename upload/uploaded terminology to attachment for clarity across codebase
* Updates Android instructions in `packages/mobile/README.md`

### Features

* Compresses images and user profile photos over 200KB, for faster downloads and less hogging of storage space. [#1018](https://github.com/TryQuiet/quiet/issues/1018)
* Attachments button on mobile shows photo library ([#1698](https://github.com/TryQuiet/quiet/issues/1698))
* Adds date dividers and a sticky date marker on mobile too, for better readability ([#505](https://github.com/TryQuiet/quiet/issues/505))

### Fixes

* Removes Sentry logger and the associated warning modal, since we aren't using it anymore. ([#2777](https://github.com/TryQuiet/quiet/issues/2777))


## [5.0.0]

### Features

* Users can now enter the channel view before Tor has fully initialized which means much less waiting time when opening the app. Actions will be queued to be sent when the connection is established. [#2837](https://github.com/TryQuiet/quiet/issues/2837)

### Fixes

* Resolved an issue where messages autocorrected by iOS were remaining unsent in the message input, after the uncorrected message was sent [#2858](https://github.com/TryQuiet/quiet/issues/2858)
* Resolved an issue with event handlers not attaching to the Team object when joining a community for the first time [#2845](https://github.com/TryQuiet/quiet/issues/2845)
* Resolved an issue with malformed libp2p addresses during redialing peers you had recently been connected to [#2842](https://github.com/TryQuiet/quiet/issues/2842)
* Fixed an issue with failing to reconnect to users who had dialed you and then disconnected [#2854](https://github.com/TryQuiet/quiet/issues/2854)
* Resolved an issue with logger duplication [#2853](https://github.com/TryQuiet/quiet/issues/2853)

### Fixes

* Adds a bunch of missing emoji codes [2824](https://github.com/TryQuiet/quiet/issues/2824)

## [5.0.0]

### Chores

* Disables bitcode creation and strips bitcode from Tor.framework for xcode 16 compatibility
* Targets iOS 18 SDK as required by Apple
* Disabled automatic desktop updates from v4.x to v5.x by changing the update bucket [#2832](https://github.com/TryQuiet/quiet/issues/2832)
* Specifies timezone in mobile snapshot tests
* Removed deprecated identity systems not based on LFA [#2762](https://github.com/TryQuiet/quiet/issues/2762)
* Updates storage location on desktop from "Quiet4" to "Quiet5" so users can run both at once
* Updates file storage locations on iOS and Android

## [4.1.0]

### New Features

* Adds sticky date markers to the chat view [#505](https://github.com/TryQuiet/quiet/issues/505)
* Adds meaningful text to date markers, like "Today", "Yesterday", "Friday", or "Nov 30, 1999" [#2745](https://github.com/TryQuiet/quiet/issues/2745)
* You can now type emoticons (<3) and emojicodes (:heart:) with tab completion and a handy dropdown. [#540](https://github.com/TryQuiet/quiet/issues/540) (thanks @agiledev24 for your initial work on this!)

### Fixes

* Fixes an issue where heart emojis were displaying all tiny, ASCII, and goth. Now our hearts are big and bright red, for vibes! [#510](https://github.com/TryQuiet/quiet/issues/510)
* Fixes back button navigation issues in user profile/edit screens [#2570](https://github.com/TryQuiet/quiet/issues/2570)
* Changes close button in settings to the back button ([#2792]https://github.com/TryQuiet/quiet/issues/2792)
* Changes the Leave Community modal to match the rest of the Settings ([2569]https://github.com/TryQuiet/quiet/issues/2569)
* Fixes an issue on Android where the app was not correctly displaying times in the local timezone [#2766](https://github.com/TryQuiet/quiet/issues/2766) (thanks for the bug report, anon!)

### Chores

* Improves speed, reliability, and documentation for Cypress tests

## [4.0.3]

### New features

* Adds a context menu in Quiet desktop for copying text ([#503](https://github.com/TryQuiet/quiet/issues/503)) and saving images ([#503](https://github.com/TryQuiet/quiet/issues/568)) Thanks @agiledev24!

### Fixes

* Fixes issue where the app may crash when trying to redial a peer that doesn't recognize your user as being in the sigchain ([#2770](https://github.com/TryQuiet/quiet/issues/2770))
* Fixes issue where the app may crash when hanging up on a peer we don't have in our sigchain ([#2770](https://github.com/TryQuiet/quiet/issues/2770))

### Chores

* Write app logs to rotating files ([#2771](https://github.com/TryQuiet/quiet/issues/2771))

## [4.0.0]

### New features

* Generating LFA-ready invite links when a sigchain is configured ([#2627](https://github.com/TryQuiet/quiet/issues/2627))
* Add local-first/auth powered libp2p authentication service ([#2629](https://github.com/TryQuiet/quiet/issues/2629))
* Adds admin-only screens when non-admins try to access add members screens ([#2729](https://github.com/TryQuiet/quiet/issues/2729))

### Chores

* Add `trace` level logs to `@quiet/logger` ([#2716](https://github.com/TryQuiet/quiet/issues/2716))
* Add slack notifications to release workflows ([#2722](https://github.com/TryQuiet/quiet/issues/2722))
* Refactor the `StorageService` and create `ChannelService`, `MessageService` and `ChannelStore` for handling channel-related persistence ([#2631](https://github.com/TryQuiet/quiet/issues/2631))

## [3.0.0]

### Chores

* Upgrade OrbitDB to 2.2.0, LibP2P to 1.9.4, replace ipfs-js with Helia ([#2624](https://github.com/TryQuiet/quiet/issues/2624))
* File upload improvements ([#2624](https://github.com/TryQuiet/quiet/issues/2624))
* Add Helia fork to quiet repo ([#2624](https://github.com/TryQuiet/quiet/issues/2624))
* Upgrade OrbitDB to 2.4.3, LibP2P to 2.X, Helia to 5.X ([#2624](https://github.com/TryQuiet/quiet/issues/2624))
* Add @chainsafe/libp2p-noise as a submodule to get rid of WASM ([#2624](https://github.com/TryQuiet/quiet/issues/2624))
* Update data directory to `Quiet3` ([#2672](https://github.com/TryQuiet/quiet/issues/2672))
* Update production release S3 bucket to `quiet.3.x` ([#2672](https://github.com/TryQuiet/quiet/issues/2672))

## [2.3.3]

### New features

* Adds basic sigchain functions ([#2625](https://github.com/TryQuiet/quiet/issues/2625))
* Instantiates signature chain when creating communities and reloading application ([#2626](https://github.com/TryQuiet/quiet/issues/2626))
* Added in LFA-ready invite links ([#2627](https://github.com/TryQuiet/quiet/issues/2627))

### Fixes

* Changed company name in app to "A Quiet LLC" ([#2642](https://github.com/TryQuiet/quiet/issues/2642))
* Fixed copyright statement in Electron app ([#2589](https://github.com/TryQuiet/quiet/issues/2589))
* Improved clickable link contrast ([#2593](https://github.com/TryQuiet/quiet/issues/2593))

## [2.3.2]

### Chores

* Moved some responsibilities of identity management to the backend ([#2602](https://github.com/TryQuiet/quiet/issues/2602))
* Added auth submodule in preparation for future encyrption work ([#2623](https://github.com/TryQuiet/quiet/issues/2623))

### Fixes

* Fixed memory leak associated with autoUpdater ([#2606](https://github.com/TryQuiet/quiet/issues/2606))
* Fixed visual regression tests ([#2644](https://github.com/TryQuiet/quiet/issues/2645))

## [2.3.1]

### Fixes

* The user profile area is now much easier to click on desktop, and has a nice hover effect matching the rest of the sidebar ([#2566](https://github.com/TryQuiet/quiet/issues/2566)) Thanks @okrayrum!
* Android app will now work correctly after suspending it (e.g. by swiping up in the app manager) ([#2587](https://github.com/TryQuiet/quiet/issues/2587))

## [2.3.0]

### New features

* Add dark mode to the desktop UI ([#1502](https://github.com/TryQuiet/quiet/issues/1502))
* Add support for new format of invitation link: `c=<cid>&t=<token>&s=<serverAddress>&i=<inviterAddress>` ([#2310](https://github.com/TryQuiet/quiet/issues/2310))
* Use server for downloading initial community metadata if v2 invitation link is detected ([#2295](https://github.com/TryQuiet/quiet/issues/2295))

### Refactorings

* Consolidate colors and align theme with MUI standards ([#2445](https://github.com/TryQuiet/quiet/issues/2445))
* Refactor some UI components to align with architecture goals ([2447](https://github.com/TryQuiet/quiet/issues/2447))

### Fixes

* Disable spellCheck/autoCorrect on non-spelling sensitive fields like usernames and channels ([#373](https://github.com/TryQuiet/quiet/issues/373))
* Fixes issue with reconnecting to peers on resume on iOS ([#2424](https://github.com/TryQuiet/quiet/issues/2424))
* Fixes references to 'invite code' to be 'invite link' in UI ([#2441](https://github.com/TryQuiet/quiet/issues/2441))
* Fixes issue with image messages not displaying/throwing errors on iOS ([#2526](https://github.com/TryQuiet/quiet/issues/2526))

### Chores

* Cleanup data directory at end of e2e tests
* Update mobile development README ([#2483](https://github.com/TryQuiet/quiet/issues/2483))
* Update github workflows for PR gating ([#2487](https://github.com/TryQuiet/quiet/issues/2487))
* Don't create duplicate CSRs when joining a community under certain circumstances ([#2321](https://github.com/TryQuiet/quiet/issues/2321))
* Add abstract base classes for stores ([#2407](https://github.com/TryQuiet/quiet/issues/2407))

## [2.2.0]

### New features

* Add utilities for emoji detection in messages and make all-emoji message larger font size ([#519](https://github.com/TryQuiet/quiet/issues/519))

### Refactorings

* Use ack for CREATE_NETWORK and simplify
* Move Community model to the backend

### Fixes

* Allow JPEG and GIF files as profile photos ([#2332](https://github.com/TryQuiet/quiet/issues/2332))
* Fix issues with recreating general channel when deleted while offline ([#2334](https://github.com/TryQuiet/quiet/issues/2334))
* Fix package.json license inconsistency
* Fixes issue with reconnecting to peers on resume on iOS ([#2424](https://github.com/TryQuiet/quiet/issues/2424))
* Reorder the closing of services, prevent sagas running multiple times and close backend server properly

## [2.1.2]

### Refactorings

* Rename and reorganize frontend/backend events API
* Rename message retrieval events/sagas and use ack feature
* Rename LOAD_MESSAGES event and incomingMessages reducer
* Use socket.io ack for CREATE_CHANNEL event
* Introduce socket.io acknowledgements

### Fixes

* Fixes channel name creation logic
* Remove duplicate introduction messages once again
* Prevent channel creation with names that start with special character, then a hyphen
* Choose random ports for Tor services (iOS)
* Use consistent identicons for messages and profile
* Add retry ability to tor-control and misc tor-control fixes

## Other

* Upgraded React-Native to 0.73.2

## [2.1.1]

### Fixes

* Make sure address of the inviting peer is in the invitation link
* Opening the mobile app with joining links has been corrected.

### Refactorings

* Remove unused backend events and state-manager event types

## [2.1.0]

### New features

* Added user profile feature.
* Updated old logo of Linux and Windows with rounded ones.

### Fixes

* Handle spaces in tor process path.
* Run tor process in shell.

### Refactorings

* Refactor registration service, replace promise waiting mechanism around certificate requests and help prevent duplicate username registration
* Removed SAVE_OWNER_CERTIFICATE event.
* Removed registrar reminders and rename LAUNCH_REGISTRAR.
* Removed unused SEND_USER_CERTIFICATE event.
* Removed unused SUBSCRIBE_FOR events.

## [2.0.1]

### Fixes

* Desktop UI console errors/warnings have been cleaned up.
* The channel context menu is now enabled for all users.
* A bug that impersonated the channel creation message due to the removal of the username has been fixed.
* Large file downloads are now slower but steadier.
* The username changing form has been fixed.
* Push notifications runtime permission is now requested on Android.
* Users joining a community will no longer receive multiple "welcome" messages.
* Users sharing the same nickname now have different profile images.

## [2.0.0]

### Breaking changes

* To let users join when the owner is offline we made changes that broke backwards compatibility, so you will need to create a new community and re-invite members. Need help migrating? [help@quiet.chat](mailto:help@quiet.chat)

### New features

* Users can join a community when its owner is offline. This was a big one!
* Desktop and mobile users can send markdown messages. (Thanks again @josephlacey!)
* Desktop users can now export chats to a text file. (Thanks @rajdip-b!)

### Improvements

* Prettier message loading indicator on mobile
* Better descriptions of the joining process
* Validation of community metadata and certificates
* A real iOS launch screen (so long, "Powered by React Native"!)
* A nice splash screen on mobile until the joining/creating screens are ready
* Clearer autoupdate language in the update modal, so users know that the app will update on restart

### Fixes

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

### Notes

* Quiet now labels duplicate unregistered usernames
* Quiet shows an full-screen warning for duplicate registered usernames, since these should never happen and indicate a potential compromise.
* For authenticating connections, Quiet now uses libp2p's [Pre-shared Key Based Private Networks](https://github.com/libp2p/specs/blob/master/pnet/Private-Networks-PSK-V1.md) instead of X.509 certificates so peers can connect before registering.

## [2.0.3-alpha.16]

* Fix: mobile app crashing on restart

* Refactor: backend, storage module - extracting OrbitDB as another provider, refactor of  CertificatesRequestsStore, CommunityMetadataStore, CertificatesStore as Nest providers, store tests adjustments,  file structure

## [2.0.3-alpha.15]

* Fix: construct all stores before initializing them - initializing community metadata store sets metadata in certificates store

* Fix: joining community stuck on "initiation backend modules"

* Add debug logs.

## [2.0.3-alpha.14]

* Add community metadata validation.

* Move community metadata to separate store.

## [2.0.3-alpha.13]

* Initialize electron-store after setting appData to prevent creating empty "Quiet" data directory

* Fixed UI for Update Modal

* Fixed username taken logic

* Add test-case in e2e multiple test for using username taken modal

## [2.0.3-alpha.12]

* Better descriptions of the joining process

* Update custom deps repositiries (upload-s3-action, ipfs-pubsub-peer-monitor)

* Add certificates validation.

* Move certificates to separate store.

* Move csrs to separate store.

* Fix saveUserCsr saga to trigger only if user csr is absent in user slice.

* Send an info message immediately after a user joins the community

* Feature: add functionality to export chat to text document in desktop version

## [2.0.3-alpha.6]

* Fix: filter out invalid peer addresses in peer list. Update peer list in localdb.

* Fix: dial new peers on CSRs replication

## [2.0.3-alpha.5]

* Fix network data proceeding when using custom protocol multiple times #1847

* Backward incompatible change: use pre shared key as connection protector in libp2p. Add libp2p psk to invitation link

* Removed code responsible for data translation from channel address to channel id from state manager transforms and storage service

## [2.0.3-alpha.1]

* Temporarily hiding leave community button from Possible impersonation attack

## [2.0.3-alpha.0]

* Filter CSRs - remove old csrs and replace with new for each pubkey

* Fixed mobile bugs - joining by QR code and not showing username taken screen for user who has unique name

* Use context menu for information about unregistered username instead screen

* Shorter dots-placeholder for invite link

* Display a shorter invite link on a mobile

* Removed registration attempts selector and corresponding usage.

* Revert adjusting bootstrap scripts for developing on Windows

* Channel input - replaced ContentEditable with textarea

* Fix - up/down arrows now work properly inside channel input (textarea)

## [2.0.1-alpha.2]

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

## [2.0.0-alpha.11]

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
