import { ActionCreator, AnyAction } from 'redux';
interface ActionsBasicType {
    [k: string]: ActionCreator<AnyAction>;
}
export declare type ActionsType<Actions extends ActionsBasicType> = {
    [k in keyof Actions]: ReturnType<Actions[k]>;
};
export declare type Keys<Actions> = keyof Actions;
export declare type ActionFromMapping<Actions> = Actions[Keys<Actions>];
export declare enum SocketActionTypes {
    ASK_FOR_MESSAGES = "askForMessages",
    CLOSE = "close",
    COMMUNITY = "community",
    CONNECTED_PEERS = "connectedPeers",
    CONNECT_TO_WEBSOCKET_SERVER = "connectToWebsocketServer",
    CONNECTION = "connection",
    CREATED_CHANNEL = "createdChannel",
    CREATE_COMMUNITY = "createCommunity",
    CREATE_NETWORK = "createNetwork",
    DIRECT_MESSAGE = "directMessage",
    ERROR = "error",
    GET_PRIVATE_CONVERSATIONS = "getPrivateConversations",
    GET_PUBLIC_CHANNELS = "getPublicChannels",
    INCOMING_MESSAGES = "incomingMessages",
    INITIALIZE_CONVERSATION = "initializeConversation",
    LAUNCH_COMMUNITY = "launchCommunity",
    LAUNCH_REGISTRAR = "launchRegistrar",
    NETWORK = "network",
    NEW_COMMUNITY = "newCommunity",
    PEER_CONNECT = "peer:connect",
    PEER_DISCONNECT = "peer:disconnect",
    REGISTER_USER_CERTIFICATE = "registerUserCertificate",
    REGISTER_OWNER_CERTIFICATE = "registerOwnerCertificate",
    REGISTRAR = "registrar",
    RESPONSE_FETCH_ALL_DIRECT_MESSAGES = "responseFetchAllDirectMessages",
    RESPONSE_FETCH_ALL_MESSAGES = "responseFetchAllMessages",
    RESPONSE_GET_CERTIFICATES = "responseGetCertificates",
    RESPONSE_GET_PRIVATE_CONVERSATIONS = "responseGetPrivateConversations",
    RESPONSE_GET_PUBLIC_CHANNELS = "responseGetPublicChannels",
    REQUEST_PEER_ID = "requestPeerId",
    SAVE_OWNER_CERTIFICATE = "saveOwnerCertificate",
    SAVED_OWNER_CERTIFICATE = "savedOwnerCertificate",
    SEND_DIRECT_MESSAGE = "sendDirectMessage",
    SEND_IDS = "sendIds",
    SEND_MESSAGE = "sendMessage",
    SEND_MESSAGES_IDS = "sendIds",
    SEND_PEER_ID = "sendPeerId",
    SEND_USER_CERTIFICATE = "sendUserCertificate",
    SUBSCRIBE_FOR_ALL_CONVERSATIONS = "subscribeToAllConversations",
    SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD = "subscribeToDirectMessageThread",
    SUBSCRIBE_TO_TOPIC = "subscribeToTopic"
}
export {};
