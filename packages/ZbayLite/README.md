# Zbay

  

Zbay is an experimental app for Windows, Mac, and GNU/Linux that builds an IRC-like community & marketplace on the [Zcash](https://z.cash) network. For more on the values behind the project, read [this essay](https://zbay.app/#why).

  

----

## Getting started

  

Getting started hacking on Zcash is easy. Be sure to have [Docker](https://docker.com) installed and running. If you're on Linux, you may want to look at Docker's [post-install instructions](https://docs.docker.com/engine/install/linux-postinstall/). Then...

  

```

npm run mainnet

```

And in a separate terminal window...

```

npm install

npm run start

```

That's it!  

## Building an installer

  

Zbay supports most popular operating systems. If you want to build a version for these platforms use one of our scripts:

  

macOS ```npm run dist```

Windows ```npm run distwin```

Ubuntu16 ```npm run distUbuntu16```

Ubuntu18 ```npm run distUbuntu18```

  

The built installers can then be found in the `dist` folder.

  

## Managing keys

  

Zbay uses the [Buttercup](https://buttercup.pw/) password manager to safety store Zcash keys and other necessary information. If you want to retrieve key or check information stored there, open the Zbay vault file in Buttercup. Here's where to find it:

  

On Linux ```~/.config/Zbay/vault-mainnet.bcup```

On macOS ```~/Library/Application Support/Zbay/vault-mainnet.bcup```

On Windows ```%HOMEPATH%\\AppData\\Roaming\\Zbay\\vault-mainnet.bcup```

##### Clean data
Buttercup file stores all of your keys so before deleting file make sure you moved all of your funds from associated Zcash account. 
```diff
- Removing Buttercup file does not remove keys from Zcash node. Once imported keys are stored forever.
```
##### Moving account
You can move your file to other machines and Zbay will handle all key imports so you will be able to use application. 


## Tor support

  

To use Zbay over the Tor network you will need to install tor:

  

Linux ```apt-get install tor```

macOS ```brew install tor```

  

Run it in console by typing ```tor```. It should create socks5 proxy on port 9050. Run Zbay, check the "Connect with tor" option on the "enter password" screen, and Zbay will auto-detect the tor proxy and connect to it.

## Contact
If you have any questions or issues getting started you can find members of the Zbay team on this [slack channel](https://join.slack.com/t/zbay/shared_invite/enQtOTE5MTI3OTA1NjE3LTViMWQyMzNkNmViMTZhZmEzYmZhMjg1YTYzNDQ5MmQ2NzU1NDc4ZWY1ZDQ1NjkwNjgwN2NiYmIzZTA2YTJiMDA).
