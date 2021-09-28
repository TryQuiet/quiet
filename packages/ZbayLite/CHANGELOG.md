# [3.6.0] 27 August 2021

## Broke

* Direct Messages

## Changed 

* Plugged in @zbayapp/nectar to handle waggle connections.
* Changed containers test files from js to ts
* Refactored another chunk of containers to use hooks instead Hoc
* Simplified components by removing zcash relicts

## Removed

* Old Logic for handling Identity, Users, PublicChannels, Contacts and relevant tests

# [3.5.1] 03 August 2021

## Fix

* Restored links functionality.
* Channels are scrolled to bottom on channel change.

# [3.5.0] - 30 July 2021

## Fix

* Notifications for both dms and public channels

## Changed

* Contacts store is now storing DM contacts by nickname
* Direct Messages users are now stored by nickname
* Change direct messages channel path from channelId/nickname to nickname
* Keep halfKey in certificate
* Extract halfKey from certificate, dropped old orbitdb structure.
* Fetch users when fetching certificates

## Removed

* ResponseGetAvailableUsers saga
* GetAvailableUsers saga
* Initial messages from holmes

## Added

# [3.4.1] - 20 July 2021

## Fix

* User registration - display spinner while waiting for server response

## Changed

* Waggle version to 2.0.15 - fixes connecting to other peers

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
