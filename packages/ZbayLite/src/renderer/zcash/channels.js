export default {
  general: {
    testnet: {
      name: 'general',
      private: true,
      address:
        'ztestsapling1dfjv308amnk40s89trkvz646ne69553us0g858mmpgsw540efgftn4tf25gts2cttg3jgk9y8lx',
      description:
        'This is a general channel available to all users of Zbay by default.',
      keys: {
        ivk:
          'zivktestsapling1algnz2x84pqcnfdxrlntw73wpuqm3v568cepf5tuctyusm9javpqyjyzqy'
      }
    },
    mainnet: {
      name: 'general',
      private: true,
      address:
        'zs12nwl3q345gumclndp7awk9exmgdm9lehk0zyrjarrmqhg97uh5pw8vkmw6554m3e7rrmqvck9js',
      description:
        'This is a general channel available to all users of Zbay by default.',
      keys: {
        ivk: 'zivks1hjwr7pqzp22cku022fjuvxsjdj40t34ht3areat9tr5kq0k7qsrqx9s8yu'
      }
    }
  },
  registeredUsers: {
    testnet: {
      name: 'RegisteredUsers',
      private: true,
      address:
        'ztestsapling1ggtntm4dgfc0remdxzex0pz722swjtqxc7wxj4eeqksmups04dkhjvcj5vcklmud2y3yvgj302m',
      description: 'Store data about users.',
      keys: {
        ivk:
          'zivktestsapling1k93jxuecldthr9myy9d0svsy5dz57xvtcw7hyh9wj9xqy4ehfsqszlhdce'
      }
    },
    mainnet: {
      name: 'RegisteredUsers',
      private: true,
      address:
        'zs1e3u6jury8ahlfccudwk9z8dctsnlk32y0wc5l5tsv0e2yud4y5sdyfq69cynlscz02qnxph3uur',
      description: 'Store data about users.',
      keys: {
        ivk: 'zivks1gpspx8v7h34k9zptv5vdaeuhqcrkvk6g872eldt49mqzsjdzlcpqezzh95'
      }
    }
  },
  channelOfChannels: {
    testnet: {
      name: 'channelOfChannels',
      private: true,
      address:
        'ztestsapling1rwqrk7uclurs5dqm70g4zf0rh9dmjf60qqtw2n68pa37ycs2zccglcymjg0nnmus70m3wkdyxx0',
      description: 'Contains list of public channels',
      keys: {
        ivk:
          'zivktestsapling194t7fk8ns0v2u4jysmrmwyh2ymq52t5378ey8jym23d2dpy3d5pssyk97t'
      }
    },
    mainnet: {
      name: 'channelOfChannels',
      private: true,
      address:
        'zs1lrc8s53ajqy2suwnderegv3ap3psm9shcx0h2j0qtyp3j4dgm7f8fadulxmckrztl83egl2l05r',
      description: 'Contains list of public channels',
      keys: {
        ivk: 'zivks145lmuzdneatnqq737aq0zx8msaamtr8aeksryrrcm8eqgfppzgzsvugld4'
      }
    }
  },
  // Create new accounts for donations
  zbay: {
    testnet: {
      name: 'donation',
      address:
        'ztestsapling10tfwmgy9jjzvhxxnlfqcakjpaddn8yq9qhwammfmxgf8ln2vkdafr8ut80kplerjer4nktmys07',
      publicKey:
        '03c5c6d4199607a69f4586d00e06432e4e9370d612ce7e075b0aa3240533bb24c4'
    },
    mainnet: {
      name: 'donation',
      address:
        'zs18hrn0u2h2u7y4fndvdmyyt8sgrsf37t7martl2pl889gkyfrsm27ga8uwxxzelx3a852s226hmd',
      publicKey:
        '027f74dd11ad584bb4e2f77eda7ee3550469366a81963930531f037659a9d334f8'
    }
  }
}
