# Changelog

## [Unreleased]

### Fixed

* Stucking Tor - kill and relaunch the Tor after given timeout
### Added

* DestroyHiddenService method in torManager
* CreateNetwork in communitiesManager
* CreateNetwork api in IOPRoxy
* ConnectionsManager option - allow using tor files (binaries and libs) from waggle

## [4.0.1]

### Fixed

* Snapshot-replication tests

## [4.0.0]

### Added

* Certificates vaidation within websocketOverTor

### Changed

* Creating community event's payload must contain certificates
* Peer network connection is via https
* LaunchComunity API
* Register user certificate API

### Fixed

* CSRContainsField validator

## [3.1.0]

### Added

* Authenticating Tor Control Port with cookie

## [3.0.0]

### Changed

--- BREAKING CHANGES --- 
* ConnectionsManager api changed
* Refactor responsibilities into separate classes
* Many websocket events need peerId now; Socket responses contain peerId

### Added

* Creating and relaunching community; launching registrar (via websockets)

### Removed

* isWaggleMobileMode option

## [2.1.0]

### Added

* Additional valitation to registrar - check if csr has basic fields
* Waggle replication tests
* Storage which can use orbitdb snapshots mechanism
* More customizable waggle nodes

### Changed

* Mock tor in all registrar tests
* Moved dev dependencies to devDependencies in package.json, removed unused libraries

## [2.1.0-0]

### Changed

* Use unreleased version of orbit-db and orbit-db-store 4.1.0

## [2.0.15] - 2021-07-20

### Added

- Provided script for building project on Android

### Fixed

 - WebsocketOverTor - prepareListener was not called at all probably causing issue with peers not connecting to peers other than entry node

## [2.0.14] - 2021-07-17

### Fixed

- Remove wrtc-mock - caused problems when installing waggle
- npm-publish github workflow

## [2.0.13] - 2021-07-16

- Manually published npm package (previous one lacked files because of incomplete npm-publish github workflow)

## [2.0.12] - 2021-07-16

### Added

- Publish package to npm using tags
- Entry node - subscribe for all public channels

### Fix

- Conversation validator - don't assume encryptedPhrase length

## [2.0.11] - 2021-07-15

### Fixed

- Pass proxy agent as object, not function - "TypeError [ERR_INVALID_ARG_TYPE]: The "options.agent" property must be one of Agent-like Object, undefined, or false. Received function agent"

## [2.0.10] - 2021-07-15

### Fixed

- Npm package version 2.0.9 lacks wrtc-mock

## [2.0.9] - 2021-07-08

### Added

- Added manager for mobile app
- Registering user certificate (websocket + http) - fetch data from front-end and send request to the service

## [2.0.8] - 2021-07-07

### Fixed

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
