package com.quietmobile.Push

import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.charset.StandardCharsets

object MsgpackDecoder {
    fun decode(data: ByteArray): Any? = Decoder(data).decode()

    private class Decoder(private val bytes: ByteArray) {
        private var index = 0
        private val records = mutableMapOf<Int, List<String>>()

        fun decode(): Any? {
            val value = readValue()
            if (index != bytes.size) {
                throw IllegalStateException("Unexpected trailing bytes in msgpack payload")
            }
            return value
        }

        private fun readValue(): Any? {
            val token = readByte().toInt() and 0xff
            return when (token) {
                in 0x00..0x3f -> token
                in 0x40..0x7f -> {
                    val record = records[token]
                    if (record != null) readRecord(record) else token
                }
                in 0x80..0x8f -> readMap(token and 0x0f)
                in 0x90..0x9f -> readArray(token and 0x0f)
                in 0xa0..0xbf -> readString(token and 0x1f)
                0xc0 -> null
                0xc2 -> false
                0xc3 -> true
                0xc4 -> readBinary(readByte().toInt() and 0xff)
                0xc5 -> readBinary(readUInt16().toInt())
                0xc6 -> readBinary(readUInt32().toInt())
                0xc7 -> readExtension(readByte().toInt() and 0xff)
                0xc8 -> readExtension(readUInt16().toInt())
                0xc9 -> readExtension(readUInt32().toInt())
                0xca -> readFloat32()
                0xcb -> readFloat64()
                0xcc -> readByte().toInt() and 0xff
                0xcd -> readUInt16().toInt()
                0xce -> readUInt32().toInt()
                0xcf -> {
                    val value = readUInt64()
                    if (value <= Long.MAX_VALUE.toULong()) value.toLong() else value.toDouble()
                }
                0xd0 -> readInt8().toInt()
                0xd1 -> readInt16().toInt()
                0xd2 -> readInt32().toInt()
                0xd3 -> readInt64()
                0xd4 -> readFixext(1)
                0xd5 -> readFixext(2)
                0xd6 -> readFixext(4)
                0xd7 -> readFixext(8)
                0xd8 -> readFixext(16)
                0xd9 -> readString(readByte().toInt() and 0xff)
                0xda -> readString(readUInt16().toInt())
                0xdb -> readString(readUInt32().toInt())
                0xdc -> readArray(readUInt16().toInt())
                0xdd -> readArray(readUInt32().toInt())
                0xde -> readMap(readUInt16().toInt())
                0xdf -> readMap(readUInt32().toInt())
                in 0xe0..0xff -> token.toByte().toInt()
                else -> throw IllegalStateException("Unsupported msgpack type 0x${token.toString(16)}")
            }
        }

        private fun readRecord(keys: List<String>): Map<String, Any?> {
            val record = linkedMapOf<String, Any?>()
            for (key in keys) {
                record[key] = readValue()
            }
            return record
        }

        private fun readMap(count: Int): Map<String, Any?> {
            val map = linkedMapOf<String, Any?>()
            repeat(count) {
                val key = readValue() as? String
                    ?: throw IllegalStateException("Msgpack map key was not a string")
                map[key] = readValue()
            }
            return map
        }

        private fun readArray(count: Int): List<Any?> {
            return MutableList(count) { readValue() }
        }

        private fun readString(length: Int): String {
            return readData(length).toString(StandardCharsets.UTF_8)
        }

        private fun readBinary(length: Int): ByteArray = readData(length)

        private fun readRecordDefinition(recordId: Int): Any? {
            val keysValue = readValue() as? List<*>
                ?: throw IllegalStateException("Invalid msgpackr record definition")
            val keys = keysValue.map {
                it as? String ?: throw IllegalStateException("Invalid msgpackr record key")
            }
            records[recordId] = keys
            return readRecord(keys)
        }

