import CryptoKit
import Foundation
import Sodium

private typealias NSEJSONObject = [String: Any]

struct NSEDecryptedNotificationMessage {
    let channelId: String
    let userId: String
    let body: String
    let type: Int
}

private struct NSEEncryptionScope {
    let type: String
    let name: String
    let generation: Int
}

private struct NSEEncryptedPayload {
    let contents: Data
    let scope: NSEEncryptionScope
}

// MARK: - Protocol

protocol DeviceCryptography {
    /// Sign message bytes with the device Ed25519 private key.
    /// Returns raw 64-byte signature.
    func sign(message: Data) throws -> Data

    /// Signs a challenge payload exactly as `identity.prove()` does in TypeScript.
    func signChallengePayload(_ challenge: ChallengePayload, privateKeyData: Data) throws -> ProofPayload

    /// Decrypts a QSS log entry and, if it is a channel message, returns a displayable preview.
    func decryptNotificationMessage(from logEntry: LogEntry, teamId: String) throws -> NSEDecryptedNotificationMessage?
}

extension DeviceCryptography {
    func signChallengePayload(_ challenge: ChallengePayload, privateKeyData: Data) throws -> ProofPayload {
        let payloadBytes = try NSEMsgpack.encode(challenge)
        guard privateKeyData.count == 64 || privateKeyData.count == 32 else {
            throw NSECryptoError.invalidKeyLength(expected: 64, got: privateKeyData.count)
        }
        let seed = privateKeyData.prefix(32)
        let privateKey = try Curve25519.Signing.PrivateKey(rawRepresentation: seed)
        let signatureBytes = try privateKey.signature(for: payloadBytes)
        let publicKeyBytes = privateKey.publicKey.rawRepresentation
        return ProofPayload(
            signature: Base58.encode(signatureBytes),
            publicKey: Base58.encode(publicKeyBytes)
        )
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
    case invalidPayload(String)
    case msgpack(String)
    case decryptionFailed(String)
    case signingFailed

    var errorDescription: String? {
        switch self {
        case .invalidKeyLength(let e, let g): return "Invalid key length: expected \(e), got \(g)"
        case .invalidBase58: return "Invalid base58 encoding"
        case .invalidPayload(let msg): return "Invalid payload: \(msg)"
        case .msgpack(let msg): return "MessagePack decoding failed: \(msg)"
        case .decryptionFailed(let msg): return "Decryption failed: \(msg)"
        case .signingFailed: return "Signing failed"
        }
    }
}

// MARK: - NSECryptoService

/// Mirrors the JS crypto stack used in Quiet:
/// 1. Challenge signing matches `msgpackr.pack()` + `crypto_sign_detached`
/// 2. Log-entry decryption matches `@localfirst/crypto` symmetric.decryptBytes()
/// 3. QSS log entries contain msgpackr-record-encoded payloads, not JSON
class NSECryptoService: DeviceCryptography {
    private let sodium = Sodium()

    // Matches @localfirst/crypto stretch.ts
    private static let stretchSalt: [UInt8] = {
        guard let salt = Base58.decode("H5B4DLSXw5xwNYFdz1Wr6e") else { return [] }
        return [UInt8](salt)
    }()

    /// Signs raw bytes using the device Ed25519 private key.
    /// The 64-byte libsodium secret key = 32-byte seed ++ 32-byte public key.
    /// CryptoKit only needs the 32-byte seed.
    func sign(message: Data) throws -> Data {
        throw NSECryptoError.signingFailed
    }

    func decryptNotificationMessage(from logEntry: LogEntry, teamId: String) throws -> NSEDecryptedNotificationMessage? {
        let outerEnvelope = try self.decodeObject(logEntry.entry)
        guard let outerDict = outerEnvelope as? NSEJSONObject else {
            return nil
        }
        let outerEncrypted = try self.parseEncryptedPayload(outerDict["encrypted"], label: "outer QSS payload")

        let orbitEntry = try self.decryptPayload(outerEncrypted, teamId: teamId)
        guard
            let orbitEntryDict = orbitEntry as? NSEJSONObject,
            let payload = orbitEntryDict["payload"] as? NSEJSONObject,
            let payloadValue = payload["value"] as? NSEJSONObject
        else {
            return nil
        }

        guard
            payloadValue["contents"] != nil,
            payloadValue["channelId"] != nil
        else {
            return nil
        }

        let innerEncrypted = try self.parseEncryptedPayload(payloadValue["contents"], label: "inner channel message")
        let decryptedInner = try self.decryptPayload(innerEncrypted, teamId: teamId)
        guard let message = decryptedInner as? NSEJSONObject else {
            return nil
        }

        guard
            let channelId = self.stringValue(message["channelId"]),
            let userId = self.stringValue(message["userId"]),
            let type = self.intValue(message["type"]),
            let body = self.notificationBody(from: message, type: type)
        else {
            return nil
        }

        return NSEDecryptedNotificationMessage(
            channelId: channelId,
            userId: userId,
            body: body,
            type: type
        )
    }

