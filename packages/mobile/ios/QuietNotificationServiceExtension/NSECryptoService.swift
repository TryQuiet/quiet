import Foundation
import Sodium

private typealias NSEJSONObject = [String: Any]

private struct NSEEncryptionScope {
    let type: String
    let name: String
    let generation: Int
}

private struct NSEEncryptedPayload {
    let contents: Data
    let scope: NSEEncryptionScope
}

private struct NSEDecryptedPayload {
    let value: Any
    let bytes: Data
}

private struct NSESignatureAuthor {
    let type: String
    let name: String
    let generation: Int
}

private struct NSEMessageSignature {
    let signature: String
    let author: NSESignatureAuthor
}

// MARK: - Protocol

protocol DeviceCryptography: NSEAuthSigning {
    /// Decrypts a QSS log entry and, if it is a channel message, returns a displayable preview.
    func decryptNotificationMessage(from logEntry: LogEntry, teamId: String) throws -> NSEDecryptedNotificationMessage?
}

extension DeviceCryptography {
    func signNseAuthProof(_ challenge: ChallengePayload, privateKeyData: Data) throws -> String {
        try NSEAuthProof.sign(challenge, privateKeyData: privateKeyData)
    }
}

// MARK: - Errors

enum NSECryptoError: Error, LocalizedError {
    case invalidKeyLength(expected: Int, got: Int)
    case invalidBase58
    case invalidPayload(String)
    case msgpack(String)
    case decryptionFailed(String)
    case missingKey(String)

    var errorDescription: String? {
        switch self {
        case .invalidKeyLength(let e, let g): return "Invalid key length: expected \(e), got \(g)"
        case .invalidBase58: return "Invalid base58 encoding"
        case .invalidPayload(let msg): return "Invalid payload: \(msg)"
        case .msgpack(let msg): return "MessagePack decoding failed: \(msg)"
        case .decryptionFailed(let msg): return "Decryption failed: \(msg)"
        case .missingKey(let keyName): return "Missing LFA key: \(keyName)"
        }
    }
}

