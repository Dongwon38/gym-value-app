package com.gymvaluemobile.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class GymAssistedNotificationsModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "GymAssistedNotifications"

  init {
    createChannel()
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val channel =
      NotificationChannel(
        CHANNEL_ID,
        "Assisted check-in",
        NotificationManager.IMPORTANCE_DEFAULT,
      ).apply {
        description = "Suggestions when you arrive or leave your gym"
      }
    val nm =
      reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.createNotificationChannel(channel)
  }

  private fun actionPendingIntent(
    actionId: String,
    gymId: String,
    promptId: String,
    occurredAt: String,
    requestCode: Int,
  ): PendingIntent {
    val intent =
      Intent(reactContext, GymNotificationActionReceiver::class.java).apply {
        this.action = GymNotificationActionReceiver.ACTION
        putExtra("actionId", actionId)
        putExtra("gymId", gymId)
        putExtra("promptId", promptId)
        putExtra("occurredAt", occurredAt)
      }
    val flags =
      PendingIntent.FLAG_UPDATE_CURRENT or
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          PendingIntent.FLAG_MUTABLE
        } else {
          0
        }
    return PendingIntent.getBroadcast(reactContext, requestCode, intent, flags)
  }

  @ReactMethod
  fun showCheckInSuggestion(
    gymId: String,
    gymName: String,
    occurredAt: String,
    promptId: String,
    promise: Promise,
  ) {
    if (!NotificationManagerCompat.from(reactContext).areNotificationsEnabled()) {
      promise.reject(
        "E_NOTIFICATION",
        "Notifications are off. Allow them in system Settings or tap Notifications in the app.",
        RuntimeException("notifications_disabled"),
      )
      return
    }
    val checkIn =
      actionPendingIntent("check_in", gymId, promptId, occurredAt, 1)
    val dismiss =
      actionPendingIntent("dismiss", gymId, promptId, occurredAt, 2)

    val notification =
      NotificationCompat.Builder(reactContext, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentTitle("Near your gym")
        .setContentText(gymName)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .addAction(android.R.drawable.ic_menu_compass, "Check in", checkIn)
        .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss", dismiss)
        .setAutoCancel(true)
        .build()

    NotificationManagerCompat.from(reactContext).notify(promptId.hashCode(), notification)
    promise.resolve(true)
  }

  @ReactMethod
  fun showCheckOutSuggestion(
    gymId: String,
    gymName: String,
    occurredAt: String,
    promptId: String,
    startedAt: String,
    promise: Promise,
  ) {
    if (!NotificationManagerCompat.from(reactContext).areNotificationsEnabled()) {
      promise.reject(
        "E_NOTIFICATION",
        "Notifications are off. Allow them in system Settings or tap Notifications in the app.",
        RuntimeException("notifications_disabled"),
      )
      return
    }
    val checkOut =
      actionPendingIntent("check_out", gymId, promptId, occurredAt, 3)
    val dismiss =
      actionPendingIntent("dismiss", gymId, promptId, occurredAt, 4)

    val notification =
      NotificationCompat.Builder(reactContext, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentTitle("Left the gym?")
        .setContentText("End your visit at $gymName")
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .addAction(android.R.drawable.ic_menu_compass, "Check out", checkOut)
        .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss", dismiss)
        .setAutoCancel(true)
        .build()

    NotificationManagerCompat.from(reactContext).notify(promptId.hashCode(), notification)
    promise.resolve(true)
  }

  @ReactMethod
  fun cancelByTag(tag: String, promise: Promise) {
    NotificationManagerCompat.from(reactContext).cancel(tag.hashCode())
    promise.resolve(true)
  }

  companion object {
    private const val CHANNEL_ID = "assisted_checkin"
  }
}
