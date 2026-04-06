package com.gymvaluemobile.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments

class GymNotificationActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != ACTION) {
      return
    }

    val actionId = intent.getStringExtra("actionId") ?: return
    val gymId = intent.getStringExtra("gymId") ?: ""
    val promptId = intent.getStringExtra("promptId") ?: ""
    val occurredAt = intent.getStringExtra("occurredAt") ?: ""

    val map =
      Arguments.createMap().apply {
        putString("actionId", actionId)
        putString("gymId", gymId)
        putString("promptId", promptId)
        putString("occurredAt", occurredAt)
      }

    val app = context.applicationContext as? ReactApplication ?: return
    val reactContext = app.reactHost?.currentReactContext ?: return
    reactContext.emitDeviceEvent("AssistedNotificationAction", map)
  }

  companion object {
    const val ACTION = "com.gymvaluemobile.NOTIFICATION_ACTION"
  }
}
