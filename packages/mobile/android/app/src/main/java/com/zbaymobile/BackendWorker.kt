package com.zbaymobile

import android.annotation.SuppressLint
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.zbaymobile.Utils.Const
import com.zbaymobile.Utils.Utils
import java.net.ConnectException
import java.net.InetSocketAddress
import java.net.Socket
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ThreadLocalRandom

class BackendWorker(context: Context, workerParams: WorkerParameters):
        Worker(context, workerParams) {

    @SuppressLint("SimpleDateFormat")
    override fun doWork(): Result {

        val sdf = SimpleDateFormat("dd/M/yyyy hh:mm:ss")
        val date = sdf.format(Date())
        println("QUIET_BACKEND |  $date")

        val sharedPref = applicationContext.getSharedPreferences(
                applicationContext.getString(R.string.config_preferences), Context.MODE_PRIVATE)

        val dataPort = sharedPref.getInt(applicationContext.getString(R.string.data_port), -1)

        if (dataPort != -1) {
            val open = isPortOpen("127.0.0.1", dataPort, 500)
            println("QUIET_BACKEND | is data port open : $open")
            Utils.writeToFile("worker_logs.txt", "$date is data port open : $open", applicationContext)
        } else {
            println("QUIET_BACKEND | Data port not found within shared preferences")
        }

        // Indicate whether the work finished successfully with the Result
        return Result.success()
    }

    private fun notifyProcessOff(date: String) {
        var builder = NotificationCompat.Builder(applicationContext, Const.INCOMING_MESSAGES_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("Backend thread stopped at $date")
                .setContentText("You'll no longer be able to receive incoming messages notifications")
                .setPriority(NotificationCompat.PRIORITY_HIGH)

        val notificationId = ThreadLocalRandom.current().nextInt(0, 9000 + 1)

        with(NotificationManagerCompat.from(applicationContext)) {
            // notificationId is a unique int for each notification that you must define
            notify(notificationId, builder.build())
        }
    }

    private fun isPortOpen(ip: String?, port: Int, timeout: Int): Boolean {
        return try {
            val socket = Socket()
            socket.connect(InetSocketAddress(ip, port), timeout)
            socket.close()
            true
        } catch (ce: ConnectException) {
            false
        } catch (ex: java.lang.Exception) {
            false
        }
    }
}
