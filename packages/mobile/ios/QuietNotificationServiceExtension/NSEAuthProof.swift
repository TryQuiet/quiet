import CryptoKit
import Foundation

enum NSEAuthProofError: Error {
    case invalidKeyLength(Int)
    case invalidString
    case stringTooLong
}

/// Proof-facing core shared verbatim by the NSE runtime and its unit tests.
enum NSEAuthProof {
    static func sign(_ challenge: ChallengePayload, privateKeyData: Data) throws -> String {
        guard privateKeyData.count == 64 || privateKeyData.count == 32 else {
            throw NSEAuthProofError.invalidKeyLength(privateKeyData.count)
        }
        let privateKey = try Curve25519.Signing.PrivateKey(rawRepresentation: privateKeyData.prefix(32))
        return Base58.encode(try privateKey.signature(for: encode(challenge)))
    }

    static func encode(_ challenge: ChallengePayload) throws -> Data {
        var out = Data()
        out.append(0x92)
        try appendString(nseAuthSignatureContext, to: &out)
        out.append(0x99)
        out.append(UInt8(challenge.protocolVersion))
        try appendString(challenge.type, to: &out)
        try appendString(challenge.deviceId, to: &out)
        try appendString(challenge.teamId, to: &out)
        try appendString(challenge.qssServerId, to: &out)
        try appendString(challenge.challengeId, to: &out)
        try appendString(challenge.nonce, to: &out)
        appendFloat64(Double(challenge.issuedAtMs), to: &out)
        appendFloat64(Double(challenge.expiresAtMs), to: &out)
        return out
    }

    private static func appendString(_ value: String, to out: inout Data) throws {
        guard let bytes = value.data(using: .utf8) else { throw NSEAuthProofError.invalidString }
        switch bytes.count {
        case 0..<32:
            out.append(UInt8(0xa0 | bytes.count))
        case 32...0xff:
            out.append(0xd9)
            out.append(UInt8(bytes.count))
        case 0x100...0xffff:
            out.append(0xda)
            out.append(UInt8((bytes.count >> 8) & 0xff))
            out.append(UInt8(bytes.count & 0xff))
        default:
            throw NSEAuthProofError.stringTooLong
        }
        out.append(bytes)
    }

    private static func appendFloat64(_ value: Double, to out: inout Data) {
        out.append(0xcb)
        var bits = value.bitPattern.bigEndian
        withUnsafeBytes(of: &bits) { out.append(contentsOf: $0) }
    }
}
