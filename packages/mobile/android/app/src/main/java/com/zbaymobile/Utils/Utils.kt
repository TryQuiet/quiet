package com.zbaymobile.Utils

import android.util.Log
import com.zbaymobile.Utils.Const.TAG_NOTICE
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.File

object Utils {

    fun exec(dir: File?, command: Array<String?>, env: Map<String, String>?): Process {
        val pb = ProcessBuilder(*command)
        val _env: MutableMap<String, String> = pb.environment()
        env?.map {
            _env[it.key] = it.value
        }
        return pb
            .directory(dir)
            .start()
    }

    fun getOutput(process: Process): Int {
        val stdOut = BufferedReader(InputStreamReader(process.inputStream))
        val stdError = BufferedReader(InputStreamReader(process.errorStream))

        object: Thread() {
            override fun run() {
                var output = ""
                while(stdOut.readLine()?.also { output = it } != null) {
                    Log.d(TAG_NOTICE, output)
                }
            }
        }.start()

        object: Thread() {
            override fun run() {
                var error = ""
                while(stdError.readLine()?.also { error = it } != null) {
                    Log.d(TAG_NOTICE, error)
                }
            }
        }.start()

        process.waitFor()

        if (process.exitValue() != 0) {
            throw Exception("Error: " + process.exitValue().toString())
        }

        return process.exitValue()
    }
}
