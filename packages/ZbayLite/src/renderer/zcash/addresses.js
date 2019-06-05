export default (zcashClient) => {
  const create = async (type = 'sapling') => zcashClient.request.z_getnewaddress(type)
  const createTransparent = async () => zcashClient.request.getnewaddress()
  return {
    create,
    createTransparent
  }
}
