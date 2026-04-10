package com.quietmobile.Push

object Base58 {
    private const val ALPHABET =
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    private val alphabetChars = ALPHABET.toCharArray()
    private val alphabetIndex = ALPHABET.withIndex().associate { it.value to it.index }

    fun encode(data: ByteArray): String {
        var leadingZeros = 0
        while (leadingZeros < data.size && data[leadingZeros].toInt() == 0) {
            leadingZeros++
        }

        val result = mutableListOf<Int>()
        for (byte in data) {
            var carry = byte.toInt() and 0xff
            for (index in result.indices) {
                carry += 256 * result[index]
                result[index] = carry % 58
                carry /= 58
            }
            while (carry > 0) {
                result.add(carry % 58)
                carry /= 58
            }
        }

        val encoded = result.asReversed().map { alphabetChars[it] }.joinToString("")
        return "1".repeat(leadingZeros) + encoded
    }

    fun decode(value: String): ByteArray? {
        var leadingZeros = 0
        while (leadingZeros < value.length && value[leadingZeros] == '1') {
            leadingZeros++
        }

        val result = mutableListOf<Int>()
        for (char in value) {
            val digit = alphabetIndex[char] ?: return null
            var carry = digit
            for (index in result.indices) {
                carry += 58 * result[index]
                result[index] = carry and 0xff
                carry = carry shr 8
            }
            while (carry > 0) {
                result.add(carry and 0xff)
                carry = carry shr 8
            }
        }

        val output = ByteArray(leadingZeros + result.size)
        for (index in 0 until leadingZeros) {
            output[index] = 0
        }
        result.asReversed().forEachIndexed { index, byte ->
            output[leadingZeros + index] = byte.toByte()
        }
        return output
    }
}
