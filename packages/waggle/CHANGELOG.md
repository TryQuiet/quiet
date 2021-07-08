# Changelog

## [2.0.9] - WIP

### Added

  - Added manager for mobile app

## [2.0.8] - 2021-07-07

### Fix

- Root certificate and private key

### Added

- Certificate registration service (http + hidden service) - generate certificate for user and save it to db

## [2.0.7] - 2021-07-05

### Added

- Tor binaries for 3 platforms (linux, macos, win). Use proper binary depending on current platform.
- Run tests on linux and macos (CI)
- @zbayapp/identity lib
- Verify certificate before saving it to database
- Return all certificates on db.load
- Validators for storage
- Test for validators
- Added validation functions to storage

### Fixed

- Removed // @ts-nocheck from Storage.ts
- Killing existing tor process on macos - command for extracting process name slightly differs for linux and macos

## [2.0.6] - 2021-06-22

### Fixed

Pass envs to tor's --hash-password command - docker was lacking LD_LIBRARY_PATH env and therefore used default openssl 1.1.0 version (tor needs 1.1.1)

## [2.0.5] - 2021-06-22

### Added

Storage:
  Added new methods:
    askForMessages

### Changed

Changed databses names.

Events:
  Merged 'allMessages' and 'message' files into single 'messages' file

API:
  ConnectionsManager: added optional isWaggleMobileMode
  Storage: added optional isWaggleMobileMode
  !IMPORTANT: Those will be removed as soon as mobile version will adopt the new API

### Fixed

## [2.0.4] - 2021-06-15

### Fixed

- Hashing tor password for windows

## [2.0.3] - 2021-06-14

### Added

- Optional `createPaths` to options in both ConnectionManager and Storage. Default = true. When set to false waggle will not try to create any dirs
  and will just assume they exist.
- Database for certificates and 'add certificate' websocket event. Send all certificates on write and replication orbitdb events

### Fixed

- Now tests use temporary dir for app data

## [2.0.1] - 2021-06-07

### Changed

- Removed resolveJsonModule from tsconfig and changed a way we import json module, there is trap in 'resolveJsonModule' flag that causes npm publish/pack work in unexpected way.

## [2.0.0] - 2021-06-07

### Added

- Test for tor, connections manager, and dataserver
- Secured tor control port with hashed password
- Linter
- method to close 

### Changed

- Refactored tor control port and tor manager.
- Changed torManager API addNewService -> createNewHiddenService and addOnion -> spawnHiddenService
- Added stop method for storage
- Added stop method for libp2p
- Added stop method for dataServer

### Fixed

- added stop method for PeerDiscovery

## [1.1.10] - 2021-06-01

### Added
- Remove undialable peers from the peer store (use custom Libp2p)
- docker-compose - run entrynode with a few peers connecting to it (for testing purposes)

### Changed
- Refactor entrynode

### Fixed
- WebsocketOverTor - don't swallow errors when dialing

## [1.1.1] - 2021-05-20

### Added
- Use `debug` for logs


## [1.1.0] - 2021-05-20

### Added
- Storage - DM related methods and databses
- Connections Manager - DM related methods
- Events - DM related events
- Listeners - DM related listeners

### Changed
- Tor control logic. Use control port and heartbeat to check tor status.
- Socket data server - allow setting port while creating DataServer
- Bump eslint related libraries 

### Removed
- http-server dependency - not used and depends on vulnerable version of ecstatic

### Added
- Tracker - keep track of the peers which connected to the p2p network. Will replace the entry node.


## [1.0.23] - 2021-04-20
### Changed
- Socket is now passed to the ConnectionsManager constructor
- Storage needs to be initialized directly after initializing node

## [1.0.22] - 2021-04-20
### Added
- Communication with client - send all channel messages after they're loaded into memory

## [1.0.21] - 2021-04-19
### Changed
- Speed up creating stores for channels