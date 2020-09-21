# Zbay

  

Zbay is an experimental app for Windows, Mac, and GNU/Linux that builds an IRC-like community & marketplace on the [Zcash](https://z.cash) network. For more on the values behind the project, read [this essay](https://zbay.app/#why).

----

## Getting started

Getting started hacking on Zcash is easy. Be sure to have [Rust](https://www.rust-lang.org/) installed. Then...
```
npm install
npm install --global neon-cli
npm run neon
npm run start
```

That's it!  

## Building an installer

Zbay supports most popular operating systems. If you want to build a version for these platforms use one of our scripts:

macOS ```npm run dist```

Windows ```npm run distwin```

Ubuntu ```npm run distUbuntu```

The built installers can then be found in the `dist` folder.

##### Removing data

Some keys are stored *both* in Buttercup *and* in your Zcash wallet file. To remove all your data from a machine, be sure to delete the Zbay, Zcash, and ZbayData folders. Here's where to find them:

On Linux ```~/.config/```

On macOS ```~/Library/Application Support/```

On Windows ```%HOMEPATH%\\AppData\\Roaming\\```

##### Backing up data

Everything you need to restore your account, messages, and funds lives in the `Zbay` folder. To make a backup, simply copy the `Zbay` folder to a safe location. To restore a backup, install Zbay on a new machine, sync, quit, and then move your existing Zbay folder to its original location. Here's where to find it:

On Linux ```~/.config/Zbay/```

On macOS ```~/Library/Application Support/Zbay/```

On Windows ```%HOMEPATH%\\AppData\\Roaming\\Zbay\\```

## Tor support

The full node version of Zbay gave users the option of connecting via Tor. The light client version of Zbay removed the option of connecting via Tor, but we're working on bundling Tor with Zbay and using it by default, in all cases.

## Not enough disk space?

We're working on light wallet support to remove the disk space requirement, but if you're low on disk space and would like to use an external drive in the meantime, follow these steps:

1. Find and remove (or move) any existing `ZbayData`, `Zbay`, and `Zcash` folders.
1. Create a "ZbayData" folder on the external drive.
1. Create a symlink ([Mac/Linux](https://kb.iu.edu/d/abbe), [Windows](https://www.howtogeek.com/howto/16226/complete-guide-to-symbolic-links-symlinks-on-windows-or-linux/)) to that folder from wherever the folder would typically be stored, e.g. ```~/Library/Application Support/``` on Mac.
1. Run Zbay and ignore the warning about disk space. If you've created the symblink properly, Zbay will put files on the external drive. 

Note: Zbay will still need ~2GB on your default drive for downloading Zcash parameters.

## Contact
If you have any questions or issues getting started you can find members of the Zbay team on this [slack channel](https://join.slack.com/t/zbay/shared_invite/enQtOTE5MTI3OTA1NjE3LTViMWQyMzNkNmViMTZhZmEzYmZhMjg1YTYzNDQ5MmQ2NzU1NDc4ZWY1ZDQ1NjkwNjgwN2NiYmIzZTA2YTJiMDA).
