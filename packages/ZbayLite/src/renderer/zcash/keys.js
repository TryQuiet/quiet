export default (zcashClient) => {
  const exportIVK = async (address) => zcashClient.request.z_exportviewingkey(address)
  const importIVK = async ({
    ivk,
    rescan = 'whenkeyisnew',
    startHeight = 0,
    address
  }) => zcashClient.request.z_importviewingkey(ivk, rescan, startHeight, address)

  const exportSK = async (address) => zcashClient.request.z_exportkey(address)
  const importSK = async ({
    sk,
    rescan = 'whenkeyisnew',
    startHeight = 0
  }) => zcashClient.request.z_importkey(sk, rescan, startHeight)

  const exportTPK = zcashClient.request.dumpprivkey
  const importTPK = zcashClient.request.importprivkey
  return {
    exportIVK,
    importIVK,
    exportSK,
    importSK,
    exportTPK,
    importTPK
  }
}
