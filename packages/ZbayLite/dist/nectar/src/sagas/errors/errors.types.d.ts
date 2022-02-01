export declare class ErrorPayloadData {
    type: string;
    message: string;
    communityId?: string;
}
export declare class ErrorPayload extends ErrorPayloadData {
    code: number;
}
export declare enum ErrorCodes {
    VALIDATION = 403,
    SERVER_ERROR = 500
}
export declare enum ErrorMessages {
    REGISTRAR_CONNECTION_FAILED = "Connecting to registrar failed",
    REGISTRAR_LAUNCH_FAILED = "Could not launch registrar",
    REGISTRATION_FAILED = "Registering username failed.",
    USERNAME_TAKEN = "Username already taken.",
    INVALID_USERNAME = "Username is not valid",
    COMMUNITY_LAUNCH_FAILED = "Could not launch community",
    NETWORK_SETUP_FAILED = "Creating network failed",
    NOT_CONNECTED = "You're not connected with other peers."
}
export declare const GENERAL_ERRORS = "general";
