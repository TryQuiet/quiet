import Foundation

extension Data {
    func hexEncodedString() -> String {
      let hexDigits = "0123456789abcdef"
      let utf8Digits = Array(hexDigits.utf8)
      return String(unsafeUninitializedCapacity: 2 * self.count) { (ptr) -> Int in
        var p = ptr.baseAddress!
        for byte in self {
            p[0] = utf8Digits[Int(byte / 16)]
            p[1] = utf8Digits[Int(byte % 16)]
            p += 2
        }
        return 2 * self.count
      }
    }
}