        private fun readExtension(length: Int): Any? {
            val type = readByte().toInt() and 0xff
            val payload = readData(length)
            if (type == 0x72 && length == 1) {
                return readRecordDefinition(payload[0].toInt() and 0xff)
            }
            return payload
        }

        private fun readFixext(length: Int): Any? {
            val type = readByte().toInt() and 0xff
            val payload = readData(length)
            if (type == 0x72 && length == 1) {
                return readRecordDefinition(payload[0].toInt() and 0xff)
            }
            if (type == 0x00 && length == 1 && payload[0].toInt() == 0x00) {
                return null
            }
            return payload
        }

        private fun readData(length: Int): ByteArray {
            if (index + length > bytes.size) {
                throw IllegalStateException("Truncated msgpack payload")
            }
            val data = bytes.copyOfRange(index, index + length)
            index += length
            return data
        }

        private fun readByte(): Byte {
            if (index >= bytes.size) {
                throw IllegalStateException("Truncated msgpack payload")
            }
            return bytes[index++]
        }

        private fun readUInt16(): Int {
            return ((readByte().toInt() and 0xff) shl 8) or (readByte().toInt() and 0xff)
        }

        private fun readUInt32(): Long {
            return ((readByte().toLong() and 0xff) shl 24) or
                ((readByte().toLong() and 0xff) shl 16) or
                ((readByte().toLong() and 0xff) shl 8) or
                (readByte().toLong() and 0xff)
        }

        private fun readUInt64(): ULong {
            return ((readByte().toULong() and 0xffuL) shl 56) or
                ((readByte().toULong() and 0xffuL) shl 48) or
                ((readByte().toULong() and 0xffuL) shl 40) or
                ((readByte().toULong() and 0xffuL) shl 32) or
                ((readByte().toULong() and 0xffuL) shl 24) or
                ((readByte().toULong() and 0xffuL) shl 16) or
                ((readByte().toULong() and 0xffuL) shl 8) or
                (readByte().toULong() and 0xffuL)
        }

        private fun readInt8(): Byte = readByte()

        private fun readInt16(): Short = readUInt16().toShort()

        private fun readInt32(): Int = readUInt32().toInt()

        private fun readInt64(): Long = readUInt64().toLong()

        private fun readFloat32(): Float {
            return ByteBuffer.wrap(readData(4)).order(ByteOrder.BIG_ENDIAN).float
        }

        private fun readFloat64(): Double {
            return ByteBuffer.wrap(readData(8)).order(ByteOrder.BIG_ENDIAN).double
        }
    }
}

object MsgpackEncoder {
    fun encodeChallenge(challenge: ChallengePayload): ByteArray {
        val out = ByteArrayOutputStream()
        out.write(0xde)
        out.write(0x00)
        out.write(0x04)
        appendString("type", out)
        appendString(challenge.type, out)
        appendString("name", out)
        appendString(challenge.name, out)
        appendString("nonce", out)
        appendString(challenge.nonce, out)
        appendString("timestamp", out)
        appendFloat64(challenge.timestamp.toDouble(), out)
        return out.toByteArray()
    }

    private fun appendString(value: String, out: ByteArrayOutputStream) {
        val bytes = value.toByteArray(StandardCharsets.UTF_8)
        when {
            bytes.size < 32 -> out.write(0xa0 or bytes.size)
            bytes.size <= 0xff -> {
                out.write(0xd9)
                out.write(bytes.size)
            }
            bytes.size <= 0xffff -> {
                out.write(0xda)
                out.write((bytes.size shr 8) and 0xff)
                out.write(bytes.size and 0xff)
            }
            else -> throw IllegalArgumentException("String too long for msgpack encoder")
        }
        out.write(bytes, 0, bytes.size)
    }

    private fun appendFloat64(value: Double, out: ByteArrayOutputStream) {
        out.write(0xcb)
        out.write(
            ByteBuffer.allocate(8)
                .order(ByteOrder.BIG_ENDIAN)
                .putDouble(value)
                .array()
        )
    }
}
