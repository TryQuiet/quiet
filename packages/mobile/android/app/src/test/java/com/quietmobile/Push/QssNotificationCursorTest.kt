package com.quietmobile.Push

import org.junit.Assert.assertEquals
import org.junit.Test

class QssNotificationCursorTest {
    private fun entry(syncSeq: Long): LogEntry =
        LogEntry(
            cid = "cid-$syncSeq",
            hashedDbId = "db",
            communityId = "team",
            entry = byteArrayOf(),
            receivedAt = "2026-09-01T00:00:00Z",
            syncSeq = syncSeq,
        )

    @Test
    fun rejectedEntryIsConsumedAndDoesNotBlockLaterValidNotification() {
        val presented = mutableListOf<Long>()

        val cursor =
            processContiguousQssEntries(
                afterSeq = 0,
                entries = listOf(entry(1), entry(2)),
                authenticate = { current ->
                    if (current.syncSeq == 1L) error("invalid signature")
                    "authenticated"
                },
                present = { current, _ -> presented += current.syncSeq },
            )

        assertEquals(2L, cursor)
        assertEquals(listOf(2L), presented)
    }

    @Test
    fun presentationFailurePreservesCursorAndLeavesLaterEntriesForRetry() {
        val attempted = mutableListOf<Long>()

        val cursor =
            processContiguousQssEntries(
                afterSeq = 0,
                entries = listOf(entry(1), entry(2)),
                authenticate = { "authenticated" },
                present = { current, _ ->
                    attempted += current.syncSeq
                    error("notification center unavailable")
                },
            )

        assertEquals(0L, cursor)
        assertEquals(listOf(1L), attempted)
    }

    @Test
    fun missingKeyPreservesCursorAndLeavesEntryForRetry() {
        val cursor =
            processContiguousQssEntries(
                afterSeq = 0,
                entries = listOf(entry(1), entry(2)),
                authenticate = { throw MissingQssNotificationKeyException("user-key") },
                present = { _, _: String -> error("must not present") },
                isPermanentRejection = { it !is MissingQssNotificationKeyException },
            )

        assertEquals(0L, cursor)
    }

    @Test
    fun sequenceGapStopsBeforeAdvancingPastMissingEntry() {
        val cursor =
            processContiguousQssEntries(
                afterSeq = 4,
                entries = listOf(entry(5), entry(7)),
                authenticate = { "authenticated" },
                present = { _, _ -> },
            )

        assertEquals(5L, cursor)
    }
}
