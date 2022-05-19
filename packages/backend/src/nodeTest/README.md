## Replication test

### Installation

* `npm install --global ts-node`
* `npm install --global typescript`
* `npm install`

### Running tests

There are two basic tests. Each runs two nodes - first one generates snapshot and saves it to db, second connects to it, retrieves the snapshot and tries to load it.

`ts-node src/nodeTest/snaphotTestTor.ts` - using WebsocketOverTor (custom libp2p transport)

`ts-node src/nodeTest/snaphotTest.ts` - without tor, just connecting on localhost

This is more adjustable and tests replication (without snapshots)

`DEBUG='dbSnap*,localTest*' ts-node src/nodeTest/testReplicate.ts --nodesCount 1 --timeThreshold 200 --entriesCount 10 --useTor`
--nodesCount - number of nodes (waggles) in test. Bootstrap node not included. This has some issues right now because the more nodes the slower the replication.
--timeThreshold - max time for each node full replication
--entriesCount - number of entries in db
--useTor/--no-useTor - whether to use Tor or connect nodes via localhost

Note: after each run one may have to kill tor process.

### Notes

* `StorageTestSnapshot` simplified version of our Storage, uses the orbitdb snapshots mechanism.