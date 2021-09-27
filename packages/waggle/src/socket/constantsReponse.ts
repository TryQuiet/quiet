export enum EventTypesResponse {
  ERROR = 'error',
  RESPONSE_FETCH_ALL_MESSAGES = 'responseFetchAllMessages',
  RESPONSE_ADD_TOR_SERVICE = 'responseAddTorService',
  RESPONSE_REMOVE_TOR_SERVICE = 'removeAddTorService',
  RESPONSE_GET_PUBLIC_CHANNELS = 'responseGetPublicChannels',
  RESPONSE_GET_AVAILABLE_USERS = 'responseGetAvailableUsers',
  RESPONSE_GET_PRIVATE_CONVERSATIONS = 'responseGetPrivateConversations',
  RESPONSE_FETCH_ALL_DIRECT_MESSAGES = 'responseFetchAllDirectMessages',
  SEND_PEER_ID = 'sendPeerId',
  SEND_IDS = 'sendIds',
  SEND_USER_CERTIFICATE = 'sendUserCertificate',
  RESPONSE_GET_CERTIFICATES = 'responseGetCertificates',
  NEW_COMMUNITY = 'newCommunity',
  COMMUNITY = 'community',
  REGISTRAR = 'registrar',
  NETWORK = 'network',
  SAVED_OWNER_CERTIFICATE = 'savedOwnerCertificate'
}
