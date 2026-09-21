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
                isPermanentRejection = { _, error -> error !is MissingQssNotificationKeyException },
            )

        assertEquals(0L, cursor)
    }

    @Test
    fun missingKeyIsConsumedAfterBoundedWakeupsAndDoesNotBlockLaterValidEntry() {
        var cursor = 0L
        var retryState: MissingNotificationKeyRetryState? = null
        val presented = mutableListOf<Long>()

        repeat(MAX_MISSING_NOTIFICATION_KEY_FAILURES + 1) {
            cursor =
                processContiguousQssEntries(
                    afterSeq = cursor,
                    entries = listOf(entry(1), entry(2)),
                    authenticate = { current ->
                        if (current.syncSeq == 1L) throw MissingQssNotificationKeyException("absent-generation")
                        "authenticated"
                    },
                    present = { current, _ -> presented += current.syncSeq },
                    isPermanentRejection = { _, error ->
                        if (error !is MissingQssNotificationKeyException) {
                            true
                        } else {
                            retryState = nextMissingNotificationKeyRetryState(retryState, 1)
                            !shouldRetryMissingNotificationKey(requireNotNull(retryState).failureCount)
                        }
                    },
                )
        }

        assertEquals(2L, cursor)
        assertEquals(listOf(2L), presented)
        assertEquals(MAX_MISSING_NOTIFICATION_KEY_FAILURES + 1, retryState?.failureCount)
    }

    @Test
    fun missingKeyRetryStateResetsForDifferentBlockingSequence() {
        var state: MissingNotificationKeyRetryState? = null
        repeat(MAX_MISSING_NOTIFICATION_KEY_FAILURES) {
            state = nextMissingNotificationKeyRetryState(state, 7)
        }

        val nextEntryState = nextMissingNotificationKeyRetryState(state, 8)

        assertEquals(MissingNotificationKeyRetryState(8, 1), nextEntryState)
        assertEquals(true, shouldRetryMissingNotificationKey(nextEntryState.failureCount))
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
