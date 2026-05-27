package com.quietmobile.Push

import java.io.ByteArrayOutputStream
import java.math.BigInteger
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.charset.StandardCharsets
import org.msgpack.core.MessageFormat
import org.msgpack.core.MessagePack
import org.msgpack.core.MessageUnpacker

object MsgpackUndefined

object MsgpackDecoder {
    fun decode(data: ByteArray): Any? {
        return MessagePack.newDefaultUnpacker(data).use { unpacker ->
            Decoder(unpacker).decode()
        }
    }

    private class Decoder(private val unpacker: MessageUnpacker) {
        private val records = mutableMapOf<Int, List<String>>()

        fun decode(): Any? {
            val value = readValue()
            if (unpacker.hasNext()) {
                throw IllegalStateException("Unexpected trailing bytes in msgpack payload")
            }
            return value
        }

        private fun readValue(): Any? {
            return when (unpacker.getNextFormat()) {
                MessageFormat.POSFIXINT -> readPositiveIntOrRecord()
                MessageFormat.NEGFIXINT,
                MessageFormat.INT8,
                MessageFormat.INT16,
                MessageFormat.INT32 -> unpacker.unpackInt()
                MessageFormat.INT64 -> unpacker.unpackLong()
                MessageFormat.UINT8,
                MessageFormat.UINT16 -> unpacker.unpackInt()
                MessageFormat.UINT32 -> unpacker.unpackLong()
                MessageFormat.UINT64 -> readUInt64()
                MessageFormat.FIXMAP,
                MessageFormat.MAP16,
                MessageFormat.MAP32 -> readMap(unpacker.unpackMapHeader())
                MessageFormat.FIXARRAY,
                MessageFormat.ARRAY16,
                MessageFormat.ARRAY32 -> readArray(unpacker.unpackArrayHeader())
                MessageFormat.FIXSTR,
                MessageFormat.STR8,
                MessageFormat.STR16,
                MessageFormat.STR32 -> unpacker.unpackString()
                MessageFormat.BIN8,
                MessageFormat.BIN16,
                MessageFormat.BIN32 -> unpacker.readPayload(unpacker.unpackBinaryHeader())
                MessageFormat.NIL -> {
                    unpacker.unpackNil()
                    null
                }
                MessageFormat.BOOLEAN -> unpacker.unpackBoolean()
                MessageFormat.FLOAT32 -> unpacker.unpackFloat()
                MessageFormat.FLOAT64 -> unpacker.unpackDouble()
                MessageFormat.FIXEXT1,
                MessageFormat.FIXEXT2,
                MessageFormat.FIXEXT4,
                MessageFormat.FIXEXT8,
                MessageFormat.FIXEXT16,
                MessageFormat.EXT8,
                MessageFormat.EXT16,
                MessageFormat.EXT32 -> readExtension()
                MessageFormat.NEVER_USED -> throw IllegalStateException("Unsupported msgpack never-used token")
            }
        }

        private fun readPositiveIntOrRecord(): Any {
            val value = unpacker.unpackInt()
            val record = records[value]
            return if (record != null) readRecord(record) else value
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

        private fun readRecordDefinition(recordId: Int): Any {
            val keysValue = readValue() as? List<*>
                ?: throw IllegalStateException("Invalid msgpackr record definition")
            val keys = keysValue.map {
                it as? String ?: throw IllegalStateException("Invalid msgpackr record key")
            }
            records[recordId] = keys
            return readRecord(keys)
        }

        private fun readExtension(): Any? {
            val header = unpacker.unpackExtensionTypeHeader()
            val payload = unpacker.readPayload(header.length)
            val type = header.type.toInt() and 0xff
            if (type == MSGPACKR_RECORD_EXTENSION && header.length == 1) {
                return readRecordDefinition(payload[0].toInt() and 0xff)
            }
            if (type == MSGPACKR_UNDEFINED_EXTENSION && header.length == 1 && payload[0].toInt() == 0x00) {
                return MsgpackUndefined
            }
            return payload
        }

        private fun readUInt64(): Number {
            val value = unpacker.unpackBigInteger()
            return if (value <= BIGGEST_LONG) value.toLong() else value.toDouble()
        }

        companion object {
            private const val MSGPACKR_RECORD_EXTENSION = 0x72
            private const val MSGPACKR_UNDEFINED_EXTENSION = 0x00
            private val BIGGEST_LONG = BigInteger.valueOf(Long.MAX_VALUE)
        }
    }
}

object MsgpackEncoder {
    fun encode(value: Any?): ByteArray {
        val out = ByteArrayOutputStream()
        appendValue(value, out)
        return out.toByteArray()
    }

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

