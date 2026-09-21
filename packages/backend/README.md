## Backend

Communication manager for Quiet project. Uses OrbitDB, Libp2p, Tor and websockets.

### Installation

Requirements:
- node@12
- typescript
- ts-node
- patch

Install dependencies:

`npm install`


### Running backend separately (without desktop)

Run entryNode.ts

`ts-node entryNode.ts`

With logs:

`DEBUG=backend:* ts-node entryNode.ts`

By default each run will create new onion address and new peerId. If you want to keep them persistent, set env variables:

```
PEERID_FILE=myPeerId.json
HIDDEN_SERVICE_SECRET=<myHiddenTorServiceSecret>
```

PEERID_FILE must point to .json file with peer data (see entryNodePeerId.json). Peer data can be obtained by:

```
import PeerId from 'peer-id'
const peerId = await PeerId.create()
peerId.toJSON()
```

HIDDEN_SERVICE_SECRET can be retrieved from Tor.createNewHiddenService.

If you don't want to connect to our entry node, set also BOOTSTRAP_ADDRS env variable. It's a multiaddrs of one of your local nodes:

`BOOTSTRAP_ADDRS=/dns4/<yourBootstrapNodeOnionAddress>/tcp/<yourBootstrapNodePort>/ws/p2p/<yourBootstrapNodePeerId>`


### Local separated network of nodes

docker-compose helps to create a local network of nodes . This is purely for testing purposes. By default it creates 3 services, one of them being the entry node and the rest regular nodes.

```
docker-compose build
docker-compose up  // Run default - 3 peers

docker-compose up --scale peer=3  // Run with scaled number of regular peers
```

Currently there is no db data in this network - to be added.

### Webpack

When your aim is to build the desktop app run the following command in packages/backend:

`npm run webpack:prod`

### Live QSS integration test

The live QSS integration suite is excluded from normal backend and CI test
discovery. It requires a running, migrated Docker QSS server and exercises
community creation, websocket connection, Local First Auth synchronization,
new-member joining, QSS-backed log replication, reconnects, historical pulls,
and P2P device linking followed by QSS authentication.

From the repository root:

```sh
npm run start:qss
npm run test:qss-integration
```

The test defaults to `http://localhost:3003`. To use another running QSS:

```sh
QSS_INTEGRATION_ENDPOINT=http://localhost:3003 npm run test:qss-integration
```

The suite creates uniquely named communities but does not reset the QSS
database. Stop the Docker stack separately with `npm run stop:qss`.

### Logging

By default logs are output to the console and to files located in the application data directory (this location varies by OS).  This is true for backends running on desktop _and_ mobile.

_See the `node-common` README for a more detailed description of file logging in Quiet._

### Architecture

// TODO
