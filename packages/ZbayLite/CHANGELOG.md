<a name="0.3.0"></a>
# [0.3.0](TBR)


### Features

* Channel info that contains channel description and shareable hash
* General channel as landing page

### Fixes

* Fixed errors during channel import - if hash is invalid app doesn't quit anymore.
* Changed node status to a linear loader on node's connection page

<a name="0.2.0"></a>
# [0.2.0](TBR)


### Features

* zcashd binaries for arch-based linux distros (tested on Manjaro 18.0.4)
* Store spending and private keys for identity in vault on creation - added a migration for accounts created before 0.2.0
* Mechanism that on identity load ensures identity keys are present in the zcash node
* Mechanism that on channels load ensures viewing keys are present in the zcash node
* Loaders for Identity, Channels and Channel with info messages
* Improved status messages when waiting for zcash node
* Error handler that provides stacktrace
* Zcash node logs in file
