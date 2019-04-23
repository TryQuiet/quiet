export default (zcashClient) => {
  const exportIVK = async (address) => zcashClient.request.z_exportviewingkey(address)
  const importIVK = async ({
    ivk,
    rescan = 'whenkeyisnew',
    startHeight = 0,
    address
  }) => zcashClient.request.z_importviewingkey(ivk, rescan, startHeight, address)
  return {
    exportIVK,
    importIVK
  }
}
