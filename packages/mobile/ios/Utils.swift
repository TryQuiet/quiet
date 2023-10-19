@objc(Utils)
class Utils: NSObject {

    @objc
    func generateRandomString(length: Int) -> String {
    let letters = "0123456789"
    var randomString = String()

    for _ in 0..<length {
        let rand = Int(arc4random_uniform(UInt32(letters.count)))
        let character = letters[letters.index(letters.startIndex, offsetBy: rand)]
        randomString.append(character)
    }

    return randomString
}
}