extension NSECryptoError: NSERetryableNotificationError {
    var isRetryableForNotification: Bool {
        if case .missingKey = self { return true }
        return false
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

    func decryptNotificationMessage(from logEntry: LogEntry, teamId: String) throws -> NSEDecryptedNotificationMessage? {
        guard logEntry.communityId == teamId else {
            throw NSECryptoError.invalidPayload("QSS entry community did not match requested team")
        }

        let outerEnvelope = try self.decodeObject(logEntry.entry)
        guard let outerDict = outerEnvelope as? NSEJSONObject else {
            throw NSECryptoError.invalidPayload("outer envelope was not an object")
        }
        let outerEncrypted = try self.parseEncryptedPayload(outerDict["encrypted"], label: "outer QSS payload")

        let decryptedOrbitEntry = try self.decryptPayload(outerEncrypted, teamId: teamId)
        guard
            let orbitEntryDict = decryptedOrbitEntry.value as? NSEJSONObject
        else {
            throw NSECryptoError.invalidPayload("decrypted OrbitDB entry was not an object")
        }

        guard
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

        let signature = try self.parseSignature(payloadValue["encSignature"])
        let innerEncrypted = try self.parseEncryptedPayload(payloadValue["contents"], label: "inner channel message")
        let decryptedInner = try self.decryptPayload(innerEncrypted, teamId: teamId)
        guard let message = decryptedInner.value as? NSEJSONObject else {
            return nil
        }

        guard
            let id = self.stringValue(message["id"]),
            let channelId = self.stringValue(message["channelId"]),
            let userId = self.stringValue(message["userId"]),
            let messageTeamId = self.stringValue(message["teamId"]),
            let createdAt = self.numberValue(message["createdAt"]),
            let type = self.intValue(message["type"]),
            let body = self.notificationBody(from: message, type: type)
        else {
            return nil
        }

        guard
            !id.isEmpty,
            !channelId.isEmpty,
            !userId.isEmpty,
            !messageTeamId.isEmpty,
            type > 0
        else {
            throw NSECryptoError.invalidPayload("decrypted message shape was invalid")
        }

        try self.authenticateMessage(
            plaintext: decryptedInner.bytes,
            signature: signature,
            teamId: teamId,
            messageId: id,
            messageTeamId: messageTeamId,
            messageChannelId: channelId,
            messageUserId: userId,
            messageCreatedAt: createdAt,
            payloadValue: payloadValue
        )

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

    private func decryptPayload(_ encryptedPayload: NSEEncryptedPayload, teamId: String) throws -> NSEDecryptedPayload {
        let keyName = self.makeKeyName(teamId: teamId, scope: encryptedPayload.scope)
        let secretKey = try self.lfaKeyString(keyName: keyName)
        return try self.decryptSymmetric(cipherBytes: encryptedPayload.contents, password: secretKey)
    }

    private func decryptSymmetric(cipherBytes: Data, password: String) throws -> NSEDecryptedPayload {
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

        let plaintext = Data(decryptedBytes)
        return NSEDecryptedPayload(value: try self.decodeObject(plaintext), bytes: plaintext)
    }

    private func authenticateMessage(
        plaintext: Data,
        signature: NSEMessageSignature,
        teamId: String,
        messageId: String,
        messageTeamId: String,
        messageChannelId: String,
        messageUserId: String,
        messageCreatedAt: Double,
        payloadValue: NSEJSONObject
    ) throws {
        let signatureData = Base58.decode(signature.signature).map { Data($0) }
        let publicKey = try NSEMessageAuthenticator.publicKeyAfterValidatingClaims(
            signature: signatureData,
            authorType: signature.author.type,
            authorName: signature.author.name,
            messageUserId: messageUserId,
            messageId: messageId,
            envelopeId: self.stringValue(payloadValue["id"]),
            messageTeamId: messageTeamId,
            envelopeTeamId: self.stringValue(payloadValue["teamId"]),
            requestedTeamId: teamId,
            messageChannelId: messageChannelId,
            envelopeChannelId: self.stringValue(payloadValue["channelId"]),
            messageCreatedAt: messageCreatedAt,
            envelopeCreatedAt: self.numberValue(payloadValue["createdAt"]),
            lookup: {
                let keyName = self.makeUserSignatureKeyName(teamId: teamId, author: signature.author)
                let publicKeyString = try self.lfaKeyString(keyName: keyName)
                return Base58.decode(publicKeyString).map { Data($0) }
            }
        )
        try NSEMessageAuthenticator.authenticate(
            plaintext: plaintext,
            signature: signatureData,
            publicKey: publicKey,
            authorType: signature.author.type,
            authorName: signature.author.name,
            messageUserId: messageUserId,
            messageId: messageId,
            envelopeId: self.stringValue(payloadValue["id"]),
            messageTeamId: messageTeamId,
            envelopeTeamId: self.stringValue(payloadValue["teamId"]),
            requestedTeamId: teamId,
            messageChannelId: messageChannelId,
            envelopeChannelId: self.stringValue(payloadValue["channelId"]),
            messageCreatedAt: messageCreatedAt,
            envelopeCreatedAt: self.numberValue(payloadValue["createdAt"])
        )
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

        guard let scope = NSEMessageAuthenticator.exactEncryptionScope(dict["scope"]) else {
            throw NSECryptoError.invalidPayload("\(label) scope was malformed")
        }

        return NSEEncryptedPayload(
            contents: contents,
            scope: NSEEncryptionScope(type: scope.type, name: scope.name, generation: scope.generation)
        )
    }

    private func parseSignature(_ value: Any?) throws -> NSEMessageSignature {
        guard
            let dict = value as? NSEJSONObject,
            let signature = self.stringValue(dict["signature"]),
            let author = dict["author"] as? NSEJSONObject,
            let authorType = self.stringValue(author["type"]),
            let authorName = self.stringValue(author["name"]),
            let generation = NSEMessageAuthenticator.exactNonNegativeInt(author["generation"])
        else {
            throw NSECryptoError.invalidPayload("message signature was malformed")
        }

        return NSEMessageSignature(
            signature: signature,
            author: NSESignatureAuthor(type: authorType, name: authorName, generation: generation)
        )
    }

    private func makeKeyName(teamId: String, scope: NSEEncryptionScope) -> String {
        return "quiet_\(teamId)_\(scope.type)_\(scope.name)_\(scope.generation)_secret"
    }

    private func makeUserSignatureKeyName(teamId: String, author: NSESignatureAuthor) -> String {
        return "quiet_\(teamId)_\(author.type)_\(author.name)_\(author.generation)_userSig"
    }

    private func lfaKeyString(keyName: String) throws -> String {
        do {
            return try KeychainService.getLfaKeyString(keyName: keyName)
        } catch {
            throw NSECryptoError.missingKey(keyName)
        }
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

    private func numberValue(_ value: Any?) -> Double? {
        if value is Bool {
            return nil
        }

        let result: Double?
        switch value {
        case let number as NSNumber:
            result = number.doubleValue
        case let int as Int:
            result = Double(int)
        case let int64 as Int64:
            result = Double(int64)
        case let uint64 as UInt64:
            result = Double(uint64)
        case let float as Float:
            result = Double(float)
        case let double as Double:
            result = double
        case let string as String:
            result = Double(string)
        default:
            result = nil
        }
        guard let result, result.isFinite else { return nil }
        return result
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

    /// Encodes msgpackr.pack([NSE_AUTH_SIGNATURE_CONTEXT, canonicalPayload]).
    static func encodeNseAuthProof(_ challenge: ChallengePayload) throws -> Data {
        try NSEAuthProof.encode(challenge)
    }

    static func decode(_ data: Data) throws -> Any {
        try Decoder(data: data).decode()
    }

    /// Produces the exact bytes signed by @localfirst/auth:
    /// msgpackr.pack([context, payload]). `plaintext` is already the exact
    /// msgpackr encoding of payload recovered from authenticated encryption.
    static func withSignatureContext(_ context: String, plaintext: Data) throws -> Data {
        guard !context.isEmpty else { throw MsgpackError.invalidString }
        var out = Data([0x92]) // fixarray(2)
        try appendString(context, to: &out)
        out.append(plaintext)
        return out
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

        private func readRecordDefinition(recordId: UInt8) throws -> Any {
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

        private func readExtension(length: Int) throws -> Any {
            let type = try self.readByte()
            let payload = try self.readData(length: length)
            if type == 0x72, length == 1 {
                guard let recordId = payload.first else {
                    throw MsgpackError.invalidRecordDefinition
                }
                return try self.readRecordDefinition(recordId: recordId)
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
                return try self.readRecordDefinition(recordId: recordId)
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
