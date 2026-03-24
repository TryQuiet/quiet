import CryptoKit
import Foundation

// MARK: - Protocol

protocol DeviceCryptography {
    /// Sign message bytes with the device Ed25519 private key.
    /// Returns raw 64-byte signature.
    func sign(message: Data) throws -> Data

    /// Signs a challenge payload exactly as `identity.prove()` does in TypeScript.
    func signChallengePayload(_ challenge: ChallengePayload, privateKeyData: Data) throws -> ProofPayload
}

extension DeviceCryptography {
    func signChallengePayload(_ challenge: ChallengePayload, privateKeyData: Data) throws -> ProofPayload {
        let payloadBytes = try NSEMsgpack.encode(challenge)
        let signatureBytes = try signBytes(payloadBytes, privateKeyData: privateKeyData)
        return ProofPayload(signature: Base58.encode(signatureBytes))
    }

    func signBytes(_ message: Data, privateKeyData: Data) throws -> Data {
        guard privateKeyData.count == 64 || privateKeyData.count == 32 else {
            throw NSECryptoError.invalidKeyLength(expected: 64, got: privateKeyData.count)
        }
        let seed = privateKeyData.prefix(32)
        let privateKey = try Curve25519.Signing.PrivateKey(rawRepresentation: seed)
        return try privateKey.signature(for: message)
    }
}

// MARK: - Errors

enum NSECryptoError: Error, LocalizedError {
    case invalidKeyLength(expected: Int, got: Int)
    case invalidBase58
    case signingFailed

    var errorDescription: String? {
        switch self {
        case .invalidKeyLength(let e, let g): return "Invalid key length: expected \(e), got \(g)"
        case .invalidBase58: return "Invalid base58 encoding"
        case .signingFailed: return "Signing failed"
        }
    }
}

// MARK: - NSECryptoService

/// Mirrors `@localfirst/crypto` signing used in `identity.prove()`:
///   1. msgpack-serialize the challenge object (same encoding as msgpackr)
///   2. Sign with `crypto_sign_detached` (Ed25519, libsodium 64-byte key)
///   3. base58-encode the 64-byte signature
class NSECryptoService: DeviceCryptography {

    /// Signs raw bytes using the device Ed25519 private key.
    /// The 64-byte libsodium secret key = 32-byte seed ++ 32-byte public key.
    /// CryptoKit only needs the 32-byte seed.
    func sign(message: Data) throws -> Data {
        // Requires private key externally; use signBytes(_:privateKeyData:) directly.
        throw NSECryptoError.signingFailed
    }
}

// MARK: - Msgpack encoder
// Encodes the ChallengePayload object in the same format as msgpackr.pack():
//   { type: string, name: string, nonce: string, timestamp: number }
// Field order must exactly match the JS object insertion order.

enum NSEMsgpack {
    enum MsgpackError: Error { case unsupportedType, stringTooLong }

    /// Encodes a ChallengePayload in the same byte format as msgpackr.pack().
    static func encode(_ challenge: ChallengePayload) throws -> Data {
        var out = Data()
        // fixmap with 4 elements: 0x84
        out.append(0x84)
        // key: "type"  value: challenge.type
        try appendString("type", to: &out)
        try appendString(challenge.type, to: &out)
        // key: "name"  value: challenge.name
        try appendString("name", to: &out)
        try appendString(challenge.name, to: &out)
        // key: "nonce"  value: challenge.nonce
        try appendString("nonce", to: &out)
        try appendString(challenge.nonce, to: &out)
        // key: "timestamp"  value: challenge.timestamp (Unix ms, Int64)
        try appendString("timestamp", to: &out)
        appendUInt64(UInt64(bitPattern: Int64(challenge.timestamp)), to: &out)
        return out
    }

    private static func appendString(_ s: String, to out: inout Data) throws {
        guard let bytes = s.data(using: .utf8) else { throw MsgpackError.unsupportedType }
        let len = bytes.count
        if len < 32 {
            // fixstr: 0xa0 | len
            out.append(UInt8(0xa0 | len))
        } else if len <= 0xFF {
            // str8: 0xd9, len
            out.append(0xd9)
            out.append(UInt8(len))
        } else if len <= 0xFFFF {
            // str16: 0xda, len_hi, len_lo
            out.append(0xda)
            out.append(UInt8((len >> 8) & 0xFF))
            out.append(UInt8(len & 0xFF))
        } else {
            throw MsgpackError.stringTooLong
        }
        out.append(contentsOf: bytes)
    }

    /// Encodes a positive integer as uint64 (0xcf + 8 bytes BE).
    /// msgpackr uses uint64 for integers that exceed 2^32.
    private static func appendUInt64(_ v: UInt64, to out: inout Data) {
        if v <= 0x7F {
            out.append(UInt8(v)) // positive fixint
        } else if v <= 0xFF {
            out.append(0xcc); out.append(UInt8(v)) // uint8
        } else if v <= 0xFFFF {
            out.append(0xcd)
            out.append(UInt8((v >> 8) & 0xFF))
            out.append(UInt8(v & 0xFF))
        } else if v <= 0xFFFFFFFF {
            out.append(0xce)
            out.append(UInt8((v >> 24) & 0xFF))
            out.append(UInt8((v >> 16) & 0xFF))
            out.append(UInt8((v >> 8)  & 0xFF))
            out.append(UInt8(v & 0xFF))
        } else {
            // uint64: 0xcf + 8 bytes big-endian (used for Date.now() timestamps)
            out.append(0xcf)
            for shift in stride(from: 56, through: 0, by: -8) {
                out.append(UInt8((v >> shift) & 0xFF))
            }
        }
    }
}
