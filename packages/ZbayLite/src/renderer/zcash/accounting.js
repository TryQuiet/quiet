import BigNumber from 'bignumber.js'

export default zcashClient => {
  const balance = async address => {
    const balance = await zcashClient.request.z_getbalance(address)
    return new BigNumber(balance)
  }
  const freeUtxos = async address => {
    const utxos = await zcashClient.request.z_listunspent(1, 9999999, false, [
      address
    ])
    return utxos
  }

  return {
    balance,
    freeUtxos
  }
}
