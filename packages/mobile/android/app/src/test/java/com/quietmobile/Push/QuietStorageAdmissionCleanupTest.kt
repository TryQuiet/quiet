package com.quietmobile.Push

import org.junit.Assert.assertEquals
import org.junit.Test

class QuietStorageAdmissionCleanupTest {
    @Test
    fun `admission cleanup removes community state and preserves app and Tor settings`() {
        val keys = setOf(
            "quiet.nse.qssConfigurations",
            "quiet.nse.lastSyncSeq.team-a",
            "quiet.nse.missingKeyRetrySeq.team-a",
            "quiet.channelMetadata.team-a.general",
            "quiet.user.metadata",
            "quiet.app.isForeground",
            "quiet.qss.team.enabled",
            "quiet.qss.backgroundTor.enabled",
            "unrelated.preference",
        )

        assertEquals(
            setOf(
                "quiet.nse.qssUrls",
                "quiet.nse.qssConfigurations",
                "quiet.nse.lastSyncSeq",
                "quiet.nse.lastSyncTeamId",
                "quiet.nse.lastSyncSeq.team-a",
                "quiet.nse.missingKeyRetrySeq.team-a",
                "quiet.notification.displayedHashes",
                "quiet.channelMetadata.team-a.general",
                "quiet.user.metadata",
                "quiet.qss.team.enabled",
            ),
            QuietStorage.admissionPreferenceKeys(keys),
        )
    }
}
