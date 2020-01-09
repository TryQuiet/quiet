# Zbay

Zbay is an experimental app for Windows, Mac, and GNU/Linux that builds an IRC-like community & marketplace on the [Zcash](https://z.cash) network. For more on the values behind the project, read [this essay](https://zbay.app/#why).

----
## Getting started

Getting started hacking on Zcash is easy. Be sure to have [Docker](https://docker.com) installed. Then...

```
make mainnet
npm install
make start-mainnet
```

That's it! Or, to start Zbay on the Zcash testnet, use ```make testnet``` and ```make start``` instead. 

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

## Tor support

To use Zbay over the Tor network you will need to install tor:

Linux ```apt-get install tor```  
macOS ```brew install tor```

Run it in console by typing ```tor```.  It should create socks5 proxy on port 9050. Run Zbay, check the "Connect with tor" option on the "enter password" screen, and Zbay will auto-detect the tor proxy and connect to it.
