export default (zcashClient) => {
  const getStatus = async (opId) => {
    const res = await zcashClient.request.z_getoperationstatus([opId])
    return res[0]
  }

  return {
    getStatus
  }
}
