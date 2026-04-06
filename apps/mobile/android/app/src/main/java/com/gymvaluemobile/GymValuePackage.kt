package com.gymvaluemobile

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.gymvaluemobile.geofence.GymGeofenceModule
import com.gymvaluemobile.notifications.GymAssistedNotificationsModule

class GymValuePackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      GymGeofenceModule(reactContext),
      GymAssistedNotificationsModule(reactContext),
    )

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
