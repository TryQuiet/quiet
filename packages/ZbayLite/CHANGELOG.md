<a name="0.6.3"></a>
# [0.6.3]

### Features

* Store shipping data for user profile
* Add registraion of nicknames
* Add antyspoofing protection


### Fixes

* Update internal node version linux / mac

<a name="0.6.2"></a>
# [0.6.2]

### Fixes

* Fixed paste / copy 

<a name="0.6.0"></a>
# [0.6.0]

### Features

* Direct messages
* Direct transfers
* Send money modal
* New message type

### Fixes

* Fixed channel scrolls down on message refresh

<a name="0.5.0"></a>
# [0.5.0](TBR)

### Features

* Desktop notifications

### Fixes

* Fixed channel imports when no SK

<a name="0.4.1"></a>
# [0.4.1]

### Features

* App version in sidebar panel

### Fixes

* Fixed login screen - incorrect password is now handled correctly and enter works as a form submit
* Display message input only when user currently has no funds and there are some locked funds

<a name="0.4.0"></a>
# [0.4.0]


### Features

* Lock message input if current balance is 0 and display locked funds in wallet panel

<a name="0.3.0"></a>
# [0.3.0]


### Features

* Channel info that contains channel description and shareable hash
* General channel as landing page
* Debounce channel messages

### Fixes

* Fixed errors during channel import - if hash is invalid app doesn't quit anymore.
* Changed node status to a linear loader on node's connection page

<a name="0.2.0"></a>
# [0.2.0]


### Features

* zcashd binaries for arch-based linux distros (tested on Manjaro 18.0.4)
* Store spending and private keys for identity in vault on creation - added a migration for accounts created before 0.2.0
* Mechanism that on identity load ensures identity keys are present in the zcash node
* Mechanism that on channels load ensures viewing keys are present in the zcash node
* Loaders for Identity, Channels and Channel with info messages
* Improved status messages when waiting for zcash node
* Error handler that provides stacktrace
* Zcash node logs in file
