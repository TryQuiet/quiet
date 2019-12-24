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
        'zs1qm5kdw592l9x704xqtjln3msyn7gqnfat2uxf05yky2u7xzmsuu5ekel3tf8v4ulqnux6u3f4ac',
      description:
        'This is a general channel available to all users of Zbay by default.',
      keys: {
        ivk: 'zivks1y3csr6f8uga948gepdpgq86mxg4dn0a6jx9qnvz07t6jqf53j5rslc9mu3'
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
        'zs1n4xfm0rsmju0fyevqwvgu5jve54v6etqv0sa7djv7kjfpwjpv7fsq54nuykax4y820ggy9g74y6',
      description: 'Store data about users.',
      keys: {
        ivk: 'zivks1s4cw25evj50cagzmx8ng2jrsjvefsmpm37znwsdve6cp3fv5eczskzll2h'
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
        'zs1k2kqrssynect92hpaef8ewmgwersrz5apc2gn8eyy9g0pk5gu2a6twdxaytfprkms56qcpafg72',
      description: 'Contains list of public channels',
      keys: {
        ivk: 'zivks14g72xlh44vsy3nk0d7y83q39hs5jkelp0de8l6a8cdkecxwfa5pquav8as'
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
        'zs15myy2d3sgn90p0rvcjlamaczqzglsdnqua6a3mz72fy5fhnke9txpg250kmzzndlu096s3d70j0',
      publicKey:
        '03c5c6d4199607a69f4586d00e06432e4e9370d612ce7e075b0aa3240533bb24c4'
    }
  }
}
