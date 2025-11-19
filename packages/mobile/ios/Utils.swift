@objc(Utils)

class Utils: NSObject {

    @objc
    func generateSecret(length: Int) -> String {
        var bytes: [UInt8] = [UInt8](repeating: 0, count: length)

        let result = SecRandomCopyBytes(kSecRandomDefault, length, &bytes)
        if result == errSecSuccess {
            let data: Data = Data.init(bytes: bytes)
            return data.map { String(format: "%02hhx", $0) }.joined()
        } else {
            fatalError("Unable to generate random byte.")
        }
    }
}
