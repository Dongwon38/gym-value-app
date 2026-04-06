package com.gymvaluemobile.geofence

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingEvent
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class GymGeofenceReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != ACTION) {
      return
    }

    val event = GeofencingEvent.fromIntent(intent) ?: return
    if (event.hasError()) {
      return
    }

    val transition = event.geofenceTransition
    val type =
      when (transition) {
        Geofence.GEOFENCE_TRANSITION_ENTER -> "enter"
        Geofence.GEOFENCE_TRANSITION_EXIT -> "exit"
        else -> return
      }

    val gymId =
      event.triggeringGeofences?.firstOrNull()?.requestId ?: return
    val occurredAt =
      SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
      }.format(Date())

    val loc = event.triggeringLocation
    val map =
      Arguments.createMap().apply {
        putString("gymId", gymId)
        putString("occurredAt", occurredAt)
        putString("source", "platform")
        putString("type", type)
        if (loc != null) {
          putDouble("latitude", loc.latitude)
          putDouble("longitude", loc.longitude)
        } else {
          putNull("latitude")
          putNull("longitude")
        }
        putNull("radiusMeters")
      }

    val app = context.applicationContext as? ReactApplication ?: return
    val reactContext = app.reactHost?.currentReactContext ?: return
    reactContext.emitDeviceEvent("GeofenceTransition", map)
  }

  companion object {
    const val ACTION = "com.gymvaluemobile.GEOFENCE_TRANSITION"
  }
}
