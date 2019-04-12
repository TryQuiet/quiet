export default (zcashClient) => {
  const received = async (address) => zcashClient.request.z_listreceivedbyaddress(address)

  return {
    received
  }
}
