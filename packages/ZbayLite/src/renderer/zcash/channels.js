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
        'zs13vfsjfw07g3yqse8h742nvhm5csz2qpcz25t77ynk9zlatsq6wtxunmakf7rgn6fjw5q70h4jt7',
      description:
        'This is a general channel available to all users of Zbay by default.',
      keys: {
        ivk: 'zxviews1qwk53xxqqgqqpqrdhg8mw8xdprc9gd6lfpddgyaz9x5575cxeyk53efx02n0swpa3rhxms8zxvj62z2and8thzfe3qyl3k7qgpk45glak450zsyn70tq5z367nj972mzkutdxaclwd59jnsq0w8q59aks6rju9s2vgu7y9qcleq76pluemthwknl44c2anzj4zj0fpqufh6fezcfl8lppvxmzee3fg53gfhwyd0y735gxuhwhxn6q5eyvncye9fcldwzpf7twzjrnwgk6eumj'
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
        'zs1j5udj8n6yquks5pv00aqg86dhhjpr7fq2906zqqpn0jktfg654qmcz9tm4gslutpjnwkzaemgsk',
      description: 'Store data about users.',
      keys: {
        ivk: 'zxviews1qwk53xxqqyqqpq9p5hc89jednxg8ur0gfp9fa5ktt9mavml9nptve8um69ruzsujsywpul7ug77068ql93y6n5ylg9klcrfh6xhsu4a3dyseyfjqztwq8nn7ngaxcj4hvhfqda2rafmumefkgjrhmtwwwc72qk0svtquxzszj4v44lvwqflyjh55xm5s37zzw2nrs2yu63ecuwq8hrelhenkttm4cgws9uq2afauxyak69lmk0dteungyfavxadf2uwwhmczdegvq2sr3j9cq'
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
        'zs16tx82nyknwptwcgqdy082446mca0kvt7uk4yrusx66c53uull4nme0hwhx60rkygz2rg6trfqwx',
      description: 'Contains list of public channels',
      keys: {
        ivk: 'zxviews1qwk53xxqqqqqpq98v256ypjt0x0uqhntg3e3za04usl6500kny80ajnt2ncvcqunt88sf9ayw066xn8ktfvw7wy5fd56kj7mdj82geuq2vfjl4tuse9t8njge6sj6xrja22ze84qj232ghu0jn0scyk9kaa47smg0tw8wquwvzau0xjwsnrt4euywnm5wrm7wks67rh03gyy09r97qcakfnwrl02xlgny4ja90k84888qzzrcfjfxpu9es8edjx8gt933al6m428ysq0jj2gv'
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
