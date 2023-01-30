## Backend

Communication manager for Quiet project. Uses OrbitDB, Libp2p, Tor and websockets.

### Installation

Requirements: 
- node@12
- typescript
- ts-node

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

`WEBPACK_MODE='production' npm run webpack`

or bootstrap the project with the same flag: 

`WEBPACK_MODE='production' lerna bootstrap`

### Architecture

// TODO