    private fun appendValue(value: Any?, out: ByteArrayOutputStream) {
        when (value) {
            null -> out.write(0xc0)
            MsgpackUndefined -> appendUndefined(out)
            is Boolean -> out.write(if (value) 0xc3 else 0xc2)
            is String -> appendString(value, out)
            is ByteArray -> appendBinary(value, out)
            is Map<*, *> -> appendMap(value, out)
            is List<*> -> appendArray(value, out)
            is Float -> appendFloat64(value.toDouble(), out)
            is Double -> appendFloat64(value, out)
            is Byte -> appendLong(value.toLong(), out)
            is Short -> appendLong(value.toLong(), out)
            is Int -> appendLong(value.toLong(), out)
            is Long -> appendLong(value, out)
            else -> throw IllegalArgumentException("Unsupported msgpack value type: ${value::class.java.name}")
        }
    }

    private fun appendMap(value: Map<*, *>, out: ByteArrayOutputStream) {
        if (value.size > 0xffff) {
            throw IllegalArgumentException("Map too large for msgpack encoder")
        }
        out.write(0xde)
        appendUInt16(value.size, out)
        for ((key, item) in value) {
            appendString(key as? String ?: throw IllegalArgumentException("Msgpack map key was not a string"), out)
            appendValue(item, out)
        }
    }

    private fun appendArray(value: List<*>, out: ByteArrayOutputStream) {
        when {
            value.size < 16 -> out.write(0x90 or value.size)
            value.size <= 0xffff -> {
                out.write(0xdc)
                appendUInt16(value.size, out)
            }
            else -> {
                out.write(0xdd)
                appendUInt32(value.size.toLong(), out)
            }
        }
        for (item in value) {
            appendValue(item, out)
        }
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

    private fun appendBinary(value: ByteArray, out: ByteArrayOutputStream) {
        when {
            value.size <= 0xff -> {
                out.write(0xc4)
                out.write(value.size)
            }
            value.size <= 0xffff -> {
                out.write(0xc5)
                appendUInt16(value.size, out)
            }
            else -> {
                out.write(0xc6)
                appendUInt32(value.size.toLong(), out)
            }
        }
        out.write(value, 0, value.size)
    }

    private fun appendLong(value: Long, out: ByteArrayOutputStream) {
        when {
            value in 0..0x7f -> out.write(value.toInt())
            value in 0..0xff -> {
                out.write(0xcc)
                out.write(value.toInt())
            }
            value in 0..0xffff -> {
                out.write(0xcd)
                appendUInt16(value.toInt(), out)
            }
            value in 0..0xffffffffL -> {
                out.write(0xce)
                appendUInt32(value, out)
            }
            value >= 0 -> {
                out.write(0xcf)
                appendUInt64(value, out)
            }
            value >= -32 -> out.write(value.toInt() and 0xff)
            value >= Byte.MIN_VALUE -> {
                out.write(0xd0)
                out.write(value.toInt() and 0xff)
            }
            value >= Short.MIN_VALUE -> {
                out.write(0xd1)
                appendUInt16(value.toInt() and 0xffff, out)
            }
            value >= Int.MIN_VALUE -> {
                out.write(0xd2)
                appendUInt32(value.toInt().toLong() and 0xffffffffL, out)
            }
            else -> {
                out.write(0xd3)
                appendUInt64(value, out)
            }
        }
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

    private fun appendUndefined(out: ByteArrayOutputStream) {
        out.write(0xd4)
        out.write(0x00)
        out.write(0x00)
    }

    private fun appendUInt16(value: Int, out: ByteArrayOutputStream) {
        out.write((value shr 8) and 0xff)
        out.write(value and 0xff)
    }

    private fun appendUInt32(value: Long, out: ByteArrayOutputStream) {
        out.write(((value ushr 24) and 0xff).toInt())
        out.write(((value ushr 16) and 0xff).toInt())
        out.write(((value ushr 8) and 0xff).toInt())
        out.write((value and 0xff).toInt())
    }

    private fun appendUInt64(value: Long, out: ByteArrayOutputStream) {
        out.write(((value ushr 56) and 0xff).toInt())
        out.write(((value ushr 48) and 0xff).toInt())
        out.write(((value ushr 40) and 0xff).toInt())
        out.write(((value ushr 32) and 0xff).toInt())
        out.write(((value ushr 24) and 0xff).toInt())
        out.write(((value ushr 16) and 0xff).toInt())
        out.write(((value ushr 8) and 0xff).toInt())
        out.write((value and 0xff).toInt())
    }
}
