# Zbay

Zbay is an experimental app for Windows, Mac, and GNU/Linux that builds a decentralized community chat (like Slack or Discord) using [Tor](https://www.torproject.org/), [IPFS](https://ipfs.io/), [OrbitDB](https://github.com/orbitdb/orbit-db), and [Zcash](https://z.cash/).

For more on the values behind the project, read [this essay](https://zbay.app/#why).

----

## Getting started

Getting started hacking on Zcash is easy. Be sure to have [Node](https://nodejs.org/) and [Rust](https://www.rust-lang.org/) installed. Then...

```
npm install
npm install --global neon-cli
npm run neon
```

Next, copy the Tor binary for your platform to a file called `tor` in the `tor` directory in the repo. On macOS, for example, you'd run this command:

`cp /Applications/Tor\ Browser.app/Contents/MacOS/Tor/tor.real ./tor/tor`

Then use `npm run start` to start Zbay. That's it!

## Building an installer

Zbay supports most popular operating systems. If you want to build a version for these platforms use one of our scripts:

macOS ```npm run dist```

Windows ```npm run distwin```

Ubuntu ```npm run distUbuntu```

The built installers can then be found in the `dist` folder.

##### Removing data

To remove all your data from a machine, be sure to delete the Zbay and Zcash folders. Here's where to find them:

On Linux ```~/.config/```

On macOS ```~/Library/Application Support/```

On Windows ```%HOMEPATH%\\AppData\\Roaming\\```

##### Backing up and restoring data

To make a backup, simply copy both the `Zbay` and `Zcash` folders from the location above to somewhere safe. 

To restore a backup, move your backed-up `Zbay` and `Zcash` folders to the location above. 

## Contact

Questions? Find us in the #zbay channel, in Zbay, or email [h@zbay.llc](mailto:h@zbay.llc).
