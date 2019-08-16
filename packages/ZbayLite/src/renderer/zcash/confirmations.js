export default (zcashClient) => {
  const getResult = async (txId) => {
    const res = await zcashClient.request.gettransaction(txId)
    return res
  }

  return {
    getResult
  }
}
