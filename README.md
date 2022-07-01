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
    <a href="https://github.com/TryQuiet/monorepo/wiki/Quiet-FAQ"><strong>faq »</strong></a>
    <br />
   </p>
</p>
Quiet is an alternative to team chat apps like Slack, Discord, and Element that does not require trusting a central server or running one's own. In Quiet, all data syncs directly between a team's devices over [Tor](https://torproject.org)—no server required. 
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

Message syncing is taken care of by a project called [OrbitDB](https://orbitdb.org), which works like a mashup of Git, a [gossip protocol](https://en.wikipedia.org/wiki/Gossip_protocol), and [BitTorrent](https://en.wikipedia.org/wiki/BitTorrent); it broadcasts new messages, syncs the latest messages, and fetches files. 

Invites, access, and usernames are granted by a community owner, i.e. whoever creates the community. The owner hands out an "invitation code" which invitees use to connect to the owner's device, register a username, and get a standard cryptographic certificate so they can prove to other peers they're part of the community.

See our [FAQ](https://github.com/TryQuiet/monorepo/wiki/Quiet-FAQ) for answers to common questions and a comparison of Quiet with similar apps.

## Technical overview

This is a concise technical summary of the main points.  

1. **Granting access:** community owners use standard PKI ([PKI.js](https://pkijs.org/)) to grant access, with each community owner serving as the community's [certificate authority](https://en.wikipedia.org/wiki/Certificate_authority); this is handled by Quiet and transparent to users. 
2. **Authentication:** a valid signed certificate from the community owner is required to connect to peers, receive connection from peers, and for messages to be visible to other peers.
3. **Networking:** peers connect via [Tor onion services](https://en.wikipedia.org/wiki/Tor_(network)#Onion_services), exclusively with their fellow community members.
4. **Privacy:** Tor encrypts all data in transit, and a Quiet user's device connects only to the devices of their fellow community members, so all messages are encrypted to recipients. 
4. **Syncing:** IPFS and [OrbitDB](https://orbitdb.org), an [IPFS](https://ipfs.io/)-based [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type), ensure that all data (messages, user data, etc) syncs between peers with [eventual consistency](https://arxiv.org/abs/2012.00472).
5. **Identity:** a valid certificate from the community owner on account creation establishes a username, which the owner attests is unique; in future versions, Quiet will warn all members if community owners are caught issuing non-unique usernames, to protect against impersonation by malicious or compromised owners. (See: [#119](https://github.com/TryQuiet/monorepo/issues/119))
6. **Invitation:** to invite new members, community owners provide (via some other secure channel) an onion address that points to a registration API which accepts a certificate signing request, responds with a signed certificate, and provides sufficient peer information to connect to other peers; in future versions this onion address will expire. (See: [#536](https://github.com/TryQuiet/monorepo/issues/536))
7. **Account recovery:** owners must back up their data (e.g. by copying a folder, or someday with a wallet-style passphrase) and members request new accounts from owners.
8. **Removal:** TBD, but likely a combination of expiring invitation onion addresses, certificate revocation, and message-layer encryption with updated keys.
9. **Multiple device support:** TBD.
10. **Mobile push notifications:** barring a major victory for consumer rights, iOS notifications require using a centralized push notification service that connects to Apple, but message data can still be encrypted; in proof-of-concept, Quiet works well as an always-on background app on Android, so Android versions will likely not require a push notification server.
11. **Stack:** Our backend is in Node.js (on iOS/Android we use [nodejs-mobile](https://github.com/nodejs-mobile)); we use Electron on desktop and React Native on mobile.

## Why Quiet?

We are building Quiet to sharpen the tools open societies use to hold power accountable. Each year, we see movements use the Internet to hold power accountable in breathtaking new ways. But the rise of big tech has made the Internet *itself* seem like *yet another* unaccountable power. We believe this happened because software became too dependent on company-run infrastructure, which undermined the role [free software](https://en.wikipedia.org/wiki/Free_software) has historically played in holding the software industry accountable. We want to fix that.

In the 2000s, when key dominant tech products had viable free and open source competitors that were radically pro-user (products like [Firefox](https://en.wikipedia.org/wiki/Firefox), [BitTorrent](https://en.wikipedia.org/wiki/BitTorrent), [VLC](https://www.videolan.org/), [Handbrake](https://en.wikipedia.org/wiki/HandBrake), or [Linux](https://en.wikipedia.org/wiki/Linux)) there was a limit to how much big tech could abuse users before users fled.  

But when software began depending on costly shared infrastructure, that created a dilemma for free software projects: who runs the infrastructure? The user? Most users don't have servers, or friends with servers. A business? The business running the infrastructure can control the data and relationships that make a product useful, limiting the freedom to [fork](https://en.wikipedia.org/wiki/Fork_(software_development)#Forking_of_free_and_open-source_software) and exit that free software's accountability mechanism depends on. Reddit, for example, [used to be free software](https://www.reddit.com/r/changelog/comments/6xfyfg/an_update_on_the_state_of_the_redditreddit_and/), but forking Reddit's codebase would have yielded just an empty, complex, and expensive-to-maintain website, because the relationships and conversations that make Reddit what it is live on *company-owned infrastructure*. Being free software did not give Reddit's users meaningful power to exit Reddit or hold it accountable. By undermining the power of forking, or by limiting it to a small niche of server-owning hobbyists, dependence on infrastructure hobbled free software's power to hold big tech accountable.

[Federation](https://en.wikipedia.org/wiki/Federation_(information_technology)) was proposed as a solution to this dilemma, but Gmail shows its limits. Email is federated, and in Gmail we can see how much power big tech can assert in spite of that federation. Google can build must-have features like spam filtering on the server side, and Gmail controls its user's email address, which might be used as the login for dozens or hundreds of online accounts. While it may be easier to exit Gmail than it is for an active Instagram user to exit Instagram, no Gmail competitor can make exiting Gmail as painless as Firefox made exiting Internet Explorer, because Gmail controls infrastructure. While federation is a partial solution, we *can* do better, and we must if we want to make big tech accountable to users.

In some circles it is popular to suggest that public funding, regulation, or outright nationalization would be sufficient for holding big tech accountable. A quick look at adjacent industries like banking, telecom, and media shows us they are not. Thanks to software's infinitely-copyable nature, popular free software can sometimes actually *stop* dominant players from doing harm, while traditional government interventions can only *reduce* harm, if that. (Moreover, free software can help us hold *government itself* accountable, while public institutions and highly-regulated industries depend on friendly relationships with policymakers, so a bad government can subvert them.)

We're building Quiet because we believe, for a broad class of software, that the best answer to the "who pays for the infrastructure?" dilemma is "no one." Apps built without any infrastructure beyond their users' own devices can be more secure and private than centralized competitors, and by eliminating exponentially growing server bills and the specialized work of devops and scaling, they can be built by smaller teams under less financial pressure to betray users. We want to spark a new phase of the free software movement where it's normal to build apps this way. But to do that, we have to build one really awesome app that is used and loved by many. Building a competitor to Slack and Discord seemed like a great place to start.

## Contributing to Quiet

To get started hacking on Quiet, follow the instructions for [Quiet Desktop](https://github.com/TryQuiet/monorepo/tree/master/packages/desktop#readme) or [Quiet Mobile](https://github.com/TryQuiet/monorepo/tree/master/packages/mobile#readme). (If you're new to the project, start with Quiet Desktop, as it's more stable and vastly easier to start hacking on.)

Desktop and mobile versions share a common Node.js [backend](https://github.com/TryQuiet/monorepo/tree/master/packages/backend) and React [state manager](https://github.com/TryQuiet/monorepo/tree/master/packages/state-manager), with [Tor](https://torproject.org) binaries for each platform and architecture, using Electron and React Native and for their respective frontends.

We use a [Github project](https://github.com/orgs/TryQuiet/projects/1) to prioritize issues.
