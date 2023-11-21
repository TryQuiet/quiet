import { filterAndSortPeers } from './sortPeers'

describe('filterValidAddresses', () => {
  it('filters out invalid addresses', () => {
    const valid = [
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/ws/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/80/ws/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
    ]
    const addresses = [
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
      ...valid,
      'invalidAddress',
      '/dns4/somethingElse.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA',
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/ws/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbK',
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrj.onion/tcp/443/ws/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
      'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbK',
    ]
    expect(filterAndSortPeers(addresses, [])).toEqual(valid)
  })
})
