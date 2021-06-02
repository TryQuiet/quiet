# Changelog

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