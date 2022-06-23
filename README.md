<p align="center">
  <a href="#">
    
  </a>
  <p align="center">
   <img width="150" height="150" src="https://avatars.githubusercontent.com/u/59660937?s=200&v=4" alt="Logo">
  </p>
  <h1 align="center"><b>Quiet</b></h1>
  <p align="center">
  Encrypted p2p team chat with no servers, just Tor.
    <br />
<!--    <a href="https://tryquiet.org"><strong>tryquiet.org »</strong></a> -->
<!--    <br /> -->
    <a href="https://github.com/TryQuiet/monorepo/releases"><strong>releases »</strong></a>
    <br />
    <a href="https://github.com/orgs/TryQuiet/projects/1#column-14685906"><strong>priorities »</strong></a>
    <br />
  </p>
</p>
Quiet is an alternative to team chat apps like Slack, Discord, and Element that does not require trusting a central server or running one's own. In Quiet, all data syncs directly between a team's devices over the Tor network—no server required. 
<br/>
<br/>

> NOTE: Quiet is not audited and should not be used when privacy and security are critical. It lacks basic features and probably won't replace your Slack or Discord yet. That said, it works surprisingly well and we use it daily as a Slack replacement.


Quiet is for fans of software freedom, decentralization and privacy tech, and for anyone craving a future where humanity can collaborate effectively online without trusting our communities, networks, and data to giant corporations.

<p align="center">
  <img src="https://user-images.githubusercontent.com/213678/169164985-c1ced511-c49d-4500-b301-24bb8113ffb2.png" alt="Screenshot">
  <br />
  <br />
</p>


## How it works 

While apps like Slack, Discord, and Signal use central servers, Quiet syncs messages directly between a team's devices, over Tor, with no server required.

Each group of people (Quiet calls them "communities") gets their own insular network, so that data from one community never touches the devices of Quiet users in *other* communities. Not even in encrypted form!

Message syncing is taken care of by a project called OrbitDB, which works like a mashup of Git, a gossip network, and Bittorrent; it broadcasts new messages using a gossip network, syncs the latest messages, and fetches files. 

Invites, access, and usernames are granted by a community owner, i.e. whoever creates the community. The owner hands out an "invitation code" which invitees use to connect to the owner's device, register a username, and get a standard cryptographic certificate so they can prove to other peers they're part of the community. 

## Technical overview

This is a concise technical summary of the main points.  

1. **Granting access:** community owners use standard PKI (PKI.js) to grant access, with each community owner serving as root CA; this is handled by Quiet and transparent to users. 
2. **Authentication:** a valid signed certificate from the community owner is required to connect to peers, receive connection from peers, and for messages to be visible to other peers.
3. **Networking:** peers connect via Tor onion services, exclusively with their fellow community members.
4. **Privacy:** Tor encrypts all data in transit, and a Quiet user's device connects only to the devices of their fellow community members, so all messages are encrypted to recipients. 
4. **Syncing:** IPFS and OrbitDB, an IPFS-based CRDT, ensure that all data (messages, user data, etc) syncs between peers with eventual consistency.
5. **Identity:** a valid certificate from the community owner establishes a username, which the owner attests is unique; in future versions, Quiet will warn all members if community owners are "caught" issuing non-unique usernames.
6. **Invitation:** to invite new members, community owners provide (via some other secure channel) an onion address that points to a registration API which handles PKI and provides sufficient peer information to connect to other peers; in future versions this onion address will expire. 
7. **Account recovery:** owners must back up their data (e.g. by copying a folder, or someday with a wallet-style passphrase) and members request new accounts from owners.
8. **Removal:** TBD, but likely a combination of expiring invitation onion addresses, certificate revocation, and message-layer encryption with updated keys.
9. **Multiple device support:** TBD.
10. **Mobile push notifications:** baring a major victory for consumer rights, iOS notifications require using a centralized push notification service that connects to Apple, but messages data can still be encrypted; in proof-of-concept, Quiet runs fine as an always-on background app on Android.
11. **Stack:** Our backend is in Node.js (on iOS/Android we use nodejs-mobile) and we use Electron on desktop and React Native on mobile. 
 
## Contributing to Quiet

To get started hacking on Quiet, follow the instructions for [Quiet Desktop](https://github.com/TryQuiet/monorepo/tree/master/packages/desktop#readme) or [Quiet Mobile](https://github.com/TryQuiet/monorepo/tree/master/packages/mobile#readme). (If you're new to the project, start with Quiet Desktop, as it's more stable and vastly easier to start hacking on.)

Desktop and mobile versions share a common Node.js [backend](https://github.com/TryQuiet/monorepo/tree/master/packages/backend) and React [state manager](https://github.com/TryQuiet/monorepo/tree/master/packages/state-manager), with [Tor](https://torproject.org) binaries for each platform and architecture, using Electron and React Native and for their respective frontends.

We use a [Github project](https://github.com/orgs/TryQuiet/projects/1) to prioritize issues.

## Releases page

https://github.com/TryQuiet/monorepo/releases