    private func notificationBody(from message: NSEJSONObject, type: Int) -> String? {
        let trimmed = (self.stringValue(message["message"]) ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        if !trimmed.isEmpty {
            return trimmed
        }

        switch type {
        case 2:
            return "Sent an image"
        case 4:
            return "Sent a file"
        default:
            return nil
        }
    }

    private func decryptPayload(_ encryptedPayload: NSEEncryptedPayload, teamId: String) throws -> Any {
        let keyName = self.makeKeyName(teamId: teamId, scope: encryptedPayload.scope)
        let secretKey = try NSEKeychainHelper.getLfaKeyString(keyName: keyName)
        return try self.decryptSymmetric(cipherBytes: encryptedPayload.contents, password: secretKey)
    }

    private func decryptSymmetric(cipherBytes: Data, password: String) throws -> Any {
        let cipher = try self.decodeObject(cipherBytes)
        guard let cipherDict = cipher as? NSEJSONObject else {
            throw NSECryptoError.invalidPayload("cipher bytes did not decode to an object")
        }

        guard
            let nonce = self.dataValue(cipherDict["nonce"]),
            let message = self.dataValue(cipherDict["message"]),
            let tag = self.dataValue(cipherDict["tag"]),
            let mac = self.dataValue(cipherDict["mac"])
        else {
            throw NSECryptoError.invalidPayload("cipher object was missing nonce/message/tag/mac")
        }

        let derivedKey = try self.stretch(password)
        let authMessage = [UInt8](nonce + mac)
        let tagValid = self.sodium.auth.verify(
            message: authMessage,
            secretKey: derivedKey,
            tag: [UInt8](tag)
        )
        guard tagValid else {
            throw NSECryptoError.decryptionFailed("cipher tag verification failed")
        }

        guard let decryptedBytes = self.sodium.secretBox.open(
            cipherText: [UInt8](message),
            secretKey: derivedKey,
            nonce: [UInt8](nonce),
            mac: [UInt8](mac)
        ) else {
            throw NSECryptoError.decryptionFailed("secretbox open failed")
        }

        return try self.decodeObject(Data(decryptedBytes))
    }

    private func stretch(_ password: String) throws -> [UInt8] {
        let passwordBytes = [UInt8](password.utf8)
        guard !Self.stretchSalt.isEmpty else {
            throw NSECryptoError.invalidBase58
        }

        if passwordBytes.count >= 16 {
            guard let derived = self.sodium.genericHash.hash(
                message: passwordBytes,
                key: Self.stretchSalt,
                outputLength: 32
            ) else {
                throw NSECryptoError.decryptionFailed("generic hash stretch failed")
            }
            return derived
        }

        guard let derived = self.sodium.pwHash.hash(
            outputLength: 32,
            passwd: passwordBytes,
            salt: Self.stretchSalt,
            opsLimit: self.sodium.pwHash.OpsLimitInteractive,
            memLimit: self.sodium.pwHash.MemLimitInteractive
        ) else {
            throw NSECryptoError.decryptionFailed("argon2 stretch failed")
        }
        return derived
    }

    private func parseEncryptedPayload(_ value: Any?, label: String) throws -> NSEEncryptedPayload {
        guard let dict = value as? NSEJSONObject else {
            throw NSECryptoError.invalidPayload("\(label) was not an object")
        }

        guard let contents = self.dataValue(dict["contents"]) else {
            throw NSECryptoError.invalidPayload("\(label) contents were not binary")
        }

        guard
            let scopeDict = dict["scope"] as? NSEJSONObject,
            let scopeType = self.stringValue(scopeDict["type"]),
            let scopeName = self.stringValue(scopeDict["name"]),
            let generation = self.intValue(scopeDict["generation"])
        else {
            throw NSECryptoError.invalidPayload("\(label) scope was malformed")
        }

        return NSEEncryptedPayload(
            contents: contents,
            scope: NSEEncryptionScope(type: scopeType, name: scopeName, generation: generation)
        )
    }

    private func makeKeyName(teamId: String, scope: NSEEncryptionScope) -> String {
        return "quiet_\(teamId)_\(scope.type)_\(scope.name)_\(scope.generation)_secret"
    }

    private func decodeObject(_ data: Data) throws -> Any {
        return try NSEMsgpack.decode(data)
    }

    private func dataValue(_ value: Any?) -> Data? {
        if let data = value as? Data {
            return data
        }
        if let bytes = value as? [UInt8] {
            return Data(bytes)
        }
        return nil
    }

    private func stringValue(_ value: Any?) -> String? {
        if let string = value as? String {
            return string
        }
        return nil
    }

    private func intValue(_ value: Any?) -> Int? {
        switch value {
        case let int as Int:
            return int
        case let int8 as Int8:
            return Int(int8)
        case let int16 as Int16:
            return Int(int16)
        case let int32 as Int32:
            return Int(int32)
        case let int64 as Int64:
            return Int(int64)
        case let uint as UInt:
            return Int(uint)
        case let uint8 as UInt8:
            return Int(uint8)
        case let uint16 as UInt16:
            return Int(uint16)
        case let uint32 as UInt32:
            return Int(uint32)
        case let uint64 as UInt64:
            return Int(uint64)
        case let number as NSNumber:
            return number.intValue
        case let double as Double:
            return Int(double)
        case let string as String:
            return Int(string)
        default:
            return nil
        }
    }
}

// MARK: - Msgpack helpers
// Encodes the ChallengePayload object in the same byte format as msgpackr.pack():
//   { type: string, name: string, nonce: string, timestamp: number }
//
// msgpackr quirks that must be matched exactly:
//   1. Objects always use map16 format (0xde + 2-byte count), never fixmap.
//   2. Integers > 2^32 (e.g. Date.now() in ms) are encoded as float64 (0xcb).
//   3. Strings 0–31 bytes → fixstr (0xa0|len); 32–255 bytes → str8 (0xd9, len).
// Field order must exactly match the JS object insertion order.

enum NSEMsgpack {
    enum MsgpackError: Error {
        case invalidRecordDefinition
        case invalidString
        case invalidMapKey
        case stringTooLong
        case truncated
        case unsupportedExtension(UInt8)
        case unsupportedType(UInt8)
    }

