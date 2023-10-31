@objc(Utils)
class Utils: NSObject {

    @objc
    func generateSecret(length: Int) -> String {
    let characters = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
    var randomString = ""

    for _ in 0..<length {
        var random: UInt8 = 0
        let result = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
        
        if result == errSecSuccess {
            let index = Int(random) % characters.count
            randomString.append(characters[index])
        } else {
            fatalError("Unable to generate random byte.")
        }
    }

    return randomString
}
}