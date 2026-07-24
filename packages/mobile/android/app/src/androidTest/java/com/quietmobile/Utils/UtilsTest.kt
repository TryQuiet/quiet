package com.quietmobile.Utils

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class UtilsTest {
    @Test
    fun createDirectoryUsesVersionNineStorage() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val expectedDirectory = File(context.filesDir, "backend/files9")

        val path = Utils.createDirectory(context)

        assertEquals(expectedDirectory.absolutePath, path)
        assertTrue(expectedDirectory.isDirectory)
    }
}
