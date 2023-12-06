# Title:
Description of the initial flow for the application

## Status: 
proposed

## Date: 
06.12.2023

## Description

Journey starts within the frontend containers of desktop and mobile package (JoinCommunity, CreateCommunity),
which dispatches `communities.actions.createNetwork` action.

The mentioned action triggers `createNetworkSaga` which sets up basic `Community` and `Identity` object, stores them in redux persist and emits an event to the backend for creating a network (structure containing all the necessary networking data for connecting with peers, replicating data etc.).

The next step for the user is to choose a username, which starts at yet another frontend container (UsernameRegistration).
It dispatches `identity.actions.chooseUsername` action which creates or modifies existing users' CSR and stores it to the redux store. Then it waits for the confirmation that the currently stored username is equal the one that's been choosen by the user.

If the condition is being fulfilled, it dispatches two very important actions: `identity.actions.saveUserCsr` which actually emits an event to the backend for saving newly generated CSR to database*. The second action is `communities.actions.launchCommunity` which spins up vital services in backend.

* When a person who created the community (owner, who's the certificate authority for the network) comes online and replicates CSRs from a distributed database, it'll issue certificates for the users who put their CSRs there.

Things are just a little bit different for the one that establishes a community. Instead of saving CSR, it'll be registering its own certificate with the `registerCertificateSaga`.

There may be a situation in which two users requests the same username at the same time (when the certificate authority is offline). In this case one of them will be granted rights for the username, while the other will have to choose a different username. There's a dedicated frontend cointainer (UsernameTaken) which works similarly to the RegisterUsername. It dispatches `identity.actions.chooseUsername`, checks for the username integrity in the redux store and dispatches `identity.actions.saveUserCsr` once again.

As the certificates have priority over CSRs, once issued no more CSRs of a single user will be taken into consideration by the CA.


## Edge Cases

The process of saving CSRs into database may be interrupted. In this case we want to make sure users' CSR will be saved once he gets back into the app.
On each community launch, `saga-name` checks for the presence of locally stored CSR within the collection of replicated CSRs. If its present, then it means no need for taking any actions. Otherwise `identity.actions.saveUserCsr` is being dispatched again.