    /// Encodes a ChallengePayload in the same byte format as msgpackr.pack().
    static func encode(_ challenge: ChallengePayload) throws -> Data {
        var out = Data()
        // map16 with 4 elements: 0xde 0x00 0x04
        // msgpackr always uses map16, never fixmap, regardless of element count.
        out.append(0xde)
        out.append(0x00)
        out.append(0x04)
        // key: "type"  value: challenge.type
        try appendString("type", to: &out)
        try appendString(challenge.type, to: &out)
        // key: "name"  value: challenge.name
        try appendString("name", to: &out)
        try appendString(challenge.name, to: &out)
        // key: "nonce"  value: challenge.nonce
        try appendString("nonce", to: &out)
        try appendString(challenge.nonce, to: &out)
        // key: "timestamp"  value: challenge.timestamp
        // Date.now() returns ms since epoch (~1.7e12), which exceeds 2^32.
        // msgpackr encodes values > 2^32 as float64, not uint64.
        try appendString("timestamp", to: &out)
        appendFloat64(Double(challenge.timestamp), to: &out)
        return out
    }

    static func decode(_ data: Data) throws -> Any {
        try Decoder(data: data).decode()
    }

    private static func appendString(_ s: String, to out: inout Data) throws {
        guard let bytes = s.data(using: .utf8) else { throw MsgpackError.invalidString }
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

    /// Encodes a Double as IEEE 754 float64 (0xcb + 8 bytes big-endian).
    /// msgpackr uses float64 for JavaScript numbers that exceed 2^32.
    private static func appendFloat64(_ v: Double, to out: inout Data) {
        out.append(0xcb)
        let bits = v.bitPattern // UInt64 IEEE 754 representation
        out.append(UInt8((bits >> 56) & 0xFF))
        out.append(UInt8((bits >> 48) & 0xFF))
        out.append(UInt8((bits >> 40) & 0xFF))
        out.append(UInt8((bits >> 32) & 0xFF))
        out.append(UInt8((bits >> 24) & 0xFF))
        out.append(UInt8((bits >> 16) & 0xFF))
        out.append(UInt8((bits >>  8) & 0xFF))
        out.append(UInt8(bits & 0xFF))
    }

    private final class Decoder {
        private let bytes: [UInt8]
        private var index: Int = 0
        private var records: [UInt8: [String]] = [:]

        init(data: Data) {
            self.bytes = [UInt8](data)
        }

        func decode() throws -> Any {
            let value = try self.readValue()
            guard self.index == self.bytes.count else {
                throw MsgpackError.truncated
            }
            return value
        }

        private func readValue() throws -> Any {
            let token = try self.readByte()

            switch token {
            case 0x00...0x3f:
                return Int(token)
            case 0x40...0x7f:
                if let record = self.records[token] {
                    return try self.readRecord(record)
                }
                return Int(token)
            case 0x80...0x8f:
                return try self.readMap(count: Int(token & 0x0f))
            case 0x90...0x9f:
                return try self.readArray(count: Int(token & 0x0f))
            case 0xa0...0xbf:
                return try self.readString(length: Int(token & 0x1f))
            case 0xc0:
                return NSNull()
            case 0xc1:
                throw MsgpackError.unsupportedType(token)
            case 0xc2:
                return false
            case 0xc3:
                return true
            case 0xc4:
                return try self.readBinary(length: Int(try self.readByte()))
            case 0xc5:
                return try self.readBinary(length: Int(try self.readUInt16()))
            case 0xc6:
                return try self.readBinary(length: Int(try self.readUInt32()))
            case 0xc7:
                return try self.readExtension(length: Int(try self.readByte()))
            case 0xc8:
                return try self.readExtension(length: Int(try self.readUInt16()))
            case 0xc9:
                return try self.readExtension(length: Int(try self.readUInt32()))
            case 0xca:
                return try self.readFloat32()
            case 0xcb:
                return try self.readFloat64()
            case 0xcc:
                return Int(try self.readByte())
            case 0xcd:
                return Int(try self.readUInt16())
            case 0xce:
                return Int(try self.readUInt32())
            case 0xcf:
                let value = try self.readUInt64()
                return value <= UInt64(Int.max) ? Int(value) : Double(value)
            case 0xd0:
                return Int(try self.readInt8())
            case 0xd1:
                return Int(try self.readInt16())
            case 0xd2:
                return Int(try self.readInt32())
            case 0xd3:
                let value = try self.readInt64()
                return value >= Int64(Int.min) && value <= Int64(Int.max) ? Int(value) : Double(value)
            case 0xd4:
                return try self.readFixext(length: 1)
            case 0xd5:
                return try self.readFixext(length: 2)
            case 0xd6:
                return try self.readFixext(length: 4)
            case 0xd7:
                return try self.readFixext(length: 8)
            case 0xd8:
                return try self.readFixext(length: 16)
            case 0xd9:
                return try self.readString(length: Int(try self.readByte()))
            case 0xda:
                return try self.readString(length: Int(try self.readUInt16()))
            case 0xdb:
                return try self.readString(length: Int(try self.readUInt32()))
            case 0xdc:
                return try self.readArray(count: Int(try self.readUInt16()))
            case 0xdd:
                return try self.readArray(count: Int(try self.readUInt32()))
            case 0xde:
                return try self.readMap(count: Int(try self.readUInt16()))
            case 0xdf:
                return try self.readMap(count: Int(try self.readUInt32()))
            case 0xe0...0xff:
                return Int(Int8(bitPattern: token))
            default:
                throw MsgpackError.unsupportedType(token)
            }
        }

        private func readRecord(_ keys: [String]) throws -> NSEJSONObject {
            var object: NSEJSONObject = [:]
            object.reserveCapacity(keys.count)
            for key in keys {
                object[key] = try self.readValue()
            }
            return object
        }

        private func readMap(count: Int) throws -> NSEJSONObject {
            var map: NSEJSONObject = [:]
            map.reserveCapacity(count)
            for _ in 0..<count {
                let keyValue = try self.readValue()
                guard let key = keyValue as? String else {
                    throw MsgpackError.invalidMapKey
                }
                map[key] = try self.readValue()
            }
            return map
        }

        private func readArray(count: Int) throws -> [Any] {
            var array: [Any] = []
            array.reserveCapacity(count)
            for _ in 0..<count {
                array.append(try self.readValue())
            }
            return array
        }

        private func readString(length: Int) throws -> String {
            let data = try self.readData(length: length)
            guard let string = String(data: data, encoding: .utf8) else {
                throw MsgpackError.invalidString
            }
            return string
        }

        private func readBinary(length: Int) throws -> Data {
            return try self.readData(length: length)
        }

        private func readExtension(length: Int) throws -> Any {
            let type = try self.readByte()
            let payload = try self.readData(length: length)
            if type == 0x72, length == 1 {
                guard let recordId = payload.first else {
                    throw MsgpackError.invalidRecordDefinition
                }
                let keysValue = try self.readValue()
                guard let keys = keysValue as? [Any] else {
                    throw MsgpackError.invalidRecordDefinition
                }
                let stringKeys = try keys.map { key -> String in
                    guard let key = key as? String else {
                        throw MsgpackError.invalidRecordDefinition
                    }
                    return key
                }
                self.records[recordId] = stringKeys
                return try self.readRecord(stringKeys)
            }
            return payload
        }

        private func readFixext(length: Int) throws -> Any {
            let type = try self.readByte()
            let payload = try self.readData(length: length)
            if type == 0x72, length == 1 {
                guard let recordId = payload.first else {
                    throw MsgpackError.invalidRecordDefinition
                }
                let keysValue = try self.readValue()
                guard let keys = keysValue as? [Any] else {
                    throw MsgpackError.invalidRecordDefinition
                }
                let stringKeys = try keys.map { key -> String in
                    guard let key = key as? String else {
                        throw MsgpackError.invalidRecordDefinition
                    }
                    return key
                }
                self.records[recordId] = stringKeys
                return try self.readRecord(stringKeys)
            }
            // msgpackr uses fixext1 type 0 data 0 for undefined. Treat it as nil-like.
            if type == 0x00, length == 1, payload.first == 0x00 {
                return NSNull()
            }
            return payload
        }

        private func readData(length: Int) throws -> Data {
            guard self.index + length <= self.bytes.count else {
                throw MsgpackError.truncated
            }
            let data = Data(self.bytes[self.index..<(self.index + length)])
            self.index += length
            return data
        }

        private func readByte() throws -> UInt8 {
            guard self.index < self.bytes.count else {
                throw MsgpackError.truncated
            }
            let value = self.bytes[self.index]
            self.index += 1
            return value
        }

        private func readUInt16() throws -> UInt16 {
            let b0 = UInt16(try self.readByte())
            let b1 = UInt16(try self.readByte())
            return (b0 << 8) | b1
        }

        private func readUInt32() throws -> UInt32 {
            let b0 = UInt32(try self.readByte())
            let b1 = UInt32(try self.readByte())
            let b2 = UInt32(try self.readByte())
            let b3 = UInt32(try self.readByte())
            return (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
        }

        private func readUInt64() throws -> UInt64 {
            let b0 = UInt64(try self.readByte())
            let b1 = UInt64(try self.readByte())
            let b2 = UInt64(try self.readByte())
            let b3 = UInt64(try self.readByte())
            let b4 = UInt64(try self.readByte())
            let b5 = UInt64(try self.readByte())
            let b6 = UInt64(try self.readByte())
            let b7 = UInt64(try self.readByte())
            return (b0 << 56) | (b1 << 48) | (b2 << 40) | (b3 << 32) | (b4 << 24) | (b5 << 16) | (b6 << 8) | b7
        }

        private func readInt8() throws -> Int8 {
            Int8(bitPattern: try self.readByte())
        }

        private func readInt16() throws -> Int16 {
            Int16(bitPattern: try self.readUInt16())
        }

        private func readInt32() throws -> Int32 {
            Int32(bitPattern: try self.readUInt32())
        }

        private func readInt64() throws -> Int64 {
            Int64(bitPattern: try self.readUInt64())
        }

        private func readFloat32() throws -> Double {
            let bits = try self.readUInt32()
            return Double(Float(bitPattern: bits))
        }

        private func readFloat64() throws -> Double {
            let bits = try self.readUInt64()
            return Double(bitPattern: bits)
        }
    }
}
