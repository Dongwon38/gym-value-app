package com.gymvaluemobile.geofence

import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingClient
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices
import kotlin.math.max

class GymGeofenceModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val client: GeofencingClient =
    LocationServices.getGeofencingClient(reactContext.applicationContext)

  override fun getName(): String = "GymGeofence"

  private fun geofencePendingIntent(): PendingIntent {
    val intent =
      Intent(reactContext, GymGeofenceReceiver::class.java).apply {
        action = GymGeofenceReceiver.ACTION
      }
    val flags =
      PendingIntent.FLAG_UPDATE_CURRENT or
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          PendingIntent.FLAG_MUTABLE
        } else {
          0
        }
    return PendingIntent.getBroadcast(reactContext, 0, intent, flags)
  }

  @ReactMethod
  fun addRegion(
    gymId: String,
    gymName: String,
    latitude: Double,
    longitude: Double,
    radiusMeters: Double,
    promise: Promise,
  ) {
    val radius = max(100.0, radiusMeters).toFloat()

    val geofence =
      Geofence.Builder()
        .setRequestId(gymId)
        .setCircularRegion(latitude, longitude, radius)
        .setExpirationDuration(Geofence.NEVER_EXPIRE)
        .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER or Geofence.GEOFENCE_TRANSITION_EXIT)
        .setLoiteringDelay(0)
        .build()

    val request =
      GeofencingRequest.Builder()
        .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
        .addGeofence(geofence)
        .build()

    client.removeGeofences(geofencePendingIntent()).addOnCompleteListener {
      client
        .addGeofences(request, geofencePendingIntent())
        .addOnSuccessListener { promise.resolve(true) }
        .addOnFailureListener { e -> promise.reject("E_GEOFENCE", e.message, e) }
    }
  }

  @ReactMethod
  fun removeRegion(gymId: String, promise: Promise) {
    client
      .removeGeofences(listOf(gymId))
      .addOnSuccessListener { promise.resolve(true) }
      .addOnFailureListener { e -> promise.reject("E_GEOFENCE", e.message, e) }
  }
}
