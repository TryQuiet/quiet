<!-- [WIP]
* Added dataServer port to electonStore portsclosing
* Added proper closing for dataServer
* Added proper closing for libp2p and orbitdb -->
<!-- * [Performance] Fork runWaggle process instead running in main process
* Extracted waggle handling logic to separate function
* Changed a way main process is terminating
* [Performance] Removed excess decryption from checking conversations -->
# [3.4.0] - 16 July 2021

## Removed

* Temporarly removed zcash functionality

## Changed

* Register user using registration service

## Fixed

* Show Holmes' welcome message

# [3.3.0] - 08 July 2021

## Added

* Register user's certificate, sign messages
* Display only trusted messages

# [3.2.21] - 29 June 2021

## Fixed

* closing zbay properly
* restore input
* do not proceed invalid messages

# [3.2.21] - 29 June 2021

## Fixed

* closing zbay properly
* restore input
* do not proceed invalid messages

# [3.2.20] - 25 June 2021

### Changed

* Ask for messages by id
* Reduced amount of cpu expensive crypto operations
* use id as key in storage

### Added

* new method sendIds in publicChannelSaga
* added new socket listener sendIds in socket.saga

# [3.2.19] - 8 June 2021

### Changed
* Bump waggle to 2.0.2, jest to 27.0.4, ts-jest to 27.0.3
* Use waggle's tor new API

# [3.2.17] - 27 May 2021

### Fixed
* Built version can't import 'debug' in RPC.js file, remove the import for now

# [3.2.16] - 26 May 2021

### Added
* Added logger

# [3.2.15] - 25 May 2021

### Changed
* Channel input messages
* Fixed some minor bugs

### Added
* Sagas for direct messages
* directMessages and waggle handlers and selectors

### Removed
* Part of old messaging logic - zcash, websockets/tor

# [3.2.9] - 27 april 2021

### Changed
* Electron version: 12.0.2.

### Removed
* Checkmarks in channel and contact messages.
* Posting offers.
* Snackbar notifications for new users.
* Initial screen for returning users and "Sign In" button for new users.
* "Add funds" tooltip.

# [3.2.8] - 22 april 2021

### Changed
* Performance improvement - set pulled messages to store at once.
* Pull public channels only after websocket is initialized.

# [3.2.7] - 14 april 2021

### Added
* Move to right channel or contact, when you click on OS notification.
* Pull public channels only after websocket is initialized


# [3.2.9] - 27 april 2021

### Changed

* Electron version

### Removed

* Snackbar Notifications

* Post offers

* Continoue button after app start
