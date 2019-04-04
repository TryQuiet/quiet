export default (zcashClient) => {
  const create = async (type = 'sapling') => zcashClient.request.z_getnewaddress(type)
  return {
    create
  }
}
