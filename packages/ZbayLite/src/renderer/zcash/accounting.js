import BigNumber from 'bignumber.js'

export default (zcashClient) => {
  const balance = async (address) => {
    const balance = await zcashClient.request.z_getbalance(address)
    return new BigNumber(balance)
  }

  return {
    balance
  }
}
