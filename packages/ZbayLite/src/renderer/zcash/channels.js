export default {
  general: {
    testnet: {
      name: 'General',
      private: true,
      address:
        'ztestsapling1dfjv308amnk40s89trkvz646ne69553us0g858mmpgsw540efgftn4tf25gts2cttg3jgk9y8lx',
      description: 'This is a general channel available to all users of Zbay by default.',
      keys: {
        ivk: 'zivktestsapling1algnz2x84pqcnfdxrlntw73wpuqm3v568cepf5tuctyusm9javpqyjyzqy'
      }
    },
    mainnet: {
      name: 'General',
      private: true,
      address: 'zs1fcs4lt0pavh0zf3qnzt2lf4cu2krm6y96czpmqzheph3ya43zhfr6nh6khjs0g5xgsgcj4p775r',
      description: 'This is a general channel available to all users of Zbay by default.',
      keys: {
        ivk: 'zivks19kx22qytvd48u06qk52prjnjx66d3g09a6mulawp25n8v6xk0vqqwuydge'
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
        ivk: 'zivktestsapling1k93jxuecldthr9myy9d0svsy5dz57xvtcw7hyh9wj9xqy4ehfsqszlhdce'
      }
    },
    mainnet: {
      name: 'RegisteredUsers',
      private: true,
      address: 'zs1gj85kyte6lar223qdk0x2l2krua0xs4wpmmkz5ffqyya9ea92lnn9d02tpg6eavqefptu8p83tw',
      description: 'Store data about users.',
      keys: {
        ivk: 'zivks1257u0x5aspyrclysawre5duaxfck2txmv7lm2tjudlyh4flh55zquklc2s'
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
        ivk: 'zivktestsapling194t7fk8ns0v2u4jysmrmwyh2ymq52t5378ey8jym23d2dpy3d5pssyk97t'
      }
    },
    mainnet: {
      name: 'channelOfChannels',
      private: true,
      address: 'zs16u4chc3nd525eqjc50zjv4chuwdpkj3kvnvcnvhj77g430q0kccelmnz6vrksw6cq4q3khshvs3',
      description: 'Contains list of public channels',
      keys: {
        ivk: 'zivks14fgrxnk2f6qhtndxtc23cwy74kuyptq78qen9jq2ts2hnz0e7vrqazzytr'
      }
    }
  }
}
