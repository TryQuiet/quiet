export default zcashClient => {
  const getStatus = async opId => {
    const res = await zcashClient.request.z_getoperationstatus([opId])
    return res[0]
  }
  const getTransactionsCount = async (confirmations = 0) => {
    const res = await zcashClient.request.z_getnotescount(confirmations)
    return res
  }
  return {
    getStatus,
    getTransactionsCount
  }
}
